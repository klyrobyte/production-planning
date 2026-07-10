import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Auth Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    // Ensure database connection
    await pool.query('SELECT 1');
    // Ensure redis connection
    await redis.connect();
  });

  afterAll(async () => {
    // Close connections so testing process can terminate
    await pool.end();
    await redis.disconnect();
  });

  it('POST /api/auth/login - should fail with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login - should succeed with valid credentials and set cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.username).toBe('admin');
    expect(res.body.data.role).toBe('super-admin');

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
      .send({ username: 'admin', password: 'admin123' });

    const cookie = loginRes.headers['set-cookie'];

    // 2. Make authenticated request to /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.status).toBe('ok');
    expect(meRes.body.data.username).toBe('admin');
    expect(meRes.body.data.role).toBe('super-admin');
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
      .send({ username: 'admin', password: 'admin123' });

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
