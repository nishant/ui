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
var reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function openSheet(dialog) {
  if (typeof document === "undefined") return () => void 0;
  if (dialog.open) return () => closeNow();
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let closing = false;
  let dragging = false;
  function closeNow() {
    if (closing || !dialog.open) return;
    closing = true;
    let timer;
    const finish = () => {
      dialog.removeEventListener("animationend", onEnd);
      if (timer !== void 0) clearTimeout(timer);
      dialog.removeAttribute("data-closing");
      dialog.style.transform = "";
      dialog.style.transition = "";
      closing = false;
      if (dialog.open) dialog.close();
    };
    const onEnd = (e) => {
      if (e.target === dialog) finish();
    };
    if (reducedMotion()) {
      finish();
      return;
    }
    dialog.style.transform = "";
    dialog.setAttribute("data-closing", "");
    dialog.addEventListener("animationend", onEnd);
    timer = setTimeout(finish, 260);
  }
  const onCancel = (e) => {
    e.preventDefault();
    closeNow();
  };
  const onKey = (e) => {
    if (e.key === "Escape") e.stopPropagation();
  };
  const onClick = (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeNow();
      return;
    }
    if (e.target instanceof Element && e.target.closest("[data-sheet-close]")) closeNow();
  };
  let startY = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let height = 1;
  const onDown = (e) => {
    if (e.pointerType === "mouse" || closing || !e.isPrimary) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(min-width: 640px)").matches) return;
    const r = dialog.getBoundingClientRect();
    const onHeader = e.target instanceof Element && e.target.closest(".nish-sheet-header") != null;
    if (!onHeader && e.clientY - r.top > 28) return;
    dragging = true;
    startY = lastY = e.clientY;
    lastT = e.timeStamp;
    velocity = 0;
    height = r.height || 1;
    dialog.style.transition = "none";
    dialog.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const dt = e.timeStamp - lastT;
    if (dt > 0) velocity = (e.clientY - lastY) / dt;
    lastY = e.clientY;
    lastT = e.timeStamp;
    dialog.style.transform = `translateY(${dy >= 0 ? dy : dy * 0.3}px)`;
  };
  const onUp = (e) => {
    if (!dragging) return;
    dragging = false;
    dialog.releasePointerCapture?.(e.pointerId);
    const dy = e.clientY - startY;
    if (e.type !== "pointercancel" && (dy > height * 0.3 || velocity > 0.5)) {
      closeNow();
      return;
    }
    dialog.style.transition = "transform 180ms var(--nish-ease-out, ease-out)";
    dialog.style.transform = "";
    setTimeout(() => {
      if (!closing) dialog.style.transition = "";
    }, 200);
  };
  const onClose = () => {
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("keydown", onKey);
    dialog.removeEventListener("click", onClick);
    dialog.removeEventListener("pointerdown", onDown);
    dialog.removeEventListener("pointermove", onMove);
    dialog.removeEventListener("pointerup", onUp);
    dialog.removeEventListener("pointercancel", onUp);
    dialog.removeEventListener("close", onClose);
    if (opener?.isConnected) opener.focus();
  };
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("keydown", onKey);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("pointerdown", onDown);
  dialog.addEventListener("pointermove", onMove);
  dialog.addEventListener("pointerup", onUp);
  dialog.addEventListener("pointercancel", onUp);
  dialog.addEventListener("close", onClose);
  dialog.showModal();
  return closeNow;
}
function mountHeightVar(el, name) {
  if (typeof document === "undefined") return () => void 0;
  const root = document.documentElement;
  const write = () => {
    const h = el.offsetHeight;
    if (h > 0) root.style.setProperty(name, `${h}px`);
    else root.style.removeProperty(name);
  };
  write();
  let ro;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(write);
    ro.observe(el);
  } else {
    window.addEventListener("resize", write);
  }
  return () => {
    ro?.disconnect();
    window.removeEventListener("resize", write);
    root.style.removeProperty(name);
  };
}
function mountStuck(el, onChange) {
  if (typeof document === "undefined" || typeof IntersectionObserver === "undefined") return () => void 0;
  let io;
  let builtTop = Number.NaN;
  let current = false;
  const scrolled = () => {
    if ((window.scrollY || document.documentElement.scrollTop || 0) > 0) return true;
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      if (p.scrollTop > 0) return true;
    }
    return false;
  };
  const evaluate = () => {
    const style = getComputedStyle(el);
    const next = style.position === "sticky" && Math.abs(el.getBoundingClientRect().top - (parseFloat(style.top) || 0)) < 1 && scrolled();
    if (next === current) return;
    current = next;
    if (next) el.setAttribute("data-stuck", "");
    else el.removeAttribute("data-stuck");
    onChange?.(next);
  };
  const build = () => {
    const top = Math.round(parseFloat(getComputedStyle(el).top) || 0);
    if (top !== builtTop) {
      builtTop = top;
      io?.disconnect();
      io = new IntersectionObserver(evaluate, {
        threshold: [0, 0.25, 0.5, 0.75, 0.9, 0.99, 1],
        rootMargin: `${-top - 1}px 0px 0px 0px`
      });
      io.observe(el);
    }
    evaluate();
  };
  window.addEventListener("scroll", evaluate, { passive: true, capture: true });
  build();
  let ro;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(build);
    ro.observe(el);
  }
  let mo;
  if (typeof MutationObserver !== "undefined") {
    mo = new MutationObserver(build);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  }
  return () => {
    window.removeEventListener("scroll", evaluate, { capture: true });
    io?.disconnect();
    ro?.disconnect();
    mo?.disconnect();
    el.removeAttribute("data-stuck");
  };
}
function mountScrollspy(nav, o = {}) {
  if (typeof document === "undefined") return () => void 0;
  const links = Array.from(nav.querySelectorAll('a[href^="#"]')).filter((a) => a.hash.length > 1);
  const target = (a) => {
    try {
      return document.getElementById(decodeURIComponent(a.hash.slice(1)));
    } catch {
      return null;
    }
  };
  const unheight = mountHeightVar(nav, "--nish-sticky-extra");
  let current = null;
  const edges = () => {
    const max = nav.scrollWidth - nav.clientWidth;
    nav.dataset.atStart = String(nav.scrollLeft <= 1);
    nav.dataset.atEnd = String(max <= 1 || nav.scrollLeft >= max - 1);
  };
  const reveal = (a) => {
    const left = a.offsetLeft - nav.offsetLeft;
    const view = nav.clientWidth;
    if (left < nav.scrollLeft + 24) nav.scrollLeft = Math.max(0, left - 24);
    else if (left + a.offsetWidth > nav.scrollLeft + view - 24) nav.scrollLeft = left + a.offsetWidth - view + 24;
  };
  const activate = (a) => {
    if (a === current) return;
    current?.removeAttribute("aria-current");
    current = a;
    if (a) {
      a.setAttribute("aria-current", "true");
      reveal(a);
    }
  };
  const update = () => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nish-header-h")) || 0;
    const line = o.offset ?? header + nav.offsetHeight + 8;
    let found = links[0] ?? null;
    for (const a of links) {
      const t = target(a);
      if (t && t.getBoundingClientRect().top <= line + 1) found = a;
    }
    const de = document.documentElement;
    if (window.innerHeight + window.scrollY >= de.scrollHeight - 2) {
      for (const a of links) if (target(a)) found = a;
    }
    activate(found);
  };
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  const onClick = (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (a && links.includes(a)) activate(a);
  };
  edges();
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  nav.addEventListener("scroll", edges, { passive: true });
  nav.addEventListener("click", onClick);
  let ro;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => {
      edges();
      schedule();
    });
    ro.observe(nav);
  }
  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    nav.removeEventListener("scroll", edges);
    nav.removeEventListener("click", onClick);
    ro?.disconnect();
    unheight();
    current?.removeAttribute("aria-current");
    delete nav.dataset.atStart;
    delete nav.dataset.atEnd;
  };
}
function mountChecklist(list) {
  if (typeof document === "undefined") return () => void 0;
  const key = list.dataset.store || null;
  const boxes = () => Array.from(list.querySelectorAll('li[data-id] input[type="checkbox"]'));
  const idOf = (b) => b.closest("li[data-id]")?.dataset.id ?? "";
  let progress = null;
  for (let sib = list.previousElementSibling; sib; sib = sib.previousElementSibling) {
    if (sib.classList.contains("nish-checklist-progress")) {
      progress = sib;
      break;
    }
  }
  progress ??= list.parentElement?.querySelector(".nish-checklist-progress") ?? null;
  if (key) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
      if (Array.isArray(saved)) for (const b of boxes()) b.checked = saved.includes(idOf(b));
    } catch {
    }
  }
  const render = () => {
    const all = boxes();
    const done = all.filter((b) => b.checked).length;
    if (progress) {
      progress.textContent = `${done} of ${all.length}`;
      progress.style.setProperty("--p", `${all.length ? done / all.length * 100 : 0}%`);
    }
  };
  const onChange = (e) => {
    if (!(e.target instanceof HTMLInputElement) || e.target.type !== "checkbox") return;
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(boxes().filter((b) => b.checked).map(idOf)));
      } catch {
      }
    }
    render();
  };
  render();
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
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
var CheckIcon = (p) => /* @__PURE__ */ jsx(Svg, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) });
var ClockIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "10" }),
  /* @__PURE__ */ jsx("path", { d: "M12 6v6l4 2" })
] });
var MoreIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1" }),
  /* @__PURE__ */ jsx("circle", { cx: "19", cy: "12", r: "1" }),
  /* @__PURE__ */ jsx("circle", { cx: "5", cy: "12", r: "1" })
] });
var BellIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }),
  /* @__PURE__ */ jsx("path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" })
] });
var SettingsIcon = (p) => /* @__PURE__ */ jsxs(Svg, { ...p, children: [
  /* @__PURE__ */ jsx("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }),
  /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "3" })
] });

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
var BUTTON_BASE = "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,transform] duration-150";
var PRESS = "pointer-coarse:not-disabled:active:scale-[0.97]";
var LINK_HIT = "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']";
var BUTTON_DISABLED = "disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none";
var LINK_DISABLED = "disabled:pointer-events-none disabled:text-th-ghost disabled:no-underline";
function buttonClass({ variant = "secondary", size = "md", inline = false, className } = {}) {
  return cn(
    BUTTON_BASE,
    variant === "link" ? LINK_SIZE[size] : BUTTON_SIZE[size],
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
var Button = forwardRef(function Button2({ variant = "secondary", size = "md", inline = false, loading = false, icon, className, children, disabled, type = "button", ...rest }, ref) {
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
        inline,
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
    "inline-flex shrink-0 items-center justify-center transition-[color,background-color,border-color,transform] duration-150",
    PRESS,
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
var CheckIcon2 = (p) => /* @__PURE__ */ jsx3(Svg2, { strokeWidth: 3, ...p, children: /* @__PURE__ */ jsx3("path", { d: "M20 6 9 17l-5-5" }) });
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
            CheckIcon2,
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
import { createContext as createContext2, useContext as useContext2, useEffect as useEffect8, useId as useId6, useRef as useRef6, useSyncExternalStore as useSyncExternalStore2 } from "react";

// src/components/layout-vars.ts
import { useEffect as useEffect2, useState } from "react";
var heightOwners = /* @__PURE__ */ new Map();
function applyHeightVar(name) {
  const owners = heightOwners.get(name);
  const root = document.documentElement;
  const max = owners ? Math.max(0, ...owners.values()) : 0;
  if (max > 0) root.style.setProperty(name, `${max}px`);
  else root.style.removeProperty(name);
}
function useHeightVar(ref, name, enabled = true) {
  useEffect2(() => {
    const el = ref.current;
    if (!enabled || !el || typeof document === "undefined") return;
    const owner = {};
    let owners = heightOwners.get(name);
    if (!owners) heightOwners.set(name, owners = /* @__PURE__ */ new Map());
    const write = () => {
      owners.set(owner, el.offsetHeight);
      applyHeightVar(name);
    };
    write();
    let ro;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(write);
      ro.observe(el);
    } else {
      window.addEventListener("resize", write);
    }
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", write);
      owners.delete(owner);
      if (owners.size === 0) heightOwners.delete(name);
      applyHeightVar(name);
    };
  }, [ref, name, enabled]);
}
function useStuck(ref, enabled = true) {
  const [stuck, setStuck] = useState(false);
  useEffect2(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const stop = mountStuck(el, setStuck);
    return () => {
      stop();
      setStuck(false);
    };
  }, [ref, enabled]);
  return stuck;
}
function useScrollEdges(ref) {
  useEffect2(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      el.dataset.atStart = String(el.scrollLeft <= 1);
      el.dataset.atEnd = String(max <= 1 || el.scrollLeft >= max - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    let ro;
    let mo;
    const observeChildren = () => {
      if (ro) for (const c of Array.from(el.children)) ro.observe(c);
    };
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
      observeChildren();
    }
    if (typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(() => {
        update();
        observeChildren();
      });
      mo.observe(el, { childList: true });
    }
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
      mo?.disconnect();
      delete el.dataset.atStart;
      delete el.dataset.atEnd;
    };
  }, [ref]);
}

// src/components/nav.tsx
import {
  Fragment as Fragment4,
  createElement,
  useEffect as useEffect7,
  useRef as useRef5,
  useState as useState6,
  useSyncExternalStore
} from "react";

// src/components/command.tsx
import {
  useEffect as useEffect4,
  useId as useId4,
  useMemo,
  useRef as useRef3,
  useState as useState3
} from "react";

