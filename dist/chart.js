// src/tokens.mjs
var HUE_ROLES = ["emerald", "indigo", "amber", "lime", "rose", "sky", "violet", "teal"];
var SOFT_ROLES = ["accent", "ok", "loss", "warn", "info", ...HUE_ROLES];
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
var LIGHT_CHART = ["#6366f1", "#059669", "#c96d06", "#f43f5e", "#0284c7", "#a855f7", "#ea580c", "#5a910c"];
var chart = (list) => Object.fromEntries(list.map((c, i) => [`chart-${i + 1}`, c]));
var RAW_THEMES = {
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
      "line-control": "#666975",
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
      "line-control": "#8a8881",
      hi: "#17171c",
      hi2: "#4f515c",
      hi3: "#626470",
      ghost: "#8a8c98",
      accent: "#4338ca",
      accent2: "#7e22ce",
      "on-accent": "#ffffff",
      // Light fills are mid-tones: white only clears 4.5:1 on loss and accent2.
      "on-accent2": "#ffffff",
      "on-ok": "#0a0a0c",
      "on-loss": "#ffffff",
      "on-warn": "#0a0a0c",
      "on-info": "#0a0a0c",
      ok: "#065f46",
      "ok-fill": "#059669",
      "loss-fill": "#dc2626",
      "warn-fill": "#c96d06",
      "info-fill": "#0284c7",
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
      "line-control": "#77777e",
      hi: "#f4f4f5",
      hi2: "#b8b8c0",
      hi3: "#a0a0a8",
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
      "line-control": "#5c6c61",
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
      "line-control": "#83807c",
      hi: "#f5f0eb",
      hi2: "#c6c0bb",
      hi3: "#b2ada8",
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
      "line-control": "#507291",
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
      "line-control": "#8a8a8a",
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
var withFills = (t) => {
  const c = t.colors;
  const fills = Object.fromEntries(
    ["ok", "loss", "warn", "info"].flatMap((r) => [
      [`${r}-fill`, c[`${r}-fill`] ?? c[r]],
      [`on-${r}`, c[`on-${r}`] ?? c["on-accent"]]
    ])
  );
  return { ...t, colors: { ...c, ...fills, "on-accent2": c["on-accent2"] ?? c["on-accent"] } };
};
var THEMES = /* @__PURE__ */ Object.fromEntries(
  Object.entries(RAW_THEMES).map(([name, t]) => [name, withFills(t)])
);
var DEFAULT_THEME = "dark";

// src/runtime.ts
var version = true ? "2.0.2" : "dev";
var KEY = /* @__PURE__ */ Symbol.for("nish-ui.runtime.v1");
function runtime() {
  const g = globalThis;
  return g[KEY] ??= { versions: /* @__PURE__ */ new Set(), slots: {} };
}
function register(rt) {
  rt.versions.add(version);
  if (rt.versions.size > 1 && !rt.warned && globalThis.process?.env?.NODE_ENV !== "production") {
    rt.warned = true;
    console.warn(
      `nish-ui: two versions are loaded on this page (${[...rt.versions].join(", ")}). Overlays, toasts and theme state are shared, but mixing versions is unsupported.`
    );
  }
}
var registered = false;
function shared(key, init) {
  const rt = runtime();
  if (!registered) {
    registered = true;
    register(rt);
  }
  if (!(key in rt.slots)) rt.slots[key] = init();
  return rt.slots[key];
}

// src/theme.ts
var DEFAULT_KEY = "nish-theme";
var ONE_YEAR = 60 * 60 * 24 * 365;
var state = () => shared("theme", () => ({ extra: {}, listeners: /* @__PURE__ */ new Set(), watching: false, switchId: 0 }));
function storageKey() {
  if (typeof document === "undefined") return DEFAULT_KEY;
  const k = document.documentElement.getAttribute("data-nish-storage-key");
  return k && /^[A-Za-z0-9_-]+$/.test(k) ? k : DEFAULT_KEY;
}
var has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function isThemeName(v) {
  return typeof v === "string" && (has(THEMES, v) || has(state().extra, v));
}
function readCookie() {
  if (typeof document === "undefined") return null;
  try {
    const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${storageKey()}=([a-z0-9-]+)`));
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
function getThemeChoice() {
  let v = null;
  try {
    v = readCookie() ?? localStorage.getItem(storageKey());
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
  if (allowed && !allowed.includes(theme)) theme = schemeOf(theme);
  return theme;
}
function schemeOf(theme) {
  const { extra } = state();
  return has(THEMES, theme) ? THEMES[theme].scheme : has(extra, theme) ? extra[theme] : "dark";
}
function applyTheme(choice = getThemeChoice()) {
  const theme = resolveTheme(choice);
  const root = document.documentElement;
  const previous = root.getAttribute("data-theme");
  if (previous && previous !== theme) suspendTransitions(root);
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-scheme", schemeOf(theme));
  root.setAttribute("data-theme-choice", choice);
  root.style.colorScheme = schemeOf(theme);
  syncChromeColor();
  state().listeners.forEach((fn) => fn(choice, theme));
  return theme;
}
function suspendTransitions(root) {
  const st = state();
  const id = ++st.switchId;
  root.setAttribute("data-nish-theme-switching", "");
  const done = () => {
    if (st.switchId === id) root.removeAttribute("data-nish-theme-switching");
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => requestAnimationFrame(done));
  else setTimeout(done, 32);
}
function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--nish-${name}`).trim();
}
function syncChromeColor() {
  const bg = readToken("bg");
  if (!bg) return;
  let meta = document.querySelector('meta[name="theme-color"][data-nish]') ?? document.querySelector('meta[name="theme-color"]:not([media]):not([data-nish-keep])');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    (document.head || document.documentElement).appendChild(meta);
  }
  meta.setAttribute("data-nish", "");
  meta.content = bg;
}
function watch() {
  const st = state();
  if (st.watching || typeof window === "undefined") return;
  st.watching = true;
  const reapply = () => {
    const choice = getThemeChoice();
    if (choice !== document.documentElement.getAttribute("data-theme-choice") || choice === "system") applyTheme(choice);
  };
  if (typeof matchMedia === "function") matchMedia("(prefers-color-scheme: light)").addEventListener("change", reapply);
  window.addEventListener("storage", (e) => {
    if (e.key === storageKey()) reapply();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reapply();
  });
}
function onThemeChange(fn) {
  watch();
  const { listeners } = state();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// src/chart-values.ts
function seriesColor(i) {
  const n = (Math.trunc(i) % 8 + 8) % 8;
  return `var(--nish-chart-${n + 1})`;
}
var CHART = {
  grid: "var(--nish-line)",
  axis: "var(--nish-line-strong)",
  zero: "var(--nish-hi3)",
  text: "var(--nish-hi3)"
};
var tooltipStyle = {
  background: "var(--nish-elevated)",
  border: "1px solid var(--nish-line-strong)",
  borderRadius: "var(--nish-radius-sm)",
  boxShadow: "var(--nish-shadow-pop)",
  color: "var(--nish-hi)",
  fontSize: 12
};
function chartTheme() {
  const t = (name) => typeof document === "undefined" ? "" : readToken(name);
  return {
    grid: t("line"),
    axis: t("line-strong"),
    zero: t("hi3"),
    text: t("hi3"),
    bg: t("bg"),
    surface: t("surface"),
    series: Array.from({ length: 8 }, (_, i) => t(`chart-${i + 1}`)),
    ok: t("ok-fill"),
    loss: t("loss-fill"),
    warn: t("warn-fill"),
    info: t("info-fill"),
    accent: t("accent")
  };
}
var EMPTY_CHART_THEME = {
  grid: "",
  axis: "",
  zero: "",
  text: "",
  bg: "",
  surface: "",
  series: [],
  ok: "",
  loss: "",
  warn: "",
  info: "",
  accent: ""
};

// src/components/chart-hooks.ts
import { useState } from "react";

// src/components/client.ts
import { useLayoutEffect, useEffect, useSyncExternalStore } from "react";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// src/components/chart-hooks.ts
function useChartTheme() {
  const [theme, setTheme] = useState(EMPTY_CHART_THEME);
  useIsoLayoutEffect(() => {
    const update = () => setTheme(chartTheme());
    update();
    return onThemeChange(update);
  }, []);
  return theme;
}
export {
  CHART,
  chartTheme,
  seriesColor,
  tooltipStyle,
  useChartTheme
};
//# sourceMappingURL=chart.js.map