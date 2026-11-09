// Pure helpers of the data components (table recipes, sorting, favicon resolving, chart
// decimation). No directive and no React runtime import, so a server component can use them;
// the 'use client' modules data.tsx, table.tsx and charts.tsx re-export what they documented.
import type { Ref, RefCallback } from 'react';
import { shared } from '../runtime';

// =====================================================================================
// Table recipes
// =====================================================================================

type Align = 'left' | 'center' | 'right';
type RowTone = 'ok' | 'warn' | 'loss';

/** left and right are the start and end edge, so they mirror in right-to-left layouts. */
const ALIGN: Record<Align, string> = { left: 'text-start', center: 'text-center', right: 'text-end' };

// An inset 3px edge on the row's first cell (a box-shadow on <tr> is unreliable). It mirrors in
// RTL, and in forced colors (which drop shadows) becomes a real border. Classes are written out
// in full so Tailwind's scanner finds them.
const ROW_TONE: Record<RowTone, string> = {
  ok:
    '[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] ' +
    'rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_var(--nish-ok-fill)] rtl:[&>th:first-child]:shadow-[inset_-3px_0_0_var(--nish-ok-fill)] ' +
    'forced-colors:[&>td:first-child]:border-s-[3px] forced-colors:[&>td:first-child]:border-s-[color:Highlight]',
  warn:
    '[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] ' +
    'rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_var(--nish-warn-fill)] rtl:[&>th:first-child]:shadow-[inset_-3px_0_0_var(--nish-warn-fill)] ' +
    'forced-colors:[&>td:first-child]:border-s-[3px] forced-colors:[&>td:first-child]:border-s-[color:Highlight]',
  loss:
    '[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] ' +
    'rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_var(--nish-loss-fill)] rtl:[&>th:first-child]:shadow-[inset_-3px_0_0_var(--nish-loss-fill)] ' +
    'forced-colors:[&>td:first-child]:border-s-[3px] forced-colors:[&>td:first-child]:border-s-[color:Highlight]',
};

const WRAP = 'relative overflow-auto rounded-xl border border-th-line bg-th-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent';
const STICKY =
  '[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[var(--nish-z-sticky,1)] [&_thead_th]:bg-th-surface';
const TABLE = 'w-full border-collapse text-sm tabular-nums text-th-hi2';
const ZEBRA = '[&_tbody>tr:nth-child(even)]:bg-th-elevated/50';
const TH = 'whitespace-nowrap border-b border-th-line px-3 text-start align-middle text-xs font-medium uppercase tracking-wider text-th-hi3';
const TD = 'px-3 align-middle';
const PAD = { normal: 'py-2.5', dense: 'py-1.5' } as const;
const TR = 'border-b border-th-line last:border-b-0';
const TR_INTERACTIVE = 'cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated';
const NUMERIC = 'whitespace-nowrap text-end tabular-nums';
// A pinned first column: opaque (bg-inherit takes the row's color, rows get a solid base),
// above the other cells, with a soft edge that shows once the table is scrolled sideways.
const STICKY_COL =
  '[&_thead_tr]:bg-th-surface [&_tbody_tr]:bg-th-surface [&_thead_tr>:first-child]:z-[calc(var(--nish-z-sticky,1)+10)] [&_tr>:first-child]:sticky [&_tr>:first-child]:start-0 [&_tr>:first-child]:z-[calc(var(--nish-z-sticky,1)+9)] [&_tr>:first-child]:bg-inherit ' +
  '[&_tr>:first-child]:after:pointer-events-none [&_tr>:first-child]:after:absolute [&_tr>:first-child]:after:inset-y-0 [&_tr>:first-child]:after:start-full [&_tr>:first-child]:after:w-2.5 ' +
  '[&_tr>:first-child]:after:bg-gradient-to-r rtl:[&_tr>:first-child]:after:bg-gradient-to-l [&_tr>:first-child]:after:from-[color-mix(in_srgb,var(--nish-hi)_14%,transparent)] [&_tr>:first-child]:after:to-transparent ' +
  '[&_tr>:first-child]:after:opacity-0 [&_tr>:first-child]:after:transition-opacity ltr:[&[data-at-start=false]_tr>:first-child]:after:opacity-100 rtl:[&[data-at-end=false]_tr>:first-child]:after:opacity-100';

/** The table recipes as strings, for renderers that take classes (TanStack Table cells,
 *  static markup). The components in table.tsx use exactly these. */
export const tableClass = {
  /** The scroll box around the table. */
  wrap: WRAP,
  /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
  sticky: STICKY,
  /** The <table>. */
  table: TABLE,
  /** Add to table for striped rows. */
  zebra: ZEBRA,
  /** A header cell (add padY.normal or padY.dense). */
  th: TH,
  /** A body cell (add padY.normal or padY.dense). */
  td: TD,
  /** Vertical cell padding: normal or dense. */
  padY: PAD,
  /** A body row. */
  tr: TR,
  /** Add to tr for a clickable row. */
  trInteractive: TR_INTERACTIVE,
  /** Add to th or td for a right-aligned number column. */
  numeric: NUMERIC,
  /** Add to tr for a status edge. */
  tone: ROW_TONE,
} as const;

/** @internal Alignment and pinned-column recipes the table components share. */
export const tableInternals = { ALIGN, STICKY_COL, WRAP, STICKY, TABLE, ZEBRA, TH, TD, PAD, TR, TR_INTERACTIVE } as const;

