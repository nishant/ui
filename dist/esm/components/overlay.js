"use client";

// src/components/overlay.tsx
import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../cn.js";
import { shared } from "../runtime.js";
import { isRtl, useIsClient, useIsoLayoutEffect } from "./client.js";
import { useMediaQuery } from "./hooks.js";
import { XIcon } from "./icons.js";
import { Button, IconButton } from "./primitives.js";
import { useLatest } from "./latest.js";
import { Portal } from "./portal.js";
import { useNishConfig, useNishStrings } from "./provider.js";
import {
  CLOSE_BUTTON,
  DRAWER_SHEET_HEIGHT,
  DRAWER_WIDTH,
  MENU_ROW,
  MODAL_SIZE,
  PHONE_QUERY,
  SHEET_EXIT_MS,
  SHEET_HEIGHT_CLASS,
  keyboardFocused,
  menuItemClass,
  touchTracker
} from "./overlay-classes.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function createState() {
  const s = {
    layerStack: [],
    dialogCount: 0,
    dialogPortals: [],
    inerted: /* @__PURE__ */ new Set(),
    lockCount: 0,
    savedOverflow: null,
    pendingBacks: 0,
    queuedPushes: [],
    layerSeq: 0,
    backDialogs: 0,
    guardOn: false,
    guard: () => {
    }
  };
  s.guard = (e) => {
    if (s.pendingBacks <= 0) return;
    s.pendingBacks--;
    e.stopImmediatePropagation();
    if (s.pendingBacks === 0) {
      for (const push of s.queuedPushes.splice(0)) push();
      removeGuardIfIdle(s);
    }
  };
  return s;
}
var cachedState;
function ov() {
  return cachedState ??= shared("overlay", createState);
}
function removeGuardIfIdle(s) {
  if (s.guardOn && s.backDialogs === 0 && s.pendingBacks === 0) {
    window.removeEventListener("popstate", s.guard, true);
    s.guardOn = false;
  }
}
function acquireGuard() {
  const s = ov();
  s.backDialogs++;
  if (!s.guardOn) {
    window.addEventListener("popstate", s.guard, true);
    s.guardOn = true;
  }
}
function releaseGuard() {
  const s = ov();
  s.backDialogs--;
  removeGuardIfIdle(s);
}
var isTop = (self) => {
  const stack = ov().layerStack;
  return stack[stack.length - 1] === self;
};
function syncLayerAttr() {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (ov().dialogCount > 0) html.setAttribute("data-nish-layer-open", "");
  else html.removeAttribute("data-nish-layer-open");
}
function syncInert() {
  if (typeof document === "undefined") return;
  const { dialogPortals, inerted } = ov();
  for (let i = dialogPortals.length - 1; i >= 0; i--) if (!dialogPortals[i].isConnected) dialogPortals.splice(i, 1);
  const top = dialogPortals[dialogPortals.length - 1];
  if (!top) {
    inerted.forEach((el) => {
      el.inert = false;
      el.removeAttribute("inert");
    });
    inerted.clear();
    return;
  }
  for (const el of Array.from(document.body.children)) {
    const skip = el === top || el.contains(top) || el.hasAttribute("data-nish-keep-active");
    if (skip) {
      if (inerted.has(el)) {
        el.inert = false;
        el.removeAttribute("inert");
        inerted.delete(el);
      }
    } else if (!el.inert) {
      el.inert = true;
      el.setAttribute("inert", "");
      inerted.add(el);
    }
  }
}
function pushInert(scrim) {
  const { dialogPortals } = ov();
  if (!dialogPortals.includes(scrim)) dialogPortals.push(scrim);
  syncInert();
}
function popInert(scrim) {
  const { dialogPortals } = ov();
  const i = dialogPortals.indexOf(scrim);
  if (i >= 0) dialogPortals.splice(i, 1);
  syncInert();
}
function isPhoneViewport() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(PHONE_QUERY).matches;
}
function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
var closeVetoes = /* @__PURE__ */ new WeakMap();
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function focusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
}
function lockScroll() {
  const s = ov();
  if (s.lockCount++ === 0) {
    const html = document.documentElement;
    s.savedOverflow = {
      html: html.style.overflow,
      body: document.body.style.overflow
    };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--s.lockCount === 0 && s.savedOverflow) {
      document.documentElement.style.overflow = s.savedOverflow.html;
      document.body.style.overflow = s.savedOverflow.body;
      s.savedOverflow = null;
    }
  };
}
function layerHost(anchor, container) {
  return anchor?.closest("[data-nish-layer]") ?? container ?? document.body;
}
function queueHistoryPush(push) {
  const s = ov();
  if (s.pendingBacks > 0) s.queuedPushes.push(push);
  else push();
}
function whenHistorySettled(cb) {
  queueHistoryPush(cb);
}
function cancelHistoryPush(push) {
  const q = ov().queuedPushes;
  const i = q.indexOf(push);
  if (i >= 0) q.splice(i, 1);
}
var warnedDev = /* @__PURE__ */ new Set();
function warnDev(message) {
  if (warnedDev.has(message)) return;
  try {
    if (process.env.NODE_ENV !== "production") {
      warnedDev.add(message);
      console.warn(message);
    }
  } catch {
  }
}
function setRef(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}
function useMergedRef(external) {
  const internalRef = useRef(null);
  const callbackRef = useCallback(
    (node) => {
      internalRef.current = node;
      setRef(external, node);
    },
    [external]
  );
  return [internalRef, callbackRef];
}
function useScrollable(ref) {
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    ro?.observe(el);
    const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(check);
    mo?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [ref]);
  return scrollable;
}
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
  const allowClose = useCallback(() => !canCloseRef.current || canCloseRef.current(), [canCloseRef]);
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
        timer.current = window.setTimeout(() => dismissRef.current(), ms);
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
  const strings = useNishStrings();
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
function Modal({ open, ...props }) {
  if (open === false) return null;
  return /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(ModalPanel, { ...props }) });
}
function ModalPanel({
  title,
  onClose,
  onOpenChange,
  children,
  size = "md",
  footer,
  subtitle,
  placement = "center",
  header,
  hideClose = false,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  sheetHeight = "auto",
  dismissible = true,
  closeOnBack = true,
  canClose,
  className,
  role,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const titleId = useId();
  const [panelRef, setPanelRef] = useMergedRef(ref);
  const scrimRef = useRef(null);
  const bodyRef = useRef(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose, onOpenChange);
  useDialog(panelRef, requestClose, closeOnBack);
  const swipe = useSheetSwipe(panelRef, scrimRef, () => dismissible && !isClosing() && isPhoneViewport(), closeNow, allowClose);
  const showTitle = header === void 0 && title !== void 0 && title !== null;
  const named = showTitle || !!ariaLabel || !!ariaLabelledBy;
  const scrollable = useScrollable(bodyRef);
  const bodyLabel = typeof title === "string" ? title : ariaLabel;
  useEffect(() => {
    if (!named) warnDev("nish-ui: <Modal> has no accessible name. Pass `title`, `aria-label` or `aria-labelledby`.");
  }, [named]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: scrimRef,
      "data-nish-layer": "",
      "data-state": closing ? "closed" : "open",
      className: cn(
        "fixed inset-0 z-[var(--nish-z-modal,50)] flex items-end justify-center bg-th-scrim/60 sm:p-4",
        closing ? "pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-fade-in_160ms_ease-out]",
        placement === "top" ? "sm:items-start sm:pt-[12vh]" : "sm:items-center"
      ),
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) requestClose();
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ...rest,
          ref: setPanelRef,
          role: role ?? "dialog",
          "aria-modal": "true",
          "aria-labelledby": ariaLabelledBy ?? (showTitle && !ariaLabel ? titleId : void 0),
          "aria-label": ariaLabel,
          "data-state": closing ? "closed" : "open",
          tabIndex: -1,
          className: cn(
            "flex w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none",
            "rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            closing ? "max-sm:animate-[nish-sheet-out_200ms_ease-in_forwards] sm:animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-sheet-in_240ms_var(--nish-ease-out)] sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]",
            "sm:max-h-[85dvh] sm:rounded-2xl sm:pb-0",
            placement === "top" && "sm:max-h-[76dvh]",
            SHEET_HEIGHT_CLASS[sheetHeight],
            MODAL_SIZE[size],
            className
          ),
          children: [
            dismissible ? /* @__PURE__ */ jsx(SheetHandle, { onClose: requestClose, swipe, className: "sm:hidden" }) : null,
            header !== void 0 ? /* @__PURE__ */ jsx("div", { className: cn("shrink-0", dismissible && "max-sm:touch-pan-x"), ...dismissible ? swipe : {}, children: header }) : /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn("flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4", dismissible && "max-sm:touch-pan-x"),
                ...dismissible ? swipe : {},
                children: [
                  /* @__PURE__ */ jsx("h2", { id: titleId, className: "min-w-0 line-clamp-2 break-words pt-1 text-base font-semibold leading-snug text-th-hi", children: title }),
                  hideClose ? null : /* @__PURE__ */ jsx("button", { type: "button", onClick: requestClose, "aria-label": strings.close, className: CLOSE_BUTTON, children: /* @__PURE__ */ jsx(XIcon, { size: 16 }) })
                ]
              }
            ),
            subtitle ? /* @__PURE__ */ jsx("div", { className: "shrink-0 border-b border-th-line px-5 pb-3 text-sm text-th-hi2", children: subtitle }) : null,
            /* @__PURE__ */ jsx(
              "div",
              {
                ref: bodyRef,
                tabIndex: scrollable ? 0 : void 0,
                role: scrollable && bodyLabel ? "region" : void 0,
                "aria-label": scrollable ? bodyLabel : void 0,
                className: cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2", header !== void 0 && "pt-3"),
                children
              }
            ),
            footer ? /* @__PURE__ */ jsx("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
          ]
        }
      )
    }
  );
}
function Drawer({ open, ...props }) {
  if (open === false) return null;
  return /* @__PURE__ */ jsx(Portal, { children: /* @__PURE__ */ jsx(DrawerPanel, { ...props }) });
}
function DrawerPanel({
  title,
  subtitle,
  onClose,
  onOpenChange,
  side = "right",
  size = "md",
  actions,
  footer,
  bottomOffset,
  dismissible = true,
  closeOnBack = true,
  canClose,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  children,
  className,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const titleId = useId();
  const [panelRef, setPanelRef] = useMergedRef(ref);
  const scrimRef = useRef(null);
  const bodyRef = useRef(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose, onOpenChange);
  useDialog(panelRef, requestClose, closeOnBack);
  const bottom = side === "bottom";
  const swipe = useSheetSwipe(panelRef, scrimRef, () => bottom && dismissible && !isClosing(), closeNow, allowClose);
  const swipeHeader = bottom && dismissible;
  const hasTitle = title !== void 0 && title !== null;
  const named = hasTitle || !!ariaLabel || !!ariaLabelledBy;
  const scrollable = useScrollable(bodyRef);
  const bodyLabel = typeof title === "string" ? title : ariaLabel;
  useEffect(() => {
    if (!named) warnDev("nish-ui: <Drawer> has no accessible name. Pass `title`, `aria-label` or `aria-labelledby`.");
  }, [named]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: scrimRef,
      "data-nish-layer": "",
      "data-state": closing ? "closed" : "open",
      className: cn(
        "fixed inset-0 z-[var(--nish-z-modal,50)] bg-th-scrim/50",
        closing ? "pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-fade-in_160ms_ease-out]"
      ),
      style: bottom && bottomOffset ? { bottom: bottomOffset } : void 0,
      onMouseDown: (e) => {
        if (e.target === e.currentTarget) requestClose();
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ...rest,
          ref: setPanelRef,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": ariaLabelledBy ?? (ariaLabel || !hasTitle ? void 0 : titleId),
          "aria-label": ariaLabel,
          "data-state": closing ? "closed" : "open",
          tabIndex: -1,
          className: cn(
            "absolute flex flex-col border-th-line bg-th-surface shadow-modal outline-none",
            bottom ? cn(
              "inset-x-0 bottom-0 rounded-t-2xl border-t",
              closing ? "animate-[nish-sheet-out_200ms_ease-in_forwards]" : "animate-[nish-sheet-in_240ms_var(--nish-ease-out)]",
              bottomOffset ? "" : "pb-[env(safe-area-inset-bottom)]",
              DRAWER_SHEET_HEIGHT[size]
            ) : cn(
              "inset-y-0 w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
              DRAWER_WIDTH[size],
              side === "right" ? cn(
                "right-0 border-l pr-[env(safe-area-inset-right)]",
                closing ? "translate-x-full transition-transform duration-200 ease-in" : "animate-[nish-slide-in-right_240ms_var(--nish-ease-out)]"
              ) : cn(
                "left-0 border-r pl-[env(safe-area-inset-left)]",
                closing ? "-translate-x-full transition-transform duration-200 ease-in" : "animate-[nish-slide-in-left_240ms_var(--nish-ease-out)]"
              )
            ),
            className
          ),
          children: [
            swipeHeader ? /* @__PURE__ */ jsx(SheetHandle, { onClose: requestClose, swipe }) : bottom ? /* @__PURE__ */ jsx("div", { className: "h-3 shrink-0", "aria-hidden": "true" }) : null,
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: cn("flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3", swipeHeader && "touch-pan-x"),
                ...swipeHeader ? swipe : {},
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 pt-1", children: [
                    hasTitle ? /* @__PURE__ */ jsx("h2", { id: titleId, className: "line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi", children: title }) : null,
                    subtitle ? /* @__PURE__ */ jsx("div", { className: "mt-0.5 text-xs text-th-hi3", children: subtitle }) : null
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "-me-1.5 flex shrink-0 items-center gap-1", children: [
                    actions,
                    /* @__PURE__ */ jsx(IconButton, { label: strings.close, onClick: requestClose, children: /* @__PURE__ */ jsx(XIcon, { size: 16 }) })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                ref: bodyRef,
                tabIndex: scrollable ? 0 : void 0,
                role: scrollable && bodyLabel ? "region" : void 0,
                "aria-label": scrollable ? bodyLabel : void 0,
                className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2",
                children
              }
            ),
            footer ? /* @__PURE__ */ jsx("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
          ]
        }
      )
    }
  );
}
function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel,
  open,
  onOpenChange
}) {
  const strings = useNishStrings();
  const bodyId = useId();
  const pendingRef = useLatest(pending);
  const onOpenChangeRef = useLatest(onOpenChange);
  const onCancelRef = useLatest(onCancel);
  const cancel = useCallback(() => {
    if (pendingRef.current) return;
    onCancelRef.current?.();
    onOpenChangeRef.current?.(false);
  }, [onCancelRef, onOpenChangeRef, pendingRef]);
  useEffect(() => {
    closeVetoes.set(cancel, () => pendingRef.current);
    return () => {
      closeVetoes.delete(cancel);
    };
  }, [cancel, pendingRef]);
  const danger = tone === "danger";
  const hasBody = body !== void 0 && body !== null && body !== false;
  return /* @__PURE__ */ jsx(
    Modal,
    {
      open,
      title,
      onClose: cancel,
      size: "md",
      role: "alertdialog",
      "aria-describedby": hasBody ? bodyId : void 0,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { onClick: cancel, disabled: pending, "data-autofocus": danger ? "" : void 0, children: cancelLabel ?? strings.cancel }),
        /* @__PURE__ */ jsx(Button, { variant: danger ? "danger" : "primary", loading: pending, onClick: onConfirm, "data-autofocus": danger ? void 0 : "", children: confirmLabel })
      ] }),
      children: hasBody ? /* @__PURE__ */ jsx("div", { id: bodyId, children: body }) : null
    }
  );
}
var GAP = 8;
var EDGE = 8;
var OPPOSITE = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
function viewport() {
  return {
    vw: window.innerWidth || document.documentElement.clientWidth || 0,
    vh: window.innerHeight || document.documentElement.clientHeight || 0
  };
}
function clamp(v, size, limit) {
  return Math.max(EDGE, Math.min(v, limit - size - EDGE));
}
function place(r, w, h, side, align, gap, rtl = false) {
  const { vw, vh } = viewport();
  const room = {
    top: r.top,
    bottom: vh - r.bottom,
    left: r.left,
    right: vw - r.right
  };
  const need = side === "top" || side === "bottom" ? h + gap + EDGE : w + gap + EDGE;
  const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
  if (chosen === "top" || chosen === "bottom") {
    const top2 = chosen === "top" ? r.top - gap - h : r.bottom + gap;
    const edge = rtl && align !== "center" ? align === "start" ? "end" : "start" : align;
    const left2 = edge === "start" ? r.left : edge === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    return {
      side: chosen,
      top: clamp(top2, h, vh),
      left: clamp(left2, w, vw),
      maxHeight: Math.max(0, room[chosen] - gap - EDGE)
    };
  }
  const left = chosen === "left" ? r.left - gap - w : r.right + gap;
  const top = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return {
    side: chosen,
    top: clamp(top, h, vh),
    left: clamp(left, w, vw),
    maxHeight: Math.max(0, vh - 2 * EDGE)
  };
}
function useAnchoredPosition(anchor, floating, open, side, align, gap = GAP) {
  const [pos, setPos] = useState(null);
  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = floating.current;
      if (!a || !f) return;
      const naturalH = f.scrollHeight + (f.offsetHeight - f.clientHeight);
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, gap, isRtl(a));
      setPos(
        (prev) => prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight ? prev : next
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (floating.current) ro?.observe(floating.current);
    if (anchor.current) ro?.observe(anchor.current);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [anchor, floating, open, side, align, gap]);
  return open ? pos : null;
}
function floatingStyle(pos, extra) {
  return {
    position: "fixed",
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    visibility: pos ? void 0 : "hidden",
    ...extra
  };
}
var TIP_MAX_WIDTH = 320;
var TIP_GRACE_MS = 100;
var openTip = () => shared("tooltip", () => ({ close: null }));
var FOCUSABLE_HOST_TAGS = /* @__PURE__ */ new Set(["button", "a", "input", "select", "textarea", "summary"]);
function Tooltip({ tip, children, className, side = "top", as = "span", focusable, variant = "default", ref, ...rest }) {
  const [triggerRef, setTriggerRef] = useMergedRef(ref);
  const [open, setOpen] = useState(false);
  const id = useId();
  const graceTimer = useRef(0);
  const only = isValidElement(children) ? children : null;
  const staticInner = only !== null && typeof only.type === "string" && FOCUSABLE_HOST_TAGS.has(only.type);
  const [measuredInner, setMeasuredInner] = useState(false);
  useIsoLayoutEffect(() => {
    const el = triggerRef.current;
    const found = only !== null && !!el && el.querySelector(FOCUSABLE) !== null;
    setMeasuredInner(found);
  });
  const inner = only !== null && (staticInner || measuredInner);
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const touch = touchTracker();
    const show = () => {
      window.clearTimeout(graceTimer.current);
      setOpen(true);
    };
    const hide = () => {
      window.clearTimeout(graceTimer.current);
      setOpen(false);
    };
    const hideSoon = () => {
      window.clearTimeout(graceTimer.current);
      graceTimer.current = window.setTimeout(() => setOpen(false), TIP_GRACE_MS);
    };
    const onMouseEnter = () => {
      if (!touch.recent()) show();
    };
    const onFocusIn = (e) => {
      if (e.target === el || e.target instanceof Element && keyboardFocused(e.target)) show();
    };
    const onPointerDown = (e) => {
      if (e.target !== el) hide();
    };
    el.addEventListener("pointerenter", touch.onPointer);
    el.addEventListener("pointerdown", touch.onPointer);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", hideSoon);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", hide);
    return () => {
      window.clearTimeout(graceTimer.current);
      el.removeEventListener("pointerenter", touch.onPointer);
      el.removeEventListener("pointerdown", touch.onPointer);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", hideSoon);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", hide);
    };
  }, [triggerRef]);
  useEffect(() => {
    if (!open) return;
    const slot = openTip();
    const close = () => {
      window.clearTimeout(graceTimer.current);
      setOpen(false);
    };
    if (slot.close && slot.close !== close) slot.close();
    slot.close = close;
    return () => {
      if (slot.close === close) slot.close = null;
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);
  const onTipPointer = useCallback((over) => {
    window.clearTimeout(graceTimer.current);
    if (!over) graceTimer.current = window.setTimeout(() => setOpen(false), TIP_GRACE_MS);
  }, []);
  const wrapperFocusable = focusable ?? !inner;
  const a11y = {
    tabIndex: wrapperFocusable ? 0 : void 0,
    "aria-describedby": open && !inner ? id : void 0,
    "data-state": open ? "open" : "closed"
  };
  const hint = variant === "hint" && "cursor-help underline decoration-th-hi3 decoration-dotted underline-offset-2";
  let content = children;
  if (inner && only) {
    const existing = only.props["aria-describedby"];
    const describedby = open ? [typeof existing === "string" ? existing : "", id].filter(Boolean).join(" ") : existing;
    content = cloneElement(only, {
      "aria-describedby": describedby || void 0
    });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    as === "tr" ? /* @__PURE__ */ jsx("tr", { ...rest, ref: setTriggerRef, className: cn(hint, className), ...a11y, children: content }) : /* @__PURE__ */ jsx(
      "span",
      {
        ...rest,
        ref: setTriggerRef,
        className: cn(hint ? "inline" : "inline-flex items-center", hint, className),
        ...a11y,
        children: content
      }
    ),
    open ? /* @__PURE__ */ jsx(
      FloatingTip,
      {
        anchor: triggerRef,
        id,
        tip,
        side,
        onPointerEnter: () => onTipPointer(true),
        onPointerLeave: () => onTipPointer(false)
      }
    ) : null
  ] });
}
function FloatingTip({
  anchor,
  id,
  tip,
  side = "top",
  onPointerEnter,
  onPointerLeave
}) {
  const config = useNishConfig();
  const tipRef = useRef(null);
  const pos = useAnchoredPosition(anchor, tipRef, true, side, "center");
  return createPortal(
    /* @__PURE__ */ jsx(
      "span",
      {
        ref: tipRef,
        id,
        role: "tooltip",
        "data-side": pos?.side,
        "data-state": "open",
        onPointerEnter,
        onPointerLeave,
        style: floatingStyle(pos, {
          maxWidth: Math.min(TIP_MAX_WIDTH, (window.innerWidth || TIP_MAX_WIDTH) - 2 * EDGE),
          zIndex: "var(--nish-z-tooltip, 100)"
        }),
        className: "block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop",
        children: tip
      }
    ),
    layerHost(anchor.current, config.portalContainer)
  );
}
function useDismiss(open, panel, anchor, close) {
  const closeRef = useLatest(close);
  useEffect(() => {
    if (!open) return;
    const { layerStack } = ov();
    const self = {};
    layerStack.push(self);
    const onKey = (e) => {
      if (e.key === "Escape" && isTop(self)) {
        e.stopPropagation();
        closeRef.current("escape");
      }
    };
    const onDown = (e) => {
      const t = e.target;
      if (!t || panel.current?.contains(t) || anchor.current?.contains(t)) return;
      if (!isTop(self)) return;
      closeRef.current("outside");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      const at = layerStack.indexOf(self);
      if (at >= 0) layerStack.splice(at, 1);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, panel, anchor, closeRef]);
}
function useReturnFocus(open, panel, anchor) {
  const wasOpen = useRef(false);
  const focusWasInside = useRef(false);
  useEffect(() => {
    if (!open) return;
    const p = panel.current;
    const track = () => {
      focusWasInside.current = !!p && p.contains(document.activeElement);
    };
    p?.addEventListener("focusin", track);
    p?.addEventListener("focusout", track);
    return () => {
      p?.removeEventListener("focusin", track);
      p?.removeEventListener("focusout", track);
    };
  }, [open, panel]);
  useIsoLayoutEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const active = document.activeElement;
    if (focusWasInside.current || !active || active === document.body) anchor.current?.focus();
    focusWasInside.current = false;
  }, [open, anchor]);
}
function Popover({
  open,
  onOpenChange,
  dismissOnOutside = true,
  anchor,
  side = "bottom",
  align = "start",
  width,
  "aria-label": ariaLabel,
  className,
  children,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}) {
  const config = useNishConfig();
  const isClient = useIsClient();
  const [panelRef, setPanelRef] = useMergedRef(ref);
  const pos = useAnchoredPosition(anchor, panelRef, open, side, align);
  const onOpenChangeRef = useLatest(onOpenChange);
  const outsideRef = useLatest(dismissOnOutside);
  useDismiss(open, panelRef, anchor, (reason) => {
    if (reason === "outside" && !outsideRef.current) return;
    onOpenChangeRef.current(false, reason);
  });
  useReturnFocus(open, panelRef, anchor);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const p = panelRef.current;
      if (p && !p.contains(document.activeElement)) (p.querySelector("[data-autofocus],[autofocus]") ?? p).focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, panelRef]);
  if (!open || !isClient) return null;
  function onKeyDown(e) {
    userKeyDown?.(e);
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = focusables(panelRef.current);
    const active = document.activeElement;
    const atStart = nodes.length === 0 || active === nodes[0] || active === panelRef.current;
    const atEnd = nodes.length === 0 || active === nodes[nodes.length - 1];
    if (e.shiftKey && atStart || !e.shiftKey && atEnd) {
      e.preventDefault();
      onOpenChangeRef.current(false, "tab");
    }
  }
  return createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        ...rest,
        ref: setPanelRef,
        role: "dialog",
        "aria-label": ariaLabel,
        tabIndex: -1,
        "data-side": pos?.side,
        "data-state": "open",
        onKeyDown,
        style: floatingStyle(pos, {
          ...style,
          width,
          maxHeight: pos?.maxHeight,
          zIndex: "var(--nish-z-dropdown, 40)"
        }),
        className: cn(
          "max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none",
          "animate-[nish-fade-in_120ms_ease-out]",
          className
        ),
        children
      }
    ),
    layerHost(anchor.current, config.portalContainer)
  );
}
var MenuContext = /* @__PURE__ */ createContext(null);
var ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
function menuItems(menu) {
  return menu ? Array.from(menu.querySelectorAll(ITEM_SELECTOR)) : [];
}
function usePhoneViewport(enabled) {
  const phone = useMediaQuery(PHONE_QUERY);
  return enabled && phone;
}
function Cloned({ element, ...props }) {
  return cloneElement(element, props);
}
function DropdownMenu({
  trigger,
  align = "start",
  side = "bottom",
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  "aria-label": ariaLabel,
  sheetBelow = false,
  sheetTitle,
  className,
  ref,
  style,
  onKeyDown: userKeyDown,
  ...rest
}) {
  const strings = useNishStrings();
  const config = useNishConfig();
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const triggerRef = useRef(null);
  const [triggerNode, setTriggerNode] = useState(null);
  const triggerPropRef = trigger.props.ref;
  const attachTrigger = useCallback(
    (node) => {
      triggerRef.current = node;
      setTriggerNode(node);
      setRef(triggerPropRef, node);
    },
    [triggerPropRef]
  );
  const shown = open && triggerNode != null;
  const [menuRef, setMenuRef] = useMergedRef(ref);
  const menuId = useId();
  const triggerId = useId();
  const initial = useRef("first");
  const asSheet = usePhoneViewport(sheetBelow === "sm");
  const pos = useAnchoredPosition(triggerRef, menuRef, shown && !asSheet, side, align, 4);
  const onOpenChangeRef = useLatest(onOpenChange);
  const setOpen = useCallback(
    (next, reason) => {
      if (openProp === void 0) setOpenState(next);
      onOpenChangeRef.current?.(next, reason);
    },
    [onOpenChangeRef, openProp]
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const dismiss = useCallback((reason) => setOpen(false, reason), [setOpen]);
  useDismiss(shown && !asSheet, menuRef, triggerRef, dismiss);
  useReturnFocus(shown, menuRef, triggerRef);
  useEffect(() => {
    if (!shown) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusInitial = () => {
      const items = menuItems(menu);
      const target = initial.current === "last" ? items[items.length - 1] : initial.current === "menu" ? menu : items[0];
      (target ?? menu).focus();
    };
    const t = window.setTimeout(focusInitial, 0);
    const mo = new MutationObserver(() => {
      if (!menu.contains(document.activeElement) && (document.activeElement === document.body || !document.activeElement)) {
        initial.current = "first";
        focusInitial();
      }
    });
    mo.observe(menu, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
    };
  }, [shown, asSheet, menuRef]);
  function openWith(where) {
    initial.current = where;
    setOpen(true);
  }
  function onMenuKeyDown(e) {
    userKeyDown?.(e);
    const items = menuItems(menuRef.current);
    const i = items.indexOf(document.activeElement);
    const go = (n) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        return go(i + 1);
      case "ArrowUp":
        return go(i < 0 ? items.length - 1 : i - 1);
      case "Home":
        return go(0);
      case "End":
        return go(items.length - 1);
      case "Tab":
        e.preventDefault();
        dismiss("tab");
        return;
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
          const hit = order.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(k));
          if (hit) {
            e.preventDefault();
            hit.focus();
          }
        }
    }
  }
  const tp = trigger.props;
  const triggerEl = /* @__PURE__ */ jsx(
    Cloned,
    {
      element: trigger,
      ref: attachTrigger,
      id: tp.id ?? triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId : void 0,
      onClick: (e) => {
        tp.onClick?.(e);
        if (e.defaultPrevented) return;
        if (open) close();
        else openWith(e.detail === 0 ? "first" : "menu");
      },
      onKeyDown: (e) => {
        tp.onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          openWith(e.key === "ArrowDown" ? "first" : "last");
        }
      }
    }
  );
  const menuProps = {
    ...rest,
    ref: setMenuRef,
    id: menuId,
    role: "menu",
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabel ? void 0 : tp.id ?? triggerId,
    "aria-orientation": "vertical",
    "data-state": "open",
    tabIndex: -1,
    onKeyDown: onMenuKeyDown
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    triggerEl,
    open && asSheet ? /* @__PURE__ */ jsx(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx(Drawer, { side: "bottom", size: "md", title: sheetTitle ?? strings.menu, onClose: close, children: /* @__PURE__ */ jsx(
      "div",
      {
        ...menuProps,
        style,
        className: cn(
          "-mx-5 -my-4 py-2 outline-none [&_[role=menuitem]]:min-h-12 [&_[role=menuitem]]:px-5 [&_[role=menuitem]]:text-sm",
          className
        ),
        children
      }
    ) }) }) : shown ? createPortal(
      /* @__PURE__ */ jsx(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx(
        "div",
        {
          ...menuProps,
          "data-side": pos?.side,
          style: floatingStyle(pos, {
            ...style,
            maxHeight: pos ? Math.min(pos.maxHeight, 384) : void 0,
            zIndex: "var(--nish-z-dropdown, 40)"
          }),
          className: cn(
            "max-h-[min(24rem,calc(100dvh-1rem))] min-w-44 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain",
            "rounded-lg border border-th-line bg-th-elevated py-1 shadow-pop outline-none animate-[nish-fade-in_120ms_ease-out]",
            className
          ),
          children
        }
      ) }),
      layerHost(triggerNode, config.portalContainer)
    ) : null
  ] });
}
function MenuItem({
  icon,
  trailing,
  danger = false,
  active = false,
  disabled = false,
  onSelect,
  className,
  children,
  ref,
  onClick,
  onMouseMove,
  ...rest
}) {
  const ctx = useContext(MenuContext);
  function select() {
    if (disabled) return;
    const ev = new Event("nish-menu-select", { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      role: "menuitem",
      tabIndex: -1,
      "aria-disabled": disabled || void 0,
      "aria-current": active || void 0,
      "data-disabled": disabled ? "" : void 0,
      onClick: (e) => {
        onClick?.(e);
        if (!e.defaultPrevented) select();
      },
      onMouseMove: (e) => {
        onMouseMove?.(e);
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
      },
      className: menuItemClass({
        active,
        danger,
        disabled,
        className: cn(!disabled && (danger ? "focus:bg-th-loss-soft" : "focus:bg-th-overlay focus:text-th-hi"), className)
      }),
      children: [
        icon ? /* @__PURE__ */ jsx("span", { className: cn("inline-flex shrink-0", danger || disabled ? "" : "text-th-hi3"), children: icon }) : null,
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children }),
        trailing ? /* @__PURE__ */ jsx("span", { className: cn("ms-auto inline-flex shrink-0 items-center", disabled ? "" : "text-th-hi2"), children: trailing }) : null
      ]
    }
  );
}
function MenuLabel({
  children,
  className,
  ref,
  ...rest
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      ...rest,
      ref,
      role: "presentation",
      className: cn("px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2", className),
      children
    }
  );
}
function MenuSeparator({
  className,
  ref,
  ...rest
}) {
  return /* @__PURE__ */ jsx("div", { ...rest, ref, role: "separator", className: cn("my-1 h-px bg-th-line forced-colors:bg-[CanvasText]", className) });
}
function MenuSubHeader({ onBack, children, className, ref, onKeyDown, ...rest }) {
  const strings = useNishStrings();
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ...rest,
      ref,
      type: "button",
      role: "menuitem",
      tabIndex: -1,
      onClick: onBack,
      onKeyDown: (e) => {
        onKeyDown?.(e);
        if (e.key === (isRtl(e.currentTarget) ? "ArrowRight" : "ArrowLeft")) {
          e.preventDefault();
          onBack();
        }
      },
      className: cn(MENU_ROW, "mb-1 border-b border-th-line pb-2 font-semibold text-th-hi hover:bg-th-overlay focus:bg-th-overlay", className),
      children: [
        /* @__PURE__ */ jsx(
          "svg",
          {
            width: 14,
            height: 14,
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 2,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            className: "shrink-0 text-th-hi3 rtl:-scale-x-100",
            children: /* @__PURE__ */ jsx("path", { d: "m15 18-6-6 6-6" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: strings.back }),
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children })
      ]
    }
  );
}
export {
  ConfirmDialog,
  Drawer,
  DropdownMenu,
  FloatingTip,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSubHeader,
  Modal,
  Popover,
  Tooltip,
  keyboardFocused,
  menuItemClass,
  touchTracker,
  whenHistorySettled
};