// src/components/overlay.tsx
import {
  cloneElement as cloneElement2,
  createContext,
  useCallback as useCallback2,
  useContext,
  useEffect as useEffect3,
  useId as useId3,
  useLayoutEffect as useLayoutEffect2,
  useRef as useRef2,
  useState as useState2
} from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var layerStack = [];
var isTop = (self) => layerStack[layerStack.length - 1] === self;
var dialogCount = 0;
function syncLayerAttr() {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (dialogCount > 0) html.setAttribute("data-nish-layer-open", "");
  else html.removeAttribute("data-nish-layer-open");
}
var dialogPortals = [];
var inertedBySync = /* @__PURE__ */ new Set();
function syncInert() {
  if (typeof document === "undefined") return;
  for (let i = dialogPortals.length - 1; i >= 0; i--) if (!dialogPortals[i].isConnected) dialogPortals.splice(i, 1);
  const top = dialogPortals[dialogPortals.length - 1];
  if (!top) {
    inertedBySync.forEach((el) => {
      el.inert = false;
      el.removeAttribute("inert");
    });
    inertedBySync.clear();
    return;
  }
  for (const el of Array.from(document.body.children)) {
    const skip = el === top || el.contains(top) || el.hasAttribute("data-nish-keep-active");
    if (skip) {
      if (inertedBySync.has(el)) {
        el.inert = false;
        el.removeAttribute("inert");
        inertedBySync.delete(el);
      }
    } else if (!el.inert) {
      el.inert = true;
      el.setAttribute("inert", "");
      inertedBySync.add(el);
    }
  }
}
function pushInert(scrim) {
  if (!dialogPortals.includes(scrim)) dialogPortals.push(scrim);
  syncInert();
}
function popInert(scrim) {
  const i = dialogPortals.indexOf(scrim);
  if (i >= 0) dialogPortals.splice(i, 1);
  syncInert();
}
var SHEET_EXIT_MS = 200;
var PHONE_QUERY = "(max-width: 639px)";
function isPhoneViewport() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(PHONE_QUERY).matches;
}
function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
var closeVetoes = /* @__PURE__ */ new WeakMap();
var layerSeq = 0;
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
var pendingBacks = 0;
var queuedPushes = [];
function queueHistoryPush(push2) {
  if (pendingBacks > 0) queuedPushes.push(push2);
  else push2();
}
function whenHistorySettled(cb) {
  queueHistoryPush(cb);
}
function cancelHistoryPush(push2) {
  const i = queuedPushes.indexOf(push2);
  if (i >= 0) queuedPushes.splice(i, 1);
}
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (e) => {
    if (pendingBacks <= 0) return;
    pendingBacks--;
    e.stopImmediatePropagation();
    if (pendingBacks === 0) {
      for (const push2 of queuedPushes.splice(0)) push2();
    }
  });
}
function useDialog(panelRef, onClose, closeOnBackProp = false) {
  const closeOnBack = closeOnBackProp && (typeof window === "undefined" || window.self === window.top);
  const onCloseRef = useRef2(onClose);
  onCloseRef.current = onClose;
  useEffect3(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const self = {};
    layerStack.push(self);
    dialogCount++;
    syncLayerAttr();
    const scrim = panel?.closest("[data-nish-layer]") ?? null;
    if (scrim) pushInert(scrim);
    const layerId = `nish-layer-${++layerSeq}`;
    let pushed = false;
    let rePushTimer = 0;
    const pushEntry = () => {
      const prev = history.state && typeof history.state === "object" ? history.state : {};
      history.pushState({ ...prev, nishLayer: layerId }, "");
      pushed = true;
    };
    const queuedPush = () => queueHistoryPush(pushEntry);
    const pushTimer = closeOnBack ? window.setTimeout(queuedPush, 0) : 0;
    function onPop() {
      if (!pushed) return;
      if (history.state?.nishLayer === layerId) return;
      pushed = false;
      if (!isTop(self)) {
        pushEntry();
        return;
      }
      onCloseRef.current();
      window.clearTimeout(rePushTimer);
      rePushTimer = window.setTimeout(() => {
        if (!pushed) queuedPush();
      }, SHEET_EXIT_MS + 60);
    }
    if (closeOnBack) window.addEventListener("popstate", onPop);
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
      window.clearTimeout(pushTimer);
      window.clearTimeout(rePushTimer);
      cancelHistoryPush(pushEntry);
      window.removeEventListener("popstate", onPop);
      layerStack.splice(layerStack.indexOf(self), 1);
      dialogCount--;
      syncLayerAttr();
      if (scrim) popInert(scrim);
      document.removeEventListener("keydown", onKey);
      unlock();
      opener?.focus?.();
      if (pushed && history.state?.nishLayer === layerId) {
        pendingBacks++;
        history.back();
      }
    };
  }, [panelRef, closeOnBack]);
}
function useSheetExit(onClose, canClose) {
  const [closing, setClosing] = useState2(false);
  const closingRef = useRef2(false);
  const timer = useRef2(0);
  const onCloseRef = useRef2(onClose);
  onCloseRef.current = onClose;
  const canCloseRef = useRef2(canClose);
  canCloseRef.current = canClose;
  useEffect3(() => () => window.clearTimeout(timer.current), []);
  const requestClose = useCallback2(() => {
    if (closingRef.current) return;
    if (closeVetoes.get(onCloseRef.current)?.()) return;
    if (canCloseRef.current && !canCloseRef.current()) return;
    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    timer.current = window.setTimeout(() => {
      onCloseRef.current();
      closingRef.current = false;
      setClosing(false);
    }, SHEET_EXIT_MS);
  }, []);
  const closeNow = useCallback2(() => {
    onCloseRef.current();
  }, []);
  const isClosing = useCallback2(() => closingRef.current, []);
  const allowClose = useCallback2(() => !canCloseRef.current || canCloseRef.current(), []);
  return { closing, requestClose, closeNow, isClosing, allowClose };
}
function useSheetSwipe(panelRef, scrimRef, enabled, onDismiss, allow = () => true) {
  const drag = useRef2(null);
  const timer = useRef2(0);
  const enabledRef = useRef2(enabled);
  enabledRef.current = enabled;
  const dismissRef = useRef2(onDismiss);
  dismissRef.current = onDismiss;
  const allowRef = useRef2(allow);
  allowRef.current = allow;
  useEffect3(() => () => window.clearTimeout(timer.current), []);
  const onPointerDown = useCallback2(
    (e) => {
      if (drag.current || !enabledRef.current()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const hit = e.target.closest('button,a,input,select,textarea,[role="button"]');
      if (hit && hit !== e.currentTarget) return;
      const panel = panelRef.current;
      if (!panel) return;
      window.clearTimeout(timer.current);
      e.currentTarget.setPointerCapture?.(e.pointerId);
      panel.style.transition = "none";
      if (scrimRef.current) scrimRef.current.style.transition = "none";
      drag.current = { startY: e.clientY, dy: 0, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
    },
    [panelRef, scrimRef]
  );
  const onPointerMove = useCallback2(
    (e) => {
      const d = drag.current;
      const panel = panelRef.current;
      if (!d || !panel) return;
      d.dy = e.clientY - d.startY;
      const dt = e.timeStamp - d.lastT;
      if (dt > 0) d.v = (e.clientY - d.lastY) / dt;
      d.lastY = e.clientY;
      d.lastT = e.timeStamp;
      panel.style.transform = `translateY(${d.dy < 0 ? d.dy * 0.3 : d.dy}px)`;
      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, d.dy) / Math.max(1, panel.offsetHeight)));
      }
    },
    [panelRef, scrimRef]
  );
  const end = useCallback2(
    (e, cancelled) => {
      const d = drag.current;
      const panel = panelRef.current;
      drag.current = null;
      if (!d || !panel) return;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      const scrim = scrimRef.current;
      const velocity = e.timeStamp - d.lastT > 100 ? 0 : d.v;
      const dismiss = !cancelled && (d.dy > panel.offsetHeight * 0.3 || velocity > 0.5) && allowRef.current();
      const ms = SHEET_EXIT_MS - 20;
      panel.style.transition = `transform ${ms}ms ease-out`;
      if (scrim) scrim.style.transition = `opacity ${ms}ms ease-out`;
      if (dismiss) {
        panel.style.transform = "translateY(100%)";
        if (scrim) scrim.style.opacity = "0";
        timer.current = window.setTimeout(() => dismissRef.current(), ms);
      } else {
        panel.style.transform = "translateY(0)";
        if (scrim) scrim.style.opacity = "1";
        timer.current = window.setTimeout(() => {
          panel.style.transform = "";
          panel.style.transition = "";
          if (scrim) {
            scrim.style.opacity = "";
            scrim.style.transition = "";
          }
        }, ms);
      }
    },
    [panelRef, scrimRef]
  );
  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (e) => end(e, false),
    onPointerCancel: (e) => end(e, true)
  };
}
function SheetHandle({ onClose, swipe, className }) {
  return /* @__PURE__ */ jsx4(
    "div",
    {
      role: "button",
      tabIndex: 0,
      "aria-label": "Close",
      ...swipe,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClose();
        }
      },
      className: cn(
        "flex h-5 min-h-11 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl outline-none focus-visible:bg-th-overlay",
        className
      ),
      children: /* @__PURE__ */ jsx4("span", { className: "h-1 w-10 rounded-full bg-th-line-strong", "aria-hidden": "true" })
    }
  );
}
var CLOSE_BUTTON = "-mr-1.5 inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11 pointer-coarse:min-w-11";
var SHEET_HEIGHT_CLASS = {
  auto: "max-h-[92dvh]",
  tall: "max-h-[92dvh] max-sm:h-[92dvh]",
  full: "max-h-dvh max-sm:h-dvh max-sm:rounded-t-none max-sm:pt-[env(safe-area-inset-top)]"
};
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
  sheetHeight = "auto",
  dismissible = true,
  closeOnBack = true,
  canClose,
  className
}) {
  const titleId = useId3();
  const panelRef = useRef2(null);
  const scrimRef = useRef2(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose);
  useDialog(panelRef, requestClose, closeOnBack);
  const swipe = useSheetSwipe(panelRef, scrimRef, () => dismissible && !isClosing() && isPhoneViewport(), closeNow, allowClose);
  const showTitle = header === void 0 && title !== void 0 && title !== null;
  return createPortal(
    /* @__PURE__ */ jsx4(
      "div",
      {
        ref: scrimRef,
        "data-nish-layer": "",
        className: cn(
          "fixed inset-0 z-50 flex items-end justify-center bg-th-scrim/60 sm:p-4",
          closing ? "pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-fade-in_160ms_ease-out]",
          placement === "top" ? "sm:items-start sm:pt-[12vh]" : "sm:items-center"
        ),
        onMouseDown: (e) => {
          if (e.target === e.currentTarget) requestClose();
        },
        children: /* @__PURE__ */ jsxs4(
          "div",
          {
            ref: panelRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": showTitle && !ariaLabel ? titleId : void 0,
            "aria-label": ariaLabel,
            tabIndex: -1,
            className: cn(
              "flex w-full flex-col border border-th-line bg-th-surface shadow-modal outline-none",
              "rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
              closing ? "max-sm:animate-[nish-sheet-out_200ms_ease-in_forwards] sm:animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-sheet-in_240ms_var(--nish-ease-out)] sm:animate-[nish-rise-in_200ms_var(--nish-ease-out)]",
              "sm:max-h-[85dvh] sm:rounded-2xl sm:pb-0",
              placement === "top" && "sm:max-h-[76dvh]",
              SHEET_HEIGHT_CLASS[sheetHeight],
              SIZE[size],
              className
            ),
            children: [
              dismissible ? /* @__PURE__ */ jsx4(SheetHandle, { onClose: requestClose, swipe, className: "sm:hidden" }) : null,
              header !== void 0 ? /* @__PURE__ */ jsx4("div", { className: cn("shrink-0", dismissible && "max-sm:touch-pan-x"), ...dismissible ? swipe : {}, children: header }) : /* @__PURE__ */ jsxs4(
                "div",
                {
                  className: cn("flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-3 sm:pt-4", dismissible && "max-sm:touch-pan-x"),
                  ...dismissible ? swipe : {},
                  children: [
                    /* @__PURE__ */ jsx4("h2", { id: titleId, className: "min-w-0 line-clamp-2 break-words pt-1 text-base font-semibold leading-snug text-th-hi", children: title }),
                    hideClose ? null : /* @__PURE__ */ jsx4("button", { type: "button", onClick: requestClose, "aria-label": "Close", className: CLOSE_BUTTON, children: /* @__PURE__ */ jsx4(XIcon, { size: 16 }) })
                  ]
                }
              ),
              subtitle ? /* @__PURE__ */ jsx4("div", { className: "shrink-0 border-b border-th-line px-5 pb-3 text-sm text-th-hi2", children: subtitle }) : null,
              /* @__PURE__ */ jsx4(
                "div",
                {
                  className: cn(
                    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 text-sm text-th-hi2",
                    header !== void 0 && "pt-3"
                  ),
                  children
                }
              ),
              footer ? /* @__PURE__ */ jsx4("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
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
  dismissible = true,
  closeOnBack = true,
  canClose,
  "aria-label": ariaLabel,
  children,
  className
}) {
  const titleId = useId3();
  const panelRef = useRef2(null);
  const scrimRef = useRef2(null);
  const { closing, requestClose, closeNow, isClosing, allowClose } = useSheetExit(onClose, canClose);
  useDialog(panelRef, requestClose, closeOnBack);
  const bottom = side === "bottom";
  const swipe = useSheetSwipe(panelRef, scrimRef, () => bottom && dismissible && !isClosing(), closeNow, allowClose);
  const swipeHeader = bottom && dismissible;
  return createPortal(
    /* @__PURE__ */ jsx4(
      "div",
      {
        ref: scrimRef,
        "data-nish-layer": "",
        className: cn(
          "fixed inset-0 z-50 bg-th-scrim/50",
          closing ? "pointer-events-none animate-[nish-fade-out_200ms_ease-in_forwards]" : "animate-[nish-fade-in_160ms_ease-out]"
        ),
        style: bottom && bottomOffset ? { bottom: bottomOffset } : void 0,
        onMouseDown: (e) => {
          if (e.target === e.currentTarget) requestClose();
        },
        children: /* @__PURE__ */ jsxs4(
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
                "inset-x-0 bottom-0 rounded-t-2xl border-t",
                closing ? "animate-[nish-sheet-out_200ms_ease-in_forwards]" : "animate-[nish-sheet-in_240ms_var(--nish-ease-out)]",
                bottomOffset ? "" : "pb-[env(safe-area-inset-bottom)]",
                SHEET_HEIGHT[size]
              ) : cn(
                "inset-y-0 w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
                DRAWER_WIDTH[size],
                side === "right" ? cn(
                  "right-0 border-l pr-[env(safe-area-inset-right)]",
                  closing ? "translate-x-full transition-transform duration-200 ease-in" : "animate-[nish-slide-in-right_240ms_var(--nish-ease-out)]"
                ) : cn(
                  "left-0 border-r pl-[env(safe-area-inset-left)]",
                  closing ? "-translate-x-full transition-transform duration-200 ease-in" : "animate-[nish-slide-in-left_240ms_var(--nish-ease-out)]"
                )
              ),
              className
            ),
            children: [
              swipeHeader ? /* @__PURE__ */ jsx4(SheetHandle, { onClose: requestClose, swipe }) : bottom ? /* @__PURE__ */ jsx4("div", { className: "h-3 shrink-0", "aria-hidden": "true" }) : null,
              /* @__PURE__ */ jsxs4(
                "div",
                {
                  className: cn("flex shrink-0 items-start justify-between gap-3 border-b border-th-line px-5 py-3", swipeHeader && "touch-pan-x"),
                  ...swipeHeader ? swipe : {},
                  children: [
                    /* @__PURE__ */ jsxs4("div", { className: "min-w-0 pt-1", children: [
                      /* @__PURE__ */ jsx4("h2", { id: titleId, className: "line-clamp-2 break-words text-base font-semibold leading-snug text-th-hi", children: title }),
                      subtitle ? /* @__PURE__ */ jsx4("div", { className: "mt-0.5 text-xs text-th-hi3", children: subtitle }) : null
                    ] }),
                    /* @__PURE__ */ jsxs4("div", { className: "-mr-1.5 flex shrink-0 items-center gap-1", children: [
                      actions,
                      /* @__PURE__ */ jsx4(IconButton, { label: "Close", onClick: requestClose, children: /* @__PURE__ */ jsx4(XIcon, { size: 16 }) })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsx4("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm text-th-hi2", children }),
              footer ? /* @__PURE__ */ jsx4("div", { className: "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-th-line px-5 py-3", children: footer }) : null
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
  const pendingRef = useRef2(pending);
  pendingRef.current = pending;
  const cancel = useCallback2(() => {
    if (!pendingRef.current) onCancel();
  }, [onCancel]);
  closeVetoes.set(cancel, () => pendingRef.current);
  const danger = tone === "danger";
  return /* @__PURE__ */ jsx4(
    Modal,
    {
      title,
      onClose: cancel,
      size: "md",
      footer: /* @__PURE__ */ jsxs4(Fragment, { children: [
        /* @__PURE__ */ jsx4(Button, { onClick: cancel, disabled: pending, "data-autofocus": danger ? "" : void 0, children: cancelLabel }),
        /* @__PURE__ */ jsx4(
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
    return {
      side: chosen,
      top: clamp(top2, h, vh),
      left: clamp(left2, w, vw),
      maxHeight: Math.max(0, room[chosen] - gap - EDGE)
    };
  }
  const left = chosen === "left" ? r.left - gap - w : r.right + gap;
  const top = align === "start" ? r.top : align === "end" ? r.bottom - h : r.top + r.height / 2 - h / 2;
  return { side: chosen, top: clamp(top, h, vh), left: clamp(left, w, vw), maxHeight: Math.max(0, vh - 2 * EDGE) };
}
function useAnchoredPosition(anchor, floating, open, side, align, gap = GAP) {
  const [pos, setPos] = useState2(null);
  useLayoutEffect2(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const update = () => {
      const a = anchor.current;
      const f = floating.current;
      if (!a || !f) return;
      const naturalH = f.scrollHeight + (f.offsetHeight - f.clientHeight);
      const next = place(a.getBoundingClientRect(), f.offsetWidth, Math.max(f.offsetHeight, naturalH), side, align, gap);
      setPos(
        (prev) => prev && prev.top === next.top && prev.left === next.left && prev.side === next.side && prev.maxHeight === next.maxHeight ? prev : next
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
  const triggerRef = useRef2(null);
  const [open, setOpen] = useState2(false);
  const id = useId3();
  useEffect3(() => {
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
  return /* @__PURE__ */ jsxs4(Fragment, { children: [
    as === "tr" ? /* @__PURE__ */ jsx4("tr", { ref: triggerRef, className: cn(hint, className), ...a11y, children }) : /* @__PURE__ */ jsx4(
      "span",
      {
        ref: triggerRef,
        className: cn(hint ? "inline" : "inline-flex items-center", hint, className),
        ...a11y,
        children
      }
    ),
    open ? /* @__PURE__ */ jsx4(FloatingTip, { anchor: triggerRef, id, tip, side }) : null
  ] });
}
function FloatingTip({
  anchor,
  id,
  tip,
  side = "top"
}) {
  const tipRef = useRef2(null);
  const pos = useAnchoredPosition(anchor, tipRef, true, side, "center");
  return createPortal(
    /* @__PURE__ */ jsx4(
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
  const closeRef = useRef2(close);
  closeRef.current = close;
  useEffect3(() => {
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
  const wasOpen = useRef2(false);
  const focusWasInside = useRef2(false);
  useEffect3(() => {
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
  const panelRef = useRef2(null);
  const pos = useAnchoredPosition(anchor, panelRef, open, side, align);
  const onOpenChangeRef = useRef2(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const outsideRef = useRef2(dismissOnOutside);
  outsideRef.current = dismissOnOutside;
  useDismiss(open, panelRef, anchor, (reason) => {
    if (reason === "outside" && !outsideRef.current) return;
    onOpenChangeRef.current(false, reason);
  });
  useReturnFocus(open, panelRef, anchor);
  useEffect3(() => {
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
  return createPortal(
    /* @__PURE__ */ jsx4(
      "div",
      {
        ref: panelRef,
        role: "dialog",
        "aria-label": ariaLabel,
        tabIndex: -1,
        "data-side": pos?.side,
        onKeyDown,
        style: floatingStyle(pos, { width, maxHeight: pos?.maxHeight, zIndex: "var(--nish-z-dropdown, 40)" }),
        className: cn(
          "max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-lg border border-th-line bg-th-elevated p-3 text-sm text-th-hi2 shadow-pop outline-none",
          "animate-[nish-fade-in_120ms_ease-out]",
          className
        ),
        children
      }
    ),
    layerHost(anchor.current)
  );
}
var MenuContext = createContext(null);
var ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';
function menuItems(menu) {
  return menu ? Array.from(menu.querySelectorAll(ITEM_SELECTOR)) : [];
}
function setRef2(ref, value) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}
function usePhoneViewport(enabled) {
  const [phone, setPhone] = useState2(() => enabled && isPhoneViewport());
  useEffect3(() => {
    if (!enabled || typeof window.matchMedia !== "function") {
      setPhone(false);
      return;
    }
    const mq = window.matchMedia(PHONE_QUERY);
    const update = () => setPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [enabled]);
  return phone;
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
  sheetBelow = false,
  sheetTitle,
  className
}) {
  const [openState, setOpenState] = useState2(defaultOpen);
  const open = openProp ?? openState;
  const triggerRef = useRef2(null);
  const menuRef = useRef2(null);
  const menuId = useId3();
  const triggerId = useId3();
  const initial = useRef2("first");
  const asSheet = usePhoneViewport(sheetBelow === "sm");
  const pos = useAnchoredPosition(triggerRef, menuRef, open && !asSheet, side, align, 4);
  const onOpenChangeRef = useRef2(onOpenChange);
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
  useDismiss(open && !asSheet, menuRef, triggerRef, dismiss);
  useReturnFocus(open, menuRef, triggerRef);
  useEffect3(() => {
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
  }, [open, asSheet]);
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
  const menuProps = {
    ref: menuRef,
    id: menuId,
    role: "menu",
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabel ? void 0 : tp.id ?? triggerId,
    "aria-orientation": "vertical",
    tabIndex: -1,
    onKeyDown: onMenuKeyDown
  };
  return /* @__PURE__ */ jsxs4(Fragment, { children: [
    triggerEl,
    open && asSheet ? /* @__PURE__ */ jsx4(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx4(Drawer, { side: "bottom", size: "md", title: sheetTitle ?? "Menu", onClose: close, children: /* @__PURE__ */ jsx4(
      "div",
      {
        ...menuProps,
        className: cn(
          "-mx-5 -my-4 py-2 outline-none [&_[role=menuitem]]:min-h-12 [&_[role=menuitem]]:px-5 [&_[role=menuitem]]:text-sm",
          className
        ),
        children
      }
    ) }) }) : open ? createPortal(
      /* @__PURE__ */ jsx4(MenuContext.Provider, { value: { close }, children: /* @__PURE__ */ jsx4(
        "div",
        {
          ...menuProps,
          "data-side": pos?.side,
          style: floatingStyle(pos, {
            maxHeight: pos ? Math.min(pos.maxHeight, 384) : void 0,
            zIndex: "var(--nish-z-dropdown, 40)"
          }),
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
var ROW = "flex w-full select-none items-center gap-2 px-3 py-1.5 text-left text-xs outline-none transition-colors pointer-coarse:min-h-11 pointer-coarse:gap-3 pointer-coarse:text-sm";
function menuItemClass({ active = false, danger = false, disabled = false, className } = {}) {
  return cn(
    ROW,
    disabled ? "cursor-default text-th-ghost" : danger ? "text-th-loss hover:bg-th-loss-soft focus-visible:bg-th-loss-soft" : "text-th-hi2 hover:bg-th-overlay hover:text-th-hi focus-visible:bg-th-overlay focus-visible:text-th-hi",
    active && !disabled && !danger && "bg-th-overlay font-medium text-th-hi",
    className
  );
}
function MenuItem({ icon, trailing, danger = false, active = false, disabled = false, onSelect, className, children }) {
  const ctx = useContext(MenuContext);
  function select() {
    if (disabled) return;
    const ev = new Event("nish-menu-select", { cancelable: true });
    onSelect?.(ev);
    if (!ev.defaultPrevented) ctx?.close();
  }
  return /* @__PURE__ */ jsxs4(
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
        icon ? /* @__PURE__ */ jsx4("span", { className: cn("inline-flex shrink-0", danger || disabled ? "" : "text-th-hi3"), children: icon }) : null,
        /* @__PURE__ */ jsx4("span", { className: "min-w-0 flex-1 truncate", children }),
        trailing ? /* @__PURE__ */ jsx4("span", { className: cn("ml-auto inline-flex shrink-0 items-center", disabled ? "" : "text-th-hi2"), children: trailing }) : null
      ]
    }
  );
}
function MenuLabel({ children, className }) {
  return /* @__PURE__ */ jsx4("div", { role: "presentation", className: cn("px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-th-hi2", className), children });
}
function MenuSeparator({ className }) {
  return /* @__PURE__ */ jsx4("div", { role: "separator", className: cn("my-1 h-px bg-th-line", className) });
}
function MenuSubHeader({ onBack, children, className }) {
  return /* @__PURE__ */ jsxs4(
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
        /* @__PURE__ */ jsx4("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className: "shrink-0 text-th-hi3", children: /* @__PURE__ */ jsx4("path", { d: "m15 18-6-6 6-6" }) }),
        /* @__PURE__ */ jsx4("span", { className: "sr-only", children: "Back: " }),
        /* @__PURE__ */ jsx4("span", { className: "min-w-0 flex-1 truncate", children })
      ]
    }
  );
}

// src/components/command.tsx
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var MAX_RESULTS = 50;
function isWordStart(text, i) {
  return i === 0 || !/[a-z0-9]/i.test(text[i - 1]);
}
function matchText(text, q) {
  const at = text.indexOf(q);
  if (at >= 0) {
    let tier = at === 0 ? 0 : 2;
    let start = at;
    if (tier === 2) {
      for (let from2 = at; from2 >= 0; from2 = text.indexOf(q, from2 + 1)) {
        if (isWordStart(text, from2)) {
          tier = 1;
          start = from2;
          break;
        }
        if (from2 + 1 >= text.length) break;
      }
    }
    return { tier, idx: Array.from({ length: q.length }, (_, k) => start + k) };
  }
  const idx = [];
  let from = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, from);
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  return { tier: 3, idx };
}
function navigateFromLayer(href) {
  const inLayer = !!history.state?.nishLayer;
  if (!inLayer) {
    window.location.assign(href);
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    window.location.assign(href);
  };
  window.setTimeout(() => whenHistorySettled(go), 0);
  window.setTimeout(go, 400);
}
function rankItems(items2, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items2.slice(0, MAX_RESULTS).map((item) => ({ item, marks: [] }));
  const scored = [];
  items2.forEach((item, order) => {
    const label = matchText(item.label.toLowerCase(), q);
    if (label) {
      scored.push({ r: { item, marks: label.idx }, score: label.tier, order });
      return;
    }
    let best = null;
    for (const kw of item.keywords ?? []) {
      const m = matchText(kw.toLowerCase(), q);
      if (m && m.tier < 3 && (best === null || m.tier < best)) best = m.tier;
    }
    if (best !== null) scored.push({ r: { item, marks: [] }, score: 4 + best, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, MAX_RESULTS).map((s) => s.r);
}
function groupRows(rows) {
  const order = [];
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const g = r.item.group ?? null;
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g).push(r);
  }
  order.sort((a, b) => a === null ? -1 : b === null ? 1 : 0);
  let index = 0;
  return order.map((group) => ({ group, rows: map.get(group).map((r) => ({ r, index: index++ })) }));
}
function Highlighted({ text, marks }) {
  if (marks.length === 0) return /* @__PURE__ */ jsx5(Fragment2, { children: text });
  const set = new Set(marks);
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const on = set.has(i);
    let j = i;
    while (j < text.length && set.has(j) === on) j++;
    const chunk = text.slice(i, j);
    parts.push(
      on ? /* @__PURE__ */ jsx5("mark", { className: "bg-transparent font-semibold text-th-accent", children: chunk }, i) : /* @__PURE__ */ jsx5("span", { children: chunk }, i)
    );
    i = j;
  }
  return /* @__PURE__ */ jsx5(Fragment2, { children: parts });
}
function SearchIcon2({ size = 18 }) {
  return /* @__PURE__ */ jsxs5(
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
      children: [
        /* @__PURE__ */ jsx5("circle", { cx: "11", cy: "11", r: "8" }),
        /* @__PURE__ */ jsx5("path", { d: "m21 21-4.3-4.3" })
      ]
    }
  );
}
function isTypingTarget(t) {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}
function useCommandHotkey(open, enabled = true) {
  const ref = useRef3(open);
  ref.current = open;
  useEffect4(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.isComposing) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current();
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        ref.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled]);
}
function CommandPalette({
  open,
  onOpenChange,
  items: items2,
  placeholder = "Search\u2026",
  emptyText = "No results",
  hotkey = true,
  onQuery,
  footer,
  onSubmitQuery
}) {
  useCommandHotkey(() => {
    if (!open) onOpenChange(true);
  }, hotkey);
  if (!open) return null;
  return /* @__PURE__ */ jsx5(
    PaletteDialog,
    {
      onClose: () => onOpenChange(false),
      items: items2,
      placeholder,
      emptyText,
      onQuery,
      footer,
      onSubmitQuery
    }
  );
}
function PaletteDialog({ onClose, items: items2, placeholder, emptyText, onQuery, footer, onSubmitQuery }) {
  const uid = useId4();
  const listId = `${uid}-list`;
  const optionId = (i) => `${uid}-opt-${i}`;
  const inputRef = useRef3(null);
  const listRef = useRef3(null);
  const [query, setQuery] = useState3("");
  const [active, setActive] = useState3(0);
  const isFn = typeof items2 === "function";
  const itemsRef = useRef3(items2);
  itemsRef.current = items2;
  const [dynamic, setDynamic] = useState3([]);
  const [pending, setPending] = useState3(isFn);
  useEffect4(() => {
    const fn = itemsRef.current;
    if (typeof fn !== "function") return;
    let stale = false;
    let res;
    try {
      res = fn(query);
    } catch {
      res = [];
    }
    if (Array.isArray(res)) {
      setDynamic(res.slice(0, MAX_RESULTS));
      setPending(false);
      return;
    }
    setPending(true);
    res.then(
      (r) => {
        if (stale) return;
        setDynamic(r.slice(0, MAX_RESULTS));
        setPending(false);
      },
      () => {
        if (stale) return;
        setDynamic([]);
        setPending(false);
      }
    );
    return () => {
      stale = true;
    };
  }, [query, isFn]);
  const rows = useMemo(() => {
    if (isFn) return dynamic.map((item) => ({ item, marks: matchText(item.label.toLowerCase(), query.trim().toLowerCase())?.idx ?? [] }));
    return rankItems(items2, query);
  }, [isFn, dynamic, items2, query]);
  const groups = useMemo(() => groupRows(rows), [rows]);
  const flat = useMemo(() => groups.flatMap((g) => g.rows.map((x) => x.r.item)), [groups]);
  useEffect4(() => {
    inputRef.current?.focus();
  }, []);
  useEffect4(() => {
    setActive(0);
  }, [query, flat.length]);
  useEffect4(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const select = (item) => {
    onClose();
    if (item.href) {
      if (item.external) window.open(item.href, "_blank", "noopener,noreferrer");
      else navigateFromLayer(item.href);
    } else {
      item.onSelect?.();
    }
  };
  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === "Home" && flat.length && !query) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) select(item);
      else if (!pending && query.trim() && onSubmitQuery) {
        onClose();
        onSubmitQuery(query.trim());
      }
    }
  };
  const header = /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2 border-b border-th-line px-4 pb-2 sm:pt-1", children: [
    /* @__PURE__ */ jsx5("span", { className: "shrink-0 text-th-hi3", children: /* @__PURE__ */ jsx5(SearchIcon2, {}) }),
    /* @__PURE__ */ jsx5(
      "input",
      {
        ref: inputRef,
        type: "text",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": listId,
        "aria-autocomplete": "list",
        "aria-activedescendant": flat.length ? optionId(active) : void 0,
        "aria-label": placeholder.replace(/…$/, "") || "Search",
        value: query,
        placeholder,
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: false,
        enterKeyHint: flat.length ? "go" : "search",
        onChange: (e) => {
          setQuery(e.target.value);
          onQuery?.(e.target.value);
        },
        onKeyDown,
        className: "h-12 min-w-0 flex-1 bg-transparent text-base text-th-hi outline-none placeholder:text-th-hi3"
      }
    ),
    /* @__PURE__ */ jsx5(
      "button",
      {
        type: "button",
        onClick: onClose,
        "aria-label": "Close",
        className: "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi sm:hidden",
        children: /* @__PURE__ */ jsx5(XIcon, { size: 18 })
      }
    )
  ] });
  const showEmpty = flat.length === 0 && !pending;
  return /* @__PURE__ */ jsxs5(
    Modal,
    {
      onClose,
      header,
      "aria-label": "Search",
      placement: "top",
      sheetHeight: "full",
      footer,
      className: "sm:max-w-[560px]",
      children: [
        /* @__PURE__ */ jsx5("div", { "aria-live": "polite", className: "sr-only", children: showEmpty ? emptyText : `${flat.length} result${flat.length === 1 ? "" : "s"}` }),
        /* @__PURE__ */ jsxs5(
          "div",
          {
            ref: listRef,
            id: listId,
            role: "listbox",
            "aria-label": "Results",
            "aria-busy": pending,
            className: "-mx-2",
            onMouseDown: (e) => e.preventDefault(),
            children: [
              groups.map((g, gi) => {
                const headId = `${uid}-g-${gi}`;
                return /* @__PURE__ */ jsxs5("div", { role: "group", "aria-labelledby": g.group ? headId : void 0, children: [
                  g.group ? /* @__PURE__ */ jsx5("div", { id: headId, className: "px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-th-hi3", children: g.group }) : null,
                  g.rows.map(({ r, index }) => /* @__PURE__ */ jsxs5(
                    "div",
                    {
                      id: optionId(index),
                      role: "option",
                      "aria-selected": index === active,
                      onMouseMove: () => index !== active && setActive(index),
                      onClick: () => select(r.item),
                      className: cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-th-hi2",
                        index === active && "bg-th-elevated text-th-hi"
                      ),
                      children: [
                        r.item.icon ? /* @__PURE__ */ jsx5("span", { className: "inline-flex shrink-0 items-center text-th-hi3", children: r.item.icon }) : null,
                        /* @__PURE__ */ jsx5("span", { className: "min-w-0 flex-1 truncate", children: /* @__PURE__ */ jsx5(Highlighted, { text: r.item.label, marks: r.marks }) }),
                        r.item.hint ? /* @__PURE__ */ jsx5("span", { className: "max-w-[40%] shrink-0 truncate text-xs text-th-hi3", children: r.item.hint }) : null,
                        r.item.external ? /* @__PURE__ */ jsx5("span", { className: "shrink-0 text-xs text-th-hi3", "aria-label": "opens in a new tab", children: "\u2197" }) : null
                      ]
                    },
                    r.item.id
                  ))
                ] }, g.group ?? "__none");
              }),
              showEmpty ? /* @__PURE__ */ jsx5("div", { className: "px-3 py-8 text-center text-sm text-th-hi3", children: emptyText }) : null
            ]
          }
        )
      ]
    }
  );
}

// src/components/theme-toggle.tsx
import { useEffect as useEffect6, useState as useState5 } from "react";

// src/components/segmented.tsx
import { useEffect as useEffect5, useId as useId5, useRef as useRef4, useState as useState4 } from "react";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
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
function Segmented({ label, options, value, onChange, size = "sm", block = false, overflow = "scroll", fullWidth = false, className }) {
  const fill = block || fullWidth;
  const scroll = overflow === "scroll";
  const groupRef = useRef4(null);
  useScrollEdges(groupRef);
  const refs = useRef4([]);
  const tipAnchor = useRef4(null);
  const [tipAt, setTipAt] = useState4(null);
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
  useEffect5(() => {
    const el = selected >= 0 ? refs.current[selected] : null;
    if (scroll && el && groupRef.current) revealInRow(groupRef.current, el);
  }, [selected, scroll, options.length]);
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
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      ref: groupRef,
      role: "radiogroup",
      "aria-label": label,
      className: cn(
        "rounded-lg border border-th-line bg-th-elevated p-0.5",
        fill ? "flex w-full" : "inline-flex",
        scroll && "max-w-full overflow-x-auto nish-no-scrollbar nish-scroll-fade",
        className
      ),
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
          return /* @__PURE__ */ jsx6(
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
                fill && (scroll ? "flex-1 shrink-0" : "min-w-0 flex-1"),
                scroll && !fill && "shrink-0",
                SIZE2[size],
                on ? SELECTED[o.tone ?? "accent"] : "text-th-hi2 hover:text-th-hi disabled:hover:text-th-ghost"
              ),
              children: o.label
            },
            o.value
          );
        }),
        tipAt != null && options[tipAt]?.tip != null ? /* @__PURE__ */ jsx6(FloatingTip, { anchor: tipAnchor, id: tipId, tip: options[tipAt].tip }, tipAt) : null
      ]
    }
  );
}

// src/components/theme-toggle.tsx
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function useTheme() {
  const [state, setState] = useState5(() => {
    const choice = typeof document === "undefined" ? "system" : getThemeChoice();
    return { choice, theme: typeof document === "undefined" ? "dark" : resolveTheme(choice) };
  });
  useEffect6(() => onThemeChange((choice, theme) => setState({ choice, theme })), []);
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
  collapse = "sm",
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
      return /* @__PURE__ */ jsxs7(
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
            /* @__PURE__ */ jsx7(Icon, { size: 16 }),
            labels ? /* @__PURE__ */ jsx7("span", { "aria-hidden": "true", children: nameOf(mode ? choice : theme) }) : null
          ]
        }
      );
    }
    return /* @__PURE__ */ jsx7(IconButton, { label: text, size: size === "md" ? "md" : "sm", "data-choice": choice, onClick: () => setChoice(next), className, children: /* @__PURE__ */ jsx7(Icon, { size: size === "md" ? 16 : 14 }) });
  }
  const options = MODES.map(({ id, label, Icon }) => ({
    value: id,
    label: labels ? /* @__PURE__ */ jsxs7(Fragment3, { children: [
      /* @__PURE__ */ jsx7(Icon, { size: 14 }),
      label
    ] }) : /* @__PURE__ */ jsx7(Icon, { size: 14 }),
    ariaLabel: labels ? void 0 : label,
    title: labels ? void 0 : label
  }));
  const twin = collapse === "sm" && phone === "compact" && !block;
  const group = /* @__PURE__ */ jsxs7("div", { className: cn("items-center gap-2", block ? "flex w-full" : "inline-flex", className, twin && "max-sm:hidden"), children: [
    /* @__PURE__ */ jsx7(
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
    presets ? /* @__PURE__ */ jsxs7(
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
          /* @__PURE__ */ jsx7("option", { value: "", children: "Preset\u2026" }),
          extra2.map((p) => /* @__PURE__ */ jsx7("option", { value: p.id, children: p.label }, p.id))
        ]
      }
    ) : null
  ] });
  if (!twin) return group;
  return /* @__PURE__ */ jsxs7(Fragment3, { children: [
    /* @__PURE__ */ jsx7(ThemeToggle, { compact: true, size, className: cn(className, "sm:hidden") }),
    group
  ] });
}

// src/components/nav.tsx
import { Fragment as Fragment5, jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var MAX_QUERY = {
  md: "(max-width: 767px)",
  lg: "(max-width: 1023px)"
};
var HIDE_FROM = { md: "md:hidden", lg: "lg:hidden" };
var RAIL_SHOW = { sm: "sm:flex", md: "md:flex", lg: "lg:flex" };
var RAIL_HIDE = { md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden" };
function useMatches(query) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {
      };
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches,
    () => false
  );
}
function CountBadge({ value }) {
  if (value === void 0 || value === false || value === 0) return null;
  if (value === true) {
    return /* @__PURE__ */ jsx8("span", { "aria-hidden": "true", className: "absolute -right-0.5 -top-0.5 size-2 rounded-full bg-th-loss ring-2 ring-th-surface" });
  }
  return /* @__PURE__ */ jsx8(
    "span",
    {
      "aria-label": `${value} new`,
      className: "absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-th-loss px-1 text-[10px] font-semibold leading-none tabular-nums text-th-on-loss ring-2 ring-th-surface",
      children: value > 99 ? "99+" : value
    }
  );
}
var layerOf = () => history.state?.nishLayer;
function closeAfterRouterLink(onAfter) {
  const layer = layerOf();
  if (typeof window === "undefined" || !layer) {
    onAfter();
    return;
  }
  let decided = false;
  const decide = (routerTookIt) => {
    if (decided) return;
    decided = true;
    window.removeEventListener("click", onWindowClick);
    if (!routerTookIt) {
      onAfter();
      return;
    }
    const t0 = Date.now();
    const wait = () => {
      if (layerOf() !== layer || Date.now() - t0 > 3e3) onAfter();
      else window.setTimeout(wait, 16);
    };
    wait();
  };
  const onWindowClick = (e) => decide(e.defaultPrevented);
  window.addEventListener("click", onWindowClick);
  window.setTimeout(() => decide(true), 0);
}
function renderItem(item, className, children, renderLink, onAfter) {
  const current = item.active ? "page" : void 0;
  if (item.href != null) {
    if (renderLink) {
      return renderLink(item, {
        className,
        children,
        "aria-current": current,
        ...onAfter ? { replace: true } : {},
        onClick: () => {
          item.onSelect?.();
          if (onAfter) closeAfterRouterLink(onAfter);
        }
      });
    }
    return /* @__PURE__ */ jsx8(
      "a",
      {
        href: item.href,
        className,
        "aria-current": current,
        onClick: (e) => {
          item.onSelect?.();
          const inLayer = !!history.state?.nishLayer;
          const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
          if (onAfter && inLayer && plain) {
            e.preventDefault();
            onAfter();
            navigateFromLayer(item.href);
            return;
          }
          onAfter?.();
        },
        children
      }
    );
  }
  return /* @__PURE__ */ jsx8(
    "button",
    {
      type: "button",
      className,
      "aria-current": current,
      onClick: () => {
        item.onSelect?.();
        onAfter?.();
      },
      children
    }
  );
}
var FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent";
function MoreDots() {
  return /* @__PURE__ */ jsxs8("svg", { width: 22, height: 22, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ jsx8("circle", { cx: "5", cy: "12", r: "1.8" }),
    /* @__PURE__ */ jsx8("circle", { cx: "12", cy: "12", r: "1.8" }),
    /* @__PURE__ */ jsx8("circle", { cx: "19", cy: "12", r: "1.8" })
  ] });
}
function BottomNav({ items: items2, more, trailing, hideFrom = "md", label = "Sections", renderLink, className }) {
  const ref = useRef5(null);
  const visible = useMatches(MAX_QUERY[hideFrom]);
  useHeightVar(ref, "--nish-bottom-nav-h", visible);
  const pill = (active) => cn(
    "flex w-full flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] leading-tight transition-colors",
    active ? "bg-th-accent-soft font-medium text-th-accent" : "text-th-hi3"
  );
  const cell = cn("flex min-h-14 min-w-0 flex-1 items-center justify-center px-0.5 pointer-coarse:active:scale-[0.97] transition-transform", FOCUS);
  return /* @__PURE__ */ jsxs8(
    "nav",
    {
      ref,
      "aria-label": label,
      className: cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-th-line bg-th-surface pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        HIDE_FROM[hideFrom],
        className
      ),
      children: [
        items2.map((item) => /* @__PURE__ */ jsx8(Fragment4, { children: renderItem(
          item,
          cell,
          /* @__PURE__ */ jsxs8("span", { className: pill(!!item.active), children: [
            /* @__PURE__ */ jsxs8("span", { className: "relative inline-flex size-6 items-center justify-center", children: [
              item.icon,
              /* @__PURE__ */ jsx8(CountBadge, { value: item.badge })
            ] }),
            /* @__PURE__ */ jsx8("span", { className: "max-w-full truncate px-1", children: item.label })
          ] }),
          renderLink
        ) }, item.key)),
        more ? /* @__PURE__ */ jsx8("button", { type: "button", "aria-expanded": more.expanded, "aria-haspopup": "dialog", onClick: more.onToggle, className: cell, children: /* @__PURE__ */ jsxs8("span", { className: pill(more.active || more.expanded), children: [
          /* @__PURE__ */ jsx8("span", { className: "inline-flex size-6 items-center justify-center", children: more.icon ?? /* @__PURE__ */ jsx8(MoreDots, {}) }),
          /* @__PURE__ */ jsx8("span", { className: "max-w-full truncate px-1", children: more.label ?? "More" })
        ] }) }) : null,
        trailing ? /* @__PURE__ */ jsxs8(Fragment5, { children: [
          /* @__PURE__ */ jsx8("span", { "aria-hidden": "true", className: "my-2 w-px shrink-0 bg-th-line" }),
          /* @__PURE__ */ jsx8("div", { className: "flex shrink-0 items-center justify-center px-1", children: trailing })
        ] }) : null
      ]
    }
  );
}
function MoreSheet({ open, onClose, items: items2, title = "More", footer, renderLink }) {
  if (!open) return null;
  const row = (active) => cn(
    "flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 text-left transition-colors",
    active ? "bg-th-accent-soft text-th-accent" : "text-th-hi hover:bg-th-elevated",
    FOCUS
  );
  return /* @__PURE__ */ jsx8(
    Drawer,
    {
      side: "bottom",
      title,
      onClose,
      bottomOffset: "var(--nish-bottom-nav-h, 0px)",
      footer: footer ?? /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between gap-3 px-5 py-3", children: [
        /* @__PURE__ */ jsx8("span", { className: "text-sm font-medium text-th-hi", children: "Theme" }),
        /* @__PURE__ */ jsx8(ThemeToggle, { phone: "segmented" })
      ] }),
      children: /* @__PURE__ */ jsx8("ul", { className: "m-0 list-none p-2", children: items2.map((item) => /* @__PURE__ */ jsx8("li", { children: renderItem(
        item,
        row(!!item.active),
        /* @__PURE__ */ jsxs8(Fragment5, { children: [
          /* @__PURE__ */ jsxs8("span", { className: "relative inline-flex size-6 shrink-0 items-center justify-center", children: [
            item.icon,
            /* @__PURE__ */ jsx8(CountBadge, { value: item.badge })
          ] }),
          /* @__PURE__ */ jsxs8("span", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx8("span", { className: "block truncate text-sm font-medium", children: item.label }),
            item.hint ? /* @__PURE__ */ jsx8("span", { className: cn("block truncate text-xs", item.active ? "text-th-accent/80" : "text-th-hi3"), children: item.hint }) : null
          ] })
        ] }),
        renderLink,
        onClose
      ) }, item.key)) })
    }
  );
}
function NavRail({ items: items2, tools, footer, showFrom = "md", hideFrom = "lg", label = "Sections", renderLink, className }) {
  return /* @__PURE__ */ jsxs8(
    "nav",
    {
      "aria-label": label,
      className: cn(
        "hidden w-[72px] shrink-0 flex-col items-center gap-1 border-r border-th-line bg-th-surface py-3 pl-[env(safe-area-inset-left)]",
        RAIL_SHOW[showFrom],
        hideFrom ? RAIL_HIDE[hideFrom] : null,
        className
      ),
      children: [
        items2.map((item) => {
          const node = renderItem(
            item,
            cn("group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] leading-tight", FOCUS, item.active ? "font-medium text-th-accent" : "text-th-hi3 hover:text-th-hi"),
            /* @__PURE__ */ jsxs8(Fragment5, { children: [
              /* @__PURE__ */ jsxs8(
                "span",
                {
                  className: cn(
                    "relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    item.active ? "bg-th-accent-soft" : "group-hover:bg-th-elevated"
                  ),
                  children: [
                    item.icon,
                    /* @__PURE__ */ jsx8(CountBadge, { value: item.badge })
                  ]
                }
              ),
              /* @__PURE__ */ jsx8("span", { className: "max-w-full truncate px-1", children: item.label })
            ] }),
            renderLink
          );
          return item.hint ? /* @__PURE__ */ jsx8(Tooltip, { tip: item.hint, side: "right", focusable: false, className: "block w-full", children: node }, item.key) : /* @__PURE__ */ jsx8("span", { className: "block w-full", children: node }, item.key);
        }),
        tools ? /* @__PURE__ */ jsxs8(Fragment5, { children: [
          /* @__PURE__ */ jsx8("span", { "aria-hidden": "true", className: "my-1 h-px w-8 bg-th-line" }),
          tools
        ] }) : null,
        footer ? /* @__PURE__ */ jsx8("div", { className: "mt-auto flex flex-col items-center gap-2 pt-3", children: footer }) : null
      ]
    }
  );
}
function revealInRow(scroller, child) {
  const s = scroller.getBoundingClientRect();
  const c = child.getBoundingClientRect();
  const pad = 8;
  if (c.left < s.left + pad) scroller.scrollLeft += c.left - s.left - pad;
  else if (c.right > s.right - pad) scroller.scrollLeft += c.right - s.right + pad;
}
var ACTIVE_SELECTOR = '[aria-pressed="true"],[aria-selected="true"],[aria-current]:not([aria-current="false"]),[aria-checked="true"]';
function ScrollRow({ children, bleed = false, fade = true, snap = false, as = "div", label, className }) {
  const ref = useRef5(null);
  useScrollEdges(ref);
  const lastActive = useRef5(null);
  useEffect7(() => {
    const active = ref.current?.querySelector(ACTIVE_SELECTOR) ?? null;
    if (active && active !== lastActive.current) {
      revealInRow(ref.current, active);
    }
    lastActive.current = active;
  });
  return createElement(
    as,
    {
      ref,
      "aria-label": label,
      className: cn(
        "flex gap-2 overflow-x-auto nish-no-scrollbar",
        fade && "nish-scroll-fade",
        bleed && "-mx-[var(--nish-page-gutter)] px-[var(--nish-page-gutter)]",
        snap && "snap-x snap-mandatory [&>*]:snap-start",
        className
      )
    },
    children
  );
}
function useScrollSpy(ids, { rootMargin = "-45% 0px -50% 0px" } = {}) {
  const [active, setActive] = useState6(ids[0] ?? null);
  const key = ids.join("\0");
  useEffect7(() => {
    const list = key ? key.split("\0") : [];
    setActive((cur) => cur != null && list.includes(cur) ? cur : list[0] ?? null);
    if (!list.length || typeof IntersectionObserver === "undefined") return;
    const inBand = /* @__PURE__ */ new Set();
    const io = new IntersectionObserver(
      (entries) => {
        let entered = null;
        for (const e of entries) {
          const id = e.target.id;
          if (e.isIntersecting) {
            inBand.add(id);
            entered = id;
          } else {
            inBand.delete(id);
          }
        }
        if (entered) {
          setActive(entered);
        } else {
          setActive((cur) => {
            if (cur != null && inBand.has(cur)) return cur;
            const still = list.filter((id) => inBand.has(id));
            return still.length ? still[still.length - 1] : cur;
          });
        }
      },
      { rootMargin }
    );
    const seen = /* @__PURE__ */ new Set();
    let mo = null;
    const attach = () => {
      for (const id of list) {
        if (seen.has(id)) continue;
        const el = document.getElementById(id);
        if (el) {
          seen.add(id);
          io.observe(el);
        }
      }
      if (seen.size === list.length && mo) {
        mo.disconnect();
        mo = null;
      }
    };
    attach();
    if (seen.size < list.length && typeof MutationObserver !== "undefined") {
      mo = new MutationObserver(attach);
      mo.observe(document.body, { childList: true, subtree: true });
    }
    const onScroll = () => {
      if (window.scrollY < 8) setActive(list[0]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      mo?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [key, rootMargin]);
  return active;
}
function SectionNav({ items: items2, sticky = true, onSelect, updateHash = true, label = "Sections", className }) {
  const ref = useRef5(null);
  const spy = useScrollSpy(items2.map((i) => i.id));
  const [locked, setLocked] = useState6(null);
  const active = locked ?? spy;
  useEffect7(() => {
    if (locked == null) return;
    const release = () => setLocked(null);
    const onKey = (e) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) release();
    };
    let settled = false;
    const settle = () => {
      settled = true;
    };
    let t = setTimeout(settle, 400);
    const onScroll = () => {
      if (settled) {
        release();
        return;
      }
      clearTimeout(t);
      t = setTimeout(settle, 200);
    };
    const onScrollEnd = () => {
      clearTimeout(t);
      t = setTimeout(settle, 50);
    };
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchstart", release, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      clearTimeout(t);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchstart", release);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [locked]);
  useHeightVar(ref, "--nish-sticky-extra", sticky);
  const go = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLocked(id);
    el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    if (updateHash) {
      try {
        history.replaceState(history.state, "", `#${id}`);
      } catch {
      }
    }
    onSelect?.(id);
  };
  return /* @__PURE__ */ jsx8(
    "nav",
    {
      ref,
      "aria-label": label,
      style: sticky ? { top: "var(--nish-header-h, 0px)" } : void 0,
      className: cn("z-20 border-b border-th-line bg-th-bg py-2", sticky && "sticky", className),
      children: /* @__PURE__ */ jsx8(ScrollRow, { bleed: true, children: items2.map((item) => {
        const on = item.id === active;
        return /* @__PURE__ */ jsxs8(
          "button",
          {
            type: "button",
            "aria-current": on ? "true" : void 0,
            onClick: () => go(item.id),
            className: chipClass({ pressed: on, className: "shrink-0 whitespace-nowrap" }),
            children: [
              item.icon,
              item.label,
              item.count != null ? /* @__PURE__ */ jsx8("span", { className: "tabular-nums text-th-hi3", children: item.count }) : null
            ]
          },
          item.id
        );
      }) })
    }
  );
}

// src/components/tabs.tsx
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var BREAKPOINT_QUERY = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)"
};
function useBreakpoint(bp) {
  const query = bp ? BREAKPOINT_QUERY[bp] : null;
  return useSyncExternalStore2(
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
function ScrollingList({ selected, children, ...rest }) {
  const ref = useRef6(null);
  useScrollEdges(ref);
  useEffect8(() => {
    const el = selected >= 0 ? ref.current?.children[selected] : null;
    if (el && ref.current) revealInRow(ref.current, el);
  }, [selected]);
  return /* @__PURE__ */ jsx9("div", { ref, ...rest, children });
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
var Ctx = createContext2(null);
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
  const auto = useId6();
  const wide = useBreakpoint(hideFrom);
  const base = idBase ?? auto.replace(/:/g, "");
  const refs = useRef6([]);
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
  const list = /* @__PURE__ */ jsx9(
    ScrollingList,
    {
      selected,
      role: "tablist",
      "aria-label": label,
      className: cn(
        "flex max-w-full items-end overflow-x-auto nish-no-scrollbar nish-scroll-fade",
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
        return /* @__PURE__ */ jsxs9(
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
              /* @__PURE__ */ jsxs9("span", { className: "inline-flex items-center gap-1.5", children: [
                t.label,
                t.count != null ? /* @__PURE__ */ jsx9(Badge, { tone: on ? "accent" : "neutral", size: "xs", className: "tabular-nums", children: t.count }) : null
              ] }),
              t.sub != null ? /* @__PURE__ */ jsx9("span", { className: "text-xs font-normal text-th-hi3", children: t.sub }) : null
            ]
          },
          t.value
        );
      })
    }
  );
  if (children == null) return wide ? null : list;
  return /* @__PURE__ */ jsxs9(Ctx.Provider, { value: { idBase: base, value }, children: [
    wide ? null : list,
    children
  ] });
}
function TabPanel({ value, idBase, active, showFrom, keepMounted = false, children, className, ...rest }) {
  const ctx = useContext2(Ctx);
  const wide = useBreakpoint(showFrom);
  const base = idBase ?? ctx?.idBase ?? "";
  const shown = active ?? ctx?.value === value;
  if (wide) {
    return /* @__PURE__ */ jsx9("div", { className, ...rest, children });
  }
  return /* @__PURE__ */ jsx9(
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
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
function Skeleton({
  className,
  style
}) {
  return /* @__PURE__ */ jsx10("div", { "aria-hidden": "true", className: cn("nish-skeleton rounded-md", className), style });
}
function SkeletonRows({ rows = 5, height = 56, gap = "md", label = "Loading", className, rowClassName }) {
  return /* @__PURE__ */ jsx10("div", { role: "status", "aria-label": label, className: cn("grid", gap === "sm" ? "gap-1.5" : "gap-2.5", className), children: Array.from({ length: rows }, (_, i) => /* @__PURE__ */ jsx10(Skeleton, { className: cn("w-full rounded-xl", rowClassName), style: rowClassName && /\bh-/.test(rowClassName) ? void 0 : { height } }, i)) });
}
var SPINNER_SIZE = { xs: 12, sm: 14, md: 16, lg: 24 };
function Spinner({ size = "md", label, className }) {
  if (!label) return /* @__PURE__ */ jsx10(LoaderIcon, { size: SPINNER_SIZE[size], className: cn("shrink-0 animate-spin", className) });
  return /* @__PURE__ */ jsx10("span", { role: "status", className: cn("inline-flex shrink-0 items-center", className), children: /* @__PURE__ */ jsx10(LoaderIcon, { size: SPINNER_SIZE[size], className: "animate-spin", role: "img", "aria-hidden": false, "aria-label": label }) });
}
function SkeletonLines({
  lines = 3,
  className
}) {
  return /* @__PURE__ */ jsxs10("div", { className: cn("flex flex-col gap-2.5 p-3", className), "aria-busy": "true", "aria-label": "Loading", children: [
    /* @__PURE__ */ jsx10(Skeleton, { className: "h-4 w-2/5" }),
    Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx10(Skeleton, { className: cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5") }, i))
  ] });
}
function SkeletonCard({ lines = 3, media = "none", className }) {
  return /* @__PURE__ */ jsxs10("div", { "aria-hidden": "true", className: cn(cardClass({ padding: "md" }), "flex flex-col gap-3", className), children: [
    media === "square" ? /* @__PURE__ */ jsx10(Skeleton, { className: "size-24 rounded-lg" }) : null,
    media === "wide" ? /* @__PURE__ */ jsx10(Skeleton, { className: "aspect-video w-full rounded-lg" }) : null,
    /* @__PURE__ */ jsx10(Skeleton, { className: "h-4 w-2/5" }),
    /* @__PURE__ */ jsx10("div", { className: "flex flex-col gap-2", children: Array.from({ length: lines }, (_, i) => /* @__PURE__ */ jsx10(Skeleton, { className: cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5") }, i)) })
  ] });
}
function StatGridSkeleton({ count = 4, className }) {
  return /* @__PURE__ */ jsx10("div", { role: "status", "aria-label": "Loading", className: cn("grid grid-cols-2 gap-3 md:grid-cols-4", className), children: Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsxs10("div", { className: cn(cardClass({ padding: "sm" }), "min-w-0"), children: [
    /* @__PURE__ */ jsx10(Skeleton, { className: "h-3 w-16" }),
    /* @__PURE__ */ jsx10(Skeleton, { className: "mt-2 h-7 w-24" }),
    /* @__PURE__ */ jsx10(Skeleton, { className: "mt-1.5 h-3 w-12" })
  ] }, i)) });
}
function CardListSkeleton({ count = 3, lines = 2, className }) {
  return /* @__PURE__ */ jsx10("div", { role: "status", "aria-label": "Loading", className: cn("grid gap-2.5", className), children: Array.from({ length: count }, (_, i) => /* @__PURE__ */ jsx10(SkeletonCard, { lines }, i)) });
}
function EmptyState({ icon, title, detail, action, compact = false, className }) {
  return /* @__PURE__ */ jsxs10(
    "div",
    {
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-1.5 p-4" : "gap-2 rounded-xl border border-dashed border-th-line px-6 py-12",
        className
      ),
      children: [
        icon ? /* @__PURE__ */ jsx10("span", { className: "text-th-ghost [&>svg]:size-7", children: icon }) : null,
        /* @__PURE__ */ jsx10("p", { className: cn("font-medium text-th-hi2", compact ? "text-xs" : "text-sm"), children: title }),
        detail ? /* @__PURE__ */ jsx10("p", { className: "max-w-sm text-xs text-th-hi3", children: detail }) : null,
        action ? /* @__PURE__ */ jsx10("div", { className: "mt-2", children: action }) : null
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
  return /* @__PURE__ */ jsxs10(
    "div",
    {
      role: "alert",
      className: cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "h-full gap-2 p-4" : "gap-2 rounded-xl border border-th-loss/30 bg-th-loss-soft px-6 py-10",
        className
      ),
      children: [
        /* @__PURE__ */ jsx10(AlertTriangleIcon, { size: compact ? 16 : 22, className: "shrink-0 text-th-loss" }),
        /* @__PURE__ */ jsx10("p", { className: cn("max-w-md text-th-hi2", compact ? "text-xs" : "text-sm"), children: message }),
        onRetry ? /* @__PURE__ */ jsxs10(
          "button",
          {
            type: "button",
            onClick: onRetry,
            disabled: retrying,
            className: "mt-1 inline-flex items-center gap-1.5 rounded-full border border-th-line-strong px-3 py-1 text-xs text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi disabled:opacity-50 pointer-coarse:min-h-11",
            children: [
              retrying ? /* @__PURE__ */ jsx10(LoaderIcon, { size: 12, className: "animate-spin" }) : /* @__PURE__ */ jsx10(RotateIcon, { size: 12 }),
              "Retry"
            ]
          }
        ) : null
      ]
    }
  );
}

// src/components/toast.tsx
import { useEffect as useEffect9, useRef as useRef7, useState as useState7, useSyncExternalStore as useSyncExternalStore3 } from "react";
import { createPortal as createPortal2 } from "react-dom";
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
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
  return useSyncExternalStore3(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => items,
    () => items
  );
}
var TONE = {
  success: { icon: /* @__PURE__ */ jsx11(CheckCircleIcon, { size: 15, className: "text-th-ok" }), className: "border-th-ok/35" },
  error: { icon: /* @__PURE__ */ jsx11(AlertTriangleIcon, { size: 15, className: "text-th-loss" }), className: "border-th-loss/40" },
  warn: { icon: /* @__PURE__ */ jsx11(AlertTriangleIcon, { size: 15, className: "text-th-warn" }), className: "border-th-warn/40" },
  info: { icon: /* @__PURE__ */ jsx11(InfoIcon, { size: 15, className: "text-th-accent" }), className: "border-th-line-strong" }
};
var DESKTOP_BOTTOM = {
  sm: "sm:bottom-0 sm:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]",
  md: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] md:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]",
  lg: "sm:bottom-0 sm:pb-[var(--nish-toast-offset,calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem)))] lg:pb-[calc(var(--nish-bottom-inset,0px)+1.25rem+min(var(--nish-bottom-bar-h,0px),1rem))]"
};
function Toaster({ className, offset, offsetUntil = "md" }) {
  const list = useToasts();
  const [polite, setPolite] = useState7({ text: "", seq: 0 });
  const [assertive, setAssertive] = useState7({ text: "", seq: 0 });
  const announced = useRef7(/* @__PURE__ */ new Set());
  const timers2 = useRef7({
    queue: { polite: [], assertive: [] },
    flush: {},
    clear: {}
  });
  useEffect9(() => {
    const t = timers2.current;
    for (const item of list) {
      if (announced.current.has(item.id)) continue;
      announced.current.add(item.id);
      const text = item.body ? `${item.title}. ${item.body}` : item.title;
      t.queue[item.tone === "error" ? "assertive" : "polite"].push(text);
    }
    for (const kind of ["polite", "assertive"]) {
      if (t.queue[kind].length === 0 || t.flush[kind] !== void 0) continue;
      const write = kind === "assertive" ? setAssertive : setPolite;
      t.flush[kind] = setTimeout(() => {
        t.flush[kind] = void 0;
        const text = t.queue[kind].join(". ");
        t.queue[kind] = [];
        write((p) => ({ text, seq: p.seq + 1 }));
        clearTimeout(t.clear[kind]);
        t.clear[kind] = setTimeout(() => write((p) => ({ text: "", seq: p.seq + 1 })), 5e3);
      }, 100);
    }
    const live = new Set(list.map((i) => i.id));
    announced.current.forEach((id) => {
      if (!live.has(id)) announced.current.delete(id);
    });
  }, [list]);
  useEffect9(() => {
    const t = timers2.current;
    return () => {
      clearTimeout(t.flush.polite);
      clearTimeout(t.flush.assertive);
      t.flush = {};
      t.queue = { polite: [], assertive: [] };
      clearTimeout(t.clear.polite);
      clearTimeout(t.clear.assertive);
    };
  }, []);
  if (typeof document === "undefined") return null;
  const style = offset ? { "--nish-toast-offset": offset } : void 0;
  return createPortal2(
    /* @__PURE__ */ jsxs11(
      "div",
      {
        style,
        "data-nish-keep-active": "",
        className: cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-3",
          "pb-[var(--nish-toast-offset,max(calc(var(--nish-bottom-inset,0px)+8px),calc(12px+env(safe-area-inset-bottom))))]",
          "max-sm:[html[data-nish-layer-open]_&]:bottom-auto max-sm:[html[data-nish-layer-open]_&]:top-[max(12px,env(safe-area-inset-top))] max-sm:[html[data-nish-layer-open]_&]:pb-0",
          "sm:inset-x-auto sm:right-5 sm:w-96 sm:items-stretch sm:px-0",
          DESKTOP_BOTTOM[offsetUntil],
          className
        ),
        children: [
          /* @__PURE__ */ jsx11("div", { role: "status", "aria-live": "polite", "aria-atomic": "true", className: "sr-only", children: /* @__PURE__ */ jsx11("span", { children: polite.text }, polite.seq) }),
          /* @__PURE__ */ jsx11("div", { role: "alert", "aria-live": "assertive", "aria-atomic": "true", className: "sr-only", children: /* @__PURE__ */ jsx11("span", { children: assertive.text }, assertive.seq) }),
          list.map((t) => /* @__PURE__ */ jsx11(ToastCard, { t }, t.id))
        ]
      }
    ),
    document.body
  );
}
var SWIPE_DISMISS_FRACTION = 0.35;
var SWIPE_DISMISS_VELOCITY = 0.5;
var SWIPE_SLOP = 8;
function ToastCard({ t }) {
  const ref = useRef7(null);
  const drag = useRef7(null);
  const setOffset = (dx, width) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = dx === 0 ? "" : `translateX(${dx}px)`;
    el.style.opacity = dx === 0 ? "" : String(Math.max(0, 1 - Math.abs(dx) / width));
  };
  const onDown = (e) => {
    if (e.pointerType === "mouse") return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: e.timeStamp, velocity: 0, active: false };
  };
  const onMove = (e) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < SWIPE_SLOP || Math.abs(dx) < Math.abs(e.clientY - d.startY)) return;
      d.active = true;
      el.setPointerCapture(e.pointerId);
      pauseTimer(t.id);
    }
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    setOffset(dx, el.offsetWidth);
  };
  const onUp = (e) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el || d.pointerId !== e.pointerId || !d.active) return;
    const dx = e.clientX - d.startX;
    const width = el.offsetWidth;
    const flung = Math.abs(d.velocity) > SWIPE_DISMISS_VELOCITY && Math.sign(d.velocity) === Math.sign(dx);
    if (Math.abs(dx) > width * SWIPE_DISMISS_FRACTION || flung) {
      dismissToast(t.id);
      return;
    }
    el.style.transition = "transform 160ms var(--nish-ease-out), opacity 160ms var(--nish-ease-out)";
    setOffset(0, width);
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transition = "";
    }, 180);
    resumeTimer(t.id);
  };
  const onCancel = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active || d.pointerId !== e.pointerId) return;
    setOffset(0, ref.current?.offsetWidth || 1);
    resumeTimer(t.id);
  };
  const leave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) resumeTimer(t.id);
  };
  const enter = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) pauseTimer(t.id);
  };
  return /* @__PURE__ */ jsxs11(
    "div",
    {
      ref,
      onPointerDown: onDown,
      onPointerMove: onMove,
      onPointerUp: onUp,
      onPointerCancel: onCancel,
      onPointerEnter: (e) => e.pointerType === "mouse" && pauseTimer(t.id),
      onPointerLeave: (e) => e.pointerType === "mouse" && resumeTimer(t.id),
      onFocus: enter,
      onBlur: leave,
      className: cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border bg-th-elevated px-3.5 py-3 shadow-pop",
        "touch-pan-y animate-[nish-rise-in_160ms_var(--nish-ease-out)]",
        "max-sm:[html[data-nish-layer-open]_&]:animate-[nish-toast-in-top_200ms_var(--nish-ease-out)]",
        TONE[t.tone].className
      ),
      children: [
        /* @__PURE__ */ jsx11("span", { className: "mt-0.5 shrink-0", children: TONE[t.tone].icon }),
        /* @__PURE__ */ jsxs11("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx11("p", { className: "text-sm font-medium leading-snug text-th-hi", children: t.title }),
          t.body ? /* @__PURE__ */ jsx11("p", { className: "mt-0.5 break-words text-xs leading-snug text-th-hi2", children: t.body }) : null
        ] }),
        t.action ? /* @__PURE__ */ jsx11(
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
        /* @__PURE__ */ jsx11(
          "button",
          {
            type: "button",
            onClick: () => dismissToast(t.id),
            "aria-label": "Dismiss",
            className: "-m-1 inline-flex shrink-0 items-center justify-center rounded-md p-1 text-th-hi3 transition-colors hover:bg-th-overlay hover:text-th-hi pointer-coarse:-my-2 pointer-coarse:min-h-11 pointer-coarse:min-w-11",
            children: /* @__PURE__ */ jsx11(XIcon, { size: 14 })
          }
        )
      ]
    }
  );
}

