import { ClassValue } from 'clsx';
import * as react from 'react';
import { ReactNode, useLayoutEffect, HTMLAttributes, Ref, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, FieldsetHTMLAttributes, ChangeEvent, MouseEvent, TextareaHTMLAttributes, ComponentPropsWithoutRef, ReactElement, RefObject, ComponentProps, ElementType, ComponentPropsWithRef, SVGProps } from 'react';
export { C as CanvasEdge, a as CanvasEdgeKind, b as CanvasGroup, c as CanvasHue, d as CanvasLabels, e as CanvasLayout, f as CanvasLayoutMode, g as CanvasNode, h as CanvasNodeKind, D as DEFAULT_CANVAS_LABELS, L as LayoutOptions, R as RoutedEdge, S as SystemCanvas, i as SystemCanvasProps, l as layoutSystem, p as pickLayout, r as routeEdges } from './system-canvas-BLuWd69H.js';

/** Conditional Tailwind classes with conflict resolution. */
declare function cn(...inputs: ClassValue[]): string;

/** The version of this copy: injected by the build, `dev` in source. */
declare const VERSION: string;

/** href for user-supplied links: relative URLs, #fragments, http(s), mailto and tel pass;
 *  anything else (javascript:, data:, vbscript:, file:) returns null. Trims leading and trailing
 *  C0 controls and spaces and drops tabs and newlines the way the WHATWG URL parser does, then
 *  reads the scheme from the very string that is returned. Other Unicode whitespace (NBSP, U+FEFF,
 *  U+2028, U+3000) is not stripped by browsers, so it is kept, and a scheme hidden behind it is
 *  not a scheme there either. */
declare function safeUrl(href: string | null | undefined): string | null;

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

interface NishStrings {
    /** Modal, Drawer, SheetHandle, CommandPalette: close button label. */
    close: string;
    /** ConfirmDialog, service-tokens revoke dialog: cancel button. */
    cancel: string;
    /** DropdownMenu: sheet title on phones. */
    menu: string;
    /** DropdownMenu sub-menu header, read by screen readers before the parent label. */
    back: string;
    /** Toast, Callout: dismiss button. */
    dismiss: string;
    /** Callout: badge label for a repeat count. */
    moreCount: (count: number) => string;
    /** CopyButton: idle label. */
    copy: string;
    /** CopyButton: label after copying. */
    copied: string;
    /** AppHeader: hub pill title. */
    hubTitle: string;
    /** AppHeader: hub pill text. */
    hubLabel: string;
    /** AppHeader: overflow kebab. */
    moreActions: string;
    /** BottomNav, MoreSheet, AppShell: the More tab and sheet title. */
    more: string;
    /** ChartLegend, LineChart: legend landmark. */
    legend: string;
    /** Field, FieldGroup: tag for a non-required field. */
    optional: string;
    /** SearchInput, FilterBar, CommandPalette: input placeholder and aria fallback. */
    search: string;
    /** SearchInput: clear button. */
    clearSearch: string;
    /** Chip: remove button without a name. */
    remove: string;
    /** Chip: remove button for a named chip. */
    removeNamed: (name: string) => string;
    /** Combobox, CommandPalette: empty list. */
    noMatches: string;
    /** Combobox, FilterBar, FilterSheet: clear button. */
    clear: string;
    /** Combobox: loading row. */
    searching: string;
    /** CommandPalette: input placeholder. */
    searchPlaceholder: string;
    /** CommandPalette: nothing found. */
    noResults: string;
    /** CommandPalette: listbox label. */
    results: string;
    /** Spinner, Skeleton, SkeletonRows, SkeletonCard, LoadingBar, Progress: announced loading state. */
    loading: string;
    /** ErrorState, AsyncPanel: default message. */
    failedToLoad: string;
    /** ErrorState, ConnectionBanner: retry button. */
    retry: string;
    /** StickyActionBar: landmark label. */
    actions: string;
    /** ConnectionBanner: offline message. */
    offline: string;
    /** ResponsiveTable, AsyncPanel: empty state. */
    nothingHere: string;
    /** ResponsiveTable: skeleton label. */
    loadingNamed: (label: string) => string;
    /** ResponsiveTable: phone sort select label. */
    sortBy: string;
    /** ResponsiveTable: phone sort default option. */
    sortDefault: string;
    /** LineChart, BarChart: empty text. */
    noData: string;
    /** LineChart, BarChart: aria label of an empty chart. */
    noDataNamed: (label: string) => string;
    /** FilterBar, FilterSheet: title. */
    filters: string;
    /** FilterBar: clear all filters. */
    clearFilters: string;
    /** FilterSheet: result button. */
    done: string;
    /** FilterBar: badge aria label. */
    activeCount: (n: number) => string;
    /** Nav badges: aria label. */
    newCount: (value: string | number) => string;
    /** BottomNav, NavRail, SectionNav: landmark. */
    sections: string;
    /** MoreSheet: theme row. */
    theme: string;
    /** NavRail: sidebar landmark. */
    sidebar: string;
    /** NavRail: expand button. */
    expandSidebar: string;
    /** NavRail: collapse button. */
    collapseSidebar: string;
    /** AppShell: skip link. */
    skipToContent: string;
    /** ThemeToggle: name of the system mode. */
    themeSystem: string;
    /** ThemeToggle: name of the light mode. */
    themeLight: string;
    /** ThemeToggle: name of the dark mode. */
    themeDark: string;
    /** ThemeToggle: button label for the current and next mode. */
    themeToggleLabel: (current: string, next: string) => string;
    /** ThemeToggle: preset select aria label. */
    themePreset: string;
    /** ThemeToggle: preset select placeholder. */
    themePresetPlaceholder: string;
    /** AppErrorBoundary: title when a new version is deployed. */
    errorStaleTitle: string;
    /** AppErrorBoundary: body when a new version is deployed. */
    errorStaleBody: string;
    /** AppErrorBoundary: title. */
    errorTitle: string;
    /** AppErrorBoundary: body when the error has no message. */
    errorBody: string;
    /** AppErrorBoundary: stack summary. */
    errorDetails: string;
    /** AppErrorBoundary: reset button. */
    errorTryAgain: string;
    /** AppErrorBoundary: reload button. */
    errorReload: string;
    /** useSaveStatus, SettingRow: saving. */
    saving: string;
    /** useSaveStatus, SettingRow: saved. */
    saved: string;
    /** useSaveStatus, SettingRow: failed with no message. */
    saveFailed: string;
    /** NumberField: validation message. */
    enterNumber: string;
    /** SplitDividers: column divider label. */
    resizeColumns: string;
    /** SplitDividers: row divider label. */
    resizeRows: string;
    /** LayoutPresetPicker: group label. */
    layoutPresets: string;
    /** MediaRow: live badge. */
    live: string;
    /** MediaRow: offline badge. */
    offlineBadge: string;
    /** FlowSteps: group label. */
    progress: string;
    /** WorkflowBoard: group label. */
    workflow: string;
    /** ActivityFeed: group label. */
    activity: string;
    /** WorkflowBoard: catch-all column. */
    other: string;
    /** WorkflowBoard: waiting column. */
    waiting: string;
    /** ActivityFeed: empty text. */
    noActivity: string;
    /** SystemCanvas: region label. */
    systemMap: string;
    /** SystemCanvas: zoom out button. */
    zoomOut: string;
    /** SystemCanvas: zoom in button. */
    zoomIn: string;
    /** SystemCanvas: fit button. */
    fitToScreen: string;
    /** SystemCanvas: follow button. */
    followActivity: string;
    /** SystemCanvas legend: menu label. */
    canvasLines: string;
    /** ServiceTokens: title. */
    serviceTokens: string;
    /** ServiceTokens: intro text. */
    serviceTokensIntro: string;
    /** ServiceTokens: loading label. */
    loadingServiceTokens: string;
    /** ServiceTokens: revoke button and confirm label. */
    tokenRevoke: string;
    /** ServiceTokens: revoked tag. */
    tokenRevoked: string;
    /** ServiceTokens: revoked tag title with a time. */
    tokenRevokedAt: (when: string) => string;
    /** ServiceTokens: revoke button aria label. */
    tokenRevokeNamed: (name: string) => string;
    /** ServiceTokens: confirm dialog title. */
    tokenRevokeTitle: (name: string) => string;
    /** ServiceTokens: revoke failure with no message. */
    tokenRevokeFailed: string;
    /** Inbox: mark-handled action. */
    inboxMarkHandled: string;
    /** Inbox: snooze action. */
    inboxSnooze: string;
    /** Inbox: row actions menu. */
    inboxActions: string;
    /** Inbox: tab list label. */
    inboxViews: string;
    /** Inbox: Open tab. */
    inboxOpen: string;
    /** Inbox: Snoozed tab. */
    inboxSnoozed: string;
    /** Inbox: Handled tab. */
    inboxHandled: string;
    /** Inbox: source chip group label. */
    inboxFilterBySource: string;
    /** Inbox: repeat count aria label. */
    inboxHappened: (count: number) => string;
    /** Pagination: previous button. */
    previousPage: string;
    /** Pagination: next button. */
    nextPage: string;
    /** Pagination: page button aria label. */
    pageLabel: (n: number) => string;
    /** Pagination: nav landmark. */
    paginationLabel: string;
    /** Breadcrumbs: nav landmark. */
    breadcrumbs: string;
    /** TagInput: remove button aria label. */
    removeTag: (tag: string) => string;
    /** FileDropzone: drop area text. */
    dropzoneLabel: string;
    /** FileDropzone: browse button. */
    browseFiles: string;
    /** FileDropzone: remove button aria label. */
    removeFile: (name: string) => string;
    /** Avatar: fallback image label. */
    avatar: string;
    /** AvatarGroup: overflow badge aria label. */
    avatarMore: (count: number) => string;
    /** Slider: minimum thumb label on a range. */
    sliderMin: string;
    /** Slider: maximum thumb label on a range. */
    sliderMax: string;
    /** Accordion: group label. */
    accordion: string;
    /** Progress: label of an indeterminate bar. */
    progressIndeterminate: string;
}
declare const DEFAULT_STRINGS: NishStrings;

/** Theme switching shared by every nish.software page.
 *
 *  The choice ('system' or a theme name) lives in a `nish-theme` cookie on
 *  `.nish.software`, so picking dark on one subdomain applies on all of them. Another
 *  site shares it across its own subdomains with <html data-nish-domain="example.com">.
 *  Anywhere else (localhost, Electron, a host outside that domain) it falls back to
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
type Listener = (choice: ThemeChoice, theme: ThemeName) => void;
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
    /** Replace the label sentence: `themeToggleLabel(current, next)`. Defaults to DEFAULT_STRINGS. */
    strings?: Partial<Pick<NishStrings, 'themeToggleLabel'>>;
    /** The words after a preset saved on another site: "Theme: Mocha (set on another site). …".
     *  Default "set on another site". */
    elsewhereLabel?: string;
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
     *  it hides the toast. An href goes through safeUrl(): a javascript: or data: URL
     *  drops the action. */
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    /** Accessible name of the dismiss button. Default DEFAULT_STRINGS.dismiss ("Dismiss"). */
    dismissLabel?: string;
    /** Strings for this toast (another language): `dismiss`. `dismissLabel` wins when both are given. */
    strings?: Partial<Pick<NishStrings, 'dismiss'>>;
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
    /** The cancel button's label. Default DEFAULT_STRINGS.cancel ("Cancel"). */
    cancelLabel?: string;
    /** Strings for this dialog (another language): `cancel`. `cancelLabel` wins when both are given. */
    strings?: Partial<Pick<NishStrings, 'cancel'>>;
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
    /** Publish the nav's height as `--nish-sticky-extra`. Default true; a non-sticky nav passes
     *  false so it does not touch a value another sticky nav publishes. */
    height?: boolean;
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

/** Sets the locale every formatter uses when it is not given one. Default 'en-US'. */
declare function setDefaultLocale(locale: string): void;
/** The locale formatters use when not given one. */
declare function getDefaultLocale(): string;
/** Options every formatter accepts. */
interface LocaleOptions {
    /** BCP 47 tag, e.g. 'de-DE'. Default getDefaultLocale() ('en-US'). */
    locale?: string;
}
/** Options for the date formatters. */
interface DateOptions extends LocaleOptions {
    /** IANA zone such as 'UTC'. Default the viewer's zone. A bare YYYY-MM-DD string is a calendar day and ignores it. */
    timeZone?: string;
}
interface AgoOptions extends LocaleOptions {
    now?: number;
    style?: 'short' | 'long';
}

interface NishConfig {
    strings: NishStrings;
    locale?: string;
    dir?: 'ltr' | 'rtl';
    /** Where Portal renders. Default document.body. */
    portalContainer?: HTMLElement | null;
}
interface NishProviderProps {
    strings?: Partial<NishStrings>;
    locale?: string;
    dir?: 'ltr' | 'rtl';
    portalContainer?: HTMLElement | null;
    children: ReactNode;
}
/** Sets strings, locale, direction and the portal container once for everything below it.
 *  Nests: an inner provider overrides the outer one key by key. */
declare function NishProvider({ strings, locale, dir, portalContainer, children }: NishProviderProps): react.JSX.Element;
/** The current config; English defaults without a provider. */
declare function useNishConfig(): NishConfig;
/** The current strings; English defaults without a provider. */
declare function useNishStrings(): NishStrings;

interface PortalProps {
    children: ReactNode;
    /** Target element. Default: the provider's portalContainer, then document.body. */
    container?: HTMLElement | null;
}
/** Renders children into `container`. Null on the server and in the first client render, so
 *  hydration matches; the portal mounts right after. */
declare function Portal({ children, container }: PortalProps): react.ReactPortal | null;

/** False on the server and in the first client render, true afterwards (no hydration mismatch). */
declare function useIsClient(): boolean;
/** useLayoutEffect in the browser, useEffect on the server (no SSR warning). */
declare const useIsoLayoutEffect: typeof useLayoutEffect;
/** True when the element is laid out right-to-left. False on the server or without an element. */
declare function isRtl(el: Element | null | undefined): boolean;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'subtle' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
interface ButtonClassOptions {
    /** Same variants as Button. Default "secondary". */
    variant?: ButtonVariant;
    /** Same sizes as Button. Default "md". */
    size?: ButtonSize;
    /** Link variant only: skip the 44px touch hit area, for a link inside running text. */
    inline?: boolean;
    /** Extra classes, merged last (tailwind-merge resolves conflicts). */
    className?: string;
}
/** The classes `<Button>` renders, minus its `disabled:` styles. Use it on `<a>`, router
 *  `<Link>`s and `<a download>` so links that look like buttons match them exactly. */
declare function buttonClass({ variant, size, inline, className }?: ButtonClassOptions): string;
interface LinkClassOptions {
    /** accent: the accent color (default). muted: grey text that lights up on hover. */
    tone?: 'accent' | 'muted';
    /** Skip the 44px touch hit area, for a link inside running text. */
    inline?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes for a text link on a router `<Link>` or `<a>`: tone, underline on hover
 *  and, on touch screens, a 44px hit area that does not move the layout. */
declare function linkClass({ tone, inline, className }?: LinkClassOptions): string;
/** Classes that hide a row action until its row is hovered or focused, and always show
 *  it on touch screens (there is no hover). Put `group` on the row. */
declare function revealClass(className?: string): string;
type IconButtonSize = '2xs' | 'xs' | 'sm' | 'md';
type IconButtonVariant = 'ghost' | 'subtle' | 'soft';
interface IconButtonClassOptions {
    /** Same sizes as IconButton. Default "md". */
    size?: IconButtonSize;
    /** Same variants as IconButton. Default "ghost". */
    variant?: IconButtonVariant;
    /** Same tones as IconButton. Default "neutral". */
    tone?: 'neutral' | 'danger';
    /** The pressed look (IconButton also sets aria-pressed; set it yourself on a link). */
    active?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<IconButton>` renders. Use it on an icon-only `<a>` or router `<Link>`,
 *  and give that element an aria-label. */
declare function iconButtonClass({ size, variant, tone, active, className, }?: IconButtonClassOptions): string;
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li';
interface CardClassOptions {
    /** Inner padding. Default "md". */
    padding?: CardPadding;
    /** Kept from v0.2: false is the same as padding="none". */
    padded?: boolean;
    /** Hover styles for cards that are links or buttons. */
    interactive?: boolean;
    /** surface: the bordered panel (default). inset: a quiet elevated box for use inside
     *  another card. */
    variant?: 'surface' | 'inset';
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<Card>` renders. Use it on a router `<Link>` or `<a>` that is a whole
 *  card: `<Link className={cardClass({ interactive: true })}>`. */
declare function cardClass({ padding, padded, interactive, variant, className }?: CardClassOptions): string;
type BadgeTone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info' | 'on-accent';
type BadgeHue = 'emerald' | 'indigo' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';
interface BadgeClassOptions {
    /** Same tones as Badge. Default "neutral". */
    tone?: BadgeTone;
    /** Same hues as Badge; overrides tone. */
    hue?: BadgeHue;
    /** Same sizes as Badge. Default "sm". */
    size?: 'xs' | 'sm';
    /** Same variants as Badge. Default "pill". */
    variant?: 'pill' | 'tag';
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<Badge>` renders (without the dot), for a badge-shaped link or a
 *  label inside a third-party renderer. */
declare function badgeClass({ tone, hue, size, variant, className }?: BadgeClassOptions): string;
type FieldSize = 'xs' | 'sm' | 'md';
interface FieldClassOptions {
    /** md h-9 (default), sm h-8, xs h-7. All grow to 44px on touch screens. */
    size?: FieldSize;
    /** The red invalid border, for elements that do not set aria-invalid themselves. */
    invalid?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<Input>` renders: the shared field look at a size. Use it for a one-off
 *  control (a date input, a contenteditable) instead of copying a class string. */
declare function fieldClass({ size, invalid, className }?: FieldClassOptions): string;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** The button element. */
    ref?: Ref<HTMLButtonElement>;
    /** primary: the one main action in a view. secondary: everything else. ghost:
     *  toolbars and quiet actions. danger: destructive actions. soft: an accent action
     *  that is not the main one (replaces "accent outline" buttons). subtle: a filled,
     *  quiet button for dense toolbars and chips on a surface. link: looks like a text
     *  link and sits inline in text (no height or padding; on touch screens an invisible
     *  44px hit area, unless `inline`). */
    variant?: ButtonVariant;
    /** xs for dense tool rows (24px), sm for dense rows and toolbars, lg for a page's
     *  main call to action. xs, sm and md grow to 44px on touch screens. */
    size?: ButtonSize;
    /** Link variant only: skip the 44px touch hit area, for a link inside running text. */
    inline?: boolean;
    /** Shows a spinner, disables the button and sets aria-busy. */
    loading?: boolean;
    /** Icon before the label (16px for md and lg, 12–14px for xs and sm). Replaced by the
     *  spinner while loading. */
    icon?: ReactNode;
}
/** The standard button. Defaults to type="button", so it never submits a form by
 *  accident; pass type="submit" for the one that should. */
declare function Button({ variant, size, inline, loading, icon, className, children, disabled, type, ref, ...rest }: ButtonProps): react.JSX.Element;
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** The button element. */
    ref?: Ref<HTMLButtonElement>;
    /** Required: an icon-only button needs a name for screen readers and tooltips. It is
     *  also the title, so tests that query by title keep working. */
    label: string;
    /** 2xs: 20px (row-level reveal actions, 22px widget title bars; under a mouse its hit
     *  area is 24px), xs: 24px (dense headers), sm: 28px, md: 36px. All grow to 44px on
     *  touch screens. */
    size?: IconButtonSize;
    /** Pressed state for toggles (sets aria-pressed). */
    active?: boolean;
    /** ghost: no fill until hover (default). subtle: a quiet filled square for toolbars on
     *  a surface. soft: an accent tint for the highlighted action. */
    variant?: IconButtonVariant;
    /** danger: hover and pressed turn loss-red, for delete and remove actions. (Button's
     *  destructive look is `variant="danger"`; an icon button keeps the tone.) */
    tone?: 'neutral' | 'danger';
}
/** A square button holding only an icon, with its label as aria-label and title. */
declare function IconButton({ label, size, active, variant, tone, className, children, type, disabled, ref, ...rest }: IconButtonProps): react.JSX.Element;
interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** The header row element. */
    ref?: Ref<HTMLDivElement>;
    /** The card's heading. */
    title: ReactNode;
    /** A quieter line under the title. */
    description?: ReactNode;
    /** End-aligned slot (right in left-to-right layouts): a Button, an IconButton, a Badge,
     *  a Segmented. It wraps under the title on narrow cards. */
    action?: ReactNode;
    /** A small icon before the title (16px). */
    icon?: ReactNode;
    /** The heading level. Default "h2". */
    as?: 'h2' | 'h3' | 'h4';
    /** A bottom border and its own padding (px-4 py-3), for unpadded cards whose content
     *  runs edge to edge (tables, lists, widgets). */
    divided?: boolean;
    /** id for the heading element, so a section can point aria-labelledby at it. */
    titleId?: string;
}
/** The header row of a card: title, optional description and icon, and an action slot. */
declare function CardHeader({ title, description, action, icon, as: Heading, divided, titleId, className, ref, ...rest }: CardHeaderProps): react.JSX.Element;
interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    /** The card element (whatever `as` renders). */
    ref?: Ref<HTMLElement>;
    /** The element to render. Use section or article for a titled region, li inside a list. */
    as?: CardElement;
    /** Inner padding: sm p-3, md p-4 (p-5 from 640px; the default), lg p-6, none for
     *  tables and lists that run edge to edge. Use this, not className="p-3", which would
     *  keep md's sm:p-5. */
    padding?: CardPadding;
    /** Kept from v0.2: false is the same as padding="none". padding wins when both are set. */
    padded?: boolean;
    /** Hover styles for cards that are links or buttons. */
    interactive?: boolean;
    /** surface: the bordered panel with the card shadow (default). inset: bg-th-elevated,
     *  no border color, no shadow and rounded-lg, for a box inside another card. */
    variant?: 'surface' | 'inset';
    /** Renders a CardHeader first. On an unpadded card the header is divided (its own
     *  padding and a bottom border). */
    title?: ReactNode;
    /** The header's description; only with title. */
    description?: ReactNode;
    /** The header's end-aligned action slot; only with title. */
    action?: ReactNode;
}
/** The surface panel every widget, table and form sits in. */
declare function Card({ as, padding, padded, interactive, variant, title, description, action, className, children, ref, ...rest }: CardProps): react.JSX.Element;
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** The badge element. */
    ref?: Ref<HTMLSpanElement>;
    /** Text on its own soft tint; every tone clears 4.5:1 in every theme. on-accent: a
     *  small label inside a solid accent fill (a primary Button, an accent link), in the
     *  on-accent color over a 20% on-accent tint. It has no hover state; pair a short
     *  label with sr-only text that says what it means. */
    tone?: BadgeTone;
    /** A color with no meaning (stores, categories, tags): the hue's soft tint with hi
     *  text, so it reads in every theme. Overrides tone. */
    hue?: BadgeHue;
    /** sm: the default 12px pill. xs: 10px text for dense rows and table cells. */
    size?: 'xs' | 'sm';
    /** pill: rounded (default). tag: square corners, no border, bold uppercase, for
     *  tag-shaped labels ("CALL", "NEW"). */
    variant?: 'pill' | 'tag';
    /** A leading 6px status dot in the tone's fill (or the hue). Pair it with text that
     *  says the state; the dot itself is hidden from screen readers. */
    dot?: boolean;
}
/** A small status pill: counts, states, tags. */
declare function Badge({ tone, hue, size, variant, dot, className, children, ref, ...rest }: BadgeProps): react.JSX.Element;
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** The input element (not the wrapper, when there are slots). */
    ref?: Ref<HTMLInputElement>;
    /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby. */
    invalid?: boolean;
    /** md h-9 (default), sm h-8 with 12px text, xs h-7 with 11px text. Touch screens
     *  always get 16px text and a 44px height. (Replaces the native size attribute; set a width with
     *  className instead.) */
    size?: FieldSize;
    /** A decorative slot inside the start edge (left in left-to-right layouts): a search
     *  icon, a "$" prefix. It ignores pointer events, so clicks reach the input. */
    leading?: ReactNode;
    /** A slot inside the end edge that may be interactive: a clear IconButton, a unit
     *  suffix. */
    trailing?: ReactNode;
    /** Classes for the wrapper span that holds the slots (only rendered with leading or
     *  trailing). className stays on the input. */
    wrapperClassName?: string;
}
/** Text input. 16px text on touch screens so iOS does not zoom the page on focus. `rest`
 *  lands on the input, also when the slots add a wrapper. */
declare function Input({ invalid, size, leading, trailing, wrapperClassName, className, ref, ...rest }: InputProps): react.JSX.Element;
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    /** The select element (not the wrapper). */
    ref?: Ref<HTMLSelectElement>;
    /** Red border and aria-invalid. */
    invalid?: boolean;
    /** md h-9 (default), sm h-8, xs h-7, the same as Input. Touch screens get 16px text
     *  and a 44px height. (Replaces the native size attribute, which turns a select into a list box.) */
    size?: FieldSize;
    /** Classes for the inner <select> itself. className sizes the wrapper (width, margin);
     *  use this instead of reaching in with [&>select]:… */
    selectClassName?: string;
}
/** Native select (keeps the platform picker on phones) with the shared field look. The
 *  wrapper span takes `className`; `rest` and `ref` go to the select, so `name`,
 *  `value` and `onChange` work as on a native select. */
declare function Select({ invalid, size, selectClassName, className, children, ref, ...rest }: SelectProps): react.JSX.Element;
interface LabelProps extends HTMLAttributes<HTMLSpanElement> {
    /** The span element. */
    ref?: Ref<HTMLSpanElement>;
}
/** Small uppercase label for form fields and section headings. */
declare function Label({ className, ref, ...rest }: LabelProps): react.JSX.Element;

