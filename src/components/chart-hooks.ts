'use client';
import { useState } from 'react';
import { onThemeChange } from '../theme';
import { chartTheme, EMPTY_CHART_THEME, type ChartTheme } from '../chart-values';
import { useIsoLayoutEffect } from './client';

/** chartTheme() as React state: re-renders the component when the theme changes, so a
 *  canvas chart can redraw with the new colors. The first render (server and hydration)
 *  has empty strings; the real colors are read before the browser paints. The theme
 *  listeners are shared with the main entry, so one onThemeChange covers every copy. */
export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(EMPTY_CHART_THEME);
  useIsoLayoutEffect(() => {
    const update = () => setTheme(chartTheme());
    update();
    return onThemeChange(update);
  }, []);
  return theme;
}
