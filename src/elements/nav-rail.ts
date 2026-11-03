import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';
import { getStrings } from './strings';
import { mountCurrentLink } from './current-link';

/** `<nish-nav-rail label>` with child `<a>`s: wraps them in `<nav class="nish-nav-rail">`. The link
 *  whose path is the longest prefix of `location.pathname` gets `aria-current="page"` (the rule of
 *  `<nish-bottom-nav>`). A child with `data-slot="tools"` becomes the group under the links (after
 *  a divider) and one with `data-slot="footer"` is pinned to the bottom of the rail. Children added after mount join the rail. The default `label` is
 *  the `sections` string (`configureStrings`). */
export class NishNavRail extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
  };

  declare label: string;

  #nav: HTMLElement | null = null;
  #stopCurrent: (() => void) | null = null;
  #late: MutationObserver | null = null;

  constructor() {
    super();
    this.label = '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#late?.disconnect();
    this.#late = null;
    this.#nav = null;
    this.#stopCurrent?.();
    this.#stopCurrent = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #mount(): void {
    if (!this.isConnected || this.#nav) return;
    let nav = this.querySelector<HTMLElement>(':scope > nav.nish-nav-rail');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'nish-nav-rail';
      while (this.firstChild) nav.appendChild(this.firstChild);
      this.appendChild(nav);
    }
    this.#nav = nav;
    this.#arrange(nav);
    this.#sync();
    this.#stopCurrent = mountCurrentLink(nav, (a) => a.classList.add('nish-nav-rail-item'));
    // Children a framework renders after mount join the rail, and links added to a slot get the item class.
    this.#late = new MutationObserver((records) => {
      const n = this.#nav;
      if (!n) return;
      let moved = false;
      for (const rec of records) {
        if (rec.target !== this) continue;
        rec.addedNodes.forEach((node) => {
          if (node !== n && node.nodeType === 1 && node.parentNode === this) {
            n.appendChild(node);
            moved = true;
          }
        });
      }
      // Re-arrange when a child moved in, and when a slot gained links (a mutation inside the nav).
      if (moved || records.some((r) => r.target !== this)) this.#arrange(n);
    });
    this.#late.observe(this, { childList: true });
    this.#late.observe(nav, { childList: true, subtree: true });
  }

  /** Mark the tools and footer slots, keep them after the links (tools, then footer), and give
   *  the links inside them the rail item class. Changes the DOM only when something is out of place. */
  #arrange(nav: HTMLElement): void {
    const tools = nav.querySelector<HTMLElement>(':scope > [data-slot="tools"]');
    const footer = nav.querySelector<HTMLElement>(':scope > [data-slot="footer"]');
    tools?.classList.add('nish-nav-rail-tools');
    footer?.classList.add('nish-nav-rail-footer');
    const tail = [tools, footer].filter((n): n is HTMLElement => !!n);
    const kids = Array.from(nav.children);
    const want = tail.length;
    const inPlace = tail.every((n, i) => kids[kids.length - want + i] === n);
    if (!inPlace) for (const n of tail) nav.appendChild(n);
    for (const a of Array.from(nav.querySelectorAll<HTMLAnchorElement>(':scope > .nish-nav-rail-tools a, :scope > .nish-nav-rail-footer a'))) a.classList.add('nish-nav-rail-item');
  }

  #sync(): void {
    if (!this.#nav) return;
    this.#nav.setAttribute('aria-label', this.label || getStrings().sections);
  }
}

define('nish-nav-rail', NishNavRail);
