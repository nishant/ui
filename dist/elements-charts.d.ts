// The published types of nish-ui/elements/charts (copied to dist/elements-charts.d.ts by
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

declare class NishChartBase extends NishElement {
  /** The chart's `aria-label` (required). */
  label: string;
  /** Plot height in pixels (200 for a line chart, 140 for a bar chart, when unset). */
  height: number;
  /** A color tone such as `chart-2`, `ok` or `loss`. */
  tone: string;
  /** Text shown when there is no data (default "No data yet"). */
  empty: string;
  /** `number`, `percent`, `currency:USD`, `date` or `time`. */
  yFormat: string;
  xFormat: string;
}

export declare class NishLineChart extends NishChartBase {
  /** `[{x,y}]`, `[[x,y]]` or plain numbers. A JSON attribute or a property. */
  data: unknown[];
  /** Several lines. Two or more draw a legend. A JSON attribute or a property. */
  series: unknown[];
  area: boolean;
  baseline: number | undefined;
  yTicks: number;
  xTicks: number;
}

export declare class NishBarChart extends NishChartBase {
  /** `[{label,value}]`, `[[label,value]]` or plain numbers. A JSON attribute or a property. */
  data: unknown[];
  /** `ends` or `all`. */
  xTicks: string;
  /** Print every value on its bar (touch screens do by default). */
  showValues: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'nish-line-chart': NishLineChart;
    'nish-bar-chart': NishBarChart;
  }
}
