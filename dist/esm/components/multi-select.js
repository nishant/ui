"use client";

// src/components/multi-select.tsx
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../cn.js";
import { CheckIcon, XIcon } from "./icons.js";
import { Spinner } from "./feedback.js";
import { Chip } from "./forms.js";
import { fieldClass } from "./primitives.js";
import { useNishStrings } from "./provider.js";
import { indexComboboxOptions, setRef } from "./forms-classes.js";
import { COMBOBOX_DEBOUNCE_MS, COMBOBOX_MAX_SHOWN } from "../combobox-filter.js";
import { jsx, jsxs } from "react/jsx-runtime";
var defaultResultsText = (n) => `${n} ${n === 1 ? "result" : "results"}`;
function MultiSelect({
  ref,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  onChange,
  filter,
  maxSelected,
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
  loadingText,
  resultsText = defaultResultsText,
  size = "md",
  clearLabel,
  className,
  ...rest
}) {
  const strings = useNishStrings();
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `nish-ms-${autoId}`;
  const listId = `nish-ms-list-${autoId}`;
  const empty = emptyText ?? strings.noMatches;
  const searching = loadingText ?? strings.searching;
  const defaultRef = useRef(defaultValue);
  useEffect(() => {
    defaultRef.current = defaultValue;
  });
  const [own, setOwn] = useState(defaultValue ?? []);
  const controlled = valueProp !== void 0;
  const values = controlled ? valueProp : own;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [active, setActive] = useState(-1);
  const [armed, setArmed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(void 0);
  const [seen, setSeen] = useState({});
  const indexed = useMemo(() => indexComboboxOptions(options), [options]);
  {
    const cur = valueProp ?? own;
    let next = null;
    const done = /* @__PURE__ */ new Set();
    for (const o of options) {
      if (done.has(o.value)) continue;
      done.add(o.value);
      if (cur.includes(o.value) && seen[o.value]?.label !== o.label) (next ??= { ...seen })[o.value] = o;
    }
    if (next) setSeen(next);
  }
  const visible = useMemo(() => {
    const serverFiltered = onQueryChange != null && filter == null;
    const needle = text.trim().toLowerCase();
    const out = [];
    for (const it of indexed) {
      if (out.length >= COMBOBOX_MAX_SHOWN) break;
      if (needle && !serverFiltered) {
        if (filter) {
          if (!filter(it.option, text)) continue;
        } else if (!it.label.includes(needle) && !(it.hint?.includes(needle) ?? false)) continue;
      }
      out.push(it.option);
    }
    return out;
  }, [indexed, text, filter, onQueryChange]);
  const current = armed ? visible.findIndex((o) => !o.disabled) : active;
  const atLimit = maxSelected != null && values.length >= maxSelected;
  useEffect(() => () => window.clearTimeout(debounceRef.current), []);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !ariaLabel && !ariaLabelledBy && id == null) {
      console.warn("MultiSelect needs a name: pass aria-label, aria-labelledby, or an id with a <label htmlFor>.");
    }
  }, [ariaLabel, ariaLabelledBy, id]);
  useEffect(() => {
    const f = inputRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => setOwn(defaultRef.current ?? []);
    f.addEventListener("reset", onReset);
    return () => f.removeEventListener("reset", onReset);
  }, [controlled, form]);
  useEffect(() => {
    if (!open || current < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${current}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, current]);
  const toOption = (v) => options.find((o) => o.value === v) ?? seen[v] ?? { value: v, label: v };
  const labelOf = (v) => toOption(v).label;
  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
    setArmed(false);
  }, []);
  const queryChanged = (q) => {
    if (!onQueryChange) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onQueryChange(q), COMBOBOX_DEBOUNCE_MS);
  };
  const commit = (next) => {
    if (!controlled) setOwn(next);
    onValueChange?.(next);
    onChange?.(next, next.map(toOption));
  };
  const toggle = (o) => {
    if (o.disabled || disabled) return;
    const picked = values.includes(o.value);
    if (picked) {
      commit(values.filter((v) => v !== o.value));
      setAnnouncement(strings.optionRemoved(o.label));
    } else {
      if (maxSelected != null && values.length >= maxSelected) {
        setAnnouncement(strings.maxSelected(maxSelected));
        return;
      }
      setSeen((s) => ({ ...s, [o.value]: o }));
      commit([...values, o.value]);
      setAnnouncement(strings.optionAdded(o.label));
    }
    if (text !== "") {
      setText("");
      queryChanged("");
    }
    setArmed(false);
    const at = options.findIndex((x) => x.value === o.value);
    setActive(at >= 0 && at < COMBOBOX_MAX_SHOWN ? at : -1);
  };
  const removeValue = (v) => {
    commit(values.filter((x) => x !== v));
    setAnnouncement(strings.optionRemoved(labelOf(v)));
    inputRef.current?.focus();
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
  const firstPickedAt = () => visible.findIndex((o) => !o.disabled && values.includes(o.value));
  function openList() {
    if (open || disabled) return;
    setOpen(true);
    setArmed(false);
    setAnnouncement("");
    setActive(firstPickedAt());
  }
  function onInput(next) {
    setText(next);
    setOpen(true);
    setActive(-1);
    setArmed(next.trim() !== "");
    setAnnouncement("");
    queryChanged(next);
  }
  function onKeyDown(e) {
    if (disabled || e.nativeEvent.isComposing) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        setArmed(false);
        if (!open) {
          setOpen(true);
          setAnnouncement("");
          const at = firstPickedAt();
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
          toggle(visible[current]);
        } else if (open) {
          e.preventDefault();
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (text !== "") {
          e.stopPropagation();
          setText("");
          queryChanged("");
        }
        break;
      case "Backspace": {
        const el = e.currentTarget;
        if (text === "" && el.selectionStart === 0 && el.selectionEnd === 0 && values.length > 0) {
          e.preventDefault();
          removeValue(values[values.length - 1]);
        }
        break;
      }
      case "Tab":
        close();
        break;
    }
  }
  function clearAll() {
    commit([]);
    setAnnouncement("");
    inputRef.current?.focus();
  }
  function onBoxClick(e) {
    if (disabled) return;
    if (e.target.closest('button, input, [role="option"]') === null) {
      inputRef.current?.focus();
      openList();
    }
  }
  const activeId = open && current >= 0 && visible[current] ? `${listId}-opt-${current}` : void 0;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const status = announcement || (open ? loading ? searching : visible.length === 0 ? empty : resultsText(visible.length) : "");
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      "data-state": open ? "open" : "closed",
      "data-disabled": disabled ? "" : void 0,
      "data-invalid": isInvalid ? "" : void 0,
      onBlur: (e) => {
        rest.onBlur?.(e);
        if (!e.currentTarget.contains(e.relatedTarget)) {
          close();
          setText("");
        }
      },
      className: cn("relative w-full min-w-0", className),
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            "data-disabled": disabled ? "" : void 0,
            onClick: onBoxClick,
            className: fieldClass({
              size,
              invalid: isInvalid,
              className: cn(
                "relative flex h-auto cursor-text flex-wrap items-center gap-1.5 py-1 pe-11",
                "focus-within:border-th-accent focus-within:ring-2 focus-within:ring-th-accent/25",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                "forced-colors:focus-within:outline-solid forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-[Highlight]"
              )
            }),
            children: [
              values.map((v) => /* @__PURE__ */ jsx(
                Chip,
                {
                  variant: "tag",
                  size: "sm",
                  removeLabel: strings.removeNamed(labelOf(v)),
                  onRemove: disabled ? void 0 : () => removeValue(v),
                  children: labelOf(v)
                },
                v
              )),
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
                  required: required && values.length === 0,
                  autoComplete: "off",
                  autoCapitalize: "off",
                  spellCheck: false,
                  placeholder: values.length === 0 ? placeholder : void 0,
                  disabled,
                  value: text,
                  onChange: (e) => onInput(e.target.value),
                  onKeyDown,
                  onClick: openList,
                  className: "min-w-24 flex-1 bg-transparent py-0.5 text-th-hi outline-none placeholder:text-th-hi3"
                }
              ),
              values.length > 0 && !disabled ? /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": clearLabel ?? strings.clearAll,
                  tabIndex: -1,
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: clearAll,
                  className: "absolute -inset-y-px -end-px flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi",
                  children: /* @__PURE__ */ jsx("span", { className: "flex size-8 items-center justify-center rounded-md hover:bg-th-elevated", children: /* @__PURE__ */ jsx(XIcon, { size: 16 }) })
                }
              ) : null
            ]
          }
        ),
        name != null ? values.map((v) => /* @__PURE__ */ jsx("input", { type: "hidden", name, value: v, form, disabled }, v)) : null,
        /* @__PURE__ */ jsx("div", { role: "status", "aria-live": "polite", className: "sr-only", children: status }),
        open ? /* @__PURE__ */ jsxs(
          "ul",
          {
            ref: listRef,
            id: listId,
            role: "listbox",
            "aria-multiselectable": "true",
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabel ? void 0 : ariaLabelledBy ?? inputId,
            className: "absolute inset-x-0 top-full z-[var(--nish-z-dropdown,40)] mt-1 max-h-[min(16rem,40dvh)] overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop",
            children: [
              visible.map((o, i) => {
                const picked = values.includes(o.value);
                const limited = atLimit && !picked;
                const off = o.disabled || limited;
                return /* @__PURE__ */ jsxs(
                  "li",
                  {
                    id: `${listId}-opt-${i}`,
                    role: "option",
                    "data-index": i,
                    "data-state": i === current ? "active" : "inactive",
                    "data-disabled": off ? "" : void 0,
                    "aria-selected": picked,
                    "aria-disabled": off || void 0,
                    onMouseDown: (e) => e.preventDefault(),
                    onMouseMove: () => {
                      if (o.disabled || !armed && active === i) return;
                      setArmed(false);
                      setActive(i);
                    },
                    onClick: () => toggle(o),
                    className: cn(
                      "flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-th-hi2",
                      i === current && "bg-th-accent-soft text-th-hi forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]",
                      off && "cursor-not-allowed opacity-50 forced-colors:text-[color:GrayText]"
                    ),
                    children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          "aria-hidden": "true",
                          className: cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border",
                            picked ? "border-th-accent bg-th-accent text-th-on-accent forced-colors:bg-[Highlight]" : "border-th-line-control"
                          ),
                          children: picked ? /* @__PURE__ */ jsx(CheckIcon, { size: 12 }) : null
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: o.label }),
                      o.hint ? /* @__PURE__ */ jsx("span", { className: cn("shrink-0 truncate text-xs text-th-hi3", i === current && "forced-colors:text-[color:HighlightText]"), children: o.hint }) : null
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
  MultiSelect
};
