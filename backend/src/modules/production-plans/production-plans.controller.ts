import { Request, Response } from 'express';
import { createProductionPlansService } from './production-plans.service';

// Factory function
export const createProductionPlansController = () => {
  const service = createProductionPlansService();

  return {
    getAll: async (_req: Request, res: Response) => {
      res.json({ status: 'ok', data: await service.getAll() });
    },

    getById: async (req: Request, res: Response) => {
      res.json({ status: 'ok', data: await service.getById(req.params.id as string) });
    },

    upsert: async (req: Request, res: Response) => {
      const data = await service.upsert(req.body);
      res.json({ status: 'ok', data });
    },
  };
};
