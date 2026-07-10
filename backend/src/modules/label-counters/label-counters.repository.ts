import { pool } from '../../config/database';

export const labelCountersRepository = {
  findByDate: async (dateKey: string) => {
    const { rows } = await pool.query('SELECT * FROM label_counters WHERE date_key = $1', [dateKey]);
    return rows[0] || null;
  },

  // Upserts counter for a date, incrementing seq by the given amount
  increment: async (dateKey: string, amount = 1) => {
    const { rows } = await pool.query(
      `INSERT INTO label_counters (date_key, seq)
       VALUES ($1, $2)
       ON CONFLICT (date_key) DO UPDATE
         SET seq = label_counters.seq + $2, updated_at = NOW()
       RETURNING *`,
      [dateKey, amount],
    );
    return rows[0];
  },
};
