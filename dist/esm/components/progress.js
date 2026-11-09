"use client";

// src/components/progress.tsx
import { useId } from "react";
import { cn } from "../cn.js";
import { useStrings } from "./provider.js";
import { PROGRESS_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var FILL = {
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  neutral: "bg-th-hi3"
};
var THICK = { xs: "h-1", sm: "h-1.5", md: "h-2.5", lg: "h-4" };
var percent = (value, max) => `${Math.round(value / (max || 1) * 100)}%`;
function Progress({
  value = null,
  max = 100,
  tone = "accent",
  size = "sm",
  label,
  showValue = false,
  formatValue = percent,
  className,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}) {
  const strings = useStrings(PROGRESS_STRINGS);
  const labelId = useId();
  const indeterminate = value == null || Number.isNaN(value);
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const pct = indeterminate ? 100 : clamped / (max || 1) * 100;
  const text = indeterminate ? void 0 : formatValue(clamped, max);
  const name = ariaLabelledBy ?? (label != null ? labelId : void 0);
  return /* @__PURE__ */ jsxs("div", { ref, className: cn("grid w-full gap-1", className), ...rest, children: [
    label != null || showValue && text ? /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between gap-2 text-xs text-th-hi2", children: [
      label != null ? /* @__PURE__ */ jsx("span", { id: labelId, children: label }) : /* @__PURE__ */ jsx("span", {}),
      showValue && text ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "tabular-nums text-th-hi3", children: text }) : null
    ] }) : null,
    /* @__PURE__ */ jsx(
      "div",
      {
        role: "progressbar",
        "aria-label": name ? void 0 : ariaLabel ?? (indeterminate ? strings.progressIndeterminate : strings.progress),
        "aria-labelledby": name,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-valuenow": indeterminate ? void 0 : clamped,
        "aria-valuetext": text,
        "data-state": indeterminate ? "indeterminate" : clamped >= max ? "complete" : "loading",
        className: cn(
          "relative w-full overflow-hidden rounded-full bg-th-elevated",
          "forced-colors:border forced-colors:border-[ButtonText] forced-colors:bg-[Canvas]",
          THICK[size]
        ),
        children: /* @__PURE__ */ jsx(
          "div",
          {
            "data-part": "fill",
            className: cn(
              "absolute inset-y-0 start-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
              FILL[tone],
              "forced-color-adjust-none forced-colors:bg-[Highlight]",
              indeterminate && "motion-safe:animate-pulse"
            ),
            style: { width: `${pct}%` }
          }
        )
      }
    )
  ] });
}
export {
  Progress
};
