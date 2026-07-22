import { Router } from 'express';
import { factoriesController } from './factories.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const factoriesRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Factories, description: Manajemen data pabrik }]
 * /api/factories:
 *   get:
 *     tags: [Factories]
 *     summary: List semua factory
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [Factories]
 *     summary: Tambah factory baru (super-admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               location: { type: string }
 *     responses:
 *       201: { description: Created }
 * /api/factories/{id}:
 *   put:
 *     tags: [Factories]
 *     summary: Update factory (super-admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               location: { type: string }
 *     responses:
 *       200: { description: Success }
 *   delete:
 *     tags: [Factories]
 *     summary: Hapus factory (super-admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
factoriesRoutes.get('/',       requireAuth,                             factoriesController.getAll);
factoriesRoutes.post('/',      requireAuth, requireRole('super-admin'), factoriesController.create);
factoriesRoutes.put('/:id',    requireAuth, requireRole('super-admin'), factoriesController.update);
factoriesRoutes.delete('/:id', requireAuth, requireRole('super-admin'), factoriesController.delete);
