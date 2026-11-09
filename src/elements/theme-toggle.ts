import type { PropertyValues } from 'lit';
import { mountThemeToggle } from '../theme';
import { NishElement, define } from './base';
import { getStrings } from './strings';

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

  protected override updated(_changed: PropertyValues): void {
    // Remount only when a value differs from what the button was mounted with. Attributes set after
    // connect but before the first update land here too, so no update is skipped by count.
    if (this.#button && this.#mountedWith !== this.#signature()) this.#mount();
  }

  #mountedWith = '';

  /** The three mode names: an attribute wins over a configured string. */
  #words(): [string, string, string] {
    const s = getStrings();
    return [this.labelSystem || s.themeSystem, this.labelLight || s.themeLight, this.labelDark || s.themeDark];
  }

  #signature(): string {
    const s = getStrings();
    return JSON.stringify([this.labelled, this.pill, ...this.#words(), s.themeToggleLabel?.('{a}', '{b}'), s.themeElsewhere]);
  }

  #unmount(): void {
    this.#cleanup?.();
    this.#cleanup = null;
    this.#button?.remove();
    this.#button = null;
  }

  #mount(): void {
    this.#unmount();
    this.#mountedWith = this.#signature();
    const button = document.createElement('button');
    button.className = 'nish-theme-btn';
    button.classList.toggle('nish-theme-btn--labelled', this.labelled);
    button.classList.toggle('nish-theme-btn--pill', this.pill);
    this.prepend(button);
    this.#button = button;
    const [system, light, dark] = this.#words();
    const labels = { system, light, dark };
    const s = getStrings();
    this.#cleanup = mountThemeToggle(button, {
      showLabel: this.labelled,
      labels,
      ...(s.themeToggleLabel ? { strings: { themeToggleLabel: s.themeToggleLabel } } : {}),
      ...(s.themeElsewhere ? { elsewhereLabel: s.themeElsewhere } : {}),
    });
  }
}

define('nish-theme-toggle', NishThemeToggle);
