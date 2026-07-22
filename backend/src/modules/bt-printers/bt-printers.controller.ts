import { Request, Response } from 'express';
import { btPrintersService } from './bt-printers.service';

export const handleGetAll = async (_req: Request, res: Response) => {
  const data = await btPrintersService.getAll();
  res.json({ data });
};

export const handleRegister = async (req: Request, res: Response) => {
  const { name, service_uuid, notes } = req.body;
  if (!name || !service_uuid) {
    res.status(400).json({ error: 'name and service_uuid are required.' });
    return;
  }
  const printer = await btPrintersService.registerPrinter(name, service_uuid, notes);
  res.json({ data: printer });
};

export const handleCreate = async (req: Request, res: Response) => {
  const { name, service_uuid, notes } = req.body;
  if (!name || !service_uuid) {
    res.status(400).json({ error: 'name and service_uuid are required.' });
    return;
  }
  try {
    const printer = await btPrintersService.create(name, service_uuid, notes);
    res.status(201).json({ data: printer });
  } catch (e: any) {
    if (e?.code === '23505') {
      res.status(409).json({ error: 'A printer with this service_uuid already exists.' });
    } else {
      throw e;
    }
  }
};

export const handleUpdate = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, service_uuid, notes } = req.body;
  if (!name || !service_uuid) {
    res.status(400).json({ error: 'name and service_uuid are required.' });
    return;
  }
  const printer = await btPrintersService.update(id, name, service_uuid, notes);
  if (!printer) {
    res.status(404).json({ error: 'Printer not found.' });
    return;
  }
  res.json({ data: printer });
};

export const handleDelete = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const result = await btPrintersService.delete(id);
    res.json(result);
  } catch {
    res.status(404).json({ error: 'Printer not found.' });
  }
};
