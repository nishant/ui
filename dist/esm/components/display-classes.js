// src/components/display-classes.ts
var warned = /* @__PURE__ */ new Set();
function warnDev(message) {
  if (warned.has(message)) return;
  try {
    if (process.env.NODE_ENV !== "production") {
      warned.add(message);
      console.warn(message);
    }
  } catch {
  }
}
var FILL = {
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  accent: "bg-th-accent",
  neutral: "bg-th-ghost"
};
var CALLOUT_TONE = {
  neutral: { box: "border-th-line bg-th-elevated", bar: "border-th-line bg-th-elevated", icon: "text-th-hi3" },
  accent: { box: "border-th-accent/30 bg-th-accent-soft", bar: "border-th-accent/30 bg-th-accent-soft-solid", icon: "text-th-accent" },
  info: { box: "border-th-info/30 bg-th-info-soft", bar: "border-th-info/30 bg-th-info-soft-solid", icon: "text-th-info" },
  ok: { box: "border-th-ok/30 bg-th-ok-soft", bar: "border-th-ok/30 bg-th-ok-soft-solid", icon: "text-th-ok" },
  warn: { box: "border-th-warn/30 bg-th-warn-soft", bar: "border-th-warn/30 bg-th-warn-soft-solid", icon: "text-th-warn" },
  loss: { box: "border-th-loss/30 bg-th-loss-soft", bar: "border-th-loss/30 bg-th-loss-soft-solid", icon: "text-th-loss" }
};
var CALLOUT_CLAMP = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" };
var DOT_SIZE = { xs: "size-1.5", sm: "size-2", md: "size-2.5", lg: "size-3.5" };
var HALO = {
  ok: "ring-4 ring-th-ok-fill/25",
  warn: "ring-4 ring-th-warn-fill/25",
  loss: "ring-4 ring-th-loss-fill/25",
  info: "ring-4 ring-th-info-fill/25",
  accent: "ring-4 ring-th-accent/25",
  neutral: "ring-4 ring-th-ghost/25"
};
function signTone(n) {
  if (n == null || Number.isNaN(n) || n === 0) return "neutral";
  return n > 0 ? "ok" : "loss";
}
var STAT_VALUE_SIZE = { sm: "text-base", md: "text-xl", lg: "text-2xl" };
var STAT_SKELETON = { sm: "h-6", md: "h-7", lg: "h-8" };
var STAT_TONE = { ok: "text-th-ok", loss: "text-th-loss", warn: "text-th-warn", neutral: "text-th-hi" };
var GRID_BASE = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
var GRID_MD = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6"
};
function toneFor(value, t) {
  if (t.loss >= t.warn) return value >= t.loss ? "loss" : value >= t.warn ? "warn" : "ok";
  return value <= t.loss ? "loss" : value <= t.warn ? "warn" : "ok";
}
var METER_FILL = {
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  neutral: "bg-th-hi3",
  "chart-1": "bg-th-chart-1",
  "chart-2": "bg-th-chart-2",
  "chart-3": "bg-th-chart-3",
  "chart-4": "bg-th-chart-4",
  "chart-5": "bg-th-chart-5",
  "chart-6": "bg-th-chart-6",
  "chart-7": "bg-th-chart-7",
  "chart-8": "bg-th-chart-8"
};
var METER_THICK = { xs: "h-1", sm: "h-1.5", md: "h-2.5" };
var METER_THICK_V = { xs: "w-1", sm: "w-1.5", md: "w-2.5" };
var SPARK_TONE = {
  accent: "text-th-accent",
  ok: "text-th-ok-fill",
  warn: "text-th-warn-fill",
  loss: "text-th-loss-fill",
  info: "text-th-info-fill",
  "chart-1": "text-th-chart-1",
  "chart-2": "text-th-chart-2",
  "chart-3": "text-th-chart-3",
  "chart-4": "text-th-chart-4",
  "chart-5": "text-th-chart-5",
  "chart-6": "text-th-chart-6",
  "chart-7": "text-th-chart-7",
  "chart-8": "text-th-chart-8"
};
var LEGEND_FILL = {
  "chart-1": "bg-th-chart-1",
  "chart-2": "bg-th-chart-2",
  "chart-3": "bg-th-chart-3",
  "chart-4": "bg-th-chart-4",
  "chart-5": "bg-th-chart-5",
  "chart-6": "bg-th-chart-6",
  "chart-7": "bg-th-chart-7",
  "chart-8": "bg-th-chart-8",
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill"
};
var FORCED_MARK = "forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]";
export {
  CALLOUT_CLAMP,
  CALLOUT_TONE,
  DOT_SIZE,
  FILL,
  FORCED_MARK,
  GRID_BASE,
  GRID_MD,
  HALO,
  LEGEND_FILL,
  METER_FILL,
  METER_THICK,
  METER_THICK_V,
  SPARK_TONE,
  STAT_SKELETON,
  STAT_TONE,
  STAT_VALUE_SIZE,
  signTone,
  toneFor,
  warnDev
};
