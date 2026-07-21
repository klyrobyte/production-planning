import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import type { MemberLoginFormProps } from '../context/AuthTypes';
import { useAuthContext } from '../context/AuthContext';

export default function MemberLoginForm({ onBack }: MemberLoginFormProps) {
  const {
    colorPrimary,
    factories,
    machines,
    selectedFactoryId,
    setSelectedFactoryId,
    selectedMachineId,
    setSelectedMachineId,
    memberName,
    setMemberName,
    pin,
    setPin,
    memberError,
    isMemberLoading,
    handleMemberSubmit,
  } = useAuthContext();

  return (
    <form onSubmit={handleMemberSubmit} className="space-y-4">
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Pilih Pabrik
        </label>
        <select
          value={selectedFactoryId}
          onChange={(e) => setSelectedFactoryId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
        >
          {factories.map((f) => (
            <option key={f.id} value={f.id} className="dark:bg-slate-900">
              {f.name} ({f.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Pilih Mesin
        </label>
        <select
          value={selectedMachineId}
          onChange={(e) => setSelectedMachineId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
        >
          {machines.length === 0 ? (
            <option value="" className="dark:bg-slate-900">
              Tidak ada mesin aktif
            </option>
          ) : (
            machines.map((m) => (
              <option key={m.id} value={m.id} className="dark:bg-slate-900">
                {m.name} ({m.tonnage} T)
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Nama Operator
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <User className="h-4 w-4" />
          </span>
          <input
            type="text"
            required
            placeholder="Masukkan nama Anda"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          PIN Mesin (4 Digit)
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Lock className="h-4 w-4" />
          </span>
          <input
            type="password"
            required
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-center font-mono text-base font-black tracking-widest text-slate-800 dark:text-slate-100 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {memberError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse text-left">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{memberError}</span>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 py-3.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-95 cursor-pointer text-center"
        >
          <div className="flex items-center justify-center gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </div>
        </button>

        <button
          type="submit"
          disabled={isMemberLoading}
          style={{ backgroundColor: colorPrimary }}
          className="flex-[2] flex items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 dark:shadow-none transition hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isMemberLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            'Enter Portal'
          )}
        </button>
      </div>
    </form>
  );
}
