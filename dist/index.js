// src/cn.ts
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
var twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["2xs", "3xs"]
    },
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
  // text and icons on an accent fill
  "on-accent2",
  // text and icons on an accent2 fill
  "on-ok",
  // text and icons on a solid ok-fill
  "on-loss",
  // ... on loss-fill and loss (danger buttons)
  "on-warn",
  // ... on warn-fill
  "on-info",
  // ... on info-fill
  "ok",
  // success, gains
  "loss",
  // errors, losses, destructive
  "warn",
  // warnings, pending
  "info",
  // neutral notices
  "ok-fill",
  // status colors for bars, meters and chart lines: brighter than the
  "loss-fill",
  // text versions in light themes, where text-safe colors look muddy as fills
  "warn-fill",
  "info-fill",
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
for (const t of Object.values(THEMES)) {
  for (const r of ["ok", "loss", "warn", "info"]) {
    t.colors[`${r}-fill`] ??= t.colors[r];
    t.colors[`on-${r}`] ??= t.colors["on-accent"];
  }
  t.colors["on-accent2"] ??= t.colors["on-accent"];
}
var DEFAULT_THEME = "dark";
var SCALE = {
  // Inter Variable is self-hosted (fonts.css). Sites with their own display face
  // (mc's pixel font, trips' serif) set it locally and keep these for UI text.
  "font-sans": "'Inter Variable', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  "font-mono": "ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
  // Dense UI only (widget chrome, table meta, keyboard hints): never body text.
  "text-3xs": "0.625rem",
  "text-3xs-lh": "0.875rem",
  "text-2xs": "0.6875rem",
  "text-2xs-lh": "1rem",
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
  // Card is 12px (Tailwind rounded-xl). Controls use radius-sm (rounded-lg), dialogs
  // 16px (rounded-2xl), pills radius-pill (rounded-full).
  "radius-card": "12px",
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
var SHADOWS = {
  card: "0 1px 2px color-mix(in srgb, var(--nish-scrim) 10%, transparent), 0 6px 20px -8px color-mix(in srgb, var(--nish-scrim) 22%, transparent)",
  pop: "0 4px 12px -2px color-mix(in srgb, var(--nish-scrim) 24%, transparent), 0 12px 32px -8px color-mix(in srgb, var(--nish-scrim) 30%, transparent)",
  modal: "0 24px 64px -16px color-mix(in srgb, var(--nish-scrim) 45%, transparent)"
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
var extra = {};
function registerThemes(themes) {
  Object.assign(extra, themes);
}
var has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function isThemeName(v) {
  return typeof v === "string" && (has(THEMES, v) || has(extra, v));
}
function readCookie() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)nish-theme=([a-z0-9-]+)/);
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
  if (allowed && !allowed.includes(theme)) theme = schemeOf(theme);
  return theme;
}
function schemeOf(theme) {
  return has(THEMES, theme) ? THEMES[theme].scheme : extra[theme] ?? "dark";
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
  const next = nextChoice(getThemeChoice());
  setThemeChoice(next);
  return next;
}
var TOGGLE_ICONS = {
  system: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/>',
  dark: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>'
};
var DEFAULT_TOGGLE_LABELS = { system: "System", light: "Light", dark: "Dark" };
function nextChoice(choice) {
  const i = TOGGLE_ORDER.indexOf(choice);
  return TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
}
function themeLabel(choice, words) {
  if (choice === "system" || choice === "light" || choice === "dark") return words[choice];
  if (has(THEMES, choice)) return THEMES[choice].label;
  return choice.charAt(0).toUpperCase() + choice.slice(1);
}
function mountThemeToggle(button, opts = {}) {
  const words = { ...DEFAULT_TOGGLE_LABELS, ...opts.labels };
  if (button.tagName === "BUTTON" && !button.getAttribute("type")) button.setAttribute("type", "button");
  button.innerHTML = Object.keys(TOGGLE_ICONS).map(
    (id) => `<svg data-icon="${id}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TOGGLE_ICONS[id]}</svg>`
  ).join("") + (opts.showLabel ? '<span data-theme-word aria-hidden="true"></span>' : "");
  const word = button.querySelector("[data-theme-word]");
  const render = (choice) => {
    const icon = choice === "system" || choice === "light" || choice === "dark" ? choice : schemeOf(choice);
    button.setAttribute("data-choice", choice);
    button.querySelectorAll("svg[data-icon]").forEach((svg) => {
      if (svg.getAttribute("data-icon") === icon) svg.removeAttribute("display");
      else svg.setAttribute("display", "none");
    });
    const elsewhere = TOGGLE_ORDER.includes(choice) ? "" : " (set on another site)";
    const label = `Theme: ${themeLabel(choice, words)}${elsewhere}. Switch to ${themeLabel(nextChoice(choice), words)}`;
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    if (word) word.textContent = themeLabel(choice, words);
  };
  const onClick = () => {
    cycleTheme();
  };
  button.addEventListener("click", onClick);
  const off = onThemeChange((choice) => render(choice));
  render(getThemeChoice());
  return () => {
    button.removeEventListener("click", onClick);
    off();
  };
}
var TOAST_MS = 6e3;
var toastRegion = null;
var hideCurrent = null;
function showToast(content, opts = {}) {
  hideCurrent?.();
  if (!toastRegion || !toastRegion.isConnected) {
    toastRegion = document.createElement("div");
    toastRegion.setAttribute("role", "status");
    toastRegion.setAttribute("aria-live", "polite");
    toastRegion.className = "nish-toast-region";
    document.body.appendChild(toastRegion);
  }
  const region = toastRegion;
  const box = document.createElement("div");
  box.className = "nish-toast" + (opts.tone && opts.tone !== "neutral" ? ` nish-toast--${opts.tone}` : "");
  const body = document.createElement("p");
  body.className = "nish-toast-body";
  body.append(typeof content === "string" ? document.createTextNode(content) : content);
  box.append(body);
  let timer = null;
  let remaining = opts.duration === "sticky" ? Infinity : opts.duration ?? TOAST_MS;
  let started = 0;
  let holds = 0;
  const hide = () => {
    if (timer != null) clearTimeout(timer);
    timer = null;
    box.remove();
    if (hideCurrent === hide) hideCurrent = null;
  };
  const run = (ms) => {
    if (!Number.isFinite(ms)) return;
    started = Date.now();
    timer = setTimeout(hide, ms);
  };
  const pause = () => {
    holds += 1;
    if (holds > 1 || timer == null) return;
    clearTimeout(timer);
    timer = null;
    remaining = Math.max(0, remaining - (Date.now() - started));
  };
  const resume = () => {
    if (holds === 0) return;
    holds -= 1;
    if (holds === 0) run(Math.max(remaining, 1e3));
  };
  if (opts.action) {
    const a = opts.action;
    const el = document.createElement(a.href ? "a" : "button");
    el.className = "nish-toast-action";
    el.textContent = a.label;
    if (a.href) el.href = a.href;
    else el.type = "button";
    el.addEventListener("click", () => {
      a.onClick?.();
      hide();
    });
    box.append(el);
  }
  const close = document.createElement("button");
  close.type = "button";
  close.className = "nish-toast-close";
  close.setAttribute("aria-label", opts.dismissLabel ?? "Dismiss");
  close.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  close.addEventListener("click", hide);
  box.append(close);
  box.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && pause());
  box.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && resume());
  box.addEventListener("focusin", (e) => !box.contains(e.relatedTarget) && pause());
  box.addEventListener("focusout", (e) => !box.contains(e.relatedTarget) && resume());
  box.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
  setTimeout(() => {
    if (hideCurrent !== hide) return;
    region.append(box);
    run(remaining);
  }, 50);
  hideCurrent = hide;
  return hide;
}
var dialogSeq = 0;
function confirmDialog(opts) {
  if (typeof document === "undefined") return Promise.resolve(false);
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const id = `nish-dialog-${++dialogSeq}`;
  const danger = opts.tone === "danger";
  const dialog = document.createElement("dialog");
  dialog.className = "nish-dialog";
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  const title = document.createElement("h2");
  title.className = "nish-dialog-title";
  title.id = `${id}-title`;
  title.textContent = opts.title;
  dialog.append(title);
  if (opts.body != null && opts.body !== "") {
    const body = document.createElement("div");
    body.className = "nish-dialog-body";
    body.id = `${id}-body`;
    body.append(typeof opts.body === "string" ? document.createTextNode(opts.body) : opts.body);
    dialog.setAttribute("aria-describedby", body.id);
    dialog.append(body);
  }
  const actions = document.createElement("div");
  actions.className = "nish-dialog-actions";
  const button = (label, cls) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    return b;
  };
  const cancelBtn = button(opts.cancelLabel ?? "Cancel", "nish-btn");
  const confirmBtn = button(opts.confirmLabel ?? "Confirm", `nish-btn ${danger ? "nish-btn--danger" : "nish-btn--primary"}`);
  (danger ? cancelBtn : confirmBtn).autofocus = true;
  actions.append(cancelBtn, confirmBtn);
  dialog.append(actions);
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      if (opener?.isConnected) opener.focus();
      resolve(ok);
    };
    cancelBtn.addEventListener("click", () => finish(false));
    confirmBtn.addEventListener("click", () => finish(true));
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape") e.stopPropagation();
    });
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      finish(false);
    });
    dialog.addEventListener("close", () => finish(false));
    dialog.addEventListener("click", (e) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) finish(false);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}
function mountTooltips(root = document) {
  if (typeof document === "undefined") return () => void 0;
  root.querySelectorAll(".nish-tooltip").forEach((t) => {
    const tip = t.querySelector(":scope > .nish-tooltip-content");
    if (!tip) return;
    if (!tip.getAttribute("role")) tip.setAttribute("role", "tooltip");
    if (!tip.id) tip.id = `nish-tip-${++dialogSeq}`;
    const ids = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    if (!ids.includes(tip.id)) t.setAttribute("aria-describedby", [...ids, tip.id].join(" "));
  });
  const trigger = (e) => e.target instanceof Element ? e.target.closest(".nish-tooltip") : null;
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    const open = root.querySelectorAll(".nish-tooltip:hover, .nish-tooltip:focus-within");
    open.forEach((t) => t.setAttribute("data-tooltip-hidden", ""));
  };
  const reset = (e) => {
    const t = trigger(e);
    if (!t) return;
    const to = e.relatedTarget;
    if (to && t.contains(to)) return;
    t.removeAttribute("data-tooltip-hidden");
  };
  root.addEventListener("keydown", onKey);
  root.addEventListener("mouseout", reset);
  root.addEventListener("focusout", reset);
  return () => {
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("mouseout", reset);
    root.removeEventListener("focusout", reset);
  };
}
function initTheme() {
  watch();
  return applyTheme();
}

