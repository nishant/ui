'use client';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
  type SVGProps,
} from 'react';
import { cn } from '../cn';
import { sparklineGeometry } from '../sparkline-path';
import { safeUrl } from '../url';
import { mergeRefs } from './data-classes';
import {
  CALLOUT_CLAMP,
  CALLOUT_TONE,
  DOT_SIZE,
  FILL,
  FORCED_MARK,
  GRID_BASE,
  GRID_MD,
  HALO,
  LEGEND_FILL,
  METER_FILL,
  METER_THICK,
  METER_THICK_V,
  SPARK_TONE,
  STAT_SKELETON,
  STAT_TONE,
  STAT_VALUE_SIZE,
  toneFor,
  warnDev,
} from './display-classes';
import type { CalloutTone, ChartLegendTone, MeterTone, SparklineTone, StatusTone } from './display-classes';
import { Skeleton } from './feedback';
import { AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon, InfoIcon, XIcon } from './icons';
import { useHeightVar, useStuck } from './layout-vars';
import { DropdownMenu, InlineMenuItemContext } from './menu';
import { Tooltip } from './tooltip';
import { Badge, Button, Card, IconButton, type ButtonProps } from './primitives';
import { useStrings } from './provider';
import { DISPLAY_STRINGS, SHELL_STRINGS } from './strings';
import { ThemeToggle } from './theme-toggle';

// Read-only display pieces: notices, status marks, numbers, meters, small charts,
// headers. Every color is a role; fills (*-fill) for marks, plain roles for text.

// The pure helpers and tone types live in display-classes.ts (no directive) so server code
// can import them; they are re-exported here so existing import paths keep working.
export { signTone, toneFor } from './display-classes';
export type { CalloutTone, ChartLegendTone, MeterTone, SparklineTone, StatusTone } from './display-classes';

// --- icons only this file needs (24px grid, 2px stroke, lucide geometry) -------------

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect width="14" height="14" x="8" y="8" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Svg>
);

const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 18 6-6-6-6" />
  </Svg>
);

// =====================================================================================
// Callout
// =====================================================================================

function defaultCalloutIcon(tone: CalloutTone, size: number): ReactNode {
  if (tone === 'ok') return <CheckCircleIcon size={size} />;
  if (tone === 'warn' || tone === 'loss') return <AlertTriangleIcon size={size} />;
  return <InfoIcon size={size} />;
}

export interface CalloutProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'onClick'> {
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
  /** What kind of notice: info and accent for news, ok for success, warn for something to
   *  check, loss for a failure. neutral is a plain grey note. */
  tone?: CalloutTone;
  /** Leading icon. Defaults by tone (Info, CheckCircle or AlertTriangle); false hides it. */
  icon?: ReactNode | false;
  /** A short bold first line. */
  title?: ReactNode;
  /** The body text. */
  children?: ReactNode;
  /** Usually one small Button or link, shown after the text. */
  action?: ReactNode;
  /** Adds a Dismiss button that calls this. */
  onDismiss?: () => void;
  /** Accessible name of the dismiss button. Default: the provider's `dismiss` string. */
  dismissLabel?: string;
  /** box: a rounded tinted box in the flow (default). bar: full width with square
   *  corners and no side borders, for a sticky page-level alert. */
  variant?: 'box' | 'bar';
  /** Tighter padding and xs text, for widgets and table cells. */
  compact?: boolean;
  /** Announce it when it appears: role="alert" for loss, role="status" otherwise.
   *  Leave it off for notices that are part of the page from the start. */
  live?: boolean;
  /** Sticks under the app header (`top: var(--nish-header-h)`), above page content. Pair
   *  with variant="bar". */
  sticky?: boolean;
  /** Limits the body to 1, 2 or 3 lines with an ellipsis, instead of growing. */
  clamp?: 1 | 2 | 3;
  /** Makes the icon, title and text one link (at least 44px tall) with a trailing
   *  chevron. `action` and the dismiss button stay separate controls beside it. A URL that
   *  is not safe (`javascript:` and so on) is dropped with a dev warning, and the callout
   *  is not a link. */
  href?: string;
  /** Like href, but a button. */
  onClick?: () => void;
  /** Shows a "+{count}" badge after the title, for "and 3 more" notices. */
  count?: number;
}

/** An inline notice: a tinted box with an icon, an optional title, text and an action.
 *  variant="bar" is opaque, so it can stick under the header without content showing
 *  through. */
