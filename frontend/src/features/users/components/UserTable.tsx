import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUserContext } from '../context/UserContext';

export default function UserTable() {
  const {
    filteredUsers,
    isLoading,
    getRoleBadgeClass,
    openEditModal,
    openDeleteModal,
  } = useUserContext();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
              <th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Otorisasi / Role</th>
              <th className="px-6 py-4">Waktu Registrasi</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary"></div>
                    <span>Memuat data pengguna...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada akun pengguna yang sesuai dengan pencarian.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white font-extrabold text-[10px] uppercase">
                        {user.name.slice(0, 2)}
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-550 dark:text-white">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400 dark:text-white">
                    {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 cursor-pointer"
                        title="Edit User"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-950/30 text-rose-600 dark:text-rose-455 transition hover:bg-rose-50 dark:hover:bg-rose-950/10 active:scale-90 cursor-pointer"
                        title="Hapus User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
