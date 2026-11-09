'use client';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { CHART, seriesColor, tooltipStyle } from '../chart';
import { isRtl } from './client';
import { chartNumber, decimateMinMax, mergeRefs } from './data-classes';
import { Skeleton } from './feedback';
import { useMediaQuery } from './hooks';
import { useNishContext, useStrings } from './provider';
import { DISPLAY_STRINGS } from './strings';

/** A series color: one of the eight categorical chart colors, or a status/accent color. */
export type ChartTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'chart-7' | 'chart-8' | 'ok' | 'loss' | 'accent';

/** One point of a line series. A null y leaves a gap in the line. */
export interface LinePoint {
  x: number;
  y: number | null;
}

/** One named line of a multi-series LineChart. */
export interface LineSeries {
  /** Shown in the tooltip and the screen-reader table. */
  label: string;
  /** Default: the categorical color for the series' position. */
  tone?: ChartTone;
  points: LinePoint[];
}

function toneColor(tone: ChartTone | undefined, index: number): string {
  if (!tone) return seriesColor(index);
  if (tone === 'ok') return 'var(--nish-ok-fill)';
  if (tone === 'loss') return 'var(--nish-loss-fill)';
  if (tone === 'accent') return 'var(--nish-accent)';
  return `var(--nish-${tone})`;
}

/** The element's content width, kept current with a ResizeObserver (0 until measured). */
function useWidth<T extends HTMLElement>(): [(el: T | null) => void, number, T | null] {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!el) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
      setWidth(0);
      return;
    }
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width, el];
}

/** True when the chart is laid out right-to-left: the provider's `dir`, else the element's
 *  computed direction (read after mount, so the first render matches the server). */
function useChartRtl(el: HTMLElement | null): boolean {
  const { dir } = useNishContext();
  const [measured, setMeasured] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a DOM measurement inside the effect
    setMeasured(isRtl(el));
  }, [el, dir]);
  return dir ? dir === 'rtl' : measured;
}

/** x position of a data value on the plot. In right-to-left layouts the x axis runs the other way. */
function xPos(x: number, xMin: number, xMax: number, padLeft: number, plotW: number, rtl: boolean): number {
  const f = (x - xMin) / (xMax - xMin);
  return padLeft + (rtl ? 1 - f : f) * plotW;
}

function ticksBetween(min: number, max: number, count: number): number[] {
  const n = Math.max(2, Math.floor(count));
  return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1));
}

export interface LineChartProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** A single series of points. Use this or `series`. */
  data?: LinePoint[];
  /** Several series sharing one x axis. */
  series?: LineSeries[];
  /** Plot height in pixels. Default 200. */
  height?: number;
  /** Fill under the first series with a fading gradient of its color. */
  area?: boolean;
  /** Formats y axis ticks and tooltip values. Default: numbers in `locale`. */
  yFormat?: (v: number) => string;
  /** Formats x axis ticks and the tooltip heading. */
  xFormat?: (v: number) => string;
  /** How many y axis labels. Default 4. */
  yTicks?: number;
  /** How many x axis labels. Default 4. */
  xTicks?: number;
  /** A dashed horizontal reference line, e.g. the previous close. */
  baseline?: number;
  /** Color of the single `data` series. Default chart-1. */
  tone?: ChartTone;
  /** Accessible name of the chart. */
  label: string;
  /** Show a skeleton of the same height. */
  loading?: boolean;
  /** Shown when there are no points. Default: the "noData" string. */
  empty?: ReactNode;
  /** The locale of the default axis numbers. Default: the provider's locale, else en-US. */
  locale?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const PAD_RIGHT = 12;

/** A dependency-free SVG line chart that fills its container's width. Gaps (null y)
 *  break the line. Hover, touch-drag or Left/Right keys move a crosshair with a
 *  tooltip; vertical swipes still scroll the page. A hidden table carries the data for
 *  screen readers. Long series are reduced to at most two points per pixel column
 *  (the lowest and highest of each), so spikes survive. In right-to-left layouts the
 *  x axis runs right to left and the arrow keys follow. */
