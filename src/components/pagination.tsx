'use client';

import { useCallback, useRef, useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { useIsoLayoutEffect } from './client';
import { useStrings } from './provider';
import { PAGING_STRINGS } from './strings';
import { paginationRange } from './pagination-classes';

export { paginationRange };

export type PaginationSize = 'sm' | 'md';

/** What `renderLink` receives for a page, previous or next control: spread it on the router link. */
export interface PaginationLinkProps {
  /** The classes of the control (size, current and hover looks). */
  className: string;
  /** "Page 3", "Previous page" or "Next page". */
  'aria-label': string;
  /** "page" on the current page. */
  'aria-current'?: 'page';
  /** "active" on the current page, "inactive" otherwise. */
  'data-state': 'active' | 'inactive';
  /** The page number or the arrow. */
  children: ReactNode;
  /** Keeps the page state in step; the router still navigates. */
  onClick: (event: MouseEvent<HTMLElement>) => void;
}

export interface PaginationProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'onChange' | 'children' | 'defaultValue'> {
  /** The current page, 1-based. Pass it to control the component. */
  page?: number;
  /** The first page when uncontrolled (default 1). */
  defaultPage?: number;
  /** Called with the new page (1-based) when the user picks one. */
  onPageChange?: (page: number) => void;
  /** How many pages there are. */
  pageCount: number;
  /** Pages shown on each side of the current one (default 1). */
  siblings?: number;
  /** Pages always shown at the start and at the end (default 1). */
  boundaries?: number;
  /** sm (32px) or md (36px, default). Every control is 44px on touch screens. */
  size?: PaginationSize;
  /** Renders each control as a router link: `(page, props) => <Link to={`?page=${page}`} {...props} />`. */
  renderLink?: (page: number, props: PaginationLinkProps) => ReactNode;
  /** Forces the compact "Page 3 of 10" form (true) or the full list (false). Unset: compact under 400px container width. */
  compact?: boolean;
  /** Disables every control. */
  disabled?: boolean;
  /** The nav landmark label. Default: `paginationLabel` from NishProvider strings. */
  label?: string;
  /** The previous control's label. Default: `previousPage` from the strings. */
  previousLabel?: string;
  /** The next control's label. Default: `nextPage` from the strings. */
  nextLabel?: string;
  /** Label of one page button. Default: `pageLabel` from the strings. */
  pageLabel?: (page: number) => string;
  /** The compact text. Default: "Page 3 of 10" (English; pass your own for other languages). */
  compactLabel?: (page: number, pageCount: number) => string;
  ref?: Ref<HTMLElement>;
}

const SIZE: Record<PaginationSize, string> = { sm: 'h-8 min-w-8 text-xs', md: 'h-9 min-w-9 text-sm' };

function controlClass(size: PaginationSize, current: boolean, disabled: boolean): string {
  return cn(
    'inline-flex shrink-0 select-none items-center justify-center rounded-lg px-2 font-medium tabular-nums transition-colors duration-150',
    'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
    SIZE[size],
    current
      ? 'bg-th-accent text-th-on-accent forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
      : 'text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
    disabled && 'pointer-events-none cursor-not-allowed text-th-ghost',
  );
}

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="rtl:-scale-x-100"
    >
      <path d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

function clampPage(p: number, count: number): number {
  const n = Number.isFinite(p) ? Math.floor(p) : 1;
  return Math.min(Math.max(1, n), Math.max(1, count));
}

/** Page navigation: numbered pages with ellipses, previous and next, a nav landmark and
 *  aria-current on the current page. Under 400px of its own width it shows "Page 3 of 10"
 *  with previous and next. Use renderLink so each control is a router link. */
export function Pagination({
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  pageCount,
  siblings = 1,
  boundaries = 1,
  size = 'md',
  renderLink,
  compact: compactProp,
  disabled = false,
  label,
  previousLabel,
  nextLabel,
  pageLabel,
  compactLabel,
  className,
  ref,
  ...rest
}: PaginationProps) {
  const strings = useStrings(PAGING_STRINGS);
  const [pageState, setPageState] = useState(defaultPage);
  const navRef = useRef<HTMLElement | null>(null);
  const [narrow, setNarrow] = useState(false);
  const count = Math.max(0, Math.floor(pageCount));
  const page = clampPage(pageProp ?? pageState, count);
  const empty = count < 1;

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      navRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLElement | null }).current = node;
    },
    [ref],
  );

  useIsoLayoutEffect(() => {
    const el = navRef.current;
    if (compactProp !== undefined || !el || typeof ResizeObserver === 'undefined') return;
    const measure = (w: number) => setNarrow(w > 0 && w < 400);
    measure(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== undefined) measure(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compactProp, empty]);

  if (empty) return null;
  const compact = compactProp ?? narrow;

  function go(next: number) {
    if (disabled) return;
    const target = clampPage(next, count);
    if (pageProp === undefined) setPageState(target);
    if (target !== page) onPageChange?.(target);
  }

  const pageName = pageLabel ?? strings.pageLabel;
  const prevName = previousLabel ?? strings.previousPage;
  const nextName = nextLabel ?? strings.nextPage;

  function control(target: number, name: string, current: boolean, off: boolean, children: ReactNode, key: string) {
    const cls = controlClass(size, current, off);
    const state = current ? 'active' : 'inactive';
    if (renderLink && !off) {
      const props: PaginationLinkProps = {
        className: cls,
        'aria-label': name,
        'aria-current': current ? 'page' : undefined,
        'data-state': state,
        children,
        onClick: (event) => {
          // Ctrl/Cmd/Shift/middle click opens a new tab and leaves this page alone.
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          go(target);
        },
      };
      return <li key={key}>{renderLink(target, props)}</li>;
    }
    return (
      <li key={key}>
        <button
          type="button"
          className={cls}
          aria-label={name}
          aria-current={current ? 'page' : undefined}
          data-state={state}
          disabled={off}
          data-disabled={off ? '' : undefined}
          onClick={() => go(target)}
        >
          {children}
        </button>
      </li>
    );
  }

  const prev = control(page - 1, prevName, false, page <= 1 || disabled, <Chevron dir="prev" />, 'prev');
  const next = control(page + 1, nextName, false, page >= count || disabled, <Chevron dir="next" />, 'next');

  return (
    <nav
      aria-label={label ?? strings.paginationLabel}
      data-state={compact ? 'compact' : 'full'}
      data-disabled={disabled ? '' : undefined}
      {...rest}
      ref={setRefs}
      className={cn('w-full min-w-0', className)}
    >
      <ul className={cn('flex flex-wrap items-center gap-1', compact && 'justify-between')}>
        {prev}
        {compact ? (
          <li className="px-2 text-sm tabular-nums text-th-hi2">
            {(compactLabel ?? ((p, c) => `${strings.pageLabel(p)} of ${c}`))(page, count)}
          </li>
        ) : (
          paginationRange(page, count, siblings, boundaries).map((slot) =>
            typeof slot === 'number' ? (
              control(slot, pageName(slot), slot === page, disabled, slot, `p${slot}`)
            ) : (
              <li key={slot} aria-hidden="true" className={cn('inline-flex items-center justify-center text-th-hi3', 'min-w-6', SIZE[size].split(' ')[0])}>
                …
              </li>
            ),
          )
        )}
        {next}
      </ul>
    </nav>
  );
}
