import { pool } from '../../config/database';

export const factoriesRepository = {
  findAll: async () => {
    const { rows } = await pool.query('SELECT id, code, name, location, created_at FROM factories ORDER BY code ASC');
    return rows;
  },

  findById: async (id: string) => {
    const { rows } = await pool.query('SELECT id, code, name, location FROM factories WHERE id = $1', [id]);
    return rows[0] || null;
  },

  create: async (code: string, name: string, location?: string) => {
    const { rows } = await pool.query(
      'INSERT INTO factories (code, name, location) VALUES ($1, $2, $3) RETURNING id, code, name, location, created_at',
      [code.toUpperCase(), name, location ?? null],
    );
    return rows[0];
  },

  update: async (id: string, data: { code?: string; name?: string; location?: string }) => {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (data.code)     { fields.push(`code = $${i++}`);     values.push(data.code.toUpperCase()); }
    if (data.name)     { fields.push(`name = $${i++}`);     values.push(data.name); }
    if (data.location !== undefined) { fields.push(`location = $${i++}`); values.push(data.location); }
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE factories SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, code, name, location`,
      values,
    );
    return rows[0] || null;
  },

  delete: async (id: string) => {
    const { rowCount } = await pool.query('DELETE FROM factories WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
