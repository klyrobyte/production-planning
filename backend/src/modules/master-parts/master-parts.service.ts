import { masterPartsRepository } from './master-parts.repository';
import { pool } from '../../config/database';
import { AppError } from '../../common/errors/AppError';

export const masterPartsService = {
  getAll: () => masterPartsRepository.findAll(),

  upsert: async (data: Record<string, any>) => {
    if (!data.part_number) throw new AppError(400, 'VALIDATION_ERROR', 'part_number wajib diisi.');
    return masterPartsRepository.upsert(data);
  },

  // Wraps multiple upserts in a single transaction
  bulkImport: async (parts: Record<string, any>[]) => {
    if (!parts.length) throw new AppError(400, 'VALIDATION_ERROR', 'Data tidak boleh kosong.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = await Promise.all(parts.map((p) => masterPartsRepository.upsert(p)));
      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  delete: async (partNumber: string) => {
    const deleted = await masterPartsRepository.deleteByPartNumber(partNumber);
    if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Part tidak ditemukan.');
  },

  deleteAll: () => masterPartsRepository.deleteAll(),
};
