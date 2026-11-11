"use client";

// src/components/accordion.tsx
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useId,
  useState
} from "react";
import { cn } from "../cn.js";
import { useStrings } from "./provider.js";
import { ACCORDION_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var Ctx = /* @__PURE__ */ createContext(null);
function toArray(v) {
  if (Array.isArray(v)) return v;
  return v ? [v] : [];
}
function Accordion(props) {
  const {
    type = "single",
    value: valueProp,
    defaultValue,
    onValueChange,
    collapsible = false,
    headingLevel = 3,
    disabled = false,
    label,
    children,
    className,
    ref,
    ...rest
  } = props;
  const strings = useStrings(ACCORDION_STRINGS);
  const idBase = useId();
  const [state, setState] = useState(() => toArray(defaultValue));
  const controlled = valueProp !== void 0;
  const open = controlled ? toArray(valueProp) : state;
  const toggle = useCallback(
    (v) => {
      let next;
      if (type === "multiple") next = open.includes(v) ? open.filter((x) => x !== v) : [...open, v];
      else if (open.includes(v)) next = collapsible ? [] : open;
      else next = [v];
      if (next === open) return;
      if (!controlled) setState(next);
      onValueChange?.(type === "multiple" ? next : next[0] ?? "");
    },
    [type, open, collapsible, controlled, onValueChange]
  );
  return /* @__PURE__ */ jsx(Ctx.Provider, { value: { idBase, open, toggle, headingLevel, disabled }, children: /* @__PURE__ */ jsx(
    "div",
    {
      role: "group",
      "aria-label": label ?? strings.accordion,
      "data-accordion": "",
      "data-disabled": disabled ? "" : void 0,
      ...rest,
      ref,
      className: cn("w-full min-w-0 divide-y divide-th-line overflow-hidden rounded-xl border border-th-line", className),
      children
    }
  ) });
}
var TRIGGER = "[data-accordion-trigger]:not(:disabled)";
function AccordionItem({ value, title, children, disabled: disabledProp = false, className, ref, ...rest }) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("AccordionItem must be used inside an Accordion");
  const disabled = disabledProp || ctx.disabled;
  const isOpen = ctx.open.includes(value);
  const itemId = useId().replace(/:/g, "");
  const slug = `${ctx.idBase}-${itemId}`;
  const triggerId = `${slug}-trigger`;
  const panelId = `${slug}-panel`;
  function onKeyDown(e) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const root = e.currentTarget.closest("[data-accordion]");
    if (!root) return;
    const all = Array.from(root.querySelectorAll(TRIGGER));
    if (all.length === 0) return;
    const at = all.indexOf(e.currentTarget);
    let to;
    if (e.key === "Home") to = 0;
    else if (e.key === "End") to = all.length - 1;
    else if (e.key === "ArrowDown") to = (at + 1) % all.length;
    else to = (at - 1 + all.length) % all.length;
    e.preventDefault();
    all[to].focus();
  }
  const state = isOpen ? "open" : "closed";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-state": state,
      "data-disabled": disabled ? "" : void 0,
      ...rest,
      ref,
      className: cn("bg-th-surface", className),
      children: [
        createElement(
          `h${ctx.headingLevel}`,
          { className: "m-0 text-sm font-semibold" },
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              id: triggerId,
              "data-accordion-trigger": "",
              "data-state": state,
              "data-disabled": disabled ? "" : void 0,
              "aria-expanded": isOpen,
              "aria-controls": panelId,
              disabled,
              onClick: () => ctx.toggle(value),
              onKeyDown,
              className: cn(
                "flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 text-start text-th-hi transition-colors duration-150",
                "hover:bg-th-elevated/60 disabled:cursor-not-allowed disabled:text-th-ghost disabled:hover:bg-transparent pointer-coarse:min-h-11"
              ),
              children: [
                /* @__PURE__ */ jsx("span", { className: "min-w-0", children: title }),
                /* @__PURE__ */ jsx(
                  "svg",
                  {
                    width: 16,
                    height: 16,
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: 2,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    "aria-hidden": "true",
                    focusable: "false",
                    className: cn("shrink-0 text-th-hi3 transition-transform duration-200 motion-reduce:transition-none", isOpen && "rotate-180"),
                    children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" })
                  }
                )
              ]
            }
          )
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            id: panelId,
            role: "region",
            "aria-labelledby": triggerId,
            "data-state": state,
            inert: !isOpen,
            className: cn(
              "grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none",
              isOpen ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]"
            ),
            children: /* @__PURE__ */ jsx("div", { className: "min-h-0 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "px-4 pb-4 text-sm text-th-hi2", children }) })
          }
        )
      ]
    }
  );
}
export {
  Accordion,
  AccordionItem
};
