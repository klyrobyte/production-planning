import { Navigate } from 'react-router-dom';
import { Factory, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import DeviceLoginForm from '../components/DeviceLoginForm';
import MemberLoginForm from '../components/MemberLoginForm';

// Render the combined Login page managing device access and operator machine PIN validation
export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logoutDevice = useAuthStore((state) => state.logoutDevice);
  const isOperatorAuthenticated = useAuthStore((state) => state.isOperatorAuthenticated);
  const colorPrimary = useThemeStore((state) => state.colorPrimary);
  const systemTitle = useThemeStore((state) => state.systemTitle);
  const systemLogo = useThemeStore((state) => state.systemLogo);

  // Redirect logged-in non-members, or logged-in members who are also operator authenticated
  const shouldRedirect = isAuthenticated && user && (user.role !== 'member' || isOperatorAuthenticated);
  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 px-6 py-12 select-none overflow-y-auto">
      {/* Decorative Brand Top Banner (Solid Color) */}
      <div 
        style={{ backgroundColor: colorPrimary }}
        className="absolute top-0 inset-x-0 h-2" 
      />

      {/* Global Header */}
      <div className="w-full max-w-6xl flex flex-col items-center justify-between gap-4 md:flex-row md:absolute md:top-8 md:px-12 mb-8 md:mb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-white dark:bg-slate-900 p-1.5 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
            <img src={systemLogo || '/logo.png'} alt="SC Logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-100 leading-none">{systemTitle}</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">Integrated Production Planning System</p>
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

      {/* Main Core Container */}
      <div className="w-full max-w-md text-center z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!isAuthenticated ? (
          /* Case 1: Device is not authorized */
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-inner">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Device Authorization</h2>
            <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Log in to unlock this workstation</p>
            <div className="mt-8">
              <DeviceLoginForm />
            </div>
          </div>
        ) : (
          /* Case 2: User is member but operator PIN is not verified */
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-inner">
              <Factory className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Member Machine Login</h2>
            <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Pilih stasiun mesin dan masukkan PIN</p>
            <div className="mt-8">
              <MemberLoginForm onBack={() => logoutDevice()} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
