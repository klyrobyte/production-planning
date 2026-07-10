import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../../config/redis';
import { AppError } from '../errors/AppError';

// Returns an Express middleware that rate-limits by IP using Redis
// points = max requests, duration = window in seconds
export const createRateLimiter = (keyPrefix: string, points = 5, duration = 60) => {
  const limiter = new RateLimiterRedis({ storeClient: redis, keyPrefix, points, duration });

  return async (req: Request, _res: Response, next: NextFunction) => {
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
    try {
      await limiter.consume(ip);
      next();
    } catch (err: any) {
      const secs = Math.ceil((err.msBeforeNextReset ?? 60_000) / 1000);
      next(new AppError(429, 'RATE_LIMIT_EXCEEDED', `Too many attempts. Try again in ${secs}s.`));
    }
  };
};