// src/components/primitives.tsx
import {
  forwardRef,
  useId
} from "react";

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
var BUTTON_BASE = "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150";
var BUTTON_DISABLED = "disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none";
var LINK_DISABLED = "disabled:pointer-events-none disabled:text-th-ghost disabled:no-underline";
function buttonClass({ variant = "secondary", size = "md", className } = {}) {
  return cn(BUTTON_BASE, variant === "link" ? LINK_SIZE[size] : BUTTON_SIZE[size], BUTTON_VARIANT[variant], className);
}
var Button = forwardRef(function Button2({ variant = "secondary", size = "md", loading = false, icon, className, children, disabled, type = "button", ...rest }, ref) {
  return /* @__PURE__ */ jsxs2(
    "button",
    {
      ref,
      type,
      disabled: disabled || loading,
      "aria-busy": loading || void 0,
      className: buttonClass({
        variant,
        size,
        className: cn(variant === "link" ? LINK_DISABLED : BUTTON_DISABLED, className)
      }),
      ...rest,
      children: [
        loading ? /* @__PURE__ */ jsx2(LoaderIcon, { size: size === "xs" || size === "sm" ? 12 : 14, className: "animate-spin" }) : icon,
        children
      ]
    }
  );
});
var ICON_SIZE = {
  "2xs": "size-5 rounded",
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
    "inline-flex shrink-0 items-center justify-center transition-colors duration-150",
    "disabled:pointer-events-none disabled:bg-transparent disabled:text-th-ghost",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    ICON_SIZE[size],
    ICON_VARIANT[variant].idle,
    active && ICON_VARIANT[variant].active,
    tone === "danger" && ICON_DANGER,
    active && tone === "danger" && "bg-th-loss-soft text-th-loss",
    className
  );
}
var IconButton = forwardRef(function IconButton2({ label, size = "md", active = false, variant = "ghost", tone = "neutral", className, children, type = "button", ...rest }, ref) {
  return /* @__PURE__ */ jsx2(
    "button",
    {
      ref,
      type,
      "aria-label": label,
      title: label,
      "aria-pressed": active || void 0,
      className: iconButtonClass({ size, variant, tone, active, className }),
      ...rest,
      children
    }
  );
});
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
    inset ? "rounded-lg border border-transparent bg-th-elevated" : "rounded-xl border border-th-line bg-th-surface shadow-card",
    CARD_PADDING[resolvePadding(padding, padded)],
    interactive && (inset ? "transition-colors duration-150 hover:bg-th-overlay" : "transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60"),
    className
  );
}
function CardHeader({
  title,
  description,
  action,
  icon,
  as: Heading = "h2",
  divided = false,
  titleId,
  className,
  ...rest
}) {
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-2",
        divided && "border-b border-th-line px-4 py-3",
        className
      ),
      ...rest,
      children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex min-w-0 items-start gap-2", children: [
          icon ? /* @__PURE__ */ jsx2("span", { className: "mt-0.5 inline-flex shrink-0 text-th-hi3", "aria-hidden": "true", children: icon }) : null,
          /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx2(Heading, { id: titleId, className: "text-sm font-semibold text-th-hi", children: title }),
            description ? /* @__PURE__ */ jsx2("p", { className: "mt-0.5 text-xs text-th-hi3", children: description }) : null
          ] })
        ] }),
        action ? /* @__PURE__ */ jsx2("div", { className: "flex shrink-0 flex-wrap items-center gap-2", children: action }) : null
      ]
    }
  );
}
var Card = forwardRef(function Card2({ as = "div", padding, padded, interactive = false, variant = "surface", title, description, action, className, children, ...rest }, ref) {
  const Tag = as;
  const pad = resolvePadding(padding, padded);
  const headingId = useId();
  const region = title != null && (as === "section" || as === "article" || as === "aside");
  return /* @__PURE__ */ jsxs2(
    Tag,
    {
      ref,
      "aria-labelledby": region && !rest["aria-label"] && !rest["aria-labelledby"] ? headingId : void 0,
      className: cardClass({ padding: pad, interactive, variant, className }),
      ...rest,
      children: [
        title != null ? /* @__PURE__ */ jsx2(
          CardHeader,
          {
            title,
            description,
            action,
            titleId: headingId,
            divided: pad === "none",
            className: pad === "none" ? void 0 : "mb-3"
          }
        ) : null,
        children
      ]
    }
  );
});
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
    variant === "tag" && "rounded-sm border-transparent font-semibold uppercase tracking-wide",
    className
  );
}
function Badge({ tone = "neutral", hue, size = "sm", variant = "pill", dot = false, className, children, ...rest }) {
  return /* @__PURE__ */ jsxs2("span", { className: badgeClass({ tone, hue, size, variant, className }), ...rest, children: [
    dot ? /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", className: cn("inline-block size-1.5 shrink-0 rounded-full", hue ? DOT_HUE[hue] : DOT_TONE[tone]) }) : null,
    children
  ] });
}
var FIELD = "w-full min-w-0 rounded-lg border border-th-line-strong bg-th-elevated text-th-hi placeholder:text-th-ghost transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-th-loss";
var FIELD_SIZE = {
  xs: { box: "h-7 pointer-coarse:min-h-11", pad: "pl-2 pr-2", text: "text-2xs pointer-coarse:text-base" },
  sm: { box: "h-8 pointer-coarse:min-h-11", pad: "pl-2.5 pr-2.5", text: "text-xs pointer-coarse:text-base" },
  md: { box: "h-9 pointer-coarse:min-h-11", pad: "pl-3 pr-3", text: "text-sm pointer-coarse:text-base" }
};
var FIELD_INVALID = "border-th-loss hover:border-th-loss";
function fieldClass({ size = "md", invalid = false, className } = {}) {
  const s = FIELD_SIZE[size];
  return cn(FIELD, s.box, s.pad, s.text, invalid && FIELD_INVALID, className);
}
var Input = forwardRef(function Input2({ invalid, size = "md", leading, trailing, wrapperClassName, className, ...rest }, ref) {
  const input = /* @__PURE__ */ jsx2(
    "input",
    {
      ref,
      "aria-invalid": invalid || void 0,
      className: fieldClass({ size, className: cn(leading != null && "pl-8", trailing != null && "pr-8", className) }),
      ...rest
    }
  );
  if (leading == null && trailing == null) return input;
  return /* @__PURE__ */ jsxs2("span", { className: cn("relative inline-flex w-full min-w-0 items-center", wrapperClassName), children: [
    leading != null ? /* @__PURE__ */ jsx2("span", { className: "pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center text-sm text-th-hi2", children: leading }) : null,
    input,
    trailing != null ? /* @__PURE__ */ jsx2("span", { className: "absolute inset-y-0 right-0 flex min-w-8 items-center justify-center pr-0.5 text-sm text-th-hi2", children: trailing }) : null
  ] });
});
var SELECT_SIZE = {
  xs: { pad: "pl-2 pr-6", chevron: "right-1.5", icon: 12 },
  sm: { pad: "pl-2.5 pr-7", chevron: "right-2", icon: 13 },
  md: { pad: "pl-3 pr-8", chevron: "right-2.5", icon: 14 }
};
var Select = forwardRef(function Select2({ invalid, size = "md", selectClassName, className, children, ...rest }, ref) {
  const s = SELECT_SIZE[size];
  return /* @__PURE__ */ jsxs2("span", { className: cn("relative inline-flex w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx2(
      "select",
      {
        ref,
        "aria-invalid": invalid || void 0,
        className: fieldClass({ size, className: cn("appearance-none", s.pad, selectClassName) }),
        ...rest,
        children
      }
    ),
    /* @__PURE__ */ jsx2(ChevronDownIcon, { size: s.icon, className: cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3", s.chevron) })
  ] });
});
function Label({ className, ...rest }) {
  return /* @__PURE__ */ jsx2("span", { className: cn("text-xs font-medium uppercase tracking-wider text-th-hi3", className), ...rest });
}

// src/components/forms.tsx
import {
  Children,
  cloneElement,
  forwardRef as forwardRef2,
  isValidElement,
  useCallback,
  useEffect,
  useId as useId2,
  useLayoutEffect,
  useRef
} from "react";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function Svg2({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx3("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", ...rest, children });
}
var SearchIcon = (p) => /* @__PURE__ */ jsxs3(Svg2, { ...p, children: [
  /* @__PURE__ */ jsx3("circle", { cx: "11", cy: "11", r: "8" }),
  /* @__PURE__ */ jsx3("path", { d: "m21 21-4.3-4.3" })
] });
var PlusIcon = (p) => /* @__PURE__ */ jsx3(Svg2, { ...p, children: /* @__PURE__ */ jsx3("path", { d: "M5 12h14M12 5v14" }) });
var CheckIcon = (p) => /* @__PURE__ */ jsx3(Svg2, { strokeWidth: 3, ...p, children: /* @__PURE__ */ jsx3("path", { d: "M20 6 9 17l-5-5" }) });
var MinusIcon = (p) => /* @__PURE__ */ jsx3(Svg2, { strokeWidth: 3, ...p, children: /* @__PURE__ */ jsx3("path", { d: "M5 12h14" }) });
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function setRef(ref, node) {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}
var Textarea = forwardRef2(function Textarea2({ invalid, size = "md", autoGrow = false, className, rows = 4, value, onInput, ...rest }, ref) {
  const inner = useRef(null);
  const grow = autoGrow !== false;
  const maxRows = typeof autoGrow === "object" ? autoGrow.maxRows : void 0;
  const resize = useCallback(() => {
    const el = inner.current;
    if (!el || !grow) return;
    el.style.height = "auto";
    const cs = getComputedStyle(el);
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    let h = el.scrollHeight + border;
    if (maxRows) {
      const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      const max = line * maxRows + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + border;
      el.style.overflowY = h > max ? "auto" : "hidden";
      h = Math.min(h, max);
    } else {
      el.style.overflowY = "hidden";
    }
    el.style.height = `${h}px`;
  }, [grow, maxRows]);
  useIsoLayoutEffect(() => {
    resize();
  }, [resize, value]);
  return /* @__PURE__ */ jsx3(
    "textarea",
    {
      ref: (node) => {
        inner.current = node;
        setRef(ref, node);
      },
      rows,
      value,
      "aria-invalid": invalid || void 0,
      onInput: (e) => {
        resize();
        onInput?.(e);
      },
      className: cn(
        FIELD,
        "block leading-relaxed",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
        "pointer-coarse:text-base",
        grow ? "resize-none" : "resize-y",
        className
      ),
      ...rest
    }
  );
});
var Checkbox = forwardRef2(function Checkbox2({ label, hint, indeterminate = false, trailing, size = "md", className, id, disabled, ...rest }, ref) {
  const auto = useId2();
  const boxId = id ?? auto;
  const inner = useRef(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const sm = size === "sm";
  return /* @__PURE__ */ jsxs3(
    "label",
    {
      htmlFor: boxId,
      className: cn(
        "cursor-pointer items-start gap-2.5 text-th-hi pointer-coarse:min-h-11 pointer-coarse:py-2.5",
        sm ? "gap-2 text-xs" : "text-sm",
        trailing != null ? "flex w-full" : "inline-flex",
        label == null && hint == null && "items-center pointer-coarse:min-w-11 pointer-coarse:justify-center",
        disabled && "cursor-not-allowed opacity-50",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs3("span", { className: cn("relative inline-flex shrink-0", label != null && (sm ? "mt-px" : "mt-0.5")), children: [
          /* @__PURE__ */ jsx3(
            "input",
            {
              ref: (node) => {
                inner.current = node;
                setRef(ref, node);
              },
              id: boxId,
              type: "checkbox",
              disabled,
              className: cn(
                "peer m-0 shrink-0 cursor-[inherit] appearance-none rounded border border-th-line-strong bg-th-surface transition-colors",
                "checked:border-th-accent checked:bg-th-accent indeterminate:border-th-accent indeterminate:bg-th-accent",
                sm ? "size-3.5" : "size-4"
              ),
              ...rest
            }
          ),
          /* @__PURE__ */ jsx3(
            CheckIcon,
            {
              size: sm ? 10 : 12,
              className: "pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-checked:block peer-indeterminate:hidden"
            }
          ),
          /* @__PURE__ */ jsx3(MinusIcon, { size: sm ? 10 : 12, className: "pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-indeterminate:block" })
        ] }),
        label != null || hint != null ? /* @__PURE__ */ jsxs3("span", { className: "min-w-0", children: [
          label != null ? /* @__PURE__ */ jsx3("span", { className: "block leading-snug", children: label }) : null,
          hint ? /* @__PURE__ */ jsx3("span", { className: "mt-0.5 block text-xs text-th-hi3", children: hint }) : null
        ] }) : null,
        trailing != null ? /* @__PURE__ */ jsx3("span", { className: "ml-auto shrink-0 pl-2 text-th-hi2 tabular-nums", children: trailing }) : null
      ]
    }
  );
});
var Switch = forwardRef2(function Switch2({ checked, onChange, label, description, size = "md", labelSide = "start", disabled, className, id, onClick, ...rest }, ref) {
  const auto = useId2();
  const btnId = id ?? `${auto}-switch`;
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const sm = size === "sm";
  const button = /* @__PURE__ */ jsx3(
    "button",
    {
      ref,
      id: btnId,
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-labelledby": label != null ? labelId : rest["aria-labelledby"],
      "aria-describedby": description != null ? descId : rest["aria-describedby"],
      disabled,
      onClick: (e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onChange(!checked, e);
      },
      className: cn(
        "group relative inline-flex shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50",
        "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
        label == null && className
      ),
      ...rest,
      children: /* @__PURE__ */ jsx3(
        "span",
        {
          "aria-hidden": "true",
          className: cn(
            "inline-flex items-center rounded-full p-0.5 transition-colors duration-150",
            sm ? "h-4 w-7" : "h-5 w-9",
            checked ? "bg-th-accent" : "bg-th-line-strong"
          ),
          children: /* @__PURE__ */ jsx3(
            "span",
            {
              className: cn(
                "rounded-full shadow-card transition-transform duration-150 motion-reduce:transition-none",
                sm ? "size-3" : "size-4",
                checked ? sm ? "translate-x-3 bg-th-on-accent" : "translate-x-4 bg-th-on-accent" : "translate-x-0 bg-th-surface"
              )
            }
          )
        }
      )
    }
  );
  if (label == null) return button;
  const text = /* @__PURE__ */ jsxs3("span", { className: "min-w-0", children: [
    /* @__PURE__ */ jsx3("span", { id: labelId, className: cn("block leading-snug text-th-hi", sm ? "text-xs" : "text-sm"), children: label }),
    description != null ? /* @__PURE__ */ jsx3("span", { id: descId, className: "mt-0.5 block text-xs text-th-hi3", children: description }) : null
  ] });
  return /* @__PURE__ */ jsxs3(
    "label",
    {
      htmlFor: btnId,
      className: cn(
        "flex cursor-pointer items-start gap-3 pointer-coarse:items-center",
        labelSide === "start" && "justify-between",
        disabled && "cursor-not-allowed",
        className
      ),
      children: [
        labelSide === "start" ? text : null,
        /* @__PURE__ */ jsx3("span", { className: cn("inline-flex", sm ? "pt-0" : "pt-px", "pointer-coarse:pt-0"), children: button }),
        labelSide === "end" ? text : null
      ]
    }
  );
});
function Field({ label, hint, error, optional = false, htmlFor, layout = "stack", labelWidth = "7rem", children, className }) {
  const auto = useId2();
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const childId = only && typeof only.props.id === "string" ? only.props.id : void 0;
  const controlId = htmlFor ?? childId ?? `${auto}-control`;
  const hasError = error != null && error !== false && error !== "";
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy = [only?.props["aria-describedby"], hasError ? errorId : hint != null ? hintId : void 0].filter(Boolean).join(" ") || void 0;
  const control = only ? cloneElement(only, {
    id: htmlFor ?? childId ?? controlId,
    "aria-describedby": describedBy,
    ...hasError ? { "aria-invalid": true } : null,
    // Shared components take `invalid`; native elements would warn on it.
    ...hasError && typeof only.type !== "string" ? { invalid: true } : null
  }) : children;
  const inline = layout === "inline";
  const labelEl = /* @__PURE__ */ jsxs3(
    "label",
    {
      htmlFor: controlId,
      className: cn(
        "flex flex-wrap items-baseline gap-x-1.5",
        inline ? "text-xs text-th-hi3 pointer-coarse:min-h-11 pointer-coarse:items-center" : "text-sm font-medium text-th-hi"
      ),
      children: [
        /* @__PURE__ */ jsx3("span", { children: label }),
        optional ? /* @__PURE__ */ jsx3("span", { className: "text-xs font-normal text-th-hi3", children: "Optional" }) : null
      ]
    }
  );
  const message = hasError ? /* @__PURE__ */ jsx3("p", { id: errorId, role: "alert", className: "text-xs text-th-loss", children: error }) : hint != null ? /* @__PURE__ */ jsx3("p", { id: hintId, className: "text-xs text-th-hi3", children: hint }) : null;
  if (inline) {
    return /* @__PURE__ */ jsxs3("div", { className: cn("grid items-center gap-x-3 gap-y-1", className), style: { gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }, children: [
      labelEl,
      /* @__PURE__ */ jsx3("div", { className: "min-w-0", children: control }),
      message ? /* @__PURE__ */ jsx3("div", { className: "col-start-2", children: message }) : null
    ] });
  }
  return /* @__PURE__ */ jsxs3("div", { className: cn("grid w-full gap-1.5", className), children: [
    labelEl,
    control,
    message
  ] });
}
function FieldGroup({ label, hint, error, optional = false, className, children, ...rest }) {
  const auto = useId2();
  const hasError = error != null && error !== false && error !== "";
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy = [rest["aria-describedby"], hasError ? errorId : hint != null ? hintId : void 0].filter(Boolean).join(" ") || void 0;
  return /* @__PURE__ */ jsxs3("fieldset", { ...rest, "aria-describedby": describedBy, className: cn("m-0 grid min-w-0 gap-1.5 border-0 p-0", className), children: [
    /* @__PURE__ */ jsxs3("legend", { className: "mb-1.5 flex flex-wrap items-baseline gap-x-1.5 p-0 text-sm font-medium text-th-hi", children: [
      /* @__PURE__ */ jsx3("span", { children: label }),
      optional ? /* @__PURE__ */ jsx3("span", { className: "text-xs font-normal text-th-hi3", children: "Optional" }) : null
    ] }),
    children,
    hasError ? /* @__PURE__ */ jsx3("p", { id: errorId, role: "alert", className: "text-xs text-th-loss", children: error }) : hint != null ? /* @__PURE__ */ jsx3("p", { id: hintId, className: "text-xs text-th-hi3", children: hint }) : null
  ] });
}
var SEARCH_SIZE = {
  xs: "h-7 text-2xs pointer-coarse:text-base",
  sm: "h-8 text-xs pointer-coarse:text-base",
  md: "h-9 text-sm pointer-coarse:text-base"
};
var SearchInput = forwardRef2(function SearchInput2({ value, onChange, onClear, size = "md", variant = "field", className, inputClassName, onKeyDown, placeholder = "Search", disabled, ...rest }, ref) {
  const inner = useRef(null);
  const clear = () => {
    onChange("");
    onClear?.();
  };
  return /* @__PURE__ */ jsxs3("div", { className: cn("relative w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx3(
      SearchIcon,
      {
        size: size === "md" ? 16 : 14,
        className: cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3", size === "xs" ? "left-2" : "left-2.5")
      }
    ),
    /* @__PURE__ */ jsx3(
      Input,
      {
        ref: (node) => {
          inner.current = node;
          setRef(ref, node);
        },
        type: "search",
        enterKeyHint: "search",
        autoComplete: "off",
        value,
        placeholder,
        disabled,
        onChange: (e) => onChange(e.target.value, e),
        onKeyDown: (e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === "Escape" && value) {
            e.preventDefault();
            e.stopPropagation();
            clear();
          }
        },
        className: cn(
          SEARCH_SIZE[size],
          size === "xs" ? "pl-7" : size === "sm" ? "pl-8" : "pl-9",
          value ? "pr-8 pointer-coarse:pr-11" : size === "xs" ? "pr-2" : "pr-3",
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          variant === "bare" && "border-transparent bg-transparent hover:border-transparent focus:border-transparent",
          inputClassName
        ),
        ...rest
      }
    ),
    value && !disabled ? /* @__PURE__ */ jsx3(
      IconButton,
      {
        label: "Clear search",
        size: "xs",
        onClick: () => {
          clear();
          inner.current?.focus();
        },
        className: "absolute right-1 top-1/2 -translate-y-1/2",
        children: /* @__PURE__ */ jsx3(XIcon, { size: 14 })
      }
    ) : null
  ] });
});
var CHIP_BASE = "inline-flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors duration-150";
var CHIP_SIZE = { sm: "h-7 px-2.5 text-xs", md: "h-8 px-3 text-sm" };
var CHIP_LOOK = {
  toggle: "border-th-line-strong text-th-hi2 hover:bg-th-elevated hover:text-th-hi",
  pressed: "border-th-accent/60 bg-th-accent-soft text-th-accent hover:bg-th-accent/20",
  suggestion: "border-dashed border-th-line-strong text-th-hi3 hover:border-th-hi3 hover:text-th-hi",
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
var Chip = forwardRef2(function Chip2({ variant = "toggle", pressed, onRemove, removeLabel, icon, trailing, size = "md", className, children, type = "button", ...rest }, ref) {
  if (variant === "tag") {
    const name = removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove");
    return /* @__PURE__ */ jsxs3("span", { className: chipClass({ variant: "tag", size, className: cn(onRemove && (size === "sm" ? "pr-0.5" : "pr-1"), className) }), children: [
      icon,
      children,
      trailing,
      onRemove ? /* @__PURE__ */ jsx3(IconButton, { label: name, size: "xs", onClick: onRemove, className: "rounded-full", children: /* @__PURE__ */ jsx3(XIcon, { size: 12 }) }) : null
    ] });
  }
  const suggestion = variant === "suggestion";
  return /* @__PURE__ */ jsxs3(
    "button",
    {
      ref,
      type,
      "aria-pressed": suggestion ? void 0 : !!pressed,
      className: chipClass({
        variant: suggestion ? "suggestion" : "toggle",
        pressed: !!pressed,
        size,
        className: cn("disabled:pointer-events-none disabled:opacity-50", className)
      }),
      ...rest,
      children: [
        icon ?? (suggestion ? /* @__PURE__ */ jsx3(PlusIcon, { size: size === "sm" ? 12 : 14 }) : null),
        children,
        trailing
      ]
    }
  );
});
function ChipGroup({ label, scroll = false, className, children, ...rest }) {
  return /* @__PURE__ */ jsx3(
    "div",
    {
      role: "group",
      "aria-label": label,
      className: cn(
        "flex flex-wrap items-center gap-2",
        scroll && "max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:py-1 scrollbar-none",
        className
      ),
      ...rest,
      children
    }
  );
}

// src/components/tabs.tsx
import { createContext, useContext, useId as useId3, useRef as useRef2, useSyncExternalStore } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var BREAKPOINT_QUERY = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)"
};
function useBreakpoint(bp) {
  const query = bp ? BREAKPOINT_QUERY[bp] : null;
  return useSyncExternalStore(
    (onChange) => {
      if (!query || typeof window === "undefined" || !window.matchMedia) return () => {
      };
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => query && typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false,
    () => false
  );
}
var TAB_TEXT = { xs: "text-2xs", sm: "text-xs", md: "text-sm" };
var UNDERLINE_H = { xs: "h-7", sm: "h-8", md: "h-10" };
var PILL_SIZE = { xs: "h-6 px-2", sm: "h-7 px-2.5", md: "h-8 px-3" };
function tabClass(o) {
  const { active, variant = "underline", size = "md", block = false, className } = o;
  return cn(
    "relative inline-flex shrink-0 flex-col items-start justify-center whitespace-nowrap font-medium transition-colors duration-150",
    "pointer-coarse:min-h-11 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:text-th-ghost",
    TAB_TEXT[size],
    variant === "underline" ? cn("border-b-2 px-0.5", UNDERLINE_H[size], active ? "border-th-accent text-th-hi" : "border-transparent text-th-hi3 hover:text-th-hi") : cn("rounded-lg", PILL_SIZE[size], active ? "bg-th-elevated text-th-hi" : "text-th-hi3 hover:bg-th-elevated/60 hover:text-th-hi"),
    block && "min-w-0 flex-1 items-center text-center",
    className
  );
}
var Ctx = createContext(null);
var tabId = (base, v) => `${base}-tab-${v}`;
var panelId = (base, v) => `${base}-panel-${v}`;
function Tabs({
  value,
  onChange,
  items: items2,
  label,
  variant = "underline",
  size = "md",
  block = false,
  hideFrom,
  idBase,
  controlsPanels,
  children,
  className
}) {
  const auto = useId3();
  const wide = useBreakpoint(hideFrom);
  const base = idBase ?? auto.replace(/:/g, "");
  const refs = useRef2([]);
  const enabled = items2.map((t, i) => t.disabled ? -1 : i).filter((i) => i >= 0);
  const selected = items2.findIndex((t) => t.value === value);
  const tabStop = selected >= 0 && !items2[selected].disabled ? selected : enabled[0] ?? -1;
  const linked = controlsPanels ?? children != null;
  const pick = (i) => {
    const t = items2[i];
    if (!t || t.disabled) return;
    onChange(t.value);
    refs.current[i]?.focus();
  };
  const move = (dir) => {
    if (!enabled.length) return;
    const from = refs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(from >= 0 ? from : selected);
    pick(pos < 0 ? enabled[0] : enabled[(pos + dir + enabled.length) % enabled.length]);
  };
  const list = /* @__PURE__ */ jsx4(
    "div",
    {
      role: "tablist",
      "aria-label": label,
      className: cn(
        "flex max-w-full items-end overflow-x-auto scrollbar-none",
        block && "w-full",
        variant === "underline" ? cn(block ? "gap-1" : "gap-5", "shadow-[inset_0_-1px_0_var(--nish-line)]") : "gap-1",
        className
      ),
      onKeyDown: (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          if (enabled.length) pick(enabled[0]);
        } else if (e.key === "End") {
          e.preventDefault();
          if (enabled.length) pick(enabled[enabled.length - 1]);
        }
      },
      children: items2.map((t, i) => {
        const on = t.value === value;
        return /* @__PURE__ */ jsxs4(
          "button",
          {
            ref: (el) => {
              refs.current[i] = el;
            },
            type: "button",
            role: "tab",
            id: tabId(base, t.value),
            "aria-selected": on,
            "aria-controls": linked ? panelId(base, t.value) : void 0,
            tabIndex: i === tabStop ? 0 : -1,
            disabled: t.disabled,
            onClick: () => pick(i),
            className: tabClass({ active: on, variant, size, block, className: t.sub != null ? "h-auto py-1.5" : void 0 }),
            children: [
              /* @__PURE__ */ jsxs4("span", { className: "inline-flex items-center gap-1.5", children: [
                t.label,
                t.count != null ? /* @__PURE__ */ jsx4(Badge, { tone: on ? "accent" : "neutral", size: "xs", className: "tabular-nums", children: t.count }) : null
              ] }),
              t.sub != null ? /* @__PURE__ */ jsx4("span", { className: "text-xs font-normal text-th-hi3", children: t.sub }) : null
            ]
          },
          t.value
        );
      })
    }
  );
  if (children == null) return wide ? null : list;
  return /* @__PURE__ */ jsxs4(Ctx.Provider, { value: { idBase: base, value }, children: [
    wide ? null : list,
    children
  ] });
}
function TabPanel({ value, idBase, active, showFrom, keepMounted = false, children, className, ...rest }) {
  const ctx = useContext(Ctx);
  const wide = useBreakpoint(showFrom);
  const base = idBase ?? ctx?.idBase ?? "";
  const shown = active ?? ctx?.value === value;
  if (wide) {
    return /* @__PURE__ */ jsx4("div", { className, ...rest, children });
  }
  return /* @__PURE__ */ jsx4(
    "div",
    {
      role: "tabpanel",
      id: panelId(base, value),
      "aria-labelledby": tabId(base, value),
      tabIndex: 0,
      hidden: !shown,
      className: cn("focus-visible:outline-offset-4", className),
      ...rest,
      children: shown || keepMounted ? children : null
    }
  );
}