// =====================================================================================
// Refs
// =====================================================================================

/** One callback ref that sets several refs (a ref prop plus the component's own). */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    const cleanups: (() => void)[] = [];
    for (const ref of refs) {
      if (typeof ref === 'function') {
        const out = ref(node);
        if (typeof out === 'function') cleanups.push(out);
      } else if (ref) (ref as { current: T | null }).current = node;
    }
    if (cleanups.length) return () => cleanups.forEach((fn) => fn());
  };
}

// =====================================================================================
// Sorting
// =====================================================================================

/** Numeric-aware, case- and accent-insensitive string order. Built once. */
const COLLATOR = /* @__PURE__ */ new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export type SortValue = string | number | null;

/** Orders two sort values: numbers by value, strings by the collator, null after everything. */
export function compareValues(a: SortValue, b: SortValue): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return COLLATOR.compare(String(a), String(b));
}

/** A sorted copy of `rows`. `get` runs once per row (not once per comparison). Nulls stay
 *  last in both directions, and equal values keep their original order. */
export function sortRows<T>(rows: readonly T[], get: (row: T) => SortValue, dir: 'asc' | 'desc'): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  const keyed = rows.map((row, index) => ({ row, index, key: get(row) }));
  keyed.sort((x, y) => {
    const c = x.key === null || y.key === null ? compareValues(x.key, y.key) : sign * compareValues(x.key, y.key);
    return c || x.index - y.index;
  });
  return keyed.map((k) => k.row);
}

// =====================================================================================
// Favicon
// =====================================================================================

/** Turns a host and a CSS size into an icon URL, or null for "no image" (letter avatar). */
export type FaviconResolver = (host: string, size: number) => string | null;

/** Google's favicon service: one request per host to google.com that tells Google which
 *  sites are shown. Opt in with `configureFavicons({ resolve: googleFavicon })`. */
export const googleFavicon: FaviconResolver = (host, size) =>
  `https://www.google.com/s2/favicons?sz=${size * 2 > 32 ? 64 : 32}&domain=${encodeURIComponent(host)}`;

const favicons = () => shared('favicons', () => ({ resolve: (() => null) as FaviconResolver }));

/** Sets the resolver every Favicon (and LinkCard icon) uses when it has no `src` or
 *  `resolve` of its own. Call it once at startup. The default returns null: no request,
 *  a letter avatar. */
export function configureFavicons(options: { resolve?: FaviconResolver | null }): void {
  favicons().resolve = options.resolve ?? (() => null);
}

/** The configured resolver. */
export function getFaviconResolver(): FaviconResolver {
  return favicons().resolve;
}

export const FAVICON_HUES = 8;

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The host name of an address (a scheme is optional), or null when it cannot be read. */
export function hostnameOf(url: string): string | null {
  try {
    const u = new URL(url.includes('://') ? url : `https://${url}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}

// =====================================================================================
// Chart decimation
// =====================================================================================

/** Reduces a run of points sorted by x to at most two per bucket (its lowest and highest y,
 *  in x order), where `buckets` is the number of pixel columns the run spans. Shorter runs
 *  come back unchanged. Spikes survive; a flat stretch collapses. */
export function decimateMinMax<P extends { x: number; y: number }>(points: readonly P[], xMin: number, xMax: number, buckets: number): P[] {
  const n = Math.max(1, Math.floor(buckets));
  if (points.length <= n * 2) return points.slice();
  const span = xMax - xMin || 1;
  const out: P[] = [];
  let b = -1;
  let lo: P | null = null;
  let hi: P | null = null;
  const flush = () => {
    if (!lo || !hi) return;
    if (lo === hi) out.push(lo);
    else if (lo.x <= hi.x) out.push(lo, hi);
    else out.push(hi, lo);
  };
  for (const p of points) {
    const idx = Math.min(n - 1, Math.max(0, Math.floor(((p.x - xMin) / span) * n)));
    if (idx !== b) {
      flush();
      b = idx;
      lo = p;
      hi = p;
    } else {
      if (lo && p.y < lo.y) lo = p;
      if (hi && p.y > hi.y) hi = p;
    }
  }
  flush();
  return out;
}

// =====================================================================================
// Numbers
// =====================================================================================

const NUMBER_FORMATS = /* @__PURE__ */ new Map<string, { whole: Intl.NumberFormat; small: Intl.NumberFormat }>();

/** The default chart number format: whole numbers with grouping from 1000 up, otherwise at
 *  most two decimals. Formatters are cached per locale. */
export function chartNumber(v: number, locale = 'en-US'): string {
  let f = NUMBER_FORMATS.get(locale);
  if (!f) {
    f = {
      whole: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
      small: new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }),
    };
    NUMBER_FORMATS.set(locale, f);
  }
  if (Math.abs(v) >= 1000) return f.whole.format(v);
  return f.small.format(Math.round(v * 100) / 100 || 0);
}

// =====================================================================================
// Dev warnings
// =====================================================================================

const warned = /* @__PURE__ */ new Set<string>();

/** console.warn once per key, outside production. */
export function warnOnce(key: string, message: string): void {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  if (env?.NODE_ENV === 'production' || warned.has(key)) return;
  warned.add(key);
  console.warn(`nish-ui: ${message}`);
}
