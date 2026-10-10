import assert from 'assert';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from '../routes/authRoutes.js';
import { User } from '../models/User.js';

const TEST_PORT = 5011;
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/connectdesk_test';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

let server;

function request(method, path, body = null, token = null) {
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
  console.log('🧪 CONNECTDESK PHASE 10 — AUTHENTICATION & PROFILE TEST SUITE');
  console.log('====================================================');
  console.log(`Connecting to isolated test database: ${TEST_DB_URI}`);

  await mongoose.connect(TEST_DB_URI);
  await User.deleteMany({});

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
    let authToken;

    // 1. POST /api/auth/register — Successful registration
    await test('POST /api/auth/register - Registers new user successfully (201)', async () => {
      const res = await request('POST', '/api/auth/register', {
        name: 'Jane Doe',
        email: 'jane@connectdesk.io',
        password: 'Password123!'
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.name, 'Jane Doe');
      assert.strictEqual(res.body.user.email, 'jane@connectdesk.io');
      assert.ok(res.body.token, 'Token should be returned');
      authToken = res.body.token;

      const dbUser = await User.findOne({ email: 'jane@connectdesk.io' }).select('+password');
      assert.notStrictEqual(dbUser.password, 'Password123!', 'Plaintext password must NOT be stored');
      assert.ok(dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$'), 'Password must be hashed with bcrypt');
    });

    // 2. Duplicate Registration
    await test('POST /api/auth/register - Fails on duplicate email (409 Conflict)', async () => {
      const res = await request('POST', '/api/auth/register', {
        name: 'Jane Duplicate',
        email: 'JANE@CONNECTDESK.IO',
        password: 'Password123!'
      });
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
    });

    // 3. Validation Failure
    await test('POST /api/auth/register - Fails on short password or invalid email (400)', async () => {
      const res1 = await request('POST', '/api/auth/register', {
        name: 'Short Pass',
        email: 'short@test.com',
        password: '123'
      });
      assert.strictEqual(res1.status, 400);

      const res2 = await request('POST', '/api/auth/register', {
        name: 'Bad Email',
        email: 'notanemail',
        password: 'Password123!'
      });
      assert.strictEqual(res2.status, 400);
    });

    // 4. POST /api/auth/login — Successful Login
    await test('POST /api/auth/login - Logs in user with correct credentials (200)', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'jane@connectdesk.io',
        password: 'Password123!'
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.name, 'Jane Doe');
      assert.ok(res.body.token);
    });

    // 5. POST /api/auth/login — Wrong Password
    await test('POST /api/auth/login - Fails on invalid password (401 Unauthorized)', async () => {
      const res = await request('POST', '/api/auth/login', {
        email: 'jane@connectdesk.io',
        password: 'WrongPassword'
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    // 6. GET /api/auth/me — Protected Route with Token
    await test('GET /api/auth/me - Returns user profile when valid token provided (200)', async () => {
      const res = await request('GET', '/api/auth/me', null, authToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, 'jane@connectdesk.io');
    });

    // 7. PUT /api/auth/profile — Update user profile details
    await test('PUT /api/auth/profile - Updates user name and email (200)', async () => {
      const res = await request('PUT', '/api/auth/profile', {
        name: 'Jane Smith Updated',
        email: 'janesmith@connectdesk.io'
      }, authToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.name, 'Jane Smith Updated');
      assert.strictEqual(res.body.user.email, 'janesmith@connectdesk.io');
      authToken = res.body.token; // Update token
    });

    // 8. PUT /api/auth/profile — Collision Check
    await test('PUT /api/auth/profile - Fails on email collision with another user (409 Conflict)', async () => {
      // Register second user
      const user2 = await request('POST', '/api/auth/register', {
        name: 'User Two',
        email: 'usertwo@connectdesk.io',
        password: 'Password123!'
      });
      assert.strictEqual(user2.status, 201);

      // Try updating Jane's email to User Two's email
      const res = await request('PUT', '/api/auth/profile', {
        name: 'Jane Smith',
        email: 'usertwo@connectdesk.io'
      }, authToken);
      assert.strictEqual(res.status, 409);
      assert.match(res.body.error, /Another account is already using this email/);
    });

    // 9. Security Audit: Malformed / Invalid JWT Token Rejection
    await test('GET /api/auth/me - Rejects malformed and tampered tokens (401 Unauthorized)', async () => {
      const resMalformed = await request('GET', '/api/auth/me', null, 'invalid.jwt.token');
      assert.strictEqual(resMalformed.status, 401);
      assert.strictEqual(resMalformed.body.success, false);

      const resTampered = await request('GET', '/api/auth/me', null, authToken + 'tampered');
      assert.strictEqual(resTampered.status, 401);
    });

  } finally {
    await User.deleteMany({});
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
