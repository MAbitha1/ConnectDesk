import assert from 'assert';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import customerRoutes from '../routes/customerRoutes.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';

const TEST_PORT = 5009;
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/connectdesk_test';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);

let server;
let userAToken;
let userBToken;

function request(method, path, body = null, token = userAToken) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      `http://127.0.0.1:${TEST_PORT}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
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
  console.log('🧪 CONNECTDESK PHASE 9 — CUSTOMER CRUD & ISOLATION TEST');
  console.log('====================================================');
  console.log(`Connecting to isolated test database: ${TEST_DB_URI}`);

  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});
  await Customer.deleteMany({});

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
    let customerAId;

    // SETUP: Register User A & User B
    await test('SETUP - Register User A and User B to test multi-tenant isolation', async () => {
      const regA = await request('POST', '/api/auth/register', {
        name: 'User A',
        email: 'usera@connectdesk.io',
        password: 'Password123!'
      }, null);
      assert.strictEqual(regA.status, 201);
      userAToken = regA.body.token;

      const regB = await request('POST', '/api/auth/register', {
        name: 'User B',
        email: 'userb@connectdesk.io',
        password: 'Password123!'
      }, null);
      assert.strictEqual(regB.status, 201);
      userBToken = regB.body.token;
    });

    // 1. Security Check: Rejection without token
    await test('GET /api/customers - Fails without Authorization header (401 Unauthorized)', async () => {
      const res = await request('GET', '/api/customers', null, null);
      assert.strictEqual(res.status, 401);
    });

    // 2. POST /api/customers — User A creates customer
    await test('POST /api/customers - User A creates customer successfully (201)', async () => {
      const res = await request('POST', '/api/customers', {
        name: 'Alice Johnson',
        company: 'Quantum Tech',
        email: 'alice@quantumtech.com',
        phone: '+1 (555) 111-2222',
        status: 'Lead',
        dealValue: 25000,
        notes: 'Initial test lead'
      }, userAToken);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.name, 'Alice Johnson');
      customerAId = res.body.data._id;
    });

    // 3. Multi-tenant isolation: User B cannot view User A's customer
    await test('SECURITY - User B cannot view or list User A customer (404 / Isolated list)', async () => {
      const getRes = await request('GET', `/api/customers/${customerAId}`, null, userBToken);
      assert.strictEqual(getRes.status, 404, 'User B must NOT be able to view User A customer by ID');

      const listRes = await request('GET', '/api/customers', null, userBToken);
      assert.strictEqual(listRes.status, 200);
      assert.strictEqual(listRes.body.data.length, 0, 'User B list must be empty');
    });

    // 4. Multi-tenant isolation: User B cannot modify or delete User A's customer
    await test('SECURITY - User B cannot update or delete User A customer (404)', async () => {
      const putRes = await request('PUT', `/api/customers/${customerAId}`, { company: 'Hacked Inc' }, userBToken);
      assert.strictEqual(putRes.status, 404);

      const delRes = await request('DELETE', `/api/customers/${customerAId}`, null, userBToken);
      assert.strictEqual(delRes.status, 404);
    });

    // 5. Validation failure tests
    await test('POST /api/customers - Validation checks (missing company / bad email / duplicates)', async () => {
      const res1 = await request('POST', '/api/customers', { name: 'No Comp', email: 'nocomp@test.com' }, userAToken);
      assert.strictEqual(res1.status, 400);

      const res2 = await request('POST', '/api/customers', { name: 'Bob', company: 'Acme', email: 'notanemail' }, userAToken);
      assert.strictEqual(res2.status, 400);

      const res3 = await request('POST', '/api/customers', { name: 'Dup Alice', company: 'Acme', email: 'alice@quantumtech.com' }, userAToken);
      assert.strictEqual(res3.status, 409);
    });

    // 6. ReDoS / Regex Injection Sanitization Check
    await test('SECURITY - Regex search escaping prevents ReDoS and injection', async () => {
      const res = await request('GET', '/api/customers?search=.*+?^${}()|[\\]\\\\', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    // 7. PUT /api/customers/:id — Update Customer owned by User A
    await test('PUT /api/customers/:id - User A updates own customer record (200)', async () => {
      const res = await request('PUT', `/api/customers/${customerAId}`, {
        company: 'Quantum Tech Global',
        status: 'Proposal',
        dealValue: 35000
      }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.company, 'Quantum Tech Global');
    });

    // 8. DELETE /api/customers/:id — Delete Customer owned by User A
    await test('DELETE /api/customers/:id - User A deletes own customer record (200)', async () => {
      const res = await request('DELETE', `/api/customers/${customerAId}`, null, userAToken);
      assert.strictEqual(res.status, 200);

      const getRes = await request('GET', `/api/customers/${customerAId}`, null, userAToken);
      assert.strictEqual(getRes.status, 404);
    });

  } finally {
    await User.deleteMany({});
    await Customer.deleteMany({});
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
