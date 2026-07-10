import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/database';
import { redis } from '../../src/config/redis';

describe('Rate Limiting Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await pool.query('SELECT 1');
    await redis.connect();
    
    // Clear any existing rate limit keys for 'login' to ensure test isolation
    const keys = await redis.keys('login:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  afterAll(async () => {
    // Cleanup rate limit keys created during test
    const keys = await redis.keys('login:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    await pool.end();
    await redis.disconnect();
  });

  it('should allow up to 5 login requests and block the 6th with 429 when rate limit testing is enabled', async () => {
    // 1. Send 5 requests — should return validation errors (400) or other normal responses, not 429
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .set('x-test-rate-limit', 'true')
        .send({ username: '', password: '' }); // Bad request structure

      expect(res.status).toBe(400); // Validation error
      expect(res.body.code).not.toBe('RATE_LIMIT_EXCEEDED');
    }

    // 2. The 6th request should be blocked by the rate limiter
    const resBlocked = await request(app)
      .post('/api/auth/login')
      .set('x-test-rate-limit', 'true')
      .send({ username: '', password: '' });

    expect(resBlocked.status).toBe(429);
    expect(resBlocked.body.status).toBe('error');
    expect(resBlocked.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(resBlocked.body.message).toContain('Too many attempts');

    // 3. A request WITHOUT the 'x-test-rate-limit' header should bypass it even after being blocked
    const resBypassed = await request(app)
      .post('/api/auth/login')
      .send({ username: '', password: '' });

    expect(resBypassed.status).toBe(400); // Back to standard 400 validation error
    expect(resBypassed.body.code).not.toBe('RATE_LIMIT_EXCEEDED');
  });
});
