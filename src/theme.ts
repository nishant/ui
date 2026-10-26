/** Theme switching shared by every nish.software page.
 *
 *  The choice ('system' or a theme name) lives in a `nish-theme` cookie on
 *  `.nish.software`, so picking dark on one subdomain applies on all of them. On
 *  localhost and in Electron there is no shared domain, so it falls back to
 *  localStorage. theme-init.js applies the same rules before first paint; this
 *  module takes over for runtime switching and keeps tabs and subdomains in sync.
 */
import { DEFAULT_THEME, THEMES, type Scheme } from './tokens.mjs';

/** A shared theme, or an app's own one added with registerThemes(). */
export type ThemeName = keyof typeof THEMES | (string & {});
export type ThemeChoice = ThemeName | 'system';

export interface ThemePreset {
  id: ThemeName;
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}

export const PRESETS: ThemePreset[] = (Object.keys(THEMES) as (keyof typeof THEMES)[]).map((id) => ({
  id,
  label: THEMES[id].label,
  scheme: THEMES[id].scheme,
  colors: THEMES[id].colors,
}));

const KEY = 'nish-theme';
const SHARED_DOMAIN = 'nish.software';
const ONE_YEAR = 60 * 60 * 24 * 365;

// App-defined themes ({ id: 'dark' | 'light' }). The app styles them itself with
// [data-theme='<id>'] blocks that set --nish-* variables; this only teaches the theme
// logic that the names are valid and which scheme each one is.
const extra: Record<string, Scheme> = {};

/** Let an app offer its own themes next to the shared ones. Call it before
 *  initTheme(), and set the same map on window.__nishExtraThemes before theme-init.js
 *  runs, so the first paint knows them too. */
export function registerThemes(themes: Record<string, Scheme>): void {
  Object.assign(extra, themes);
}

const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

export function isThemeName(v: unknown): v is ThemeName {
  return typeof v === 'string' && (has(THEMES, v) || has(extra, v));
}

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)nish-theme=([a-z0-9-]+)/);
  return m ? m[1] : null;
}

function onSharedDomain(): boolean {
  const h = typeof location === 'undefined' ? '' : location.hostname;
  return h === SHARED_DOMAIN || h.endsWith('.' + SHARED_DOMAIN);
}

/** The saved choice; 'system' when nothing (valid) is saved. */
export function getThemeChoice(): ThemeChoice {
  let v: string | null = null;
  try {
    v = readCookie() ?? localStorage.getItem(KEY);
  } catch {
    // storage blocked: fall through to system
  }
  return v === 'system' || isThemeName(v) ? v : 'system';
}

function systemTheme(): ThemeName {
  const light = typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches;
  return light ? 'light' : DEFAULT_THEME;
}

/** Pages may limit themselves with <html data-nish-themes="dark light">. */
function allowedThemes(): ThemeName[] | null {
  const attr = document.documentElement.getAttribute('data-nish-themes');
  return attr ? (attr.split(/\s+/).filter(isThemeName) as ThemeName[]) : null;
}

/** What a choice renders as on this page. */
export function resolveTheme(choice: ThemeChoice = getThemeChoice()): ThemeName {
  let theme: ThemeName = choice === 'system' ? systemTheme() : choice;
  const allowed = typeof document === 'undefined' ? null : allowedThemes();
  if (allowed && !allowed.includes(theme)) theme = schemeOf(theme);
  return theme;
}

export function schemeOf(theme: ThemeName): Scheme {
  return has(THEMES, theme) ? THEMES[theme as keyof typeof THEMES].scheme : (extra[theme] ?? 'dark');
}

/** Paint a choice onto <html> without saving it. */
export function applyTheme(choice: ThemeChoice = getThemeChoice()): ThemeName {
  const theme = resolveTheme(choice);
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-scheme', schemeOf(theme));
  root.setAttribute('data-theme-choice', choice);
  root.style.colorScheme = schemeOf(theme);
  syncChromeColor();
  listeners.forEach((fn) => fn(choice, theme));
  return theme;
}

/** Save a choice everywhere it can be read back, then apply it. */
export function setThemeChoice(choice: ThemeChoice): ThemeName {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // private mode: the cookie (or nothing) still carries it for this page view
  }
  if (onSharedDomain()) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${KEY}=${choice}; Domain=.${SHARED_DOMAIN}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
  }
  return applyTheme(choice);
}

