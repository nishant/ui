"use client";

// src/components/hooks.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from "react";
import { cn } from "../cn.js";
import { ago, dateTime } from "../format.js";
import { BREAKPOINTS, NARROW_QUERY, PHONE_QUERY } from "./hooks-classes.js";
import { shared } from "../runtime.js";
import { useNishContext } from "./provider.js";
import { jsx } from "react/jsx-runtime";
var queries = /* @__PURE__ */ new Map();
function hasMatchMedia() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}
function entryFor(query) {
  let entry = queries.get(query);
  if (!entry) {
    const mql = window.matchMedia(query);
    const created = {
      mql,
      matches: mql.matches,
      listening: false,
      subs: /* @__PURE__ */ new Set(),
      onChange: () => {
        created.matches = mql.matches;
        created.subs.forEach((fn) => fn());
      }
    };
    queries.set(query, created);
    entry = created;
  }
  return entry;
}
function subscribeQuery(query, cb) {
  if (!hasMatchMedia()) return () => {
  };
  const owner = entryFor(query);
  if (!owner.listening) {
    owner.listening = true;
    owner.matches = owner.mql.matches;
    owner.mql.addEventListener("change", owner.onChange);
  }
  owner.subs.add(cb);
  return () => {
    owner.subs.delete(cb);
    if (owner.subs.size === 0) {
      owner.listening = false;
      owner.mql.removeEventListener("change", owner.onChange);
      if (queries.get(query) === owner) queries.delete(query);
    }
  };
}
function queryMatches(query) {
  if (!hasMatchMedia()) return false;
  const entry = entryFor(query);
  return entry.listening ? entry.matches : entry.mql.matches;
}
function useMediaQuery(query) {
  const subscribe = useCallback((onChange) => subscribeQuery(query, onChange), [query]);
  const get = useCallback(() => queryMatches(query), [query]);
  return useSyncExternalStore(subscribe, get, () => false);
}
var BREAKPOINT_QUERIES = ["xl", "lg", "md", "sm"].map((name) => [
  name,
  `(min-width: ${BREAKPOINTS[name]}px)`
]);
function usePhone() {
  return useMediaQuery(PHONE_QUERY);
}
function useNarrow() {
  return useMediaQuery(NARROW_QUERY);
}
function currentBreakpoint() {
  for (const [name, q] of BREAKPOINT_QUERIES) if (queryMatches(q)) return name;
  return "base";
}
function subscribeBreakpoint(onChange) {
  const stops = BREAKPOINT_QUERIES.map(([, q]) => subscribeQuery(q, onChange));
  return () => stops.forEach((stop) => stop());
}
function useBreakpoint() {
  return useSyncExternalStore(subscribeBreakpoint, currentBreakpoint, () => "base");
}
var titles = () => shared("documentTitle", () => ({
  entries: [],
  base: null,
  seq: 0
}));
function applyTitle() {
  const { entries } = titles();
  let winner = entries[entries.length - 1];
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].titled) {
      winner = entries[i];
      break;
    }
  }
  if (winner) document.title = winner.next;
}
function useDocumentTitle(title, o = {}) {
  const app = o.app;
  const [id] = useState(() => ++titles().seq);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const next = title && app ? `${title} \xB7 ${app}` : title || app;
    if (!next) return;
    const t = titles();
    if (t.entries.length === 0) t.base = document.title;
    const entry = { id, next, titled: !!title };
    const at = t.entries.findIndex((e) => e.id === id);
    if (at >= 0) t.entries[at] = entry;
    else t.entries.push(entry);
    applyTitle();
    return () => {
      const cur = titles();
      cur.entries = cur.entries.filter((e) => e.id !== id);
      if (cur.entries.length === 0) {
        if (cur.base !== null) document.title = cur.base;
        cur.base = null;
      } else applyTitle();
    };
  }, [title, app, id]);
}
function useNow(intervalMs = 3e4) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (typeof document === "undefined") return;
    let id;
    const start = () => {
      if (id === void 0) id = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (id !== void 0) clearInterval(id);
      id = void 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        start();
      } else stop();
    };
    if (document.visibilityState !== "hidden") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
  return now;
}
var local = () => shared("localStorage", () => ({
  subs: /* @__PURE__ */ new Map(),
  memory: /* @__PURE__ */ new Map(),
  listening: false,
  handler: void 0
}));
var warned = /* @__PURE__ */ new Set();
function notify(key) {
  if (key === null) local().subs.forEach((set) => set.forEach((fn) => fn()));
  else local().subs.get(key)?.forEach((fn) => fn());
}
function onStorageEvent(e) {
  if (e.key !== null) local().memory.delete(e.key);
  else local().memory.clear();
  notify(e.key);
}
function subscribeKey(key, cb) {
  if (typeof window === "undefined") return () => {
  };
  let set = local().subs.get(key);
  if (!set) local().subs.set(key, set = /* @__PURE__ */ new Set());
  const subs = set;
  subs.add(cb);
  const rec = local();
  if (!rec.handler) {
    rec.handler = onStorageEvent;
    rec.listening = true;
    window.addEventListener("storage", rec.handler);
  }
  return () => {
    subs.delete(cb);
    const r = local();
    if (subs.size === 0 && r.subs.get(key) === subs) r.subs.delete(key);
    if (r.subs.size === 0 && r.handler) {
      window.removeEventListener("storage", r.handler);
      r.handler = void 0;
      r.listening = false;
    }
  };
}
function readText(key) {
  const kept = local().memory.get(key);
  if (kept !== void 0) return kept;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function parseStored(key, text, initial, raw) {
  if (text === null) return initial;
  if (raw) return text;
  try {
    return JSON.parse(text);
  } catch {
    const id = key + "\0" + text;
    if (globalThis.process?.env?.NODE_ENV !== "production" && !warned.has(id)) {
      warned.add(id);
      console.warn(`nish-ui: useLocalStorage("${key}") found text that is not valid JSON; using the initial value.`);
    }
    return initial;
  }
}
function useLocalStorage(key, initial, o = {}) {
  const raw = !!o.raw;
  const [held, setHeld] = useState(() => ({ key, initial }));
  if (held.key !== key) setHeld({ key, initial });
  const first = held.key === key ? held.initial : initial;
  const subscribe = useCallback((onChange) => subscribeKey(key, onChange), [key]);
  const get = useCallback(() => readText(key), [key]);
  const text = useSyncExternalStore(subscribe, get, () => null);
  const value = useMemo(() => parseStored(key, text, first, raw), [key, text, first, raw]);
  const setValue = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(parseStored(key, readText(key), first, raw)) : next;
      const out = raw ? String(resolved) : JSON.stringify(resolved);
      try {
        window.localStorage.setItem(key, out);
        local().memory.delete(key);
      } catch {
        local().memory.set(key, out);
      }
      notify(key);
    },
    [key, raw, first]
  );
  return [value, setValue];
}
function RelativeTime({
  value,
  style: textStyle = "short",
  refreshMs = 3e4,
  locale,
  className,
  ref,
  ...rest
}) {
  const now = useNow(refreshMs);
  const config = useNishContext();
  const loc = locale ?? config.locale;
  const d = new Date(value);
  const iso = Number.isNaN(d.getTime()) ? void 0 : d.toISOString();
  return /* @__PURE__ */ jsx(
    "time",
    {
      ...rest,
      ref,
      dateTime: iso,
      title: dateTime(value, { locale: loc }),
      className: cn("tabular-nums", className),
      suppressHydrationWarning: true,
      children: ago(value, { now, style: textStyle, locale: loc })
    }
  );
}
export {
  BREAKPOINTS,
  NARROW_QUERY,
  PHONE_QUERY,
  RelativeTime,
  useBreakpoint,
  useDocumentTitle,
  useLocalStorage,
  useMediaQuery,
  useNarrow,
  useNow,
  usePhone
};
