import assert from 'assert';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import customerRoutes from '../routes/customerRoutes.js';
import followUpRoutes from '../routes/followUpRoutes.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { FollowUp } from '../models/FollowUp.js';

const TEST_PORT = 5012;
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/connectdesk_test';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/follow-ups', followUpRoutes);

let server;
let userAToken;
let userBToken;
let customerAId;

function request(method, path, body = null, token = userAToken) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
    };

    const req = http.request(
      `http://127.0.0.1:${TEST_PORT}${path}`,
      { method, headers },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 CONNECTDESK PHASE 9 — FOLLOW-UP CRUD & ISOLATION TEST');
  console.log('====================================================');
  console.log(`Connecting to isolated test database: ${TEST_DB_URI}`);

  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});
  await Customer.deleteMany({});
  await FollowUp.deleteMany({});

  server = app.listen(TEST_PORT);
  console.log(`Test Express server running on port ${TEST_PORT}\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  try {
    let followUpAId;

    // SETUP: Register User A & User B
    await test('SETUP - Register User A & User B and create Customer for User A', async () => {
      const regA = await request('POST', '/api/auth/register', {
        name: 'FollowUp User A',
        email: 'followupa@connectdesk.io',
        password: 'Password123!'
      }, null);
      assert.strictEqual(regA.status, 201);
      userAToken = regA.body.token;

      const regB = await request('POST', '/api/auth/register', {
        name: 'FollowUp User B',
        email: 'followupb@connectdesk.io',
        password: 'Password123!'
      }, null);
      assert.strictEqual(regB.status, 201);
      userBToken = regB.body.token;

      const custRes = await request('POST', '/api/customers', {
        name: 'Acme Corp',
        company: 'Acme Global',
        email: 'contact@acme.com',
        status: 'Lead'
      }, userAToken);
      assert.strictEqual(custRes.status, 201);
      customerAId = custRes.body.data._id;
    });

    // 1. Rejection without JWT Token (401 Unauthorized)
    await test('GET /api/follow-ups - Fails without Authorization header (401)', async () => {
      const res = await request('GET', '/api/follow-ups', null, null);
      assert.strictEqual(res.status, 401);
    });

    // 2. Create Follow-up for User A
    await test('POST /api/follow-ups - User A creates follow-up record (201)', async () => {
      const res = await request('POST', '/api/follow-ups', {
        customer: customerAId,
        title: 'Quarterly Contract Review Call',
        type: 'Call',
        scheduledDate: new Date().toISOString(),
        notes: 'Discuss renewal terms and SLA'
      }, userAToken);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Quarterly Contract Review Call');
      followUpAId = res.body.data._id;
    });

    // 3. Multi-tenant isolation: User B cannot reference User A's customer
    await test('SECURITY - User B cannot create follow-up for User A customer (400 Bad Request)', async () => {
      const res = await request('POST', '/api/follow-ups', {
        customer: customerAId,
        title: 'Unauthorized Follow-up',
        type: 'Call',
        scheduledDate: new Date().toISOString()
      }, userBToken);
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Associated customer record does not exist in your workspace/);
    });

    // 4. Multi-tenant isolation: User B cannot view or list User A follow-ups
    await test('SECURITY - User B cannot view or list User A follow-up (404 / Isolated list)', async () => {
      const getRes = await request('GET', `/api/follow-ups/${followUpAId}`, null, userBToken);
      assert.strictEqual(getRes.status, 404);

      const listRes = await request('GET', '/api/follow-ups', null, userBToken);
      assert.strictEqual(listRes.status, 200);
      assert.strictEqual(listRes.body.data.length, 0);
    });

    // 5. Pagination limit ceiling check (capped to 100 max)
    await test('SECURITY - Pagination limit is capped at 100 max', async () => {
      const res = await request('GET', '/api/follow-ups?limit=50000', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.limit, 100);
    });

    // 6. Update Follow-up Completion Status
    await test('PUT /api/follow-ups/:id - User A updates completion status (200)', async () => {
      const res = await request('PUT', `/api/follow-ups/${followUpAId}`, { completed: true }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.completed, true);
    });

    // 7. Delete Follow-up
    await test('DELETE /api/follow-ups/:id - User A deletes follow-up record (200)', async () => {
      const res = await request('DELETE', `/api/follow-ups/${followUpAId}`, null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

  } finally {
    await User.deleteMany({});
    await Customer.deleteMany({});
    await FollowUp.deleteMany({});
    await mongoose.disconnect();
    server.close();

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
