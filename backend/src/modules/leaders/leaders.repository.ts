import { pool } from '../../config/database';

export const leadersRepository = {
  // Returns all leaders without exposing pin fields
  findAll: async () => {
    const { rows } = await pool.query('SELECT id, name, created_at FROM leaders ORDER BY name ASC');
    return rows;
  },

  // Used only by the "reveal PIN" feature — planner only
  findWithPin: async (id: string) => {
    const { rows } = await pool.query('SELECT id, name, pin_encrypted FROM leaders WHERE id = $1', [id]);
    return rows[0] || null;
  },

  findByIdForVerify: async (id: string) => {
    const { rows } = await pool.query('SELECT id, pin_hash FROM leaders WHERE id = $1', [id]);
    return rows[0] || null;
  },

  create: async (name: string, pinHash: string, pinEncrypted: string) => {
    const { rows } = await pool.query(
      'INSERT INTO leaders (name, pin_hash, pin_encrypted) VALUES ($1, $2, $3) RETURNING id, name, created_at',
      [name, pinHash, pinEncrypted],
    );
    return rows[0];
  },

  delete: async (id: string) => {
    const { rowCount } = await pool.query('DELETE FROM leaders WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
