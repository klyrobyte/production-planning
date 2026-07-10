import { Router } from 'express';
import { leadersController } from './leaders.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const leadersRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Leaders, description: Manajemen data leader & verifikasi PIN }]
 * /api/leaders:
 *   get:
 *     tags: [Leaders]
 *     summary: List leader (nama saja, tanpa PIN)
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [Leaders]
 *     summary: Tambah leader baru (planner)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, pin]
 *             properties:
 *               name: { type: string }
 *               pin: { type: string, description: '4 digit PIN' }
 *     responses:
 *       201: { description: Created }
 * /api/leaders/verify:
 *   post:
 *     tags: [Leaders]
 *     summary: Verifikasi PIN leader
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, pin]
 *             properties:
 *               id: { type: string, description: 'UUID leader' }
 *               pin: { type: string }
 *     responses:
 *       200: { description: PIN valid }
 *       400: { description: Validation error }
 *       401: { description: PIN tidak valid }
 * /api/leaders/{id}/reveal-pin:
 *   get:
 *     tags: [Leaders]
 *     summary: Reveal PIN (decrypt AES-256-GCM) (planner)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Success }
 * /api/leaders/{id}:
 *   delete:
 *     tags: [Leaders]
 *     summary: Hapus leader (planner)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
leadersRoutes.get('/',              requireAuth,                             leadersController.getAll);
leadersRoutes.post('/',             requireAuth, requireRole('planner'),     leadersController.create);
leadersRoutes.post('/verify',       requireAuth,                             leadersController.verifyPin);
leadersRoutes.get('/:id/reveal-pin', requireAuth, requireRole('planner'),   leadersController.revealPin);
leadersRoutes.delete('/:id',        requireAuth, requireRole('planner'),     leadersController.delete);
