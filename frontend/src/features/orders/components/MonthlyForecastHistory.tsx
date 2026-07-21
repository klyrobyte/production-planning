import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useOrdersContext } from '../context/OrdersContext';

export default function MonthlyForecastHistory() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const { historyRecords, handleRestoreHistory, isCommitting } = useOrdersContext();

  return (
    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-full overflow-y-auto">
      {historyRecords.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-650 font-bold text-xs">
          Tidak ada riwayat upload snapshot forecast terdaftar.
        </div>
      ) : (
        historyRecords.map((record) => (
          <div key={record.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-850 dark:text-slate-200 text-xs font-mono">
                  {new Date(record.created_at).toLocaleString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 text-[9px] font-black px-2 py-0.5 rounded border border-slate-200/40 uppercase tracking-wider">
                  {record.itemCount} Parts
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Batch ID: {record.id}</p>
              <div className="flex flex-wrap gap-1 mt-1.5 max-w-xl">
                {record.items.slice(0, 5).map((it: any, idx: number) => (
                  <span
                    key={idx}
                    className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-450 text-[9px] px-1.5 py-0.5 rounded border border-slate-200/40 dark:border-slate-800/40 font-mono font-bold"
                  >
                    {it.sebango || it.partNumber.slice(0, 6)}: {it.monthN.toLocaleString()}
                  </span>
                ))}
                {record.items.length > 5 && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold self-center ml-1">
                    +{record.items.length - 5} lainnya
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleRestoreHistory(record)}
              disabled={isCommitting}
              className="px-4 py-2 text-white text-[10px] font-bold uppercase rounded-xl shadow tracking-wider flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              style={{ backgroundColor: colorPrimary }}
            >
              Restore Plan
            </button>
          </div>
        ))
      )}
    </div>
  );
}
