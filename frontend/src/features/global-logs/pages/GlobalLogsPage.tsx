import { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../shared/lib/axios';

interface LogItem {
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

interface MetaData {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// Render the Superadmin audit logs explorer and management screen
export default function GlobalLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [meta, setMeta] = useState<MetaData>({ page: 1, limit: 25, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number | string>(25);

  // Filter States
  const [searchUsername, setSearchUsername] = useState('');
  const [searchEndpoint, setSearchEndpoint] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [searchStatusCode, setSearchStatusCode] = useState('');

  // Confirmation Modal
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time notification highlight states
  const [newLogIds, setNewLogIds] = useState<Set<string>>(new Set());

  // Fetch logs with active filters and pagination
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (searchUsername) params.username = searchUsername;
      if (searchEndpoint) params.endpoint = searchEndpoint;
      if (selectedMethod) params.method = selectedMethod;
      if (searchStatusCode) params.status_code = searchStatusCode;

      const res = await api.get('/global-logs', { params });
      setLogs(res.data.data || []);
      setMeta(res.data.meta || { page: 1, limit: 25, total: 0, total_pages: 1 });
    } catch (e) {
      console.error('Failed to fetch global logs:', e);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchUsername, searchEndpoint, selectedMethod, searchStatusCode]);

  // Load logs on filter changes or page transition
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Real-time EventSource connection for Server-Sent Events (SSE)
  useEffect(() => {
    if (page !== 1) return;

    // Connect to SSE stream
    const eventSource = new EventSource('/api/global-logs/stream', { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const newLog: LogItem = JSON.parse(event.data);

        // Apply active client-side filters
        if (searchUsername && !newLog.username?.toLowerCase().includes(searchUsername.toLowerCase())) return;
        if (searchEndpoint && !newLog.endpoint.toLowerCase().includes(searchEndpoint.toLowerCase())) return;
        if (selectedMethod && newLog.method.toUpperCase() !== selectedMethod.toUpperCase()) return;
        if (searchStatusCode && newLog.status_code !== parseInt(searchStatusCode, 10)) return;

        setLogs((prev) => {
          // Avoid duplicate items
          if (prev.some((item) => item.id === newLog.id)) return prev;

          // Add to newLogIds to trigger highlights
          setNewLogIds((prevIds) => {
            const nextIds = new Set(prevIds);
            nextIds.add(newLog.id);
            return nextIds;
          });

          // Auto-remove highlight after 3 seconds
          setTimeout(() => {
            setNewLogIds((prevIds) => {
              const nextIds = new Set(prevIds);
              nextIds.delete(newLog.id);
              return nextIds;
            });
          }, 3000);

          const maxItems = limit === 'all' ? Infinity : (parseInt(String(limit), 10) || 25);
          return [newLog, ...(maxItems === Infinity ? prev : prev.slice(0, maxItems - 1))];
        });

        // Increment total logged request count
        setMeta((prev) => ({
          ...prev,
          total: prev.total + 1,
        }));
      } catch (err) {
        console.error('Error parsing live log event:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [page, limit, searchUsername, searchEndpoint, selectedMethod, searchStatusCode]);

  // Handle clearing all logs database entries
  const handleClearAllLogs = async () => {
    setIsClearing(true);
    try {
      await api.delete('/global-logs');
      setShowClearModal(false);
      setPage(1);
      fetchLogs();
    } catch (e) {
      console.error('Failed to clear logs:', e);
    } finally {
      setIsClearing(false);
    }
  };

  // Reset all search parameter inputs
  const handleResetFilters = () => {
    setSearchUsername('');
    setSearchEndpoint('');
    setSelectedMethod('');
    setSearchStatusCode('');
    setPage(1);
  };

  // Helper to color-code HTTP status badge
  const getStatusBadgeClass = (code: number | null) => {
    if (!code) return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    if (code >= 200 && code < 300) return 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400';
    if (code >= 300 && code < 400) return 'bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400';
    if (code >= 400 && code < 500) return 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
    return 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400';
  };

  // Helper to color-code HTTP request methods
  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50';
      case 'POST': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50';
      case 'PUT': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50';
      case 'DELETE': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50';
      default: return 'bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-350 border border-slate-100 dark:border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">Security Audit Trail</p>
            {page === 1 && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">Sistem Audit Logs</h2>
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-100 dark:shadow-none transition hover:bg-rose-700 active:scale-95 cursor-pointer shrink-0"
        >
          <Trash2 className="h-4 w-4" />
          <span>Hapus Semua Logs</span>
        </button>
      </div>

      {/* Search and Filters grid */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-white">Filter Pencarian</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => { setSearchUsername(e.target.value); setPage(1); }}
                placeholder="Cari user..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Endpoint Path</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                value={searchEndpoint}
                onChange={(e) => { setSearchEndpoint(e.target.value); setPage(1); }}
                placeholder="Cari endpoint..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">HTTP Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => { setSelectedMethod(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
            >
              <option value="" className="dark:bg-slate-900">Semua Metode</option>
              <option value="GET" className="dark:bg-slate-900">GET</option>
              <option value="POST" className="dark:bg-slate-900">POST</option>
              <option value="PUT" className="dark:bg-slate-900">PUT</option>
              <option value="DELETE" className="dark:bg-slate-900">DELETE</option>
            </select>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Status Code</label>
            <input
              type="number"
              value={searchStatusCode}
              onChange={(e) => { setSearchStatusCode(e.target.value); setPage(1); }}
              placeholder="e.g. 200"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Tampilkan Baris</label>
            <select
              value={limit}
              onChange={(e) => { setLimit(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
            >
              <option value="25" className="dark:bg-slate-900">25 Baris</option>
              <option value="50" className="dark:bg-slate-900">50 Baris</option>
              <option value="100" className="dark:bg-slate-900">100 Baris</option>
              <option value="500" className="dark:bg-slate-900">500 Baris</option>
              <option value="all" className="dark:bg-slate-900">Semua (Tanpa Limit)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">User / Role</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary"></div>
                      <span>Memuat log data...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada log audit yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className={`transition-all duration-500 ${newLogIds.has(log.id)
                        ? 'bg-emerald-50/65 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/20'
                      }`}>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-white">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.username ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-slate-800 dark:text-white">{log.username}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white">
                            {log.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-white italic">SYSTEM / GUEST</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider ${getMethodBadgeClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-800 dark:text-white break-all max-w-[250px]">
                      {log.endpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-white">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${getStatusBadgeClass(log.status_code)}`}>
                        {log.status_code || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-500 dark:text-white">
                      {log.response_ms ? `${log.response_ms} ms` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4">
            <div className="text-xs font-bold text-slate-500 dark:text-white">
              Menampilkan {logs.length} dari <span className="font-extrabold text-slate-800 dark:text-white">{meta.total}</span> logs
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-black text-slate-700 dark:text-white">
                Halaman {page} dari {meta.total_pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Irreversible Delete Warnings modal overlay */}
      {showClearModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-inner">
              <AlertTriangle className="h-7 w-7 animate-bounce" />
            </div>
            <h3 className="mt-4 text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Hapus Semua Log?</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh log riwayat audit akan dihapus secara total dari database.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batalkan
              </button>
              <button
                onClick={handleClearAllLogs}
                disabled={isClearing}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isClearing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Ya, Hapus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
