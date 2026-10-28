import { useEffect, useState, type RefObject } from 'react';

/**
 * Publishes an element's height as a CSS variable on `<html>` (the layout contract:
 * `--nish-header-h`, `--nish-bottom-nav-h`, `--nish-bottom-bar-h`, `--nish-sticky-extra`).
 * The variable is written on mount and on every resize, and removed on unmount, when
 * `enabled` turns false, and while the element is hidden (`display: none` measures 0).
 *
 * @param ref - The bar to measure.
 * @param name - The variable name, e.g. `'--nish-header-h'`.
 * @param enabled - Set false to publish nothing (a bar hidden above its breakpoint).
 */
export function useHeightVar(ref: RefObject<HTMLElement | null>, name: string, enabled = true): void {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof document === 'undefined') return;
    const root = document.documentElement;
    const write = () => {
      const h = el.offsetHeight;
      if (h > 0) root.style.setProperty(name, `${h}px`);
      else root.style.removeProperty(name);
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
      root.style.removeProperty(name);
    };
  }, [ref, name, enabled]);
}

/**
 * True once a sticky element is stuck to its scroll edge. Inserts a 1px sentinel before
 * the element and watches it with an IntersectionObserver; also sets `data-stuck` on the
 * element, so CSS can react without React state. The sticky `top` is read from the
 * element's computed style when the observer is created, so a header offset counts.
 *
 * @param ref - The sticky element.
 */
export function useStuck(ref: RefObject<HTMLElement | null>): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentNode;
    if (!el || !parent || typeof IntersectionObserver === 'undefined') return;
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'height:1px;margin-bottom:-1px;pointer-events:none;visibility:hidden';
    parent.insertBefore(sentinel, el);
    const top = Math.round(parseFloat(getComputedStyle(el).top) || 0);
    const io = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting && entry.boundingClientRect.top < top;
        setStuck(next);
        if (next) el.setAttribute('data-stuck', '');
        else el.removeAttribute('data-stuck');
      },
      { threshold: [0, 1], rootMargin: `${-top - 1}px 0px 0px 0px` },
    );
    io.observe(sentinel);
    return () => {
      io.disconnect();
      sentinel.remove();
      el.removeAttribute('data-stuck');
      setStuck(false);
    };
  }, [ref]);
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