/** Current value of a token on <html>, e.g. readToken('chart-1') for canvas charts. */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--nish-${name}`).trim();
}

/** Keep the browser/PWA chrome and the root background in step with the theme, so
 *  the old color never peeks through on overscroll. */
function syncChromeColor(): void {
  const bg = readToken('bg');
  if (!bg) return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = bg;
}

type Listener = (choice: ThemeChoice, theme: ThemeName) => void;
const listeners = new Set<Listener>();
let watching = false;

/** Re-apply when the OS scheme flips (for 'system'), another tab saves a choice, or
 *  the page comes back into view after another subdomain changed the cookie. */
function watch(): void {
  if (watching || typeof window === 'undefined') return;
  watching = true;
  const reapply = () => {
    const choice = getThemeChoice();
    if (choice !== document.documentElement.getAttribute('data-theme-choice') || choice === 'system') applyTheme(choice);
  };
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', reapply);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) reapply();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reapply();
  });
}

/** Subscribe to theme changes; returns an unsubscribe function. */
export function onThemeChange(fn: Listener): () => void {
  watch();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The order a one-button toggle steps through. */
export const TOGGLE_ORDER: ThemeChoice[] = ['system', 'light', 'dark'];

/** One-button toggle for static pages: system → light → dark → system. A preset
 *  chosen elsewhere steps to 'system'. */
export function cycleTheme(): ThemeChoice {
  const next = nextChoice(getThemeChoice());
  setThemeChoice(next);
  return next;
}

/** Words mountThemeToggle uses for the three one-button choices. */
export type ThemeToggleLabels = Partial<Record<'system' | 'light' | 'dark', string>>;

export interface MountThemeToggleOptions {
  /** Replace the words "System", "Light" and "Dark" in the button's label, e.g. for
   *  another language. The label reads "Theme: Light. Switch to Dark". */
  labels?: ThemeToggleLabels;
  /** Also show the current choice as a word after the icon (System, Light, Dark, or a
   *  preset's name such as "Mocha" when one was saved on another site): a
   *  <span data-theme-word aria-hidden="true">, kept in sync on click and on theme
   *  changes. aria-label and title stay as they are. Style the button with
   *  .nish-theme-btn--labelled. */
  showLabel?: boolean;
}

// Same geometry as ThemeToggle's MonitorIcon, SunIcon and MoonIcon (lucide, 24px grid).
const TOGGLE_ICONS: Record<'system' | 'light' | 'dark', string> = {
  system: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
  light:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/>',
  dark: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
};

const DEFAULT_TOGGLE_LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

/** What a one-button toggle steps to from a choice: the same rule as cycleTheme(). */
function nextChoice(choice: ThemeChoice): ThemeChoice {
  const i = TOGGLE_ORDER.indexOf(choice);
  return TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
}

function themeLabel(choice: ThemeChoice, words: Record<'system' | 'light' | 'dark', string>): string {
  if (choice === 'system' || choice === 'light' || choice === 'dark') return words[choice as 'system' | 'light' | 'dark'];
  if (has(THEMES, choice)) return THEMES[choice as keyof typeof THEMES].label;
  return choice.charAt(0).toUpperCase() + choice.slice(1);
}

/** Turn any button on a static page into the one-button theme toggle (system → light
 *  → dark → system). It fills the button with the three icons (only the current one
 *  shows), sets `data-choice`, keeps `aria-label` and `title` saying what is on and
 *  what a click does ("Theme: Light. Switch to Dark"; a preset saved on another site
 *  reads "Theme: Mocha (set on another site). Switch to System"), cycles on click and
 *  follows changes from other tabs and subdomains. Returns a cleanup function.
 *
 *  ```html
 *  <button class="nish-theme-btn" id="theme"></button>
 *  <script type="module">
 *    import { initTheme, mountThemeToggle } from './nish/theme.js';
 *    initTheme();
 *    mountThemeToggle(document.getElementById('theme'));
 *  </script>
 *  ```
 */
export function mountThemeToggle(button: HTMLElement, opts: MountThemeToggleOptions = {}): () => void {
  const words = { ...DEFAULT_TOGGLE_LABELS, ...opts.labels };
  if (button.tagName === 'BUTTON' && !button.getAttribute('type')) button.setAttribute('type', 'button');
  button.innerHTML =
    (Object.keys(TOGGLE_ICONS) as (keyof typeof TOGGLE_ICONS)[])
      .map(
        (id) =>
          `<svg data-icon="${id}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${TOGGLE_ICONS[id]}</svg>`,
      )
      .join('') + (opts.showLabel ? '<span data-theme-word aria-hidden="true"></span>' : '');
  const word = button.querySelector<HTMLElement>('[data-theme-word]');

  const render = (choice: ThemeChoice) => {
    // A preset shows the icon of the scheme it is built on.
    const icon = choice === 'system' || choice === 'light' || choice === 'dark' ? choice : schemeOf(choice);
    button.setAttribute('data-choice', choice);
    button.querySelectorAll<SVGElement>('svg[data-icon]').forEach((svg) => {
      if (svg.getAttribute('data-icon') === icon) svg.removeAttribute('display');
      else svg.setAttribute('display', 'none');
    });
    const elsewhere = TOGGLE_ORDER.includes(choice) ? '' : ' (set on another site)';
    const label = `Theme: ${themeLabel(choice, words)}${elsewhere}. Switch to ${themeLabel(nextChoice(choice), words)}`;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    if (word) word.textContent = themeLabel(choice, words);
  };

  const onClick = () => {
    cycleTheme();
  };
  button.addEventListener('click', onClick);
  const off = onThemeChange((choice) => render(choice));
  render(getThemeChoice());
  return () => {
    button.removeEventListener('click', onClick);
    off();
  };
}

