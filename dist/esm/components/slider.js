"use client";

// src/components/slider.tsx
import {
  useId,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { useLatest } from "./latest.js";
import { useStrings } from "./provider.js";
import { SLIDER_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var decimals = (n) => {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot < 0 ? 0 : s.length - dot - 1;
};
var clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
function snap(v, min, max, step) {
  const s = step > 0 ? step : 1;
  const n = Math.round((v - min) / s) * s + min;
  return clamp(Number(n.toFixed(Math.max(decimals(s), decimals(min)))), min, max);
}
function setRef(ref, node) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}
function useExternalLabelId(root, id, skip) {
  const [labelId, setLabelId] = useState(void 0);
  useIsoLayoutEffect(() => {
    const doc = root.current?.ownerDocument;
    if (skip || !id || !doc) {
      setLabelId(void 0);
      return;
    }
    const label = Array.from(doc.getElementsByTagName("label")).find((l) => l.htmlFor === id);
    if (!label) {
      setLabelId(void 0);
      return;
    }
    if (!label.id) label.id = `${id}-label`;
    setLabelId(label.id);
  }, [id, skip]);
  return labelId;
}
function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  name,
  disabled = false,
  invalid = false,
  formatValue,
  className,
  ref,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...rest
}) {
  const strings = useStrings(SLIDER_STRINGS);
  const auto = useId();
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const thumbs = useRef([null, null]);
  const dragging = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const controlled = value !== void 0;
  const [inner, setInner] = useState(() => defaultValue ?? min);
  const raw = controlled ? value : inner;
  const range = Array.isArray(raw);
  const vals = Array.isArray(raw) ? [snap(Math.min(raw[0], raw[1]), min, max, step), snap(Math.max(raw[0], raw[1]), min, max, step)] : [snap(raw, min, max, step)];
  const live = useRef(vals);
  useIsoLayoutEffect(() => {
    live.current = vals;
  });
  const onChange = useLatest(onValueChange);
  const onCommit = useLatest(onValueCommit);
  const fieldLabelId = useExternalLabelId(rootRef, id, ariaLabel != null || ariaLabelledBy != null);
  const pack = (a) => a.length === 2 ? [a[0], a[1]] : a[0];
  const setThumb = (i, v) => {
    const cur = live.current;
    const lo = i === 1 ? cur[0] : min;
    const hi = i === 0 && cur.length === 2 ? cur[1] : max;
    const next = clamp(snap(v, min, max, step), lo, hi);
    if (next === cur[i]) return false;
    const arr = cur.slice();
    arr[i] = next;
    live.current = arr;
    if (!controlled) setInner(pack(arr));
    onChange.current?.(pack(arr));
    return true;
  };
  const commit = () => onCommit.current?.(pack(live.current));
  const valueAt = (clientX) => {
    const rect = trackRef.current.getBoundingClientRect();
    if (!rect.width) return min;
    let frac = (clientX - rect.left) / rect.width;
    if (isRtl(rootRef.current)) frac = 1 - frac;
    return min + clamp(frac, 0, 1) * (max - min);
  };
  const handlePointerDown = (e) => {
    onPointerDown?.(e);
    if (e.defaultPrevented || disabled || e.button !== 0) return;
    const v = valueAt(e.clientX);
    const cur = live.current;
    let i = 0;
    if (cur.length === 2) {
      if (v <= cur[0]) i = 0;
      else if (v >= cur[1]) i = 1;
      else i = v - cur[0] <= cur[1] - v ? 0 : 1;
    }
    dragging.current = i;
    setDragIndex(i);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
    }
    thumbs.current[i]?.focus();
    setThumb(i, v);
  };
  const handlePointerMove = (e) => {
    onPointerMove?.(e);
    if (dragging.current === null) return;
    setThumb(dragging.current, valueAt(e.clientX));
  };
  const endDrag = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    setDragIndex(null);
    commit();
  };
  const handleKeyDown = (i) => (e) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const cur = live.current[i];
    const rtl = isRtl(rootRef.current);
    const big = step * 10;
    let next = null;
    if (e.key === "ArrowRight") next = cur + (rtl ? -step : step);
    else if (e.key === "ArrowLeft") next = cur + (rtl ? step : -step);
    else if (e.key === "ArrowUp") next = cur + step;
    else if (e.key === "ArrowDown") next = cur - step;
    else if (e.key === "PageUp") next = cur + big;
    else if (e.key === "PageDown") next = cur - big;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    if (setThumb(i, next)) commit();
  };
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const pct = (v) => max > min ? (v - min) / (max - min) * 100 : 0;
  const fillStart = range ? pct(vals[0]) : 0;
  const fillEnd = pct(vals[vals.length - 1]);
  const labelledBy = ariaLabelledBy ?? fieldLabelId;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref: (node) => {
        rootRef.current = node;
        setRef(ref, node);
      },
      id,
      "data-disabled": disabled ? "" : void 0,
      "data-invalid": isInvalid ? "" : void 0,
      "data-dragging": dragIndex !== null ? "" : void 0,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: (e) => {
        onPointerUp?.(e);
        endDrag();
      },
      onPointerCancel: (e) => {
        onPointerCancel?.(e);
        endDrag();
      },
      className: cn(
        "relative flex h-6 w-full touch-none select-none items-center px-2.5 pointer-coarse:h-11",
        disabled && "cursor-not-allowed opacity-50",
        !disabled && "cursor-pointer",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: trackRef,
            className: cn(
              "relative h-1.5 w-full rounded-full border bg-th-elevated",
              isInvalid ? "border-th-loss" : "border-th-line-control",
              "forced-colors:border-[ButtonText] forced-colors:bg-[Canvas]"
            ),
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  "aria-hidden": "true",
                  className: "absolute -inset-y-px rounded-full bg-th-accent forced-colors:bg-[Highlight]",
                  style: { insetInlineStart: `${fillStart}%`, width: `${Math.max(fillEnd - fillStart, 0)}%` }
                }
              ),
              vals.map((v, i) => {
                const name0 = range ? i === 0 ? strings.sliderMin : strings.sliderMax : void 0;
                const thumbId = `${auto}-thumb-${i}`;
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    ref: (node) => {
                      thumbs.current[i] = node;
                    },
                    id: range ? thumbId : void 0,
                    role: "slider",
                    tabIndex: disabled ? void 0 : 0,
                    "aria-valuemin": i === 1 ? vals[0] : min,
                    "aria-valuemax": i === 0 && range ? vals[1] : max,
                    "aria-valuenow": v,
                    "aria-valuetext": formatValue ? formatValue(v, i) : void 0,
                    "aria-disabled": disabled || void 0,
                    "aria-orientation": "horizontal",
                    "aria-label": range ? ariaLabel ? `${ariaLabel} ${name0}` : name0 : ariaLabel,
                    "aria-labelledby": labelledBy ? range ? `${labelledBy} ${thumbId}` : labelledBy : void 0,
                    "aria-describedby": ariaDescribedBy,
                    "data-thumb": i,
                    "data-dragging": dragIndex === i ? "" : void 0,
                    onKeyDown: handleKeyDown(i),
                    className: cn(
                      "absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-th-surface shadow-card outline-none rtl:translate-x-1/2",
                      'before:absolute before:-inset-3 before:content-[""]',
                      isInvalid ? "border-th-loss" : "border-th-accent",
                      "focus-visible:ring-2 focus-visible:ring-th-accent/40 data-[dragging]:z-10 data-[dragging]:scale-110",
                      "transition-transform duration-100 motion-reduce:transition-none",
                      "forced-colors:forced-color-adjust-none forced-colors:border-[Highlight] forced-colors:bg-[Canvas]",
                      "forced-colors:focus-visible:border-[CanvasText] forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]"
                    ),
                    style: { insetInlineStart: `${pct(v)}%` }
                  },
                  i
                );
              })
            ]
          }
        ),
        name ? vals.map((v, i) => /* @__PURE__ */ jsx("input", { type: "hidden", name, value: String(v), disabled }, i)) : null
      ]
    }
  );
}
export {
  Slider
};