// src/components/feedback.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function Skeleton({
  className,
  style
}) {
  return /* @__PURE__ */ jsx5("div", { "aria-hidden": "true", className: cn("nish-skeleton rounded-md", className), style });
}
function SkeletonRows({ rows = 5, height = 56, gap = "md", label = "Loading", className, rowClassName }) {
  return /* @__PURE__ */ jsx5("div", { role: "status", "aria-label": label, className: cn("grid", gap === "sm" ? "gap-1.5" : "gap-2.5", className), children: Array.from({ length: rows }, (_, i) => /* @__PURE__ */ jsx5(Skeleton, { className: cn("w-full rounded-xl", rowClassName), style: rowClassName && /\bh-/.test(rowClassName) ? void 0 : { height } }, i)) });
}
var SPINNER_SIZE = { xs: 12, sm: 14, md: 16, lg: 24 };
function Spinner({ size = "md", label, className }) {
  if (!label) return /* @__PURE__ */ jsx5(LoaderIcon, { size: SPINNER_SIZE[size], className: cn("shrink-0 animate-spin", className) });
  return /* @__PURE__ */ jsx5("span", { role: "status", className: cn("inline-flex shrink-0 items-center", className), children: /* @__PURE__ */ jsx5(LoaderIcon, { size: SPINNER_SIZE[size], className: "animate-spin", role: "img", "aria-hidden": false, "aria-label": label }) });
}
function SkeletonLines({
  lines = 3,
  className
}) {
  return /* @__PURE__ */ jsxs5("div", { className: cn("flex flex-col gap-2.5 p-3", className), "aria-busy": "true", "aria-label": "Loading", children: [
    /* @__PURE__ */ jsx5(Skeleton, { className: "h-4 w-2/5" }),
    Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx5(Skeleton, { className: cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5") }, i))
  ] });
}
function EmptyState({ icon, title, detail, action, compact = false, className }) {
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-1.5 p-4" : "gap-2 rounded-xl border border-dashed border-th-line px-6 py-12",
        className
      ),
      children: [
        icon ? /* @__PURE__ */ jsx5("span", { className: "text-th-ghost [&>svg]:size-7", children: icon }) : null,
        /* @__PURE__ */ jsx5("p", { className: cn("font-medium text-th-hi2", compact ? "text-xs" : "text-sm"), children: title }),
        detail ? /* @__PURE__ */ jsx5("p", { className: "max-w-sm text-xs text-th-hi3", children: detail }) : null,
        action ? /* @__PURE__ */ jsx5("div", { className: "mt-2", children: action }) : null
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
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-2 p-4" : "gap-2 rounded-xl border border-th-loss/30 bg-th-loss-soft px-6 py-10",
        className
      ),
      children: [
        /* @__PURE__ */ jsx5(AlertTriangleIcon, { size: compact ? 16 : 22, className: "shrink-0 text-th-loss" }),
        /* @__PURE__ */ jsx5("p", { className: cn("max-w-md text-th-hi2", compact ? "text-xs" : "text-sm"), children: message }),
        onRetry ? /* @__PURE__ */ jsxs5(
          "button",
          {
            type: "button",
            onClick: onRetry,
            disabled: retrying,
            className: "mt-1 inline-flex items-center gap-1.5 rounded-full border border-th-line-strong px-3 py-1 text-xs text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi disabled:opacity-50 pointer-coarse:min-h-11",
            children: [
              retrying ? /* @__PURE__ */ jsx5(LoaderIcon, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsx5(RotateIcon, { size: 12 }),
              "Retry"
            ]
          }
        ) : null
      ]
    }
  );
}

