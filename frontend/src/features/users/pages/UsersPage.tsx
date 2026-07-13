import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  ShieldAlert, 
  X 
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../shared/lib/axios';
import { useThemeStore } from '../../../shared/store/useThemeStore';

interface UserItem {
  id: string;
  uid: string;
  username: string;
  role: string;
  name: string;
  created_at: string;
}

// Render the user accounts management view for superadmins
export default function UsersPage() {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Form input states
  const [usernameInput, setUsernameInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('planner');
  const [passwordInput, setPasswordInput] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all user accounts from the backend
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle addition of a new user account
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !nameInput || !passwordInput) {
      setErrorMsg('Semua kolom bertanda bintang wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post('/users', {
        username: usernameInput,
        name: nameInput,
        role: roleInput,
        password: passwordInput
      });
      setSuccessMsg(`User ${usernameInput} berhasil dibuat.`);
      setShowAddModal(false);
      resetForm();
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menambahkan user baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open the edit form modal with existing user values
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setNameInput(user.name);
    setRoleInput(user.role);
    setPasswordInput('');
    setErrorMsg(null);
    setShowEditModal(true);
  };

  // Handle updating an existing user account
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!nameInput) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: Record<string, string> = {
        name: nameInput,
        role: roleInput
      };
      if (passwordInput) {
        payload.password = passwordInput;
      }
      
      await api.put(`/users/${selectedUser.id}`, payload);
      setSuccessMsg(`Data user ${selectedUser.username} berhasil diperbarui.`);
      setShowEditModal(false);
      resetForm();
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui data user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (user: UserItem) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle removing a user account
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setSuccessMsg(`User ${selectedUser.username} berhasil dihapus.`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menghapus user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form values to initial state
  const resetForm = () => {
    setUsernameInput('');
    setNameInput('');
    setRoleInput('planner');
    setPasswordInput('');
    setSelectedUser(null);
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query);
  });

  // Color mapper for user role badges
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-700 dark:text-rose-400';
      case 'planner': return 'bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400';
      case 'leader': return 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
      case 'member': return 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400';
      case 'production-board': return 'bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-purple-700 dark:text-purple-400';
      default: return 'bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Account Management</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">Kelola User Akun</h2>
        </div>

        <button
          onClick={() => { resetForm(); setErrorMsg(null); setShowAddModal(true); }}
          style={{ backgroundColor: colorPrimary }}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      {/* Success Notification Bar */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-750 dark:text-emerald-450 text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {successMsg}
        </div>
      )}

      {/* Search Input Filter */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-left">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari user berdasarkan nama atau username..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Users Data Table */}
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

      {/* Add User Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Registrasi User Baru</span>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleAddUser} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Username *</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Contoh: planner.sc"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Nama Lengkap *</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Role / Hak Akses *</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                >
                  <option value="super-admin" className="dark:bg-slate-900">Super Admin</option>
                  <option value="planner" className="dark:bg-slate-900">Planner</option>
                  <option value="leader" className="dark:bg-slate-900">Leader</option>
                  <option value="member" className="dark:bg-slate-900">Member (Operator)</option>
                  <option value="production-board" className="dark:bg-slate-900">Production Board</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Password *</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password akun"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
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
                    'Simpan User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal Overlay */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Update Akun: {selectedUser.username}</span>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Nama Lengkap *</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Role / Hak Akses *</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                >
                  <option value="super-admin" className="dark:bg-slate-900">Super Admin</option>
                  <option value="planner" className="dark:bg-slate-900">Planner</option>
                  <option value="leader" className="dark:bg-slate-900">Leader</option>
                  <option value="member" className="dark:bg-slate-900">Member (Operator)</option>
                  <option value="production-board" className="dark:bg-slate-900">Production Board</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Password Baru</label>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-white uppercase">Kosongkan jika tidak diubah</span>
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
                  onClick={() => setShowEditModal(false)}
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
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-inner">
              <ShieldAlert className="h-7 w-7 animate-bounce" />
            </div>
            <h3 className="mt-4 text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Hapus Akun User?</h3>
            <p className="mt-2 text-slate-500 dark:text-white text-xs leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <span className="font-extrabold text-slate-800 dark:text-white">{selectedUser.username}</span>? Pengguna ini tidak akan dapat login lagi ke workstation sistem.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-2.5 text-xs font-bold text-rose-700 dark:text-rose-455 text-left">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-750 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-rose-700 cursor-pointer flex items-center justify-center gap-1.5"
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
      )}
    </div>
  );
}
