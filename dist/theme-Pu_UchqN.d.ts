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
    /** Also show the current choice as a word after the icon (System, Light, Dark, or a
     *  preset's name such as "Mocha" when one was saved on another site): a
     *  <span data-theme-word aria-hidden="true">, kept in sync on click and on theme
     *  changes. aria-label and title stay as they are. Style the button with
     *  .nish-theme-btn--labelled. */
    showLabel?: boolean;
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
type StaticToastTone = 'neutral' | 'ok' | 'warn' | 'loss' | 'info';
interface ShowToastOptions {
    /** Border tint: ok, warn, loss or info (the /30 tint border). Default neutral. */
    tone?: StaticToastTone;
    /** Milliseconds before it hides itself, or 'sticky' to stay until dismissed. Default
     *  6000. The timer pauses while the toast is hovered or holds focus, so a keyboard
     *  user can reach a link inside it. */
    duration?: number | 'sticky';
    /** One text action after the message: a link (href) or a button (onClick). Clicking
     *  it hides the toast. */
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    /** Accessible name of the dismiss button. Default "Dismiss". */
    dismissLabel?: string;
}
/** Show one toast on a static page: a .nish-toast inside a single role="status"
 *  aria-live="polite" region (created on first use). A new toast replaces the one on
 *  screen. content is text, or a Node for markup (a <strong>, a link): text is never
 *  parsed as HTML. Same policy as the React toast: the timer pauses on hover and on
 *  focus. Returns a function that hides it now. Needs nish-components.css. */
declare function showToast(content: string | Node, opts?: ShowToastOptions): () => void;
/** For pages without a framework: apply now and start syncing. */
declare function initTheme(): ThemeName;

export { COLOR_ROLES as C, DEFAULT_THEME as D, HUE_ROLES as H, PRESETS as P, SCALE as S, SHADOWS as b, SOFT_ROLES as c, THEMES as f, TOGGLE_ORDER as g, applyTheme as j, cycleTheme as k, getThemeChoice as l, initTheme as m, isThemeName as n, mountThemeToggle as o, onThemeChange as p, registerThemes as q, readToken as r, resolveTheme as s, schemeOf as t, setThemeChoice as u, showToast as v };
export type { MountThemeToggleOptions as M, ThemeChoice as T, ThemeName as a, ShowToastOptions as d, StaticToastTone as e, ThemePreset as h, ThemeToggleLabels as i };
