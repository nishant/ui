import type { PropertyValues } from 'lit';
import { NishElement, define, isRtl, whenParsed } from './base';
import { revealInRow, trackScrollEdges } from './tabs';

/** `<nish-segmented>`: moves its child `<button value>` options into `div.nish-seg[role=radiogroup]`.
 *  Each option gets `role=radio` and `aria-checked`; click and the arrow keys (Home, End too) select,
 *  with a roving `tabindex`, and fire `nish-change` (`detail: { value }`) and a native `change`.
 *  Attributes: `label` (aria-label), `value`, `size="xs|md"` (default sm), `block`,
 *  `overflow="wrap"` (default: one row that scrolls sideways with edge fades), `name` (keeps a hidden input). */
export class NishSegmented extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    value: { type: String, reflect: true },
    size: { type: String, reflect: true },
    block: { type: Boolean, reflect: true },
    overflow: { type: String, reflect: true },
    name: { type: String, reflect: true },
  };

  declare label: string;
  declare value: string;
  declare size: string;
  declare block: boolean;
  declare overflow: string;
  declare name: string;

  #group: HTMLElement | null = null;
  #input: HTMLInputElement | null = null;
  #stopEdges: (() => void) | null = null;
  #observer: MutationObserver | null = null;
  readonly #onClick = (e: Event): void => {
    const opt = (e.target as Element | null)?.closest<HTMLButtonElement>('button');
    if (opt && this.#group?.contains(opt)) this.#select(opt);
  };
  readonly #onKey = (e: KeyboardEvent): void => {
    const opts = this.#enabled();
    if (!opts.length) return;
    const from = opts.findIndex((o) => o === document.activeElement);
    const checked = opts.findIndex((o) => o.getAttribute('aria-checked') === 'true');
    const at = from >= 0 ? from : checked;
    let next: HTMLButtonElement | undefined;
    const rtl = isRtl(this.#group);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward || e.key === 'ArrowDown') next = at < 0 ? opts[0] : opts[(at + 1) % opts.length];
    else if (e.key === back || e.key === 'ArrowUp') next = at < 0 ? opts[opts.length - 1] : opts[(at - 1 + opts.length) % opts.length];
    else if (e.key === 'Home') next = opts[0];
    else if (e.key === 'End') next = opts[opts.length - 1];
    else return;
    e.preventDefault();
    this.#select(next);
    next.focus();
  };

  constructor() {
    super();
    this.label = '';
    this.value = '';
    this.size = '';
    this.block = false;
    this.overflow = 'scroll';
    this.name = '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#group?.removeEventListener('click', this.#onClick);
    this.#group?.removeEventListener('keydown', this.#onKey);
    this.#group = null;
    this.#stopEdges?.();
    this.#stopEdges = null;
    this.#observer?.disconnect();
    this.#observer = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #mount(): void {
    if (!this.isConnected || this.#group) return;
    let group = this.querySelector<HTMLElement>(':scope > div.nish-seg');
    if (!group) {
      group = document.createElement('div');
      for (const child of Array.from(this.children)) {
        if (child instanceof HTMLButtonElement) group.appendChild(child);
      }
      this.insertBefore(group, this.firstChild);
    }
    this.#group = group;
    group.classList.add('nish-seg');
    group.setAttribute('role', 'radiogroup');
    group.addEventListener('click', this.#onClick);
    group.addEventListener('keydown', this.#onKey);
    this.#observer = new MutationObserver(() => {
      this.#observer?.disconnect();
      this.#sync();
      this.#observe();
    });
    this.#observe();
    this.#sync();
  }

  #observe(): void {
    if (this.#group) this.#observer?.observe(this.#group, { childList: true });
  }

  #options(): HTMLButtonElement[] {
    return this.#group ? Array.from(this.#group.querySelectorAll<HTMLButtonElement>(':scope > button')) : [];
  }

  #enabled(): HTMLButtonElement[] {
    return this.#options().filter((o) => !o.disabled);
  }

  #valueOf(opt: HTMLElement): string {
    return opt.getAttribute('value') ?? (opt.textContent ?? '').trim();
  }

  #select(opt: HTMLButtonElement): void {
    if (opt.disabled) return;
    const value = this.#valueOf(opt);
    const changed = value !== this.value;
    this.value = value;
    this.#apply();
    if (changed) {
      this.dispatchEvent(new CustomEvent('nish-change', { detail: { value }, bubbles: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  #sync(): void {
    const group = this.#group;
    if (!group) return;
    const scroll = this.overflow !== 'wrap';
    group.setAttribute('aria-label', this.label);
    group.classList.toggle('nish-seg--xs', this.size === 'xs');
    group.classList.toggle('nish-seg--md', this.size === 'md');
    group.classList.toggle('nish-seg--block', this.block);
    group.classList.toggle('nish-no-scrollbar', scroll);
    group.classList.toggle('nish-scroll-fade', scroll);
    group.style.overflowX = scroll ? 'auto' : '';
    if (scroll && !this.#stopEdges) this.#stopEdges = trackScrollEdges(group);
    else if (!scroll && this.#stopEdges) {
      this.#stopEdges();
      this.#stopEdges = null;
      delete group.dataset.atStart;
      delete group.dataset.atEnd;
    }
    if (this.name) {
      if (!this.#input) {
        this.#input = document.createElement('input');
        this.#input.type = 'hidden';
        this.appendChild(this.#input);
      }
      this.#input.name = this.name;
    } else if (this.#input) {
      this.#input.remove();
      this.#input = null;
    }
    this.#apply();
  }

  #apply(): void {
    const group = this.#group;
    if (!group) return;
    const opts = this.#options();
    let checked: HTMLButtonElement | null = null;
    for (const opt of opts) {
      const on = this.#valueOf(opt) === this.value && !opt.disabled;
      if (on) checked = opt;
      opt.type = 'button';
      opt.setAttribute('role', 'radio');
      opt.setAttribute('aria-checked', String(on));
    }
    // With none checked the first enabled option keeps the Tab stop, so the group stays reachable.
    const stop = checked ?? opts.find((o) => !o.disabled) ?? null;
    for (const opt of opts) opt.tabIndex = opt === stop ? 0 : -1;
    if (this.#input) this.#input.value = checked ? this.value : '';
    if (checked && this.overflow !== 'wrap') revealInRow(group, checked);
  }
}

define('nish-segmented', NishSegmented);
