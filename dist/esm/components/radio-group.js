"use client";

// src/components/radio-group.tsx
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { jsx, jsxs } from "react/jsx-runtime";
var RadioContext = /* @__PURE__ */ createContext(null);
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
function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  name,
  options,
  orientation = "vertical",
  disabled = false,
  required = false,
  invalid = false,
  className,
  children,
  ref,
  id,
  onKeyDown,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-invalid": ariaInvalid,
  ...rest
}) {
  const auto = useId();
  const rootRef = useRef(null);
  const controlled = value !== void 0;
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value : inner;
  const fieldLabelId = useExternalLabelId(rootRef, id, ariaLabel != null || ariaLabelledBy != null);
  const select = useCallback(
    (next) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange]
  );
  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "radio") return;
    let dir = 0;
    if (e.key === "ArrowDown") dir = 1;
    else if (e.key === "ArrowUp") dir = -1;
    else if (e.key === "ArrowRight") dir = isRtl(e.currentTarget) ? -1 : 1;
    else if (e.key === "ArrowLeft") dir = isRtl(e.currentTarget) ? 1 : -1;
    if (!dir) return;
    const radios = Array.from(e.currentTarget.querySelectorAll('input[type="radio"]')).filter((r) => !r.disabled);
    const at = radios.indexOf(target);
    if (at < 0 || radios.length < 2) return;
    e.preventDefault();
    const next = radios[(at + dir + radios.length) % radios.length];
    next.focus();
    next.click();
  };
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const ctx = {
    name: name ?? `${auto}-radio`,
    current,
    controlled,
    defaultValue,
    disabled,
    required,
    invalid: isInvalid,
    select
  };
  return /* @__PURE__ */ jsx(RadioContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx(
    "div",
    {
      ...rest,
      ref: (node) => {
        rootRef.current = node;
        setRef(ref, node);
      },
      id,
      role: "radiogroup",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy ?? fieldLabelId,
      "aria-required": required || void 0,
      "aria-invalid": isInvalid || void 0,
      "aria-disabled": disabled || void 0,
      "data-orientation": orientation,
      "data-disabled": disabled ? "" : void 0,
      onKeyDown: handleKeyDown,
      className: cn("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap gap-x-5", className),
      children: options ? options.map((o) => /* @__PURE__ */ jsx(Radio, { value: o.value, label: o.label, description: o.description, disabled: o.disabled }, o.value)) : children
    }
  ) });
}
function Radio({ value, label, description, className, disabled, required, name, onChange, ref, ...rest }) {
  const ctx = useContext(RadioContext);
  const descId = useId();
  const off = disabled === true || ctx?.disabled === true;
  const checkedProps = ctx ? ctx.controlled ? { checked: ctx.current === value } : { defaultChecked: ctx.defaultValue === value } : null;
  return /* @__PURE__ */ jsxs(
    "label",
    {
      "data-state": ctx ? ctx.current === value ? "checked" : "unchecked" : void 0,
      "data-disabled": off ? "" : void 0,
      className: cn(
        "relative flex cursor-pointer items-start gap-2.5 py-1 pointer-coarse:min-h-11 pointer-coarse:items-center",
        off && "cursor-not-allowed opacity-50",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ...rest,
            ...checkedProps,
            ref,
            type: "radio",
            value,
            name: name ?? ctx?.name,
            disabled: off,
            required: required ?? ctx?.required,
            "aria-describedby": description != null ? descId : rest["aria-describedby"],
            onChange: (e) => {
              onChange?.(e);
              if (e.target.checked) ctx?.select(value);
            },
            className: "peer sr-only"
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: cn(
              "mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-th-line-control bg-th-elevated pointer-coarse:mt-0",
              'transition-colors duration-150 after:block after:size-2 after:scale-0 after:rounded-full after:bg-th-accent after:content-[""]',
              "after:transition-transform after:duration-150 motion-reduce:after:transition-none",
              "peer-checked:border-th-accent peer-checked:after:scale-100 peer-focus-visible:ring-2 peer-focus-visible:ring-th-accent/40",
              ctx?.invalid && "border-th-loss",
              "forced-colors:forced-color-adjust-none forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:after:bg-[Highlight]",
              "forced-colors:peer-checked:border-[Highlight] forced-colors:peer-focus-visible:outline forced-colors:peer-focus-visible:outline-2 forced-colors:peer-focus-visible:outline-[Highlight]",
              "forced-colors:peer-disabled:border-[GrayText] forced-colors:peer-disabled:after:bg-[GrayText]"
            )
          }
        ),
        label != null || description != null ? /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
          label != null ? /* @__PURE__ */ jsx("span", { className: "block text-sm leading-snug text-th-hi", children: label }) : null,
          description != null ? /* @__PURE__ */ jsx("span", { id: descId, className: "mt-0.5 block text-xs text-th-hi3", children: description }) : null
        ] }) : null
      ]
    }
  );
}
export {
  Radio,
  RadioGroup
};
