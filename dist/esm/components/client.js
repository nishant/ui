"use client";

// src/components/client.ts
import { useLayoutEffect, useEffect, useSyncExternalStore } from "react";
var unsubscribe = () => {
};
var subscribe = () => unsubscribe;
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function isRtl(el) {
  if (!el || typeof getComputedStyle === "undefined") return false;
  return getComputedStyle(el).direction === "rtl";
}
export {
  isRtl,
  useIsClient,
  useIsoLayoutEffect
};
