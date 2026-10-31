import { Component, type ReactNode } from 'react';
import { Button, Card } from './primitives';

export interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the default fallback. */
  fallback?: (o: { error: Error; reset: () => void }) => ReactNode;
  /** Called once per caught error (send to a log endpoint). */
  onError?: (error: Error, info: { componentStack?: string | null }) => void;
  /** When any value changes, a shown error resets (pass [location.pathname] to reset on navigation). */
  resetKeys?: unknown[];
}

interface State {
  error: Error | null;
}

const CHUNK_MESSAGE = /Failed to fetch dynamically imported module|Importing a module script failed/;

function isChunkError(e: Error): boolean {
  return e.name === 'ChunkLoadError' || CHUNK_MESSAGE.test(e.message);
}

function changed(a: unknown[] = [], b: unknown[] = []): boolean {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}

/** Catches render errors below it and shows a themed fallback with a way to recover. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    this.props.onError?.(error, { componentStack: info.componentStack });
  }

  componentDidUpdate(prev: AppErrorBoundaryProps): void {
    if (this.state.error && changed(prev.resetKeys, this.props.resetKeys)) this.reset();
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });

    const stale = isChunkError(error);
    const message = error.message.length > 300 ? `${error.message.slice(0, 300)}…` : error.message;
    return (
      <Card role="alert" className="mx-auto my-16 max-w-md">
        <h2 className="text-lg font-semibold text-th-hi">{stale ? 'A new version is available' : 'Something went wrong'}</h2>
        <p className="mt-1 break-words text-sm text-th-hi2">
          {stale ? 'Reload the page to get the latest version.' : message || 'An unexpected error occurred.'}
        </p>
        {error.stack ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-th-hi3">Details</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-th-elevated p-2 font-mono text-xs text-th-hi2">{error.stack}</pre>
          </details>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant={stale ? 'secondary' : 'primary'} onClick={this.reset}>
            Try again
          </Button>
          <Button variant={stale ? 'primary' : 'secondary'} onClick={() => location.reload()}>
            Reload page
          </Button>
        </div>
      </Card>
    );
  }
}
