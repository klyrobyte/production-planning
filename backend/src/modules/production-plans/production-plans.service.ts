import { productionPlansRepository } from './production-plans.repository';
import { AppError } from '../../common/errors/AppError';
import { Server as SocketServer } from 'socket.io';

export const createProductionPlansService = (io?: SocketServer) => ({
  getAll: () => productionPlansRepository.findAll(),

  getById: async (id: string) => {
    const plan = await productionPlansRepository.findById(id);
    if (!plan) throw new AppError(404, 'NOT_FOUND', 'Production plan tidak ditemukan.');
    return plan;
  },

  upsert: async (data: Record<string, any>) => {
    if (!data.id || !data.plan_type || !data.machine_id || !data.date_key) {
      throw new AppError(400, 'VALIDATION_ERROR', 'id, plan_type, machine_id, dan date_key wajib diisi.');
    }
    const plan = await productionPlansRepository.upsert(data);
    // Broadcasts update to all connected clients
    io?.emit('production_plan_updated', plan);
    return plan;
  },
});
