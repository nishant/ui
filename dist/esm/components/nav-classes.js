// src/components/nav-classes.ts
import { cn } from "../cn.js";
import { FOCUS } from "./nav-items.js";
function navRailItemClass(active) {
  return cn("group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-2xs leading-tight", FOCUS, active ? "font-medium text-th-accent" : "text-th-hi3 hover:text-th-hi");
}
export {
  navRailItemClass
};
