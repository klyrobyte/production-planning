import { pool } from '../../config/database';

export interface GlobalLog {
  id: string;
  timestamp: string;
  username: string | null;
  role: string | null;
  method: string;
  endpoint: string;
  ip_address: string;
  status_code: number | null;
  response_ms: number | null;
}

export interface GlobalLogFilters {
  page: number;
  limit: number;
  username?: string;
  method?: string;
  status_code?: number;
  date_from?: string;
  date_to?: string;
  endpoint?: string;
}

export interface PaginatedLogs {
  data: GlobalLog[];
  meta: { page: number; limit: number; total: number; total_pages: number };
}

export async function findLogs(filters: GlobalLogFilters): Promise<PaginatedLogs> {
  const { page, limit, username, method, status_code, date_from, date_to, endpoint } = filters;

  const conditions: string[] = [];
  const params: unknown[]    = [];
  let paramIdx = 1;

  if (username) {
    conditions.push(`username ILIKE $${paramIdx++}`);
    params.push(`%${username}%`);
  }
  if (method) {
    conditions.push(`method = $${paramIdx++}`);
    params.push(method.toUpperCase());
  }
  if (status_code !== undefined) {
    conditions.push(`status_code = $${paramIdx++}`);
    params.push(status_code);
  }
  if (date_from) {
    conditions.push(`timestamp >= $${paramIdx++}`);
    params.push(date_from);
  }
  if (date_to) {
    conditions.push(`timestamp <= $${paramIdx++}`);
    params.push(date_to);
  }
  if (endpoint) {
    conditions.push(`endpoint ILIKE $${paramIdx++}`);
    params.push(`%${endpoint}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total FROM global_logs ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query with pagination
  const offset = (page - 1) * limit;
  const dataResult = await pool.query(
    `SELECT id, timestamp, username, role, method, endpoint, ip_address, status_code, response_ms
       FROM global_logs
       ${where}
       ORDER BY timestamp DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset],
  );

  return {
    data: dataResult.rows,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function deleteAllLogs(): Promise<void> {
  await pool.query('DELETE FROM global_logs');
}
