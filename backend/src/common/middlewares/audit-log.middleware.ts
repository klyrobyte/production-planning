import { Request, Response, NextFunction } from 'express';
import { saveLog } from '../../modules/global-logs/global-logs.repository';
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
 * The Redis insert is fire-and-forget — errors are swallowed so that a log
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

    // Save to Redis (LPUSH + LTRIM) — do NOT await, do NOT let errors propagate
    saveLog({
      username,
      role,
      method: req.method,
      endpoint,
      ip_address: ipAddress,
      status_code: res.statusCode,
      response_ms: responseMs,
    })
      .then((newLog) => {
        auditLogEmitter.emit('new-log', newLog);
      })
      .catch((err: unknown) => {
        console.error('[AuditLog] Failed to write log entry to Redis:', err);
      });
  });

  next();
}
