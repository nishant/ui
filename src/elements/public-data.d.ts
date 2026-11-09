// The published types of nish-ui/elements/data (copied to dist/elements-data.d.ts by
// tsup.config.ts). Hand-written so the package never imports 'lit' (a devDependency) and every
// element stays an HTMLElement for consumers. Keep it in step with the classes in this folder.

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
  /** nish-bottom-nav, nish-nav-rail: default landmark label. */
  sections: string;
  /** nish-section-nav: default landmark label. */
  onThisPage: string;
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
  /** nish-theme-toggle: the button's label sentence, from the current mode name to the next one. */
  themeToggleLabel?: (current: string, next: string) => string;
  /** nish-theme-toggle: the words appended when another site set the theme ("set on another site"). */
  themeElsewhere?: string;
}

/** Set the words the elements show, once, for the whole page (one store shared by every entry and
 *  every copy of the package). Keys you leave out keep their current value (English by default).
 *  Elements already on the page update at once. A per-element attribute (`label`, `placeholder`,
 *  `empty-text`, ...) always wins over a configured string. */
export declare function configureStrings(partial: Partial<NishElementStrings>): void;

/** Register a custom element unless the tag is already defined. */
export declare function define(tag: string, ctor: CustomElementConstructor): void;

export interface NishResizeDetail {
  /** Each pane's share in percent, summing to 100. */
  sizes: number[];
}

export interface NishCommandItem {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  keywords?: string[];
  href?: string;
}

export interface NishCommandSelectDetail {
  id: string;
}

export declare class NishTableSort extends NishElement {
  /** Only fire `nish-sort` (the server sorts); the rows are not reordered. */
  manual: boolean;
}

export declare class NishFilterBar extends NishElement {
  activeCount: number;
  sheetTitle: string;
  /** `md` (default) or `lg`: the width below which the filters move into a sheet. */
  sheetBelow: 'md' | 'lg';
  sticky: boolean;
}

export declare class NishSplit extends NishElement {
  /** `row` (default) or `column`. */
  orientation: 'row' | 'column';
  /** Each pane's share in percent; the attribute is a comma list: `50,50`. */
  sizes: number[] | null;
  /** Smallest pane length in pixels. */
  min: number;
  storageKey: string | null;
}

export declare class NishNavRail extends NishElement {
  label: string;
}

export declare class NishScrollRow extends NishElement {
  label: string;
  bleed: boolean;
  snap: boolean;
  /** On by default; `fade="false"` turns the edge fades off. */
  fade: boolean;
}

export declare class NishSectionNav extends NishElement {
  label: string;
  /** On by default; `sticky="false"` turns it off. */
  sticky: boolean;
  /** On by default; `update-hash="false"` leaves the URL alone. */
  updateHash: boolean;
}

export declare class NishCommandPalette extends NishElement {
  open: boolean;
  hotkey: boolean;
  placeholder: string;
  emptyText: string;
  items: NishCommandItem[];
  show(): void;
  close(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'nish-table-sort': NishTableSort;
    'nish-filter-bar': NishFilterBar;
    'nish-split': NishSplit;
    'nish-nav-rail': NishNavRail;
    'nish-scroll-row': NishScrollRow;
    'nish-section-nav': NishSectionNav;
    'nish-command-palette': NishCommandPalette;
  }
}
