"use client";

// src/components/calendar.tsx
import { useState } from "react";
import { monthOf } from "./calendar-classes.js";
import { CalendarBase, checkIso } from "./calendar-base.js";
import { jsx } from "react/jsx-runtime";
function Calendar({ value, defaultValue, onValueChange, ...rest }) {
  const valueIso = checkIso("Calendar", "value", value);
  const defaultIso = checkIso("Calendar", "defaultValue", defaultValue);
  const controlled = value !== void 0;
  const [own, setOwn] = useState(defaultIso);
  const selected = controlled ? valueIso : own;
  return /* @__PURE__ */ jsx(
    CalendarBase,
    {
      ...rest,
      componentName: "Calendar",
      initialMonth: selected ? monthOf(selected) : null,
      focusPreference: selected,
      dayLook: (iso) => ({ filled: iso === selected, band: null, ariaSelected: iso === selected }),
      onPick: (iso) => {
        if (!controlled) setOwn(iso);
        onValueChange?.(iso);
      }
    }
  );
}
export {
  Calendar
};
