import { Play, Settings2, AlertCircle, Info } from 'lucide-react';
import type { MachineStatus, BoardMachineCardProps } from '../context/BoardTypes';
import { QualityQIcon } from './BoardHeader';

const STATUS_STYLE: Record<MachineStatus, { btn: string; label: string }> = {
  running: {
    btn: 'bg-emerald-100 dark:bg-emerald-950/40 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600',
    label: 'Running'
  },
  dandori: {
    btn: 'bg-blue-100 dark:bg-blue-950/40 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-600',
    label: 'Dandori'
  },
  ng: {
    btn: 'bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border-amber-500 dark:border-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.55)]',
    label: 'NG'
  },
  abnormal: {
    btn: 'bg-rose-100 dark:bg-rose-950/40 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 border-rose-400 dark:border-rose-600',
    label: 'Abnormal'
  },
  'abnormal-critical': {
    btn: 'bg-rose-200 dark:bg-rose-900/60 hover:bg-rose-300 dark:hover:bg-rose-800 text-rose-950 dark:text-rose-100 border-rose-600 dark:border-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.95)] ring-2 ring-rose-500/50',
    label: 'Abnormal >1H'
  },
  idle: {
    btn: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    label: 'Idle'
  }
};

const StatusIcon = ({ status, className }: { status: MachineStatus; className: string }) => {
  switch (status) {
    case 'running':
      return <Play className={className} />;
    case 'dandori':
      return <Settings2 className={`${className} animate-spin`} style={{ animationDuration: '6s' }} />;
    case 'ng':
      return <QualityQIcon className={className} />;
    case 'abnormal':
      return <AlertCircle className={className} />;
    case 'abnormal-critical':
      return <AlertCircle className={`${className} animate-bounce`} />;
    case 'idle':
    default:
      return <Info className={className} />;
  }
};

export default function BoardMachineCard({ machine, factoryName, status, onMachineClick }: BoardMachineCardProps) {
  const style = STATUS_STYLE[status];

  const btn = (
    <button
      onClick={() => onMachineClick(machine.code, machine.tonnage, factoryName)}
      className={`w-full h-full min-w-0 border-2 rounded-md transition-all duration-300 cursor-pointer font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm px-1 ${style.btn}`}
      title={`${factoryName} ${machine.code} — ${style.label}`}
    >
      <StatusIcon status={status} className="w-7 h-7 text-[15px]" />
      <span className="text-lg xl:text-xl font-black leading-none tracking-tight whitespace-nowrap">
        {machine.id}
      </span>
      <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-80 whitespace-nowrap">
        {style.label}
      </span>
    </button>
  );

  if (status === 'abnormal' || status === 'abnormal-critical') {
    return (
      <div className={`abnormal-wave-wrapper w-full h-full min-w-0${status === 'abnormal-critical' ? ' critical' : ''}`}>
        {btn}
      </div>
    );
  }
  
  if (status === 'ng') {
    return (
      <div className="ng-wave-wrapper w-full h-full min-w-0">
        {btn}
      </div>
    );
  }
  
  return <>{btn}</>;
}
