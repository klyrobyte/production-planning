import { Request, Response } from 'express';
import { usersService } from './users.service';

export const usersController = {
  getAll: async (_req: Request, res: Response) => {
    const data = await usersService.getAll();
    res.json({ status: 'ok', data });
  },

  create: async (req: Request, res: Response) => {
    const { username, role, name, password } = req.body;
    if (!username || !role || !name || !password) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'username, role, name, dan password wajib diisi.' });
      return;
    }
    const data = await usersService.create({ username, role, name, password });
    res.status(201).json({ status: 'ok', data });
  },

  update: async (req: Request, res: Response) => {
    const data = await usersService.update(req.params.id as string, req.body);
    res.json({ status: 'ok', data });
  },

  delete: async (req: Request, res: Response) => {
    await usersService.delete(req.params.id as string);
    res.json({ status: 'ok', message: 'User dihapus.' });
  },
};
