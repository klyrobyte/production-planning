import { Plus } from 'lucide-react';
import { useUserContext } from '../context/UserContext';

export default function UserHeader() {
  const { colorPrimary, openAddModal } = useUserContext();

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="text-left">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Account Management</p>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">Kelola User Akun</h2>
      </div>

      <button
        onClick={openAddModal}
        style={{ backgroundColor: colorPrimary }}
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
      >
        <Plus className="h-4 w-4" />
        <span>Tambah User Baru</span>
      </button>
    </div>
  );
}
