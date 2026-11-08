"use client";

// src/components/toast.tsx
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { cn } from "../cn.js";
import { shared } from "../runtime.js";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from "./icons.js";
import { Portal } from "./portal.js";
import { useNishStrings } from "./provider.js";
import { jsx, jsxs } from "react/jsx-runtime";
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
  const asked = o.duration === Infinity ? "sticky" : o.duration;
  const duration = asked ?? (tone === "error" ? "sticky" : AUTO_DISMISS_MS);
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
        push("success", typeof messages.success === "function" ? messages.success(value) : messages.success, { id: slot });
      },
      (error) => {
        push("error", typeof messages.error === "function" ? messages.error(error) : messages.error, { id: slot });
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
var TONE = {
  success: {
    icon: /* @__PURE__ */ jsx(CheckCircleIcon, { size: 15, className: "text-th-ok" }),
    className: "border-th-ok/35"
  },
  error: {
    icon: /* @__PURE__ */ jsx(AlertTriangleIcon, { size: 15, className: "text-th-loss" }),
    className: "border-th-loss/40"
  },
  warn: {
    icon: /* @__PURE__ */ jsx(AlertTriangleIcon, { size: 15, className: "text-th-warn" }),
    className: "border-th-warn/40"
  },
  info: {
    icon: /* @__PURE__ */ jsx(InfoIcon, { size: 15, className: "text-th-accent" }),
    className: "border-th-line-strong"
  }
};
var DESKTOP_BOTTOM = {
  sm: "sm:bottom-0 sm:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]",
  md: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] md:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]",
  lg: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] lg:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]"
};
function Toaster({ className, offset, offsetUntil = "md", style: userStyle, ref, ...rest }) {
  const list = useToasts();
  const [polite, setPolite] = useState({ text: "", seq: 0 });
  const [assertive, setAssertive] = useState({ text: "", seq: 0 });
  const announced = useRef(/* @__PURE__ */ new Set());
  const timers = useRef({
    queue: { polite: [], assertive: [] },
    flush: {},
    clear: {}
  });
  useEffect(() => {
    const t = timers.current;
    for (const item of list) {
      if (announced.current.has(item.id)) continue;
      announced.current.add(item.id);
      const text = item.body ? `${item.title}. ${item.body}` : item.title;
      t.queue[item.tone === "error" ? "assertive" : "polite"].push(text);
    }
    for (const kind of ["polite", "assertive"]) {
      if (t.queue[kind].length === 0 || t.flush[kind] !== void 0) continue;
      const write = kind === "assertive" ? setAssertive : setPolite;
      t.flush[kind] = setTimeout(() => {
        t.flush[kind] = void 0;
        const text = t.queue[kind].join(". ");
        t.queue[kind] = [];
        write((p) => ({ text, seq: p.seq + 1 }));
        clearTimeout(t.clear[kind]);
        t.clear[kind] = setTimeout(() => write((p) => ({ text: "", seq: p.seq + 1 })), 5e3);
      }, 100);
    }
    const live = new Set(list.map((i) => i.id));
    announced.current.forEach((id) => {
      if (!live.has(id)) announced.current.delete(id);
    });
  }, [list]);
  useEffect(() => {
    const t = timers.current;
    return () => {
      clearTimeout(t.flush.polite);
      clearTimeout(t.flush.assertive);
      t.flush = {};
      t.queue = { polite: [], assertive: [] };
      clearTimeout(t.clear.polite);
      clearTimeout(t.clear.assertive);
    };
  }, []);
  const style = offset ? { ...userStyle, "--nish-toast-offset": offset } : userStyle;
  return /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      style,
      "data-nish-keep-active": "",
      className: cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[var(--nish-z-toast,60)] flex flex-col items-center gap-2 px-3",
        "pb-[var(--nish-toast-offset,max(calc(var(--nish-bottom-inset,0px)+8px),calc(12px+env(safe-area-inset-bottom))))]",
        "max-sm:[html[data-nish-layer-open]_&]:bottom-auto max-sm:[html[data-nish-layer-open]_&]:top-[max(12px,env(safe-area-inset-top))] max-sm:[html[data-nish-layer-open]_&]:pb-0",
        "sm:inset-x-auto sm:end-5 sm:w-96 sm:items-stretch sm:px-0",
        DESKTOP_BOTTOM[offsetUntil],
        className
      ),
      children: [
        /* @__PURE__ */ jsx("div", { role: "status", "aria-live": "polite", "aria-atomic": "true", className: "sr-only", children: /* @__PURE__ */ jsx("span", { children: polite.text }, polite.seq) }),
        /* @__PURE__ */ jsx("div", { role: "alert", "aria-live": "assertive", "aria-atomic": "true", className: "sr-only", children: /* @__PURE__ */ jsx("span", { children: assertive.text }, assertive.seq) }),
        list.map((t) => /* @__PURE__ */ jsx(ToastCard, { t }, t.id))
      ]
    }
  ) });
}
var SWIPE_DISMISS_FRACTION = 0.35;
var SWIPE_DISMISS_VELOCITY = 0.5;
var SWIPE_SLOP = 8;
function ToastCard({ t }) {
  const strings = useNishStrings();
  const ref = useRef(null);
  const drag = useRef(null);
  const setOffset = (dx, width) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = dx === 0 ? "" : `translateX(${dx}px)`;
    el.style.opacity = dx === 0 ? "" : String(Math.max(0, 1 - Math.abs(dx) / width));
  };
  const onDown = (e) => {
    if (e.pointerType === "mouse") return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      active: false
    };
  };
  const onMove = (e) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < SWIPE_SLOP || Math.abs(dx) < Math.abs(e.clientY - d.startY)) return;
      d.active = true;
      el.setPointerCapture(e.pointerId);
      pauseTimer(t.id);
    }
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    setOffset(dx, el.offsetWidth);
  };
  const onUp = (e) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el || d.pointerId !== e.pointerId || !d.active) return;
    const dx = e.clientX - d.startX;
    const width = el.offsetWidth;
    const flung = Math.abs(d.velocity) > SWIPE_DISMISS_VELOCITY && Math.sign(d.velocity) === Math.sign(dx);
    if (Math.abs(dx) > width * SWIPE_DISMISS_FRACTION || flung) {
      dismissToast(t.id);
      return;
    }
    el.style.transition = "transform 160ms var(--nish-ease-out), opacity 160ms var(--nish-ease-out)";
    setOffset(0, width);
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transition = "";
    }, 180);
    resumeTimer(t.id);
  };
  const onCancel = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active || d.pointerId !== e.pointerId) return;
    setOffset(0, ref.current?.offsetWidth || 1);
    resumeTimer(t.id);
  };
  const leave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) resumeTimer(t.id);
  };
  const enter = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) pauseTimer(t.id);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      onPointerDown: onDown,
      onPointerMove: onMove,
      onPointerUp: onUp,
      onPointerCancel: onCancel,
      onPointerEnter: (e) => e.pointerType === "mouse" && pauseTimer(t.id),
      onPointerLeave: (e) => e.pointerType === "mouse" && resumeTimer(t.id),
      onFocus: enter,
      onBlur: leave,
      className: cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop",
        "touch-pan-y animate-[nish-rise-in_160ms_var(--nish-ease-out)]",
        "max-sm:[html[data-nish-layer-open]_&]:animate-[nish-toast-in-top_200ms_var(--nish-ease-out)]",
        TONE[t.tone].className
      ),
      children: [
        /* @__PURE__ */ jsx("span", { className: "mt-0.5 shrink-0", children: TONE[t.tone].icon }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium leading-snug text-th-hi", children: t.title }),
          t.body ? /* @__PURE__ */ jsx("p", { className: "mt-0.5 break-words text-xs leading-snug text-th-hi2", children: t.body }) : null
        ] }),
        t.action ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              t.action?.onClick();
              dismissToast(t.id);
            },
            className: "-my-1 inline-flex shrink-0 items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-th-accent transition-colors hover:bg-th-accent-soft pointer-coarse:-my-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
            children: t.action.label
          }
        ) : null,
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => dismissToast(t.id),
            "aria-label": strings.dismiss,
            className: "-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:-my-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
            children: /* @__PURE__ */ jsx(XIcon, { size: 14 })
          }
        )
      ]
    }
  );
}
export {
  Toaster,
  dismissToast,
  toast,
  useToast
};
