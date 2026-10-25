import { createContext, useContext, useId, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';
import { Badge } from './primitives';

type TabsVariant = 'underline' | 'pill';
type TabsSize = 'sm' | 'md';

/** The look of one tab, for router links that act as tabs:
 *  `<NavLink className={({ isActive }) => tabClass({ active: isActive })}>`. Router links
 *  are navigation, not ARIA tabs: they take aria-current="page", not role="tab". */
export function tabClass(o: { active: boolean; variant?: TabsVariant; size?: TabsSize; className?: string }): string {
  const { active, variant = 'underline', size = 'md', className } = o;
  return cn(
    'relative inline-flex shrink-0 flex-col items-start justify-center whitespace-nowrap font-medium transition-colors duration-150',
    'pointer-coarse:min-h-11 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:text-th-ghost',
    size === 'sm' ? 'text-xs' : 'text-sm',
    variant === 'underline'
      ? cn('border-b-2 px-0.5', size === 'sm' ? 'h-8' : 'h-10', active ? 'border-th-accent text-th-hi' : 'border-transparent text-th-hi3 hover:text-th-hi')
      : cn('rounded-lg', size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-3', active ? 'bg-th-elevated text-th-hi' : 'text-th-hi3 hover:bg-th-elevated/60 hover:text-th-hi'),
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
  /** md: 14px text (default). sm: 12px for card headers. Both 44px on touch screens. */
  size?: TabsSize;
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
export function Tabs({ value, onChange, items, label, variant = 'underline', size = 'md', idBase, controlsPanels, children, className }: TabsProps) {
  const auto = useId();
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
        variant === 'underline' ? 'gap-5 shadow-[inset_0_-1px_0_var(--nish-line)]' : 'gap-1',
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
            className={tabClass({ active: on, variant, size, className: t.sub != null ? 'h-auto py-1.5' : undefined })}
          >
            <span className="inline-flex items-center gap-1.5">
              {t.label}
              {t.count != null ? (
                <Badge tone={on ? 'accent' : 'neutral'} className="px-1.5 leading-4 tabular-nums">
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

  if (children == null) return list;
  return (
    <Ctx.Provider value={{ idBase: base, value }}>
      {list}
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
  children?: ReactNode;
}

/** The content for one tab: role="tabpanel", labelled by its tab, hidden unless its tab
 *  is selected. Render it as a child of Tabs, or pass idBase and active. */
export function TabPanel({ value, idBase, active, children, className, ...rest }: TabPanelProps) {
  const ctx = useContext(Ctx);
  const base = idBase ?? ctx?.idBase ?? '';
  const shown = active ?? ctx?.value === value;
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
      {shown ? children : null}
    </div>
  );
}
