"use client";

// src/components/chart-hooks.ts
import { useState } from "react";
import { onThemeChange } from "../theme.js";
import { chartTheme, EMPTY_CHART_THEME } from "../chart-values.js";
import { useIsoLayoutEffect } from "./client.js";
function useChartTheme() {
  const [theme, setTheme] = useState(EMPTY_CHART_THEME);
  useIsoLayoutEffect(() => {
    const update = () => setTheme(chartTheme());
    update();
    return onThemeChange(update);
  }, []);
  return theme;
}
export {
  useChartTheme
};