type ChipVariant = 'toggle' | 'suggestion' | 'tag';
interface ChipClassOptions {
    /** The pressed (on) look of a toggle chip: the accent tint. On a link, set
     *  aria-current="page" for the active one (links take aria-current, not aria-pressed). */
    pressed?: boolean;
    /** Same variants as Chip. Default "toggle". */
    variant?: ChipVariant;
    /** md: 32px (default), sm: 28px. Both reach 44px on touch screens. */
    size?: 'sm' | 'md';
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<Chip>` renders, for router links and anchors that look like chips:
 *  `<Link className={chipClass({ pressed: active })} aria-current={active ? 'page' : undefined}>`.
 *  Mirrors .nish-chip in nish-components.css. */
declare function chipClass({ pressed, variant, size, className }?: ChipClassOptions): string;
type SegmentedTone = 'accent' | 'warn' | 'loss';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** The textarea element. */
    ref?: Ref<HTMLTextAreaElement>;
    /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby
     *  (Field does both for you). */
    invalid?: boolean;
    /** md: the standard field. sm: tighter padding and 12px text under a mouse, for dense
     *  panels. Touch screens always get 16px text so iOS does not zoom. */
    size?: 'sm' | 'md';
    /** Grow with the content instead of scrolling (chat composers, notes). `true` grows
     *  without limit; `{ maxRows }` stops growing and scrolls past that many lines. `rows`
     *  stays the minimum height. Turns off the manual resize handle. */
    autoGrow?: boolean | {
        maxRows: number;
    };
}
/** Multi-line text with the shared field look. 16px text on touch screens (no iOS zoom); the
 *  reader can resize it vertically, or it grows with its content when autoGrow is set. */
declare function Textarea({ ref, invalid, size, autoGrow, className, rows, value, onInput, ...rest }: TextareaProps): react.JSX.Element;
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    /** The checkbox input. */
    ref?: Ref<HTMLInputElement>;
    /** Text beside the box; clicking it toggles the box. Optional when the box has an
     *  aria-label instead (a table row's select box). */
    label?: ReactNode;
    /** A quieter line under the label. It describes the box (aria-describedby) and is not
     *  part of its name. */
    hint?: ReactNode;
    /** The "some but not all" state of a select-all box. Set through the DOM property, so
     *  screen readers announce it as mixed. Clicking still toggles `checked`. */
    indeterminate?: boolean;
    /** A right-aligned slot on the same row (a price, a count). The row then fills its
     *  container's width. Described by, not part of, the box's name. */
    trailing?: ReactNode;
    /** md: 16px box, 14px text. sm: 14px box, 12px text for dense lists. The row is the
     *  44px tap target on touch screens either way. */
    size?: 'sm' | 'md';
    /** Red border and aria-invalid. Field sets it for you. */
    invalid?: boolean;
}
/** A checkbox with its label. The box is drawn from theme roles (its unchecked border
 *  reads in light themes too), and the whole row is the 44px tap target on touch. Props
 *  other than `className` go to the `<input>` (name, checked, onChange, form). */
declare function Checkbox({ ref, label, hint, indeterminate, trailing, size, invalid, className, id, disabled, onChange, ...rest }: CheckboxProps): react.JSX.Element;
interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'type' | 'value' | 'defaultValue' | 'name' | 'form'> {
    /** The switch button. */
    ref?: Ref<HTMLButtonElement>;
    /** On or off, when you keep the state yourself. Leave it out and use `defaultChecked`
     *  for an uncontrolled switch. */
    checked?: boolean;
    /** The starting state of an uncontrolled switch (no `checked`). */
    defaultChecked?: boolean;
    /** Called with the new value and the click event when the switch is clicked or toggled
     *  with Space/Enter. Kept for 2.x; prefer onCheckedChange. */
    onChange?: (checked: boolean, event: MouseEvent<HTMLButtonElement>) => void;
    /** Called with the new value. The form-library friendly callback: use it with
     *  react-hook-form's Controller (`onCheckedChange={field.onChange}`). */
    onCheckedChange?: (checked: boolean) => void;
    /** Field name for a native form. With it, a hidden checkbox mirrors the state, so
     *  FormData and `<form action>` carry the value. */
    name?: string;
    /** The submitted value while on. Default "on", like a native checkbox. */
    value?: string;
    /** Marks the control required (aria-required, and the hidden checkbox blocks submit). */
    required?: boolean;
    /** The id of the `<form>` the hidden checkbox belongs to, when it is not an ancestor. */
    form?: string;
    /** Visible label, linked to the switch by aria-labelledby. Clicking it toggles too.
     *  Without one, pass aria-label or aria-labelledby. */
    label?: ReactNode;
    /** A quieter line under the label, linked by aria-describedby. */
    description?: ReactNode;
    /** md: 36×20 track. sm: 28×16 for dense settings lists. Both get a 44px tap target on
     *  touch screens. */
    size?: 'sm' | 'md';
    /** The label and description sit before the switch (a settings row, default) or
     *  after it. */
    labelSide?: 'start' | 'end';
}
/** An on/off switch that takes effect immediately (a setting, not a form choice that
 *  waits for Save; use Checkbox for that). A `<button role="switch" aria-checked>`; with a
 *  `name` it also posts in native forms. `ref` and the remaining props go to the button;
 *  `className` goes to the row (or to the button when there is no label). */
declare function Switch({ ref, checked: checkedProp, defaultChecked, onChange, onCheckedChange, name, value, required, form, label, description, size, labelSide, disabled, className, id, onClick, ...rest }: SwitchProps): react.JSX.Element;
interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** The wrapper element. */
    ref?: Ref<HTMLDivElement>;
    /** The visible label, in sentence case ("Email address"). Rendered as a real <label>
     *  tied to the control. */
    label: ReactNode;
    /** Help text under the control, tied by aria-describedby. Hidden while an error shows. */
    hint?: ReactNode;
    /** Error message under the control, announced (role="alert") and tied by
     *  aria-describedby. Also sets aria-invalid on the control. */
    error?: ReactNode;
    /** Shows a quiet "Optional" tag after the label. */
    optional?: boolean;
    /** Marks the control required: `required` and `aria-required` on it, and a "*" after
     *  the label (hidden from screen readers, which hear "required" from the control). */
    required?: boolean;
    /** The control's id. Leave it out and Field gives the control one (or uses the id the
     *  control already has). */
    htmlFor?: string;
    /** stack: label above the control (forms). inline: a small label to the left, for
     *  settings panels and filters. */
    layout?: 'stack' | 'inline';
    /** Width of the label column in the inline layout. Any CSS length; default 7rem. */
    labelWidth?: string;
    /** One control: Input, Select, Textarea, SearchInput, Checkbox, Switch, Combobox,
     *  Segmented or a native element. */
    children: ReactNode;
}
/** A labelled form row: label, one control, and its hint or error, all wired up for
 *  screen readers (id, aria-describedby, aria-invalid, aria-required). */
declare function Field({ ref, label, hint, error, optional, required, htmlFor, layout, labelWidth, children, className, style, ...rest }: FieldProps): react.JSX.Element;
interface FieldGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
    /** The fieldset element. */
    ref?: Ref<HTMLFieldSetElement>;
    /** The group's visible name, in sentence case ("Work mode"). Rendered as the
     *  fieldset's <legend>, styled like Field's stack label. */
    label: ReactNode;
    /** Help text under the controls, tied to the fieldset by aria-describedby. Hidden
     *  while an error shows. */
    hint?: ReactNode;
    /** Error message under the controls, announced (role="alert") and tied by
     *  aria-describedby. */
    error?: ReactNode;
    /** Shows a quiet "Optional" tag after the label. */
    optional?: boolean;
    /** Several controls: a ChipGroup, a city and state pair, a column of Checkboxes. */
    children: ReactNode;
}
/** Field for a group of controls: a <fieldset> whose <legend> looks like Field's label,
 *  with the hint or error tied to the whole group. Use Field when there is exactly one
 *  control to label. */
declare function FieldGroup({ ref, label, hint, error, optional, className, children, ...rest }: FieldGroupProps): react.JSX.Element;
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size' | 'type'> {
    /** The `<input>` element. */
    ref?: Ref<HTMLInputElement>;
    /** The query, when you keep it yourself. Leave it out for an uncontrolled field. */
    value?: string;
    /** The starting query of an uncontrolled field. */
    defaultValue?: string;
    /** Called with the new query on typing, on Clear and on Escape. */
    onChange?: (value: string, event?: ChangeEvent<HTMLInputElement>) => void;
    /** Also called after Clear or Escape empties the field (e.g. to reset results). */
    onClear?: () => void;
    /** md: 36px, sm: 32px, xs: 28px (dense toolbars). All 44px with 16px text on touch screens. */
    size?: 'xs' | 'sm' | 'md';
    /** field: the standard bordered field. bare: no border or fill, for a search bar
     *  inside a header that already draws the box. The focus ring stays. */
    variant?: 'field' | 'bare';
    /** Names the field when there is no visible label: "Search jobs". */
    'aria-label'?: string;
    /** Class for the wrapper (width, margins). */
    className?: string;
    /** Class for the <input> itself. */
    inputClassName?: string;
    /** Accessible name of the Clear button. Default from NishProvider strings ("Clear search"). */
    clearLabel?: string;
}
/** A search field: leading search icon, a Clear button while it has a value, and
 *  Escape to clear. type="search" with the Search key on phone keyboards. `ref` and the
 *  remaining props go to the `<input>`; `className` goes to the wrapper. */
declare function SearchInput({ ref, value: valueProp, defaultValue, onChange, onClear, size, variant, className, inputClassName, onKeyDown, placeholder, clearLabel, disabled, ...rest }: SearchInputProps): react.JSX.Element;
interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** The chip's button. For `variant="tag"` the chip is a `<span>` and this ref (and the
     *  remaining props) go to that span. */
    ref?: Ref<HTMLButtonElement>;
    /** toggle: an on/off filter (`aria-pressed`). suggestion: a dashed "+ add this" chip.
     *  tag: a static label (a <span>) with an optional remove button. */
    variant?: ChipVariant;
    /** Toggle chips only: whether the filter is on. Sets aria-pressed. */
    pressed?: boolean;
    /** Tag chips only: shows a remove button that calls this. */
    onRemove?: () => void;
    /** Accessible name of the remove button. Default "Remove <children>" when the chip's
     *  text is a plain string, else "Remove" (from NishProvider strings). */
    removeLabel?: string;
    /** Leading icon (14px for sm, 16px for md). Suggestion chips show "+" when unset. */
    icon?: ReactNode;
    /** Trailing content inside the chip: a count, a caret. */
    trailing?: ReactNode;
    /** md: 32px, sm: 28px. Both reach 44px on touch screens. */
    size?: 'sm' | 'md';
}
/** A compact pill for multi-select filters (toggle), quick suggestions and removable
 *  tags. For one choice among several, use Segmented instead. */
declare function Chip({ ref, variant, pressed, onRemove, removeLabel, icon, trailing, size, className, children, type, ...rest }: ChipProps): react.JSX.Element;
interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
    /** The wrapper element. */
    ref?: Ref<HTMLDivElement>;
    /** Names the group for screen readers: "Filter by status". */
    label: string;
    /** On phones, one row that scrolls sideways instead of wrapping. */
    scroll?: boolean;
    children: ReactNode;
}
/** A labelled row of Chips (role="group"). Wraps by default. The arrow keys move focus
 *  between the chips (mirrored in a right-to-left layout); each chip stays a Tab stop. */
declare function ChipGroup({ ref, label, scroll, className, children, onKeyDown, ...rest }: ChipGroupProps): react.JSX.Element;

type TabsVariant = 'underline' | 'pill';
type TabsSize = 'xs' | 'sm' | 'md';
/** The look of one tab, for router links that act as tabs:
 *  `<NavLink className={({ isActive }) => tabClass({ active: isActive })}>`. Router links
 *  are navigation, not ARIA tabs: they take aria-current="page", not role="tab". */
declare function tabClass(o: {
    /** The selected (or current-page) look. */
    active: boolean;
    /** underline (default) or pill. */
    variant?: TabsVariant;
    /** md (default), sm or xs, the same as Tabs. */
    size?: TabsSize;
    /** Equal-width tab that fills its share of the row (Tabs block). */
    block?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}): string;

/** The breakpoint from which responsive tabs show every panel at once. */
type TabsBreakpoint = 'md' | 'lg';
interface TabItem {
    value: string;
    label: ReactNode;
    /** A count after the label (unread, results), shown as a small Badge. */
    count?: number;
    /** A quieter second line under the label ("$12 · 3h"). */
    sub?: ReactNode;
    /** Shown but not selectable; the arrow keys skip it. */
    disabled?: boolean;
}
interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children' | 'defaultValue'> {
    /** The selected tab's value (controlled). Omit it, with `defaultValue`, for an uncontrolled Tabs. */
    value?: string;
    /** The first selected tab of an uncontrolled Tabs. Default: the first enabled tab. */
    defaultValue?: string;
    /** Called with the new value on click and on arrow keys (selection follows focus). */
    onValueChange?: (value: string) => void;
    /** Alias of `onValueChange`, kept for existing code. Both are called when both are given. */
    onChange?: (value: string) => void;
    items: TabItem[];
    /** Names the tab list for screen readers: "Job sections". */
    label: string;
    /** underline: page and card sections (default). pill: a quieter switcher inside a toolbar. */
    variant?: TabsVariant;
    /** md: 14px text (default). sm: 12px for card headers. xs: 11px for dense widget
     *  strips (pill h-6, underline h-7). All 44px on touch screens. */
    size?: TabsSize;
    /** The tab list fills its container and every tab gets an equal share of the width,
     *  like Segmented block. */
    block?: boolean;
    /** Responsive panes: from this breakpoint (md 768px, lg 1024px) the tab list is not
     *  rendered, and TabPanels with the same showFrom render as plain regions side by
     *  side. Below it, the full ARIA tabs pattern applies. */
    hideFrom?: TabsBreakpoint;
    /** Prefix for the tab and panel ids. Needed only when TabPanels render outside this
     *  Tabs: give both the same idBase. */
    idBase?: string;
    /** Set when TabPanels with this idBase render elsewhere, so each tab points at its
     *  panel (aria-controls). Automatic when the panels are this component's children. */
    controlsPanels?: boolean;
    /** TabPanels for the items. They render after the tab list. */
    children?: ReactNode;
    /** Class for the tab list. */
    className?: string;
    /** The tab list element. */
    ref?: Ref<HTMLDivElement>;
}
/** Tabs that switch between panels in place: the full ARIA tabs pattern (tablist, tab
 *  with aria-selected and aria-controls, arrow keys that mirror in right-to-left layouts,
 *  Home and End). Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 *  For links that change the URL, use tabClass() on the router's link instead. */
declare function Tabs({ value: valueProp, defaultValue, onValueChange, onChange, items, label, variant, size, block, hideFrom, idBase, controlsPanels, children, className, ref, onKeyDown, ...rest }: TabsProps): react.JSX.Element | null;
interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
    /** The tab value this panel belongs to. */
    value: string;
    /** Only when the panel renders outside its Tabs: the same idBase as the Tabs. */
    idBase?: string;
    /** Only when the panel renders outside its Tabs: whether its tab is selected. */
    active?: boolean;
    /** Responsive panes: from this breakpoint (md 768px, lg 1024px) the panel always
     *  renders, as a plain region (no role="tabpanel", never hidden). Pair it with the
     *  same hideFrom on Tabs. */
    showFrom?: TabsBreakpoint;
    /** Keep the content mounted (hidden) while the tab is not selected, so state such as
     *  a scroll position or a draft survives switching tabs. */
    keepMounted?: boolean;
    children?: ReactNode;
    ref?: Ref<HTMLDivElement>;
}
/** The content for one tab: role="tabpanel", labelled by its tab, hidden unless its tab
 *  is selected. Render it as a child of Tabs, or pass idBase and active. */
declare function TabPanel({ value, idBase, active, showFrom, keepMounted, children, className, ref, ...rest }: TabPanelProps): react.JSX.Element;

interface SkeletonProps extends ComponentPropsWithoutRef<'div'> {
    /** Size and shape: h-4 w-2/5, size-9 rounded-full, … */
    className?: string;
    /** For sizes known only at runtime, e.g. { height: chartHeight }. */
    style?: ComponentPropsWithoutRef<'div'>['style'];
    ref?: Ref<HTMLDivElement>;
}
/** One shimmer block; size it with width/height classes. Decorative (aria-hidden). */
declare function Skeleton({ className, style, ref, ...rest }: SkeletonProps): react.JSX.Element;
interface SkeletonRowsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** How many rows. Default 5. */
    rows?: number;
    /** Height of each row: pixels or any CSS length. Default 56. */
    height?: number | string;
    /** Space between rows: sm 6px, md 10px (default). */
    gap?: 'sm' | 'md';
    /** Accessible name of the loading region, read out as hidden text. Default "Loading". */
    label?: string;
    /** Classes for the column (padding, margins). */
    className?: string;
    /** Classes for every row, e.g. "h-16" instead of height, or "rounded-lg". */
    rowClassName?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A column of full-width, card-shaped shimmer rows (rounded-xl) while a list or table
 *  loads, announced once (role="status", the label is visually hidden text inside it).
 *  The shimmer stops under reduced motion. For a card body's text lines, use SkeletonLines. */
declare function SkeletonRows({ rows, height, gap, label, className, rowClassName, ref, ...rest }: SkeletonRowsProps): react.JSX.Element;
declare const SPINNER_SIZE: {
    readonly xs: 12;
    readonly sm: 14;
    readonly md: 16;
    readonly lg: 24;
};
interface SpinnerProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
    /** xs 12px, sm 14px, md 16px (default), lg 24px. */
    size?: keyof typeof SPINNER_SIZE;
    /** Announces the spinner (role="status") with this accessible name, e.g.
     *  "Loading jobs", as visually hidden text. Without it the spinner is decorative
     *  (aria-hidden); pair it with visible text or an aria-busy container. */
    label?: string;
    /** Color and spacing. The spinner draws in currentColor. */
    className?: string;
    ref?: Ref<HTMLSpanElement>;
}
/** A spinning loader in the current text color: the one spinner every app uses,
 *  instead of hand-rolled border spinners. */
declare function Spinner({ size, label, className, ref, ...rest }: SpinnerProps): react.JSX.Element;
interface SkeletonLinesProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Body lines under the heading bar. */
    lines?: number;
    className?: string;
    /** Accessible name of the loading region. Default "Loading". */
    label?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A padded stack of shimmer bars: the default loading body for a card or widget, announced
 *  once (role="status"). */
declare function SkeletonLines({ lines, className, label, ref, ...rest }: SkeletonLinesProps): react.JSX.Element;
interface SkeletonCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Text lines under the title bar. Default 3. */
    lines?: number;
    /** A media block above the text: square (96px), wide (16:9) or none (default). */
    media?: 'square' | 'wide' | 'none';
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A card-shaped shimmer for one loading card: optional media, a title bar and text lines. */
declare function SkeletonCard({ lines, media, className, ref, ...rest }: SkeletonCardProps): react.JSX.Element;
interface StatGridSkeletonProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** How many tiles. Default 4. */
    count?: number;
    className?: string;
    /** Accessible name of the loading region. Default "Loading". */
    label?: string;
    ref?: Ref<HTMLDivElement>;
}
/** Shimmer tiles that match a StatGrid (2 columns, 4 from md) while its numbers load. */
declare function StatGridSkeleton({ count, className, label, ref, ...rest }: StatGridSkeletonProps): react.JSX.Element;
interface CardListSkeletonProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** How many cards. Default 3. */
    count?: number;
    /** Text lines in each card. Default 2. */
    lines?: number;
    className?: string;
    /** Accessible name of the loading region. Default "Loading". */
    label?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A stack of shimmer cards while a card list loads, announced once (role="status"). */
declare function CardListSkeleton({ count, lines, className, label, ref, ...rest }: CardListSkeletonProps): react.JSX.Element;
interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
    /** A 28px line icon, shown in the ghost color. */
    icon?: ReactNode;
    /** What is empty, in a few words: "No price drops yet". */
    title: string;
    /** One sentence on why, or what will fill it. */
    detail?: ReactNode;
    /** Usually one small Button that fixes the emptiness. */
    action?: ReactNode;
    /** compact: no border, fills a widget body. Default: dashed box on a page. */
    compact?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** What a list, table or widget shows when there is nothing in it yet. */
declare function EmptyState({ icon, title, detail, action, compact, className, ref, ...rest }: EmptyStateProps): react.JSX.Element;
interface ErrorStateProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** What failed and, when known, what to do about it. Default "Failed to load". */
    message?: ReactNode;
    /** Shows a Retry button when given. */
    onRetry?: () => void;
    /** Text of the Retry button. Default "Retry". */
    retryLabel?: string;
    /** Spinner on the Retry button while the retry runs. */
    retrying?: boolean;
    /** No box: fills a widget body. Default: a tinted box on a page. */
    compact?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A failed load, announced to screen readers (role="alert"), with an optional Retry. */
declare function ErrorState({ message, onRetry, retryLabel, retrying, compact, className, ref, ...rest }: ErrorStateProps): react.JSX.Element;

type ToastTone = 'success' | 'error' | 'warn' | 'info';
/** A button inside a toast, such as Undo. */
interface ToastAction {
    /** The button text: one or two words ("Undo", "View"). */
    label: string;
    /** Runs on click; the toast dismisses itself right after. */
    onClick: () => void;
}
interface ToastOptions {
    /** Optional second line. */
    body?: string;
    /** One text button, e.g. { label: 'Undo', onClick: revert }. Clicking it runs
     *  onClick and then dismisses the toast. */
    action?: ToastAction;
    /** Milliseconds before it dismisses itself, or 'sticky' to stay until dismissed.
     *  Default 4000; errors default to 'sticky'; Infinity means 'sticky'. Sticky toasts and
     *  errors are never pushed out by newer toasts. The timer pauses while the toast is
     *  hovered or holds focus. */
    duration?: number | 'sticky';
    /** A slot name. A new toast with the same id replaces the old one instead of
     *  stacking, so a stale Undo can never revert a newer change. */
    id?: string;
}
interface ToastItem {
    /** Returned by toast(); pass it to dismissToast(). */
    id: number;
    tone: ToastTone;
    title: string;
    /** Optional second line. */
    body?: string;
    /** The toast's one text button, if any. */
    action?: ToastAction;
    /** The slot name from ToastOptions.id, if any. */
    slot?: string;
    /** How long it stays, as given or defaulted. */
    duration: number | 'sticky';
}
/** Remove a toast now, by the id toast() returned. */
declare function dismissToast(id: number): void;
type ToastCall = (title: string, bodyOrOptions?: string | ToastOptions) => number;
/** What toast.promise shows: a sticky toast while the promise is pending, replaced by a
 *  success or an error toast. Each message may be a function of the result or the error. */
interface ToastPromiseMessages<T> {
    loading: string;
    success: string | ((value: T) => string);
    error: string | ((error: unknown) => string);
}
type ToastFn = ToastCall & {
    success: ToastCall;
    error: ToastCall;
    warn: ToastCall;
    info: ToastCall;
    /** Shows the loading message until the promise settles, then swaps it for the success or
     *  error message in the same slot. Returns the promise itself, so a rejection still reaches the caller. */
    promise: <T>(promise: Promise<T>, messages: ToastPromiseMessages<T>) => Promise<T>;
};
/** toast('Saved'), toast.error('Could not save', detail), or
 *  toast.success('Archived', { action: { label: 'Undo', onClick: undo }, id: 'undo' }).
 *  Each call returns the toast's id for dismissToast(). */
declare const toast: ToastFn;
/** Same API as a hook, for code that prefers one. */
declare function useToast(): ToastFn;
interface ToasterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'> {
    /** Extra classes for the stack, e.g. to lift it above a bottom nav: sm:bottom-20. */
    className?: string;
    /** Distance from the bottom of the screen on phones (under 640px, or up to
     *  offsetUntil), e.g. 'calc(4.5rem + env(safe-area-inset-bottom))' to clear a bottom
     *  tab bar. Default: 8px above --nish-bottom-inset (published by BottomNav and
     *  StickyActionBar), or 12px above the safe area, whichever is larger. */
    offset?: string;
    /** The breakpoint where offset stops applying: sm 640px, md 768px (default, matching BottomNav's hideFrom) or lg
     *  1024px. Match it to where the app's bottom tab bar hides, so a toast never covers
     *  the bar. From sm the stack still moves to the bottom right; between sm and this
     *  breakpoint it keeps the offset. */
    offsetUntil?: 'sm' | 'md' | 'lg';
    /** The stack's root element. */
    ref?: Ref<HTMLDivElement>;
}
/** The toast stack: bottom-center full width on phones, bottom-right on wider screens.
 *  It sits above any bottom bar through --nish-bottom-inset, and moves to the top of
 *  the screen on phones while a sheet or dialog is open (html[data-nish-layer-open]). */
declare function Toaster({ className, offset, offsetUntil, style: userStyle, ref, ...rest }: ToasterProps): react.JSX.Element;

interface MenuItemClassOptions {
    /** The current choice: the highlighted look (set aria-current on the row too). */
    active?: boolean;
    /** A destructive action: loss-colored text and hover. */
    danger?: boolean;
    /** The disabled look (set disabled or aria-disabled on the row too). */
    disabled?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<MenuItem>` renders, for menu-looking rows that are not in a
 *  DropdownMenu: tabbable buttons in a Popover panel that also holds IconButtons,
 *  inputs or color pickers. The rows keep their own roles (plain buttons, Tab order);
 *  hover and keyboard focus get the same highlight as MenuItem. */
declare function menuItemClass({ active, danger, disabled, className }?: MenuItemClassOptions): string;

interface ModalProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'children' | 'className'> {
    /** Heading of the dialog; also its accessible name. Optional only when `header`
     *  replaces the title row (then pass `aria-label`). */
    title?: ReactNode;
    /** Called on Escape, a backdrop click and the close button. Unmount the modal here
     *  (or set `open` to false). Optional when `onOpenChange` is used. */
    onClose?: () => void;
    /** Controlled open state. When given, the modal renders only while it is true and
     *  `onOpenChange(false)` asks you to close it. When omitted, a mounted Modal is open
     *  (the parent unmounts it in `onClose`). */
    open?: boolean;
    /** Called with false on Escape, a backdrop click and the close button, together with
     *  `onClose`. */
    onOpenChange?: (open: boolean) => void;
    /** The body. It scrolls when taller than the screen. */
    children: ReactNode;
    /** md: compact dialogs (default). lg / xl: wide content like guides and editors.
     *  2xl: very wide panels (comparison tables, up to 1152px). full: the whole screen
     *  less a 1rem margin. Every size is a bottom sheet under 640px. */
    size?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Buttons row pinned to the bottom of the panel. */
    footer?: ReactNode;
    /** A summary pinned under the title while the body scrolls (price, status, timestamps). */
    subtitle?: ReactNode;
    /** center (default), or top: pinned near the top of wide screens, for command
     *  palettes and search dialogs whose height changes as results arrive. */
    placement?: 'center' | 'top';
    /** Replaces the whole title row (title and close button), e.g. with a search
     *  field. Pass `aria-label` so the dialog keeps a name. */
    header?: ReactNode;
    /** Hides the close button. Escape and a backdrop click still close. */
    hideClose?: boolean;
    /** Accessible name when there is no visible `title` (required with `header`). */
    'aria-label'?: string;
    /** Phone sheet height (under 640px). auto: as tall as the content, up to 92% of the
     *  screen (default). tall: always 92%. full: the whole screen, square at the top. */
    sheetHeight?: 'auto' | 'tall' | 'full';
    /** Phone sheet: draw the grab handle and let a swipe down on it or the header close
     *  the sheet (default true). false: no handle, no swipe. */
    dismissible?: boolean;
    /** Android back and the browser back button close the dialog instead of leaving the
     *  page (default true). Pass false for a dialog that must not touch history. */
    closeOnBack?: boolean;
    /** Asked before any close (X, Escape, scrim, swipe, back). Return false to keep the
     *  dialog open with no exit animation, e.g. while a form holds invalid input; show
     *  the reason yourself. */
    canClose?: () => boolean;
    /** Classes for the dialog panel. */
    className?: string;
    /** The dialog panel (role="dialog"). */
    ref?: Ref<HTMLDivElement>;
}
/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll (on both <html> and <body>) while open. Renders through a Portal:
 *  nothing on the server. */
declare function Modal({ open, ...props }: ModalProps): react.JSX.Element | null;
interface DrawerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'children' | 'className'> {
    /** Heading of the drawer; also its accessible name unless `aria-label` is set. Optional
     *  only when you pass `aria-label` or `aria-labelledby`. */
    title?: ReactNode;
    /** A line under the title (counts, status, timestamps). */
    subtitle?: ReactNode;
    /** Called on Escape, a scrim click and the close button. Unmount the drawer here (or set
     *  `open` to false). Optional when `onOpenChange` is used. */
    onClose?: () => void;
    /** Controlled open state. When given, the drawer renders only while it is true and
     *  `onOpenChange(false)` asks you to close it. When omitted, a mounted Drawer is open. */
    open?: boolean;
    /** Called with false on Escape, a scrim click and the close button, together with `onClose`. */
    onOpenChange?: (open: boolean) => void;
    /** right (default) and left: a full-height panel from that edge. bottom: a sheet
     *  from the bottom edge at every width. */
    side?: 'right' | 'left' | 'bottom';
    /** Side drawers: the panel width on wide screens (sm 384px, md 448px, lg 672px);
     *  full width under 640px. Bottom sheets: the height cap (sm 50%, md 70%, lg 92%
     *  of the screen). Default md. */
    size?: 'sm' | 'md' | 'lg';
    /** Extra header controls, left of the close button (IconButtons, a filter). */
    actions?: ReactNode;
    /** A row pinned to the bottom of the panel. */
    footer?: ReactNode;
    /** Bottom sheets: lifts the sheet above an app's bottom tab bar, e.g.
     *  'calc(4rem + env(safe-area-inset-bottom))'. */
    bottomOffset?: string;
    /** Bottom sheets: draw the grab handle and let a swipe down on it or the header close
     *  the sheet (default true). false: no handle, no swipe. */
    dismissible?: boolean;
    /** Android back and the browser back button close the drawer instead of leaving the
     *  page (default true). Pass false for a drawer that must not touch history. */
    closeOnBack?: boolean;
    /** Asked before any close (X, Escape, scrim, swipe, back). Return false to keep the
     *  drawer open with no exit animation; show the reason yourself. */
    canClose?: () => boolean;
    /** Accessible name, when the title alone does not say enough. */
    'aria-label'?: string;
    /** The body. It scrolls on its own; header and footer stay put. */
    children: ReactNode;
    /** Classes for the panel. */
    className?: string;
    /** The drawer panel (role="dialog"). */
    ref?: Ref<HTMLDivElement>;
}
/** A panel that slides in from an edge: notifications, an assistant, filters, a phone
 *  "More" sheet. It is a modal dialog: it traps Tab, closes on Escape and a scrim
 *  click, returns focus to the opener and locks page scroll. Renders through a Portal:
 *  nothing on the server. */
declare function Drawer({ open, ...props }: DrawerProps): react.JSX.Element | null;
interface ConfirmDialogProps {
    /** The question, e.g. "Delete this tracker?". Also the dialog's name. */
    title: ReactNode;
    /** What happens if they confirm. Keep it to a sentence or two. The dialog's description. */
    body?: ReactNode;
    /** The confirm button's label: a verb that names the action ("Delete", "Archive"). */
    confirmLabel: string;
    /** The cancel button's label. Default "Cancel" (or the provider's `cancel` string). */
    cancelLabel?: string;
    /** danger (default): a red confirm button, and focus starts on Cancel. primary: an
     *  accent confirm button that takes the first focus. */
    tone?: 'danger' | 'primary';
    /** The action is running: the confirm button shows a spinner, and Cancel, Escape and
     *  the backdrop are held off until it finishes. */
    pending?: boolean;
    /** Runs the action. Close the dialog (unmount it) when it is done. */
    onConfirm: () => void;
    /** Called on Cancel, Escape and a backdrop click. Unmount the dialog here (or set
     *  `open` to false). Optional when `onOpenChange` is used. */
    onCancel?: () => void;
    /** Controlled open state. When given, the dialog renders only while it is true. When
     *  omitted, a mounted ConfirmDialog is open. */
    open?: boolean;
    /** Called with false on Cancel, Escape and a backdrop click, together with `onCancel`. */
    onOpenChange?: (open: boolean) => void;
}
/** A yes-or-no question before an action, in place of `window.confirm`: a small
 *  Modal (role="alertdialog") with Cancel and a confirm button. */
declare function ConfirmDialog({ title, body, confirmLabel, cancelLabel, tone, pending, onConfirm, onCancel, open, onOpenChange, }: ConfirmDialogProps): react.JSX.Element;
interface TooltipProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'className'> {
    /** What the tooltip says. Keep it to a sentence or two. */
    tip: ReactNode;
    /** The trigger. When it is a single focusable element (a button, a link, an IconButton)
     *  it gets `aria-describedby` and no extra Tab stop; any other content is wrapped in a
     *  focusable span so keyboard users can read the tip. */
    children: ReactNode;
    className?: string;
    /** Preferred side; flips to the opposite one when there is no room. `right` suits
     *  a collapsed sidebar. */
    side?: 'top' | 'bottom' | 'left' | 'right';
    /** Element used for the trigger. Pass `tr` inside tables, where a span would be
     *  invalid markup and get hoisted out of the table by the parser. */
    as?: 'span' | 'tr';
    /** Adds the wrapper to the Tab order. Default: true, except when the child is a single
     *  focusable element (that element is the tab stop). Set false for dense marks such
     *  as 60 chart bars, and make the value reachable another way. */
    focusable?: boolean;
    /** default: the trigger keeps its own look. hint: a dotted underline and a help
     *  cursor, for a term whose meaning the tip explains. */
    variant?: 'default' | 'hint';
    /** The trigger wrapper. */
    ref?: Ref<HTMLElement>;
}
/** Hover/focus tooltip rendered through a portal (into the dialog it sits in, else the
 *  configured container, else <body>), so `overflow:hidden` ancestors (truncated labels,
 *  scrolling tables) can never clip it. Positioned from the trigger's viewport rect,
 *  flipped and clamped to stay on screen. Escape dismisses it, and the pointer can move
 *  onto it (WCAG 1.4.13). */
declare function Tooltip({ tip, children, className, side, as, focusable, variant, ref, ...rest }: TooltipProps): react.JSX.Element;
/** Why a Popover or DropdownMenu closed itself: Escape, a press outside, or Tab out. */
type PopoverCloseReason = 'escape' | 'outside' | 'tab';
interface PopoverProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'> {
    /** Whether the panel shows. The popover is controlled: pair it with `onOpenChange`. */
    open: boolean;
    /** Called with false on Escape, a press outside, and Tab out of the panel. The second
     *  argument says which one: 'escape', 'outside' or 'tab'. */
    onOpenChange: (open: boolean, reason: PopoverCloseReason) => void;
    /** Close on a press outside the panel and its anchor (default true). Set false for
     *  an editor that must stay open while the user drags things outside it; Escape and
     *  Tab out still close it. */
    dismissOnOutside?: boolean;
    /** The element the panel sits next to (usually the button that opens it). Focus
     *  returns here when the panel closes. */
    anchor: RefObject<HTMLElement | null>;
    /** Preferred side; flips when there is no room. Default bottom. */
    side?: 'top' | 'bottom';
    /** Which edge of the anchor the panel lines up with (mirrored in right-to-left
     *  layouts). Default start. */
    align?: 'start' | 'center' | 'end';
    /** Panel width: a number of pixels or any CSS length. Default: fits the content. */
    width?: number | string;
    /** Accessible name of the panel (it has role="dialog"). */
    'aria-label'?: string;
    /** Classes for the panel (e.g. `p-0`, or `app-region-no-drag` in Electron apps). */
    className?: string;
    children: ReactNode;
    /** The popover panel (role="dialog"). */
    ref?: Ref<HTMLDivElement>;
}
/** A non-modal floating panel anchored to an element: filters, a color picker, a
 *  details card. Portaled (so no parent clips it), flipped and clamped to the screen.
 *  Escape and a press outside close it; focus returns to the anchor. Renders nothing on
 *  the server. */
