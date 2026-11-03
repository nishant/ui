"use client";

// src/components/display.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { sparklineGeometry } from "../sparkline-path.js";
import { safeUrl } from "../url.js";
import { mergeRefs } from "./data-classes.js";
import { displayInternals, FORCED_MARK, toneFor, warnDev } from "./display-classes.js";
import { Skeleton } from "./feedback.js";
import { AlertTriangleIcon, CheckCircleIcon, ChevronDownIcon, InfoIcon, XIcon } from "./icons.js";
import { useHeightVar, useStuck } from "./layout-vars.js";
import { DropdownMenu, Tooltip } from "./overlay.js";
import { Badge, Button, Card, IconButton } from "./primitives.js";
import { useNishStrings } from "./provider.js";
import { ThemeToggle } from "./theme-toggle.js";
import { signTone, toneFor as toneFor2 } from "./display-classes.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var {
  FILL,
  CALLOUT_TONE,
  CALLOUT_CLAMP,
  DOT_SIZE,
  HALO,
  STAT_VALUE_SIZE,
  STAT_SKELETON,
  STAT_TONE,
  GRID_BASE,
  GRID_MD,
  METER_FILL,
  METER_THICK,
  METER_THICK_V,
  SPARK_TONE,
  LEGEND_FILL
} = displayInternals;
function Svg({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      children
    }
  );
}
var CopyIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2" }),
  /* @__PURE__ */ jsx("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
] });
var CheckIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) });
var ChevronRightIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) });
function defaultCalloutIcon(tone, size) {
  if (tone === "ok") return /* @__PURE__ */ jsx(CheckCircleIcon, { size });
  if (tone === "warn" || tone === "loss") return /* @__PURE__ */ jsx(AlertTriangleIcon, { size });
  return /* @__PURE__ */ jsx(InfoIcon, { size });
}
function Callout({
  tone = "info",
  icon,
  title,
  children,
  action,
  onDismiss,
  dismissLabel,
  variant = "box",
  compact = false,
  live = false,
  sticky = false,
  clamp,
  href: hrefProp,
  onClick,
  count,
  className,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const t = CALLOUT_TONE[tone];
  const shown = icon === false ? null : icon ?? defaultCalloutIcon(tone, compact ? 14 : 16);
  const href = hrefProp == null ? void 0 : safeUrl(hrefProp) ?? void 0;
  if (hrefProp != null && href === void 0) warnDev(`nish-ui: Callout dropped an unsafe href (${hrefProp.slice(0, 40)}).`);
  const interactive = href != null || onClick != null;
  const iconEl = shown ? /* @__PURE__ */ jsx("span", { className: cn("shrink-0", compact ? "mt-px" : "mt-0.5", t.icon), children: shown }) : null;
  const text = /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 basis-60", children: [
    title || count != null ? /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 font-medium leading-snug text-th-hi", children: [
      title ? /* @__PURE__ */ jsx("span", { className: "min-w-0", children: title }) : null,
      count != null ? /* @__PURE__ */ jsxs(Badge, { tone, "aria-label": strings.moreCount(count), className: "shrink-0", children: [
        "+",
        count
      ] }) : null
    ] }) : null,
    children ? /* @__PURE__ */ jsx("div", { className: cn("leading-snug text-th-hi2", title || count != null ? "mt-0.5" : null, clamp && CALLOUT_CLAMP[clamp]), children }) : null
  ] });
  const actionEl = action ? /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center gap-2", children: action }) : null;
  const dismissEl = onDismiss ? /* @__PURE__ */ jsx(IconButton, { label: dismissLabel ?? strings.dismiss, size: "xs", onClick: onDismiss, className: "-my-0.5 -me-1", children: /* @__PURE__ */ jsx(XIcon, { size: 14 }) }) : null;
  const chevron = /* @__PURE__ */ jsx(ChevronDownIcon, { size: 16, className: "-rotate-90 shrink-0 self-center text-th-hi3 rtl:rotate-90" });
  const hit = cn(
    "flex min-h-11 min-w-0 flex-1 items-start text-start outline-none focus-visible:ring-2 focus-visible:ring-th-accent/40",
    compact ? "gap-2" : "gap-3",
    // Pull the padding of the row into the link so the whole row is the target.
    compact ? "-my-2 py-2" : "-my-3 py-3"
  );
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      role: live ? tone === "loss" ? "alert" : "status" : void 0,
      "data-nish-bar": sticky ? "" : void 0,
      className: cn(
        "flex border",
        variant === "bar" && action ? "items-center" : "items-start",
        compact ? "gap-2 px-3 py-2 text-xs" : "gap-3 px-4 py-3 text-sm",
        variant === "bar" ? "w-full rounded-none border-x-0" : "rounded-xl",
        variant === "bar" ? t.bar : t.box,
        sticky && "sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)]",
        className
      ),
      ...rest,
      children: interactive ? /* @__PURE__ */ jsxs(Fragment, { children: [
        href != null ? /* @__PURE__ */ jsxs("a", { href, className: hit, children: [
          iconEl,
          /* @__PURE__ */ jsx("span", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: text }),
          chevron
        ] }) : /* @__PURE__ */ jsxs("button", { type: "button", onClick, className: hit, children: [
          iconEl,
          /* @__PURE__ */ jsx("span", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: text }),
          chevron
        ] }),
        actionEl,
        dismissEl
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        iconEl,
        /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: [
          text,
          actionEl
        ] }),
        dismissEl
      ] })
    }
  );
}
function StatusDot({ tone, size = "sm", pulse = false, halo = false, label, className, ref, ...rest }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      ref,
      role: label ? "img" : void 0,
      "aria-label": label,
      "aria-hidden": label ? void 0 : true,
      "data-tone": tone,
      className: cn(
        "inline-block shrink-0 rounded-full",
        DOT_SIZE[size],
        FILL[tone],
        halo && HALO[tone],
        pulse && "motion-safe:animate-pulse",
        FORCED_MARK,
        "forced-colors:border forced-colors:border-[CanvasText]",
        className
      ),
      ...rest
    }
  );
}
var InStatGrid = /* @__PURE__ */ createContext(false);
function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  tip,
  size = "md",
  variant = "card",
  loading = false,
  className,
  ref,
  ...rest
}) {
  const inGrid = useContext(InStatGrid);
  const quiet = variant === "inset" ? "text-th-hi2" : "text-th-hi3";
  const body = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("dt", { className: cn("text-xs", quiet), children: tip ? /* @__PURE__ */ jsx(Tooltip, { tip, variant: "hint", children: label }) : label }),
    loading ? /* @__PURE__ */ jsxs("dd", { className: "mt-1", "aria-busy": "true", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: cn("w-24", STAT_SKELETON[size]) }),
      sub ? /* @__PURE__ */ jsx(Skeleton, { className: "mt-1.5 h-3 w-16" }) : null
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "dd",
        {
          className: cn(
            "mt-0.5 font-semibold tabular-nums tracking-tight [overflow-wrap:anywhere]",
            STAT_VALUE_SIZE[size],
            STAT_TONE[tone]
          ),
          children: value
        }
      ),
      sub ? /* @__PURE__ */ jsx("dd", { className: cn("mt-0.5 text-xs", quiet), children: sub }) : null
    ] })
  ] });
  if (variant === "card") {
    return /* @__PURE__ */ jsx(Card, { ref, padding: "sm", className: cn("min-w-0", className), ...rest, children: inGrid ? body : /* @__PURE__ */ jsx("dl", { children: body }) });
  }
  const Box = inGrid ? "div" : "dl";
  return /* @__PURE__ */ jsx(
    Box,
    {
      ref,
      className: cn("min-w-0", variant === "inset" && "rounded-lg bg-th-elevated p-3", className),
      ...rest,
      children: body
    }
  );
}
function StatGrid({ cols, children, className, ref, ...rest }) {
  return /* @__PURE__ */ jsx("dl", { ref, className: cn("grid gap-3", GRID_BASE[cols?.base ?? 2], GRID_MD[cols?.md ?? 4], className), ...rest, children: /* @__PURE__ */ jsx(InStatGrid.Provider, { value: true, children }) });
}
function Meter({
  value,
  min = 0,
  max = 100,
  label,
  tone,
  thresholds,
  size = "sm",
  orientation = "horizontal",
  track = "elevated",
  kind = "meter",
  showValue = false,
  className,
  ref,
  ...rest
}) {
  const span = max - min || 1;
  const clamped = Math.min(Math.max(value, min), max);
  const pct = (clamped - min) / span * 100;
  const resolved = tone ?? (thresholds ? toneFor(clamped, thresholds) : "accent");
  const vertical = orientation === "vertical";
  const bar = /* @__PURE__ */ jsx(
    "div",
    {
      ...rest,
      ref,
      role: kind === "progress" ? "progressbar" : "meter",
      "aria-label": label,
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": clamped,
      "aria-valuetext": `${Math.round(pct)}%`,
      "data-tone": resolved,
      className: cn(
        "relative shrink-0 overflow-hidden rounded-full",
        track === "overlay" ? "bg-th-overlay" : "bg-th-elevated",
        "forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]",
        vertical ? cn("h-full", METER_THICK_V[size]) : cn("w-full", METER_THICK[size]),
        !showValue && className
      ),
      children: /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "absolute rounded-full duration-300 ease-out motion-reduce:transition-none",
            vertical ? "inset-x-0 bottom-0 transition-[height]" : "inset-y-0 start-0 transition-[width]",
            METER_FILL[resolved],
            FORCED_MARK
          ),
          style: vertical ? { height: `${pct}%` } : { width: `${pct}%` }
        }
      )
    }
  );
  if (!showValue || vertical) return bar;
  return /* @__PURE__ */ jsxs("div", { className: cn("flex w-full items-center gap-2", className), children: [
    bar,
    /* @__PURE__ */ jsxs("span", { "aria-hidden": "true", className: "w-9 shrink-0 text-end text-xs tabular-nums text-th-hi3", children: [
      Math.round(pct),
      "%"
    ] })
  ] });
}
function Sparkline({
  values,
  label,
  tone = "chart-1",
  width = 120,
  height = 28,
  fill = false,
  min,
  max,
  className,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const { empty, lines, areas, baseline } = useMemo(
    () => sparklineGeometry(values, width, height, min, max),
    [values, width, height, min, max]
  );
  return /* @__PURE__ */ jsx(
    "svg",
    {
      role: "img",
      "aria-label": empty ? strings.noDataNamed(label) : label,
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "none",
      ...rest,
      ref,
      className: cn("block shrink-0 overflow-visible", empty ? "text-th-line-strong" : SPARK_TONE[tone], className),
      children: empty ? /* @__PURE__ */ jsx(
        "path",
        {
          d: baseline,
          stroke: "currentColor",
          strokeWidth: 1.5,
          strokeDasharray: "3 3",
          vectorEffect: "non-scaling-stroke"
        }
      ) : /* @__PURE__ */ jsxs(Fragment, { children: [
        fill ? areas.map((d, i) => /* @__PURE__ */ jsx("path", { d, fill: "currentColor", fillOpacity: 0.15 }, `a${i}`)) : null,
        lines.map((d, i) => /* @__PURE__ */ jsx(
          "path",
          {
            d,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            vectorEffect: "non-scaling-stroke"
          },
          i
        ))
      ] })
    }
  );
}
function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  variant = "plain",
  className,
  ref,
  ...rest
}) {
  const card = variant === "card";
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  return /* @__PURE__ */ jsxs(
    "details",
    {
      ...rest,
      ref,
      open: isOpen,
      "data-state": isOpen ? "open" : "closed",
      onToggle: (e) => {
        const now = e.currentTarget.open;
        if (open === void 0) setInner(now);
        if (open === void 0 || now !== open) onOpenChange?.(now);
      },
      className: cn(
        "group",
        card && "rounded-xl border border-th-line bg-th-surface shadow-card",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs(
          "summary",
          {
            className: cn(
              "flex cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-medium text-th-hi select-none",
              "[&::-webkit-details-marker]:hidden hover:text-th-hi pointer-coarse:min-h-11",
              card ? "px-4 py-3" : "py-1.5"
            ),
            children: [
              /* @__PURE__ */ jsx(
                ChevronRightIcon,
                {
                  size: 14,
                  className: "shrink-0 text-th-hi3 transition-transform duration-150 group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90 motion-reduce:transition-none"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1", children: summary })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: cn("text-sm text-th-hi2", card ? "border-t border-th-line px-4 py-3" : "pb-2 ps-6 pt-1"), children })
      ]
    }
  );
}
function Kbd({ className, ref, ...rest }) {
  return /* @__PURE__ */ jsx(
    "kbd",
    {
      ref,
      className: cn(
        "inline-flex min-w-[1.5em] items-center justify-center rounded border border-th-line-strong bg-th-elevated px-1.5 font-mono text-2xs leading-4 text-th-hi2",
        className
      ),
      ...rest
    }
  );
}
async function copyText(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof window !== "undefined" && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  if (typeof document === "undefined" || !document.body) return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.setAttribute("aria-hidden", "true");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  const active = document.activeElement;
  document.body.appendChild(ta);
  ta.select();
  try {
    ta.setSelectionRange(0, text.length);
  } catch {
  }
  let ok = false;
  try {
    ok = typeof document.execCommand === "function" && document.execCommand("copy");
  } catch {
    ok = false;
  }
  ta.remove();
  active?.focus?.();
  return ok;
}
var COPIED_MS = 1500;
function CopyButton({
  text,
  label,
  copiedLabel,
  failedLabel = "Copy failed",
  iconOnly = false,
  size = "sm",
  variant = "secondary",
  onCopy,
  className,
  ref,
  ...rest
}) {
  const strings = useNishStrings();
  const idleText = label ?? strings.copy;
  const doneText = copiedLabel ?? strings.copied;
  const [state, setState] = useState("idle");
  const timer = useRef(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const onClick = async () => {
    const ok = await copyText(text);
    onCopy?.(ok);
    setState(ok ? "copied" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), COPIED_MS);
  };
  const shownText = state === "copied" ? doneText : state === "failed" ? failedLabel : idleText;
  const iconSize = size === "sm" ? 14 : 16;
  const icon = state === "copied" ? /* @__PURE__ */ jsx(CheckIcon, { size: iconSize, className: "text-th-ok" }) : /* @__PURE__ */ jsx(CopyIcon, { size: iconSize });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    iconOnly ? /* @__PURE__ */ jsx(IconButton, { ref, label: shownText, size, onClick, className, "data-state": state, ...rest, children: icon }) : /* @__PURE__ */ jsx(Button, { ref, variant, size, icon, onClick, className, "data-state": state, ...rest, children: shownText }),
    /* @__PURE__ */ jsx("span", { role: "status", "aria-live": "polite", className: "sr-only", children: state === "copied" ? doneText : state === "failed" ? failedLabel : "" })
  ] });
}
function PageHeader({
  title,
  description,
  eyebrow,
  back,
  actions,
  as: H = "h1",
  sticky = false,
  collapseWhenStuck = true,
  className,
  ref: refProp,
  ...rest
}) {
  const ref = useRef(null);
  const stuck = useStuck(ref) && sticky;
  const collapsed = stuck && collapseWhenStuck;
  return /* @__PURE__ */ jsxs(
    "header",
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "data-nish-bar": sticky ? "" : void 0,
      className: cn(
        "flex flex-col gap-2",
        sticky && cn(
          "sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] -mx-[var(--nish-page-gutter,1rem)] border-b bg-th-bg px-[var(--nish-page-gutter,1rem)] py-3",
          stuck ? "border-th-line" : "border-transparent"
        ),
        className
      ),
      children: [
        back ? /* @__PURE__ */ jsx("div", { className: "text-sm", children: back }) : null,
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-x-4 gap-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 basis-64", children: [
            eyebrow ? /* @__PURE__ */ jsx("p", { className: "mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3", children: eyebrow }) : null,
            /* @__PURE__ */ jsx(
              H,
              {
                className: cn(
                  "text-2xl font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]",
                  collapsed && "max-sm:truncate max-sm:text-base max-sm:[overflow-wrap:normal]"
                ),
                children: title
              }
            ),
            description ? /* @__PURE__ */ jsx("p", { className: cn("mt-1 text-sm text-th-hi2", collapsed && "max-sm:hidden"), children: description }) : null
          ] }),
          actions ? /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: actions }) : null
        ] })
      ]
    }
  );
}
function MoreVerticalIcon({ size = 18 }) {
  return /* @__PURE__ */ jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "5", r: "1.8" }),
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1.8" }),
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "19", r: "1.8" })
  ] });
}
function AppHeader({
  name,
  icon,
  brand,
  hub = false,
  actions,
  nav,
  themeToggle,
  sticky = true,
  innerClassName,
  homeHref,
  hideNameBelow,
  navLabel,
  compactPill = false,
  glass = false,
  overflowActions,
  className,
  ref: refProp,
  ...rest
}) {
  const strings = useNishStrings();
  const ref = useRef(null);
  useHeightVar(ref, "--nish-header-h", sticky);
  const stuck = useStuck(ref) && sticky;
  const inlineActionsRef = useRef(null);
  useEffect(() => {
    inlineActionsRef.current?.querySelectorAll('[role="menuitem"]').forEach((el) => {
      el.removeAttribute("role");
      el.tabIndex = el.getAttribute("aria-disabled") === "true" ? -1 : 0;
    });
  });
  const toggle = themeToggle === false ? null : themeToggle ?? /* @__PURE__ */ jsx(ThemeToggle, {});
  const hideName = hideNameBelow === "sm" && icon != null;
  const hubHref = hub ? safeUrl(hub.href) : null;
  const homeUrl = homeHref == null ? null : safeUrl(homeHref);
  if (homeHref != null && homeUrl == null) warnDev(`AppHeader: homeHref "${homeHref}" is not a safe URL and was dropped`);
  if (hub && hubHref == null) warnDev(`nish-ui: AppHeader hid the hub pill because its href is not safe (${hub.href.slice(0, 40)}).`);
  const mark = /* @__PURE__ */ jsxs(Fragment, { children: [
    icon ? /* @__PURE__ */ jsx("span", { className: "shrink-0 text-th-accent [&>svg]:size-5", children: icon }) : null,
    /* @__PURE__ */ jsx("span", { className: cn("truncate", hideName && "max-sm:sr-only"), children: name })
  ] });
  const markClass = "inline-flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-th-hi";
  const pillArrow = /* @__PURE__ */ jsx("span", { className: "inline-block rtl:-scale-x-100", children: "\u2190" });
  return /* @__PURE__ */ jsxs(
    "header",
    {
      ...rest,
      ref: mergeRefs(ref, refProp),
      "data-nish-bar": sticky ? "" : void 0,
      className: cn(
        "border-b border-th-line pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]",
        glass ? "bg-th-bg supports-[backdrop-filter]:bg-th-bg/80 supports-[backdrop-filter]:backdrop-blur-xl" : "bg-th-bg",
        sticky && "sticky top-0 z-[calc(var(--nish-z-sticky,20)+10)] transition-shadow",
        stuck && "shadow-[var(--nish-shadow-card)]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn(
              "@container/header flex min-h-14 flex-nowrap items-center gap-2 px-[var(--nish-page-gutter,1rem)] py-2 sm:gap-3",
              innerClassName
            ),
            children: [
              hub && hubHref != null ? compactPill ? /* @__PURE__ */ jsxs("a", { className: "nish-pill-link nish-pill-link--compact", href: hubHref, title: hub.title ?? strings.hubTitle, children: [
                pillArrow,
                " ",
                /* @__PURE__ */ jsx("span", { className: "nish-pill-link-label", children: hub.label })
              ] }) : /* @__PURE__ */ jsxs(
                "a",
                {
                  className: "nish-pill-link @max-[400px]/header:min-w-11 @max-[400px]/header:justify-center @max-[400px]/header:px-1.5 @max-[400px]/header:[&_.nish-pill-link-label]:sr-only",
                  href: hubHref,
                  title: hub.title ?? strings.hubTitle,
                  children: [
                    pillArrow,
                    " ",
                    /* @__PURE__ */ jsx("span", { className: "nish-pill-link-label", children: hub.label })
                  ]
                }
              ) : null,
              brand != null ? /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: name }),
                brand
              ] }) : homeUrl != null ? /* @__PURE__ */ jsx("a", { href: homeUrl, className: cn(markClass, "min-h-11 min-w-11 rounded-lg", hideName && "max-sm:justify-center"), children: mark }) : /* @__PURE__ */ jsx("span", { className: markClass, children: mark }),
              /* @__PURE__ */ jsxs("div", { className: "ms-auto flex shrink-0 items-center gap-2", children: [
                actions,
                overflowActions ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("div", { ref: inlineActionsRef, className: "hidden items-center gap-2 sm:flex [&>button]:w-auto", children: overflowActions }),
                  /* @__PURE__ */ jsx("div", { className: "sm:hidden", children: /* @__PURE__ */ jsx(
                    DropdownMenu,
                    {
                      align: "end",
                      trigger: /* @__PURE__ */ jsx(IconButton, { label: strings.moreActions, children: /* @__PURE__ */ jsx(MoreVerticalIcon, {}) }),
                      children: overflowActions
                    }
                  ) })
                ] }) : null,
                toggle
              ] })
            ]
          }
        ),
        nav ? /* @__PURE__ */ jsx(
          "nav",
          {
            "aria-label": navLabel ?? strings.sections,
            className: cn("nish-no-scrollbar -mb-px flex gap-6 overflow-x-auto px-[var(--nish-page-gutter,1rem)]", innerClassName),
            children: nav
          }
        ) : null
      ]
    }
  );
}
function SectionHeader({ title, id, as: H = "h2", meta, action, className, ref, ...rest }) {
  return /* @__PURE__ */ jsxs("div", { ref, className: cn("mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1", className), ...rest, children: [
    /* @__PURE__ */ jsx(H, { id, className: "min-w-0 text-lg font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]", children: title }),
    meta != null || action != null ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      meta != null ? /* @__PURE__ */ jsx("span", { className: "text-sm text-th-hi3", children: meta }) : null,
      action
    ] }) : null
  ] });
}
function KeyValueList({ items, dense = false, as = "ul", className, ref, ...rest }) {
  const row = (wrap) => cn(
    "flex min-w-0 items-center justify-between gap-3 border-b border-th-line last:border-b-0",
    dense ? "min-h-8" : "min-h-11",
    wrap && (dense ? "py-1" : "py-2")
  );
  const labelCls = (wrap) => wrap === "words" ? "min-w-0 shrink-0 max-w-[calc(60%_-_0.75rem)] [overflow-wrap:anywhere]" : wrap ? "shrink-0" : "min-w-0";
  const valueCls = (wrap) => wrap === "words" ? "min-w-0 flex-1 [overflow-wrap:anywhere]" : wrap ? "min-w-0 break-all" : "shrink-0";
  if (as === "dl") {
    return /* @__PURE__ */ jsx(
      "dl",
      {
        ref,
        className: cn("grid text-sm text-th-hi", className),
        ...rest,
        children: items.map((it) => /* @__PURE__ */ jsxs("div", { className: row(it.wrap), children: [
          /* @__PURE__ */ jsx("dt", { className: cn("text-th-hi2", labelCls(it.wrap)), children: it.label }),
          /* @__PURE__ */ jsx("dd", { className: cn("m-0 text-end", valueCls(it.wrap)), children: it.value })
        ] }, it.key))
      }
    );
  }
  return /* @__PURE__ */ jsx("ul", { ref, className: cn("grid text-sm text-th-hi", className), ...rest, children: items.map((it) => /* @__PURE__ */ jsxs("li", { className: row(it.wrap), children: [
    /* @__PURE__ */ jsx("span", { className: cn("flex items-center gap-2", labelCls(it.wrap)), children: it.label }),
    /* @__PURE__ */ jsx("span", { className: cn("flex items-center justify-end gap-2 text-end", valueCls(it.wrap)), children: it.value })
  ] }, it.key)) });
}
function ChartLegend({ items, marker = "line", label, className, ref, ...rest }) {
  const strings = useNishStrings();
  return /* @__PURE__ */ jsx(
    "ul",
    {
      ref,
      "aria-label": label ?? strings.legend,
      className: cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-th-hi2", className),
      ...rest,
      children: items.map((it) => /* @__PURE__ */ jsxs("li", { className: "inline-flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          "i",
          {
            "aria-hidden": "true",
            className: cn(
              "inline-block shrink-0",
              marker === "dot" ? "size-2 rounded-full" : "h-0.75 w-2.5 rounded-sm",
              LEGEND_FILL[it.tone],
              "forced-colors:forced-color-adjust-none forced-colors:bg-[CanvasText]"
            )
          }
        ),
        it.label
      ] }, it.label))
    }
  );
}
export {
  AppHeader,
  Callout,
  ChartLegend,
  CopyButton,
  Disclosure,
  Kbd,
  KeyValueList,
  Meter,
  PageHeader,
  SectionHeader,
  Sparkline,
  Stat,
  StatGrid,
  StatusDot,
  copyText,
  signTone,
  toneFor2 as toneFor
};
