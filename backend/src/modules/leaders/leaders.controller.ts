import { Request, Response } from 'express';
import { leadersService } from './leaders.service';

export const leadersController = {
  getAll: async (_req: Request, res: Response) => {
    res.json({ status: 'ok', data: await leadersService.getAll() });
  },

  create: async (req: Request, res: Response) => {
    const { name, pin } = req.body;
    if (!name || !pin || String(pin).length !== 4) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'name wajib diisi dan pin harus 4 digit.' });
      return;
    }
    const data = await leadersService.create(name, String(pin));
    res.status(201).json({ status: 'ok', data });
  },

  verifyPin: async (req: Request, res: Response) => {
    const { id, pin } = req.body;
    if (!pin) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'pin wajib diisi.' });
      return;
    }
    await leadersService.verifyPin(id ? String(id) : undefined, String(pin));
    res.json({ status: 'ok', message: 'PIN leader valid.' });
  },

  revealPin: async (req: Request, res: Response) => {
    const pin = await leadersService.revealPin(req.params.id as string);
    res.json({ status: 'ok', data: { pin } });
  },

  delete: async (req: Request, res: Response) => {
    await leadersService.delete(req.params.id as string);
    res.json({ status: 'ok', message: 'Leader dihapus.' });
  },
};
