// @nish/ui/chart: theme colors for charts, with no chart library. SVG and CSS charts
// (Recharts, hand-drawn SVG) take the var() strings and follow theme changes on their
// own; canvas charts (uPlot, Chart.js) take chartTheme()'s resolved values and redraw
// when useChartTheme() (or onThemeChange) reports a change.
import { useEffect, useState, type CSSProperties } from 'react';
import { onThemeChange, readToken } from './theme';

/** The categorical series color for index i (0-based), cycling through chart-1…chart-8. */
export function seriesColor(i: number): string {
  const n = ((Math.trunc(i) % 8) + 8) % 8;
  return `var(--nish-chart-${n + 1})`;
}

/** Chart chrome as var() strings: gridlines, axis lines, the zero line and tick text. */
export const CHART = {
  grid: 'var(--nish-line)',
  axis: 'var(--nish-line-strong)',
  zero: 'var(--nish-hi3)',
  text: 'var(--nish-hi3)',
} as const;

/** Inline style for a chart tooltip box (Recharts contentStyle and similar). */
export const tooltipStyle: CSSProperties = {
  background: 'var(--nish-elevated)',
  border: '1px solid var(--nish-line-strong)',
  borderRadius: 'var(--nish-radius-sm)',
  boxShadow: 'var(--nish-shadow-pop)',
  color: 'var(--nish-hi)',
  fontSize: 12,
};

/** Resolved chart colors for canvas libraries, which cannot read var(). */
export interface ChartTheme {
  /** Gridlines. */
  grid: string;
  /** Axis lines. */
  axis: string;
  /** The zero line. */
  zero: string;
  /** Tick and legend text. */
  text: string;
  /** The page and panel backgrounds, for clearing or filling the canvas. */
  bg: string;
  surface: string;
  /** chart-1 … chart-8. */
  series: string[];
  /** Status fills for up/down bars and alert bands. */
  ok: string;
  loss: string;
  warn: string;
  info: string;
  accent: string;
}

/** Reads the current theme's chart colors from <html>. Call it again after a theme
 *  change (see useChartTheme or onThemeChange). Returns empty strings during SSR. */
export function chartTheme(): ChartTheme {
  const t = (name: string) => (typeof document === 'undefined' ? '' : readToken(name));
  return {
    grid: t('line'),
    axis: t('line-strong'),
    zero: t('hi3'),
    text: t('hi3'),
    bg: t('bg'),
    surface: t('surface'),
    series: Array.from({ length: 8 }, (_, i) => t(`chart-${i + 1}`)),
    ok: t('ok-fill'),
    loss: t('loss-fill'),
    warn: t('warn-fill'),
    info: t('info-fill'),
    accent: t('accent'),
  };
}

/** chartTheme() as React state: re-renders the component when the theme changes, so a
 *  canvas chart can redraw with the new colors. */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(chartTheme);
  useEffect(() => {
    setTheme(chartTheme());
    return onThemeChange(() => setTheme(chartTheme()));
  }, []);
  return theme;
}