declare function Popover({ open, onOpenChange, dismissOnOutside, anchor, side, align, width, 'aria-label': ariaLabel, className, children, ref, style, onKeyDown: userKeyDown, ...rest }: PopoverProps): react.ReactPortal | null;
interface DropdownMenuProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'onChange'> {
    /** The button that opens the menu (a Button or IconButton). It gets aria-haspopup,
     *  aria-expanded and aria-controls, opens on click, and on ArrowDown / ArrowUp. */
    trigger: ReactElement;
    /** Which edge of the trigger the menu lines up with (mirrored in right-to-left
     *  layouts). Default start. */
    align?: 'start' | 'center' | 'end';
    /** Preferred side; flips when there is no room. Default bottom. */
    side?: 'top' | 'bottom';
    /** MenuItem, MenuLabel, MenuSeparator and MenuSubHeader rows. */
    children: ReactNode;
    /** Controlled open state (optional; the menu manages it otherwise). */
    open?: boolean;
    /** Called whenever the menu opens or closes. When the menu closed itself, the second
     *  argument says why: 'escape', 'outside' or 'tab' (undefined after a selection or a
     *  trigger click). */
    onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
    /** Opens on mount when uncontrolled (previews, tests). */
    defaultOpen?: boolean;
    /** Accessible name of the menu. Default: the trigger's name (aria-labelledby). */
    'aria-label'?: string;
    /** `'sm'`: under 640px the menu opens as a bottom sheet with 48px rows instead of a
     *  floating panel. Default false (always a floating panel). */
    sheetBelow?: 'sm' | false;
    /** Title of the bottom sheet when `sheetBelow` is set. Default "Menu" (the provider's
     *  `menu` string). */
    sheetTitle?: string;
    /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
    className?: string;
    /** The menu panel (role="menu"). */
    ref?: Ref<HTMLDivElement>;
}
/** A menu of actions behind a button: role="menu" with arrow keys, Home and End,
 *  Escape, Tab to leave, and focus back on the trigger when it closes. */
declare function DropdownMenu({ trigger, align, side, children, open: openProp, onOpenChange, defaultOpen, 'aria-label': ariaLabel, sheetBelow, sheetTitle, className, ref, style, onKeyDown: userKeyDown, ...rest }: DropdownMenuProps): react.JSX.Element;
interface MenuItemProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onSelect' | 'children' | 'className' | 'type' | 'role'> {
    /** Leading icon (14px reads best). */
    icon?: ReactNode;
    /** Right-aligned extra: a shortcut (Kbd), a count or a chevron. */
    trailing?: ReactNode;
    /** A destructive action: loss-colored text and hover. */
    danger?: boolean;
    /** Marks the current choice (the selected sort, the open board) with the
     *  highlighted look. */
    active?: boolean;
    /** Shown but not selectable; arrow keys skip it. */
    disabled?: boolean;
    /** Runs on click, Enter and Space, then the menu closes. Call
     *  `event.preventDefault()` to keep it open (e.g. to switch to a submenu view). */
    onSelect?: (event: Event) => void;
    /** Classes for the row. */
    className?: string;
    children: ReactNode;
    /** The row's button. */
    ref?: Ref<HTMLButtonElement>;
}
/** One action in a DropdownMenu. */
declare function MenuItem({ icon, trailing, danger, active, disabled, onSelect, className, children, ref, onClick, onMouseMove, ...rest }: MenuItemProps): react.JSX.Element;
/** A small heading over a group of MenuItems. Not focusable. */
declare function MenuLabel({ children, className, ref, ...rest }: Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role'> & {
    className?: string;
    ref?: Ref<HTMLDivElement>;
}): react.JSX.Element;
/** A thin line between groups of MenuItems. */
declare function MenuSeparator({ className, ref, ...rest }: Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'role' | 'children'> & {
    className?: string;
    ref?: Ref<HTMLDivElement>;
}): react.JSX.Element;
interface MenuSubHeaderProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'className' | 'type' | 'role'> {
    /** Goes back to the parent view (also on ArrowLeft, ArrowRight in right-to-left
     *  layouts). The menu stays open. */
    onBack: () => void;
    /** The submenu's title. */
    children: ReactNode;
    className?: string;
    /** The header's button. */
    ref?: Ref<HTMLButtonElement>;
}
/** The first row of a submenu view shown in place: a back arrow and the view's title. */
declare function MenuSubHeader({ onBack, children, className, ref, onKeyDown, ...rest }: MenuSubHeaderProps): react.JSX.Element;

/** Status tones shared by the display components. */
type StatusTone = 'ok' | 'warn' | 'loss' | 'info' | 'accent' | 'neutral';
type CalloutTone = 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'loss';
/** ok for a positive number, loss for a negative one, neutral for zero or nothing.
 *  Replaces `n >= 0 ? gain : loss` ternaries. */
declare function signTone(n: number | null | undefined): 'ok' | 'loss' | 'neutral';
/** ok, warn or loss for a value against two thresholds. When loss is above warn, higher
 *  is worse (disk use: { warn: 75, loss: 90 }). When loss is below warn, lower is worse
 *  (battery: { warn: 30, loss: 10 }). */
declare function toneFor(value: number, t: {
    warn: number;
    loss: number;
}): 'ok' | 'warn' | 'loss';
type ChartTone$1 = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
type MeterTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | 'neutral' | ChartTone$1;
type SparklineTone = ChartTone$1 | 'accent' | 'ok' | 'warn' | 'loss' | 'info';
type ChartLegendTone = ChartTone$1 | 'accent' | 'ok' | 'warn' | 'loss' | 'info';

declare const DOT_SIZE: {
    readonly xs: "size-1.5";
    readonly sm: "size-2";
    readonly md: "size-2.5";
    readonly lg: "size-3.5";
};
declare const STAT_VALUE_SIZE: {
    readonly sm: "text-base";
    readonly md: "text-xl";
    readonly lg: "text-2xl";
};
declare const GRID_BASE: {
    readonly 1: "grid-cols-1";
    readonly 2: "grid-cols-2";
    readonly 3: "grid-cols-3";
    readonly 4: "grid-cols-4";
};
declare const GRID_MD: {
    readonly 2: "md:grid-cols-2";
    readonly 3: "md:grid-cols-3";
    readonly 4: "md:grid-cols-4";
    readonly 5: "md:grid-cols-5";
    readonly 6: "md:grid-cols-6";
};
declare const METER_THICK: {
    readonly xs: "h-1";
    readonly sm: "h-1.5";
    readonly md: "h-2.5";
};
interface CalloutProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'onClick'> {
    /** The root element. */
    ref?: Ref<HTMLDivElement>;
    /** What kind of notice: info and accent for news, ok for success, warn for something to
     *  check, loss for a failure. neutral is a plain grey note. */
    tone?: CalloutTone;
    /** Leading icon. Defaults by tone (Info, CheckCircle or AlertTriangle); false hides it. */
    icon?: ReactNode | false;
    /** A short bold first line. */
    title?: ReactNode;
    /** The body text. */
    children?: ReactNode;
    /** Usually one small Button or link, shown after the text. */
    action?: ReactNode;
    /** Adds a Dismiss button that calls this. */
    onDismiss?: () => void;
    /** Accessible name of the dismiss button. Default: the provider's `dismiss` string. */
    dismissLabel?: string;
    /** box: a rounded tinted box in the flow (default). bar: full width with square
     *  corners and no side borders, for a sticky page-level alert. */
    variant?: 'box' | 'bar';
    /** Tighter padding and xs text, for widgets and table cells. */
    compact?: boolean;
    /** Announce it when it appears: role="alert" for loss, role="status" otherwise.
     *  Leave it off for notices that are part of the page from the start. */
    live?: boolean;
    /** Sticks under the app header (`top: var(--nish-header-h)`), above page content. Pair
     *  with variant="bar". */
    sticky?: boolean;
    /** Limits the body to 1, 2 or 3 lines with an ellipsis, instead of growing. */
    clamp?: 1 | 2 | 3;
    /** Makes the icon, title and text one link (at least 44px tall) with a trailing
     *  chevron. `action` and the dismiss button stay separate controls beside it. A URL that
     *  is not safe (`javascript:` and so on) is dropped with a dev warning, and the callout
     *  is not a link. */
    href?: string;
    /** Like href, but a button. */
    onClick?: () => void;
    /** Shows a "+{count}" badge after the title, for "and 3 more" notices. */
    count?: number;
}
/** An inline notice: a tinted box with an icon, an optional title, text and an action.
 *  variant="bar" is opaque, so it can stick under the header without content showing
 *  through. */
declare function Callout({ tone, icon, title, children, action, onDismiss, dismissLabel, variant, compact, live, sticky, clamp, href: hrefProp, onClick, count, className, ref, ...rest }: CalloutProps): react.JSX.Element;
interface StatusDotProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
    /** The dot element. */
    ref?: Ref<HTMLSpanElement>;
    /** ok, warn, loss and info use the status fills; accent the accent; neutral the ghost grey. */
    tone: StatusTone;
    /** xs 6px, sm 8px (default), md 10px, lg 14px. */
    size?: keyof typeof DOT_SIZE;
    /** Gently pulses the opacity, for "live" or "running". Still under reduced motion. */
    pulse?: boolean;
    /** A soft ring around the dot, for a header status. */
    halo?: boolean;
    /** The accessible name read by screen readers ("Up", "Degraded"; role="img"). Without it the
     *  dot is aria-hidden, so always pair it with visible text then. */
    label?: string;
}
/** A small round status mark. Color is never the only signal: give it a label or
 *  put text beside it. In forced-colors mode it stays visible in the system highlight color. */
declare function StatusDot({ tone, size, pulse, halo, label, className, ref, ...rest }: StatusDotProps): react.JSX.Element;
interface StatProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'> {
    /** The root element: the card, or the `dl` / `div` of the other variants. */
    ref?: Ref<HTMLElement>;
    /** What the number is: "Open positions", "Uptime (30d)". */
    label: ReactNode;
    /** The number, already formatted ("$12,480", "99.95%"). */
    value: ReactNode;
    /** A quiet line under the value: a change, a date, a unit. */
    sub?: ReactNode;
    /** Colors the value: ok for gains, loss for losses, warn for attention. Use
     *  signTone(n) for signed numbers. */
    tone?: 'ok' | 'loss' | 'warn' | 'neutral';
    /** An explanation shown in a tooltip on the label (dotted underline). */
    tip?: ReactNode;
    /** Value size: sm 16px, md 20px (default), lg 24px. */
    size?: keyof typeof STAT_VALUE_SIZE;
    /** card: a small Card (default). inset: a grey box for use inside a card. plain: no box. */
    variant?: 'card' | 'inset' | 'plain';
    /** Skeleton bars of the same size instead of the value and sub. */
    loading?: boolean;
}
/** One labelled number. Inside a StatGrid it is a row of the grid's <dl>; on its own it
 *  renders its own <dl>. */
declare function Stat({ label, value, sub, tone, tip, size, variant, loading, className, ref, ...rest }: StatProps): react.JSX.Element;
interface StatGridProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
    /** The `dl` element. */
    ref?: Ref<HTMLDListElement>;
    /** Columns on phones (base, default 2) and from 768px (md, default 4). */
    cols?: {
        base?: keyof typeof GRID_BASE;
        md?: keyof typeof GRID_MD;
    };
    /** Stat elements. */
    children: ReactNode;
}
/** A responsive grid of Stats, rendered as one <dl>. */
declare function StatGrid({ cols, children, className, ref, ...rest }: StatGridProps): react.JSX.Element;
interface MeterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'role'> {
    /** The element with the `meter` / `progressbar` role (the bar itself, also with `showValue`). */
    ref?: Ref<HTMLDivElement>;
    /** The current value, between min and max (clamped). */
    value: number;
    /** Default 0. */
    min?: number;
    /** Default 100. */
    max?: number;
    /** Accessible name: what is being measured ("Disk used"). Required, since the bar has no text. */
    label: string;
    /** Fill color. Overrides thresholds. Default: from thresholds, else accent. neutral:
     *  a gray fill for a quantity with no status meaning (swap, a share of a total). */
    tone?: MeterTone;
    /** Picks ok, warn or loss from the value (see toneFor) when tone is not given. */
    thresholds?: {
        warn: number;
        loss: number;
    };
    /** Bar thickness: xs 4px, sm 6px (default), md 10px. */
    size?: keyof typeof METER_THICK;
    /** vertical fills from the bottom; give the meter a height (className="h-16"). */
    orientation?: 'horizontal' | 'vertical';
    /** Track color: elevated on a surface (default), overlay when the meter sits on an
     *  elevated box. */
    track?: 'elevated' | 'overlay';
    /** meter: a measurement (role="meter"). progress: work being done (role="progressbar"). */
    kind?: 'meter' | 'progress';
    /** Shows the rounded percentage beside a horizontal bar. */
    showValue?: boolean;
}
/** A thin bar showing how full something is: disk, quota, progress, a score. The fill
 *  stays visible in forced-colors mode (system highlight on a bordered track). `className`
 *  goes on the bar, or on the wrapper row with `showValue`. */
declare function Meter({ value, min, max, label, tone, thresholds, size, orientation, track, kind, showValue, className, ref, ...rest }: MeterProps): react.JSX.Element;
interface SparklineProps extends Omit<ComponentPropsWithoutRef<'svg'>, 'values' | 'fill' | 'min' | 'max' | 'width' | 'height' | 'children'> {
    /** The svg element. */
    ref?: Ref<SVGSVGElement>;
    /** The series, oldest first. null leaves a gap (a missed check, a closed market). */
    values: (number | null)[];
    /** Accessible name, ideally with the trend: "Response time, last 24 hours, 120 to 180 ms". */
    label: string;
    /** Line color. Default chart-1. */
    tone?: SparklineTone;
    /** Width in px. Default 120; pass className="w-full" to stretch it. */
    width?: number;
    /** Height in px. Default 28. */
    height?: number;
    /** Shades the area under the line. */
    fill?: boolean;
    /** Bottom of the scale. Default: the smallest value. */
    min?: number;
    /** Top of the scale. Default: the largest value. */
    max?: number;
}
/** A tiny line chart with no axes, for a trend beside a number. Plain SVG, no chart
 *  library. Gaps at nulls; a flat dashed line when there is no data. The geometry is
 *  recomputed only when `values`, the size or the scale change. */
declare function Sparkline({ values, label, tone, width, height, fill, min, max, className, ref, ...rest }: SparklineProps): react.JSX.Element;
interface DisclosureProps extends Omit<ComponentPropsWithoutRef<'details'>, 'open' | 'onToggle' | 'children'> {
    /** The `details` element. */
    ref?: Ref<HTMLDetailsElement>;
    /** The always-visible row that opens and closes it. */
    summary: ReactNode;
    /** What it reveals. */
    children: ReactNode;
    /** Starts open (uncontrolled). */
    defaultOpen?: boolean;
    /** Controlled open state; pair it with onOpenChange. */
    open?: boolean;
    /** Called with the new state when the reader toggles it. */
    onOpenChange?: (open: boolean) => void;
    /** plain: a bare row (default). card: a bordered surface box. */
    variant?: 'plain' | 'card';
}
/** Show-more on native <details>/<summary>: keyboard and find-in-page work for free,
 *  with a chevron that turns when open. The root carries `data-state="open|closed"`. */
declare function Disclosure({ summary, children, defaultOpen, open, onOpenChange, variant, className, ref, ...rest }: DisclosureProps): react.JSX.Element;
interface KbdProps extends ComponentPropsWithoutRef<'kbd'> {
    /** The `kbd` element. */
    ref?: Ref<HTMLElement>;
}
/** A keyboard key or shortcut, e.g. <Kbd>⌘K</Kbd>. */
declare function Kbd({ className, ref, ...rest }: KbdProps): react.JSX.Element;
/** Copies text to the clipboard. Uses the Clipboard API when it exists and the page is a
 *  secure context; otherwise (no API, an insecure origin, a denied permission, an old
 *  browser) it falls back to a hidden textarea and `execCommand('copy')`. Resolves true when
 *  it worked, false when neither path did. */
