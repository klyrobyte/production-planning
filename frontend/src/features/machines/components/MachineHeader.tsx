import { Plus } from 'lucide-react';
import { useMachineContext } from '../context/MachineContext';

export default function MachineHeader() {
  const { isSuperAdmin, colorPrimary, openAddModal } = useMachineContext();

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="text-left">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">Master Data</p>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">
          Machine Management
        </h2>
      </div>

      {isSuperAdmin && (
        <button
          onClick={openAddModal}
          style={{ backgroundColor: colorPrimary }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0 animate-in fade-in duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Mesin</span>
        </button>
      )}
    </div>
  );
}
