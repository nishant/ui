"use client";

// src/components/date-range-picker.tsx
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../cn.js";
import { getDefaultLocale } from "../format.js";
import {
  firstDisabledIn,
  formatRangeField,
  fullDate,
  inRange,
  parseIso,
  parseRangeField,
  rangePlaceholder,
  resolveLocale,
  sameRange,
  toRange
} from "./calendar-classes.js";
import { setRef } from "./forms-classes.js";
import { Popover } from "./popover.js";
import { CalendarIcon } from "./icons.js";
import { RangeCalendar } from "./range-calendar.js";
import { fieldClass } from "./primitives-classes.js";
import { useNishContext, useStrings } from "./provider.js";
import { PICKER_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
function DateRangePicker({
  ref,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min: minProp,
  max: maxProp,
  isDateDisabled,
  allowDisabledInRange = false,
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
  const inputId = id ?? `nish-drp-${autoId}`;
  const min = parseIso(minProp) ? minProp : null;
  const max = parseIso(maxProp) ? maxProp : null;
  const controlled = valueProp !== void 0;
  const [own, setOwn] = useState(() => toRange(defaultValue));
  const value = controlled ? toRange(valueProp) : own;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [badText, setBadText] = useState(false);
  const inputRef = useRef(null);
  const buttonRef = useRef(null);
  const shown = dirty ? text : value ? formatRangeField(value, loc) : "";
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === "true" || badText;
  useEffect(() => {
    inputRef.current?.setCustomValidity(badText ? strings.invalidDateRange : "");
  }, [badText, strings.invalidDateRange]);
  useEffect(() => {
    const f = inputRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => {
      setOwn(toRange(defaultValue));
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
    const r = parseRangeField(text, loc);
    if (r && inRange(r.from, min, max) && inRange(r.to, min, max) && isDateDisabled?.(r.from) !== true && isDateDisabled?.(r.to) !== true && (allowDisabledInRange || !isDateDisabled || firstDisabledIn(r.from, r.to, isDateDisabled) === null)) {
      if (!sameRange(r, value)) commit(r);
      setDirty(false);
      setBadText(false);
      return;
    }
    setBadText(true);
  };
  const pickFromCalendar = (r) => {
    commit(r);
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
  const buttonLabel = calendarLabel ?? (value ? strings.changeDates(strings.dateRange(fullDate(value.from, loc), fullDate(value.to, loc))) : strings.chooseDates);
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
            placeholder: placeholder ?? rangePlaceholder(loc, {
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
        name != null ? /* @__PURE__ */ jsx("input", { type: "hidden", name, value: value ? `${value.from}/${value.to}` : "", form, disabled }) : null,
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
        /* @__PURE__ */ jsx(Popover, { open, onOpenChange: (o) => setOpen(o), anchor: buttonRef, align: "end", "aria-label": strings.chooseDates, className: "p-3", children: /* @__PURE__ */ jsx(
          RangeCalendar,
          {
            value,
            onValueChange: pickFromCalendar,
            min: minProp,
            max: maxProp,
            isDateDisabled,
            allowDisabledInRange,
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
  DateRangePicker
};