// src/components/toast.tsx
import { useSyncExternalStore as useSyncExternalStore2 } from "react";
import { createPortal } from "react-dom";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var items = [];
var nextId = 1;
var subs = /* @__PURE__ */ new Set();
var emit = () => subs.forEach((fn) => fn());
var AUTO_DISMISS_MS = 4e3;
var MAX_VISIBLE = 4;
var timers = /* @__PURE__ */ new Map();
function startTimer(id, ms) {
  const t = { handle: null, remaining: ms, started: Date.now(), paused: 0 };
  t.handle = setTimeout(() => dismissToast(id), ms);
  timers.set(id, t);
}
function clearTimer(id) {
  const t = timers.get(id);
  if (t?.handle != null) clearTimeout(t.handle);
  timers.delete(id);
}
function pauseTimer(id) {
  const t = timers.get(id);
  if (!t) return;
  t.paused += 1;
  if (t.paused > 1 || t.handle == null) return;
  clearTimeout(t.handle);
  t.handle = null;
  t.remaining = Math.max(0, t.remaining - (Date.now() - t.started));
}
function resumeTimer(id) {
  const t = timers.get(id);
  if (!t || t.paused === 0) return;
  t.paused -= 1;
  if (t.paused > 0) return;
  t.started = Date.now();
  t.handle = setTimeout(() => dismissToast(id), Math.max(t.remaining, 1e3));
}
function dismissToast(id) {
  clearTimer(id);
  const next = items.filter((t) => t.id !== id);
  if (next.length === items.length) return;
  items = next;
  emit();
}
function push(tone, title, bodyOrOptions) {
  const o = typeof bodyOrOptions === "string" ? { body: bodyOrOptions } : bodyOrOptions ?? {};
  const id = nextId++;
  const duration = o.duration ?? (tone === "error" ? "sticky" : AUTO_DISMISS_MS);
  const item = { id, tone, title, body: o.body, action: o.action, slot: o.id, duration };
  const old = o.id ? items.find((t) => t.slot === o.id) : void 0;
  if (old) {
    clearTimer(old.id);
    items = items.map((t) => t === old ? item : t);
  } else {
    const kept = items.slice(-(MAX_VISIBLE - 1));
    items.filter((t) => !kept.includes(t)).forEach((t) => clearTimer(t.id));
    items = [...kept, item];
  }
  emit();
  if (duration !== "sticky") startTimer(id, duration);
  return id;
}
var toast = Object.assign((title, o) => push("info", title, o), {
  success: (title, o) => push("success", title, o),
  error: (title, o) => push("error", title, o),
  warn: (title, o) => push("warn", title, o),
  info: (title, o) => push("info", title, o)
});
function useToast() {
  return toast;
}
function useToasts() {
  return useSyncExternalStore2(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => items,
    () => items
  );
}
var TONE = {
  success: { icon: /* @__PURE__ */ jsx6(CheckCircleIcon, { size: 15, className: "text-th-ok" }), className: "border-th-ok/35" },
  error: { icon: /* @__PURE__ */ jsx6(AlertTriangleIcon, { size: 15, className: "text-th-loss" }), className: "border-th-loss/40" },
  warn: { icon: /* @__PURE__ */ jsx6(AlertTriangleIcon, { size: 15, className: "text-th-warn" }), className: "border-th-warn/40" },
  info: { icon: /* @__PURE__ */ jsx6(InfoIcon, { size: 15, className: "text-th-accent" }), className: "border-th-line-strong" }
};
var DESKTOP_BOTTOM = {
  sm: "sm:bottom-5 sm:pb-0",
  md: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,1.25rem)] md:bottom-5 md:pb-0",
  lg: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,1.25rem)] lg:bottom-5 lg:pb-0"
};
function Toaster({ className, offset, offsetUntil = "sm" }) {
  const list = useToasts();
  if (typeof document === "undefined") return null;
  const style = offset ? { "--nish-toast-offset": offset } : void 0;
  return createPortal(
    /* @__PURE__ */ jsx6(
      "div",
      {
        "aria-live": "polite",
        style,
        className: cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3",
          "pb-[var(--nish-toast-offset,max(12px,env(safe-area-inset-bottom)))]",
          "sm:inset-x-auto sm:right-5 sm:w-96 sm:items-stretch sm:px-0",
          DESKTOP_BOTTOM[offsetUntil],
          className
        ),
        children: list.map((t) => /* @__PURE__ */ jsx6(ToastCard, { t }, t.id))
      }
    ),
    document.body
  );
}
function ToastCard({ t }) {
  const leave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) resumeTimer(t.id);
  };
  const enter = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) pauseTimer(t.id);
  };
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      role: t.tone === "error" ? "alert" : "status",
      onPointerEnter: (e) => e.pointerType === "mouse" && pauseTimer(t.id),
      onPointerLeave: (e) => e.pointerType === "mouse" && resumeTimer(t.id),
      onFocus: enter,
      onBlur: leave,
      className: cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop",
        "animate-[nish-rise-in_160ms_var(--nish-ease-out)]",
        TONE[t.tone].className
      ),
      children: [
        /* @__PURE__ */ jsx6("span", { className: "mt-0.5 shrink-0", children: TONE[t.tone].icon }),
        /* @__PURE__ */ jsxs6("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium leading-snug text-th-hi", children: t.title }),
          t.body ? /* @__PURE__ */ jsx6("p", { className: "mt-0.5 break-words text-xs leading-snug text-th-hi2", children: t.body }) : null
        ] }),
        t.action ? /* @__PURE__ */ jsx6(
          "button",
          {
            type: "button",
            onClick: () => {
              t.action?.onClick();
              dismissToast(t.id);
            },
            className: "-my-1 inline-flex shrink-0 items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-th-accent transition-colors hover:bg-th-accent-soft pointer-coarse:-my-2.5 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
            children: t.action.label
          }
        ) : null,
        /* @__PURE__ */ jsx6(
          "button",
          {
            type: "button",
            onClick: () => dismissToast(t.id),
            "aria-label": "Dismiss",
            className: "-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:-my-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
            children: /* @__PURE__ */ jsx6(XIcon, { size: 14 })
          }
        )
      ]
    }
  );
}

