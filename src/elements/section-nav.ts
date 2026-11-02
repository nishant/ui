import type { PropertyValues } from 'lit';
import { mountScrollspy } from '../theme';
import { NishElement, define, whenParsed } from './base';

const onByDefault = {
  fromAttribute: (v: string | null): boolean => v !== 'false',
  toAttribute: (v: boolean): string | null => (v ? null : 'false'),
};

/** `<nish-section-nav label sticky update-hash>` with child `<a href="#id">`: wraps them in
 *  `<nav class="nish-subnav">` and runs `mountScrollspy`, so the link of the section being read
 *  carries `aria-current="true"`. A click scrolls to the section (smoothly, instantly under reduced
 *  motion), writes `#id` with `history.replaceState` unless `update-hash="false"`, and fires
 *  `nish-select` (`detail: { id }`). Attributes: `label` (aria-label, default "Sections"), `sticky`
 *  (stick under the app header; on by default, `sticky="false"` turns it off) and `update-hash`
 *  (on by default). Give the sections the `nish-scroll-target` class so a jump stops below the bars. */
export class NishSectionNav extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    sticky: { reflect: true, converter: onByDefault },
    updateHash: { attribute: 'update-hash', reflect: true, converter: onByDefault },
  };

  declare label: string;
  declare sticky: boolean;
  declare updateHash: boolean;

  #nav: HTMLElement | null = null;
  #stopSpy: (() => void) | null = null;
  #observer: MutationObserver | null = null;
  readonly #onClickBound = (e: Event): void => this.#onClick(e as MouseEvent);

  constructor() {
    super();
    this.label = 'Sections';
    this.sticky = true;
    this.updateHash = true;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopSpy?.();
    this.#stopSpy = null;
    this.#spySticky = null;
    this.#observer?.disconnect();
    this.#observer = null;
    this.#nav?.removeEventListener('click', this.#onClickBound);
    this.#nav = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #mount(): void {
    if (!this.isConnected || this.#nav) return;
    let nav = this.querySelector<HTMLElement>(':scope > nav.nish-subnav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'nish-subnav';
      while (this.firstChild) nav.appendChild(this.firstChild);
      this.appendChild(nav);
    }
    this.#nav = nav;
    this.#sync();
    nav.addEventListener('click', this.#onClickBound);
    this.#startSpy(nav);
    // Links added or removed later (a framework renders them late) need a fresh spy.
    this.#observer = new MutationObserver(() => {
      this.#stopSpy?.();
      this.#startSpy(nav);
    });
    this.#observer.observe(nav, { childList: true });
  }

  #sync(): void {
    const nav = this.#nav;
    if (!nav) return;
    nav.setAttribute('aria-label', this.label || 'Sections');
    nav.style.position = this.sticky ? '' : 'static';
    if (this.#spySticky !== null && this.#spySticky !== this.sticky) this.#startSpy(nav);
  }

  #spySticky: boolean | null = null;

  /** Mounts the scrollspy. Like React's SectionNav, a non-sticky nav publishes no
   *  `--nish-sticky-extra` (the spy is told `height: false`). */
  #startSpy(nav: HTMLElement): void {
    this.#stopSpy?.();
    this.#stopSpy = mountScrollspy(nav, { height: this.sticky });
    this.#spySticky = this.sticky;
  }

  #onClick(e: MouseEvent): void {
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!a || !this.#nav?.contains(a) || a.hash.length < 2 || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    let id: string;
    try {
      id = decodeURIComponent(a.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (this.updateHash) {
      try {
        history.replaceState(history.state, '', `#${a.hash.slice(1)}`);
      } catch {
        /* sandboxed frames refuse history changes */
      }
    }
    this.dispatchEvent(new CustomEvent('nish-select', { bubbles: true, detail: { id } }));
  }
}

define('nish-section-nav', NishSectionNav);
