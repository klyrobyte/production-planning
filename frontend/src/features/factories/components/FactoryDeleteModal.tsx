import { useFactoryContext } from '../context/FactoryContext';

export default function FactoryDeleteModal() {
  const {
    showDeleteModal,
    deleteTarget,
    isSubmitting,
    closeDeleteModal,
    handleDeleteConfirm,
  } = useFactoryContext();

  if (!showDeleteModal || !deleteTarget) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-left animate-in zoom-in-95 duration-200">
        <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
          Hapus Data Pabrik?
        </h3>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          Apakah Anda yakin ingin menghapus pabrik{' '}
          <span className="font-extrabold text-slate-700 dark:text-white">"{deleteTarget.name}"</span>?
          Tindakan ini juga akan menghapus seluruh data mesin yang terasosiasi dengan pabrik ini dari database.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={closeDeleteModal}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 dark:border-slate-750 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              'Ya, Hapus'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
