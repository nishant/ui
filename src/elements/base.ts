import { LitElement } from 'lit';
import { onStringsChange } from './strings';

/** Base class of every nish-ui element. Light DOM, so the zero-specificity `nish-*` classes
 *  from nish-components.css and the page's own CSS apply to what an element renders. */
export class NishElement extends LitElement {
  #stopStrings: (() => void) | null = null;

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // configureStrings() after the element is on the page re-renders it with the new words.
    this.#stopStrings ??= onStringsChange(() => this.stringsChanged());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#stopStrings?.();
    this.#stopStrings = null;
  }

  /** Called when `configureStrings` changed the words. Elements that draw strings outside Lit's
   *  `updated()` path override it. */
  protected stringsChanged(): void {
    this.requestUpdate();
  }
}

/** Run `fn` once the document has been parsed. Parser-created elements connect before their
 *  children exist, so wrapping them earlier would capture an empty element. */
export function whenParsed(fn: () => void): void {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}

/** Register a custom element unless the tag is already defined (another copy of the bundle). */
export function define(tag: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

/** True when `el` lays out right to left (computed `direction`), so arrow keys and drags mirror. */
export function isRtl(el: Element | null | undefined): boolean {
  return !!el && getComputedStyle(el).direction === 'rtl';
}
