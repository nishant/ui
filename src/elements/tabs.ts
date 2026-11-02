import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';

/** Keep `data-at-start` / `data-at-end` on a sideways scroller current (the edge fades in
 *  base.css read them), as `useScrollEdges` does for the React components. Returns a stop function. */
export function trackScrollEdges(el: HTMLElement): () => void {
  const update = (): void => {
    const max = el.scrollWidth - el.clientWidth;
    el.dataset.atStart = String(el.scrollLeft <= 1);
    el.dataset.atEnd = String(max <= 1 || el.scrollLeft >= max - 1);
  };
  update();
  el.addEventListener('scroll', update, { passive: true });
  let ro: ResizeObserver | undefined;
  const observeChildren = (): void => {
    if (ro) for (const c of Array.from(el.children)) ro.observe(c);
  };
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(update);
    ro.observe(el);
    observeChildren();
  }
  let mo: MutationObserver | undefined;
  if (typeof MutationObserver !== 'undefined') {
    mo = new MutationObserver(() => {
      update();
      observeChildren();
    });
    mo.observe(el, { childList: true });
  }
  return () => {
    el.removeEventListener('scroll', update);
    ro?.disconnect();
    mo?.disconnect();
  };
}

/** Scroll `child` into view inside the sideways scroller `scroller`, with 8px of margin
 *  (the same rule as React's `revealInRow`). */
export function revealInRow(scroller: HTMLElement, child: HTMLElement): void {
  const s = scroller.getBoundingClientRect();
  const c = child.getBoundingClientRect();
  const pad = 8;
  if (c.left < s.left + pad) scroller.scrollLeft += c.left - s.left - pad;
  else if (c.right > s.right - pad) scroller.scrollLeft += c.right - s.right + pad;
}

let counter = 0;
const safe = (v: string): string => v.replace(/[^\w-]+/g, '-');

/** `<nish-tabs>`: moves its child `<button value>` tabs into `div.nish-tabs[role=tablist]` and wires the
 *  ARIA tabs pattern (roving tabindex, ArrowLeft/Right/Home/End, selection follows focus).
 *  Panels are elements with `data-tab-panel="<value>"` and `data-tabs="<this id>"` anywhere in the
 *  document (or inside this element when it has no id); each gets `role=tabpanel`, `aria-labelledby`
 *  and `hidden` unless selected. Fires `nish-change` (`detail: { value }`).
 *  Attributes: `label` (the tab list's aria-label), `value`, `variant="pill"`, `size="sm|xs"`, `block`. */
