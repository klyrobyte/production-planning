import { ShieldAlert } from 'lucide-react';
import { useUserContext } from '../context/UserContext';

export default function UserDeleteModal() {
  const {
    showDeleteModal,
    selectedUser,
    isSubmitting,
    errorMsg,
    closeModals,
    handleDeleteUser,
  } = useUserContext();

  if (!showDeleteModal || !selectedUser) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-inner">
          <ShieldAlert className="h-7 w-7 animate-bounce" />
        </div>
        <h3 className="mt-4 text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
          Hapus Akun User?
        </h3>
        <p className="mt-2 text-slate-500 dark:text-white text-xs leading-relaxed">
          Apakah Anda yakin ingin menghapus akun{' '}
          <span className="font-extrabold text-slate-800 dark:text-white">{selectedUser.username}</span>?
          Pengguna ini tidak akan dapat login lagi ke workstation sistem.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-2.5 text-xs font-bold text-rose-700 dark:text-rose-455 text-left">
            {errorMsg}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={closeModals}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
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
