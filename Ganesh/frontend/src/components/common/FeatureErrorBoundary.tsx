import { type ReactNode } from 'react';

import { ErrorBoundary } from './ErrorBoundary';

interface FeatureErrorBoundaryProps {
  featureName: string;
  children: ReactNode;
}

/** Per-feature error boundary for isolated failure domains */
export function FeatureErrorBoundary({ featureName, children }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-6">
          <p className="text-sm text-amber-200">
            Failed to load <strong>{featureName}</strong>. Try refreshing this section.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
