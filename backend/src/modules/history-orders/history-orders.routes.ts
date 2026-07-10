import { Router } from 'express';
import { historyOrdersController } from './history-orders.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const historyOrdersRoutes = Router();

/**
 * @swagger
 * tags: [{ name: History Orders, description: Pencatatan history data order customer (bulk upload/snapshot) }]
 * /api/history-orders:
 *   get:
 *     tags: [History Orders]
 *     summary: Semua history orders (planner)
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [History Orders]
 *     summary: Bulk insert snapshot order (planner)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [part_number, quantity, date]
 *               properties:
 *                 part_number: { type: string }
 *                 quantity: { type: number }
 *                 date: { type: string, format: date }
 *     responses:
 *       201: { description: Success }
 */
historyOrdersRoutes.get('/',  requireAuth, requireRole('planner'), historyOrdersController.getAll);
historyOrdersRoutes.post('/', requireAuth, requireRole('planner'), historyOrdersController.bulkInsert);
