import { Request, Response } from 'express';
import { labelCountersService } from './label-counters.service';

export const labelCountersController = {
  getByDate: async (req: Request, res: Response) => {
    res.json({ status: 'ok', data: await labelCountersService.getByDate(req.params.date_key as string) });
  },

  increment: async (req: Request, res: Response) => {
    const { date_key, amount = 1 } = req.body;
    if (!date_key) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'date_key wajib diisi.' });
      return;
    }
    const data = await labelCountersService.increment(date_key, Number(amount));
    res.json({ status: 'ok', data });
  },
};
