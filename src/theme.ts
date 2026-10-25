/** Theme switching shared by every nish.software page.
 *
 *  The choice ('system' or a theme name) lives in a `nish-theme` cookie on
 *  `.nish.software`, so picking dark on one subdomain applies on all of them. On
 *  localhost and in Electron there is no shared domain, so it falls back to
 *  localStorage. theme-init.js applies the same rules before first paint; this
 *  module takes over for runtime switching and keeps tabs and subdomains in sync.
 */
import { DEFAULT_THEME, THEMES, type Scheme } from './tokens.mjs';

export type ThemeName = keyof typeof THEMES;
export type ThemeChoice = ThemeName | 'system';

export interface ThemePreset {
  id: ThemeName;
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}

export const PRESETS: ThemePreset[] = (Object.keys(THEMES) as ThemeName[]).map((id) => ({
  id,
  label: THEMES[id].label,
  scheme: THEMES[id].scheme,
  colors: THEMES[id].colors,
}));

const KEY = 'nish-theme';
const SHARED_DOMAIN = 'nish.software';
const ONE_YEAR = 60 * 60 * 24 * 365;

export function isThemeName(v: unknown): v is ThemeName {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(THEMES, v);
}

function readCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)nish-theme=([a-z-]+)/);
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
  if (allowed && !allowed.includes(theme)) theme = THEMES[theme].scheme;
  return theme;
}

export function schemeOf(theme: ThemeName): Scheme {
  return THEMES[theme].scheme;
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
  const i = TOGGLE_ORDER.indexOf(getThemeChoice());
  const next = TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
  setThemeChoice(next);
  return next;
}

/** For pages without a framework: apply now and start syncing. */
export function initTheme(): ThemeName {
  watch();
  return applyTheme();
}
