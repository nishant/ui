'use client';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { isRtl } from './client';
import { useScrollEdges } from './layout-vars';
import { revealInRow } from './nav';
import { Badge } from './primitives';
import { tabClass, type TabsSize, type TabsVariant } from './tabs-classes';

export { tabClass, type TabsSize } from './tabs-classes';
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

function assignRef<T>(ref: Ref<T> | undefined, el: T | null): void {
  if (typeof ref === 'function') ref(el);
  else if (ref) (ref as { current: T | null }).current = el;
}

// The tab strip: scrolls sideways when the tabs do not fit, fades the edges with more
// content, and keeps the selected tab in view. A component of its own so the effects
// start whenever the strip mounts (it is absent while a hideFrom breakpoint matches).
function ScrollingList({
  selected,
  children,
  listRef,
  ...rest
}: { selected: number; listRef?: Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollEdges(ref);
  useEffect(() => {
    const el = selected >= 0 ? ref.current?.children[selected] : null;
    if (el && ref.current) revealInRow(ref.current, el as HTMLElement);
  }, [selected]);
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      assignRef(ref, el);
      assignRef(listRef, el);
    },
    [listRef],
  );
  return (
    <div ref={setRef} {...rest}>
      {children}
    </div>
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
const Ctx = /* @__PURE__ */ createContext<TabsCtx | null>(null);

const tabId = (base: string, v: string) => `${base}-tab-${v}`;
const panelId = (base: string, v: string) => `${base}-panel-${v}`;

export interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children' | 'defaultValue'> {
  /** The selected tab's value (controlled). Omit it, with `defaultValue`, for an uncontrolled Tabs. */
  value?: string;
  /** The first selected tab of an uncontrolled Tabs. Default: the first enabled tab. */
  defaultValue?: string;
  /** Called with the new value on click and on arrow keys (selection follows focus). */
  onValueChange?: (value: string) => void;
  /** Alias of `onValueChange`, kept for existing code. Both are called when both are given. */
  onChange?: (value: string) => void;
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
  /** The tab list element. */
  ref?: Ref<HTMLDivElement>;
}

/** Tabs that switch between panels in place: the full ARIA tabs pattern (tablist, tab
 *  with aria-selected and aria-controls, arrow keys that mirror in right-to-left layouts,
 *  Home and End). Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 *  For links that change the URL, use tabClass() on the router's link instead. */
export function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
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
  ref,
  onKeyDown,
  ...rest
}: TabsProps) {
  const auto = useId();
  const wide = useBreakpoint(hideFrom);
  const base = idBase ?? auto.replace(/:/g, '');
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
  const [inner, setInner] = useState<string>(() => defaultValue ?? items.find((t) => !t.disabled)?.value ?? '');
  const value = valueProp ?? inner;
  const selected = items.findIndex((t) => t.value === value);
  const tabStop = selected >= 0 && !items[selected].disabled ? selected : (enabled[0] ?? -1);
  const linked = controlsPanels ?? children != null;

  const pick = (i: number) => {
    const t = items[i];
    if (!t || t.disabled) return;
    if (valueProp === undefined) setInner(t.value);
    onValueChange?.(t.value);
    onChange?.(t.value);
    refs.current[i]?.focus();
  };
  const move = (dir: 1 | -1) => {
    if (!enabled.length) return;
    const from = refs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(from >= 0 ? from : selected);
    pick(pos < 0 ? enabled[0] : enabled[(pos + dir + enabled.length) % enabled.length]);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    // In a right-to-left layout the first tab is on the right: ArrowRight goes back.
    const forward = isRtl(e.currentTarget) ? 'ArrowLeft' : 'ArrowRight';
    const backward = isRtl(e.currentTarget) ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) { e.preventDefault(); move(1); }
    else if (e.key === backward) { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); if (enabled.length) pick(enabled[0]); }
    else if (e.key === 'End') { e.preventDefault(); if (enabled.length) pick(enabled[enabled.length - 1]); }
  };

  const list = (
    <ScrollingList
      {...rest}
      listRef={ref}
      selected={selected}
      role="tablist"
      aria-label={label}
      className={cn(
        'flex max-w-full items-end overflow-x-auto nish-no-scrollbar nish-scroll-fade',
        block && 'w-full',
        variant === 'underline' ? cn(block ? 'gap-1' : 'gap-5', 'shadow-[inset_0_-1px_0_var(--nish-line)]') : 'gap-1',
        className,
      )}
      onKeyDown={handleKeyDown}
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
            data-state={on ? 'active' : 'inactive'}
            data-disabled={t.disabled ? '' : undefined}
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
    </ScrollingList>
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
  ref?: Ref<HTMLDivElement>;
}

/** The content for one tab: role="tabpanel", labelled by its tab, hidden unless its tab
 *  is selected. Render it as a child of Tabs, or pass idBase and active. */
export function TabPanel({ value, idBase, active, showFrom, keepMounted = false, children, className, ref, ...rest }: TabPanelProps) {
  const ctx = useContext(Ctx);
  const wide = useBreakpoint(showFrom);
  const base = idBase ?? ctx?.idBase ?? '';
  const shown = active ?? ctx?.value === value;
  if (wide) {
    return (
      <div {...rest} ref={ref} className={className}>
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
      data-state={shown ? 'active' : 'inactive'}
      {...rest}
      ref={ref}
      className={cn('focus-visible:outline-offset-4', className)}
    >
      {shown || keepMounted ? children : null}
    </div>
  );
}
