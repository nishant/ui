"use client";

// src/components/canvas/follow-caption.tsx
import { memo, useEffect, useRef, useState } from "react";
import { StatusDot } from "../display.js";
import { TickerText } from "../flow.js";
import { DEFAULT_CANVAS_LABELS } from "./types.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var FollowCaption = memo(function FollowCaption2({ step, labels = DEFAULT_CANVAS_LABELS }) {
  const only = step && step.targets.length === 1 ? step.targets[0] : null;
  const text = !step ? null : step.mode === "idle" ? labels.followIdle : only ? labels.followOne(only.group, only.label) : labels.followMany(step.targets.length);
  const textRef = useRef(text);
  const [spoken, setSpoken] = useState("");
  const mode = step?.mode;
  useEffect(() => {
    textRef.current = text;
  });
  useEffect(() => {
    setSpoken(mode ? textRef.current ?? "" : "");
  }, [mode]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { role: "status", "aria-live": "polite", className: "sr-only", children: spoken }),
    step ? /* @__PURE__ */ jsxs(
      "div",
      {
        "data-canvas-ui": true,
        "data-follow-caption": true,
        className: "absolute bottom-[68px] start-3 z-10 flex max-w-[min(420px,calc(100%-24px))] items-center gap-2 rounded-xl border border-th-line bg-th-surface px-3 py-2 text-xs text-th-hi shadow-card min-[600px]:bottom-3",
        children: [
          /* @__PURE__ */ jsx(StatusDot, { tone: "accent", pulse: step.mode !== "idle" }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "truncate", children: text }),
            only?.note ? /* @__PURE__ */ jsx(TickerText, { as: "div", text: only.note, className: "truncate text-th-hi3" }) : null
          ] })
        ]
      }
    ) : null
  ] });
});
export {
  FollowCaption
};
