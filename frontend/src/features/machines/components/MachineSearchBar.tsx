import { Search } from 'lucide-react';
import { useMachineContext } from '../context/MachineContext';

export default function MachineSearchBar() {
  const {
    searchQuery,
    setSearchQuery,
    filterFactoryId,
    setFilterFactoryId,
    factories,
  } = useMachineContext();

  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-left flex flex-col gap-4 md:flex-row md:items-center justify-between">
      <div className="relative w-full max-w-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari mesin berdasarkan kode, nama, atau tipe..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white">
          Filter Pabrik:
        </span>
        <select
          value={filterFactoryId}
          onChange={(e) => setFilterFactoryId(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="">Semua Pabrik</option>
          {factories.map((f) => (
            <option key={f.id} value={f.id}>
              {f.code} - {f.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
