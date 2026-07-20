import { pool } from '../../config/database';

export interface BtPrinter {
  id: number;
  name: string;
  service_uuid: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const btPrintersRepository = {
  findAll: async (): Promise<BtPrinter[]> => {
    const { rows } = await pool.query(
      'SELECT * FROM bt_printers ORDER BY name ASC',
    );
    return rows;
  },

  findByUuid: async (serviceUuid: string): Promise<BtPrinter | null> => {
    const { rows } = await pool.query(
      'SELECT * FROM bt_printers WHERE service_uuid = $1',
      [serviceUuid],
    );
    return rows[0] || null;
  },

  /** Upsert by service_uuid — updates name/notes if already exists */
  upsert: async (
    name: string,
    serviceUuid: string,
    notes?: string,
  ): Promise<BtPrinter> => {
    const { rows } = await pool.query(
      `INSERT INTO bt_printers (name, service_uuid, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (service_uuid) DO UPDATE
         SET name       = EXCLUDED.name,
             notes      = COALESCE(EXCLUDED.notes, bt_printers.notes),
             updated_at = NOW()
       RETURNING *`,
      [name, serviceUuid, notes ?? null],
    );
    return rows[0];
  },

  create: async (
    name: string,
    serviceUuid: string,
    notes?: string,
  ): Promise<BtPrinter> => {
    const { rows } = await pool.query(
      `INSERT INTO bt_printers (name, service_uuid, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, serviceUuid, notes ?? null],
    );
    return rows[0];
  },

  update: async (
    id: number,
    name: string,
    serviceUuid: string,
    notes?: string,
  ): Promise<BtPrinter | null> => {
    const { rows } = await pool.query(
      `UPDATE bt_printers
       SET name = $1, service_uuid = $2, notes = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name, serviceUuid, notes ?? null, id],
    );
    return rows[0] || null;
  },

  delete: async (id: number): Promise<boolean> => {
    const { rowCount } = await pool.query(
      'DELETE FROM bt_printers WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};
