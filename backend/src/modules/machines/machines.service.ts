import bcrypt from 'bcrypt';
import { machinesRepository } from './machines.repository';
import { AppError } from '../../common/errors/AppError';

export const machinesService = {
  getAll: (factoryId?: string) => machinesRepository.findAll(factoryId),

  create: async (data: { factoryId: string; code: string; name: string; type?: string; tonnage?: string }) => {
    return machinesRepository.create(data);
  },

  update: async (id: string, data: { code?: string; name?: string; type?: string; tonnage?: string; status?: string; pin?: string }) => {
    if (data.status && !['active', 'inactive'].includes(data.status)) {
      throw new AppError(400, 'VALIDATION_ERROR', "status harus 'active' atau 'inactive'.");
    }
    const pinHash = data.pin ? await bcrypt.hash(data.pin, 10) : undefined;
    const updated = await machinesRepository.update(id, { ...data, pinHash });
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Mesin tidak ditemukan.');
    return updated;
  },

  delete: async (id: string) => {
    const deleted = await machinesRepository.delete(id);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Mesin tidak ditemukan.');
  },
};
