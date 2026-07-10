import { Request, Response } from 'express';
import { factoriesService } from './factories.service';

export const factoriesController = {
  getAll: async (_req: Request, res: Response) => {
    res.json({ status: 'ok', data: await factoriesService.getAll() });
  },

  create: async (req: Request, res: Response) => {
    const { code, name, location } = req.body;
    if (!code || !name) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'code dan name wajib diisi.' });
      return;
    }
    const data = await factoriesService.create(code, name, location);
    res.status(201).json({ status: 'ok', data });
  },

  update: async (req: Request, res: Response) => {
    const data = await factoriesService.update(req.params.id as string, req.body);
    res.json({ status: 'ok', data });
  },

  delete: async (req: Request, res: Response) => {
    await factoriesService.delete(req.params.id as string);
    res.json({ status: 'ok', message: 'Factory dihapus.' });
  },
};
