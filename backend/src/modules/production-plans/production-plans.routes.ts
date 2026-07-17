import { Router } from 'express';
import { createProductionPlansController } from './production-plans.controller';
import { requireAuth } from '../rbac/rbac.middleware';

export const createProductionPlansRoutes = () => {
  const router = Router();
  const ctrl = createProductionPlansController();

  /**
   * @swagger
   * tags: [{ name: Production Plans, description: Manajemen jadwal/rencana produksi harian }]
   * /api/production-plans:
   *   get:
   *     tags: [Production Plans]
   *     summary: Semua plans
   *     responses:
   *       200: { description: Success }
   *   post:
   *     tags: [Production Plans]
   *     summary: Upsert plan + broadcast Socket.io
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [machine_id, date, shift]
   *             properties:
   *               id: { type: string, description: 'Optional UUID untuk update' }
   *               machine_id: { type: string }
   *               part_number: { type: string }
   *               date: { type: string, format: date }
   *               shift: { type: string }
   *               target_qty: { type: number }
   *               status: { type: string }
   *     responses:
   *       200: { description: Success }
   * /api/production-plans/{id}:
   *   get:
   *     tags: [Production Plans]
   *     summary: Satu plan by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Success }
   */
  router.get('/',    requireAuth, ctrl.getAll);
  router.get('/:id', requireAuth, ctrl.getById);
  router.post('/',   requireAuth, ctrl.upsert);

  return router;
};
