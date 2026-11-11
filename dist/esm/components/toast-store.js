"use client";

// src/components/toast-store.ts
import { useSyncExternalStore } from "react";
import { shared } from "../runtime.js";
var AUTO_DISMISS_MS = 4e3;
var MAX_VISIBLE = 4;
var cachedStore;
function store() {
  return cachedStore ??= shared("toast", () => ({
    items: [],
    nextId: 1,
    subs: /* @__PURE__ */ new Set(),
    timers: /* @__PURE__ */ new Map()
  }));
}
var emit = () => store().subs.forEach((fn) => fn());
function startTimer(id, ms) {
  const t = {
    handle: null,
    remaining: ms,
    started: Date.now(),
    paused: 0
  };
  t.handle = setTimeout(() => dismissToast(id), ms);
  store().timers.set(id, t);
}
function clearTimer(id) {
  const { timers } = store();
  const t = timers.get(id);
  if (t?.handle != null) clearTimeout(t.handle);
  timers.delete(id);
}
function pauseTimer(id) {
  const t = store().timers.get(id);
  if (!t) return;
  t.paused += 1;
  if (t.paused > 1 || t.handle == null) return;
  clearTimeout(t.handle);
  t.handle = null;
  t.remaining = Math.max(0, t.remaining - (Date.now() - t.started));
}
function resumeTimer(id) {
  const t = store().timers.get(id);
  if (!t || t.paused === 0) return;
  t.paused -= 1;
  if (t.paused > 0) return;
  t.started = Date.now();
  t.handle = setTimeout(() => dismissToast(id), Math.max(t.remaining, 1e3));
}
function dismissToast(id) {
  clearTimer(id);
  const s = store();
  const next = s.items.filter((t) => t.id !== id);
  if (next.length === s.items.length) return;
  s.items = next;
  emit();
}
var isKept = (t) => t.duration === "sticky" || t.tone === "error";
function push(tone, title, bodyOrOptions) {
  const o = typeof bodyOrOptions === "string" ? { body: bodyOrOptions } : bodyOrOptions ?? {};
  const s = store();
  const id = s.nextId++;
  const asked = o.duration;
  const duration = asked === "sticky" ? "sticky" : typeof asked === "number" && asked > 0 ? asked >= 2 ** 31 - 1 ? "sticky" : asked : tone === "error" ? "sticky" : AUTO_DISMISS_MS;
  const item = {
    id,
    tone,
    title,
    body: o.body,
    action: o.action,
    slot: o.id,
    duration
  };
  const old = o.id ? s.items.find((t) => t.slot === o.id) : void 0;
  if (old) {
    clearTimer(old.id);
    s.items = s.items.map((t) => t === old ? item : t);
  } else {
    let excess = s.items.length + 1 - MAX_VISIBLE;
    const kept = [];
    for (const t of s.items) {
      if (excess > 0 && !isKept(t)) {
        excess--;
        clearTimer(t.id);
      } else {
        kept.push(t);
      }
    }
    s.items = [...kept, item];
  }
  emit();
  if (duration !== "sticky") startTimer(id, duration);
  return id;
}
var toast = /* @__PURE__ */ Object.assign((title, o) => push("info", title, o), {
  success: (title, o) => push("success", title, o),
  error: (title, o) => push("error", title, o),
  warn: (title, o) => push("warn", title, o),
  info: (title, o) => push("info", title, o),
  promise: (promise, messages) => {
    const slot = "nish-promise-" + store().nextId;
    push("info", messages.loading, { duration: "sticky", id: slot });
    promise.then(
      (value) => {
        let m;
        try {
          m = typeof messages.success === "function" ? messages.success(value) : messages.success;
        } catch (e) {
          return void push("error", String(e), { id: slot });
        }
        push("success", m, { id: slot });
      },
      (error) => {
        let m;
        try {
          m = typeof messages.error === "function" ? messages.error(error) : messages.error;
        } catch (e) {
          m = String(e);
        }
        push("error", m, { id: slot });
      }
    );
    return promise;
  }
});
function useToast() {
  return toast;
}
function useToasts() {
  return useSyncExternalStore(
    (fn) => {
      const { subs } = store();
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => store().items,
    () => store().items
  );
}
export {
  dismissToast,
  pauseTimer,
  resumeTimer,
  toast,
  useToast,
  useToasts
};
