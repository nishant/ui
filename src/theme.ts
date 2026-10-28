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

// --- confirmDialog (static pages) --------------------------------------------------

export interface ConfirmDialogOptions {
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

let dialogSeq = 0;

/** A yes-or-no question in place of `window.confirm`, for pages without React: a
 *  native <dialog class="nish-dialog"> opened with showModal(), so the browser traps
 *  focus and makes the page inert. Resolves true on the confirm button, false on Cancel,
 *  Escape or a backdrop click; then the dialog is removed and focus returns to the
 *  element that had it. Escape does not reach the page's own key handlers. Needs
 *  nish-components.css. */
export function confirmDialog(opts: ConfirmDialogOptions): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const id = `nish-dialog-${++dialogSeq}`;
  const danger = opts.tone === 'danger';

  const dialog = document.createElement('dialog');
  dialog.className = 'nish-dialog';
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  const title = document.createElement('h2');
  title.className = 'nish-dialog-title';
  title.id = `${id}-title`;
  title.textContent = opts.title;
  dialog.append(title);
  if (opts.body != null && opts.body !== '') {
    const body = document.createElement('div');
    body.className = 'nish-dialog-body';
    body.id = `${id}-body`;
    body.append(typeof opts.body === 'string' ? document.createTextNode(opts.body) : opts.body);
    dialog.setAttribute('aria-describedby', body.id);
    dialog.append(body);
  }
  const actions = document.createElement('div');
  actions.className = 'nish-dialog-actions';
  const button = (label: string, cls: string) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.textContent = label;
    return b;
  };
  const cancelBtn = button(opts.cancelLabel ?? 'Cancel', 'nish-btn');
  const confirmBtn = button(opts.confirmLabel ?? 'Confirm', `nish-btn ${danger ? 'nish-btn--danger' : 'nish-btn--primary'}`);
  (danger ? cancelBtn : confirmBtn).autofocus = true;
  actions.append(cancelBtn, confirmBtn);
  dialog.append(actions);

  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      if (opener?.isConnected) opener.focus();
      resolve(ok);
    };
    cancelBtn.addEventListener('click', () => finish(false));
    confirmBtn.addEventListener('click', () => finish(true));
    // Escape: the browser fires cancel; keep the key from the page's own listeners
    // (an outer framework dialog would close too).
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') e.stopPropagation();
    });
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      finish(false);
    });
    dialog.addEventListener('close', () => finish(false));
    // A press on the backdrop targets the dialog itself, outside its box.
    dialog.addEventListener('click', (e) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) finish(false);
    });
    document.body.append(dialog);
    dialog.showModal();
  });
}

// --- mountTooltips (static pages) --------------------------------------------------

/** Escape for .nish-tooltip triggers under root (default document): pressing it hides
 *  the open tip until the pointer leaves or focus moves away, as the React Tooltip does.
 *  Also links a .nish-tooltip-content without an id to its trigger by aria-describedby.
 *  The tips show and hide on hover and focus with CSS alone; this only adds Escape.
 *  Returns a function that removes the listeners. */
export function mountTooltips(root: Document | HTMLElement = document): () => void {
  if (typeof document === 'undefined') return () => undefined;
  root.querySelectorAll<HTMLElement>('.nish-tooltip').forEach((t) => {
    const tip = t.querySelector<HTMLElement>(':scope > .nish-tooltip-content');
    if (!tip) return;
    if (!tip.getAttribute('role')) tip.setAttribute('role', 'tooltip');
    if (!tip.id) tip.id = `nish-tip-${++dialogSeq}`;
    const ids = (t.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!ids.includes(tip.id)) t.setAttribute('aria-describedby', [...ids, tip.id].join(' '));
  });
  const trigger = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>('.nish-tooltip') : null);
  const onKey = (e: Event) => {
    if ((e as KeyboardEvent).key !== 'Escape') return;
    const open = root.querySelectorAll<HTMLElement>('.nish-tooltip:hover, .nish-tooltip:focus-within');
    open.forEach((t) => t.setAttribute('data-tooltip-hidden', ''));
  };
  const reset = (e: Event) => {
    const t = trigger(e);
    if (!t) return;
    const to = (e as MouseEvent | FocusEvent).relatedTarget as Node | null;
    if (to && t.contains(to)) return;
    t.removeAttribute('data-tooltip-hidden');
  };
  root.addEventListener('keydown', onKey);
  root.addEventListener('mouseout', reset);
  root.addEventListener('focusout', reset);
  return () => {
    root.removeEventListener('keydown', onKey);
    root.removeEventListener('mouseout', reset);
    root.removeEventListener('focusout', reset);
  };
}

// --- Static layout helpers (sheets, scrollspy, stuck, checklists, height vars) -------

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Open a <dialog class="nish-sheet"> as a modal bottom sheet (a centered panel from
 *  640px): showModal, Escape and a backdrop click close it, a downward swipe on the handle
 *  or header closes it on touch, `[data-sheet-close]` elements inside close it, and focus
 *  returns to the element that opened it. The exit animation plays before the dialog
 *  closes (none under reduced motion). The dialog's own `close` event still fires. Returns
 *  a function that closes the sheet. Needs nish-components.css. */
