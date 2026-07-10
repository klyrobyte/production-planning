import { Router } from 'express';
import { labelCountersController } from './label-counters.controller';
import { requireAuth } from '../rbac/rbac.middleware';

export const labelCountersRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Label Counters, description: Manajemen counter serial print label Kanban harian }]
 * /api/label-counters/{date_key}:
 *   get:
 *     tags: [Label Counters]
 *     summary: Counter untuk tanggal tertentu
 *     parameters:
 *       - in: path
 *         name: date_key
 *         required: true
 *         schema: { type: string, example: '2026-07-10' }
 *         description: Format YYYY-MM-DD
 *     responses:
 *       200: { description: Success }
 * /api/label-counters:
 *   post:
 *     tags: [Label Counters]
 *     summary: Increment counter untuk tanggal tertentu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date_key]
 *             properties:
 *               date_key: { type: string, example: '2026-07-10' }
 *               amount: { type: number, default: 1 }
 *     responses:
 *       200: { description: Success }
 */
labelCountersRoutes.get('/:date_key', requireAuth, labelCountersController.getByDate);
labelCountersRoutes.post('/',         requireAuth, labelCountersController.increment);
