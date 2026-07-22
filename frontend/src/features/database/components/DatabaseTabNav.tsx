import { useDatabaseContext } from '../context/DatabaseContext';

export default function DatabaseTabNav() {
  const { pageTab, setPageTab } = useDatabaseContext();

  return (
    <div className="flex bg-slate-100 dark:bg-slate-955 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 gap-0.5 select-none w-fit">
      <button
        onClick={() => setPageTab('parts')}
        className={`px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
          pageTab === 'parts'
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm font-bold border border-slate-250/20'
            : 'text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        Master Parts Database
      </button>
      <button
        onClick={() => setPageTab('conversions')}
        className={`px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
          pageTab === 'conversions'
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm font-bold border border-slate-250/20'
            : 'text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        Data Converter (Order Conversions)
      </button>
      <button
        onClick={() => setPageTab('leaders')}
        className={`px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
          pageTab === 'leaders'
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm font-bold border border-slate-250/20'
            : 'text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        Leaders Database
      </button>
    </div>
  );
}
