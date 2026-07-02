import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth';
import { paths } from '@/routes/paths';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 px-6">
      <Link to={paths.home} className="text-lg font-semibold text-brand-500">
        {import.meta.env.VITE_APP_NAME}
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {isAuthenticated ? (
          <>
            <span className="text-slate-400">{user?.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="text-slate-300 hover:text-white"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to={paths.login} className="text-brand-500 hover:underline">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
