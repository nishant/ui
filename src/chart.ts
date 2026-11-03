// @nish/ui/chart: theme colors for charts, with no chart library. No directive here: the pure
// values (seriesColor, CHART, tooltipStyle, chartTheme) work in server components; only
// useChartTheme lives in a 'use client' module.
export { seriesColor, CHART, tooltipStyle, chartTheme, type ChartTheme } from './chart-values';
export { useChartTheme } from './components/chart-hooks';
