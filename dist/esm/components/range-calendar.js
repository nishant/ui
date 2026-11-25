"use client";

// src/components/range-calendar.tsx
import { useState } from "react";
import { getDefaultLocale } from "../format.js";
import {
  firstDisabledIn,
  fullDate,
  inRange,
  monthOf,
  orderRange,
  parseIso,
  resolveLocale,
  toRange
} from "./calendar-classes.js";
import { CalendarBase } from "./calendar-base.js";
import { useStrings, useNishContext } from "./provider.js";
import { PICKER_STRINGS } from "./strings.js";
import { jsx } from "react/jsx-runtime";
var warned = /* @__PURE__ */ new Set();
var OUTSIDE = { filled: false, band: null, ariaSelected: false };
function warnOnce(key, message) {
  if (process.env.NODE_ENV === "production" || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}
function checkRange(prop, v) {
  if (v == null) return null;
  const r = toRange(v);
  if (!r) {
    warnOnce(`${prop}:shape`, `RangeCalendar: "${prop}" must be { from, to } with YYYY-MM-DD days`);
    return null;
  }
  if (v.from > v.to) warnOnce(`${prop}:order`, `RangeCalendar: "${prop}" has from after to; the days were swapped`);
  return r;
}
function RangeCalendar({
  value,
  defaultValue,
  onValueChange,
  allowDisabledInRange = false,
  ...shared
}) {
  const strings = useStrings(PICKER_STRINGS);
  const config = useNishContext();
  const loc = resolveLocale(shared.locale ?? config.locale ?? getDefaultLocale());
  const { min: minProp, max: maxProp, isDateDisabled } = shared;
  const min = minProp != null && parseIso(minProp) ? minProp : null;
  const max = maxProp != null && parseIso(maxProp) ? maxProp : null;
  const controlled = value !== void 0;
  const [own, setOwn] = useState(() => checkRange("defaultValue", defaultValue));
  const [anchor, setAnchor] = useState(null);
  const [hover, setHover] = useState(null);
  const [focusDay, setFocusDay] = useState(null);
  const [status, setStatus] = useState("");
  const range = controlled ? checkRange("value", value) : own;
  const off = (iso) => !inRange(iso, min, max) || isDateDisabled?.(iso) === true;
  const blocks = (r) => !allowDisabledInRange && !!isDateDisabled && firstDisabledIn(r.from, r.to, isDateDisabled) !== null;
  let band = range;
  if (anchor) {
    const target = hover ?? focusDay ?? anchor;
    const r = orderRange(anchor, target);
    band = off(target) || blocks(r) ? { from: anchor, to: anchor } : r;
  }
  const dayLook = (iso) => {
    if (!band || iso < band.from || iso > band.to) return OUTSIDE;
    const single = band.from === band.to;
    return {
      filled: anchor ? iso === anchor : iso === band.from || iso === band.to,
      band: single ? null : iso === band.from ? "start" : iso === band.to ? "end" : "middle",
      ariaSelected: anchor ? iso === anchor : true,
      preview: !!anchor && iso !== anchor
    };
  };
  const start = (iso) => {
    setAnchor(iso);
    setStatus(strings.rangeStarted(fullDate(iso, loc)));
  };
  const onPick = (iso) => {
    if (!anchor) {
      start(iso);
      return;
    }
    const r = orderRange(anchor, iso);
    if (blocks(r)) {
      start(iso);
      return;
    }
    setAnchor(null);
    setHover(null);
    if (!controlled) setOwn(r);
    setStatus(strings.dateRange(fullDate(r.from, loc), fullDate(r.to, loc)));
    onValueChange?.(r);
  };
  const onGridKeyDown = (e) => {
    if (e.key === "Escape" && anchor !== null) {
      e.preventDefault();
      e.stopPropagation();
      setAnchor(null);
      setHover(null);
      setStatus("");
    }
  };
  return /* @__PURE__ */ jsx(
    CalendarBase,
    {
      ...shared,
      componentName: "RangeCalendar",
      initialMonth: range ? monthOf(range.from) : null,
      focusPreference: anchor ?? range?.from ?? null,
      dayLook,
      onPick,
      onDayFocus: setFocusDay,
      onDayHover: setHover,
      onGridKeyDown,
      multiselectable: true,
      children: /* @__PURE__ */ jsx("p", { "aria-live": "polite", className: "sr-only", children: status })
    }
  );
}
export {
  RangeCalendar
};
