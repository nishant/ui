"use client";

// src/components/time-field.tsx
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../cn.js";
import { getDefaultLocale } from "../format.js";
import { resolveLocale } from "./calendar-classes.js";
import { useIsoLayoutEffect } from "./client.js";
import { setRef } from "./forms-classes.js";
import { fieldClass } from "./primitives-classes.js";
import { Select } from "./primitives.js";
import { useNishConfig, useNishStrings } from "./provider.js";
import {
  dayPeriodNames,
  draftFromTime,
  draftTime,
  from12,
  hourAdvances,
  hourCycleFor,
  hourText,
  inTimeRange,
  lastMinute,
  normalizeStep,
  parseTime,
  stepHour,
  stepMinute
} from "./time-field-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
var pad2 = (n) => String(n).padStart(2, "0");
var warned = /* @__PURE__ */ new Set();
function warnOnce(message) {
  if (process.env.NODE_ENV === "production" || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}
function boxNumber(text, lo, hi) {
  if (!/^\d{1,2}$/.test(text)) return null;
  const n = Number(text);
  return n >= lo && n <= hi ? n : null;
}
function TimeField({
  ref,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step,
  hourCycle,
  locale,
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
  className,
  ...rest
}) {
  const strings = useNishStrings();
  const config = useNishConfig();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const cycle = hourCycle ?? hourCycleFor(loc);
  const st = normalizeStep(step);
  const [am, pm] = dayPeriodNames(loc);
  const minT = parseTime(min) ? min : null;
  const maxT = parseTime(max) ? max : null;
  const auto = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `nish-tf-${auto}`;
  const nameId = `nish-tf-${auto}-name`;
  const hId = `nish-tf-${auto}-h`;
  const mId = `nish-tf-${auto}-m`;
  const pId = `nish-tf-${auto}-p`;
  const derived = ariaLabelledBy == null && ariaLabel == null && id != null;
  const [labelId, setLabelId] = useState(id != null ? `${id}-label` : null);
  useIsoLayoutEffect(() => {
    if (!derived) return;
    if (document.getElementById(`${id}-label`)) {
      setLabelId(`${id}-label`);
      return;
    }
    const nativeLabel = document.getElementById(id)?.labels?.[0];
    const native = nativeLabel?.id || null;
    setLabelId(native);
    if (!native) {
      warnOnce(
        nativeLabel ? "TimeField: give its <label> an id, or use a Field, an aria-label or aria-labelledby." : "TimeField: give it a Field, an aria-label or aria-labelledby."
      );
    }
  }, [derived, id]);
  const src = ariaLabelledBy ?? (ariaLabel != null ? nameId : derived ? labelId ?? void 0 : void 0);
  const names = (own2) => [src, own2].filter(Boolean).join(" ");
  if (ariaLabel == null && ariaLabelledBy == null && id == null) {
    warnOnce("TimeField: give it a Field, an aria-label or aria-labelledby.");
  }
  const controlled = valueProp !== void 0;
  const okProp = (prop, v) => {
    if (v == null) return null;
    if (parseTime(v)) return v;
    warnOnce(`TimeField: "${prop}" must be HH:mm`);
    return null;
  };
  const [own, setOwn] = useState(() => okProp("defaultValue", defaultValue));
  const value = controlled ? okProp("value", valueProp) : own;
  const [draftState, setDraft] = useState(null);
  const [bad, setBad] = useState(false);
  if (draftState !== null && draftState.base !== value) {
    setDraft(null);
    setBad(false);
  }
  const draft = draftState !== null && draftState.base === value ? draftState.d : null;
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const shown = draft ?? draftFromTime(value, cycle);
  const draftBad = () => {
    if (draft === null) return false;
    const t = draftTime(draft, cycle);
    return t === void 0 || t !== null && !inTimeRange(t, minT, maxT);
  };
  const outside = value !== null && !inTimeRange(value, minT, maxT);
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === "true" || bad || outside;
  useEffect(() => {
    hourRef.current?.setCustomValidity(bad || outside ? strings.invalidTime : "");
  }, [bad, outside, strings.invalidTime]);
  useEffect(() => {
    const f = hourRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => {
      setOwn(okProp("defaultValue", defaultValue));
      setDraft(null);
      setBad(false);
    };
    f.addEventListener("reset", onReset);
    return () => f.removeEventListener("reset", onReset);
  }, [name, form, controlled, defaultValue]);
  const commit = (v) => {
    if (!controlled) setOwn(v);
    onValueChange?.(v);
  };
  const update = (next) => {
    const t = draftTime(next, cycle);
    if (t === null) {
      if (value !== null) commit(null);
      setDraft({ d: next, base: null });
      setBad(false);
    } else if (typeof t === "string" && inTimeRange(t, minT, maxT)) {
      if (t !== value) commit(t);
      setDraft({ d: next, base: t });
      setBad(false);
    } else {
      setDraft({ d: next, base: value });
    }
  };
  const focusMinute = () => {
    minuteRef.current?.focus();
    minuteRef.current?.select();
  };
  const onKey = (which) => (e) => {
    if (disabled) return;
    const key = e.key;
    if (key === "Enter") {
      if (draftBad()) {
        e.preventDefault();
        setBad(true);
      }
      return;
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      e.preventDefault();
      const dir = key === "ArrowUp" ? 1 : -1;
      if (which === "h") {
        const hn = boxNumber(shown.h, cycle === 12 ? 1 : 0, cycle === 12 ? 12 : 23);
        const cur = hn === null ? null : cycle === 12 ? from12(hn, shown.pm) : hn;
        const next = stepHour(cur, dir);
        update({ ...shown, h: hourText(next, cycle), pm: next >= 12 });
      } else {
        const cur = boxNumber(shown.m, 0, 59);
        update({ ...shown, m: pad2(stepMinute(cur, dir, st)) });
      }
    } else if (key === "Home") {
      e.preventDefault();
      update(which === "h" ? { ...shown, h: hourText(0, cycle), pm: false } : { ...shown, m: "00" });
    } else if (key === "End") {
      e.preventDefault();
      update(which === "h" ? { ...shown, h: hourText(23, cycle), pm: true } : { ...shown, m: pad2(lastMinute(st)) });
    } else if (cycle === 12 && (key === "a" || key === "A" || key === "p" || key === "P")) {
      e.preventDefault();
      update({ ...shown, pm: key === "p" || key === "P" });
    } else if (which === "h" && (key === ":" || key === ".")) {
      e.preventDefault();
      focusMinute();
    } else if (which === "m" && key === "Backspace" && shown.m === "") {
      e.preventDefault();
      hourRef.current?.focus();
    }
  };
  const hourNow = boxNumber(shown.h, cycle === 12 ? 1 : 0, cycle === 12 ? 12 : 23);
  const minuteNow = boxNumber(shown.m, 0, 59);
  const boxClass = fieldClass({
    size,
    invalid: isInvalid,
    className: "w-12 ps-0 pe-0 text-center tabular-nums pointer-coarse:w-14"
  });
  const common = {
    type: "text",
    inputMode: "numeric",
    autoComplete: "off",
    spellCheck: false,
    maxLength: 2,
    role: "spinbutton",
    placeholder: "--",
    disabled,
    required,
    // The boxes have no name, so nothing extra posts; this puts them (and their validity) in the same form.
    form,
    "aria-required": required || void 0,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": isInvalid || void 0,
    className: boxClass,
    onFocus: (e) => e.currentTarget.select()
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      role: "group",
      "aria-labelledby": src,
      "data-disabled": disabled ? "" : void 0,
      className: cn("inline-flex items-center gap-2", className),
      onBlur: (e) => {
        rest.onBlur?.(e);
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        const isBad = draftBad();
        setBad(isBad);
        if (!isBad) setDraft(null);
      },
      children: [
        ariaLabel != null ? /* @__PURE__ */ jsx("span", { id: nameId, hidden: true, children: ariaLabel }) : null,
        /* @__PURE__ */ jsx("span", { id: hId, hidden: true, children: strings.hour }),
        /* @__PURE__ */ jsx("span", { id: mId, hidden: true, children: strings.minute }),
        cycle === 12 ? /* @__PURE__ */ jsx("span", { id: pId, hidden: true, children: strings.dayPeriod }) : null,
        /* @__PURE__ */ jsxs("span", { dir: "ltr", className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ...common,
              ref: (node) => {
                hourRef.current = node;
                setRef(ref, node);
              },
              id: inputId,
              value: shown.h,
              "aria-labelledby": names(hId),
              "aria-valuemin": cycle === 12 ? 1 : 0,
              "aria-valuemax": cycle === 12 ? 12 : 23,
              "aria-valuenow": hourNow ?? void 0,
              onChange: (e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 2);
                update({ ...shown, h: d });
                if (hourAdvances(d, cycle)) focusMinute();
              },
              onKeyDown: (e) => onKey("h")(e)
            }
          ),
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "text-th-hi3", children: ":" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              ...common,
              ref: minuteRef,
              value: shown.m,
              "aria-labelledby": names(mId),
              "aria-valuemin": 0,
              "aria-valuemax": 59,
              "aria-valuenow": minuteNow ?? void 0,
              onChange: (e) => update({ ...shown, m: e.target.value.replace(/\D/g, "").slice(0, 2) }),
              onKeyDown: (e) => onKey("m")(e)
            }
          )
        ] }),
        cycle === 12 ? /* @__PURE__ */ jsxs(
          Select,
          {
            value: shown.pm ? "pm" : "am",
            onChange: (e) => update({ ...shown, pm: e.target.value === "pm" }),
            size,
            disabled,
            "aria-labelledby": names(pId),
            className: "w-auto shrink-0",
            children: [
              /* @__PURE__ */ jsx("option", { value: "am", children: am }),
              /* @__PURE__ */ jsx("option", { value: "pm", children: pm })
            ]
          }
        ) : null,
        name != null ? /* @__PURE__ */ jsx("input", { type: "hidden", name, value: value ?? "", form, disabled }) : null
      ]
    }
  );
}
export {
  TimeField
};
