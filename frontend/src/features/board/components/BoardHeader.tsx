import { Play, Settings2, AlertCircle, Info, LogOut, ArrowLeft } from 'lucide-react';
import { InjectionMoldingIcon } from '../../production/components/shared/ProductionIcons';
import type { BoardHeaderProps } from '../context/BoardTypes';

// Circled "Q" quality mark for machines currently flagged NG
export const QualityQIcon = ({ className = '' }: { className?: string }) => (
  <span
    className={`rounded-full border-[3px] border-current font-black flex items-center justify-center leading-none shrink-0 ${className}`}
  >
    Q
  </span>
);

export default function BoardHeader({ timeStr, dateStr, userRole, onLogout, onBack }: BoardHeaderProps) {
  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-5 gap-4 bg-gradient-to-r from-[#037233] via-[#04873c] to-[#025c27] text-white shadow-[0_4px_20px_-4px_rgba(3,114,51,0.4)]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-base font-black tracking-wider uppercase leading-tight truncate drop-shadow-sm">Production Board</span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/80 leading-none mt-0.5 truncate">
            Live Monitoring System
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2.5 ml-3 px-3.5 py-1.5 bg-white/10 rounded-xl border border-white/20 shadow-md shrink-0">
          <InjectionMoldingIcon className="w-6 h-6 text-white" />
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">Resin Injection</span>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-emerald-100 text-[10px] font-bold uppercase tracking-wider">
          <Play className="w-3 h-3" /> Running
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-blue-100 text-[10px] font-bold uppercase tracking-wider">
          <Settings2 className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} /> Dandori
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-amber-100 text-[10px] font-bold uppercase tracking-wider">
          <QualityQIcon className="w-3.5 h-3.5 text-[8px]" /> NG
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-rose-100 text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle className="w-3 h-3" /> Abnormal
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/25 text-white/70 text-[10px] font-bold uppercase tracking-wider">
          <Info className="w-3 h-3" /> Idle
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="text-xl font-black font-mono tracking-widest leading-none drop-shadow-sm">{timeStr}</div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-white/80 mt-1">{dateStr}</div>
        </div>
        {userRole === 'super-admin' ? (
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onLogout}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-rose-500/80 border border-white/25 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Keluar dari Production Board"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
