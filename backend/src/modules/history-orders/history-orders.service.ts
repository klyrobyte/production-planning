import crypto from 'crypto';
import { historyOrdersRepository } from './history-orders.repository';
import { AppError } from '../../common/errors/AppError';

export const historyOrdersService = {
  getAll: () => historyOrdersRepository.findAll(),

  bulkInsert: async (rows: Record<string, any>[]) => {
    if (!rows.length) throw new AppError(400, 'VALIDATION_ERROR', 'Data tidak boleh kosong.');
    const batchId = crypto.randomUUID();
    const count = await historyOrdersRepository.bulkInsert(batchId, rows);
    return { batchId, count };
  },
};
