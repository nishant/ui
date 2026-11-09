"use client";

// src/components/tag-input.tsx
import {
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { Chip } from "./forms.js";
import { fieldClass } from "./primitives.js";
import { useStrings } from "./provider.js";
import { FIELD_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
function setRef(ref, node) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}
var SPLIT = /[\n\r\t,]+/;
function TagInput({
  value,
  defaultValue,
  onValueChange,
  name,
  placeholder,
  maxTags,
  validate,
  suggestions,
  disabled = false,
  required = false,
  invalid = false,
  size = "md",
  className,
  ref,
  inputRef,
  id,
  onClick,
  onBlur,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rest
}) {
  const strings = useStrings(FIELD_STRINGS);
  const auto = useId();
  const input = useRef(null);
  const controlled = value !== void 0;
  const [inner, setInner] = useState(defaultValue ?? []);
  const tags = controlled ? value : inner;
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${auto}-list`;
  const errorId = `${auto}-error`;
  const hasSuggestions = suggestions !== void 0;
  const filtered = useMemo(() => {
    if (!suggestions) return [];
    const q = text.trim().toLowerCase();
    return suggestions.filter((s) => !tags.includes(s) && s.toLowerCase().includes(q));
  }, [suggestions, tags, text]);
  const listOpen = hasSuggestions && open && filtered.length > 0 && !disabled;
  const setTags = (next) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };
  const add = (raw) => {
    let next = tags;
    let err = null;
    const refused = [];
    for (const r of raw) {
      const t = r.trim();
      if (!t || next.includes(t)) continue;
      if (maxTags !== void 0 && next.length >= maxTags) {
        err ??= strings.maxTags(maxTags);
        refused.push(t);
        continue;
      }
      const message = validate?.(t) ?? null;
      if (message) {
        err ??= message;
        refused.push(t);
        continue;
      }
      next = [...next, t];
    }
    if (next !== tags) setTags(next);
    setError(err);
    return { error: err, refused };
  };
  const commitText = (raw) => {
    if (!add([raw]).error) {
      setText("");
      setActive(-1);
    }
  };
  const remove = (tag) => {
    setError(null);
    setTags(tags.filter((t) => t !== tag));
    input.current?.focus();
  };
  const handleKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      const pick = listOpen && active >= 0 ? filtered[active] : void 0;
      if (pick !== void 0) {
        e.preventDefault();
        commitText(pick);
      } else if (text.trim()) {
        e.preventDefault();
        commitText(text);
      }
    } else if (e.key === ",") {
      e.preventDefault();
      if (text.trim()) commitText(text);
    } else if (e.key === "Backspace" && text === "" && tags.length > 0) {
      e.preventDefault();
      setError(null);
      setTags(tags.slice(0, -1));
    } else if (e.key === "ArrowDown" && hasSuggestions) {
      e.preventDefault();
      if (!listOpen) {
        setOpen(true);
        setActive(0);
      } else setActive((a) => (a + 1) % filtered.length);
    } else if (e.key === "ArrowUp" && hasSuggestions) {
      e.preventDefault();
      if (!listOpen) {
        setOpen(true);
        setActive(filtered.length - 1);
      } else setActive((a) => a <= 0 ? filtered.length - 1 : a - 1);
    } else if (e.key === "Escape" && listOpen) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setActive(-1);
    }
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text");
    if (!SPLIT.test(pasted)) return;
    e.preventDefault();
    const parts = pasted.split(SPLIT);
    parts[0] = text + parts[0];
    const { error: err, refused } = add(parts);
    setText(err ? refused.join(", ") : "");
  };
  const handleBlur = (e) => {
    onBlur?.(e);
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOpen(false);
      setActive(-1);
    }
  };
  const handleClick = (e) => {
    onClick?.(e);
    if (!disabled && e.target.closest('button, input, [role="option"]') === null) input.current?.focus();
  };
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true" || error !== null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      "data-disabled": disabled ? "" : void 0,
      "data-invalid": isInvalid ? "" : void 0,
      onClick: handleClick,
      onBlur: handleBlur,
      className: fieldClass({
        size,
        invalid: isInvalid,
        className: cn(
          "relative flex h-auto cursor-text flex-wrap items-center gap-1.5 py-1",
          "focus-within:border-th-accent focus-within:ring-2 focus-within:ring-th-accent/25",
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          "forced-colors:focus-within:outline-solid forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-[Highlight]",
          className
        )
      }),
      children: [
        tags.map((tag) => /* @__PURE__ */ jsx(
          Chip,
          {
            variant: "tag",
            size: "sm",
            removeLabel: strings.removeTag(tag),
            onRemove: disabled ? void 0 : () => remove(tag),
            children: tag
          },
          tag
        )),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: (node) => {
              input.current = node;
              setRef(inputRef, node);
            },
            id,
            type: "text",
            value: text,
            disabled,
            required: required && tags.length === 0,
            placeholder: tags.length === 0 ? placeholder : void 0,
            autoComplete: "off",
            role: hasSuggestions ? "combobox" : void 0,
            "aria-expanded": hasSuggestions ? listOpen : void 0,
            "aria-controls": listOpen ? listId : void 0,
            "aria-autocomplete": hasSuggestions ? "list" : void 0,
            "aria-activedescendant": listOpen && active >= 0 && active < filtered.length ? `${auto}-opt-${active}` : void 0,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": [ariaDescribedBy, error ? errorId : null].filter(Boolean).join(" ") || void 0,
            "aria-invalid": isInvalid || void 0,
            onChange: (e) => {
              setText(e.target.value);
              setError(null);
              setOpen(true);
              setActive(-1);
            },
            onFocus: () => setOpen(true),
            onKeyDown: handleKeyDown,
            onPaste: handlePaste,
            className: "min-w-24 flex-1 bg-transparent py-0.5 text-th-hi outline-none placeholder:text-th-hi3"
          }
        ),
        error ? /* @__PURE__ */ jsx("p", { id: errorId, role: "alert", className: "basis-full text-xs text-th-loss", children: error }) : null,
        listOpen ? /* @__PURE__ */ jsx(
          "ul",
          {
            id: listId,
            role: "listbox",
            className: "absolute inset-x-0 top-full z-[var(--nish-z-dropdown,40)] mt-1 max-h-56 overflow-auto rounded-lg border border-th-line bg-th-overlay p-1 shadow-pop",
            children: filtered.map((s, i) => /* @__PURE__ */ jsx(
              "li",
              {
                id: `${auto}-opt-${i}`,
                role: "option",
                "aria-selected": i === active,
                "data-active": i === active ? "" : void 0,
                onMouseDown: (e) => e.preventDefault(),
                onMouseEnter: () => setActive(i),
                onClick: () => {
                  commitText(s);
                  input.current?.focus();
                },
                className: cn(
                  "cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-th-hi2 pointer-coarse:min-h-11 pointer-coarse:py-2.5",
                  i === active && "bg-th-elevated text-th-hi forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]"
                ),
                children: s
              },
              s
            ))
          }
        ) : null,
        name ? tags.map((tag) => /* @__PURE__ */ jsx("input", { type: "hidden", name, value: tag, disabled }, tag)) : null
      ]
    }
  );
}
export {
  TagInput
};