// src/components/overlay.tsx
import {
  cloneElement as cloneElement2,
  createContext as createContext2,
  useCallback as useCallback2,
  useContext as useContext2,
  useEffect as useEffect2,
  useId as useId4,
  useLayoutEffect as useLayoutEffect2,
  useRef as useRef3,
  useState
} from "react";
import { createPortal as createPortal2 } from "react-dom";
import { Fragment, jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var layerStack = [];
var isTop = (self) => layerStack[layerStack.length - 1] === self;
var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
function focusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
}
var lockCount = 0;
var savedOverflow = null;
function lockScroll() {
  if (lockCount++ === 0) {
    const html = document.documentElement;
    savedOverflow = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lockCount === 0 && savedOverflow) {
      document.documentElement.style.overflow = savedOverflow.html;
      document.body.style.overflow = savedOverflow.body;
      savedOverflow = null;
    }
  };
}
function layerHost(anchor) {
  return anchor?.closest("[data-nish-layer]") ?? document.body;
}
function useDialog(panelRef, onClose) {
  const onCloseRef = useRef3(onClose);
  onCloseRef.current = onClose;
  useEffect2(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const self = {};
    layerStack.push(self);
    const focusTimer = window.setTimeout(() => {
      if (panel && !panel.contains(document.activeElement)) {
        (panel.querySelector("[data-autofocus],[autofocus]") ?? panel).focus();
      }
    }, 0);
    const unlock = lockScroll();
    function onKey(e) {
      if (!isTop(self)) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const nodes = focusables(panel);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      layerStack.splice(layerStack.indexOf(self), 1);
      document.removeEventListener("keydown", onKey);
      unlock();
      opener?.focus?.();
    };
  }, [panelRef]);
}
var CLOSE_BUTTON = "-mr-1.5 inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11 pointer-coarse:min-w-11";
var SIZE = {
  md: "sm:max-w-md",
  lg: "sm:max-w-xl",
  xl: "sm:max-w-3xl",
  "2xl": "sm:max-w-6xl",
  full: "sm:max-w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]"
};
function Modal({
  title,
  onClose,
  children,
  size = "md",
  footer,
  subtitle,
  placement = "center",
  header,
  hideClose = false,
  "aria-label": ariaLabel,
  className
}) {
  const titleId = useId4();
  const panelRef = useRef3(null);
  useDialog(panelRef, onClose);
  const showTitle = header === void 0 && title !== void 0 && title !== null;
  return createPortal2(
    /* @__PURE__ */ jsx7(
      "div",
      {
        "data-nish-layer": "",
        className: cn(
          "fixed inset-0 z-50 flex items-end justify-center bg-th-scrim/60 animate-[nish-fade-in_160ms_ease-out] sm:p-4",
          placement === "top" ? "sm:items-start sm:pt-[12vh]" : "sm:items-center"
        ),
        onMouseDown: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        children: /* @__PURE__ */ jsxs7(
          "div",
          {
            ref: panelRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": showTitle && !ariaLabel ? titleId : void 0,
            "aria-label": ariaLabel,
            tabIndex: -1,
            className: cn(
              "flex max-h-[92dvh] w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none",
              "rounded-t-2xl animate-[nish-sheet-in_240ms_var(--nish-ease-out)] pb-[env(safe-area-inset-bottom)]",
              "sm:max-h-[85vh] sm:rounded-2xl sm:pb-0 sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]",
              placement === "top" && "sm:max-h-[76vh]",
              SIZE[size],
              className
            ),
            children: [
              /* @__PURE__ */ jsx7("div", { className: "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-th-line-strong sm:hidden", "aria-hidden": "true" }),
              header !== void 0 ? /* @__PURE__ */ jsx7("div", { className: "shrink-0", children: header }) : /* @__PURE__ */ jsxs7("div", { className: "flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4", children: [
                /* @__PURE__ */ jsx7("h2", { id: titleId, className: "min-w-0 line-clamp-2 break-words pt-1 text-base font-semibold leading-snug text-th-hi", children: title }),
                hideClose ? null : /* @__PURE__ */ jsx7("button", { type: "button", onClick: onClose, "aria-label": "Close", className: CLOSE_BUTTON, children: /* @__PURE__ */ jsx7(XIcon, { size: 16 }) })
              ] }),
              subtitle ? /* @__PURE__ */ jsx7("div", { className: "shrink-0 border-b border-th-line px-5 pb-3 text-sm text-th-hi2", children: subtitle }) : null,
              /* @__PURE__ */ jsx7(
                "div",
                {
                  className: cn(
                    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2",
                    header !== void 0 && "pt-3"
                  ),
                  children
                }
              ),
              footer ? /* @__PURE__ */ jsx7("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
            ]
          }
        )
      }
    ),
    document.body
  );
}
var DRAWER_WIDTH = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-2xl" };
var SHEET_HEIGHT = { sm: "max-h-[50dvh]", md: "max-h-[70dvh]", lg: "max-h-[92dvh]" };
function Drawer({
  title,
  subtitle,
  onClose,
  side = "right",
  size = "md",
  actions,
  footer,
  bottomOffset,
  "aria-label": ariaLabel,
  children,
  className
}) {
  const titleId = useId4();
  const panelRef = useRef3(null);
  useDialog(panelRef, onClose);
  const bottom = side === "bottom";
  return createPortal2(
    /* @__PURE__ */ jsx7(
      "div",
      {
        "data-nish-layer": "",
        className: "fixed inset-0 z-50 bg-th-scrim/50 animate-[nish-fade-in_160ms_ease-out]",
        style: bottom && bottomOffset ? { bottom: bottomOffset } : void 0,
        onMouseDown: (e) => {
          if (e.target === e.currentTarget) onClose();
        },
        children: /* @__PURE__ */ jsxs7(
          "div",
          {
            ref: panelRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": ariaLabel ? void 0 : titleId,
            "aria-label": ariaLabel,
            tabIndex: -1,
            className: cn(
              "absolute flex flex-col border-th-line bg-th-surface shadow-modal outline-none",
              bottom ? cn(
                "inset-x-0 bottom-0 rounded-t-2xl border-t animate-[nish-sheet-in_240ms_var(--nish-ease-out)]",
                bottomOffset ? "" : "pb-[env(safe-area-inset-bottom)]",
                SHEET_HEIGHT[size]
              ) : cn(
                "inset-y-0 w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                DRAWER_WIDTH[size],
                side === "right" ? "right-0 border-l pr-[env(safe-area-inset-right)] animate-[nish-slide-in-right_240ms_var(--nish-ease-out)]" : "left-0 border-r pl-[env(safe-area-inset-left)] animate-[nish-slide-in-left_240ms_var(--nish-ease-out)]"
              ),
              className
            ),
            children: [
              bottom ? /* @__PURE__ */ jsx7("div", { className: "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-th-line-strong", "aria-hidden": "true" }) : null,
              /* @__PURE__ */ jsxs7("div", { className: "flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3", children: [
                /* @__PURE__ */ jsxs7("div", { className: "min-w-0 pt-1", children: [
                  /* @__PURE__ */ jsx7("h2", { id: titleId, className: "line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi", children: title }),
                  subtitle ? /* @__PURE__ */ jsx7("div", { className: "mt-0.5 text-xs text-th-hi3", children: subtitle }) : null
                ] }),
                /* @__PURE__ */ jsxs7("div", { className: "-mr-1.5 flex shrink-0 items-center gap-1", children: [
                  actions,
                  /* @__PURE__ */ jsx7(IconButton, { label: "Close", onClick: onClose, children: /* @__PURE__ */ jsx7(XIcon, { size: 16 }) })
                ] })
              ] }),
              /* @__PURE__ */ jsx7("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2", children }),
              footer ? /* @__PURE__ */ jsx7("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
            ]
          }
        )
      }
    ),
    document.body
  );
}
function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  pending = false,
  onConfirm,
  onCancel
}) {
  const pendingRef = useRef3(pending);
  pendingRef.current = pending;
  const cancel = useCallback2(() => {
    if (!pendingRef.current) onCancel();
  }, [onCancel]);
  const danger = tone === "danger";
  return /* @__PURE__ */ jsx7(
    Modal,
    {
      title,
      onClose: cancel,
      size: "md",
      footer: /* @__PURE__ */ jsxs7(Fragment, { children: [
        /* @__PURE__ */ jsx7(Button, { onClick: cancel, disabled: pending, "data-autofocus": danger ? "" : void 0, children: cancelLabel }),
        /* @__PURE__ */ jsx7(
          Button,
          {
            variant: danger ? "danger" : "primary",
            loading: pending,
            onClick: onConfirm,
            "data-autofocus": danger ? void 0 : "",
            children: confirmLabel
          }
        )
      ] }),
      children: body ?? null
    }
  );
}
var GAP = 8;
var EDGE = 8;
var OPPOSITE = { top: "bottom", bottom: "top", left: "right", right: "left" };
function viewport() {
  return {
    vw: window.innerWidth || document.documentElement.clientWidth || 0,
    vh: window.innerHeight || document.documentElement.clientHeight || 0
  };
}
function clamp(v, size, limit) {
  return Math.max(EDGE, Math.min(v, limit - size - EDGE));
}
function place(r, w, h, side, align, gap) {
  const { vw, vh } = viewport();
  const room = { top: r.top, bottom: vh - r.bottom, left: r.left, right: vw - r.right };
  const need = side === "top" || side === "bottom" ? h + gap + EDGE : w + gap + EDGE;
  const chosen = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;
  if (chosen === "top" || chosen === "bottom") {
    const top2 = chosen === "top" ? r.top - gap - h : r.bottom + gap;
    const left2 = align === "start" ? r.left : align === "end" ? r.right - w : r.left + r.width / 2 - w / 2;
    return { side: chosen, top: clamp(top2, h, vh), left: clamp(left2, w, vw) };
  }
  const left = chosen === "left" ? r.left - gap - w : r.right + gap;
  const top = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return { side: chosen, top: clamp(top, h, vh), left: clamp(left, w, vw) };
}
function useAnchoredPosition(anchor, floating, open, side, align, gap = GAP) {
  const [pos, setPos] = useState(null);
  useLayoutEffect2(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = floating.current;
      if (!a || !f) return;
      const next = place(a.getBoundingClientRect(), f.offsetWidth, f.offsetHeight, side, align, gap);
      setPos(
        (prev) => prev && prev.top === next.top && prev.left === next.left && prev.side === next.side ? prev : next
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (floating.current) ro?.observe(floating.current);
    if (anchor.current) ro?.observe(anchor.current);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [anchor, floating, open, side, align, gap]);
  return open ? pos : null;
}
function floatingStyle(pos, extra2) {
  return {
    position: "fixed",
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    visibility: pos ? void 0 : "hidden",
    ...extra2
  };
}
var TIP_MAX_WIDTH = 320;
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
function Tooltip({ tip, children, className, side = "top", as = "span", focusable = true, variant = "default" }) {
  const triggerRef = useRef3(null);
  const [open, setOpen] = useState(false);
  const id = useId4();
  useEffect2(() => {
    const el = triggerRef.current;
    if (!el) return;
    const touch = touchTracker();
    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    const onMouseEnter = () => {
      if (!touch.recent()) show();
    };
    const onFocusIn = (e) => {
      if (e.target === el || e.target instanceof Element && keyboardFocused(e.target)) show();
    };
    const onPointerDown = (e) => {
      if (e.target !== el) hide();
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    el.addEventListener("pointerenter", touch.onPointer);
    el.addEventListener("pointerdown", touch.onPointer);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", hide);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerenter", touch.onPointer);
      el.removeEventListener("pointerdown", touch.onPointer);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", hide);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", hide);
      el.removeEventListener("keydown", onKey);
    };
  }, []);
  const a11y = { tabIndex: focusable ? 0 : void 0, "aria-describedby": open ? id : void 0 };
  const hint = variant === "hint" && "cursor-help underline decoration-th-hi3 decoration-dotted underline-offset-2";
  return /* @__PURE__ */ jsxs7(Fragment, { children: [
    as === "tr" ? /* @__PURE__ */ jsx7("tr", { ref: triggerRef, className: cn(hint, className), ...a11y, children }) : /* @__PURE__ */ jsx7(
      "span",
      {
        ref: triggerRef,
        className: cn(hint ? "inline" : "inline-flex items-center", hint, className),
        ...a11y,
        children
      }
    ),
    open ? /* @__PURE__ */ jsx7(FloatingTip, { anchor: triggerRef, id, tip, side }) : null
  ] });
}
function FloatingTip({
  anchor,
  id,
  tip,
  side = "top"
}) {
  const tipRef = useRef3(null);
  const pos = useAnchoredPosition(anchor, tipRef, true, side, "center");
  return createPortal2(
    /* @__PURE__ */ jsx7(
      "span",
      {
        ref: tipRef,
        id,
        role: "tooltip",
        "data-side": pos?.side,
        style: floatingStyle(pos, {
          maxWidth: Math.min(TIP_MAX_WIDTH, (window.innerWidth || TIP_MAX_WIDTH) - 2 * EDGE),
          zIndex: "var(--nish-z-tooltip, 100)"
        }),
        className: "pointer-events-none block w-max rounded-lg border border-th-line-strong bg-th-elevated px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-th-hi shadow-pop",
        children: tip
      }
    ),
    document.body
  );
}
function useDismiss(open, panel, anchor, close) {
  const closeRef = useRef3(close);
  closeRef.current = close;
  useEffect2(() => {
    if (!open) return;
    const self = {};
    layerStack.push(self);
    const onKey = (e) => {
      if (e.key === "Escape" && isTop(self)) {
        e.stopPropagation();
        closeRef.current("escape");
      }
    };
    const onDown = (e) => {
      const t = e.target;
      if (!t || panel.current?.contains(t) || anchor.current?.contains(t)) return;
      if (!isTop(self)) return;
      closeRef.current("outside");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      layerStack.splice(layerStack.indexOf(self), 1);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, panel, anchor]);
}
function useReturnFocus(open, panel, anchor) {
  const wasOpen = useRef3(false);
  const focusWasInside = useRef3(false);
  useEffect2(() => {
    if (!open) return;
    const p = panel.current;
    const track = () => {
      focusWasInside.current = !!p && p.contains(document.activeElement);
    };
    p?.addEventListener("focusin", track);
    p?.addEventListener("focusout", track);
    return () => {
      p?.removeEventListener("focusin", track);
      p?.removeEventListener("focusout", track);
    };
  }, [open, panel]);
  useLayoutEffect2(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const active = document.activeElement;
    if (focusWasInside.current || !active || active === document.body) anchor.current?.focus();
    focusWasInside.current = false;
  }, [open, anchor]);
}
function Popover({
  open,
  onOpenChange,
  dismissOnOutside = true,
  anchor,
  side = "bottom",
  align = "start",
  width,
  "aria-label": ariaLabel,
  className,
  children
}) {
  const panelRef = useRef3(null);
  const pos = useAnchoredPosition(anchor, panelRef, open, side, align);
  const onOpenChangeRef = useRef3(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const outsideRef = useRef3(dismissOnOutside);
  outsideRef.current = dismissOnOutside;
  useDismiss(open, panelRef, anchor, (reason) => {
    if (reason === "outside" && !outsideRef.current) return;
    onOpenChangeRef.current(false, reason);
  });
  useReturnFocus(open, panelRef, anchor);
  useEffect2(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const p = panelRef.current;
      if (p && !p.contains(document.activeElement)) (p.querySelector("[data-autofocus],[autofocus]") ?? p).focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);
  if (!open) return null;
  function onKeyDown(e) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = focusables(panelRef.current);
    const active = document.activeElement;
    const atStart = nodes.length === 0 || active === nodes[0] || active === panelRef.current;
    const atEnd = nodes.length === 0 || active === nodes[nodes.length - 1];
    if (e.shiftKey && atStart || !e.shiftKey && atEnd) {
      e.preventDefault();
      onOpenChangeRef.current(false, "tab");
    }
  }
  return createPortal2(
    /* @__PURE__ */ jsx7(
      "div",
      {
        ref: panelRef,
        role: "dialog",
        "aria-label": ariaLabel,
        tabIndex: -1,
        "data-side": pos?.side,
        onKeyDown,
        style: floatingStyle(pos, { width, zIndex: "var(--nish-z-dropdown, 40)" }),
        className: cn(
          "max-w-[calc(100vw-1rem)] rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none",
          "animate-[nish-fade-in_120ms_ease-out]",
          className
        ),
        children
      }
    ),
    layerHost(anchor.current)
  );
}
var MenuContext = createContext2(null);
var ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
function menuItems(menu) {
  return menu ? Array.from(menu.querySelectorAll(ITEM_SELECTOR)) : [];
}
function setRef2(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}
function DropdownMenu({
  trigger,
  align = "start",
  side = "bottom",
  children,
  open: openProp,
  onOpenChange,
  defaultOpen = false,
  "aria-label": ariaLabel,
  className
}) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const triggerRef = useRef3(null);
  const menuRef = useRef3(null);
  const menuId = useId4();
  const triggerId = useId4();
  const initial = useRef3("first");
  const pos = useAnchoredPosition(triggerRef, menuRef, open, side, align, 4);
  const onOpenChangeRef = useRef3(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const setOpen = useCallback2(
    (next, reason) => {
      if (openProp === void 0) setOpenState(next);
      onOpenChangeRef.current?.(next, reason);
    },
    [openProp]
  );
  const close = useCallback2(() => setOpen(false), [setOpen]);
  const dismiss = useCallback2((reason) => setOpen(false, reason), [setOpen]);
  useDismiss(open, menuRef, triggerRef, dismiss);
  useReturnFocus(open, menuRef, triggerRef);
  useEffect2(() => {
    if (!open) return;
    const menu = menuRef.current;
    if (!menu) return;
    const focusInitial = () => {
      const items2 = menuItems(menu);
      const target = initial.current === "last" ? items2[items2.length - 1] : initial.current === "menu" ? menu : items2[0];
      (target ?? menu).focus();
    };
    const t = window.setTimeout(focusInitial, 0);
    const mo = new MutationObserver(() => {
      if (!menu.contains(document.activeElement) && (document.activeElement === document.body || !document.activeElement)) {
        initial.current = "first";
        focusInitial();
      }
    });
    mo.observe(menu, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
    };
  }, [open]);
  function openWith(where) {
    initial.current = where;
    setOpen(true);
  }
  function onMenuKeyDown(e) {
    const items2 = menuItems(menuRef.current);
    const i = items2.indexOf(document.activeElement);
    const go = (n) => {
      e.preventDefault();
      items2[(n + items2.length) % items2.length]?.focus();
    };
    switch (e.key) {
      case "ArrowDown":
        return go(i + 1);
      case "ArrowUp":
        return go(i < 0 ? items2.length - 1 : i - 1);
      case "Home":
        return go(0);
      case "End":
        return go(items2.length - 1);
      case "Tab":
        e.preventDefault();
        dismiss("tab");
        return;
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          const order = [...items2.slice(i + 1), ...items2.slice(0, i + 1)];
          const hit = order.find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(k));
          if (hit) {
            e.preventDefault();
            hit.focus();
          }
        }
    }
  }
  const tp = trigger.props;
  const triggerEl = cloneElement2(trigger, {
    ref: (node) => {
      triggerRef.current = node;
      setRef2(tp.ref, node);
    },
    id: tp.id ?? triggerId,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? menuId : void 0,
    onClick: (e) => {
      tp.onClick?.(e);
      if (e.defaultPrevented) return;
      if (open) close();
      else openWith(e.detail === 0 ? "first" : "menu");
    },
    onKeyDown: (e) => {
      tp.onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        openWith(e.key === "ArrowDown" ? "first" : "last");
      }
    }
  });
  return /* @__PURE__ */ jsxs7(Fragment, { children: [
    triggerEl,
    open ? createPortal2(
      /* @__PURE__ */ jsx7(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx7(
        "div",
        {
          ref: menuRef,
          id: menuId,
          role: "menu",
          "aria-label": ariaLabel,
          "aria-labelledby": ariaLabel ? void 0 : tp.id ?? triggerId,
          "aria-orientation": "vertical",
          tabIndex: -1,
          "data-side": pos?.side,
          onKeyDown: onMenuKeyDown,
          style: floatingStyle(pos, { zIndex: "var(--nish-z-dropdown, 40)" }),
          className: cn(
            "max-h-[min(24rem,calc(100dvh-1rem))] min-w-44 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain",
            "rounded-lg border border-th-line bg-th-elevated py-1 shadow-pop outline-none animate-[nish-fade-in_120ms_ease-out]",
            className
          ),
          children
        }
      ) }),
      layerHost(triggerRef.current)
    ) : null
  ] });
}
var ROW = "flex w-full select-none items-center gap-2 px-3 py-1.5 text-left text-xs outline-none transition-colors pointer-coarse:min-h-11";
function menuItemClass({ active = false, danger = false, disabled = false, className } = {}) {
  return cn(
    ROW,
    disabled ? "cursor-default text-th-ghost" : danger ? "text-th-loss hover:bg-th-loss-soft focus-visible:bg-th-loss-soft" : "text-th-hi2 hover:bg-th-overlay hover:text-th-hi focus-visible:bg-th-overlay focus-visible:text-th-hi",
    active && !disabled && !danger && "bg-th-overlay font-medium text-th-hi",
    className
  );
}
function MenuItem({ icon, trailing, danger = false, active = false, disabled = false, onSelect, className, children }) {
  const ctx = useContext2(MenuContext);
  function select() {
    if (disabled) return;
    const ev = new Event("nish-menu-select", { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return /* @__PURE__ */ jsxs7(
    "button",
    {
      type: "button",
      role: "menuitem",
      tabIndex: -1,
      "aria-disabled": disabled || void 0,
      "aria-current": active || void 0,
      onClick: select,
      onMouseMove: (e) => {
        if (!disabled && document.activeElement !== e.currentTarget) e.currentTarget.focus();
      },
      className: menuItemClass({
        active,
        danger,
        disabled,
        className: cn(!disabled && (danger ? "focus:bg-th-loss-soft" : "focus:bg-th-overlay focus:text-th-hi"), className)
      }),
      children: [
        icon ? /* @__PURE__ */ jsx7("span", { className: cn("inline-flex shrink-0", danger || disabled ? "" : "text-th-hi3"), children: icon }) : null,
        /* @__PURE__ */ jsx7("span", { className: "min-w-0 flex-1 truncate", children }),
        trailing ? /* @__PURE__ */ jsx7("span", { className: cn("ml-auto inline-flex shrink-0 items-center", disabled ? "" : "text-th-hi2"), children: trailing }) : null
      ]
    }
  );
}
function MenuLabel({ children, className }) {
  return /* @__PURE__ */ jsx7("div", { role: "presentation", className: cn("px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2", className), children });
}
function MenuSeparator({ className }) {
  return /* @__PURE__ */ jsx7("div", { role: "separator", className: cn("my-1 h-px bg-th-line", className) });
}
function MenuSubHeader({ onBack, children, className }) {
  return /* @__PURE__ */ jsxs7(
    "button",
    {
      type: "button",
      role: "menuitem",
      tabIndex: -1,
      onClick: onBack,
      onKeyDown: (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          onBack();
        }
      },
      className: cn(
        ROW,
        "mb-1 border-b border-th-line pb-2 font-semibold text-th-hi hover:bg-th-overlay focus:bg-th-overlay",
        className
      ),
      children: [
        /* @__PURE__ */ jsx7("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className: "shrink-0 text-th-hi3", children: /* @__PURE__ */ jsx7("path", { d: "m15 18-6-6 6-6" }) }),
        /* @__PURE__ */ jsx7("span", { className: "sr-only", children: "Back: " }),
        /* @__PURE__ */ jsx7("span", { className: "min-w-0 flex-1 truncate", children })
      ]
    }
  );
}

// src/components/display.tsx
import {
  createContext as createContext3,
  useContext as useContext3,
  useEffect as useEffect4,
  useRef as useRef5,
  useState as useState4
} from "react";

// src/components/theme-toggle.tsx
import { useEffect as useEffect3, useState as useState3 } from "react";

// src/components/segmented.tsx
import { useId as useId5, useRef as useRef4, useState as useState2 } from "react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var SELECTED = {
  accent: "bg-th-accent-soft text-th-accent ring-1 ring-th-accent/40",
  warn: "bg-th-warn-soft text-th-warn ring-1 ring-th-warn/40",
  loss: "bg-th-loss-soft text-th-loss ring-1 ring-th-loss/40"
};
var SIZE2 = {
  xs: "h-6 px-2 text-2xs",
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-sm"
};
function Segmented({ label, options, value, onChange, size = "sm", block = false, className }) {
  const refs = useRef4([]);
  const tipAnchor = useRef4(null);
  const [tipAt, setTipAt] = useState2(null);
  const tipId = useId5();
  const touch = useRef4(touchTracker()).current;
  const showTip = (i) => {
    if (options[i]?.tip == null) return;
    tipAnchor.current = refs.current[i];
    setTipAt(i);
  };
  const hideTip = (i) => setTipAt((cur) => cur === i ? null : cur);
  const enabled = options.map((o, i) => o.disabled ? -1 : i).filter((i) => i >= 0);
  const selected = options.findIndex((o) => o.value === value);
  const pick = (i) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    refs.current[i]?.focus();
  };
  const move = (from, dir) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(from);
    const next = pos < 0 ? enabled[dir === 1 ? 0 : enabled.length - 1] : enabled[(pos + dir + enabled.length) % enabled.length];
    pick(next);
  };
  const tabStop = selected >= 0 && !options[selected].disabled ? selected : enabled[0] ?? -1;
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      role: "radiogroup",
      "aria-label": label,
      className: cn("rounded-lg border border-th-line bg-th-elevated p-0.5", block ? "flex w-full" : "inline-flex", className),
      onKeyDown: (e) => {
        const from = refs.current.findIndex((el) => el === document.activeElement);
        const at = from >= 0 ? from : selected;
        if (e.key === "Escape" && tipAt != null) {
          setTipAt(null);
          return;
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(at, 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(at, -1);
        } else if (e.key === "Home") {
          e.preventDefault();
          if (enabled.length) pick(enabled[0]);
        } else if (e.key === "End") {
          e.preventDefault();
          if (enabled.length) pick(enabled[enabled.length - 1]);
        }
      },
      children: [
        options.map((o, i) => {
          const on = o.value === value;
          const tipShown = tipAt === i && o.tip != null;
          return /* @__PURE__ */ jsx8(
            "button",
            {
              ref: (el) => {
                refs.current[i] = el;
              },
              type: "button",
              role: "radio",
              "aria-checked": on,
              "aria-label": o.ariaLabel,
              "aria-describedby": tipShown ? tipId : void 0,
              title: o.tip != null ? void 0 : o.title,
              disabled: o.disabled,
              tabIndex: i === tabStop ? 0 : -1,
              onClick: () => pick(i),
              onPointerEnter: touch.onPointer,
              onPointerDown: (e) => {
                touch.onPointer(e);
                setTipAt(null);
              },
              onMouseEnter: o.tip != null ? () => !touch.recent() && showTip(i) : void 0,
              onMouseLeave: o.tip != null ? () => hideTip(i) : void 0,
              onFocus: o.tip != null ? (e) => keyboardFocused(e.currentTarget) && showTip(i) : void 0,
              onBlur: o.tip != null ? () => hideTip(i) : void 0,
              className: cn(
                "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium tabular-nums transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11",
                "disabled:cursor-not-allowed disabled:text-th-ghost",
                block && "min-w-0 flex-1",
                SIZE2[size],
                on ? SELECTED[o.tone ?? "accent"] : "text-th-hi2 hover:text-th-hi disabled:hover:text-th-ghost"
              ),
              children: o.label
            },
            o.value
          );
        }),
        tipAt != null && options[tipAt]?.tip != null ? /* @__PURE__ */ jsx8(FloatingTip, { anchor: tipAnchor, id: tipId, tip: options[tipAt].tip }, tipAt) : null
      ]
    }
  );
}

