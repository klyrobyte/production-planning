import { LogOut } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';

export default function AuthHeader() {
  const { systemLogo, systemTitle, isAuthenticated, user, logoutDevice } = useAuthContext();

  return (
    <div className="w-full max-w-6xl flex flex-col items-center justify-between gap-4 md:flex-row md:absolute md:top-8 md:px-12 mb-8 md:mb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-white dark:bg-slate-900 p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
          <img src={systemLogo || '/logo.png'} alt="SC Logo" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="text-left">
          <h1 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 leading-none">
            {systemTitle}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
            Integrated Production Planning System
          </p>
        </div>
      </div>

      {isAuthenticated && user && (
        <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-900 p-2.5 pl-4 pr-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Workstation Active: <span className="font-extrabold text-slate-800 dark:text-slate-100 uppercase">{user.name}</span>
          </p>
          <button
            onClick={() => logoutDevice()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
