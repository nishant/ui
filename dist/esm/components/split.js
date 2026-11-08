"use client";

// src/components/split.tsx
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { presetOptions } from "./split-classes.js";
import {
  computeDividers,
  computeRects,
  resizeAt
} from "../split-layout.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { useMediaQuery } from "./hooks.js";
import { ScrollRow } from "./nav.js";
import { Tooltip } from "./tooltip.js";
import { useNishStrings } from "./provider.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function nodeAt(node, path) {
  let cur = node;
  for (const i of path) {
    if (!cur || cur.type !== "split") return null;
    cur = cur.children[i] ?? null;
  }
  return cur;
}
function leafSlots(node) {
  return node.type === "leaf" ? [node.slot] : node.children.flatMap(leafSlots);
}
function equalizeAt(node, path) {
  if (node.type !== "split") return node;
  if (path.length === 0) {
    const n = node.children.length;
    return { ...node, sizes: node.children.map(() => 1 / n) };
  }
  const [head, ...rest] = path;
  return {
    ...node,
    children: node.children.map((c, i) => i === head ? equalizeAt(c, rest) : c)
  };
}
function SplitDividers({ layout, w, h, gap, onResize, onDragChange, minPane, barInset = 0, rtl = false, paneId }) {
  const strings = useNishStrings();
  const coarse = useMediaQuery("(pointer: coarse)");
  const drag = useRef(null);
  const hit = coarse ? 44 : 24;
  const baseMin = minPane ?? { w: 160, h: 90 };
  const onDragChangeRef = useRef(onDragChange);
  useEffect(() => {
    onDragChangeRef.current = onDragChange;
  });
  useEffect(
    () => () => {
      if (drag.current) {
        drag.current = null;
        onDragChangeRef.current?.(false);
      }
    },
    []
  );
  const dividers = computeDividers(layout, w, h, gap);
  const splitLength = (d) => {
    const node = nodeAt(layout, d.path);
    if (!node) return d.dir === "row" ? w : h;
    const rects = computeRects(layout, w, h, gap);
    const own = leafSlots(node).map((s) => rects[s]).filter((r) => !!r);
    if (own.length === 0) return d.dir === "row" ? w : h;
    if (d.dir === "row") return Math.max(...own.map((r) => r.x + r.w)) - Math.min(...own.map((r) => r.x));
    return Math.max(...own.map((r) => r.y + r.h)) - Math.min(...own.map((r) => r.y));
  };
  const minFor = (d) => {
    const node = nodeAt(layout, d.path);
    const n = node && node.type === "split" ? Math.max(node.children.length, 1) : 1;
    const len = splitLength(d);
    const room = Math.max(0, len - gap * (n - 1));
    const cap = room / n * 0.5;
    return d.dir === "row" ? { w: Math.min(baseMin.w, cap), h: baseMin.h } : { w: baseMin.w, h: Math.min(baseMin.h, cap) };
  };
  const fraction = (d) => {
    const node = nodeAt(layout, d.path);
    return node && node.type === "split" ? node.sizes[d.index] ?? 0.5 : 0.5;
  };
  const down = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, layout };
    onDragChange?.(true);
  };
  const move = (e, d) => {
    const start = drag.current;
    if (!start || start.pointerId !== e.pointerId) return;
    const delta = d.dir === "row" ? rtl ? start.x - e.clientX : e.clientX - start.x : e.clientY - start.y;
    if (delta === 0) return;
    onResize(resizeAt(start.layout, d.path, d.index, delta, w, h, gap, minFor(d)));
  };
  const up = (e) => {
    const start = drag.current;
    if (!start || start.pointerId !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    onDragChange?.(false);
  };
  const reset = (d) => onResize(equalizeAt(layout, d.path));
  const key = (e, d) => {
    const horizontal = d.dir === "row";
    const dec = horizontal ? rtl ? "ArrowRight" : "ArrowLeft" : "ArrowUp";
    const inc = horizontal ? rtl ? "ArrowLeft" : "ArrowRight" : "ArrowDown";
    if (e.key === dec || e.key === inc) {
      e.preventDefault();
      const step = (e.key === inc ? 1 : -1) * 0.02;
      onResize(resizeAt(layout, d.path, d.index, step * splitLength(d), w, h, gap, minFor(d)));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const far = (e.key === "End" ? 1 : -1) * (w + h);
      onResize(resizeAt(layout, d.path, d.index, far, w, h, gap, minFor(d)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      reset(d);
    }
  };
  const perDir = { row: dividers.filter((d) => d.dir === "row").length, col: dividers.filter((d) => d.dir === "col").length };
  const seen = { row: 0, col: 0 };
  const controls = (d) => {
    if (!paneId) return void 0;
    const node = nodeAt(layout, d.path);
    if (!node || node.type !== "split") return void 0;
    const sides = [node.children[d.index], node.children[d.index + 1]];
    const ids = sides.flatMap((c) => c ? leafSlots(c) : []).map((slot) => paneId(slot));
    const list = ids.filter((id) => !!id);
    return list.length > 0 ? list.join(" ") : void 0;
  };
  return /* @__PURE__ */ jsx(Fragment, { children: dividers.map((d) => {
    const vertical = d.dir === "row";
    const pad = (hit - (vertical ? d.w : d.h)) / 2;
    const x = rtl ? w - d.x - d.w : d.x;
    const style = vertical ? { left: x - pad, top: d.y + barInset, width: d.w + pad * 2, height: Math.max(0, d.h - barInset) } : { left: x, top: d.y - (barInset > 0 ? pad * 2 : pad), width: d.w, height: d.h + pad * 2 };
    const base = vertical ? strings.resizeColumns : strings.resizeRows;
    const nth = ++seen[d.dir];
    const pct = Math.round(fraction(d) * 100);
    return /* @__PURE__ */ jsx(
      "div",
      {
        role: "separator",
        "aria-orientation": vertical ? "vertical" : "horizontal",
        "aria-label": perDir[d.dir] > 1 ? `${base} ${nth}` : base,
        "aria-controls": controls(d),
        "aria-valuenow": pct,
        "aria-valuetext": `${pct}%`,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        tabIndex: 0,
        onPointerDown: down,
        onPointerMove: (e) => move(e, d),
        onPointerUp: up,
        onPointerCancel: up,
        onKeyDown: (e) => key(e, d),
        onDoubleClick: () => reset(d),
        style: { ...style, touchAction: "none" },
        className: cn(
          "group absolute z-20 flex items-center justify-center outline-none",
          vertical ? "cursor-col-resize" : "cursor-row-resize"
        ),
        children: /* @__PURE__ */ jsx(
          "span",
          {
            className: cn(
              "rounded-full bg-th-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 forced-colors:bg-[Highlight]",
              vertical ? "h-full w-1" : "h-1 w-full"
            )
          }
        )
      },
      `${d.path.join(".")}:${d.index}`
    );
  }) });
}
function SplitStage({
  layout,
  items,
  slots,
  gap = 4,
  resizable = false,
  onLayoutChange,
  renderPane,
  onSize,
  dragging = false,
  animate = true,
  minPane,
  barInset,
  children,
  className,
  ref: forwardedRef,
  ...rest
}) {
  const ref = useRef(null);
  const setRef = useCallback(
    (node) => {
      ref.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );
  const paneBase = useId();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [rtl, setRtl] = useState(false);
  const [resizing, setResizing] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const showDividers = resizable && !!layout && slots.length > 1;
  if (!showDividers && resizing) setResizing(false);
  const onSizeRef = useRef(onSize);
  useEffect(() => {
    onSizeRef.current = onSize;
  });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      setSize((prev) => prev.w === w && prev.h === h ? prev : { w, h });
      const mirrored = isRtl(el);
      setRtl((prev) => prev === mirrored ? prev : mirrored);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    onSizeRef.current?.(size);
  }, [size]);
  const measured = size.w > 0 && size.h > 0;
  const rects = layout && measured ? computeRects(layout, size.w, size.h, gap) : [];
  const active = dragging || resizing;
  const move = animate && !reduced && !active;
  const transition = move ? "left 180ms ease-out, top 180ms ease-out, width 180ms ease-out, height 180ms ease-out" : "none";
  return /* @__PURE__ */ jsxs("div", { ...rest, ref: setRef, className: cn("relative overflow-hidden", className), ...active ? { "data-dragging": "" } : {}, children: [
    layout && // DOM order follows `items`, not slot order, so a swap never moves a node.
    items.map((id) => {
      const slot = slots.indexOf(id);
      const rect = slot >= 0 ? rects[slot] : void 0;
      if (!rect) return null;
      return /* @__PURE__ */ jsx(
        "div",
        {
          id: `${paneBase}-pane-${slot}`,
          "data-split-pane": id,
          style: {
            position: "absolute",
            left: rtl ? size.w - rect.x - rect.w : rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            transition
          },
          children: renderPane(id, { rect, slot })
        },
        id
      );
    }),
    showDividers && measured && layout && /* @__PURE__ */ jsx(
      SplitDividers,
      {
        layout,
        w: size.w,
        h: size.h,
        gap,
        onResize: (next) => onLayoutChange?.(next),
        onDragChange: setResizing,
        rtl,
        paneId: (slot) => slots[slot] !== void 0 && items.includes(slots[slot]) ? `${paneBase}-pane-${slot}` : void 0,
        ...minPane ? { minPane } : {},
        ...barInset ? { barInset } : {}
      }
    ),
    children
  ] });
}
function LayoutPresetIcon({ node, width = 56, height = 36, className, ref, ...rest }) {
  const rects = computeRects(node, width - 4, height - 4, 2);
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      fill: "none",
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      ref,
      ...className ? { className } : {},
      children: rects.map((r, i) => /* @__PURE__ */ jsx(
        "rect",
        {
          x: r.x + 2.5,
          y: r.y + 2.5,
          width: Math.max(r.w - 1, 1),
          height: Math.max(r.h - 1, 1),
          rx: 2,
          fill: "currentColor",
          fillOpacity: 0.14,
          stroke: "currentColor",
          strokeWidth: 1.5
        },
        i
      ))
    }
  );
}
function LayoutPresetPicker({
  options,
  value,
  onChange,
  actions,
  note,
  overlay = false,
  className,
  label: labelProp,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const label = labelProp ?? strings.layoutPresets;
  const group = useRef(null);
  const onKeyDown = (e) => {
    const n = options.length;
    if (n === 0) return;
    let to = -1;
    const cur = Math.max(0, options.findIndex((o) => o.id === value));
    const rtl = isRtl(group.current);
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const backward = rtl ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward || e.key === "ArrowDown") to = (cur + 1) % n;
    else if (e.key === backward || e.key === "ArrowUp") to = (cur - 1 + n) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    const next = options[to];
    if (!next) return;
    onChange(next.id);
    group.current?.querySelectorAll('[role="radio"]')[to]?.focus();
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      className: cn(
        "flex shrink-0 items-center gap-3 border-b border-th-line px-3 py-2",
        overlay ? "bg-th-surface/85 shadow-lg backdrop-blur-md" : "bg-th-surface",
        className
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsx(ScrollRow, { label, children: /* @__PURE__ */ jsx(
          "div",
          {
            ref: group,
            role: "radiogroup",
            "aria-label": label,
            onKeyDown,
            className: "flex items-start gap-1",
            children: options.map((o, i) => {
              const on = value === o.id;
              const hasValue = options.some((x) => x.id === value);
              return /* @__PURE__ */ jsx(Tooltip, { tip: o.hint, side: "bottom", focusable: false, children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": on,
                  tabIndex: on || !hasValue && i === 0 ? 0 : -1,
                  "aria-label": `${o.label}: ${o.hint}`,
                  "data-state": on ? "checked" : "unchecked",
                  onClick: () => onChange(o.id),
                  className: cn(
                    "flex min-h-11 shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-1 text-xs",
                    "focus-visible:outline-2 focus-visible:outline-th-accent",
                    on ? "border-th-accent bg-th-accent-soft text-th-hi forced-color-adjust-none forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]" : "border-transparent text-th-hi3 hover:bg-th-elevated hover:text-th-hi2 forced-colors:border-[ButtonText]"
                  ),
                  children: [
                    /* @__PURE__ */ jsx(LayoutPresetIcon, { node: o.node }),
                    /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap", children: o.label })
                  ]
                }
              ) }, o.id);
            })
          }
        ) }) }),
        actions,
        note ? /* @__PURE__ */ jsx("p", { className: "hidden shrink-0 text-xs text-th-hi3 lg:block", children: note }) : null
      ]
    }
  );
}
export {
  LayoutPresetIcon,
  LayoutPresetPicker,
  SplitDividers,
  SplitStage,
  presetOptions
};
