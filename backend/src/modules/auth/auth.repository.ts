import { pool } from '../../config/database';

export const authRepository = {
  // Finds a user by username (for login)
  findByUsername: async (username: string) => {
    const { rows } = await pool.query(
      'SELECT id, uid, username, role, name, password_hash FROM users WHERE username = $1',
      [username],
    );
    return rows[0] || null;
  },

  // Finds a user by ID (for /me endpoint)
  findById: async (id: string) => {
    const { rows } = await pool.query(
      'SELECT id, uid, username, role, name FROM users WHERE id = $1',
      [id],
    );
    return rows[0] || null;
  },

  // Verifies a machine's member PIN hash
  findMachinePin: async (machineId: string) => {
    const { rows } = await pool.query(
      'SELECT pin_hash FROM machines WHERE id = $1 AND status = $2',
      [machineId, 'active'],
    );
    return rows[0]?.pin_hash as string | null;
  },
};
