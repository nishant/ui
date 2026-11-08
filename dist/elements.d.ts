// The published types of nish-ui/elements (copied to dist/elements.d.ts by tsup.config.ts).
// Hand-written so the package never imports 'lit' (a devDependency) and every element stays an
// HTMLElement for consumers. Keep it in step with the classes in this folder.

/** Base of every nish-ui element (light DOM). */
export declare class NishElement extends HTMLElement {
  readonly updateComplete: Promise<boolean>;
  requestUpdate(): void;
}

/** The words the custom elements show. Key names match `NishStrings` (the React side) where the
 *  same text exists there. */
export interface NishElementStrings {
  /** nish-command-palette, nish-filter-bar: close button label. */
  close: string;
  /** nish-search (default placeholder and aria-label), nish-command-palette (dialog name). */
  search: string;
  /** nish-command-palette: input placeholder and its accessible name. */
  searchPlaceholder: string;
  /** nish-command-palette: nothing found. */
  noResults: string;
  /** nish-command-palette: listbox label. */
  results: string;
  /** nish-command-palette, nish-combobox: live-region text for a count of matches. */
  resultCount: (count: number) => string;
  /** nish-combobox: empty list. */
  noMatches: string;
  /** nish-combobox: loading row and live-region text. */
  searching: string;
  /** nish-search, nish-combobox, nish-filter-bar: clear button. */
  clear: string;
  /** nish-copy-button: idle label. */
  copy: string;
  /** nish-copy-button: label after copying. */
  copied: string;
  /** nish-copy-button: label while the clipboard is refused and the text is selected. */
  copyManual: string;
  /** nish-field: tag for a non-required field. */
  optional: string;
  /** nish-bottom-nav, nish-nav-rail, nish-section-nav: default landmark label. */
  sections: string;
  /** nish-filter-bar: sheet title and the button that opens it. */
  filters: string;
  /** nish-filter-bar: wide-layout clear button. */
  clearFilters: string;
  /** nish-filter-bar: sheet button that closes it. */
  showResults: string;
  /** nish-filter-bar: label of the active-filter count badge. */
  activeCount: (count: number) => string;
  /** nish-chip-group: remove button without a chip name. */
  remove: string;
  /** nish-chip-group: remove button for a named chip. */
  removeNamed: (name: string) => string;
  /** nish-split: divider label in a row split. */
  resizeColumns: string;
  /** nish-split: divider label in a column split. */
  resizeRows: string;
  /** nish-line-chart: legend landmark. */
  legend: string;
  /** nish-line-chart, nish-bar-chart: text of the empty state. */
  noDataYet: string;
  /** nish-line-chart, nish-bar-chart, nish-sparkline: accessible name of a chart with no data. */
  noDataNamed: (label: string) => string;
  /** nish-line-chart: name of a series without a label (1-based position). */
  seriesNumber: (n: number) => string;
  /** nish-sparkline: accessible name when no `label` is set. */
  trend: string;
  /** nish-theme-toggle: name of the system mode. */
  themeSystem: string;
  /** nish-theme-toggle: name of the light mode. */
  themeLight: string;
  /** nish-theme-toggle: name of the dark mode. */
  themeDark: string;
}

/** Set the words the elements show, once, for the whole page (one store shared by every entry and
 *  every copy of the package). Keys you leave out keep their current value (English by default).
 *  Elements already on the page update at once. A per-element attribute (`label`, `placeholder`,
 *  `empty-text`, ...) always wins over a configured string. */
export declare function configureStrings(partial: Partial<NishElementStrings>): void;

/** Register a custom element unless the tag is already defined. */
export declare function define(tag: string, ctor: CustomElementConstructor): void;

export declare class NishThemeToggle extends NishElement {
  labelled: boolean;
  pill: boolean;
  labelSystem: string | undefined;
  labelLight: string | undefined;
  labelDark: string | undefined;
}

export declare class NishSheet extends NishElement {
  open: boolean;
  label: string | null;
  /** The wrapping <dialog>, once children are moved in. */
  dialog: HTMLDialogElement | null;
  show(): void;
  close(): void;
}

export declare class NishDialog extends NishElement {
  open: boolean;
  label: string | null;
  /** The wrapping <dialog>, once children are moved in. */
  dialog: HTMLDialogElement | null;
  show(): void;
  close(value?: string): void;
}

export declare class NishBottomNav extends NishElement {
  label: string;
  lg: boolean;
}

export type ToastTone = 'neutral' | 'ok' | 'warn' | 'loss' | 'info';

export interface ToastOptions {
  tone?: ToastTone;
  /** Milliseconds before it hides itself, or 'sticky'. Default 6000. */
  duration?: number | 'sticky';
  action?: { label: string; href?: string; onClick?: () => void };
  dismissLabel?: string;
}

/** Show a toast. Returns a function that hides it now. Needs nish-components.css. */
export declare function toast(content: string | Node, opts?: ToastOptions): () => void;

declare global {
  interface HTMLElementTagNameMap {
    'nish-theme-toggle': NishThemeToggle;
    'nish-sheet': NishSheet;
    'nish-dialog': NishDialog;
    'nish-bottom-nav': NishBottomNav;
  }
}
