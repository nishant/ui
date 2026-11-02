import { CSSProperties } from 'react';

/** The categorical series color for index i (0-based), cycling through chart-1…chart-8. */
declare function seriesColor(i: number): string;
/** Chart chrome as var() strings: gridlines, axis lines, the zero line and tick text. */
declare const CHART: {
    readonly grid: "var(--nish-line)";
    readonly axis: "var(--nish-line-strong)";
    readonly zero: "var(--nish-hi3)";
    readonly text: "var(--nish-hi3)";
};
/** Inline style for a chart tooltip box (Recharts contentStyle and similar). */
declare const tooltipStyle: CSSProperties;
/** Resolved chart colors for canvas libraries, which cannot read var(). */
interface ChartTheme {
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
declare function chartTheme(): ChartTheme;
/** chartTheme() as React state: re-renders the component when the theme changes, so a
 *  canvas chart can redraw with the new colors. */
declare function useChartTheme(): ChartTheme;

export { CHART, chartTheme, seriesColor, tooltipStyle, useChartTheme };
export type { ChartTheme };
