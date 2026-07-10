import Redis from 'ioredis';
import { env } from './env';

// Singleton Redis client — used by rate limiter and RBAC role cache
export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => console.error('[Redis Error]', err.message));
