import { Router } from 'express';
import { rolesController } from './roles.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const rolesRoutes = Router();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List semua role yang terdaftar
 *   post:
 *     tags: [Roles]
 *     summary: Tambah role baru (super-admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, display_name]
 *             properties:
 *               name: { type: string }
 *               display_name: { type: string }
 *     responses:
 *       201: { description: Created }
 * /api/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Hapus role — tidak bisa hapus super-admin, tidak bisa hapus jika masih ada user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: name
 *         required: true
 *         description: Nama role sebagai konfirmasi
 *         schema: { type: string }
 */
rolesRoutes.get('/',       requireAuth,                               rolesController.getAll);
rolesRoutes.post('/',      requireAuth, requireRole('super-admin'),   rolesController.create);
rolesRoutes.delete('/:id', requireAuth, requireRole('super-admin'),   rolesController.delete);
