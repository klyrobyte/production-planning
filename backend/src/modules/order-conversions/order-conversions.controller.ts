import { Request, Response } from 'express';
import { orderConversionsService } from './order-conversions.service';

export const orderConversionsController = {
  getAll: async (_req: Request, res: Response) => {
    res.json({ status: 'ok', data: await orderConversionsService.getAll() });
  },
  create: async (req: Request, res: Response) => {
    const data = await orderConversionsService.create(req.body);
    res.status(201).json({ status: 'ok', data });
  },
  update: async (req: Request, res: Response) => {
    const data = await orderConversionsService.update(req.params.id as string, req.body);
    res.json({ status: 'ok', data });
  },
  delete: async (req: Request, res: Response) => {
    await orderConversionsService.delete(req.params.id as string);
    res.json({ status: 'ok', message: 'Mapping dihapus.' });
  },
  deleteAll: async (_req: Request, res: Response) => {
    await orderConversionsService.deleteAll();
    res.json({ status: 'ok', message: 'Semua mapping dihapus.' });
  },
  bulkImport: async (req: Request, res: Response) => {
    const data = await orderConversionsService.bulkImport(req.body);
    res.status(201).json({ status: 'ok', data });
  }
};

