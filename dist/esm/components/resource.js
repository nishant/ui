"use client";

// src/components/resource.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useLatest } from "./latest.js";
import { apiFetch } from "./resource-classes.js";
import { ApiError, apiFetch as apiFetch2, configureApi } from "./resource-classes.js";
var MAX_BACKOFF_MS = 3e5;
var inflight = /* @__PURE__ */ new Map();
function sharedFetch(key, fetcher, signal) {
  let entry = inflight.get(key);
  if (!entry || entry.fetcher !== fetcher) {
    const ctl = new AbortController();
    const made = {
      fetcher,
      ctl,
      refs: 0,
      promise: fetcher ? fetcher(ctl.signal) : apiFetch(key, { signal: ctl.signal })
    };
    const forget = () => {
      if (inflight.get(key) === made) inflight.delete(key);
    };
    made.promise.then(forget, forget);
    inflight.set(key, made);
    entry = made;
  }
  const shared = entry;
  shared.refs++;
  return new Promise((resolve, reject) => {
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      signal.removeEventListener("abort", onAbort);
      shared.refs--;
      if (shared.refs <= 0) {
        shared.ctl.abort();
        if (inflight.get(key) === shared) inflight.delete(key);
      }
    };
    function onAbort() {
      release();
      reject(new DOMException("The request was aborted.", "AbortError"));
    }
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    shared.promise.then(
      (v) => {
        if (!released) resolve(v);
      },
      (e) => {
        if (!released) reject(e);
      }
    );
  });
}
function useResource(key, fetcher, o = {}) {
  const { intervalMs, enabled = true, refetchOnVisible = 3e4, refetchOnReconnect = true, keepPrevious = true } = o;
  const active = enabled && key !== null;
  const [state, setState] = useState(() => ({
    key,
    data: o.initialData,
    error: void 0,
    updatedAt: void 0,
    fetching: false,
    settled: 0
  }));
  const fetcherRef = useLatest(fetcher);
  const keyRef = useLatest(key);
  const keepPrevRef = useLatest(keepPrevious);
  const initialRef = useLatest(o.initialData);
  const ctlRef = useRef(null);
  const runRef = useRef(0);
  const pollSkippedRef = useRef(false);
  const failuresRef = useRef(0);
  const mutatedRef = useRef(0);
  const [now, setNow] = useState(() => Date.now());
  const load = useCallback(
    async (fresh = false) => {
      const k = keyRef.current;
      if (k === null) return;
      ctlRef.current?.abort();
      const ctl = new AbortController();
      ctlRef.current = ctl;
      const run = ++runRef.current;
      const mutatedAtStart = mutatedRef.current;
      pollSkippedRef.current = false;
      setState(
        (s) => s.key === k ? { ...s, fetching: true } : {
          key: k,
          data: keepPrevRef.current ? s.data : initialRef.current,
          error: void 0,
          updatedAt: keepPrevRef.current ? s.updatedAt : void 0,
          fetching: true,
          settled: s.settled,
          loaded: false
        }
      );
      try {
        const fn = fetcherRef.current;
        const data2 = await (fresh ? fn ? fn(ctl.signal) : apiFetch(k, { signal: ctl.signal }) : sharedFetch(k, fn, ctl.signal));
        if (run !== runRef.current || ctl.signal.aborted) return;
        failuresRef.current = 0;
        if (mutatedRef.current !== mutatedAtStart) {
          setState((s) => ({ ...s, key: k, error: void 0, fetching: false, settled: s.settled + 1, loaded: true }));
          return;
        }
        setState((s) => ({ key: k, data: data2, error: void 0, updatedAt: Date.now(), fetching: false, settled: s.settled + 1, loaded: true }));
      } catch (e) {
        if (run !== runRef.current || ctl.signal.aborted) return;
        failuresRef.current++;
        const error2 = e instanceof Error ? e : new Error(String(e));
        setState((s) => ({ ...s, key: k, error: error2, fetching: false, settled: s.settled + 1 }));
      }
    },
    [fetcherRef, initialRef, keepPrevRef, keyRef]
  );
  useEffect(() => {
    if (!active) return;
    failuresRef.current = 0;
    void load();
    return () => {
      runRef.current++;
      ctlRef.current?.abort();
      ctlRef.current = null;
      setState((s) => s.fetching ? { ...s, fetching: false } : s);
    };
  }, [active, key, load]);
  const fetching = state.fetching;
  const updatedAt = state.updatedAt;
  const settled = state.settled;
  useEffect(() => {
    if (!active || !intervalMs || fetching) return;
    const failures = failuresRef.current;
    let wait = intervalMs;
    if (failures > 0) {
      const cap = Math.max(intervalMs, MAX_BACKOFF_MS);
      const base = Math.min(intervalMs * 2 ** Math.min(failures, 20), cap);
      wait = Math.min(cap, Math.round(base * (0.9 + Math.random() * 0.2)));
    }
    const id = setTimeout(() => {
      if (typeof document !== "undefined" && document.hidden) {
        pollSkippedRef.current = true;
        return;
      }
      void load();
    }, wait);
    return () => clearTimeout(id);
  }, [active, intervalMs, fetching, settled, load]);
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    let hiddenAt = document.hidden ? Date.now() : null;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      const skipped = pollSkippedRef.current;
      pollSkippedRef.current = false;
      if (skipped || refetchOnVisible !== false && away >= refetchOnVisible) void load();
    };
    const onOnline = () => {
      if (refetchOnReconnect) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [active, refetchOnVisible, refetchOnReconnect, load]);
  useEffect(() => {
    if (!intervalMs || updatedAt === void 0) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, updatedAt]);
  const mutate = useCallback((next) => {
    mutatedRef.current++;
    setState((s) => ({
      ...s,
      data: typeof next === "function" ? next(s.data) : next
    }));
  }, []);
  const reload = useCallback(() => load(true), [load]);
  const sameKey = state.key === key;
  const data = sameKey || keepPrevious ? state.data : o.initialData;
  const error = sameKey ? state.error : void 0;
  const stale = !!intervalMs && updatedAt !== void 0 && Math.max(now, updatedAt) - updatedAt > intervalMs * 3;
  return {
    data,
    error,
    loading: active && data === void 0 && error === void 0 && !(sameKey && state.loaded),
    refreshing: state.fetching || active && !sameKey,
    updatedAt,
    stale,
    reload,
    mutate
  };
}
export {
  ApiError,
  apiFetch2 as apiFetch,
  configureApi,
  useResource
};
