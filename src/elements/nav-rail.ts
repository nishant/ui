import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';
import { mountCurrentLink } from './current-link';

/** `<nish-nav-rail label>` with child `<a>`s: wraps them in `<nav class="nish-nav-rail">`. The link
 *  whose path is the longest prefix of `location.pathname` gets `aria-current="page"` (the rule of
 *  `<nish-bottom-nav>`). A child with `data-slot="tools"` becomes the group under the links (after
 *  a divider) and one with `data-slot="footer"` is pinned to the bottom of the rail. */
export class NishNavRail extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
  };

  declare label: string;

  #nav: HTMLElement | null = null;
  #stopCurrent: (() => void) | null = null;

  constructor() {
    super();
    this.label = 'Sections';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
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
    const tools = nav.querySelector<HTMLElement>(':scope > [data-slot="tools"]');
    const footer = nav.querySelector<HTMLElement>(':scope > [data-slot="footer"]');
    tools?.classList.add('nish-nav-rail-tools');
    footer?.classList.add('nish-nav-rail-footer');
    // Keep the slots in order after the links, however the author wrote them.
    if (tools) nav.appendChild(tools);
    if (footer) nav.appendChild(footer);
    this.#sync();
    this.#stopCurrent = mountCurrentLink(nav, (a) => a.classList.add('nish-nav-rail-item'));
  }

  #sync(): void {
    if (!this.#nav) return;
    this.#nav.setAttribute('aria-label', this.label || 'Sections');
  }
}

define('nish-nav-rail', NishNavRail);
