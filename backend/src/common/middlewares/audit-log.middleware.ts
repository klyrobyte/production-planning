import { Request, Response, NextFunction } from 'express';
import { pool } from '../../config/database';
import { auditLogEmitter } from '../events/audit-log.emitter';

// Paths excluded from audit logging — too noisy or non-user-driven
const EXCLUDED_PREFIXES = ['/health', '/api/docs'];

/**
 * Global audit log middleware.
 *
 * Attaches a `res.on('finish')` listener before the request is processed.
 * This means the status code captured is the FINAL status sent to the client
 * (after error-handler middleware has run), not a preliminary value.
 *
 * The DB insert is fire-and-forget — errors are swallowed so that a log
 * write failure NEVER crashes the server or adds latency to the response.
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const endpoint = req.originalUrl.split('?')[0];

  // Skip excluded paths immediately
  const shouldSkip = EXCLUDED_PREFIXES.some((prefix) => endpoint.startsWith(prefix));
  if (shouldSkip) {
    next();
    return;
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const responseMs = Date.now() - startTime;

    // req.user is populated by requireAuth middleware — may be undefined for
    // unauthenticated requests (e.g. failed login attempts)
    const username = (req as any).user?.username ?? null;
    const role     = (req as any).user?.role     ?? null;

    // Prefer X-Forwarded-For (reverse proxy) over req.ip
    const rawIp     = (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip ?? 'unknown';
    const ipAddress = rawIp.split(',')[0].trim();

    // Fire-and-forget — do NOT await, do NOT let errors propagate
    pool
      .query(
        `INSERT INTO global_logs
           (username, role, method, endpoint, ip_address, status_code, response_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, timestamp, username, role, method, endpoint, ip_address, status_code, response_ms`,
        [username, role, req.method, endpoint, ipAddress, res.statusCode, responseMs],
      )
      .then((result) => {
        const newLog = result.rows[0];
        if (newLog) {
          auditLogEmitter.emit('new-log', newLog);
        }
      })
      .catch((err: unknown) => {
        // Log to console only — never throw
        console.error('[AuditLog] Failed to write log entry:', err);
      });
  });

  next();
}
