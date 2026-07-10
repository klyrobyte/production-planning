import { Request, Response } from 'express';
import { rolesService } from './roles.service';

export const rolesController = {
  getAll: async (_req: Request, res: Response) => {
    const data = await rolesService.getAll();
    res.json({ status: 'ok', data });
  },

  create: async (req: Request, res: Response) => {
    const { name, display_name } = req.body;
    if (!name || !display_name) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'name dan display_name wajib diisi.' });
      return;
    }
    const data = await rolesService.create(name, display_name);
    res.status(201).json({ status: 'ok', data });
  },

  delete: async (req: Request, res: Response) => {
    const { name } = req.query as { name: string };
    if (!name) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'Query param ?name diperlukan untuk konfirmasi.' });
      return;
    }
    await rolesService.delete(req.params.id as string, name);
    res.json({ status: 'ok', message: 'Role dihapus.' });
  },
};
