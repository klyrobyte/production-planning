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
 *   post:
 *     tags: [Users]
 *     summary: Buat user baru
 */
usersRoutes.get('/',    requireAuth, requireRole('super-admin'), usersController.getAll);
usersRoutes.post('/',   requireAuth, requireRole('super-admin'), usersController.create);
usersRoutes.put('/:id', requireAuth, requireRole('super-admin'), usersController.update);
usersRoutes.delete('/:id', requireAuth, requireRole('super-admin'), usersController.delete);
