import { useState } from 'react';
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../../shared/lib/axios';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import MasterPartsTab from '../components/MasterPartsTab';
import OrderConversionsTab from '../components/OrderConversionsTab';

export default function DatabasePage() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role;

  // Page Tab state: 'parts' | 'conversions'
  const [pageTab, setPageTab] = useState<'parts' | 'conversions'>('parts');

  // Triggers to tell child tabs to refresh their lists
  const [partsRefreshTrigger, setPartsRefreshTrigger] = useState(0);
  const [conversionsRefreshTrigger, setConversionsRefreshTrigger] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteAllParts = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SELURUH master parts dari database? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.delete('/parts');
      setSuccessMsg('Seluruh master parts berhasil dihapus dari database.');
      setPartsRefreshTrigger(prev => prev + 1);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menghapus seluruh master parts.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllConversions = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SELURUH mapping order conversions? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.delete('/order-conversions');
      setSuccessMsg('Seluruh mapping order conversions berhasil dihapus.');
      setConversionsRefreshTrigger(prev => prev + 1);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menghapus seluruh mapping.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 text-slate-800 dark:text-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Database Manager</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-0.5">
            {pageTab === 'parts' ? 'Master Parts Database' : 'Order Conversions (Data Converter)'}
          </h2>
        </div>
        {userRole === 'super-admin' && (
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

      {/* Global Deletion Feedback */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-955/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-450 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-100 dark:border-rose-955/30 bg-rose-50 dark:bg-rose-955/20 p-4 text-xs font-bold text-rose-705 dark:text-rose-455 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Page Tabs */}
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
      </div>

      {/* Conditional rendering of sub-feature tabs */}
      {pageTab === 'parts' ? (
        <MasterPartsTab refreshTrigger={partsRefreshTrigger} />
      ) : (
        <OrderConversionsTab refreshTrigger={conversionsRefreshTrigger} />
      )}
    </div>
  );
}
