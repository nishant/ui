"use client";

// src/components/tabs.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { isRtl } from "./client.js";
import { useMediaQuery } from "./hooks.js";
import { useScrollEdges } from "./layout-vars.js";
import { revealInRow } from "./nav.js";
import { Badge } from "./primitives.js";
import { tabClass } from "./tabs-classes.js";
import { tabClass as tabClass2 } from "./tabs-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
var BREAKPOINT_QUERY = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)"
};
function useBreakpoint(bp) {
  const matches = useMediaQuery(bp ? BREAKPOINT_QUERY[bp] : "(min-width: 100000px)");
  return bp ? matches : false;
}
function assignRef(ref, el) {
  if (typeof ref === "function") ref(el);
  else if (ref) ref.current = el;
}
function ScrollingList({
  selected,
  children,
  listRef,
  ...rest
}) {
  const ref = useRef(null);
  useScrollEdges(ref);
  useEffect(() => {
    const el = selected >= 0 ? ref.current?.children[selected] : null;
    if (el && ref.current) revealInRow(ref.current, el);
  }, [selected]);
  const setRef = useCallback(
    (el) => {
      assignRef(ref, el);
      assignRef(listRef, el);
    },
    [listRef]
  );
  return /* @__PURE__ */ jsx("div", { ref: setRef, ...rest, children });
}
var Ctx = /* @__PURE__ */ createContext(null);
var tabId = (base, v) => `${base}-tab-${v}`;
var panelId = (base, v) => `${base}-panel-${v}`;
function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  onChange,
  items,
  label,
  variant = "underline",
  size = "md",
  block = false,
  hideFrom,
  idBase,
  controlsPanels,
  children,
  className,
  ref,
  onKeyDown,
  ...rest
}) {
  const auto = useId();
  const wide = useBreakpoint(hideFrom);
  const base = idBase ?? auto.replace(/:/g, "");
  const refs = useRef([]);
  const enabled = items.map((t, i) => t.disabled ? -1 : i).filter((i) => i >= 0);
  const [inner, setInner] = useState(() => defaultValue ?? items.find((t) => !t.disabled)?.value ?? "");
  const value = valueProp ?? inner;
  const selected = items.findIndex((t) => t.value === value);
  const tabStop = selected >= 0 && !items[selected].disabled ? selected : enabled[0] ?? -1;
  const linked = controlsPanels ?? children != null;
  const pick = (i) => {
    const t = items[i];
    if (!t || t.disabled) return;
    if (valueProp === void 0) setInner(t.value);
    onValueChange?.(t.value);
    onChange?.(t.value);
    refs.current[i]?.focus();
  };
  const move = (dir) => {
    if (!enabled.length) return;
    const from = refs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(from >= 0 ? from : selected);
    pick(pos < 0 ? enabled[0] : enabled[(pos + dir + enabled.length) % enabled.length]);
  };
  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const forward = isRtl(e.currentTarget) ? "ArrowLeft" : "ArrowRight";
    const backward = isRtl(e.currentTarget) ? "ArrowRight" : "ArrowLeft";
    if (e.key === forward) {
      e.preventDefault();
      move(1);
    } else if (e.key === backward) {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (enabled.length) pick(enabled[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      if (enabled.length) pick(enabled[enabled.length - 1]);
    }
  };
  const list = /* @__PURE__ */ jsx(
    ScrollingList,
    {
      ...rest,
      listRef: ref,
      selected,
      role: "tablist",
      "aria-label": label,
      className: cn(
        "flex max-w-full items-end overflow-x-auto nish-no-scrollbar nish-scroll-fade",
        block && "w-full",
        variant === "underline" ? cn(block ? "gap-1" : "gap-5", "shadow-[inset_0_-1px_0_var(--nish-line)]") : "gap-1",
        className
      ),
      onKeyDown: handleKeyDown,
      children: items.map((t, i) => {
        const on = t.value === value;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            ref: (el) => {
              refs.current[i] = el;
            },
            type: "button",
            role: "tab",
            id: tabId(base, t.value),
            "aria-selected": on,
            "aria-controls": linked ? panelId(base, t.value) : void 0,
            "data-state": on ? "active" : "inactive",
            "data-disabled": t.disabled ? "" : void 0,
            tabIndex: i === tabStop ? 0 : -1,
            disabled: t.disabled,
            onClick: () => pick(i),
            className: tabClass({ active: on, variant, size, block, className: t.sub != null ? "h-auto py-1.5" : void 0 }),
            children: [
              /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                t.label,
                t.count != null ? /* @__PURE__ */ jsx(Badge, { tone: on ? "accent" : "neutral", size: "xs", className: "tabular-nums", children: t.count }) : null
              ] }),
              t.sub != null ? /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-th-hi3", children: t.sub }) : null
            ]
          },
          t.value
        );
      })
    }
  );
  if (children == null) return wide ? null : list;
  return /* @__PURE__ */ jsxs(Ctx.Provider, { value: { idBase: base, value }, children: [
    wide ? null : list,
    children
  ] });
}
function TabPanel({ value, idBase, active, showFrom, keepMounted = false, children, className, ref, ...rest }) {
  const ctx = useContext(Ctx);
  const wide = useBreakpoint(showFrom);
  const base = idBase ?? ctx?.idBase ?? "";
  const shown = active ?? ctx?.value === value;
  if (wide) {
    return /* @__PURE__ */ jsx("div", { ...rest, ref, className, children });
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "tabpanel",
      id: panelId(base, value),
      "aria-labelledby": tabId(base, value),
      tabIndex: 0,
      hidden: !shown,
      "data-state": shown ? "active" : "inactive",
      ...rest,
      ref,
      className: cn("focus-visible:outline-offset-4", className),
      children: shown || keepMounted ? children : null
    }
  );
}
export {
  TabPanel,
  Tabs,
  tabClass2 as tabClass
};
