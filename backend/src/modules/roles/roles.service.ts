import { rolesRepository } from './roles.repository';
import { redis } from '../../config/redis';
import { AppError } from '../../common/errors/AppError';

const ROLES_CACHE_KEY = 'app:valid_roles';

// Invalidates the Redis role cache after any mutation
const invalidateCache = () => redis.del(ROLES_CACHE_KEY);

export const rolesService = {
  getAll: () => rolesRepository.findAll(),

  create: async (name: string, displayName: string) => {
    const exists = await rolesRepository.findByName(name);
    if (exists) throw new AppError(409, 'CONFLICT', `Role '${name}' sudah ada.`);
    const role = await rolesRepository.create(name.toLowerCase().replace(/\s+/g, '-'), displayName);
    await invalidateCache();
    return role;
  },

  delete: async (id: string, name: string) => {
    // super-admin cannot be deleted — it's the system owner role
    if (name === 'super-admin') throw new AppError(403, 'FORBIDDEN', 'Role super-admin tidak bisa dihapus.');

    const inUse = await rolesRepository.isUsedByUsers(name);
    if (inUse) throw new AppError(409, 'CONFLICT', `Role '${name}' masih digunakan oleh user.`);

    const deleted = await rolesRepository.delete(id);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Role tidak ditemukan.');

    await invalidateCache();
  },
};
