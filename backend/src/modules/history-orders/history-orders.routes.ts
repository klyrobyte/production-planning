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
 *               required: [part_number]
 *               properties:
 *                 sebango: { type: string }
 *                 part_number: { type: string }
 *                 part_name: { type: string }
 *                 month_n_volume: { type: number }
 *                 month_n1_volume: { type: number }
 *                 month_n2_volume: { type: number }
 *                 month_n3_volume: { type: number }
 *                 daily_requirement_n: { type: number }
 *                 daily_requirement_n1: { type: number }
 *                 daily_requirement_n2: { type: number }
 *                 daily_requirement_n3: { type: number }
 *     responses:
 *       201: { description: Success }
 */
historyOrdersRoutes.get('/',  requireAuth, requireRole('planner'), historyOrdersController.getAll);
historyOrdersRoutes.post('/', requireAuth, requireRole('planner'), historyOrdersController.bulkInsert);
