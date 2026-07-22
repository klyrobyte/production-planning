import React from 'react';
import { Settings2 } from 'lucide-react';

export const MachineStatusLegend: React.FC = () => {
  return (
    <div className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
        <div>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Status Indikator Mesin
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Keterangan warna & kondisi operasional mesin
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/70 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all hover:scale-105 hover:bg-emerald-100/50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Running</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/70 dark:bg-blue-950/20 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold transition-all hover:scale-105 hover:bg-blue-100/50">
          <Settings2 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Dandori / Set-up</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-350/70 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-700 dark:text-amber-455 text-xs font-bold transition-all hover:scale-105 hover:bg-amber-100/50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span>Sedang NG (Quality)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/70 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-bold transition-all hover:scale-105 hover:bg-rose-100/50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span>Abnormal Stop</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-655 dark:text-slate-400 text-xs font-bold transition-all hover:scale-105 hover:bg-slate-100/50">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span>Idle (No Plan)</span>
        </div>
      </div>
    </div>
  );
};
