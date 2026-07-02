import { type ReactNode } from 'react';

import { ErrorBoundary } from './ErrorBoundary';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

/** Root-level error boundary for the entire application */
export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8">
          <h1 className="mb-2 text-xl font-semibold text-red-300">Application error</h1>
          <p className="mb-6 text-slate-400">Please refresh the page or contact support.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm hover:bg-brand-700"
          >
            Reload
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
