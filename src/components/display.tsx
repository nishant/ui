import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '../cn';
import { Skeleton } from './feedback';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XIcon } from './icons';
import { Tooltip } from './overlay';
import { Button, Card, IconButton, type ButtonProps } from './primitives';
import { ThemeToggle } from './theme-toggle';

// Read-only display pieces: notices, status marks, numbers, meters, small charts,
// headers. Every color is a role; fills (*-fill) for marks, plain roles for text.

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

// --- shared tone maps -----------------------------------------------------------------

/** Status tones shared by the display components. */
export type StatusTone = 'ok' | 'warn' | 'loss' | 'info' | 'accent' | 'neutral';

/** Solid fills for marks (dots, bars, meters). */
const FILL: Record<StatusTone, string> = {
  ok: 'bg-th-ok-fill',
  warn: 'bg-th-warn-fill',
  loss: 'bg-th-loss-fill',
  info: 'bg-th-info-fill',
  accent: 'bg-th-accent',
  neutral: 'bg-th-ghost',
};

// =====================================================================================
// Callout
// =====================================================================================

export type CalloutTone = 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'loss';

const CALLOUT_TONE: Record<CalloutTone, { box: string; icon: string }> = {
  neutral: { box: 'border-th-line bg-th-elevated', icon: 'text-th-hi3' },
  accent: { box: 'border-th-accent/30 bg-th-accent-soft', icon: 'text-th-accent' },
  info: { box: 'border-th-info/30 bg-th-info-soft', icon: 'text-th-info' },
  ok: { box: 'border-th-ok/30 bg-th-ok-soft', icon: 'text-th-ok' },
  warn: { box: 'border-th-warn/30 bg-th-warn-soft', icon: 'text-th-warn' },
  loss: { box: 'border-th-loss/30 bg-th-loss-soft', icon: 'text-th-loss' },
};

function defaultCalloutIcon(tone: CalloutTone, size: number): ReactNode {
  if (tone === 'ok') return <CheckCircleIcon size={size} />;
  if (tone === 'warn' || tone === 'loss') return <AlertTriangleIcon size={size} />;
  return <InfoIcon size={size} />;
}

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
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
  /** box: a rounded tinted box in the flow (default). bar: full width with square
   *  corners and no side borders, for a sticky page-level alert. */
  variant?: 'box' | 'bar';
  /** Tighter padding and xs text, for widgets and table cells. */
  compact?: boolean;
  /** Announce it when it appears: role="alert" for loss, role="status" otherwise.
   *  Leave it off for notices that are part of the page from the start. */
  live?: boolean;
}

/** An inline notice: a tinted box with an icon, an optional title, text and an action. */
export function Callout({
  tone = 'info',
  icon,
  title,
  children,
  action,
  onDismiss,
  variant = 'box',
  compact = false,
  live = false,
  className,
  ...rest
}: CalloutProps) {
  const t = CALLOUT_TONE[tone];
  const shown = icon === false ? null : (icon ?? defaultCalloutIcon(tone, compact ? 14 : 16));
  return (
    <div
      role={live ? (tone === 'loss' ? 'alert' : 'status') : undefined}
      className={cn(
        'flex items-start border',
        compact ? 'gap-2 px-3 py-2 text-xs' : 'gap-3 px-4 py-3 text-sm',
        variant === 'bar' ? 'w-full rounded-none border-x-0' : 'rounded-xl',
        t.box,
        className,
      )}
      {...rest}
    >
      {shown ? <span className={cn('shrink-0', compact ? 'mt-px' : 'mt-0.5', t.icon)}>{shown}</span> : null}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-60">
          {title ? <p className="font-medium leading-snug text-th-hi">{title}</p> : null}
          {children ? <div className={cn('leading-snug text-th-hi2', title ? 'mt-0.5' : null)}>{children}</div> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <IconButton label="Dismiss" size="xs" onClick={onDismiss} className="-my-0.5 -mr-1">
          <XIcon size={14} />
        </IconButton>
      ) : null}
    </div>
  );
}

