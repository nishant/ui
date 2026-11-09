"use client";

// src/components/url-state.ts
import { useCallback, useMemo, useSyncExternalStore } from "react";
var EVENT = "nish:urlstate";
var locationAdapter = {
  get() {
    if (typeof location === "undefined") return new URLSearchParams();
    try {
      return new URLSearchParams(location.search);
    } catch {
      return new URLSearchParams();
    }
  },
  set(next) {
    if (typeof location === "undefined" || typeof history === "undefined") return;
    const qs = next.toString();
    try {
      history.replaceState(history.state, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
    } catch {
      return;
    }
    window.dispatchEvent(new Event(EVENT));
  },
  subscribe(onChange) {
    if (typeof window === "undefined") return () => {
    };
    window.addEventListener("popstate", onChange);
    window.addEventListener(EVENT, onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener(EVENT, onChange);
    };
  }
};
function parseValue(params, key, fallback, comma) {
  if (!params.has(key)) return fallback;
  if (Array.isArray(fallback)) {
    const all = params.getAll(key);
    return (comma && all.length === 1 ? all[0].split(",") : all).filter(Boolean);
  }
  const raw = params.get(key) ?? "";
  if (typeof fallback === "number") {
    if (raw.trim() === "") return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof fallback === "boolean") {
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    return fallback;
  }
  return raw;
}
function same(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  return a === b;
}
function parse(params, defaults, prefix, comma) {
  const out = {};
  for (const key of Object.keys(defaults)) out[key] = parseValue(params, prefix + key, defaults[key], isComma(comma, key));
  return out;
}
var isComma = (comma, key) => Array.isArray(comma) ? comma.includes(key) : comma === true;
function useUrlState(defaults, o = {}) {
  const adapter = o.adapter ?? locationAdapter;
  const prefix = o.prefix ? `${o.prefix}.` : "";
  const commaKey = JSON.stringify(o.comma ?? false);
  const comma = useMemo(() => JSON.parse(commaKey), [commaKey]);
  const defaultsKey = JSON.stringify(defaults);
  const stableDefaults = useMemo(() => JSON.parse(defaultsKey), [defaultsKey]);
  const search = useSyncExternalStore(
    adapter.subscribe,
    () => adapter.get().toString(),
    () => ""
  );
  const state = useMemo(() => parse(new URLSearchParams(search), stableDefaults, prefix, comma), [search, prefix, stableDefaults, comma]);
  const write = useCallback(
    (next) => {
      const d = stableDefaults;
      const params = adapter.get();
      for (const key of Object.keys(next)) {
        if (!(key in d)) continue;
        const name = prefix + key;
        const value = next[key];
        params.delete(name);
        if (value === void 0 || value === null) continue;
        if (same(value, d[key])) continue;
        if (Array.isArray(value)) {
          if (value.length === 0) params.append(name, "");
          else {
            for (const v of value) params.append(name, v);
            if (isComma(comma, key) && value.length === 1 && value[0].includes(",")) params.append(name, "");
          }
        } else if (typeof value === "boolean") params.set(name, value ? "1" : "0");
        else params.set(name, String(value));
      }
      adapter.set(params);
    },
    [adapter, stableDefaults, prefix, comma]
  );
  const patch = useCallback(
    (p) => {
      const prev = parse(adapter.get(), stableDefaults, prefix, comma);
      write(typeof p === "function" ? p(prev) : p);
    },
    [adapter, stableDefaults, prefix, comma, write]
  );
  const reset = useCallback(() => {
    const params = adapter.get();
    for (const key of Object.keys(stableDefaults)) params.delete(prefix + key);
    adapter.set(params);
  }, [adapter, stableDefaults, prefix]);
  return [state, patch, reset];
}
export {
  locationAdapter,
  useUrlState
};
