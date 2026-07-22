import { pool } from '../config/database';

/**
 * Resolves a raw machine input string to a machine record from the DB.
 * Handles common input variations (uppercase, trimmed whitespace, etc).
 * Returns null if no matching active machine is found.
 */
export const resolveMachine = async (rawInput: string) => {
  const normalized = rawInput.trim().toUpperCase();

  const { rows } = await pool.query(
    `SELECT m.id, m.code, m.name, m.factory_id, f.code AS factory_code
     FROM machines m
     JOIN factories f ON f.id = m.factory_id
     WHERE (UPPER(m.code) = $1 OR UPPER(m.name) = $1)
       AND m.status = 'active'
     LIMIT 1`,
    [normalized],
  );

  return rows[0] || null;
};
