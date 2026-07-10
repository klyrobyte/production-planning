import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Factories Integration Tests', () => {
  const app = createApp();
  let adminCookie: any;
  let plannerCookie: any;
  let createdFactoryId: string;

  beforeAll(async () => {
    await pool.query('SELECT 1');
    await redis.connect();

    // Setup sessions
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminCookie = adminLogin.headers['set-cookie'];

    const plannerLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'planner', password: 'planner123' });
    plannerCookie = plannerLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    // Cleanup any created factory just in case delete test failed
    if (createdFactoryId) {
      await pool.query('DELETE FROM factories WHERE id = $1', [createdFactoryId]);
    }
    await pool.end();
    await redis.disconnect();
  });

  it('GET /api/factories - should block unauthenticated request', async () => {
    const res = await request(app).get('/api/factories');
    expect(res.status).toBe(401);
  });

  it('GET /api/factories - should return factories list when authenticated', async () => {
    const res = await request(app)
      .get('/api/factories')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/factories - should block planner from creating factory', async () => {
    const res = await request(app)
      .post('/api/factories')
      .set('Cookie', plannerCookie)
      .send({ code: 'TEST_F', name: 'Test Factory' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('POST /api/factories - should allow super-admin to create factory', async () => {
    const res = await request(app)
      .post('/api/factories')
      .set('Cookie', adminCookie)
      .send({ code: 'TEST_F', name: 'Test Factory', location: 'Test Location' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.code).toBe('TEST_F');

    createdFactoryId = res.body.data.id;
  });

  it('PUT /api/factories/:id - should update factory details', async () => {
    const res = await request(app)
      .put(`/api/factories/${createdFactoryId}`)
      .set('Cookie', adminCookie)
      .send({ code: 'TEST_F_UPDATED', name: 'Test Factory Updated' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.code).toBe('TEST_F_UPDATED');
    expect(res.body.data.name).toBe('Test Factory Updated');
  });

  it('DELETE /api/factories/:id - should delete the created factory', async () => {
    const res = await request(app)
      .delete(`/api/factories/${createdFactoryId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');

    // Confirm it is gone
    const check = await pool.query('SELECT * FROM factories WHERE id = $1', [createdFactoryId]);
    expect(check.rows.length).toBe(0);

    // Reset the cleanup reference
    createdFactoryId = '';
  });
});
