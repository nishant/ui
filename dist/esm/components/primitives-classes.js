// src/components/primitives-classes.ts
import { cn } from "../cn.js";
var BUTTON_VARIANT = {
  primary: "bg-th-accent text-th-on-accent hover:bg-th-accent/90 active:bg-th-accent/80",
  secondary: "border border-th-line-strong bg-th-surface text-th-hi hover:bg-th-elevated",
  ghost: "text-th-hi2 hover:bg-th-elevated hover:text-th-hi",
  danger: "bg-th-loss text-th-on-loss hover:bg-th-loss/90 active:bg-th-loss/80",
  soft: "bg-th-accent-soft text-th-accent hover:bg-th-accent/20 active:bg-th-accent/25",
  subtle: "bg-th-elevated text-th-hi hover:bg-th-overlay",
  link: "h-auto p-0 font-medium text-th-accent underline-offset-2 hover:underline"
};
var BUTTON_SIZE = {
  xs: "h-6 gap-1 px-2 text-2xs pointer-coarse:min-h-11",
  sm: "h-7 gap-1.5 px-2.5 text-xs pointer-coarse:min-h-11",
  md: "h-9 gap-2 px-3.5 text-sm pointer-coarse:min-h-11",
  lg: "h-11 gap-2 px-5 text-base"
};
var LINK_SIZE = {
  xs: "gap-1 text-2xs",
  sm: "gap-1 text-xs",
  md: "gap-1.5 text-sm",
  lg: "gap-2 text-base"
};
var BUTTON_BASE = "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,transform] duration-150";
var BUTTON_FORCED = "forced-colors:border forced-colors:border-[ButtonText]";
var PRESS = "pointer-coarse:not-disabled:active:scale-[0.97]";
var LINK_HIT = "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']";
var BUTTON_DISABLED = "disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText]";
var LINK_DISABLED = "disabled:pointer-events-none disabled:text-th-ghost disabled:no-underline forced-colors:disabled:text-[GrayText]";
function buttonClass({ variant = "secondary", size = "md", inline = false, className } = {}) {
  return cn(
    BUTTON_BASE,
    variant === "link" ? LINK_SIZE[size] : [BUTTON_SIZE[size], BUTTON_FORCED],
    variant === "link" ? !inline && LINK_HIT : PRESS,
    BUTTON_VARIANT[variant],
    className
  );
}
function linkClass({ tone = "accent", inline = false, className } = {}) {
  return cn(
    "font-medium underline-offset-2 transition-colors duration-150 hover:underline",
    tone === "accent" ? "text-th-accent" : "text-th-hi3 hover:text-th-hi",
    !inline && LINK_HIT,
    className
  );
}
function revealClass(className) {
  return cn(
    "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
    className
  );
}
var ICON_SIZE = {
  "2xs": "relative size-5 rounded pointer-fine:after:absolute pointer-fine:after:-inset-0.5 pointer-fine:after:content-['']",
  xs: "size-6 rounded-md",
  sm: "size-7 rounded-lg",
  md: "size-9 rounded-lg"
};
var ICON_VARIANT = {
  ghost: { idle: "text-th-hi3 hover:bg-th-elevated hover:text-th-hi", active: "bg-th-elevated text-th-hi" },
  subtle: { idle: "bg-th-elevated text-th-hi hover:bg-th-overlay", active: "bg-th-overlay text-th-hi" },
  soft: { idle: "bg-th-accent-soft text-th-accent hover:bg-th-accent/20", active: "bg-th-accent/25 text-th-accent" }
};
var ICON_DANGER = "hover:bg-th-loss-soft hover:text-th-loss active:bg-th-loss-soft active:text-th-loss";
function iconButtonClass({
  size = "md",
  variant = "ghost",
  tone = "neutral",
  active = false,
  className
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center transition-[color,background-color,border-color,transform] duration-150",
    PRESS,
    "disabled:pointer-events-none disabled:bg-transparent disabled:text-th-ghost forced-colors:disabled:text-[GrayText]",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    // A pressed toggle is shown by fill only, which forced colors drops: outline it.
    active && "forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]",
    ICON_SIZE[size],
    ICON_VARIANT[variant].idle,
    active && ICON_VARIANT[variant].active,
    tone === "danger" && ICON_DANGER,
    active && tone === "danger" && "bg-th-loss-soft text-th-loss",
    className
  );
}
var CARD_PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6"
};
var resolvePadding = (padding, padded) => padding ?? (padded === false ? "none" : "md");
function cardClass({ padding, padded, interactive = false, variant = "surface", className } = {}) {
  const inset = variant === "inset";
  return cn(
    // The inset card has a transparent border; forced colors still draws its edge.
    inset ? "rounded-lg border border-transparent bg-th-elevated forced-colors:border-[CanvasText]" : "rounded-xl border border-th-line bg-th-surface shadow-card",
    CARD_PADDING[resolvePadding(padding, padded)],
    interactive && (inset ? "transition-colors duration-150 hover:bg-th-overlay" : "transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60"),
    className
  );
}
var BADGE_TONE = {
  neutral: "border-th-line bg-th-elevated text-th-hi2",
  accent: "border-th-accent/30 bg-th-accent-soft text-th-accent",
  ok: "border-th-ok/30 bg-th-ok-soft text-th-ok",
  loss: "border-th-loss/30 bg-th-loss-soft text-th-loss",
  warn: "border-th-warn/30 bg-th-warn-soft text-th-warn",
  info: "border-th-info/30 bg-th-info-soft text-th-info",
  // A label on a solid accent fill (inside a primary Button or an accent link).
  "on-accent": "border-transparent bg-th-on-accent/20 text-th-on-accent"
};
var BADGE_HUE = {
  emerald: "border-th-emerald/30 bg-th-emerald-soft text-th-hi",
  indigo: "border-th-indigo/30 bg-th-indigo-soft text-th-hi",
  amber: "border-th-amber/30 bg-th-amber-soft text-th-hi",
  lime: "border-th-lime/30 bg-th-lime-soft text-th-hi",
  rose: "border-th-rose/30 bg-th-rose-soft text-th-hi",
  sky: "border-th-sky/30 bg-th-sky-soft text-th-hi",
  violet: "border-th-violet/30 bg-th-violet-soft text-th-hi",
  teal: "border-th-teal/30 bg-th-teal-soft text-th-hi"
};
var DOT_TONE = {
  neutral: "bg-th-ghost",
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  loss: "bg-th-loss-fill",
  warn: "bg-th-warn-fill",
  info: "bg-th-info-fill",
  "on-accent": "bg-th-on-accent"
};
var DOT_HUE = {
  emerald: "bg-th-emerald",
  indigo: "bg-th-indigo",
  amber: "bg-th-amber",
  lime: "bg-th-lime",
  rose: "bg-th-rose",
  sky: "bg-th-sky",
  violet: "bg-th-violet",
  teal: "bg-th-teal"
};
function badgeClass({ tone = "neutral", hue, size = "sm", variant = "pill", className } = {}) {
  return cn(
    "inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-medium",
    size === "xs" ? "px-1.5 py-0 text-3xs leading-4" : "px-2 py-0.5 text-xs leading-4",
    hue ? BADGE_HUE[hue] : BADGE_TONE[tone],
    // A tag has no border color of its own; forced colors still draws its edge.
    variant === "tag" && "rounded-sm border-transparent font-semibold uppercase tracking-wide forced-colors:border-[CanvasText]",
    className
  );
}
var FIELD = "w-full min-w-0 rounded-lg border border-th-line-control bg-th-elevated text-th-hi placeholder:text-th-hi3 transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 forced-colors:focus:outline-solid forced-colors:focus:outline-2 forced-colors:focus:outline-[Highlight] disabled:cursor-not-allowed disabled:opacity-50 forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText] aria-[invalid=true]:border-th-loss";
var FIELD_SIZE = {
  xs: { box: "h-7 pointer-coarse:min-h-11", pad: "ps-2 pe-2", text: "text-2xs pointer-coarse:text-base" },
  sm: { box: "h-8 pointer-coarse:min-h-11", pad: "ps-2.5 pe-2.5", text: "text-xs pointer-coarse:text-base" },
  md: { box: "h-9 pointer-coarse:min-h-11", pad: "ps-3 pe-3", text: "text-sm pointer-coarse:text-base" }
};
var FIELD_INVALID = "border-th-loss hover:border-th-loss";
function fieldClass({ size = "md", invalid = false, className } = {}) {
  const s = FIELD_SIZE[size];
  return cn(FIELD, s.box, s.pad, s.text, invalid && FIELD_INVALID, className);
}
var SELECT_SIZE = {
  xs: { pad: "ps-2 pe-6", chevron: "end-1.5", icon: 12 },
  sm: { pad: "ps-2.5 pe-7", chevron: "end-2", icon: 13 },
  md: { pad: "ps-3 pe-8", chevron: "end-2.5", icon: 14 }
};
export {
  BADGE_HUE,
  BADGE_TONE,
  BUTTON_BASE,
  BUTTON_DISABLED,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  CARD_PADDING,
  DOT_HUE,
  DOT_TONE,
  FIELD,
  FIELD_INVALID,
  FIELD_SIZE,
  ICON_DANGER,
  ICON_SIZE,
  ICON_VARIANT,
  LINK_DISABLED,
  LINK_HIT,
  LINK_SIZE,
  PRESS,
  SELECT_SIZE,
  badgeClass,
  buttonClass,
  cardClass,
  fieldClass,
  iconButtonClass,
  linkClass,
  resolvePadding,
  revealClass
};
