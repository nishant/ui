// Pure helpers, tone maps and class recipes for display.tsx, nav.tsx, layout.tsx and
// app-shell.tsx. No directive and no React runtime import, so server code can import this
// file; display.tsx ('use client') re-exports what it documented.

// --- dev warnings -------------------------------------------------------------------

const warned = /* @__PURE__ */ new Set<string>();

/** @internal Dev-only console warning, once per message. Bundlers replace
 *  `process.env.NODE_ENV`; where nothing does, the ReferenceError is caught and nothing is
 *  printed. */
export function warnDev(message: string): void {
  if (warned.has(message)) return;
  try {
    if (process.env.NODE_ENV !== 'production') {
      warned.add(message);
      console.warn(message);
    }
  } catch {
    // No process or no console.
  }
}

// --- shared tone maps -----------------------------------------------------------------

/** Status tones shared by the display components. */
export type StatusTone = 'ok' | 'warn' | 'loss' | 'info' | 'accent' | 'neutral';

/** @internal Solid fills for marks (dots, bars, meters). */
export const FILL: Record<StatusTone, string> = {
  ok: 'bg-th-ok-fill',
  warn: 'bg-th-warn-fill',
  loss: 'bg-th-loss-fill',
  info: 'bg-th-info-fill',
  accent: 'bg-th-accent',
  neutral: 'bg-th-ghost',
};

export type CalloutTone = 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'loss';

// box: translucent tint that sits in the flow. bar: the same tint flattened onto the page
// background (-soft-solid), so content scrolling under a sticky bar never shows through.
/** @internal */
export const CALLOUT_TONE: Record<CalloutTone, { box: string; bar: string; icon: string }> = {
  neutral: { box: 'border-th-line bg-th-elevated', bar: 'border-th-line bg-th-elevated', icon: 'text-th-hi3' },
  accent: { box: 'border-th-accent/30 bg-th-accent-soft', bar: 'border-th-accent/30 bg-th-accent-soft-solid', icon: 'text-th-accent' },
  info: { box: 'border-th-info/30 bg-th-info-soft', bar: 'border-th-info/30 bg-th-info-soft-solid', icon: 'text-th-info' },
  ok: { box: 'border-th-ok/30 bg-th-ok-soft', bar: 'border-th-ok/30 bg-th-ok-soft-solid', icon: 'text-th-ok' },
  warn: { box: 'border-th-warn/30 bg-th-warn-soft', bar: 'border-th-warn/30 bg-th-warn-soft-solid', icon: 'text-th-warn' },
  loss: { box: 'border-th-loss/30 bg-th-loss-soft', bar: 'border-th-loss/30 bg-th-loss-soft-solid', icon: 'text-th-loss' },
};

/** @internal */
export const CALLOUT_CLAMP = { 1: 'line-clamp-1', 2: 'line-clamp-2', 3: 'line-clamp-3' } as const;

/** @internal */
export const DOT_SIZE = { xs: 'size-1.5', sm: 'size-2', md: 'size-2.5', lg: 'size-3.5' } as const;

/** @internal */
export const HALO: Record<StatusTone, string> = {
  ok: 'ring-4 ring-th-ok-fill/25',
  warn: 'ring-4 ring-th-warn-fill/25',
  loss: 'ring-4 ring-th-loss-fill/25',
  info: 'ring-4 ring-th-info-fill/25',
  accent: 'ring-4 ring-th-accent/25',
  neutral: 'ring-4 ring-th-ghost/25',
};

/** ok for a positive number, loss for a negative one, neutral for zero or nothing.
 *  Replaces `n >= 0 ? gain : loss` ternaries. */
export function signTone(n: number | null | undefined): 'ok' | 'loss' | 'neutral' {
  if (n == null || Number.isNaN(n) || n === 0) return 'neutral';
  return n > 0 ? 'ok' : 'loss';
}

/** @internal */
export const STAT_VALUE_SIZE = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' } as const;
/** @internal */
export const STAT_SKELETON = { sm: 'h-6', md: 'h-7', lg: 'h-8' } as const;
/** @internal */
export const STAT_TONE = { ok: 'text-th-ok', loss: 'text-th-loss', warn: 'text-th-warn', neutral: 'text-th-hi' } as const;

/** @internal */
export const GRID_BASE = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' } as const;
/** @internal */
export const GRID_MD = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
} as const;

/** ok, warn or loss for a value against two thresholds. When loss is above warn, higher
 *  is worse (disk use: { warn: 75, loss: 90 }). When loss is below warn, lower is worse
 *  (battery: { warn: 30, loss: 10 }). */
export function toneFor(value: number, t: { warn: number; loss: number }): 'ok' | 'warn' | 'loss' {
  if (t.loss >= t.warn) return value >= t.loss ? 'loss' : value >= t.warn ? 'warn' : 'ok';
  return value <= t.loss ? 'loss' : value <= t.warn ? 'warn' : 'ok';
}

export type ChartTone = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type MeterTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | 'neutral' | ChartTone;

/** @internal */
export const METER_FILL: Record<MeterTone, string> = {
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

/** @internal */
export const METER_THICK = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' } as const;
/** @internal */
export const METER_THICK_V = { xs: 'w-1', sm: 'w-1.5', md: 'w-2.5' } as const;

export type SparklineTone = ChartTone | 'accent' | 'ok' | 'warn' | 'loss' | 'info';

/** @internal */
export const SPARK_TONE: Record<SparklineTone, string> = {
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

export type ChartLegendTone = ChartTone | 'accent' | 'ok' | 'warn' | 'loss' | 'info';

// Full literal class names, so Tailwind's scanner finds every one. Marks use -fill.
/** @internal */
export const LEGEND_FILL: Record<ChartLegendTone, string> = {
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

/** @internal In forced-colors mode a background-only mark vanishes; this keeps it on
 *  screen with system colors. Shared by StatusDot, Meter and the nav pills. */
export const FORCED_MARK =
  'forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]';
