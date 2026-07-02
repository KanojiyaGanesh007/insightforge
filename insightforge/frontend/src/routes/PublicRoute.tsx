import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/authStore';

import { paths } from './paths';

/** Redirect authenticated users away from login/register */
export function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}
