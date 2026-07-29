import { pool } from '../../config/database';

let isSchemaEnsured = false;
async function ensureMasterPartsSchema() {
  if (isSchemaEnsured) return;
  try {
    await pool.query('ALTER TABLE master_parts ADD COLUMN IF NOT EXISTS qr_webhook_url TEXT;');
    isSchemaEnsured = true;
  } catch (e) {
    console.error('Failed to ensure qr_webhook_url column on master_parts table:', e);
  }
}

export const masterPartsRepository = {
  findAll: async () => {
    await ensureMasterPartsSchema();
    const { rows } = await pool.query('SELECT * FROM master_parts ORDER BY part_number ASC');
    return rows;
  },

  findByPartNumber: async (partNumber: string) => {
    await ensureMasterPartsSchema();
    const { rows } = await pool.query('SELECT id FROM master_parts WHERE part_number = $1', [partNumber]);
    return rows[0] || null;
  },

  // Upserts a single part — updates all columns if part_number already exists
  upsert: async (data: Record<string, any>) => {
    await ensureMasterPartsSchema();
    const { rows } = await pool.query(
      `INSERT INTO master_parts (
        part_number, part_name, home_line, backup_line, model, cycle_time, sebango,
        material, area, tonnage, cavity, mold, weight, spec, process, shikake,
        customer, customer_pno, customer_sebango, seq_no,
        daily_requirement_n, daily_requirement_n1, daily_requirement_n2, daily_requirement_n3,
        month_n_forecast, month_n1_forecast, month_n2_forecast, month_n3_forecast, monthly_forecasts,
        qr_webhook_url
       ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
       )
       ON CONFLICT (part_number) DO UPDATE SET
        part_name = EXCLUDED.part_name, home_line = EXCLUDED.home_line,
        backup_line = EXCLUDED.backup_line, model = EXCLUDED.model,
        cycle_time = EXCLUDED.cycle_time, daily_requirement_n = EXCLUDED.daily_requirement_n,
        daily_requirement_n1 = EXCLUDED.daily_requirement_n1, daily_requirement_n2 = EXCLUDED.daily_requirement_n2,
        daily_requirement_n3 = EXCLUDED.daily_requirement_n3, month_n_forecast = EXCLUDED.month_n_forecast,
        month_n1_forecast = EXCLUDED.month_n1_forecast, month_n2_forecast = EXCLUDED.month_n2_forecast,
        month_n3_forecast = EXCLUDED.month_n3_forecast, monthly_forecasts = EXCLUDED.monthly_forecasts,
        customer = EXCLUDED.customer, spec = EXCLUDED.spec,
        sebango = EXCLUDED.sebango, material = EXCLUDED.material,
        area = EXCLUDED.area, tonnage = EXCLUDED.tonnage,
        cavity = EXCLUDED.cavity, mold = EXCLUDED.mold,
        weight = EXCLUDED.weight, process = EXCLUDED.process,
        shikake = EXCLUDED.shikake, customer_pno = EXCLUDED.customer_pno,
        customer_sebango = EXCLUDED.customer_sebango, seq_no = EXCLUDED.seq_no,
        qr_webhook_url = EXCLUDED.qr_webhook_url
       RETURNING *`,
      [
        data.part_number, data.part_name, data.home_line, data.backup_line, data.model, data.cycle_time,
        data.sebango, data.material, data.area, data.tonnage, data.cavity ?? 1, data.mold,
        data.weight ?? 0, data.spec ?? 1, data.process ?? 'injection', data.shikake ?? 2,
        data.customer, data.customer_pno, data.customer_sebango, data.seq_no,
        data.daily_requirement_n ?? 0, data.daily_requirement_n1 ?? 0, data.daily_requirement_n2 ?? 0, data.daily_requirement_n3 ?? 0,
        data.month_n_forecast ?? 0, data.month_n1_forecast ?? 0, data.month_n2_forecast ?? 0, data.month_n3_forecast ?? 0,
        JSON.stringify(data.monthly_forecasts ?? {}),
        data.qr_webhook_url ?? null,
      ],
    );
    return rows[0];
  },

  deleteByPartNumber: async (partNumber: string) => {
    const { rowCount } = await pool.query('DELETE FROM master_parts WHERE part_number = $1', [partNumber]);
    return (rowCount ?? 0) > 0;
  },

  deleteAll: async () => {
    await pool.query('TRUNCATE TABLE master_parts');
  },
};
