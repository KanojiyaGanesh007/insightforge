import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore';

import { paths } from './paths';

interface ProtectedRouteProps {
  /** Require superuser — Phase 1 admin routes */
  requireAdmin?: boolean;
}

export function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={paths.login} state={{ from: location }} replace />;
  }

  if (requireAdmin && !user?.is_superuser) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}
