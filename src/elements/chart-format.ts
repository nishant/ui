// Shared by <nish-line-chart> and <nish-bar-chart>: format specs, scales, ticks, series colors
// and the base class that tracks width. No React, so the charts bundle stays
// self-contained (src/chart.ts imports React and cannot be bundled into an element file).
import { date, money, num, pct, time } from '../format';
import { NishElement } from './base';
import { getStrings } from './strings';

/** A series color: one of the eight categorical chart colors, or a status/accent color. */
export type ChartTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'chart-7' | 'chart-8' | 'ok' | 'warn' | 'loss' | 'info' | 'accent';

const STATUS_COLOR: Record<string, string> = {
  ok: 'var(--nish-ok-fill)',
  warn: 'var(--nish-warn-fill)',
  loss: 'var(--nish-loss-fill)',
  info: 'var(--nish-info-fill)',
  accent: 'var(--nish-accent)',
};

/** The color of a tone, or the categorical color for the series' position when there is none. */
export function toneColor(tone: string | null | undefined, index: number): string {
  if (tone && Object.hasOwn(STATUS_COLOR, tone)) return STATUS_COLOR[tone];
  if (tone && /^chart-[1-8]$/.test(tone)) return `var(--nish-${tone})`;
  const n = ((Math.trunc(index) % 8) + 8) % 8;
  return `var(--nish-chart-${n + 1})`;
}

/** Chart chrome as var() strings (the same values as CHART in src/chart.ts). */
export const CHROME = {
  grid: 'var(--nish-line)',
  axis: 'var(--nish-line-strong)',
  zero: 'var(--nish-hi3)',
  text: 'var(--nish-hi3)',
} as const;

/** The default number format: thousands separators from 1000, else up to two decimals. */
let thousands: Intl.NumberFormat | undefined;
export const defaultNum = (v: number): string => {
  if (Math.abs(v) < 1000) return String(Math.round(v * 100) / 100);
  // One formatter for every tick and label: building an Intl.NumberFormat per call is the slow part.
  thousands ??= /* @__PURE__ */ new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  return thousands.format(v);
};

/** A format spec attribute to a formatter: `number`, `percent` (a ratio; `percent:0` sets the
 *  digits), `currency:USD`, `date` (`date:medium`, `date:long`, `date:weekday`) and `time`.
 *  Unknown or empty specs give the fallback. */
export function parseFormat(spec: string | null | undefined, fallback: (v: number) => string = defaultNum): (v: number) => string {
  const text = (spec ?? '').trim();
  if (!text) return fallback;
  const i = text.indexOf(':');
  const kind = (i < 0 ? text : text.slice(0, i)).toLowerCase();
  const arg = i < 0 ? '' : text.slice(i + 1).trim();
  switch (kind) {
    case 'number':
      return (v) => num(v);
    case 'percent': {
      const digits = arg !== '' && Number.isInteger(Number(arg)) && Number(arg) >= 0 && Number(arg) <= 10 ? Number(arg) : 1;
      return (v) => pct(v, { digits });
    }
    case 'currency':
      return (v) => money(v, { currency: arg || 'USD' });
    case 'date': {
      const style = arg === 'medium' || arg === 'long' || arg === 'weekday' ? arg : 'short';
      return (v) => date(v, style);
    }
    case 'time':
      return (v) => time(v);
    default:
      return fallback;
  }
}

export function ticksBetween(min: number, max: number, count: number): number[] {
  const n = Math.max(2, Math.floor(count));
  return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1));
}

/** The y range of a chart: the data extent (and baseline), padded 6%, or widened by 5% of the
 *  value (else 1) when every value is equal so the line sits mid-height. */
export function paddedRange(min: number, max: number): [number, number] {
  if (min === max) {
    const d = Math.abs(min) * 0.05 || 1;
    return [min - d, max + d];
  }
  const d = (max - min) * 0.06;
  return [min - d, max + d];
}

