// src/theme.ts
var ONE_YEAR = 60 * 60 * 24 * 365;
function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--nish-${name}`).trim();
}

// src/chart-values.ts
function seriesColor(i) {
  const n = (Math.trunc(i) % 8 + 8) % 8;
  return `var(--nish-chart-${n + 1})`;
}
var CHART = {
  grid: "var(--nish-line)",
  axis: "var(--nish-line-strong)",
  zero: "var(--nish-hi3)",
  text: "var(--nish-hi3)"
};
var tooltipStyle = {
  background: "var(--nish-elevated)",
  border: "1px solid var(--nish-line-strong)",
  borderRadius: "var(--nish-radius-sm)",
  boxShadow: "var(--nish-shadow-pop)",
  color: "var(--nish-hi)",
  fontSize: 12
};
function chartTheme() {
  const t = (name) => typeof document === "undefined" ? "" : readToken(name);
  return {
    grid: t("line"),
    axis: t("line-strong"),
    zero: t("hi3"),
    text: t("hi3"),
    bg: t("bg"),
    surface: t("surface"),
    series: Array.from({ length: 8 }, (_, i) => t(`chart-${i + 1}`)),
    ok: t("ok-fill"),
    loss: t("loss-fill"),
    warn: t("warn-fill"),
    info: t("info-fill"),
    accent: t("accent")
  };
}
var EMPTY_CHART_THEME = {
  grid: "",
  axis: "",
  zero: "",
  text: "",
  bg: "",
  surface: "",
  series: [],
  ok: "",
  loss: "",
  warn: "",
  info: "",
  accent: ""
};
export {
  CHART,
  EMPTY_CHART_THEME,
  chartTheme,
  seriesColor,
  tooltipStyle
};
//# sourceMappingURL=chart.js.map