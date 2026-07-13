import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Factory
} from 'lucide-react';
import api from '../../../shared/lib/axios';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';

interface FactoryItem {
  id: string;
  code: string;
  name: string;
  location: string | null;
  created_at: string;
}

export default function FactoriesPage() {
  const activePortal = useAuthStore((state) => state.activePortal);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const isSuperAdmin = activePortal === 'super-admin';

  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedFactory, setSelectedFactory] = useState<FactoryItem | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form Inputs
  const [factoryCode, setFactoryCode] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [factoryLocation, setFactoryLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Factories
  const fetchFactories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/factories');
      setFactories(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch factories:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFactories();
  }, [fetchFactories]);

  const triggerNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openAddModal = () => {
    setModalType('add');
    setFactoryCode('');
    setFactoryName('');
    setFactoryLocation('');
    setErrorMsg(null);
    setShowFormModal(true);
  };

  const openEditModal = (factory: FactoryItem) => {
    setModalType('edit');
    setSelectedFactory(factory);
    setFactoryCode(factory.code);
    setFactoryName(factory.name);
    setFactoryLocation(factory.location || '');
    setErrorMsg(null);
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryCode.trim() || !factoryName.trim()) {
      setErrorMsg('Kode dan Nama Pabrik wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (modalType === 'add') {
        await api.post('/factories', {
          code: factoryCode,
          name: factoryName,
          location: factoryLocation || null,
        });
        triggerNotification('Pabrik baru berhasil didaftarkan.');
      } else {
        if (!selectedFactory) return;
        await api.put(`/factories/${selectedFactory.id}`, {
          code: factoryCode,
          name: factoryName,
          location: factoryLocation || null,
        });
        triggerNotification('Data pabrik berhasil diperbarui.');
      }
      setShowFormModal(false);
      fetchFactories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan data pabrik.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/factories/${deleteTarget.id}`);
      triggerNotification('Pabrik berhasil dihapus.');
      fetchFactories();
      setShowDeleteModal(false);
    } catch (err: any) {
      triggerNotification(err.response?.data?.message || 'Gagal menghapus pabrik.', true);
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const filteredFactories = factories.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.code.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      (f.location && f.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">Master Data</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">Factory Management</h2>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openAddModal}
            style={{ backgroundColor: colorPrimary }}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0 animate-in fade-in duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pabrik</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-left">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pabrik berdasarkan kode, nama, atau lokasi..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                <th className="px-6 py-4">Kode Pabrik</th>
                <th className="px-6 py-4">Nama Pabrik</th>
                <th className="px-6 py-4">Lokasi Plant</th>
                {isSuperAdmin && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary"></div>
                      <span>Memuat data pabrik...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFactories.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada data pabrik yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredFactories.map((factory) => (
                  <tr key={factory.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-brand-primary">
                      {factory.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800 dark:text-white">
                      {factory.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-450 dark:text-white font-semibold">
                      {factory.location || '-'}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(factory)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 cursor-pointer"
                            title="Edit Pabrik"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(factory.id, factory.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-950/30 text-rose-600 dark:text-rose-455 transition hover:bg-rose-50 dark:hover:bg-rose-950/10 active:scale-90 cursor-pointer"
                            title="Hapus Pabrik"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: ADD / EDIT FACTORY */}
      {showFormModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Factory className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {modalType === 'add' ? 'Registrasi Pabrik Baru' : 'Update Pabrik'}
                </span>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Kode Pabrik *</label>
                <input
                  type="text"
                  value={factoryCode}
                  onChange={(e) => setFactoryCode(e.target.value)}
                  placeholder="Contoh: FACT 3"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Nama Pabrik *</label>
                <input
                  type="text"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  placeholder="Contoh: Factory 3 (Cibitung)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Lokasi Plant</label>
                <input
                  type="text"
                  value={factoryLocation}
                  onChange={(e) => setFactoryLocation(e.target.value)}
                  placeholder="Contoh: SC1 (Cibitung) / SC2 (Karawang)"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
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
                    'Simpan Pabrik'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-left animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Hapus Data Pabrik?</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus pabrik <span className="font-extrabold text-slate-700 dark:text-white">"{deleteTarget.name}"</span>?
              Tindakan ini juga akan menghapus seluruh data mesin yang terasosiasi dengan pabrik ini dari database.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
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
      )}
    </div>
  );
}
