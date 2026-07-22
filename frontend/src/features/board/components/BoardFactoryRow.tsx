import { Factory } from 'lucide-react';
import type { BoardFactoryRowProps } from '../context/BoardTypes';
import BoardMachineCard from './BoardMachineCard';

export default function BoardFactoryRow({ factoryRow, maxCols, onMachineClick, resolveStatus }: BoardFactoryRowProps) {
  const runningCount = factoryRow.machines.filter(mc => mc.isRunning).length;
  const problemCount = factoryRow.machines.filter(mc => mc.isAbnormal || mc.isAbnormalLong || mc.isNgActive).length;

  return (
    <section className="flex-1 min-h-[140px] flex items-stretch gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
      {/* Factory label — Sugity orange */}
      <div className="w-44 shrink-0 flex flex-col justify-center px-3 rounded-xl bg-gradient-to-br from-[#E76114] to-[#c95411] text-white shadow-md">
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest mb-1 text-white/85">
          <Factory className="w-3 h-3" /> {factoryRow.plant}
        </span>
        <span className="text-xl font-black uppercase tracking-wide leading-tight drop-shadow-sm">
          {factoryRow.name}
        </span>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
          <span className="text-emerald-100">{runningCount} Run</span>
          <span className="text-white/50">•</span>
          <span className={problemCount > 0 ? 'text-rose-100' : 'text-white/70'}>{problemCount} Issue</span>
          <span className="text-white/50">•</span>
          <span className="text-white/85">{factoryRow.machines.length} MC</span>
        </div>
      </div>

      {/* Machine buttons — uniform width across ALL factories */}
      <div
        className="flex-1 min-w-0 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${maxCols}, minmax(0, 1fr))` }}
      >
        {factoryRow.machines.map(mc => (
          <BoardMachineCard 
            key={mc.id} 
            machine={mc} 
            factoryName={factoryRow.name} 
            status={resolveStatus(mc)}
            onMachineClick={onMachineClick}
          />
        ))}
      </div>
    </section>
  );
}
