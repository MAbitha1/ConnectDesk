import assert from 'assert';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import customerRoutes from '../routes/customerRoutes.js';
import taskRoutes from '../routes/taskRoutes.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Task } from '../models/Task.js';

const TEST_PORT = 5010;
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/connectdesk_test';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);

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
  console.log('🧪 CONNECTDESK PHASE 9 — TASK CRUD & ISOLATION TEST');
  console.log('====================================================');
  console.log(`Connecting to isolated test database: ${TEST_DB_URI}`);

  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});
  await Task.deleteMany({});
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
    let taskAId;

    // SETUP: Register User A & User B
    await test('SETUP - Register User A and User B and create Customer for User A', async () => {
      const regA = await request('POST', '/api/auth/register', {
        name: 'Task User A',
        email: 'taska@connectdesk.io',
        password: 'Password123!'
      }, null);
      assert.strictEqual(regA.status, 201);
      userAToken = regA.body.token;

      const regB = await request('POST', '/api/auth/register', {
        name: 'Task User B',
        email: 'taskb@connectdesk.io',
        password: 'Password123!'
      }, null);
      assert.strictEqual(regB.status, 201);
      userBToken = regB.body.token;

      const custRes = await request('POST', '/api/customers', {
        name: 'Task Ref Customer',
        company: 'Apex Dynamics',
        email: 'taskref@apexdynamics.com'
      }, userAToken);
      assert.strictEqual(custRes.status, 201);
      customerAId = custRes.body.data._id;
    });

    // 1. Security Check: Rejection without token
    await test('GET /api/tasks - Fails without Authorization header (401 Unauthorized)', async () => {
      const res = await request('GET', '/api/tasks', null, null);
      assert.strictEqual(res.status, 401);
    });

    // 2. POST /api/tasks — User A creates task
    await test('POST /api/tasks - User A creates task successfully with customer ref (201)', async () => {
      const res = await request('POST', '/api/tasks', {
        title: 'Review Enterprise SLA Draft',
        customer: customerAId,
        priority: 'High',
        category: 'Legal',
        status: 'Pending'
      }, userAToken);
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Review Enterprise SLA Draft');
      taskAId = res.body.data._id;
    });

    // 3. Multi-tenant isolation: User B cannot attach task to User A's customer
    await test('SECURITY - User B cannot create task referencing User A customer (400 Bad Request)', async () => {
      const res = await request('POST', '/api/tasks', {
        title: 'Unauthorized Task',
        customer: customerAId
      }, userBToken);
      assert.strictEqual(res.status, 400);
      assert.match(res.body.error, /Referenced customer does not exist in your workspace/);
    });

    // 4. Multi-tenant isolation: User B cannot view User A's task
    await test('SECURITY - User B cannot view or list User A task (404 / Isolated list)', async () => {
      const getRes = await request('GET', `/api/tasks/${taskAId}`, null, userBToken);
      assert.strictEqual(getRes.status, 404);

      const listRes = await request('GET', '/api/tasks', null, userBToken);
      assert.strictEqual(listRes.status, 200);
      assert.strictEqual(listRes.body.data.length, 0);
    });

    // 5. Validation failure tests
    await test('POST /api/tasks - Fails on missing title or customer (400)', async () => {
      const res1 = await request('POST', '/api/tasks', { customer: customerAId }, userAToken);
      assert.strictEqual(res1.status, 400);

      const res2 = await request('POST', '/api/tasks', { title: 'Orphan Task' }, userAToken);
      assert.strictEqual(res2.status, 400);
    });

    // 6. GET /api/tasks — Search and filter for User A
    await test('GET /api/tasks?search=SLA - Searches task by title for User A (200)', async () => {
      const res = await request('GET', '/api/tasks?search=SLA', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 1);
    });

    // 7. PUT /api/tasks/:id — User A updates task
    await test('PUT /api/tasks/:id - User A updates task status (200)', async () => {
      const res = await request('PUT', `/api/tasks/${taskAId}`, { status: 'Completed' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.status, 'Completed');
    });

    // 8. DELETE /api/tasks/:id — User A deletes task
    await test('DELETE /api/tasks/:id - User A deletes task (200)', async () => {
      const res = await request('DELETE', `/api/tasks/${taskAId}`, null, userAToken);
      assert.strictEqual(res.status, 200);

      const getRes = await request('GET', `/api/tasks/${taskAId}`, null, userAToken);
      assert.strictEqual(getRes.status, 404);
    });

  } finally {
    await User.deleteMany({});
    await Task.deleteMany({});
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