declare function copyText(text: string): Promise<boolean>;
interface CopyButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onCopy' | 'onClick' | 'children' | 'type'> {
    /** The button element. */
    ref?: Ref<HTMLButtonElement>;
    /** What lands on the clipboard. */
    text: string;
    /** Button text, and the accessible name when iconOnly. Default: the provider's `copy` string ("Copy"). */
    label?: string;
    /** Shown for 1.5s after a copy and announced politely. Default: the provider's `copied` string. */
    copiedLabel?: string;
    /** Shown for 1.5s when neither the Clipboard API nor the textarea fallback worked, and
     *  announced politely. Default "Copy failed". */
    failedLabel?: string;
    /** A square IconButton instead of a labelled Button. */
    iconOnly?: boolean;
    /** Button size (or IconButton size when iconOnly). Default sm. */
    size?: 'sm' | 'md';
    /** Button variant when not iconOnly. Default secondary. */
    variant?: ButtonProps['variant'];
    /** Called after each copy attempt with whether it worked. */
    onCopy?: (ok: boolean) => void;
}
/** Copies text with one click, shows "Copied" for 1.5s and tells screen readers. Without a
 *  Clipboard API (or on an insecure origin) it falls back to a textarea and `execCommand`;
 *  when that fails too it shows `failedLabel` instead. */
declare function CopyButton({ text, label, copiedLabel, failedLabel, iconOnly, size, variant, onCopy, className, ref, ...rest }: CopyButtonProps): react.JSX.Element;
interface PageHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
    /** The `header` element. */
    ref?: Ref<HTMLElement>;
    /** The page's title. */
    title: ReactNode;
    /** One sentence under the title. */
    description?: ReactNode;
    /** A small line above the title (a section or a breadcrumb). */
    eyebrow?: ReactNode;
    /** A back link above everything, e.g. the app's own
     *  <Link className={buttonClass({ variant: 'link' })}>← Jobs</Link>. */
    back?: ReactNode;
    /** Buttons on the right; they wrap under the title on phones. */
    actions?: ReactNode;
    /** Heading level. Default h1. */
    as?: 'h1' | 'h2';
    /** Sticks under the app header (`top: var(--nish-header-h)`) with an opaque background
     *  while the page scrolls; a bottom border appears once it is stuck. */
    sticky?: boolean;
    /** Sticky only: under 640px, once stuck, hide the description and show the title as
     *  one truncated line, so the bar stays short. Default true. */
    collapseWhenStuck?: boolean;
}
/** The title block at the top of a page: optional back link and eyebrow, the title,
 *  a description and actions. */
declare function PageHeader({ title, description, eyebrow, back, actions, as: H, sticky, collapseWhenStuck, className, ref: refProp, ...rest }: PageHeaderProps): react.JSX.Element;
/** The hub pill: a link back to the site that hosts a family of apps. */
interface AppHeaderHub {
    /** Where the pill goes. An unsafe URL (`javascript:` and so on) hides the pill with a dev warning. */
    href: string;
    /** The pill text after the arrow ("nish.software", "Acme home"). */
    label: ReactNode;
    /** The pill's title attribute. Default: the provider's `hubTitle` string. */
    title?: string;
}
interface AppHeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'children'> {
    /** The `header` element. */
    ref?: Ref<HTMLElement>;
    /** The app's name, shown as the wordmark. */
    name: ReactNode;
    /** An icon before the name, drawn in the accent color. */
    icon?: ReactNode;
    /** Replaces the icon and name, and their home link, with your own node (a profile
     *  switcher, a wordmark with a subtitle). It is not wrapped in a link; `name` stays for
     *  screen readers. */
    brand?: ReactNode;
    /** A pill at the start of the header that links back to a hub site ("← nish.software").
     *  Default false: no pill. The nish.software apps pass
     *  `{ href: 'https://nish.software', label: 'nish.software' }`. */
    hub?: AppHeaderHub | false;
    /** Buttons before the theme toggle. */
    actions?: ReactNode;
    /** A second row of nav links (use tabClass on each, aria-current on the active one). */
    nav?: ReactNode;
    /** Replaces the default <ThemeToggle />; false hides it. */
    themeToggle?: ReactNode | false;
    /** Sticks to the top of the page. Default true. */
    sticky?: boolean;
    /** Classes for the inner rows, e.g. "mx-auto max-w-6xl" to match the page width. */
    innerClassName?: string;
    /** Makes the icon and name one link home (a 44px target), e.g. "/". */
    homeHref?: string;
    /** Under 640px show only the icon; the name stays for screen readers, so the pill,
     *  actions and theme toggle fit on one row. Needs an icon. */
    hideNameBelow?: 'sm';
    /** Names the nav row's <nav> landmark. Default: the provider's `sections` string. Give
     *  each nav on a page its own name. */
    navLabel?: string;
    /** Under 480px the hub pill shrinks to its arrow (.nish-pill-link--compact), for
     *  headers with a long name. */
    compactPill?: boolean;
    /** Frosted glass (`bg-th-bg/80 backdrop-blur-xl`) where the browser supports
     *  backdrop-filter. Off by default: the header is opaque. */
    glass?: boolean;
    /** Extra MenuItems. From 640px they render after `actions`; under 640px they collapse
     *  into a "More actions" kebab menu, so the row never wraps. */
    overflowActions?: ReactNode;
}
/** The shared app header: an optional hub pill, the wordmark, actions and the theme toggle,
 *  with an optional nav row. Opaque by default (glass is opt-in), safe-area aware. A
 *  sticky header publishes its height as `--nish-header-h` for the rest of the layout. */
declare function AppHeader({ name, icon, brand, hub, actions, nav, themeToggle, sticky, innerClassName, homeHref, hideNameBelow, navLabel, compactPill, glass, overflowActions, className, ref: refProp, ...rest }: AppHeaderProps): react.JSX.Element;
interface SectionHeaderProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'id'> {
    /** The wrapper row. */
    ref?: Ref<HTMLDivElement>;
    /** The section's title. */
    title: ReactNode;
    /** id for the heading, so the section can point aria-labelledby at it. */
    id?: string;
    /** Heading level. Default h2. */
    as?: 'h1' | 'h2' | 'h3';
    /** Quiet text on the right ("Updated 2 min ago", "3 of 12"). */
    meta?: ReactNode;
    /** A control on the right, after meta (a Button, a Segmented, a link). */
    action?: ReactNode;
}
/** The heading row of a section inside a page: the title, with optional meta text
 *  and an action on the right. Smaller than PageHeader, larger than CardHeader. */
declare function SectionHeader({ title, id, as: H, meta, action, className, ref, ...rest }: SectionHeaderProps): react.JSX.Element;
interface KeyValueItem {
    /** React key; unique in the list. */
    key: string;
    /** The left side: a name, often with a StatusDot or an icon. */
    label: ReactNode;
    /** The right side: a value, a Badge, a status. */
    value: ReactNode;
    /** Let the row wrap instead of staying on one line; it grows taller than 44px (32px
     *  dense) when the text wraps. Both the `ul` and `dl` forms.
     *  - `true` or `'anywhere'`: a long value with no spaces (a path, a URL, an id). The value
     *    cell may shrink and breaks anywhere (`break-all`); the label keeps its width.
     *  - `'words'`: prose (a phrase-long status or error). Both cells wrap at word breaks,
     *    labels first: the label keeps its one-line width up to 60% of the row
     *    (`shrink-0 max-w-[calc(60%-0.75rem)]`), so a short label never wraps one word per
     *    line, and the value takes the rest, at least 40% (`min-w-0 flex-1 text-end`). A
     *    word splits only when it alone is wider than its cell (`overflow-wrap: anywhere`).
     *  Without `wrap` the value keeps its full width, so keep it short. */
    wrap?: boolean | 'anywhere' | 'words';
}
interface KeyValueListProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
    /** The `ul` or `dl` element. */
    ref?: Ref<HTMLElement>;
    items: KeyValueItem[];
    /** Rows 32px tall instead of 44px, for dense panels. */
    dense?: boolean;
    /** ul: a list of rows (default). dl: a description list with dt and dd, for label
     *  and value pairs that read as "name: value". */
    as?: 'ul' | 'dl';
}
/** Label and value rows with dividers: services and their status, runner details,
 *  vitals. Each row is at least 44px tall (32px dense); an item with `wrap` lets its row
 *  wrap and grow: `true`/`'anywhere'` for a path or URL, `'words'` for prose. */
declare function KeyValueList({ items, dense, as, className, ref, ...rest }: KeyValueListProps): react.JSX.Element;
interface ChartLegendItem {
    /** The series name. */
    label: string;
    /** The series color, the same role the chart draws it in. */
    tone: ChartLegendTone;
}
interface ChartLegendProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
    /** The `ul` element. */
    ref?: Ref<HTMLUListElement>;
    items: ChartLegendItem[];
    /** line: a short 3px x 10px stroke, for line charts (default). dot: an 8px dot, for
     *  bars and points. */
    marker?: 'line' | 'dot';
    /** Accessible name of the list. Default: the provider's `legend` string. */
    label?: string;
}
/** The key for a multi-series chart (uPlot and canvas charts draw none of their own):
 *  each series' color mark and name. The marks are decorative; the names carry it. */
declare function ChartLegend({ items, marker, label, className, ref, ...rest }: ChartLegendProps): react.JSX.Element;

type RowTone$1 = 'ok' | 'warn' | 'loss';
/** The table recipes as strings, for renderers that take classes (TanStack Table cells,
 *  static markup). The components in table.tsx use exactly these. */
declare const tableClass: {
    /** The scroll box around the table. */
    readonly wrap: "relative overflow-auto rounded-xl border border-th-line bg-th-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent";
    /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
    readonly sticky: "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[var(--nish-z-sticky,1)] [&_thead_th]:bg-th-surface";
    /** The <table>. */
    readonly table: "w-full border-collapse text-sm tabular-nums text-th-hi2";
    /** Add to table for striped rows. */
    readonly zebra: "[&_tbody>tr:nth-child(even)]:bg-th-elevated/50";
    /** A header cell (add padY.normal or padY.dense). */
    readonly th: "whitespace-nowrap border-b border-th-line px-3 text-start align-middle text-xs font-medium uppercase tracking-wider text-th-hi3";
    /** A body cell (add padY.normal or padY.dense). */
    readonly td: "px-3 align-middle";
    /** Vertical cell padding: normal or dense. */
    readonly padY: {
        readonly normal: "py-2.5";
        readonly dense: "py-1.5";
    };
    /** A body row. */
    readonly tr: "border-b border-th-line last:border-b-0";
    /** Add to tr for a clickable row. */
    readonly trInteractive: "cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated";
    /** Add to th or td for a right-aligned number column. */
    readonly numeric: "whitespace-nowrap text-end tabular-nums";
    /** Add to tr for a status edge. */
    readonly tone: Record<RowTone$1, string>;
};
/** Turns a host and a CSS size into an icon URL, or null for "no image" (letter avatar). */
type FaviconResolver = (host: string, size: number) => string | null;
/** Google's favicon service: one request per host to google.com that tells Google which
 *  sites are shown. Opt in with `configureFavicons({ resolve: googleFavicon })`. */
declare const googleFavicon: FaviconResolver;
/** Sets the resolver every Favicon (and LinkCard icon) uses when it has no `src` or
 *  `resolve` of its own. Call it once at startup. The default returns null: no request,
 *  a letter avatar. */
declare function configureFavicons(options: {
    resolve?: FaviconResolver | null;
}): void;

type Align = 'left' | 'center' | 'right';
type RowTone = 'ok' | 'warn' | 'loss';
interface TableWrapProps extends ComponentProps<'div'> {
    /** The table's minimum width (e.g. 640 or '40rem'); narrower screens scroll sideways
     *  inside the box instead of squeezing columns. */
    minWidth?: number | string;
    /** Caps the height (e.g. 480 or '60vh'); the body scrolls inside. */
    maxHeight?: number | string;
    /** Keeps the header row visible while the body scrolls. Pair it with maxHeight. */
    stickyHeader?: boolean;
    /** Fades the left and right edges while there is more to scroll sideways. Default true. */
    fade?: boolean;
    /** Pins the first column (header and body cells) to the start edge while the table
     *  scrolls sideways, with an edge shadow once it has scrolled. */
    stickyFirstColumn?: boolean;
    /** The accessible name of the scroll box. While the table overflows, the box is a
     *  focusable region with this name, so keyboard users can scroll it. */
    label?: string;
}
/** The bordered scroll box a table sits in. Use it instead of a Card for tables. While the
 *  table is wider or taller than the box, the box takes focus (Tab, then arrow keys scroll). */
declare function TableWrap({ minWidth, maxHeight, stickyHeader, fade, stickyFirstColumn, label, className, style, children, ref: forwardedRef, ...rest }: TableWrapProps): react.JSX.Element;
interface TableProps extends ComponentProps<'table'> {
    /** Tighter rows (6px vertical padding instead of 10px) for dense data. */
    dense?: boolean;
    /** Striped body rows. */
    zebra?: boolean;
}
/** A full-width table with tabular numbers. Put it in a TableWrap. */
declare function Table({ dense, zebra, className, ...rest }: TableProps): react.JSX.Element;
interface ThProps extends Omit<ComponentProps<'th'>, 'align'> {
    /** Text alignment: the start edge, the end edge (both mirror in RTL) or centered.
     *  Default left (right when numeric). */
    align?: Align;
    /** A number column: right-aligned with tabular figures. */
    numeric?: boolean;
    /** The column's current sort, or false when it is sortable but not sorted. Leave it
     *  undefined for a column that does not sort. Sets aria-sort. */
    sort?: 'asc' | 'desc' | false;
    /** Makes the header a button that asks to sort (cycle the order in your state). */
    onSort?: () => void;
}
/** A header cell. With onSort it holds a sort button and reports aria-sort. */
declare function Th({ align, numeric, sort, onSort, className, children, scope, ...rest }: ThProps): react.JSX.Element;
interface TdProps extends Omit<ComponentProps<'td'>, 'align'> {
    /** Text alignment: the start edge, the end edge (both mirror in RTL) or centered.
     *  Default left (right when numeric). */
    align?: Align;
    /** A number column: right-aligned with tabular figures, never wrapping. */
    numeric?: boolean;
    /** Keeps the cell's text on one line. */
    nowrap?: boolean;
}
/** A body cell. */
declare function Td({ align, numeric, nowrap, className, ...rest }: TdProps): react.JSX.Element;
interface TrProps extends ComponentProps<'tr'> {
    /** A 3px status edge at the start (ok, warn, loss). Say the status in a cell too. */
    tone?: RowTone;
    /** Hover and focus-within highlight for a clickable row. Put a real link or button
     *  in the row as well, so keyboard users can reach it. */
    interactive?: boolean;
    /** Quieter text for inactive or archived rows. */
    muted?: boolean;
    /** Children are cells. */
    children?: ReactNode;
}
/** A body row with a divider. */
declare function Tr({ tone, interactive, muted, className, ...rest }: TrProps): react.JSX.Element;

interface ThemeState {
    /** What was picked: 'system' or a theme name. */
    choice: ThemeChoice;
    /** What is rendering now. */
    theme: ThemeName;
    /** dark or light: what the rendering theme is based on. */
    scheme: 'dark' | 'light';
    /** Save a choice (cookie and localStorage) and apply it. */
    setChoice: (choice: ThemeChoice) => void;
}
/** The current theme choice and what it renders as, kept in sync across tabs and
 *  subdomains. Server render and hydration see { choice: 'system', theme: 'dark' }; the real
 *  value follows right after. If a hydration pass wiped <html data-theme>, it is applied
 *  again on mount. */
declare function useTheme(): ThemeState;
interface ThemeToggleProps {
    /** Also offer the extra presets (slate, terminal, …) in a select. */
    presets?: boolean;
    /** Show "System", "Light" and "Dark" text beside the icons. */
    labels?: boolean;
    /** Fill the container's width, with equal-width segments. */
    block?: boolean;
    /** sm: 28px segments (default). md: 32px. Both grow to 44px on touch screens. */
    size?: 'sm' | 'md';
    /** One icon button that cycles System, Light, Dark and shows the current choice; for
     *  collapsed sidebars and tight headers. Ignores labels, block and presets. */
    compact?: boolean;
    /** segmented: the System / Light / Dark radio group (default). pill: one cycling
     *  button in a 44px pill with a line-strong border, to sit next to the hub pill in a
     *  top bar (the React twin of .nish-theme-btn--pill). With labels, the pill also shows
     *  the current choice as a word (.nish-theme-btn--labelled). Ignores block and presets. */
    variant?: 'segmented' | 'pill';
    /** What the segmented toggle shows below 640px. compact (default): the one cycling
     *  button, so a phone header keeps to one row. segmented: the radio group at every
     *  width. A block toggle is always segmented. */
    phone?: 'compact' | 'segmented';
    /** sm (default): the segmented toggle collapses to the cycling button below 640px (see
     *  `phone`). never: it keeps the segmented control and the presets select at every
     *  width, for a drawer or settings page that has the room. */
    collapse?: 'sm' | 'never';
    className?: string;
    /** The words after a preset saved on another site in the button label: "Theme: Mocha (set on
     *  another site). Switch to System". Default "set on another site". */
    elsewhereLabel?: string;
    /** The root element: the segmented group, or the button of the compact and pill variants. */
    ref?: Ref<HTMLElement>;
}
/** System / Light / Dark as a Segmented radio group, optionally with a preset picker,
 *  or one cycling icon button when compact. Words come from `useNishStrings()`. Other props
 *  (id, data-*, aria-*, style) go on the root element. */
declare function ThemeToggle({ ref, presets, labels, block, size, compact, variant, phone, collapse, className, elsewhereLabel, ...rest }: ThemeToggleProps & Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'>): react.JSX.Element;

interface SegmentedOption<T extends string> {
    value: T;
    label: ReactNode;
    /** Screen-reader name when the label is only an icon. */
    ariaLabel?: string;
    /** Hover tooltip (the native title) for a one-word hint on an icon-only option. Use
     *  tip for anything longer. */
    title?: string;
    /** A tooltip that explains the option. It opens on mouse hover and on keyboard focus of
     *  the radio itself (aria-describedby points at it while shown), so keyboard users get
     *  it too; a tap or click selects and closes it. The radio stays the group's only Tab
     *  stop. Replaces title. */
    tip?: ReactNode;
    /** The selected look: accent (default), or warn / loss for a choice that must read as
     *  a warning while it is on (a "bypass permissions" mode). */
    tone?: SegmentedTone;
    /** Shown but not selectable; the arrow keys skip it. */
    disabled?: boolean;
}
interface SegmentedProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'role' | 'dir'> {
    /** The radiogroup element. */
    ref?: Ref<HTMLDivElement>;
    /** Name of the whole group for screen readers: "Chart range". */
    label: string;
    options: SegmentedOption<T>[];
    /** The selected value, when you keep the state yourself; a value not among the options
     *  leaves none selected. Leave it out and use `defaultValue` for an uncontrolled control. */
    value?: T | (string & {});
    /** The starting value of an uncontrolled control. */
    defaultValue?: T | (string & {});
    /** Called with the new value. Same as onValueChange; kept for existing code. */
    onChange?: (value: T) => void;
    /** Called with the new value (the form-library friendly name). */
    onValueChange?: (value: T) => void;
    /** Field name for a native form. Hidden radio inputs carry the selection, so FormData
     *  and `<form action>` see it. */
    name?: string;
    /** The id of the `<form>` the hidden inputs belong to, when it is not an ancestor. */
    form?: string;
    /** Marks the group required (aria-required, and the hidden radios block an empty submit). */
    required?: boolean;
    /** xs: 24px for dense widget headers. sm: 28px (default). md: 32px. All grow to 44px
     *  on touch screens. */
    size?: 'xs' | 'sm' | 'md';
    /** Fill the container's width, with equal-width options. */
    block?: boolean;
    /** Too many options for the width: scroll (default) keeps one row that scrolls sideways
     *  with edge fades and keeps the selected option in view; wrap lets the control grow
     *  past its container as before. */
    overflow?: 'wrap' | 'scroll';
    /** @deprecated Alias of `block`; use `block`. Kept because the spec names it. */
    fullWidth?: boolean;
    className?: string;
}
/** A small set of mutually exclusive choices shown side by side (24h / 7d / 30d): a
 *  radio group. The selected option gets the accent tint and ring, so it reads at a
 *  glance in light themes too. Arrow keys, Home and End move the choice and the focus,
 *  like a native radio group. For multi-select toggles use ChipGroup and Chip. */
declare function Segmented<T extends string>({ ref, label, options, value: valueProp, defaultValue, onChange, onValueChange, name, form, required, size, block, overflow, fullWidth, className, onKeyDown, ...rest }: SegmentedProps<T>): react.JSX.Element;

/**
 * Publishes an element's height as a CSS variable on `<html>` (the layout contract:
 * `--nish-header-h`, `--nish-bottom-nav-h`, `--nish-bottom-bar-h`, `--nish-sticky-extra`).
 * The variable is written on mount and on every resize, and removed on unmount, when
 * `enabled` turns false, and while the element is hidden (`display: none` measures 0).
 * When several bars publish the same variable the largest height wins.
 *
 * @param ref - The bar to measure.
 * @param name - The variable name, e.g. `'--nish-header-h'`.
 * @param enabled - Set false to publish nothing (a bar hidden above its breakpoint).
 */
declare function useHeightVar(ref: RefObject<HTMLElement | null>, name: string, enabled?: boolean): void;
/**
 * True while a sticky element is stuck to its scroll edge: the page has scrolled and the
 * element rests at its sticky `top`. False at scroll 0 and for an element that is not
 * position:sticky. Also sets `data-stuck` on the element, so CSS can react without React
 * state. Same rules as `mountStuck` in `@nish/ui/theme`, which it uses: nothing is
 * inserted into the DOM, and the sticky `top` is re-read when the element resizes or
 * `<html>` style changes (`--nish-header-h`).
 *
 * @param ref - The sticky element.
 * @param enabled - Set false to skip observing (a header that is not sticky).
 */
declare function useStuck(ref: RefObject<HTMLElement | null>, enabled?: boolean): boolean;
/**
 * Tracks whether a horizontal scroller is at its start or end and writes
 * `data-at-start` / `data-at-end` ("true" / "false") on it, which `.nish-scroll-fade`
 * turns into edge fades. Updates on scroll, on resize and when children change.
 *
 * @param ref - The scrolling element.
 */
declare function useScrollEdges(ref: RefObject<HTMLElement | null>): void;

/** One destination in BottomNav, MoreSheet and NavRail. */
interface NavItem {
    key: string;
    label: string;
    /** A 20-24px SVG icon drawn in currentColor. */
    icon: ReactNode;
    /** Rendered as an `<a>` unless `renderLink` is given. A URL that is not safe
     *  (`javascript:`, `data:` and so on) removes the item, with a dev warning. */
    href?: string;
    /** Rendered as a `<button>` when there is no href. Also called when an `<a>` is clicked. */
    onSelect?: () => void;
    active?: boolean;
    /** true shows a dot; a number shows a count pill (99+ above 99). */
    badge?: number | boolean;
    /** One line of explanation: shown in MoreSheet rows and as the NavRail tooltip. */
    hint?: string;
}
/** Renders a router link for an item (React Router's `<Link>` and so on). Spread the given
 *  props onto it: `className` carries the look, `children` the icon and label, and
 *  `onClick` runs the item's `onSelect` and closes a sheet. */
type RenderLink = (item: NavItem, props: {
    className: string;
    children: ReactNode;
    'aria-current'?: 'page';
    'data-state'?: 'active' | 'inactive';
    onClick?: () => void;
    /** true when rendered inside a sheet: pass it to the router's `<Link replace>` so the
     *  navigation replaces the sheet's own history entry instead of stacking on it. */
    replace?: boolean;
}) => ReactElement;
type NavBreakpoint = 'md' | 'lg';
interface BottomNavProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {
    /** The `nav` element. */
    ref?: Ref<HTMLElement>;
    /** The destinations. Four or five fit a 360px screen; put the rest behind `more`. */
    items: NavItem[];
    /** A last "More" button that opens a MoreSheet. You own the sheet's open state. */
    more?: {
        /** Default: the provider's `more` string. */
        label?: string;
        icon?: ReactNode;
        /** Highlight the button, e.g. when the current page lives inside the sheet. */
        active: boolean;
        expanded: boolean;
        onToggle: () => void;
    };
    /** Rendered after a thin divider (a search or add button). */
    trailing?: ReactNode;
    /** The breakpoint from which the bar is hidden (default md, 768px). */
    hideFrom?: NavBreakpoint;
    /** Names the nav landmark. Default: the provider's `sections` string. */
    label?: string;
    /** Renders router links instead of plain anchors. */
    renderLink?: RenderLink;
}
/** A phone tab bar fixed to the bottom of the screen: icon over label, the current page
 *  tinted, safe-area padding and 56px targets. It publishes its height as
 *  `--nish-bottom-nav-h` while it is visible, so Toaster, StickyActionBar and page
 *  padding make room for it. Hidden from `hideFrom` up (pair it with NavRail or a sidebar). */
declare function BottomNav({ items, more, trailing, hideFrom, label, renderLink, className, ref: refProp, ...rest }: BottomNavProps): react.JSX.Element;
interface MoreSheetProps {
    open: boolean;
    /** Called on Escape, a scrim click, the swipe, Android back and after a row is chosen. */
    onClose: () => void;
    items: NavItem[];
    /** Default: the provider's `more` string. */
    title?: string;
    /** Pinned under the list. Defaults to a "Theme" row (the provider's `theme` string) with a
     *  segmented ThemeToggle. */
    footer?: ReactNode;
    renderLink?: RenderLink;
}
/** The overflow sheet behind BottomNav's More button: a bottom Drawer lifted above the bar,
 *  so the bar stays visible and tappable. Rows are 52px with an icon, a label and a
 *  one-line hint. Choosing a row navigates and closes the sheet. */
declare function MoreSheet({ open, onClose, items, title, footer, renderLink }: MoreSheetProps): react.JSX.Element | null;
interface NavRailProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {
    /** The `nav` element. */
    ref?: Ref<HTMLElement>;
    items: NavItem[];
    /** A second group under the items, after a divider (settings, search). */
    tools?: ReactNode;
    /** Pinned to the bottom of the rail (a theme toggle, an avatar). */
    footer?: ReactNode;
    /** The breakpoint from which the rail shows (default md, 768px). */
    showFrom?: 'sm' | 'md' | 'lg';
    /** The breakpoint from which it hides again (default lg, 1024px); pass false to keep it. */
    hideFrom?: 'md' | 'lg' | 'xl' | false;
    /** Names the nav landmark. Default: the provider's `sections` string. */
    label?: string;
    renderLink?: RenderLink;
}
/** A 72px icon rail for the unfolded and tablet range between the phone BottomNav and a
 *  full sidebar: each destination is an icon in a pill over an 11px label. The `hint`
 *  shows as a tooltip on mouse hover and keyboard focus. */
declare function NavRail({ items, tools, footer, showFrom, hideFrom, label, renderLink, className, ref: refProp, ...rest }: NavRailProps): react.JSX.Element;
interface ScrollRowProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** The scrolling element (the tag chosen by `as`). */
    ref?: Ref<HTMLElement>;
    children: ReactNode;
    /** Let the row run to the screen edges inside a padded page. */
    bleed?: boolean;
    /** Fade the edges that have more content (default true). */
    fade?: boolean;
    /** Snap children to the start edge while scrolling. */
    snap?: boolean;
    /** Element to render: div (default), ul, ol or nav. */
    as?: 'div' | 'ul' | 'ol' | 'nav';
    /** Accessible name of the row (`aria-label`). */
    label?: string;
}
/** A single horizontally scrolling row (chips, filters, tabs) with edge fades and no
 *  scrollbar. The pressed, selected or current child is scrolled into view when it
 *  changes. */