export function LineChart({
  data,
  series,
  height = 200,
  area,
  yFormat,
  xFormat,
  yTicks = 4,
  xTicks = 4,
  baseline,
  tone,
  label,
  loading,
  empty,
  locale,
  className,
  ref,
  ...rest
}: LineChartProps) {
  const t = useStrings(DISPLAY_STRINGS);
  const config = useNishContext();
  const loc = locale ?? config.locale ?? 'en-US';
  const yFmt = yFormat ?? ((v: number) => chartNumber(v, loc));
  const xFmt = xFormat ?? ((v: number) => chartNumber(v, loc));
  const [wrapRef, width, wrapEl] = useWidth<HTMLDivElement>();
  const rtl = useChartRtl(wrapEl);
  const gradId = `nish-area-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [active, setActive] = useState<number | null>(null);
  const fromKey = useRef(false);

  const lines = useMemo<LineSeries[]>(() => (series ?? (data ? [{ label, tone, points: data }] : [])), [series, data, label, tone]);

  // Sorted unique x values across every series: the positions the crosshair snaps to.
  const xs = useMemo(() => {
    const set = new Set<number>();
    for (const s of lines) for (const p of s.points) if (p.y != null && Number.isFinite(p.y) && Number.isFinite(p.x)) set.add(p.x);
    return [...set].sort((a, b) => a - b);
  }, [lines]);

  const lookup = useMemo(
    () => lines.map((s) => new Map(s.points.filter((p) => p.y != null && Number.isFinite(p.y)).map((p) => [p.x, p.y as number]))),
    [lines],
  );

  const scale = useMemo(() => {
    if (!xs.length) return null;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const s of lines) for (const p of s.points) if (p.y != null && Number.isFinite(p.y)) {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    }
    if (baseline != null && Number.isFinite(baseline)) {
      yMin = Math.min(yMin, baseline);
      yMax = Math.max(yMax, baseline);
    }
    if (yMin === yMax) {
      const d = Math.abs(yMin) * 0.05 || 1;
      yMin -= d;
      yMax += d;
    } else {
      const d = (yMax - yMin) * 0.06;
      yMin -= d;
      yMax += d;
    }
    const xMin = xs[0];
    const xMax = xs[xs.length - 1];
    return { xMin, xMax: xMax === xMin ? xMin + 1 : xMax, yMin, yMax };
  }, [lines, xs, baseline]);

  // Each series as runs of finite points sorted by x (a gap starts a new run). Depends on the data only.
  const runs = useMemo(
    () =>
      lines.map((s) => {
        const out: { x: number; y: number }[][] = [];
        let cur: { x: number; y: number }[] = [];
        for (const p of [...s.points].sort((a, b) => a.x - b.x)) {
          if (p.y == null || !Number.isFinite(p.y) || !Number.isFinite(p.x)) {
            if (cur.length) out.push(cur);
            cur = [];
          } else cur.push({ x: p.x, y: p.y });
        }
        if (cur.length) out.push(cur);
        return out;
      }),
    [lines],
  );

  // Clear a touch-pinned tooltip when the next pointer lands outside the chart.
  useEffect(() => {
    if (active == null) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (wrapEl && !wrapEl.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [active, wrapEl]);

  const yLabels = scale ? ticksBetween(scale.yMin, scale.yMax, yTicks).map((v) => ({ v, text: yFmt(v) })) : [];
  const padLeft = Math.ceil(Math.max(0, ...yLabels.map((l) => l.text.length)) * 6.6) + 10;
  const plotW = Math.max(0, width - padLeft - PAD_RIGHT);
  // Where the plot starts. In RTL the y labels sit on the right, so the label gutter swaps sides.
  const plotX = rtl ? PAD_RIGHT : padLeft;
  const plotH = Math.max(0, height - PAD_TOP - PAD_BOTTOM);

  // Path points as strings. Depends on data, size and direction, not on the hover position.
  const paths = useMemo(() => {
    if (!scale) return [];
    const sy = (y: number) => PAD_TOP + (1 - (y - scale.yMin) / (scale.yMax - scale.yMin)) * plotH;
    return runs.map((segs) =>
      segs.map((seg) =>
        decimateMinMax(seg, scale.xMin, scale.xMax, plotW).map(
          (p) => `${xPos(p.x, scale.xMin, scale.xMax, plotX, plotW, rtl).toFixed(1)},${sy(p.y).toFixed(1)}`,
        ),
      ),
    );
  }, [runs, scale, plotW, plotH, plotX, rtl]);

  if (loading) return <Skeleton className={cn('w-full rounded-xl', className)} style={{ height }} />;

  if (!scale) {
    return (
      <div
        {...rest}
        ref={ref}
        role="img"
        aria-label={t.noDataNamed(label)}
        className={cn('flex w-full items-center justify-center text-sm text-th-hi3', className)}
        style={{ height, ...rest.style }}
      >
        {empty ?? t.noData}
      </div>
    );
  }

  const sx = (x: number) => xPos(x, scale.xMin, scale.xMax, plotX, plotW, rtl);
  const sy = (y: number) => PAD_TOP + (1 - (y - scale.yMin) / (scale.yMax - scale.yMin)) * plotH;
  const bottom = PAD_TOP + plotH;

  const xLabels = ticksBetween(scale.xMin, scale.xMax, Math.min(xTicks, Math.max(2, Math.floor(plotW / 72))));

  const moveTo = (clientX: number, el: Element) => {
    const rect = el.getBoundingClientRect();
    const f = (clientX - rect.left - plotX) / (plotW || 1);
    const x = scale.xMin + (rtl ? 1 - f : f) * (scale.xMax - scale.xMin);
    let lo = 0;
    let hi = xs.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] < x) lo = mid;
      else hi = mid;
    }
    setActive(Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi);
  };

  const onPointer = (e: PointerEvent<SVGSVGElement>) => {
    fromKey.current = false;
    moveTo(e.clientX, e.currentTarget);
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      fromKey.current = true;
      // The plot is mirrored in RTL, so the right arrow goes back along the data.
      const dir = (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
      setActive((a) => (a == null ? (dir > 0 ? 0 : xs.length - 1) : Math.min(xs.length - 1, Math.max(0, a + dir))));
    } else if (e.key === 'Escape') setActive(null);
  };

  const ax = active != null ? xs[active] : null;
  const cx = ax != null ? sx(ax) : 0;
  const tipRows = ax != null ? lines.map((s, i) => ({ s, i, y: lookup[i].get(ax) })).filter((r) => r.y != null) : [];
  const tipRight = cx < width / 2;

  const tableXs = xs.slice(0, 200);

  return (
    <div {...rest} ref={mergeRefs(wrapRef, ref)} className={cn('relative w-full select-none', className)} style={{ height, ...rest.style }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          tabIndex={0}
          aria-label={label}
          className="block rounded-md outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight] focus-visible:ring-2 focus-visible:ring-th-accent"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onPointer}
          onPointerMove={onPointer}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setActive(null);
          }}
          onKeyDown={onKey}
          onBlur={() => {
            if (fromKey.current) setActive(null);
          }}
        >
          {area && lines[0] && (
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={toneColor(lines[0].tone, 0)} stopOpacity={0.2} />
                <stop offset="100%" stopColor={toneColor(lines[0].tone, 0)} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          {yLabels.map((l, i) => (
            <g key={i}>
              <line x1={plotX} x2={plotX + plotW} y1={sy(l.v)} y2={sy(l.v)} stroke={CHART.grid} strokeWidth={1} />
              <text
                x={rtl ? plotX + plotW + 6 : plotX - 6}
                y={sy(l.v)}
                textAnchor={rtl ? 'start' : 'end'}
                dominantBaseline="middle"
                fontSize={11}
                fill={CHART.text}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {l.text}
              </text>
            </g>
          ))}
          {xLabels.map((v, i) => (
            <text
              key={i}
              x={sx(v)}
              y={height - 6}
              textAnchor={i === 0 ? (rtl ? 'end' : 'start') : i === xLabels.length - 1 ? (rtl ? 'start' : 'end') : 'middle'}
              fontSize={11}
              fill={CHART.text}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {xFmt(v)}
            </text>
          ))}
          {baseline != null && Number.isFinite(baseline) && (
            <line x1={plotX} x2={plotX + plotW} y1={sy(baseline)} y2={sy(baseline)} stroke={CHART.zero} strokeWidth={1} strokeDasharray="4 4" />
          )}
          {area &&
            paths[0]?.map((seg, i) => (
              <polygon key={i} points={`${seg[0].split(',')[0]},${bottom} ${seg.join(' ')} ${seg[seg.length - 1].split(',')[0]},${bottom}`} fill={`url(#${gradId})`} />
            ))}
          {paths.map((segs, si) =>
            segs.map((seg, i) =>
              seg.length === 1 ? (
                <circle key={`${si}-${i}`} cx={seg[0].split(',')[0]} cy={seg[0].split(',')[1]} r={2} fill={toneColor(lines[si].tone, si)} />
              ) : (
                <polyline key={`${si}-${i}`} points={seg.join(' ')} fill="none" stroke={toneColor(lines[si].tone, si)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ),
            ),
          )}
          {ax != null && (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={PAD_TOP} y2={bottom} stroke={CHART.axis} strokeWidth={1} />
              {tipRows.map((r) => (
                <circle key={r.i} cx={cx} cy={sy(r.y as number)} r={4} fill={toneColor(r.s.tone, r.i)} stroke="var(--nish-surface)" strokeWidth={2} />
              ))}
            </g>
          )}
        </svg>
      )}
      {ax != null && width > 0 && (
        <div
          ref={(el) => {
            // Keep the tooltip inside the chart: a wide one would otherwise run past the edge and add page scroll.
            if (!el) return;
            const w = el.offsetWidth;
            if (tipRight) el.style.left = `${Math.max(0, Math.min(cx + 10, width - w))}px`;
            else el.style.right = `${Math.max(0, Math.min(width - cx + 10, width - w))}px`;
          }}
          className="pointer-events-none absolute top-1 z-[var(--nish-z-tooltip,10)] overflow-hidden whitespace-nowrap px-2 py-1 tabular-nums"
          style={{ ...tooltipStyle, maxWidth: 'calc(100% - 8px)', ...(tipRight ? { left: cx + 10 } : { right: width - cx + 10 }) }}
        >
          <div className="text-th-hi3">{xFmt(ax)}</div>
          {tipRows.map((r) => (
            <div key={r.i} className="flex items-center gap-1.5">
              <span aria-hidden="true" className="inline-block size-2 rounded-full" style={{ background: toneColor(r.s.tone, r.i) }} />
              {lines.length > 1 && <span className="text-th-hi3">{r.s.label}</span>}
              <span className="font-medium">{yFmt(r.y as number)}</span>
            </div>
          ))}
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">x</th>
            {lines.map((s, i) => (
              <th key={i} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableXs.map((x) => (
            <tr key={x}>
              <th scope="row">{xFmt(x)}</th>
              {lines.map((_, i) => (
                <td key={i}>{lookup[i].has(x) ? yFmt(lookup[i].get(x) as number) : ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface BarChartProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** One bar per entry, in order. */
  data: { label: string; value: number }[];
  /** Plot height in pixels. Default 140. */
  height?: number;
  /** Bar color. Default chart-1. */
  tone?: ChartTone;
  /** Formats values above the bars and in the caption. Default: numbers in `locale`. */
  valueFormat?: (v: number) => string;
  /** 'always' prints every value above its bar; 'auto' (default) does so on touch
   *  screens only, where there is no hover. */
  showValues?: 'always' | 'auto';
  /** 'ends' (default) labels the first and last bar; 'all' labels every bar. */
  xTicks?: 'ends' | 'all';
  /** Accessible name of the chart. */
  label: string;
  /** Shown when there are no bars. Default: the "noData" string. */
  empty?: ReactNode;
  /** The locale of the default value format. Default: the provider's locale, else en-US. */
  locale?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const BAR_TOP = 18;
const BAR_BOTTOM = 22;

/** A dependency-free SVG bar chart that fills its container's width. Hover, tap or
 *  Left/Right keys select a bar and show "label: value" under the chart. A hidden table
 *  carries the data for screen readers. In right-to-left layouts the first bar is at the
 *  right and the arrow keys follow. */
export function BarChart({
  data,
  height = 140,
  tone = 'chart-1',
  valueFormat,
  showValues = 'auto',
  xTicks = 'ends',
  label,
  empty,
  locale,
  className,
  ref,
  ...rest
}: BarChartProps) {
  const t = useStrings(DISPLAY_STRINGS);
  const config = useNishContext();
  const loc = locale ?? config.locale ?? 'en-US';
  const fmt = valueFormat ?? ((v: number) => chartNumber(v, loc));
  const [wrapRef, width, wrapEl] = useWidth<HTMLDivElement>();
  const rtl = useChartRtl(wrapEl);
  const coarse = useMediaQuery('(pointer: coarse)');
  const [pickedBar, setSelected] = useState<number | null>(null);
  // The data can shrink under a selection; an index past the end counts as none.
  const selected = pickedBar != null && pickedBar < data.length ? pickedBar : null;
  const color = toneColor(tone, 0);

  const pick = useCallback(
    (clientX: number, el: Element) => {
      const rect = el.getBoundingClientRect();
      const i = Math.floor(((clientX - rect.left) / (rect.width || 1)) * data.length);
      const clamped = Math.min(data.length - 1, Math.max(0, i));
      setSelected(rtl ? data.length - 1 - clamped : clamped);
    },
    [data.length, rtl],
  );

  if (!data.length) {
    return (
      <div
        {...rest}
        ref={ref}
        role="img"
        aria-label={t.noDataNamed(label)}
        className={cn('flex w-full items-center justify-center text-sm text-th-hi3', className)}
        style={{ height, ...rest.style }}
      >
        {empty ?? t.noData}
      </div>
    );
  }

  const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0));
  const vMax = Math.max(0, ...values);
  const vMin = Math.min(0, ...values);
  const span = vMax - vMin || 1;
  const plotH = Math.max(0, height - BAR_TOP - BAR_BOTTOM);
  const zeroY = BAR_TOP + (vMax / span) * plotH;
  const band = width / data.length;
  const barW = Math.max(1, band * 0.72);
  const printValues = showValues === 'always' || coarse;
  // Where bar i sits: in RTL the first bar is at the right end.
  const slot = (i: number) => (rtl ? data.length - 1 - i : i);

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const dir = (e.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
      setSelected(() => (selected == null ? (dir > 0 ? 0 : data.length - 1) : Math.min(data.length - 1, Math.max(0, selected + dir))));
    } else if (e.key === 'Escape') setSelected(null);
  };

  return (
    <div {...rest} ref={mergeRefs(wrapRef, ref)} className={cn('w-full', className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          tabIndex={0}
          aria-label={label}
          className="block rounded-md outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight] focus-visible:ring-2 focus-visible:ring-th-accent"
          style={{ touchAction: 'pan-y' }}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse' || e.buttons) pick(e.clientX, e.currentTarget);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setSelected(null);
          }}
          onKeyDown={onKey}
        >
          <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke={CHART.grid} strokeWidth={1} />
          {values.map((v, i) => {
            const h = Math.max(2, (Math.abs(v) / span) * plotH);
            const y = v < 0 ? zeroY : zeroY - h;
            const x = slot(i) * band + (band - barW) / 2;
            const isSel = selected === i;
            const showVal = isSel || (printValues && (showValues === 'always' || band >= 26));
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={h} rx={2} fill={color} opacity={selected == null || isSel ? 1 : 0.55} />
                {showVal && (
                  <text x={x + barW / 2} y={v < 0 ? y + h + 11 : Math.max(11, y - 4)} textAnchor="middle" fontSize={11} fill={CHART.text} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(v)}
                  </text>
                )}
              </g>
            );
          })}
          {data.map((d, i) => {
            const show = xTicks === 'all' || i === 0 || i === data.length - 1;
            if (!show) return null;
            const atLeft = slot(i) === 0;
            const anchor = xTicks === 'all' ? 'middle' : atLeft ? 'start' : 'end';
            const x = xTicks === 'all' ? slot(i) * band + band / 2 : atLeft ? 0 : width;
            return (
              <text key={i} x={x} y={height - 6} textAnchor={anchor} fontSize={11} fill={CHART.text}>
                {d.label}
              </text>
            );
          })}
        </svg>
      )}
      <div className="mt-1 min-h-5 text-sm tabular-nums text-th-hi2" aria-live="polite">
        {selected != null ? `${data[selected].label}: ${fmt(values[selected])}` : ''}
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th scope="row">{d.label}</th>
              <td>{fmt(values[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface RangeBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** The track's lower end (e.g. the 52-week low). */
  min: number;
  /** The track's upper end. */
  max: number;
  /** Start of the highlighted segment (e.g. today's low). */
  low: number;
  /** End of the highlighted segment. */
  high: number;
  /** Marks a value (e.g. the current price) with a dot. */
  current?: number;
  /** The accessible name. Default (English): "Range low to high, current x, within min to max". */
  label?: string;
  /** The locale of the numbers in the default name. Default: the provider's locale, else en-US. */
  locale?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/** A thin range track with a highlighted low-to-high segment and an optional dot for
 *  the current value: daily temperature ranges, a price's day range. The track starts at
 *  the start edge, so it mirrors in right-to-left layouts. */
export function RangeBar({ min, max, low, high, current, label, locale, className, ref, ...rest }: RangeBarProps) {
  const config = useNishContext();
  const loc = locale ?? config.locale ?? 'en-US';
  const num = (v: number) => chartNumber(v, loc);
  const span = max - min;
  const pos = (v: number) => (span > 0 ? Math.min(100, Math.max(0, ((v - min) / span) * 100)) : 0);
  const a = pos(Math.min(low, high));
  const b = pos(Math.max(low, high));
  return (
    <div
      {...rest}
      ref={ref}
      role="img"
      aria-label={label ?? `Range ${num(low)} to ${num(high)}${current != null ? `, current ${num(current)}` : ''}, within ${num(min)} to ${num(max)}`}
      className={cn('relative h-1.5 w-full rounded-full bg-th-line forced-colors:bg-[color:GrayText]', className)}
    >
      <div
        className="absolute inset-y-0 rounded-full bg-gradient-to-r from-[var(--nish-chart-2)] to-[var(--nish-chart-5)] rtl:bg-gradient-to-l forced-colors:bg-none forced-colors:bg-[color:Highlight]"
        style={{ insetInlineStart: `${a}%`, width: `${Math.max(b - a, 1)}%` }}
      />
      {current != null && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-th-surface bg-th-hi rtl:translate-x-1/2 forced-colors:bg-[color:CanvasText]"
          style={{ insetInlineStart: `${pos(current)}%` }}
        />
      )}
    </div>
  );
}
