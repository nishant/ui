"use client";

// src/components/theme-toggle.tsx
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "../cn.js";
import { DEFAULT_THEME } from "../tokens.mjs";
import {
  PRESETS,
  applyTheme,
  getThemeChoice,
  isThemeName,
  onThemeChange,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  TOGGLE_ORDER
} from "../theme.js";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons.js";
import { IconButton } from "./primitives.js";
import { useStrings } from "./provider.js";
import { THEME_STRINGS } from "./strings.js";
import { Segmented } from "./segmented.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var SERVER_SNAPSHOT = { choice: "system", theme: DEFAULT_THEME };
var lastSnapshot = SERVER_SNAPSHOT;
function readSnapshot() {
  const root = document.documentElement;
  const attrChoice = root.getAttribute("data-theme-choice");
  const attrTheme = root.getAttribute("data-theme");
  let choice;
  let theme;
  if ((attrChoice === "system" || isThemeName(attrChoice)) && isThemeName(attrTheme)) {
    choice = attrChoice;
    theme = attrTheme;
  } else {
    choice = getThemeChoice();
    theme = resolveTheme(choice);
  }
  if (lastSnapshot.choice !== choice || lastSnapshot.theme !== theme) lastSnapshot = { choice, theme };
  return lastSnapshot;
}
var subscribeTheme = (notify) => onThemeChange(notify);
var getServerSnapshot = () => SERVER_SNAPSHOT;
function useTheme() {
  const { choice, theme } = useSyncExternalStore(subscribeTheme, readSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-theme")) applyTheme();
  }, []);
  return { choice, theme, scheme: schemeOf(theme), setChoice: setThemeChoice };
}
var MODES = [
  { id: "system", Icon: MonitorIcon },
  { id: "light", Icon: SunIcon },
  { id: "dark", Icon: MoonIcon }
];
function ThemeToggle({
  ref,
  presets = false,
  labels = false,
  block = false,
  size = "sm",
  compact = false,
  variant = "segmented",
  phone = "compact",
  collapse = "sm",
  className,
  elsewhereLabel = "set on another site",
  ...rest
}) {
  const strings = useStrings(THEME_STRINGS);
  const { choice, theme, scheme, setChoice } = useTheme();
  const extra = PRESETS.filter((p) => p.id !== "dark" && p.id !== "light");
  const isPreset = extra.some((p) => p.id === choice);
  const modeLabel = (id) => id === "system" ? strings.themeSystem : id === "light" ? strings.themeLight : id === "dark" ? strings.themeDark : "";
  const nameOf = (c) => modeLabel(c) || PRESETS.find((p) => p.id === c)?.label || String(c);
  if (compact || variant === "pill") {
    const i = TOGGLE_ORDER.indexOf(choice);
    const next = TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
    const mode = MODES.find((m) => m.id === choice);
    const Icon = mode ? mode.Icon : scheme === "light" ? SunIcon : MoonIcon;
    const elsewhere = mode ? "" : ` (${elsewhereLabel})`;
    const text = strings.themeToggleLabel(`${nameOf(mode ? choice : theme)}${elsewhere}`, nameOf(next));
    const buttonRest = rest;
    if (variant === "pill") {
      return /* @__PURE__ */ jsxs(
        "button",
        {
          ...buttonRest,
          ref,
          type: "button",
          "aria-label": text,
          title: text,
          "data-choice": choice,
          onClick: () => setChoice(next),
          className: cn(
            "inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-th-line-strong transition-colors duration-150 hover:bg-th-elevated hover:text-th-hi",
            labels ? "gap-2 ps-3 pe-3.5 text-sm font-medium text-th-hi" : "w-11 text-th-hi3",
            className
          ),
          children: [
            /* @__PURE__ */ jsx(Icon, { size: 16 }),
            labels ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: nameOf(mode ? choice : theme) }) : null
          ]
        }
      );
    }
    return /* @__PURE__ */ jsx(
      IconButton,
      {
        ...buttonRest,
        ref,
        label: text,
        size: size === "md" ? "md" : "sm",
        "data-choice": choice,
        onClick: () => setChoice(next),
        className,
        children: /* @__PURE__ */ jsx(Icon, { size: size === "md" ? 16 : 14 })
      }
    );
  }
  const options = MODES.map(({ id, Icon }) => ({
    value: id,
    label: labels ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Icon, { size: 14 }),
      modeLabel(id)
    ] }) : /* @__PURE__ */ jsx(Icon, { size: 14 }),
    ariaLabel: labels ? void 0 : modeLabel(id),
    title: labels ? void 0 : modeLabel(id)
  }));
  const twin = collapse === "sm" && phone === "compact" && !block;
  const group = /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      className: cn("items-center gap-2", block ? "flex w-full" : "inline-flex", className, twin && "max-sm:hidden"),
      children: [
        /* @__PURE__ */ jsx(
          Segmented,
          {
            label: strings.theme,
            options,
            value: choice,
            onChange: setChoice,
            size,
            block,
            className: cn(!labels && (size === "md" ? "[&>button]:w-8 [&>button]:px-0" : "[&>button]:w-7 [&>button]:px-0"), block && "min-w-0 flex-1")
          }
        ),
        presets ? /* @__PURE__ */ jsxs(
          "select",
          {
            "aria-label": strings.themePreset,
            value: isPreset ? choice : "",
            onChange: (e) => e.target.value && setChoice(e.target.value),
            className: cn(
              "rounded-lg border border-th-line-control bg-th-elevated px-2 text-xs text-th-hi2 pointer-coarse:min-h-11",
              size === "md" ? "h-9 text-sm" : "h-8"
            ),
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: strings.themePresetPlaceholder }),
              extra.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.label }, p.id))
            ]
          }
        ) : null
      ]
    }
  );
  if (!twin) return group;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ThemeToggle, { compact: true, size, elsewhereLabel, className: cn(className, "sm:hidden") }),
    group
  ] });
}
export {
  ThemeToggle,
  useTheme
};