export function Callout({
  tone = 'info',
  icon,
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  variant = 'box',
  compact = false,
  live = false,
  sticky = false,
  clamp,
  href: hrefProp,
  onClick,
  count,
  className,
  ref,
  ...rest
}: CalloutProps) {
  const strings = useStrings(DISPLAY_STRINGS, SHELL_STRINGS);
  const t = CALLOUT_TONE[tone];
  const shown = icon === false ? null : (icon ?? defaultCalloutIcon(tone, compact ? 14 : 16));
  const href = hrefProp == null ? undefined : (safeUrl(hrefProp) ?? undefined);
  if (hrefProp != null && href === undefined) warnDev(`nish-ui: Callout dropped an unsafe href (${hrefProp.slice(0, 40)}).`);
  const interactive = href != null || onClick != null;
  const iconEl = shown ? <span className={cn('shrink-0', compact ? 'mt-px' : 'mt-0.5', t.icon)}>{shown}</span> : null;
  const text = (
    <div className="min-w-0 flex-1 basis-60">
      {title || count != null ? (
        <p className="flex items-center gap-2 font-medium leading-snug text-th-hi">
          {title ? <span className="min-w-0">{title}</span> : null}
          {count != null ? (
            <Badge tone={tone} aria-label={strings.moreCount(count)} className="shrink-0">
              +{count}
            </Badge>
          ) : null}
        </p>
      ) : null}
      {children ? (
        <div className={cn('leading-snug text-th-hi2', title || count != null ? 'mt-0.5' : null, clamp && CALLOUT_CLAMP[clamp])}>
          {children}
        </div>
      ) : null}
    </div>
  );
  const actionEl = action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null;
  const dismissEl = onDismiss ? (
    <IconButton label={dismissLabel ?? strings.dismiss} size="xs" onClick={onDismiss} className="-my-0.5 -me-1">
      <XIcon size={14} />
    </IconButton>
  ) : null;
  const chevron = <ChevronDownIcon size={16} className="-rotate-90 shrink-0 self-center text-th-hi3 rtl:rotate-90" />;
  const hit = cn(
    'flex min-h-11 min-w-0 flex-1 items-start text-start outline-none focus-visible:ring-2 focus-visible:ring-th-accent/40 forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight]',
    compact ? 'gap-2' : 'gap-3',
    // Pull the padding of the row into the link so the whole row is the target.
    compact ? '-my-2 py-2' : '-my-3 py-3',
  );
  return (
    <div
      ref={ref}
      role={live ? (tone === 'loss' ? 'alert' : 'status') : undefined}
      data-nish-bar={sticky ? '' : undefined}
      className={cn(
        'flex border',
        variant === 'bar' && action ? 'items-center' : 'items-start',
        compact ? 'gap-2 px-3 py-2 text-xs' : 'gap-3 px-4 py-3 text-sm',
        variant === 'bar' ? 'w-full rounded-none border-x-0' : 'rounded-xl',
        variant === 'bar' ? t.bar : t.box,
        sticky && 'sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)]',
        className,
      )}
      {...rest}
    >
      {interactive ? (
        <>
          {href != null ? (
            <a href={href} className={hit}>
              {iconEl}
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">{text}</span>
              {chevron}
            </a>
          ) : (
            <button type="button" onClick={onClick} className={hit}>
              {iconEl}
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">{text}</span>
              {chevron}
            </button>
          )}
          {actionEl}
          {dismissEl}
        </>
      ) : (
        <>
          {iconEl}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            {text}
            {actionEl}
          </div>
          {dismissEl}
        </>
      )}
    </div>
  );
}

// =====================================================================================
// StatusDot
// =====================================================================================

export interface StatusDotProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** The dot element. */
  ref?: Ref<HTMLSpanElement>;
  /** ok, warn, loss and info use the status fills; accent the accent; neutral the ghost grey. */
  tone: StatusTone;
  /** xs 6px, sm 8px (default), md 10px, lg 14px. */
  size?: keyof typeof DOT_SIZE;
  /** Gently pulses the opacity, for "live" or "running". Still under reduced motion. */
  pulse?: boolean;
  /** A soft ring around the dot, for a header status. */
  halo?: boolean;
  /** The accessible name read by screen readers ("Up", "Degraded"; role="img"). Without it the
   *  dot is aria-hidden, so always pair it with visible text then. */
  label?: string;
}

/** A small round status mark. Color is never the only signal: give it a label or
 *  put text beside it. In forced-colors mode it stays visible in the system highlight color. */
export function StatusDot({ tone, size = 'sm', pulse = false, halo = false, label, className, ref, ...rest }: StatusDotProps) {
  return (
    <span
      ref={ref}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-tone={tone}
      className={cn(
        'inline-block shrink-0 rounded-full',
        DOT_SIZE[size],
        FILL[tone],
        halo && HALO[tone],
        pulse && 'motion-safe:animate-pulse',
        FORCED_MARK,
        'forced-colors:border forced-colors:border-[CanvasText]',
        className,
      )}
      {...rest}
    />
  );
}

// =====================================================================================
// Stat, StatGrid
// =====================================================================================

// Set by StatGrid so each Stat renders a <div> of <dt>/<dd> inside its <dl>.
const InStatGrid = /* @__PURE__ */ createContext(false);

export interface StatProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'> {
  /** The root element: the card, or the `dl` / `div` of the other variants. */
  ref?: Ref<HTMLElement>;
  /** What the number is: "Open positions", "Uptime (30d)". */
  label: ReactNode;
  /** The number, already formatted ("$12,480", "99.95%"). */
  value: ReactNode;
  /** A quiet line under the value: a change, a date, a unit. */
  sub?: ReactNode;
  /** Colors the value: ok for gains, loss for losses, warn for attention. Use
   *  signTone(n) for signed numbers. */
  tone?: 'ok' | 'loss' | 'warn' | 'neutral';
  /** An explanation shown in a tooltip on the label (dotted underline). */
  tip?: ReactNode;
  /** Value size: sm 16px, md 20px (default), lg 24px. */
  size?: keyof typeof STAT_VALUE_SIZE;
  /** card: a small Card (default). inset: a grey box for use inside a card. plain: no box. */
  variant?: 'card' | 'inset' | 'plain';
  /** Skeleton bars of the same size instead of the value and sub. */
  loading?: boolean;
}

