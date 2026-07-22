import { Trash2, AlertTriangle } from 'lucide-react';
import { useGlobalLogsContext } from '../context/GlobalLogsContext';

export default function GlobalLogsHeader() {
  const {
    page,
    showClearModal,
    setShowClearModal,
    isClearing,
    handleClearAllLogs,
  } = useGlobalLogsContext();

  return (
    <>
      {/* Top action header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">
              Security Audit Trail
            </p>
            {page === 1 && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">
            Sistem Audit Logs
          </h2>
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-100 dark:shadow-none transition hover:bg-rose-700 active:scale-95 cursor-pointer shrink-0"
        >
          <Trash2 className="h-4 w-4" />
          <span>Hapus Semua Logs</span>
        </button>
      </div>

      {/* Clear Logs Warning Modal Overlay */}
      {showClearModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-inner">
              <AlertTriangle className="h-7 w-7 animate-bounce" />
            </div>
            <h3 className="mt-4 text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Hapus Semua Log?
            </h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Seluruh log riwayat audit akan
              dihapus secara total dari database.
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
    </>
  );
}
