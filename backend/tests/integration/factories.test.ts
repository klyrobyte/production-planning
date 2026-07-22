import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Factories Integration Tests', () => {
  const app = createApp();

  // Dynamic test data variables
  const testAdminUsername = `test_admin_fac_${Date.now()}`;
  const testPlannerUsername = `test_plan_fac_${Date.now()}`;
  const testPassword = 'testpassword123';
  
  let testAdminUserId: string;
  let testPlannerUserId: string;
  let adminCookie: any;
  let plannerCookie: any;
  let createdFactoryId: string;

  beforeAll(async () => {
    await pool.query('SELECT 1');
    await redis.connect();

    // 1. Create dynamic super-admin user in DB
    const adminPasswordHash = await bcrypt.hash(testPassword, 10);
    const adminResult = await pool.query(
      'INSERT INTO users (uid, username, role, name, password_hash) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id',
      [testAdminUsername, 'super-admin', 'Test Admin Fac', adminPasswordHash]
    );
    testAdminUserId = adminResult.rows[0].id;

    // 2. Create dynamic planner user in DB
    const plannerPasswordHash = await bcrypt.hash(testPassword, 10);
    const plannerResult = await pool.query(
      'INSERT INTO users (uid, username, role, name, password_hash) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id',
      [testPlannerUsername, 'planner', 'Test Planner Fac', plannerPasswordHash]
    );
    testPlannerUserId = plannerResult.rows[0].id;

    // 3. Setup sessions by logging in dynamically
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: testAdminUsername, password: testPassword });
    adminCookie = adminLogin.headers['set-cookie'];

    const plannerLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: testPlannerUsername, password: testPassword });
    plannerCookie = plannerLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    // Cleanup any created factory
    if (createdFactoryId) {
      await pool.query('DELETE FROM factories WHERE id = $1', [createdFactoryId]);
    }
    
    // Cleanup dynamic test users
    if (testAdminUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testAdminUserId]);
    }
    if (testPlannerUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testPlannerUserId]);
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
