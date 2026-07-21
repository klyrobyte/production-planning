import { Trash2 } from 'lucide-react';
import { useDatabaseContext } from '../context/DatabaseContext';

export default function DatabaseHeader() {
  const { pageTab, userRole, isLoading, handleDeleteAllParts, handleDeleteAllConversions } =
    useDatabaseContext();

  const getTitle = () => {
    switch (pageTab) {
      case 'parts':
        return 'Master Parts Database';
      case 'conversions':
        return 'Order Conversions (Data Converter)';
      case 'leaders':
        return 'Leaders Database';
      default:
        return 'Database Management';
    }
  };

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="text-left">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Database Manager
        </p>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-0.5">
          {getTitle()}
        </h2>
      </div>

      {userRole === 'super-admin' && pageTab !== 'leaders' && (
        <button
          onClick={pageTab === 'parts' ? handleDeleteAllParts : handleDeleteAllConversions}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 shadow-lg transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>{pageTab === 'parts' ? 'Hapus Semua Parts' : 'Hapus Semua Mappings'}</span>
        </button>
      )}
    </div>
  );
}
