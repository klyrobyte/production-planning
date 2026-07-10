import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Auth Integration Tests', () => {
  const app = createApp();
  
  // Dynamic test data variables
  const testRoleName = 'test-auth-role';
  const testUsername = `testuser_auth_${Date.now()}`;
  const testPassword = 'testpassword123';
  const testName = 'Test Auth User';
  let testUserId: string;

  beforeAll(async () => {
    // Connect database & Redis
    await pool.query('SELECT 1');
    await redis.connect();

    // 1. Create a dynamic test role
    await pool.query(
      'INSERT INTO roles (id, name, display_name) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT (name) DO NOTHING',
      [testRoleName, 'Test Auth Role']
    );

    // 2. Create a dynamic test user with hashed password
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const userResult = await pool.query(
      'INSERT INTO users (uid, username, role, name, password_hash) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id',
      [testUsername, testRoleName, testName, passwordHash]
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup dynamic test data from database
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    await pool.query('DELETE FROM roles WHERE name = $1', [testRoleName]);

    // Close connections so testing process can terminate
    await pool.end();
    await redis.disconnect();
  });

  it('POST /api/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login - should succeed with valid credentials and set cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBe('Login berhasil.');

    // Verify sugity_session cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
    const hasSessionCookie = cookiesArray.some((cookie: string) => cookie && cookie.startsWith('sugity_session='));
    expect(hasSessionCookie).toBe(true);
  });

  it('GET /api/auth/me - should return current session when authenticated', async () => {
    // 1. Login first to get cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: testPassword });

    const cookie = loginRes.headers['set-cookie'];

    // 2. Make authenticated request to /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.status).toBe('ok');
    expect(meRes.body.data.username).toBe(testUsername);
    expect(meRes.body.data.role).toBe(testRoleName);
  });

  it('GET /api/auth/me - should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/logout - should clear session cookie', async () => {
    // 1. Login first
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: testUsername, password: testPassword });

    const cookie = loginRes.headers['set-cookie'];

    // 2. Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    
    // Check cookie is cleared
    const cookies = logoutRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
    const isCleared = cookiesArray.some((cookie: string) => cookie && (cookie.includes('Max-Age=0') || cookie.includes('Expires=')));
    expect(isCleared).toBe(true);
  });
});