// --- showToast (static pages) ------------------------------------------------------

export type StaticToastTone = 'neutral' | 'ok' | 'warn' | 'loss' | 'info';

export interface ShowToastOptions {
  /** Border tint: ok, warn, loss or info (the /30 tint border). Default neutral. */
  tone?: StaticToastTone;
  /** Milliseconds before it hides itself, or 'sticky' to stay until dismissed. Default
   *  6000. The timer pauses while the toast is hovered or holds focus, so a keyboard
   *  user can reach a link inside it. */
  duration?: number | 'sticky';
  /** One text action after the message: a link (href) or a button (onClick). Clicking
   *  it hides the toast. */
  action?: { label: string; href?: string; onClick?: () => void };
  /** Accessible name of the dismiss button. Default "Dismiss". */
  dismissLabel?: string;
}

const TOAST_MS = 6_000;
let toastRegion: HTMLElement | null = null;
let hideCurrent: (() => void) | null = null;

/** Show one toast on a static page: a .nish-toast inside a single role="status"
 *  aria-live="polite" region (created on first use). A new toast replaces the one on
 *  screen. content is text, or a Node for markup (a <strong>, a link): text is never
 *  parsed as HTML. Same policy as the React toast: the timer pauses on hover and on
 *  focus. Returns a function that hides it now. Needs nish-components.css. */
export function showToast(content: string | Node, opts: ShowToastOptions = {}): () => void {
  hideCurrent?.();
  if (!toastRegion || !toastRegion.isConnected) {
    toastRegion = document.createElement('div');
    toastRegion.setAttribute('role', 'status');
    toastRegion.setAttribute('aria-live', 'polite');
    toastRegion.className = 'nish-toast-region';
    document.body.appendChild(toastRegion);
  }
  const region = toastRegion;
  const box = document.createElement('div');
  box.className = 'nish-toast' + (opts.tone && opts.tone !== 'neutral' ? ` nish-toast--${opts.tone}` : '');
  const body = document.createElement('p');
  body.className = 'nish-toast-body';
  body.append(typeof content === 'string' ? document.createTextNode(content) : content);
  box.append(body);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let remaining = opts.duration === 'sticky' ? Infinity : (opts.duration ?? TOAST_MS);
  let started = 0;
  let holds = 0;
  const hide = () => {
    if (timer != null) clearTimeout(timer);
    timer = null;
    box.remove();
    if (hideCurrent === hide) hideCurrent = null;
  };
  const run = (ms: number) => {
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
    // Give the reader a moment after they move away, even if the time had nearly run out.
    if (holds === 0) run(Math.max(remaining, 1_000));
  };

  if (opts.action) {
    const a = opts.action;
    const el = document.createElement(a.href ? 'a' : 'button');
    el.className = 'nish-toast-action';
    el.textContent = a.label;
    if (a.href) (el as HTMLAnchorElement).href = a.href;
    else (el as HTMLButtonElement).type = 'button';
    el.addEventListener('click', () => {
      a.onClick?.();
      hide();
    });
    box.append(el);
  }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nish-toast-close';
  close.setAttribute('aria-label', opts.dismissLabel ?? 'Dismiss');
  close.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  close.addEventListener('click', hide);
  box.append(close);

  // Mouse only: a tap fires enter with no leave, which would pin the toast forever.
  box.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && pause());
  box.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && resume());
  box.addEventListener('focusin', (e) => !box.contains(e.relatedTarget as Node | null) && pause());
  box.addEventListener('focusout', (e) => !box.contains(e.relatedTarget as Node | null) && resume());
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  // Insert after the region is in the DOM, so screen readers announce the change.
  setTimeout(() => {
    if (hideCurrent !== hide) return;
    region.append(box);
    run(remaining);
  }, 50);
  hideCurrent = hide;
  return hide;
}

/** For pages without a framework: apply now and start syncing. */
export function initTheme(): ThemeName {
  watch();
  return applyTheme();
}