// src/components/theme-toggle.tsx
import { Fragment as Fragment2, jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function useTheme() {
  const [state, setState] = useState3(() => {
    const choice = typeof document === "undefined" ? "system" : getThemeChoice();
    return { choice, theme: typeof document === "undefined" ? "dark" : resolveTheme(choice) };
  });
  useEffect3(() => onThemeChange((choice, theme) => setState({ choice, theme })), []);
  return { ...state, scheme: schemeOf(state.theme), setChoice: setThemeChoice };
}
var MODES = [
  { id: "system", label: "System", Icon: MonitorIcon },
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon }
];
var nameOf = (choice) => MODES.find((m) => m.id === choice)?.label ?? PRESETS.find((p) => p.id === choice)?.label ?? String(choice);
function ThemeToggle({
  presets = false,
  labels = false,
  block = false,
  size = "sm",
  compact = false,
  variant = "segmented",
  phone = "compact",
  className
}) {
  const { choice, theme, scheme, setChoice } = useTheme();
  const extra2 = PRESETS.filter((p) => p.id !== "dark" && p.id !== "light");
  const isPreset = extra2.some((p) => p.id === choice);
  if (compact || variant === "pill") {
    const i = TOGGLE_ORDER.indexOf(choice);
    const next = TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
    const mode = MODES.find((m) => m.id === choice);
    const Icon = mode ? mode.Icon : scheme === "light" ? SunIcon : MoonIcon;
    const elsewhere = mode ? "" : " (set on another site)";
    const text = `Theme: ${nameOf(mode ? choice : theme)}${elsewhere}. Switch to ${nameOf(next)}`;
    if (variant === "pill") {
      return /* @__PURE__ */ jsxs9(
        "button",
        {
          type: "button",
          "aria-label": text,
          title: text,
          "data-choice": choice,
          onClick: () => setChoice(next),
          className: cn(
            "inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-th-line-strong transition-colors duration-150 hover:bg-th-elevated hover:text-th-hi",
            labels ? "gap-2 pl-3 pr-3.5 text-sm font-medium text-th-hi" : "w-11 text-th-hi3",
            className
          ),
          children: [
            /* @__PURE__ */ jsx9(Icon, { size: 16 }),
            labels ? /* @__PURE__ */ jsx9("span", { "aria-hidden": "true", children: nameOf(mode ? choice : theme) }) : null
          ]
        }
      );
    }
    return /* @__PURE__ */ jsx9(IconButton, { label: text, size: size === "md" ? "md" : "sm", "data-choice": choice, onClick: () => setChoice(next), className, children: /* @__PURE__ */ jsx9(Icon, { size: size === "md" ? 16 : 14 }) });
  }
  const options = MODES.map(({ id, label, Icon }) => ({
    value: id,
    label: labels ? /* @__PURE__ */ jsxs9(Fragment2, { children: [
      /* @__PURE__ */ jsx9(Icon, { size: 14 }),
      label
    ] }) : /* @__PURE__ */ jsx9(Icon, { size: 14 }),
    ariaLabel: labels ? void 0 : label,
    title: labels ? void 0 : label
  }));
  const twin = phone === "compact" && !block;
  const group = /* @__PURE__ */ jsxs9("div", { className: cn("items-center gap-2", block ? "flex w-full" : "inline-flex", className, twin && "max-sm:hidden"), children: [
    /* @__PURE__ */ jsx9(
      Segmented,
      {
        label: "Theme",
        options,
        value: choice,
        onChange: setChoice,
        size,
        block,
        className: cn(!labels && (size === "md" ? "[&>button]:w-8 [&>button]:px-0" : "[&>button]:w-7 [&>button]:px-0"), block && "min-w-0 flex-1")
      }
    ),
    presets ? /* @__PURE__ */ jsxs9(
      "select",
      {
        "aria-label": "Theme preset",
        value: isPreset ? choice : "",
        onChange: (e) => e.target.value && setChoice(e.target.value),
        className: cn(
          "rounded-lg border border-th-line bg-th-elevated px-2 text-xs text-th-hi2 pointer-coarse:min-h-11",
          size === "md" ? "h-9 text-sm" : "h-8"
        ),
        children: [
          /* @__PURE__ */ jsx9("option", { value: "", children: "Preset\u2026" }),
          extra2.map((p) => /* @__PURE__ */ jsx9("option", { value: p.id, children: p.label }, p.id))
        ]
      }
    ) : null
  ] });
  if (!twin) return group;
  return /* @__PURE__ */ jsxs9(Fragment2, { children: [
    /* @__PURE__ */ jsx9(ThemeToggle, { compact: true, size, className: cn(className, "sm:hidden") }),
    group
  ] });
}

