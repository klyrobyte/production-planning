import { Request, Response, NextFunction } from 'express';
import { getLogs, clearLogs } from './global-logs.service';

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
