import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-300">Something went wrong</h2>
          <p className="mb-4 max-w-md text-sm text-slate-400">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
