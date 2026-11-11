'use client';
import { Component, type ReactNode } from 'react';
import { Button, Card } from './primitives';
import { useStrings } from './provider';
import { ERROR_STRINGS } from './strings';

export interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the default fallback. */
  fallback?: (o: { error: Error; reset: () => void }) => ReactNode;
  /** Called once per caught error (send to a log endpoint). */
  onError?: (error: Error, info: { componentStack?: string | null }) => void;
  /** When any value changes, a shown error resets (pass [location.pathname] to reset on navigation). */
  resetKeys?: unknown[];
  /** Show the error message and stack in the default fallback. Default: only outside production
   *  (`process.env.NODE_ENV !== 'production'`), so end users never see internals. */
  showDetails?: boolean;
}

interface State {
  error: Error | null;
}

const CHUNK_MESSAGE = /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|unable to preload css/i;

function isChunkError(e: Error): boolean {
  return e.name === 'ChunkLoadError' || CHUNK_MESSAGE.test(e.message);
}

function changed(a: unknown[] = [], b: unknown[] = []): boolean {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}

/** True outside production. Bundlers replace `process.env.NODE_ENV`; where nothing does,
 *  the ReferenceError is caught and the page counts as production. */
function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

const useErrorStrings = () => useStrings(ERROR_STRINGS);

interface BoundaryProps extends AppErrorBoundaryProps {
  strings: ReturnType<typeof useErrorStrings>;
}

class Boundary extends Component<BoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    this.props.onError?.(error instanceof Error ? error : new Error(String(error)), { componentStack: info.componentStack });
  }

  componentDidUpdate(prev: BoundaryProps, prevState: State): void {
    if (this.state.error && prevState.error && changed(prev.resetKeys, this.props.resetKeys)) this.reset();
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });

    const s = this.props.strings;
    const details = this.props.showDetails ?? isDevelopment();
    const stale = isChunkError(error);
    const message = error.message.length > 300 ? `${error.message.slice(0, 300)}…` : error.message;
    return (
      <Card role="alert" className="mx-auto my-16 max-w-md">
        <h2 className="text-lg font-semibold text-th-hi">{stale ? s.errorStaleTitle : s.errorTitle}</h2>
        <p className="mt-1 break-words text-sm text-th-hi2">
          {stale ? s.errorStaleBody : details ? message || s.errorBody : s.errorBody}
        </p>
        {details && error.stack ? (
          <details className="mt-3">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-th-hi3">{s.errorDetails}</summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-th-elevated p-2 font-mono text-xs text-th-hi2">{error.stack}</pre>
          </details>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {stale ? null : (
            <Button variant="primary" onClick={this.reset}>
              {s.errorTryAgain}
            </Button>
          )}
          <Button variant={stale ? 'primary' : 'secondary'} onClick={() => location.reload()}>
            {s.errorReload}
          </Button>
        </div>
      </Card>
    );
  }
}

/** Catches render errors below it and shows a themed fallback with a way to recover. The
 *  default fallback shows the message and stack only outside production or with `showDetails`. */
export function AppErrorBoundary(props: AppErrorBoundaryProps) {
  const strings = useErrorStrings();
  return <Boundary {...props} strings={strings} />;
}