// =====================================================================================
// StatusDot
// =====================================================================================

const DOT_SIZE = { xs: 'size-1.5', sm: 'size-2', md: 'size-2.5', lg: 'size-3.5' } as const;

const HALO: Record<StatusTone, string> = {
  ok: 'ring-4 ring-th-ok-fill/25',
  warn: 'ring-4 ring-th-warn-fill/25',
  loss: 'ring-4 ring-th-loss-fill/25',
  info: 'ring-4 ring-th-info-fill/25',
  accent: 'ring-4 ring-th-accent/25',
  neutral: 'ring-4 ring-th-ghost/25',
};

export interface StatusDotProps {
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
  className?: string;
}

/** A small round status mark. Color is never the only signal: give it a label or
 *  put text beside it. */
export function StatusDot({ tone, size = 'sm', pulse = false, halo = false, label, className }: StatusDotProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'inline-block shrink-0 rounded-full',
        DOT_SIZE[size],
        FILL[tone],
        halo && HALO[tone],
        pulse && 'motion-safe:animate-pulse',
        className,
      )}
    />
  );
}

// =====================================================================================
// Stat, StatGrid, signTone
// =====================================================================================

/** ok for a positive number, loss for a negative one, neutral for zero or nothing.
 *  Replaces `n >= 0 ? gain : loss` ternaries. */
export function signTone(n: number | null | undefined): 'ok' | 'loss' | 'neutral' {
  if (n == null || Number.isNaN(n) || n === 0) return 'neutral';
  return n > 0 ? 'ok' : 'loss';
}

const STAT_VALUE_SIZE = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' } as const;
const STAT_SKELETON = { sm: 'h-6', md: 'h-7', lg: 'h-8' } as const;
const STAT_TONE = { ok: 'text-th-ok', loss: 'text-th-loss', warn: 'text-th-warn', neutral: 'text-th-hi' } as const;

// Set by StatGrid so each Stat renders a <div> of <dt>/<dd> inside its <dl>.
const InStatGrid = createContext(false);

export interface StatProps {
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
  className?: string;
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
  const Box = inGrid ? 'div' : 'dl';
  if (variant === 'card') {
    return (
      <Card padding="sm" className={cn('min-w-0', className)}>
        {inGrid ? body : <dl>{body}</dl>}
      </Card>
    );
  }
  return <Box className={cn('min-w-0', variant === 'inset' && 'rounded-lg bg-th-elevated p-3', className)}>{body}</Box>;
}

const GRID_BASE = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' } as const;
const GRID_MD = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
} as const;

export interface StatGridProps {
  /** Columns on phones (base, default 2) and from 768px (md, default 4). */
  cols?: { base?: keyof typeof GRID_BASE; md?: keyof typeof GRID_MD };
  /** Stat elements. */
  children: ReactNode;
  className?: string;
}

/** A responsive grid of Stats, rendered as one <dl>. */
export function StatGrid({ cols, children, className }: StatGridProps) {
  return (
    <dl className={cn('grid gap-3', GRID_BASE[cols?.base ?? 2], GRID_MD[cols?.md ?? 4], className)}>
      <InStatGrid.Provider value={true}>{children}</InStatGrid.Provider>
    </dl>
  );
}

// =====================================================================================
// Meter, toneFor
// =====================================================================================

/** ok, warn or loss for a value against two thresholds. When loss is above warn, higher
 *  is worse (disk use: { warn: 75, loss: 90 }). When loss is below warn, lower is worse
 *  (battery: { warn: 30, loss: 10 }). */
export function toneFor(value: number, t: { warn: number; loss: number }): 'ok' | 'warn' | 'loss' {
  if (t.loss >= t.warn) return value >= t.loss ? 'loss' : value >= t.warn ? 'warn' : 'ok';
  return value <= t.loss ? 'loss' : value <= t.warn ? 'warn' : 'ok';
}

