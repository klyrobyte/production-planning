import { Request, Response } from 'express';
import { historyOrdersService } from './history-orders.service';

export const historyOrdersController = {
  getAll: async (_req: Request, res: Response) => {
    res.json({ status: 'ok', data: await historyOrdersService.getAll() });
  },

  bulkInsert: async (req: Request, res: Response) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'Body harus berupa array.' });
      return;
    }
    const result = await historyOrdersService.bulkInsert(req.body);
    res.status(201).json({ status: 'ok', message: `${result.count} baris diinsert dengan batch_id: ${result.batchId}.`, data: result });
  },
};
