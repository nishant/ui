"use client";

// src/components/segmented.tsx
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../cn.js";
import { useScrollEdges } from "./layout-vars.js";
import { revealInRow } from "./nav.js";
import { keyboardFocused, touchTracker } from "./overlay-classes.js";
import { FloatingTip } from "./tooltip.js";
import { isRtl } from "./client.js";
import { SEGMENTED_SELECTED, SEGMENTED_SIZE, setRef } from "./forms-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
function Segmented({
  ref,
  label,
  options,
  value: valueProp,
  defaultValue,
  onChange,
  onValueChange,
  name,
  form,
  required,
  size = "sm",
  block = false,
  overflow = "scroll",
  fullWidth = false,
  className,
  onKeyDown,
  ...rest
}) {
  const [own, setOwn] = useState(defaultValue);
  const controlled = valueProp !== void 0;
  const value = controlled ? valueProp : own;
  const fill = block || fullWidth;
  const scroll = overflow === "scroll";
  const groupRef = useRef(null);
  useScrollEdges(groupRef);
  const refs = useRef([]);
  const tipAnchor = useRef(null);
  const [tipAt, setTipAt] = useState(null);
  const tipId = useId();
  const [touch] = useState(touchTracker);
  const showTip = (i) => {
    if (options[i]?.tip == null) return;
    tipAnchor.current = refs.current[i];
    setTipAt(i);
  };
  const hideTip = (i) => setTipAt((cur) => cur === i ? null : cur);
  const enabled = options.map((o, i) => o.disabled ? -1 : i).filter((i) => i >= 0);
  const selected = options.findIndex((o) => o.value === value);
  useEffect(() => {
    const el = selected >= 0 ? refs.current[selected] : null;
    if (scroll && el && groupRef.current) revealInRow(groupRef.current, el);
  }, [selected, scroll, options.length]);
  const pick = (i) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (!controlled) setOwn(o.value);
    onChange?.(o.value);
    onValueChange?.(o.value);
    refs.current[i]?.focus();
  };
  const move = (from, dir) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(from);
    const next = pos < 0 ? enabled[dir === 1 ? 0 : enabled.length - 1] : enabled[(pos + dir + enabled.length) % enabled.length];
    pick(next);
  };
  const tabStop = selected >= 0 && !options[selected].disabled ? selected : enabled[0] ?? -1;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref: (node) => {
        groupRef.current = node;
        setRef(ref, node);
      },
      role: "radiogroup",
      "aria-label": label,
      "aria-required": required || void 0,
      className: cn(
        "rounded-lg border border-th-line bg-th-elevated p-0.5",
        fill ? "flex w-full" : "inline-flex",
        scroll && "max-w-full overflow-x-auto nish-no-scrollbar nish-scroll-fade",
        className
      ),
      onKeyDown: (e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const rtl = isRtl(groupRef.current);
        const from = refs.current.findIndex((el) => el === document.activeElement);
        const at = from >= 0 ? from : selected;
        if (e.key === "Escape" && tipAt != null) {
          setTipAt(null);
          return;
        }
        if (e.key === (rtl ? "ArrowLeft" : "ArrowRight") || e.key === "ArrowDown") {
          e.preventDefault();
          move(at, 1);
        } else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft") || e.key === "ArrowUp") {
          e.preventDefault();
          move(at, -1);
        } else if (e.key === "Home") {
          e.preventDefault();
          if (enabled.length) pick(enabled[0]);
        } else if (e.key === "End") {
          e.preventDefault();
          if (enabled.length) pick(enabled[enabled.length - 1]);
        }
      },
      children: [
        options.map((o, i) => {
          const on = o.value === value;
          const tipShown = tipAt === i && o.tip != null;
          return /* @__PURE__ */ jsx(
            "button",
            {
              ref: (el) => {
                refs.current[i] = el;
              },
              type: "button",
              role: "radio",
              "aria-checked": on,
              "aria-label": o.ariaLabel,
              "aria-describedby": tipShown ? tipId : void 0,
              "data-state": on ? "checked" : "unchecked",
              "data-disabled": o.disabled ? "" : void 0,
              title: o.tip != null ? void 0 : o.title,
              disabled: o.disabled,
              tabIndex: i === tabStop ? 0 : -1,
              onClick: () => pick(i),
              onPointerEnter: touch.onPointer,
              onPointerDown: (e) => {
                touch.onPointer(e);
                setTipAt(null);
              },
              onMouseEnter: o.tip != null ? () => !touch.recent() && showTip(i) : void 0,
              onMouseLeave: o.tip != null ? () => hideTip(i) : void 0,
              onFocus: o.tip != null ? (e) => keyboardFocused(e.currentTarget) && showTip(i) : void 0,
              onBlur: o.tip != null ? () => hideTip(i) : void 0,
              className: cn(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium tabular-nums transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11",
                "disabled:cursor-not-allowed disabled:text-th-ghost forced-colors:disabled:text-[color:GrayText]",
                fill && (scroll ? "flex-1 shrink-0" : "min-w-0 flex-1"),
                scroll && !fill && "shrink-0",
                SEGMENTED_SIZE[size],
                on ? SEGMENTED_SELECTED[o.tone ?? "accent"] : "text-th-hi2 hover:text-th-hi disabled:hover:text-th-ghost"
              ),
              children: o.label
            },
            o.value
          );
        }),
        name != null ? options.map((o) => /* @__PURE__ */ jsx(
          "input",
          {
            type: "radio",
            "aria-hidden": "true",
            tabIndex: -1,
            className: "sr-only pointer-events-none",
            name,
            value: o.value,
            form,
            required,
            checked: o.value === value,
            onChange: () => {
            }
          },
          o.value
        )) : null,
        tipAt != null && options[tipAt]?.tip != null ? /* @__PURE__ */ jsx(FloatingTip, { anchor: tipAnchor, id: tipId, tip: options[tipAt].tip }, tipAt) : null
      ]
    }
  );
}
export {
  Segmented
};
