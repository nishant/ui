'use client';
import { useRef, type RefObject } from 'react';
import { useIsoLayoutEffect } from './client';

/** A ref that holds the latest `value`, written after each commit and before any passive
 *  effect runs. Read it in effects and event handlers to call the newest callback without
 *  re-subscribing; never read it during render. Internal to the package. */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useIsoLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
