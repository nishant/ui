import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';
import { xIcon } from './icons';
import { getStrings } from './strings';

/** `<nish-chip-group label="Filter by status" single>` with child `<button>`s: wraps them in
 *  `<div role="group" class="nish-chips">`; each button gets `nish-chip`, `type="button"` and an
 *  `aria-pressed` that a click flips. Attributes: `label` (the group's aria-label), `scroll` (one
 *  row that scrolls sideways on phones) and `single` (at most one pressed). Fires `nish-change`
 *  (`detail: { values }`, each pressed chip's `value` attribute, else its text). A child
 *  `<span class="nish-chip" data-removable>` gets a remove button that removes the chip and fires
 *  `nish-remove` (`detail: { value }`). The `values` property reads and writes the pressed chips. */
export class NishChipGroup extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    scrollable: { attribute: 'scroll', type: Boolean, reflect: true },
    single: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare scrollable: boolean;
  declare single: boolean;

  #group: HTMLElement | null = null;
  #observer: MutationObserver | null = null;
  #pending: string[] | null = null;
  readonly #onClickBound = (e: Event): void => this.#onClick(e);

  constructor() {
    super();
    this.label = '';
    this.scrollable = false;
    this.single = false;
  }

  /** The values of the pressed chips. */
  get values(): string[] {
    if (!this.#group) return this.#pending ?? [];
    return this.#chips()
      .filter((c) => c.getAttribute('aria-pressed') === 'true')
      .map((c) => this.#valueOf(c));
  }

  set values(next: string[]) {
    if (!this.#group) {
      this.#pending = [...next];
      return;
    }
    const want = new Set(next);
    let taken = false;
    for (const chip of this.#chips()) {
      const on = want.has(this.#valueOf(chip)) && !(this.single && taken);
      if (on) taken = true;
      chip.setAttribute('aria-pressed', String(on));
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = null;
    this.#group?.removeEventListener('click', this.#onClickBound);
    this.#group = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
    this.#relabel();
  }

  /** Remove buttons this element added take their label from the current strings. */
  #relabel(): void {
    if (!this.#group) return;
    const s = getStrings();
    for (const chip of this.#chips()) {
      const remove = chip.querySelector<HTMLElement>(':scope > [data-nish-remove]');
      if (!remove) continue;
      const name = this.#textOf(chip);
      remove.setAttribute('aria-label', name ? s.removeNamed(name) : s.remove);
    }
  }

  #chips(): HTMLElement[] {
    return this.#group ? Array.from(this.#group.querySelectorAll<HTMLElement>(':scope > button, :scope > .nish-chip')) : [];
  }

  #textOf(chip: HTMLElement): string {
    let text = '';
    chip.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) text += n.textContent ?? '';
      else if (n instanceof HTMLElement && !n.hasAttribute('data-nish-remove')) text += n.textContent ?? '';
    });
    return text.trim();
  }

  #valueOf(chip: HTMLElement): string {
    return chip.getAttribute('value') ?? this.#textOf(chip);
  }

  #mount(): void {
    if (!this.isConnected || this.#group) return;
    let group = this.querySelector<HTMLElement>(':scope > div.nish-chips');
    if (!group) {
      group = document.createElement('div');
      group.className = 'nish-chips';
      while (this.firstChild) group.appendChild(this.firstChild);
      this.appendChild(group);
    }
    this.#group = group;
    group.setAttribute('role', 'group');
    group.addEventListener('click', this.#onClickBound);
    this.#sync();
    this.#decorate();
    if (this.#pending) {
      this.values = this.#pending;
      this.#pending = null;
    }
    this.#observer = new MutationObserver(() => {
      this.#observer?.disconnect();
      this.#decorate();
      this.#observe();
    });
    this.#observe();
  }

  #observe(): void {
    if (this.#group) this.#observer?.observe(this.#group, { childList: true });
  }

  #sync(): void {
    if (!this.#group) return;
    if (this.label) this.#group.setAttribute('aria-label', this.label);
    else this.#group.removeAttribute('aria-label');
    this.#group.classList.toggle('nish-chips--scroll', this.scrollable);
  }

  #decorate(): void {
    for (const chip of this.#chips()) {
      chip.classList.add('nish-chip');
      if (chip instanceof HTMLButtonElement) {
        if (!chip.hasAttribute('type')) chip.type = 'button';
        if (!chip.hasAttribute('aria-pressed')) chip.setAttribute('aria-pressed', 'false');
      } else if (chip.hasAttribute('data-removable') && !chip.querySelector(':scope > [data-nish-remove]')) {
        const name = this.#textOf(chip);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'nish-icon-btn nish-icon-btn--xs';
        remove.setAttribute('data-nish-remove', '');
        remove.setAttribute('aria-label', name ? getStrings().removeNamed(name) : getStrings().remove);
        remove.appendChild(xIcon(12));
        chip.appendChild(remove);
      }
    }
  }

  #onClick(e: Event): void {
    const target = e.target as Element | null;
    if (!target || !this.#group) return;
    const remove = target.closest<HTMLElement>('[data-nish-remove]');
    if (remove && this.#group.contains(remove)) {
      const chip = remove.parentElement as HTMLElement;
      const value = this.#valueOf(chip);
      // Keep keyboard focus in the group: hand it to the next (else previous) chip's control.
      let heir: HTMLElement | null = null;
      if (chip.contains(document.activeElement)) {
        const all = this.#chips();
        const i = all.indexOf(chip);
        for (const c of [...all.slice(i + 1), ...all.slice(0, i).reverse()]) {
          heir = c.matches('button') ? c : c.querySelector<HTMLElement>('button, a[href], [tabindex]');
          if (heir && !(heir as HTMLButtonElement).disabled) break;
          heir = null;
        }
        if (!heir) {
          this.#group.tabIndex = -1;
          heir = this.#group;
        }
      }
      chip.remove();
      heir?.focus();
      this.dispatchEvent(new CustomEvent('nish-remove', { bubbles: true, detail: { value } }));
      return;
    }
    const chip = target.closest<HTMLElement>('button');
    if (!chip || chip.parentElement !== this.#group || (chip as HTMLButtonElement).disabled || !chip.hasAttribute('aria-pressed')) return;
    const turnOn = chip.getAttribute('aria-pressed') !== 'true';
    if (turnOn && this.single) {
      for (const other of this.#chips()) if (other !== chip && other.hasAttribute('aria-pressed')) other.setAttribute('aria-pressed', 'false');
    }
    chip.setAttribute('aria-pressed', String(turnOn));
    this.dispatchEvent(new CustomEvent('nish-change', { bubbles: true, detail: { values: this.values } }));
  }
}

define('nish-chip-group', NishChipGroup);
