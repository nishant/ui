"use strict";
var nishTheme = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/theme-global.ts
  var theme_global_exports = {};
  __export(theme_global_exports, {
    confirmDialog: () => confirmDialog,
    cycleTheme: () => cycleTheme,
    getThemeChoice: () => getThemeChoice,
    initTheme: () => initTheme,
    mountChecklist: () => mountChecklist,
    mountHeightVar: () => mountHeightVar,
    mountScrollspy: () => mountScrollspy,
    mountStuck: () => mountStuck,
    mountThemeToggle: () => mountThemeToggle,
    mountTooltips: () => mountTooltips,
    onThemeChange: () => onThemeChange,
    openSheet: () => openSheet,
    readToken: () => readToken,
    registerThemes: () => registerThemes,
    setThemeChoice: () => setThemeChoice,
    showToast: () => showToast
  });

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
      colors: __spreadValues(__spreadValues({
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
        "invert-text": "#111218"
      }, chart(DARK_CHART)), DARK_HUES)
    },
    light: {
      label: "Light",
      scheme: "light",
      colors: __spreadValues(__spreadValues({
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
        "invert-text": "#f7f6f3"
      }, chart(LIGHT_CHART)), LIGHT_HUES)
    },
    slate: {
      label: "Slate",
      scheme: "dark",
      colors: __spreadProps(__spreadValues(__spreadValues({
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
        "invert-text": "#202024"
      }, chart(["#818cf8", "#4ade80", "#facc15", "#fb7185", "#38bdf8", "#c084fc", "#fb923c", "#a3e635"])), DARK_HUES), {
        // Lifted so tinted chips stay readable on this theme's lighter cards.
        indigo: "#9aa1ff",
        rose: "#fc8395",
        violet: "#c792fc"
      })
    },
    terminal: {
      label: "Terminal",
      scheme: "dark",
      colors: __spreadValues(__spreadValues({
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
        "invert-text": "#0c110e"
      }, chart(["#34d399", "#67e8f9", "#fbbf24", "#f87171", "#a3e635", "#c084fc", "#fb923c", "#2dd4bf"])), DARK_HUES)
    },
    mocha: {
      label: "Mocha",
      scheme: "dark",
      colors: __spreadProps(__spreadValues(__spreadValues({
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
        "invert-text": "#292524"
      }, chart(["#fb923c", "#4ade80", "#facc15", "#f472b6", "#7dd3fc", "#c4b5fd", "#f87171", "#bef264"])), DARK_HUES), {
        // Lifted so tinted chips stay readable on this theme's lighter cards.
        indigo: "#a9afff",
        rose: "#fc99a7",
        sky: "#3ebff8",
        violet: "#cfa2fd"
      })
    },
    ocean: {
      label: "Ocean",
      scheme: "dark",
      colors: __spreadValues(__spreadValues({
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
        "invert-text": "#020c18"
      }, chart(["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf", "#fb923c", "#a3e635"])), DARK_HUES)
    },
    contrast: {
      label: "High contrast",
      scheme: "dark",
      colors: __spreadValues(__spreadValues({
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
        "invert-text": "#000000"
      }, chart(["#ffd60a", "#4ade80", "#7dd3fc", "#ff6b6b", "#c4b5fd", "#fb923c", "#f9a8d4", "#bef264"])), DARK_HUES)
    }
  };
  var withFills = (t) => {
    var _a;
    const c = t.colors;
    const fills = Object.fromEntries(
      ["ok", "loss", "warn", "info"].flatMap((r) => {
        var _a2, _b;
        return [
          [`${r}-fill`, (_a2 = c[`${r}-fill`]) != null ? _a2 : c[r]],
          [`on-${r}`, (_b = c[`on-${r}`]) != null ? _b : c["on-accent"]]
        ];
      })
    );
    return __spreadProps(__spreadValues({}, t), { colors: __spreadProps(__spreadValues(__spreadValues({}, c), fills), { "on-accent2": (_a = c["on-accent2"]) != null ? _a : c["on-accent"] }) });
  };
  var THEMES = /* @__PURE__ */ Object.fromEntries(
    Object.entries(RAW_THEMES).map(([name, t]) => [name, withFills(t)])
  );
  var DEFAULT_THEME = "dark";

  // src/runtime.ts
  var version = true ? "3.2.0" : "dev";
  var KEY = /* @__PURE__ */ Symbol.for("nish-ui.runtime.v1");
  function runtime() {
    var _a;
    const g = globalThis;
    return (_a = g[KEY]) != null ? _a : g[KEY] = { versions: /* @__PURE__ */ new Set(), slots: {} };
  }
  function isDevelopment() {
    try {
      return process.env.NODE_ENV !== "production";
    } catch (e) {
      return false;
    }
  }
  function register(rt) {
    rt.versions.add(version);
    if (rt.versions.size > 1 && !rt.warned && isDevelopment()) {
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

  // src/url.ts
  function safeUrl(href) {
    if (href == null) return null;
    const raw = String(href);
    let start = 0;
    let end = raw.length;
    while (start < end && raw.charCodeAt(start) <= 32) start++;
    while (end > start && raw.charCodeAt(end - 1) <= 32) end--;
    const out = raw.slice(start, end).replace(/[\t\n\r]/g, "");
    if (out === "") return null;
    if (out !== out.trim()) return null;
    if (/[\u0000-\u001f\u007f]/.test(out)) return null;
    const m = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(out);
    if (!m) return out;
    const scheme = m[1].toLowerCase();
    return scheme === "http" || scheme === "https" || scheme === "mailto" || scheme === "tel" ? out : null;
  }

  // src/components/strings.ts
  var OVERLAY_STRINGS = {
    close: "Close",
    cancel: "Cancel",
    menu: "Menu",
    back: "Back: ",
    contextMenu: "Actions"
  };
  var THEME_STRINGS = {
    theme: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",
    themeToggleLabel: (current, next) => `Theme: ${current}. Switch to ${next}`,
    themePreset: "Theme preset",
    themePresetPlaceholder: "Preset\u2026"
  };
  var DISPLAY_STRINGS = {
    dismiss: "Dismiss",
    moreCount: (count) => `${count} more`,
    copy: "Copy",
    copied: "Copied",
    legend: "Legend",
    noData: "No data",
    noDataNamed: (label) => `${label}: no data`
  };

  // src/theme.ts
  var DEFAULT_KEY = "nish-theme";
  var SHARED_DOMAIN = "nish.software";
  var ONE_YEAR = 60 * 60 * 24 * 365;
  var state = () => shared("theme", () => ({ extra: {}, listeners: /* @__PURE__ */ new Set(), watching: false, switchId: 0 }));
  var warn = (msg) => {
    var _a, _b;
    if (((_b = (_a = globalThis.process) == null ? void 0 : _a.env) == null ? void 0 : _b.NODE_ENV) !== "production") console.warn(`nish-ui: ${msg}`);
  };
  function storageKey() {
    if (typeof document === "undefined") return DEFAULT_KEY;
    const k = document.documentElement.getAttribute("data-nish-storage-key");
    return k && /^[A-Za-z0-9_-]+$/.test(k) ? k : DEFAULT_KEY;
  }
  function registerThemes(themes) {
    Object.assign(state().extra, themes);
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
    } catch (e) {
      return null;
    }
  }
  var covers = (domain, host) => host === domain || host.endsWith("." + domain);
  function cookieDomain(host, attr) {
    const h = host.toLowerCase();
    const own = (attr != null ? attr : "").trim().toLowerCase().replace(/^\./, "");
    if (own) return covers(own, h) ? own : null;
    return covers(SHARED_DOMAIN, h) ? SHARED_DOMAIN : null;
  }
  function sharedDomain() {
    if (typeof location === "undefined" || typeof document === "undefined") return null;
    return cookieDomain(location.hostname, document.documentElement.getAttribute("data-nish-domain"));
  }
  function getThemeChoice() {
    var _a;
    let v = null;
    try {
      v = (_a = readCookie()) != null ? _a : localStorage.getItem(storageKey());
    } catch (e) {
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
  function setThemeChoice(choice) {
    if (choice !== "system" && !isThemeName(choice)) {
      warn(`unknown theme "${String(choice)}" ignored. Register it with registerThemes() first.`);
      return resolveTheme(getThemeChoice());
    }
    const key = storageKey();
    try {
      localStorage.setItem(key, choice);
    } catch (e) {
    }
    try {
      const domain = sharedDomain();
      if (domain) {
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${key}=${choice}; Domain=.${domain}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
      }
    } catch (e) {
    }
    return applyTheme(choice);
  }
  function readToken(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(`--nish-${name}`).trim();
  }
  function syncChromeColor() {
    var _a;
    const bg = readToken("bg");
    if (!bg) return;
    let meta = (_a = document.querySelector('meta[name="theme-color"][data-nish]')) != null ? _a : document.querySelector('meta[name="theme-color"]:not([media]):not([data-nish-keep])');
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
  var TOGGLE_ORDER = ["system", "light", "dark"];
  function cycleTheme() {
    const next = nextChoice(getThemeChoice());
    setThemeChoice(next);
    return next;
  }
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgIcon(size, shapes, attrs = {}) {
    const el = document.createElementNS(SVG_NS, "svg");
    const all = __spreadValues({
      width: String(size),
      height: String(size),
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      focusable: "false"
    }, attrs);
    for (const k of Object.keys(all)) el.setAttribute(k, all[k]);
    for (const [tag, a] of shapes) {
      const child = document.createElementNS(SVG_NS, tag);
      for (const k of Object.keys(a)) child.setAttribute(k, a[k]);
      el.appendChild(child);
    }
    return el;
  }
  var TOGGLE_ICONS = {
    system: [
      ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }],
      ["path", { d: "M8 21h8M12 17v4" }]
    ],
    light: [
      ["circle", { cx: "12", cy: "12", r: "4" }],
      ["path", { d: "M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41" }]
    ],
    dark: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" }]]
  };
  var defaultToggleLabels = () => ({
    system: THEME_STRINGS.themeSystem,
    light: THEME_STRINGS.themeLight,
    dark: THEME_STRINGS.themeDark
  });
  var DEFAULT_ELSEWHERE = "set on another site";
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
    var _a, _b, _c;
    const words = __spreadValues(__spreadValues({}, defaultToggleLabels()), opts.labels);
    const sentence = (_b = (_a = opts.strings) == null ? void 0 : _a.themeToggleLabel) != null ? _b : THEME_STRINGS.themeToggleLabel;
    const elsewhereWords = (_c = opts.elsewhereLabel) != null ? _c : DEFAULT_ELSEWHERE;
    if (button.tagName === "BUTTON" && !button.getAttribute("type")) button.setAttribute("type", "button");
    const children = Object.keys(TOGGLE_ICONS).map(
      (id) => svgIcon(16, TOGGLE_ICONS[id], { "data-icon": id })
    );
    if (opts.showLabel) {
      const w = document.createElement("span");
      w.setAttribute("data-theme-word", "");
      w.setAttribute("aria-hidden", "true");
      children.push(w);
    }
    button.replaceChildren(...children);
    const word = button.querySelector("[data-theme-word]");
    const render = (choice) => {
      const icon = choice === "system" || choice === "light" || choice === "dark" ? choice : schemeOf(choice);
      button.setAttribute("data-choice", choice);
      button.querySelectorAll("svg[data-icon]").forEach((svg) => {
        if (svg.getAttribute("data-icon") === icon) svg.removeAttribute("display");
        else svg.setAttribute("display", "none");
      });
      const elsewhere = TOGGLE_ORDER.includes(choice) ? "" : ` (${elsewhereWords})`;
      const label = sentence(`${themeLabel(choice, words)}${elsewhere}`, themeLabel(nextChoice(choice), words));
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
  var TRIANGLE = [
    ["path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }],
    ["path", { d: "M12 9v4M12 17h.01" }]
  ];
  var INFO = [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M12 16v-4M12 8h.01" }]
  ];
  var TOAST_ICONS = {
    neutral: INFO,
    info: INFO,
    ok: [
      ["circle", { cx: "12", cy: "12", r: "10" }],
      ["path", { d: "m9 12 2 2 4-4" }]
    ],
    warn: TRIANGLE,
    loss: TRIANGLE
  };
  var TOAST_MS = 6e3;
  var toastRegion = null;
  var hideCurrent = null;
  function showToast(content, opts = {}) {
    var _a, _b, _c, _d, _e;
    hideCurrent == null ? void 0 : hideCurrent();
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
    const icon = document.createElement("span");
    icon.className = "nish-toast-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.append(svgIcon(15, TOAST_ICONS[(_a = opts.tone) != null ? _a : "neutral"]));
    box.append(icon);
    const body = document.createElement("p");
    body.className = "nish-toast-body";
    body.append(typeof content === "string" ? document.createTextNode(content) : content);
    box.append(body);
    let timer = null;
    let remaining = opts.duration === "sticky" ? Infinity : (_b = opts.duration) != null ? _b : TOAST_MS;
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
    const action = opts.action;
    const href = (action == null ? void 0 : action.href) != null ? safeUrl(action.href) : null;
    if (action && (action.href == null || href != null)) {
      const el = document.createElement(action.href != null ? "a" : "button");
      el.className = "nish-toast-action";
      el.textContent = action.label;
      if (href != null) el.href = href;
      else el.type = "button";
      el.addEventListener("click", () => {
        var _a2;
        (_a2 = action.onClick) == null ? void 0 : _a2.call(action);
        hide();
      });
      box.append(el);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "nish-toast-close";
    close.setAttribute("aria-label", (_e = (_d = opts.dismissLabel) != null ? _d : (_c = opts.strings) == null ? void 0 : _c.dismiss) != null ? _e : DISPLAY_STRINGS.dismiss);
    close.append(svgIcon(14, [["path", { d: "M18 6 6 18M6 6l12 12" }]]));
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
    var _a, _b, _c, _d;
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
    const cancelBtn = button((_c = (_b = opts.cancelLabel) != null ? _b : (_a = opts.strings) == null ? void 0 : _a.cancel) != null ? _c : OVERLAY_STRINGS.cancel, "nish-btn");
    const confirmBtn = button((_d = opts.confirmLabel) != null ? _d : "Confirm", `nish-btn ${danger ? "nish-btn--danger" : "nish-btn--primary"}`);
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
        if (opener == null ? void 0 : opener.isConnected) opener.focus();
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
      var _a;
      const tip = t.querySelector(":scope > .nish-tooltip-content");
      if (!tip) return;
      if (!tip.getAttribute("role")) tip.setAttribute("role", "tooltip");
      if (!tip.id) tip.id = `nish-tip-${++dialogSeq}`;
      const ids = ((_a = t.getAttribute("aria-describedby")) != null ? _a : "").split(/\s+/).filter(Boolean);
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
    let closing = false;
    let dragging = false;
    if (dialog.open) return () => closeNow();
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
      var _a;
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
      (_a = dialog.setPointerCapture) == null ? void 0 : _a.call(dialog, e.pointerId);
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
      var _a;
      if (!dragging) return;
      dragging = false;
      (_a = dialog.releasePointerCapture) == null ? void 0 : _a.call(dialog, e.pointerId);
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
      if (opener == null ? void 0 : opener.isConnected) opener.focus();
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
      ro == null ? void 0 : ro.disconnect();
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
      onChange == null ? void 0 : onChange(next);
    };
    const build = () => {
      const top = Math.round(parseFloat(getComputedStyle(el).top) || 0);
      if (top !== builtTop) {
        builtTop = top;
        io == null ? void 0 : io.disconnect();
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
      io == null ? void 0 : io.disconnect();
      ro == null ? void 0 : ro.disconnect();
      mo == null ? void 0 : mo.disconnect();
      el.removeAttribute("data-stuck");
    };
  }
  function mountScrollspy(nav, o = {}) {
    const noop = Object.assign(() => void 0, { lock: (_id) => void 0 });
    if (typeof document === "undefined") return noop;
    const links = Array.from(nav.querySelectorAll('a[href^="#"]')).filter((a) => a.hash.length > 1);
    const target = (a) => {
      try {
        return document.getElementById(decodeURIComponent(a.hash.slice(1)));
      } catch (e) {
        return null;
      }
    };
    const unheight = o.height === false ? () => void 0 : mountHeightVar(nav, "--nish-sticky-extra");
    let current = null;
    let locked = null;
    let unlockListeners = null;
    const edges = () => {
      const max = nav.scrollWidth - nav.clientWidth;
      const left = getComputedStyle(nav).direction === "rtl" ? nav.scrollLeft + max : nav.scrollLeft;
      nav.dataset.atStart = String(left <= 1);
      nav.dataset.atEnd = String(max <= 1 || left >= max - 1);
    };
    const reveal = (a) => {
      const left = a.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft - nav.clientLeft;
      const view = nav.clientWidth;
      if (left < nav.scrollLeft + 24) nav.scrollLeft = Math.max(0, left - 24);
      else if (left + a.offsetWidth > nav.scrollLeft + view - 24) nav.scrollLeft = left + a.offsetWidth - view + 24;
    };
    const activate = (a) => {
      if (a === current) return;
      current == null ? void 0 : current.removeAttribute("aria-current");
      current = a;
      if (a) {
        a.setAttribute("aria-current", "true");
        reveal(a);
      }
    };
    const update = () => {
      var _a, _b;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nish-header-h")) || 0;
      const line = (_a = o.offset) != null ? _a : header + nav.offsetHeight + 8;
      let found = (_b = links[0]) != null ? _b : null;
      for (const a of links) {
        const t = target(a);
        if (t && t.getBoundingClientRect().top <= line + 1) found = a;
      }
      const de = document.documentElement;
      if (window.innerHeight + window.scrollY >= de.scrollHeight - 2) {
        for (const a of links) if (target(a)) found = a;
      }
      activate(locked != null ? locked : found);
    };
    const unlock = () => {
      unlockListeners == null ? void 0 : unlockListeners();
      unlockListeners = null;
      locked = null;
    };
    const lock = (id) => {
      const a = links.find((l) => {
        try {
          return decodeURIComponent(l.hash.slice(1)) === id;
        } catch (e) {
          return false;
        }
      });
      if (!a) return;
      unlock();
      locked = a;
      activate(a);
      const release = () => {
        unlock();
        schedule();
      };
      const onKey = (e) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) release();
      };
      let settled = false;
      const settle = () => {
        settled = true;
      };
      let t = setTimeout(settle, 400);
      const onScroll = () => {
        if (settled) release();
        else {
          clearTimeout(t);
          t = setTimeout(settle, 200);
        }
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
      unlockListeners = () => {
        clearTimeout(t);
        window.removeEventListener("wheel", release);
        window.removeEventListener("touchstart", release);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("scrollend", onScrollEnd);
      };
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
    const stop = () => {
      unlock();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      nav.removeEventListener("scroll", edges);
      nav.removeEventListener("click", onClick);
      ro == null ? void 0 : ro.disconnect();
      unheight();
      current == null ? void 0 : current.removeAttribute("aria-current");
      delete nav.dataset.atStart;
      delete nav.dataset.atEnd;
    };
    return Object.assign(stop, { lock });
  }
  function mountChecklist(list) {
    var _a, _b, _c;
    if (typeof document === "undefined") return () => void 0;
    const key = list.dataset.store || null;
    const boxes = () => Array.from(list.querySelectorAll('li[data-id] input[type="checkbox"]'));
    const idOf = (b) => {
      var _a2, _b2;
      return (_b2 = (_a2 = b.closest("li[data-id]")) == null ? void 0 : _a2.dataset.id) != null ? _b2 : "";
    };
    let progress = null;
    for (let sib = list.previousElementSibling; sib; sib = sib.previousElementSibling) {
      if (sib.classList.contains("nish-checklist-progress")) {
        progress = sib;
        break;
      }
    }
    progress != null ? progress : progress = (_b = (_a = list.parentElement) == null ? void 0 : _a.querySelector(".nish-checklist-progress")) != null ? _b : null;
    if (key) {
      try {
        const saved = JSON.parse((_c = localStorage.getItem(key)) != null ? _c : "[]");
        if (Array.isArray(saved)) for (const b of boxes()) b.checked = saved.includes(idOf(b));
      } catch (e) {
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
        } catch (e2) {
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
  return __toCommonJS(theme_global_exports);
})();