export function openSheet(dialog: HTMLDialogElement): () => void {
  if (typeof document === 'undefined') return () => undefined;
  if (dialog.open) return () => closeNow();
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  let closing = false;
  let dragging = false;

  function closeNow(): void {
    if (closing || !dialog.open) return;
    closing = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      dialog.removeEventListener('animationend', onEnd);
      if (timer !== undefined) clearTimeout(timer);
      dialog.removeAttribute('data-closing');
      dialog.style.transform = '';
      dialog.style.transition = '';
      closing = false;
      if (dialog.open) dialog.close();
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.target === dialog) finish();
    };
    if (reducedMotion()) {
      finish();
      return;
    }
    dialog.style.transform = '';
    dialog.setAttribute('data-closing', '');
    dialog.addEventListener('animationend', onEnd);
    timer = setTimeout(finish, 260);
  }

  const onCancel = (e: Event) => {
    e.preventDefault();
    closeNow();
  };
  const onKey = (e: KeyboardEvent) => {
    // Keep Escape from an outer framework dialog; the cancel event does the closing.
    if (e.key === 'Escape') e.stopPropagation();
  };
  const onClick = (e: MouseEvent) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeNow();
      return;
    }
    if (e.target instanceof Element && e.target.closest('[data-sheet-close]')) closeNow();
  };

  // Swipe down on the handle or header (touch and pen, phone layout only).
  let startY = 0;
  let lastY = 0;
  let lastT = 0;
  let velocity = 0;
  let height = 1;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' || closing || !e.isPrimary) return;
    if (typeof matchMedia !== 'undefined' && matchMedia('(min-width: 640px)').matches) return;
    const r = dialog.getBoundingClientRect();
    const onHeader = e.target instanceof Element && e.target.closest('.nish-sheet-header') != null;
    if (!onHeader && e.clientY - r.top > 28) return;
    dragging = true;
    startY = lastY = e.clientY;
    lastT = e.timeStamp;
    velocity = 0;
    height = r.height || 1;
    dialog.style.transition = 'none';
    dialog.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const dt = e.timeStamp - lastT;
    if (dt > 0) velocity = (e.clientY - lastY) / dt;
    lastY = e.clientY;
    lastT = e.timeStamp;
    dialog.style.transform = `translateY(${dy >= 0 ? dy : dy * 0.3}px)`;
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    dialog.releasePointerCapture?.(e.pointerId);
    const dy = e.clientY - startY;
    if (e.type !== 'pointercancel' && (dy > height * 0.3 || velocity > 0.5)) {
      closeNow();
      return;
    }
    dialog.style.transition = 'transform 180ms var(--nish-ease-out, ease-out)';
    dialog.style.transform = '';
    setTimeout(() => {
      if (!closing) dialog.style.transition = '';
    }, 200);
  };

  const onClose = () => {
    dialog.removeEventListener('cancel', onCancel);
    dialog.removeEventListener('keydown', onKey);
    dialog.removeEventListener('click', onClick);
    dialog.removeEventListener('pointerdown', onDown);
    dialog.removeEventListener('pointermove', onMove);
    dialog.removeEventListener('pointerup', onUp);
    dialog.removeEventListener('pointercancel', onUp);
    dialog.removeEventListener('close', onClose);
    if (opener?.isConnected) opener.focus();
  };
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('keydown', onKey);
  dialog.addEventListener('click', onClick);
  dialog.addEventListener('pointerdown', onDown);
  dialog.addEventListener('pointermove', onMove);
  dialog.addEventListener('pointerup', onUp);
  dialog.addEventListener('pointercancel', onUp);
  dialog.addEventListener('close', onClose);
  dialog.showModal();
  return closeNow;
}

/** Publish an element's height as a CSS variable on <html> (the static twin of
 *  useHeightVar): `mountHeightVar(nav, '--nish-bottom-nav-h')`. Written now and on every
 *  resize; removed when the element is hidden (height 0) and by the returned cleanup. */
export function mountHeightVar(el: HTMLElement, name: string): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const root = document.documentElement;
  const write = () => {
    const h = el.offsetHeight;
    if (h > 0) root.style.setProperty(name, `${h}px`);
    else root.style.removeProperty(name);
  };
  write();
  let ro: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(write);
    ro.observe(el);
  } else {
    window.addEventListener('resize', write);
  }
  return () => {
    ro?.disconnect();
    window.removeEventListener('resize', write);
    root.style.removeProperty(name);
  };
}

/** Toggle `data-stuck` on a position:sticky element while it is stuck to its `top` (a
 *  1px sentinel is inserted before it). Style `.nish-sticky[data-stuck]` or your own.
 *  Returns a function that stops watching and removes the sentinel. */
