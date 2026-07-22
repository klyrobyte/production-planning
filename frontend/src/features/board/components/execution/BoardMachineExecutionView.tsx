import { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Clock, Check, Wrench, Play } from 'lucide-react';
import { useProduction, getUniqueMachineKey } from '../../../production/context/ProductionContext';

interface BoardMachineExecutionViewProps {
  machine: string;
  factory: string;
  machineKey?: string;
  selectedDate: string;
}

const statusChip: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-500 dark:bg-slate-800',
  dandori: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  running: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  completed: 'bg-slate-100 text-slate-400 dark:bg-slate-800/50',
};

export function BoardMachineExecutionView({
  machine,
  factory,
  machineKey: propsMachineKey,
  selectedDate,
}: BoardMachineExecutionViewProps) {
  const machineKey = propsMachineKey || getUniqueMachineKey(factory, machine);
  const planKey = `${selectedDate}_${machineKey}`;

  const { machineJobs, logs, activeAbnormalities, activeNgs } = useProduction();

  const jobs = machineJobs[planKey] || [];
  const logList = logs[planKey] || [];
  const abnormality = activeAbnormalities[planKey] ?? { isAbnormal: false, type: '', start: '' };
  const ngState = activeNgs[planKey] ?? { isNg: false, type: '', start: '' };

  const activeJob = useMemo(
    () => jobs.find((j) => j.status === 'running' || j.status === 'dandori') ?? null,
    [jobs]
  );

  const queueJobs = useMemo(
    () => jobs.filter((j) => j.id !== activeJob?.id),
    [jobs, activeJob]
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 space-y-5">
      {/* Active Status Banners */}
      {abnormality.isAbnormal && (
        <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 border border-rose-250 dark:bg-rose-950/20 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider">Abnormal Stop Active</p>
            <p className="text-[10px] mt-0.5 font-bold">
              {abnormality.type} — since {abnormality.start}
            </p>
          </div>
        </div>
      )}

      {ngState.isNg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider">NG Quality Issue Active</p>
            <p className="text-[10px] mt-0.5 font-bold">
              {ngState.type} — since {ngState.start}
            </p>
          </div>
        </div>
      )}

      {/* Two-Column Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT MAIN COLUMN: Queue */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* Active Job Panel (Read-only) */}
          {activeJob && (
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between relative">
              {activeJob.status === 'dandori' ? (
                <div className="bg-white dark:bg-slate-950 flex flex-col h-full rounded-2xl overflow-hidden border border-blue-200 dark:border-blue-900/50">
                  <div className="p-4 border-b border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-300 animate-ping shadow-[0_0_8px_rgba(147,197,253,0.8)]"></div>
                      <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Wrench className="w-4 h-4" /> Dandori Setup Mode
                      </h3>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">SETUP TIMELINE</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold font-mono text-white">
                        {activeJob.timeRange}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 text-left">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0 mt-1">
                          <Clock className="w-8 h-8 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">
                            Upcoming Machine Configuration
                          </h4>
                          <div className="text-xl font-black font-mono text-slate-800 dark:text-white tracking-tight">
                            {activeJob.model}
                          </div>
                          <div className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase mt-0.5">
                            {activeJob.partName}
                          </div>
                          <p className="text-[10px] text-slate-550 font-medium mt-2">
                            Mold: <span className="font-bold font-mono">{activeJob.mold || 'N/A'}</span> &nbsp;•&nbsp;
                            Material: <span className="font-bold">{activeJob.material || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-950 flex flex-col h-full rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-900/50">
                  <div className="p-4 border-b border-emerald-100 dark:border-emerald-900/50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-300 animate-ping shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        <Play className="w-4 h-4" /> Running Mode
                      </h3>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold">EST. SHIFT TIME</span>
                      <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold font-mono text-white">
                        {activeJob.timeRange}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                          Part Number / Model
                        </p>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5 font-mono">
                          {activeJob.model}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 uppercase mt-1">{activeJob.partName}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-2">
                          Mold:{' '}
                          <span className="font-bold text-slate-600 dark:text-slate-350 font-mono">
                            {activeJob.mold || 'N/A'}
                          </span>{' '}
                          &nbsp;•&nbsp; Material:{' '}
                          <span className="font-bold text-slate-600 dark:text-slate-350">
                            {activeJob.material || 'N/A'}
                          </span>
                        </p>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Customer</p>
                        <span className="inline-block bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1 text-slate-800 dark:text-white font-black text-lg border rounded mt-1">
                          {activeJob.customer}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800/80">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Production Progress
                        </span>
                        <div className="flex items-baseline gap-1.5 font-mono">
                          <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                            {activeJob.actualQty}
                          </span>
                          <span className="text-sm font-bold text-slate-400">/ {activeJob.qtyLot} pcs</span>
                        </div>
                      </div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all flex items-center justify-end pr-2 overflow-hidden"
                          style={{
                            width: `${
                              activeJob.qtyLot > 0
                                ? Math.min(100, (activeJob.actualQty / activeJob.qtyLot) * 100)
                                : 0
                            }%`,
                          }}
                        >
                          {activeJob.qtyLot > 0 && Math.round((activeJob.actualQty / activeJob.qtyLot) * 100) > 5 && (
                            <span className="text-[9px] font-black text-white">
                              {Math.round((activeJob.actualQty / activeJob.qtyLot) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-3 text-[10px] text-slate-400 font-bold">
                        <span>
                          Cycle Time: {activeJob.ct}s &nbsp;|&nbsp; Cavity: {activeJob.kav ?? 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Queue */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-1">
              Production Queue
            </h3>
            {queueJobs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Tidak ada plan produksi lainnya hari ini</div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1">
                {queueJobs.map((job) => {
                  const isActive = job.id === activeJob?.id;
                  const isCompleted = job.status === 'completed';
                  return (
                    <div
                      key={job.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-xl border transition-colors ${isActive
                          ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800/50 dark:bg-indigo-900/10'
                          : isCompleted
                            ? 'border-slate-100 bg-slate-50 dark:border-slate-800/50 dark:bg-slate-900/30 opacity-70'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                    >
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusChip[job.status] || ''}`}>
                            {job.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            Shift {(job.shift || 'day').toUpperCase()}
                          </span>
                        </div>
                        <h4 className={`text-base font-black uppercase tracking-tight truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {job.model}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" />Target: {job.qtyLot}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.timeRange}</span>
                        </div>
                      </div>

                      {/* Read-Only Progress */}
                      {isActive && job.status === 'running' && (
                        <div className="w-full sm:w-48 flex-col shrink-0">
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-1 text-indigo-700 dark:text-indigo-400">
                            <span>Progress</span>
                            <span>{job.actualQty} / {job.qtyLot}</span>
                          </div>
                          <div className="h-2 bg-indigo-100 dark:bg-indigo-950/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (job.actualQty / job.qtyLot) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN: Activity Log */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[500px] lg:h-[calc(100vh-12rem)] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Activity Log
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-500">
              {logList.length} logs
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
            {logList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <p className="text-xs">Belum ada aktivitas terekam untuk mesin ini hari ini.</p>
              </div>
            ) : (
              logList.map((log) => (
                <div key={log.id} className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex flex-col items-center shrink-0 mt-0.5 relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 z-10" />
                    <div className="w-px h-full bg-slate-200 dark:bg-slate-800 absolute top-2 left-1/2 -translate-x-1/2" />
                  </div>
                  <div className="flex-1 pb-2">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                      {log.time}
                    </span>
                    <p
                      className={`text-xs mt-1 leading-snug font-medium ${log.type === 'success'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : log.type === 'abnormal'
                            ? 'text-rose-600 dark:text-rose-400'
                            : log.type === 'ng'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      {log.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
