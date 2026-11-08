"use client";

// src/components/forms.tsx
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { FIELD, IconButton, Input } from "./primitives.js";
import { XIcon } from "./icons.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { useStrings } from "./provider.js";
import { FIELD_STRINGS } from "./strings.js";
import { warnDev } from "./display-classes.js";
import { chipClass, setRef } from "./forms-classes.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Svg({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", ...rest, children });
}
var SearchIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
  /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
] });
var PlusIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M5 12h14M12 5v14" }) });
var CheckIcon = (p) => /* @__PURE__ */ jsx(Svg, { strokeWidth: 3, ...p, children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) });
var MinusIcon = (p) => /* @__PURE__ */ jsx(Svg, { strokeWidth: 3, ...p, children: /* @__PURE__ */ jsx("path", { d: "M5 12h14" }) });
var noop = () => {
};
function useFormReset(ref, onReset) {
  const latest = useRef(onReset);
  useEffect(() => {
    latest.current = onReset;
  });
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const handler = () => latest.current();
    form.addEventListener("reset", handler);
    return () => form.removeEventListener("reset", handler);
  }, [ref]);
}
function Textarea({ ref, invalid, size = "md", autoGrow = false, className, rows = 4, value, onInput, ...rest }) {
  const inner = useRef(null);
  const grow = autoGrow !== false;
  const maxRows = typeof autoGrow === "object" ? autoGrow.maxRows : void 0;
  const resize = useCallback(() => {
    const el = inner.current;
    if (!el || !grow) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    let h = el.scrollHeight + border;
    if (maxRows) {
      const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      const max = line * maxRows + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + border;
      el.style.overflowY = h > max ? "auto" : "hidden";
      h = Math.min(h, max);
    } else {
      el.style.overflowY = "hidden";
    }
    el.style.height = `${h}px`;
  }, [grow, maxRows]);
  useIsoLayoutEffect(() => {
    resize();
  }, [resize, value]);
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      ref: (node) => {
        inner.current = node;
        setRef(ref, node);
      },
      rows,
      value,
      "aria-invalid": invalid || void 0,
      onInput: (e) => {
        resize();
        onInput?.(e);
      },
      className: cn(
        FIELD,
        "block leading-relaxed",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
        "pointer-coarse:text-base",
        grow ? "resize-none" : "resize-y",
        className
      ),
      ...rest
    }
  );
}
function Checkbox({ ref, label, hint, indeterminate = false, trailing, size = "md", invalid, className, id, disabled, onChange, ...rest }) {
  const auto = useId();
  const boxId = id ?? `${auto}-box`;
  const labelId = `${auto}-label`;
  const hintId = `${auto}-hint`;
  const trailingId = `${auto}-trailing`;
  const inner = useRef(null);
  const [live, setLive] = useState(rest.defaultChecked ?? false);
  const isChecked = rest.checked ?? live;
  useFormReset(inner, () => setLive(rest.defaultChecked ?? false));
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const sm = size === "sm";
  const describedBy = [rest["aria-describedby"], hint ? hintId : void 0, trailing != null ? trailingId : void 0].filter(Boolean).join(" ") || void 0;
  const named = label != null && (hint || trailing != null) && !rest["aria-label"] && !rest["aria-labelledby"];
  return /* @__PURE__ */ jsxs(
    "label",
    {
      htmlFor: boxId,
      "data-state": indeterminate ? "indeterminate" : isChecked ? "checked" : "unchecked",
      "data-disabled": disabled ? "" : void 0,
      className: cn(
        "cursor-pointer items-start gap-2.5 text-th-hi pointer-coarse:min-h-11 pointer-coarse:py-2.5",
        sm ? "gap-2 text-xs" : "text-sm",
        trailing != null ? "flex w-full" : "inline-flex",
        label == null && hint == null && "items-center pointer-coarse:min-w-11 pointer-coarse:justify-center",
        disabled && "cursor-not-allowed opacity-50",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("span", { className: cn("relative inline-flex shrink-0", label != null && (sm ? "mt-px" : "mt-0.5")), children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ...rest,
              ref: (node) => {
                inner.current = node;
                setRef(ref, node);
              },
              id: boxId,
              type: "checkbox",
              disabled,
              onChange: (e) => {
                setLive(e.target.checked);
                onChange?.(e);
              },
              "aria-invalid": invalid || rest["aria-invalid"] || void 0,
              "aria-labelledby": named ? labelId : rest["aria-labelledby"],
              "aria-describedby": describedBy,
              className: cn(
                "peer m-0 shrink-0 cursor-[inherit] appearance-none rounded border border-th-line-control bg-th-surface transition-colors",
                "checked:border-th-accent checked:bg-th-accent indeterminate:border-th-accent indeterminate:bg-th-accent",
                "aria-[invalid=true]:border-th-loss",
                "forced-colors:checked:border-[color:Highlight] forced-colors:checked:bg-[color:Highlight] forced-colors:indeterminate:border-[color:Highlight] forced-colors:indeterminate:bg-[color:Highlight]",
                sm ? "size-3.5" : "size-4"
              )
            }
          ),
          /* @__PURE__ */ jsx(
            CheckIcon,
            {
              size: sm ? 10 : 12,
              className: "pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-checked:block peer-indeterminate:hidden forced-colors:text-[color:HighlightText]"
            }
          ),
          /* @__PURE__ */ jsx(
            MinusIcon,
            {
              size: sm ? 10 : 12,
              className: "pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-indeterminate:block forced-colors:text-[color:HighlightText]"
            }
          )
        ] }),
        label != null || hint != null ? /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
          label != null ? /* @__PURE__ */ jsx("span", { id: labelId, className: "block leading-snug", children: label }) : null,
          hint ? /* @__PURE__ */ jsx("span", { id: hintId, className: "mt-0.5 block text-xs text-th-hi3", children: hint }) : null
        ] }) : null,
        trailing != null ? /* @__PURE__ */ jsx("span", { id: trailingId, className: "ms-auto shrink-0 ps-2 text-th-hi2 tabular-nums", children: trailing }) : null
      ]
    }
  );
}
function Switch({
  ref,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  name,
  value = "on",
  required,
  form,
  label,
  description,
  size = "md",
  labelSide = "start",
  disabled,
  className,
  id,
  onClick,
  ...allRest
}) {
  const { onChange: removedOnChange, ...rest } = allRest;
  const removed = removedOnChange !== void 0;
  useEffect(() => {
    if (removed) warnDev("Switch: onChange was removed in nish-ui 3.0. Use onCheckedChange(checked).");
  }, [removed]);
  const auto = useId();
  const btnId = id ?? `${auto}-switch`;
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const sm = size === "sm";
  const [inner, setInner] = useState(defaultChecked);
  const controlled = checkedProp !== void 0;
  const checked = controlled ? checkedProp : inner;
  const hidden = useRef(null);
  useFormReset(hidden, () => {
    if (!controlled) setInner(defaultChecked);
  });
  const state = checked ? "checked" : "unchecked";
  const button = /* @__PURE__ */ jsx(
    "button",
    {
      ...rest,
      ref,
      id: btnId,
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-required": required || void 0,
      "aria-labelledby": label != null ? labelId : rest["aria-labelledby"],
      "aria-describedby": description != null ? descId : rest["aria-describedby"],
      "data-state": state,
      "data-disabled": disabled ? "" : void 0,
      disabled,
      onClick: (e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const next = !checked;
        if (!controlled) setInner(next);
        onCheckedChange?.(next);
      },
      className: cn(
        "group relative inline-flex shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50",
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        label == null && className
      ),
      children: /* @__PURE__ */ jsx(
        "span",
        {
          "aria-hidden": "true",
          "data-state": state,
          className: cn(
            "inline-flex items-center rounded-full p-0.5 transition-colors duration-150 forced-color-adjust-none",
            "forced-colors:border forced-colors:border-[color:ButtonText] forced-colors:group-disabled:border-[color:GrayText]",
            sm ? "h-4 w-7" : "h-5 w-9",
            checked ? "bg-th-accent forced-colors:bg-[color:Highlight]" : "bg-th-line-control forced-colors:bg-[color:Canvas]"
          ),
          children: /* @__PURE__ */ jsx(
            "span",
            {
              className: cn(
                "rounded-full shadow-card transition-transform duration-150 motion-reduce:transition-none",
                sm ? "size-3" : "size-4",
                checked ? cn(sm ? "translate-x-3 rtl:-translate-x-3" : "translate-x-4 rtl:-translate-x-4", "bg-th-on-accent forced-colors:bg-[color:HighlightText]") : "translate-x-0 bg-th-surface forced-colors:bg-[color:ButtonText]"
              )
            }
          )
        }
      )
    }
  );
  const mirror = name != null ? /* @__PURE__ */ jsx(
    "input",
    {
      ref: hidden,
      type: "checkbox",
      "aria-hidden": "true",
      tabIndex: -1,
      className: "sr-only pointer-events-none",
      name,
      value,
      form,
      required,
      disabled,
      checked,
      onChange: noop
    }
  ) : null;
  if (label == null)
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      button,
      mirror
    ] });
  const text = /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
    /* @__PURE__ */ jsx("span", { id: labelId, className: cn("block leading-snug text-th-hi", sm ? "text-xs" : "text-sm"), children: label }),
    description != null ? /* @__PURE__ */ jsx("span", { id: descId, className: "mt-0.5 block text-xs text-th-hi3", children: description }) : null
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "label",
      {
        htmlFor: btnId,
        "data-state": state,
        "data-disabled": disabled ? "" : void 0,
        className: cn(
          "flex cursor-pointer items-start gap-3 pointer-coarse:items-center",
          labelSide === "start" && "justify-between",
          disabled && "cursor-not-allowed",
          className
        ),
        children: [
          labelSide === "start" ? text : null,
          /* @__PURE__ */ jsx("span", { className: cn("inline-flex", sm ? "pt-0" : "pt-px", "pointer-coarse:pt-0"), children: button }),
          labelSide === "end" ? text : null
        ]
      }
    ),
    mirror
  ] });
}
function Field({
  ref,
  label,
  hint,
  error,
  optional = false,
  required = false,
  htmlFor,
  layout = "stack",
  labelWidth = "7rem",
  children,
  className,
  style,
  ...rest
}) {
  const auto = useId();
  const strings = useStrings(FIELD_STRINGS);
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const childId = only && typeof only.props.id === "string" ? only.props.id : void 0;
  const controlId = htmlFor ?? childId ?? `${auto}-control`;
  const hasError = error != null && error !== false && error !== "";
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy = [only?.props["aria-describedby"], hasError ? errorId : hint != null ? hintId : void 0].filter(Boolean).join(" ") || void 0;
  const control = only ? cloneElement(only, {
    id: htmlFor ?? childId ?? controlId,
    "aria-describedby": describedBy,
    ...hasError ? { "aria-invalid": true } : null,
    ...required ? { required: true, "aria-required": true } : null
  }) : children;
  const inline = layout === "inline";
  const labelEl = /* @__PURE__ */ jsxs(
    "label",
    {
      id: `${controlId}-label`,
      htmlFor: controlId,
      className: cn(
        "flex flex-wrap items-baseline gap-x-1.5",
        inline ? "text-xs text-th-hi3 pointer-coarse:min-h-11 pointer-coarse:items-center" : "text-sm font-medium text-th-hi"
      ),
      children: [
        /* @__PURE__ */ jsxs("span", { children: [
          label,
          required ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", "data-nish-required": "", className: "ms-0.5 text-th-loss", children: "*" }) : null
        ] }),
        optional && !required ? /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-th-hi3", children: strings.optional }) : null
      ]
    }
  );
  const message = hasError ? /* @__PURE__ */ jsx("p", { id: errorId, role: "alert", className: "text-xs text-th-loss", children: error }) : hint != null ? /* @__PURE__ */ jsx("p", { id: hintId, className: "text-xs text-th-hi3", children: hint }) : null;
  if (inline) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ...rest,
        ref,
        className: cn("grid items-center gap-x-3 gap-y-1", className),
        style: { ...style, gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` },
        children: [
          labelEl,
          /* @__PURE__ */ jsx("div", { className: "min-w-0", children: control }),
          message ? /* @__PURE__ */ jsx("div", { className: "col-start-2", children: message }) : null
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, style, className: cn("grid w-full gap-1.5", className), children: [
    labelEl,
    control,
    message
  ] });
}
function FieldGroup({ ref, label, hint, error, optional = false, className, children, ...rest }) {
  const auto = useId();
  const strings = useStrings(FIELD_STRINGS);
  const hasError = error != null && error !== false && error !== "";
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy = [rest["aria-describedby"], hasError ? errorId : hint != null ? hintId : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ jsxs("fieldset", { ...rest, ref, "aria-describedby": describedBy, className: cn("m-0 grid min-w-0 gap-1.5 border-0 p-0", className), children: [
    /* @__PURE__ */ jsxs("legend", { className: "mb-1.5 flex flex-wrap items-baseline gap-x-1.5 p-0 text-sm font-medium text-th-hi", children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      optional ? /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-th-hi3", children: strings.optional }) : null
    ] }),
    children,
    hasError ? /* @__PURE__ */ jsx("p", { id: errorId, role: "alert", className: "text-xs text-th-loss", children: error }) : hint != null ? /* @__PURE__ */ jsx("p", { id: hintId, className: "text-xs text-th-hi3", children: hint }) : null
  ] });
}
var SEARCH_SIZE = {
  xs: "h-7 text-2xs pointer-coarse:text-base",
  sm: "h-8 text-xs pointer-coarse:text-base",
  md: "h-9 text-sm pointer-coarse:text-base"
};
function SearchInput({
  ref,
  value: valueProp,
  defaultValue = "",
  onChange,
  onClear,
  size = "md",
  variant = "field",
  className,
  inputClassName,
  onKeyDown,
  placeholder,
  clearLabel,
  disabled,
  ...rest
}) {
  const strings = useStrings(FIELD_STRINGS);
  const inner = useRef(null);
  const [own, setOwn] = useState(defaultValue);
  const controlled = valueProp !== void 0;
  const value = controlled ? valueProp : own;
  useFormReset(inner, () => {
    if (!controlled) setOwn(defaultValue);
  });
  const set = (next, event) => {
    if (!controlled) setOwn(next);
    onChange?.(next, event);
  };
  const clear = () => {
    set("");
    onClear?.();
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("relative w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx(
      SearchIcon,
      {
        size: size === "md" ? 16 : 14,
        className: cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3", size === "xs" ? "start-2" : "start-2.5")
      }
    ),
    /* @__PURE__ */ jsx(
      Input,
      {
        ...rest,
        ref: (node) => {
          inner.current = node;
          setRef(ref, node);
        },
        type: "search",
        enterKeyHint: "search",
        autoComplete: "off",
        value,
        placeholder: placeholder ?? strings.search,
        disabled,
        onChange: (e) => set(e.target.value, e),
        onKeyDown: (e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === "Escape" && value) {
            e.preventDefault();
            e.stopPropagation();
            clear();
          }
        },
        className: cn(
          SEARCH_SIZE[size],
          size === "xs" ? "ps-7" : size === "sm" ? "ps-8" : "ps-9",
          value ? "pe-8 pointer-coarse:pe-11" : size === "xs" ? "pe-2" : "pe-3",
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          variant === "bare" && "border-transparent bg-transparent hover:border-transparent focus:border-transparent",
          inputClassName
        )
      }
    ),
    value && !disabled ? /* @__PURE__ */ jsx(
      IconButton,
      {
        label: clearLabel ?? strings.clearSearch,
        size: "xs",
        onClick: () => {
          clear();
          inner.current?.focus();
        },
        className: "absolute end-1 top-1/2 -translate-y-1/2",
        children: /* @__PURE__ */ jsx(XIcon, { size: 14 })
      }
    ) : null
  ] });
}
function Chip({ ref, variant = "toggle", pressed, onRemove, removeLabel, icon, trailing, size = "md", className, children, type = "button", ...rest }) {
  const strings = useStrings(FIELD_STRINGS);
  if (variant === "tag") {
    const name = removeLabel ?? (typeof children === "string" ? strings.removeNamed(children) : strings.remove);
    const spanProps = rest;
    return /* @__PURE__ */ jsxs(
      "span",
      {
        ...spanProps,
        ref,
        className: chipClass({ variant: "tag", size, className: cn(onRemove && (size === "sm" ? "pe-0.5" : "pe-1"), className) }),
        children: [
          icon,
          children,
          trailing,
          onRemove ? /* @__PURE__ */ jsx(IconButton, { label: name, size: "xs", onClick: onRemove, className: "rounded-full", children: /* @__PURE__ */ jsx(XIcon, { size: 12 }) }) : null
        ]
      }
    );
  }
  const suggestion = variant === "suggestion";
  return /* @__PURE__ */ jsxs(
    "button",
    {
      ...rest,
      ref,
      type,
      "aria-pressed": suggestion ? void 0 : !!pressed,
      "data-state": suggestion ? void 0 : pressed ? "active" : "inactive",
      "data-disabled": rest.disabled ? "" : void 0,
      className: chipClass({
        variant: suggestion ? "suggestion" : "toggle",
        pressed: !!pressed,
        size,
        className: cn("disabled:pointer-events-none disabled:opacity-50 forced-colors:disabled:text-[color:GrayText]", className)
      }),
      children: [
        icon ?? (suggestion ? /* @__PURE__ */ jsx(PlusIcon, { size: size === "sm" ? 12 : 14 }) : null),
        children,
        trailing
      ]
    }
  );
}
function ChipGroup({ ref, label, scroll = false, className, children, onKeyDown, ...rest }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      ...rest,
      ref,
      role: "group",
      "aria-label": label,
      onKeyDown: (e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const rtl = isRtl(e.currentTarget);
        const next = e.key === (rtl ? "ArrowLeft" : "ArrowRight") ? 1 : e.key === (rtl ? "ArrowRight" : "ArrowLeft") ? -1 : 0;
        const home = e.key === "Home";
        const end = e.key === "End";
        if (!next && !home && !end) return;
        const chips = Array.from(e.currentTarget.querySelectorAll("button:not(:disabled)"));
        const at = chips.indexOf(e.target);
        if (at < 0) return;
        e.preventDefault();
        const to = home ? 0 : end ? chips.length - 1 : (at + next + chips.length) % chips.length;
        chips[to]?.focus();
      },
      className: cn(
        "flex flex-wrap items-center gap-2",
        scroll && "max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:py-1 scrollbar-none",
        className
      ),
      children
    }
  );
}
export {
  Checkbox,
  Chip,
  ChipGroup,
  Field,
  FieldGroup,
  SearchInput,
  Switch,
  Textarea,
  chipClass
};
