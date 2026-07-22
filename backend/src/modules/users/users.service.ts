import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { usersRepository } from './users.repository';
import { pool } from '../../config/database';
import { AppError } from '../../common/errors/AppError';

export const usersService = {
  getAll: () => usersRepository.findAll(),

  create: async (data: { username: string; role: string; name: string; password: string }) => {
    // Validate role exists in DB
    const { rows } = await pool.query('SELECT name FROM roles WHERE name = $1', [data.role]);
    if (!rows.length) throw new AppError(400, 'VALIDATION_ERROR', `Role '${data.role}' tidak ditemukan.`);

    const exists = await usersRepository.findByUsername(data.username);
    if (exists) throw new AppError(409, 'CONFLICT', 'Username sudah digunakan.');

    const uid = `uid-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = await bcrypt.hash(data.password, 10);
    return usersRepository.create({ uid, username: data.username.toLowerCase(), role: data.role, name: data.name, passwordHash });
  },

  update: async (id: string, data: { role?: string; name?: string; password?: string }) => {
    if (data.role) {
      const { rows } = await pool.query('SELECT name FROM roles WHERE name = $1', [data.role]);
      if (!rows.length) throw new AppError(400, 'VALIDATION_ERROR', `Role '${data.role}' tidak ditemukan.`);
    }
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const updated = await usersRepository.update(id, { role: data.role, name: data.name, passwordHash });
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'User tidak ditemukan.');
    return updated;
  },

  delete: async (id: string) => {
    const deleted = await usersRepository.delete(id);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'User tidak ditemukan.');
  },
};