export class NishTabs extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    value: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    block: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare value: string;
  declare variant: string;
  declare size: string;
  declare block: boolean;

  #list: HTMLElement | null = null;
  #base = '';
  #stopEdges: (() => void) | null = null;
  #observer: MutationObserver | null = null;
  readonly #onClick = (e: Event): void => {
    const tab = (e.target as Element | null)?.closest<HTMLButtonElement>('button');
    if (tab && this.#list?.contains(tab)) this.#select(tab);
  };
  readonly #onKey = (e: KeyboardEvent): void => {
    const tabs = this.#enabled();
    if (!tabs.length) return;
    const from = tabs.findIndex((t) => t === document.activeElement);
    const at = from >= 0 ? from : Math.max(0, tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'));
    let next: HTMLButtonElement | undefined;
    if (e.key === 'ArrowRight') next = tabs[(at + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(at - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    else return;
    e.preventDefault();
    this.#select(next);
    next.focus();
  };

  constructor() {
    super();
    this.label = '';
    this.value = '';
    this.variant = '';
    this.size = '';
    this.block = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#list?.removeEventListener('click', this.#onClick);
    this.#list?.removeEventListener('keydown', this.#onKey);
    this.#list = null;
    this.#stopEdges?.();
    this.#stopEdges = null;
    this.#observer?.disconnect();
    this.#observer = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #mount(): void {
    if (!this.isConnected || this.#list) return;
    let list = this.querySelector<HTMLElement>(':scope > div.nish-tabs');
    if (!list) {
      list = document.createElement('div');
      for (const child of Array.from(this.children)) {
        if (child instanceof HTMLButtonElement) list.appendChild(child);
      }
      this.insertBefore(list, this.firstChild);
    }
    this.#list = list;
    this.#base = this.id || `nish-tabs-${++counter}`;
    list.setAttribute('role', 'tablist');
    list.style.overflowX = 'auto';
    list.classList.add('nish-tabs', 'nish-no-scrollbar', 'nish-scroll-fade');
    list.addEventListener('click', this.#onClick);
    list.addEventListener('keydown', this.#onKey);
    this.#stopEdges = trackScrollEdges(list);
    this.#observer = new MutationObserver(() => {
      this.#observer?.disconnect();
      this.#sync();
      this.#observe();
    });
    this.#observe();
    this.#sync();
  }

  #observe(): void {
    if (this.#list) this.#observer?.observe(this.#list, { childList: true });
  }

  #tabs(): HTMLButtonElement[] {
    return this.#list ? Array.from(this.#list.querySelectorAll<HTMLButtonElement>(':scope > button')) : [];
  }

  #enabled(): HTMLButtonElement[] {
    return this.#tabs().filter((t) => !t.disabled);
  }

  #valueOf(tab: HTMLElement): string {
    return tab.getAttribute('value') ?? (tab.textContent ?? '').trim();
  }

  #panels(): HTMLElement[] {
    const root: ParentNode = this.id ? document : this;
    const all = Array.from(root.querySelectorAll<HTMLElement>('[data-tab-panel]'));
    return this.id ? all.filter((p) => p.getAttribute('data-tabs') === this.id) : all;
  }

  #select(tab: HTMLButtonElement): void {
    if (tab.disabled) return;
    const value = this.#valueOf(tab);
    const changed = value !== this.value;
    this.value = value;
    this.#apply();
    if (changed) {
      this.dispatchEvent(new CustomEvent('nish-change', { detail: { value }, bubbles: true }));
    }
  }

  /** Bring attributes, tab state and panels in line with the current attributes. */
  #sync(): void {
    const list = this.#list;
    if (!list) return;
    list.setAttribute('aria-label', this.label);
    list.classList.toggle('nish-tabs--pill', this.variant === 'pill');
    list.classList.toggle('nish-tabs--sm', this.size === 'sm');
    list.classList.toggle('nish-tabs--xs', this.size === 'xs');
    list.classList.toggle('nish-tabs--block', this.block);
    const tabs = this.#tabs();
    if (!tabs.some((t) => this.#valueOf(t) === this.value && !t.disabled)) {
      const first = tabs.find((t) => !t.disabled);
      if (first) this.value = this.#valueOf(first);
    }
    this.#apply();
  }

  #apply(): void {
    const list = this.#list;
    if (!list) return;
    const tabs = this.#tabs();
    const panels = this.#panels();
    let selected: HTMLButtonElement | null = null;
    for (const tab of tabs) {
      const v = this.#valueOf(tab);
      const on = v === this.value && !tab.disabled;
      if (on) selected = tab;
      if (!tab.id) tab.id = `${this.#base}-tab-${safe(v)}`;
      tab.type = 'button';
      tab.classList.add('nish-tab');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(on));
      const panel = panels.find((p) => p.getAttribute('data-tab-panel') === v);
      if (panel) {
        if (!panel.id) panel.id = `${this.#base}-panel-${safe(v)}`;
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.hidden = !on;
      } else {
        tab.removeAttribute('aria-controls');
      }
    }
    const stop = selected ?? tabs.find((t) => !t.disabled) ?? null;
    for (const tab of tabs) tab.tabIndex = tab === stop ? 0 : -1;
    if (selected) revealInRow(list, selected);
  }
}

define('nish-tabs', NishTabs);
