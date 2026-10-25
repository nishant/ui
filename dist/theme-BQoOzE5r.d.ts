type Scheme = 'dark' | 'light';
interface ThemeDef {
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}
/** Roles every theme must define (soft tints are derived, not listed). */
declare const COLOR_ROLES: string[];
/** The 8 hue roles: colors with no meaning (tags, tiles, stores). */
declare const HUE_ROLES: string[];
/** Roles with a 14% tint, --nish-<role>-soft: the status roles, then the hues. */
declare const SOFT_ROLES: string[];
declare const THEMES: Record<'dark' | 'light' | 'slate' | 'terminal' | 'mocha' | 'ocean' | 'contrast', ThemeDef>;
declare const DEFAULT_THEME: 'dark';
/** Everything that is not a color (type, space, radii, motion, z-index, layout). */
declare const SCALE: Record<string, string>;
declare const SHADOWS: Record<'card' | 'pop' | 'modal', string>;

/** Theme switching shared by every nish.software page.
 *
 *  The choice ('system' or a theme name) lives in a `nish-theme` cookie on
 *  `.nish.software`, so picking dark on one subdomain applies on all of them. On
 *  localhost and in Electron there is no shared domain, so it falls back to
 *  localStorage. theme-init.js applies the same rules before first paint; this
 *  module takes over for runtime switching and keeps tabs and subdomains in sync.
 */

/** A shared theme, or an app's own one added with registerThemes(). */
type ThemeName = keyof typeof THEMES | (string & {});
type ThemeChoice = ThemeName | 'system';
interface ThemePreset {
    id: ThemeName;
    label: string;
    scheme: Scheme;
    colors: Record<string, string>;
}
declare const PRESETS: ThemePreset[];
/** Let an app offer its own themes next to the shared ones. Call it before
 *  initTheme(), and set the same map on window.__nishExtraThemes before theme-init.js
 *  runs, so the first paint knows them too. */
declare function registerThemes(themes: Record<string, Scheme>): void;
declare function isThemeName(v: unknown): v is ThemeName;
/** The saved choice; 'system' when nothing (valid) is saved. */
declare function getThemeChoice(): ThemeChoice;
/** What a choice renders as on this page. */
declare function resolveTheme(choice?: ThemeChoice): ThemeName;
declare function schemeOf(theme: ThemeName): Scheme;
/** Paint a choice onto <html> without saving it. */
declare function applyTheme(choice?: ThemeChoice): ThemeName;
/** Save a choice everywhere it can be read back, then apply it. */
declare function setThemeChoice(choice: ThemeChoice): ThemeName;
/** Current value of a token on <html>, e.g. readToken('chart-1') for canvas charts. */
declare function readToken(name: string): string;
type Listener = (choice: ThemeChoice, theme: ThemeName) => void;
/** Subscribe to theme changes; returns an unsubscribe function. */
declare function onThemeChange(fn: Listener): () => void;
/** The order a one-button toggle steps through. */
declare const TOGGLE_ORDER: ThemeChoice[];
/** One-button toggle for static pages: system → light → dark → system. A preset
 *  chosen elsewhere steps to 'system'. */
declare function cycleTheme(): ThemeChoice;
/** Words mountThemeToggle uses for the three one-button choices. */
type ThemeToggleLabels = Partial<Record<'system' | 'light' | 'dark', string>>;
interface MountThemeToggleOptions {
    /** Replace the words "System", "Light" and "Dark" in the button's label, e.g. for
     *  another language. The label reads "Theme: Light. Switch to Dark". */
    labels?: ThemeToggleLabels;
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
declare function mountThemeToggle(button: HTMLElement, opts?: MountThemeToggleOptions): () => void;
/** For pages without a framework: apply now and start syncing. */
declare function initTheme(): ThemeName;

export { COLOR_ROLES as C, DEFAULT_THEME as D, HUE_ROLES as H, PRESETS as P, SCALE as S, SHADOWS as b, SOFT_ROLES as c, THEMES as d, TOGGLE_ORDER as e, applyTheme as h, cycleTheme as i, getThemeChoice as j, initTheme as k, isThemeName as l, mountThemeToggle as m, registerThemes as n, onThemeChange as o, resolveTheme as p, setThemeChoice as q, readToken as r, schemeOf as s };
export type { MountThemeToggleOptions as M, ThemeChoice as T, ThemeName as a, ThemePreset as f, ThemeToggleLabels as g };
