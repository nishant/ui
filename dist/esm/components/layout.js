"use client";

// src/components/layout.tsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { cn } from "../cn.js";
import { mergeRefs } from "./data-classes.js";
import { Callout } from "./display.js";
import { useHeightVar, useStuck } from "./layout-vars.js";
import { Button } from "./primitives.js";
import { useStrings } from "./provider.js";
import { STATUS_STRINGS } from "./strings.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function StickyBar({
  children,
  top = "var(--nish-header-h, 0px)",
  elevate = true,
  as = "div",
  className,
  style,
  ref: refProp,
  ...rest
}) {
  const ref = useRef(null);
  const stuck = useStuck(ref);
  useHeightVar(ref, "--nish-sticky-extra");
  const Tag = as;
  return /* @__PURE__ */ jsx(
    Tag,
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "data-nish-bar": "",
      style: { top, ...style },
      className: cn(
        "sticky z-[var(--nish-z-sticky,20)] -mx-[var(--nish-page-gutter)] border-b bg-th-bg px-[var(--nish-page-gutter)]",
        elevate && stuck ? "border-th-line shadow-card" : "border-transparent",
        className
      ),
      children
    }
  );
}
function StickyActionBar({
  open,
  message,
  primary,
  secondary,
  label,
  className,
  ref: refProp,
  ...rest
}) {
  const strings = useStrings(STATUS_STRINGS);
  const ref = useRef(null);
  useHeightVar(ref, "--nish-bottom-bar-h", open);
  if (!open) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      role: "region",
      "aria-label": label ?? strings.actions,
      "data-state": "open",
      "data-nish-bar": "",
      "data-nish-print": "hide",
      className: cn(
        "fixed inset-x-0 bottom-[var(--nish-bottom-nav-h,0px)] z-[calc(var(--nish-z-sticky,20)+10)] flex items-center gap-3 border-t border-th-line bg-th-elevated px-4 pt-3 shadow-[var(--nish-shadow-pop)]",
        // The nav already covers the home-indicator inset; only pad for what it leaves.
        "pb-[max(0.75rem,calc(env(safe-area-inset-bottom)_-_var(--nish-bottom-nav-h,0px)))]",
        "animate-[nish-bar-in_220ms_var(--nish-ease-out)] motion-reduce:animate-none",
        "sm:inset-x-auto sm:end-6 sm:bottom-[calc(var(--nish-bottom-nav-h,0px)_+_1.5rem)] sm:rounded-[var(--nish-radius-lg)] sm:border sm:pb-3",
        className
      ),
      children: [
        message ? /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1 truncate text-sm text-th-hi2", children: message }) : /* @__PURE__ */ jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-2", children: [
          secondary,
          primary
        ] })
      ]
    }
  );
}
function LoadingBar({
  active,
  delayMs = 200,
  top = "var(--nish-header-h, 0px)",
  announce,
  className,
  style,
  ref,
  ...rest
}) {
  const strings = useStrings(STATUS_STRINGS);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const id = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(id);
  }, [active, delayMs]);
  const visible = active && shown;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    announce !== void 0 ? /* @__PURE__ */ jsx("div", { role: "status", "aria-live": "polite", className: "sr-only", "data-nish-loading-announce": "", children: visible ? announce : "" }) : null,
    visible ? /* @__PURE__ */ jsx(
      "div",
      {
        "aria-label": strings.loading,
        ...rest,
        ref,
        role: "progressbar",
        "aria-busy": "true",
        "data-state": "active",
        "data-nish-bar": "",
        "data-nish-print": "hide",
        style: { top, ...style },
        className: cn("pointer-events-none fixed inset-x-0 z-[var(--nish-z-dropdown,40)] h-0.5 overflow-hidden", className),
        children: /* @__PURE__ */ jsx("div", { className: "h-full w-2/5 bg-th-accent animate-[nish-loading-bar_1.2s_linear_infinite] motion-reduce:animate-none forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]" })
      }
    ) : null
  ] });
}
var CONTAINER_SIZE = {
  narrow: "max-w-2xl",
  default: "max-w-4xl",
  wide: "max-w-7xl",
  full: "max-w-none"
};
function PageContainer({
  size = "default",
  children,
  padBottom = true,
  as = "main",
  className,
  ref,
  ...rest
}) {
  const Tag = as;
  return /* @__PURE__ */ jsx(
    Tag,
    {
      ref,
      className: cn(
        "mx-auto w-full px-[var(--nish-page-gutter)]",
        CONTAINER_SIZE[size],
        // The bottom padding is a utility, not only .nish-pad-bottom-inset: that class is in the
        // base layer, so a py-6 utility here used to beat it and the page ended under the BottomNav.
        padBottom ? "nish-pad-bottom-inset pt-6 pb-[max(calc(var(--nish-bottom-inset,0px)+1rem),calc(1rem+env(safe-area-inset-bottom)))]" : "py-6",
        className
      ),
      ...rest,
      children
    }
  );
}
function subscribeOnline(onChange) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
function useOnline() {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}
function ConnectionBanner({
  healthUrl,
  intervalMs = 3e4,
  message = "Can't reach the server",
  offlineMessage,
  retryLabel,
  onRetry,
  ...rest
}) {
  const strings = useStrings(STATUS_STRINGS);
  const online = useOnline();
  const [reachable, setReachable] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const probeRef = useRef(null);
  useEffect(() => {
    if (!healthUrl) {
      probeRef.current = null;
      setReachable(true);
      return;
    }
    let disposed = false;
    let runId = 0;
    let failures = 0;
    let timer;
    let ctrl;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === "hidden") return;
      const delay = Math.min(intervalMs * 2 ** failures, intervalMs * 4);
      timer = setTimeout(() => void run(), delay);
    };
    const run = async () => {
      clearTimeout(timer);
      ctrl?.abort();
      const mine = ++runId;
      const c = new AbortController();
      ctrl = c;
      const cut = setTimeout(() => c.abort(), 1e4);
      let ok = false;
      try {
        const res = await fetch(healthUrl, { cache: "no-store", signal: c.signal });
        ok = res.ok;
      } catch {
        ok = false;
      } finally {
        clearTimeout(cut);
      }
      if (disposed || mine !== runId) return;
      failures = ok ? 0 : failures + 1;
      setReachable(ok);
      schedule();
    };
    probeRef.current = run;
    const onOnline = () => void run();
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
      ctrl?.abort();
      probeRef.current = null;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [healthUrl, intervalMs]);
  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      await probeRef.current?.();
    } finally {
      setRetrying(false);
    }
    onRetry?.();
  }, [onRetry]);
  if (online && reachable) return null;
  return /* @__PURE__ */ jsx(
    Callout,
    {
      variant: "bar",
      tone: "warn",
      sticky: true,
      live: true,
      compact: true,
      ...rest,
      action: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", loading: retrying, onClick: () => void retry(), children: retryLabel ?? strings.retry }),
      children: online ? message : offlineMessage ?? strings.offline
    }
  );
}
export {
  ConnectionBanner,
  LoadingBar,
  PageContainer,
  StickyActionBar,
  StickyBar,
  useOnline
};