/** One labelled number. Inside a StatGrid it is a row of the grid's <dl>; on its own it
 *  renders its own <dl>. */
export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
  tip,
  size = 'md',
  variant = 'card',
  loading = false,
  className,
  ref,
  ...rest
}: StatProps) {
  const inGrid = useContext(InStatGrid);
  // hi3 clears 4.5:1 on bg and surface only; on the elevated inset box the quiet text is hi2.
  const quiet = variant === 'inset' ? 'text-th-hi2' : 'text-th-hi3';
  const body = (
    <>
      <dt className={cn('text-xs', quiet)}>
        {tip ? (
          <Tooltip tip={tip} variant="hint">
            {label}
          </Tooltip>
        ) : (
          label
        )}
      </dt>
      {loading ? (
        <dd className="mt-1" aria-busy="true">
          <Skeleton className={cn('w-24', STAT_SKELETON[size])} />
          {sub ? <Skeleton className="mt-1.5 h-3 w-16" /> : null}
        </dd>
      ) : (
        <>
          <dd
            className={cn(
              'mt-0.5 font-semibold tabular-nums tracking-tight [overflow-wrap:anywhere]',
              STAT_VALUE_SIZE[size],
              STAT_TONE[tone],
            )}
          >
            {value}
          </dd>
          {sub ? <dd className={cn('mt-0.5 text-xs', quiet)}>{sub}</dd> : null}
        </>
      )}
    </>
  );
  if (variant === 'card') {
    return (
      <Card ref={ref} padding="sm" className={cn('min-w-0', className)} {...rest}>
        {inGrid ? body : <dl>{body}</dl>}
      </Card>
    );
  }
  const Box = (inGrid ? 'div' : 'dl') as 'div';
  return (
    <Box
      ref={ref as Ref<HTMLDivElement>}
      className={cn('min-w-0', variant === 'inset' && 'rounded-lg bg-th-elevated p-3', className)}
      {...rest}
    >
      {body}
    </Box>
  );
}

export interface StatGridProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
  /** The `dl` element. */
  ref?: Ref<HTMLDListElement>;
  /** Columns on phones (base, default 2) and from 768px (md, default 4). */
  cols?: { base?: keyof typeof GRID_BASE; md?: keyof typeof GRID_MD };
  /** Stat elements. */
  children: ReactNode;
}

/** A responsive grid of Stats, rendered as one <dl>. */
export function StatGrid({ cols, children, className, ref, ...rest }: StatGridProps) {
  return (
    <dl ref={ref} className={cn('grid gap-3', GRID_BASE[cols?.base ?? 2], GRID_MD[cols?.md ?? 4], className)} {...rest}>
      <InStatGrid.Provider value={true}>{children}</InStatGrid.Provider>
    </dl>
  );
}

// =====================================================================================
// Meter
// =====================================================================================

export interface MeterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'role'> {
  /** The element with the `meter` / `progressbar` role (the bar itself, also with `showValue`). */
  ref?: Ref<HTMLDivElement>;
  /** The current value, between min and max (clamped). */
  value: number;
  /** Default 0. */
  min?: number;
  /** Default 100. */
  max?: number;
  /** Accessible name: what is being measured ("Disk used"). Required, since the bar has no text. */
  label: string;
  /** Fill color. Overrides thresholds. Default: from thresholds, else accent. neutral:
   *  a gray fill for a quantity with no status meaning (swap, a share of a total). */
  tone?: MeterTone;
  /** Picks ok, warn or loss from the value (see toneFor) when tone is not given. */
  thresholds?: { warn: number; loss: number };
  /** Bar thickness: xs 4px, sm 6px (default), md 10px. */
  size?: keyof typeof METER_THICK;
  /** vertical fills from the bottom; give the meter a height (className="h-16"). */
  orientation?: 'horizontal' | 'vertical';
  /** Track color: elevated on a surface (default), overlay when the meter sits on an
   *  elevated box. */
  track?: 'elevated' | 'overlay';
  /** meter: a measurement (role="meter"). progress: work being done (role="progressbar"). */
  kind?: 'meter' | 'progress';
  /** Shows the rounded percentage beside a horizontal bar. */
  showValue?: boolean;
}

/** A thin bar showing how full something is: disk, quota, progress, a score. The fill
 *  stays visible in forced-colors mode (system highlight on a bordered track). `className`
 *  goes on the bar, or on the wrapper row with `showValue`. */
export function Meter({
  value,
  min = 0,
  max = 100,
  label,
  tone,
  thresholds,
  size = 'sm',
  orientation = 'horizontal',
  track = 'elevated',
  kind = 'meter',
  showValue = false,
  className,
  ref,
  ...rest
}: MeterProps) {
  const span = max - min || 1;
  const clamped = Math.min(Math.max(value, min), max);
  const pct = ((clamped - min) / span) * 100;
  const resolved: MeterTone = tone ?? (thresholds ? toneFor(clamped, thresholds) : 'accent');
  const vertical = orientation === 'vertical';
  const bar = (
    <div
      {...rest}
      ref={ref}
      role={kind === 'progress' ? 'progressbar' : 'meter'}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={`${Math.round(pct)}%`}
      data-tone={resolved}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        track === 'overlay' ? 'bg-th-overlay' : 'bg-th-elevated',
        'forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]',
        vertical ? cn('h-full', METER_THICK_V[size]) : cn('w-full', METER_THICK[size]),
        !showValue && className,
      )}
    >
      <div
        className={cn(
          'absolute rounded-full duration-300 ease-out motion-reduce:transition-none',
          vertical ? 'inset-x-0 bottom-0 transition-[height]' : 'inset-y-0 start-0 transition-[width]',
          METER_FILL[resolved],
          FORCED_MARK,
        )}
        style={vertical ? { height: `${pct}%` } : { width: `${pct}%` }}
      />
    </div>
  );
  if (!showValue || vertical) return bar;
  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      {bar}
      <span aria-hidden="true" className="w-9 shrink-0 text-end text-xs tabular-nums text-th-hi3">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// =====================================================================================
