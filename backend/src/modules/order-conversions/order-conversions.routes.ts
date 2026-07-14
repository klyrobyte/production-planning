import { Router } from 'express';
import { orderConversionsController } from './order-conversions.controller';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';

export const orderConversionsRoutes = Router();

/**
 * @swagger
 * tags: [{ name: Order Conversions, description: Mapping part number customer ke internal sebango }]
 * /api/order-conversions:
 *   get:
 *     tags: [Order Conversions]
 *     summary: Semua mappings
 *     responses:
 *       200: { description: Success }
 *   post:
 *     tags: [Order Conversions]
 *     summary: Tambah mapping baru (planner)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cust_part_number, prod_sebango]
 *             properties:
 *               cust_part_number: { type: string }
 *               cust_sebango: { type: string }
 *               prod_sebango: { type: string }
 *               part_category: { type: string, enum: [big, small] }
 *     responses:
 *       201: { description: Created }
 * /api/order-conversions/{id}:
 *   put:
 *     tags: [Order Conversions]
 *     summary: Update mapping (planner)
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
 *               cust_part_number: { type: string }
 *               cust_sebango: { type: string }
 *               prod_sebango: { type: string }
 *               part_category: { type: string, enum: [big, small] }
 *     responses:
 *       200: { description: Success }
 *   delete:
 *     tags: [Order Conversions]
 *     summary: Hapus mapping (planner)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 */
orderConversionsRoutes.get('/',       requireAuth,                         orderConversionsController.getAll);
orderConversionsRoutes.post('/',      requireAuth, requireRole('planner'), orderConversionsController.create);
orderConversionsRoutes.post('/import',requireAuth, requireRole('planner'), orderConversionsController.bulkImport);
orderConversionsRoutes.put('/:id',    requireAuth, requireRole('planner'), orderConversionsController.update);
orderConversionsRoutes.delete('/:id', requireAuth, requireRole('planner'), orderConversionsController.delete);
orderConversionsRoutes.delete('/',     requireAuth, requireRole('super-admin'), orderConversionsController.deleteAll);

