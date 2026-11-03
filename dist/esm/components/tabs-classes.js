// src/components/tabs-classes.ts
import { cn } from "../cn.js";
var TAB_TEXT = { xs: "text-2xs", sm: "text-xs", md: "text-sm" };
var UNDERLINE_H = { xs: "h-7", sm: "h-8", md: "h-10" };
var PILL_SIZE = { xs: "h-6 px-2", sm: "h-7 px-2.5", md: "h-8 px-3" };
function tabClass(o) {
  const { active, variant = "underline", size = "md", block = false, className } = o;
  return cn(
    "relative inline-flex shrink-0 flex-col items-start justify-center whitespace-nowrap font-medium transition-colors duration-150",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:text-th-ghost",
    TAB_TEXT[size],
    variant === "underline" ? cn("border-b-2 px-0.5", UNDERLINE_H[size], active ? "border-th-accent text-th-hi" : "border-transparent text-th-hi3 hover:text-th-hi") : cn("rounded-lg", PILL_SIZE[size], active ? "bg-th-elevated text-th-hi" : "text-th-hi3 hover:bg-th-elevated/60 hover:text-th-hi"),
    // Forced colors drop backgrounds and the accent border: mark the selected tab with a system color.
    active && "forced-colors:border-[color:Highlight] forced-colors:text-[color:Highlight] forced-colors:underline",
    block && "min-w-0 flex-1 items-center text-center",
    className
  );
}
export {
  tabClass
};