declare function ScrollRow({ children, bleed, fade, snap, as, label, className, ref: refProp, ...rest }: ScrollRowProps): react.JSX.Element;
/** The id of the section crossing the middle band of the viewport: the last one that
 *  entered it. At the very top of the page, or before any section has been seen, it is
 *  the first id. Sections are looked up with `document.getElementById`.
 *
 *  @param ids - Section ids, in page order.
 *  @param options.rootMargin - The observed band. Default `'-45% 0px -50% 0px'`.
 *  @returns The current id, or null when `ids` is empty. */
declare function useScrollSpy(ids: string[], { rootMargin }?: {
    rootMargin?: string;
}): string | null;
interface SectionNavItem {
    /** The id of the section element on the page. */
    id: string;
    label: string;
    icon?: ReactNode;
    /** A count after the label. */
    count?: number;
}
interface SectionNavProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children' | 'onSelect'> {
    /** The `nav` element. */
    ref?: Ref<HTMLElement>;
    items: SectionNavItem[];
    /** Stick under the app header (default true). */
    sticky?: boolean;
    /** Called with the id after a chip is clicked and the page has been scrolled. */
    onSelect?: (id: string) => void;
    /** Write `#id` with history.replaceState on click (default true). Pass false in apps that
     *  use hash routing. */
    updateHash?: boolean;
    /** Accessible name. Default "On this page" (not "Sections", which the app navs use, so
     *  the two landmarks differ). Translate it per instance. */
    label?: string;
}
/** A row of jump chips for a long page. The chip of the section being read is marked
 *  (`aria-current="true"`) and kept in view; clicking one scrolls to its section. Give the
 *  sections the `nish-scroll-target` class so they stop below the sticky bars. It publishes
 *  its own height as `--nish-sticky-extra`. Chips are 44px on coarse pointers. */
declare function SectionNav({ items, sticky, onSelect, updateHash, label, className, style, ref: refProp, ...rest }: SectionNavProps): react.JSX.Element;

interface StickyBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** The bar element. */
    ref?: Ref<HTMLElement>;
    /** The bar's content: a filter row, a toolbar, a SectionNav. */
    children?: ReactNode;
    /** CSS `top` offset. Defaults to just under the app header (`var(--nish-header-h, 0px)`). */
    top?: string;
    /** Adds a bottom border and a soft shadow once the bar is stuck. Default true. */
    elevate?: boolean;
    /** The element to render. Default `div`. */
    as?: ElementType;
}
/**
 * A bar that sticks under the app header while the page scrolls. Opaque, and its
 * background reaches the screen edges (it bleeds through the page gutter). Publishes its
 * height as `--nish-sticky-extra` while mounted, so anchor links scroll clear of it.
 */
declare function StickyBar({ children, top, elevate, as, className, style, ref: refProp, ...rest }: StickyBarProps): react.JSX.Element;
interface StickyActionBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** The bar element. */
    ref?: Ref<HTMLDivElement>;
    /** Shows the bar. Closed, it renders nothing and publishes no height. */
    open: boolean;
    /** Short text at the start, e.g. "3 changes". Truncates to one line. */
    message?: ReactNode;
    /** The main action, usually a primary Button. */
    primary: ReactNode;
    /** A second action, usually a ghost or secondary Button (Discard, Cancel). */
    secondary?: ReactNode;
    /** Accessible name of the region. Default: the provider's `actions` string. */
    label?: string;
}
/**
 * A bar fixed to the bottom of the screen for the actions of an unsaved form or a
 * selection. Sits above a BottomNav when there is one, and publishes `--nish-bottom-bar-h`
 * while open so page padding and toasts clear it. From sm it floats as a pill at the
 * bottom end.
 */
declare function StickyActionBar({ open, message, primary, secondary, label, className, ref: refProp, ...rest }: StickyActionBarProps): react.JSX.Element | null;
interface LoadingBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** The bar element (rendered after the delay). */
    ref?: Ref<HTMLDivElement>;
    /** True while something loads (a route change, a refetch). */
    active: boolean;
    /** Waits this long before showing, so quick loads never flash a bar. Default 200. */
    delayMs?: number;
    /** CSS `top`. Defaults to just under the app header. */
    top?: string;
    /** Text for screen readers ("Loading page…"). With it set, the bar renders a persistent
     *  polite live region that holds the text while the bar shows (after `delayMs`) and is
     *  emptied when loading ends, so the start is announced. Without it nothing is announced. */
    announce?: string;
}
/**
 * A thin indeterminate progress bar fixed under the app header. Appears only after
 * `delayMs` of being active. With reduced motion it is a static partial bar.
 */
declare function LoadingBar({ active, delayMs, top, announce, className, style, ref, ...rest }: LoadingBarProps): react.JSX.Element;
declare const CONTAINER_SIZE: {
    readonly narrow: "max-w-2xl";
    readonly default: "max-w-4xl";
    readonly wide: "max-w-7xl";
    readonly full: "max-w-none";
};
interface PageContainerProps extends Omit<ComponentPropsWithoutRef<'main'>, 'children'> {
    /** The container element. */
    ref?: Ref<HTMLElement>;
    /** Max width: narrow 42rem, default 56rem, wide 80rem, full none. */
    size?: keyof typeof CONTAINER_SIZE;
    children?: ReactNode;
    /** Adds bottom padding that clears a BottomNav and StickyActionBar. Default true. */
    padBottom?: boolean;
    /** The element to render. Default `main`. */
    as?: ElementType;
}
/**
 * The page's content column: centered, with the shared side gutter and vertical padding,
 * and bottom padding that keeps the last row clear of fixed bottom bars.
 */
declare function PageContainer({ size, children, padBottom, as, className, ref, ...rest }: PageContainerProps): react.JSX.Element;
/** Whether the browser reports a network connection (`navigator.onLine`). True on the server
 *  and in the first client render. */
declare function useOnline(): boolean;
interface ConnectionBannerProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title' | 'onClick'> {
    /** The banner's root element. */
    ref?: Ref<HTMLDivElement>;
    /** A URL to probe with `fetch` (cache: no-store). When it fails or returns a non-2xx
     *  status the banner shows. Leave out to react to the browser's online/offline state only. */
    healthUrl?: string;
    /** Base interval between probes. After failures it doubles up to 4x. Default 30000. */
    intervalMs?: number;
    /** Shown when the probe fails. Default "Can't reach the server". */
    message?: string;
    /** Shown when the browser is offline. Default: the provider's `offline` string. */
    offlineMessage?: string;
    /** Retry button text. Default: the provider's `retry` string. */
    retryLabel?: string;
    /** Called after the Retry button re-probes. */
    onRetry?: () => void;
}
/**
 * A sticky warning bar for lost connectivity. Watches `navigator.onLine` and, with
 * `healthUrl`, probes the server with backoff (and right away when the browser comes back
 * online or the tab becomes visible). Renders nothing while everything is reachable.
 */
declare function ConnectionBanner({ healthUrl, intervalMs, message, offlineMessage, retryLabel, onRetry, ...rest }: ConnectionBannerProps): react.JSX.Element | null;

/** One column of a ResponsiveTable. */
interface Column<T> {
    /** Stable id; also the key of the sort. */
    key: string;
    /** The header text (also the label in cards and in the sort menu). */
    header: string;
    /** Renders the cell for a row. */
    cell: (row: T) => ReactNode;
    /** Makes the column sortable: the comparable value of a row. null sorts last. */
    sortValue?: (row: T) => string | number | null;
    /** A number column: right-aligned, tabular, no wrapping. */
    numeric?: boolean;
    /** In cards, this column is the title. */
    primary?: boolean;
    /** In cards, this column is the subtitle under the title. */
    secondary?: boolean;
    /** Hides the column in the table below this breakpoint. */
    hideBelow?: 'sm' | 'md' | 'lg';
    /** A CSS width for the header cell, e.g. '8rem'. */
    width?: string;
}
/** The sort of a ResponsiveTable: a column key and a direction, or null for none. */
type Sort = {
    key: string;
    dir: 'asc' | 'desc';
} | null;
type CardsBelow = 'sm' | 'md' | 'lg';
/** Words a ResponsiveTable says about sorting. English by default. */
interface SortText {
    /** The live-region message after the sort changes (dir is null when it is cleared). */
    announce?: (header: string, dir: 'asc' | 'desc' | null) => string;
    /** The label of the card-mode direction button, given the current direction. */
    toggle?: (dir: 'asc' | 'desc' | null) => string;
}
interface ResponsiveTableProps<T> extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** The data. */
    rows: T[];
    /** The columns, in table order. Keep the array stable (module level or useMemo): rows only
     *  skip re-rendering while it is the same array. Sorting does not depend on it. */
    columns: Column<T>[];
    /** A stable key for a row. */
    rowKey: (row: T) => string;
    /** Below this breakpoint the rows become cards. Default 'md'. */
    cardsBelow?: CardsBelow;
    /** Called when a row (or card) is activated by click, Enter or Space. */
    onRowClick?: (row: T) => void;
    /** Makes each row a link to this URL (cards become real anchors). A URL that is not safe
     *  (javascript:, data:) is ignored: the row does not navigate. */
    rowHref?: (row: T) => string;
    /** Called with the URL when a row is activated by click or key, so a router can navigate
     *  without a page reload. Without it the table assigns `location`. Card links stay real
     *  anchors. */
    onNavigate?: (href: string) => void;
    /** A 3px edge at the start of a row: ok, warn or loss. Say the status in a cell too. */
    rowTone?: (row: T) => 'ok' | 'warn' | 'loss' | undefined;
    /** The current sort, when you control it. */
    sort?: Sort;
    /** Called with the next sort. With sort or onSortChange given you sort the rows
     *  yourself; without them the table sorts by each column's sortValue. */
    onSortChange?: (sort: Sort) => void;
    /** The table's minimum width before it scrolls sideways. Default 640. */
    minWidth?: number | string;
    /** Keeps the header visible while the body scrolls (give maxHeight too). */
    stickyHeader?: boolean;
    /** Caps the table's height; the body scrolls inside. */
    maxHeight?: number | string;
    /** Pins the first column while the table scrolls sideways. */
    stickyFirstColumn?: boolean;
    /** Shows skeleton rows (table) or skeleton cards instead of the data. */
    loading?: boolean;
    /** Shown when there are no rows. Default: the "nothingHere" string. */
    empty?: ReactNode;
    /** Shows an ErrorState instead of the data. */
    error?: {
        message: string;
        onRetry?: () => void;
    } | null;
    /** The accessible name of the table and the card list. */
    label: string;
    /** Renders a whole card yourself (inside the card's button or link). */
    renderCard?: (row: T) => ReactNode;
    /** Replaces the English sort announcement and direction-button label. */
    sortText?: SortText;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/**
 * A table on wide screens and a list of cards on phones, from one column definition.
 * Sortable headers (and a sort menu in card mode), clickable or linked rows, a status
 * edge per row, loading, empty and error states built in. A sort change is announced to
 * screen readers.
 */
declare function ResponsiveTable<T>({ rows, columns, rowKey, cardsBelow, onRowClick, rowHref, onNavigate, rowTone, sort, onSortChange, minWidth, stickyHeader, maxHeight, stickyFirstColumn, loading, empty, error, label, renderCard, sortText, className, ref, ...rest }: ResponsiveTableProps<T>): react.JSX.Element;
interface ListRowProps extends Omit<ComponentPropsWithoutRef<'li'>, 'title' | 'onClick' | 'children' | 'className'> {
    /** A leading icon or avatar (kept at its size). */
    icon?: ReactNode;
    /** The main line; truncates, or wraps to two lines with `titleLines={2}`. */
    title: ReactNode;
    /** How many lines the title may use before it is cut off. Default 1 (truncates). */
    titleLines?: 1 | 2;
    /** A quieter line under the title; up to two lines. */
    subtitle?: ReactNode;
    /** A right-aligned detail: a date, an amount. */
    meta?: ReactNode;
    /** A control or badge at the far right (outside the meta). */
    trailing?: ReactNode;
    /** Makes the whole row a link. A URL that is not safe (javascript:, data:) makes it a plain row. */
    href?: string;
    /** Makes the whole row a button. */
    onClick?: () => void;
    /** The current item: accent tint and aria-current. */
    active?: boolean;
    /** danger: the title turns loss-red. */
    tone?: 'danger';
    /** Shows a chevron. On by default for a link. */
    chevron?: boolean;
    /** A 44px row instead of 52px. */
    dense?: boolean;
    /** Dense, with an 11px title and 10px subtitle and meta: for small widget tiles. Keeps the 44px target. */
    compact?: boolean;
    /** Opens the link in a new tab with an external icon. */
    external?: boolean;
    /** Classes for the row itself (the link, button or box inside the wrapper). */
    className?: string;
    /** The wrapper element. Default 'li'; pass 'div' outside a list. */
    as?: 'li' | 'div';
    /** The wrapper element. */
    ref?: Ref<HTMLElement>;
}
/** A list row: icon, title, subtitle, meta and a chevron, where the whole row is the link or button. */
declare function ListRow({ icon, title, titleLines, subtitle, meta, trailing, href, onClick, active, tone, chevron, dense, compact, external, className, as: wrapperTag, ref, ...rest }: ListRowProps): react.JSX.Element;
interface FaviconProps extends Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'width' | 'height' | 'alt' | 'children' | 'loading' | 'referrerPolicy' | 'onLoad' | 'onError'> {
    /** The site's address; only the host is used. */
    url: string;
    /** Width and height in px. Default 16. */
    size?: number;
    /** The text whose first letter fills the fallback avatar. Default: the host name. */
    label?: string;
    /** An image to show for this site, used as is (https, http or relative; unsafe URLs are ignored). */
    src?: string;
    /** Turns the host and size into an image URL, or null for the letter avatar. Wins over
     *  configureFavicons. Without a `src`, a `resolve` or a configured resolver, no request is made. */
    resolve?: FaviconResolver;
    ref?: Ref<HTMLElement>;
}
/** A site's favicon, or a colored letter avatar while it loads or when it cannot. Decorative.
 *  Out of the box it makes no network request and shows the letter avatar: pass `src` or
 *  `resolve`, or call `configureFavicons({ resolve: googleFavicon })` once. */
declare function Favicon({ url, size, label, src, resolve, className, style, ref, ...rest }: FaviconProps): react.JSX.Element;
type LinkCardAccent = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}` | 'accent';
interface LinkCardProps extends Omit<ComponentPropsWithoutRef<'a'>, 'title' | 'href' | 'children'> {
    /** Where the card goes. A URL that is not safe (javascript:, data:) makes the card
     *  unavailable, like `disabled`. */
    href: string;
    /** The name. */
    title: string;
    /** A short description. */
    blurb?: string;
    /** A 20px icon or a Favicon, shown in a tinted tile. */
    icon?: ReactNode;
    /** With no `icon`, shows the site's Favicon (from the page's configureFavicons resolver,
     *  else a letter avatar) in the tile. */
    favicon?: boolean;
    /** The tile color. Default 'accent'. */
    accent?: LinkCardAccent;
    /** A small detail line (card layout only). */
    meta?: ReactNode;
    /** A status dot and label. */
    status?: {
        tone: StatusTone;
        label: string;
    };
    /** Anything small at the top right: a Badge, a count. */
    badge?: ReactNode;
    /** Not available yet: dashed border, not a link. */
    disabled?: boolean;
    /** 'card' is a tile, 'row' a 64px row, 'auto' (default) a row until its parent is 600px wide. */
    layout?: 'auto' | 'card' | 'row';
    /** Opens in a new tab. */
    external?: boolean;
    className?: string;
    ref?: Ref<HTMLElement>;
}
/** A big link to another page or app: icon tile, title and blurb. The whole card is the anchor. */
declare function LinkCard({ href, title, blurb, icon, favicon, accent, meta, status, badge, disabled, layout, external, className, ref: forwardedRef, ...rest }: LinkCardProps): react.JSX.Element;
interface AsyncPanelProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Which state to show. */
    status: 'loading' | 'error' | 'empty' | 'ready';
    /** The loading body. Default: SkeletonRows. */
    skeleton?: ReactNode;
    /** The error body. */
    error?: {
        title?: string;
        message: string;
        onRetry?: () => void;
    };
    /** The empty body. */
    empty?: {
        title: string;
        description?: string;
        action?: ReactNode;
    };
    /** The content for status 'ready'. */
    children?: ReactNode;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** Shows a skeleton, an error, an empty state or its children, from one status value. */
declare function AsyncPanel({ status, skeleton, error, empty, children, className, ref, ...rest }: AsyncPanelProps): react.JSX.Element;

/** A series color: one of the eight categorical chart colors, or a status/accent color. */
type ChartTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'chart-7' | 'chart-8' | 'ok' | 'loss' | 'accent';
/** One point of a line series. A null y leaves a gap in the line. */
interface LinePoint {
    x: number;
    y: number | null;
}
/** One named line of a multi-series LineChart. */
interface LineSeries {
    /** Shown in the tooltip and the screen-reader table. */
    label: string;
    /** Default: the categorical color for the series' position. */
    tone?: ChartTone;
    points: LinePoint[];
}
interface LineChartProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** A single series of points. Use this or `series`. */
    data?: LinePoint[];
    /** Several series sharing one x axis. */
    series?: LineSeries[];
    /** Plot height in pixels. Default 200. */
    height?: number;
    /** Fill under the first series with a fading gradient of its color. */
    area?: boolean;
    /** Formats y axis ticks and tooltip values. Default: numbers in `locale`. */
    yFormat?: (v: number) => string;
    /** Formats x axis ticks and the tooltip heading. */
    xFormat?: (v: number) => string;
    /** How many y axis labels. Default 4. */
    yTicks?: number;
    /** How many x axis labels. Default 4. */
    xTicks?: number;
    /** A dashed horizontal reference line, e.g. the previous close. */
    baseline?: number;
    /** Color of the single `data` series. Default chart-1. */
    tone?: ChartTone;
    /** Accessible name of the chart. */
    label: string;
    /** Show a skeleton of the same height. */
    loading?: boolean;
    /** Shown when there are no points. Default: the "noData" string. */
    empty?: ReactNode;
    /** The locale of the default axis numbers. Default: the provider's locale, else en-US. */
    locale?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A dependency-free SVG line chart that fills its container's width. Gaps (null y)
 *  break the line. Hover, touch-drag or Left/Right keys move a crosshair with a
 *  tooltip; vertical swipes still scroll the page. A hidden table carries the data for
 *  screen readers. Long series are reduced to at most two points per pixel column
 *  (the lowest and highest of each), so spikes survive. In right-to-left layouts the
 *  x axis runs right to left and the arrow keys follow. */
declare function LineChart({ data, series, height, area, yFormat, xFormat, yTicks, xTicks, baseline, tone, label, loading, empty, locale, className, ref, ...rest }: LineChartProps): react.JSX.Element;
interface BarChartProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** One bar per entry, in order. */
    data: {
        label: string;
        value: number;
    }[];
    /** Plot height in pixels. Default 140. */
    height?: number;
    /** Bar color. Default chart-1. */
    tone?: ChartTone;
    /** Formats values above the bars and in the caption. Default: numbers in `locale`. */
    valueFormat?: (v: number) => string;
    /** 'always' prints every value above its bar; 'auto' (default) does so on touch
     *  screens only, where there is no hover. */
    showValues?: 'always' | 'auto';
    /** 'ends' (default) labels the first and last bar; 'all' labels every bar. */
    xTicks?: 'ends' | 'all';
    /** Accessible name of the chart. */
    label: string;
    /** Shown when there are no bars. Default: the "noData" string. */
    empty?: ReactNode;
    /** The locale of the default value format. Default: the provider's locale, else en-US. */
    locale?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A dependency-free SVG bar chart that fills its container's width. Hover, tap or
 *  Left/Right keys select a bar and show "label: value" under the chart. A hidden table
 *  carries the data for screen readers. In right-to-left layouts the first bar is at the
 *  right and the arrow keys follow. */
declare function BarChart({ data, height, tone, valueFormat, showValues, xTicks, label, empty, locale, className, ref, ...rest }: BarChartProps): react.JSX.Element;
interface RangeBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** The track's lower end (e.g. the 52-week low). */
    min: number;
    /** The track's upper end. */
    max: number;
    /** Start of the highlighted segment (e.g. today's low). */
    low: number;
    /** End of the highlighted segment. */
    high: number;
    /** Marks a value (e.g. the current price) with a dot. */
    current?: number;
    /** The accessible name. Default (English): "Range low to high, current x, within min to max". */
    label?: string;
    /** The locale of the numbers in the default name. Default: the provider's locale, else en-US. */
    locale?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A thin range track with a highlighted low-to-high segment and an optional dot for
 *  the current value: daily temperature ranges, a price's day range. The track starts at
 *  the start edge, so it mirrors in right-to-left layouts. */
declare function RangeBar({ min, max, low, high, current, label, locale, className, ref, ...rest }: RangeBarProps): react.JSX.Element;

/** One row of the palette. */
interface CommandItem {
    /** Stable key, unique within the list. */
    id: string;
    /** What the row says and what the query matches. */
    label: string;
    /** Section heading the row sits under. Rows without a group come first. */
    group?: string;
    /** Short right-aligned text (a shortcut, a path, a type). */
    hint?: string;
    /** Extra words the query also matches (ranked below the label). */
    keywords?: string[];
    /** A 16-20px icon shown before the label. */
    icon?: ReactNode;
    /** Navigate here on select (`location.assign`, or a new tab when `external`). Passed through
     *  `safeUrl`: a `javascript:` or `data:` URL does nothing (a dev warning names it). */
    href?: string;
    /** Open `href` in a new tab. */
    external?: boolean;
    /** Called on select when there is no `href` (or after it, never both: href wins). */
    onSelect?: () => void;
}
interface CommandPaletteProps {
    /** Whether the palette is showing. */
    open: boolean;
    /** Called with false on Escape, a backdrop click, the close button and after a select;
     *  called with true by the hotkeys. */
    onOpenChange: (open: boolean) => void;
    /** The searchable items, or a function from the query to items (sync or async) for
     *  server-side or dynamic search. A function's results are shown as returned, in order. */
    items: CommandItem[] | ((q: string) => CommandItem[] | Promise<CommandItem[]>);
    /** Placeholder of the search field. Default 'Search…'. */
    placeholder?: string;
    /** Text shown when nothing matches. Default 'No results'. */
    emptyText?: string;
    /** Screen-reader announcement of the result count. Default "3 results". */
    resultsLabel?: (count: number) => string;
    /** Accessible name of the "opens in a new tab" mark on external rows. Default 'opens in a new tab'. */
    externalLabel?: string;
    /** Open with Ctrl/Cmd+K, and with `/` when focus is not in a field (default true). */
    hotkey?: boolean;
    /** Called on every keystroke with the new query. */
    onQuery?: (q: string) => void;
    /** Content pinned under the results (a hint line, a link to full search). */
    footer?: ReactNode;
    /** Called with the query when Enter is pressed and nothing matches (e.g. a web search). */
    onSubmitQuery?: (q: string) => void;
}
/** Navigates after the layer that is closing has dropped its own history entry. Running
 *  `history.back()` (the layer's cleanup) right after `location.assign` would cancel the
 *  navigation, so wait for that pop to finish. Call it before closing the layer. */
declare function navigateFromLayer(rawHref: string): void;
/**
 * Registers the palette hotkeys: Ctrl/Cmd+K anywhere, and `/` when focus is not in a
 * field. For apps that render their own trigger or palette.
 *
 * @param open - Called when a hotkey fires.
 * @param enabled - Set false to listen to nothing (default true).
 */
declare function useCommandHotkey(open: () => void, enabled?: boolean): void;
/** Search-and-jump dialog. A full-height sheet with the field on top under 640px, a
 *  centered 560px panel from there up. Fuzzy matching (prefix, word start, substring,
 *  then subsequence), grouped rows, arrow keys, Enter, and Ctrl/Cmd+K and `/` hotkeys. */
declare function CommandPalette({ open, onOpenChange, items, placeholder, emptyText, resultsLabel, externalLabel, hotkey, onQuery, footer, onSubmitQuery, }: CommandPaletteProps): react.JSX.Element | null;

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
/** Tailwind's breakpoints, in px. Phone = below sm; narrow = below md (cover screen and small tablets). */
declare const BREAKPOINTS: {
    readonly sm: 640;
    readonly md: 768;
    readonly lg: 1024;
    readonly xl: 1280;
};
declare const PHONE_QUERY = "(max-width: 639.98px)";
declare const NARROW_QUERY = "(max-width: 767.98px)";

/** True while the CSS media query matches. False on the server and in the first client render, then follows the query. */
declare function useMediaQuery(query: string): boolean;
/** True below 640px (the Fold's cover screen, any phone held upright). */
declare function usePhone(): boolean;
/** True below 768px: where BottomNav shows and NavRail hides. */
declare function useNarrow(): boolean;
/** The largest Tailwind breakpoint the viewport has reached: base, sm (640), md (768), lg (1024) or xl (1280). */
declare function useBreakpoint(): Breakpoint;
/**
 * Sets document.title to "title · app" (or just the app, or just the title) and restores
 * the previous title on unmount. An undefined title with no app leaves the title alone.
 */
declare function useDocumentTitle(title: string | undefined, o?: {
    app?: string;
}): void;
/** Date.now() that updates every intervalMs, paused while the tab is hidden. */
declare function useNow(intervalMs?: number): number;
/**
 * State kept in localStorage. JSON by default, the raw string with { raw: true }. Never
 * throws (private mode, quota and bad JSON fall back to the initial value) and follows
 * changes from other tabs (`storage` events) and from other hooks on the same key. The
 * server and the first client render return `initial`.
 */
declare function useLocalStorage<T>(key: string, initial: T, o?: {
    raw?: boolean;
}): [T, (next: T | ((prev: T) => T)) => void];
interface RelativeTimeProps extends Omit<ComponentPropsWithoutRef<'time'>, 'children' | 'dateTime' | 'style'> {
    /** The moment: a Date, epoch milliseconds or a date string. */
    value: Date | number | string;
    /** "3m ago" (short, default) or "3 minutes ago" (long). This is the text style, so the inline `style` attribute is not accepted: use className. */
    style?: 'short' | 'long';
    /** How often the text refreshes, in milliseconds. Default 30000. */
    refreshMs?: number;
    /** Language of the words. Default NishProvider locale, then setDefaultLocale() (en-US). */
    locale?: string;
    /** Classes for the time element. */
    className?: string;
    ref?: Ref<HTMLTimeElement>;
}
/** A self-updating "3m ago". The full date and time show on hover and in the dateTime attribute. */
declare function RelativeTime({ value, style: textStyle, refreshMs, locale, className, ref, ...rest }: RelativeTimeProps): react.JSX.Element;

/** True while the viewer asks for reduced motion. False on the server and before hydration. */
declare function usePrefersReducedMotion(): boolean;
type FlowStepStatus = 'pending' | 'active' | 'done' | 'failed';
interface FlowStepItem {
    id: string;
    label: ReactNode;
    status: FlowStepStatus;
    meta?: ReactNode;
}
interface FlowStepsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    steps: FlowStepItem[];
    /** auto: horizontal when the container is at least 640px wide and there are at most 8 steps; else vertical. */
    orientation?: 'auto' | 'vertical' | 'horizontal';
    /** aria-label of the list. Default "Progress". */
    label?: string;
    /** Screen-reader words after a finished or failed step. Default ", done" and ", failed". */
    statusLabels?: Partial<Record<'done' | 'failed', string>>;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A plan as a flow of steps: numbered nodes joined by connectors that fill as steps
 *  finish. The active step ripples, a finishing step draws its check, a failing one
 *  shakes, and when the last step finishes a sweep runs along the connectors. Vertical on
 *  narrow containers, horizontal from 640px (up to 8 steps). */
declare function FlowSteps({ steps, orientation, label, statusLabels, className, ref, ...rest }: FlowStepsProps): react.JSX.Element;
interface StepBarProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    total: number;
    done: number;
    /** pulses the current segment */
    active?: boolean;
    /** aria-label. Default "Progress". */
    label?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}
/** A compact progress bar of segments, one per step (a continuous bar above 12). Done
 *  segments fill in, the current one pulses while `active`. */
declare function StepBar({ total, done, active, label, className, ref, ...rest }: StepBarProps): react.JSX.Element;
interface TickerTextProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children' | 'title'> {
    text: string;
    as?: 'span' | 'p' | 'div';
    className?: string;
    ref?: Ref<HTMLElement>;
}
/** One line of text that swaps with a short slide when it changes: the old text rises and
 *  fades out while the new text comes up from below. Long text ends in an ellipsis. */
declare function TickerText({ text, as, className, ref, ...rest }: TickerTextProps): react.JSX.Element;
type AgentNodeState = 'queued' | 'running' | 'done' | 'failed';
interface AgentNodeProps extends Omit<ComponentPropsWithoutRef<'article'>, 'onClick' | 'children' | 'aria-label'> {
    label: string;
    state: AgentNodeState;
    /** Short model name; opus, sonnet, haiku and fable get their own badge hue. */
    model?: string | null;
    activity?: string;
    /** Right-aligned small text, e.g. elapsed time. */
    meta?: ReactNode;
    onClick?: () => void;
    /** Words for the state in the accessible name ("label: Running"). Default Queued, Running, Done, Failed. */
    stateLabels?: Partial<Record<AgentNodeState, string>>;
    className?: string;
    /** The card (an article, or a button with onClick). */
    ref?: Ref<HTMLElement>;
}
/** One agent or task as a card: state icon, label, model badge, a live activity line.
 *  A running agent has a comet of accent circling its border; finishing pops the check;
 *  failing shakes once. Pass `onClick` to make the card a button. */
declare function AgentNode({ label, state, model, activity, meta, onClick, stateLabels, className, ref: refProp, ...rest }: AgentNodeProps): react.JSX.Element;
interface WorkflowBoardPhase {
    id: string;
    title: string;
    detail?: ReactNode;
    model?: string | null;
}
interface WorkflowBoardAgent extends Omit<AgentNodeProps, 'className' | 'onClick'> {
    id: string;
    /** phase id or title */
    phase: string | null;
}
interface WorkflowBoardProps extends Omit<ComponentPropsWithoutRef<'section'>, 'children'> {
    phases: WorkflowBoardPhase[];
    agents: WorkflowBoardAgent[];
    /** aria-label. Default "Workflow". */
    label?: string;
    /** Title of the column for agents without a phase. Default "Other". */
    otherLabel?: string;
    /** Text of an empty phase. Default "Waiting". */
    waitingLabel?: string;
    className?: string;
    ref?: Ref<HTMLElement>;
}
/** A workflow as columns of phases (stacked on narrow containers), each phase holding its
 *  agents as AgentNodes. A phase waits, glows while an agent runs and gets a check when
 *  all its agents finish; new agents rise in, staggered. */
declare function WorkflowBoard({ phases, agents, label, otherLabel, waitingLabel, className, ref, ...rest }: WorkflowBoardProps): react.JSX.Element;
interface ActivityItem {
    id: string;
    at: number;
    text: ReactNode;
    tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'loss';
    source?: ReactNode;
}
interface ActivityFeedProps extends Omit<ComponentPropsWithoutRef<'ol'>, 'children'> {
    items: ActivityItem[];
    /** default 50 */
    max?: number;
    now?: number;
    /** default "Activity" */
    label?: string;
    /** Shown when there are no items. Default "No activity yet". */
    empty?: ReactNode;
    className?: string;
    /** The list (a div holding the empty text when there are no items). */
    ref?: Ref<HTMLElement>;
}
/** A timeline of short updates, newest first. A new update opens its row, fades in and
 *  flashes the accent tint. Items present on the first render do not animate. */
declare function ActivityFeed({ items, max, now, label, empty, className, ref, ...rest }: ActivityFeedProps): react.JSX.Element;
interface AnimatedListProps<T> extends Omit<ComponentPropsWithoutRef<'ul'>, 'children'> {
    items: T[];
    getKey: (item: T) => string;
    children: (item: T, phase: 'enter' | 'idle' | 'exit') => ReactNode;
    /** How long a removed item stays to animate out. Default 420. */
    exitMs?: number;
    as?: 'ul' | 'ol' | 'div';
    className?: string;
    itemClassName?: string;
    /** The list element. */
    ref?: Ref<HTMLElement>;
}
/** A list whose items animate: new ones rise in, removed ones fade and close the gap
 *  before they are dropped, and the rest slide to their new place (FLIP). The render
 *  function gets each item's phase. Under reduced motion changes are instant. */
declare function AnimatedList<T>({ items, getKey, children, exitMs, as, className, itemClassName, ref, ...rest }: AnimatedListProps<T>): react.JSX.Element;

/** How loud an event is: `info` is listed only, `normal` is pushed, `urgent` is pushed even in quiet hours. */
type InboxSeverity = 'info' | 'normal' | 'urgent';
/** Which list the Inbox page shows. */
type InboxView = 'open' | 'snoozed' | 'handled';
/** Flat extra data attached to an event. */
type InboxData = Record<string, string | number | boolean | null>;
/** A button on an inbox item. Tapping it makes the inbox service POST an {@link InboxActionCall} to `target`,
 *  server to server, and records the outcome on the item. */
interface InboxAction {
    /** Unique within the event, matching /^[a-z0-9][a-z0-9-]{0,31}$/, for example 'retry' or 'approve'. */
    id: string;
    /** Button text, trimmed, 1-40 characters. Longer text is cut to 39 plus an ellipsis. */
    label: string;
    /** Always 'POST'. May be left out when sending. */
    method: 'POST';
    /** Loopback only: `http://127.0.0.1:<port>/path`, with an explicit port, no credentials and no #hash. Up to 2000 characters. */
    target: string;
}
/** The outcome of the last action run on an item. */
interface InboxActionResult {
    /** Which action ran. */
    actionId: string;
    /** True when the target answered 2xx; the item is then handled by the user. */
    ok: boolean;
    /** The target's HTTP status, or null on a timeout or network error. */
    status: number | null;
    /** What went wrong, or null on success. */
    error: string | null;
    /** When it ran, ISO. */
    at: string;
}
/** The JSON body the inbox service POSTs to an action's target, with the header `X-Inbox-Action: 1`.
 *  Answer 2xx within {@link INBOX_ACTION_TIMEOUT_MS} for success; anything else is recorded as a failure. */
