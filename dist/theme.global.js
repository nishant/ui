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
    mountThemeToggle: () => mountThemeToggle,
    mountTooltips: () => mountTooltips,
    onThemeChange: () => onThemeChange,
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
  var THEMES = {
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
  var _a, _b, _c, _d, _e, _f, _g, _h;
  for (const t of Object.values(THEMES)) {
    for (const r of ["ok", "loss", "warn", "info"]) {
      (_c = (_a = t.colors)[_b = `${r}-fill`]) != null ? _c : _a[_b] = t.colors[r];
      (_f = (_d = t.colors)[_e = `on-${r}`]) != null ? _f : _d[_e] = t.colors["on-accent"];
    }
    (_h = (_g = t.colors)["on-accent2"]) != null ? _h : _g["on-accent2"] = t.colors["on-accent"];
  }
  var DEFAULT_THEME = "dark";

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
    var _a2;
    let v = null;
    try {
      v = (_a2 = readCookie()) != null ? _a2 : localStorage.getItem(KEY);
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
    var _a2;
    return has(THEMES, theme) ? THEMES[theme].scheme : (_a2 = extra[theme]) != null ? _a2 : "dark";
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
    } catch (e) {
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
    const words = __spreadValues(__spreadValues({}, DEFAULT_TOGGLE_LABELS), opts.labels);
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
    var _a2, _b2;
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
    const body = document.createElement("p");
    body.className = "nish-toast-body";
    body.append(typeof content === "string" ? document.createTextNode(content) : content);
    box.append(body);
    let timer = null;
    let remaining = opts.duration === "sticky" ? Infinity : (_a2 = opts.duration) != null ? _a2 : TOAST_MS;
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
        var _a3;
        (_a3 = a.onClick) == null ? void 0 : _a3.call(a);
        hide();
      });
      box.append(el);
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "nish-toast-close";
    close.setAttribute("aria-label", (_b2 = opts.dismissLabel) != null ? _b2 : "Dismiss");
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
    var _a2, _b2;
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
    const cancelBtn = button((_a2 = opts.cancelLabel) != null ? _a2 : "Cancel", "nish-btn");
    const confirmBtn = button((_b2 = opts.confirmLabel) != null ? _b2 : "Confirm", `nish-btn ${danger ? "nish-btn--danger" : "nish-btn--primary"}`);
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
      var _a2;
      const tip = t.querySelector(":scope > .nish-tooltip-content");
      if (!tip) return;
      if (!tip.getAttribute("role")) tip.setAttribute("role", "tooltip");
      if (!tip.id) tip.id = `nish-tip-${++dialogSeq}`;
      const ids = ((_a2 = t.getAttribute("aria-describedby")) != null ? _a2 : "").split(/\s+/).filter(Boolean);
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
  return __toCommonJS(theme_global_exports);
})();
//# sourceMappingURL=theme.global.js.map