type ChartTone = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type MeterTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | 'neutral' | ChartTone;

const METER_FILL: Record<MeterTone, string> = {
  accent: 'bg-th-accent',
  ok: 'bg-th-ok-fill',
  warn: 'bg-th-warn-fill',
  loss: 'bg-th-loss-fill',
  info: 'bg-th-info-fill',
  neutral: 'bg-th-hi3',
  'chart-1': 'bg-th-chart-1',
  'chart-2': 'bg-th-chart-2',
  'chart-3': 'bg-th-chart-3',
  'chart-4': 'bg-th-chart-4',
  'chart-5': 'bg-th-chart-5',
  'chart-6': 'bg-th-chart-6',
  'chart-7': 'bg-th-chart-7',
  'chart-8': 'bg-th-chart-8',
};

const METER_THICK = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' } as const;
const METER_THICK_V = { xs: 'w-1', sm: 'w-1.5', md: 'w-2.5' } as const;

export interface MeterProps {
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
  className?: string;
}

/** A thin bar showing how full something is: disk, quota, progress, a score. */
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
}: MeterProps) {
  const span = max - min || 1;
  const clamped = Math.min(Math.max(value, min), max);
  const pct = ((clamped - min) / span) * 100;
  const resolved: MeterTone = tone ?? (thresholds ? toneFor(clamped, thresholds) : 'accent');
  const vertical = orientation === 'vertical';
  const bar = (
    <div
      role={kind === 'progress' ? 'progressbar' : 'meter'}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={`${Math.round(pct)}%`}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full',
        track === 'overlay' ? 'bg-th-overlay' : 'bg-th-elevated',
        vertical ? cn('h-full', METER_THICK_V[size]) : cn('w-full', METER_THICK[size]),
        !showValue && className,
      )}
    >
      <div
        className={cn(
          'absolute rounded-full duration-300 ease-out motion-reduce:transition-none',
          vertical ? 'inset-x-0 bottom-0 transition-[height]' : 'inset-y-0 left-0 transition-[width]',
          METER_FILL[resolved],
        )}
        style={vertical ? { height: `${pct}%` } : { width: `${pct}%` }}
      />
    </div>
  );
  if (!showValue || vertical) return bar;
  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      {bar}
      <span aria-hidden="true" className="w-9 shrink-0 text-right text-xs tabular-nums text-th-hi3">
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// =====================================================================================
// Sparkline
// =====================================================================================

export type SparklineTone = ChartTone | 'accent' | 'ok' | 'warn' | 'loss' | 'info';

const SPARK_TONE: Record<SparklineTone, string> = {
  accent: 'text-th-accent',
  ok: 'text-th-ok-fill',
  warn: 'text-th-warn-fill',
  loss: 'text-th-loss-fill',
  info: 'text-th-info-fill',
  'chart-1': 'text-th-chart-1',
  'chart-2': 'text-th-chart-2',
  'chart-3': 'text-th-chart-3',
  'chart-4': 'text-th-chart-4',
  'chart-5': 'text-th-chart-5',
  'chart-6': 'text-th-chart-6',
  'chart-7': 'text-th-chart-7',
  'chart-8': 'text-th-chart-8',
};

export interface SparklineProps {
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
  className?: string;
}

