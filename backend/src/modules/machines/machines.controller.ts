import { Request, Response } from 'express';
import { machinesService } from './machines.service';

export const machinesController = {
  getAll: async (req: Request, res: Response) => {
    const { factory_id } = req.query as { factory_id?: string };
    res.json({ status: 'ok', data: await machinesService.getAll(factory_id) });
  },

  create: async (req: Request, res: Response) => {
    const { factory_id, code, name, type, tonnage } = req.body;
    if (!factory_id || !code || !name) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'factory_id, code, dan name wajib diisi.' });
      return;
    }
    const data = await machinesService.create({ factoryId: factory_id, code, name, type, tonnage });
    res.status(201).json({ status: 'ok', data });
  },

  update: async (req: Request, res: Response) => {
    const data = await machinesService.update(req.params.id as string, req.body);
    res.json({ status: 'ok', data });
  },

  delete: async (req: Request, res: Response) => {
    await machinesService.delete(req.params.id as string);
    res.json({ status: 'ok', message: 'Mesin dihapus.' });
  },
};
