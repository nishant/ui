"use client";

// src/components/overlay-dialog.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../cn.js";
import { useLatest } from "./latest.js";
import { useStrings } from "./provider.js";
import { OVERLAY_STRINGS } from "./strings.js";
import { SHEET_EXIT_MS } from "./overlay-classes.js";
import { ov, isTop, syncLayerAttr, pushInert, popInert, acquireGuard, releaseGuard, prefersReducedMotion, closeVetoes, focusables, lockScroll, queueHistoryPush, cancelHistoryPush } from "./overlay-core.js";
import { jsx } from "react/jsx-runtime";
function useDialog(panelRef, onClose, closeOnBackProp = false) {
  const closeOnBack = closeOnBackProp && (typeof window === "undefined" || window.self === window.top);
  const onCloseRef = useLatest(onClose);
  useEffect(() => {
    const s = ov();
    const opener = document.activeElement;
    const panel = panelRef.current;
    const self = {};
    s.layerStack.push(self);
    s.dialogCount++;
    syncLayerAttr();
    const scrim = panel?.closest("[data-nish-layer]") ?? null;
    if (scrim) pushInert(scrim);
    const layerId = `nish-layer-${++s.layerSeq}`;
    let pushed = false;
    let rePushTimer = 0;
    const pushEntry = () => {
      const prev = history.state && typeof history.state === "object" ? history.state : {};
      history.pushState({ ...prev, nishLayer: layerId }, "");
      pushed = true;
    };
    const queuedPush = () => queueHistoryPush(pushEntry);
    if (closeOnBack) acquireGuard();
    const pushTimer = closeOnBack ? window.setTimeout(queuedPush, 0) : 0;
    function onPop() {
      if (!pushed) return;
      if (history.state?.nishLayer === layerId) return;
      pushed = false;
      if (!isTop(self)) {
        pushEntry();
        return;
      }
      onCloseRef.current();
      window.clearTimeout(rePushTimer);
      rePushTimer = window.setTimeout(() => {
        if (!pushed) queuedPush();
      }, SHEET_EXIT_MS + 60);
    }
    if (closeOnBack) window.addEventListener("popstate", onPop);
    const focusTimer = window.setTimeout(() => {
      if (panel && !panel.contains(document.activeElement)) {
        (panel.querySelector("[data-autofocus],[autofocus]") ?? panel).focus();
      }
    }, 0);
    const unlock = lockScroll();
    function onKey(e) {
      if (!isTop(self)) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = focusables(panel);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(pushTimer);
      window.clearTimeout(rePushTimer);
      cancelHistoryPush(pushEntry);
      window.removeEventListener("popstate", onPop);
      const at = s.layerStack.indexOf(self);
      if (at >= 0) s.layerStack.splice(at, 1);
      s.dialogCount--;
      syncLayerAttr();
      if (scrim) popInert(scrim);
      document.removeEventListener("keydown", onKey);
      unlock();
      opener?.focus?.();
      if (pushed && history.state?.nishLayer === layerId) {
        s.pendingBacks++;
        history.back();
      }
      if (closeOnBack) releaseGuard();
    };
  }, [panelRef, closeOnBack, onCloseRef]);
}
function useSheetExit(onClose, canClose, onOpenChange) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timer = useRef(0);
  const onCloseRef = useLatest(onClose);
  const openChangeRef = useLatest(onOpenChange);
  const canCloseRef = useLatest(canClose);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const fire = useCallback(() => {
    onCloseRef.current?.();
    openChangeRef.current?.(false);
  }, [onCloseRef, openChangeRef]);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    const handler = onCloseRef.current;
    if (handler && closeVetoes.get(handler)?.()) return;
    if (canCloseRef.current && !canCloseRef.current()) return;
    if (prefersReducedMotion()) {
      fire();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      fire();
      closingRef.current = false;
      setClosing(false);
    }, SHEET_EXIT_MS);
  }, [canCloseRef, fire, onCloseRef]);
  const closeNow = useCallback(() => {
    fire();
  }, [fire]);
  const isClosing = useCallback(() => closingRef.current, []);
  const allowClose = useCallback(() => {
    const handler = onCloseRef.current;
    if (handler && closeVetoes.get(handler)?.()) return false;
    return !canCloseRef.current || canCloseRef.current();
  }, [canCloseRef, onCloseRef]);
  return { closing, requestClose, closeNow, isClosing, allowClose };
}
function useSheetSwipe(panelRef, scrimRef, enabled, onDismiss, allow = () => true) {
  const drag = useRef(null);
  const timer = useRef(0);
  const enabledRef = useLatest(enabled);
  const dismissRef = useLatest(onDismiss);
  const allowRef = useLatest(allow);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onPointerDown = useCallback(
    (e) => {
      if (drag.current || !enabledRef.current()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const hit = e.target.closest('button,a,input,select,textarea,[role="button"]');
      if (hit && hit !== e.currentTarget) return;
      const panel = panelRef.current;
      if (!panel) return;
      window.clearTimeout(timer.current);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      panel.style.transition = "none";
      if (scrimRef.current) scrimRef.current.style.transition = "none";
      drag.current = {
        startY: e.clientY,
        dy: 0,
        lastY: e.clientY,
        lastT: e.timeStamp,
        v: 0
      };
    },
    [enabledRef, panelRef, scrimRef]
  );
  const onPointerMove = useCallback(
    (e) => {
      const d = drag.current;
      const panel = panelRef.current;
      if (!d || !panel) return;
      d.dy = e.clientY - d.startY;
      const dt = e.timeStamp - d.lastT;
      if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
      d.lastY = e.clientY;
      d.lastT = e.timeStamp;
      panel.style.transform = `translateY(${d.dy < 0 ? d.dy * 0.3 : d.dy}px)`;
      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, d.dy) / Math.max(1, panel.offsetHeight)));
      }
    },
    [panelRef, scrimRef]
  );
  const end = useCallback(
    (e, cancelled) => {
      const d = drag.current;
      const panel = panelRef.current;
      drag.current = null;
      if (!d || !panel) return;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      const scrim = scrimRef.current;
      const velocity = e.timeStamp - d.lastT > 100 ? 0 : d.v;
      const dismiss = !cancelled && (d.dy > panel.offsetHeight * 0.3 || velocity > 0.5) && allowRef.current();
      const ms = SHEET_EXIT_MS - 20;
      panel.style.transition = `transform ${ms}ms ease-out`;
      if (scrim) scrim.style.transition = `opacity ${ms}ms ease-out`;
      if (dismiss) {
        panel.style.transform = "translateY(100%)";
        if (scrim) scrim.style.opacity = "0";
        timer.current = window.setTimeout(() => {
          dismissRef.current();
          timer.current = window.setTimeout(() => {
            if (!panel.isConnected) return;
            panel.style.transform = "";
            panel.style.transition = "";
            if (scrim) {
              scrim.style.opacity = "";
              scrim.style.transition = "";
            }
          }, 100);
        }, ms);
      } else {
        panel.style.transform = "translateY(0)";
        if (scrim) scrim.style.opacity = "1";
        timer.current = window.setTimeout(() => {
          panel.style.transform = "";
          panel.style.transition = "";
          if (scrim) {
            scrim.style.opacity = "";
            scrim.style.transition = "";
          }
        }, ms);
      }
    },
    [allowRef, dismissRef, panelRef, scrimRef]
  );
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e) => end(e, false),
    onPointerCancel: (e) => end(e, true)
  };
}
function SheetHandle({ onClose, swipe, className }) {
  const strings = useStrings(OVERLAY_STRINGS);
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "button",
      tabIndex: 0,
      "aria-label": strings.close,
      ...swipe,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      },
      className: cn(
        "flex h-5 min-h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl outline-none focus-visible:bg-th-overlay forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-2",
        className
      ),
      children: /* @__PURE__ */ jsx("span", { className: "h-1 w-10 rounded-full bg-th-line-strong forced-colors:bg-[ButtonText]", "aria-hidden": "true" })
    }
  );
}
export {
  SheetHandle,
  useDialog,
  useSheetExit,
  useSheetSwipe
};
