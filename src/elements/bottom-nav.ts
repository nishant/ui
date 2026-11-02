import type { PropertyValues } from 'lit';
import { mountHeightVar } from '../theme';
import { NishElement, define, whenParsed } from './base';

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
  #auto: HTMLAnchorElement | null = null;
  #stopHeight: (() => void) | null = null;
  #observer: MutationObserver | null = null;
  readonly #onNavigate = (): void => this.#markCurrent();

  constructor() {
    super();
    this.label = 'Sections';
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
    this.#markCurrent();
    window.addEventListener('popstate', this.#onNavigate);
    this.#observer = new MutationObserver(() => {
      this.#observer?.disconnect();
      this.#markCurrent();
      this.#observe();
    });
    this.#observe();
    this.#stopHeight = mountHeightVar(nav, '--nish-bottom-nav-h');
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#nav = null;
    window.removeEventListener('popstate', this.#onNavigate);
    this.#observer?.disconnect();
    this.#observer = null;
    this.#stopHeight?.();
    this.#stopHeight = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #observe(): void {
    if (this.#nav) this.#observer?.observe(this.#nav, { childList: true });
  }

  #sync(): void {
    if (!this.#nav) return;
    this.#nav.setAttribute('aria-label', this.label || 'Sections');
    this.#nav.classList.toggle('nish-bottom-nav--lg', this.lg);
  }

  #markCurrent(): void {
    if (!this.#nav) return;
    const path = location.pathname;
    let best: HTMLAnchorElement | null = null;
    let bestLen = -1;
    for (const a of Array.from(this.#nav.querySelectorAll<HTMLAnchorElement>(':scope > a'))) {
      a.classList.add('nish-bottom-nav-item');
      if (!a.getAttribute('href')) continue;
      let url: URL;
      try {
        url = new URL(a.getAttribute('href') as string, location.href);
      } catch {
        continue;
      }
      if (url.origin !== location.origin) continue;
      const base = url.pathname;
      const hit = base === '/' ? path === '/' : path === base || path.startsWith(base.endsWith('/') ? base : `${base}/`);
      if (hit && base.length > bestLen) {
        best = a;
        bestLen = base.length;
      }
    }
    // With no path match (srcdoc frames, hash-routed sites) leave an author-set aria-current alone;
    // only undo the mark this element set itself.
    if (!best) {
      this.#auto?.removeAttribute('aria-current');
      this.#auto = null;
      return;
    }
    for (const a of Array.from(this.#nav.querySelectorAll<HTMLAnchorElement>(':scope > a'))) a.removeAttribute('aria-current');
    best.setAttribute('aria-current', 'page');
    this.#auto = best;
  }
}

define('nish-bottom-nav', NishBottomNav);
