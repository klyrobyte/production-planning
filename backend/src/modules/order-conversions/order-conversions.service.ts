import { orderConversionsRepository } from './order-conversions.repository';
import { AppError } from '../../common/errors/AppError';

export const orderConversionsService = {
  getAll: () => orderConversionsRepository.findAll(),

  create: (data: { cust_part_number: string; cust_sebango?: string; prod_sebango: string; part_category?: string }) => {
    if (!data.cust_part_number || !data.prod_sebango) {
      throw new AppError(400, 'VALIDATION_ERROR', 'cust_part_number dan prod_sebango wajib diisi.');
    }
    return orderConversionsRepository.create(data);
  },

  update: async (id: string, data: Record<string, any>) => {
    const updated = await orderConversionsRepository.update(id, data);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Mapping tidak ditemukan.');
    return updated;
  },

  delete: async (id: string) => {
    const deleted = await orderConversionsRepository.delete(id);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Mapping tidak ditemukan.');
  },

  deleteAll: () => orderConversionsRepository.deleteAll(),

  bulkImport: async (mappings: { cust_part_number: string; cust_sebango?: string; prod_sebango: string; part_category?: string }[]) => {
    if (!mappings.length) throw new AppError(400, 'VALIDATION_ERROR', 'Data tidak boleh kosong.');
    return orderConversionsRepository.bulkImport(mappings);
  }
};

