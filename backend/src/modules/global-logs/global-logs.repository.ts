import { redis } from '../../config/redis';
import crypto from 'crypto';

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

const AUDIT_LOGS_KEY = 'audit_logs';
const MAX_LOGS_CAP = 50000; // Capped at 50k logs (covers ~1 month of intensive logs with tiny memory usage)

/**
 * Saves a new log entry to Redis (LPUSH + LTRIM)
 */
export async function saveLog(data: Omit<GlobalLog, 'id' | 'timestamp'>): Promise<GlobalLog> {
  const logItem: GlobalLog = {
    id: `log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    timestamp: new Date().toISOString(),
    ...data
  };

  // Push to the head of the Redis list
  await redis.lpush(AUDIT_LOGS_KEY, JSON.stringify(logItem));
  
  // Trim the list to the defined maximum cap to prevent memory bloat
  await redis.ltrim(AUDIT_LOGS_KEY, 0, MAX_LOGS_CAP - 1);

  return logItem;
}

/**
 * Retrieves paginated and filtered logs from Redis
 */
export async function findLogs(filters: GlobalLogFilters): Promise<PaginatedLogs> {
  const { page, limit, username, method, status_code, date_from, date_to, endpoint } = filters;

  // Retrieve all elements from Redis list
  const rawLogs = await redis.lrange(AUDIT_LOGS_KEY, 0, -1);
  const allLogs: GlobalLog[] = rawLogs.map((item) => JSON.parse(item));

  // Apply filters in-memory
  const filtered = allLogs.filter((log) => {
    if (username && !log.username?.toLowerCase().includes(username.toLowerCase())) {
      return false;
    }
    if (method && log.method.toUpperCase() !== method.toUpperCase()) {
      return false;
    }
    if (status_code !== undefined && log.status_code !== status_code) {
      return false;
    }
    if (date_from && new Date(log.timestamp) < new Date(date_from)) {
      return false;
    }
    if (date_to && new Date(log.timestamp) > new Date(date_to)) {
      return false;
    }
    if (endpoint && !log.endpoint.toLowerCase().includes(endpoint.toLowerCase())) {
      return false;
    }
    return true;
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const pageData = filtered.slice(offset, offset + limit);

  return {
    data: pageData,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Clears all audit logs from Redis
 */
export async function deleteAllLogs(): Promise<void> {
  await redis.del(AUDIT_LOGS_KEY);
}
