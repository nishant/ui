import { LitElement } from 'lit';

/** Base class of every nish-ui element. Light DOM, so the zero-specificity `nish-*` classes
 *  from nish-components.css and the page's own CSS apply to what an element renders. */
export class NishElement extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this;
  }
}

/** Register a custom element unless the tag is already defined (another copy of the bundle). */
export function define(tag: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}
