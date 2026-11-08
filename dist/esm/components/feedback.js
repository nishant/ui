"use client";

// src/components/feedback.tsx
import { cn } from "../cn.js";
import { AlertTriangleIcon, LoaderIcon, RotateIcon } from "./icons.js";
import { cardClass } from "./primitives.js";
import { useNishStrings } from "./provider.js";
import { jsx, jsxs } from "react/jsx-runtime";
function Skeleton({ className, style, ref, ...rest }) {
  return /* @__PURE__ */ jsx("div", { ...rest, ref, "aria-hidden": "true", className: cn("nish-skeleton rounded-md", className), style });
}
function SkeletonRows({ rows = 5, height = 56, gap = "md", label, className, rowClassName, ref, ...rest }) {
  const s = useNishStrings();
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, role: "status", className: cn("grid", gap === "sm" ? "gap-1.5" : "gap-2.5", className), children: [
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: label ?? s.loading }),
    Array.from({ length: rows }, (_, i) => /* @__PURE__ */ jsx(Skeleton, { className: cn("w-full rounded-xl", rowClassName), style: rowClassName && /\bh-/.test(rowClassName) ? void 0 : { height } }, i))
  ] });
}
var SPINNER_SIZE = { xs: 12, sm: 14, md: 16, lg: 24 };
function Spinner({ size = "md", label, className, ref, ...rest }) {
  const icon = /* @__PURE__ */ jsx(LoaderIcon, { size: SPINNER_SIZE[size], className: "animate-spin" });
  if (!label) {
    return /* @__PURE__ */ jsx("span", { ...rest, ref, "aria-hidden": "true", className: cn("inline-flex shrink-0 items-center", className), children: icon });
  }
  return /* @__PURE__ */ jsxs("span", { ...rest, ref, role: "status", className: cn("inline-flex shrink-0 items-center", className), children: [
    icon,
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: label })
  ] });
}
function SkeletonLines({ lines = 3, className, label, ref, ...rest }) {
  const s = useNishStrings();
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, role: "status", className: cn("flex flex-col gap-2.5 p-3", className), children: [
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: label ?? s.loading }),
    /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-2/5" }),
    Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx(Skeleton, { className: cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5") }, i))
  ] });
}
function SkeletonCard({ lines = 3, media = "none", className, ref, ...rest }) {
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, "aria-hidden": "true", className: cn(cardClass({ padding: "md" }), "flex flex-col gap-3", className), children: [
    media === "square" ? /* @__PURE__ */ jsx(Skeleton, { className: "size-24 rounded-lg" }) : null,
    media === "wide" ? /* @__PURE__ */ jsx(Skeleton, { className: "aspect-video w-full rounded-lg" }) : null,
    /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-2/5" }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx(Skeleton, { className: cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5") }, i)) })
  ] });
}
function StatGridSkeleton({ count = 4, className, label, ref, ...rest }) {
  const s = useNishStrings();
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, role: "status", className: cn("grid grid-cols-2 gap-3 md:grid-cols-4", className), children: [
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: label ?? s.loading }),
    Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsxs("div", { className: cn(cardClass({ padding: "sm" }), "min-w-0"), children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-3 w-16" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "mt-2 h-7 w-24" }),
      /* @__PURE__ */ jsx(Skeleton, { className: "mt-1.5 h-3 w-12" })
    ] }, i))
  ] });
}
function CardListSkeleton({ count = 3, lines = 2, className, label, ref, ...rest }) {
  const s = useNishStrings();
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, role: "status", className: cn("grid gap-2.5", className), children: [
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: label ?? s.loading }),
    Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsx(SkeletonCard, { lines }, i))
  ] });
}
function EmptyState({ icon, title, detail, action, compact = false, className, ref, ...rest }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-1.5 p-4" : "gap-2 rounded-xl border border-dashed border-th-line px-6 py-12",
        className
      ),
      children: [
        icon ? /* @__PURE__ */ jsx("span", { className: "text-th-ghost [&>svg]:size-7", children: icon }) : null,
        /* @__PURE__ */ jsx("p", { className: cn("font-medium text-th-hi2", compact ? "text-xs" : "text-sm"), children: title }),
        detail ? /* @__PURE__ */ jsx("p", { className: "max-w-sm text-xs text-th-hi3", children: detail }) : null,
        action ? /* @__PURE__ */ jsx("div", { className: "mt-2", children: action }) : null
      ]
    }
  );
}
function ErrorState({
  message,
  onRetry,
  retryLabel,
  retrying = false,
  compact = false,
  className,
  ref,
  ...rest
}) {
  const s = useNishStrings();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      role: "alert",
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-2 p-4" : "gap-2 rounded-xl border border-th-loss/30 bg-th-loss-soft px-6 py-10",
        className
      ),
      children: [
        /* @__PURE__ */ jsx(AlertTriangleIcon, { size: compact ? 16 : 22, className: "shrink-0 text-th-loss" }),
        /* @__PURE__ */ jsx("p", { className: cn("max-w-md text-th-hi2", compact ? "text-xs" : "text-sm"), children: message ?? s.failedToLoad }),
        onRetry ? /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: onRetry,
            disabled: retrying,
            className: "mt-1 inline-flex items-center gap-1.5 rounded-full border border-th-line-strong px-3 py-1 text-xs text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi disabled:opacity-50 pointer-coarse:min-h-11",
            children: [
              retrying ? /* @__PURE__ */ jsx(LoaderIcon, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsx(RotateIcon, { size: 12 }),
              retryLabel ?? s.retry
            ]
          }
        ) : null
      ]
    }
  );
}
export {
  CardListSkeleton,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonCard,
  SkeletonLines,
  SkeletonRows,
  Spinner,
  StatGridSkeleton
};
