// The published types of nish-ui/elements/forms (copied to dist/elements-forms.d.ts by
// tsup.config.ts). Hand-written so the package never imports 'lit' (a devDependency) and every
// element stays an HTMLElement for consumers. Keep it in step with the classes in this folder.

/** Base of every nish-ui element (light DOM). */
export declare class NishElement extends HTMLElement {
  readonly updateComplete: Promise<boolean>;
  requestUpdate(): void;
}

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
