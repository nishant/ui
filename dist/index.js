// src/cn.ts
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
var twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ["card", "pop", "modal"] }]
    }
  }
});
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/tokens.mjs
var COLOR_ROLES = [
  "bg",
  // page background
  "surface",
  // cards, panels, table bodies
  "elevated",
  // popovers, hovered rows, inputs, raised things inside cards
  "overlay",
  // the deepest inner layer: chips inside raised things, skeleton sheen
  "line",
  // borders and dividers
  "line-strong",
  // input borders, focused outlines that are not the accent
  "hi",
  // primary text
  "hi2",
  // secondary text
  "hi3",
  // tertiary text, labels
  "ghost",
  // placeholders, disabled, decorative icons (not for body text)
  "accent",
  // links, primary buttons, active nav, focus ring
  "accent2",
  // a second accent for paired highlights and the 2nd chart series
  "on-accent",
  // text on an accent fill
  "ok",
  // success, gains
  "loss",
  // errors, losses, destructive
  "warn",
  // warnings, pending
  "info",
  // neutral notices
  "scrim",
  // modal and drawer backdrop tone
  "invert-bg",
  // inverted pill (today marker, active segmented control)
  "invert-text",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
  "emerald",
  "indigo",
  "amber",
  "lime",
  "rose",
  "sky",
  "violet",
  "teal"
];
var DARK_HUES = {
  emerald: "#34d399",
  indigo: "#8b93ff",
  amber: "#fbbf24",
  lime: "#a3e635",
  rose: "#fb7185",
  sky: "#38bdf8",
  violet: "#c084fc",
  teal: "#2dd4bf"
};
var LIGHT_HUES = {
  emerald: "#046d4f",
  indigo: "#4e45e3",
  amber: "#9b4708",
  lime: "#41690d",
  rose: "#b8113a",
  sky: "#036499",
  violet: "#7e22ce",
  teal: "#0e6b64"
};
var DARK_CHART = ["#8b93ff", "#34d399", "#fbbf24", "#fb7185", "#38bdf8", "#c084fc", "#fb923c", "#a3e635"];
var LIGHT_CHART = ["#4f46e5", "#047857", "#b45309", "#be123c", "#0369a1", "#7e22ce", "#c2410c", "#4d7c0f"];
var chart = (list) => Object.fromEntries(list.map((c, i) => [`chart-${i + 1}`, c]));
var THEMES = {
  dark: {
    label: "Dark",
    scheme: "dark",
    colors: {
      bg: "#0a0b0f",
      surface: "#111218",
      elevated: "#191b23",
      overlay: "#22252f",
      line: "#262935",
      "line-strong": "#3a3e4d",
      hi: "#ececf1",
      hi2: "#a8aab7",
      hi3: "#8a8d9b",
      ghost: "#6b6e7c",
      accent: "#8b93ff",
      accent2: "#c084fc",
      "on-accent": "#0a0b0f",
      ok: "#34d399",
      loss: "#f87171",
      warn: "#fbbf24",
      info: "#38bdf8",
      scrim: "#000000",
      "invert-bg": "#ececf1",
      "invert-text": "#111218",
      ...chart(DARK_CHART),
      ...DARK_HUES
    }
  },
  light: {
    label: "Light",
    scheme: "light",
    colors: {
      bg: "#f7f6f3",
      surface: "#ffffff",
      elevated: "#f1f0ec",
      overlay: "#e6e4de",
      line: "#e2e0da",
      "line-strong": "#c9c6bd",
      hi: "#17171c",
      hi2: "#4f515c",
      hi3: "#666874",
      ghost: "#8a8c98",
      accent: "#4338ca",
      accent2: "#7e22ce",
      "on-accent": "#ffffff",
      ok: "#065f46",
      loss: "#a91b1b",
      warn: "#92400e",
      info: "#075985",
      scrim: "#17171c",
      "invert-bg": "#17171c",
      "invert-text": "#f7f6f3",
      ...chart(LIGHT_CHART),
      ...LIGHT_HUES
    }
  },
  slate: {
    label: "Slate",
    scheme: "dark",
    colors: {
      bg: "#18181b",
      surface: "#202024",
      elevated: "#2c2c32",
      overlay: "#36363d",
      line: "#3a3a42",
      "line-strong": "#52525b",
      hi: "#f4f4f5",
      hi2: "#a1a1aa",
      hi3: "#8f8f99",
      ghost: "#71717a",
      accent: "#a5b4fc",
      accent2: "#c084fc",
      "on-accent": "#18181b",
      ok: "#4ade80",
      loss: "#fda4af",
      warn: "#facc15",
      info: "#38bdf8",
      scrim: "#000000",
      "invert-bg": "#f4f4f5",
      "invert-text": "#202024",
      ...chart(["#818cf8", "#4ade80", "#facc15", "#fb7185", "#38bdf8", "#c084fc", "#fb923c", "#a3e635"]),
      ...DARK_HUES,
      // Lifted so tinted chips stay readable on this theme's lighter cards.
      indigo: "#9aa1ff",
      rose: "#fc8395",
      violet: "#c792fc"
    }
  },
  terminal: {
    label: "Terminal",
    scheme: "dark",
    colors: {
      bg: "#050807",
      surface: "#0c110e",
      elevated: "#141c17",
      overlay: "#1c2820",
      line: "#233028",
      "line-strong": "#34483b",
      hi: "#d1fae5",
      hi2: "#8fc4a8",
      hi3: "#74a68b",
      ghost: "#4f7a62",
      accent: "#34d399",
      accent2: "#2dd4bf",
      "on-accent": "#050807",
      ok: "#4ade80",
      loss: "#f87171",
      warn: "#fbbf24",
      info: "#67e8f9",
      scrim: "#000000",
      "invert-bg": "#d1fae5",
      "invert-text": "#0c110e",
      ...chart(["#34d399", "#67e8f9", "#fbbf24", "#f87171", "#a3e635", "#c084fc", "#fb923c", "#2dd4bf"]),
      ...DARK_HUES
    }
  },
  mocha: {
    label: "Mocha",
    scheme: "dark",
    colors: {
      bg: "#1c1917",
      surface: "#292524",
      elevated: "#393432",
      overlay: "#44403c",
      line: "#44403c",
      "line-strong": "#57534e",
      hi: "#f5f0eb",
      hi2: "#b3ada8",
      hi3: "#a39d98",
      ghost: "#78716c",
      accent: "#fdba74",
      accent2: "#f472b6",
      "on-accent": "#1c1917",
      ok: "#4ade80",
      loss: "#fca5a5",
      warn: "#facc15",
      info: "#7dd3fc",
      scrim: "#000000",
      "invert-bg": "#f5f0eb",
      "invert-text": "#292524",
      ...chart(["#fb923c", "#4ade80", "#facc15", "#f472b6", "#7dd3fc", "#c4b5fd", "#f87171", "#bef264"]),
      ...DARK_HUES,
      // Lifted so tinted chips stay readable on this theme's lighter cards.
      indigo: "#a9afff",
      rose: "#fc99a7",
      sky: "#3ebff8",
      violet: "#cfa2fd"
    }
  },
  ocean: {
    label: "Ocean",
    scheme: "dark",
    colors: {
      bg: "#020c18",
      surface: "#061528",
      elevated: "#0a243e",
      overlay: "#103658",
      line: "#123050",
      "line-strong": "#1f4a72",
      hi: "#e0f2fe",
      hi2: "#9ccde6",
      hi3: "#6fa9c6",
      ghost: "#3f7392",
      accent: "#38bdf8",
      accent2: "#a78bfa",
      "on-accent": "#020c18",
      ok: "#34d399",
      loss: "#fb7185",
      warn: "#fbbf24",
      info: "#7dd3fc",
      scrim: "#000000",
      "invert-bg": "#38bdf8",
      "invert-text": "#020c18",
      ...chart(["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf", "#fb923c", "#a3e635"]),
      ...DARK_HUES
    }
  },
  contrast: {
    label: "High contrast",
    scheme: "dark",
    colors: {
      bg: "#000000",
      surface: "#080808",
      elevated: "#141414",
      overlay: "#222222",
      line: "#4a4a4a",
      "line-strong": "#8a8a8a",
      hi: "#ffffff",
      hi2: "#d4d4d4",
      hi3: "#bdbdbd",
      ghost: "#8f8f8f",
      accent: "#ffd60a",
      accent2: "#7dd3fc",
      "on-accent": "#000000",
      ok: "#4ade80",
      loss: "#ff6b6b",
      warn: "#ffd60a",
      info: "#7dd3fc",
      scrim: "#000000",
      "invert-bg": "#ffffff",
      "invert-text": "#000000",
      ...chart(["#ffd60a", "#4ade80", "#7dd3fc", "#ff6b6b", "#c4b5fd", "#fb923c", "#f9a8d4", "#bef264"]),
      ...DARK_HUES
    }
  }
};
var DEFAULT_THEME = "dark";
var SCALE = {
  // Inter Variable is self-hosted (fonts.css). Sites with their own display face
  // (mc's pixel font, trips' serif) set it locally and keep these for UI text.
  "font-sans": "'Inter Variable', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  "font-mono": "ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
  "text-xs": "0.75rem",
  "text-xs-lh": "1.1rem",
  "text-sm": "0.875rem",
  "text-sm-lh": "1.35rem",
  "text-base": "1rem",
  "text-base-lh": "1.55rem",
  "text-lg": "1.125rem",
  "text-lg-lh": "1.65rem",
  "text-xl": "1.25rem",
  "text-xl-lh": "1.75rem",
  "text-2xl": "1.5rem",
  "text-2xl-lh": "2rem",
  "text-3xl": "1.875rem",
  "text-3xl-lh": "2.3rem",
  "text-4xl": "2.25rem",
  "text-4xl-lh": "2.6rem",
  "weight-normal": "400",
  "weight-medium": "500",
  "weight-semibold": "600",
  "weight-bold": "700",
  "tracking-tight": "-0.015em",
  "tracking-caps": "0.08em",
  // 4px grid
  "space-1": "4px",
  "space-2": "8px",
  "space-3": "12px",
  "space-4": "16px",
  "space-5": "20px",
  "space-6": "24px",
  "space-8": "32px",
  "space-10": "40px",
  "space-12": "48px",
  "space-16": "64px",
  "radius-xs": "4px",
  "radius-sm": "8px",
  "radius-md": "14px",
  "radius-lg": "20px",
  "radius-pill": "999px",
  "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
  "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  "dur-fast": "160ms",
  "dur-med": "320ms",
  "z-base": "0",
  "z-sticky": "20",
  "z-dropdown": "40",
  "z-modal": "50",
  "z-toast": "60",
  "z-tooltip": "100",
  "page-max": "1120px",
  gutter: "16px",
  "tap-min": "44px",
  "focus-width": "2px",
  "focus-offset": "2px",
  // Breakpoints for reference in JS and media queries (CSS vars cannot drive @media).
  "bp-sm": "640px",
  "bp-md": "768px",
  "bp-lg": "1024px",
  "bp-xl": "1280px"
};

