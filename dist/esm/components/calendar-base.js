"use client";

// src/components/calendar-base.tsx
import {
  useId,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { cn } from "../cn.js";
import { getDefaultLocale } from "../format.js";
import {
  addDays,
  calendarDayClass,
  calendarKeyTarget,
  clampIso,
  dayNumber,
  firstOfMonth,
  fullDate,
  inRange,
  isoToday,
  monthGrid,
  monthNames,
  monthOf,
  monthTitle,
  parseIso,
  parseMonth,
  resolveLocale,
  shiftMonth,
  weekStartFor,
  weekdayNames
} from "./calendar-classes.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons.js";
import { IconButton, Select } from "./primitives.js";
import { useNishContext, useStrings } from "./provider.js";
import { PICKER_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
var warned = /* @__PURE__ */ new Set();
var noopSubscribe = () => () => {
};
var EMPTY_GRID = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null));
var pad2 = (n) => String(n).padStart(2, "0");
var pad4 = (n) => String(n).padStart(4, "0");
function checkIso(component, prop, v, isMonth = false) {
  if (v == null) return null;
  const ok = isMonth ? parseMonth(v) !== null : parseIso(v) !== null;
  if (ok) return v;
  const id = `${component}:${prop}`;
  if (process.env.NODE_ENV !== "production" && !warned.has(id)) {
    warned.add(id);
    console.warn(`${component}: "${prop}" must be ${isMonth ? "YYYY-MM" : "YYYY-MM-DD"}`);
  }
  return null;
}
function CalendarBase({
  componentName,
  initialMonth,
  focusPreference,
  dayLook,
  onPick,
  onDayFocus,
  onDayHover,
  onGridKeyDown,
  multiselectable,
  children,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  min: minProp,
  max: maxProp,
  isDateDisabled,
  locale,
  weekStartsOn,
  captionLayout = "label",
  fromYear,
  toYear,
  autoFocus = false,
  previousMonthLabel,
  nextMonthLabel,
  className,
  ref,
  ...rest
}) {
  const strings = useStrings(PICKER_STRINGS);
  const config = useNishContext();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const ws = weekStartsOn ?? weekStartFor(loc);
  const titleId = useId();
  const rootRef = useRef(null);
  const focusPending = useRef(false);
  const min = checkIso(componentName, "min", minProp);
  const max = checkIso(componentName, "max", maxProp);
  const monthControlled = checkIso(componentName, "month", monthProp, true);
  const defaultMonthIso = checkIso(componentName, "defaultMonth", defaultMonth, true);
  const [ownMonth, setOwnMonth] = useState(() => defaultMonthIso ?? initialMonth);
  const [focusedDate, setFocusedDate] = useState(null);
  const today = useSyncExternalStore(
    noopSubscribe,
    () => isoToday(),
    () => null
  );
  const shown = monthControlled ?? ownMonth ?? (today ? monthOf(today) : null);
  const setMonth = (raw) => {
    const next = clampIso(raw, "0001-01", "9999-12");
    if (next === shown) return;
    if (monthControlled === null) setOwnMonth(next);
    onMonthChange?.(next);
  };
  const disabled = (iso) => !inRange(iso, min, max) || isDateDisabled?.(iso) === true;
  const inShown = (iso) => iso !== null && shown !== null && monthOf(iso) === shown;
  let tabStop = null;
  if (shown) {
    if (inShown(focusedDate)) tabStop = focusedDate;
    else if (inShown(focusPreference)) tabStop = focusPreference;
    else if (inShown(today)) tabStop = today;
    else {
      const days = monthGrid(shown, ws).flat().filter((d) => d !== null);
      tabStop = days.find((d) => !disabled(d)) ?? days[0] ?? null;
    }
  }
  useIsoLayoutEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    if (!focusedDate) return;
    rootRef.current?.querySelector(`[data-date="${focusedDate}"]`)?.focus();
  });
  const setRoot = (node) => {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const pick = (iso) => {
    if (disabled(iso)) return;
    setFocusedDate(iso);
    onPick(iso);
  };
  const onGridKey = (e) => {
    onGridKeyDown?.(e);
    if (e.defaultPrevented) return;
    const from = e.target.closest?.("[data-date]")?.getAttribute("data-date") ?? tabStop;
    if (!from) return;
    const raw = calendarKeyTarget(e.key, e.shiftKey, from, ws, isRtl(e.currentTarget));
    if (!raw) return;
    e.preventDefault();
    const target = clampIso(raw, min ?? "0001-01-01", max ?? "9999-12-31");
    const moved = target !== focusedDate || monthOf(target) !== shown;
    setFocusedDate(target);
    setMonth(monthOf(target));
    if (moved) {
      focusPending.current = true;
    } else {
      e.currentTarget.querySelector(`[data-date="${target}"]`)?.focus();
    }
  };
  const grid = shown ? monthGrid(shown, ws) : EMPTY_GRID;
  const names = weekdayNames(loc, ws);
  const dropdowns = captionLayout === "dropdowns";
  const shownYear = shown ? Number(shown.slice(0, 4)) : null;
  const shownMonthNo = shown ? Number(shown.slice(5, 7)) : null;
  const prevDisabled = !shown || shown <= "0001-01" || min !== null && addDays(firstOfMonth(shown), -1) < min;
  const nextDisabled = !shown || shown >= "9999-12" || max !== null && firstOfMonth(shiftMonth(shown, 1)) > max;
  let years = [];
  if (dropdowns) {
    const baseYear = today ? Number(today.slice(0, 4)) : shownYear ?? 2026;
    const from = fromYear ?? (min ? Number(min.slice(0, 4)) : baseYear - 100);
    const to = toYear ?? (max ? Number(max.slice(0, 4)) : baseYear + 10);
    for (let y = from; y <= to; y++) years.push(y);
    if (shownYear !== null && !years.includes(shownYear)) years = [...years, shownYear].sort((a, b) => a - b);
  }
  return /* @__PURE__ */ jsxs("div", { ...rest, ref: setRoot, className: cn("inline-flex select-none flex-col gap-2", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-1", children: [
      /* @__PURE__ */ jsx(
        IconButton,
        {
          size: "sm",
          label: previousMonthLabel ?? strings.previousMonth,
          "aria-disabled": prevDisabled || void 0,
          className: "aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
          onClick: () => !prevDisabled && shown && setMonth(shiftMonth(shown, -1)),
          children: /* @__PURE__ */ jsx(ChevronLeftIcon, { className: "rtl:-scale-x-100" })
        }
      ),
      /* @__PURE__ */ jsx("div", { id: titleId, "aria-live": "polite", className: cn("text-sm font-semibold text-th-hi", dropdowns && "sr-only"), children: shown ? monthTitle(shown, loc) : "" }),
      dropdowns && /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-1", children: [
        /* @__PURE__ */ jsx(
          Select,
          {
            size: "sm",
            "aria-label": strings.month,
            value: shownMonthNo ?? "",
            disabled: !shown,
            onChange: (e) => shownYear !== null && setMonth(`${pad4(shownYear)}-${pad2(Number(e.target.value))}`),
            children: monthNames(loc).map((name, i) => /* @__PURE__ */ jsx("option", { value: i + 1, children: name }, i))
          }
        ),
        /* @__PURE__ */ jsx(
          Select,
          {
            size: "sm",
            "aria-label": strings.year,
            value: shownYear ?? "",
            disabled: !shown,
            onChange: (e) => shownMonthNo !== null && setMonth(`${pad4(Number(e.target.value))}-${pad2(shownMonthNo)}`),
            children: years.map((y) => /* @__PURE__ */ jsx("option", { value: y, children: y }, y))
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        IconButton,
        {
          size: "sm",
          label: nextMonthLabel ?? strings.nextMonth,
          "aria-disabled": nextDisabled || void 0,
          className: "aria-disabled:cursor-not-allowed aria-disabled:opacity-40",
          onClick: () => !nextDisabled && shown && setMonth(shiftMonth(shown, 1)),
          children: /* @__PURE__ */ jsx(ChevronRightIcon, { className: "rtl:-scale-x-100" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(
      "table",
      {
        role: "grid",
        "aria-labelledby": titleId,
        "aria-multiselectable": multiselectable || void 0,
        className: "border-collapse",
        onKeyDown: onGridKey,
        onPointerLeave: onDayHover ? () => onDayHover(null) : void 0,
        children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: names.map((n) => /* @__PURE__ */ jsx(
            "th",
            {
              scope: "col",
              abbr: n.long,
              className: "size-10 overflow-hidden px-0.5 py-0 text-center text-xs font-medium text-th-hi3 pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]",
              children: n.short
            },
            n.long
          )) }) }),
          /* @__PURE__ */ jsx("tbody", { children: grid.map((row, r) => /* @__PURE__ */ jsx("tr", { children: row.map((iso, c) => {
            if (!iso) {
              return /* @__PURE__ */ jsx("td", { className: "p-0", children: /* @__PURE__ */ jsx(
                "div",
                {
                  "aria-hidden": "true",
                  className: "size-10 pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]"
                }
              ) }, c);
            }
            const look = dayLook(iso);
            const isDisabled = disabled(iso);
            const isTabStop = iso === tabStop;
            return /* @__PURE__ */ jsx("td", { role: "gridcell", "aria-selected": look.ariaSelected, className: "p-0", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                tabIndex: isTabStop ? 0 : -1,
                "data-date": iso,
                "data-autofocus": autoFocus && isTabStop ? "" : void 0,
                "aria-label": fullDate(iso, loc),
                "aria-current": iso === today ? "date" : void 0,
                "aria-disabled": isDisabled || void 0,
                "data-state": look.filled ? "active" : "inactive",
                "data-range": look.band ?? void 0,
                "data-preview": look.preview ? "" : void 0,
                "data-disabled": isDisabled ? "" : void 0,
                onClick: () => pick(iso),
                onFocus: onDayFocus ? () => onDayFocus(iso) : void 0,
                onPointerEnter: onDayHover ? (e) => {
                  if (e.pointerType !== "touch") onDayHover(iso);
                } : void 0,
                className: calendarDayClass({
                  filled: look.filled,
                  band: look.band,
                  today: iso === today,
                  disabled: isDisabled
                }),
                children: dayNumber(iso, loc)
              }
            ) }, c);
          }) }, r)) })
        ]
      }
    ),
    children
  ] });
}
export {
  CalendarBase,
  checkIso
};
