import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import type { UserRole } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

// Restrict child route rendering to authenticated users with permitted roles
export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const activePortal = useAuthStore((state) => state.activePortal);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(activePortal)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
