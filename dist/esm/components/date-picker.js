"use client";

// src/components/date-picker.tsx
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../cn.js";
import { getDefaultLocale } from "../format.js";
import { Calendar } from "./calendar.js";
import {
  datePlaceholder,
  formatDateField,
  fullDate,
  inRange,
  parseDateField,
  parseIso,
  resolveLocale
} from "./calendar-classes.js";
import { setRef } from "./forms-classes.js";
import { Popover } from "./popover.js";
import { CalendarIcon } from "./icons.js";
import { fieldClass } from "./primitives-classes.js";
import { useNishContext, useStrings } from "./provider.js";
import { PICKER_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
function DatePicker({
  ref,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min: minProp,
  max: maxProp,
  isDateDisabled,
  locale,
  weekStartsOn,
  captionLayout,
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
  size = "md",
  calendarLabel,
  className,
  ...rest
}) {
  const strings = useStrings(PICKER_STRINGS);
  const config = useNishContext();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `nish-dp-${autoId}`;
  const min = parseIso(minProp) ? minProp : null;
  const max = parseIso(maxProp) ? maxProp : null;
  const controlled = valueProp !== void 0;
  const [own, setOwn] = useState(parseIso(defaultValue) ? defaultValue : null);
  const value = controlled ? parseIso(valueProp) ? valueProp : null : own;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [badText, setBadText] = useState(false);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const shown = dirty ? text : value ? formatDateField(value, loc) : "";
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === "true" || badText;
  useEffect(() => {
    inputRef.current?.setCustomValidity(badText ? strings.invalidDate : "");
  }, [badText, strings.invalidDate]);
  useEffect(() => {
    const f = inputRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => {
      setOwn(parseIso(defaultValue) ? defaultValue : null);
      setDirty(false);
      setBadText(false);
    };
    f.addEventListener("reset", onReset);
    return () => f.removeEventListener("reset", onReset);
  }, [name, form, controlled, defaultValue]);
  const commit = (v) => {
    if (!controlled) setOwn(v);
    onValueChange?.(v);
  };
  const commitText = () => {
    if (!dirty) return;
    if (text.trim() === "") {
      if (value !== null) commit(null);
      setDirty(false);
      setBadText(false);
      return;
    }
    const iso = parseDateField(text, loc);
    if (iso && inRange(iso, min, max) && isDateDisabled?.(iso) !== true) {
      if (iso !== value) commit(iso);
      setDirty(false);
      setBadText(false);
      return;
    }
    setBadText(true);
  };
  const pickFromCalendar = (iso) => {
    commit(iso);
    setDirty(false);
    setBadText(false);
    setOpen(false);
  };
  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter") {
      if (dirty) {
        e.preventDefault();
        commitText();
      }
    } else if (e.key === "ArrowDown" && e.altKey) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === "Escape" && dirty) {
      e.preventDefault();
      e.stopPropagation();
      setDirty(false);
      setBadText(false);
    }
  };
  const buttonLabel = calendarLabel ?? (value ? strings.changeDate(fullDate(value, loc)) : strings.chooseDate);
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
            inputMode: "numeric",
            autoComplete: "off",
            spellCheck: false,
            value: shown,
            placeholder: placeholder ?? datePlaceholder(loc, {
              day: strings.dayToken,
              month: strings.monthToken,
              year: strings.yearToken
            }),
            disabled,
            required,
            form,
            "aria-label": ariaLabel,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
            "aria-invalid": isInvalid || void 0,
            "aria-required": required || void 0,
            onChange: (e) => {
              setText(e.target.value);
              setDirty(true);
            },
            onBlur: commitText,
            onKeyDown,
            className: fieldClass({
              size,
              invalid: isInvalid,
              className: "pe-11 tabular-nums"
            })
          }
        ),
        name != null ? /* @__PURE__ */ jsx("input", { type: "hidden", name, value: value ?? "", form, disabled }) : null,
        /* @__PURE__ */ jsx(
          "button",
          {
            ref: buttonRef,
            type: "button",
            "aria-label": buttonLabel,
            "aria-haspopup": "dialog",
            "aria-expanded": open,
            disabled,
            onClick: () => setOpen((o) => !o),
            className: "absolute inset-y-0 end-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi disabled:pointer-events-none disabled:opacity-50",
            children: /* @__PURE__ */ jsx("span", { className: "flex size-8 items-center justify-center rounded-md hover:bg-th-elevated", children: /* @__PURE__ */ jsx(CalendarIcon, { size: 16 }) })
          }
        ),
        /* @__PURE__ */ jsx(Popover, { open, onOpenChange: (o) => setOpen(o), anchor: buttonRef, align: "end", "aria-label": strings.chooseDate, className: "p-3", children: /* @__PURE__ */ jsx(
          Calendar,
          {
            value,
            onValueChange: pickFromCalendar,
            min: minProp,
            max: maxProp,
            isDateDisabled,
            locale: loc,
            weekStartsOn,
            captionLayout,
            autoFocus: true
          }
        ) })
      ]
    }
  );
}
export {
  DatePicker
};
