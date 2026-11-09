import { shared } from '../runtime';

/** The words the custom elements show. Key names match `NishStrings` (the React side) where the
 *  same text exists there, so one object can feed both: `configureStrings(myStrings)`. */
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

export const DEFAULT_ELEMENT_STRINGS: NishElementStrings = {
  close: 'Close',
  search: 'Search',
  searchPlaceholder: 'Search…',
  noResults: 'No results',
  results: 'Results',
  resultCount: (count) => `${count} result${count === 1 ? '' : 's'}`,
  noMatches: 'No matches',
  searching: 'Searching…',
  clear: 'Clear',
  copy: 'Copy',
  copied: 'Copied',
  copyManual: 'Press Ctrl+C',
  optional: 'Optional',
  sections: 'Sections',
  onThisPage: 'On this page',
  filters: 'Filters',
  clearFilters: 'Clear filters',
  showResults: 'Show results',
  activeCount: (count) => `${count} active`,
  remove: 'Remove',
  removeNamed: (name) => `Remove ${name}`,
  resizeColumns: 'Resize columns',
  resizeRows: 'Resize rows',
  legend: 'Legend',
  noDataYet: 'No data yet',
  noDataNamed: (label) => `${label}: no data`,
  seriesNumber: (n) => `Series ${n}`,
  trend: 'Trend',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeToggleLabel: (current, next) => `Theme: ${current}. Switch to ${next}`,
  themeElsewhere: 'set on another site',
};

interface Store {
  values: NishElementStrings;
  listeners: Set<() => void>;
}

/** One store per page: every element entry and every copy of the package reads and writes it. */
function store(): Store {
  return shared<Store>('element-strings', () => ({ values: { ...DEFAULT_ELEMENT_STRINGS }, listeners: new Set() }));
}

/** Set the words the elements show, once, for the whole page. Keys you leave out keep their
 *  current value (English by default). Elements already on the page update at once. Call it before
 *  or after the elements load. A per-element attribute (`label`, `placeholder`, `empty-text`, ...)
 *  always wins over a configured string. */
export function configureStrings(partial: Partial<NishElementStrings>): void {
  const s = store();
  const next = { ...s.values } as Record<string, unknown>;
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined && Object.hasOwn(DEFAULT_ELEMENT_STRINGS, key)) next[key] = value;
  }
  s.values = next as unknown as NishElementStrings;
  for (const fn of Array.from(s.listeners)) fn();
}

/** The strings now in force. */
export function getStrings(): NishElementStrings {
  const s = store();
  // A store made by an older copy of the package may lack newer keys: fill them from the defaults.
  const values = s.values as unknown as Record<string, unknown>;
  const missing = Object.keys(DEFAULT_ELEMENT_STRINGS).some((k) => values[k] === undefined);
  if (missing) s.values = { ...DEFAULT_ELEMENT_STRINGS, ...Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) } as unknown as NishElementStrings;
  return s.values;
}

/** Call `fn` whenever `configureStrings` changes the words. Returns the unsubscribe function. */
export function onStringsChange(fn: () => void): () => void {
  const listeners = store().listeners;
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