/** The index in the sorted `xs` nearest to `x`. */
export function nearestIndex(xs: number[], x: number): number {
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < x) lo = mid;
    else hi = mid;
  }
  return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi;
}

/** One point of a line series. A null y leaves a gap in the line. */
export interface LinePoint {
  x: number;
  y: number | null;
}

/** One named line of a multi-series chart. */
export interface LineSeries {
  label: string;
  tone?: string;
  points: LinePoint[];
}

export interface BarDatum {
  label: string;
  value: number;
}

function num0(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Points from `[3, 5, null]` (x is the index), `[[x, y]]` or `[{ x, y }]`. */
export function normalizePoints(raw: unknown): LinePoint[] {
  if (!Array.isArray(raw)) return [];
  const out: LinePoint[] = [];
  raw.forEach((item, i) => {
    if (Array.isArray(item)) {
      const x = num0(item[0]);
      if (x !== null) out.push({ x, y: num0(item[1]) });
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const x = num0(o.x);
      if (x !== null) out.push({ x, y: num0(o.y) });
    } else {
      out.push({ x: i, y: num0(item) });
    }
  });
  return out;
}

/** Series from `[{ label, tone?, points | data }]`. */
export function normalizeSeries(raw: unknown): LineSeries[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      label: typeof o.label === 'string' && o.label ? o.label : getStrings().seriesNumber(i + 1),
      tone: typeof o.tone === 'string' ? o.tone : undefined,
      points: normalizePoints(o.points ?? o.data),
    };
  });
}

/** Bars from `[{ label, value }]`, `[['Mon', 3]]` or `[3, 5]` (labelled 1, 2, …). */
export function normalizeBars(raw: unknown): BarDatum[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (Array.isArray(item)) return { label: String(item[0] ?? ''), value: num0(item[1]) ?? 0 };
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      return { label: o.label == null ? String(i + 1) : String(o.label), value: num0(o.value) ?? 0 };
    }
    return { label: String(i + 1), value: num0(item) ?? 0 };
  });
}

/** Attribute converter for JSON values: bad JSON gives an empty list. */
export const jsonList = {
  fromAttribute(v: string | null): unknown[] {
    if (!v) return [];
    try {
      const parsed: unknown = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
  toAttribute(v: unknown): string {
    try {
      return JSON.stringify(v);
    } catch {
      return '';
    }
  },
};

/** Base of the two chart elements: keeps `width` current with a ResizeObserver. Colors are `var(--nish-*)`
 *  references, so a theme change needs no redraw. The observer is removed on disconnect. */
export abstract class NishChartBase extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    height: { type: Number, reflect: true },
    tone: { type: String, reflect: true },
    empty: { type: String, reflect: true },
    yFormat: { type: String, attribute: 'y-format', reflect: true },
    xFormat: { type: String, attribute: 'x-format', reflect: true },
    width: { state: true },
  };

  declare label: string;
  declare height: number;
  declare tone: string;
  declare empty: string;
  declare yFormat: string;
  declare xFormat: string;
  /** The measured content width in pixels (0 until laid out). */
  declare width: number;

  private ro: ResizeObserver | null = null;

  constructor() {
    super();
    this.label = '';
    this.tone = '';
    this.empty = '';
    this.yFormat = '';
    this.xFormat = '';
    this.width = 0;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    this.width = this.clientWidth;
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => {
        if (this.clientWidth !== this.width) this.width = this.clientWidth;
      });
      this.ro.observe(this);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = null;
  }

  protected get plotHeight(): number {
    return this.height > 0 ? this.height : 200;
  }
}

let uid = 0;
/** A document-unique id fragment for gradients. */
export function nextId(): string {
  uid += 1;
  return `nish-chart-${uid}`;
}

/** Visually hidden, still read by screen readers (the data table behind each chart). */
export const SR_ONLY =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
