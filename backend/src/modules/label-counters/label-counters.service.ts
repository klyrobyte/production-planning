import { labelCountersRepository } from './label-counters.repository';
import { AppError } from '../../common/errors/AppError';

export const labelCountersService = {
  getByDate: async (dateKey: string) => {
    const counter = await labelCountersRepository.findByDate(dateKey);
    return counter ?? { date_key: dateKey, seq: 0 };
  },

  increment: async (dateKey: string, amount: number) => {
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'date_key harus format YYYY-MM-DD.');
    }
    if (amount < 1) throw new AppError(400, 'VALIDATION_ERROR', 'amount minimal 1.');
    return labelCountersRepository.increment(dateKey, amount);
  },
};
