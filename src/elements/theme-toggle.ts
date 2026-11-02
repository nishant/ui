import type { PropertyValues } from 'lit';
import { mountThemeToggle } from '../theme';
import { NishElement, define } from './base';

/** `<nish-theme-toggle>`: one `<button class="nish-theme-btn">` that cycles System, Light and Dark.
 *  Attributes: `labelled` (also shows the current choice as a word), `pill` (rounded pill look),
 *  `label-system`, `label-light` and `label-dark` (replace the words in the button's label). */
export class NishThemeToggle extends NishElement {
  static override properties = {
    labelled: { type: Boolean, reflect: true },
    pill: { type: Boolean, reflect: true },
    labelSystem: { attribute: 'label-system' },
    labelLight: { attribute: 'label-light' },
    labelDark: { attribute: 'label-dark' },
  };

  declare labelled: boolean;
  declare pill: boolean;
  declare labelSystem: string | undefined;
  declare labelLight: string | undefined;
  declare labelDark: string | undefined;

  #button: HTMLButtonElement | null = null;
  #cleanup: (() => void) | null = null;

  constructor() {
    super();
    this.labelled = false;
    this.pill = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#mount();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#unmount();
  }

  protected override updated(changed: PropertyValues): void {
    // The first update follows the mount in connectedCallback, which already read the attributes.
    if (this.#button && changed.size > 0 && this.#mountedOnce) this.#mount();
    this.#mountedOnce = true;
  }

  #mountedOnce = false;

  #unmount(): void {
    this.#cleanup?.();
    this.#cleanup = null;
    this.#button?.remove();
    this.#button = null;
  }

  #mount(): void {
    this.#unmount();
    const button = document.createElement('button');
    button.className = 'nish-theme-btn';
    button.classList.toggle('nish-theme-btn--labelled', this.labelled);
    button.classList.toggle('nish-theme-btn--pill', this.pill);
    this.prepend(button);
    this.#button = button;
    const labels: Record<string, string> = {};
    if (this.labelSystem) labels.system = this.labelSystem;
    if (this.labelLight) labels.light = this.labelLight;
    if (this.labelDark) labels.dark = this.labelDark;
    this.#cleanup = mountThemeToggle(button, { showLabel: this.labelled, labels });
  }
}

define('nish-theme-toggle', NishThemeToggle);
