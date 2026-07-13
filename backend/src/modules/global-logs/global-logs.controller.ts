import { Request, Response, NextFunction } from 'express';
import { getLogs, clearLogs } from './global-logs.service';
import { auditLogEmitter } from '../../common/events/audit-log.emitter';

/**
 * GET /api/global-logs
 * Query params: page, limit, username, method, status_code, date_from, date_to, endpoint
 */
export async function handleGetLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getLogs(req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/global-logs
 * Clears ALL log entries. Irreversible.
 */
export async function handleDeleteLogs(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clearLogs();
    res.json({ status: 'ok', message: 'Semua log berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/global-logs/stream
 * Server-Sent Events (SSE) endpoint to stream new audit logs to super-admin clients
 */
export function handleStreamLogs(req: Request, res: Response, next: NextFunction): void {
  try {
    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Flush headers to establish the SSE channel immediately
    res.flushHeaders();

    // Send initial greeting/comment
    res.write(': sse-connected\n\n');

    // Subscribe to new logs from the emitter
    const onNewLog = (log: any) => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    };

    auditLogEmitter.on('new-log', onNewLog);

    // Keep connection alive with periodic heartbeat pings (every 30 seconds)
    const keepAliveInterval = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    // Clean up connections and listeners on client socket close
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      auditLogEmitter.off('new-log', onNewLog);
    });
  } catch (err) {
    next(err);
  }
}
