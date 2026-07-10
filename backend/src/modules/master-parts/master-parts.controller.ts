import { Request, Response } from 'express';
import { masterPartsService } from './master-parts.service';

export const masterPartsController = {
  getAll: async (_req: Request, res: Response) => {
    res.json({ status: 'ok', data: await masterPartsService.getAll() });
  },

  upsert: async (req: Request, res: Response) => {
    const data = await masterPartsService.upsert(req.body);
    res.json({ status: 'ok', data });
  },

  // Accepts an array of parts for bulk import
  bulkImport: async (req: Request, res: Response) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'Body harus berupa array.' });
      return;
    }
    const data = await masterPartsService.bulkImport(req.body);
    res.json({ status: 'ok', message: `${data.length} part berhasil diimport.`, data });
  },

  delete: async (req: Request, res: Response) => {
    await masterPartsService.delete(req.params.part_number as string);
    res.json({ status: 'ok', message: 'Part dihapus.' });
  },

  deleteAll: async (_req: Request, res: Response) => {
    await masterPartsService.deleteAll();
    res.json({ status: 'ok', message: 'Semua master parts dihapus.' });
  },
};
