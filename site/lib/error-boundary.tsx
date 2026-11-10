import { Component, type ErrorInfo, type ReactNode } from 'react';

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i;
/** Callbacks run when the boundary resets (docs.ts drops its rejected loads here). Kept as a hook, not an
 *  import of docs.ts, because this file is in the entry chunk and docs.ts is not. */
export const resetHooks = new Set<() => void>();
const FLAG = 'nish-ui-chunk-reload';

/** True when this tab has already reloaded once for a stale chunk (so a second failure shows the message). */
function alreadyReloaded(): boolean {
  try {
    return sessionStorage.getItem(FLAG) === '1';
  } catch {
    return true;
  }
}

function markReloaded() {
  try {
    sessionStorage.setItem(FLAG, '1');
  } catch {
    /* storage blocked: alreadyReloaded() returns true, so we never reload */
  }
}

interface Props {
  children: ReactNode;
  /** Changing it (the route path) clears a shown error so the next page gets a fresh try. */
  resetKey?: string;
}

/** Catches a failed lazy chunk or doc load so the site shows a message and a Reload button instead of a blank page. */
export class PageErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
    // A tab holding an old index after a deploy asks for chunks that are gone: one reload fixes it.
    if (CHUNK_ERROR.test(String(error?.message ?? error)) && !alreadyReloaded()) {
      markReloaded();
      location.reload();
    }
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      for (const f of resetHooks) f();
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="text-lg font-semibold text-th-hi">This page failed to load.</p>
        {/* A plain button, not the package Button: this file loads with the entry chunk, and the package would widen it. */}
        <button
          type="button"
          onClick={() => location.reload()}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-th-accent px-4 text-sm font-medium text-th-on-accent hover:opacity-90"
        >
          Reload
        </button>
      </div>
    );
  }
}
