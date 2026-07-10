import { Router } from 'express';
import { machinesController } from './machines.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const machinesRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Machines, description: Manajemen mesin per factory }]
 * /api/machines:
 *   get:
 *     tags: [Machines]
 *     summary: List semua mesin (bisa filter factory_id)
 *     parameters:
 *       - in: query
 *         name: factory_id
 *         schema: { type: string }
 *         description: Filter mesin berdasarkan UUID factory
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [Machines]
 *     summary: Tambah mesin baru (super-admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [factory_id, code, name]
 *             properties:
 *               factory_id: { type: string }
 *               code: { type: string }
 *               name: { type: string }
 *               type: { type: string }
 *               tonnage: { type: string }
 *     responses:
 *       201: { description: Created }
 * /api/machines/{id}:
 *   put:
 *     tags: [Machines]
 *     summary: Update mesin (super-admin)
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
 *               factory_id: { type: string }
 *               code: { type: string }
 *               name: { type: string }
 *               type: { type: string }
 *               tonnage: { type: string }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200: { description: Success }
 *   delete:
 *     tags: [Machines]
 *     summary: Hapus mesin (super-admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
machinesRoutes.get('/',       requireAuth,                             machinesController.getAll);
machinesRoutes.post('/',      requireAuth, requireRole('super-admin'), machinesController.create);
machinesRoutes.put('/:id',    requireAuth, requireRole('super-admin'), machinesController.update);
machinesRoutes.delete('/:id', requireAuth, requireRole('super-admin'), machinesController.delete);
