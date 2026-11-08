// src/components/overlay-classes.ts
import { cn } from "../cn.js";
var MENU_ROW = "flex w-full select-none items-center gap-2 px-3 py-1.5 text-start text-xs outline-none transition-colors pointer-coarse:min-h-11 pointer-coarse:gap-3 pointer-coarse:text-sm forced-colors:focus:outline-solid forced-colors:focus:outline-2 forced-colors:focus:-outline-offset-2";
function menuItemClass({ active = false, danger = false, disabled = false, className } = {}) {
  return cn(
    MENU_ROW,
    disabled ? "cursor-default text-th-ghost forced-colors:text-[GrayText]" : danger ? "text-th-loss hover:bg-th-loss-soft focus-visible:bg-th-loss-soft" : "text-th-hi2 hover:bg-th-overlay hover:text-th-hi focus-visible:bg-th-overlay focus-visible:text-th-hi",
    active && !disabled && !danger && "bg-th-overlay font-medium text-th-hi forced-colors:underline",
    className
  );
}
function keyboardFocused(el) {
  if (typeof document !== "undefined" && document.activeElement !== el) return true;
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}
function touchTracker() {
  let touch = false;
  return {
    onPointer: (e) => {
      touch = e.pointerType === "touch";
    },
    recent: () => touch
  };
}
var SHEET_EXIT_MS = 200;
var PHONE_QUERY = "(max-width: 639px)";
var CLOSE_BUTTON = "-me-1.5 inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11 pointer-coarse:min-w-11";
var SHEET_HEIGHT_CLASS = {
  auto: "max-h-[92dvh]",
  tall: "max-h-[92dvh] max-sm:h-[92dvh]",
  full: "max-h-dvh max-sm:h-dvh max-sm:rounded-t-none max-sm:pt-[env(safe-area-inset-top)]"
};
var MODAL_SIZE = {
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-6xl",
  full: "sm:max-w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]"
};
var DRAWER_WIDTH = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl"
};
var DRAWER_SHEET_HEIGHT = {
  sm: "max-h-[50dvh]",
  md: "max-h-[70dvh]",
  lg: "max-h-[92dvh]"
};
export {
  CLOSE_BUTTON,
  DRAWER_SHEET_HEIGHT,
  DRAWER_WIDTH,
  MENU_ROW,
  MODAL_SIZE,
  PHONE_QUERY,
  SHEET_EXIT_MS,
  SHEET_HEIGHT_CLASS,
  keyboardFocused,
  menuItemClass,
  touchTracker
};
