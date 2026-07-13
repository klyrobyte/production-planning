import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from './shared/store/useThemeStore';
import { useAuthStore } from './shared/store/useAuthStore';
import { AppProviders } from './app/providers';
import ProtectedRoute from './shared/components/layout/ProtectedRoute';
import PageLayout from './shared/components/layout/PageLayout';
import NotFoundPage from './shared/pages/NotFoundPage';
import ForbiddenPage from './shared/pages/ForbiddenPage';

// Inline placeholder for landing dashboard
function DashboardPlaceholder() {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-left">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase">3M Dashboard</h3>
      <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
        Selamat datang di Portal Perencanaan Produksi PT. Sugity Creatives. Halaman Dashboard sedang dalam pengembangan.
      </p>
    </div>
  );
}

// Inline placeholder for orders management
function OrdersPlaceholder() {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-left">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase">Orders Management</h3>
      <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
        Halaman pengimporan order dan mapping conversion sedang dalam pengembangan.
      </p>
    </div>
  );
}

// Inline placeholder for production monitoring
function ProductionPlaceholder() {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-left">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase">Production Control</h3>
      <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
        Halaman visualisasi timeline Heijunka dan monitoring mesin sedang dalam pengembangan.
      </p>
    </div>
  );
}
import LoginPage from './features/auth/pages/LoginPage';
import UsersPage from './features/users/pages/UsersPage';
import GlobalLogsPage from './features/global-logs/pages/GlobalLogsPage';
import SiteConfigPage from './features/site-config/pages/SiteConfigPage';
import FactoriesPage from './features/factories/pages/FactoriesPage';
import MachinesPage from './features/machines/pages/MachinesPage';
import DatabasePage from './features/database/pages/DatabasePage';
// Core App bootstrap layout logic
function AppContent() {
  const fetchTheme = useThemeStore((state) => state.fetchTheme);
  const checkSession = useAuthStore((state) => state.checkSession);
  const isCheckingSession = useAuthStore((state) => state.isCheckingSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize theme config and load current session token
  useEffect(() => {
    fetchTheme();
    checkSession();
  }, [fetchTheme, checkSession]);

  if (isCheckingSession) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-primary"></div>
          <p className="text-sm font-semibold tracking-wider text-slate-500 uppercase">Loading System...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Area wrapping inside PageLayout Shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PageLayout />}>
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            <Route path="/orders" element={<OrdersPlaceholder />} />
            <Route path="/production" element={<ProductionPlaceholder />} />
            <Route element={<ProtectedRoute allowedRoles={['super-admin', 'planner']} />}>
              <Route path="/database" element={<DatabasePage />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['super-admin']} />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/factories" element={<FactoriesPage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/global-logs" element={<GlobalLogsPage />} />
              <Route path="/site-config" element={<SiteConfigPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default Route redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Error Fallback Routes */}
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// Root entry point wrapping context clients
export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