/** A tiny line chart with no axes, for a trend beside a number. Plain SVG, no chart
 *  library. Gaps at nulls; a flat dashed line when there is no data. */
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
}: SparklineProps) {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  const empty = nums.length === 0;
  const lo = min ?? (empty ? 0 : Math.min(...nums));
  const hi = max ?? (empty ? 1 : Math.max(...nums));
  const pad = 2; // keep the stroke inside the box at the extremes
  const x = (i: number) => (values.length <= 1 ? width / 2 : (i / (values.length - 1)) * width);
  const y = (v: number) => (hi === lo ? height / 2 : pad + (1 - (v - lo) / (hi - lo)) * (height - 2 * pad));

  // One path per unbroken run; a single point becomes a zero-length round-capped dot.
  const runs: { x: number; y: number }[][] = [];
  let run: { x: number; y: number }[] = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push({ x: x(i), y: y(v) });
  });
  if (run.length) runs.push(run);

  const line = (r: { x: number; y: number }[]) =>
    r.length === 1 ? `M${r[0].x},${r[0].y}h0` : r.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('');
  const area = (r: { x: number; y: number }[]) =>
    r.length < 2 ? '' : `${line(r)}L${r[r.length - 1].x},${height}L${r[0].x},${height}Z`;

  return (
    <svg
      role="img"
      aria-label={empty ? `${label}: no data` : label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('block shrink-0 overflow-visible', empty ? 'text-th-line-strong' : SPARK_TONE[tone], className)}
    >
      {empty ? (
        <path
          d={`M0,${height / 2}H${width}`}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <>
          {fill ? runs.map((r, i) => <path key={`a${i}`} d={area(r)} fill="currentColor" fillOpacity={0.15} />) : null}
          {runs.map((r, i) => (
            <path
              key={i}
              d={line(r)}
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

export interface DisclosureProps {
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
  className?: string;
}

/** Show-more on native <details>/<summary>: keyboard and find-in-page work for free,
 *  with a chevron that turns when open. */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  variant = 'plain',
  className,
}: DisclosureProps) {
  const card = variant === 'card';
  return (
    <details
      // Uncontrolled, React writes defaultOpen once and the element owns the state after;
      // controlled, React writes it whenever `open` changes.
      open={open ?? defaultOpen}
      onToggle={(e) => {
        const now = e.currentTarget.open;
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
          className="shrink-0 text-th-hi3 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none"
        />
        <span className="min-w-0 flex-1">{summary}</span>
      </summary>
      <div className={cn('text-sm text-th-hi2', card ? 'border-t border-th-line px-4 py-3' : 'pb-2 pl-6 pt-1')}>
        {children}
      </div>
    </details>
  );
}

// =====================================================================================
// Kbd
// =====================================================================================

/** A keyboard key or shortcut, e.g. <Kbd>⌘K</Kbd>. */
export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
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

/** Copies text to the clipboard. Uses the Clipboard API, falling back to a hidden
 *  textarea for insecure origins and old browsers. Resolves true when it worked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // permission denied or not focused: try the fallback
  }
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  ta.style.opacity = '0';
  const active = document.activeElement as HTMLElement | null;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  active?.focus?.();
  return ok;
}

const COPIED_MS = 1_500;

export interface CopyButtonProps {
  /** What lands on the clipboard. */
  text: string;
  /** Button text, and the accessible name when iconOnly. Default "Copy". */
  label?: string;
  /** Shown for 1.5s after a copy and announced politely. Default "Copied". */
  copiedLabel?: string;
  /** A square IconButton instead of a labelled Button. */
  iconOnly?: boolean;
  /** Button size (or IconButton size when iconOnly). Default sm. */
  size?: 'sm' | 'md';
  /** Button variant when not iconOnly. Default secondary. */
  variant?: ButtonProps['variant'];
  /** Called after each copy attempt with whether it worked. */
  onCopy?: (ok: boolean) => void;
  className?: string;
}

/** Copies text with one click, shows "Copied" for 1.5s and tells screen readers. */
export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  iconOnly = false,
  size = 'sm',
  variant = 'secondary',
  onCopy,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const onClick = async () => {
    const ok = await copyText(text);
    onCopy?.(ok);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  const iconSize = size === 'sm' ? 14 : 16;
  const icon = copied ? <CheckIcon size={iconSize} className="text-th-ok" /> : <CopyIcon size={iconSize} />;
  return (
    <>
      {iconOnly ? (
        <IconButton label={copied ? copiedLabel : label} size={size} onClick={onClick} className={className}>
          {icon}
        </IconButton>
      ) : (
        <Button variant={variant} size={size} icon={icon} onClick={onClick} className={className}>
          {copied ? copiedLabel : label}
        </Button>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    </>
  );
}

// =====================================================================================
// PageHeader
// =====================================================================================

export interface PageHeaderProps {
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
  /** Sticks to the top with the glass background while the page scrolls. */
  sticky?: boolean;
  className?: string;
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
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2',
        sticky && 'sticky top-0 z-(--nish-z-sticky) -mx-4 border-b border-th-line bg-th-bg/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6',
        className,
      )}
    >
      {back ? <div className="text-sm">{back}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          {eyebrow ? <p className="mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3">{eyebrow}</p> : null}
          <H className="text-2xl font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]">{title}</H>
          {description ? <p className="mt-1 text-sm text-th-hi2">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

// =====================================================================================
// AppHeader
// =====================================================================================

export interface AppHeaderProps {
  /** The app's name, shown as the wordmark. */
  name: ReactNode;
  /** An icon before the name, drawn in the accent color. */
  icon?: ReactNode;
  /** Where the "← nish.software" pill goes. Default https://nish.software. */
  hubHref?: string;
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
  /** Names the nav row's <nav> landmark ("Trackers"), so several navs on a page can be
   *  told apart. */
  navLabel?: string;
  /** Under 480px the hub pill shrinks to its arrow (.nish-pill-link--compact), for
   *  headers with a long name. */
  compactPill?: boolean;
  className?: string;
}

/** The shared app header: the hub pill, the wordmark, actions and the theme toggle,
 *  with an optional nav row. Glass background, safe-area aware. */
export function AppHeader({
  name,
  icon,
  hubHref = 'https://nish.software',
  actions,
  nav,
  themeToggle,
  sticky = true,
  innerClassName,
  homeHref,
  hideNameBelow,
  navLabel,
  compactPill = false,
  className,
}: AppHeaderProps) {
  const toggle = themeToggle === false ? null : (themeToggle ?? <ThemeToggle />);
  const hideName = hideNameBelow === 'sm' && icon != null;
  const mark = (
    <>
      {icon ? <span className="shrink-0 text-th-accent [&>svg]:size-5">{icon}</span> : null}
      <span className={cn('truncate', hideName && 'max-sm:sr-only')}>{name}</span>
    </>
  );
  const markClass = 'inline-flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-th-hi';
  return (
    <header
      className={cn(
        'border-b border-th-line bg-th-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur',
        sticky && 'sticky top-0 z-(--nish-z-sticky)',
        className,
      )}
    >
      <div className={cn('flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6', innerClassName)}>
        {compactPill ? (
          <a className="nish-pill-link nish-pill-link--compact" href={hubHref} title="Back to nish.software">
            ← <span className="nish-pill-link-label">nish.software</span>
          </a>
        ) : (
          <a className="nish-pill-link" href={hubHref} title="Back to nish.software">
            ← nish.software
          </a>
        )}
        {homeHref != null ? (
          <a href={homeHref} className={cn(markClass, 'min-h-11 min-w-11 rounded-lg', hideName && 'max-sm:justify-center')}>
            {mark}
          </a>
        ) : (
          <span className={markClass}>{mark}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {actions}
          {toggle}
        </div>
      </div>
      {nav ? (
        <nav aria-label={navLabel} className={cn('scrollbar-none -mb-px flex gap-1 overflow-x-auto px-4 sm:px-6', innerClassName)}>
          {nav}
        </nav>
      ) : null}
    </header>
  );
}

// =====================================================================================
// SectionHeader
// =====================================================================================

export interface SectionHeaderProps {
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
  className?: string;
}

/** The heading row of a section inside a page: the title, with optional meta text
 *  and an action on the right. Smaller than PageHeader, larger than CardHeader. */
export function SectionHeader({ title, id, as: H = 'h2', meta, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1', className)}>
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
  /** Let a long value wrap instead of setting the row's width: a path, a URL, an id with no
   *  spaces. The value cell may shrink and breaks anywhere (`break-all`), the label keeps its
   *  width, and the row grows taller than 44px (32px dense) when the text wraps. */
  wrap?: boolean;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  /** Rows 32px tall instead of 44px, for dense panels. */
  dense?: boolean;
  /** ul: a list of rows (default). dl: a description list with dt and dd, for label
   *  and value pairs that read as "name: value". */
  as?: 'ul' | 'dl';
  className?: string;
}

/** Label and value rows with dividers: services and their status, runner details,
 *  vitals. Each row is at least 44px tall (32px dense); an item with `wrap` lets a long
 *  value wrap and grows its row. */
export function KeyValueList({ items, dense = false, as = 'ul', className }: KeyValueListProps) {
  // A wrapping row gets vertical padding so wrapped lines clear the dividers; a single
  // line still fits inside the 44px (32px dense) minimum, so its height is unchanged.
  const row = (wrap?: boolean) =>
    cn(
      'flex min-w-0 items-center justify-between gap-3 border-b border-th-line last:border-b-0',
      dense ? 'min-h-8' : 'min-h-11',
      wrap && (dense ? 'py-1' : 'py-2'),
    );
  if (as === 'dl') {
    return (
      <dl className={cn('grid text-sm text-th-hi', className)}>
        {items.map((it) => (
          <div key={it.key} className={row(it.wrap)}>
            <dt className={cn('text-th-hi2', it.wrap ? 'shrink-0' : 'min-w-0')}>{it.label}</dt>
            <dd className={cn('m-0 text-right', it.wrap ? 'min-w-0 break-all' : 'shrink-0')}>{it.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <ul className={cn('grid text-sm text-th-hi', className)}>
      {items.map((it) => (
        <li key={it.key} className={row(it.wrap)}>
          <span className={cn('flex items-center gap-2', it.wrap ? 'shrink-0' : 'min-w-0')}>{it.label}</span>
          <span className={cn('flex items-center gap-2 text-right', it.wrap ? 'min-w-0 break-all' : 'shrink-0')}>
            {it.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

// =====================================================================================
// ChartLegend
// =====================================================================================

export type ChartLegendTone = ChartTone | 'accent' | 'ok' | 'warn' | 'loss' | 'info';

// Full literal class names, so Tailwind's scanner finds every one. Marks use -fill.
const LEGEND_FILL: Record<ChartLegendTone, string> = {
  'chart-1': 'bg-th-chart-1',
  'chart-2': 'bg-th-chart-2',
  'chart-3': 'bg-th-chart-3',
  'chart-4': 'bg-th-chart-4',
  'chart-5': 'bg-th-chart-5',
  'chart-6': 'bg-th-chart-6',
  'chart-7': 'bg-th-chart-7',
  'chart-8': 'bg-th-chart-8',
  accent: 'bg-th-accent',
  ok: 'bg-th-ok-fill',
  warn: 'bg-th-warn-fill',
  loss: 'bg-th-loss-fill',
  info: 'bg-th-info-fill',
};

export interface ChartLegendItem {
  /** The series name. */
  label: string;
  /** The series color, the same role the chart draws it in. */
  tone: ChartLegendTone;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  /** line: a short 3px x 10px stroke, for line charts (default). dot: an 8px dot, for
   *  bars and points. */
  marker?: 'line' | 'dot';
  /** Accessible name of the list. Default "Legend". */
  label?: string;
  className?: string;
}

/** The key for a multi-series chart (uPlot and canvas charts draw none of their own):
 *  each series' color mark and name. The marks are decorative; the names carry it. */
export function ChartLegend({ items, marker = 'line', label = 'Legend', className }: ChartLegendProps) {
  return (
    <ul aria-label={label} className={cn('flex flex-wrap gap-x-4 gap-y-1 text-xs text-th-hi2', className)}>
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <i
            aria-hidden="true"
            className={cn('inline-block shrink-0', marker === 'dot' ? 'size-2 rounded-full' : 'h-0.75 w-2.5 rounded-sm', LEGEND_FILL[it.tone])}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
