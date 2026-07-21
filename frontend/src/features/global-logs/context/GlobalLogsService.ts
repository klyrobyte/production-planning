import { format } from 'date-fns';
import api from '../../../shared/lib/axios';
import type { LogItem, LogFilterParams, FetchLogsResult } from './GlobalLogsTypes';

export class GlobalLogsService {
  // ── NETWORK API LOGIC ──

  async fetchLogs(params: LogFilterParams): Promise<FetchLogsResult> {
    try {
      const queryParams: Record<string, any> = {
        page: params.page,
        limit: params.limit,
      };

      if (params.username) queryParams.username = params.username;
      if (params.endpoint) queryParams.endpoint = params.endpoint;
      if (params.method) queryParams.method = params.method;
      if (params.status_code) queryParams.status_code = params.status_code;

      const res = await api.get('/global-logs', { params: queryParams });
      return {
        logs: res.data.data || [],
        meta: res.data.meta || { page: 1, limit: 25, total: 0, total_pages: 1 },
      };
    } catch (err) {
      console.error('Failed to fetch global logs:', err);
      throw err;
    }
  }

  async clearAllLogs(): Promise<void> {
    try {
      await api.delete('/global-logs');
    } catch (err) {
      console.error('Failed to clear global logs:', err);
      throw err;
    }
  }

  // ── REAL-TIME SSE STREAMING LOGIC ──

  connectSSEStream(
    onLogReceived: (log: LogItem) => void,
    onError?: (err: any) => void
  ): () => void {
    const eventSource = new EventSource('/api/global-logs/stream', { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const newLog: LogItem = JSON.parse(event.data);
        onLogReceived(newLog);
      } catch (err) {
        console.error('Error parsing live log event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  }

  // ── CLIENT-SIDE LIVE FILTER EVALUATION LOGIC ──

  matchesFilter(log: LogItem, filters: LogFilterParams): boolean {
    if (filters.username && !log.username?.toLowerCase().includes(filters.username.toLowerCase())) {
      return false;
    }
    if (filters.endpoint && !log.endpoint.toLowerCase().includes(filters.endpoint.toLowerCase())) {
      return false;
    }
    if (filters.method && log.method.toUpperCase() !== filters.method.toUpperCase()) {
      return false;
    }
    if (filters.status_code && log.status_code !== parseInt(filters.status_code, 10)) {
      return false;
    }
    return true;
  }

  // ── FORMATTING & PRESENTATION LOGIC ──

  getStatusBadgeClass(code: number | null): string {
    if (!code) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    if (code >= 200 && code < 300)
      return 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400';
    if (code >= 300 && code < 400)
      return 'bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400';
    if (code >= 400 && code < 500)
      return 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
    return 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400';
  }

  getMethodBadgeClass(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50';
      case 'POST':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
      case 'PUT':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
      case 'DELETE':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
      default:
        return 'bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-350 border border-slate-100 dark:border-slate-700/50';
    }
  }

  formatTimestamp(timestamp: string): string {
    try {
      return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
    } catch {
      return timestamp;
    }
  }

  parseLimitValue(limit: string | number): number {
    if (limit === 'all') return Infinity;
    return parseInt(String(limit), 10) || 25;
  }
}

export const globalLogsService = new GlobalLogsService();
