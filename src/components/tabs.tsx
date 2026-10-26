import { createContext, useContext, useId, useRef, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';
import { Badge } from './primitives';

type TabsVariant = 'underline' | 'pill';
export type TabsSize = 'xs' | 'sm' | 'md';
/** The breakpoint from which responsive tabs show every panel at once. */
export type TabsBreakpoint = 'md' | 'lg';

const BREAKPOINT_QUERY: Record<TabsBreakpoint, string> = {
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
};

// A matchMedia hook, not CSS on [hidden]: Tailwind preflight's [hidden] rule is
// !important, so a breakpoint class cannot show a hidden panel.
function useBreakpoint(bp: TabsBreakpoint | undefined): boolean {
  const query = bp ? BREAKPOINT_QUERY[bp] : null;
  return useSyncExternalStore(
    (onChange) => {
      if (!query || typeof window === 'undefined' || !window.matchMedia) return () => {};
      const m = window.matchMedia(query);
      m.addEventListener('change', onChange);
      return () => m.removeEventListener('change', onChange);
    },
    () => (query && typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

const TAB_TEXT: Record<TabsSize, string> = { xs: 'text-2xs', sm: 'text-xs', md: 'text-sm' };
const UNDERLINE_H: Record<TabsSize, string> = { xs: 'h-7', sm: 'h-8', md: 'h-10' };
const PILL_SIZE: Record<TabsSize, string> = { xs: 'h-6 px-2', sm: 'h-7 px-2.5', md: 'h-8 px-3' };

/** The look of one tab, for router links that act as tabs:
 *  `<NavLink className={({ isActive }) => tabClass({ active: isActive })}>`. Router links
 *  are navigation, not ARIA tabs: they take aria-current="page", not role="tab". */
export function tabClass(o: {
  /** The selected (or current-page) look. */
  active: boolean;
  /** underline (default) or pill. */
  variant?: TabsVariant;
  /** md (default), sm or xs, the same as Tabs. */
  size?: TabsSize;
  /** Equal-width tab that fills its share of the row (Tabs block). */
  block?: boolean;
  /** Extra classes, merged last. */
  className?: string;
}): string {
  const { active, variant = 'underline', size = 'md', block = false, className } = o;
  return cn(
    'relative inline-flex shrink-0 flex-col items-start justify-center whitespace-nowrap font-medium transition-colors duration-150',
    'pointer-coarse:min-h-11 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:text-th-ghost',
    TAB_TEXT[size],
    variant === 'underline'
      ? cn('border-b-2 px-0.5', UNDERLINE_H[size], active ? 'border-th-accent text-th-hi' : 'border-transparent text-th-hi3 hover:text-th-hi')
      : cn('rounded-lg', PILL_SIZE[size], active ? 'bg-th-elevated text-th-hi' : 'text-th-hi3 hover:bg-th-elevated/60 hover:text-th-hi'),
    block && 'min-w-0 flex-1 items-center text-center',
    className,
  );
}

export interface TabItem {
  value: string;
  label: ReactNode;
  /** A count after the label (unread, results), shown as a small Badge. */
  count?: number;
  /** A quieter second line under the label ("$12 · 3h"). */
  sub?: ReactNode;
  /** Shown but not selectable; the arrow keys skip it. */
  disabled?: boolean;
}

interface TabsCtx {
  idBase: string;
  value: string;
}
const Ctx = createContext<TabsCtx | null>(null);

const tabId = (base: string, v: string) => `${base}-tab-${v}`;
const panelId = (base: string, v: string) => `${base}-panel-${v}`;

export interface TabsProps {
  /** The selected tab's value. Tabs is controlled. */
  value: string;
  /** Called with the new value on click and on arrow keys (selection follows focus). */
  onChange: (value: string) => void;
  items: TabItem[];
  /** Names the tab list for screen readers: "Job sections". */
  label: string;
  /** underline: page and card sections (default). pill: a quieter switcher inside a toolbar. */
  variant?: TabsVariant;
  /** md: 14px text (default). sm: 12px for card headers. xs: 11px for dense widget
   *  strips (pill h-6, underline h-7). All 44px on touch screens. */
  size?: TabsSize;
  /** The tab list fills its container and every tab gets an equal share of the width,
   *  like Segmented block. */
  block?: boolean;
  /** Responsive panes: from this breakpoint (md 768px, lg 1024px) the tab list is not
   *  rendered, and TabPanels with the same showFrom render as plain regions side by
   *  side. Below it, the full ARIA tabs pattern applies. */
  hideFrom?: TabsBreakpoint;
  /** Prefix for the tab and panel ids. Needed only when TabPanels render outside this
   *  Tabs: give both the same idBase. */
  idBase?: string;
  /** Set when TabPanels with this idBase render elsewhere, so each tab points at its
   *  panel (aria-controls). Automatic when the panels are this component's children. */
  controlsPanels?: boolean;
  /** TabPanels for the items. They render after the tab list. */
  children?: ReactNode;
  /** Class for the tab list. */
  className?: string;
}

/** Tabs that switch between panels in place: the full ARIA tabs pattern (tablist, tab
 *  with aria-selected and aria-controls, arrow keys, Home and End). For links that
 *  change the URL, use tabClass() on the router's link instead. */
export function Tabs({
  value,
  onChange,
  items,
  label,
  variant = 'underline',
  size = 'md',
  block = false,
  hideFrom,
  idBase,
  controlsPanels,
  children,
  className,
}: TabsProps) {
  const auto = useId();
  const wide = useBreakpoint(hideFrom);
  const base = idBase ?? auto.replace(/:/g, '');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
  const selected = items.findIndex((t) => t.value === value);
  const tabStop = selected >= 0 && !items[selected].disabled ? selected : (enabled[0] ?? -1);
  const linked = controlsPanels ?? children != null;

  const pick = (i: number) => {
    const t = items[i];
    if (!t || t.disabled) return;
    onChange(t.value);
    refs.current[i]?.focus();
  };
  const move = (dir: 1 | -1) => {
    if (!enabled.length) return;
    const from = refs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(from >= 0 ? from : selected);
    pick(pos < 0 ? enabled[0] : enabled[(pos + dir + enabled.length) % enabled.length]);
  };

  const list = (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex max-w-full items-end overflow-x-auto scrollbar-none',
        block && 'w-full',
        variant === 'underline' ? cn(block ? 'gap-1' : 'gap-5', 'shadow-[inset_0_-1px_0_var(--nish-line)]') : 'gap-1',
        className,
      )}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
        else if (e.key === 'Home') { e.preventDefault(); if (enabled.length) pick(enabled[0]); }
        else if (e.key === 'End') { e.preventDefault(); if (enabled.length) pick(enabled[enabled.length - 1]); }
      }}
    >
      {items.map((t, i) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(base, t.value)}
            aria-selected={on}
            aria-controls={linked ? panelId(base, t.value) : undefined}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={t.disabled}
            onClick={() => pick(i)}
            className={tabClass({ active: on, variant, size, block, className: t.sub != null ? 'h-auto py-1.5' : undefined })}
          >
            <span className="inline-flex items-center gap-1.5">
              {t.label}
              {t.count != null ? (
                <Badge tone={on ? 'accent' : 'neutral'} size="xs" className="tabular-nums">
                  {t.count}
                </Badge>
              ) : null}
            </span>
            {t.sub != null ? <span className="text-xs font-normal text-th-hi3">{t.sub}</span> : null}
          </button>
        );
      })}
    </div>
  );

  if (children == null) return wide ? null : list;
  return (
    <Ctx.Provider value={{ idBase: base, value }}>
      {wide ? null : list}
      {children}
    </Ctx.Provider>
  );
}

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** The tab value this panel belongs to. */
  value: string;
  /** Only when the panel renders outside its Tabs: the same idBase as the Tabs. */
  idBase?: string;
  /** Only when the panel renders outside its Tabs: whether its tab is selected. */
  active?: boolean;
  /** Responsive panes: from this breakpoint (md 768px, lg 1024px) the panel always
   *  renders, as a plain region (no role="tabpanel", never hidden). Pair it with the
   *  same hideFrom on Tabs. */
  showFrom?: TabsBreakpoint;
  /** Keep the content mounted (hidden) while the tab is not selected, so state such as
   *  a scroll position or a draft survives switching tabs. */
  keepMounted?: boolean;
  children?: ReactNode;
}

/** The content for one tab: role="tabpanel", labelled by its tab, hidden unless its tab
 *  is selected. Render it as a child of Tabs, or pass idBase and active. */
export function TabPanel({ value, idBase, active, showFrom, keepMounted = false, children, className, ...rest }: TabPanelProps) {
  const ctx = useContext(Ctx);
  const wide = useBreakpoint(showFrom);
  const base = idBase ?? ctx?.idBase ?? '';
  const shown = active ?? ctx?.value === value;
  if (wide) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }
  return (
    <div
      role="tabpanel"
      id={panelId(base, value)}
      aria-labelledby={tabId(base, value)}
      tabIndex={0}
      hidden={!shown}
      className={cn('focus-visible:outline-offset-4', className)}
      {...rest}
    >
      {shown || keepMounted ? children : null}
    </div>
  );
}
