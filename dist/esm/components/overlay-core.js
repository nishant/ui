"use client";

// src/components/overlay-core.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { shared } from "../runtime.js";
import { PHONE_QUERY } from "./overlay-classes.js";
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
export {
  FOCUSABLE,
  acquireGuard,
  cancelHistoryPush,
  closeVetoes,
  focusables,
  isPhoneViewport,
  isTop,
  layerHost,
  lockScroll,
  ov,
  popInert,
  prefersReducedMotion,
  pushInert,
  queueHistoryPush,
  releaseGuard,
  setRef,
  syncLayerAttr,
  useMergedRef,
  useScrollable,
  warnDev,
  whenHistorySettled
};
