"use client";

// src/components/settings.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { Spinner } from "./feedback.js";
import { Card, Input } from "./primitives.js";
import { useNishStrings } from "./provider.js";
import { jsx, jsxs } from "react/jsx-runtime";
var CompactSettings = /* @__PURE__ */ createContext(false);
function SettingsSection({ title, description, id, actions, compact = false, children, className, ref, ...rest }) {
  const auto = useId();
  const headingId = `${id ?? auto}-heading`;
  return /* @__PURE__ */ jsxs("section", { ...rest, ref, id, "aria-labelledby": rest["aria-labelledby"] ?? headingId, className: cn("min-w-0", className), children: [
    /* @__PURE__ */ jsxs("div", { className: cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-2", compact ? "mb-1" : "mb-3"), children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("h2", { id: headingId, className: compact ? "text-sm font-semibold text-th-hi2" : "text-base font-semibold text-th-hi", children: title }),
        description != null ? /* @__PURE__ */ jsx("p", { className: cn("mt-0.5 text-th-hi3", compact ? "text-xs" : "text-sm"), children: description }) : null
      ] }),
      actions != null ? /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center gap-2", children: actions }) : null
    ] }),
    /* @__PURE__ */ jsx(CompactSettings.Provider, { value: compact, children: compact ? /* @__PURE__ */ jsx("div", { className: "divide-y divide-th-line", children }) : /* @__PURE__ */ jsx(Card, { padding: "none", className: "divide-y divide-th-line", children }) })
  ] });
}
var STATUS_TONE = { muted: "text-th-hi3", error: "text-th-loss", ok: "text-th-ok" };
function SettingRow({
  label,
  description,
  children,
  htmlFor,
  stacked = false,
  inline = false,
  compact: compactProp,
  status,
  statusTone = "muted",
  className,
  ref,
  ...rest
}) {
  const inCompactSection = useContext(CompactSettings);
  const compact = compactProp ?? inCompactSection;
  const labelClass = "block text-sm font-medium text-th-hi";
  const auto = useId();
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const side = inline || compact && !stacked;
  const layout = stacked ? "flex flex-col gap-2" : side ? "grid grid-cols-[1fr_auto] items-center gap-4" : "flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      className: cn(compact ? cn("min-h-11 py-2", !inCompactSection && "px-4") : "min-h-[56px] px-4 py-3", layout, className),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          htmlFor ? /* @__PURE__ */ jsx("label", { htmlFor, className: labelClass, children: label }) : /* @__PURE__ */ jsx("span", { id: labelId, className: labelClass, children: label }),
          description != null ? /* @__PURE__ */ jsx("p", { id: descId, className: cn("mt-0.5 text-th-hi3", compact ? "text-xs" : "text-sm"), children: description }) : null
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ...htmlFor ? {} : { role: "group", "aria-labelledby": labelId, "aria-describedby": description != null ? descId : void 0 },
            className: cn("flex min-w-0 items-center gap-2", stacked ? "w-full" : side ? "justify-end" : "w-full sm:w-auto sm:justify-end"),
            children: [
              children,
              /* @__PURE__ */ jsx("span", { role: "status", "aria-live": "polite", className: cn("shrink-0 text-sm empty:hidden", STATUS_TONE[statusTone]), children: status })
            ]
          }
        )
      ]
    }
  );
}
var SAVED_MS = 1500;
var ERROR_MS = 3e3;
function useSaveStatus() {
  const strings = useNishStrings();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const timer = useRef(void 0);
  const token = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const run = useCallback(async (p) => {
    const mine = ++token.current;
    clearTimeout(timer.current);
    setError(null);
    setStatus("saving");
    const settle = (next, ms) => {
      if (!mounted.current || token.current !== mine) return;
      setStatus(next);
      timer.current = setTimeout(() => {
        if (!mounted.current || token.current !== mine) return;
        setStatus("idle");
        setError(null);
      }, ms);
    };
    try {
      const out = await p;
      settle("saved", SAVED_MS);
      return out;
    } catch (e) {
      if (mounted.current && token.current === mine) setError(e instanceof Error ? e.message : String(e));
      settle("error", ERROR_MS);
      return void 0;
    }
  }, []);
  const label = status === "saving" ? strings.saving : status === "saved" ? strings.saved : status === "error" ? error || strings.saveFailed : null;
  const tone = status === "saved" ? "ok" : status === "error" ? "error" : "muted";
  return { status, error, label, tone, run };
}
var parseDraft = (text) => Number(text.trim().replace(/,/g, "").replace(/\u2212/g, "-"));
var fmt = (v) => v == null ? "" : String(v);
var decimals = (n) => String(n).split(".")[1]?.length ?? 0;
function NumberField({
  value,
  onCommit,
  min,
  max,
  step = 1,
  nullable = false,
  suffix,
  precision,
  className,
  onBlur,
  onKeyDown,
  id,
  invalid,
  "aria-describedby": describedBy,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const auto = useId();
  const errId = `${id ?? auto}-error`;
  const [draft, setDraftState] = useState(fmt(value));
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const draftRef = useRef(draft);
  const lastSent = useRef(null);
  const mounted = useRef(true);
  const skipCommit = useRef(false);
  const setDraft = (next) => {
    draftRef.current = next;
    setDraftState(next);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    lastSent.current = null;
    setDraft(fmt(value));
  }, [value]);
  const clamp = (n) => {
    let out = n;
    if (min != null) out = Math.max(min, out);
    if (max != null) out = Math.min(max, out);
    return out;
  };
  const fail = (e) => {
    lastSent.current = null;
    setDraft(fmt(value));
    setError(e instanceof Error ? e.message : String(e));
  };
  const commit = () => {
    const text = draftRef.current.trim();
    let next;
    if (text === "") {
      if (!nullable) {
        setDraft(fmt(value));
        return;
      }
      next = null;
    } else {
      const n = parseDraft(text);
      if (Number.isNaN(n)) {
        setDraft(fmt(value));
        setError(strings.enterNumber);
        return;
      }
      let c = clamp(n);
      if (precision != null) c = Number(c.toFixed(precision));
      next = c;
    }
    setDraft(fmt(next));
    if (next === value) return;
    if (lastSent.current && lastSent.current.v === next) return;
    setError(null);
    lastSent.current = { v: next };
    let result;
    try {
      result = onCommit(next);
    } catch (e) {
      fail(e);
      return;
    }
    if (result && typeof result.then === "function") {
      setPending(true);
      result.then(
        () => {
          if (mounted.current) setPending(false);
        },
        (e) => {
          if (!mounted.current) return;
          setPending(false);
          fail(e);
        }
      );
    }
  };
  const nudge = (dir) => {
    const base = parseDraft(draftRef.current);
    const from = Number.isNaN(base) || draftRef.current.trim() === "" ? value ?? min ?? 0 : base;
    const n = Number(clamp(from + dir * step).toFixed(Math.max(precision ?? 0, decimals(step), decimals(from))));
    setDraft(String(n));
    lastSent.current = null;
  };
  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setDraft(fmt(value));
      setError(null);
      skipCommit.current = true;
      e.currentTarget.blur();
      skipCommit.current = false;
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      nudge(e.key === "ArrowUp" ? 1 : -1);
    }
  };
  const shown = parseDraft(draft);
  const now = draft.trim() !== "" && !Number.isNaN(shown) ? shown : value ?? void 0;
  const negatives = min != null && min < 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          inputMode: negatives ? "text" : "decimal",
          ...rest,
          ref,
          id,
          type: "text",
          role: "spinbutton",
          "aria-valuemin": min,
          "aria-valuemax": max,
          "aria-valuenow": now,
          "aria-valuetext": now != null && typeof suffix === "string" ? `${now} ${suffix}` : void 0,
          autoComplete: "off",
          value: draft,
          invalid: invalid || error != null,
          "aria-describedby": cn(describedBy, error != null && errId) || void 0,
          "aria-busy": pending || void 0,
          className: cn("w-28", className),
          onChange: (e) => {
            setDraft(e.target.value);
            lastSent.current = null;
            if (error != null) setError(null);
          },
          onBlur: (e) => {
            onBlur?.(e);
            if (skipCommit.current) return;
            commit();
          },
          onKeyDown: handleKeyDown
        }
      ),
      suffix != null ? /* @__PURE__ */ jsx("span", { className: "text-sm text-th-hi3", children: suffix }) : null,
      pending ? /* @__PURE__ */ jsx(Spinner, { size: "sm", label: strings.saving, className: "text-th-hi3" }) : null
    ] }),
    error != null ? /* @__PURE__ */ jsx("span", { id: errId, role: "alert", className: "text-sm text-th-loss", children: error }) : null
  ] });
}
export {
  NumberField,
  SettingRow,
  SettingsSection,
  useSaveStatus
};
