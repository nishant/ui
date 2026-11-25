"use client";

// src/components/layout-vars.ts
import { useEffect, useState } from "react";
import { shared } from "../runtime.js";
import { mountStuck } from "../theme.js";
var heightOwnersMap = () => shared("heightVars", () => /* @__PURE__ */ new Map());
function applyHeightVar(name) {
  const owners = heightOwnersMap().get(name);
  const root = document.documentElement;
  const max = owners ? Math.max(0, ...owners.values()) : 0;
  if (max > 0) root.style.setProperty(name, `${max}px`);
  else root.style.removeProperty(name);
}
function useHeightVar(ref, name, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof document === "undefined") return;
    const owner = {};
    let owners = heightOwnersMap().get(name);
    if (!owners) heightOwnersMap().set(name, owners = /* @__PURE__ */ new Map());
    const write = () => {
      owners.set(owner, el.offsetHeight);
      applyHeightVar(name);
    };
    write();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(write);
      ro.observe(el);
    } else {
      window.addEventListener("resize", write);
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", write);
      owners.delete(owner);
      if (owners.size === 0) heightOwnersMap().delete(name);
      applyHeightVar(name);
    };
  }, [ref, name, enabled]);
}
function useStuck(ref, enabled = true) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const stop = mountStuck(el, setStuck);
    return () => {
      stop();
      setStuck(false);
    };
  }, [ref, enabled]);
  return stuck;
}
function useScrollEdges(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const rtl = getComputedStyle(el).direction === "rtl";
      const left = rtl ? el.scrollLeft + max : el.scrollLeft;
      el.dataset.atStart = String(left <= 1);
      el.dataset.atEnd = String(max <= 1 || left >= max - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    let ro;
    let mo;
    const observeChildren = () => {
      if (ro) for (const c of Array.from(el.children)) ro.observe(c);
    };
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
      observeChildren();
    }
    if (typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(() => {
        update();
        observeChildren();
      });
      mo.observe(el, { childList: true });
    }
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
      mo?.disconnect();
      delete el.dataset.atStart;
      delete el.dataset.atEnd;
    };
  }, [ref]);
}
export {
  useHeightVar,
  useScrollEdges,
  useStuck
};
