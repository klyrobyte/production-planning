import { Router } from 'express';
import { requireAuth, requireRole } from '../rbac/rbac.middleware';
import {
  handleGetAll,
  handleRegister,
  handleCreate,
  handleUpdate,
  handleDelete,
} from './bt-printers.controller';

export const btPrintersRoutes = Router();

/**
 * GET /api/bt-printers
 * Public — any authenticated user can fetch the printer list
 * so that the execution page can load known UUIDs on startup.
 */
btPrintersRoutes.get('/', requireAuth, handleGetAll);

/**
 * POST /api/bt-printers/register
 * Called automatically when a tablet successfully connects to a BT printer.
 * Upserts by service_uuid so repeated calls are safe.
 * Any authenticated member can call this.
 */
btPrintersRoutes.post('/register', requireAuth, handleRegister);

/**
 * POST /api/bt-printers  (manual create from admin)
 * PUT  /api/bt-printers/:id
 * DELETE /api/bt-printers/:id
 * Only super-admin / planner can manage printers manually.
 */
btPrintersRoutes.post('/', requireAuth, requireRole('super-admin', 'planner'), handleCreate);
btPrintersRoutes.put('/:id', requireAuth, requireRole('super-admin', 'planner'), handleUpdate);
btPrintersRoutes.delete('/:id', requireAuth, requireRole('super-admin', 'planner'), handleDelete);
