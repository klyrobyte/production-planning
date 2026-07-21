import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useGlobalLogsContext } from '../context/GlobalLogsContext';
import { globalLogsService } from '../context/GlobalLogsService';

export default function GlobalLogsTable() {
  const {
    logs,
    meta,
    page,
    setPage,
    isLoading,
    newLogIds,
  } = useGlobalLogsContext();

  return (
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
                  className={`transition-all duration-500 ${
                    newLogIds.has(log.id)
                      ? 'bg-emerald-50/65 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/20'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-white">
                    {globalLogsService.formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.username ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-slate-800 dark:text-white">
                          {log.username}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-white">
                          {log.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-white italic">SYSTEM / GUEST</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider ${globalLogsService.getMethodBadgeClass(
                        log.method
                      )}`}
                    >
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
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${globalLogsService.getStatusBadgeClass(
                        log.status_code
                      )}`}
                    >
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
            Menampilkan {logs.length} dari{' '}
            <span className="font-extrabold text-slate-800 dark:text-white">{meta.total}</span> logs
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
  );
}
