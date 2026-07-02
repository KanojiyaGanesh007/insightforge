import { Link } from 'react-router-dom';

import { paths } from '@/routes/paths';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="mb-2 text-4xl font-bold">404</h1>
      <p className="mb-6 text-slate-400">Page not found</p>
      <Link to={paths.home} className="text-brand-500 hover:underline">
        Go home
      </Link>
    </div>
  );
}
