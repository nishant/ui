import {
  Fragment,
  createElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import { chipClass } from './forms';
import { useHeightVar, useScrollEdges } from './layout-vars';
import { Drawer, Tooltip } from './overlay';
import { ThemeToggle } from './theme-toggle';

export { useScrollEdges };

// ---------------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------------

/** One destination in BottomNav, MoreSheet and NavRail. */
export interface NavItem {
  key: string;
  label: string;
  /** A 20-24px SVG icon drawn in currentColor. */
  icon: ReactNode;
  /** Rendered as an `<a>` unless `renderLink` is given. */
  href?: string;
  /** Rendered as a `<button>` when there is no href. Also called when an `<a>` is clicked. */
  onSelect?: () => void;
  active?: boolean;
  /** true shows a dot; a number shows a count pill (99+ above 99). */
  badge?: number | boolean;
  /** One line of explanation: shown in MoreSheet rows and as the NavRail tooltip. */
  hint?: string;
}

/** Renders a router link for an item (React Router's `<Link>` and so on). Spread the given
 *  props onto it: `className` carries the look, `children` the icon and label. */
export type RenderLink = (
  item: NavItem,
  props: { className: string; children: ReactNode; 'aria-current'?: 'page' },
) => ReactElement;

type NavBreakpoint = 'md' | 'lg';

const MAX_QUERY: Record<NavBreakpoint, string> = {
  md: '(max-width: 767px)',
  lg: '(max-width: 1023px)',
};

// Tailwind needs the full literal class names.
const HIDE_FROM: Record<NavBreakpoint, string> = { md: 'md:hidden', lg: 'lg:hidden' };
const RAIL_SHOW: Record<'sm' | 'md' | 'lg', string> = { sm: 'sm:flex', md: 'md:flex', lg: 'lg:flex' };
const RAIL_HIDE: Record<'md' | 'lg' | 'xl', string> = { md: 'md:hidden', lg: 'lg:hidden', xl: 'xl:hidden' };

function useMatches(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches,
    () => false,
  );
}