interface InboxActionCall {
    /** The inbox item's id. */
    itemId: number;
    /** Which action was tapped. */
    actionId: string;
    /** The item's source. */
    source: string;
    /** The item's kind. */
    kind: string;
    /** The item's dedupeKey, or null. */
    dedupeKey: string | null;
    /** The item's extra data, or null. */
    data: InboxData | null;
}
/** Header the inbox service sends on every action call, with the value '1'. */
declare const INBOX_ACTION_HEADER = "X-Inbox-Action";
/** How long the inbox service waits for an action's target before recording a timeout. */
declare const INBOX_ACTION_TIMEOUT_MS = 8000;
/** What the service returns to the page. Times are ISO strings. */
interface InboxItem {
    /** Row id. */
    id: number;
    /** Which app sent it. */
    source: string;
    /** What happened. */
    kind: string;
    /** Headline. */
    title: string;
    /** Details, or null. */
    body: string | null;
    /** Link, or null. */
    url: string | null;
    /** Current severity (the highest seen while open). */
    severity: InboxSeverity;
    /** How many events merged into this item. */
    count: number;
    /** When the item was first created. */
    createdAt: string;
    /** When the item last changed. */
    updatedAt: string;
    /** When the latest event happened. */
    occurredAt: string;
    /** When the item was handled, or null while open. */
    handledAt: string | null;
    /** Who handled it, or null while open. */
    handledBy: 'user' | 'source' | 'expired' | null;
    /** When a snoozed item comes back, or null. */
    snoozedUntil: string | null;
    /** Extra data, or null. */
    data: InboxData | null;
    /** Buttons from the latest event. The service always sends this ([] when none); optional for older services. */
    actions?: InboxAction[];
    /** The last action run on this item, or null. */
    lastAction?: InboxActionResult | null;
}
/** Inbox settings, editable on the page. */
interface InboxSettings {
    /** IANA time zone used for quiet hours and the digest. */
    timezone: string;
    /** Normal pushes are held between start and end; urgent ones still go. Times are 'HH:MM' 24h. */
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    /** One summary push a day at `time` ('HH:MM' 24h). */
    digest: {
        enabled: boolean;
        time: string;
    };
    /** Sources that never push. */
    mutedSources: string[];
}
/** Settings used until they are changed on the Inbox page. */
declare const INBOX_DEFAULT_SETTINGS: InboxSettings;
/** Display names for known sources; unknown ids show as-is. */
declare const INBOX_SOURCE_LABELS: Record<string, string>;
/** One page of the item list plus counts for the tabs and source filter. */
interface InboxListResponse {
    /** Items in the requested view, newest first. */
    items: InboxItem[];
    /** Pass back to fetch the next page, or null at the end. */
    nextCursor: string | null;
    /** Item counts per view, and open items that are urgent. */
    counts: {
        open: number;
        snoozed: number;
        handled: number;
        urgent: number;
    };
    /** Every source with any item in the last 30 days, with its open count for the current view filter. */
    sources: Array<{
        id: string;
        open: number;
    }>;
}

/** Text the Inbox shows that has no key in `NishStrings`. Give any of them to `Inbox` as `labels`;
 *  each one wins over its English default. */
interface InboxLabels {
    /** Names of the severity dots. */
    urgent: string;
    normal: string;
    info: string;
    /** Snooze menu entries. */
    snooze1h: string;
    snooze4h: string;
    snoozeTomorrow: string;
    snoozeMonday: string;
    /** Button of a snoozed item. */
    unsnooze: string;
    /** Button of a handled item. */
    moveBack: string;
    /** "Mark all handled" button, and the confirm dialog's title. */
    markAllHandled: string;
    markAllTitle: (count: number) => string;
    /** The "All" chip of the source filter. */
    all: string;
    loadMore: string;
    /** Collapses a long body. The expand button is the `more` string. */
    less: string;
    /** "Until 14:00" under a snoozed item. */
    until: (when: string) => string;
    /** "Handled 2 hours ago" under a handled item, then optionally the suffix for who handled it. */
    handledAgo: (when: string) => string;
    handledByApp: string;
    handledAutomatically: string;
    /** "Retry ran 14:02" and "Retry failed 14:02 · HTTP 500". `why` is null when nothing is known. */
    actionRan: (label: string, at: string) => string;
    actionFailed: (label: string, at: string, why: string | null) => string;
    /** The empty list of each view; `source` is the name of the filtered source, or null. */
    emptyOpen: (source: string | null) => string;
    emptySnoozed: (source: string | null) => string;
    emptyHandled: (source: string | null) => string;
}
declare const DEFAULT_INBOX_LABELS: InboxLabels;

interface InboxProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> {
    ref?: Ref<HTMLElement>;
    /** The items of the current view, newest activity first. */
    items: InboxItem[];
    /** Which list is showing: open, snoozed or handled. */
    view: InboxView;
    /** Called when a tab is picked. */
    onViewChange: (view: InboxView) => void;
    /** Totals for the tabs. Open and snoozed show as counts on their tabs. */
    counts: {
        open: number;
        snoozed: number;
        handled: number;
    };
    /** Sources for the filter chips, each with its open count. The filter row is hidden with one source or fewer. */
    sources: Array<{
        id: string;
        open: number;
    }>;
    /** The source the list is filtered to, or null for all. */
    source: string | null;
    /** Called when a source chip is picked; null means "All". */
    onSourceChange: (source: string | null) => void;
    /** Marks an item handled. */
    onHandle: (id: number) => void;
    /** Moves a handled item back to open. */
    onUnhandle: (id: number) => void;
    /** Snoozes an item until the given time. */
    onSnooze: (id: number, until: Date) => void;
    /** Brings a snoozed item back now. */
    onUnsnooze: (id: number) => void;
    /** Runs one of an item's actions (the inbox service's POST /api/items/:id/actions/:actionId). When given,
     *  each item's actions show as buttons in the open and snoozed views. While the promise is pending that
     *  button shows a spinner and the item's other actions are disabled. A rejection is ignored here; toast it. */
    onAction?: (itemId: number, actionId: string) => Promise<void>;
    /** Shows "Mark all handled" in the open view when given and there are items. A confirmation comes first. */
    onHandleAll?: () => void;
    /** First load: shows skeleton rows in place of the list. */
    loading?: boolean;
    /** A failed load: shows an ErrorState with this text as the body. */
    error?: string | null;
    /** Shows a Retry button on the error state. */
    onRetry?: () => void;
    /** More items exist after the last one: shows "Load more". */
    hasMore?: boolean;
    /** Called by "Load more". */
    onLoadMore?: () => void;
    /** "Load more" shows a spinner and is disabled while the next page loads. */
    loadingMore?: boolean;
    /** The item to highlight and scroll into view once (a link from a notification). */
    selectedId?: number | null;
    /** Display names per source id. Default INBOX_SOURCE_LABELS; unknown ids show as they are. */
    sourceLabels?: Record<string, string>;
    /** Text that has no key in the provider's strings (snooze options, messages). Each wins over its English default. */
    labels?: Partial<InboxLabels>;
    /** Classes for the card. */
    className?: string;
}
/** One inbox for events from every app: Open, Snoozed and Handled views, a source filter, and per-item
 *  handle, snooze and undo actions. The page owns the data and the calls; this component only renders
 *  and reports what was picked. Rows wrap at phone widths and the actions collapse into one menu under 480px. */
declare function Inbox({ items, view, onViewChange, counts, sources, source, onSourceChange, onHandle, onUnhandle, onSnooze, onUnsnooze, onHandleAll, onAction, loading, error, onRetry, hasMore, onLoadMore, loadingMore, selectedId, sourceLabels, labels: labelOverrides, className, ref, ...rest }: InboxProps): react.JSX.Element;

interface AppShellSidebar {
    /** Controlled collapsed state; pair it with onCollapsedChange. */
    collapsed?: boolean;
    /** Collapsed state on first load when uncontrolled. Default false. */
    defaultCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    /** localStorage key that remembers the uncontrolled state across visits. Default
     *  "nish-sidebar-collapsed"; false keeps it in memory only. */
    storageKey?: string | false;
    /** Buttons above the nav (search, an assistant). Give them labels: collapsed, they stack as
     *  icons. Below 1024px, where there is no sidebar, they show in the header before `actions`. */
    tools?: ReactNode;
    /** Next to the collapse button at the bottom. Sidebar only: put anything people need on a
     *  phone in `actions` or `moreItems` too. */
    footer?: ReactNode;
}
interface AppShellProps {
    /** App name (wordmark) and icon for the header. */
    name: ReactNode;
    icon?: ReactNode;
    /** Replaces the header's icon and name, and their home link, with your own node (a
     *  profile switcher, a wordmark with a subtitle). It is not wrapped in a link. */
    brand?: ReactNode;
    /** Home link on the icon and name. Default "/". */
    homeHref?: string;
    /** A pill at the start of the header that links back to a hub site ("← nish.software"). Default false: no pill. The nish.software apps pass `{ href: 'https://nish.software', label: 'nish.software' }`. */
    hub?: AppHeaderHub | false;
    /** Every destination, in order. All show in the rail and the desktop header nav (or the sidebar); the BottomNav shows the first `primary` and puts the rest in a MoreSheet. Empty or left out, the shell has no nav at all (no tabs, rail, sidebar, BottomNav or sheet): the signed-out frame. */
    nav?: NavItem[];
    /** How many items the BottomNav shows before "More". Default 4; when nav.length <= 5 all fit and there is no More. */
    primary?: number;
    /** Extra MoreSheet-only items (settings, sign out) shown after the overflow nav items. From md up they sit in a "More" menu in the header. Give them `onSelect`: the menu runs it, and only follows `href` (a full page load) when there is no `onSelect`. */
    moreItems?: NavItem[];
    renderLink?: RenderLink;
    /** Names the nav landmark (header tabs, rail, sidebar nav and BottomNav; only one shows at a time). Default: the provider's `sections` string. */
    navLabel?: string;
    /** id of the `main` element and target of the skip link. Default "nish-main"; give each shell on a page its own. */
    mainId?: string;
    /** Header buttons before the theme toggle. */
    actions?: ReactNode;
    /** Replaces the header's ThemeToggle; false hides it. */
    themeToggle?: ReactNode | false;
    /** Pinned to the bottom of the NavRail. */
    railFooter?: ReactNode;
    /** Shows the top LoadingBar. */
    loading?: boolean;
    /** Passed to ConnectionBanner; false hides the banner. Default {} (browser online state only). */
    connection?: ConnectionBannerProps | false;
    /** App banners (a live alert, a maintenance notice) under the ConnectionBanner, in one
     *  sticky stack under the header. Its height is published as --nish-banners-h. */
    banner?: ReactNode;
    /** From 1024px, show the nav as a left sidebar that collapses to icons, instead of header
     *  tabs. true for the defaults; the collapsed state is remembered in localStorage. */
    sidebar?: boolean | AppShellSidebar;
    /** PageContainer size, or false to render children with no container (full-bleed pages). Default 'default'. */
    container?: PageContainerProps['size'] | false;
    /** Toaster props, or false when the app renders its own. Default {}. */
    toaster?: ToasterProps | false;
    /** Wraps the page in AppErrorBoundary (reset on resetKey change). Default true. */
    errorBoundary?: boolean;
    /** Changes reset the error boundary and close the MoreSheet (pass the pathname). */
    resetKey?: string;
    children: ReactNode;
}
/**
 * The app frame: skip link, header with desktop tabs, loading bar, connection banner, the
 * NavRail (768 to 1023px), the BottomNav with a More sheet (under 768px), the page
 * container, an error boundary and the Toaster, all from one `nav` list.
 * Under 768px the BottomNav shows, from 768px the rail, from 1024px tabs in the header (or
 * the sidebar). With no nav it is the signed-out frame: header, banners and page only.
 */
declare function AppShell({ name, icon, brand, homeHref, hub, nav: navProp, primary, moreItems: moreItemsProp, renderLink, navLabel: navLabelProp, mainId, actions, themeToggle, railFooter, loading, connection, banner, sidebar, container, toaster, errorBoundary, resetKey, children, }: AppShellProps): react.JSX.Element;

declare class ApiError extends Error {
    /** HTTP status; 0 = network failure or abort-by-timeout. */
    readonly status: number;
    /** Parsed JSON body when the response had one, else the text, else null. */
    readonly body: unknown;
    readonly url: string;
    constructor(message: string, o: {
        status: number;
        body?: unknown;
        url: string;
    });
    /** True for 0 (network) and 5xx: worth retrying. */
    get retryable(): boolean;
}
interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
    /** Serialized as JSON with content-type application/json. A string/FormData/Blob is sent as is. */
    body?: unknown;
    /** Aborts and throws ApiError(status 0, message "The server took too long to answer.") after this many ms (covers the body read too). Default 15000. */
    timeoutMs?: number;
    /** Resolve null instead of throwing on 404. */
    nullOn404?: boolean;
}
interface ApiConfig {
    /** Prefixed to relative paths that start with "/". Default "". */
    baseUrl?: string;
    /** Called (once per response) for any 401 before the error is thrown. */
    onUnauthorized?: (err: ApiError) => void;
    /** Extra headers on every request (an auth token for an Electron app). Sent only to
     *  same-origin URLs (and to `baseUrl`'s origin) unless `headersFor` allows the URL. */
    headers?: () => Record<string, string>;
    /** Return true to send the `headers()` to this (cross-origin) URL too. Called with the
     *  request URL; never called for a same-origin URL, which always gets them. */
    headersFor?: (url: string) => boolean;
}
/** Merges into the module-level config used by every apiFetch call. */
declare function configureApi(c: ApiConfig): void;
/** fetch with JSON in and out, a timeout, and a typed ApiError for every failure. */
declare function apiFetch<T = unknown>(path: string, o?: ApiFetchOptions): Promise<T>;

interface UseResourceOptions<T> {
    /** Poll every N ms while the tab is visible. Off by default. After a failed load the wait doubles per
     *  failure (with up to 10% jitter) up to 5 minutes, and returns to N ms after the next success. */
    intervalMs?: number;
    /** false skips fetching (dependent queries). Default true. */
    enabled?: boolean;
    /** Refetch when the tab becomes visible again after being hidden ≥ this many ms. Default 30000; 0 = always; false = never. */
    refetchOnVisible?: number | false;
    /** Refetch when the browser comes back online. Default true. */
    refetchOnReconnect?: boolean;
    /** Seed data shown before the first load finishes. */
    initialData?: T;
    /** Keep the previous key's data while a new key loads. Default true. */
    keepPrevious?: boolean;
}
interface Resource<T> {
    data: T | undefined;
    /** Cleared by the next successful load. */
    error: ApiError | Error | undefined;
    /** True only while there is no data yet. */
    loading: boolean;
    /** True during any fetch, including background refreshes. */
    refreshing: boolean;
    /** When data last loaded successfully (ms epoch), or undefined. */
    updatedAt: number | undefined;
    /** With intervalMs: true when the last success is older than 3 intervals. Always false without intervalMs. */
    stale: boolean;
    /** Refetch now (never joins a request that is already running). Resolves when done; never rejects. */
    reload: () => Promise<void>;
    /** Replace data locally (optimistic update). A function gets the previous data. A response that was
     *  requested before the mutate and arrives after it does not overwrite it. */
    mutate: (next: T | ((prev: T | undefined) => T)) => void;
}
/** key: a string identifying the request (the URL); null disables. fetcher defaults to apiFetch(key, { signal }). */
declare function useResource<T>(key: string | null, fetcher?: (signal: AbortSignal) => Promise<T>, o?: UseResourceOptions<T>): Resource<T>;

interface AppErrorBoundaryProps {
    children: ReactNode;
    /** Replaces the default fallback. */
    fallback?: (o: {
        error: Error;
        reset: () => void;
    }) => ReactNode;
    /** Called once per caught error (send to a log endpoint). */
    onError?: (error: Error, info: {
        componentStack?: string | null;
    }) => void;
    /** When any value changes, a shown error resets (pass [location.pathname] to reset on navigation). */
    resetKeys?: unknown[];
    /** Show the error message and stack in the default fallback. Default: only outside production
     *  (`process.env.NODE_ENV !== 'production'`), so end users never see internals. */
    showDetails?: boolean;
}
/** Catches render errors below it and shows a themed fallback with a way to recover. The
 *  default fallback shows the message and stack only outside production or with `showDetails`. */
