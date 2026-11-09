'use client';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

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
    try {
      return new URLSearchParams(location.search);
    } catch {
      return new URLSearchParams();
    }
  },
  set(next) {
    if (typeof location === 'undefined' || typeof history === 'undefined') return;
    const qs = next.toString();
    try {
      history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
    } catch {
      // A sandboxed frame can refuse replaceState (SecurityError): the query then stays as it was.
      return;
    }
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

function parseValue(params: URLSearchParams, key: string, fallback: string | string[] | number | boolean, comma: boolean) {
  if (!params.has(key)) return fallback;
  if (Array.isArray(fallback)) {
    // Repeated keys are taken as written, so a value may hold a comma ("Austin, TX"). With
    // `comma`, a single value is read as the older comma form (a,b).
    const all = params.getAll(key);
    return (comma && all.length === 1 ? all[0].split(',') : all).filter(Boolean);
  }
  const raw = params.get(key) ?? '';
  if (typeof fallback === 'number') {
    if (raw.trim() === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
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

function parse<S extends UrlStateShape>(params: URLSearchParams, defaults: S, prefix: string, comma: CommaKeys): S {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) out[key] = parseValue(params, prefix + key, defaults[key], isComma(comma, key));
  return out as S;
}

type CommaKeys = boolean | readonly string[];
const isComma = (comma: CommaKeys, key: string) => (Array.isArray(comma) ? comma.includes(key) : comma === true);

/**
 * Typed URL query state. Values equal to the default are left out of the URL, other keys in
 * the URL are kept. Strings, numbers, booleans (written as 1/0) and string arrays (repeated
 * keys, so a value may contain a comma) are supported; the type of each default decides how
 * its key is parsed. `prefix: 'j'` stores `q` as `j.q`. `comma: true` (or a list of keys)
 * also reads a single `?k=a,b` as ['a', 'b'], for links written before repeated keys.
 * Returns [state, patch, reset].
 */
export function useUrlState<S extends UrlStateShape>(
  defaults: S,
  o: { adapter?: UrlStateAdapter; prefix?: string; comma?: boolean | readonly (keyof S & string)[] } = {},
): [S, (patch: Partial<S> | ((prev: S) => Partial<S>)) => void, () => void] {
  const adapter = o.adapter ?? locationAdapter;
  const prefix = o.prefix ? `${o.prefix}.` : '';
  // Keyed on the JSON, like the defaults, so an inline list does not change identity.
  const commaKey = JSON.stringify(o.comma ?? false);
  const comma = useMemo(() => JSON.parse(commaKey) as CommaKeys, [commaKey]);
  // Keyed on the JSON, so an inline defaults object does not re-parse on every render.
  const defaultsKey = JSON.stringify(defaults);
  const stableDefaults = useMemo(() => JSON.parse(defaultsKey) as S, [defaultsKey]);

  const search = useSyncExternalStore(
    adapter.subscribe,
    () => adapter.get().toString(),
    () => '',
  );
  const state = useMemo(() => parse(new URLSearchParams(search), stableDefaults, prefix, comma), [search, prefix, stableDefaults, comma]);

  const write = useCallback(
    (next: Partial<S>) => {
      const d = stableDefaults;
      const params = adapter.get();
      for (const key of Object.keys(next)) {
        if (!(key in d)) continue;
        const name = prefix + key;
        const value = next[key] as S[string];
        params.delete(name);
        if (value === undefined || value === null) continue;
        if (same(value, d[key])) continue;
        if (Array.isArray(value)) {
          if (value.length === 0) params.append(name, '');
          else {
            for (const v of value) params.append(name, v);
            // A lone value with a comma would be read back as the comma form: add an empty key.
            if (isComma(comma, key) && value.length === 1 && value[0].includes(',')) params.append(name, '');
          }
        } else if (typeof value === 'boolean') params.set(name, value ? '1' : '0');
        else params.set(name, String(value));
      }
      adapter.set(params);
    },
    [adapter, stableDefaults, prefix, comma],
  );

  const patch = useCallback(
    (p: Partial<S> | ((prev: S) => Partial<S>)) => {
      const prev = parse(adapter.get(), stableDefaults, prefix, comma);
      write(typeof p === 'function' ? p(prev) : p);
    },
    [adapter, stableDefaults, prefix, comma, write],
  );

  const reset = useCallback(() => {
    const params = adapter.get();
    for (const key of Object.keys(stableDefaults)) params.delete(prefix + key);
    adapter.set(params);
  }, [adapter, stableDefaults, prefix]);

  return [state, patch, reset];
}
