// src/components/forms-classes.ts
import { cn } from "../cn.js";
function setRef(ref, node) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}
var CHIP_BASE = "inline-flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors duration-150";
var CHIP_SIZE = { sm: "h-7 px-2.5 text-xs", md: "h-8 px-3 text-sm" };
var CHIP_LOOK = {
  toggle: "border-th-line-control text-th-hi2 hover:bg-th-elevated hover:text-th-hi",
  pressed: "border-th-accent/60 bg-th-accent-soft text-th-accent hover:bg-th-accent/20 forced-colors:border-[color:Highlight] forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]",
  suggestion: "border-dashed border-th-line-control text-th-hi3 hover:border-th-hi3 hover:text-th-hi",
  tag: "border-th-line bg-th-elevated text-th-hi2"
};
function chipClass({ pressed = false, variant = "toggle", size = "md", className } = {}) {
  return cn(
    CHIP_BASE,
    CHIP_SIZE[size],
    variant !== "tag" && "pointer-coarse:min-h-11",
    CHIP_LOOK[variant === "toggle" && pressed ? "pressed" : variant],
    className
  );
}
var SEGMENTED_SELECTED = {
  accent: "bg-th-accent-soft text-th-accent ring-1 ring-th-accent/40 forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]",
  warn: "bg-th-warn-soft text-th-warn ring-1 ring-th-warn/40 forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]",
  loss: "bg-th-loss-soft text-th-loss ring-1 ring-th-loss/40 forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]"
};
var SEGMENTED_SIZE = {
  xs: "h-6 px-2 text-2xs",
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-sm"
};
function indexComboboxOptions(options) {
  return options.map((option) => ({ option, label: option.label.toLowerCase(), hint: option.hint?.toLowerCase() }));
}
export {
  SEGMENTED_SELECTED,
  SEGMENTED_SIZE,
  chipClass,
  indexComboboxOptions,
  setRef
};
