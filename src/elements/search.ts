import { html, nothing, svg, type TemplateResult } from 'lit';
import { NishElement, define } from './base';
import { getStrings } from './strings';

const SEARCH_ICON = (size: number) =>
  svg`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`;
const X_ICON = svg`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"></path></svg>`;

/** `<nish-search placeholder="Search jobs">`: a search field with a leading icon and a Clear button
 *  while it has text. Attributes: `value`, `placeholder` (default "Search"), `label` (the input's
 *  aria-label; default "Search", or none inside a `<nish-field>` so the field's label names it), `size` (xs, sm or md), `variant="bare"` (no border or fill),
 *  `name` (on the input, so a form submits it), `disabled`. Typing fires the input's native `input`
 *  event and `nish-input` (`detail: { value }`). Clear and Escape (while there is text) empty the
 *  field, fire `nish-input` and `nish-clear`, and keep focus in the input. */
export class NishSearch extends NishElement {
  static override properties = {
    value: { type: String },
    placeholder: { type: String },
    label: { type: String },
    size: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    name: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  declare value: string;
  declare placeholder: string;
  declare label: string;
  declare size: string;
  declare variant: string;
  declare name: string | undefined;
  declare disabled: boolean;

  constructor() {
    super();
    this.value = '';
    this.label = '';
    this.size = 'md';
    this.variant = 'field';
    this.disabled = false;
  }

  /** The inner `<input>` (null until the first render). */
  get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('input.nish-input');
  }

  override focus(options?: FocusOptions): void {
    this.input?.focus(options);
  }

  #emitInput(): void {
    this.dispatchEvent(new CustomEvent('nish-input', { bubbles: true, detail: { value: this.value } }));
  }

  #onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.#emitInput();
  }

  #clear(): void {
    this.value = '';
    const input = this.input;
    if (input) input.value = '';
    this.#emitInput();
    this.dispatchEvent(new CustomEvent('nish-clear', { bubbles: true }));
    input?.focus();
  }

  #onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.value && !e.defaultPrevented) {
      // Clear first; a second Escape reaches the dialog or page behind.
      e.preventDefault();
      e.stopPropagation();
      this.#clear();
    }
  }

  protected override render(): TemplateResult {
    const s = getStrings();
    const classes = ['nish-search'];
    if (this.size === 'xs' || this.size === 'sm') classes.push(`nish-search--${this.size}`);
    if (this.variant === 'bare') classes.push('nish-search--bare');
    return html`<label class=${classes.join(' ')}>
      ${SEARCH_ICON(this.size === 'md' || !this.size ? 16 : 14)}
      <input
        class="nish-input"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        aria-label=${this.label || (this.closest('nish-field') ? nothing : s.search)}
        placeholder=${this.placeholder ?? s.search}
        name=${this.name ?? nothing}
        ?disabled=${this.disabled}
        .value=${this.value ?? ''}
        @input=${(e: Event) => this.#onInput(e)}
        @keydown=${(e: KeyboardEvent) => this.#onKeydown(e)}
      />
      ${this.value && !this.disabled
        ? html`<button type="button" class="nish-icon-btn nish-icon-btn--xs" aria-label=${s.clear} @click=${() => this.#clear()}>${X_ICON}</button>`
        : nothing}
    </label>`;
  }
}

define('nish-search', NishSearch);
