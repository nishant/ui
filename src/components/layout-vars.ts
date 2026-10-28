import { useEffect, useState, type RefObject } from 'react';
import { mountStuck } from '../theme';

// Several bars can publish the same variable (a SectionNav inside a StickyBar both
// write `--nish-sticky-extra`). Each variable keeps its live owners' heights; the
// largest wins and the property is removed only when the last owner leaves.
const heightOwners = new Map<string, Map<object, number>>();

function applyHeightVar(name: string) {
  const owners = heightOwners.get(name);
  const root = document.documentElement;
  const max = owners ? Math.max(0, ...owners.values()) : 0;
  if (max > 0) root.style.setProperty(name, `${max}px`);
  else root.style.removeProperty(name);
}

/**
 * Publishes an element's height as a CSS variable on `<html>` (the layout contract:
 * `--nish-header-h`, `--nish-bottom-nav-h`, `--nish-bottom-bar-h`, `--nish-sticky-extra`).
 * The variable is written on mount and on every resize, and removed on unmount, when
 * `enabled` turns false, and while the element is hidden (`display: none` measures 0).
 * When several bars publish the same variable the largest height wins.
 *
 * @param ref - The bar to measure.
 * @param name - The variable name, e.g. `'--nish-header-h'`.
 * @param enabled - Set false to publish nothing (a bar hidden above its breakpoint).
 */
export function useHeightVar(ref: RefObject<HTMLElement | null>, name: string, enabled = true): void {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof document === 'undefined') return;
    const owner = {};
    let owners = heightOwners.get(name);
    if (!owners) heightOwners.set(name, (owners = new Map()));
    const write = () => {
      owners.set(owner, el.offsetHeight);
      applyHeightVar(name);
    };
    write();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(write);
      ro.observe(el);
    } else {
      window.addEventListener('resize', write);
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', write);
      owners.delete(owner);
      if (owners.size === 0) heightOwners.delete(name);
      applyHeightVar(name);
    };
  }, [ref, name, enabled]);
}

/**
 * True while a sticky element is stuck to its scroll edge: the page has scrolled and the
 * element rests at its sticky `top`. False at scroll 0 and for an element that is not
 * position:sticky. Also sets `data-stuck` on the element, so CSS can react without React
 * state. Same rules as `mountStuck` in `@nish/ui/theme`, which it uses: nothing is
 * inserted into the DOM, and the sticky `top` is re-read when the element resizes or
 * `<html>` style changes (`--nish-header-h`).
 *
 * @param ref - The sticky element.
 * @param enabled - Set false to skip observing (a header that is not sticky).
 */
export function useStuck(ref: RefObject<HTMLElement | null>, enabled = true): boolean {
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

/**
 * Tracks whether a horizontal scroller is at its start or end and writes
 * `data-at-start` / `data-at-end` ("true" / "false") on it, which `.nish-scroll-fade`
 * turns into edge fades. Updates on scroll, on resize and when children change.
 *
 * @param ref - The scrolling element.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.dataset.atStart = String(el.scrollLeft <= 1);
      el.dataset.atEnd = String(max <= 1 || el.scrollLeft >= max - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    let ro: ResizeObserver | undefined;
    let mo: MutationObserver | undefined;
    const observeChildren = () => {
      if (ro) for (const c of Array.from(el.children)) ro.observe(c);
    };
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
      observeChildren();
    }
    if (typeof MutationObserver !== 'undefined') {
      mo = new MutationObserver(() => {
        update();
        observeChildren();
      });
      mo.observe(el, { childList: true });
    }
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
      mo?.disconnect();
      delete el.dataset.atStart;
      delete el.dataset.atEnd;
    };
  }, [ref]);
}
