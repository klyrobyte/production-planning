import { productionPlansRepository } from './production-plans.repository';
import { AppError } from '../../common/errors/AppError';
import { getIo } from '../../websocket/socket.server';

export const createProductionPlansService = () => ({
  getAll: () => productionPlansRepository.findAll(),

  getById: async (id: string) => {
    const plan = await productionPlansRepository.findById(id);
    if (!plan) throw new AppError(404, 'NOT_FOUND', 'Production plan tidak ditemukan.');
    return plan;
  },

  upsert: async (data: Record<string, any>) => {
    if (!data.id || !data.plan_type || !data.machine_id || !data.date_key) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'id, plan_type, machine_id, dan date_key wajib diisi.',
      );
    }

    const plan = await productionPlansRepository.upsert(data);

    const io = getIo();
    if (io) {
      // Broadcast globally so that the Main Dashboard (/production) is always updated in real-time
      io.emit('production_plan_updated', plan);
      // Also broadcast to the machine-specific room for operator tablets
      io.to(`plan:${plan.id}`).emit('production_plan_updated', plan);
    }

    return plan;
  },
});