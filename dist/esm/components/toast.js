"use client";

// src/components/toast.tsx
import { useEffect, useRef, useState } from "react";
import { cn } from "../cn.js";
import { XIcon } from "./icons.js";
import { lazyModule, preloadWhenIdle, useLazyModule } from "./lazy-module.js";
import { Portal } from "./portal.js";
import { useStrings } from "./provider.js";
import { DISPLAY_STRINGS } from "./strings.js";
import { dismissToast, useToasts } from "./toast-store.js";
import { toast, useToast, dismissToast as dismissToast2 } from "./toast-store.js";
import { jsx, jsxs } from "react/jsx-runtime";
var cardFailed = false;
var cardModule = /* @__PURE__ */ lazyModule(
  () => import("./toast-card.js").catch((e) => {
    cardFailed = true;
    throw e;
  })
);
var DESKTOP_BOTTOM = {
  sm: "sm:bottom-0 sm:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]",
  md: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] md:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]",
  lg: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] lg:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]"
};
function Toaster({ className, offset, offsetUntil = "md", style: userStyle, ref, ...rest }) {
  const list = useToasts();
  useEffect(() => cardFailed ? void 0 : preloadWhenIdle(cardModule), []);
  const card = useLazyModule(cardModule, list.length > 0 && !cardFailed);
  const Card = card?.ToastCard;
  const stack = useRef(null);
  const focused = useRef(null);
  useEffect(() => {
    const f = focused.current;
    if (!Card || !f || document.activeElement !== document.body) return;
    const at = list.findIndex((i) => i.id === f[0]);
    const btn = [...stack.current?.children[at]?.querySelectorAll("button") ?? []].find(
      (b) => (b.getAttribute("aria-label") ?? b.textContent) === f[1]
    );
    btn?.focus();
  }, [Card]);
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
        /* @__PURE__ */ jsx("div", { ref: stack, className: "contents", children: list.map((t) => Card ? /* @__PURE__ */ jsx(Card, { t }, t.id) : /* @__PURE__ */ jsx(ToastFallback, { t, focusedRef: focused }, t.id)) })
      ]
    }
  ) });
}
function ToastFallback({ t, focusedRef }) {
  const strings = useStrings(DISPLAY_STRINGS);
  const track = (e) => {
    focusedRef.current = [t.id, e.currentTarget.getAttribute("aria-label") ?? e.currentTarget.textContent];
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-nish-toast-fallback": "",
      className: "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border border-th-line-strong bg-th-elevated px-3.5 py-3 shadow-pop animate-[nish-rise-in_160ms_var(--nish-ease-out)]",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium leading-snug text-th-hi", children: t.title }),
          t.body ? /* @__PURE__ */ jsx("p", { className: "mt-0.5 break-words text-xs leading-snug text-th-hi2", children: t.body }) : null
        ] }),
        t.action ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onFocus: track,
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
            onFocus: track,
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
  dismissToast2 as dismissToast,
  toast,
  useToast
};
