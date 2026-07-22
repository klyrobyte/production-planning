import { Router } from 'express';
import { usersController } from './users.controller';
import { requireAuth } from '../rbac/rbac.middleware';
import { requireRole } from '../rbac/rbac.middleware';

export const usersRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Users, description: Manajemen akun user }]
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List semua user
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [Users]
 *     summary: Buat user baru (super-admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, role, name, password]
 *             properties:
 *               username: { type: string }
 *               role: { type: string }
 *               name: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Created }
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update data user (super-admin)
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
 *               role: { type: string }
 *               name: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Success }
 *   delete:
 *     tags: [Users]
 *     summary: Hapus user (super-admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
usersRoutes.get('/',    requireAuth, requireRole('super-admin'), usersController.getAll);
usersRoutes.post('/',   requireAuth, requireRole('super-admin'), usersController.create);
usersRoutes.put('/:id', requireAuth, requireRole('super-admin'), usersController.update);
usersRoutes.delete('/:id', requireAuth, requireRole('super-admin'), usersController.delete);