declare function AppErrorBoundary(props: AppErrorBoundaryProps): react.JSX.Element;

interface FilterSheetProps {
    open: boolean;
    onClose: () => void;
    /** Heading of the sheet. Default: the `filters` string ("Filters"). */
    title?: string;
    children: ReactNode;
    /** Shows a ghost "Clear" button in the footer. */
    onClear?: () => void;
    /** Disables Clear while it is 0. */
    activeCount?: number;
    /** Text of the primary footer button, e.g. "Show 42 results". Default: the `done` string ("Done"). */
    resultLabel?: string;
}
/** A bottom sheet for the filter controls of a FilterBar on a phone. Footer: Clear and a
 *  primary button that closes the sheet. */
declare function FilterSheet({ open, onClose, title, children, onClear, activeCount, resultLabel }: FilterSheetProps): react.JSX.Element | null;
interface FilterBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    /** Search box value and change handler. Leave out for no search box. */
    search?: {
        value: string;
        onChange: (v: string) => void;
        placeholder?: string;
        label?: string;
    };
    /** The filter controls (Chips, Selects, Segmented). Shown inline from md up; behind the Filters button below md. */
    children?: ReactNode;
    /** How many filters differ from their defaults: shown as a count on the Filters button. */
    activeCount?: number;
    /** Shows "Clear" when activeCount > 0 (inline from md, in the sheet footer below md). */
    onClear?: () => void;
    /** Right-aligned extras that stay visible at every width (a sort Select, a view toggle). */
    trailing?: ReactNode;
    /** Sticks under the header (top: var(--nish-header-h)). Default false. */
    sticky?: boolean;
    /** Title of the phone sheet. Default: the `filters` string ("Filters"). */
    sheetTitle?: string;
    /** Below this breakpoint the children move into the FilterSheet. Default 'md' (768); 'lg' (1024) for wide filter sets. */
    sheetBelow?: 'md' | 'lg';
    /** Result count line under the bar, e.g. "42 jobs". */
    summary?: ReactNode;
    className?: string;
}
/** The search and filter row of a list page. From md up the controls sit inline; below md
 *  they move into a bottom sheet behind a Filters button that shows how many are on. */
declare function FilterBar({ search, children, activeCount, onClear, trailing, sticky, sheetTitle, sheetBelow, summary, className, ref, ...rest }: FilterBarProps): react.JSX.Element;

/** Where useUrlState reads and writes the query string. */
interface UrlStateAdapter {
    get(): URLSearchParams;
    /** Replace the query string; do not push a history entry. */
    set(next: URLSearchParams): void;
    subscribe(onChange: () => void): () => void;
}
/** location.search + history.replaceState. Keeps the hash and history.state, listens to
 *  popstate and to a 'nish:urlstate' window event fired after each set. */
declare const locationAdapter: UrlStateAdapter;
type UrlStateShape = Record<string, string | string[] | number | boolean>;
/**
 * Typed URL query state. Values equal to the default are left out of the URL, other keys in
 * the URL are kept. Strings, numbers, booleans (written as 1/0) and string arrays (repeated
 * keys, so a value may contain a comma) are supported; the type of each default decides how
 * its key is parsed. `prefix: 'j'` stores `q` as `j.q`. `comma: true` (or a list of keys)
 * also reads a single `?k=a,b` as ['a', 'b'], for links written before repeated keys.
 * Returns [state, patch, reset].
 */
declare function useUrlState<S extends UrlStateShape>(defaults: S, o?: {
    adapter?: UrlStateAdapter;
    prefix?: string;
    comma?: boolean | readonly (keyof S & string)[];
}): [S, (patch: Partial<S> | ((prev: S) => Partial<S>)) => void, () => void];

interface SettingsSectionProps extends Omit<ComponentPropsWithRef<'section'>, 'title' | 'children'> {
    title: ReactNode;
    description?: ReactNode;
    id?: string;
    /** Right side of the heading (a Reset button). */
    actions?: ReactNode;
    /** The dense form for modals, sheets and side panels: a small heading and the rows
     *  divided by lines with no Card around them. Its SettingRows are compact too. */
    compact?: boolean;
    children: ReactNode;
    className?: string;
}
/** A titled group of setting rows in one unpadded Card, rows divided by a line. */
declare function SettingsSection({ title, description, id, actions, compact, children, className, ref, ...rest }: SettingsSectionProps): react.JSX.Element;
interface SettingRowProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    label: ReactNode;
    description?: ReactNode;
    /** The control (Switch, Select, NumberField, Button). */
    children: ReactNode;
    /** id of the control, so the label is a <label htmlFor>. */
    htmlFor?: string;
    /** Stack the control under the label at every width (wide controls, textareas). Default: side by side from sm up, stacked below. */
    stacked?: boolean;
    /** Keep the control at the end of the label row at every width (Switch, Checkbox). */
    inline?: boolean;
    /** Tighter row (44px tall, no side padding, label beside the control at every width).
     *  Default: on inside a compact SettingsSection. */
    compact?: boolean;
    /** A muted status after the control: "Saved", "Saving…", or an error (tone="error" → text-th-loss). */
    status?: ReactNode;
    statusTone?: 'muted' | 'error' | 'ok';
    className?: string;
}
/** One label + control row inside a SettingsSection. */
declare function SettingRow({ label, description, children, htmlFor, stacked, inline, compact: compactProp, status, statusTone, className, ref, ...rest }: SettingRowProps): react.JSX.Element;
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
/** Tracks one save: run(promise) → 'saving' → 'saved' for 1500ms (or 'error' for 3000ms, with the message) → 'idle'.
 *  `label` is the text for SettingRow.status: "Saving…", "Saved", the error message, or null. Rethrows nothing. */
declare function useSaveStatus(): {
    status: SaveStatus;
    error: string | null;
    label: string | null;
    tone: 'muted' | 'ok' | 'error';
    run: <T>(p: Promise<T>) => Promise<T | undefined>;
};
interface NumberFieldProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'defaultValue' | 'ref'> {
    ref?: Ref<HTMLInputElement>;
    value: number | null;
    /** Called on blur and on Enter with the parsed, clamped value, only when it differs from `value`. May return a promise: the field shows a spinner state and, on rejection, restores the old value and sets aria-invalid with the error message under it. */
    onCommit: (next: number | null) => void | Promise<void>;
    min?: number;
    max?: number;
    step?: number;
    /** Allow an empty field (commits null). Default false: an empty field restores the value. */
    nullable?: boolean;
    /** Unit text after the input ("%", "days"). */
    suffix?: ReactNode;
    /** Decimal places kept when committing. Default: as typed. */
    precision?: number;
}
/** A numeric setting that saves when you leave the field or press Enter. */
declare function NumberField({ value, onCommit, min, max, step, nullable, suffix, precision, className, onBlur, onKeyDown, id, invalid, 'aria-describedby': describedBy, ref, ...rest }: NumberFieldProps): react.JSX.Element;

/** A service token as the settings page sees it: never the hash. */
interface ServiceTokenView {
    id: string;
    name: string;
    scopes: string[];
    created: string;
    source: 'file' | 'env';
    revoked: boolean;
    revokedAt?: string;
}
interface ServiceTokenListResponse {
    tokens: ServiceTokenView[];
}

interface UseServiceTokens {
    /** undefined until the first load finishes. */
    tokens: ServiceTokenView[] | undefined;
    loading: boolean;
    error: string | null;
    reload: () => void;
    /** Revokes the token with this id and replaces `tokens` with the server's new list. Throws the ApiError on failure. */
    revoke: (id: string) => Promise<void>;
}
/** Loads the app's service tokens from `url` (GET) and revokes one with POST `${url}/<id>/revoke`.
 *  The server side is `mountServiceTokenRoutes` from `@nish/ui/server/hono`. */
declare function useServiceTokens(url?: string): UseServiceTokens;
interface ServiceTokensSectionProps extends Omit<ComponentPropsWithRef<"section">, "title" | "children"> {
    /** undefined = loading. */
    tokens: ServiceTokenView[] | undefined;
    error?: string | null;
    onRetry?: () => void;
    /** Revokes the token. Reject to keep the dialog open with the error. */
    onRevoke: (id: string) => Promise<void>;
    /** Default: the `serviceTokens` string ("Service tokens"). */
    title?: ReactNode;
    /** Default: the `serviceTokensIntro` string. */
    description?: ReactNode;
    /** Anchor id on the section. Default "service-tokens". */
    id?: string;
    className?: string;
    /** Shown when the list is empty. Default "No service tokens. No machine client can read this app." */
    emptyMessage?: ReactNode;
    /** The body of the revoke confirmation. Default explains that the token stops working and cannot be restored. */
    revokeBody?: ReactNode;
    /** The "created <date>" part of a token's description. Default `created ${when}`. */
    createdLabel?: (when: string) => string;
    /** Added to the description of a token that comes from the SERVICE_TOKENS environment variable. Default "from SERVICE_TOKENS". */
    envSourceLabel?: string;
}
/** The settings block that lists an app's service tokens with a Revoke button each. */
declare function ServiceTokensSection({ tokens, error, onRetry, onRevoke, title: titleProp, description: descriptionProp, id, className, emptyMessage, revokeBody, createdLabel, envSourceLabel, ...rest }: ServiceTokensSectionProps): react.JSX.Element;

interface ComboboxOption {
    value: string;
    label: string;
    /** Secondary text shown after the label and matched by the default filter. */
    hint?: string;
    disabled?: boolean;
}
interface ComboboxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'> {
    /** The text input (the combobox element). The remaining div attributes go to the wrapper. */
    ref?: Ref<HTMLInputElement>;
    options: ComboboxOption[];
    /** The selected option's value, or the custom text; null when nothing is selected.
     *  Leave it out and use `defaultValue` for an uncontrolled combobox. */
    value?: string | null;
    /** The starting value of an uncontrolled combobox. */
    defaultValue?: string | null;
    /** Called with the new value and the option it matches (null for custom text or a clear). */
    onChange?: (value: string | null, option: ComboboxOption | null) => void;
    /** Called with the new value only (the form-library friendly name). */
    onValueChange?: (value: string | null) => void;
    /** Filtering. Default: case-insensitive substring on label and hint; show at most 50.
     *  With `onQueryChange` and no `filter`, options are shown as given (the server filtered them). */
    filter?: (option: ComboboxOption, query: string) => boolean;
    /** Allow committing typed text that matches no option (creates); onChange gets (text, null). */
    allowCustom?: boolean;
    placeholder?: string;
    /** Accessible name when there is no visible <label htmlFor={id}>. */
    'aria-label'?: string;
    /** Names the combobox by another element's id. */
    'aria-labelledby'?: string;
    /** Ids of help or error text; reaches the input (Field sets it). */
    'aria-describedby'?: string;
    /** Reaches the input (Field sets it on error). */
    'aria-invalid'?: boolean | 'true' | 'false';
    /** Same as aria-invalid="true". */
    invalid?: boolean;
    /** The id of the text input, so a `<label htmlFor>` and Field reach it. */
    id?: string;
    /** Field name for a native form. A hidden input carries the selected value (the typed
     *  text is not submitted). */
    name?: string;
    /** The id of the `<form>` the hidden input belongs to, when it is not an ancestor. */
    form?: string;
    /** Marks the combobox required (`required` and `aria-required` on the input). */
    required?: boolean;
    disabled?: boolean;
    /** Shown when nothing matches. Default "No matches" (NishProvider strings). */
    emptyText?: string;
    /** Async options: called (debounced 200ms) with the query; while `loading` shows a Spinner row "Searching…". */
    onQueryChange?: (q: string) => void;
    loading?: boolean;
    /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
    size?: 'sm' | 'md';
    /** Accessible name of the clear button. Default "Clear" (NishProvider strings). */
    clearLabel?: string;
    /** The loading row and its announcement. Default "Searching…" (NishProvider strings). */
    loadingText?: string;
    /** The polite announcement of the result count. Default "3 results" / "1 result". */
    resultsText?: (count: number) => string;
    className?: string;
}
/** A text input with a listbox of suggestions (ARIA 1.2 combobox). Pick from the options,
 *  or with `allowCustom` commit what was typed. The list sits under the input and works
 *  inside a Modal or Drawer. `ref`, `id`, `aria-*`, `name` and `required` belong to the
 *  input; `className` and other attributes go to the wrapper. */
declare function Combobox({ ref, options, value: valueProp, defaultValue, onChange, onValueChange, filter, allowCustom, placeholder, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, invalid, id, name, form, required, disabled, emptyText, onQueryChange, loading, size, clearLabel, loadingText, resultsText, className, ...rest }: ComboboxProps): react.JSX.Element;

/** The handful of icons the shared components need, inlined so the package does not
 *  pin apps to one lucide-react version. 24px grid, 2px stroke, lucide geometry. */
type IconProps = SVGProps<SVGSVGElement> & {
    size?: number;
};
declare const CheckIcon: (p: IconProps) => react.JSX.Element;
declare const ClockIcon: (p: IconProps) => react.JSX.Element;
/** Three horizontal dots. */
declare const MoreIcon: (p: IconProps) => react.JSX.Element;
declare const BellIcon: (p: IconProps) => react.JSX.Element;
declare const SettingsIcon: (p: IconProps) => react.JSX.Element;

type LayoutNode = {
    type: "leaf";
    slot: number;
} | {
    type: "split";
    dir: "row" | "col";
    sizes: number[];
    children: LayoutNode[];
};
/** A narrow-screen layout: one or two panes, split along `dir` ('auto' picks by aspect). */
interface NarrowLayout {
    dir: "auto" | "row" | "col";
    /** Share of the first pane, 0.2 to 0.8. */
    split: number;
}
declare const MAX_PANES = 4;
declare const NARROW_MAX = 2;
declare const NARROW_BREAKPOINT = 640;
interface Preset {
    id: string;
    /** Short name shown under the icon. */
    label: string;
    /** Longer description for the tooltip and screen readers. */
    hint: string;
    build: () => LayoutNode;
}
interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
interface Divider {
    path: number[];
    index: number;
    dir: "row" | "col";
    x: number;
    y: number;
    w: number;
    h: number;
}
declare function presetsFor(count: 1 | 2 | 3 | 4): Preset[];
declare function defaultPreset(count: 1 | 2 | 3 | 4, aspect: number): string;
declare function countLeaves(node: LayoutNode | null): number;
declare function computeRects(node: LayoutNode, w: number, h: number, gap: number): Rect[];
declare function computeDividers(node: LayoutNode, w: number, h: number, gap: number): Divider[];
declare function resizeAt(node: LayoutNode, path: number[], index: number, deltaPx: number, w: number, h: number, gap: number, minPx?: {
    w: number;
    h: number;
}): LayoutNode;
declare function equalize(node: LayoutNode): LayoutNode;
declare function removeSlot(node: LayoutNode, slot: number): LayoutNode | null;
declare function addSlot(node: LayoutNode | null, w: number, h: number, gap: number): LayoutNode;
declare function swapSlots(slots: string[], a: number, b: number): string[];
declare function narrowLayout(count: 1 | 2, n: NarrowLayout, aspect: number): LayoutNode;
declare function isValidLayout(node: LayoutNode | null, count: number): boolean;

interface LayoutPresetOption {
    /** The value passed to `onChange`. */
    id: string;
    /** The visible name under the icon. */
    label: string;
    /** A short explanation, shown in a tooltip and read as part of the accessible name. */
    hint: string;
    /** The layout the icon draws. */
    node: LayoutNode;
}
/** The preset options for a pane count, from `presetsFor`. */
declare function presetOptions(count: 1 | 2 | 3 | 4): LayoutPresetOption[];

interface SplitDividersProps {
    /** The layout being drawn. For a narrow screen, build it with `narrowLayout`. */
    layout: LayoutNode;
    /** The width of the area the layout fills, in px. */
    w: number;
    /** The height of the area the layout fills, in px. */
    h: number;
    /** Gap between panes in px. Must match the gap the panes were positioned with. */
    gap: number;
    /** Called with the new tree while a divider moves, and on reset (equal sizes for that split). */
    onResize(next: LayoutNode): void;
    /** Called with true when a drag starts and false when it ends. */
    onDragChange?(dragging: boolean): void;
    /** The smallest a pane may get while resizing, in px (default 160 by 90). */
    minPane?: {
        w: number;
        h: number;
    };
    /**
     * Px kept free at the top of each column divider (and above a row divider's line) so its hit
     * area stays off a pane bar shown there. Default 0.
     */
    barInset?: number;
    /** Set when the area is mirrored (right-to-left): positions are measured from the right edge,
     *  a drag to the right shrinks the first pane, and ArrowLeft grows it. `SplitStage` sets this. */
    rtl?: boolean;
    /** The DOM id of the pane in a slot, so each divider can list the panes it resizes in `aria-controls`.
     *  `SplitStage` passes it. */
    paneId?(slot: number): string | undefined;
}
/**
 * Drag handles between panes. Each is a keyboard-focusable separator: arrow keys move it 2%,
 * Home and End move it to the smallest and largest pane size, Enter or a double-click resets
 * that split to equal sizes. With several handles in one direction, their names carry a number. The hit area is 24px, 44px on touch
 * screens; a thin accent bar shows on hover, focus and drag. Place it inside a `relative` box
 * that is `w` by `h` (`SplitStage` does).
 */
declare function SplitDividers({ layout, w, h, gap, onResize, onDragChange, minPane, barInset, rtl, paneId }: SplitDividersProps): react.JSX.Element;
interface SplitStageProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
    /** The layout tree; null renders no panes. Leaves cover slots 0..n-1. */
    layout: LayoutNode | null;
    /** Item ids in DOM order. Keep this order stable (for example, insertion order); never sort it by slot, or panes move in the DOM and iframes reload. */
    items: string[];
    /** The item id in each slot. Ids not in slots are not rendered. */
    slots: string[];
    /** Gap between panes in px (default 4). */
    gap?: number;
    /** Shows the dividers and lets them resize the layout. */
    resizable?: boolean;
    /** Called with the new tree while a divider moves (resizeAt), and on reset (equalize that split). */
    onLayoutChange?(layout: LayoutNode): void;
    /** Renders one pane's content; the stage positions it. */
    renderPane(id: string, info: {
        rect: Rect;
        slot: number;
    }): ReactNode;
    /** Reports the measured size (for addSlot, which needs it). */
    onSize?(size: {
        w: number;
        h: number;
    }): void;
    /** Sets data-dragging on the stage (an app's own pane drag); dividers set it while they move. */
    dragging?: boolean;
    /** Animate position changes (default true; off under prefers-reduced-motion and while dragging). */
    animate?: boolean;
    /** The smallest a pane may get while resizing, in px (default 160 by 90). Passed to the dividers. */
    minPane?: {
        w: number;
        h: number;
    };
    /** Px kept free at the top of column dividers so handles stay off pane bars (see SplitDividers). */
    barInset?: number;
    /** Extra elements over the stage (an overlay preset bar, a drag ghost). */
    children?: ReactNode;
    className?: string;
}
/**
 * Draws a split layout as flat panes. Every pane is an absolutely positioned child keyed by its
 * item id and rendered in the order of `items`, so presets, resizing and swapping only change
 * style values and never move a DOM node (a moved iframe reloads). Give the stage a size from
 * its parent (for example `flex-1 min-h-0`); it measures itself.
 */
declare function SplitStage({ layout, items, slots, gap, resizable, onLayoutChange, renderPane, onSize, dragging, animate, minPane, barInset, children, className, ref: forwardedRef, ...rest }: SplitStageProps): react.JSX.Element;
interface LayoutPresetIconProps extends Omit<ComponentPropsWithRef<'svg'>, 'width' | 'height' | 'children'> {
    /** The layout to draw: one rounded rectangle per pane. */
    node: LayoutNode;
    /** Width of the drawing in px (default 56). */
    width?: number;
    /** Height of the drawing in px (default 36). */
    height?: number;
    className?: string;
}
/** A small drawing of a layout in the current text color. Decorative: name it with a label beside it. */
declare function LayoutPresetIcon({ node, width, height, className, ref, ...rest }: LayoutPresetIconProps): react.JSX.Element;
interface LayoutPresetPickerProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'children'> {
    /** One radio per option. */
    options: LayoutPresetOption[];
    /** The id of the chosen option, or null when the layout is custom (for example after a resize). */
    value: string | null;
    /** Called with the id of the option picked. */
    onChange(id: string): void;
    /** Controls shown at the right of the bar, for example an "Equal sizes" button. */
    actions?: ReactNode;
    /** A hint shown at lg and up, for example "Drag the lines to resize." */
    note?: ReactNode;
    /** Translucent with blur and a shadow, for a bar floating over the stage. */
    overlay?: boolean;
    /** Extra classes for the bar, for example an inset like `pr-52`. */
    className?: string;
    /** Name of the radio group for screen readers. Default: the `layoutPresets` string ("Layout presets"). */
    label?: string;
}
/** A bar of layout presets: one icon radio per option in a scrolling row, with a tooltip hint on each. */
declare function LayoutPresetPicker({ options, value, onChange, actions, note, overlay, className, label: labelProp, ref, ...rest }: LayoutPresetPickerProps): react.JSX.Element;

type MediaThumbShape = 'wide' | 'round' | 'square';
type MediaThumbSize = 'sm' | 'md';
interface MediaThumbProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
    /** The image URL. Relative, http(s) URLs load; javascript:, data: and other schemes show the fallback. */
    src?: string;
    /** wide: 16:9 (64x36, or 96x54 at md). round and square: 36px, or 48px at md. */
    shape?: MediaThumbShape;
    /** sm for dense lists, md otherwise. */
    size?: MediaThumbSize;
    /** Shown centered on a quiet fill when there is no usable image (an icon). */
    fallback?: ReactNode;
    /** Alternative text. Empty by default: the row's title already names the item. */
    alt?: string;
    className?: string;
    ref?: Ref<HTMLSpanElement>;
}
/** A thumbnail in a fixed box: 16:9, round or square, lazy-loaded, with a fallback fill. */
declare function MediaThumb({ src, shape, size, fallback, alt, className, ref, ...rest }: MediaThumbProps): react.JSX.Element;
interface MediaRowProps extends Omit<ComponentPropsWithoutRef<'li'>, 'title' | 'onClick' | 'children' | 'className'> {
    /** The image URL (relative or http(s); other schemes show the fallback). */
    thumbnailUrl?: string;
    /** wide (16:9, default), round (channels) or square. */
    thumbShape?: MediaThumbShape;
    /** md by default; sm when `dense`. */
    thumbSize?: MediaThumbSize;
    /** An icon shown on the thumbnail's fill when there is no image. */
    fallback?: ReactNode;
    /** The title; wraps to two lines. */
    title: ReactNode;
    /** The line under the title: a channel, an author, a count. */
    meta?: ReactNode;
    /** A third, quieter line: a date, a view count. */
    detail?: ReactNode;
    /** true shows a Live badge, false an Offline badge, undefined none. */
    live?: boolean;
    /** The Live badge text. Default: the "live" string. */
    liveLabel?: string;
    /** The Offline badge text. Default: the "offlineBadge" string. */
    offlineLabel?: string;
    /** Extra badges after the live one ("On screen"). */
    badges?: ReactNode;
    /** A control or element at the far right, after the badges. */
    trailing?: ReactNode;
    /** Shows a chevron. On by default for a link. */
    chevron?: boolean;
    /** A 44px-minimum row with a small thumbnail, for tiles and widgets. */
    dense?: boolean;
    /** Dense, with 11px title and 10px meta and detail text: for small widget tiles that use small type. */
    compact?: boolean;
    /** Makes the whole row a button. */
    onClick?: () => void;
    /** Makes the whole row a link. */
    href?: string;
    /** The wrapper element. Default 'li'; pass 'div' outside a list. */
    as?: 'li' | 'div';
    className?: string;
    /** The wrapper element. */
    ref?: Ref<HTMLElement>;
}
/** A result row: thumbnail, two-line title, meta and detail, with Live/Offline and other badges. */
declare function MediaRow({ thumbnailUrl, thumbShape, thumbSize, fallback, title, meta, detail, live, liveLabel, offlineLabel, badges, trailing, chevron, dense, compact, onClick, href, as, className, ref, ...rest }: MediaRowProps): react.JSX.Element;
interface MediaChipProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'type'> {
    /** The image URL (relative or http(s); other schemes show no image). */
    thumbnailUrl?: string;
    /** The label; truncates. */
    label: string;
    /** Called when the chip is pressed. */
    onClick: () => void;
    /** A second, never-truncated word after the label ("Bring back"). */
    action?: string;
    className?: string;
    ref?: Ref<HTMLButtonElement>;
}
/** A pill button with a 16:9 thumbnail and a label, 44px tall: a recent item or a hidden pane to bring back. */
declare function MediaChip({ thumbnailUrl, label, onClick, action, className, ref, ...rest }: MediaChipProps): react.JSX.Element;

interface RadioOption {
    value: string;
    label: ReactNode;
    /** A quieter line under the label, linked by aria-describedby. */
    description?: ReactNode;
    disabled?: boolean;
}
interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
    /** The selected value (controlled). */
    value?: string;
    /** The initially selected value (uncontrolled). */
    defaultValue?: string;
    /** Called with the new value when the selection changes. */
    onValueChange?: (value: string) => void;
    /** The form field name every radio posts under. Defaults to a generated name, so the
     *  radios always form one native group. */
    name?: string;
    /** Radios to render from data. Use `<Radio>` children instead for custom layouts. */
    options?: RadioOption[];
    /** vertical (default) stacks the radios; horizontal lays them in a wrapping row. */
    orientation?: 'vertical' | 'horizontal';
    /** Disables every radio. */
    disabled?: boolean;
    /** Marks the group required (aria-required, and native validation on the inputs). */
    required?: boolean;
    /** Red radios and aria-invalid. Field sets it from its `error`. */
    invalid?: boolean;
    /** `<Radio>` children, used when `options` is not given. */
    children?: ReactNode;
    /** The `role="radiogroup"` element. */
    ref?: Ref<HTMLDivElement>;
}
/** A group of native radio buttons. Posts in FormData, works with react-hook-form's
 *  `register` (leave `value` out and put `register(...)` on each `<Radio>`), and follows the
 *  APG radio group keyboard model: the arrows move and select, mirrored in right-to-left. */
