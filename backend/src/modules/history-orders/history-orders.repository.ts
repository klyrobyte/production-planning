import { pool } from '../../config/database';

export const historyOrdersRepository = {
  findAll: async () => {
    const { rows } = await pool.query(
      'SELECT * FROM history_orders ORDER BY created_at DESC LIMIT 1000',
    );
    return rows;
  },

  // Inserts multiple rows under the same batch_id in one transaction
  bulkInsert: async (batchId: string, rows: Record<string, any>[]) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await Promise.all(
        rows.map((r) =>
          client.query(
            `INSERT INTO history_orders
             (batch_id, sebango, part_number, part_name,
              month_n_volume, month_n1_volume, month_n2_volume, month_n3_volume,
              daily_requirement_n, daily_requirement_n1, daily_requirement_n2, daily_requirement_n3)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [batchId, r.sebango, r.part_number, r.part_name,
             r.month_n_volume ?? 0, r.month_n1_volume ?? 0, r.month_n2_volume ?? 0, r.month_n3_volume ?? 0,
             r.daily_requirement_n ?? 0, r.daily_requirement_n1 ?? 0, r.daily_requirement_n2 ?? 0, r.daily_requirement_n3 ?? 0],
          ),
        ),
      );
      await client.query('COMMIT');
      return inserted.length;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
