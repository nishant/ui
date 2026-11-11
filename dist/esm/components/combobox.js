"use client";

// src/components/combobox.tsx
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../cn.js";
import { CheckIcon, XIcon } from "./icons.js";
import { Spinner } from "./feedback.js";
import { fieldClass } from "./primitives.js";
import { useStrings } from "./provider.js";
import { FIELD_STRINGS } from "./strings.js";
import { indexComboboxOptions, setRef } from "./forms-classes.js";
import { COMBOBOX_DEBOUNCE_MS, COMBOBOX_MAX_SHOWN, matchesComboboxNeedle } from "../combobox-filter.js";
import { jsx, jsxs } from "react/jsx-runtime";
var MAX_SHOWN = COMBOBOX_MAX_SHOWN;
var DEBOUNCE_MS = COMBOBOX_DEBOUNCE_MS;
var defaultResultsText = (n) => `${n} ${n === 1 ? "result" : "results"}`;
function Combobox({
  ref,
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  onValueChange,
  filter,
  allowCustom = false,
  placeholder,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  invalid,
  id,
  name,
  form,
  required,
  disabled = false,
  emptyText,
  onQueryChange,
  loading = false,
  size = "md",
  clearLabel,
  loadingText,
  resultsText = defaultResultsText,
  className,
  ...rest
}) {
  const strings = useStrings(FIELD_STRINGS);
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `nish-cb-${autoId}`;
  const listId = `nish-cb-list-${autoId}`;
  const empty = emptyText ?? strings.noMatches;
  const searching = loadingText ?? strings.searching;
  const [own, setOwn] = useState(defaultValue);
  const controlled = valueProp !== void 0;
  const value = controlled ? valueProp : own;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState(-1);
  const [armed, setArmed] = useState(false);
  const inputRef = useRef(null);
  const hiddenRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(void 0);
  const indexed = useMemo(() => indexComboboxOptions(options), [options]);
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const label = selected?.label ?? value ?? "";
  const shown = dirty ? text : label;
  const hasValue = value != null && value !== "";
  const visible = useMemo(() => {
    const serverFiltered = onQueryChange != null && filter == null;
    const needle = text.trim().toLowerCase();
    const out = [];
    for (const it of indexed) {
      if (out.length >= MAX_SHOWN) break;
      if (dirty && !serverFiltered) {
        if (filter) {
          if (!filter(it.option, text)) continue;
        } else if (!matchesComboboxNeedle(it.label, it.hint, needle)) continue;
      }
      out.push(it.option);
    }
    return out;
  }, [indexed, dirty, text, filter, onQueryChange]);
  const current = armed ? visible.findIndex((o) => !o.disabled) : active;
  useEffect(() => () => window.clearTimeout(debounceRef.current), []);
  useEffect(() => {
    const f = hiddenRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => setOwn(defaultValue);
    f.addEventListener("reset", onReset);
    return () => f.removeEventListener("reset", onReset);
  }, [name, form, controlled, defaultValue]);
  useEffect(() => {
    if (!open || current < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${current}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, current]);
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [open]);
  const reset = useCallback(() => {
    setDirty(false);
    setText("");
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
    setArmed(false);
  }, []);
  const commit = (v, opt) => {
    if (!controlled) setOwn(v);
    onChange?.(v, opt);
    onValueChange?.(v);
  };
  const select = (opt) => {
    if (opt.disabled) return;
    commit(opt.value, opt);
    reset();
    close();
  };
  const step = (from, dir) => {
    const n = visible.length;
    if (n === 0) return -1;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (!visible[i].disabled) return i;
    }
    return -1;
  };
  const edge = (dir) => dir === 1 ? step(-1, 1) : step(0, -1);
  const selectedAt = () => selected ? visible.findIndex((o) => o.value === selected.value) : -1;
  function openList() {
    if (open || disabled) return;
    setOpen(true);
    setArmed(false);
    setActive(selectedAt());
  }
  function onInput(next) {
    setText(next);
    setDirty(true);
    setOpen(true);
    setActive(-1);
    setArmed(!allowCustom && next.trim() !== "");
    if (onQueryChange) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => onQueryChange(next), DEBOUNCE_MS);
    }
  }
  function commitEmpty() {
    if (!dirty || text.trim() !== "" || !hasValue) return false;
    commit(null, null);
    reset();
    close();
    return true;
  }
  function commitCustom() {
    const t = text.trim();
    if (!allowCustom || !dirty || !t) return false;
    const lower = t.toLowerCase();
    const exact = indexed.find((it) => !it.option.disabled && it.label === lower)?.option;
    if (exact) commit(exact.value, exact);
    else commit(t, null);
    reset();
    close();
    return true;
  }
  function onKeyDown(e) {
    if (disabled || e.nativeEvent.isComposing || e.keyCode === 229) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setArmed(false);
        if (!open) {
          setOpen(true);
          const at = selectedAt();
          setActive(at >= 0 ? at : edge(dir));
        } else {
          setActive(current < 0 ? edge(dir) : step(current, dir));
        }
        break;
      }
      case "Home":
      case "End":
        if (open) {
          e.preventDefault();
          setArmed(false);
          setActive(edge(e.key === "Home" ? 1 : -1));
        }
        break;
      case "Enter":
        if (open && current >= 0 && visible[current]) {
          e.preventDefault();
          select(visible[current]);
        } else if (commitEmpty() || commitCustom()) {
          e.preventDefault();
        } else if (open) {
          e.preventDefault();
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (dirty) {
          e.preventDefault();
          e.stopPropagation();
          reset();
        }
        break;
      case "Tab":
        close();
        break;
    }
  }
  function clear() {
    commit(null, null);
    reset();
    close();
    inputRef.current?.focus();
  }
  const activeId = open && current >= 0 && visible[current] ? `${listId}-opt-${current}` : void 0;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : void 0,
      className: cn("relative w-full min-w-0", className),
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: (node) => {
              inputRef.current = node;
              setRef(ref, node);
            },
            id: inputId,
            type: "text",
            role: "combobox",
            "aria-expanded": open,
            "aria-controls": open ? listId : void 0,
            "aria-autocomplete": "list",
            "aria-activedescendant": activeId,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
            "aria-invalid": isInvalid || void 0,
            "aria-required": required || void 0,
            required,
            autoComplete: "off",
            autoCapitalize: "off",
            spellCheck: false,
            placeholder,
            disabled,
            value: shown,
            onChange: (e) => onInput(e.target.value),
            onKeyDown,
            onClick: openList,
            onBlur: () => {
              if (!commitEmpty()) {
                close();
                reset();
              }
            },
            className: fieldClass({ size, className: "pe-11" })
          }
        ),
        name != null ? /* @__PURE__ */ jsx("input", { ref: hiddenRef, type: "hidden", name, value: value ?? "", form, disabled }) : null,
        hasValue && !disabled ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": clearLabel ?? strings.clear,
            tabIndex: -1,
            onMouseDown: (e) => e.preventDefault(),
            onClick: clear,
            className: "absolute inset-y-0 end-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi",
            children: /* @__PURE__ */ jsx("span", { className: "flex size-8 items-center justify-center rounded-md hover:bg-th-elevated", children: /* @__PURE__ */ jsx(XIcon, { size: 16 }) })
          }
        ) : null,
        /* @__PURE__ */ jsx("div", { role: "status", "aria-live": "polite", className: "sr-only", children: open ? loading ? searching : visible.length === 0 ? empty : resultsText(visible.length) : "" }),
        open ? /* @__PURE__ */ jsxs(
          "ul",
          {
            ref: listRef,
            id: listId,
            role: "listbox",
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabel ? void 0 : ariaLabelledBy ?? inputId,
            className: "absolute inset-x-0 top-full z-[var(--nish-z-dropdown,40)] mt-1 max-h-[min(16rem,40dvh)] overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop",
            children: [
              visible.map((o, i) => {
                const isSelected = selected?.value === o.value;
                return /* @__PURE__ */ jsxs(
                  "li",
                  {
                    id: `${listId}-opt-${i}`,
                    role: "option",
                    "data-index": i,
                    "data-state": i === current ? "active" : "inactive",
                    "data-disabled": o.disabled ? "" : void 0,
                    "aria-selected": isSelected,
                    "aria-disabled": o.disabled || void 0,
                    onMouseDown: (e) => e.preventDefault(),
                    onMouseMove: () => {
                      if (o.disabled || !armed && active === i) return;
                      setArmed(false);
                      setActive(i);
                    },
                    onClick: () => select(o),
                    className: cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-th-hi2",
                      i === current && "bg-th-accent-soft text-th-hi forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]",
                      o.disabled && "cursor-not-allowed opacity-50 forced-colors:text-[color:GrayText]"
                    ),
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: o.label }),
                      o.hint ? /* @__PURE__ */ jsx("span", { className: cn("shrink-0 truncate text-xs text-th-hi3", i === current && "forced-colors:text-[color:HighlightText]"), children: o.hint }) : null,
                      isSelected ? /* @__PURE__ */ jsx(CheckIcon, { size: 16, className: "shrink-0 text-th-accent" }) : null
                    ]
                  },
                  o.value
                );
              }),
              loading ? /* @__PURE__ */ jsxs("li", { role: "presentation", className: "flex min-h-11 items-center gap-2 px-3 text-sm text-th-hi3", children: [
                /* @__PURE__ */ jsx(Spinner, { size: "sm" }),
                searching
              ] }) : visible.length === 0 ? /* @__PURE__ */ jsx("li", { role: "presentation", className: "flex min-h-11 items-center px-3 text-sm text-th-hi3", children: empty }) : null
            ]
          }
        ) : null
      ]
    }
  );
}
export {
  Combobox
};
