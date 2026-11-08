"use client";

// src/components/lazy-module.ts
import { useEffect, useState } from "react";
import { useLatest } from "./latest.js";
function lazyModule(importer) {
  let mod = null;
  let pending = null;
  return {
    current: () => mod,
    load: () => pending ??= importer().then(
      (m) => mod = m,
      (e) => {
        pending = null;
        throw e;
      }
    )
  };
}
function useLazyModule(m, when, onError) {
  const [, rerender] = useState(0);
  const errorRef = useLatest(onError);
  useEffect(() => {
    if (!when || m.current()) return;
    let live = true;
    m.load().then(
      () => live && rerender((n) => n + 1),
      () => live && errorRef.current?.()
    );
    return () => {
      live = false;
    };
  }, [m, when, errorRef]);
  return m.current();
}
function preloadWhenIdle(m) {
  if (typeof window === "undefined" || m.current()) return () => {
  };
  const run = () => {
    m.load().catch(() => void 0);
  };
  if (typeof window.requestIdleCallback === "function") {
    const id2 = window.requestIdleCallback(run, { timeout: 3e3 });
    return () => window.cancelIdleCallback(id2);
  }
  const id = window.setTimeout(run, 1500);
  return () => window.clearTimeout(id);
}
export {
  lazyModule,
  preloadWhenIdle,
  useLazyModule
};
