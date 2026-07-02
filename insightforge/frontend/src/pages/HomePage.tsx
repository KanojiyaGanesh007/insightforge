import { Link } from 'react-router-dom';

import { useHealth } from '@/hooks/useHealth';
import { paths } from '@/routes/paths';

export function HomePage() {
  const { data, isLoading, isError } = useHealth();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-3xl font-bold">
        {import.meta.env.VITE_APP_NAME}
      </h1>
      <p className="mb-8 text-slate-400">
        Enterprise SaaS for dataset intelligence, AI insights, and analytics.
      </p>

      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">API Status</h2>
        {isLoading && <p className="text-sm text-slate-500">Checking backend…</p>}
        {isError && <p className="text-sm text-red-400">Backend unreachable</p>}
        {data && (
          <p className="text-sm text-emerald-400">
            {data.app} v{data.version} — {data.status} ({data.environment})
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <Link
          to={paths.login}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium hover:bg-brand-700"
        >
          Get started
        </Link>
        <Link
          to={paths.dashboard}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