// src/components/display.tsx
import { Fragment as Fragment3, jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function Svg3({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx10(
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
var CopyIcon = (p) => /* @__PURE__ */ jsxs10(Svg3, { ...p, children: [
  /* @__PURE__ */ jsx10("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2" }),
  /* @__PURE__ */ jsx10("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
] });
var CheckIcon2 = (p) => /* @__PURE__ */ jsx10(Svg3, { ...p, children: /* @__PURE__ */ jsx10("path", { d: "M20 6 9 17l-5-5" }) });
var ChevronRightIcon = (p) => /* @__PURE__ */ jsx10(Svg3, { ...p, children: /* @__PURE__ */ jsx10("path", { d: "m9 18 6-6-6-6" }) });
var FILL = {
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  accent: "bg-th-accent",
  neutral: "bg-th-ghost"
};
var CALLOUT_TONE = {
  neutral: { box: "border-th-line bg-th-elevated", icon: "text-th-hi3" },
  accent: { box: "border-th-accent/30 bg-th-accent-soft", icon: "text-th-accent" },
  info: { box: "border-th-info/30 bg-th-info-soft", icon: "text-th-info" },
  ok: { box: "border-th-ok/30 bg-th-ok-soft", icon: "text-th-ok" },
  warn: { box: "border-th-warn/30 bg-th-warn-soft", icon: "text-th-warn" },
  loss: { box: "border-th-loss/30 bg-th-loss-soft", icon: "text-th-loss" }
};
function defaultCalloutIcon(tone, size) {
  if (tone === "ok") return /* @__PURE__ */ jsx10(CheckCircleIcon, { size });
  if (tone === "warn" || tone === "loss") return /* @__PURE__ */ jsx10(AlertTriangleIcon, { size });
  return /* @__PURE__ */ jsx10(InfoIcon, { size });
}
function Callout({
  tone = "info",
  icon,
  title,
  children,
  action,
  onDismiss,
  variant = "box",
  compact = false,
  live = false,
  className,
  ...rest
}) {
  const t = CALLOUT_TONE[tone];
  const shown = icon === false ? null : icon ?? defaultCalloutIcon(tone, compact ? 14 : 16);
  return /* @__PURE__ */ jsxs10(
    "div",
    {
      role: live ? tone === "loss" ? "alert" : "status" : void 0,
      className: cn(
        "flex items-start border",
        compact ? "gap-2 px-3 py-2 text-xs" : "gap-3 px-4 py-3 text-sm",
        variant === "bar" ? "w-full rounded-none border-x-0" : "rounded-xl",
        t.box,
        className
      ),
      ...rest,
      children: [
        shown ? /* @__PURE__ */ jsx10("span", { className: cn("shrink-0", compact ? "mt-px" : "mt-0.5", t.icon), children: shown }) : null,
        /* @__PURE__ */ jsxs10("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: [
          /* @__PURE__ */ jsxs10("div", { className: "min-w-0 flex-1 basis-60", children: [
            title ? /* @__PURE__ */ jsx10("p", { className: "font-medium leading-snug text-th-hi", children: title }) : null,
            children ? /* @__PURE__ */ jsx10("div", { className: cn("leading-snug text-th-hi2", title ? "mt-0.5" : null), children }) : null
          ] }),
          action ? /* @__PURE__ */ jsx10("div", { className: "flex shrink-0 items-center gap-2", children: action }) : null
        ] }),
        onDismiss ? /* @__PURE__ */ jsx10(IconButton, { label: "Dismiss", size: "xs", onClick: onDismiss, className: "-my-0.5 -mr-1", children: /* @__PURE__ */ jsx10(XIcon, { size: 14 }) }) : null
      ]
    }
  );
}
var DOT_SIZE = { xs: "size-1.5", sm: "size-2", md: "size-2.5", lg: "size-3.5" };
var HALO = {
  ok: "ring-4 ring-th-ok-fill/25",
  warn: "ring-4 ring-th-warn-fill/25",
  loss: "ring-4 ring-th-loss-fill/25",
  info: "ring-4 ring-th-info-fill/25",
  accent: "ring-4 ring-th-accent/25",
  neutral: "ring-4 ring-th-ghost/25"
};
function StatusDot({ tone, size = "sm", pulse = false, halo = false, label, className }) {
  return /* @__PURE__ */ jsx10(
    "span",
    {
      role: label ? "img" : void 0,
      "aria-label": label,
      "aria-hidden": label ? void 0 : true,
      className: cn(
        "inline-block shrink-0 rounded-full",
        DOT_SIZE[size],
        FILL[tone],
        halo && HALO[tone],
        pulse && "motion-safe:animate-pulse",
        className
      )
    }
  );
}
function signTone(n) {
  if (n == null || Number.isNaN(n) || n === 0) return "neutral";
  return n > 0 ? "ok" : "loss";
}
var STAT_VALUE_SIZE = { sm: "text-base", md: "text-xl", lg: "text-2xl" };
var STAT_SKELETON = { sm: "h-6", md: "h-7", lg: "h-8" };
var STAT_TONE = { ok: "text-th-ok", loss: "text-th-loss", warn: "text-th-warn", neutral: "text-th-hi" };
var InStatGrid = createContext3(false);
function Stat({
  label,
  value,
  sub,
  tone = "neutral",
  tip,
  size = "md",
  variant = "card",
  loading = false,
  className
}) {
  const inGrid = useContext3(InStatGrid);
  const quiet = variant === "inset" ? "text-th-hi2" : "text-th-hi3";
  const body = /* @__PURE__ */ jsxs10(Fragment3, { children: [
    /* @__PURE__ */ jsx10("dt", { className: cn("text-xs", quiet), children: tip ? /* @__PURE__ */ jsx10(Tooltip, { tip, variant: "hint", children: label }) : label }),
    loading ? /* @__PURE__ */ jsxs10("dd", { className: "mt-1", "aria-busy": "true", children: [
      /* @__PURE__ */ jsx10(Skeleton, { className: cn("w-24", STAT_SKELETON[size]) }),
      sub ? /* @__PURE__ */ jsx10(Skeleton, { className: "mt-1.5 h-3 w-16" }) : null
    ] }) : /* @__PURE__ */ jsxs10(Fragment3, { children: [
      /* @__PURE__ */ jsx10(
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
      sub ? /* @__PURE__ */ jsx10("dd", { className: cn("mt-0.5 text-xs", quiet), children: sub }) : null
    ] })
  ] });
  const Box = inGrid ? "div" : "dl";
  if (variant === "card") {
    return /* @__PURE__ */ jsx10(Card, { padding: "sm", className: cn("min-w-0", className), children: inGrid ? body : /* @__PURE__ */ jsx10("dl", { children: body }) });
  }
  return /* @__PURE__ */ jsx10(Box, { className: cn("min-w-0", variant === "inset" && "rounded-lg bg-th-elevated p-3", className), children: body });
}
var GRID_BASE = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" };
var GRID_MD = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6"
};
function StatGrid({ cols, children, className }) {
  return /* @__PURE__ */ jsx10("dl", { className: cn("grid gap-3", GRID_BASE[cols?.base ?? 2], GRID_MD[cols?.md ?? 4], className), children: /* @__PURE__ */ jsx10(InStatGrid.Provider, { value: true, children }) });
}
function toneFor(value, t) {
  if (t.loss >= t.warn) return value >= t.loss ? "loss" : value >= t.warn ? "warn" : "ok";
  return value <= t.loss ? "loss" : value <= t.warn ? "warn" : "ok";
}
var METER_FILL = {
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  neutral: "bg-th-hi3",
  "chart-1": "bg-th-chart-1",
  "chart-2": "bg-th-chart-2",
  "chart-3": "bg-th-chart-3",
  "chart-4": "bg-th-chart-4",
  "chart-5": "bg-th-chart-5",
  "chart-6": "bg-th-chart-6",
  "chart-7": "bg-th-chart-7",
  "chart-8": "bg-th-chart-8"
};
var METER_THICK = { xs: "h-1", sm: "h-1.5", md: "h-2.5" };
var METER_THICK_V = { xs: "w-1", sm: "w-1.5", md: "w-2.5" };
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
  className
}) {
  const span = max - min || 1;
  const clamped = Math.min(Math.max(value, min), max);
  const pct = (clamped - min) / span * 100;
  const resolved = tone ?? (thresholds ? toneFor(clamped, thresholds) : "accent");
  const vertical = orientation === "vertical";
  const bar = /* @__PURE__ */ jsx10(
    "div",
    {
      role: kind === "progress" ? "progressbar" : "meter",
      "aria-label": label,
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": clamped,
      "aria-valuetext": `${Math.round(pct)}%`,
      className: cn(
        "relative shrink-0 overflow-hidden rounded-full",
        track === "overlay" ? "bg-th-overlay" : "bg-th-elevated",
        vertical ? cn("h-full", METER_THICK_V[size]) : cn("w-full", METER_THICK[size]),
        !showValue && className
      ),
      children: /* @__PURE__ */ jsx10(
        "div",
        {
          className: cn(
            "absolute rounded-full duration-300 ease-out motion-reduce:transition-none",
            vertical ? "inset-x-0 bottom-0 transition-[height]" : "inset-y-0 left-0 transition-[width]",
            METER_FILL[resolved]
          ),
          style: vertical ? { height: `${pct}%` } : { width: `${pct}%` }
        }
      )
    }
  );
  if (!showValue || vertical) return bar;
  return /* @__PURE__ */ jsxs10("div", { className: cn("flex w-full items-center gap-2", className), children: [
    bar,
    /* @__PURE__ */ jsxs10("span", { "aria-hidden": "true", className: "w-9 shrink-0 text-right text-xs tabular-nums text-th-hi3", children: [
      Math.round(pct),
      "%"
    ] })
  ] });
}
var SPARK_TONE = {
  accent: "text-th-accent",
  ok: "text-th-ok-fill",
  warn: "text-th-warn-fill",
  loss: "text-th-loss-fill",
  info: "text-th-info-fill",
  "chart-1": "text-th-chart-1",
  "chart-2": "text-th-chart-2",
  "chart-3": "text-th-chart-3",
  "chart-4": "text-th-chart-4",
  "chart-5": "text-th-chart-5",
  "chart-6": "text-th-chart-6",
  "chart-7": "text-th-chart-7",
  "chart-8": "text-th-chart-8"
};
function Sparkline({
  values,
  label,
  tone = "chart-1",
  width = 120,
  height = 28,
  fill = false,
  min,
  max,
  className
}) {
  const nums = values.filter((v) => v != null && Number.isFinite(v));
  const empty = nums.length === 0;
  const lo = min ?? (empty ? 0 : Math.min(...nums));
  const hi = max ?? (empty ? 1 : Math.max(...nums));
  const pad = 2;
  const x = (i) => values.length <= 1 ? width / 2 : i / (values.length - 1) * width;
  const y = (v) => hi === lo ? height / 2 : pad + (1 - (v - lo) / (hi - lo)) * (height - 2 * pad);
  const runs = [];
  let run = [];
  values.forEach((v, i) => {
    if (v == null || !Number.isFinite(v)) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push({ x: x(i), y: y(v) });
  });
  if (run.length) runs.push(run);
  const line = (r) => r.length === 1 ? `M${r[0].x},${r[0].y}h0` : r.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join("");
  const area = (r) => r.length < 2 ? "" : `${line(r)}L${r[r.length - 1].x},${height}L${r[0].x},${height}Z`;
  return /* @__PURE__ */ jsx10(
    "svg",
    {
      role: "img",
      "aria-label": empty ? `${label}: no data` : label,
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "none",
      className: cn("block shrink-0 overflow-visible", empty ? "text-th-line-strong" : SPARK_TONE[tone], className),
      children: empty ? /* @__PURE__ */ jsx10(
        "path",
        {
          d: `M0,${height / 2}H${width}`,
          stroke: "currentColor",
          strokeWidth: 1.5,
          strokeDasharray: "3 3",
          vectorEffect: "non-scaling-stroke"
        }
      ) : /* @__PURE__ */ jsxs10(Fragment3, { children: [
        fill ? runs.map((r, i) => /* @__PURE__ */ jsx10("path", { d: area(r), fill: "currentColor", fillOpacity: 0.15 }, `a${i}`)) : null,
        runs.map((r, i) => /* @__PURE__ */ jsx10(
          "path",
          {
            d: line(r),
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
  className
}) {
  const card = variant === "card";
  return /* @__PURE__ */ jsxs10(
    "details",
    {
      open: open ?? defaultOpen,
      onToggle: (e) => {
        const now = e.currentTarget.open;
        if (open === void 0 || now !== open) onOpenChange?.(now);
      },
      className: cn(
        "group",
        card && "rounded-xl border border-th-line bg-th-surface shadow-card",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs10(
          "summary",
          {
            className: cn(
              "flex cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-medium text-th-hi select-none",
              "[&::-webkit-details-marker]:hidden hover:text-th-hi pointer-coarse:min-h-11",
              card ? "px-4 py-3" : "py-1.5"
            ),
            children: [
              /* @__PURE__ */ jsx10(
                ChevronRightIcon,
                {
                  size: 14,
                  className: "shrink-0 text-th-hi3 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none"
                }
              ),
              /* @__PURE__ */ jsx10("span", { className: "min-w-0 flex-1", children: summary })
            ]
          }
        ),
        /* @__PURE__ */ jsx10("div", { className: cn("text-sm text-th-hi2", card ? "border-t border-th-line px-4 py-3" : "pb-2 pl-6 pt-1"), children })
      ]
    }
  );
}
function Kbd({ className, ...rest }) {
  return /* @__PURE__ */ jsx10(
    "kbd",
    {
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
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  if (typeof document === "undefined") return false;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  const active = document.activeElement;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
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
  label = "Copy",
  copiedLabel = "Copied",
  iconOnly = false,
  size = "sm",
  variant = "secondary",
  onCopy,
  className
}) {
  const [copied, setCopied] = useState4(false);
  const timer = useRef5(null);
  useEffect4(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const onClick = async () => {
    const ok = await copyText(text);
    onCopy?.(ok);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };
  const iconSize = size === "sm" ? 14 : 16;
  const icon = copied ? /* @__PURE__ */ jsx10(CheckIcon2, { size: iconSize, className: "text-th-ok" }) : /* @__PURE__ */ jsx10(CopyIcon, { size: iconSize });
  return /* @__PURE__ */ jsxs10(Fragment3, { children: [
    iconOnly ? /* @__PURE__ */ jsx10(IconButton, { label: copied ? copiedLabel : label, size, onClick, className, children: icon }) : /* @__PURE__ */ jsx10(Button, { variant, size, icon, onClick, className, children: copied ? copiedLabel : label }),
    /* @__PURE__ */ jsx10("span", { role: "status", "aria-live": "polite", className: "sr-only", children: copied ? copiedLabel : "" })
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
  className
}) {
  return /* @__PURE__ */ jsxs10(
    "header",
    {
      className: cn(
        "flex flex-col gap-2",
        sticky && "sticky top-0 z-(--nish-z-sticky) -mx-4 border-b border-th-line bg-th-bg/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6",
        className
      ),
      children: [
        back ? /* @__PURE__ */ jsx10("div", { className: "text-sm", children: back }) : null,
        /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-end justify-between gap-x-4 gap-y-3", children: [
          /* @__PURE__ */ jsxs10("div", { className: "min-w-0 flex-1 basis-64", children: [
            eyebrow ? /* @__PURE__ */ jsx10("p", { className: "mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3", children: eyebrow }) : null,
            /* @__PURE__ */ jsx10(H, { className: "text-2xl font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]", children: title }),
            description ? /* @__PURE__ */ jsx10("p", { className: "mt-1 text-sm text-th-hi2", children: description }) : null
          ] }),
          actions ? /* @__PURE__ */ jsx10("div", { className: "flex flex-wrap items-center gap-2", children: actions }) : null
        ] })
      ]
    }
  );
}
function AppHeader({
  name,
  icon,
  hubHref = "https://nish.software",
  actions,
  nav,
  themeToggle,
  sticky = true,
  innerClassName,
  homeHref,
  hideNameBelow,
  navLabel,
  compactPill = false,
  className
}) {
  const toggle = themeToggle === false ? null : themeToggle ?? /* @__PURE__ */ jsx10(ThemeToggle, {});
  const hideName = hideNameBelow === "sm" && icon != null;
  const mark = /* @__PURE__ */ jsxs10(Fragment3, { children: [
    icon ? /* @__PURE__ */ jsx10("span", { className: "shrink-0 text-th-accent [&>svg]:size-5", children: icon }) : null,
    /* @__PURE__ */ jsx10("span", { className: cn("truncate", hideName && "max-sm:sr-only"), children: name })
  ] });
  const markClass = "inline-flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-th-hi";
  return /* @__PURE__ */ jsxs10(
    "header",
    {
      className: cn(
        "border-b border-th-line bg-th-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur",
        sticky && "sticky top-0 z-(--nish-z-sticky)",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs10("div", { className: cn("flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6", innerClassName), children: [
          compactPill ? /* @__PURE__ */ jsxs10("a", { className: "nish-pill-link nish-pill-link--compact", href: hubHref, title: "Back to nish.software", children: [
            "\u2190 ",
            /* @__PURE__ */ jsx10("span", { className: "nish-pill-link-label", children: "nish.software" })
          ] }) : /* @__PURE__ */ jsx10("a", { className: "nish-pill-link", href: hubHref, title: "Back to nish.software", children: "\u2190 nish.software" }),
          homeHref != null ? /* @__PURE__ */ jsx10("a", { href: homeHref, className: cn(markClass, "min-h-11 min-w-11 rounded-lg", hideName && "max-sm:justify-center"), children: mark }) : /* @__PURE__ */ jsx10("span", { className: markClass, children: mark }),
          /* @__PURE__ */ jsxs10("div", { className: "ml-auto flex items-center gap-2", children: [
            actions,
            toggle
          ] })
        ] }),
        nav ? /* @__PURE__ */ jsx10("nav", { "aria-label": navLabel, className: cn("scrollbar-none -mb-px flex gap-1 overflow-x-auto px-4 sm:px-6", innerClassName), children: nav }) : null
      ]
    }
  );
}
function SectionHeader({ title, id, as: H = "h2", meta, action, className }) {
  return /* @__PURE__ */ jsxs10("div", { className: cn("mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1", className), children: [
    /* @__PURE__ */ jsx10(H, { id, className: "min-w-0 text-lg font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]", children: title }),
    meta != null || action != null ? /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-3", children: [
      meta != null ? /* @__PURE__ */ jsx10("span", { className: "text-sm text-th-hi3", children: meta }) : null,
      action
    ] }) : null
  ] });
}
function KeyValueList({ items: items2, dense = false, as = "ul", className }) {
  const row = (wrap) => cn(
    "flex min-w-0 items-center justify-between gap-3 border-b border-th-line last:border-b-0",
    dense ? "min-h-8" : "min-h-11",
    wrap && (dense ? "py-1" : "py-2")
  );
  const labelCls = (wrap) => wrap === "words" ? "min-w-0 shrink-0 max-w-[calc(60%_-_0.75rem)] [overflow-wrap:anywhere]" : wrap ? "shrink-0" : "min-w-0";
  const valueCls = (wrap) => wrap === "words" ? "min-w-0 flex-1 [overflow-wrap:anywhere]" : wrap ? "min-w-0 break-all" : "shrink-0";
  if (as === "dl") {
    return /* @__PURE__ */ jsx10("dl", { className: cn("grid text-sm text-th-hi", className), children: items2.map((it) => /* @__PURE__ */ jsxs10("div", { className: row(it.wrap), children: [
      /* @__PURE__ */ jsx10("dt", { className: cn("text-th-hi2", labelCls(it.wrap)), children: it.label }),
      /* @__PURE__ */ jsx10("dd", { className: cn("m-0 text-right", valueCls(it.wrap)), children: it.value })
    ] }, it.key)) });
  }
  return /* @__PURE__ */ jsx10("ul", { className: cn("grid text-sm text-th-hi", className), children: items2.map((it) => /* @__PURE__ */ jsxs10("li", { className: row(it.wrap), children: [
    /* @__PURE__ */ jsx10("span", { className: cn("flex items-center gap-2", labelCls(it.wrap)), children: it.label }),
    /* @__PURE__ */ jsx10("span", { className: cn("flex items-center justify-end gap-2 text-right", valueCls(it.wrap)), children: it.value })
  ] }, it.key)) });
}
var LEGEND_FILL = {
  "chart-1": "bg-th-chart-1",
  "chart-2": "bg-th-chart-2",
  "chart-3": "bg-th-chart-3",
  "chart-4": "bg-th-chart-4",
  "chart-5": "bg-th-chart-5",
  "chart-6": "bg-th-chart-6",
  "chart-7": "bg-th-chart-7",
  "chart-8": "bg-th-chart-8",
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill"
};
function ChartLegend({ items: items2, marker = "line", label = "Legend", className }) {
  return /* @__PURE__ */ jsx10("ul", { "aria-label": label, className: cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-th-hi2", className), children: items2.map((it) => /* @__PURE__ */ jsxs10("li", { className: "inline-flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsx10(
      "i",
      {
        "aria-hidden": "true",
        className: cn("inline-block shrink-0", marker === "dot" ? "size-2 rounded-full" : "h-0.75 w-2.5 rounded-sm", LEGEND_FILL[it.tone])
      }
    ),
    it.label
  ] }, it.label)) });
}

// src/components/table.tsx
import {
  createContext as createContext4,
  useContext as useContext4
} from "react";
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
var ALIGN = { left: "text-left", center: "text-center", right: "text-right" };
var ROW_TONE = {
  ok: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)]",
  warn: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)]",
  loss: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)]"
};
var WRAP = "overflow-auto rounded-xl border border-th-line bg-th-surface";
var STICKY = "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-th-surface";
var TABLE = "w-full border-collapse text-sm tabular-nums text-th-hi2";
var ZEBRA = "[&_tbody>tr:nth-child(even)]:bg-th-elevated/50";
var TH = "whitespace-nowrap border-b border-th-line px-3 text-left align-bottom text-xs font-medium uppercase tracking-wider text-th-hi3";
var TD = "px-3 align-middle";
var PAD = { normal: "py-2.5", dense: "py-1.5" };
var TR = "border-b border-th-line last:border-b-0";
var TR_INTERACTIVE = "cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated";
var NUMERIC = "text-right tabular-nums";
var tableClass = {
  /** The scroll box around the table. */
  wrap: WRAP,
  /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
  sticky: STICKY,
  /** The <table>. */
  table: TABLE,
  /** Add to table for striped rows. */
  zebra: ZEBRA,
  /** A header cell (add padY.normal or padY.dense). */
  th: TH,
  /** A body cell (add padY.normal or padY.dense). */
  td: TD,
  /** Vertical cell padding: normal or dense. */
  padY: PAD,
  /** A body row. */
  tr: TR,
  /** Add to tr for a clickable row. */
  trInteractive: TR_INTERACTIVE,
  /** Add to th or td for a right-aligned number column. */
  numeric: NUMERIC,
  /** Add to tr for a status edge. */
  tone: ROW_TONE
};
var TableCtx = createContext4({ dense: false });
function TableWrap({ minWidth, maxHeight, stickyHeader = false, className, style, children, ...rest }) {
  const css = {
    ...style,
    ...maxHeight !== void 0 ? { maxHeight } : null,
    ...minWidth !== void 0 ? { "--nish-table-min": typeof minWidth === "number" ? `${minWidth}px` : minWidth } : null
  };
  return /* @__PURE__ */ jsx11(
    "div",
    {
      className: cn(WRAP, minWidth !== void 0 && "[&>table]:min-w-[var(--nish-table-min)]", stickyHeader && STICKY, className),
      style: css,
      ...rest,
      children
    }
  );
}
function Table({ dense = false, zebra = false, className, ...rest }) {
  return /* @__PURE__ */ jsx11(TableCtx.Provider, { value: { dense }, children: /* @__PURE__ */ jsx11("table", { className: cn(TABLE, zebra && ZEBRA, className), ...rest }) });
}
var SORT_LABEL = { asc: "ascending", desc: "descending" };
function Th({ align, numeric = false, sort, onSort, className, children, scope = "col", ...rest }) {
  const { dense } = useContext4(TableCtx);
  const a = align ?? (numeric ? "right" : "left");
  const sortable = onSort !== void 0 || sort !== void 0;
  return /* @__PURE__ */ jsx11(
    "th",
    {
      scope,
      "aria-sort": sortable ? sort ? SORT_LABEL[sort] : "none" : void 0,
      className: cn(TH, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && "tabular-nums", className),
      ...rest,
      children: onSort ? /* @__PURE__ */ jsxs11(
        "button",
        {
          type: "button",
          onClick: onSort,
          className: cn(
            "-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase tracking-wider transition-colors hover:text-th-hi pointer-coarse:min-h-11",
            sort && "text-th-hi",
            a === "right" && "flex-row-reverse"
          ),
          children: [
            children,
            /* @__PURE__ */ jsx11(SortMark, { sort: sort || false })
          ]
        }
      ) : children
    }
  );
}
function SortMark({ sort }) {
  return /* @__PURE__ */ jsxs11("svg", { width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": "true", focusable: "false", className: "shrink-0", children: [
    /* @__PURE__ */ jsx11("path", { d: "M2 4 5 1l3 3", fill: "none", stroke: "currentColor", strokeWidth: 1.5, opacity: sort === "asc" ? 1 : 0.35 }),
    /* @__PURE__ */ jsx11("path", { d: "M2 6l3 3 3-3", fill: "none", stroke: "currentColor", strokeWidth: 1.5, opacity: sort === "desc" ? 1 : 0.35 })
  ] });
}
function Td({ align, numeric = false, className, ...rest }) {
  const { dense } = useContext4(TableCtx);
  const a = align ?? (numeric ? "right" : "left");
  return /* @__PURE__ */ jsx11("td", { className: cn(TD, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && "tabular-nums", className), ...rest });
}
function Tr({ tone, interactive = false, muted = false, className, ...rest }) {
  return /* @__PURE__ */ jsx11(
    "tr",
    {
      className: cn(TR, interactive && TR_INTERACTIVE, muted && "text-th-hi3", tone && ROW_TONE[tone], className),
      ...rest
    }
  );
}
export {
  AppHeader,
  Badge,
  Button,
  COLOR_ROLES,
  Callout,
  Card,
  CardHeader,
  ChartLegend,
  Checkbox,
  Chip,
  ChipGroup,
  ConfirmDialog,
  CopyButton,
  DEFAULT_THEME,
  Disclosure,
  Drawer,
  DropdownMenu,
  EmptyState,
  ErrorState,
  Field,
  FieldGroup,
  HUE_ROLES,
  IconButton,
  Input,
  Kbd,
  KeyValueList,
  Label,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSubHeader,
  Meter,
  Modal,
  PRESETS,
  PageHeader,
  Popover,
  SCALE,
  SHADOWS,
  SOFT_ROLES,
  SearchInput,
  SectionHeader,
  Segmented,
  Select,
  Skeleton,
  SkeletonLines,
  SkeletonRows,
  Sparkline,
  Spinner,
  Stat,
  StatGrid,
  StatusDot,
  Switch,
  THEMES,
  TOGGLE_ORDER,
  TabPanel,
  Table,
  TableWrap,
  Tabs,
  Td,
  Textarea,
  Th,
  ThemeToggle,
  Toaster,
  Tooltip,
  Tr,
  applyTheme,
  badgeClass,
  buttonClass,
  cardClass,
  chipClass,
  cn,
  confirmDialog,
  copyText,
  cycleTheme,
  dismissToast,
  fieldClass,
  getThemeChoice,
  iconButtonClass,
  initTheme,
  isThemeName,
  menuItemClass,
  mountThemeToggle,
  mountTooltips,
  onThemeChange,
  readToken,
  registerThemes,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  showToast,
  signTone,
  tabClass,
  tableClass,
  toast,
  toneFor,
  useTheme,
  useToast
};
//# sourceMappingURL=index.js.map