import { User, Lock, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

export default function DeviceLoginForm() {
  const {
    colorPrimary,
    deviceUsername,
    setDeviceUsername,
    devicePassword,
    setDevicePassword,
    deviceError,
    isDeviceLoading,
    handleDeviceSubmit,
  } = useAuthContext();

  return (
    <form onSubmit={handleDeviceSubmit} className="space-y-4">
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Username</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <User className="h-4 w-4" />
          </span>
          <input
            type="text"
            required
            placeholder="Masukkan username"
            value={deviceUsername}
            onChange={(e) => setDeviceUsername(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Password</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
            <Lock className="h-4 w-4" />
          </span>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={devicePassword}
            onChange={(e) => setDevicePassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {deviceError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse text-left">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{deviceError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isDeviceLoading}
        style={{ backgroundColor: colorPrimary }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 dark:shadow-none transition hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {isDeviceLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        ) : (
          'Authorize Device'
        )}
      </button>
    </form>
  );
}
