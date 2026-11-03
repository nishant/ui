'use client';
import { useLayoutEffect, useEffect, useSyncExternalStore } from 'react';

const unsubscribe = (): void => {};
const subscribe = (): (() => void) => unsubscribe;

/** False on the server and in the first client render, true afterwards (no hydration mismatch). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** useLayoutEffect in the browser, useEffect on the server (no SSR warning). */
export const useIsoLayoutEffect: typeof useLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** True when the element is laid out right-to-left. False on the server or without an element. */
export function isRtl(el: Element | null | undefined): boolean {
  if (!el || typeof getComputedStyle === 'undefined') return false;
  return getComputedStyle(el).direction === 'rtl';
}
