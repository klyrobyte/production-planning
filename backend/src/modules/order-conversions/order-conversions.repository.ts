import { pool } from '../../config/database';

export const orderConversionsRepository = {
  findAll: async () => {
    const { rows } = await pool.query('SELECT * FROM order_conversions ORDER BY cust_part_number ASC');
    return rows;
  },

  create: async (data: { cust_part_number: string; cust_sebango?: string; prod_sebango: string; part_category?: string }) => {
    const { rows } = await pool.query(
      `INSERT INTO order_conversions (cust_part_number, cust_sebango, prod_sebango, part_category)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.cust_part_number, data.cust_sebango ?? 'CUST-SEB', data.prod_sebango, data.part_category ?? 'big'],
    );
    return rows[0];
  },

  update: async (id: string, data: Partial<{ cust_part_number: string; cust_sebango: string; prod_sebango: string; part_category: string }>) => {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = $${i++}`); values.push(val); }
    }
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE order_conversions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`, values,
    );
    return rows[0] || null;
  },

  delete: async (id: string) => {
    const { rowCount } = await pool.query('DELETE FROM order_conversions WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
