"use client";

// src/components/canvas/node.tsx
import { memo, useRef } from "react";
import { useIsoLayoutEffect } from "../client.js";
import { TickerText } from "../flow.js";
import { useNishStrings } from "../provider.js";
import { KIND_ICON, Svg } from "./icons.js";
import { jsx, jsxs } from "react/jsx-runtime";
function hueStyle(hue) {
  return {
    "--c": hue ? `var(--nish-${hue})` : "var(--nish-accent)",
    "--c-soft": hue ? `var(--nish-${hue}-soft)` : "var(--nish-accent-soft)"
  };
}
var clamp01 = (n) => n == null || !Number.isFinite(n) ? 0 : Math.min(1, Math.max(0, n));
function usePing(active) {
  const ref = useRef(null);
  const prev = useRef(active);
  useIsoLayoutEffect(() => {
    const was = prev.current;
    prev.current = active;
    const el = ref.current;
    if (!el || was || !active) return;
    el.removeAttribute("data-fx");
    void el.offsetWidth;
    el.setAttribute("data-fx", "ping");
    const timer = setTimeout(() => el.removeAttribute("data-fx"), 450);
    return () => clearTimeout(timer);
  }, [active]);
  return ref;
}
var NodeView = memo(
  function NodeView2({ node, groupTitle, hue, box, selected, dim, delay, onSelect }) {
    const strings = useNishStrings();
    const active = !!node.active;
    const heat = clamp01(node.heat);
    const ref = usePing(active);
    const count = node.count ?? 0;
    const style = {
      ...hueStyle(hue),
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      "--nish-canvas-delay": `${delay}ms`
    };
    if (!active && heat > 0) {
      const vars = style;
      vars["--nish-canvas-heat-line"] = `color-mix(in srgb, var(--c) ${Math.round(heat * 70)}%, var(--nish-line))`;
      vars["--nish-canvas-heat-glow"] = `0 0 ${Math.round(6 + heat * 16)}px color-mix(in srgb, var(--c) ${Math.round(heat * 60)}%, transparent)`;
    }
    const shown = active && node.note ? node.note : node.detail;
    const aria = `${node.label}${shown ? ` ${shown}` : ""}${count > 1 ? ` ${count}` : ""}, ${groupTitle}${active ? `, ${strings.live}` : ""}`;
    return /* @__PURE__ */ jsx("div", { className: "nish-canvas-slot", style, "data-active": active || void 0, "data-dim": dim || void 0, children: /* @__PURE__ */ jsxs(
      "button",
      {
        ref,
        type: "button",
        className: "nish-canvas-node",
        "data-canvas-id": node.id,
        "data-active": active || void 0,
        "data-selected": selected || void 0,
        "data-heat": heat > 0 || void 0,
        "aria-label": aria,
        title: node.detail || void 0,
        "aria-pressed": selected,
        onClick: () => onSelect?.(node.id, "node"),
        children: [
          node.kind ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsx(Svg, { children: KIND_ICON[node.kind] }) }) : null,
          /* @__PURE__ */ jsxs("span", { className: "nish-canvas-text", children: [
            /* @__PURE__ */ jsx("span", { className: "nish-canvas-label", children: node.label }),
            active && node.note ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-note", "aria-hidden": "true", children: /* @__PURE__ */ jsx(TickerText, { text: node.note, as: "span" }) }) : node.detail ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-detail", children: node.detail }) : null
          ] }),
          count > 1 ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-count", children: count }) : null,
          active ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-live", "aria-hidden": "true" }) : null
        ]
      }
    ) });
  },
  (a, b) => a.groupTitle === b.groupTitle && a.hue === b.hue && a.selected === b.selected && a.dim === b.dim && a.delay === b.delay && a.onSelect === b.onSelect && a.box.x === b.box.x && a.box.y === b.box.y && a.node.id === b.node.id && a.node.label === b.node.label && a.node.kind === b.node.kind && a.node.detail === b.node.detail && a.node.active === b.node.active && a.node.note === b.node.note && a.node.count === b.node.count && Math.round(clamp01(a.node.heat) * 100) === Math.round(clamp01(b.node.heat) * 100)
);
export {
  NodeView,
  clamp01,
  hueStyle
};
