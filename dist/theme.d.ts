type Scheme = 'dark' | 'light';
interface ThemeDef {
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}
declare const THEMES: Record<'dark' | 'light' | 'slate' | 'terminal' | 'mocha' | 'ocean' | 'contrast', ThemeDef>;

interface NishStrings {
    /** Modal, Drawer, SheetHandle, CommandPalette: close button label. */
    close: string;
    /** ConfirmDialog, service-tokens revoke dialog: cancel button. */
    cancel: string;
    /** DropdownMenu: sheet title on phones. */
    menu: string;
    /** DropdownMenu sub-menu header, read by screen readers before the parent label. */
    back: string;
    /** ContextMenu: the menu's accessible name when no menuLabel is given. */
    contextMenu: string;
    /** VirtualTable: live-region message after the sort changes (dir null when cleared). */
    sortAnnounce: (header: string, dir: 'asc' | 'desc' | null) => string;
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
    /** DatePicker: custom validity message for text that is not a date. */
    invalidDate: string;
    /** DatePicker: calendar button name while empty. */
    chooseDate: string;
    /** DatePicker: calendar button name once a date is set. */
    changeDate: (date: string) => string;
    /** Calendar: previous month button. */
    previousMonth: string;
    /** Calendar: next month button. */
    nextMonth: string;
    /** Calendar: month select name. */
    month: string;
    /** Calendar: year select name. */
    year: string;
    /** DatePicker: day token in the placeholder. */
    dayToken: string;
    /** DatePicker: month token in the placeholder. */
    monthToken: string;
    /** DatePicker: year token in the placeholder. */
    yearToken: string;
    /** DateRangePicker: calendar button name while empty, and the popover name. */
    chooseDates: string;
    /** DateRangePicker: calendar button name once a range is set. */
    changeDates: (range: string) => string;
    /** RangeCalendar, DateRangePicker: two dates read as a range. */
    dateRange: (from: string, to: string) => string;
    /** RangeCalendar: live-region text after the first day is picked. */
    rangeStarted: (start: string) => string;
    /** DateRangePicker: custom validity message for text that is not a range. */
    invalidDateRange: string;
    /** TimeField: name of the hour box. */
    hour: string;
    /** TimeField: name of the minute box. */
    minute: string;
    /** TimeField: name of the AM/PM select. */
    dayPeriod: string;
    /** TimeField: custom validity message for a time that is incomplete or not allowed. */
    invalidTime: string;
    /** MultiSelect: announcement after a value is added. */
    optionAdded: (label: string) => string;
    /** MultiSelect: announcement after a value is removed. */
    optionRemoved: (label: string) => string;
    /** MultiSelect: clear-all button. */
    clearAll: string;
    /** MultiSelect: announcement when the pick limit is reached. */
    maxSelected: (max: number) => string;
    /** Carousel: role description of the region. */
    carouselRole: string;
    /** Carousel: role description of each slide. */
    slideRole: string;
    /** Carousel: label of each slide. */
    slideLabel: (n: number, count: number) => string;
    /** Carousel: previous slide button. */
    previousSlide: string;
    /** Carousel: next slide button. */
    nextSlide: string;
    /** Carousel: slide picker dot name. */
    goToSlide: (n: number) => string;
    /** Carousel: label of the slide picker group. */
    slidePicker: string;
    /** Carousel: start auto-rotation button. */
    startRotation: string;
    /** Carousel: stop auto-rotation button. */
    stopRotation: string;
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
    /** AgentNode: spoken state word. */
    agentQueued: string;
    /** AgentNode: spoken state word. */
    agentRunning: string;
    /** AgentNode: spoken state word. */
    agentDone: string;
    /** AgentNode: spoken state word. */
    agentFailed: string;
    /** FlowSteps: hidden text appended to a finished step. */
    stepDone: string;
    /** FlowSteps: hidden text appended to a failed step. */
    stepFailed: string;
    /** ResponsiveTable: label of the sort-direction button, from the current direction. */
    sortToggle: (dir: 'asc' | 'desc' | null) => string;
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
    /** TagInput: shown when a tag is refused because the limit is reached. */
    maxTags: (max: number) => string;
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
    /** Replace the label sentence: `themeToggleLabel(current, next)`. Defaults to THEME_STRINGS. */
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
    /** Accessible name of the dismiss button. Default DISPLAY_STRINGS.dismiss ("Dismiss"). */
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
    /** The cancel button's label. Default OVERLAY_STRINGS.cancel ("Cancel"). */
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
 *  Returns a function that removes everything; its `lock(id)` keeps that section's link current until the user scrolls. */
declare function mountScrollspy(nav: HTMLElement, o?: MountScrollspyOptions): (() => void) & {
    lock: (id: string) => void;
};
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
