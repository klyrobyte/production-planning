import { Check, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useOrdersContext } from '../context/OrdersContext';
import MonthlyForecastImport from './MonthlyForecastImport';
import MonthlyForecastTable from './MonthlyForecastTable';
import MonthlyForecastHistory from './MonthlyForecastHistory';
import MonthlyForecastChart from './MonthlyForecastChart';

export default function MonthlyForecastTab() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const {
    viewState,
    setViewState,
    subTab,
    setTempForecast,
    handleCommit,
    isCommitting,
  } = useOrdersContext();

  return (
    <div className="space-y-6">
      {/* Upload Forecast / Input Controls */}
      <MonthlyForecastImport />

      {/* Preview Header Alert Mode */}
      {viewState === 'preview' && (
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-450 flex items-center justify-center font-black">
              !
            </div>
            <div className="text-left">
              <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Mode Preview Forecast</h4>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                Tinjau nilai volume draf di tabel sebelum menekan tombol Commit untuk memperbarui master data.
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setViewState('active');
                setTempForecast([]);
              }}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold uppercase rounded-xl cursor-pointer"
            >
              Batalkan
            </button>
            <button
              onClick={handleCommit}
              disabled={isCommitting}
              className="w-full sm:w-auto px-5 py-2.5 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: colorPrimary }}
            >
              {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Commit Forecast
            </button>
          </div>
        </div>
      )}

      {/* Main Grid View: Table/History on Left, Recharts Chart on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Table/History Column */}
        <div className="xl:col-span-2 space-y-4 min-w-0">
          {subTab === 'history' && viewState === 'active' ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col h-[720px]">
              <MonthlyForecastHistory />
            </div>
          ) : (
            <MonthlyForecastTable />
          )}
        </div>

        {/* FUKA Load Chart Column */}
        <MonthlyForecastChart />
      </div>
    </div>
  );
}
