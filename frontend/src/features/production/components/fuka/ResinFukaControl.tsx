import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, AlertCircle, Settings2, Info, Play } from 'lucide-react';
import { useProduction, productionService } from '../../context/ProductionContext';

export const ResinFukaControl: React.FC = () => {
  const navigate = useNavigate();
  const { dynamicResinData } = useProduction();

  return (
    <section>
      <div className="flex flex-col gap-6 mt-4">
        {dynamicResinData.map((plantGroup, i) => (
          <div
            key={i}
            className="p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Factory className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <h4 className="font-bold text-slate-700 dark:text-white text-sm">{plantGroup.plant}</h4>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {plantGroup.factories.map((fact, j) => (
                <div key={j} className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-black text-slate-800 dark:text-white">{fact.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest ${productionService.getStatusText(
                            fact.status
                          )}`}
                        >
                          {fact.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-mono flex flex-wrap gap-3 mt-3">
                        {fact.machines.map((mc, k) => {
                          const btn = (
                            <button
                              key={k}
                              onClick={() => navigate(`/production/${mc.code}/pattern`)}
                              className={`px-4 py-2 border rounded-md transition-all duration-300 cursor-pointer font-bold flex gap-2 items-center text-sm shadow-sm ${
                                mc.isAbnormal
                                  ? mc.isAbnormalLong
                                    ? 'bg-rose-200 hover:bg-rose-300 dark:bg-rose-900/60 dark:hover:bg-rose-800/60 text-rose-950 dark:text-rose-100 border-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.95)] ring-2 ring-rose-500/50'
                                    : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-405 border-rose-300 dark:border-rose-800'
                                  : mc.isNgActive
                                  ? 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-405 border-amber-400 dark:border-amber-800 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                                  : mc.isDandori
                                  ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/40 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-405 border-blue-300 dark:border-blue-800'
                                  : mc.isIdle
                                  ? 'bg-slate-105 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-250 dark:border-slate-800'
                                  : 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-405 border-emerald-300 dark:border-emerald-800'
                              }`}
                              title={`${mc.tonnage}T Tonnage - ${
                                mc.isAbnormal
                                  ? mc.isAbnormalLong
                                    ? 'CRITICAL DOWNTIME (>1HR)'
                                    : 'ABNORMAL'
                                  : mc.isNgActive
                                  ? 'SEDANG NG'
                                  : mc.isDandori
                                  ? 'DANDORI'
                                  : mc.isIdle
                                  ? 'IDLE'
                                  : 'RUNNING'
                              }`}
                            >
                              {mc.isAbnormal && (
                                <AlertCircle
                                  className={`w-4 h-4 ${
                                    mc.isAbnormalLong ? 'text-rose-600 animate-bounce' : 'text-rose-500'
                                  }`}
                                />
                              )}
                              {mc.isNgActive && <AlertCircle className="w-4 h-4 text-amber-600" />}
                              {mc.isDandori && <Settings2 className="w-4 h-4" />}
                              {mc.isIdle && <Info className="w-4 h-4 text-slate-405" />}
                              {mc.isRunning && <Play className="w-4 h-4" />}
                              <span className="text-base">{mc.id}</span>
                              <span
                                className={`text-[11px] opacity-80 border-l pl-2 ${
                                  mc.isAbnormal
                                    ? 'border-rose-300 dark:border-rose-800'
                                    : mc.isNgActive
                                    ? 'border-amber-400 dark:border-amber-800'
                                    : mc.isDandori
                                    ? 'border-blue-300 dark:border-blue-800'
                                    : mc.isIdle
                                    ? 'border-slate-300 dark:border-slate-800'
                                    : 'border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                {mc.tonnage}T
                              </span>
                            </button>
                          );

                          return mc.isAbnormal ? (
                            <div key={k} className={`abnormal-wave-wrapper${mc.isAbnormalLong ? ' critical' : ''}`}>
                              {btn}
                            </div>
                          ) : mc.isNgActive ? (
                            <div key={k} className="ng-wave-wrapper">
                              {btn}
                            </div>
                          ) : (
                            <React.Fragment key={k}>{btn}</React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="flex items-baseline gap-1 justify-start sm:justify-end">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                          {fact.fuka.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Hr/Day</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mt-1">
                        FUKA Load
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full ${productionService.getStatusColor(fact.status)}`}
                      style={{ width: `${(fact.fuka / fact.maxFuka) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
