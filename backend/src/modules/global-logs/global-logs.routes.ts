import { Router } from 'express';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';
import { handleGetLogs, handleDeleteLogs, handleStreamLogs } from './global-logs.controller';

export const globalLogsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: GlobalLogs
 *   description: Audit trail semua API request — akses eksklusif super-admin
 */

/**
 * @swagger
 * /api/global-logs/stream:
 *   get:
 *     summary: Stream audit logs real-time menggunakan Server-Sent Events (SSE)
 *     tags: [GlobalLogs]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Event-stream channel established successfully
 *       403:
 *         description: Bukan super-admin
 */
globalLogsRoutes.get('/stream', requireAuth, requireRole('super-admin'), handleStreamLogs);

/**
 * @swagger
 * /api/global-logs:
 *   get:
 *     summary: List semua log request (dengan filter & pagination)
 *     tags: [GlobalLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *         description: Filter partial match (case-insensitive)
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [GET, POST, PUT, DELETE, PATCH] }
 *       - in: query
 *         name: status_code
 *         schema: { type: integer }
 *       - in: query
 *         name: date_from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: date_to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endpoint
 *         schema: { type: string }
 *         description: Filter partial match endpoint path
 *     responses:
 *       200:
 *         description: Daftar log dengan metadata pagination
 *       403:
 *         description: Bukan super-admin
 */
globalLogsRoutes.get('/', requireAuth, requireRole('super-admin'), handleGetLogs);

/**
 * @swagger
 * /api/global-logs:
 *   delete:
 *     summary: Hapus SEMUA log (irreversible)
 *     tags: [GlobalLogs]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Semua log berhasil dihapus
 *       403:
 *         description: Bukan super-admin
 */
globalLogsRoutes.delete('/', requireAuth, requireRole('super-admin'), handleDeleteLogs);
