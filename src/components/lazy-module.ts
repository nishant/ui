'use client';
import { useEffect, useState } from 'react';
import { useLatest } from './latest';

/** @internal A module loaded on first use and cached; a failed load can be retried. */
export interface LazyModule<T> {
  /** The module once it has loaded, else null. */
  current(): T | null;
  /** Starts the load, or joins the one in flight. Rejects when the chunk cannot load; the next call retries. */
  load(): Promise<T>;
}

/** @internal Wrap a literal dynamic import: `lazyModule(() => import('./more-sheet'))`. Mark the call
 *  `/* @__PURE__ *\/` at module top level so bundlers can drop it. */
export function lazyModule<T>(importer: () => Promise<T>): LazyModule<T> {
  let mod: T | null = null;
  let pending: Promise<T> | null = null;
  return {
    current: () => mod,
    load: () =>
      (pending ??= importer().then(
        (m) => (mod = m),
        (e: unknown) => {
          pending = null;
          throw e;
        },
      )),
  };
}

/** @internal The module, loading it once `when` is true. null until it has loaded. `onError` runs when the
 *  load fails (the caller closes whatever was waiting for it). */
export function useLazyModule<T>(m: LazyModule<T>, when: boolean, onError?: () => void): T | null {
  const [, rerender] = useState(0);
  const errorRef = useLatest(onError); // the newest callback, without re-running the effect
  useEffect(() => {
    if (!when || m.current()) return;
    let live = true;
    m.load().then(
      () => live && rerender((n) => n + 1),
      () => live && errorRef.current?.(),
    );
    return () => {
      live = false;
    };
  }, [m, when, errorRef]);
  return m.current();
}

/** @internal Loads the module once the browser is idle (or after 1.5 s without requestIdleCallback).
 *  Returns a cleanup that cancels the wait. Does nothing on the server. */
export function preloadWhenIdle(m: LazyModule<unknown>): () => void {
  if (typeof window === 'undefined' || m.current()) return () => {};
  const run = () => {
    m.load().catch(() => undefined);
  };
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, 1500);
  return () => window.clearTimeout(id);
}