declare function RadioGroup({ value, defaultValue, onValueChange, name, options, orientation, disabled, required, invalid, className, children, ref, id, onKeyDown, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-invalid': ariaInvalid, ...rest }: RadioGroupProps): react.JSX.Element;
interface RadioProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'checked' | 'defaultChecked' | 'size' | 'children' | 'className'> {
    /** The value this radio posts and selects. */
    value: string;
    /** The visible label. Clicking it selects the radio. Without one, pass aria-label. */
    label?: ReactNode;
    /** A quieter line under the label, linked by aria-describedby. */
    description?: ReactNode;
    /** Classes for the label row. */
    className?: string;
    /** The native `<input type="radio">` (so `register(...)` from react-hook-form can attach). */
    ref?: Ref<HTMLInputElement>;
}
/** One radio inside a RadioGroup: a native input, a drawn circle, a label and an optional
 *  description. The whole row is a 44px target on touch screens. */
declare function Radio({ value, label, description, className, disabled, required, name, onChange, ref, ...rest }: RadioProps): react.JSX.Element;

type SliderValue = number | [number, number];
interface SliderProps<V extends SliderValue = number> extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
    /** The value (controlled): a number, or `[low, high]` for a range with two thumbs. */
    value?: V;
    /** The initial value (uncontrolled). A pair makes it a range. Default: `min`. */
    defaultValue?: V;
    /** Called on every change while dragging or pressing keys. */
    onValueChange?: (value: V) => void;
    /** Called when a drag ends or a key press changes the value: the moment to save. */
    onValueCommit?: (value: V) => void;
    /** Smallest value. Default 0. */
    min?: number;
    /** Largest value. Default 100. */
    max?: number;
    /** Step between values. Default 1. */
    step?: number;
    /** Posts the value in a form (a range posts the name twice: low, then high). */
    name?: string;
    /** Turns off dragging and keys, and leaves the value out of the form. */
    disabled?: boolean;
    /** Red styling and data-invalid. Field sets it from its `error`. */
    invalid?: boolean;
    /** Turns a value into the text screen readers announce (`aria-valuetext`): "$40", "3 days". */
    formatValue?: (value: number, thumb: number) => string;
    /** The element that holds the track. */
    ref?: Ref<HTMLDivElement>;
}
/** A single-value or range slider. Each thumb is `role="slider"` with arrows, PageUp/PageDown,
 *  Home and End; pointer drag works on the whole track; right-to-left mirrors the direction.
 *  Hidden inputs post the value(s) in a form. */
declare function Slider<V extends SliderValue = number>({ value, defaultValue, onValueChange, onValueCommit, min, max, step, name, disabled, invalid, formatValue, className, ref, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...rest }: SliderProps<V>): react.JSX.Element;

interface TagInputProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange' | 'children' | 'placeholder'> {
    /** The tags (controlled). */
    value?: string[];
    /** The initial tags (uncontrolled). */
    defaultValue?: string[];
    /** Called with the new list when a tag is added or removed. */
    onValueChange?: (value: string[]) => void;
    /** Posts every tag in a form, one hidden input per tag under this name. */
    name?: string;
    /** Shown in the text box while there are no tags. */
    placeholder?: string;
    /** No more than this many tags can be added. */
    maxTags?: number;
    /** Return an error message to refuse a tag (it stays in the text box, and the message shows
     *  under the field), or null to accept it. */
    validate?: (tag: string) => string | null;
    /** A list of tags to pick from, filtered as the reader types (combobox pattern). Free
     *  text is still accepted. */
    suggestions?: string[];
    disabled?: boolean;
    /** Required on the text box (native validation is off while it holds nothing but tags; use
     *  your form library for "at least one tag"). */
    required?: boolean;
    /** Red border and aria-invalid on the text box. Field sets it from its `error`. */
    invalid?: boolean;
    /** md (default) or sm, as for Input. */
    size?: 'sm' | 'md';
    /** The text `<input>`. */
    inputRef?: Ref<HTMLInputElement>;
    /** The bordered box that holds the tags and the text box. `id`, `aria-label`, `aria-labelledby`,
     *  `aria-describedby` and `aria-invalid` go to the text box instead, so a Field label reaches it. */
    ref?: Ref<HTMLDivElement>;
}
/** A text box that turns what you type into removable tags. Enter and comma add a tag, pasting
 *  a list splits it, Backspace on an empty box removes the last tag. Each tag posts as its own
 *  hidden input. */
declare function TagInput({ value, defaultValue, onValueChange, name, placeholder, maxTags, validate, suggestions, disabled, required, invalid, size, className, ref, inputRef, id, onClick, onBlur, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...rest }: TagInputProps): react.JSX.Element;

interface RejectedFile {
    file: File;
    /** type: not in `accept`. size: over `maxSize`. count: over `maxFiles` (or a second file when not `multiple`). */
    reason: 'type' | 'size' | 'count';
}
interface FileDropzoneProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children' | 'defaultValue'> {
    /** What the picker offers and the zone accepts: ".pdf,image/*" (the native `accept` syntax). */
    accept?: string;
    /** Allow several files. Without it a new pick replaces the old one. */
    multiple?: boolean;
    /** Largest file in bytes. Bigger files are rejected with reason "size". */
    maxSize?: number;
    /** Most files held at once (with `multiple`). Extra files are rejected with reason "count". */
    maxFiles?: number;
    /** Called whenever the list changes, with the files now held and the files just refused. */
    onFilesChange?: (files: File[], rejected: RejectedFile[]) => void;
    /** The field name of the real `<input type="file">`, so the form posts the files. */
    name?: string;
    disabled?: boolean;
    required?: boolean;
    /** Red border. Field sets it from its `error`. */
    invalid?: boolean;
    /** Replaces the default "Drop files here or browse" text. */
    label?: ReactNode;
    /** The bordered zone's root. `data-state` is "dragging" while files are dragged over it, else "idle".
     *  `id`, `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-invalid` go to the file
     *  input, so a Field label reaches it. */
    ref?: Ref<HTMLDivElement>;
}
/** A drop zone around a real `<input type="file">`: click, Enter or Space opens the picker, files
 *  can be dropped, and the held files are listed with a remove button each. */
declare function FileDropzone({ accept, multiple, maxSize, maxFiles, onFilesChange, name, disabled, required, invalid, label, className, ref, id, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, 'aria-describedby': ariaDescribedBy, 'aria-invalid': ariaInvalid, ...rest }: FileDropzoneProps): react.JSX.Element;

type Slot = number | 'dots-start' | 'dots-end';
/** The page numbers and ellipses to show: the same count of slots wherever the current page is,
 *  so the row does not change width as you page. */
declare function paginationRange(page: number, pageCount: number, siblings?: number, boundaries?: number): Slot[];

type PaginationSize = 'sm' | 'md';
/** What `renderLink` receives for a page, previous or next control: spread it on the router link. */
interface PaginationLinkProps {
    /** The classes of the control (size, current and hover looks). */
    className: string;
    /** "Page 3", "Previous page" or "Next page". */
    'aria-label': string;
    /** "page" on the current page. */
    'aria-current'?: 'page';
    /** "active" on the current page, "inactive" otherwise. */
    'data-state': 'active' | 'inactive';
    /** The page number or the arrow. */
    children: ReactNode;
    /** Keeps the page state in step; the router still navigates. */
    onClick: (event: MouseEvent<HTMLElement>) => void;
}
interface PaginationProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'onChange' | 'children' | 'defaultValue'> {
    /** The current page, 1-based. Pass it to control the component. */
    page?: number;
    /** The first page when uncontrolled (default 1). */
    defaultPage?: number;
    /** Called with the new page (1-based) when the user picks one. */
    onPageChange?: (page: number) => void;
    /** How many pages there are. */
    pageCount: number;
    /** Pages shown on each side of the current one (default 1). */
    siblings?: number;
    /** Pages always shown at the start and at the end (default 1). */
    boundaries?: number;
    /** sm (32px) or md (36px, default). Every control is 44px on touch screens. */
    size?: PaginationSize;
    /** Renders each control as a router link: `(page, props) => <Link to={`?page=${page}`} {...props} />`. */
    renderLink?: (page: number, props: PaginationLinkProps) => ReactNode;
    /** Forces the compact "Page 3 of 10" form (true) or the full list (false). Unset: compact under 400px container width. */
    compact?: boolean;
    /** Disables every control. */
    disabled?: boolean;
    /** The nav landmark label. Default: `paginationLabel` from NishProvider strings. */
    label?: string;
    /** The previous control's label. Default: `previousPage` from the strings. */
    previousLabel?: string;
    /** The next control's label. Default: `nextPage` from the strings. */
    nextLabel?: string;
    /** Label of one page button. Default: `pageLabel` from the strings. */
    pageLabel?: (page: number) => string;
    /** The compact text. Default: "Page 3 of 10" (English; pass your own for other languages). */
    compactLabel?: (page: number, pageCount: number) => string;
    ref?: Ref<HTMLElement>;
}
/** Page navigation: numbered pages with ellipses, previous and next, a nav landmark and
 *  aria-current on the current page. Under 400px of its own width it shows "Page 3 of 10"
 *  with previous and next. Use renderLink so each control is a router link. */
declare function Pagination({ page: pageProp, defaultPage, onPageChange, pageCount, siblings, boundaries, size, renderLink, compact: compactProp, disabled, label, previousLabel, nextLabel, pageLabel, compactLabel, className, ref, ...rest }: PaginationProps): react.JSX.Element | null;

interface BreadcrumbItem {
    /** The crumb's text. */
    label: ReactNode;
    /** Where the crumb goes. Passed through `safeUrl`: a `javascript:` URL renders as plain text. */
    href?: string;
    /** Runs on click. With `href` it runs before the link navigates; alone it makes a button. */
    onClick?: (event: MouseEvent<HTMLElement>) => void;
}
/** What `renderLink` receives for a crumb: spread it on the router link. */
interface BreadcrumbLinkProps {
    className: string;
    /** The href after `safeUrl`. */
    href: string;
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
}
interface BreadcrumbsProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {
    /** The trail, root first. The last item is the current page. Use this or children. */
    items?: BreadcrumbItem[];
    /** Ready-made crumbs (links, spans), root first, when `items` does not fit. These are never collapsed. */
    children?: ReactNode;
    /** Renders a crumb with a href as a router link: `(item, props) => <Link to={props.href} {...props} />`. */
    renderLink?: (item: BreadcrumbItem, props: BreadcrumbLinkProps) => ReactNode;
    /** The separator between crumbs. Default: a chevron that mirrors in RTL. */
    separator?: ReactNode;
    /** More crumbs than this collapse the middle ones into a "…" menu (default 4). */
    maxItems?: number;
    /** auto (default): collapse only under 640px of container width. always: whenever there are more than maxItems. never: show every crumb. */
    collapse?: 'auto' | 'always' | 'never';
    /** The nav landmark label. Default: `breadcrumbs` from NishProvider strings. */
    label?: string;
    /** The label of the "…" button. Default: `more` from the strings. */
    moreLabel?: string;
    ref?: Ref<HTMLElement>;
}
/** A trail of where the page sits: links, a chevron between them and aria-current="page" on the
 *  last crumb. A long trail collapses its middle crumbs into a "…" menu on narrow containers. */
declare function Breadcrumbs({ items, children, renderLink, separator, maxItems, collapse, label, moreLabel, className, ref, ...rest }: BreadcrumbsProps): react.JSX.Element;

type AccordionHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
interface AccordionBase extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
    /** The AccordionItems. */
    children: ReactNode;
    /** The heading level of every item's header (default 3), so the page outline stays right. */
    headingLevel?: AccordionHeadingLevel;
    /** Disables every item. */
    disabled?: boolean;
    /** Names the group for screen readers. Default: `accordion` from NishProvider strings. */
    label?: string;
    ref?: Ref<HTMLDivElement>;
}
interface AccordionSingleProps extends AccordionBase {
    /** One item open at a time. */
    type?: 'single';
    /** The open item's value ('' for none). Pass it to control the component. */
    value?: string;
    /** The open item when uncontrolled ('' or unset for none). */
    defaultValue?: string;
    /** Called with the open item's value, or '' when the open item is closed. */
    onValueChange?: (value: string) => void;
    /** Lets the open item close (default false: one item stays open once opened). */
    collapsible?: boolean;
}
interface AccordionMultipleProps extends AccordionBase {
    /** Any number of items open at once. */
    type: 'multiple';
    /** The open items' values. Pass it to control the component. */
    value?: string[];
    /** The open items when uncontrolled. */
    defaultValue?: string[];
    /** Called with the open items' values. */
    onValueChange?: (value: string[]) => void;
    collapsible?: never;
}
type AccordionProps = AccordionSingleProps | AccordionMultipleProps;
/** A stack of headers that each open and close a panel. Items in `type="single"` close each
 *  other; `type="multiple"` leaves them independent. The arrow keys move between the headers. */
declare function Accordion(props: AccordionProps): react.JSX.Element;
interface AccordionItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
    /** Identifies the item in the Accordion's value. */
    value: string;
    /** The header's content. */
    title: ReactNode;
    /** The panel's content. */
    children: ReactNode;
    /** Shown but not toggleable; the arrow keys skip it. */
    disabled?: boolean;
    ref?: Ref<HTMLDivElement>;
}
/** One header and its panel inside an Accordion. */
declare function AccordionItem({ value, title, children, disabled: disabledProp, className, ref, ...rest }: AccordionItemProps): react.JSX.Element;

interface SeparatorProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** horizontal (default) draws a rule across; vertical draws one down inside a flex row. */
    orientation?: 'horizontal' | 'vertical';
    /** Purely visual: the separator is hidden from assistive technology (role="none"). Default true. Pass false to expose role="separator". */
    decorative?: boolean;
    /** Text centered on a horizontal rule ("or", "Today"). */
    label?: ReactNode;
    ref?: Ref<HTMLDivElement>;
}
/** A thin rule between groups of content, optionally with a label in the middle. */
declare function Separator({ orientation, decorative, label, className, ref, ...rest }: SeparatorProps): react.JSX.Element;

/** Index 0 to 7 of the hue a name gets: the same name always maps to the same hue. */
declare function avatarHueIndex(name: string): number;
/** Up to two initials: first letters of the first and last words. */
declare function avatarInitials(name: string): string;

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'square';
interface AvatarProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
    /** Image URL. Unsafe URLs (javascript:, data:) are ignored and the initials show. */
    src?: string | null;
    /** The person or thing. Gives the initials and the color, and is the default alt text. */
    name?: string;
    /** Alt text for the image. Default: name. Pass an empty string when the name is written next to it. */
    alt?: string;
    /** xs 24px, sm 32px, md 40px (default), lg 48px, xl 64px. */
    size?: AvatarSize;
    /** circle (default) or square with rounded corners. */
    shape?: AvatarShape;
    /** A status dot at the bottom corner. Give it text elsewhere; color is never the only signal. */
    status?: StatusTone;
    /** The root element. */
    ref?: Ref<HTMLSpanElement>;
}
/** A person or entity: their image, or initials on a color taken from their name. */
declare function Avatar({ src, name, alt, size, shape, status, className, ref, ...rest }: AvatarProps): react.JSX.Element;
interface AvatarGroupProps extends ComponentPropsWithoutRef<'div'> {
    /** Avatars shown before the "+N" overflow badge. Default: all. */
    max?: number;
    /** Size for every avatar that does not set its own. Default md. */
    size?: AvatarSize;
    /** Shape for every avatar that does not set its own. */
    shape?: AvatarShape;
    /** The Avatars. */
    children?: ReactNode;
    /** The root element. */
    ref?: Ref<HTMLDivElement>;
}
/** Overlapping avatars, with a "+N" badge for the ones past `max`. */
declare function AvatarGroup({ max, size, shape, children, className, ref, ...rest }: AvatarGroupProps): react.JSX.Element;

type ProgressTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | 'neutral';
declare const THICK: {
    readonly xs: "h-1";
    readonly sm: "h-1.5";
    readonly md: "h-2.5";
    readonly lg: "h-4";
};
interface ProgressProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
    /** Current value from 0 to max. Null (or omitted) shows an indeterminate bar. */
    value?: number | null;
    /** The value that means done. Default 100. */
    max?: number;
    /** Fill color. Default accent. */
    tone?: ProgressTone;
    /** Bar thickness: xs 4px, sm 6px (default), md 10px, lg 16px. */
    size?: keyof typeof THICK;
    /** A visible label above the bar. It also names the bar for screen readers. */
    label?: ReactNode;
    /** Shows the formatted value beside the label. */
    showValue?: boolean;
    /** Turns the value into the text screen readers (and showValue) use. Default: a rounded percent. */
    formatValue?: (value: number, max: number) => string;
    /** The wrapper element; the ARIA progressbar is the bar inside it. */
    ref?: Ref<HTMLDivElement>;
}
/** A progress bar for work that finishes: determinate with a value, indeterminate without. */
declare function Progress({ value, max, tone, size, label, showValue, formatValue, className, ref, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...rest }: ProgressProps): react.JSX.Element;

interface VisuallyHiddenProps extends ComponentPropsWithoutRef<'span'> {
    /** The element to render. Default span; use div for block content. */
    as?: 'span' | 'div';
    /** The root element. */
    ref?: Ref<HTMLElement>;
}
/** Text that screen readers read and sighted users do not see. Uses inline styles, so it works
 *  without Tailwind or any stylesheet. A `style` prop is merged after the hiding styles. */
declare function VisuallyHidden({ as, style, ref, ...rest }: VisuallyHiddenProps): react.JSX.Element;

export { Accordion, AccordionItem, ActivityFeed, AgentNode, AnimatedList, ApiError, AppErrorBoundary, AppHeader, AppShell, AsyncPanel, Avatar, AvatarGroup, BREAKPOINTS, Badge, BarChart, BellIcon, BottomNav, Breadcrumbs, Button, COLOR_ROLES, Callout, Card, CardHeader, CardListSkeleton, ChartLegend, CheckIcon, Checkbox, Chip, ChipGroup, ClockIcon, Combobox, CommandPalette, ConfirmDialog, ConnectionBanner, CopyButton, DEFAULT_INBOX_LABELS, DEFAULT_STRINGS, DEFAULT_THEME, Disclosure, Drawer, DropdownMenu, EmptyState, ErrorState, Favicon, Field, FieldGroup, FileDropzone, FilterBar, FilterSheet, FlowSteps, HUE_ROLES, INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS, INBOX_DEFAULT_SETTINGS, INBOX_SOURCE_LABELS, IconButton, Inbox, Input, Kbd, KeyValueList, Label, LayoutPresetIcon, LayoutPresetPicker, LineChart, LinkCard, ListRow, LoadingBar, MAX_PANES, MediaChip, MediaRow, MediaThumb, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader, Meter, Modal, MoreIcon, MoreSheet, NARROW_BREAKPOINT, NARROW_MAX, NARROW_QUERY, NavRail, NishProvider, NumberField, PHONE_QUERY, PRESETS, PageContainer, PageHeader, Pagination, Popover, Portal, Progress, Radio, RadioGroup, RangeBar, RelativeTime, ResponsiveTable, SCALE, SHADOWS, SOFT_ROLES, ScrollRow, SearchInput, SectionHeader, SectionNav, Segmented, Select, Separator, ServiceTokensSection, SettingRow, SettingsIcon, SettingsSection, Skeleton, SkeletonCard, SkeletonLines, SkeletonRows, Slider, Sparkline, Spinner, SplitDividers, SplitStage, Stat, StatGrid, StatGridSkeleton, StatusDot, StepBar, StickyActionBar, StickyBar, Switch, THEMES, TOGGLE_ORDER, TabPanel, Table, TableWrap, Tabs, TagInput, Td, Textarea, Th, ThemeToggle, TickerText, Toaster, Tooltip, Tr, VERSION, VisuallyHidden, WorkflowBoard, addSlot, apiFetch, applyTheme, avatarHueIndex, avatarInitials, badgeClass, buttonClass, cardClass, chipClass, cn, computeDividers, computeRects, configureApi, configureFavicons, confirmDialog, copyText, countLeaves, cycleTheme, defaultPreset, dismissToast, equalize, fieldClass, getDefaultLocale, getThemeChoice, googleFavicon, iconButtonClass, initTheme, isRtl, isThemeName, isValidLayout, linkClass, locationAdapter, menuItemClass, mountChecklist, mountHeightVar, mountScrollspy, mountStuck, mountThemeToggle, mountTooltips, narrowLayout, navigateFromLayer, onThemeChange, openSheet, paginationRange, presetOptions, presetsFor, readToken, registerThemes, removeSlot, resizeAt, resolveTheme, revealClass, safeUrl, schemeOf, setDefaultLocale, setThemeChoice, showToast, signTone, swapSlots, tabClass, tableClass, toast, toneFor, useBreakpoint, useCommandHotkey, useDocumentTitle, useHeightVar, useIsClient, useIsoLayoutEffect, useLocalStorage, useMediaQuery, useNarrow, useNishConfig, useNishStrings, useNow, useOnline, usePhone, usePrefersReducedMotion, useResource, useSaveStatus, useScrollEdges, useScrollSpy, useServiceTokens, useStuck, useTheme, useToast, useUrlState };
export type { AccordionHeadingLevel, AccordionItemProps, AccordionMultipleProps, AccordionProps, AccordionSingleProps, ActivityFeedProps, ActivityItem, AgentNodeProps, AgentNodeState, AgoOptions, AnimatedListProps, ApiConfig, ApiFetchOptions, AppErrorBoundaryProps, AppHeaderHub, AppHeaderProps, AppShellProps, AppShellSidebar, AsyncPanelProps, AvatarGroupProps, AvatarProps, AvatarShape, AvatarSize, BadgeClassOptions, BadgeHue, BadgeProps, BadgeTone, BarChartProps, BottomNavProps, BreadcrumbItem, BreadcrumbLinkProps, BreadcrumbsProps, Breakpoint, ButtonClassOptions, ButtonProps, ButtonSize, ButtonVariant, CalloutProps, CalloutTone, CardClassOptions, CardElement, CardHeaderProps, CardListSkeletonProps, CardPadding, CardProps, ChartLegendItem, ChartLegendProps, ChartLegendTone, ChartTone, CheckboxProps, ChipClassOptions, ChipGroupProps, ChipProps, ChipVariant, Column, ComboboxOption, ComboboxProps, CommandItem, CommandPaletteProps, ConfirmDialogOptions, ConfirmDialogProps, ConnectionBannerProps, CopyButtonProps, DateOptions, DisclosureProps, Divider, DrawerProps, DropdownMenuProps, EmptyStateProps, ErrorStateProps, FaviconProps, FaviconResolver, FieldClassOptions, FieldGroupProps, FieldProps, FieldSize, FileDropzoneProps, FilterBarProps, FilterSheetProps, FlowStepItem, FlowStepStatus, FlowStepsProps, IconButtonClassOptions, IconButtonProps, IconButtonSize, IconButtonVariant, InboxAction, InboxActionCall, InboxActionResult, InboxItem, InboxLabels, InboxListResponse, InboxProps, InboxSettings, InboxSeverity, InboxView, InputProps, KbdProps, KeyValueItem, KeyValueListProps, LabelProps, LayoutNode, LayoutPresetIconProps, LayoutPresetOption, LayoutPresetPickerProps, LineChartProps, LinePoint, LineSeries, LinkCardAccent, LinkCardProps, LinkClassOptions, ListRowProps, LoadingBarProps, LocaleOptions, MediaChipProps, MediaRowProps, MediaThumbProps, MediaThumbShape, MediaThumbSize, MenuItemClassOptions, MenuItemProps, MenuSubHeaderProps, MeterProps, MeterTone, ModalProps, MoreSheetProps, MountScrollspyOptions, MountThemeToggleOptions, NarrowLayout, NavItem, NavRailProps, NishConfig, NishProviderProps, NishStrings, NumberFieldProps, PageContainerProps, PageHeaderProps, PaginationLinkProps, PaginationProps, PaginationSize, PopoverCloseReason, PopoverProps, PortalProps, Preset, ProgressProps, ProgressTone, RadioGroupProps, RadioOption, RadioProps, RangeBarProps, Rect, RejectedFile, RelativeTimeProps, RenderLink, Resource, ResponsiveTableProps, SaveStatus, ScrollRowProps, SearchInputProps, SectionHeaderProps, SectionNavItem, SectionNavProps, SegmentedOption, SegmentedProps, SegmentedTone, SelectProps, SeparatorProps, ServiceTokenListResponse, ServiceTokenView, ServiceTokensSectionProps, SettingRowProps, SettingsSectionProps, ShowToastOptions, SkeletonCardProps, SkeletonLinesProps, SkeletonProps, SkeletonRowsProps, SliderProps, SliderValue, Sort, SortText, SparklineProps, SparklineTone, SpinnerProps, SplitDividersProps, SplitStageProps, StatGridProps, StatGridSkeletonProps, StatProps, StaticToastTone, StatusDotProps, StatusTone, StepBarProps, StickyActionBarProps, StickyBarProps, SwitchProps, TabItem, TabPanelProps, TableProps, TableWrapProps, TabsBreakpoint, TabsProps, TabsSize, TabsVariant, TagInputProps, TdProps, TextareaProps, ThProps, ThemeChoice, ThemeName, ThemePreset, ThemeState, ThemeToggleLabels, ThemeToggleProps, TickerTextProps, ToastAction, ToastItem, ToastOptions, ToastPromiseMessages, ToastTone, ToasterProps, TooltipProps, TrProps, UrlStateAdapter, UrlStateShape, UseResourceOptions, VisuallyHiddenProps, WorkflowBoardAgent, WorkflowBoardPhase, WorkflowBoardProps };