function CountBadge({ value }: { value: number | boolean | undefined }) {
  if (value === undefined || value === false || value === 0) return null;
  if (value === true) {
    return <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-th-loss ring-2 ring-th-surface" />;
  }
  return (
    <span
      aria-label={`${value} new`}
      className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-th-loss px-1 text-[10px] font-semibold leading-none tabular-nums text-th-on-loss ring-2 ring-th-surface"
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}

/** An item as a link or a button, with the caller's look. */
function renderItem(item: NavItem, className: string, children: ReactNode, renderLink: RenderLink | undefined, onAfter?: () => void): ReactNode {
  const current = item.active ? ('page' as const) : undefined;
  if (item.href != null) {
    if (renderLink) {
      return renderLink(item, { className, children, 'aria-current': current });
    }
    return (
      <a
        href={item.href}
        className={className}
        aria-current={current}
        onClick={() => {
          item.onSelect?.();
          onAfter?.();
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-current={current}
      onClick={() => {
        item.onSelect?.();
        onAfter?.();
      }}
    >
      {children}
    </button>
  );
}

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent';

// ---------------------------------------------------------------------------------
// BottomNav
// ---------------------------------------------------------------------------------

export interface BottomNavProps {
  /** The destinations. Four or five fit a 360px screen; put the rest behind `more`. */
  items: NavItem[];
  /** A last "More" button that opens a MoreSheet. You own the sheet's open state. */
  more?: {
    label?: string;
    icon?: ReactNode;
    /** Highlight the button, e.g. when the current page lives inside the sheet. */
    active: boolean;
    expanded: boolean;
    onToggle: () => void;
  };
  /** Rendered after a thin divider (a search or add button). */
  trailing?: ReactNode;
  /** The breakpoint from which the bar is hidden (default md, 768px). */
  hideFrom?: NavBreakpoint;
  /** Names the nav landmark. Default "Sections". */
  label?: string;
  /** Renders router links instead of plain anchors. */
  renderLink?: RenderLink;
  className?: string;
}

function MoreDots() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

/** A phone tab bar fixed to the bottom of the screen: icon over label, the current page
 *  tinted, safe-area padding and 56px targets. It publishes its height as
 *  `--nish-bottom-nav-h` while it is visible, so Toaster, StickyActionBar and page
 *  padding make room for it. Hidden from `hideFrom` up (pair it with NavRail or a sidebar). */
export function BottomNav({ items, more, trailing, hideFrom = 'md', label = 'Sections', renderLink, className }: BottomNavProps) {
  const ref = useRef<HTMLElement>(null);
  const visible = useMatches(MAX_QUERY[hideFrom]);
  useHeightVar(ref, '--nish-bottom-nav-h', visible);

  const pill = (active: boolean) =>
    cn(
      'flex w-full flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] leading-tight transition-colors',
      active ? 'bg-th-accent-soft font-medium text-th-accent' : 'text-th-hi3',
    );
  const cell = cn('flex min-h-14 min-w-0 flex-1 items-center justify-center px-0.5 pointer-coarse:active:scale-[0.97] transition-transform', FOCUS);

  return (
    <nav
      ref={ref}
      aria-label={label}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-th-line bg-th-surface pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
        HIDE_FROM[hideFrom],
        className,
      )}
    >
      {items.map((item) => (
        <Fragment key={item.key}>
          {renderItem(
            item,
            cell,
            <span className={pill(!!item.active)}>
              <span className="relative inline-flex size-6 items-center justify-center">
                {item.icon}
                <CountBadge value={item.badge} />
              </span>
              <span className="max-w-full truncate px-1">{item.label}</span>
            </span>,
            renderLink,
          )}
        </Fragment>
      ))}
      {more ? (
        <button type="button" aria-expanded={more.expanded} aria-haspopup="dialog" onClick={more.onToggle} className={cell}>
          <span className={pill(more.active || more.expanded)}>
            <span className="inline-flex size-6 items-center justify-center">{more.icon ?? <MoreDots />}</span>
            <span className="max-w-full truncate px-1">{more.label ?? 'More'}</span>
          </span>
        </button>
      ) : null}
      {trailing ? (
        <>
          <span aria-hidden="true" className="my-2 w-px shrink-0 bg-th-line" />
          <div className="flex shrink-0 items-center justify-center px-1">{trailing}</div>
        </>
      ) : null}
    </nav>
  );
}

// ---------------------------------------------------------------------------------
// MoreSheet
// ---------------------------------------------------------------------------------

export interface MoreSheetProps {
  open: boolean;
  /** Called on Escape, a scrim click, the swipe, Android back and after a row is chosen. */
  onClose: () => void;
  items: NavItem[];
  /** Default "More". */
  title?: string;
  /** Pinned under the list. Defaults to a "Theme" row with a segmented ThemeToggle. */
  footer?: ReactNode;
  renderLink?: RenderLink;
}

/** The overflow sheet behind BottomNav's More button: a bottom Drawer lifted above the bar,
 *  so the bar stays visible and tappable. Rows are 52px with an icon, a label and a
 *  one-line hint. Choosing a row navigates and closes the sheet. */
export function MoreSheet({ open, onClose, items, title = 'More', footer, renderLink }: MoreSheetProps) {
  if (!open) return null;
  const row = (active: boolean) =>
    cn(
      'flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 text-left transition-colors',
      active ? 'bg-th-accent-soft text-th-accent' : 'text-th-hi hover:bg-th-hover',
      FOCUS,
    );
  return (
    <Drawer
      side="bottom"
      title={title}
      onClose={onClose}
      bottomOffset="var(--nish-bottom-nav-h, 0px)"
      footer={
        footer ?? (
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="text-sm font-medium text-th-hi">Theme</span>
            <ThemeToggle phone="segmented" />
          </div>
        )
      }
    >
      <ul className="m-0 list-none p-2">
        {items.map((item) => (
          <li key={item.key}>
            {renderItem(
              item,
              row(!!item.active),
              <>
                <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
                  {item.icon}
                  <CountBadge value={item.badge} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.label}</span>
                  {item.hint ? <span className={cn('block truncate text-xs', item.active ? 'text-th-accent/80' : 'text-th-hi3')}>{item.hint}</span> : null}
                </span>
              </>,
              renderLink,
              onClose,
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}

// ---------------------------------------------------------------------------------
// NavRail
// ---------------------------------------------------------------------------------

export interface NavRailProps {
  items: NavItem[];
  /** A second group under the items, after a divider (settings, search). */
  tools?: ReactNode;
  /** Pinned to the bottom of the rail (a theme toggle, an avatar). */
  footer?: ReactNode;
  /** The breakpoint from which the rail shows (default md, 768px). */
  showFrom?: 'sm' | 'md' | 'lg';
  /** The breakpoint from which it hides again (default lg, 1024px); pass false to keep it. */
  hideFrom?: 'md' | 'lg' | 'xl' | false;
  /** Names the nav landmark. Default "Sections". */
  label?: string;
  renderLink?: RenderLink;
  className?: string;
}

/** A 72px icon rail for the unfolded and tablet range between the phone BottomNav and a
 *  full sidebar: each destination is an icon in a pill over an 11px label. The `hint`
 *  shows as a tooltip on mouse hover and keyboard focus. */
export function NavRail({ items, tools, footer, showFrom = 'md', hideFrom = 'lg', label = 'Sections', renderLink, className }: NavRailProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'hidden w-[72px] shrink-0 flex-col items-center gap-1 border-r border-th-line bg-th-surface py-3 pl-[env(safe-area-inset-left)]',
        RAIL_SHOW[showFrom],
        hideFrom ? RAIL_HIDE[hideFrom] : null,
        className,
      )}
    >
      {items.map((item) => {
        const node = renderItem(
          item,
          cn('group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] leading-tight', FOCUS, item.active ? 'font-medium text-th-accent' : 'text-th-hi3 hover:text-th-hi'),
          <>
            <span
              className={cn(
                'relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                item.active ? 'bg-th-accent-soft' : 'group-hover:bg-th-hover',
              )}
            >
              {item.icon}
              <CountBadge value={item.badge} />
            </span>
            <span className="max-w-full truncate px-1">{item.label}</span>
          </>,
          renderLink,
        );
        return item.hint ? (
          <Tooltip key={item.key} tip={item.hint} side="right" focusable={false} className="block w-full">
            {node}
          </Tooltip>
        ) : (
          <span key={item.key} className="block w-full">
            {node}
          </span>
        );
      })}
      {tools ? (
        <>
          <span aria-hidden="true" className="my-1 h-px w-8 bg-th-line" />
          {tools}
        </>
      ) : null}
      {footer ? <div className="mt-auto flex flex-col items-center gap-2 pt-3">{footer}</div> : null}
    </nav>
  );
}

// ---------------------------------------------------------------------------------
// ScrollRow
// ---------------------------------------------------------------------------------

export interface ScrollRowProps {
  children: ReactNode;
  /** Let the row run to the screen edges inside a padded page. */
  bleed?: boolean;
  /** Fade the edges that have more content (default true). */
  fade?: boolean;
  /** Snap children to the start edge while scrolling. */
  snap?: boolean;
  /** Element to render: div (default), ul, ol or nav. */
  as?: 'div' | 'ul' | 'ol' | 'nav';
  /** Accessible name of the row (`aria-label`). */
  label?: string;
  className?: string;
}

/** Scrolls a horizontal scroller just far enough to show one child, without ever moving the
 *  page (an inline `scrollIntoView` can scroll the window too). Internal to the package. */
export function revealInRow(scroller: HTMLElement, child: HTMLElement): void {
  const s = scroller.getBoundingClientRect();
  const c = child.getBoundingClientRect();
  const pad = 8;
  if (c.left < s.left + pad) scroller.scrollLeft += c.left - s.left - pad;
  else if (c.right > s.right - pad) scroller.scrollLeft += c.right - s.right + pad;
}

const ACTIVE_SELECTOR = '[aria-pressed="true"],[aria-selected="true"],[aria-current]:not([aria-current="false"]),[aria-checked="true"]';

/** A single horizontally scrolling row (chips, filters, tabs) with edge fades and no
 *  scrollbar. The pressed, selected or current child is scrolled into view when it
 *  changes. */
export function ScrollRow({ children, bleed = false, fade = true, snap = false, as = 'div', label, className }: ScrollRowProps) {
  const ref = useRef<HTMLElement>(null);
  useScrollEdges(ref);
  const lastActive = useRef<Element | null>(null);

  useEffect(() => {
    const active = ref.current?.querySelector(ACTIVE_SELECTOR) ?? null;
    if (active && active !== lastActive.current) {
      revealInRow(ref.current as HTMLElement, active as HTMLElement);
    }
    lastActive.current = active;
  });

  return createElement(
    as,
    {
      ref,
      'aria-label': label,
      className: cn(
        'flex gap-2 overflow-x-auto nish-no-scrollbar',
        fade && 'nish-scroll-fade',
        bleed && '-mx-[var(--nish-page-gutter)] px-[var(--nish-page-gutter)]',
        snap && 'snap-x snap-mandatory [&>*]:snap-start',
        className,
      ),
    },
    children,
  );
}

// ---------------------------------------------------------------------------------
// useScrollSpy and SectionNav
// ---------------------------------------------------------------------------------

/** The id of the section crossing the middle band of the viewport: the last one that
 *  entered it. At the very top of the page, or before any section has been seen, it is
 *  the first id. Sections are looked up with `document.getElementById`.
 *
 *  @param ids - Section ids, in page order.
 *  @param options.rootMargin - The observed band. Default `'-45% 0px -50% 0px'`.
 *  @returns The current id, or null when `ids` is empty. */
export function useScrollSpy(ids: string[], { rootMargin = '-45% 0px -50% 0px' }: { rootMargin?: string } = {}): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('\u0000');

  useEffect(() => {
    const list = key ? key.split('\u0000') : [];
    setActive((cur) => (cur != null && list.includes(cur) ? cur : (list[0] ?? null)));
    if (!list.length || typeof IntersectionObserver === 'undefined') return;
    const inBand = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        let entered: string | null = null;
        for (const e of entries) {
          const id = (e.target as HTMLElement).id;
          if (e.isIntersecting) {
            inBand.add(id);
            entered = id;
          } else {
            inBand.delete(id);
          }
        }
        if (entered) {
          setActive(entered);
        } else {
          // The current section left the band: fall back to the last one still in it.
          setActive((cur) => {
            if (cur != null && inBand.has(cur)) return cur;
            const still = list.filter((id) => inBand.has(id));
            return still.length ? still[still.length - 1] : cur;
          });
        }
      },
      { rootMargin },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    const onScroll = () => {
      if (window.scrollY < 8) setActive(list[0]);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [key, rootMargin]);

  return active;
}

export interface SectionNavItem {
  /** The id of the section element on the page. */
  id: string;
  label: string;
  icon?: ReactNode;
  /** A count after the label. */
  count?: number;
}

export interface SectionNavProps {
  items: SectionNavItem[];
  /** Stick under the app header (default true). */
  sticky?: boolean;
  /** Called with the id after a chip is clicked and the page has been scrolled. */
  onSelect?: (id: string) => void;
  /** Write `#id` with history.replaceState on click (default true). Pass false in apps that
   *  use hash routing. */
  updateHash?: boolean;
  /** Accessible name. Default "Sections". */
  label?: string;
  className?: string;
}

/** A row of jump chips for a long page. The chip of the section being read is marked
 *  (`aria-current="true"`) and kept in view; clicking one scrolls to its section. Give the
 *  sections the `nish-scroll-target` class so they stop below the sticky bars. It publishes
 *  its own height as `--nish-sticky-extra`. */
export function SectionNav({ items, sticky = true, onSelect, updateHash = true, label = 'Sections', className }: SectionNavProps) {
  const ref = useRef<HTMLElement>(null);
  const active = useScrollSpy(items.map((i) => i.id));
  useHeightVar(ref, '--nish-sticky-extra', sticky);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    if (updateHash) {
      try {
        history.replaceState(history.state, '', `#${id}`);
      } catch {
        /* a sandboxed frame may refuse; the scroll already happened */
      }
    }
    onSelect?.(id);
  };

  return (
    <nav
      ref={ref}
      aria-label={label}
      style={sticky ? { top: 'var(--nish-header-h, 0px)' } : undefined}
      className={cn('z-20 border-b border-th-line bg-th-bg py-2', sticky && 'sticky', className)}
    >
      <ScrollRow bleed>
        {items.map((item) => {
          const on = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={on ? 'true' : undefined}
              onClick={() => go(item.id)}
              className={chipClass({ pressed: on, className: 'shrink-0 whitespace-nowrap' })}
            >
              {item.icon}
              {item.label}
              {item.count != null ? <span className="tabular-nums text-th-hi3">{item.count}</span> : null}
            </button>
          );
        })}
      </ScrollRow>
    </nav>
  );
}
