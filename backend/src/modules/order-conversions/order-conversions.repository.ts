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

  deleteAll: async () => {
    await pool.query('TRUNCATE TABLE order_conversions');
  },

  bulkImport: async (mappings: { cust_part_number: string; cust_sebango?: string; prod_sebango: string; part_category?: string }[]) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const m of mappings) {
        // Check if mapping already exists for this customer part number and production sebango
        const { rows } = await client.query(
          `SELECT id FROM order_conversions 
           WHERE cust_part_number = $1 AND prod_sebango = $2`,
          [m.cust_part_number, m.prod_sebango]
        );
        if (rows.length > 0) {
          const { rows: updated } = await client.query(
            `UPDATE order_conversions 
             SET cust_sebango = $1, part_category = $2 
             WHERE id = $3 RETURNING *`,
            [m.cust_sebango ?? 'CUST-SEB', m.part_category ?? 'big', rows[0].id]
          );
          results.push(updated[0]);
        } else {
          const { rows: inserted } = await client.query(
            `INSERT INTO order_conversions (cust_part_number, cust_sebango, prod_sebango, part_category)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [m.cust_part_number, m.cust_sebango ?? 'CUST-SEB', m.prod_sebango, m.part_category ?? 'big']
          );
          results.push(inserted[0]);
        }
      }
      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