// Sparkline
// =====================================================================================

export interface SparklineProps
  extends Omit<ComponentPropsWithoutRef<'svg'>, 'values' | 'fill' | 'min' | 'max' | 'width' | 'height' | 'children'> {
  /** The svg element. */
  ref?: Ref<SVGSVGElement>;
  /** The series, oldest first. null leaves a gap (a missed check, a closed market). */
  values: (number | null)[];
  /** Accessible name, ideally with the trend: "Response time, last 24 hours, 120 to 180 ms". */
  label: string;
  /** Line color. Default chart-1. */
  tone?: SparklineTone;
  /** Width in px. Default 120; pass className="w-full" to stretch it. */
  width?: number;
  /** Height in px. Default 28. */
  height?: number;
  /** Shades the area under the line. */
  fill?: boolean;
  /** Bottom of the scale. Default: the smallest value. */
  min?: number;
  /** Top of the scale. Default: the largest value. */
  max?: number;
}

/** A tiny line chart with no axes, for a trend beside a number. Plain SVG, no chart
 *  library. Gaps at nulls; a flat dashed line when there is no data. The geometry is
 *  recomputed only when `values`, the size or the scale change. */
export function Sparkline({
  values,
  label,
  tone = 'chart-1',
  width = 120,
  height = 28,
  fill = false,
  min,
  max,
  className,
  ref,
  ...rest
}: SparklineProps) {
  const strings = useStrings(DISPLAY_STRINGS, SHELL_STRINGS);
  const { empty, lines, areas, baseline } = useMemo(
    () => sparklineGeometry(values, width, height, min, max),
    [values, width, height, min, max],
  );

  return (
    <svg
      role="img"
      aria-label={empty ? strings.noDataNamed(label) : label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      {...rest}
      ref={ref}
      className={cn('block shrink-0 overflow-visible', empty ? 'text-th-line-strong' : SPARK_TONE[tone], className)}
    >
      {empty ? (
        <path
          d={baseline}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <>
          {fill ? areas.map((d, i) => <path key={`a${i}`} d={d} fill="currentColor" fillOpacity={0.15} />) : null}
          {lines.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </>
      )}
    </svg>
  );
}

// =====================================================================================
// Disclosure
// =====================================================================================

export interface DisclosureProps extends Omit<ComponentPropsWithoutRef<'details'>, 'open' | 'onToggle' | 'children'> {
  /** The `details` element. */
  ref?: Ref<HTMLDetailsElement>;
  /** The always-visible row that opens and closes it. */
  summary: ReactNode;
  /** What it reveals. */
  children: ReactNode;
  /** Starts open (uncontrolled). */
  defaultOpen?: boolean;
  /** Controlled open state; pair it with onOpenChange. */
  open?: boolean;
  /** Called with the new state when the reader toggles it. */
  onOpenChange?: (open: boolean) => void;
  /** plain: a bare row (default). card: a bordered surface box. */
  variant?: 'plain' | 'card';
}

/** Show-more on native <details>/<summary>: keyboard and find-in-page work for free,
 *  with a chevron that turns when open. The root carries `data-state="open|closed"`. */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  variant = 'plain',
  className,
  ref,
  ...rest
}: DisclosureProps) {
  const card = variant === 'card';
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  return (
    <details
      {...rest}
      ref={ref}
      // Controlled, React writes `open` whenever it changes; uncontrolled, the element owns
      // the state and `inner` mirrors it for data-state.
      open={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      onToggle={(e) => {
        const now = e.currentTarget.open;
        if (open === undefined) setInner(now);
        // Skip the toggle event React's own write of `open` causes.
        if (open === undefined || now !== open) onOpenChange?.(now);
      }}
      className={cn(
        'group',
        card && 'rounded-xl border border-th-line bg-th-surface shadow-card',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-medium text-th-hi select-none',
          '[&::-webkit-details-marker]:hidden hover:text-th-hi pointer-coarse:min-h-11',
          card ? 'px-4 py-3' : 'py-1.5',
        )}
      >
        <ChevronRightIcon
          size={14}
          className="shrink-0 text-th-hi3 transition-transform duration-150 group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90 motion-reduce:transition-none"
        />
        <span className="min-w-0 flex-1">{summary}</span>
      </summary>
      <div className={cn('text-sm text-th-hi2', card ? 'border-t border-th-line px-4 py-3' : 'pb-2 ps-6 pt-1')}>
        {children}
      </div>
    </details>
  );
}

// =====================================================================================
// Kbd
// =====================================================================================

export interface KbdProps extends ComponentPropsWithoutRef<'kbd'> {
  /** The `kbd` element. */
  ref?: Ref<HTMLElement>;
}

/** A keyboard key or shortcut, e.g. <Kbd>⌘K</Kbd>. */
export function Kbd({ className, ref, ...rest }: KbdProps) {
  return (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex min-w-[1.5em] items-center justify-center rounded border border-th-line-strong bg-th-elevated px-1.5 font-mono text-2xs leading-4 text-th-hi2',
        className,
      )}
      {...rest}
    />
  );
}

