import { Router } from 'express';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';
import { handleGetConfig, handlePutConfig } from './site-config.controller';

export const siteConfigRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: SiteConfig
 *   description: Konfigurasi tampilan sistem (warna tema) — GET public, PUT super-admin
 */

/**
 * @swagger
 * /api/site-config:
 *   get:
 *     summary: Ambil konfigurasi warna sistem saat ini
 *     tags: [SiteConfig]
 *     responses:
 *       200:
 *         description: Objek config warna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 color_primary:
 *                   type: string
 *                   example: "#008d51"
 *                 color_secondary:
 *                   type: string
 *                   example: "#E76114"
 *                 color_navbar:
 *                   type: string
 *                   example: "#037233"
 */
siteConfigRoutes.get('/', handleGetConfig);

/**
 * @swagger
 * /api/site-config:
 *   put:
 *     summary: Update satu atau lebih warna sistem (partial update)
 *     tags: [SiteConfig]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               color_primary:
 *                 type: string
 *                 example: "#008d51"
 *               color_secondary:
 *                 type: string
 *                 example: "#E76114"
 *               color_navbar:
 *                 type: string
 *                 example: "#037233"
 *     responses:
 *       200:
 *         description: Config terbaru setelah update
 *       400:
 *         description: Format hex tidak valid atau tidak ada key yang dikenali
 *       403:
 *         description: Bukan super-admin
 */
siteConfigRoutes.put('/', requireAuth, requireRole('super-admin'), handlePutConfig);
