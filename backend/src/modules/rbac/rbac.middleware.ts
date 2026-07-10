import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt.util';
import { redis } from '../../config/redis';
import { pool } from '../../config/database';
import { AppError } from '../../common/errors/AppError';
import { env } from '../../config/env';

const ROLES_CACHE_KEY = 'app:valid_roles';
const ROLES_CACHE_TTL = 60; // seconds

// Fetches valid role names from Redis cache, falling back to DB
const getValidRoles = async (): Promise<string[]> => {
  const cached = await redis.get(ROLES_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const { rows } = await pool.query('SELECT name FROM roles');
  const roles = rows.map((r) => r.name as string);
  await redis.set(ROLES_CACHE_KEY, JSON.stringify(roles), 'EX', ROLES_CACHE_TTL);
  return roles;
};

// Verifies JWT from cookie and attaches user to req.user
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[env.cookieName];
  if (!token) { next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.')); return; }

  const payload = verifyToken(token);
  if (!payload) { next(new AppError(401, 'UNAUTHORIZED', 'Session expired or invalid.')); return; }

  req.user = payload;
  next();
};

// Restricts access to users whose role is in the allowed list
// Usage: requireRole('super-admin', 'planner')
export const requireRole = (...allowedRoles: string[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) { next(new AppError(401, 'UNAUTHORIZED', 'Authentication required.')); return; }

    const validRoles = await getValidRoles();
    const userRole = req.user.role;

    if (!validRoles.includes(userRole)) {
      next(new AppError(403, 'FORBIDDEN', 'Your role is no longer valid.'));
      return;
    }
    if (!allowedRoles.includes(userRole)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
      return;
    }
    next();
  };
