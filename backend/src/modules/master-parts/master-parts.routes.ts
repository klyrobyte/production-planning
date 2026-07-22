import { Router } from 'express';
import { masterPartsController } from './master-parts.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const masterPartsRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Parts, description: Manajemen master data part/komponen }]
 * /api/parts:
 *   get:
 *     tags: [Parts]
 *     summary: Semua master parts
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [Parts]
 *     summary: Upsert satu part (planner)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [part_number, part_name]
 *             properties:
 *               part_number: { type: string }
 *               part_name: { type: string }
 *               home_line: { type: string }
 *               backup_line: { type: string }
 *               model_code: { type: string }
 *               cycle_time: { type: number }
 *               sebango: { type: string }
 *               material: { type: string }
 *               area: { type: string }
 *               tonnage: { type: string }
 *               cavity: { type: number }
 *               mold: { type: string }
 *               weight: { type: number }
 *               spec: { type: number }
 *               process: { type: string }
 *               shikake: { type: number }
 *               customer_pno: { type: string }
 *               customer_sebango: { type: string }
 *     responses:
 *       200: { description: Success }
 *   delete:
 *     tags: [Parts]
 *     summary: Hapus semua parts (super-admin)
 *     responses:
 *       200: { description: Deleted }
 * /api/parts/import:
 *   post:
 *     tags: [Parts]
 *     summary: Bulk import parts (planner)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200: { description: Success }
 * /api/parts/{part_number}:
 *   delete:
 *     tags: [Parts]
 *     summary: Hapus satu part (planner)
 *     parameters:
 *       - in: path
 *         name: part_number
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
masterPartsRoutes.get('/',                requireAuth,                             masterPartsController.getAll);
masterPartsRoutes.post('/',               requireAuth, requireRole('planner'),     masterPartsController.upsert);
masterPartsRoutes.post('/import',         requireAuth, requireRole('planner'),     masterPartsController.bulkImport);
masterPartsRoutes.delete('/:part_number', requireAuth, requireRole('planner'),     masterPartsController.delete);
masterPartsRoutes.delete('/',             requireAuth, requireRole('super-admin'),  masterPartsController.deleteAll);
