import { btPrintersRepository } from './bt-printers.repository';

export const btPrintersService = {
  getAll: () => btPrintersRepository.findAll(),

  /** Called automatically when a printer connects — idempotent upsert */
  registerPrinter: (name: string, serviceUuid: string, notes?: string) =>
    btPrintersRepository.upsert(name, serviceUuid, notes),

  create: (name: string, serviceUuid: string, notes?: string) =>
    btPrintersRepository.create(name, serviceUuid, notes),

  update: (id: number, name: string, serviceUuid: string, notes?: string) =>
    btPrintersRepository.update(id, name, serviceUuid, notes),

  delete: async (id: number) => {
    const deleted = await btPrintersRepository.delete(id);
    if (!deleted) throw new Error('Printer not found.');
    return { success: true };
  },
};
