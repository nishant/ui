type Scheme = 'dark' | 'light';
interface ThemeDef {
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}
declare const THEMES: Record<'dark' | 'light' | 'slate' | 'terminal' | 'mocha' | 'ocean' | 'contrast', ThemeDef>;

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
interface ConfirmDialogOptions {
    /** The question, e.g. "Save before closing?". Also the dialog's name. */
    title: string;
    /** What happens if they confirm: text, or a Node for markup (never parsed as HTML). */
    body?: string | Node;
    /** The confirm button's label: a verb that names the action. Default "Confirm". */
    confirmLabel?: string;
    /** The cancel button's label. Default "Cancel". */
    cancelLabel?: string;
    /** danger: a red confirm button, and focus starts on Cancel (as in the React
     *  ConfirmDialog). Without it: an accent confirm button that takes the first focus. */
    tone?: 'danger' | 'primary';
}
/** A yes-or-no question in place of `window.confirm`, for pages without React: a
 *  native <dialog class="nish-dialog"> opened with showModal(), so the browser traps
 *  focus and makes the page inert. Resolves true on the confirm button, false on Cancel,
 *  Escape or a backdrop click; then the dialog is removed and focus returns to the
 *  element that had it. Escape does not reach the page's own key handlers. Needs
 *  nish-components.css. */
declare function confirmDialog(opts: ConfirmDialogOptions): Promise<boolean>;
/** Escape for .nish-tooltip triggers under root (default document): pressing it hides
 *  the open tip until the pointer leaves or focus moves away, as the React Tooltip does.
 *  Also links a .nish-tooltip-content without an id to its trigger by aria-describedby.
 *  The tips show and hide on hover and focus with CSS alone; this only adds Escape.
 *  Returns a function that removes the listeners. */
declare function mountTooltips(root?: Document | HTMLElement): () => void;
/** Open a <dialog class="nish-sheet"> as a modal bottom sheet (a centered panel from
 *  640px): showModal, Escape and a backdrop click close it, a downward swipe on the handle
 *  or header closes it on touch, `[data-sheet-close]` elements inside close it, and focus
 *  returns to the element that opened it. The exit animation plays before the dialog
 *  closes (none under reduced motion). The dialog's own `close` event still fires. Returns
 *  a function that closes the sheet. Needs nish-components.css. */
declare function openSheet(dialog: HTMLDialogElement): () => void;
/** Publish an element's height as a CSS variable on <html> (the static twin of
 *  useHeightVar): `mountHeightVar(nav, '--nish-bottom-nav-h')`. Written now and on every
 *  resize; removed when the element is hidden (height 0) and by the returned cleanup. */
declare function mountHeightVar(el: HTMLElement, name: string): () => void;
/** Toggle `data-stuck` on a position:sticky element while it is stuck to its `top`: the page
 *  (or a scrolling ancestor) has scrolled and the element rests at its sticky `top`. Not
 *  stuck at scroll 0, when the element is not position:sticky, or once its container has
 *  carried it past the top. Nothing is inserted into the DOM, so flex and grid parents are
 *  unaffected. An IntersectionObserver (its root margin cut 1px below the sticky `top`)
 *  and scroll events trigger the check; the `top` is re-read on resize and `<html>` style
 *  changes. Style `.nish-sticky[data-stuck]` or your own. `onChange` is called with every
 *  change. Returns a function that stops watching. */
declare function mountStuck(el: HTMLElement, onChange?: (stuck: boolean) => void): () => void;
interface MountScrollspyOptions {
    /** Pixels from the top of the viewport where a section counts as current. Default: the
     *  `--nish-header-h` variable plus the nav's own height plus 8. */
    offset?: number;
}
/** Scrollspy for a `.nish-subnav`: each `a[href^="#"]` maps to the element with that id.
 *  The link whose section is current gets `aria-current="true"` (the last section whose top
 *  has passed the offset, the first one at the top of the page), is scrolled into view
 *  inside the nav, and the nav gets `data-at-start` / `data-at-end` for its edge fades.
 *  Publishes the nav's height as `--nish-sticky-extra` so `.nish-scroll-target` clears it.
 *  Returns a function that removes everything. */
declare function mountScrollspy(nav: HTMLElement, o?: MountScrollspyOptions): () => void;
/** Persist a checklist: the `input[type=checkbox]` inside each `li[data-id]` of `list` is
 *  saved to localStorage under `list.dataset.store` (a JSON array of checked ids) and
 *  restored now. Updates the `.nish-checklist-progress` element before the list (or the
 *  first one in its parent) to "{done} of {total}" and its `--p` meter. Without
 *  `data-store` it still counts. Storage failures are ignored. Returns a function that
 *  removes the listener. */
declare function mountChecklist(list: HTMLElement): () => void;
/** For pages without a framework: apply now and start syncing. */
declare function initTheme(): ThemeName;

export { PRESETS, TOGGLE_ORDER, applyTheme, confirmDialog, cycleTheme, getThemeChoice, initTheme, isThemeName, mountChecklist, mountHeightVar, mountScrollspy, mountStuck, mountThemeToggle, mountTooltips, onThemeChange, openSheet, readToken, registerThemes, resolveTheme, schemeOf, setThemeChoice, showToast };
export type { ConfirmDialogOptions, MountScrollspyOptions, MountThemeToggleOptions, ShowToastOptions, StaticToastTone, ThemeChoice, ThemeName, ThemePreset, ThemeToggleLabels };
