// The published types of nish-ui/elements/forms (copied to dist/elements-forms.d.ts by
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

export declare class NishField extends NishElement {
  label: string | undefined;
  hint: string | undefined;
  error: string | undefined;
  optional: boolean;
  /** `stack` (default) or `inline`. */
  layout: string;
  labelWidth: string | undefined;
}

export declare class NishSearch extends NishElement {
  value: string;
  placeholder: string;
  label: string;
  /** `xs`, `sm` or `md` (default). */
  size: string;
  /** `field` (default) or `bare`. */
  variant: string;
  name: string | undefined;
  disabled: boolean;
  /** The inner `<input>` (null until the first render). */
  readonly input: HTMLInputElement | null;
}

export declare class NishSwitch extends NishElement {
  checked: boolean;
  disabled: boolean;
  label: string | undefined;
  description: string | undefined;
  /** `md` (default) or `sm`. */
  size: string;
  /** `end` (default) or `start`. */
  labelSide: string;
  name: string | undefined;
  /** The inner `<button role="switch">` (null until the first render). */
  readonly button: HTMLButtonElement | null;
}

export declare class NishChipGroup extends NishElement {
  label: string;
  /** The `scroll` attribute: one row that scrolls sideways. */
  scrollable: boolean;
  single: boolean;
  /** The values of the pressed chips (each chip's `value` attribute, else its text). */
  values: string[];
}

export interface NishComboboxOption {
  value: string;
  label: string;
  /** Secondary text shown after the label and matched by the default filter. */
  hint?: string;
  disabled?: boolean;
}

export interface NishComboboxChangeDetail {
  /** The chosen option's value, the typed text for a custom entry, or null when cleared. */
  value: string | null;
  /** The chosen option; null for a custom entry or a clear. */
  option: NishComboboxOption | null;
}

export declare class NishCombobox extends NishElement {
  value: string | null;
  placeholder: string | null;
  label: string | null;
  allowCustom: boolean;
  emptyText: string;
  size: string | null;
  disabled: boolean;
  loading: boolean;
  name: string | null;
  options: NishComboboxOption[];
  /** Replaces the default filter. Return true for every option when the server filtered them. */
  filter: ((option: NishComboboxOption, query: string) => boolean) | null;
  /** The inner text input (null until the first render). */
  readonly input: HTMLInputElement | null;
}

export declare class NishTabs extends NishElement {
  label: string;
  value: string;
  /** `pill`, or empty for the underline style. */
  variant: string;
  /** `sm`, `xs`, or empty. */
  size: string;
  block: boolean;
}

export declare class NishSegmented extends NishElement {
  label: string;
  value: string;
  /** `xs`, `md`, or empty. */
  size: string;
  block: boolean;
  /** `wrap`, or empty for one row that scrolls sideways. */
  overflow: string;
  name: string;
}

export declare class NishCopyButton extends NishElement {
  value: string | null;
  /** The id of the element whose text is copied when `value` is not set. */
  for: string | null;
  label: string;
  copiedLabel: string;
  icon: boolean;
}

export declare class NishSparkline extends NishElement {
  /** Numbers, or null for a gap. The attribute is a comma list: `3,5,4,8`. */
  values: (number | null)[];
  tone: string;
  label: string;
  width: number;
  height: number;
  fill: boolean;
  min: number | undefined;
  max: number | undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'nish-field': NishField;
    'nish-search': NishSearch;
    'nish-switch': NishSwitch;
    'nish-chip-group': NishChipGroup;
    'nish-combobox': NishCombobox;
    'nish-tabs': NishTabs;
    'nish-segmented': NishSegmented;
    'nish-copy-button': NishCopyButton;
    'nish-sparkline': NishSparkline;
  }
}