// =====================================================================================
// copyText, CopyButton
// =====================================================================================

/** Copies text to the clipboard. Uses the Clipboard API when it exists and the page is a
 *  secure context; otherwise (no API, an insecure origin, a denied permission, an old
 *  browser) it falls back to a hidden textarea and `execCommand('copy')`. Resolves true when
 *  it worked, false when neither path did. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined' && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // permission denied or not focused: try the fallback
  }
  if (typeof document === 'undefined' || !document.body) return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.setAttribute('aria-hidden', 'true');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  ta.style.opacity = '0';
  const active = document.activeElement as HTMLElement | null;
  document.body.appendChild(ta);
  ta.select();
  try {
    ta.setSelectionRange(0, text.length);
  } catch {
    // some engines refuse on a readonly field
  }
  let ok = false;
  try {
    ok = typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  active?.focus?.();
  return ok;
}

const COPIED_MS = 1_500;

export interface CopyButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onCopy' | 'onClick' | 'children' | 'type'> {
  /** The button element. */
  ref?: Ref<HTMLButtonElement>;
  /** What lands on the clipboard. */
  text: string;
  /** Button text, and the accessible name when iconOnly. Default: the provider's `copy` string ("Copy"). */
  label?: string;
  /** Shown for 1.5s after a copy and announced politely. Default: the provider's `copied` string. */
  copiedLabel?: string;
  /** Shown for 1.5s when neither the Clipboard API nor the textarea fallback worked, and
   *  announced politely. Default "Copy failed". */
  failedLabel?: string;
  /** A square IconButton instead of a labelled Button. */
  iconOnly?: boolean;
  /** Button size (or IconButton size when iconOnly). Default sm. */
  size?: 'sm' | 'md';
  /** Button variant when not iconOnly. Default secondary. */
  variant?: ButtonProps['variant'];
  /** Called after each copy attempt with whether it worked. */
  onCopy?: (ok: boolean) => void;
}

/** Copies text with one click, shows "Copied" for 1.5s and tells screen readers. Without a
 *  Clipboard API (or on an insecure origin) it falls back to a textarea and `execCommand`;
 *  when that fails too it shows `failedLabel` instead. */
export function CopyButton({
  text,
  label,
  copiedLabel,
  failedLabel = 'Copy failed',
  iconOnly = false,
  size = 'sm',
  variant = 'secondary',
  onCopy,
  className,
  ref,
  ...rest
}: CopyButtonProps) {
  const strings = useStrings(DISPLAY_STRINGS, SHELL_STRINGS);
  const idleText = label ?? strings.copy;
  const doneText = copiedLabel ?? strings.copied;
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const onClick = async () => {
    const ok = await copyText(text);
    onCopy?.(ok);
    setState(ok ? 'copied' : 'failed');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), COPIED_MS);
  };
  const shownText = state === 'copied' ? doneText : state === 'failed' ? failedLabel : idleText;
  const iconSize = size === 'sm' ? 14 : 16;
  const icon = state === 'copied' ? <CheckIcon size={iconSize} className="text-th-ok" /> : <CopyIcon size={iconSize} />;
  return (
    <>
      {iconOnly ? (
        <IconButton ref={ref} label={shownText} size={size} onClick={onClick} className={className} data-state={state} {...rest}>
          {icon}
        </IconButton>
      ) : (
        <Button ref={ref} variant={variant} size={size} icon={icon} onClick={onClick} className={className} data-state={state} {...rest}>
          {shownText}
        </Button>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied' ? doneText : state === 'failed' ? failedLabel : ''}
      </span>
    </>
  );
}

// =====================================================================================
// PageHeader
// =====================================================================================

export interface PageHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  /** The `header` element. */
  ref?: Ref<HTMLElement>;
  /** The page's title. */
  title: ReactNode;
  /** One sentence under the title. */
  description?: ReactNode;
  /** A small line above the title (a section or a breadcrumb). */
  eyebrow?: ReactNode;
  /** A back link above everything, e.g. the app's own
   *  <Link className={buttonClass({ variant: 'link' })}>← Jobs</Link>. */
  back?: ReactNode;
  /** Buttons on the right; they wrap under the title on phones. */
  actions?: ReactNode;
  /** Heading level. Default h1. */
  as?: 'h1' | 'h2';
  /** Sticks under the app header (`top: var(--nish-header-h)`) with an opaque background
   *  while the page scrolls; a bottom border appears once it is stuck. */
  sticky?: boolean;
  /** Sticky only: under 640px, once stuck, hide the description and show the title as
   *  one truncated line, so the bar stays short. Default true. */
  collapseWhenStuck?: boolean;
}

/** The title block at the top of a page: optional back link and eyebrow, the title,
 *  a description and actions. */
