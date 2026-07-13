import React, { useState } from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';

// Render form to authorize workstation device using credentials
export default function DeviceLoginForm() {
  const loginDevice = useAuthStore((state) => state.loginDevice);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle credentials form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('Username harus minimal 3 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      await loginDevice(username, password);
    } catch (err: any) {
      const responseData = err.response?.data;
      const message = responseData?.message || 'Gagal melakukan otorisasi device.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none transition focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50 dark:bg-rose-950/20 p-3.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse text-left">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        style={{ backgroundColor: colorPrimary }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 dark:shadow-none transition hover:opacity-95 active:scale-95 disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        ) : (
          'Authorize Device'
        )}
      </button>
    </form>
  );
}
