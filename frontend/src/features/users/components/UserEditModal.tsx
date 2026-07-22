import { Edit, X } from 'lucide-react';
import { useUserContext } from '../context/UserContext';

export default function UserEditModal() {
  const {
    showEditModal,
    selectedUser,
    nameInput,
    setNameInput,
    roleInput,
    setRoleInput,
    passwordInput,
    setPasswordInput,
    isSubmitting,
    errorMsg,
    colorPrimary,
    closeModals,
    handleEditUser,
  } = useUserContext();

  if (!showEditModal || !selectedUser) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Edit className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Update Akun: {selectedUser.username}
            </span>
          </div>
          <button
            onClick={closeModals}
            className="rounded-lg p-1 transition hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-white dark:hover:text-white cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs font-bold text-rose-700 dark:text-rose-455 text-left">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEditUser} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Role / Hak Akses *
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
            >
              <option value="super-admin" className="dark:bg-slate-900">
                Super Admin
              </option>
              <option value="planner" className="dark:bg-slate-900">
                Planner
              </option>
              <option value="leader" className="dark:bg-slate-900">
                Leader
              </option>
              <option value="member" className="dark:bg-slate-900">
                Member (Operator)
              </option>
              <option value="production-board" className="dark:bg-slate-900">
                Production Board
              </option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                Password Baru
              </label>
              <span className="text-[9px] font-bold text-slate-400 dark:text-white uppercase">
                Kosongkan jika tidak diubah
              </span>
            </div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Ganti password (opsional)"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={closeModals}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: colorPrimary }}
              className="flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Perbarui Akun'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