// src/theme.ts
var PRESETS = Object.keys(THEMES).map((id) => ({
  id,
  label: THEMES[id].label,
  scheme: THEMES[id].scheme,
  colors: THEMES[id].colors
}));
var KEY = "nish-theme";
var SHARED_DOMAIN = "nish.software";
var ONE_YEAR = 60 * 60 * 24 * 365;
function isThemeName(v) {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(THEMES, v);
}
function readCookie() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)nish-theme=([a-z-]+)/);
  return m ? m[1] : null;
}
function onSharedDomain() {
  const h = typeof location === "undefined" ? "" : location.hostname;
  return h === SHARED_DOMAIN || h.endsWith("." + SHARED_DOMAIN);
}
function getThemeChoice() {
  let v = null;
  try {
    v = readCookie() ?? localStorage.getItem(KEY);
  } catch {
  }
  return v === "system" || isThemeName(v) ? v : "system";
}
function systemTheme() {
  const light = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: light)").matches;
  return light ? "light" : DEFAULT_THEME;
}
function allowedThemes() {
  const attr = document.documentElement.getAttribute("data-nish-themes");
  return attr ? attr.split(/\s+/).filter(isThemeName) : null;
}
function resolveTheme(choice = getThemeChoice()) {
  let theme = choice === "system" ? systemTheme() : choice;
  const allowed = typeof document === "undefined" ? null : allowedThemes();
  if (allowed && !allowed.includes(theme)) theme = THEMES[theme].scheme;
  return theme;
}
function schemeOf(theme) {
  return THEMES[theme].scheme;
}
function applyTheme(choice = getThemeChoice()) {
  const theme = resolveTheme(choice);
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-scheme", schemeOf(theme));
  root.setAttribute("data-theme-choice", choice);
  root.style.colorScheme = schemeOf(theme);
  syncChromeColor();
  listeners.forEach((fn) => fn(choice, theme));
  return theme;
}
function setThemeChoice(choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
  }
  if (onSharedDomain()) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${KEY}=${choice}; Domain=.${SHARED_DOMAIN}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
  }
  return applyTheme(choice);
}
function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--nish-${name}`).trim();
}
function syncChromeColor() {
  const bg = readToken("bg");
  if (!bg) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = bg;
}
var listeners = /* @__PURE__ */ new Set();
var watching = false;
function watch() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  const reapply = () => {
    const choice = getThemeChoice();
    if (choice !== document.documentElement.getAttribute("data-theme-choice") || choice === "system") applyTheme(choice);
  };
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", reapply);
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) reapply();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reapply();
  });
}
function onThemeChange(fn) {
  watch();
  listeners.add(fn);
  return () => listeners.delete(fn);
}
var TOGGLE_ORDER = ["system", "light", "dark"];
function cycleTheme() {
  const i = TOGGLE_ORDER.indexOf(getThemeChoice());
  const next = TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
  setThemeChoice(next);
  return next;
}
function initTheme() {
  watch();
  return applyTheme();
}

// src/components/primitives.tsx
import { forwardRef } from "react";

// src/components/icons.tsx
import { jsx, jsxs } from "react/jsx-runtime";
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
var XIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M18 6 6 18M6 6l12 12" }) });
var CheckCircleIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
  /* @__PURE__ */ jsx("path", { d: "m9 12 2 2 4-4" })
] });
var AlertTriangleIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
  /* @__PURE__ */ jsx("path", { d: "M12 9v4M12 17h.01" })
] });
var InfoIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
  /* @__PURE__ */ jsx("path", { d: "M12 16v-4M12 8h.01" })
] });
var RotateIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }),
  /* @__PURE__ */ jsx("path", { d: "M21 3v5h-5" })
] });
var LoaderIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 1 1-6.22-8.56" }) });
var SunIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "4" }),
  /* @__PURE__ */ jsx("path", { d: "M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41" })
] });
var MoonIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" }) });
var MonitorIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }),
  /* @__PURE__ */ jsx("path", { d: "M8 21h8M12 17v4" })
] });
var ChevronDownIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) });

// src/components/primitives.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var BUTTON_VARIANT = {
  primary: "bg-th-accent text-th-on-accent hover:bg-th-accent/90 active:bg-th-accent/80",
  secondary: "border border-th-line-strong bg-th-surface text-th-hi hover:bg-th-elevated",
  ghost: "text-th-hi2 hover:bg-th-elevated hover:text-th-hi",
  danger: "bg-th-loss text-th-on-accent hover:bg-th-loss/90 active:bg-th-loss/80"
};
var BUTTON_SIZE = {
  sm: "h-7 gap-1.5 px-2.5 text-xs pointer-coarse:min-h-11",
  md: "h-9 gap-2 px-3.5 text-sm pointer-coarse:min-h-11",
  lg: "h-11 gap-2 px-5 text-base"
};
var Button = forwardRef(function Button2({ variant = "secondary", size = "md", loading = false, icon, className, children, disabled, type = "button", ...rest }, ref) {
  return /* @__PURE__ */ jsxs2(
    "button",
    {
      ref,
      type,
      disabled: disabled || loading,
      "aria-busy": loading || void 0,
      className: cn(
        "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className
      ),
      ...rest,
      children: [
        loading ? /* @__PURE__ */ jsx2(LoaderIcon, { size: size === "sm" ? 12 : 14, className: "animate-spin" }) : icon,
        children
      ]
    }
  );
});
var IconButton = forwardRef(function IconButton2({ label, size = "md", active = false, className, children, type = "button", ...rest }, ref) {
  return /* @__PURE__ */ jsx2(
    "button",
    {
      ref,
      type,
      "aria-label": label,
      title: label,
      "aria-pressed": active || void 0,
      className: cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-th-hi3 transition-colors duration-150",
        "hover:bg-th-elevated hover:text-th-hi disabled:pointer-events-none disabled:opacity-50",
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        size === "sm" ? "size-7" : "size-9",
        active && "bg-th-elevated text-th-hi",
        className
      ),
      ...rest,
      children
    }
  );
});
var Card = forwardRef(function Card2({ padded = true, interactive = false, className, ...rest }, ref) {
  return /* @__PURE__ */ jsx2(
    "div",
    {
      ref,
      className: cn(
        "rounded-xl border border-th-line bg-th-surface shadow-card",
        padded && "p-4 sm:p-5",
        interactive && "transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60",
        className
      ),
      ...rest
    }
  );
});
var BADGE_TONE = {
  neutral: "border-th-line bg-th-elevated text-th-hi2",
  accent: "border-th-accent/30 bg-th-accent-soft text-th-accent",
  ok: "border-th-ok/30 bg-th-ok-soft text-th-ok",
  loss: "border-th-loss/30 bg-th-loss-soft text-th-loss",
  warn: "border-th-warn/30 bg-th-warn-soft text-th-warn",
  info: "border-th-info/30 bg-th-info-soft text-th-info"
};
function Badge({ tone = "neutral", className, ...rest }) {
  return /* @__PURE__ */ jsx2(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-4",
        BADGE_TONE[tone],
        className
      ),
      ...rest
    }
  );
}
var FIELD = "w-full min-w-0 rounded-lg border border-th-line-strong bg-th-elevated text-th-hi placeholder:text-th-ghost transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-th-loss";
var Input = forwardRef(function Input2({ invalid, className, ...rest }, ref) {
  return /* @__PURE__ */ jsx2(
    "input",
    {
      ref,
      "aria-invalid": invalid || void 0,
      className: cn(FIELD, "h-9 px-3 text-base sm:text-sm pointer-coarse:min-h-11", className),
      ...rest
    }
  );
});
var Select = forwardRef(function Select2({ invalid, className, children, ...rest }, ref) {
  return /* @__PURE__ */ jsxs2("span", { className: cn("relative inline-flex w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx2(
      "select",
      {
        ref,
        "aria-invalid": invalid || void 0,
        className: cn(FIELD, "h-9 appearance-none pl-3 pr-8 text-base sm:text-sm pointer-coarse:min-h-11"),
        ...rest,
        children
      }
    ),
    /* @__PURE__ */ jsx2(ChevronDownIcon, { size: 14, className: "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-th-hi3" })
  ] });
});
function Label({ className, ...rest }) {
  return /* @__PURE__ */ jsx2("span", { className: cn("text-xs font-medium uppercase tracking-wider text-th-hi3", className), ...rest });
}

// src/components/feedback.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Skeleton({ className }) {
  return /* @__PURE__ */ jsx3("div", { "aria-hidden": "true", className: cn("nish-skeleton rounded-md", className) });
}
function SkeletonLines({ lines = 3, className }) {
  return /* @__PURE__ */ jsxs3("div", { className: cn("flex flex-col gap-2.5 p-3", className), "aria-busy": "true", "aria-label": "Loading", children: [
    /* @__PURE__ */ jsx3(Skeleton, { className: "h-4 w-2/5" }),
    Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx3(Skeleton, { className: cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5") }, i))
  ] });
}
function EmptyState({ icon, title, detail, action, compact = false, className }) {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-1.5 p-4" : "gap-2 rounded-xl border border-dashed border-th-line px-6 py-12",
        className
      ),
      children: [
        icon ? /* @__PURE__ */ jsx3("span", { className: "text-th-ghost [&>svg]:size-7", children: icon }) : null,
        /* @__PURE__ */ jsx3("p", { className: cn("font-medium text-th-hi2", compact ? "text-xs" : "text-sm"), children: title }),
        detail ? /* @__PURE__ */ jsx3("p", { className: "max-w-sm text-xs text-th-hi3", children: detail }) : null,
        action ? /* @__PURE__ */ jsx3("div", { className: "mt-2", children: action }) : null
      ]
    }
  );
}
function ErrorState({
  message = "Failed to load",
  onRetry,
  retrying = false,
  compact = false,
  className
}) {
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-2 p-4" : "gap-2 rounded-xl border border-th-loss/30 bg-th-loss-soft px-6 py-10",
        className
      ),
      children: [
        /* @__PURE__ */ jsx3(AlertTriangleIcon, { size: compact ? 16 : 22, className: "shrink-0 text-th-loss" }),
        /* @__PURE__ */ jsx3("p", { className: cn("max-w-md text-th-hi2", compact ? "text-xs" : "text-sm"), children: message }),
        onRetry ? /* @__PURE__ */ jsxs3(
          "button",
          {
            type: "button",
            onClick: onRetry,
            disabled: retrying,
            className: "mt-1 inline-flex items-center gap-1.5 rounded-full border border-th-line-strong px-3 py-1 text-xs text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi disabled:opacity-50 pointer-coarse:min-h-11",
            children: [
              retrying ? /* @__PURE__ */ jsx3(LoaderIcon, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsx3(RotateIcon, { size: 12 }),
              "Retry"
            ]
          }
        ) : null
      ]
    }
  );
}

// src/components/toast.tsx
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var items = [];
var nextId = 1;
var subs = /* @__PURE__ */ new Set();
var emit = () => subs.forEach((fn) => fn());
var AUTO_DISMISS_MS = 4e3;
var MAX_VISIBLE = 4;
function dismissToast(id) {
  items = items.filter((t) => t.id !== id);
  emit();
}
function push(tone, title, body) {
  const id = nextId++;
  items = [...items.slice(-(MAX_VISIBLE - 1)), { id, tone, title, body }];
  emit();
  if (tone !== "error") setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
  return id;
}
var toast = Object.assign((title, body) => push("info", title, body), {
  success: (title, body) => push("success", title, body),
  error: (title, body) => push("error", title, body),
  warn: (title, body) => push("warn", title, body),
  info: (title, body) => push("info", title, body)
});
function useToast() {
  return toast;
}
function useToasts() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => items,
    () => items
  );
}
var TONE = {
  success: { icon: /* @__PURE__ */ jsx4(CheckCircleIcon, { size: 15, className: "text-th-ok" }), className: "border-th-ok/35" },
  error: { icon: /* @__PURE__ */ jsx4(AlertTriangleIcon, { size: 15, className: "text-th-loss" }), className: "border-th-loss/40" },
  warn: { icon: /* @__PURE__ */ jsx4(AlertTriangleIcon, { size: 15, className: "text-th-warn" }), className: "border-th-warn/40" },
  info: { icon: /* @__PURE__ */ jsx4(InfoIcon, { size: 15, className: "text-th-accent" }), className: "border-th-line-strong" }
};
function Toaster({ className }) {
  const list = useToasts();
  if (typeof document === "undefined") return null;
  return createPortal(
    /* @__PURE__ */ jsx4(
      "div",
      {
        "aria-live": "polite",
        className: cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3 pb-[max(12px,env(safe-area-inset-bottom))]",
          "sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 sm:items-stretch sm:px-0 sm:pb-0",
          className
        ),
        children: list.map((t) => /* @__PURE__ */ jsxs4(
          "div",
          {
            role: t.tone === "error" ? "alert" : "status",
            className: cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop",
              "animate-[nish-rise-in_160ms_var(--nish-ease-out)]",
              TONE[t.tone].className
            ),
            children: [
              /* @__PURE__ */ jsx4("span", { className: "mt-0.5 shrink-0", children: TONE[t.tone].icon }),
              /* @__PURE__ */ jsxs4("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx4("p", { className: "text-sm font-medium leading-snug text-th-hi", children: t.title }),
                t.body ? /* @__PURE__ */ jsx4("p", { className: "mt-0.5 break-words text-xs leading-snug text-th-hi2", children: t.body }) : null
              ] }),
              /* @__PURE__ */ jsx4(
                "button",
                {
                  type: "button",
                  onClick: () => dismissToast(t.id),
                  "aria-label": "Dismiss",
                  className: "-m-1 shrink-0 rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:p-2",
                  children: /* @__PURE__ */ jsx4(XIcon, { size: 14 })
                }
              )
            ]
          },
          t.id
        ))
      }
    ),
    document.body
  );
}

// src/components/overlay.tsx
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { createPortal as createPortal2 } from "react-dom";
import { Fragment, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
var SIZE = { md: "sm:max-w-md", lg: "sm:max-w-xl", xl: "sm:max-w-3xl" };
function Modal({ title, onClose, children, size = "md", footer, className }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    (panel?.querySelector("[autofocus]") ?? panel)?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);
  return createPortal2(
    /* @__PURE__ */ jsx5(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-end justify-center bg-th-scrim/60 animate-[nish-fade-in_160ms_ease-out] sm:items-center sm:p-4",
        onMouseDown: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        children: /* @__PURE__ */ jsxs5(
          "div",
          {
            ref: panelRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": titleId,
            tabIndex: -1,
            className: cn(
              "flex max-h-[92dvh] w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none",
              "rounded-t-2xl animate-[nish-sheet-in_240ms_var(--nish-ease-out)] pb-[env(safe-area-inset-bottom)]",
              "sm:max-h-[85vh] sm:rounded-2xl sm:pb-0 sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]",
              SIZE[size],
              className
            ),
            children: [
              /* @__PURE__ */ jsx5("div", { className: "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-th-line-strong sm:hidden", "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs5("div", { className: "flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4", children: [
                /* @__PURE__ */ jsx5("h2", { id: titleId, className: "min-w-0 truncate text-base font-semibold text-th-hi", children: title }),
                /* @__PURE__ */ jsx5(
                  "button",
                  {
                    type: "button",
                    onClick: onClose,
                    "aria-label": "Close",
                    className: "-mr-1.5 shrink-0 rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:p-2.5",
                    children: /* @__PURE__ */ jsx5(XIcon, { size: 16 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx5("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2", children }),
              footer ? /* @__PURE__ */ jsx5("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
            ]
          }
        )
      }
    ),
    document.body
  );
}
var GAP = 8;
var MAX_WIDTH = 320;
function Tooltip({ tip, children, className, side = "top", as = "span" }) {
  const triggerRef = useRef(null);
  const tipRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const id = useId();
  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const roomAbove = r.top;
    const roomBelow = vh - r.bottom;
    const placement = side === "top" ? roomAbove < 90 && roomBelow > roomAbove ? "bottom" : "top" : roomBelow < 90 && roomAbove > roomBelow ? "top" : "bottom";
    const half = MAX_WIDTH / 2;
    const center = r.left + r.width / 2;
    const left = vw > MAX_WIDTH + 2 * GAP ? Math.min(Math.max(center, half + GAP), vw - half - GAP) : vw > 0 ? vw / 2 : center;
    setCoords({ top: placement === "top" ? r.top - GAP : r.bottom + GAP, left, placement });
  }, [side]);
  const hide = useCallback(() => setCoords(null), []);
  useLayoutEffect(() => {
    if (!coords) return;
    const tipEl = tipRef.current;
    const el = triggerRef.current;
    if (!tipEl || !el) return;
    const h = tipEl.getBoundingClientRect().height;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const need = h + 2 * GAP;
    let placement = coords.placement;
    if (placement === "top" && r.top < need && vh - r.bottom > r.top) placement = "bottom";
    else if (placement === "bottom" && vh - r.bottom < need && r.top > vh - r.bottom) placement = "top";
    let top = placement === "top" ? r.top - GAP : r.bottom + GAP;
    if (placement === "top") top = Math.max(top, Math.min(h + GAP, vh - GAP));
    else top = Math.min(top, Math.max(vh - GAP - h, GAP));
    if (top !== coords.top || placement !== coords.placement) setCoords({ ...coords, top, placement });
  }, [coords]);
  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    el.addEventListener("mouseenter", show);
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", show);
    el.addEventListener("blur", hide);
    return () => {
      el.removeEventListener("mouseenter", show);
      el.removeEventListener("mouseleave", hide);
      el.removeEventListener("focus", show);
      el.removeEventListener("blur", hide);
    };
  }, [show, hide]);
  const a11y = { tabIndex: 0, "aria-describedby": coords ? id : void 0 };
  return /* @__PURE__ */ jsxs5(Fragment, { children: [
    as === "tr" ? /* @__PURE__ */ jsx5("tr", { ref: triggerRef, className, ...a11y, children }) : /* @__PURE__ */ jsx5("span", { ref: triggerRef, className: cn("inline-flex items-center", className), ...a11y, children }),
    coords ? createPortal2(
      /* @__PURE__ */ jsx5(
        "span",
        {
          ref: tipRef,
          id,
          role: "tooltip",
          style: {
            position: "fixed",
            top: coords.top,
            left: coords.left,
            maxWidth: Math.min(MAX_WIDTH, (window.innerWidth || MAX_WIDTH) - 2 * GAP),
            transform: `translate(-50%, ${coords.placement === "top" ? "-100%" : "0"})`
          },
          className: "pointer-events-none z-[100] block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop",
          children: tip
        }
      ),
      document.body
    ) : null
  ] });
}

// src/components/theme-toggle.tsx
import { useEffect as useEffect2, useState as useState2 } from "react";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function useTheme() {
  const [state, setState] = useState2(() => {
    const choice = typeof document === "undefined" ? "system" : getThemeChoice();
    return { choice, theme: typeof document === "undefined" ? "dark" : resolveTheme(choice) };
  });
  useEffect2(() => onThemeChange((choice, theme) => setState({ choice, theme })), []);
  return { ...state, scheme: schemeOf(state.theme), setChoice: setThemeChoice };
}
var MODES = [
  { id: "system", label: "System", Icon: MonitorIcon },
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon }
];
function ThemeToggle({ presets = false, className }) {
  const { choice, setChoice } = useTheme();
  const extra = PRESETS.filter((p) => p.id !== "dark" && p.id !== "light");
  const isPreset = extra.some((p) => p.id === choice);
  return /* @__PURE__ */ jsxs6("div", { className: cn("inline-flex items-center gap-2", className), children: [
    /* @__PURE__ */ jsx6("div", { role: "radiogroup", "aria-label": "Theme", className: "inline-flex rounded-lg border border-th-line bg-th-elevated p-0.5", children: MODES.map(({ id, label, Icon }) => {
      const on = choice === id;
      return /* @__PURE__ */ jsx6(
        "button",
        {
          type: "button",
          role: "radio",
          "aria-checked": on,
          "aria-label": label,
          title: label,
          onClick: () => setChoice(id),
          className: cn(
            "inline-flex size-7 items-center justify-center rounded-md transition-colors pointer-coarse:size-10",
            on ? "bg-th-surface text-th-hi shadow-card" : "text-th-hi3 hover:text-th-hi"
          ),
          children: /* @__PURE__ */ jsx6(Icon, { size: 14 })
        },
        id
      );
    }) }),
    presets ? /* @__PURE__ */ jsxs6(
      "select",
      {
        "aria-label": "Theme preset",
        value: isPreset ? choice : "",
        onChange: (e) => e.target.value && setChoice(e.target.value),
        className: "h-8 rounded-lg border border-th-line bg-th-elevated px-2 text-xs text-th-hi2 pointer-coarse:min-h-11",
        children: [
          /* @__PURE__ */ jsx6("option", { value: "", children: "Preset\u2026" }),
          extra.map((p) => /* @__PURE__ */ jsx6("option", { value: p.id, children: p.label }, p.id))
        ]
      }
    ) : null
  ] });
}
export {
  Badge,
  Button,
  COLOR_ROLES,
  Card,
  DEFAULT_THEME,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Label,
  Modal,
  PRESETS,
  SCALE,
  Select,
  Skeleton,
  SkeletonLines,
  THEMES,
  TOGGLE_ORDER,
  ThemeToggle,
  Toaster,
  Tooltip,
  applyTheme,
  cn,
  cycleTheme,
  dismissToast,
  getThemeChoice,
  initTheme,
  isThemeName,
  onThemeChange,
  readToken,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  toast,
  useTheme,
  useToast
};
//# sourceMappingURL=index.js.map