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
  const [limit] = useState(25);
  
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

          return [newLog, ...prev.slice(0, limit - 1)];
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
    if (!code) return 'bg-slate-100 text-slate-600';
    if (code >= 200 && code < 300) return 'bg-emerald-50 border border-emerald-100 text-emerald-700';
    if (code >= 300 && code < 400) return 'bg-sky-50 border border-sky-100 text-sky-700';
    if (code >= 400 && code < 500) return 'bg-amber-50 border border-amber-100 text-amber-700';
    return 'bg-rose-50 border border-rose-100 text-rose-700';
  };

  // Helper to color-code HTTP request methods
  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'POST': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'PUT': return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Security Audit Trail</p>
            {page === 1 && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 mt-0.5">Sistem Audit Logs</h2>
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-100 transition hover:bg-rose-700 active:scale-95 cursor-pointer shrink-0"
        >
          <Trash2 className="h-4 w-4" />
          <span>Hapus Semua Logs</span>
        </button>
      </div>

      {/* Search and Filters grid */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-600">Filter Pencarian</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => { setSearchUsername(e.target.value); setPage(1); }}
                placeholder="Cari user..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endpoint Path</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                value={searchEndpoint}
                onChange={(e) => { setSearchEndpoint(e.target.value); setPage(1); }}
                placeholder="Cari endpoint..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">HTTP Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => { setSelectedMethod(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-primary focus:bg-white cursor-pointer"
            >
              <option value="">Semua Metode</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Code</label>
            <input
              type="number"
              value={searchStatusCode}
              onChange={(e) => { setSearchStatusCode(e.target.value); setPage(1); }}
              placeholder="e.g. 200"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-primary focus:bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">User / Role</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-primary"></div>
                      <span>Memuat log data...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada log audit yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`transition-all duration-500 ${
                      newLogIds.has(log.id) 
                        ? 'bg-emerald-50 border-l-4 border-l-emerald-500' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.username ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-slate-800">{log.username}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                            {log.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">SYSTEM / GUEST</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider ${getMethodBadgeClass(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-800 break-all max-w-[250px]">
                      {log.endpoint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${getStatusBadgeClass(log.status_code)}`}>
                        {log.status_code || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-slate-500">
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
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <div className="text-xs font-bold text-slate-500">
              Menampilkan {logs.length} dari <span className="font-extrabold text-slate-800">{meta.total}</span> logs
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-xs font-black text-slate-700">
                Halaman {page} dari {meta.total_pages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={page === meta.total_pages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
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
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
              <AlertTriangle className="h-7 w-7 animate-bounce" />
            </div>
            <h3 className="mt-4 text-lg font-black uppercase tracking-wider text-slate-800">Hapus Semua Log?</h3>
            <p className="mt-2 text-slate-500 text-xs leading-relaxed">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh log riwayat audit akan dihapus secara total dari database.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 cursor-pointer"
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
