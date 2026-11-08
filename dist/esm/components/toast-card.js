"use client";

// src/components/toast-card.tsx
import { useRef } from "react";
import { cn } from "../cn.js";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from "./icons.js";
import { useStrings } from "./provider.js";
import { DISPLAY_STRINGS } from "./strings.js";
import { dismissToast, pauseTimer, resumeTimer } from "./toast-store.js";
import { jsx, jsxs } from "react/jsx-runtime";
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
var SWIPE_DISMISS_FRACTION = 0.35;
var SWIPE_DISMISS_VELOCITY = 0.5;
var SWIPE_SLOP = 8;
function ToastCard({ t }) {
  const strings = useStrings(DISPLAY_STRINGS);
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
  ToastCard
};