export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  as: H = 'h1',
  sticky = false,
  collapseWhenStuck = true,
  className,
  ref: refProp,
  ...rest
}: PageHeaderProps) {
  const ref = useRef<HTMLElement>(null);
  const stuck = useStuck(ref) && sticky;
  const collapsed = stuck && collapseWhenStuck;
  return (
    <header
      {...rest}
      ref={mergeRefs(ref, refProp)}
      data-nish-bar={sticky ? '' : undefined}
      className={cn(
        'flex flex-col gap-2',
        sticky &&
          cn(
            'sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] -mx-[var(--nish-page-gutter,1rem)] border-b bg-th-bg px-[var(--nish-page-gutter,1rem)] py-3',
            stuck ? 'border-th-line' : 'border-transparent',
          ),
        className,
      )}
    >
      {back ? <div className="text-sm">{back}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          {eyebrow ? <p className="mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3">{eyebrow}</p> : null}
          <H
            className={cn(
              'text-2xl font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]',
              collapsed && 'max-sm:truncate max-sm:text-base max-sm:[overflow-wrap:normal]',
            )}
          >
            {title}
          </H>
          {description ? <p className={cn('mt-1 text-sm text-th-hi2', collapsed && 'max-sm:hidden')}>{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

// =====================================================================================
// AppHeader
// =====================================================================================

/** The hub pill: a link back to the site that hosts a family of apps. */
export interface AppHeaderHub {
  /** Where the pill goes. An unsafe URL (`javascript:` and so on) hides the pill with a dev warning. */
  href: string;
  /** The pill text after the arrow ("nish.software", "Acme home"). */
  label: ReactNode;
  /** The pill's title attribute. Default: the provider's `hubTitle` string. */
  title?: string;
}

export interface AppHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'children'> {
  /** The `header` element. */
  ref?: Ref<HTMLElement>;
  /** The app's name, shown as the wordmark. */
  name: ReactNode;
  /** An icon before the name, drawn in the accent color. */
  icon?: ReactNode;
  /** Replaces the icon and name, and their home link, with your own node (a profile
   *  switcher, a wordmark with a subtitle). It is not wrapped in a link; `name` stays for
   *  screen readers. */
  brand?: ReactNode;
  /** A pill at the start of the header that links back to a hub site ("← nish.software").
   *  Default false: no pill. The nish.software apps pass
   *  `{ href: 'https://nish.software', label: 'nish.software' }`. */
  hub?: AppHeaderHub | false;
  /** Buttons before the theme toggle. */
  actions?: ReactNode;
  /** A second row of nav links (use tabClass on each, aria-current on the active one). */
  nav?: ReactNode;
  /** Replaces the default <ThemeToggle />; false hides it. */
  themeToggle?: ReactNode | false;
  /** Sticks to the top of the page. Default true. */
  sticky?: boolean;
  /** Classes for the inner rows, e.g. "mx-auto max-w-6xl" to match the page width. */
  innerClassName?: string;
  /** Makes the icon and name one link home (a 44px target), e.g. "/". */
  homeHref?: string;
  /** Under 640px show only the icon; the name stays for screen readers, so the pill,
   *  actions and theme toggle fit on one row. Needs an icon. */
  hideNameBelow?: 'sm';
  /** Names the nav row's <nav> landmark. Default: the provider's `sections` string. Give
   *  each nav on a page its own name. */
  navLabel?: string;
  /** Under 480px the hub pill shrinks to its arrow (.nish-pill-link--compact), for
   *  headers with a long name. */
  compactPill?: boolean;
  /** Frosted glass (`bg-th-bg/80 backdrop-blur-xl`) where the browser supports
   *  backdrop-filter. Off by default: the header is opaque. */
  glass?: boolean;
  /** Extra MenuItems. From 640px they render after `actions`; under 640px they collapse
   *  into a "More actions" kebab menu, so the row never wraps. */
  overflowActions?: ReactNode;
}

/** A 3-dot "more" icon for the overflow kebab. */
function MoreVerticalIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

/** The shared app header: an optional hub pill, the wordmark, actions and the theme toggle,
 *  with an optional nav row. Opaque by default (glass is opt-in), safe-area aware. A
 *  sticky header publishes its height as `--nish-header-h` for the rest of the layout. */
export function AppHeader({
  name,
  icon,
  brand,
  hub = false,
  actions,
  nav,
  themeToggle,
  sticky = true,
  innerClassName,
  homeHref,
  hideNameBelow,
  navLabel,
  compactPill = false,
  glass = false,
  overflowActions,
  className,
  ref: refProp,
  ...rest
}: AppHeaderProps) {
  const strings = useStrings(DISPLAY_STRINGS, SHELL_STRINGS);
  const ref = useRef<HTMLElement>(null);
  useHeightVar(ref, '--nish-header-h', sticky);
  const stuck = useStuck(ref) && sticky;
  // From sm the overflow actions sit in the header row, outside any menu: MenuItem renders
  // as a menu row (role=menuitem, tabIndex -1), so make them ordinary tabbable buttons.
  const inlineActionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    inlineActionsRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach((el) => {
      el.removeAttribute('role');
      el.tabIndex = el.getAttribute('aria-disabled') === 'true' ? -1 : 0;
    });
  });
  const toggle = themeToggle === false ? null : (themeToggle ?? <ThemeToggle />);
  const hideName = hideNameBelow === 'sm' && icon != null;
  const hubHref = hub ? safeUrl(hub.href) : null;
  const homeUrl = homeHref == null ? null : safeUrl(homeHref);
  if (homeHref != null && homeUrl == null) warnDev(`AppHeader: homeHref "${homeHref}" is not a safe URL and was dropped`);
  if (hub && hubHref == null) warnDev(`nish-ui: AppHeader hid the hub pill because its href is not safe (${hub.href.slice(0, 40)}).`);
  const mark = (
    <>
      {icon ? <span className="shrink-0 text-th-accent [&>svg]:size-5">{icon}</span> : null}
      <span className={cn('truncate', hideName && 'max-sm:sr-only')}>{name}</span>
    </>
  );
  const markClass = 'inline-flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-th-hi';
  const pillArrow = <span className="inline-block rtl:-scale-x-100">←</span>;
  return (
    <header
      {...rest}
      ref={mergeRefs(ref, refProp)}
      data-nish-bar={sticky ? '' : undefined}
      className={cn(
        'border-b border-th-line pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]',
        glass ? 'bg-th-bg supports-[backdrop-filter]:bg-th-bg/80 supports-[backdrop-filter]:backdrop-blur-xl' : 'bg-th-bg',
        sticky && 'sticky top-0 z-[calc(var(--nish-z-sticky,20)+10)] transition-shadow',
        stuck && 'shadow-[var(--nish-shadow-card)]',
        className,
      )}
    >
      <div
        className={cn(
          '@container/header flex min-h-14 flex-nowrap items-center gap-2 px-[var(--nish-page-gutter,1rem)] py-2 sm:gap-3',
          innerClassName,
        )}
      >
        {hub && hubHref != null ? (
          compactPill ? (
            <a className="nish-pill-link nish-pill-link--compact" href={hubHref} title={hub.title ?? strings.hubTitle}>
              {pillArrow} <span className="nish-pill-link-label">{hub.label}</span>
            </a>
          ) : (
            <a
              className="nish-pill-link @max-[400px]/header:min-w-11 @max-[400px]/header:justify-center @max-[400px]/header:px-1.5 @max-[400px]/header:[&_.nish-pill-link-label]:sr-only"
              href={hubHref}
              title={hub.title ?? strings.hubTitle}
            >
              {pillArrow} <span className="nish-pill-link-label">{hub.label}</span>
            </a>
          )
        ) : null}
        {brand != null ? (
          <div className="flex min-w-0 items-center">
            <span className="sr-only">{name}</span>
            {brand}
          </div>
        ) : homeUrl != null ? (
          <a href={homeUrl} className={cn(markClass, 'min-h-11 min-w-11 rounded-lg', hideName && 'max-sm:justify-center')}>
            {mark}
          </a>
        ) : (
          <span className={markClass}>{mark}</span>
        )}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          {actions}
          {overflowActions ? (
            <>
              <div ref={inlineActionsRef} className="hidden items-center gap-2 sm:flex [&>button]:w-auto">
                <InlineMenuItemContext.Provider value={true}>{overflowActions}</InlineMenuItemContext.Provider>
              </div>
              <div className="sm:hidden">
                <DropdownMenu
                  align="end"
                  trigger={
                    <IconButton label={strings.moreActions}>
                      <MoreVerticalIcon />
                    </IconButton>
                  }
                >
                  {overflowActions}
                </DropdownMenu>
              </div>
            </>
          ) : null}
          {toggle}
        </div>
      </div>
      {nav ? (
        <nav
          aria-label={navLabel ?? strings.sections}
          className={cn('nish-no-scrollbar -mb-px flex gap-6 overflow-x-auto px-[var(--nish-page-gutter,1rem)]', innerClassName)}
        >
          {nav}
        </nav>
      ) : null}
    </header>
  );
}

// =====================================================================================
// SectionHeader
// =====================================================================================

export interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'id'> {
  /** The wrapper row. */
  ref?: Ref<HTMLDivElement>;
  /** The section's title. */
  title: ReactNode;
  /** id for the heading, so the section can point aria-labelledby at it. */
  id?: string;
  /** Heading level. Default h2. */
  as?: 'h1' | 'h2' | 'h3';
  /** Quiet text on the right ("Updated 2 min ago", "3 of 12"). */
  meta?: ReactNode;
  /** A control on the right, after meta (a Button, a Segmented, a link). */
  action?: ReactNode;
}

/** The heading row of a section inside a page: the title, with optional meta text
 *  and an action on the right. Smaller than PageHeader, larger than CardHeader. */
export function SectionHeader({ title, id, as: H = 'h2', meta, action, className, ref, ...rest }: SectionHeaderProps) {
  return (
    <div ref={ref} className={cn('mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1', className)} {...rest}>
      <H id={id} className="min-w-0 text-lg font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]">
        {title}
      </H>
      {meta != null || action != null ? (
        <div className="flex items-center gap-3">
          {meta != null ? <span className="text-sm text-th-hi3">{meta}</span> : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}

// =====================================================================================
// KeyValueList
// =====================================================================================

export interface KeyValueItem {
  /** React key; unique in the list. */
  key: string;
  /** The left side: a name, often with a StatusDot or an icon. */
  label: ReactNode;
  /** The right side: a value, a Badge, a status. */
  value: ReactNode;
  /** Let the row wrap instead of staying on one line; it grows taller than 44px (32px
   *  dense) when the text wraps. Both the `ul` and `dl` forms.
   *  - `true` or `'anywhere'`: a long value with no spaces (a path, a URL, an id). The value
   *    cell may shrink and breaks anywhere (`break-all`); the label keeps its width.
   *  - `'words'`: prose (a phrase-long status or error). Both cells wrap at word breaks,
   *    labels first: the label keeps its one-line width up to 60% of the row
   *    (`shrink-0 max-w-[calc(60%-0.75rem)]`), so a short label never wraps one word per
   *    line, and the value takes the rest, at least 40% (`min-w-0 flex-1 text-end`). A
   *    word splits only when it alone is wider than its cell (`overflow-wrap: anywhere`).
   *  Without `wrap` the value keeps its full width, so keep it short. */
  wrap?: boolean | 'anywhere' | 'words';
}

export interface KeyValueListProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
  /** The `ul` or `dl` element. */
  ref?: Ref<HTMLElement>;
  items: KeyValueItem[];
  /** Rows 32px tall instead of 44px, for dense panels. */
  dense?: boolean;
  /** ul: a list of rows (default). dl: a description list with dt and dd, for label
   *  and value pairs that read as "name: value". */
  as?: 'ul' | 'dl';
}

/** Label and value rows with dividers: services and their status, runner details,
 *  vitals. Each row is at least 44px tall (32px dense); an item with `wrap` lets its row
 *  wrap and grow: `true`/`'anywhere'` for a path or URL, `'words'` for prose. */
export function KeyValueList({ items, dense = false, as = 'ul', className, ref, ...rest }: KeyValueListProps) {
  // A wrapping row gets vertical padding so wrapped lines clear the dividers; a single
  // line still fits inside the 44px (32px dense) minimum, so its height is unchanged.
  const row = (wrap: KeyValueItem['wrap']) =>
    cn(
      'flex min-w-0 items-center justify-between gap-3 border-b border-th-line last:border-b-0',
      dense ? 'min-h-8' : 'min-h-11',
      wrap && (dense ? 'py-1' : 'py-2'),
    );
  // Cell widths per mode. None: the value keeps its width. anywhere: the value shrinks and
  // breaks anywhere, the label keeps its width. words: both wrap at word breaks; the label
  // does not shrink below its one-line width until it reaches 60% of the row (so a flex
  // shrink never tips "Earnings Calendar" onto two lines), and the value fills the rest.
  const labelCls = (wrap: KeyValueItem['wrap']) =>
    wrap === 'words'
      ? 'min-w-0 shrink-0 max-w-[calc(60%_-_0.75rem)] [overflow-wrap:anywhere]'
      : wrap
        ? 'shrink-0'
        : 'min-w-0';
  const valueCls = (wrap: KeyValueItem['wrap']) =>
    wrap === 'words' ? 'min-w-0 flex-1 [overflow-wrap:anywhere]' : wrap ? 'min-w-0 break-all' : 'shrink-0';
  if (as === 'dl') {
    return (
      <dl
        ref={ref as Ref<HTMLDListElement>}
        className={cn('grid text-sm text-th-hi', className)}
        {...(rest as ComponentPropsWithoutRef<'dl'>)}
      >
        {items.map((it) => (
          <div key={it.key} className={row(it.wrap)}>
            <dt className={cn('text-th-hi2', labelCls(it.wrap))}>{it.label}</dt>
            <dd className={cn('m-0 text-end', valueCls(it.wrap))}>{it.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <ul ref={ref as Ref<HTMLUListElement>} className={cn('grid text-sm text-th-hi', className)} {...rest}>
      {items.map((it) => (
        <li key={it.key} className={row(it.wrap)}>
          <span className={cn('flex items-center gap-2', labelCls(it.wrap))}>{it.label}</span>
          <span className={cn('flex items-center justify-end gap-2 text-end', valueCls(it.wrap))}>{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

// =====================================================================================
// ChartLegend
// =====================================================================================

export interface ChartLegendItem {
  /** The series name. */
  label: string;
  /** The series color, the same role the chart draws it in. */
  tone: ChartLegendTone;
}

export interface ChartLegendProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
  /** The `ul` element. */
  ref?: Ref<HTMLUListElement>;
  items: ChartLegendItem[];
  /** line: a short 3px x 10px stroke, for line charts (default). dot: an 8px dot, for
   *  bars and points. */
  marker?: 'line' | 'dot';
  /** Accessible name of the list. Default: the provider's `legend` string. */
  label?: string;
}

/** The key for a multi-series chart (uPlot and canvas charts draw none of their own):
 *  each series' color mark and name. The marks are decorative; the names carry it. */
export function ChartLegend({ items, marker = 'line', label, className, ref, ...rest }: ChartLegendProps) {
  const strings = useStrings(DISPLAY_STRINGS, SHELL_STRINGS);
  return (
    <ul
      ref={ref}
      aria-label={label ?? strings.legend}
      className={cn('flex flex-wrap gap-x-4 gap-y-1 text-xs text-th-hi2', className)}
      {...rest}
    >
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <i
            aria-hidden="true"
            className={cn(
              'inline-block shrink-0',
              marker === 'dot' ? 'size-2 rounded-full' : 'h-0.75 w-2.5 rounded-sm',
              LEGEND_FILL[it.tone],
              'forced-colors:forced-color-adjust-none forced-colors:bg-[CanvasText]',
            )}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
