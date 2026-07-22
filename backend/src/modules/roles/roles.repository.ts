import { pool } from '../../config/database';

export const rolesRepository = {
  findAll: async () => {
    const { rows } = await pool.query('SELECT id, name, display_name, created_at FROM roles ORDER BY created_at ASC');
    return rows;
  },

  findByName: async (name: string) => {
    const { rows } = await pool.query('SELECT id FROM roles WHERE name = $1', [name]);
    return rows[0] || null;
  },

  create: async (name: string, displayName: string) => {
    const { rows } = await pool.query(
      'INSERT INTO roles (name, display_name) VALUES ($1, $2) RETURNING id, name, display_name, created_at',
      [name, displayName],
    );
    return rows[0];
  },

  delete: async (id: string) => {
    const { rowCount } = await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },

  isUsedByUsers: async (name: string) => {
    const { rows } = await pool.query('SELECT 1 FROM users WHERE role = $1 LIMIT 1', [name]);
    return rows.length > 0;
  },
};
