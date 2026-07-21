import { Navigate } from 'react-router-dom';
import { Factory, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/useAuthStore';
import { AuthProvider, useAuthContext } from '../context/AuthContext';
import AuthHeader from '../components/AuthHeader';
import DeviceLoginForm from '../components/DeviceLoginForm';
import MemberLoginForm from '../components/MemberLoginForm';

function LoginPageContent() {
  const { isAuthenticated, colorPrimary, logoutDevice } = useAuthContext();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 px-6 py-12 select-none overflow-y-auto">
      {/* Decorative Brand Top Banner */}
      <div 
        style={{ backgroundColor: colorPrimary }}
        className="absolute top-0 inset-x-0 h-2" 
      />

      {/* Global Header */}
      <AuthHeader />

      {/* Main Core Container */}
      <div className="w-full max-w-md text-center z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {!isAuthenticated ? (
          /* Case 1: Device is not authorized */
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shadow-inner">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Device Authorization
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Log in to unlock this workstation
            </p>
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
            <h2 className="mt-4 text-xl font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Member Machine Login
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              Pilih stasiun mesin dan masukkan PIN
            </p>
            <div className="mt-8">
              <MemberLoginForm onBack={() => logoutDevice()} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isOperatorAuthenticated = useAuthStore((state) => state.isOperatorAuthenticated);
  const activeMachineCode = useAuthStore((state) => state.activeMachineCode);

  // Redirect logged-in non-members, or logged-in members who are also operator authenticated
  if (isAuthenticated && user) {
    if (user.role !== 'member') {
      return <Navigate to="/dashboard" replace />;
    } else if (isOperatorAuthenticated && activeMachineCode) {
      return <Navigate to={`/production/${activeMachineCode}/execution`} replace />;
    }
  }

  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
}
