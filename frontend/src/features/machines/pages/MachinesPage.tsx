import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Cpu,
  Key
} from 'lucide-react';
import api from '../../../shared/lib/axios';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';

interface FactoryItem {
  id: string;
  code: string;
  name: string;
}

interface MachineItem {
  id: string;
  factory_id: string;
  factory_code: string;
  factory_name: string;
  code: string;
  name: string;
  type: string | null;
  tonnage: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function MachinesPage() {
  const activePortal = useAuthStore((state) => state.activePortal);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const machineTypes = useThemeStore((state) => state.machineTypes);
  const isSuperAdmin = activePortal === 'super-admin';

  const typesList = machineTypes
    ? machineTypes.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
    : ['injection', 'painting'];

  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [factories, setFactories] = useState<FactoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFactoryId, setFilterFactoryId] = useState('');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedMachine, setSelectedMachine] = useState<MachineItem | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Form Inputs
  const [machineFactoryId, setMachineFactoryId] = useState('');
  const [machineCode, setMachineCode] = useState('');
  const [machineName, setMachineName] = useState('');
  const [machineType, setMachineType] = useState('');
  const [machineTonnage, setMachineTonnage] = useState('');
  const [machineStatus, setMachineStatus] = useState<'active' | 'inactive'>('active');
  const [machinePin, setMachinePin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Factories (for selector)
  const fetchFactories = useCallback(async () => {
    try {
      const res = await api.get('/factories');
      setFactories(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch factories:', e);
    }
  }, []);

  // Fetch Machines
  const fetchMachines = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/machines');
      setMachines(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch machines:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      await fetchFactories();
      await fetchMachines();
    };
    initData();
  }, [fetchFactories, fetchMachines]);

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
    setMachineFactoryId(factories[0]?.id || '');
    setMachineCode('');
    setMachineName('');
    setMachineType('');
    setMachineTonnage('');
    setMachineStatus('active');
    setMachinePin('');
    setErrorMsg(null);
    setShowFormModal(true);
  };

  const openEditModal = (machine: MachineItem) => {
    setModalType('edit');
    setSelectedMachine(machine);
    setMachineFactoryId(machine.factory_id);
    setMachineCode(machine.code);
    setMachineName(machine.name);
    setMachineType(machine.type || '');
    setMachineTonnage(machine.tonnage || '');
    setMachineStatus(machine.status);
    setMachinePin('');
    setErrorMsg(null);
    setShowFormModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineCode.trim() || !machineName.trim() || !machineFactoryId) {
      setErrorMsg('Pabrik, Kode Mesin, dan Nama Mesin wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (modalType === 'add') {
        await api.post('/machines', {
          factory_id: machineFactoryId,
          code: machineCode,
          name: machineName,
          type: machineType || null,
          tonnage: machineTonnage || null,
        });
        triggerNotification('Mesin baru berhasil didaftarkan.');
      } else {
        if (!selectedMachine) return;
        const payload: Record<string, any> = {
          code: machineCode,
          name: machineName,
          type: machineType || null,
          tonnage: machineTonnage || null,
          status: machineStatus,
        };
        if (machinePin.trim()) {
          payload.pin = machinePin;
        }
        await api.put(`/machines/${selectedMachine.id}`, payload);
        triggerNotification('Data mesin berhasil diperbarui.');
      }
      setShowFormModal(false);
      fetchMachines();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan data mesin.');
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
      await api.delete(`/machines/${deleteTarget.id}`);
      triggerNotification('Mesin berhasil dihapus.');
      fetchMachines();
      setShowDeleteModal(false);
    } catch (err: any) {
      triggerNotification(err.response?.data?.message || 'Gagal menghapus mesin.', true);
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  const filteredMachines = machines.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      m.code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.type && m.type.toLowerCase().includes(q)) ||
      m.factory_code.toLowerCase().includes(q);
    const matchFactory = filterFactoryId ? m.factory_id === filterFactoryId : true;
    return matchQuery && matchFactory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-left">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white">Master Data</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">Machine Management</h2>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openAddModal}
            style={{ backgroundColor: colorPrimary }}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0 animate-in fade-in duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Mesin</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-750 dark:text-emerald-450 text-left animate-in fade-in slide-in-from-top-1 duration-200">
          {successMsg}
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm text-left flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mesin berdasarkan kode, nama, atau tipe..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white">Filter Pabrik:</span>
          <select
            value={filterFactoryId}
            onChange={(e) => setFilterFactoryId(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="">Semua Pabrik</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                <th className="px-6 py-4">Pabrik</th>
                <th className="px-6 py-4">Kode Mesin</th>
                <th className="px-6 py-4">Nama Mesin</th>
                <th className="px-6 py-4">Tipe Mesin</th>
                <th className="px-6 py-4">Tonnage</th>
                <th className="px-6 py-4">Status</th>
                {isSuperAdmin && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-white">
              {isLoading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-brand-primary"></div>
                      <span>Memuat data mesin...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Tidak ada data mesin yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredMachines.map((machine) => (
                  <tr key={machine.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="rounded-lg bg-slate-100 dark:bg-slate-850 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-650 dark:text-white border border-slate-200 dark:border-slate-800">
                        {machine.factory_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-800 dark:text-white">
                      {machine.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 dark:text-white">
                      {machine.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-450 dark:text-white font-semibold">
                      {machine.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-800 dark:text-white font-extrabold">
                      {machine.tonnage || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${machine.status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-450'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-405'
                        }`}>
                        {machine.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(machine)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-white transition hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 cursor-pointer"
                            title="Edit Mesin"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => triggerDelete(machine.id, `${machine.factory_code} - ${machine.code}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-950/30 text-rose-600 dark:text-rose-455 transition hover:bg-rose-50 dark:hover:bg-rose-950/10 active:scale-90 cursor-pointer"
                            title="Hapus Mesin"
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

      {/* FORM MODAL: ADD / EDIT MACHINE */}
      {showFormModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {modalType === 'add' ? 'Registrasi Mesin Baru' : 'Update Mesin'}
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
              {modalType === 'add' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Pabrik / Factory *</label>
                  <select
                    value={machineFactoryId}
                    onChange={(e) => setMachineFactoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                  >
                    {factories.map((f) => (
                      <option key={f.id} value={f.id} className="dark:bg-slate-900">{f.code} - {f.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Kode Mesin *</label>
                <input
                  type="text"
                  value={machineCode}
                  onChange={(e) => setMachineCode(e.target.value)}
                  placeholder="[Pabrik]-[MC]-[Nomor Mesin]"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Nama Mesin *</label>
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="Contoh: Machine 1"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Tipe Mesin *</label>
                <select
                  value={machineType}
                  onChange={(e) => setMachineType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                >
                  <option value="">-- Pilih Tipe Mesin --</option>
                  {typesList.map((type) => (
                    <option key={type} value={type} className="capitalize">
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Tonnage (Kapasitas)</label>
                <input
                  type="text"
                  value={machineTonnage}
                  onChange={(e) => setMachineTonnage(e.target.value)}
                  placeholder="Contoh: 2500T, 3500T"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              {modalType === 'edit' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">Status Keaktifan</label>
                    <select
                      value={machineStatus}
                      onChange={(e) => setMachineStatus(e.target.value as 'active' | 'inactive')}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                    >
                      <option value="active" className="dark:bg-slate-900">Aktif (Operasional)</option>
                      <option value="inactive" className="dark:bg-slate-900">Nonaktif (Off / Maintenance)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white flex items-center gap-1">
                        <Key className="h-3 w-3" /> PIN Leader Baru
                      </label>
                      <span className="text-[9px] font-bold text-slate-450 dark:text-white uppercase">Kosongkan jika tidak diubah</span>
                    </div>
                    <input
                      type="password"
                      value={machinePin}
                      onChange={(e) => setMachinePin(e.target.value)}
                      placeholder="Masukkan PIN numerik leader baru (opsional)"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                    />
                  </div>
                </>
              )}

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
                    'Simpan Mesin'
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
            <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Hapus Data Mesin?</h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus mesin <span className="font-extrabold text-slate-700 dark:text-white">"{deleteTarget.name}"</span>?
              Tindakan ini permanen dan tidak dapat dibatalkan.
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
