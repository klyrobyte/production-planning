import { AppError } from '../../common/errors/AppError';
import {
  findLogs,
  deleteAllLogs,
  GlobalLogFilters,
  PaginatedLogs,
} from './global-logs.repository';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const DEFAULT_PAGE  = 1;

export async function getLogs(query: Record<string, unknown>): Promise<PaginatedLogs> {
  const page  = Math.max(1, parseInt(String(query.page  ?? DEFAULT_PAGE),  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  const filters: GlobalLogFilters = { page, limit };

  if (query.username)    filters.username    = String(query.username);
  if (query.method)      filters.method      = String(query.method);
  if (query.endpoint)    filters.endpoint    = String(query.endpoint);
  if (query.date_from)   filters.date_from   = String(query.date_from);
  if (query.date_to)     filters.date_to     = String(query.date_to);

  if (query.status_code !== undefined) {
    const code = parseInt(String(query.status_code), 10);
    if (isNaN(code) || code < 100 || code > 599) {
      throw new AppError(400, 'VALIDATION_ERROR', 'status_code harus berupa HTTP status code yang valid (100-599)');
    }
    filters.status_code = code;
  }

  return findLogs(filters);
}

export async function clearLogs(): Promise<void> {
  await deleteAllLogs();
}
