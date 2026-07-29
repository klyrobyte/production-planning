import { pool } from '../../config/database';

let isCleanedUp = false;
async function cleanupMachineSchema() {
  if (isCleanedUp) return;
  try {
    await pool.query('ALTER TABLE machines DROP COLUMN IF EXISTS qr_webhook_url;');
    isCleanedUp = true;
  } catch (e) {}
}

export const machinesRepository = {
  findAll: async (factoryId?: string) => {
    await cleanupMachineSchema();
    const base = `
      SELECT m.id, m.factory_id, f.code AS factory_code, f.name AS factory_name,
             m.code, m.name, m.type, m.tonnage, m.status, m.created_at
      FROM machines m
      JOIN factories f ON f.id = m.factory_id
    `;
    if (factoryId) {
      const { rows } = await pool.query(base + ' WHERE m.factory_id = $1 ORDER BY m.code ASC', [factoryId]);
      return rows;
    }
    const { rows } = await pool.query(base + ' ORDER BY f.code ASC, m.code ASC');
    return rows;
  },

  create: async (data: { factoryId: string; code: string; name: string; type?: string; tonnage?: string }) => {
    const { rows } = await pool.query(
      `INSERT INTO machines (factory_id, code, name, type, tonnage)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, factory_id, code, name, type, tonnage, status`,
      [data.factoryId, data.code, data.name, data.type ?? null, data.tonnage ?? null],
    );
    return rows[0];
  },

  update: async (id: string, data: { code?: string; name?: string; type?: string; tonnage?: string; status?: string; pinHash?: string }) => {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (data.code    !== undefined) { fields.push(`code = $${i++}`);     values.push(data.code); }
    if (data.name    !== undefined) { fields.push(`name = $${i++}`);     values.push(data.name); }
    if (data.type    !== undefined) { fields.push(`type = $${i++}`);     values.push(data.type); }
    if (data.tonnage !== undefined) { fields.push(`tonnage = $${i++}`);  values.push(data.tonnage); }
    if (data.status  !== undefined) { fields.push(`status = $${i++}`);   values.push(data.status); }
    if (data.pinHash !== undefined) { fields.push(`pin_hash = $${i++}`); values.push(data.pinHash); }
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE machines SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, factory_id, code, name, type, tonnage, status`,
      values,
    );
    return rows[0] || null;
  },

  delete: async (id: string) => {
    const { rowCount } = await pool.query('DELETE FROM machines WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