// src/components/display.tsx
import {
  createContext as createContext3,
  useContext as useContext3,
  useEffect as useEffect10,
  useRef as useRef8,
  useState as useState8
} from "react";
import { Fragment as Fragment6, jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
function Svg3({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx12(
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
var CopyIcon = (p) => /* @__PURE__ */ jsxs12(Svg3, { ...p, children: [
  /* @__PURE__ */ jsx12("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2" }),
  /* @__PURE__ */ jsx12("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
] });
var CheckIcon3 = (p) => /* @__PURE__ */ jsx12(Svg3, { ...p, children: /* @__PURE__ */ jsx12("path", { d: "M20 6 9 17l-5-5" }) });
var ChevronRightIcon = (p) => /* @__PURE__ */ jsx12(Svg3, { ...p, children: /* @__PURE__ */ jsx12("path", { d: "m9 18 6-6-6-6" }) });
var FILL = {
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  accent: "bg-th-accent",
  neutral: "bg-th-ghost"
};
var CALLOUT_TONE = {
  neutral: { box: "border-th-line bg-th-elevated", bar: "border-th-line bg-th-elevated", icon: "text-th-hi3" },
  accent: { box: "border-th-accent/30 bg-th-accent-soft", bar: "border-th-accent/30 bg-th-accent-soft-solid", icon: "text-th-accent" },
  info: { box: "border-th-info/30 bg-th-info-soft", bar: "border-th-info/30 bg-th-info-soft-solid", icon: "text-th-info" },
  ok: { box: "border-th-ok/30 bg-th-ok-soft", bar: "border-th-ok/30 bg-th-ok-soft-solid", icon: "text-th-ok" },
  warn: { box: "border-th-warn/30 bg-th-warn-soft", bar: "border-th-warn/30 bg-th-warn-soft-solid", icon: "text-th-warn" },
  loss: { box: "border-th-loss/30 bg-th-loss-soft", bar: "border-th-loss/30 bg-th-loss-soft-solid", icon: "text-th-loss" }
};
var CALLOUT_CLAMP = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" };
function defaultCalloutIcon(tone, size) {
  if (tone === "ok") return /* @__PURE__ */ jsx12(CheckCircleIcon, { size });
  if (tone === "warn" || tone === "loss") return /* @__PURE__ */ jsx12(AlertTriangleIcon, { size });
  return /* @__PURE__ */ jsx12(InfoIcon, { size });
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
  sticky = false,
  clamp: clamp2,
  href,
  onClick,
  count,
  className,
  ...rest
}) {
  const t = CALLOUT_TONE[tone];
  const shown = icon === false ? null : icon ?? defaultCalloutIcon(tone, compact ? 14 : 16);
  const interactive = href != null || onClick != null;
  const iconEl = shown ? /* @__PURE__ */ jsx12("span", { className: cn("shrink-0", compact ? "mt-px" : "mt-0.5", t.icon), children: shown }) : null;
  const text = /* @__PURE__ */ jsxs12("div", { className: "min-w-0 flex-1 basis-60", children: [
    title || count != null ? /* @__PURE__ */ jsxs12("p", { className: "flex items-center gap-2 font-medium leading-snug text-th-hi", children: [
      title ? /* @__PURE__ */ jsx12("span", { className: "min-w-0", children: title }) : null,
      count != null ? /* @__PURE__ */ jsxs12(Badge, { tone, "aria-label": `${count} more`, className: "shrink-0", children: [
        "+",
        count
      ] }) : null
    ] }) : null,
    children ? /* @__PURE__ */ jsx12("div", { className: cn("leading-snug text-th-hi2", title || count != null ? "mt-0.5" : null, clamp2 && CALLOUT_CLAMP[clamp2]), children }) : null
  ] });
  const actionEl = action ? /* @__PURE__ */ jsx12("div", { className: "flex shrink-0 items-center gap-2", children: action }) : null;
  const dismissEl = onDismiss ? /* @__PURE__ */ jsx12(IconButton, { label: "Dismiss", size: "xs", onClick: onDismiss, className: "-my-0.5 -mr-1", children: /* @__PURE__ */ jsx12(XIcon, { size: 14 }) }) : null;
  const chevron = /* @__PURE__ */ jsx12(ChevronDownIcon, { size: 16, className: "-rotate-90 shrink-0 self-center text-th-hi3" });
  const hit = cn(
    "flex min-h-11 min-w-0 flex-1 items-start text-left outline-none focus-visible:ring-2 focus-visible:ring-th-accent/40",
    compact ? "gap-2" : "gap-3",
    // Pull the padding of the row into the link so the whole row is the target.
    compact ? "-my-2 py-2" : "-my-3 py-3"
  );
  return /* @__PURE__ */ jsx12(
    "div",
    {
      role: live ? tone === "loss" ? "alert" : "status" : void 0,
      className: cn(
        "flex border",
        variant === "bar" && action ? "items-center" : "items-start",
        compact ? "gap-2 px-3 py-2 text-xs" : "gap-3 px-4 py-3 text-sm",
        variant === "bar" ? "w-full rounded-none border-x-0" : "rounded-xl",
        variant === "bar" ? t.bar : t.box,
        sticky && "sticky top-[var(--nish-header-h,0px)] z-20",
        className
      ),
      ...rest,
      children: interactive ? /* @__PURE__ */ jsxs12(Fragment6, { children: [
        href != null ? /* @__PURE__ */ jsxs12("a", { href, className: hit, children: [
          iconEl,
          /* @__PURE__ */ jsx12("span", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: text }),
          chevron
        ] }) : /* @__PURE__ */ jsxs12("button", { type: "button", onClick, className: hit, children: [
          iconEl,
          /* @__PURE__ */ jsx12("span", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: text }),
          chevron
        ] }),
        actionEl,
        dismissEl
      ] }) : /* @__PURE__ */ jsxs12(Fragment6, { children: [
        iconEl,
        /* @__PURE__ */ jsxs12("div", { className: "flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2", children: [
          text,
          actionEl
        ] }),
        dismissEl
      ] })
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
  return /* @__PURE__ */ jsx12(
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
  const body = /* @__PURE__ */ jsxs12(Fragment6, { children: [
    /* @__PURE__ */ jsx12("dt", { className: cn("text-xs", quiet), children: tip ? /* @__PURE__ */ jsx12(Tooltip, { tip, variant: "hint", children: label }) : label }),
    loading ? /* @__PURE__ */ jsxs12("dd", { className: "mt-1", "aria-busy": "true", children: [
      /* @__PURE__ */ jsx12(Skeleton, { className: cn("w-24", STAT_SKELETON[size]) }),
      sub ? /* @__PURE__ */ jsx12(Skeleton, { className: "mt-1.5 h-3 w-16" }) : null
    ] }) : /* @__PURE__ */ jsxs12(Fragment6, { children: [
      /* @__PURE__ */ jsx12(
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
      sub ? /* @__PURE__ */ jsx12("dd", { className: cn("mt-0.5 text-xs", quiet), children: sub }) : null
    ] })
  ] });
  const Box = inGrid ? "div" : "dl";
  if (variant === "card") {
    return /* @__PURE__ */ jsx12(Card, { padding: "sm", className: cn("min-w-0", className), children: inGrid ? body : /* @__PURE__ */ jsx12("dl", { children: body }) });
  }
  return /* @__PURE__ */ jsx12(Box, { className: cn("min-w-0", variant === "inset" && "rounded-lg bg-th-elevated p-3", className), children: body });
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
  return /* @__PURE__ */ jsx12("dl", { className: cn("grid gap-3", GRID_BASE[cols?.base ?? 2], GRID_MD[cols?.md ?? 4], className), children: /* @__PURE__ */ jsx12(InStatGrid.Provider, { value: true, children }) });
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
  const bar = /* @__PURE__ */ jsx12(
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
      children: /* @__PURE__ */ jsx12(
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
  return /* @__PURE__ */ jsxs12("div", { className: cn("flex w-full items-center gap-2", className), children: [
    bar,
    /* @__PURE__ */ jsxs12("span", { "aria-hidden": "true", className: "w-9 shrink-0 text-right text-xs tabular-nums text-th-hi3", children: [
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
  return /* @__PURE__ */ jsx12(
    "svg",
    {
      role: "img",
      "aria-label": empty ? `${label}: no data` : label,
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "none",
      className: cn("block shrink-0 overflow-visible", empty ? "text-th-line-strong" : SPARK_TONE[tone], className),
      children: empty ? /* @__PURE__ */ jsx12(
        "path",
        {
          d: `M0,${height / 2}H${width}`,
          stroke: "currentColor",
          strokeWidth: 1.5,
          strokeDasharray: "3 3",
          vectorEffect: "non-scaling-stroke"
        }
      ) : /* @__PURE__ */ jsxs12(Fragment6, { children: [
        fill ? runs.map((r, i) => /* @__PURE__ */ jsx12("path", { d: area(r), fill: "currentColor", fillOpacity: 0.15 }, `a${i}`)) : null,
        runs.map((r, i) => /* @__PURE__ */ jsx12(
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
  return /* @__PURE__ */ jsxs12(
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
        /* @__PURE__ */ jsxs12(
          "summary",
          {
            className: cn(
              "flex cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-medium text-th-hi select-none",
              "[&::-webkit-details-marker]:hidden hover:text-th-hi pointer-coarse:min-h-11",
              card ? "px-4 py-3" : "py-1.5"
            ),
            children: [
              /* @__PURE__ */ jsx12(
                ChevronRightIcon,
                {
                  size: 14,
                  className: "shrink-0 text-th-hi3 transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none"
                }
              ),
              /* @__PURE__ */ jsx12("span", { className: "min-w-0 flex-1", children: summary })
            ]
          }
        ),
        /* @__PURE__ */ jsx12("div", { className: cn("text-sm text-th-hi2", card ? "border-t border-th-line px-4 py-3" : "pb-2 pl-6 pt-1"), children })
      ]
    }
  );
}
function Kbd({ className, ...rest }) {
  return /* @__PURE__ */ jsx12(
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
  const [copied, setCopied] = useState8(false);
  const timer = useRef8(null);
  useEffect10(() => () => {
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
  const icon = copied ? /* @__PURE__ */ jsx12(CheckIcon3, { size: iconSize, className: "text-th-ok" }) : /* @__PURE__ */ jsx12(CopyIcon, { size: iconSize });
  return /* @__PURE__ */ jsxs12(Fragment6, { children: [
    iconOnly ? /* @__PURE__ */ jsx12(IconButton, { label: copied ? copiedLabel : label, size, onClick, className, children: icon }) : /* @__PURE__ */ jsx12(Button, { variant, size, icon, onClick, className, children: copied ? copiedLabel : label }),
    /* @__PURE__ */ jsx12("span", { role: "status", "aria-live": "polite", className: "sr-only", children: copied ? copiedLabel : "" })
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
  className
}) {
  const ref = useRef8(null);
  const stuck = useStuck(ref) && sticky;
  const collapsed = stuck && collapseWhenStuck;
  return /* @__PURE__ */ jsxs12(
    "header",
    {
      ref,
      className: cn(
        "flex flex-col gap-2",
        sticky && cn(
          "sticky top-[var(--nish-header-h,0px)] z-20 -mx-[var(--nish-page-gutter,1rem)] border-b bg-th-bg px-[var(--nish-page-gutter,1rem)] py-3",
          stuck ? "border-th-line" : "border-transparent"
        ),
        className
      ),
      children: [
        back ? /* @__PURE__ */ jsx12("div", { className: "text-sm", children: back }) : null,
        /* @__PURE__ */ jsxs12("div", { className: "flex flex-wrap items-end justify-between gap-x-4 gap-y-3", children: [
          /* @__PURE__ */ jsxs12("div", { className: "min-w-0 flex-1 basis-64", children: [
            eyebrow ? /* @__PURE__ */ jsx12("p", { className: "mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3", children: eyebrow }) : null,
            /* @__PURE__ */ jsx12(
              H,
              {
                className: cn(
                  "text-2xl font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]",
                  collapsed && "max-sm:truncate max-sm:text-base max-sm:[overflow-wrap:normal]"
                ),
                children: title
              }
            ),
            description ? /* @__PURE__ */ jsx12("p", { className: cn("mt-1 text-sm text-th-hi2", collapsed && "max-sm:hidden"), children: description }) : null
          ] }),
          actions ? /* @__PURE__ */ jsx12("div", { className: "flex flex-wrap items-center gap-2", children: actions }) : null
        ] })
      ]
    }
  );
}
function MoreVerticalIcon({ size = 18 }) {
  return /* @__PURE__ */ jsxs12("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false", children: [
    /* @__PURE__ */ jsx12("circle", { cx: "12", cy: "5", r: "1.8" }),
    /* @__PURE__ */ jsx12("circle", { cx: "12", cy: "12", r: "1.8" }),
    /* @__PURE__ */ jsx12("circle", { cx: "12", cy: "19", r: "1.8" })
  ] });
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
  glass = false,
  overflowActions,
  className
}) {
  const ref = useRef8(null);
  useHeightVar(ref, "--nish-header-h", sticky);
  const stuck = useStuck(ref) && sticky;
  const inlineActionsRef = useRef8(null);
  useEffect10(() => {
    inlineActionsRef.current?.querySelectorAll('[role="menuitem"]').forEach((el) => {
      el.removeAttribute("role");
      el.tabIndex = el.getAttribute("aria-disabled") === "true" ? -1 : 0;
    });
  });
  const toggle = themeToggle === false ? null : themeToggle ?? /* @__PURE__ */ jsx12(ThemeToggle, {});
  const hideName = hideNameBelow === "sm" && icon != null;
  const mark = /* @__PURE__ */ jsxs12(Fragment6, { children: [
    icon ? /* @__PURE__ */ jsx12("span", { className: "shrink-0 text-th-accent [&>svg]:size-5", children: icon }) : null,
    /* @__PURE__ */ jsx12("span", { className: cn("truncate", hideName && "max-sm:sr-only"), children: name })
  ] });
  const markClass = "inline-flex min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-th-hi";
  return /* @__PURE__ */ jsxs12(
    "header",
    {
      ref,
      className: cn(
        "border-b border-th-line pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]",
        glass ? "bg-th-bg supports-[backdrop-filter]:bg-th-bg/80 supports-[backdrop-filter]:backdrop-blur-xl" : "bg-th-bg",
        sticky && "sticky top-0 z-30 transition-shadow",
        stuck && "shadow-[var(--nish-shadow-card)]",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs12(
          "div",
          {
            className: cn(
              "@container/header flex min-h-14 flex-nowrap items-center gap-2 px-[var(--nish-page-gutter,1rem)] py-2 sm:gap-3",
              innerClassName
            ),
            children: [
              compactPill ? /* @__PURE__ */ jsxs12("a", { className: "nish-pill-link nish-pill-link--compact", href: hubHref, title: "Back to nish.software", children: [
                "\u2190 ",
                /* @__PURE__ */ jsx12("span", { className: "nish-pill-link-label", children: "nish.software" })
              ] }) : /* @__PURE__ */ jsxs12(
                "a",
                {
                  className: "nish-pill-link @max-[400px]/header:min-w-11 @max-[400px]/header:justify-center @max-[400px]/header:px-1.5 @max-[400px]/header:[&_.nish-pill-link-label]:sr-only",
                  href: hubHref,
                  title: "Back to nish.software",
                  children: [
                    "\u2190 ",
                    /* @__PURE__ */ jsx12("span", { className: "nish-pill-link-label", children: "nish.software" })
                  ]
                }
              ),
              homeHref != null ? /* @__PURE__ */ jsx12("a", { href: homeHref, className: cn(markClass, "min-h-11 min-w-11 rounded-lg", hideName && "max-sm:justify-center"), children: mark }) : /* @__PURE__ */ jsx12("span", { className: markClass, children: mark }),
              /* @__PURE__ */ jsxs12("div", { className: "ml-auto flex shrink-0 items-center gap-2", children: [
                actions,
                overflowActions ? /* @__PURE__ */ jsxs12(Fragment6, { children: [
                  /* @__PURE__ */ jsx12("div", { ref: inlineActionsRef, className: "hidden items-center gap-2 sm:flex [&>button]:w-auto", children: overflowActions }),
                  /* @__PURE__ */ jsx12("div", { className: "sm:hidden", children: /* @__PURE__ */ jsx12(
                    DropdownMenu,
                    {
                      align: "end",
                      trigger: /* @__PURE__ */ jsx12(IconButton, { label: "More actions", children: /* @__PURE__ */ jsx12(MoreVerticalIcon, {}) }),
                      children: overflowActions
                    }
                  ) })
                ] }) : null,
                toggle
              ] })
            ]
          }
        ),
        nav ? /* @__PURE__ */ jsx12(
          "nav",
          {
            "aria-label": navLabel,
            className: cn("nish-no-scrollbar -mb-px flex gap-1 overflow-x-auto px-[var(--nish-page-gutter,1rem)]", innerClassName),
            children: nav
          }
        ) : null
      ]
    }
  );
}
function SectionHeader({ title, id, as: H = "h2", meta, action, className }) {
  return /* @__PURE__ */ jsxs12("div", { className: cn("mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1", className), children: [
    /* @__PURE__ */ jsx12(H, { id, className: "min-w-0 text-lg font-semibold tracking-tight text-th-hi [overflow-wrap:anywhere]", children: title }),
    meta != null || action != null ? /* @__PURE__ */ jsxs12("div", { className: "flex items-center gap-3", children: [
      meta != null ? /* @__PURE__ */ jsx12("span", { className: "text-sm text-th-hi3", children: meta }) : null,
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
    return /* @__PURE__ */ jsx12("dl", { className: cn("grid text-sm text-th-hi", className), children: items2.map((it) => /* @__PURE__ */ jsxs12("div", { className: row(it.wrap), children: [
      /* @__PURE__ */ jsx12("dt", { className: cn("text-th-hi2", labelCls(it.wrap)), children: it.label }),
      /* @__PURE__ */ jsx12("dd", { className: cn("m-0 text-right", valueCls(it.wrap)), children: it.value })
    ] }, it.key)) });
  }
  return /* @__PURE__ */ jsx12("ul", { className: cn("grid text-sm text-th-hi", className), children: items2.map((it) => /* @__PURE__ */ jsxs12("li", { className: row(it.wrap), children: [
    /* @__PURE__ */ jsx12("span", { className: cn("flex items-center gap-2", labelCls(it.wrap)), children: it.label }),
    /* @__PURE__ */ jsx12("span", { className: cn("flex items-center justify-end gap-2 text-right", valueCls(it.wrap)), children: it.value })
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
  return /* @__PURE__ */ jsx12("ul", { "aria-label": label, className: cn("flex flex-wrap gap-x-4 gap-y-1 text-xs text-th-hi2", className), children: items2.map((it) => /* @__PURE__ */ jsxs12("li", { className: "inline-flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsx12(
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
  useContext as useContext4,
  useRef as useRef9
} from "react";
import { jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
var ALIGN = { left: "text-left", center: "text-center", right: "text-right" };
var ROW_TONE = {
  ok: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)]",
  warn: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)]",
  loss: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)]"
};
var WRAP = "relative overflow-auto rounded-xl border border-th-line bg-th-surface";
var STICKY = "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-th-surface";
var TABLE = "w-full border-collapse text-sm tabular-nums text-th-hi2";
var ZEBRA = "[&_tbody>tr:nth-child(even)]:bg-th-elevated/50";
var TH = "whitespace-nowrap border-b border-th-line px-3 text-left align-middle text-xs font-medium uppercase tracking-wider text-th-hi3";
var TD = "px-3 align-middle";
var PAD = { normal: "py-2.5", dense: "py-1.5" };
var TR = "border-b border-th-line last:border-b-0";
var TR_INTERACTIVE = "cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated";
var NUMERIC = "whitespace-nowrap text-right tabular-nums";
var STICKY_COL = "[&_thead_tr]:bg-th-surface [&_tbody_tr]:bg-th-surface [&_tr>:first-child]:sticky [&_tr>:first-child]:left-0 [&_tr>:first-child]:z-10 [&_tr>:first-child]:bg-inherit [&_tr>:first-child]:after:pointer-events-none [&_tr>:first-child]:after:absolute [&_tr>:first-child]:after:inset-y-0 [&_tr>:first-child]:after:left-full [&_tr>:first-child]:after:w-2.5 [&_tr>:first-child]:after:bg-gradient-to-r [&_tr>:first-child]:after:from-[color-mix(in_srgb,var(--nish-hi)_14%,transparent)] [&_tr>:first-child]:after:to-transparent [&_tr>:first-child]:after:opacity-0 [&_tr>:first-child]:after:transition-opacity [&[data-at-start=false]_tr>:first-child]:after:opacity-100";
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
function TableWrap({
  minWidth,
  maxHeight,
  stickyHeader = false,
  fade = true,
  stickyFirstColumn = false,
  className,
  style,
  children,
  ...rest
}) {
  const ref = useRef9(null);
  useScrollEdges(ref);
  const css = {
    // With a pinned first column the left fade would wash it out, so only the right edge fades.
    ...fade && stickyFirstColumn ? { "--nish-fade-start": "#000" } : null,
    ...style,
    ...maxHeight !== void 0 ? { maxHeight } : null,
    ...minWidth !== void 0 ? { "--nish-table-min": typeof minWidth === "number" ? `${minWidth}px` : minWidth } : null
  };
  return /* @__PURE__ */ jsx13(
    "div",
    {
      ref,
      className: cn(
        WRAP,
        fade && "nish-scroll-fade",
        minWidth !== void 0 && "[&>table]:min-w-[var(--nish-table-min)]",
        stickyHeader && STICKY,
        stickyFirstColumn && STICKY_COL,
        className
      ),
      style: css,
      ...rest,
      children
    }
  );
}
function Table({ dense = false, zebra = false, className, ...rest }) {
  return /* @__PURE__ */ jsx13(TableCtx.Provider, { value: { dense }, children: /* @__PURE__ */ jsx13("table", { className: cn(TABLE, zebra && ZEBRA, className), ...rest }) });
}
var SORT_LABEL = { asc: "ascending", desc: "descending" };
function Th({ align, numeric = false, sort, onSort, className, children, scope = "col", ...rest }) {
  const { dense } = useContext4(TableCtx);
  const a = align ?? (numeric ? "right" : "left");
  const sortable = onSort !== void 0 || sort !== void 0;
  return /* @__PURE__ */ jsx13(
    "th",
    {
      scope,
      "aria-sort": sortable ? sort ? SORT_LABEL[sort] : "none" : void 0,
      className: cn(TH, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && "tabular-nums", className),
      ...rest,
      children: onSort ? /* @__PURE__ */ jsxs13(
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
            /* @__PURE__ */ jsx13(SortMark, { sort: sort || false })
          ]
        }
      ) : children
    }
  );
}
function SortMark({ sort }) {
  return /* @__PURE__ */ jsxs13("svg", { width: 10, height: 10, viewBox: "0 0 10 10", "aria-hidden": "true", focusable: "false", className: "shrink-0", children: [
    /* @__PURE__ */ jsx13("path", { d: "M2 4 5 1l3 3", fill: "none", stroke: "currentColor", strokeWidth: 1.5, opacity: sort === "asc" ? 1 : 0.35 }),
    /* @__PURE__ */ jsx13("path", { d: "M2 6l3 3 3-3", fill: "none", stroke: "currentColor", strokeWidth: 1.5, opacity: sort === "desc" ? 1 : 0.35 })
  ] });
}
function Td({ align, numeric = false, nowrap = false, className, ...rest }) {
  const { dense } = useContext4(TableCtx);
  const a = align ?? (numeric ? "right" : "left");
  return /* @__PURE__ */ jsx13(
    "td",
    {
      className: cn(TD, dense ? PAD.dense : PAD.normal, ALIGN[a], numeric && "whitespace-nowrap tabular-nums", nowrap && "whitespace-nowrap", className),
      ...rest
    }
  );
}
function Tr({ tone, interactive = false, muted = false, className, ...rest }) {
  return /* @__PURE__ */ jsx13(
    "tr",
    {
      className: cn(TR, interactive && TR_INTERACTIVE, muted && "text-th-hi3", tone && ROW_TONE[tone], className),
      ...rest
    }
  );
}

// src/components/layout.tsx
import {
  useCallback as useCallback3,
  useEffect as useEffect11,
  useRef as useRef10,
  useState as useState9,
  useSyncExternalStore as useSyncExternalStore4
} from "react";
import { jsx as jsx14, jsxs as jsxs14 } from "react/jsx-runtime";
function StickyBar({ children, top = "var(--nish-header-h, 0px)", elevate = true, as = "div", className }) {
  const ref = useRef10(null);
  const stuck = useStuck(ref);
  useHeightVar(ref, "--nish-sticky-extra");
  const Tag = as;
  return /* @__PURE__ */ jsx14(
    Tag,
    {
      ref,
      style: { top },
      className: cn(
        "sticky z-20 -mx-[var(--nish-page-gutter)] border-b bg-th-bg px-[var(--nish-page-gutter)]",
        elevate && stuck ? "border-th-line shadow-card" : "border-transparent",
        className
      ),
      children
    }
  );
}
function StickyActionBar({ open, message, primary, secondary, label = "Actions", className }) {
  const ref = useRef10(null);
  useHeightVar(ref, "--nish-bottom-bar-h", open);
  if (!open) return null;
  return /* @__PURE__ */ jsxs14(
    "div",
    {
      ref,
      role: "region",
      "aria-label": label,
      className: cn(
        "fixed inset-x-0 bottom-[var(--nish-bottom-nav-h,0px)] z-30 flex items-center gap-3 border-t border-th-line bg-th-elevated px-4 pt-3 shadow-[var(--nish-shadow-pop)]",
        // The nav already covers the home-indicator inset; only pad for what it leaves.
        "pb-[max(0.75rem,calc(env(safe-area-inset-bottom)_-_var(--nish-bottom-nav-h,0px)))]",
        "animate-[nish-bar-in_220ms_var(--nish-ease-out)] motion-reduce:animate-none",
        "sm:inset-x-auto sm:right-6 sm:bottom-[calc(var(--nish-bottom-nav-h,0px)_+_1.5rem)] sm:rounded-[var(--nish-radius-lg)] sm:border sm:pb-3",
        className
      ),
      children: [
        message ? /* @__PURE__ */ jsx14("div", { className: "min-w-0 flex-1 truncate text-sm text-th-hi2", children: message }) : /* @__PURE__ */ jsx14("div", { className: "flex-1" }),
        /* @__PURE__ */ jsxs14("div", { className: "flex shrink-0 items-center gap-2", children: [
          secondary,
          primary
        ] })
      ]
    }
  );
}
function LoadingBar({ active, delayMs = 200, top = "var(--nish-header-h, 0px)", className }) {
  const [shown, setShown] = useState9(false);
  useEffect11(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const id = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(id);
  }, [active, delayMs]);
  if (!active || !shown) return null;
  return /* @__PURE__ */ jsx14(
    "div",
    {
      role: "progressbar",
      "aria-busy": "true",
      "aria-label": "Loading",
      style: { top },
      className: cn("pointer-events-none fixed inset-x-0 z-40 h-0.5 overflow-hidden", className),
      children: /* @__PURE__ */ jsx14("div", { className: "h-full w-2/5 bg-th-accent animate-[nish-loading-bar_1.2s_linear_infinite] motion-reduce:animate-none" })
    }
  );
}
var CONTAINER_SIZE = {
  narrow: "max-w-2xl",
  default: "max-w-4xl",
  wide: "max-w-7xl",
  full: "max-w-none"
};
function PageContainer({ size = "default", children, padBottom = true, as = "main", className }) {
  const Tag = as;
  return /* @__PURE__ */ jsx14(Tag, { className: cn("mx-auto w-full px-[var(--nish-page-gutter)] py-6", CONTAINER_SIZE[size], padBottom && "nish-pad-bottom-inset", className), children });
}
function subscribeOnline(onChange) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
function useOnline() {
  return useSyncExternalStore4(
    subscribeOnline,
    () => navigator.onLine,
    () => true
  );
}
function ConnectionBanner({
  healthUrl,
  intervalMs = 3e4,
  message = "Can't reach the server",
  offlineMessage = "You're offline",
  onRetry
}) {
  const online = useOnline();
  const [reachable, setReachable] = useState9(true);
  const [retrying, setRetrying] = useState9(false);
  const probeRef = useRef10(null);
  useEffect11(() => {
    if (!healthUrl) {
      probeRef.current = null;
      setReachable(true);
      return;
    }
    let disposed = false;
    let runId = 0;
    let failures = 0;
    let timer;
    let ctrl;
    const schedule = () => {
      clearTimeout(timer);
      if (document.visibilityState === "hidden") return;
      const delay = Math.min(intervalMs * 2 ** failures, intervalMs * 4);
      timer = setTimeout(() => void run(), delay);
    };
    const run = async () => {
      clearTimeout(timer);
      ctrl?.abort();
      const mine = ++runId;
      const c = new AbortController();
      ctrl = c;
      const cut = setTimeout(() => c.abort(), 1e4);
      let ok = false;
      try {
        const res = await fetch(healthUrl, { cache: "no-store", signal: c.signal });
        ok = res.ok;
      } catch {
        ok = false;
      } finally {
        clearTimeout(cut);
      }
      if (disposed || mine !== runId) return;
      failures = ok ? 0 : failures + 1;
      setReachable(ok);
      schedule();
    };
    probeRef.current = run;
    const onOnline = () => void run();
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
      ctrl?.abort();
      probeRef.current = null;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [healthUrl, intervalMs]);
  const retry = useCallback3(async () => {
    setRetrying(true);
    try {
      await probeRef.current?.();
    } finally {
      setRetrying(false);
    }
    onRetry?.();
  }, [onRetry]);
  if (online && reachable) return null;
  return /* @__PURE__ */ jsx14(
    Callout,
    {
      variant: "bar",
      tone: "warn",
      sticky: true,
      live: true,
      compact: true,
      action: /* @__PURE__ */ jsx14(Button, { size: "sm", variant: "secondary", loading: retrying, onClick: () => void retry(), children: "Retry" }),
      children: online ? message : offlineMessage
    }
  );
}

// src/components/data.tsx
import {
  useEffect as useEffect13,
  useId as useId7,
  useLayoutEffect as useLayoutEffect3,
  useMemo as useMemo2,
  useRef as useRef12,
  useState as useState11
} from "react";

// src/components/hooks.tsx
import { useCallback as useCallback4, useEffect as useEffect12, useRef as useRef11, useState as useState10, useSyncExternalStore as useSyncExternalStore5 } from "react";

// src/format.ts
var DASH = "\u2013";
function toDate(t) {
  if (t === null || t === void 0) return null;
  let d;
  if (t instanceof Date) d = t;
  else if (typeof t === "number") d = new Date(t);
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim());
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}
var rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
function ago(t, o = {}) {
  const d = toDate(t);
  if (!d) return DASH;
  const diff = Math.round((d.getTime() - (o.now ?? Date.now())) / 1e3);
  const abs = Math.abs(diff);
  if (abs < 45) return "just now";
  const units = [
    [60, "minute", "m"],
    [3600, "hour", "h"],
    [86400, "day", "d"],
    [86400 * 30, "month", "mo"],
    [86400 * 365, "year", "y"]
  ];
  let pick = units[0];
  for (const u of units) if (abs >= u[0]) pick = u;
  const n = Math.max(1, Math.round(abs / pick[0]));
  const past = diff < 0;
  if (o.style === "long") return rtf.format(past ? -n : n, pick[1]);
  return past ? `${n}${pick[2]} ago` : `in ${n}${pick[2]}`;
}
function norm(s) {
  return s.replace(/[  ]/g, " ");
}
function date(t, style = "short") {
  const d = toDate(t);
  if (!d) return DASH;
  switch (style) {
    case "medium":
      return norm(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    case "long":
      return norm(d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    case "weekday":
      return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getMonth() + 1}/${d.getDate()}`;
    default:
      return norm(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
}
function time(t, o = {}) {
  const d = toDate(t);
  if (!d) return DASH;
  return norm(
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: o.timeZone })
  );
}
function dateTime(t) {
  const d = toDate(t);
  if (!d) return DASH;
  return `${date(d, "short")}, ${time(d)}`;
}

// src/components/hooks.tsx
import { jsx as jsx15 } from "react/jsx-runtime";
function useMediaQuery(query) {
  const subscribe = useCallback4(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {
      };
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );
  const get = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches;
  return useSyncExternalStore5(subscribe, get, () => false);
}
var BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };
var PHONE_QUERY2 = "(max-width: 639.98px)";
var NARROW_QUERY = "(max-width: 767.98px)";
var BREAKPOINT_QUERIES = ["xl", "lg", "md", "sm"].map((name) => [
  name,
  `(min-width: ${BREAKPOINTS[name]}px)`
]);
function usePhone() {
  return useMediaQuery(PHONE_QUERY2);
}
function useNarrow() {
  return useMediaQuery(NARROW_QUERY);
}
function currentBreakpoint() {
  if (typeof window === "undefined" || !window.matchMedia) return "base";
  for (const [name, q] of BREAKPOINT_QUERIES) if (window.matchMedia(q).matches) return name;
  return "base";
}
function subscribeBreakpoint(onChange) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {
  };
  const lists = BREAKPOINT_QUERIES.map(([, q]) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}
function useBreakpoint2() {
  return useSyncExternalStore5(subscribeBreakpoint, currentBreakpoint, () => "base");
}
function useDocumentTitle(title, o = {}) {
  const app = o.app;
  useEffect12(() => {
    if (typeof document === "undefined") return;
    const next = title && app ? `${title} \xB7 ${app}` : title || app;
    if (!next) return;
    const previous = document.title;
    document.title = next;
    return () => {
      document.title = previous;
    };
  }, [title, app]);
}
function useNow(intervalMs = 3e4) {
  const [now, setNow] = useState10(() => Date.now());
  useEffect12(() => {
    if (typeof document === "undefined") return;
    let id;
    const start = () => {
      if (id === void 0) id = setInterval(() => setNow(Date.now()), intervalMs);
    };
    const stop = () => {
      if (id !== void 0) clearInterval(id);
      id = void 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        start();
      } else stop();
    };
    if (document.visibilityState !== "hidden") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
  return now;
}
var LOCAL_EVENT = "nish-local-storage";
function readStored(key, initial, raw) {
  try {
    const text = window.localStorage.getItem(key);
    if (text === null) return initial;
    return raw ? text : JSON.parse(text);
  } catch {
    return initial;
  }
}
function useLocalStorage(key, initial, o = {}) {
  const raw = !!o.raw;
  const initialRef = useRef11(initial);
  initialRef.current = initial;
  const [value, setValueState] = useState10(
    () => typeof window === "undefined" ? initial : readStored(key, initial, raw)
  );
  const valueRef = useRef11(value);
  valueRef.current = value;
  const instanceRef = useRef11({});
  useEffect12(() => {
    const sync = () => setValueState(readStored(key, initialRef.current, raw));
    sync();
    const onStorage = (e) => {
      if (e.key === null || e.key === key) sync();
    };
    const onLocal = (e) => {
      const d = e.detail;
      if (d && d.key === key && d.source !== instanceRef.current) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_EVENT, onLocal);
    };
  }, [key, raw]);
  const setValue = useCallback4(
    (next) => {
      const resolved = typeof next === "function" ? next(valueRef.current) : next;
      valueRef.current = resolved;
      setValueState(resolved);
      try {
        window.localStorage.setItem(key, raw ? String(resolved) : JSON.stringify(resolved));
      } catch {
      }
      try {
        window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { key, source: instanceRef.current } }));
      } catch {
      }
    },
    [key, raw]
  );
  return [value, setValue];
}
function RelativeTime({ value, style = "short", refreshMs = 3e4, className }) {
  const now = useNow(refreshMs);
  const d = new Date(value);
  const iso = Number.isNaN(d.getTime()) ? void 0 : d.toISOString();
  return /* @__PURE__ */ jsx15("time", { dateTime: iso, title: dateTime(value), className: cn("tabular-nums", className), children: ago(value, { now, style }) });
}

// src/components/data.tsx
import { Fragment as Fragment7, jsx as jsx16, jsxs as jsxs15 } from "react/jsx-runtime";
function Glyph({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx16(
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
var ChevronRight = (p) => /* @__PURE__ */ jsx16(Glyph, { ...p, children: /* @__PURE__ */ jsx16("path", { d: "m9 18 6-6-6-6" }) });
var ExternalGlyph = (p) => /* @__PURE__ */ jsx16(Glyph, { ...p, children: /* @__PURE__ */ jsx16("path", { d: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }) });
var ArrowUp = (p) => /* @__PURE__ */ jsx16(Glyph, { ...p, children: /* @__PURE__ */ jsx16("path", { d: "m5 12 7-7 7 7M12 19V5" }) });
var ArrowDown = (p) => /* @__PURE__ */ jsx16(Glyph, { ...p, children: /* @__PURE__ */ jsx16("path", { d: "M12 5v14M19 12l-7 7-7-7" }) });
function fromInteractive(e) {
  const el = e.target?.closest?.('a,button,input,select,textarea,label,summary,[role="button"],[role="link"]');
  return !!el && el !== e.currentTarget && e.currentTarget.contains(el);
}
var TABLE_SHOW = { sm: "hidden sm:block", md: "hidden md:block", lg: "hidden lg:block" };
var BP_PX = { sm: 640, md: 768, lg: 1024 };
var CARDS_SHOW = { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden" };
var HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell"
};
var TONE_EDGE = {
  ok: "border-l-[3px] border-l-[var(--nish-ok-fill)]",
  warn: "border-l-[3px] border-l-[var(--nish-warn-fill)]",
  loss: "border-l-[3px] border-l-[var(--nish-loss-fill)]"
};
function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), void 0, { numeric: true, sensitivity: "base" });
}
function ResponsiveTable({
  rows,
  columns,
  rowKey,
  cardsBelow = "md",
  onRowClick,
  rowHref,
  onNavigate,
  rowTone,
  sort,
  onSortChange,
  minWidth = 640,
  stickyHeader,
  maxHeight,
  stickyFirstColumn,
  loading = false,
  empty,
  error,
  label,
  renderCard,
  className
}) {
  const [innerSort, setInnerSort] = useState11(null);
  const sortId = useId7();
  const wide = useMediaQuery(`(min-width: ${BP_PX[cardsBelow]}px)`);
  const external = sort !== void 0 || onSortChange !== void 0;
  const current = sort !== void 0 ? sort : innerSort;
  const changeSort = (next) => {
    setInnerSort(next);
    onSortChange?.(next);
  };
  const sorted = useMemo2(() => {
    if (external || !current) return rows;
    const col = columns.find((c) => c.key === current.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    const sign = current.dir === "asc" ? 1 : -1;
    return [...rows].sort((x, y) => {
      const a = get(x);
      const b = get(y);
      if (a === null || b === null) return compareValues(a, b);
      return sign * compareValues(a, b);
    });
  }, [rows, columns, current, external]);
  const sortable = columns.filter((c) => c.sortValue);
  const toggle = (key) => changeSort(current?.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const interactive = !!(onRowClick || rowHref);
  const activate = (row) => {
    onRowClick?.(row);
  };
  const go = (row, e) => {
    if (!rowHref) return activate(row);
    const href = rowHref(row);
    if (e.metaKey || e.ctrlKey || e.shiftKey || "button" in e && e.button === 1) window.open(href, "_blank", "noopener");
    else if (onNavigate) onNavigate(href);
    else window.location.assign(href);
  };
  if (error) return /* @__PURE__ */ jsx16(ErrorState, { message: error.message, onRetry: error.onRetry, className });
  const emptyNode = empty ?? /* @__PURE__ */ jsx16(EmptyState, { title: "Nothing here yet" });
  const hasRows = sorted.length > 0;
  const table = loading ? /* @__PURE__ */ jsx16(SkeletonRows, { rows: 5, height: 44, label: `Loading ${label}` }) : !hasRows ? emptyNode : /* @__PURE__ */ jsx16(TableWrap, { minWidth, stickyHeader, maxHeight, stickyFirstColumn, children: /* @__PURE__ */ jsxs15(Table, { "aria-label": label, children: [
    /* @__PURE__ */ jsx16("thead", { children: /* @__PURE__ */ jsx16("tr", { children: columns.map((c) => /* @__PURE__ */ jsx16(
      Th,
      {
        numeric: c.numeric,
        sort: c.sortValue ? current?.key === c.key ? current.dir : false : void 0,
        onSort: c.sortValue ? () => toggle(c.key) : void 0,
        className: cn(c.hideBelow && HIDE_BELOW[c.hideBelow]),
        style: c.width ? { width: c.width } : void 0,
        children: c.header
      },
      c.key
    )) }) }),
    /* @__PURE__ */ jsx16("tbody", { children: sorted.map((row) => /* @__PURE__ */ jsx16(
      Tr,
      {
        tone: rowTone?.(row),
        interactive,
        tabIndex: interactive ? 0 : void 0,
        onClick: interactive ? (e) => {
          if (!fromInteractive(e)) go(row, e);
        } : void 0,
        onKeyDown: interactive ? (e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            go(row, e);
          }
        } : void 0,
        children: columns.map((c) => /* @__PURE__ */ jsx16(Td, { numeric: c.numeric, className: cn(c.hideBelow && HIDE_BELOW[c.hideBelow]), children: c.cell(row) }, c.key))
      },
      rowKey(row)
    )) })
  ] }) });
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const secondary = columns.find((c) => c.secondary && c !== primary);
  const rest = columns.filter((c) => c !== primary && c !== secondary);
  const cardBody = (row) => renderCard ? renderCard(row) : /* @__PURE__ */ jsxs15(Fragment7, { children: [
    /* @__PURE__ */ jsxs15("span", { className: "block min-w-0", children: [
      /* @__PURE__ */ jsx16("span", { className: "block truncate font-semibold text-th-hi", children: primary?.cell(row) }),
      secondary ? /* @__PURE__ */ jsx16("span", { className: "mt-0.5 block text-sm text-th-hi3", children: secondary.cell(row) }) : null
    ] }),
    rest.length > 0 ? /* @__PURE__ */ jsx16("span", { className: "mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm", children: rest.map((c) => /* @__PURE__ */ jsxs15("span", { className: "flex min-w-0 items-baseline justify-between gap-2", children: [
      /* @__PURE__ */ jsx16("span", { className: "shrink-0 text-xs text-th-hi3", children: c.header }),
      /* @__PURE__ */ jsx16("span", { className: cn("min-w-0 text-th-hi2", c.numeric && "whitespace-nowrap text-right tabular-nums"), children: c.cell(row) })
    ] }, c.key)) }) : null
  ] });
  const cardClassFor = (row) => cardClass({
    padding: "sm",
    interactive,
    className: cn("block min-h-11 w-full text-left", rowTone?.(row) && TONE_EDGE[rowTone(row)])
  });
  const cards = loading ? /* @__PURE__ */ jsx16(CardListSkeleton, { count: 3, lines: 2 }) : !hasRows ? emptyNode : /* @__PURE__ */ jsxs15(Fragment7, { children: [
    sortable.length > 0 ? /* @__PURE__ */ jsxs15("div", { className: "mb-2 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx16("label", { className: "shrink-0 text-xs text-th-hi3", htmlFor: sortId, children: "Sort by" }),
      /* @__PURE__ */ jsxs15(
        Select,
        {
          id: sortId,
          size: "sm",
          className: "min-w-0 flex-1",
          value: current?.key ?? "",
          onChange: (e) => changeSort(e.target.value ? { key: e.target.value, dir: current?.dir ?? "asc" } : null),
          children: [
            /* @__PURE__ */ jsx16("option", { value: "", children: "Default" }),
            sortable.map((c) => /* @__PURE__ */ jsx16("option", { value: c.key, children: c.header }, c.key))
          ]
        }
      ),
      /* @__PURE__ */ jsx16(
        IconButton,
        {
          label: current?.dir === "desc" ? "Sorted descending, switch to ascending" : "Sorted ascending, switch to descending",
          variant: "subtle",
          disabled: !current,
          onClick: () => current && changeSort({ key: current.key, dir: current.dir === "asc" ? "desc" : "asc" }),
          children: current?.dir === "desc" ? /* @__PURE__ */ jsx16(ArrowDown, { size: 16 }) : /* @__PURE__ */ jsx16(ArrowUp, { size: 16 })
        }
      )
    ] }) : null,
    /* @__PURE__ */ jsx16("ul", { "aria-label": label, className: "grid gap-2", children: sorted.map((row) => /* @__PURE__ */ jsx16("li", { children: rowHref ? /* @__PURE__ */ jsx16("a", { href: rowHref(row), className: cardClassFor(row), children: cardBody(row) }) : onRowClick ? /* @__PURE__ */ jsx16("button", { type: "button", onClick: () => onRowClick(row), className: cardClassFor(row), children: cardBody(row) }) : /* @__PURE__ */ jsx16("div", { className: cardClassFor(row), children: cardBody(row) }) }, rowKey(row))) })
  ] });
  return /* @__PURE__ */ jsx16("div", { className, children: wide ? /* @__PURE__ */ jsx16("div", { className: TABLE_SHOW[cardsBelow], children: table }) : /* @__PURE__ */ jsx16("div", { className: CARDS_SHOW[cardsBelow], children: cards }) });
}
function ListRow({
  icon,
  title,
  subtitle,
  meta,
  trailing,
  href,
  onClick,
  active = false,
  tone,
  chevron,
  dense = false,
  external = false,
  className,
  as: Wrapper = "li"
}) {
  const interactive = !!(href || onClick);
  const showChevron = chevron ?? !!href;
  const rowClass = cn(
    "flex w-full items-center gap-3 rounded-[var(--nish-radius-sm)] px-3 text-left",
    dense ? "min-h-11" : "min-h-[52px]",
    !subtitle && "py-1",
    subtitle && "py-2",
    interactive && "transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-th-accent",
    active && "bg-th-accent-soft",
    className
  );
  const body = /* @__PURE__ */ jsxs15(Fragment7, { children: [
    icon ? /* @__PURE__ */ jsx16("span", { className: "flex shrink-0 items-center text-th-hi3 [&>svg]:size-5", children: icon }) : null,
    /* @__PURE__ */ jsxs15("span", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx16("span", { className: cn("block truncate", tone === "danger" ? "text-th-loss" : "text-th-hi"), children: title }),
      subtitle ? /* @__PURE__ */ jsx16("span", { className: "line-clamp-2 block text-sm text-th-hi3", children: subtitle }) : null
    ] }),
    meta ? /* @__PURE__ */ jsx16("span", { className: "shrink-0 text-right text-xs tabular-nums text-th-hi3", children: meta }) : null,
    trailing ? /* @__PURE__ */ jsx16("span", { className: "flex shrink-0 items-center", children: trailing }) : null,
    external ? /* @__PURE__ */ jsx16(ExternalGlyph, { size: 14, className: "shrink-0 text-th-hi3" }) : null,
    showChevron && !external ? /* @__PURE__ */ jsx16(ChevronRight, { size: 16, className: "shrink-0 text-th-ghost" }) : null
  ] });
  let inner;
  if (href) {
    inner = /* @__PURE__ */ jsx16(
      "a",
      {
        href,
        className: rowClass,
        "aria-current": active ? "true" : void 0,
        ...external ? { target: "_blank", rel: "noopener noreferrer" } : null,
        children: body
      }
    );
  } else if (onClick) {
    inner = /* @__PURE__ */ jsx16("button", { type: "button", onClick, className: rowClass, "aria-current": active ? "true" : void 0, children: body });
  } else {
    inner = /* @__PURE__ */ jsx16("div", { className: rowClass, children: body });
  }
  return /* @__PURE__ */ jsx16(Wrapper, { children: inner });
}
var FAVICON_HUES = 8;
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
  return Math.abs(h);
}
function hostnameOf(url) {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}
function Favicon({ url, size = 16, label, className }) {
  const host = hostnameOf(url);
  const [failed, setFailed] = useState11(false);
  const [loaded, setLoaded] = useState11(false);
  useEffect13(() => {
    setFailed(false);
    setLoaded(false);
  }, [host]);
  const box = { width: size, height: size };
  if (!host || failed) {
    const seed = label ?? host ?? url;
    const n = hashString(seed) % FAVICON_HUES + 1;
    const letter = (seed.replace(/^www\./, "").match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();
    return /* @__PURE__ */ jsx16(
      "span",
      {
        "aria-hidden": "true",
        className: cn("inline-flex shrink-0 select-none items-center justify-center rounded-sm font-semibold leading-none", className),
        style: {
          ...box,
          fontSize: Math.round(size * 0.6),
          color: `var(--nish-chart-${n})`,
          background: `color-mix(in srgb, var(--nish-chart-${n}) 20%, transparent)`
        },
        children: letter
      }
    );
  }
  return /* @__PURE__ */ jsx16(
    "img",
    {
      src: `https://www.google.com/s2/favicons?sz=${size * 2 > 32 ? 64 : 32}&domain=${encodeURIComponent(host)}`,
      width: size,
      height: size,
      alt: "",
      "aria-hidden": "true",
      loading: "lazy",
      decoding: "async",
      onLoad: () => setLoaded(true),
      onError: () => setFailed(true),
      className: cn("inline-block shrink-0 rounded-sm transition-opacity duration-150 motion-reduce:transition-none", loaded ? "opacity-100" : "opacity-0", className),
      style: box
    }
  );
}
var AUTO_BREAK = 600;
var widthWatches = /* @__PURE__ */ new WeakMap();
function watchWidth(el, fn) {
  fn(el.clientWidth);
  if (typeof ResizeObserver === "undefined") return () => {
  };
  let w = widthWatches.get(el);
  if (!w) {
    const subs2 = /* @__PURE__ */ new Set();
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      subs2.forEach((f) => f(width));
    });
    ro.observe(el);
    w = { ro, subs: subs2 };
    widthWatches.set(el, w);
  }
  w.subs.add(fn);
  const watch2 = w;
  return () => {
    watch2.subs.delete(fn);
    if (!watch2.subs.size) {
      watch2.ro.disconnect();
      widthWatches.delete(el);
    }
  };
}
function LinkCard({
  href,
  title,
  blurb,
  icon,
  accent = "accent",
  meta,
  status,
  badge,
  disabled = false,
  layout = "auto",
  external = false,
  className
}) {
  const ref = useRef12(null);
  const [wide, setWide] = useState11(false);
  useLayoutEffect3(() => {
    if (layout !== "auto") return;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    return watchWidth(parent, (w) => setWide(w >= AUTO_BREAK));
  }, [layout]);
  const isCard = layout === "card" || layout === "auto" && wide;
  const color = accent === "accent" ? "var(--nish-accent)" : `var(--nish-${accent})`;
  const tile = icon ? /* @__PURE__ */ jsx16(
    "span",
    {
      "aria-hidden": "true",
      className: cn("flex shrink-0 items-center justify-center rounded-[var(--nish-radius-sm)] [&>svg]:size-5", isCard ? "size-10" : "size-9"),
      style: { color, background: `color-mix(in srgb, ${color} 16%, transparent)` },
      children: icon
    }
  ) : null;
  const statusEl = status ? /* @__PURE__ */ jsxs15("span", { className: "inline-flex items-center gap-1.5 text-xs text-th-hi3", children: [
    /* @__PURE__ */ jsx16(StatusDot, { tone: status.tone, size: "xs" }),
    status.label
  ] }) : null;
  const base = cn(
    "group/link @container flex min-h-11 rounded-xl border bg-th-surface text-left",
    disabled ? "border-dashed border-th-line-strong text-th-hi3" : "border-th-line shadow-card",
    !disabled && "transition-[transform,box-shadow,border-color,background-color] duration-150 hover:border-th-line-strong hover:bg-th-elevated/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-pop",
    isCard ? "flex-col gap-3 p-4" : "min-h-16 items-center gap-3 px-3 py-2",
    className
  );
  const content = isCard ? /* @__PURE__ */ jsxs15(Fragment7, { children: [
    /* @__PURE__ */ jsxs15("span", { className: "flex items-start justify-between gap-2", children: [
      tile ?? /* @__PURE__ */ jsx16("span", {}),
      /* @__PURE__ */ jsxs15("span", { className: "flex items-center gap-2", children: [
        badge,
        external ? /* @__PURE__ */ jsx16(ExternalGlyph, { size: 14, className: "text-th-hi3" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs15("span", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx16("span", { className: cn("block font-semibold", disabled ? "text-th-hi2" : "text-th-hi"), children: title }),
      blurb ? /* @__PURE__ */ jsx16("span", { className: "mt-1 line-clamp-3 block text-sm text-th-hi3", children: blurb }) : null
    ] }),
    meta || statusEl ? /* @__PURE__ */ jsxs15("span", { className: "mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-th-hi3", children: [
      statusEl,
      meta
    ] }) : null
  ] }) : /* @__PURE__ */ jsxs15(Fragment7, { children: [
    tile,
    /* @__PURE__ */ jsxs15("span", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxs15("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx16("span", { className: cn("truncate font-semibold", disabled ? "text-th-hi2" : "text-th-hi"), children: title }),
        status ? /* @__PURE__ */ jsx16(StatusDot, { tone: status.tone, size: "xs", label: status.label }) : null
      ] }),
      blurb ? /* @__PURE__ */ jsx16("span", { className: "line-clamp-1 block text-sm text-th-hi3", children: blurb }) : null
    ] }),
    badge,
    external ? /* @__PURE__ */ jsx16(ExternalGlyph, { size: 14, className: "shrink-0 text-th-hi3" }) : /* @__PURE__ */ jsx16(ChevronRight, { size: 16, className: "shrink-0 text-th-ghost" })
  ] });
  if (disabled) {
    return /* @__PURE__ */ jsx16("span", { ref, "aria-disabled": "true", className: base, children: content });
  }
  return /* @__PURE__ */ jsx16(
    "a",
    {
      ref,
      href,
      className: base,
      ...external ? { target: "_blank", rel: "noopener noreferrer" } : null,
      children: content
    }
  );
}
function AsyncPanel({ status, skeleton, error, empty, children, className }) {
  let body;
  if (status === "loading") body = skeleton ?? /* @__PURE__ */ jsx16(SkeletonRows, {});
  else if (status === "error")
    body = /* @__PURE__ */ jsx16(
      ErrorState,
      {
        message: error?.title ? `${error.title}: ${error.message}` : error?.message ?? "Failed to load",
        onRetry: error?.onRetry
      }
    );
  else if (status === "empty")
    body = /* @__PURE__ */ jsx16(EmptyState, { title: empty?.title ?? "Nothing here yet", detail: empty?.description, action: empty?.action });
  else body = children;
  return /* @__PURE__ */ jsx16("div", { "aria-busy": status === "loading" || void 0, className, children: body });
}

// src/components/charts.tsx
import { useCallback as useCallback5, useEffect as useEffect15, useId as useId8, useMemo as useMemo3, useRef as useRef13, useState as useState13 } from "react";

// src/chart.ts
import { useEffect as useEffect14, useState as useState12 } from "react";
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

// src/components/charts.tsx
import { jsx as jsx17, jsxs as jsxs16 } from "react/jsx-runtime";
function toneColor(tone, index) {
  if (!tone) return seriesColor(index);
  if (tone === "ok") return "var(--nish-ok-fill)";
  if (tone === "loss") return "var(--nish-loss-fill)";
  if (tone === "accent") return "var(--nish-accent)";
  return `var(--nish-${tone})`;
}
function useWidth() {
  const [el, setEl] = useState13(null);
  const [width, setWidth] = useState13(0);
  useEffect15(() => {
    if (!el) {
      setWidth(0);
      return;
    }
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width, el];
}
function useCoarsePointer() {
  const [coarse, setCoarse] = useState13(false);
  useEffect15(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return coarse;
}
var defaultNum = (v) => Math.abs(v) >= 1e3 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(Math.round(v * 100) / 100);
function ticksBetween(min, max, count) {
  const n = Math.max(2, Math.floor(count));
  return Array.from({ length: n }, (_, i) => min + (max - min) * i / (n - 1));
}
var PAD_TOP = 10;
var PAD_BOTTOM = 24;
var PAD_RIGHT = 12;
function LineChart({
  data,
  series,
  height = 200,
  area,
  yFormat = defaultNum,
  xFormat = defaultNum,
  yTicks = 4,
  xTicks = 4,
  baseline,
  tone,
  label,
  loading,
  empty,
  className
}) {
  const [wrapRef, width, wrapEl] = useWidth();
  const gradId = `nish-area-${useId8().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [active, setActive] = useState13(null);
  const fromKey = useRef13(false);
  const lines = useMemo3(() => series ?? (data ? [{ label, tone, points: data }] : []), [series, data, label, tone]);
  const xs = useMemo3(() => {
    const set = /* @__PURE__ */ new Set();
    for (const s of lines) for (const p of s.points) if (p.y != null && Number.isFinite(p.y) && Number.isFinite(p.x)) set.add(p.x);
    return [...set].sort((a, b) => a - b);
  }, [lines]);
  const lookup = useMemo3(
    () => lines.map((s) => new Map(s.points.filter((p) => p.y != null && Number.isFinite(p.y)).map((p) => [p.x, p.y]))),
    [lines]
  );
  const scale = useMemo3(() => {
    if (!xs.length) return null;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const s of lines) for (const p of s.points) if (p.y != null && Number.isFinite(p.y)) {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    }
    if (baseline != null && Number.isFinite(baseline)) {
      yMin = Math.min(yMin, baseline);
      yMax = Math.max(yMax, baseline);
    }
    if (yMin === yMax) {
      const d = Math.abs(yMin) * 0.05 || 1;
      yMin -= d;
      yMax += d;
    } else {
      const d = (yMax - yMin) * 0.06;
      yMin -= d;
      yMax += d;
    }
    const xMin = xs[0];
    const xMax = xs[xs.length - 1];
    return { xMin, xMax: xMax === xMin ? xMin + 1 : xMax, yMin, yMax };
  }, [lines, xs, baseline]);
  useEffect15(() => {
    if (active == null) return;
    const onDown = (e) => {
      if (wrapEl && !wrapEl.contains(e.target)) setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active, wrapEl]);
  if (loading) return /* @__PURE__ */ jsx17(Skeleton, { className: cn("w-full rounded-xl", className), style: { height } });
  if (!scale) {
    return /* @__PURE__ */ jsx17("div", { role: "img", "aria-label": `${label}: no data`, className: cn("flex w-full items-center justify-center text-sm text-th-hi3", className), style: { height }, children: empty ?? "No data" });
  }
  const yLabels = ticksBetween(scale.yMin, scale.yMax, yTicks).map((v) => ({ v, text: yFormat(v) }));
  const padLeft = Math.ceil(Math.max(...yLabels.map((t) => t.text.length)) * 6.6) + 10;
  const plotW = Math.max(0, width - padLeft - PAD_RIGHT);
  const plotH = Math.max(0, height - PAD_TOP - PAD_BOTTOM);
  const sx = (x) => padLeft + (x - scale.xMin) / (scale.xMax - scale.xMin) * plotW;
  const sy = (y) => PAD_TOP + (1 - (y - scale.yMin) / (scale.yMax - scale.yMin)) * plotH;
  const bottom = PAD_TOP + plotH;
  const paths = lines.map((s) => {
    const segs = [];
    let cur = [];
    for (const p of [...s.points].sort((a, b) => a.x - b.x)) {
      if (p.y == null || !Number.isFinite(p.y) || !Number.isFinite(p.x)) {
        if (cur.length) segs.push(cur);
        cur = [];
      } else cur.push(`${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`);
    }
    if (cur.length) segs.push(cur);
    return segs;
  });
  const xLabels = ticksBetween(scale.xMin, scale.xMax, Math.min(xTicks, Math.max(2, Math.floor(plotW / 72))));
  const moveTo = (clientX, el) => {
    const rect = el.getBoundingClientRect();
    const x = scale.xMin + (clientX - rect.left - padLeft) / (plotW || 1) * (scale.xMax - scale.xMin);
    let lo = 0;
    let hi = xs.length - 1;
    while (hi - lo > 1) {
      const mid = lo + hi >> 1;
      if (xs[mid] < x) lo = mid;
      else hi = mid;
    }
    setActive(Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi);
  };
  const onPointer = (e) => {
    fromKey.current = false;
    moveTo(e.clientX, e.currentTarget);
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      fromKey.current = true;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setActive((a) => a == null ? dir > 0 ? 0 : xs.length - 1 : Math.min(xs.length - 1, Math.max(0, a + dir)));
    } else if (e.key === "Escape") setActive(null);
  };
  const ax = active != null ? xs[active] : null;
  const cx = ax != null ? sx(ax) : 0;
  const tipRows = ax != null ? lines.map((s, i) => ({ s, i, y: lookup[i].get(ax) })).filter((r) => r.y != null) : [];
  const tipRight = cx < width / 2;
  const tableXs = xs.slice(0, 200);
  return /* @__PURE__ */ jsxs16("div", { ref: wrapRef, className: cn("relative w-full select-none", className), style: { height }, children: [
    width > 0 && /* @__PURE__ */ jsxs16(
      "svg",
      {
        width,
        height,
        role: "img",
        tabIndex: 0,
        "aria-label": label,
        className: "block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-th-accent",
        style: { touchAction: "pan-y" },
        onPointerDown: onPointer,
        onPointerMove: onPointer,
        onPointerLeave: (e) => {
          if (e.pointerType === "mouse") setActive(null);
        },
        onKeyDown: onKey,
        onBlur: () => {
          if (fromKey.current) setActive(null);
        },
        children: [
          area && lines[0] && /* @__PURE__ */ jsx17("defs", { children: /* @__PURE__ */ jsxs16("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx17("stop", { offset: "0%", stopColor: toneColor(lines[0].tone, 0), stopOpacity: 0.2 }),
            /* @__PURE__ */ jsx17("stop", { offset: "100%", stopColor: toneColor(lines[0].tone, 0), stopOpacity: 0 })
          ] }) }),
          yLabels.map((t, i) => /* @__PURE__ */ jsxs16("g", { children: [
            /* @__PURE__ */ jsx17("line", { x1: padLeft, x2: padLeft + plotW, y1: sy(t.v), y2: sy(t.v), stroke: CHART.grid, strokeWidth: 1 }),
            /* @__PURE__ */ jsx17("text", { x: padLeft - 6, y: sy(t.v), textAnchor: "end", dominantBaseline: "middle", fontSize: 11, fill: CHART.text, style: { fontVariantNumeric: "tabular-nums" }, children: t.text })
          ] }, i)),
          xLabels.map((v, i) => /* @__PURE__ */ jsx17(
            "text",
            {
              x: sx(v),
              y: height - 6,
              textAnchor: i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle",
              fontSize: 11,
              fill: CHART.text,
              style: { fontVariantNumeric: "tabular-nums" },
              children: xFormat(v)
            },
            i
          )),
          baseline != null && Number.isFinite(baseline) && /* @__PURE__ */ jsx17("line", { x1: padLeft, x2: padLeft + plotW, y1: sy(baseline), y2: sy(baseline), stroke: CHART.zero, strokeWidth: 1, strokeDasharray: "4 4" }),
          area && paths[0]?.map((seg, i) => /* @__PURE__ */ jsx17("polygon", { points: `${seg[0].split(",")[0]},${bottom} ${seg.join(" ")} ${seg[seg.length - 1].split(",")[0]},${bottom}`, fill: `url(#${gradId})` }, i)),
          paths.map(
            (segs, si) => segs.map(
              (seg, i) => seg.length === 1 ? /* @__PURE__ */ jsx17("circle", { cx: seg[0].split(",")[0], cy: seg[0].split(",")[1], r: 2, fill: toneColor(lines[si].tone, si) }, `${si}-${i}`) : /* @__PURE__ */ jsx17("polyline", { points: seg.join(" "), fill: "none", stroke: toneColor(lines[si].tone, si), strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }, `${si}-${i}`)
            )
          ),
          ax != null && /* @__PURE__ */ jsxs16("g", { pointerEvents: "none", children: [
            /* @__PURE__ */ jsx17("line", { x1: cx, x2: cx, y1: PAD_TOP, y2: bottom, stroke: CHART.axis, strokeWidth: 1 }),
            tipRows.map((r) => /* @__PURE__ */ jsx17("circle", { cx, cy: sy(r.y), r: 4, fill: toneColor(r.s.tone, r.i), stroke: "var(--nish-surface)", strokeWidth: 2 }, r.i))
          ] })
        ]
      }
    ),
    ax != null && width > 0 && /* @__PURE__ */ jsxs16(
      "div",
      {
        className: "pointer-events-none absolute top-1 z-10 whitespace-nowrap px-2 py-1 tabular-nums",
        style: { ...tooltipStyle, ...tipRight ? { left: cx + 10 } : { right: width - cx + 10 } },
        children: [
          /* @__PURE__ */ jsx17("div", { className: "text-th-hi3", children: xFormat(ax) }),
          tipRows.map((r) => /* @__PURE__ */ jsxs16("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx17("span", { "aria-hidden": "true", className: "inline-block size-2 rounded-full", style: { background: toneColor(r.s.tone, r.i) } }),
            lines.length > 1 && /* @__PURE__ */ jsx17("span", { className: "text-th-hi3", children: r.s.label }),
            /* @__PURE__ */ jsx17("span", { className: "font-medium", children: yFormat(r.y) })
          ] }, r.i))
        ]
      }
    ),
    /* @__PURE__ */ jsxs16("table", { className: "sr-only", children: [
      /* @__PURE__ */ jsx17("caption", { children: label }),
      /* @__PURE__ */ jsx17("thead", { children: /* @__PURE__ */ jsxs16("tr", { children: [
        /* @__PURE__ */ jsx17("th", { scope: "col", children: "x" }),
        lines.map((s, i) => /* @__PURE__ */ jsx17("th", { scope: "col", children: s.label }, i))
      ] }) }),
      /* @__PURE__ */ jsx17("tbody", { children: tableXs.map((x) => /* @__PURE__ */ jsxs16("tr", { children: [
        /* @__PURE__ */ jsx17("th", { scope: "row", children: xFormat(x) }),
        lines.map((_, i) => /* @__PURE__ */ jsx17("td", { children: lookup[i].has(x) ? yFormat(lookup[i].get(x)) : "" }, i))
      ] }, x)) })
    ] })
  ] });
}
var BAR_TOP = 18;
var BAR_BOTTOM = 22;
function BarChart({ data, height = 140, tone = "chart-1", valueFormat = defaultNum, showValues = "auto", xTicks = "ends", label, className }) {
  const [wrapRef, width] = useWidth();
  const coarse = useCoarsePointer();
  const [selected, setSelected] = useState13(null);
  const color = toneColor(tone, 0);
  const pick = useCallback5(
    (clientX, el) => {
      const rect = el.getBoundingClientRect();
      const i = Math.floor((clientX - rect.left) / (rect.width || 1) * data.length);
      setSelected(Math.min(data.length - 1, Math.max(0, i)));
    },
    [data.length]
  );
  if (!data.length) {
    return /* @__PURE__ */ jsx17("div", { role: "img", "aria-label": `${label}: no data`, className: cn("flex w-full items-center justify-center text-sm text-th-hi3", className), style: { height }, children: "No data" });
  }
  const values = data.map((d) => Number.isFinite(d.value) ? d.value : 0);
  const vMax = Math.max(0, ...values);
  const vMin = Math.min(0, ...values);
  const span = vMax - vMin || 1;
  const plotH = Math.max(0, height - BAR_TOP - BAR_BOTTOM);
  const zeroY = BAR_TOP + vMax / span * plotH;
  const band = width / data.length;
  const barW = Math.max(1, band * 0.72);
  const printValues = showValues === "always" || coarse;
  const onKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      setSelected((s) => s == null ? dir > 0 ? 0 : data.length - 1 : Math.min(data.length - 1, Math.max(0, s + dir)));
    } else if (e.key === "Escape") setSelected(null);
  };
  return /* @__PURE__ */ jsxs16("div", { ref: wrapRef, className: cn("w-full", className), children: [
    width > 0 && /* @__PURE__ */ jsxs16(
      "svg",
      {
        width,
        height,
        role: "img",
        tabIndex: 0,
        "aria-label": label,
        className: "block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-th-accent",
        style: { touchAction: "pan-y" },
        onPointerDown: (e) => pick(e.clientX, e.currentTarget),
        onPointerMove: (e) => {
          if (e.pointerType === "mouse" || e.buttons) pick(e.clientX, e.currentTarget);
        },
        onPointerLeave: (e) => {
          if (e.pointerType === "mouse") setSelected(null);
        },
        onKeyDown: onKey,
        children: [
          /* @__PURE__ */ jsx17("line", { x1: 0, x2: width, y1: zeroY, y2: zeroY, stroke: CHART.grid, strokeWidth: 1 }),
          values.map((v, i) => {
            const h = Math.max(2, Math.abs(v) / span * plotH);
            const y = v < 0 ? zeroY : zeroY - h;
            const x = i * band + (band - barW) / 2;
            const isSel = selected === i;
            const showVal = isSel || printValues && (showValues === "always" || band >= 26);
            return /* @__PURE__ */ jsxs16("g", { children: [
              /* @__PURE__ */ jsx17("rect", { x, y, width: barW, height: h, rx: 2, fill: color, opacity: selected == null || isSel ? 1 : 0.55 }),
              showVal && /* @__PURE__ */ jsx17("text", { x: x + barW / 2, y: v < 0 ? y + h + 11 : Math.max(11, y - 4), textAnchor: "middle", fontSize: 11, fill: CHART.text, style: { fontVariantNumeric: "tabular-nums" }, children: valueFormat(v) })
            ] }, i);
          }),
          data.map((d, i) => {
            const show = xTicks === "all" || i === 0 || i === data.length - 1;
            if (!show) return null;
            const anchor = xTicks === "all" ? "middle" : i === 0 ? "start" : "end";
            const x = xTicks === "all" ? i * band + band / 2 : i === 0 ? 0 : width;
            return /* @__PURE__ */ jsx17("text", { x, y: height - 6, textAnchor: anchor, fontSize: 11, fill: CHART.text, children: d.label }, i);
          })
        ]
      }
    ),
    /* @__PURE__ */ jsx17("div", { className: "mt-1 min-h-5 text-sm tabular-nums text-th-hi2", "aria-live": "polite", children: selected != null ? `${data[selected].label}: ${valueFormat(values[selected])}` : "" }),
    /* @__PURE__ */ jsxs16("table", { className: "sr-only", children: [
      /* @__PURE__ */ jsx17("caption", { children: label }),
      /* @__PURE__ */ jsx17("tbody", { children: data.map((d, i) => /* @__PURE__ */ jsxs16("tr", { children: [
        /* @__PURE__ */ jsx17("th", { scope: "row", children: d.label }),
        /* @__PURE__ */ jsx17("td", { children: valueFormat(values[i]) })
      ] }, i)) })
    ] })
  ] });
}
function RangeBar({ min, max, low, high, current, className }) {
  const span = max - min;
  const pos = (v) => span > 0 ? Math.min(100, Math.max(0, (v - min) / span * 100)) : 0;
  const a = pos(Math.min(low, high));
  const b = pos(Math.max(low, high));
  return /* @__PURE__ */ jsxs16(
    "div",
    {
      role: "img",
      "aria-label": `Range ${defaultNum(low)} to ${defaultNum(high)}${current != null ? `, current ${defaultNum(current)}` : ""}, within ${defaultNum(min)} to ${defaultNum(max)}`,
      className: cn("relative h-1.5 w-full rounded-full bg-th-line", className),
      children: [
        /* @__PURE__ */ jsx17(
          "div",
          {
            className: "absolute inset-y-0 rounded-full",
            style: { left: `${a}%`, width: `${Math.max(b - a, 1)}%`, background: "linear-gradient(90deg, var(--nish-chart-2), var(--nish-chart-5))" }
          }
        ),
        current != null && /* @__PURE__ */ jsx17(
          "span",
          {
            "aria-hidden": "true",
            className: "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-th-surface bg-th-hi",
            style: { left: `${pos(current)}%` }
          }
        )
      ]
    }
  );
}

// src/components/flow.tsx
import {
  useEffect as useEffect16,
  useLayoutEffect as useLayoutEffect4,
  useMemo as useMemo4,
  useRef as useRef14,
  useState as useState14
} from "react";
import { Fragment as Fragment8, jsx as jsx18, jsxs as jsxs17 } from "react/jsx-runtime";
var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
var warned = /* @__PURE__ */ new Set();
function warnDev(message) {
  if (warned.has(message)) return;
  try {
    if (process.env.NODE_ENV !== "production") {
      warned.add(message);
      console.warn(message);
    }
  } catch {
  }
}
function useTransitionFx(value, ref, pick) {
  const prev = useRef14(value);
  useLayoutEffect4(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("data-fx");
    const fx = pick(from, value);
    if (!fx) return;
    void el.offsetWidth;
    el.setAttribute("data-fx", fx);
    const timer = setTimeout(() => el.removeAttribute("data-fx"), 700);
    return () => {
      clearTimeout(timer);
      el.removeAttribute("data-fx");
    };
  }, [value, ref, pick]);
}
function useFreshIds(ids, skipFirst) {
  const known = useRef14(skipFirst ? null : /* @__PURE__ */ new Set());
  const fresh = useRef14(/* @__PURE__ */ new Set());
  if (known.current) {
    for (const id of ids) if (!known.current.has(id)) fresh.current.add(id);
  }
  useEffect16(() => {
    const current = new Set(ids);
    known.current = current;
    for (const id of fresh.current) if (!current.has(id)) fresh.current.delete(id);
  });
  return fresh.current;
}
function CheckSvg({ size, className }) {
  return /* @__PURE__ */ jsx18(
    "svg",
    {
      className: cn("nish-flow-check", className),
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 3,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: /* @__PURE__ */ jsx18("path", { d: "M5 12.5l4.5 4.5L19 7.5", pathLength: 1 })
    }
  );
}
function CrossSvg({ size }) {
  return /* @__PURE__ */ jsx18(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 3,
      strokeLinecap: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: /* @__PURE__ */ jsx18("path", { d: "M6.5 6.5l11 11M17.5 6.5l-11 11" })
    }
  );
}
var NODE_STATUS = {
  pending: "border-2 border-th-line text-th-hi3",
  active: "border-2 border-th-accent text-th-hi",
  done: "bg-th-ok-fill text-th-on-ok",
  failed: "bg-th-loss-fill text-th-on-loss"
};
var STEP_SR = { done: ", done", failed: ", failed" };
function pickStepFx(from, to) {
  if (to === "done") return "done";
  if (to === "failed") return "failed";
  return from === to ? null : null;
}
function withFullText(text, label) {
  if (typeof text !== "string") return label;
  return /* @__PURE__ */ jsx18(Tooltip, { tip: text, className: "nish-flow-label-tip max-w-full min-w-0", children: label });
}
function StepRow({
  step,
  index,
  last,
  sweeping
}) {
  const nodeRef = useRef14(null);
  useTransitionFx(step.status, nodeRef, pickStepFx);
  const { status } = step;
  return /* @__PURE__ */ jsxs17(
    "li",
    {
      className: "nish-flow-step nish-flow-rise",
      "data-status": status,
      "aria-current": status === "active" ? "step" : void 0,
      style: { "--nish-flow-delay": `${Math.min(index * 40, 400)}ms` },
      children: [
        /* @__PURE__ */ jsxs17(
          "span",
          {
            ref: nodeRef,
            className: cn(
              "nish-flow-node grid size-7 place-items-center rounded-full text-xs font-medium tabular-nums",
              NODE_STATUS[status]
            ),
            "aria-hidden": "true",
            children: [
              status === "done" ? /* @__PURE__ */ jsx18(CheckSvg, { size: 16 }) : status === "failed" ? /* @__PURE__ */ jsx18(CrossSvg, { size: 14 }) : index + 1,
              status === "active" ? /* @__PURE__ */ jsxs17(Fragment8, { children: [
                /* @__PURE__ */ jsx18("svg", { className: "nish-flow-arc text-th-accent", viewBox: "0 0 28 28", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ jsx18("circle", { cx: "14", cy: "14", r: "13", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeDasharray: "20 62" }) }),
                /* @__PURE__ */ jsx18("span", { className: "nish-flow-ripple" })
              ] }) : null
            ]
          }
        ),
        /* @__PURE__ */ jsxs17("span", { className: "nish-flow-text", children: [
          withFullText(
            step.label,
            /* @__PURE__ */ jsxs17(
              "span",
              {
                className: cn(
                  "nish-flow-label text-sm",
                  status === "active" ? "font-medium text-th-hi" : status === "failed" ? "text-th-loss" : "text-th-hi2"
                ),
                children: [
                  step.label,
                  STEP_SR[status] ? /* @__PURE__ */ jsx18("span", { className: "sr-only", children: STEP_SR[status] }) : null
                ]
              }
            )
          ),
          step.meta != null ? /* @__PURE__ */ jsx18("span", { className: "nish-flow-meta text-xs text-th-hi3", children: step.meta }) : null
        ] }),
        last ? null : /* @__PURE__ */ jsxs17(
          "span",
          {
            className: "nish-flow-conn",
            "data-on": status === "done",
            "aria-hidden": "true",
            style: sweeping ? { "--nish-flow-delay": `${index * 60}ms` } : void 0,
            children: [
              /* @__PURE__ */ jsx18("span", { className: "nish-flow-fill" }),
              /* @__PURE__ */ jsx18("span", { className: "nish-flow-shimmer" }),
              /* @__PURE__ */ jsx18("span", { className: "nish-flow-sweep" })
            ]
          }
        )
      ]
    }
  );
}
function FlowSteps({ steps, orientation = "auto", label = "Progress", className }) {
  const allDone = steps.length > 0 && steps.every((s) => s.status === "done");
  const prevAll = useRef14(null);
  const [sweeping, setSweeping] = useState14(false);
  useLayoutEffect4(() => {
    const was = prevAll.current;
    prevAll.current = allDone;
    if (!allDone) {
      setSweeping(false);
      return;
    }
    if (was === false && steps.length > 1) {
      setSweeping(true);
      const timer = setTimeout(() => setSweeping(false), steps.length * 60 + 1e3);
      return () => clearTimeout(timer);
    }
  }, [allDone]);
  const orient = orientation === "auto" && steps.length > 8 ? "vertical" : orientation;
  return /* @__PURE__ */ jsx18("div", { className: cn("nish-flow-steps-box", className), children: /* @__PURE__ */ jsx18("ol", { className: "nish-flow-steps", "data-orient": orient, "data-sweep": sweeping || void 0, "aria-label": label, children: steps.map((step, i) => /* @__PURE__ */ jsx18(StepRow, { step, index: i, last: i === steps.length - 1, sweeping }, step.id)) }) });
}
function StepBar({ total, done, active = false, label, className }) {
  const t = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const d = Number.isFinite(done) ? Math.min(t, Math.max(0, Math.floor(done))) : 0;
  const props = {
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": t,
    "aria-valuenow": d,
    "aria-label": label ?? "Progress"
  };
  if (t > 12) {
    return /* @__PURE__ */ jsxs17("div", { ...props, className: cn("relative h-1.5 overflow-hidden rounded-full bg-th-line", className), children: [
      /* @__PURE__ */ jsx18(
        "div",
        {
          className: "h-full rounded-full bg-th-ok-fill motion-safe:transition-[width] motion-safe:duration-[400ms]",
          style: { width: `${d / t * 100}%` }
        }
      ),
      active && d < t ? /* @__PURE__ */ jsx18(
        "div",
        {
          className: "absolute inset-y-0 rounded-full bg-th-accent motion-safe:animate-pulse",
          style: { left: `${d / t * 100}%`, width: `max(6px, ${100 / t}%)` }
        }
      ) : null
    ] });
  }
  return /* @__PURE__ */ jsx18("div", { ...props, className: cn("flex h-1.5 gap-[3px]", className), children: Array.from({ length: t }, (_, i) => /* @__PURE__ */ jsxs17("div", { className: "relative h-full min-w-0 flex-1 overflow-hidden rounded-full bg-th-line", children: [
    /* @__PURE__ */ jsx18(
      "div",
      {
        className: cn(
          "absolute inset-0 origin-left rounded-full bg-th-ok-fill motion-safe:transition-transform motion-safe:duration-[400ms]",
          i < d ? "scale-x-100" : "scale-x-0"
        )
      }
    ),
    i === d ? /* @__PURE__ */ jsx18("div", { className: cn("absolute inset-0 rounded-full bg-th-accent", active ? "motion-safe:animate-pulse" : "opacity-0") }) : null
  ] }, i)) });
}
function TickerText({ text, as = "span", className }) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState14({ text, prev: null });
  let cur = state;
  if (state.text !== text) {
    cur = { text, prev: reduced ? null : state.text };
    setState(cur);
  }
  const animating = cur.prev !== null;
  useEffect16(() => {
    if (!animating) return;
    const timer = setTimeout(() => setState((s) => s.prev === null ? s : { ...s, prev: null }), 300);
    return () => clearTimeout(timer);
  }, [animating, cur.text]);
  const Tag = as;
  return /* @__PURE__ */ jsxs17(Tag, { className: cn("nish-flow-ticker grid min-w-0 overflow-hidden", className), title: cur.text, children: [
    cur.prev !== null ? /* @__PURE__ */ jsx18("span", { className: "nish-flow-ticker-out", "aria-hidden": "true", children: cur.prev }, `prev:${cur.prev}`) : null,
    /* @__PURE__ */ jsx18("span", { className: animating ? "nish-flow-ticker-in" : void 0, children: cur.text }, cur.text)
  ] });
}
var STATE_WORD = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed"
};
var AGENT_STATE = {
  queued: "border-dashed border-th-line opacity-70",
  running: "border-th-accent",
  done: "border-th-ok-fill/40",
  failed: "border-th-loss-fill"
};
var MODEL_HUE = [
  ["opus", "violet"],
  ["sonnet", "sky"],
  ["haiku", "emerald"],
  ["fable", "amber"]
];
function modelFamily(model) {
  const m = model.toLowerCase();
  return MODEL_HUE.find(([name]) => m.includes(name));
}
function ModelBadge({ model }) {
  const family = modelFamily(model);
  return /* @__PURE__ */ jsx18(Badge, { size: "xs", hue: family?.[1], className: "shrink-0", children: family ? family[0] : model });
}
function pickAgentFx(from, to) {
  if (from === to) return null;
  if (to === "done") return "done";
  if (to === "failed") return "failed";
  return null;
}
function AgentIcon({ state }) {
  if (state === "running") {
    return /* @__PURE__ */ jsx18("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center text-th-accent", children: /* @__PURE__ */ jsxs17("svg", { className: "nish-flow-agent-spin", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx18("circle", { cx: "8", cy: "8", r: "6", stroke: "currentColor", strokeOpacity: "0.25", strokeWidth: "2" }),
      /* @__PURE__ */ jsx18("path", { d: "M8 2a6 6 0 0 1 6 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
    ] }) });
  }
  if (state === "done") {
    return /* @__PURE__ */ jsx18("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center rounded-full bg-th-ok-fill text-th-on-ok", children: /* @__PURE__ */ jsx18(CheckSvg, { size: 12 }) });
  }
  if (state === "failed") {
    return /* @__PURE__ */ jsx18("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center rounded-full bg-th-loss-fill text-th-on-loss", children: /* @__PURE__ */ jsx18(CrossSvg, { size: 11 }) });
  }
  return /* @__PURE__ */ jsx18("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center", children: /* @__PURE__ */ jsx18("span", { className: "size-4 rounded-full border-2 border-dashed border-th-ghost" }) });
}
function AgentNode({ label, state, model, activity, meta, onClick, className }) {
  const ref = useRef14(null);
  useTransitionFx(state, ref, pickAgentFx);
  const aria = `${label}: ${STATE_WORD[state]}`;
  const classes = cn(
    "nish-flow-agent block min-h-16 w-full min-w-0 rounded-xl border bg-th-surface p-3 text-left",
    AGENT_STATE[state],
    onClick && "cursor-pointer transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent",
    className
  );
  const body = /* @__PURE__ */ jsxs17(Fragment8, { children: [
    /* @__PURE__ */ jsxs17("span", { className: "flex min-w-0 items-start gap-2", children: [
      /* @__PURE__ */ jsx18(AgentIcon, { state }),
      /* @__PURE__ */ jsx18("span", { className: "line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-5 text-th-hi [overflow-wrap:anywhere]", children: label }),
      meta != null ? /* @__PURE__ */ jsx18("span", { className: "shrink-0 text-xs leading-5 tabular-nums text-th-hi3", children: meta }) : null
    ] }),
    model || activity ? /* @__PURE__ */ jsxs17("span", { className: "mt-1.5 flex min-w-0 items-center gap-2", children: [
      model ? /* @__PURE__ */ jsx18(ModelBadge, { model }) : null,
      activity ? /* @__PURE__ */ jsx18(TickerText, { as: "span", text: activity, className: "min-w-0 flex-1 text-xs text-th-hi3" }) : null
    ] }) : null
  ] });
  if (onClick) {
    return /* @__PURE__ */ jsx18("button", { type: "button", ref, className: classes, "data-state": state, "aria-label": aria, onClick, children: body });
  }
  return /* @__PURE__ */ jsx18("article", { ref, className: classes, "data-state": state, "aria-label": aria, children: body });
}
var OTHER_ID = "__nish-flow-other__";
function phaseState(agents) {
  if (agents.length === 0) return "waiting";
  if (agents.some((a) => a.state === "running")) return "active";
  if (agents.every((a) => a.state === "done" || a.state === "failed")) return "done";
  return "pending";
}
function PhaseConnector({ flowing }) {
  return /* @__PURE__ */ jsxs17("svg", { className: "nish-flow-phase-conn", "data-flow": flowing, viewBox: "0 0 24 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx18("path", { className: "nish-flow-dashline", d: "M1 6h15", strokeDasharray: "3 3" }),
    /* @__PURE__ */ jsx18("path", { d: "M16 2.5L20.5 6 16 9.5" })
  ] });
}
function WorkflowBoard({ phases, agents, label = "Workflow", className }) {
  const fresh = useFreshIds(
    agents.map((a) => a.id),
    false
  );
  const columns = useMemo4(() => {
    const byId = /* @__PURE__ */ new Map();
    const byTitle = /* @__PURE__ */ new Map();
    for (const p of phases) {
      if (!byId.has(p.id)) byId.set(p.id, p);
      if (!byTitle.has(p.title)) byTitle.set(p.title, p);
    }
    const groups = /* @__PURE__ */ new Map();
    const other = [];
    for (const a of agents) {
      const phase = a.phase === null ? void 0 : byId.get(a.phase) ?? byTitle.get(a.phase);
      if (!phase) {
        other.push(a);
        continue;
      }
      const list = groups.get(phase.id);
      if (list) list.push(a);
      else groups.set(phase.id, [a]);
    }
    const cols = phases.map((phase) => {
      const list = groups.get(phase.id) ?? [];
      return { phase, agents: list, state: phaseState(list) };
    });
    const seen = /* @__PURE__ */ new Set();
    for (const c of cols) {
      if (seen.has(c.phase.id)) {
        c.agents = [];
        c.state = "waiting";
      }
      seen.add(c.phase.id);
    }
    if (other.length) cols.push({ phase: { id: OTHER_ID, title: "Other" }, agents: other, state: phaseState(other) });
    return cols;
  }, [phases, agents]);
  return /* @__PURE__ */ jsx18("section", { "aria-label": label, className: cn("nish-flow-board-box", className), children: /* @__PURE__ */ jsx18("div", { className: "nish-flow-board", children: columns.map((col, ci) => {
    const { phase, state } = col;
    const finished = col.agents.filter((a) => a.state === "done" || a.state === "failed").length;
    const total = col.agents.length;
    const next = columns[ci + 1];
    const flowing = (state === "done" || state === "active") && next !== void 0 && (next.state === "waiting" || next.state === "pending" || next.state === "active");
    return /* @__PURE__ */ jsxs17(
      "div",
      {
        role: "group",
        "aria-label": phase.title,
        "data-state": state,
        className: cn(
          "nish-flow-phase rounded-xl border bg-th-elevated/40 p-3",
          state === "active" ? "border-th-accent/50" : "border-th-line"
        ),
        children: [
          /* @__PURE__ */ jsxs17("div", { className: cn("flex min-w-0 items-center gap-2", state === "waiting" && "opacity-60"), children: [
            state === "done" ? /* @__PURE__ */ jsx18("span", { className: "grid size-4 shrink-0 place-items-center rounded-full bg-th-ok-fill text-th-on-ok", children: /* @__PURE__ */ jsx18(CheckSvg, { size: 10 }) }) : null,
            /* @__PURE__ */ jsx18("span", { className: cn("min-w-0 flex-1 truncate text-sm font-medium", state === "active" ? "text-th-accent" : "text-th-hi"), children: phase.title }),
            phase.model ? /* @__PURE__ */ jsx18(ModelBadge, { model: phase.model }) : null,
            /* @__PURE__ */ jsxs17("span", { className: "shrink-0 text-xs tabular-nums text-th-hi3", children: [
              finished,
              "/",
              total
            ] })
          ] }),
          /* @__PURE__ */ jsx18(
            "div",
            {
              className: cn("mt-2 h-1 overflow-hidden rounded-full bg-th-line", state === "waiting" && "opacity-60"),
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx18(
                "div",
                {
                  className: "h-full rounded-full bg-th-ok-fill motion-safe:transition-[width] motion-safe:duration-500",
                  style: { width: total ? `${finished / total * 100}%` : "0%" }
                }
              )
            }
          ),
          phase.detail != null ? /* @__PURE__ */ jsx18("div", { className: "mt-2 text-xs text-th-hi3", children: phase.detail }) : null,
          /* @__PURE__ */ jsx18("div", { className: "mt-3 flex min-w-0 flex-col gap-2", children: total === 0 ? /* @__PURE__ */ jsx18("p", { className: "text-xs text-th-hi3", children: "Waiting" }) : col.agents.map((a, ai) => {
            const { id, phase: _phase, ...node } = a;
            return /* @__PURE__ */ jsx18(
              "div",
              {
                className: fresh.has(id) ? "nish-flow-rise" : void 0,
                style: fresh.has(id) ? { "--nish-flow-delay": `${Math.min(ai * 60, 600)}ms` } : void 0,
                children: /* @__PURE__ */ jsx18(AgentNode, { ...node })
              },
              id
            );
          }) }),
          next ? /* @__PURE__ */ jsx18(PhaseConnector, { flowing }) : null
        ]
      },
      phase.id
    );
  }) }) });
}
var FEED_DOT = {
  neutral: "bg-th-ghost",
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill"
};
function ActivityFeed({ items: items2, max = 50, now, label = "Activity", empty, className }) {
  const internalNow = useNow(15e3);
  const clock = now ?? internalNow;
  const shown = useMemo4(() => [...items2].sort((a, b) => b.at - a.at).slice(0, Math.max(0, max)), [items2, max]);
  const fresh = useFreshIds(
    shown.map((i) => i.id),
    true
  );
  if (shown.length === 0) {
    return /* @__PURE__ */ jsx18("div", { className: cn("text-sm text-th-hi3", className), children: empty ?? "No activity yet" });
  }
  return /* @__PURE__ */ jsx18("ol", { className: cn("nish-flow-feed", className), "aria-label": label, children: shown.map((item) => /* @__PURE__ */ jsx18("li", { className: "nish-flow-feed-item", "data-fresh": fresh.has(item.id) || void 0, "data-tone": item.tone ?? "neutral", children: /* @__PURE__ */ jsx18("div", { className: "nish-flow-feed-inner", children: /* @__PURE__ */ jsxs17("div", { className: "nish-flow-feed-row", children: [
    /* @__PURE__ */ jsx18("span", { className: cn("nish-flow-feed-dot", FEED_DOT[item.tone ?? "neutral"]), "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs17("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx18("div", { className: "break-words text-sm text-th-hi2", children: item.text }),
      item.source != null ? /* @__PURE__ */ jsx18("div", { className: "break-words text-xs text-th-hi3", children: item.source }) : null
    ] }),
    /* @__PURE__ */ jsx18("span", { className: "pt-0.5 text-right text-xs tabular-nums text-th-hi3", children: ago(item.at, { now: clock, style: "short" }) })
  ] }) }) }, item.id)) });
}
var ENTER_MS = 400;
var MOVE_MS = 300;
function reconcile(prev, items2, getKey, animate) {
  const prevMap = new Map(prev.map((e) => [e.key, e]));
  const seen = /* @__PURE__ */ new Set();
  const next = [];
  for (const item of items2) {
    const key = getKey(item);
    if (seen.has(key)) {
      warnDev(`AnimatedList: duplicate key "${key}"; only the first item with it is shown.`);
      continue;
    }
    seen.add(key);
    const old = prevMap.get(key);
    const phase = !old ? animate ? "enter" : "idle" : old.phase === "exit" ? "idle" : old.phase;
    next.push({ key, item, phase: animate ? phase : "idle" });
  }
  if (animate) {
    prev.forEach((e, i) => {
      if (seen.has(e.key)) return;
      let at = 0;
      if (i > 0) {
        const before = prev[i - 1].key;
        const idx = next.findIndex((x) => x.key === before);
        at = idx === -1 ? Math.min(i, next.length) : idx + 1;
      }
      next.splice(at, 0, e.phase === "exit" ? e : { ...e, phase: "exit" });
    });
  }
  return next;
}
function AnimatedList({
  items: items2,
  getKey,
  children,
  exitMs = 420,
  as = "ul",
  className,
  itemClassName
}) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState14(() => ({
    src: items2,
    reduced,
    entries: reconcile([], items2, getKey, false)
  }));
  let current = state;
  if (state.src !== items2 || state.reduced !== reduced) {
    current = { src: items2, reduced, entries: reconcile(state.entries, items2, getKey, !reduced) };
    setState(current);
  }
  const entries = current.entries;
  const els = useRef14(/* @__PURE__ */ new Map());
  const rects = useRef14(/* @__PURE__ */ new Map());
  const anims = useRef14(/* @__PURE__ */ new Map());
  const refCbs = useRef14(/* @__PURE__ */ new Map());
  const lastKeys = useRef14(null);
  const timers2 = useRef14(/* @__PURE__ */ new Map());
  useEffect16(() => {
    const wanted = /* @__PURE__ */ new Set();
    for (const e of entries) {
      if (e.phase === "idle") continue;
      const id = `${e.phase}:${e.key}`;
      wanted.add(id);
      if (timers2.current.has(id)) continue;
      timers2.current.set(
        id,
        setTimeout(
          () => {
            timers2.current.delete(id);
            if (e.phase === "exit") {
              const fresh = /* @__PURE__ */ new Map();
              els.current.forEach((el, k) => fresh.set(k, { x: el.offsetLeft, y: el.offsetTop }));
              rects.current = fresh;
            }
            setState((s) => ({
              ...s,
              entries: e.phase === "exit" ? s.entries.filter((x) => !(x.key === e.key && x.phase === "exit")) : s.entries.map((x) => x.key === e.key && x.phase === "enter" ? { ...x, phase: "idle" } : x)
            }));
          },
          e.phase === "exit" ? exitMs : ENTER_MS
        )
      );
    }
    timers2.current.forEach((timer, id) => {
      if (!wanted.has(id)) {
        clearTimeout(timer);
        timers2.current.delete(id);
      }
    });
  }, [entries, exitMs]);
  useEffect16(
    () => () => {
      timers2.current.forEach((timer) => clearTimeout(timer));
      timers2.current.clear();
    },
    []
  );
  useLayoutEffect4(() => {
    const next = /* @__PURE__ */ new Map();
    els.current.forEach((el, k) => next.set(k, { x: el.offsetLeft, y: el.offsetTop }));
    const keyList = entries.map((e) => e.key).join("\n");
    const reordered = lastKeys.current !== null && lastKeys.current !== keyList;
    lastKeys.current = keyList;
    const live = new Set(entries.map((e) => e.key));
    anims.current.forEach((anim, k) => {
      if (!live.has(k)) {
        anim.cancel();
        anims.current.delete(k);
      }
    });
    refCbs.current.forEach((_, k) => {
      if (!live.has(k)) refCbs.current.delete(k);
    });
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (active) {
      const ei = entries.findIndex((e) => e.phase === "exit" && els.current.get(e.key)?.contains(active));
      if (ei !== -1) {
        const target = [...entries.slice(ei + 1), ...entries.slice(0, ei).reverse()].find((e) => e.phase !== "exit");
        const focusable = target ? els.current.get(target.key)?.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])') : null;
        if (focusable) focusable.focus({ preventScroll: true });
      }
    }
    if (!reduced && reordered) {
      for (const e of entries) {
        if (e.phase === "exit") continue;
        const a = rects.current.get(e.key);
        const b = next.get(e.key);
        const el = els.current.get(e.key);
        if (!a || !b || !el || typeof el.animate !== "function") continue;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const running = anims.current.get(e.key);
        if (running) {
          const r1 = el.getBoundingClientRect();
          running.cancel();
          anims.current.delete(e.key);
          const r2 = el.getBoundingClientRect();
          dx += r1.left - r2.left;
          dy += r1.top - r2.top;
        }
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        const anim = el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: MOVE_MS,
          easing: EASE
        });
        anims.current.set(e.key, anim);
        anim.onfinish = () => {
          if (anims.current.get(e.key) === anim) anims.current.delete(e.key);
        };
      }
    }
    rects.current = next;
  }, [entries, reduced]);
  const refFor = (key) => {
    let cb = refCbs.current.get(key);
    if (!cb) {
      cb = (el) => {
        if (el) els.current.set(key, el);
        else els.current.delete(key);
      };
      refCbs.current.set(key, cb);
    }
    return cb;
  };
  const Root = as;
  const Item = as === "div" ? "div" : "li";
  return /* @__PURE__ */ jsx18(Root, { className, children: entries.map((e) => /* @__PURE__ */ jsx18(
    Item,
    {
      ref: refFor(e.key),
      className: cn("nish-flow-item", itemClassName),
      "data-phase": e.phase,
      "aria-hidden": e.phase === "exit" || void 0,
      inert: e.phase === "exit" || void 0,
      style: e.phase === "exit" ? { "--nish-flow-exit-ms": `${exitMs}ms` } : void 0,
      children: /* @__PURE__ */ jsx18("div", { className: "nish-flow-item-inner", children: children(e.item, e.phase) })
    },
    e.key
  )) });
}

// src/components/canvas.tsx
import {
  Fragment as Fragment9,
  memo,
  useCallback as useCallback6,
  useEffect as useEffect17,
  useLayoutEffect as useLayoutEffect5,
  useMemo as useMemo5,
  useRef as useRef15,
  useState as useState15
} from "react";
import { Fragment as Fragment10, jsx as jsx19, jsxs as jsxs18 } from "react/jsx-runtime";
var NODE_W = 172;
var NODE_H = 56;
var NODE_GAP = 12;
var GROUP_PAD = 16;
var GROUP_HEAD = 52;
var MIN_COLUMN_STEP = 420;
var CHANNEL_EDGE = 60;
function layoutSystem(groups, o = {}) {
  const columnGap = o.columnGap ?? 120;
  const rowGap = o.rowGap ?? 40;
  const columns = [...new Set(groups.map((g) => g.column))].sort((a, b) => a - b);
  const sized = /* @__PURE__ */ new Map();
  for (const g of groups) {
    const cols = g.nodes.length > 1 ? 2 : 1;
    const rows = Math.ceil(g.nodes.length / cols);
    const w = GROUP_PAD * 2 + cols * NODE_W + (cols - 1) * NODE_GAP;
    const h = GROUP_HEAD + GROUP_PAD + (rows > 0 ? rows * NODE_H + (rows - 1) * NODE_GAP : 0);
    sized.set(g.id, { w, h, cols });
  }
  const stackHeight = (list) => list.reduce((sum, g) => sum + sized.get(g.id).h, 0) + Math.max(0, list.length - 1) * rowGap;
  const whole = columns.map((c) => groups.filter((g) => g.column === c));
  const sorted = whole.map(stackHeight).sort((a, b) => a - b);
  const median = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];
  const members = [];
  for (const list of whole) {
    const h = stackHeight(list);
    const parts = median > 0 && list.length > 1 ? Math.min(3, list.length, Math.ceil(h / (median * 1.5))) : 1;
    if (parts <= 1) {
      members.push(list);
      continue;
    }
    const goal = h / parts;
    let cur = [];
    let cuts = 0;
    for (const g of list) {
      if (cur.length > 0 && cuts < parts - 1 && stackHeight(cur) + rowGap + sized.get(g.id).h / 2 > goal) {
        members.push(cur);
        cur = [];
        cuts++;
      }
      cur.push(g);
    }
    members.push(cur);
  }
  const heights = members.map(stackHeight);
  const tallest = heights.reduce((m, h) => Math.max(m, h), 0);
  const out = { width: 0, height: tallest, groups: {}, nodes: {} };
  let x = members.length > 0 ? CHANNEL_EDGE : 0;
  members.forEach((list, ci) => {
    const widest = list.reduce((m, g) => Math.max(m, sized.get(g.id).w), 0);
    let y = (tallest - heights[ci]) / 2;
    for (const g of list) {
      const s = sized.get(g.id);
      out.groups[g.id] = { x, y, w: s.w, h: s.h };
      g.nodes.forEach((n, i) => {
        out.nodes[n.id] = {
          x: x + GROUP_PAD + i % s.cols * (NODE_W + NODE_GAP),
          y: y + GROUP_HEAD + Math.floor(i / s.cols) * (NODE_H + NODE_GAP),
          w: NODE_W,
          h: NODE_H
        };
      });
      y += s.h + rowGap;
    }
    out.width = Math.max(out.width, x + widest);
    x += Math.max(MIN_COLUMN_STEP, widest + columnGap);
  });
  if (members.length > 0) out.width += CHANNEL_EDGE;
  return out;
}
var MIN_K = 0.3;
var MAX_K = 2;
var PHONE_K = 0.55;
var PHONE_MAX_W = 600;
var FIT_PAD = 48;
var TITLE_ROOM = 36;
var LABEL_K = 0.8;
var ANIM_MS = 300;
var DRAG_PX = 4;
var KEY_PAN = 48;
var ZOOM_STEP = 1.25;
var clampK = (k) => Math.min(MAX_K, Math.max(MIN_K, k));
var ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function zoomAround(v, k, px, py) {
  const nk = clampK(k);
  const r = nk / v.k;
  return { k: nk, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}
function centerOn(w, h, k, box) {
  return { k, x: w / 2 - (box.x + box.w / 2) * k, y: h / 2 - (box.y + box.h / 2) * k };
}
function Svg4({ children, ...rest }) {
  return /* @__PURE__ */ jsx19(
    "svg",
    {
      width: 16,
      height: 16,
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
var KIND_ICON = {
  ui: /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx19("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ jsx19("path", { d: "M3 9h18" })
  ] }),
  service: /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx19("rect", { x: "3", y: "3", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ jsx19("rect", { x: "3", y: "14", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ jsx19("path", { d: "M7 6.5h.01M7 17.5h.01" })
  ] }),
  worker: /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx19("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ jsx19("path", { d: "M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" })
  ] }),
  library: /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx19("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
    /* @__PURE__ */ jsx19("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
  ] }),
  infra: /* @__PURE__ */ jsx19("path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }),
  data: /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx19("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }),
    /* @__PURE__ */ jsx19("path", { d: "M3 5v14a9 3 0 0 0 18 0V5" }),
    /* @__PURE__ */ jsx19("path", { d: "M3 12a9 3 0 0 0 18 0" })
  ] }),
  tool: /* @__PURE__ */ jsx19("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }),
  docs: /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx19("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    /* @__PURE__ */ jsx19("path", { d: "M14 2v6h6M8 13h8M8 17h5" })
  ] })
};
var PlusIcon2 = () => /* @__PURE__ */ jsx19(Svg4, { children: /* @__PURE__ */ jsx19("path", { d: "M12 5v14M5 12h14" }) });
var MinusIcon2 = () => /* @__PURE__ */ jsx19(Svg4, { children: /* @__PURE__ */ jsx19("path", { d: "M5 12h14" }) });
var FitIcon = () => /* @__PURE__ */ jsxs18(Svg4, { children: [
  /* @__PURE__ */ jsx19("path", { d: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" }),
  /* @__PURE__ */ jsx19("rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" })
] });
function hueStyle(hue) {
  return {
    "--c": hue ? `var(--nish-${hue})` : "var(--nish-accent)",
    "--c-soft": hue ? `var(--nish-${hue}-soft)` : "var(--nish-accent-soft)"
  };
}
var clamp01 = (n) => n == null || !Number.isFinite(n) ? 0 : Math.min(1, Math.max(0, n));
function usePing(active) {
  const ref = useRef15(null);
  const prev = useRef15(active);
  useLayoutEffect5(() => {
    const was = prev.current;
    prev.current = active;
    const el = ref.current;
    if (!el || was || !active) return;
    el.removeAttribute("data-fx");
    void el.offsetWidth;
    el.setAttribute("data-fx", "ping");
    const timer = setTimeout(() => el.removeAttribute("data-fx"), 450);
    return () => clearTimeout(timer);
  }, [active]);
  return ref;
}
var NodeView = memo(
  function NodeView2({ node, groupTitle, hue, box, selected, delay, onSelect }) {
    const active = !!node.active;
    const heat = clamp01(node.heat);
    const ref = usePing(active);
    const count = node.count ?? 0;
    const style = {
      ...hueStyle(hue),
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      "--nish-canvas-delay": `${delay}ms`
    };
    if (!active && heat > 0) {
      style.borderColor = `color-mix(in srgb, var(--c) ${Math.round(heat * 70)}%, var(--nish-line))`;
      style.boxShadow = `0 0 ${Math.round(6 + heat * 16)}px color-mix(in srgb, var(--c) ${Math.round(heat * 60)}%, transparent)`;
    }
    const aria = `${node.label}, ${groupTitle}${active ? node.note ? `, active: ${node.note}` : ", active" : ""}`;
    return /* @__PURE__ */ jsx19("div", { className: "nish-canvas-slot", style, "data-active": active || void 0, children: /* @__PURE__ */ jsxs18(
      "button",
      {
        ref,
        type: "button",
        className: "nish-canvas-node",
        "data-canvas-id": node.id,
        "data-active": active || void 0,
        "data-selected": selected || void 0,
        "data-heat": heat > 0 || void 0,
        "aria-label": aria,
        "aria-pressed": selected,
        onClick: () => onSelect?.(node.id, "node"),
        children: [
          node.kind ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsx19(Svg4, { children: KIND_ICON[node.kind] }) }) : null,
          /* @__PURE__ */ jsxs18("span", { className: "nish-canvas-text", children: [
            /* @__PURE__ */ jsx19("span", { className: "nish-canvas-label", children: node.label }),
            active && node.note ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-note", "aria-hidden": "true", children: /* @__PURE__ */ jsx19(TickerText, { text: node.note, as: "span" }) }) : node.detail ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-detail", children: node.detail }) : null
          ] }),
          count > 1 ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-count", children: count }) : null,
          active ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-live", "aria-hidden": "true" }) : null
        ]
      }
    ) });
  },
  (a, b) => a.groupTitle === b.groupTitle && a.hue === b.hue && a.selected === b.selected && a.delay === b.delay && a.onSelect === b.onSelect && a.box.x === b.box.x && a.box.y === b.box.y && a.node.id === b.node.id && a.node.label === b.node.label && a.node.kind === b.node.kind && a.node.detail === b.node.detail && a.node.active === b.node.active && a.node.note === b.node.note && a.node.count === b.node.count && Math.round(clamp01(a.node.heat) * 100) === Math.round(clamp01(b.node.heat) * 100)
);
var LANE_MARGIN = 16;
var TRACK_GAP = 8;
var CLEARANCE = 8;
var OUTSIDE_GAP = 24;
var CORNER_R = 6;
function roundedPath(pts) {
  const f = (v) => String(Math.round(v * 100) / 100);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const [cx, cy] = pts[i + 1];
    const r = Math.min(CORNER_R, (Math.abs(bx - ax) + Math.abs(by - ay)) / 2, (Math.abs(cx - bx) + Math.abs(cy - by)) / 2);
    const ux = Math.sign(bx - ax);
    const uy = Math.sign(by - ay);
    const vx = Math.sign(cx - bx);
    const vy = Math.sign(cy - by);
    d += `L${f(bx - ux * r)} ${f(by - uy * r)}A${f(r)} ${f(r)} 0 0 ${ux * vy - uy * vx > 0 ? 1 : 0} ${f(bx + vx * r)} ${f(by + vy * r)}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${f(last[0])} ${f(last[1])}`;
}
function corners(pts) {
  const out = [];
  for (const p of pts) {
    const prev = out[out.length - 1];
    if (prev && prev[0] === p[0] && prev[1] === p[1]) continue;
    const before = out[out.length - 2];
    if (prev && before && (before[0] === prev[0] && prev[0] === p[0] || before[1] === prev[1] && prev[1] === p[1])) out.pop();
    out.push(p);
  }
  return out;
}
function labelPoint(pts) {
  let best = { x: pts[0][0], y: pts[0][1] };
  let len = -1;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const l = Math.abs(bx - ax) + Math.abs(by - ay);
    if (l > len) {
      len = l;
      best = { x: (ax + bx) / 2, y: (ay + by) / 2 };
    }
  }
  return best;
}
function routeEdges(layout, groups, edges) {
  const result = {};
  const cards = [];
  for (const g of groups) {
    const box = layout.groups[g.id];
    if (box) cards.push({ id: g.id, box });
  }
  if (cards.length === 0) return result;
  const colX = [...new Set(cards.map((c) => c.box.x))].sort((a, b) => a - b);
  const cols = colX.map((x) => ({ x, right: x, boxes: [] }));
  const colOf = /* @__PURE__ */ new Map();
  for (const { id, box } of cards) {
    const ci = colX.indexOf(box.x);
    colOf.set(id, ci);
    cols[ci].right = Math.max(cols[ci].right, box.x + box.w);
    cols[ci].boxes.push(box);
  }
  const channelOf = (j) => {
    if (j <= 0) return [cols[0].x - CHANNEL_EDGE, cols[0].x];
    if (j >= cols.length) return [cols[cols.length - 1].right, cols[cols.length - 1].right + CHANNEL_EDGE];
    return [cols[j - 1].right, cols[j].x];
  };
  const minY = cards.reduce((m, c) => Math.min(m, c.box.y), Infinity);
  const maxY = cards.reduce((m, c) => Math.max(m, c.box.y + c.box.h), -Infinity);
  const groupOfNode = /* @__PURE__ */ new Map();
  for (const g of groups) for (const n of g.nodes) groupOfNode.set(n.id, g.id);
  const portOf = (id, side) => {
    const nb = layout.nodes[id];
    const gid = nb ? groupOfNode.get(id) : id;
    const gb = gid ? layout.groups[gid] : void 0;
    if (!gid || !gb || !colOf.has(gid)) return void 0;
    const y = nb ? nb.y + nb.h / 2 : gb.y + gb.h / 2;
    return { key: `${side}|${gid}|${y}`, x: side === "o" ? gb.x + gb.w : gb.x, y, col: colOf.get(gid) };
  };
  const fanOut = /* @__PURE__ */ new Map();
  const wires = [];
  for (const edge of edges) {
    const src = portOf(edge.from, "o");
    const dst = portOf(edge.to, "i");
    if (!src || !dst) continue;
    fanOut.set(src.key, (fanOut.get(src.key) ?? 0) + 1);
    wires.push({ edge, src, dst, mode: dst.col === src.col + 1 ? "next" : dst.col > src.col ? "far" : "back", exit: "", entry: "" });
  }
  const lanes = /* @__PURE__ */ new Map();
  const inChannel = /* @__PURE__ */ new Map();
  const lane = (channel, key, w) => {
    const id = `${channel}|${key}`;
    let l = lanes.get(id);
    if (!l) {
      l = { key: id, ys: 0, n: 0, x: 0 };
      lanes.set(id, l);
      const list = inChannel.get(channel);
      if (list) list.push(l);
      else inChannel.set(channel, [l]);
    }
    l.ys += (w.src.y + w.dst.y) / 2;
    l.n++;
    return id;
  };
  for (const w of wires) {
    if (w.mode === "next") {
      w.exit = w.entry = lane(w.dst.col, fanOut.get(w.src.key) > 1 ? w.src.key : w.dst.key, w);
    } else {
      w.exit = lane(w.src.col + 1, w.src.key, w);
      w.entry = lane(w.dst.col, w.dst.key, w);
    }
  }
  for (const [channel, list] of inChannel) {
    const [l, r] = channelOf(channel);
    const lo = l + LANE_MARGIN;
    const hi = r - LANE_MARGIN;
    list.sort((a, b) => a.ys / a.n - b.ys / b.n || (a.key < b.key ? -1 : 1));
    list.forEach((ln, i) => {
      ln.x = list.length === 1 || hi <= lo ? (l + r) / 2 : lo + (hi - lo) * i / (list.length - 1);
    });
  }
  const taken = [];
  for (const w of wires) {
    taken.push({ y: w.src.y, xa: w.src.x, xb: lanes.get(w.exit).x, src: w.src.key, dst: w.dst.key, track: false });
    taken.push({ y: w.dst.y, xa: lanes.get(w.entry).x, xb: w.dst.x, src: w.src.key, dst: w.dst.key, track: false });
  }
  const sameLine = (h, w) => h.src === w.src.key || h.dst === w.dst.key;
  const trackFree = (y, xa, xb, w) => {
    for (const h of taken) {
      if (Math.min(xb, h.xb) - Math.max(xa, h.xa) <= 0.5) continue;
      const dy = Math.abs(h.y - y);
      if (dy < 0.5 ? !sameLine(h, w) : h.track && dy < TRACK_GAP - 0.5) return false;
    }
    return true;
  };
  const spanOf = (w) => w.mode === "far" ? [w.src.col + 1, w.dst.col - 1] : [w.dst.col, w.src.col];
  const cardFree = (y, c0, c1) => {
    for (let c = c0; c <= c1; c++) for (const b of cols[c].boxes) if (y > b.y - CLEARANCE + 1e-6 && y < b.y + b.h + CLEARANCE - 1e-6) return false;
    return true;
  };
  const bandCache = /* @__PURE__ */ new Map();
  const bandsOf = (c0, c1) => {
    const id = `${c0}-${c1}`;
    let bands = bandCache.get(id);
    if (bands) return bands;
    const spans = [];
    for (let c = c0; c <= c1; c++) for (const b of cols[c].boxes) spans.push([b.y - CLEARANCE, b.y + b.h + CLEARANCE]);
    spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    bands = [];
    let end = spans[0][1];
    for (const [a, b] of spans) {
      if (a >= end) bands.push([end, a]);
      end = Math.max(end, b);
    }
    bandCache.set(id, bands);
    return bands;
  };
  const gap = (avg, [lo, hi]) => avg < lo ? lo - avg : avg > hi ? avg - hi : 0;
  const wanted = /* @__PURE__ */ new Map();
  for (const w of wires) {
    if (w.mode === "next") continue;
    const avg = (w.src.y + w.dst.y) / 2;
    let best;
    for (const b of bandsOf(...spanOf(w))) if (!best || gap(avg, b) < gap(avg, best)) best = b;
    if (best) wanted.set(`${best[0]}|${best[1]}`, (wanted.get(`${best[0]}|${best[1]}`) ?? 0) + 1);
  }
  const trackYs = /* @__PURE__ */ new Map();
  for (const w of wires) {
    if (w.mode === "next") continue;
    const [c0, c1] = spanOf(w);
    const avg = (w.src.y + w.dst.y) / 2;
    const near = (a, b) => Math.abs(a - avg) - Math.abs(b - avg) || a - b;
    const candidates = [];
    for (const h of taken) if (h.track && sameLine(h, w) && !candidates.includes(h.y)) candidates.push(h.y);
    for (const b of [...bandsOf(c0, c1)].sort((p, q) => gap(avg, p) - gap(avg, q) || p[0] - q[0])) {
      const n = Math.min(Math.floor((b[1] - b[0]) / TRACK_GAP) + 1, wanted.get(`${b[0]}|${b[1]}`) ?? 1);
      const slots = [];
      for (let i = 0; i < n; i++) slots.push((b[0] + b[1]) / 2 + TRACK_GAP * (i - (n - 1) / 2));
      candidates.push(...slots.sort(near));
    }
    const outer = [];
    for (let k = 0; k <= wires.length; k++) outer.push(minY - OUTSIDE_GAP - TRACK_GAP * k, maxY + OUTSIDE_GAP + TRACK_GAP * k);
    candidates.push(...outer.sort(near));
    const xo = lanes.get(w.exit).x;
    const xe = lanes.get(w.entry).x;
    const xa = Math.min(xo, xe);
    const xb = Math.max(xo, xe);
    const y = candidates.find((c) => cardFree(c, c0, c1) && trackFree(c, xa, xb, w)) ?? candidates[candidates.length - 1];
    trackYs.set(w.edge.id, y);
    taken.push({ y, xa, xb, src: w.src.key, dst: w.dst.key, track: true });
  }
  for (const w of wires) {
    const { src, dst } = w;
    const xo = lanes.get(w.exit).x;
    const xe = lanes.get(w.entry).x;
    const ty = trackYs.get(w.edge.id);
    const raw = w.mode === "next" ? [[src.x, src.y], [xo, src.y], [xo, dst.y], [dst.x, dst.y]] : [[src.x, src.y], [xo, src.y], [xo, ty], [xe, ty], [xe, dst.y], [dst.x, dst.y]];
    const points = corners(raw);
    result[w.edge.id] = { id: w.edge.id, points, d: roundedPath(points) };
  }
  return result;
}
function SystemCanvas({
  groups,
  edges,
  columns,
  selected = null,
  onSelect,
  height = "100%",
  label = "System map",
  className
}) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef15(null);
  const worldRef = useRef15(null);
  const view = useRef15({ x: 0, y: 0, k: 1 });
  const target = useRef15(null);
  const raf = useRef15(0);
  const size = useRef15({ w: 0, h: 0 });
  const touched = useRef15(false);
  const zoomLabelRef = useRef15(null);
  const [labelsOn, setLabelsOn] = useState15(true);
  const sig = groups.map((g) => `${g.id}:${g.column}:${g.nodes.map((n) => n.id).join(",")}`).join("|");
  const layout = useMemo5(() => layoutSystem(groups), [sig]);
  const latest = useRef15({ groups, layout });
  latest.current = { groups, layout };
  const apply = useCallback6((v) => {
    view.current = v;
    const world = worldRef.current;
    const vp = viewportRef.current;
    if (world) world.style.transform = `translate3d(${v.x}px,${v.y}px,0) scale(${v.k})`;
    if (vp) {
      const maj = `${120 * v.k}px ${120 * v.k}px`;
      const min = `${24 * v.k}px ${24 * v.k}px`;
      vp.style.backgroundPosition = `${v.x}px ${v.y}px`;
      vp.style.backgroundSize = `${maj}, ${maj}, ${min}, ${min}`;
      vp.dataset.grid = v.k < 0.6 ? "major" : "both";
    }
    const zl = zoomLabelRef.current;
    if (zl) {
      const text = `${Math.round(v.k * 100)}%`;
      if (zl.textContent !== text) zl.textContent = text;
    }
    const on = v.k >= LABEL_K;
    setLabelsOn((old) => old === on ? old : on);
  }, []);
  const stop = useCallback6(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    target.current = null;
  }, []);
  const go = useCallback6(
    (v, animate) => {
      cancelAnimationFrame(raf.current);
      if (!animate || reduced) {
        target.current = null;
        apply(v);
        return;
      }
      const from = { ...view.current };
      target.current = v;
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ANIM_MS);
        const e = ease(t);
        const k = from.k * Math.pow(v.k / from.k, e);
        apply({ k, x: from.x + (v.x - from.x) * e, y: from.y + (v.y - from.y) * e });
        if (t < 1) raf.current = requestAnimationFrame(step);
        else {
          raf.current = 0;
          target.current = null;
          apply(v);
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, reduced]
  );
  const fitView = useCallback6(() => {
    const { w, h } = size.current;
    const { groups: gs, layout: lay } = latest.current;
    const cw = Math.max(1, lay.width);
    const ch = Math.max(1, lay.height + TITLE_ROOM);
    const fit = Math.min((w - FIT_PAD * 2) / cw, (h - FIT_PAD * 2) / ch, 1);
    if (fit >= PHONE_K || w >= PHONE_MAX_W && fit >= MIN_K || gs.length === 0) {
      const k = clampK(Number.isFinite(fit) && fit > 0 ? fit : 1);
      return { k, x: (w - lay.width * k) / 2, y: (h - ch * k) / 2 + TITLE_ROOM * k };
    }
    let box;
    for (const g of gs) {
      const n = g.nodes.find((node) => node.active);
      if (n) {
        box = lay.nodes[n.id];
        break;
      }
    }
    box ??= lay.groups[gs[0].id];
    return box ? centerOn(w, h, PHONE_K, box) : { k: PHONE_K, x: FIT_PAD, y: FIT_PAD + TITLE_ROOM * PHONE_K };
  }, []);
  const doFit = useCallback6(
    (animate) => {
      if (size.current.w <= 0 || size.current.h <= 0) return;
      go(fitView(), animate);
    },
    [fitView, go]
  );
  useLayoutEffect5(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const r = vp.getBoundingClientRect();
      size.current = { w: r.width, h: r.height };
      if (!touched.current) doFit(false);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [doFit]);
  useLayoutEffect5(() => {
    if (!touched.current) doFit(false);
  }, [sig, doFit]);
  useEffect17(() => () => cancelAnimationFrame(raf.current), []);
  const zoomBy = useCallback6(
    (factor, animate) => {
      touched.current = true;
      const base = target.current ?? view.current;
      const { w, h } = size.current;
      go(zoomAround(base, base.k * factor, w / 2, h / 2), animate);
    },
    [go]
  );
  useEffect17(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e) => {
      if (e.target?.closest("[data-canvas-ui]")) return;
      e.preventDefault();
      stop();
      touched.current = true;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.current.h : 1;
      const v = view.current;
      if (e.ctrlKey) {
        const r = vp.getBoundingClientRect();
        apply(zoomAround(v, v.k * Math.exp(-e.deltaY * unit * 15e-4), e.clientX - r.left, e.clientY - r.top));
      } else {
        apply({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit });
      }
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [apply, stop]);
  const pointers = useRef15(/* @__PURE__ */ new Map());
  const gesture = useRef15({ mode: "none", startX: 0, startY: 0, lastX: 0, lastY: 0, pinchDist: 1, pinchMid: { x: 0, y: 0 }, pinchView: { x: 0, y: 0, k: 1 } });
  const dragged = useRef15(false);
  const local = (e) => {
    const r = viewportRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const startPinch = () => {
    const pts = [...pointers.current.values()];
    const [a, b] = pts;
    const g = gesture.current;
    g.mode = "pinch";
    g.pinchDist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    g.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    g.pinchView = { ...view.current };
    dragged.current = true;
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("[data-canvas-ui]")) return;
    stop();
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const vp = viewportRef.current;
    const g = gesture.current;
    if (pointers.current.size === 1) {
      dragged.current = false;
      g.mode = "pending";
      g.startX = g.lastX = p.x;
      g.startY = g.lastY = p.y;
    } else if (pointers.current.size === 2) {
      for (const id of pointers.current.keys()) {
        try {
          vp.setPointerCapture(id);
        } catch {
        }
      }
      touched.current = true;
      startPinch();
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s = g.pinchView;
      const k = clampK(s.k * (dist / g.pinchDist));
      const wx = (g.pinchMid.x - s.x) / s.k;
      const wy = (g.pinchMid.y - s.y) / s.k;
      apply({ k, x: mid.x - wx * k, y: mid.y - wy * k });
      return;
    }
    if (g.mode === "pending") {
      if (Math.hypot(p.x - g.startX, p.y - g.startY) < DRAG_PX) return;
      stop();
      g.mode = "pan";
      dragged.current = true;
      touched.current = true;
      try {
        viewportRef.current.setPointerCapture(e.pointerId);
      } catch {
      }
      viewportRef.current.dataset.dragging = "true";
    }
    if (g.mode === "pan") {
      const v = view.current;
      apply({ ...v, x: v.x + (p.x - g.lastX), y: v.y + (p.y - g.lastY) });
      g.lastX = p.x;
      g.lastY = p.y;
    }
  };
  const endPointer = (e) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const vp = viewportRef.current;
    try {
      vp.releasePointerCapture(e.pointerId);
    } catch {
    }
    const g = gesture.current;
    if (pointers.current.size === 1 && g.mode === "pinch") {
      const [rest] = [...pointers.current.values()];
      g.mode = "pan";
      g.lastX = rest.x;
      g.lastY = rest.y;
    } else if (pointers.current.size === 0) {
      g.mode = "none";
      delete vp.dataset.dragging;
      setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
  };
  const onClickCapture = (e) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  const onScroll = () => {
    const vp = viewportRef.current;
    if (vp && (vp.scrollLeft !== 0 || vp.scrollTop !== 0)) {
      vp.scrollLeft = 0;
      vp.scrollTop = 0;
    }
  };
  const onFocusCapture = (e) => {
    const vp = viewportRef.current;
    const el = e.target;
    if (!vp || el === vp) return;
    if (pointers.current.size > 0 || !el.matches(":focus-visible")) return;
    const id = el.closest("[data-canvas-id]")?.dataset.canvasId;
    if (!id) return;
    const box = latest.current.layout.nodes[id] ?? latest.current.layout.groups[id];
    if (!box) return;
    const v = view.current;
    const { w, h } = size.current;
    const left = box.x * v.k + v.x;
    const top = box.y * v.k + v.y;
    if (left >= 0 && top >= 0 && left + box.w * v.k <= w && top + box.h * v.k <= h) return;
    touched.current = true;
    go(centerOn(w, h, v.k, box), true);
  };
  const onKeyDown = (e) => {
    if (e.altKey || e.metaKey) return;
    if (e.target.closest("[data-canvas-ui]")) return;
    const v = view.current;
    switch (e.key) {
      case "ArrowLeft":
        stop();
        touched.current = true;
        apply({ ...v, x: v.x + KEY_PAN });
        break;
      case "ArrowRight":
        stop();
        touched.current = true;
        apply({ ...v, x: v.x - KEY_PAN });
        break;
      case "ArrowUp":
        stop();
        touched.current = true;
        apply({ ...v, y: v.y + KEY_PAN });
        break;
      case "ArrowDown":
        stop();
        touched.current = true;
        apply({ ...v, y: v.y - KEY_PAN });
        break;
      case "+":
      case "=":
        zoomBy(ZOOM_STEP, true);
        break;
      case "-":
      case "_":
        zoomBy(1 / ZOOM_STEP, true);
        break;
      case "0":
        touched.current = false;
        doFit(true);
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const columnIndex = useMemo5(() => {
    const order = [...new Set(groups.map((g) => g.column))].sort((a, b) => a - b);
    return new Map(order.map((c, i) => [c, i]));
  }, [sig]);
  const lookup = useMemo5(() => {
    const nodes = /* @__PURE__ */ new Map();
    const grps = /* @__PURE__ */ new Map();
    for (const g of groups) {
      grps.set(g.id, g);
      for (const n of g.nodes) nodes.set(n.id, { group: g, node: n });
    }
    return { nodes, grps };
  }, [groups]);
  const columnTitles = useMemo5(() => {
    if (!columns) return [];
    const seen = /* @__PURE__ */ new Map();
    for (const g of groups) {
      const box = layout.groups[g.id];
      if (!box) continue;
      const old = seen.get(g.column);
      if (!old) seen.set(g.column, { x: box.x, y: box.y });
      else
        seen.set(g.column, {
          x: Math.min(old.x, box.x),
          y: Math.min(old.y, box.y)
        });
    }
    return [...seen.entries()].filter(([c]) => columns[c]).map(([c, p]) => ({ c, x: p.x, y: p.y - TITLE_ROOM, text: columns[c] }));
  }, [columns, groups, layout]);
  const edgeSig = edges.map((e) => `${e.id}:${e.from}:${e.to}`).join("|");
  const routes = useMemo5(() => routeEdges(layout, groups, edges), [layout, edgeSig]);
  const { edgeViews, ports } = useMemo5(() => {
    const hueOf = (id) => {
      const n = lookup.nodes.get(id);
      if (n) return { hue: n.group.hue, active: !!n.node.active };
      const g = lookup.grps.get(id);
      if (g) return { hue: g.hue, active: g.nodes.some((x) => x.active) };
      return void 0;
    };
    const views = edges.flatMap((edge) => {
      const route = routes[edge.id];
      const to = hueOf(edge.to);
      if (!route || !to) return [];
      return [{ edge, route, mid: labelPoint(route.points), hue: to.hue, active: to.active }];
    });
    views.sort((a, b) => Number(a.active) - Number(b.active));
    const dots = /* @__PURE__ */ new Map();
    for (const v of views) {
      for (const p of [v.route.points[0], v.route.points[v.route.points.length - 1]]) {
        const key = `${p[0]}|${p[1]}`;
        const old = dots.get(key);
        if (!old || v.active && !old.active) dots.set(key, { x: p[0], y: p[1], hue: v.hue, active: v.active });
      }
    }
    return { edgeViews: views, ports: [...dots.entries()] };
  }, [edges, routes, lookup]);
  return /* @__PURE__ */ jsxs18(
    "div",
    {
      ref: viewportRef,
      role: "application",
      "aria-label": label,
      "aria-roledescription": "canvas",
      tabIndex: 0,
      className: cn("nish-canvas", className),
      style: { height },
      "data-grid": "both",
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onClickCapture,
      onKeyDown,
      onScroll,
      onFocusCapture,
      children: [
        /* @__PURE__ */ jsxs18("div", { ref: worldRef, className: "nish-canvas-world", style: { width: layout.width, height: layout.height }, children: [
          columnTitles.map((t) => /* @__PURE__ */ jsx19("div", { className: "nish-canvas-coltitle", style: { left: t.x, top: t.y }, children: t.text }, t.c)),
          /* @__PURE__ */ jsx19("svg", { className: "nish-canvas-edges", width: layout.width, height: layout.height, "aria-hidden": "true", focusable: "false", children: edgeViews.map(({ edge, route, mid, hue, active }) => /* @__PURE__ */ jsxs18("g", { style: hueStyle(hue), className: "nish-canvas-edge", "data-active": active || void 0, "data-dashed": edge.dashed || void 0, children: [
            /* @__PURE__ */ jsx19("path", { className: "nish-canvas-edge-line", d: route.d, fill: "none" }),
            active ? /* @__PURE__ */ jsx19("circle", { className: "nish-canvas-dot", r: "3.5", style: { offsetPath: `path("${route.d}")` } }) : null,
            edge.label && labelsOn ? /* @__PURE__ */ jsx19("text", { className: "nish-canvas-edge-label", x: mid.x, y: mid.y - 6, textAnchor: "middle", children: edge.label }) : null
          ] }, edge.id)) }),
          /* @__PURE__ */ jsx19("svg", { className: "nish-canvas-ports", width: layout.width, height: layout.height, "aria-hidden": "true", focusable: "false", children: ports.map(([key, p]) => /* @__PURE__ */ jsx19("circle", { className: "nish-canvas-port", cx: p.x, cy: p.y, r: 3, style: hueStyle(p.hue), "data-active": p.active || void 0 }, key)) }),
          groups.map((g) => {
            const box = layout.groups[g.id];
            if (!box) return null;
            const live = g.nodes.some((n) => n.active);
            const delay = (columnIndex.get(g.column) ?? 0) * 80;
            return /* @__PURE__ */ jsxs18(Fragment9, { children: [
              /* @__PURE__ */ jsxs18(
                "div",
                {
                  className: "nish-canvas-group",
                  style: {
                    ...hueStyle(g.hue),
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    "--nish-canvas-delay": `${delay}ms`
                  },
                  "data-live": live || void 0,
                  "data-selected": selected === g.id || void 0,
                  children: [
                    /* @__PURE__ */ jsx19("span", { className: "nish-canvas-band", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsxs18(
                      "button",
                      {
                        type: "button",
                        className: "nish-canvas-head",
                        "data-canvas-id": g.id,
                        "aria-pressed": selected === g.id,
                        onClick: () => onSelect?.(g.id, "group"),
                        children: [
                          /* @__PURE__ */ jsxs18("span", { className: "nish-canvas-headtext", children: [
                            /* @__PURE__ */ jsx19("span", { className: "nish-canvas-title", children: g.title }),
                            g.subtitle ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-subtitle", children: g.subtitle }) : null
                          ] }),
                          g.badge ? /* @__PURE__ */ jsx19("span", { className: "nish-canvas-badge", children: g.badge }) : null
                        ]
                      }
                    )
                  ]
                }
              ),
              g.nodes.map((n) => {
                const nb = layout.nodes[n.id];
                if (!nb) return null;
                return /* @__PURE__ */ jsx19(
                  NodeView,
                  {
                    node: n,
                    groupTitle: g.title,
                    hue: g.hue,
                    box: nb,
                    selected: selected === n.id,
                    delay,
                    onSelect
                  },
                  n.id
                );
              })
            ] }, g.id);
          })
        ] }),
        /* @__PURE__ */ jsxs18("div", { "data-canvas-ui": true, className: "nish-canvas-controls", children: [
          /* @__PURE__ */ jsx19("span", { ref: zoomLabelRef, className: "nish-canvas-zoom", "aria-hidden": "true", children: "100%" }),
          /* @__PURE__ */ jsx19(IconButton, { label: "Zoom out", variant: "ghost", className: "size-11", onClick: () => zoomBy(1 / ZOOM_STEP, true), children: /* @__PURE__ */ jsx19(MinusIcon2, {}) }),
          /* @__PURE__ */ jsx19(IconButton, { label: "Zoom in", variant: "ghost", className: "size-11", onClick: () => zoomBy(ZOOM_STEP, true), children: /* @__PURE__ */ jsx19(PlusIcon2, {}) }),
          /* @__PURE__ */ jsx19(
            IconButton,
            {
              label: "Fit to screen",
              variant: "ghost",
              className: "size-11",
              onClick: () => {
                touched.current = false;
                doFit(true);
              },
              children: /* @__PURE__ */ jsx19(FitIcon, {})
            }
          )
        ] })
      ]
    }
  );
}

// src/components/inbox.tsx
import { useEffect as useEffect18, useId as useId9, useRef as useRef16, useState as useState16 } from "react";

// src/server/inbox/types.ts
var INBOX_ACTION_HEADER = "X-Inbox-Action";
var INBOX_ACTION_TIMEOUT_MS = 8e3;
var INBOX_DEFAULT_SETTINGS = {
  timezone: "America/Chicago",
  quietHours: { enabled: true, start: "22:00", end: "07:00" },
  digest: { enabled: true, time: "08:00" },
  mutedSources: []
};
var INBOX_SOURCE_LABELS = {
  trading: "Trading",
  trackers: "Trackers",
  "job-apps": "Jobs",
  status: "Status",
  ci: "CI",
  "mc-packs": "Packs",
  workflows: "Workflows"
};

// src/components/inbox.tsx
import { Fragment as Fragment11, jsx as jsx20, jsxs as jsxs19 } from "react/jsx-runtime";
var DOT = {
  urgent: { tone: "loss", label: "Urgent" },
  normal: { tone: "accent", label: "Normal" },
  info: { tone: "neutral", label: "Info" }
};
function at8(now, days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(8, 0, 0, 0);
  return d;
}
var SNOOZE_OPTIONS = [
  { label: "1 hour", until: (now) => new Date(now.getTime() + 36e5) },
  { label: "4 hours", until: (now) => new Date(now.getTime() + 4 * 36e5) },
  { label: "Tomorrow 8 AM", until: (now) => at8(now, 1) },
  // The next Monday; a week ahead when today is Monday.
  { label: "Monday 8 AM", until: (now) => at8(now, (8 - now.getDay()) % 7 || 7) }
];
function looksClamped(body) {
  return body.length > 100 || body.split("\n").length > 3;
}
function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
var FALLBACK_COUNT = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function lastActionText(result, item) {
  const label = item.actions?.find((a) => a.id === result.actionId)?.label ?? result.actionId;
  const ms = Date.parse(result.at);
  const at = new Date(ms).toDateString() === (/* @__PURE__ */ new Date()).toDateString() ? time(ms) : dateTime(ms);
  if (result.ok) return `${label} ran ${at}`;
  const why = result.error ?? (result.status != null ? `HTTP ${result.status}` : null);
  return `${label} failed ${at}${why ? ` \xB7 ${why}` : ""}`;
}
function Row({ item, view, label, wide, selected, expanded, domId, onToggle, onHandle, onUnhandle, onSnooze, onUnsnooze, running, onAction }) {
  const dot = DOT[item.severity] ?? DOT.normal;
  const long = item.body != null && looksClamped(item.body);
  const href = item.url ? safeHref(item.url) : null;
  const actions = onAction && view !== "handled" ? item.actions ?? [] : [];
  const last = item.lastAction ?? null;
  const snoozeItems = SNOOZE_OPTIONS.map((o) => /* @__PURE__ */ jsx20(MenuItem, { icon: wide ? void 0 : /* @__PURE__ */ jsx20(ClockIcon, { size: 14 }), onSelect: () => onSnooze(item.id, o.until(/* @__PURE__ */ new Date())), children: o.label }, o.label));
  return /* @__PURE__ */ jsxs19("li", { id: domId, className: cn("flex items-start gap-3 px-4 py-3", selected && "bg-th-accent-soft"), children: [
    /* @__PURE__ */ jsx20(StatusDot, { tone: dot.tone, label: dot.label, className: "mt-1.5 shrink-0" }),
    /* @__PURE__ */ jsxs19("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxs19("div", { className: cn("flex flex-wrap items-center gap-x-2 text-xs", selected ? "text-th-hi2" : "text-th-hi3"), children: [
        /* @__PURE__ */ jsx20("span", { children: label }),
        /* @__PURE__ */ jsx20(RelativeTime, { value: item.updatedAt, style: "short" }),
        item.count > 1 ? /* @__PURE__ */ jsxs19("span", { role: "img", "aria-label": `Happened ${item.count} times`, className: "tabular-nums", children: [
          "\xD7",
          item.count
        ] }) : null
      ] }),
      /* @__PURE__ */ jsx20("p", { className: "m-0 line-clamp-2 break-words text-sm font-medium text-th-hi", children: href ? /* @__PURE__ */ jsx20("a", { href, target: "_blank", rel: "noopener noreferrer", className: "break-words hover:underline", children: item.title }) : item.title }),
      item.body ? /* @__PURE__ */ jsxs19(Fragment11, { children: [
        /* @__PURE__ */ jsx20("p", { className: cn("m-0 mt-0.5 whitespace-pre-line break-words text-sm text-th-hi2", !expanded && "line-clamp-3"), children: item.body }),
        long ? /* @__PURE__ */ jsx20(Button, { variant: "link", size: "sm", className: "pointer-coarse:-mx-2 pointer-coarse:min-h-11 pointer-coarse:px-2", "aria-expanded": expanded, onClick: () => onToggle(item.id), children: expanded ? "Less" : "More" }) : null
      ] }) : null,
      actions.length > 0 ? /* @__PURE__ */ jsx20("div", { className: "mt-2 flex flex-wrap gap-2", children: actions.map((a) => /* @__PURE__ */ jsx20(
        Button,
        {
          size: "sm",
          variant: "secondary",
          loading: running === a.id,
          disabled: running !== null && running !== a.id,
          onClick: () => onAction?.(item.id, a.id),
          children: a.label
        },
        a.id
      )) }) : null,
      last && (actions.length > 0 || view === "handled") ? /* @__PURE__ */ jsx20("p", { className: cn("m-0 mt-1 text-xs", last.ok ? "text-th-hi3" : "text-th-loss"), children: lastActionText(last, item) }) : null,
      view === "snoozed" && item.snoozedUntil ? /* @__PURE__ */ jsxs19("p", { className: "m-0 mt-0.5 text-xs text-th-hi3", children: [
        "Until ",
        dateTime(item.snoozedUntil)
      ] }) : null,
      view === "handled" && item.handledAt ? /* @__PURE__ */ jsxs19("p", { className: "m-0 mt-0.5 text-xs text-th-hi3", children: [
        "Handled ",
        ago(item.handledAt),
        item.handledBy === "source" ? " by the app" : item.handledBy === "expired" ? " automatically" : ""
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxs19("div", { className: "flex shrink-0 items-center gap-1", children: [
      view === "open" && wide ? /* @__PURE__ */ jsxs19(Fragment11, { children: [
        /* @__PURE__ */ jsx20(IconButton, { label: "Mark handled", onClick: () => onHandle(item.id), children: /* @__PURE__ */ jsx20(CheckIcon, { size: 18 }) }),
        /* @__PURE__ */ jsx20(DropdownMenu, { align: "end", trigger: /* @__PURE__ */ jsx20(IconButton, { label: "Snooze", children: /* @__PURE__ */ jsx20(ClockIcon, { size: 18 }) }), children: snoozeItems })
      ] }) : null,
      view === "open" && !wide ? /* @__PURE__ */ jsxs19(DropdownMenu, { align: "end", sheetBelow: "sm", sheetTitle: "Actions", trigger: /* @__PURE__ */ jsx20(IconButton, { label: "Actions", children: /* @__PURE__ */ jsx20(MoreIcon, { size: 18 }) }), children: [
        /* @__PURE__ */ jsx20(MenuItem, { icon: /* @__PURE__ */ jsx20(CheckIcon, { size: 14 }), onSelect: () => onHandle(item.id), children: "Mark handled" }),
        /* @__PURE__ */ jsx20(MenuSeparator, {}),
        /* @__PURE__ */ jsx20(MenuLabel, { children: "Snooze" }),
        snoozeItems
      ] }) : null,
      view === "snoozed" ? /* @__PURE__ */ jsx20(Button, { size: "sm", onClick: () => onUnsnooze(item.id), children: "Unsnooze" }) : null,
      view === "handled" ? /* @__PURE__ */ jsx20(Button, { size: "sm", onClick: () => onUnhandle(item.id), children: "Move back" }) : null
    ] })
  ] });
}
function Inbox({
  items: items2,
  view,
  onViewChange,
  counts,
  sources,
  source,
  onSourceChange,
  onHandle,
  onUnhandle,
  onSnooze,
  onUnsnooze,
  onHandleAll,
  onAction,
  loading = false,
  error = null,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  selectedId = null,
  sourceLabels = INBOX_SOURCE_LABELS,
  className
}) {
  const idBase = useId9().replace(/:/g, "");
  const wide = useMediaQuery("(min-width: 480px)");
  const [expanded, setExpanded] = useState16(() => /* @__PURE__ */ new Set());
  const [confirmAll, setConfirmAll] = useState16(false);
  const [running, setRunning] = useState16(() => /* @__PURE__ */ new Map());
  const scrolled = useRef16(null);
  const labelOf = (id) => sourceLabels[id] ?? id;
  const rowId = (id) => `${idBase}-item-${id}`;
  useEffect18(() => {
    if (selectedId == null || scrolled.current === selectedId) return;
    const el = document.getElementById(rowId(selectedId));
    if (!el) return;
    scrolled.current = selectedId;
    el.scrollIntoView({ block: "center" });
  }, [selectedId, items2]);
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const runAction = (itemId, actionId) => {
    if (!onAction || running.has(itemId)) return;
    setRunning((prev) => new Map(prev).set(itemId, actionId));
    const done = () => setRunning((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
    Promise.resolve().then(() => onAction(itemId, actionId)).catch(() => void 0).finally(done);
  };
  const tabs = [
    { value: "open", label: "Open", count: counts.open },
    { value: "snoozed", label: "Snoozed", count: counts.snoozed },
    { value: "handled", label: "Handled" }
  ];
  const handleAllCount = source ? sources.find((s) => s.id === source)?.open ?? items2.length : counts.open;
  const showHandleAll = view === "open" && !!onHandleAll && items2.length > 0 && !loading && !error;
  let body;
  if (loading) {
    body = /* @__PURE__ */ jsx20(SkeletonRows, { rows: 4, height: 64, className: "p-4" });
  } else if (error) {
    body = /* @__PURE__ */ jsx20(ErrorState, { message: error, onRetry, compact: true, className: "py-8" });
  } else if (items2.length === 0) {
    const from = source ? ` from ${labelOf(source)}` : "";
    const title = view === "open" ? `Nothing open${from}` : view === "snoozed" ? `Nothing snoozed${from}` : `Nothing handled${from} in the last 30 days`;
    body = /* @__PURE__ */ jsx20(EmptyState, { title, compact: true, className: "py-10" });
  } else {
    body = /* @__PURE__ */ jsx20("ul", { className: "m-0 list-none divide-y divide-th-line p-0", children: items2.map((item) => /* @__PURE__ */ jsx20(
      Row,
      {
        item,
        view,
        label: labelOf(item.source),
        wide,
        selected: item.id === selectedId,
        expanded: expanded.has(item.id),
        domId: rowId(item.id),
        onToggle: toggle,
        onHandle,
        onUnhandle,
        onSnooze,
        onUnsnooze,
        running: running.get(item.id) ?? null,
        onAction: onAction ? runAction : void 0
      },
      item.id
    )) });
  }
  return /* @__PURE__ */ jsxs19(Card, { padding: "none", className: cn("min-w-0 overflow-hidden", className), children: [
    /* @__PURE__ */ jsx20(Tabs, { label: "Inbox views", value: view, onChange: (v) => onViewChange(v), items: tabs, className: "px-4" }),
    sources.length > 1 ? /* @__PURE__ */ jsx20("div", { className: "min-w-0 border-b border-th-line py-2", children: /* @__PURE__ */ jsxs19(ChipGroup, { label: "Filter by source", scroll: true, className: "px-4", children: [
      /* @__PURE__ */ jsx20(Chip, { size: "sm", pressed: source === null, onClick: () => onSourceChange(null), children: "All" }),
      sources.map((s) => /* @__PURE__ */ jsx20(
        Chip,
        {
          size: "sm",
          pressed: source === s.id,
          onClick: () => onSourceChange(s.id),
          trailing: /* @__PURE__ */ jsx20("span", { className: "tabular-nums text-th-hi3", children: s.open }),
          className: "shrink-0",
          children: labelOf(s.id)
        },
        s.id
      ))
    ] }) }) : null,
    showHandleAll ? /* @__PURE__ */ jsx20("div", { className: "flex justify-end px-4 pt-2", children: /* @__PURE__ */ jsx20(Button, { size: "sm", variant: "ghost", onClick: () => setConfirmAll(true), children: "Mark all handled" }) }) : null,
    body,
    hasMore && !loading && !error ? /* @__PURE__ */ jsx20("div", { className: "flex justify-center border-t border-th-line p-2", children: /* @__PURE__ */ jsx20(Button, { variant: "ghost", loading: loadingMore, onClick: onLoadMore, children: "Load more" }) }) : null,
    confirmAll ? /* @__PURE__ */ jsx20(
      ConfirmDialog,
      {
        title: `Mark ${FALLBACK_COUNT(handleAllCount, "item", "items")} handled?`,
        confirmLabel: "Mark handled",
        tone: "primary",
        onCancel: () => setConfirmAll(false),
        onConfirm: () => {
          setConfirmAll(false);
          onHandleAll?.();
        }
      }
    ) : null
  ] });
}

// src/components/app-shell.tsx
import { Fragment as Fragment12, useEffect as useEffect19, useRef as useRef17, useState as useState17 } from "react";

// src/components/error-boundary.tsx
import { Component } from "react";
import { jsx as jsx21, jsxs as jsxs20 } from "react/jsx-runtime";
var CHUNK_MESSAGE = /Failed to fetch dynamically imported module|Importing a module script failed/;
function isChunkError(e) {
  return e.name === "ChunkLoadError" || CHUNK_MESSAGE.test(e.message);
}
function changed(a = [], b = []) {
  return a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));
}
var AppErrorBoundary = class extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
  componentDidCatch(error, info) {
    this.props.onError?.(error, { componentStack: info.componentStack });
  }
  componentDidUpdate(prev) {
    if (this.state.error && changed(prev.resetKeys, this.props.resetKeys)) this.reset();
  }
  reset = () => {
    this.setState({ error: null });
  };
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });
    const stale = isChunkError(error);
    const message = error.message.length > 300 ? `${error.message.slice(0, 300)}\u2026` : error.message;
    return /* @__PURE__ */ jsxs20(Card, { role: "alert", className: "mx-auto my-16 max-w-md", children: [
      /* @__PURE__ */ jsx21("h2", { className: "text-lg font-semibold text-th-hi", children: stale ? "A new version is available" : "Something went wrong" }),
      /* @__PURE__ */ jsx21("p", { className: "mt-1 break-words text-sm text-th-hi2", children: stale ? "Reload the page to get the latest version." : message || "An unexpected error occurred." }),
      error.stack ? /* @__PURE__ */ jsxs20("details", { className: "mt-3", children: [
        /* @__PURE__ */ jsx21("summary", { className: "inline-flex min-h-11 cursor-pointer items-center text-sm text-th-hi3", children: "Details" }),
        /* @__PURE__ */ jsx21("pre", { className: "mt-2 max-h-48 overflow-auto rounded-lg bg-th-elevated p-2 font-mono text-xs text-th-hi2", children: error.stack })
      ] }) : null,
      /* @__PURE__ */ jsxs20("div", { className: "mt-4 flex flex-wrap gap-2", children: [
        stale ? null : /* @__PURE__ */ jsx21(Button, { variant: "primary", onClick: this.reset, children: "Try again" }),
        /* @__PURE__ */ jsx21(Button, { variant: stale ? "primary" : "secondary", onClick: () => location.reload(), children: "Reload page" })
      ] })
    ] });
  }
};

// src/components/app-shell.tsx
import { Fragment as Fragment13, jsx as jsx22, jsxs as jsxs21 } from "react/jsx-runtime";
var MAIN_ID = "nish-main";
function AppShell({
  name,
  icon,
  homeHref = "/",
  hubHref,
  nav,
  primary = 4,
  moreItems = [],
  renderLink,
  actions,
  themeToggle,
  railFooter,
  loading = false,
  connection = {},
  container = "default",
  toaster = {},
  errorBoundary = true,
  resetKey,
  children
}) {
  const [sheet, setSheet] = useState17(false);
  const firstKey = useRef17(true);
  useEffect19(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    setSheet(false);
  }, [resetKey]);
  const n = nav.length <= 5 ? nav.length : Math.max(0, primary);
  const bottomItems = nav.slice(0, n);
  const overflow = nav.slice(n);
  const sheetItems = [...overflow, ...moreItems];
  const hasSheet = sheetItems.length > 0;
  const moreActive = sheetItems.some((i) => i.active);
  const toggle = themeToggle === false ? false : hasSheet ? /* @__PURE__ */ jsx22("span", { className: "max-md:hidden", children: themeToggle ?? /* @__PURE__ */ jsx22(ThemeToggle, {}) }) : themeToggle;
  const desktopNav = /* @__PURE__ */ jsx22(Fragment13, { children: nav.map((item) => {
    const className = cn(tabClass({ active: !!item.active }), "inline-flex");
    const current = item.active ? "page" : void 0;
    if (renderLink && item.href != null) {
      return /* @__PURE__ */ jsx22(Fragment12, { children: renderLink(item, { className, children: item.label, "aria-current": current, onClick: item.onSelect }) }, item.key);
    }
    return item.href != null ? /* @__PURE__ */ jsx22("a", { href: item.href, className, "aria-current": current, onClick: item.onSelect, children: item.label }, item.key) : /* @__PURE__ */ jsx22("button", { type: "button", className, "aria-current": current, onClick: item.onSelect, children: item.label }, item.key);
  }) });
  const moreMenu = moreItems.length > 0 ? /* @__PURE__ */ jsx22("div", { className: "hidden md:inline-flex", children: /* @__PURE__ */ jsx22(
    DropdownMenu,
    {
      align: "end",
      trigger: /* @__PURE__ */ jsx22(IconButton, { label: "More", children: /* @__PURE__ */ jsx22(MoreIcon, { size: 20 }) }),
      children: moreItems.map((item) => /* @__PURE__ */ jsx22(
        MenuItem,
        {
          icon: item.icon,
          active: item.active,
          onSelect: () => {
            if (item.onSelect) item.onSelect();
            else if (item.href != null) window.location.assign(item.href);
          },
          children: item.label
        },
        item.key
      ))
    }
  ) }) : null;
  const page = errorBoundary ? /* @__PURE__ */ jsx22(AppErrorBoundary, { resetKeys: [resetKey], children }) : children;
  return /* @__PURE__ */ jsxs21(Fragment13, { children: [
    /* @__PURE__ */ jsx22(
      "a",
      {
        href: `#${MAIN_ID}`,
        className: "nish-skip-link",
        onClick: (e) => {
          const main = document.getElementById(MAIN_ID);
          if (!main) return;
          e.preventDefault();
          main.focus();
          main.scrollIntoView?.();
        },
        children: "Skip to content"
      }
    ),
    /* @__PURE__ */ jsx22(
      AppHeader,
      {
        name,
        icon,
        homeHref,
        hubHref,
        hideNameBelow: icon != null ? "sm" : void 0,
        compactPill: true,
        actions: /* @__PURE__ */ jsxs21(Fragment13, { children: [
          actions,
          moreMenu
        ] }),
        themeToggle: toggle,
        className: "max-lg:[&>nav]:hidden",
        nav: desktopNav,
        navLabel: "Sections"
      }
    ),
    /* @__PURE__ */ jsx22(LoadingBar, { active: loading }),
    connection !== false ? /* @__PURE__ */ jsx22(ConnectionBanner, { ...connection }) : null,
    /* @__PURE__ */ jsxs21("div", { className: "md:flex", children: [
      /* @__PURE__ */ jsx22("div", { className: "sticky top-[var(--nish-header-h,0px)] hidden h-[calc(100dvh-var(--nish-header-h,0px))] self-start md:block lg:hidden", children: /* @__PURE__ */ jsx22(NavRail, { items: nav, showFrom: "md", hideFrom: "lg", footer: railFooter, renderLink, className: "h-full" }) }),
      /* @__PURE__ */ jsx22("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsx22("main", { id: MAIN_ID, tabIndex: -1, className: "focus:outline-none", children: container === false ? page : /* @__PURE__ */ jsx22(PageContainer, { as: "div", size: container, children: page }) }) })
    ] }),
    /* @__PURE__ */ jsx22(
      BottomNav,
      {
        items: bottomItems,
        more: hasSheet ? { active: moreActive, expanded: sheet, onToggle: () => setSheet((s) => !s) } : void 0,
        renderLink
      }
    ),
    /* @__PURE__ */ jsx22(MoreSheet, { open: sheet, onClose: () => setSheet(false), items: sheetItems, renderLink }),
    toaster !== false ? /* @__PURE__ */ jsx22(Toaster, { ...toaster }) : null
  ] });
}

// src/components/resource.ts
import { useCallback as useCallback7, useEffect as useEffect20, useRef as useRef18, useState as useState18 } from "react";
var ApiError = class extends Error {
  /** HTTP status; 0 = network failure or abort-by-timeout. */
  status;
  /** Parsed JSON body when the response had one, else the text, else null. */
  body;
  url;
  constructor(message, o) {
    super(message);
    this.name = "ApiError";
    this.status = o.status;
    this.body = o.body ?? null;
    this.url = o.url;
  }
  /** True for 0 (network) and 5xx: worth retrying. */
  get retryable() {
    return this.status === 0 || this.status >= 500;
  }
};
var config = {};
function configureApi(c) {
  config = { ...config, ...c };
}
function isRawBody(b) {
  return typeof b === "string" || typeof FormData !== "undefined" && b instanceof FormData || typeof Blob !== "undefined" && b instanceof Blob || typeof URLSearchParams !== "undefined" && b instanceof URLSearchParams || b instanceof ArrayBuffer || ArrayBuffer.isView(b);
}
function errorMessage(body, res) {
  if (body && typeof body === "object") {
    const o = body;
    if (typeof o.error === "string" && o.error) return o.error;
    if (typeof o.message === "string" && o.message) return o.message;
  }
  const line = `${res.status} ${res.statusText}`.trim();
  return line || "Request failed";
}
async function apiFetch(path, o = {}) {
  const { body, timeoutMs = 15e3, nullOn404, signal: callerSignal, headers: extraHeaders, ...init } = o;
  const url = path.startsWith("/") && config.baseUrl ? config.baseUrl + path : path;
  const headers = new Headers({ accept: "application/json" });
  if (config.headers) for (const [k, v] of Object.entries(config.headers())) headers.set(k, v);
  if (extraHeaders) new Headers(extraHeaders).forEach((v, k) => headers.set(k, v));
  let payload;
  if (body !== void 0) {
    if (isRawBody(body)) payload = body;
    else {
      payload = JSON.stringify(body);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
    }
  }
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctl.abort();
  }, timeoutMs);
  const onCallerAbort = () => ctl.abort();
  if (callerSignal) {
    if (callerSignal.aborted) ctl.abort();
    else callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }
  try {
    let res;
    let text;
    try {
      res = await fetch(url, { credentials: "same-origin", ...init, headers, body: payload, signal: ctl.signal });
      text = await res.text();
    } catch (e) {
      if (timedOut) throw new ApiError("Request timed out", { status: 0, url });
      if (e instanceof Error && e.name === "AbortError") throw e;
      throw new ApiError("Can't reach the server", { status: 0, url });
    }
    const type = res.headers.get("content-type") ?? "";
    let parsed = text === "" ? null : text;
    if (text !== "" && /json/i.test(type)) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!res.ok) {
      if (res.status === 404 && nullOn404) return null;
      const err = new ApiError(errorMessage(parsed, res), { status: res.status, body: parsed, url });
      if (res.status === 401) config.onUnauthorized?.(err);
      throw err;
    }
    if (res.status === 204 || text === "") return void 0;
    return parsed;
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}
function useResource(key, fetcher, o = {}) {
  const { intervalMs, enabled = true, refetchOnVisible = 3e4, refetchOnReconnect = true, keepPrevious = true } = o;
  const active = enabled && key !== null;
  const [state, setState] = useState18(() => ({
    key,
    data: o.initialData,
    error: void 0,
    updatedAt: void 0,
    fetching: false
  }));
  const fetcherRef = useRef18(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef18(key);
  keyRef.current = key;
  const keepPrevRef = useRef18(keepPrevious);
  keepPrevRef.current = keepPrevious;
  const initialRef = useRef18(o.initialData);
  initialRef.current = o.initialData;
  const ctlRef = useRef18(null);
  const runRef = useRef18(0);
  const pollSkippedRef = useRef18(false);
  const [now, setNow] = useState18(() => Date.now());
  const load = useCallback7(async () => {
    const k = keyRef.current;
    if (k === null) return;
    ctlRef.current?.abort();
    const ctl = new AbortController();
    ctlRef.current = ctl;
    const run = ++runRef.current;
    pollSkippedRef.current = false;
    setState(
      (s) => s.key === k ? { ...s, fetching: true } : {
        key: k,
        data: keepPrevRef.current ? s.data : initialRef.current,
        error: void 0,
        updatedAt: keepPrevRef.current ? s.updatedAt : void 0,
        fetching: true
      }
    );
    try {
      const fn = fetcherRef.current;
      const data2 = await (fn ? fn(ctl.signal) : apiFetch(k, { signal: ctl.signal }));
      if (run !== runRef.current || ctl.signal.aborted) return;
      setState({ key: k, data: data2, error: void 0, updatedAt: Date.now(), fetching: false });
    } catch (e) {
      if (run !== runRef.current || ctl.signal.aborted) return;
      const error2 = e instanceof Error ? e : new Error(String(e));
      setState((s) => ({ ...s, key: k, error: error2, fetching: false }));
    }
  }, []);
  useEffect20(() => {
    if (!active) return;
    void load();
    return () => {
      runRef.current++;
      ctlRef.current?.abort();
      ctlRef.current = null;
      setState((s) => s.fetching ? { ...s, fetching: false } : s);
    };
  }, [active, key, load]);
  const fetching = state.fetching;
  const updatedAt = state.updatedAt;
  useEffect20(() => {
    if (!active || !intervalMs || fetching) return;
    const id = setTimeout(() => {
      if (typeof document !== "undefined" && document.hidden) {
        pollSkippedRef.current = true;
        return;
      }
      void load();
    }, intervalMs);
    return () => clearTimeout(id);
  }, [active, intervalMs, fetching, load]);
  useEffect20(() => {
    if (!active || typeof document === "undefined") return;
    let hiddenAt = document.hidden ? Date.now() : null;
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      const skipped = pollSkippedRef.current;
      pollSkippedRef.current = false;
      if (skipped || refetchOnVisible !== false && away >= refetchOnVisible) void load();
    };
    const onOnline = () => {
      if (refetchOnReconnect) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [active, refetchOnVisible, refetchOnReconnect, load]);
  useEffect20(() => {
    if (!intervalMs || updatedAt === void 0) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, updatedAt]);
  const mutate = useCallback7((next) => {
    setState((s) => ({
      ...s,
      data: typeof next === "function" ? next(s.data) : next
    }));
  }, []);
  const reload = useCallback7(() => load(), [load]);
  const sameKey = state.key === key;
  const data = sameKey || keepPrevious ? state.data : o.initialData;
  const error = sameKey ? state.error : void 0;
  const stale = !!intervalMs && updatedAt !== void 0 && Math.max(now, updatedAt) - updatedAt > intervalMs * 3;
  return {
    data,
    error,
    loading: active && data === void 0 && error === void 0,
    refreshing: state.fetching || active && !sameKey,
    updatedAt,
    stale,
    reload,
    mutate
  };
}

// src/components/filters.tsx
import { useState as useState19 } from "react";
import { Fragment as Fragment14, jsx as jsx23, jsxs as jsxs22 } from "react/jsx-runtime";
var LG_QUERY = "(max-width: 1023.98px)";
function FunnelIcon({ size = 16, ...rest }) {
  return /* @__PURE__ */ jsx23(
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
      children: /* @__PURE__ */ jsx23("path", { d: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z" })
    }
  );
}
function FilterSheet({ open, onClose, title = "Filters", children, onClear, activeCount, resultLabel = "Done" }) {
  if (!open) return null;
  return /* @__PURE__ */ jsx23(
    Drawer,
    {
      side: "bottom",
      size: "lg",
      title,
      onClose,
      footer: /* @__PURE__ */ jsxs22("div", { className: "flex items-center gap-2", children: [
        onClear ? /* @__PURE__ */ jsx23(Button, { variant: "ghost", onClick: onClear, disabled: activeCount === 0, children: "Clear" }) : null,
        /* @__PURE__ */ jsx23(Button, { variant: "primary", onClick: onClose, className: "ml-auto", children: resultLabel })
      ] }),
      children: /* @__PURE__ */ jsx23("div", { className: "flex flex-col gap-4", children })
    }
  );
}
function FilterBar({
  search,
  children,
  activeCount = 0,
  onClear,
  trailing,
  sticky = false,
  sheetTitle = "Filters",
  sheetBelow = "md",
  summary,
  className
}) {
  const compact = useMediaQuery(sheetBelow === "lg" ? LG_QUERY : NARROW_QUERY);
  const [open, setOpen] = useState19(false);
  const hasChildren = children != null && children !== false;
  const searchBox = search ? /* @__PURE__ */ jsx23(
    SearchInput,
    {
      value: search.value,
      onChange: search.onChange,
      placeholder: search.placeholder,
      "aria-label": search.label ?? search.placeholder ?? "Search",
      className: compact ? "min-w-[10rem] flex-1 basis-40" : "w-full max-w-xs"
    }
  ) : null;
  return /* @__PURE__ */ jsxs22("div", { className: cn(sticky && "sticky top-[var(--nish-header-h,0px)] z-20 border-b border-th-line bg-th-bg py-2", className), children: [
    /* @__PURE__ */ jsxs22("div", { className: "flex flex-wrap items-center gap-2", children: [
      searchBox,
      compact ? /* @__PURE__ */ jsxs22(Fragment14, { children: [
        hasChildren ? /* @__PURE__ */ jsxs22(Button, { variant: "secondary", size: "md", icon: /* @__PURE__ */ jsx23(FunnelIcon, {}), onClick: () => setOpen(true), "aria-haspopup": "dialog", className: "min-h-11 shrink-0", children: [
          "Filters",
          activeCount > 0 ? /* @__PURE__ */ jsx23(Badge, { tone: "accent", "aria-label": `${activeCount} active`, children: activeCount }) : null
        ] }) : null,
        trailing
      ] }) : /* @__PURE__ */ jsxs22(Fragment14, { children: [
        children,
        activeCount > 0 && onClear ? /* @__PURE__ */ jsx23(Button, { variant: "ghost", onClick: onClear, children: "Clear filters" }) : null,
        trailing ? /* @__PURE__ */ jsx23("div", { className: "ml-auto flex items-center gap-2", children: trailing }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx23("div", { "aria-live": "polite", className: cn("text-sm text-th-hi3", summary ? "mt-2" : void 0), children: summary || null }),
    compact && hasChildren ? /* @__PURE__ */ jsx23(FilterSheet, { open, onClose: () => setOpen(false), title: sheetTitle, onClear, activeCount, children }) : null
  ] });
}

// src/components/url-state.ts
import { useCallback as useCallback8, useMemo as useMemo6, useRef as useRef19, useSyncExternalStore as useSyncExternalStore6 } from "react";
var EVENT = "nish:urlstate";
var locationAdapter = {
  get() {
    if (typeof location === "undefined") return new URLSearchParams();
    return new URLSearchParams(location.search);
  },
  set(next) {
    if (typeof location === "undefined" || typeof history === "undefined") return;
    const qs = next.toString();
    history.replaceState(history.state, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
    window.dispatchEvent(new Event(EVENT));
  },
  subscribe(onChange) {
    if (typeof window === "undefined") return () => {
    };
    window.addEventListener("popstate", onChange);
    window.addEventListener(EVENT, onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener(EVENT, onChange);
    };
  }
};
function parseValue(params, key, fallback) {
  if (!params.has(key)) return fallback;
  if (Array.isArray(fallback)) {
    const all = params.getAll(key);
    return (all.length === 1 ? all[0].split(",") : all).filter(Boolean);
  }
  const raw = params.get(key) ?? "";
  if (typeof fallback === "number") {
    if (raw.trim() === "") return fallback;
    const n = Number(raw);
    return Number.isNaN(n) ? fallback : n;
  }
  if (typeof fallback === "boolean") {
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    return fallback;
  }
  return raw;
}
function same(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => v === b[i]);
  return a === b;
}
function parse(params, defaults, prefix) {
  const out = {};
  for (const key of Object.keys(defaults)) out[key] = parseValue(params, prefix + key, defaults[key]);
  return out;
}
function useUrlState(defaults, o = {}) {
  const adapter = o.adapter ?? locationAdapter;
  const prefix = o.prefix ? `${o.prefix}.` : "";
  const defaultsRef = useRef19(defaults);
  defaultsRef.current = defaults;
  const defaultsKey = JSON.stringify(defaults);
  const search = useSyncExternalStore6(
    adapter.subscribe,
    () => adapter.get().toString(),
    () => ""
  );
  const state = useMemo6(() => parse(new URLSearchParams(search), defaultsRef.current, prefix), [search, prefix, defaultsKey]);
  const write = useCallback8(
    (next) => {
      const d = defaultsRef.current;
      const params = adapter.get();
      for (const key of Object.keys(next)) {
        if (!(key in d)) continue;
        const name = prefix + key;
        const value = next[key];
        params.delete(name);
        if (same(value, d[key])) continue;
        if (Array.isArray(value)) {
          if (value.length === 0) params.append(name, "");
          else {
            for (const v of value) params.append(name, v);
            if (value.length === 1 && value[0].includes(",")) params.append(name, "");
          }
        } else if (typeof value === "boolean") params.set(name, value ? "1" : "0");
        else params.set(name, String(value));
      }
      adapter.set(params);
    },
    [adapter, prefix]
  );
  const patch = useCallback8(
    (p) => {
      const prev = parse(adapter.get(), defaultsRef.current, prefix);
      write(typeof p === "function" ? p(prev) : p);
    },
    [adapter, prefix, write]
  );
  const reset = useCallback8(() => {
    const params = adapter.get();
    for (const key of Object.keys(defaultsRef.current)) params.delete(prefix + key);
    adapter.set(params);
  }, [adapter, prefix]);
  return [state, patch, reset];
}

// src/components/settings.tsx
import {
  forwardRef as forwardRef3,
  useCallback as useCallback9,
  useEffect as useEffect21,
  useId as useId10,
  useRef as useRef20,
  useState as useState20
} from "react";
import { jsx as jsx24, jsxs as jsxs23 } from "react/jsx-runtime";
function SettingsSection({ title, description, id, actions, children, className }) {
  const auto = useId10();
  const headingId = `${id ?? auto}-heading`;
  return /* @__PURE__ */ jsxs23("section", { id, "aria-labelledby": headingId, className: cn("min-w-0", className), children: [
    /* @__PURE__ */ jsxs23("div", { className: "mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", children: [
      /* @__PURE__ */ jsxs23("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx24("h2", { id: headingId, className: "text-base font-semibold text-th-hi", children: title }),
        description != null ? /* @__PURE__ */ jsx24("p", { className: "mt-0.5 text-sm text-th-hi3", children: description }) : null
      ] }),
      actions != null ? /* @__PURE__ */ jsx24("div", { className: "flex shrink-0 items-center gap-2", children: actions }) : null
    ] }),
    /* @__PURE__ */ jsx24(Card, { padding: "none", className: "divide-y divide-th-line", children })
  ] });
}
var STATUS_TONE = { muted: "text-th-hi3", error: "text-th-loss", ok: "text-th-ok" };
function SettingRow({
  label,
  description,
  children,
  htmlFor,
  stacked = false,
  inline = false,
  status,
  statusTone = "muted",
  className
}) {
  const labelClass = "block text-sm font-medium text-th-hi";
  const auto = useId10();
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const layout = stacked ? "flex flex-col gap-2" : inline ? "grid grid-cols-[1fr_auto] items-center gap-4" : "flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4";
  return /* @__PURE__ */ jsxs23("div", { className: cn("min-h-[56px] px-4 py-3", layout, className), children: [
    /* @__PURE__ */ jsxs23("div", { className: "min-w-0", children: [
      htmlFor ? /* @__PURE__ */ jsx24("label", { htmlFor, className: labelClass, children: label }) : /* @__PURE__ */ jsx24("span", { id: labelId, className: labelClass, children: label }),
      description != null ? /* @__PURE__ */ jsx24("p", { id: descId, className: "mt-0.5 text-sm text-th-hi3", children: description }) : null
    ] }),
    /* @__PURE__ */ jsxs23(
      "div",
      {
        ...htmlFor ? {} : { role: "group", "aria-labelledby": labelId, "aria-describedby": description != null ? descId : void 0 },
        className: cn("flex min-w-0 items-center gap-2", stacked ? "w-full" : inline ? "justify-end" : "w-full sm:w-auto sm:justify-end"),
        children: [
          children,
          /* @__PURE__ */ jsx24("span", { role: "status", "aria-live": "polite", className: cn("shrink-0 text-sm empty:hidden", STATUS_TONE[statusTone]), children: status })
        ]
      }
    )
  ] });
}
var SAVED_MS = 1500;
var ERROR_MS = 3e3;
function useSaveStatus() {
  const [status, setStatus] = useState20("idle");
  const [error, setError] = useState20(null);
  const timer = useRef20(void 0);
  const token = useRef20(0);
  const mounted = useRef20(true);
  useEffect21(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  const run = useCallback9(async (p) => {
    const mine = ++token.current;
    clearTimeout(timer.current);
    setError(null);
    setStatus("saving");
    const settle = (next, ms) => {
      if (!mounted.current || token.current !== mine) return;
      setStatus(next);
      timer.current = setTimeout(() => {
        if (!mounted.current || token.current !== mine) return;
        setStatus("idle");
        setError(null);
      }, ms);
    };
    try {
      const out = await p;
      settle("saved", SAVED_MS);
      return out;
    } catch (e) {
      if (mounted.current && token.current === mine) setError(e instanceof Error ? e.message : String(e));
      settle("error", ERROR_MS);
      return void 0;
    }
  }, []);
  const label = status === "saving" ? "Saving\u2026" : status === "saved" ? "Saved" : status === "error" ? error ?? "Could not save" : null;
  const tone = status === "saved" ? "ok" : status === "error" ? "error" : "muted";
  return { status, error, label, tone, run };
}
var fmt = (v) => v == null ? "" : String(v);
var decimals = (n) => String(n).split(".")[1]?.length ?? 0;
var NumberField = forwardRef3(function NumberField2({ value, onCommit, min, max, step = 1, nullable = false, suffix, precision, className, onBlur, onKeyDown, id, invalid, "aria-describedby": describedBy, ...rest }, ref) {
  const auto = useId10();
  const errId = `${id ?? auto}-error`;
  const [draft, setDraftState] = useState20(fmt(value));
  const [error, setError] = useState20(null);
  const [pending, setPending] = useState20(false);
  const draftRef = useRef20(draft);
  const lastSent = useRef20(null);
  const mounted = useRef20(true);
  const skipCommit = useRef20(false);
  const setDraft = (next) => {
    draftRef.current = next;
    setDraftState(next);
  };
  useEffect21(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect21(() => {
    lastSent.current = null;
    setDraft(fmt(value));
  }, [value]);
  const clamp2 = (n) => {
    let out = n;
    if (min != null) out = Math.max(min, out);
    if (max != null) out = Math.min(max, out);
    return out;
  };
  const fail = (e) => {
    lastSent.current = null;
    setDraft(fmt(value));
    setError(e instanceof Error ? e.message : String(e));
  };
  const commit = () => {
    const text = draftRef.current.trim();
    let next;
    if (text === "") {
      if (!nullable) {
        setDraft(fmt(value));
        return;
      }
      next = null;
    } else {
      const n = Number(text.replace(/,/g, ""));
      if (Number.isNaN(n)) {
        setDraft(fmt(value));
        setError("Enter a number");
        return;
      }
      let c = clamp2(n);
      if (precision != null) c = Number(c.toFixed(precision));
      next = c;
    }
    setDraft(fmt(next));
    if (next === value) return;
    if (lastSent.current && lastSent.current.v === next) return;
    setError(null);
    lastSent.current = { v: next };
    let result;
    try {
      result = onCommit(next);
    } catch (e) {
      fail(e);
      return;
    }
    if (result && typeof result.then === "function") {
      setPending(true);
      result.then(
        () => {
          if (mounted.current) setPending(false);
        },
        (e) => {
          if (!mounted.current) return;
          setPending(false);
          fail(e);
        }
      );
    }
  };
  const nudge = (dir) => {
    const base = Number(draftRef.current.replace(/,/g, ""));
    const from = Number.isNaN(base) || draftRef.current.trim() === "" ? value ?? min ?? 0 : base;
    const n = Number(clamp2(from + dir * step).toFixed(Math.max(precision ?? 0, decimals(step), decimals(from))));
    setDraft(String(n));
    lastSent.current = null;
  };
  const handleKeyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setDraft(fmt(value));
      setError(null);
      skipCommit.current = true;
      e.currentTarget.blur();
      skipCommit.current = false;
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      nudge(e.key === "ArrowUp" ? 1 : -1);
    }
  };
  return /* @__PURE__ */ jsxs23("div", { className: "flex min-w-0 flex-col gap-1", children: [
    /* @__PURE__ */ jsxs23("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx24(
        Input,
        {
          ...rest,
          ref,
          id,
          type: "text",
          inputMode: "decimal",
          autoComplete: "off",
          value: draft,
          invalid: invalid || error != null,
          "aria-describedby": cn(describedBy, error != null && errId) || void 0,
          "aria-busy": pending || void 0,
          className: cn("w-28", className),
          onChange: (e) => {
            setDraft(e.target.value);
            lastSent.current = null;
            if (error != null) setError(null);
          },
          onBlur: (e) => {
            onBlur?.(e);
            if (skipCommit.current) return;
            commit();
          },
          onKeyDown: handleKeyDown
        }
      ),
      suffix != null ? /* @__PURE__ */ jsx24("span", { className: "text-sm text-th-hi3", children: suffix }) : null,
      pending ? /* @__PURE__ */ jsx24(Spinner, { size: "sm", label: "Saving", className: "text-th-hi3" }) : null
    ] }),
    error != null ? /* @__PURE__ */ jsx24("span", { id: errId, role: "alert", className: "text-sm text-th-loss", children: error }) : null
  ] });
});

// src/components/combobox.tsx
import { useCallback as useCallback10, useEffect as useEffect22, useId as useId11, useMemo as useMemo7, useRef as useRef21, useState as useState21 } from "react";
import { jsx as jsx25, jsxs as jsxs24 } from "react/jsx-runtime";
var MAX_SHOWN = 50;
var DEBOUNCE_MS = 200;
var defaultFilter = (o, q) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return o.label.toLowerCase().includes(needle) || (o.hint?.toLowerCase().includes(needle) ?? false);
};
function Combobox({
  options,
  value,
  onChange,
  filter,
  allowCustom = false,
  placeholder,
  "aria-label": ariaLabel,
  id,
  disabled = false,
  emptyText = "No matches",
  onQueryChange,
  loading = false,
  size = "md",
  className
}) {
  const autoId = useId11().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = id ?? `nish-cb-${autoId}`;
  const listId = `nish-cb-list-${autoId}`;
  const [open, setOpen] = useState21(false);
  const [text, setText] = useState21("");
  const [dirty, setDirty] = useState21(false);
  const [active, setActive] = useState21(-1);
  const inputRef = useRef21(null);
  const listRef = useRef21(null);
  const debounceRef = useRef21(void 0);
  const selected = useMemo7(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const label = selected?.label ?? value ?? "";
  const shown = dirty ? text : label;
  const hasValue = value != null && value !== "";
  const visible = useMemo7(() => {
    const serverFiltered = onQueryChange != null && filter == null;
    const test = filter ?? defaultFilter;
    const list = !dirty || serverFiltered ? options : options.filter((o) => test(o, text));
    return list.slice(0, MAX_SHOWN);
  }, [options, dirty, text, filter, onQueryChange]);
  useEffect22(() => () => window.clearTimeout(debounceRef.current), []);
  useEffect22(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);
  useEffect22(() => {
    if (open) listRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [open]);
  const reset = useCallback10(() => {
    setDirty(false);
    setText("");
  }, []);
  const close = useCallback10(() => {
    setOpen(false);
    setActive(-1);
  }, []);
  const select = useCallback10(
    (opt) => {
      if (opt.disabled) return;
      onChange(opt.value, opt);
      reset();
      close();
    },
    [onChange, reset, close]
  );
  const step = (from, dir) => {
    const n = visible.length;
    if (n === 0) return -1;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (!visible[i].disabled) return i;
    }
    return -1;
  };
  const edge = (dir) => dir === 1 ? step(-1, 1) : step(0, -1);
  function openList() {
    if (open || disabled) return;
    setOpen(true);
    const at = selected ? visible.findIndex((o) => o.value === selected.value) : -1;
    setActive(at >= 0 ? at : -1);
  }
  function onInput(next) {
    setText(next);
    setDirty(true);
    setOpen(true);
    if (allowCustom || next.trim() === "") setActive(-1);
    else {
      const test = filter ?? defaultFilter;
      const serverFiltered = onQueryChange != null && filter == null;
      const list = (serverFiltered ? options : options.filter((o) => test(o, next))).slice(0, MAX_SHOWN);
      setActive(list.findIndex((o) => !o.disabled));
    }
    if (onQueryChange) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => onQueryChange(next), DEBOUNCE_MS);
    }
  }
  function commitEmpty() {
    if (!dirty || text.trim() !== "" || !hasValue) return false;
    onChange(null, null);
    reset();
    close();
    return true;
  }
  function commitCustom() {
    const t = text.trim();
    if (!allowCustom || !dirty || !t) return false;
    const exact = options.find((o) => !o.disabled && o.label.toLowerCase() === t.toLowerCase());
    if (exact) onChange(exact.value, exact);
    else onChange(t, null);
    reset();
    close();
    return true;
  }
  function onKeyDown(e) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        if (!open) {
          setOpen(true);
          const at = selected ? visible.findIndex((o) => o.value === selected.value) : -1;
          setActive(at >= 0 ? at : edge(dir));
        } else {
          setActive(active < 0 ? edge(dir) : step(active, dir));
        }
        break;
      }
      case "Home":
      case "End":
        if (open) {
          e.preventDefault();
          setActive(edge(e.key === "Home" ? 1 : -1));
        }
        break;
      case "Enter":
        if (open && active >= 0 && visible[active]) {
          e.preventDefault();
          select(visible[active]);
        } else if (commitEmpty() || commitCustom()) {
          e.preventDefault();
        } else if (open) {
          e.preventDefault();
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (dirty) {
          e.preventDefault();
          e.stopPropagation();
          reset();
        }
        break;
      case "Tab":
        close();
        break;
    }
  }
  function clear() {
    onChange(null, null);
    reset();
    close();
    inputRef.current?.focus();
  }
  const activeId = open && active >= 0 && visible[active] ? `${listId}-opt-${active}` : void 0;
  return /* @__PURE__ */ jsxs24("div", { className: cn("relative w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx25(
      "input",
      {
        ref: inputRef,
        id: inputId,
        type: "text",
        role: "combobox",
        "aria-expanded": open,
        "aria-controls": open ? listId : void 0,
        "aria-autocomplete": "list",
        "aria-activedescendant": activeId,
        "aria-label": ariaLabel,
        autoComplete: "off",
        autoCapitalize: "off",
        spellCheck: false,
        placeholder,
        disabled,
        value: shown,
        onChange: (e) => onInput(e.target.value),
        onKeyDown,
        onClick: openList,
        onBlur: () => {
          if (!commitEmpty()) {
            close();
            reset();
          }
        },
        className: fieldClass({ size, className: "pr-11" })
      }
    ),
    hasValue && !disabled ? /* @__PURE__ */ jsx25(
      "button",
      {
        type: "button",
        "aria-label": "Clear",
        tabIndex: -1,
        onMouseDown: (e) => e.preventDefault(),
        onClick: clear,
        className: "absolute inset-y-0 right-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi",
        children: /* @__PURE__ */ jsx25("span", { className: "flex size-8 items-center justify-center rounded-md hover:bg-th-elevated", children: /* @__PURE__ */ jsx25(XIcon, { size: 16 }) })
      }
    ) : null,
    /* @__PURE__ */ jsx25("div", { role: "status", "aria-live": "polite", className: "sr-only", children: open ? loading ? "Searching\u2026" : visible.length === 0 ? emptyText : `${visible.length} ${visible.length === 1 ? "result" : "results"}` : "" }),
    open ? /* @__PURE__ */ jsxs24(
      "ul",
      {
        ref: listRef,
        id: listId,
        role: "listbox",
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabel ? void 0 : inputId,
        className: "absolute left-0 right-0 top-full z-40 mt-1 max-h-[min(16rem,40dvh)] overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop",
        children: [
          visible.map((o, i) => {
            const isSelected = selected?.value === o.value;
            return /* @__PURE__ */ jsxs24(
              "li",
              {
                id: `${listId}-opt-${i}`,
                role: "option",
                "data-index": i,
                "aria-selected": isSelected,
                "aria-disabled": o.disabled || void 0,
                onMouseDown: (e) => e.preventDefault(),
                onMouseMove: () => !o.disabled && active !== i && setActive(i),
                onClick: () => select(o),
                className: cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-th-hi2",
                  i === active && "bg-th-accent-soft text-th-hi",
                  o.disabled && "cursor-not-allowed opacity-50"
                ),
                children: [
                  /* @__PURE__ */ jsx25("span", { className: "min-w-0 flex-1 truncate", children: o.label }),
                  o.hint ? /* @__PURE__ */ jsx25("span", { className: "shrink-0 truncate text-xs text-th-hi3", children: o.hint }) : null,
                  isSelected ? /* @__PURE__ */ jsx25(CheckIcon, { size: 16, className: "shrink-0 text-th-accent" }) : null
                ]
              },
              o.value
            );
          }),
          loading ? /* @__PURE__ */ jsxs24("li", { role: "presentation", className: "flex min-h-11 items-center gap-2 px-3 text-sm text-th-hi3", children: [
            /* @__PURE__ */ jsx25(Spinner, { size: "sm" }),
            "Searching\u2026"
          ] }) : visible.length === 0 ? /* @__PURE__ */ jsx25("li", { role: "presentation", className: "flex min-h-11 items-center px-3 text-sm text-th-hi3", children: emptyText }) : null
        ]
      }
    ) : null
  ] });
}
export {
  ActivityFeed,
  AgentNode,
  AnimatedList,
  ApiError,
  AppErrorBoundary,
  AppHeader,
  AppShell,
  AsyncPanel,
  BREAKPOINTS,
  Badge,
  BarChart,
  BellIcon,
  BottomNav,
  Button,
  COLOR_ROLES,
  Callout,
  Card,
  CardHeader,
  CardListSkeleton,
  ChartLegend,
  CheckIcon,
  Checkbox,
  Chip,
  ChipGroup,
  ClockIcon,
  Combobox,
  CommandPalette,
  ConfirmDialog,
  ConnectionBanner,
  CopyButton,
  DEFAULT_THEME,
  Disclosure,
  Drawer,
  DropdownMenu,
  EmptyState,
  ErrorState,
  Favicon,
  Field,
  FieldGroup,
  FilterBar,
  FilterSheet,
  FlowSteps,
  HUE_ROLES,
  INBOX_ACTION_HEADER,
  INBOX_ACTION_TIMEOUT_MS,
  INBOX_DEFAULT_SETTINGS,
  INBOX_SOURCE_LABELS,
  IconButton,
  Inbox,
  Input,
  Kbd,
  KeyValueList,
  Label,
  LineChart,
  LinkCard,
  ListRow,
  LoadingBar,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSubHeader,
  Meter,
  Modal,
  MoreIcon,
  MoreSheet,
  NARROW_QUERY,
  NavRail,
  NumberField,
  PHONE_QUERY2 as PHONE_QUERY,
  PRESETS,
  PageContainer,
  PageHeader,
  Popover,
  RangeBar,
  RelativeTime,
  ResponsiveTable,
  SCALE,
  SHADOWS,
  SOFT_ROLES,
  ScrollRow,
  SearchInput,
  SectionHeader,
  SectionNav,
  Segmented,
  Select,
  SettingRow,
  SettingsIcon,
  SettingsSection,
  Skeleton,
  SkeletonCard,
  SkeletonLines,
  SkeletonRows,
  Sparkline,
  Spinner,
  Stat,
  StatGrid,
  StatGridSkeleton,
  StatusDot,
  StepBar,
  StickyActionBar,
  StickyBar,
  Switch,
  SystemCanvas,
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
  TickerText,
  Toaster,
  Tooltip,
  Tr,
  WorkflowBoard,
  apiFetch,
  applyTheme,
  badgeClass,
  buttonClass,
  cardClass,
  chipClass,
  cn,
  configureApi,
  confirmDialog,
  copyText,
  cycleTheme,
  dismissToast,
  fieldClass,
  getThemeChoice,
  iconButtonClass,
  initTheme,
  isThemeName,
  layoutSystem,
  linkClass,
  locationAdapter,
  menuItemClass,
  mountChecklist,
  mountHeightVar,
  mountScrollspy,
  mountStuck,
  mountThemeToggle,
  mountTooltips,
  navigateFromLayer,
  onThemeChange,
  openSheet,
  readToken,
  registerThemes,
  resolveTheme,
  revealClass,
  routeEdges,
  schemeOf,
  setThemeChoice,
  showToast,
  signTone,
  tabClass,
  tableClass,
  toast,
  toneFor,
  useBreakpoint2 as useBreakpoint,
  useCommandHotkey,
  useDocumentTitle,
  useHeightVar,
  useLocalStorage,
  useMediaQuery,
  useNarrow,
  useNow,
  useOnline,
  usePhone,
  usePrefersReducedMotion,
  useResource,
  useSaveStatus,
  useScrollEdges,
  useScrollSpy,
  useStuck,
  useTheme,
  useToast,
  useUrlState
};
//# sourceMappingURL=index.js.map