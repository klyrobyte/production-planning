import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  UserCheck 
} from 'lucide-react';
import api from '../../../shared/lib/axios';
import { useThemeStore } from '../../../shared/store/useThemeStore';

interface LeaderItem {
  id: string;
  name: string;
  created_at: string;
}

interface LeadersTabProps {
  refreshTrigger: number;
}

export default function LeadersTab({ refreshTrigger }: LeadersTabProps) {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  // States
  const [leaders, setLeaders] = useState<LeaderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    pin: ''
  });

  // Reveal PIN states
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  // Feedback Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLeaders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/leaders');
      setLeaders(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch leaders:', e);
      setErrorMsg('Gagal memuat data leaders.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders, refreshTrigger]);

  const handleManualFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, pin } = manualForm;
    
    if (!name.trim()) {
      setErrorMsg('Nama leader wajib diisi.');
      return;
    }
    if (!pin || pin.length !== 4 || isNaN(Number(pin))) {
      setErrorMsg('PIN harus terdiri dari 4 digit angka.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      await api.post('/leaders', {
        name: name.trim(),
        pin: String(pin)
      });
      setSuccessMsg(`Leader ${name} berhasil ditambahkan.`);
      setManualForm({ name: '', pin: '' });
      fetchLeaders();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menambahkan leader.');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRevealPin = async (id: string) => {
    if (revealedPins[id]) {
      // Hide if already revealed
      setRevealedPins(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      return;
    }

    setRevealingId(id);
    try {
      const res = await api.get(`/leaders/${id}/reveal-pin`);
      const pin = res.data.data?.pin || 'N/A';
      setRevealedPins(prev => ({ ...prev, [id]: pin }));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengungkapkan PIN leader.');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setRevealingId(null);
    }
  };

  const handleDeleteLeader = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus leader "${name}"?`)) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.delete(`/leaders/${id}`);
      setSuccessMsg(`Leader "${name}" berhasil dihapus.`);
      
      // Cleanup revealed PIN for this id
      setRevealedPins(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      
      fetchLeaders();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menghapus leader.');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering & Searching logic
  const filteredLeaders = useMemo(() => {
    return leaders.filter(leader => {
      const q = searchTerm.toLowerCase().trim();
      return (leader.name || '').toLowerCase().includes(q);
    });
  }, [leaders, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredLeaders.length / itemsPerPage) || 1;
  const paginatedLeaders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeaders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLeaders, currentPage]);

  return (
    <div className="space-y-6">
      {/* Success / Error Notification */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-xs font-bold text-emerald-700 dark:text-emerald-450 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-100 dark:border-rose-955/30 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs font-bold text-rose-700 dark:text-rose-455 flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <UserCheck className="w-14 h-14 text-[#E76114]" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Total Leaders</div>
          <div className="text-3xl font-black text-[#E76114] mt-2 tracking-tight">
            {leaders.length}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Leader terdaftar yang memverifikasi OEE / Abnormality</div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute right-3 top-3 opacity-10 dark:opacity-5 group-hover:opacity-20 transition-opacity">
            <Key className="w-14 h-14 text-emerald-600" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-extrabold uppercase tracking-wider">Secured Verification PINs</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-450 mt-2 tracking-tight">
            {leaders.length} PINs
          </div>
          <div className="text-[10px] text-slate-400 dark:text-white font-bold mt-1">Tersimpan dalam enkripsi algoritma AES-256</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Manual Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex bg-slate-50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800/80 p-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#E76114]" />
                Tambah Leader Baru
              </h4>
            </div>

            <div className="p-6">
              <form onSubmit={handleManualFormSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                    Nama Leader *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.name}
                    onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ahmad Santoso"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 py-2.5 px-3 text-xs font-semibold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white">
                    PIN Verifikasi (4 Digit) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={manualForm.pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setManualForm(prev => ({ ...prev, pin: val }));
                    }}
                    placeholder="e.g. 1234"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 py-2.5 px-3 text-xs font-bold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 tracking-widest font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: colorPrimary }}
                  className="w-full py-3 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md hover:opacity-95 active:scale-[0.99] cursor-pointer text-center disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Leader'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table & Search */}
        <div className="lg:col-span-7 space-y-6">
          {/* Search Box */}
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama leader..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-705 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          {/* Leaders Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white">
                    <th className="px-6 py-4">Nama Leader</th>
                    <th className="px-6 py-4">PIN Verifikasi</th>
                    <th className="px-6 py-4">Terdaftar Sejak</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-705 dark:text-white">
                  {isLoading && leaders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-[#E76114]" />
                          <span>Memuat data leaders...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeaders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada leader terdaftar.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaders.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-left font-bold text-slate-850 dark:text-white">
                          {row.name}
                        </td>
                        <td className="px-6 py-4 text-left font-mono font-bold">
                          {revealedPins[row.id] ? (
                            <span className="text-emerald-600 dark:text-emerald-450 tracking-wider">
                              {revealedPins[row.id]}
                            </span>
                          ) : (
                            <span className="text-slate-350 dark:text-slate-600 tracking-widest">
                              ••••
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(row.created_at).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleRevealPin(row.id)}
                              disabled={revealingId === row.id}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-705 dark:hover:text-white transition-colors cursor-pointer"
                              title={revealedPins[row.id] ? "Sembunyikan PIN" : "Tampilkan PIN"}
                            >
                              {revealingId === row.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin text-[#E76114]" />
                              ) : revealedPins[row.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLeader(row.id, row.name)}
                              className="rounded-lg p-2 text-rose-505 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Hapus Leader"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400">
                <span className="text-xs font-semibold">
                  Menampilkan {Math.min(filteredLeaders.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredLeaders.length, currentPage * itemsPerPage)} dari {filteredLeaders.length} data
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
