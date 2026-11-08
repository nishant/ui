"use client";

// src/components/canvas/legend.tsx
import { memo, useEffect, useId, useRef, useState } from "react";
import { cn } from "../../cn.js";
import { useStrings } from "../provider.js";
import { CANVAS_STRINGS } from "../strings.js";
import { Svg } from "./icons.js";
import { DEFAULT_CANVAS_LABELS } from "./types.js";
import { jsx, jsxs } from "react/jsx-runtime";
var DASH = {
  solid: { width: 1.75 },
  dashed: { dash: "6 5", width: 1.75 },
  dotted: { dash: "0.5 6", width: 2.25, cap: "round" }
};
function Sample({ line }) {
  const d = DASH[line ?? "solid"];
  return /* @__PURE__ */ jsx("svg", { width: 28, height: 10, viewBox: "0 0 28 10", "aria-hidden": "true", focusable: "false", className: "shrink-0", children: /* @__PURE__ */ jsx("line", { x1: 2, y1: 5, x2: 26, y2: 5, stroke: "currentColor", strokeWidth: d.width, strokeDasharray: d.dash, strokeLinecap: d.cap }) });
}
var EdgeLegend = memo(function EdgeLegend2({
  kinds,
  hidden,
  onToggle,
  labels = DEFAULT_CANVAS_LABELS
}) {
  const strings = useStrings(CANVAS_STRINGS);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  if (kinds.length === 0) return null;
  const nHidden = kinds.filter((k) => hidden.has(k.id)).length;
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, "data-canvas-ui": true, className: "absolute start-3 top-3 z-[5] flex flex-col items-start gap-1.5", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        ref: buttonRef,
        type: "button",
        "aria-expanded": open,
        "aria-controls": open ? panelId : void 0,
        onClick: () => setOpen((o) => !o),
        className: "inline-flex h-11 items-center gap-2 rounded-xl border border-th-line bg-th-surface px-3 text-sm text-th-hi shadow-pop outline-none hover:bg-th-elevated focus-visible:ring-2 focus-visible:ring-th-accent",
        children: [
          /* @__PURE__ */ jsx(Svg, { children: /* @__PURE__ */ jsx("path", { d: "M3 6h18M3 12h18M3 18h18" }) }),
          /* @__PURE__ */ jsx("span", { children: strings.canvasLines }),
          nHidden > 0 ? /* @__PURE__ */ jsx("span", { className: "text-th-hi3", children: labels.hidden(nHidden) }) : null
        ]
      }
    ),
    open ? /* @__PURE__ */ jsx("div", { id: panelId, role: "menu", "aria-label": strings.canvasLines, className: "overflow-hidden rounded-xl border border-th-line bg-th-surface shadow-pop", style: { width: "min(240px, calc(100vw - 24px))" }, children: kinds.map((k) => {
      const on = !hidden.has(k.id);
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          role: "menuitemcheckbox",
          "aria-checked": on,
          onClick: () => onToggle(k.id),
          className: cn(
            "flex h-11 w-full items-center gap-3 px-3 text-start text-sm outline-none hover:bg-th-elevated focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-th-accent",
            on ? "text-th-hi" : "text-th-hi3"
          ),
          children: [
            /* @__PURE__ */ jsx(Sample, { line: k.line }),
            /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: k.label }),
            /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors", on ? "border-th-accent bg-th-accent" : "border-th-line-strong bg-th-elevated"), children: /* @__PURE__ */ jsx("span", { className: cn("absolute top-0.5 size-3.5 rounded-full transition-all", on ? "start-[18px] bg-th-on-accent" : "start-0.5 bg-th-hi3 forced-colors:bg-[CanvasText]") }) })
          ]
        },
        k.id
      );
    }) }) : null
  ] });
});
export {
  EdgeLegend
};
