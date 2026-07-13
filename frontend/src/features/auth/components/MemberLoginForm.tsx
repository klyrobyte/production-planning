import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import api from '../../../shared/lib/axios';

interface FactoryData {
  id: string;
  code: string;
  name: string;
}

interface MachineData {
  id: string;
  code: string;
  name: string;
  tonnage: string;
}

interface MemberLoginFormProps {
  onBack: () => void;
}

// Render form to authenticate operator member session for a specific injection machine
export default function MemberLoginForm({ onBack }: MemberLoginFormProps) {
  const verifyOperatorPin = useAuthStore((state) => state.verifyOperatorPin);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  const [factories, setFactories] = useState<FactoryData[]>([]);
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch factories list on component mount
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const res = await api.get('/factories');
        const list = res.data.data || [];
        setFactories(list);
        if (list.length > 0) {
          setSelectedFactoryId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load factories:', err);
      }
    };
    loadFactories();
  }, []);

  // Fetch machines when selected factory changes
  useEffect(() => {
    if (!selectedFactoryId) return;
    const loadMachines = async () => {
      try {
        const res = await api.get(`/machines?factory_id=${selectedFactoryId}`);
        const list = res.data.data || [];
        setMachines(list);
        if (list.length > 0) {
          setSelectedMachineId(list[0].id);
        } else {
          setSelectedMachineId('');
        }
      } catch (err) {
        console.error('Failed to load machines:', err);
      }
    };
    loadMachines();
  }, [selectedFactoryId]);

  // Handle operator PIN verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMachineId) {
      setError('Silakan pilih mesin terlebih dahulu.');
      return;
    }
    if (memberName.trim().length === 0) {
      setError('Nama operator wajib diisi.');
      return;
    }
    if (pin.length !== 4) {
      setError('PIN harus berupa 4 digit angka.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOperatorPin(selectedFactoryId, selectedMachineId, pin, memberName.trim());
    } catch (err: any) {
      const responseData = err.response?.data;
      const message = responseData?.message || 'PIN tidak valid atau terjadi kesalahan koneksi.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Pabrik</label>
        <select
          value={selectedFactoryId}
          onChange={(e) => setSelectedFactoryId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-primary focus:bg-white cursor-pointer"
        >
          {factories.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilih Mesin</label>
        <select
          value={selectedMachineId}
          onChange={(e) => setSelectedMachineId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-primary focus:bg-white cursor-pointer"
        >
          {machines.length === 0 ? (
            <option value="">Tidak ada mesin aktif</option>
          ) : (
            machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.tonnage} T)
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Operator</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <User className="h-4 w-4" />
          </span>
          <input
            type="text"
            required
            placeholder="Masukkan nama Anda"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-primary focus:bg-white"
          />
        </div>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PIN Member (4 Digit)</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Lock className="h-4 w-4" />
          </span>
          <input
            type="password"
            required
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-center font-mono text-base font-black tracking-widest text-slate-800 outline-none transition focus:border-brand-primary focus:bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-xs font-bold text-rose-600 animate-pulse text-left">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-200 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-50 active:scale-95 cursor-pointer text-center"
        >
          <div className="flex items-center justify-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </div>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: colorPrimary }}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 transition hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            'Enter Portal'
          )}
        </button>
      </div>
    </form>
  );
}
