// src/theme.ts
import { DEFAULT_THEME, THEMES } from "./tokens.mjs";
import { shared } from "./runtime.js";
import { safeUrl } from "./url.js";
import { DEFAULT_STRINGS } from "./components/strings.js";
function buildPresets() {
  return Object.keys(THEMES).map((id) => ({
    id,
    label: THEMES[id].label,
    scheme: THEMES[id].scheme,
    colors: THEMES[id].colors
  }));
}
var PRESETS = /* @__PURE__ */ buildPresets();
var DEFAULT_KEY = "nish-theme";
var SHARED_DOMAIN = "nish.software";
var ONE_YEAR = 60 * 60 * 24 * 365;
var state = () => shared("theme", () => ({ extra: {}, listeners: /* @__PURE__ */ new Set(), watching: false, switchId: 0 }));
var warn = (msg) => {
  if (globalThis.process?.env?.NODE_ENV !== "production") console.warn(`nish-ui: ${msg}`);
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
  } catch {
    return null;
  }
}
var covers = (domain, host) => host === domain || host.endsWith("." + domain);
function cookieDomain(host, attr) {
  const h = host.toLowerCase();
  const own = (attr ?? "").trim().toLowerCase().replace(/^\./, "");
  if (own) return covers(own, h) ? own : null;
  return covers(SHARED_DOMAIN, h) ? SHARED_DOMAIN : null;
}
function sharedDomain() {
  if (typeof location === "undefined" || typeof document === "undefined") return null;
  return cookieDomain(location.hostname, document.documentElement.getAttribute("data-nish-domain"));
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
function setThemeChoice(choice) {
  if (choice !== "system" && !isThemeName(choice)) {
    warn(`unknown theme "${String(choice)}" ignored. Register it with registerThemes() first.`);
    return resolveTheme(getThemeChoice());
  }
  const key = storageKey();
  try {
    localStorage.setItem(key, choice);
  } catch {
  }
  try {
    const domain = sharedDomain();
    if (domain) {
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${key}=${choice}; Domain=.${domain}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
    }
  } catch {
  }
  return applyTheme(choice);
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
var TOGGLE_ORDER = ["system", "light", "dark"];
function cycleTheme() {
  const next = nextChoice(getThemeChoice());
  setThemeChoice(next);
  return next;
}
var SVG_NS = "http://www.w3.org/2000/svg";
function svgIcon(size, shapes, attrs = {}) {
  const el = document.createElementNS(SVG_NS, "svg");
  const all = {
    width: String(size),
    height: String(size),
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
    ...attrs
  };
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
  system: DEFAULT_STRINGS.themeSystem,
  light: DEFAULT_STRINGS.themeLight,
  dark: DEFAULT_STRINGS.themeDark
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
  const words = { ...defaultToggleLabels(), ...opts.labels };
  const sentence = opts.strings?.themeToggleLabel ?? DEFAULT_STRINGS.themeToggleLabel;
  const elsewhereWords = opts.elsewhereLabel ?? DEFAULT_ELSEWHERE;
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
  const icon = document.createElement("span");
  icon.className = "nish-toast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.append(svgIcon(15, TOAST_ICONS[opts.tone ?? "neutral"]));
  box.append(icon);
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
  const action = opts.action;
  const href = action?.href != null ? safeUrl(action.href) : null;
  if (action && (action.href == null || href != null)) {
    const el = document.createElement(action.href != null ? "a" : "button");
    el.className = "nish-toast-action";
    el.textContent = action.label;
    if (href != null) el.href = href;
    else el.type = "button";
    el.addEventListener("click", () => {
      action.onClick?.();
      hide();
    });
    box.append(el);
  }
  const close = document.createElement("button");
  close.type = "button";
  close.className = "nish-toast-close";
  close.setAttribute("aria-label", opts.dismissLabel ?? opts.strings?.dismiss ?? DEFAULT_STRINGS.dismiss);
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
  const cancelBtn = button(opts.cancelLabel ?? opts.strings?.cancel ?? DEFAULT_STRINGS.cancel, "nish-btn");
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
  const unheight = o.height === false ? () => void 0 : mountHeightVar(nav, "--nish-sticky-extra");
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
export {
  PRESETS,
  TOGGLE_ORDER,
  applyTheme,
  confirmDialog,
  cycleTheme,
  getThemeChoice,
  initTheme,
  isThemeName,
  mountChecklist,
  mountHeightVar,
  mountScrollspy,
  mountStuck,
  mountThemeToggle,
  mountTooltips,
  onThemeChange,
  openSheet,
  readToken,
  registerThemes,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  showToast
};
