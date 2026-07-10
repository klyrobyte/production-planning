import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../rbac/rbac.middleware';
import { createRateLimiter } from '../../common/middlewares/rate-limit.middleware';

export const authRoutes = Router();

const loginLimiter = createRateLimiter('login', 5, 60); // 5 attempts per 60s

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dan dapatkan session cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login berhasil }
 *       401: { description: Credentials salah }
 *       429: { description: Rate limit exceeded }
 */
authRoutes.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout dan hapus session cookie
 *     responses:
 *       200: { description: Logout berhasil }
 */
authRoutes.post('/logout', requireAuth, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Dapatkan data user yang sedang login
 *     responses:
 *       200: { description: Data user }
 *       401: { description: Tidak terautentikasi }
 */
authRoutes.get('/me', requireAuth, authController.me);

/**
 * @swagger
 * /api/auth/verify-member-pin:
 *   post:
 *     tags: [Auth]
 *     summary: Verifikasi PIN member untuk mesin tertentu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [machine_id, pin]
 *             properties:
 *               machine_id: { type: string }
 *               pin: { type: string }
 *     responses:
 *       200: { description: PIN valid }
 *       401: { description: PIN tidak valid }
 *       404: { description: Mesin tidak ditemukan }
 */
authRoutes.post('/verify-member-pin', requireAuth, createRateLimiter('pin_verify', 5, 60), authController.verifyMemberPin);
