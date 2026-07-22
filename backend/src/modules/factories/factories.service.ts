import { factoriesRepository } from './factories.repository';
import { AppError } from '../../common/errors/AppError';

export const factoriesService = {
  getAll: () => factoriesRepository.findAll(),

  create: async (code: string, name: string, location?: string) => {
    return factoriesRepository.create(code, name, location);
  },

  update: async (id: string, data: { code?: string; name?: string; location?: string }) => {
    const updated = await factoriesRepository.update(id, data);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Factory tidak ditemukan.');
    return updated;
  },

  delete: async (id: string) => {
    const deleted = await factoriesRepository.delete(id);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Factory tidak ditemukan.');
  },
};
