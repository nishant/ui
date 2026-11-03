import type { PropertyValues } from 'lit';
import { mountHeightVar } from '../theme';
import { NishElement, define, whenParsed } from './base';
import { getStrings } from './strings';
import { mountCurrentLink } from './current-link';

/** `<nish-bottom-nav>`: wraps its child links in `<nav class="nish-bottom-nav">`. The link whose
 *  path is the longest prefix of `location.pathname` gets `aria-current="page"` (`/` matches only
 *  `/`), kept current on `popstate`. Writes the nav's height to `--nish-bottom-nav-h`.
 *  Attributes: `label` (aria-label, default "Sections"), `lg` (the larger variant). */
export class NishBottomNav extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    lg: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare lg: boolean;

  #nav: HTMLElement | null = null;
  #stopHeight: (() => void) | null = null;
  #stopCurrent: (() => void) | null = null;

  constructor() {
    super();
    this.label = '';
    this.lg = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  #mount(): void {
    if (!this.isConnected || this.#nav) return;
    let nav = this.querySelector<HTMLElement>(':scope > nav.nish-bottom-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'nish-bottom-nav';
      while (this.firstChild) nav.appendChild(this.firstChild);
      this.appendChild(nav);
    }
    this.#nav = nav;
    this.#sync();
    this.#stopCurrent = mountCurrentLink(nav, (a) => a.classList.add('nish-bottom-nav-item'));
    this.#stopHeight = mountHeightVar(nav, '--nish-bottom-nav-h');
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#nav = null;
    this.#stopCurrent?.();
    this.#stopCurrent = null;
    this.#stopHeight?.();
    this.#stopHeight = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #sync(): void {
    if (!this.#nav) return;
    this.#nav.setAttribute('aria-label', this.label || getStrings().sections);
    this.#nav.classList.toggle('nish-bottom-nav--lg', this.lg);
  }
}

define('nish-bottom-nav', NishBottomNav);
