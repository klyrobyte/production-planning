import { pool } from '../../config/database';

export const productionPlansRepository = {
  findAll: async () => {
    const { rows } = await pool.query(
      'SELECT * FROM production_plans ORDER BY date_key DESC, machine_id ASC',
    );
    return rows;
  },

  findById: async (id: string) => {
    const { rows } = await pool.query(
      'SELECT * FROM production_plans WHERE id = $1',
      [id],
    );
    return rows[0] || null;
  },

  // Upserts a plan by its composite ID (e.g. '2025-01-15_F2-MC-1').
  // All mutable columns included so abnormality/NG state and logs
  // are never silently discarded on save.
  upsert: async (data: Record<string, any>) => {
    const { rows } = await pool.query(
      `INSERT INTO production_plans (
         id, plan_type, machine_id, date_key,
         jobs, day_ot, night_ot, logs,
         is_abnormal, abnormal_type, abnormal_start,
         is_ng, ng_type, ng_start
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
         jobs           = EXCLUDED.jobs,
         day_ot         = EXCLUDED.day_ot,
         night_ot       = EXCLUDED.night_ot,
         logs           = EXCLUDED.logs,
         is_abnormal    = EXCLUDED.is_abnormal,
         abnormal_type  = EXCLUDED.abnormal_type,
         abnormal_start = EXCLUDED.abnormal_start,
         is_ng          = EXCLUDED.is_ng,
         ng_type        = EXCLUDED.ng_type,
         ng_start       = EXCLUDED.ng_start,
         updated_at     = NOW()
       RETURNING *`,
      [
        data.id,
        data.plan_type,
        data.machine_id,
        data.date_key,
        JSON.stringify(data.jobs ?? []),
        data.day_ot ?? 'teiji',
        data.night_ot ?? 'teiji',
        JSON.stringify(data.logs ?? []),
        data.is_abnormal ?? false,
        data.abnormal_type ?? '',
        data.abnormal_start ?? '',
        data.is_ng ?? false,
        data.ng_type ?? '',
        data.ng_start ?? '',
      ],
    );
    return rows[0];
  },
};