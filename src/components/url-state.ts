import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

/** Where useUrlState reads and writes the query string. */
export interface UrlStateAdapter {
  get(): URLSearchParams;
  /** Replace the query string; do not push a history entry. */
  set(next: URLSearchParams): void;
  subscribe(onChange: () => void): () => void;
}

const EVENT = 'nish:urlstate';

/** location.search + history.replaceState. Keeps the hash and history.state, listens to
 *  popstate and to a 'nish:urlstate' window event fired after each set. */
export const locationAdapter: UrlStateAdapter = {
  get() {
    if (typeof location === 'undefined') return new URLSearchParams();
    return new URLSearchParams(location.search);
  },
  set(next) {
    if (typeof location === 'undefined' || typeof history === 'undefined') return;
    const qs = next.toString();
    history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
    window.dispatchEvent(new Event(EVENT));
  },
  subscribe(onChange) {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('popstate', onChange);
    window.addEventListener(EVENT, onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener(EVENT, onChange);
    };
  },
};

export type UrlStateShape = Record<string, string | string[] | number | boolean>;

function parseValue(params: URLSearchParams, key: string, fallback: string | string[] | number | boolean) {
  if (!params.has(key)) return fallback;
  if (Array.isArray(fallback)) {
    // A single value may be the legacy comma form (a,b); repeated keys are taken as written.
    const all = params.getAll(key);
    return (all.length === 1 ? all[0].split(',') : all).filter(Boolean);
  }
  const raw = params.get(key) ?? '';
  if (typeof fallback === 'number') {
    if (raw.trim() === '') return fallback;
    const n = Number(raw);
    return Number.isNaN(n) ? fallback : n;
  }
  if (typeof fallback === 'boolean') {
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    return fallback;
  }
  return raw;
}

function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  return a === b;
}

function parse<S extends UrlStateShape>(params: URLSearchParams, defaults: S, prefix: string): S {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) out[key] = parseValue(params, prefix + key, defaults[key]);
  return out as S;
}

/**
 * Typed URL query state. Values equal to the default are left out of the URL, other keys in
 * the URL are kept. Strings, numbers, booleans (written as 1/0) and string arrays (repeated
 * keys) are supported; the type of each default decides how its key is parsed.
 * `prefix: 'j'` stores `q` as `j.q`. Returns [state, patch, reset].
 */
export function useUrlState<S extends UrlStateShape>(
  defaults: S,
  o: { adapter?: UrlStateAdapter; prefix?: string } = {},
): [S, (patch: Partial<S> | ((prev: S) => Partial<S>)) => void, () => void] {
  const adapter = o.adapter ?? locationAdapter;
  const prefix = o.prefix ? `${o.prefix}.` : '';
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;
  const defaultsKey = JSON.stringify(defaults);

  const search = useSyncExternalStore(
    adapter.subscribe,
    () => adapter.get().toString(),
    () => '',
  );
  const state = useMemo(() => parse(new URLSearchParams(search), defaultsRef.current, prefix), [search, prefix, defaultsKey]);

  const write = useCallback(
    (next: Partial<S>) => {
      const d = defaultsRef.current;
      const params = adapter.get();
      for (const key of Object.keys(next)) {
        if (!(key in d)) continue;
        const name = prefix + key;
        const value = next[key] as S[string];
        params.delete(name);
        if (same(value, d[key])) continue;
        if (Array.isArray(value)) {
          if (value.length === 0) params.append(name, '');
          else {
            for (const v of value) params.append(name, v);
            // A lone value with a comma would be read back as the legacy comma form: add an empty key.
            if (value.length === 1 && value[0].includes(',')) params.append(name, '');
          }
        } else if (typeof value === 'boolean') params.set(name, value ? '1' : '0');
        else params.set(name, String(value));
      }
      adapter.set(params);
    },
    [adapter, prefix],
  );

  const patch = useCallback(
    (p: Partial<S> | ((prev: S) => Partial<S>)) => {
      const prev = parse(adapter.get(), defaultsRef.current, prefix);
      write(typeof p === 'function' ? p(prev) : p);
    },
    [adapter, prefix, write],
  );

  const reset = useCallback(() => {
    const params = adapter.get();
    for (const key of Object.keys(defaultsRef.current)) params.delete(prefix + key);
    adapter.set(params);
  }, [adapter, prefix]);

  return [state, patch, reset];
}
