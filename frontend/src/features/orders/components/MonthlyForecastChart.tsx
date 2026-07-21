import { RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useOrdersContext } from '../context/OrdersContext';
import { ordersService } from '../context/OrdersService';
import type { FukaFilterType } from '../context/OrdersTypes';

export default function MonthlyForecastChart() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const { fukaChartData, fukaFilter, setFukaFilter, monthNames } = useOrdersContext();

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm flex flex-col h-[720px] transition-all">
        {/* Header controls for FUKA */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-800/60 flex-wrap gap-2">
          <div className="text-left">
            <h3 className="font-bold text-slate-800 dark:text-slate-150 text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-500 animate-spin-slow" />
              Beban FUKA (Daily M/C Hours)
            </h3>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Batas Target: 24 jam / hari
            </p>
          </div>

          <select
            value={fukaFilter}
            onChange={(e) => setFukaFilter(e.target.value as FukaFilterType)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-1 text-[10px] font-extrabold uppercase text-slate-700 dark:text-slate-350 cursor-pointer outline-none focus:border-emerald-600"
          >
            <option value="monthN">{ordersService.getShortMonthName(monthNames.monthN)}</option>
            <option value="monthN1">{ordersService.getShortMonthName(monthNames.monthN1)}</option>
            <option value="monthN2">{ordersService.getShortMonthName(monthNames.monthN2)}</option>
            <option value="monthN3">{ordersService.getShortMonthName(monthNames.monthN3)}</option>
          </select>
        </div>

        {/* Scrollable Container with Factory Charts */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1">
          {Object.keys(fukaChartData).length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-650 font-bold text-xs">
              Tidak ada data untuk diagram beban FUKA.
            </div>
          ) : (
            Object.keys(fukaChartData).map((factory) => (
              <div key={factory} className="space-y-2">
                <h4 className="font-extrabold text-[10px] text-emerald-700 dark:text-emerald-550 uppercase tracking-widest bg-emerald-50/40 dark:bg-emerald-950/10 px-3 py-1.5 rounded-lg border-l-4 border-emerald-600 text-left">
                  {factory}
                </h4>

                <div className="h-44 w-full bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl p-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fukaChartData[factory]} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                        className="dark:stroke-slate-800"
                      />
                      <XAxis
                        dataKey="machineId"
                        tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 32]}
                        tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 'bold',
                        }}
                      />
                      <ReferenceLine
                        y={24}
                        stroke="#ef4444"
                        strokeDasharray="4 4"
                        label={{
                          value: '24h Limit',
                          fill: '#ef4444',
                          fontSize: 7,
                          position: 'top',
                          fontWeight: 'bold',
                        }}
                      />
                      <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                        {fukaChartData[factory].map((entry: any, index: number) => {
                          const isOverload = entry.hours > 24;
                          const fillHex = isOverload ? '#ef4444' : colorPrimary;
                          return <Cell key={`cell-${index}`} fill={fillHex} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
