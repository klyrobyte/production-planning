import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

// Global error handler — must be registered last in app.ts
export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  // Known, expected errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', code: err.code, message: err.message });
    return;
  }

  // PostgreSQL unique constraint violation
  if ((err as any).code === '23505') {
    res.status(409).json({ status: 'error', code: 'CONFLICT', message: 'Resource already exists.' });
    return;
  }

  // Unexpected errors — log server-side, hide details from client
  console.error('[Unhandled Error]', err);
  res.status(500).json({ status: 'error', code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
};
