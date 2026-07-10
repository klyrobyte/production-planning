import { pool } from '../../config/database';

export const usersRepository = {
  findAll: async () => {
    const { rows } = await pool.query(
      'SELECT id, uid, username, role, name, photo_url, created_at FROM users ORDER BY created_at ASC',
    );
    return rows;
  },

  findByUsername: async (username: string) => {
    const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    return rows[0] || null;
  },

  create: async (data: { uid: string; username: string; role: string; name: string; passwordHash: string }) => {
    const { rows } = await pool.query(
      `INSERT INTO users (uid, username, role, name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, uid, username, role, name, created_at`,
      [data.uid, data.username, data.role, data.name, data.passwordHash],
    );
    return rows[0];
  },

  update: async (id: string, data: { role?: string; name?: string; passwordHash?: string }) => {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (data.role !== undefined)         { fields.push(`role = $${i++}`);          values.push(data.role); }
    if (data.name !== undefined)         { fields.push(`name = $${i++}`);          values.push(data.name); }
    if (data.passwordHash !== undefined) { fields.push(`password_hash = $${i++}`); values.push(data.passwordHash); }
    if (!fields.length) return null;

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, uid, username, role, name`,
      values,
    );
    return rows[0] || null;
  },

  delete: async (id: string) => {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
