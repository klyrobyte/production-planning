import { Search, Filter, RefreshCcw } from 'lucide-react';
import { useGlobalLogsContext } from '../context/GlobalLogsContext';

export default function GlobalLogsFilters() {
  const {
    searchUsername,
    setSearchUsername,
    searchEndpoint,
    setSearchEndpoint,
    selectedMethod,
    setSelectedMethod,
    searchStatusCode,
    setSearchStatusCode,
    limit,
    setLimit,
    setPage,
    handleResetFilters,
  } = useGlobalLogsContext();

  return (
    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-white">
          Filter Pencarian
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => {
                setSearchUsername(e.target.value);
                setPage(1);
              }}
              placeholder="Cari user..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
            Endpoint Path
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={searchEndpoint}
              onChange={(e) => {
                setSearchEndpoint(e.target.value);
                setPage(1);
              }}
              placeholder="Cari endpoint..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
            HTTP Method
          </label>
          <select
            value={selectedMethod}
            onChange={(e) => {
              setSelectedMethod(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
          >
            <option value="" className="dark:bg-slate-900">Semua Metode</option>
            <option value="GET" className="dark:bg-slate-900">GET</option>
            <option value="POST" className="dark:bg-slate-900">POST</option>
            <option value="PUT" className="dark:bg-slate-900">PUT</option>
            <option value="DELETE" className="dark:bg-slate-900">DELETE</option>
          </select>
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
            Status Code
          </label>
          <input
            type="number"
            value={searchStatusCode}
            onChange={(e) => {
              setSearchStatusCode(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. 200"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
            Tampilkan Baris
          </label>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
          >
            <option value="25" className="dark:bg-slate-900">25 Baris</option>
            <option value="50" className="dark:bg-slate-900">50 Baris</option>
            <option value="100" className="dark:bg-slate-900">100 Baris</option>
            <option value="500" className="dark:bg-slate-900">500 Baris</option>
            <option value="all" className="dark:bg-slate-900">Semua (Tanpa Limit)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleResetFilters}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
