import { html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { NishElement, define } from './base';

let counter = 0;

/** `<nish-switch label="Alerts" checked>`: an on/off switch that takes effect at once, a
 *  `<button role="switch">` inside a `.nish-check-row`. Attributes: `checked`, `disabled`, `label`,
 *  `description` (a quieter line under it), `size="sm"`, `label-side` (end, the default, puts the
 *  text after the switch; start puts it before) and `name` (a hidden input holds `on` while
 *  checked, so a form submits it). Click, Space and Enter toggle it and fire `change` and
 *  `nish-change` (`detail: { checked }`). */
export class NishSwitch extends NishElement {
  static override properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
    description: { type: String },
    size: { type: String, reflect: true },
    labelSide: { attribute: 'label-side', reflect: true },
    name: { type: String },
  };

  declare checked: boolean;
  declare disabled: boolean;
  declare label: string | undefined;
  declare description: string | undefined;
  declare size: string;
  declare labelSide: string;
  declare name: string | undefined;

  readonly #uid = `nish-switch-${++counter}`;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.size = 'md';
    this.labelSide = 'end';
  }

  /** The inner `<button role="switch">` (null until the first render). */
  get button(): HTMLButtonElement | null {
    return this.querySelector<HTMLButtonElement>('button.nish-switch');
  }

  override focus(options?: FocusOptions): void {
    this.button?.focus(options);
  }

  #toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.dispatchEvent(new CustomEvent('nish-change', { bubbles: true, detail: { checked: this.checked } }));
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('checked')) this.button?.setAttribute('aria-checked', String(this.checked));
  }

  protected override render(): TemplateResult {
    const hasLabel = !!this.label;
    const text = hasLabel
      ? html`<span style="min-width:0">
          <span id=${`${this.#uid}-label`} style="display:block;line-height:1.375">${this.label}</span>
          ${this.description
            ? html`<span id=${`${this.#uid}-desc`} style="display:block;margin-top:2px;font-size:var(--nish-text-xs);color:var(--nish-hi3)">${this.description}</span>`
            : nothing}
        </span>`
      : nothing;
    const start = this.labelSide === 'start';
    const button = html`<button
      type="button"
      class=${this.size === 'sm' ? 'nish-switch nish-switch--sm' : 'nish-switch'}
      role="switch"
      aria-checked=${String(this.checked)}
      aria-labelledby=${hasLabel ? `${this.#uid}-label` : nothing}
      aria-describedby=${hasLabel && this.description ? `${this.#uid}-desc` : nothing}
      ?disabled=${this.disabled}
      @click=${() => this.#toggle()}
    ></button>`;
    return html`<label class="nish-check-row" style=${start ? 'justify-content:space-between' : nothing}>
      ${start ? text : nothing}${button}${start ? nothing : text}
      ${this.name ? html`<input type="hidden" name=${this.name} value="on" ?disabled=${!this.checked || this.disabled} />` : nothing}
    </label>`;
  }
}

define('nish-switch', NishSwitch);