export function mountStuck(el: HTMLElement): () => void {
  const parent = el.parentNode;
  if (typeof document === 'undefined' || !parent || typeof IntersectionObserver === 'undefined') return () => undefined;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'height:1px;margin-bottom:-1px;pointer-events:none;visibility:hidden';
  parent.insertBefore(sentinel, el);
  const top = Math.round(parseFloat(getComputedStyle(el).top) || 0);
  const io = new IntersectionObserver(
    ([entry]) => {
      const stuck = !entry.isIntersecting && entry.boundingClientRect.top < top;
      if (stuck) el.setAttribute('data-stuck', '');
      else el.removeAttribute('data-stuck');
    },
    { threshold: [0, 1], rootMargin: `${-top - 1}px 0px 0px 0px` },
  );
  io.observe(sentinel);
  return () => {
    io.disconnect();
    sentinel.remove();
    el.removeAttribute('data-stuck');
  };
}

export interface MountScrollspyOptions {
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
export function mountScrollspy(nav: HTMLElement, o: MountScrollspyOptions = {}): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).filter((a) => a.hash.length > 1);
  const target = (a: HTMLAnchorElement) => {
    try {
      return document.getElementById(decodeURIComponent(a.hash.slice(1)));
    } catch {
      return null;
    }
  };
  const unheight = mountHeightVar(nav, '--nish-sticky-extra');
  let current: HTMLAnchorElement | null = null;

  const edges = () => {
    const max = nav.scrollWidth - nav.clientWidth;
    nav.dataset.atStart = String(nav.scrollLeft <= 1);
    nav.dataset.atEnd = String(max <= 1 || nav.scrollLeft >= max - 1);
  };
  const reveal = (a: HTMLAnchorElement) => {
    const left = a.offsetLeft - nav.offsetLeft;
    const view = nav.clientWidth;
    if (left < nav.scrollLeft + 24) nav.scrollLeft = Math.max(0, left - 24);
    else if (left + a.offsetWidth > nav.scrollLeft + view - 24) nav.scrollLeft = left + a.offsetWidth - view + 24;
  };
  const activate = (a: HTMLAnchorElement | null) => {
    if (a === current) return;
    current?.removeAttribute('aria-current');
    current = a;
    if (a) {
      a.setAttribute('aria-current', 'true');
      reveal(a);
    }
  };
  const update = () => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nish-header-h')) || 0;
    const line = o.offset ?? header + nav.offsetHeight + 8;
    let found: HTMLAnchorElement | null = links[0] ?? null;
    for (const a of links) {
      const t = target(a);
      if (t && t.getBoundingClientRect().top <= line + 1) found = a;
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
  const onClick = (e: MouseEvent) => {
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (a && links.includes(a)) activate(a);
  };
  edges();
  update();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  nav.addEventListener('scroll', edges, { passive: true });
  nav.addEventListener('click', onClick);
  let ro: ResizeObserver | undefined;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      edges();
      schedule();
    });
    ro.observe(nav);
  }
  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    nav.removeEventListener('scroll', edges);
    nav.removeEventListener('click', onClick);
    ro?.disconnect();
    unheight();
    current?.removeAttribute('aria-current');
    delete nav.dataset.atStart;
    delete nav.dataset.atEnd;
  };
}

/** Persist a checklist: the `input[type=checkbox]` inside each `li[data-id]` of `list` is
 *  saved to localStorage under `list.dataset.store` (a JSON array of checked ids) and
 *  restored now. Updates the `.nish-checklist-progress` element before the list (or the
 *  first one in its parent) to "{done} of {total}" and its `--p` meter. Without
 *  `data-store` it still counts. Storage failures are ignored. Returns a function that
 *  removes the listener. */
export function mountChecklist(list: HTMLElement): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const key = list.dataset.store ? `nish-checklist:${list.dataset.store}` : null;
  const boxes = () => Array.from(list.querySelectorAll<HTMLInputElement>('li[data-id] input[type="checkbox"]'));
  const idOf = (b: HTMLInputElement) => b.closest<HTMLElement>('li[data-id]')?.dataset.id ?? '';
  let progress: Element | null = null;
  for (let sib = list.previousElementSibling; sib; sib = sib.previousElementSibling) {
    if (sib.classList.contains('nish-checklist-progress')) {
      progress = sib;
      break;
    }
  }
  progress ??= list.parentElement?.querySelector('.nish-checklist-progress') ?? null;

  if (key) {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
      if (Array.isArray(saved)) for (const b of boxes()) b.checked = saved.includes(idOf(b));
    } catch {
      /* storage blocked or corrupt: start unchecked */
    }
  }
  const render = () => {
    const all = boxes();
    const done = all.filter((b) => b.checked).length;
    if (progress) {
      progress.textContent = `${done} of ${all.length}`;
      (progress as HTMLElement).style.setProperty('--p', `${all.length ? (done / all.length) * 100 : 0}%`);
    }
  };
  const onChange = (e: Event) => {
    if (!(e.target instanceof HTMLInputElement) || e.target.type !== 'checkbox') return;
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(boxes().filter((b) => b.checked).map(idOf)));
      } catch {
        /* storage blocked: the state lasts for this page view */
      }
    }
    render();
  };
  render();
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

/** For pages without a framework: apply now and start syncing. */
export function initTheme(): ThemeName {
  watch();
  return applyTheme();
}
