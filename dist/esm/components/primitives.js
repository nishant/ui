"use client";

// src/components/primitives.tsx
import {
  useId
} from "react";
import { cn } from "../cn.js";
import { ChevronDownIcon, LoaderIcon } from "./icons.js";
import {
  BUTTON_DISABLED,
  DOT_HUE,
  DOT_TONE,
  LINK_DISABLED,
  SELECT_SIZE,
  badgeClass,
  buttonClass,
  cardClass,
  fieldClass,
  iconButtonClass,
  resolvePadding
} from "./primitives-classes.js";
import {
  FIELD,
  badgeClass as badgeClass2,
  buttonClass as buttonClass2,
  cardClass as cardClass2,
  fieldClass as fieldClass2,
  iconButtonClass as iconButtonClass2,
  linkClass,
  revealClass
} from "./primitives-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
var warned = /* @__PURE__ */ new Set();
function warnOnce(message) {
  if (globalThis.process?.env?.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(`nish-ui: ${message}`);
}
function Button({
  variant = "secondary",
  size = "md",
  inline = false,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ref,
  ...rest
}) {
  const off = !!disabled || loading;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ref,
      type,
      disabled: off,
      "aria-busy": loading || void 0,
      "data-disabled": off ? "" : void 0,
      className: buttonClass({
        variant,
        size,
        inline,
        className: cn(variant === "link" ? LINK_DISABLED : BUTTON_DISABLED, className)
      }),
      ...rest,
      children: [
        loading ? /* @__PURE__ */ jsx(
          LoaderIcon,
          {
            size: size === "xs" || size === "sm" ? 12 : 14,
            className: "animate-spin motion-reduce:animate-pulse",
            "data-nish-spin": ""
          }
        ) : icon,
        children
      ]
    }
  );
}
function IconButton({
  label,
  size = "md",
  active,
  variant = "ghost",
  tone = "neutral",
  className,
  children,
  type = "button",
  disabled,
  ref,
  ...rest
}) {
  if (!label && !rest["aria-label"] && !rest["aria-labelledby"]) {
    warnOnce("<IconButton> has no `label`. An icon-only button needs an accessible name.");
  }
  const pressed = active === true;
  return /* @__PURE__ */ jsx(
    "button",
    {
      ref,
      type,
      disabled,
      "aria-label": label,
      title: label,
      "aria-pressed": active === void 0 ? void 0 : pressed,
      "data-state": active === void 0 ? void 0 : pressed ? "active" : "inactive",
      "data-disabled": disabled ? "" : void 0,
      className: iconButtonClass({ size, variant, tone, active: pressed, className }),
      ...rest,
      children
    }
  );
}
function CardHeader({
  title,
  description,
  action,
  icon,
  as: Heading = "h2",
  divided = false,
  titleId,
  className,
  ref,
  ...rest
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-2",
        divided && "border-b border-th-line px-4 py-3",
        className
      ),
      ...rest,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-start gap-2", children: [
          icon ? /* @__PURE__ */ jsx("span", { className: "mt-0.5 inline-flex shrink-0 text-th-hi3", "aria-hidden": "true", children: icon }) : null,
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx(Heading, { id: titleId, className: "text-sm font-semibold text-th-hi", children: title }),
            description ? /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-xs text-th-hi3", children: description }) : null
          ] })
        ] }),
        action ? /* @__PURE__ */ jsx("div", { className: "flex shrink-0 flex-wrap items-center gap-2", children: action }) : null
      ]
    }
  );
}
function Card({
  as = "div",
  padding,
  padded,
  interactive = false,
  variant = "surface",
  title,
  description,
  action,
  className,
  children,
  ref,
  ...rest
}) {
  const Tag = as;
  const pad = resolvePadding(padding, padded);
  const headingId = useId();
  const region = title != null && (as === "section" || as === "article" || as === "aside");
  return /* @__PURE__ */ jsxs(
    Tag,
    {
      ref,
      "aria-labelledby": region && !rest["aria-label"] && !rest["aria-labelledby"] ? headingId : void 0,
      className: cardClass({ padding: pad, interactive, variant, className }),
      ...rest,
      children: [
        title != null ? /* @__PURE__ */ jsx(
          CardHeader,
          {
            title,
            description,
            action,
            titleId: headingId,
            divided: pad === "none",
            className: pad === "none" ? void 0 : "mb-3"
          }
        ) : null,
        children
      ]
    }
  );
}
function Badge({
  tone = "neutral",
  hue,
  size = "sm",
  variant = "pill",
  dot = false,
  className,
  children,
  ref,
  ...rest
}) {
  return /* @__PURE__ */ jsxs("span", { ref, className: badgeClass({ tone, hue, size, variant, className }), ...rest, children: [
    dot ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: cn("inline-block size-1.5 shrink-0 rounded-full", hue ? DOT_HUE[hue] : DOT_TONE[tone]) }) : null,
    children
  ] });
}
function Input({ invalid, size = "md", leading, trailing, wrapperClassName, className, ref, ...rest }) {
  const input = /* @__PURE__ */ jsx(
    "input",
    {
      ref,
      "aria-invalid": invalid || void 0,
      className: fieldClass({ size, className: cn(leading != null && "ps-8", trailing != null && "pe-8 pointer-coarse:pe-12", className) }),
      ...rest
    }
  );
  if (leading == null && trailing == null) return input;
  return /* @__PURE__ */ jsxs("span", { className: cn("relative inline-flex w-full min-w-0 items-center", wrapperClassName), children: [
    leading != null ? /* @__PURE__ */ jsx("span", { className: "pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center text-sm text-th-hi2", children: leading }) : null,
    input,
    trailing != null ? /* @__PURE__ */ jsx("span", { className: "absolute inset-y-0 end-0 flex min-w-8 items-center justify-center pe-0.5 text-sm text-th-hi2", children: trailing }) : null
  ] });
}
function Select({ invalid, size = "md", selectClassName, className, children, ref, ...rest }) {
  const s = SELECT_SIZE[size];
  return /* @__PURE__ */ jsxs("span", { className: cn("relative inline-flex w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx(
      "select",
      {
        ref,
        "aria-invalid": invalid || void 0,
        className: fieldClass({ size, className: cn("appearance-none", s.pad, selectClassName) }),
        ...rest,
        children
      }
    ),
    /* @__PURE__ */ jsx(
      ChevronDownIcon,
      {
        size: s.icon,
        className: cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3", s.chevron)
      }
    )
  ] });
}
function Label({ className, ref, ...rest }) {
  return /* @__PURE__ */ jsx("span", { ref, className: cn("text-xs font-medium uppercase tracking-wider text-th-hi3", className), ...rest });
}
export {
  Badge,
  Button,
  Card,
  CardHeader,
  FIELD,
  IconButton,
  Input,
  Label,
  Select,
  badgeClass2 as badgeClass,
  buttonClass2 as buttonClass,
  cardClass2 as cardClass,
  fieldClass2 as fieldClass,
  iconButtonClass2 as iconButtonClass,
  linkClass,
  revealClass
};
