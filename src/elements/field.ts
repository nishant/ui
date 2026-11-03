import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';
import { getStrings } from './strings';

let counter = 0;

/** `<nish-field label="Email" hint="We never share it" error optional layout="inline" label-width="7rem">`
 *  wraps its one child control in a `.nish-field`: a `<label for>`, the control, and a hint or an
 *  error. It gives the control an id when it has none, ties the message with `aria-describedby`
 *  and sets `aria-invalid="true"` while `error` is set (the hint hides while an error shows). A
 *  child `<nish-combobox>` or `<nish-search>` gets the id on its inner input. */
export class NishField extends NishElement {
  static override properties = {
    label: { type: String },
    hint: { type: String },
    error: { type: String },
    optional: { type: Boolean, reflect: true },
    layout: { type: String, reflect: true },
    labelWidth: { attribute: 'label-width', reflect: true },
  };

  declare label: string | undefined;
  declare hint: string | undefined;
  declare error: string | undefined;
  declare optional: boolean;
  declare layout: string;
  declare labelWidth: string | undefined;

  readonly #uid = `nish-field-${++counter}`;
  #wrap: HTMLElement | null = null;
  #control: HTMLElement | null = null;
  #observer: MutationObserver | null = null;
  #waiting: MutationObserver | null = null;
  #authorDescribedBy = '';
  #setInvalid = false;

  constructor() {
    super();
    this.optional = false;
    this.layout = 'stack';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer?.disconnect();
    this.#observer = null;
    this.#waiting?.disconnect();
    this.#waiting = null;
    this.#wrap = null;
    this.#control = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #mount(): void {
    if (!this.isConnected || this.#wrap) return;
    let wrap = this.querySelector<HTMLElement>(':scope > div.nish-field');
    if (!wrap) {
      const control = this.firstElementChild as HTMLElement | null;
      if (!control) {
        // No control yet: wait for the one appended later, then wrap it.
        if (!this.#waiting) {
          this.#waiting = new MutationObserver(() => {
            if (!this.firstElementChild) return;
            this.#waiting?.disconnect();
            this.#waiting = null;
            this.#mount();
          });
          this.#waiting.observe(this, { childList: true });
        }
        return;
      }
      wrap = document.createElement('div');
      wrap.appendChild(control);
      this.appendChild(wrap);
    }
    wrap.classList.add('nish-field');
    this.#wrap = wrap;
    this.#control = Array.from(wrap.children).find(
      (c) => !c.matches('label.nish-field-label, small.nish-hint, small.nish-error'),
    ) as HTMLElement | null;
    // On a reconnect the attribute already holds this field's own hint/error ids: strip them so
    // only the author's ids are kept.
    this.#authorDescribedBy = (this.#target()?.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((id) => id && id !== `${this.#uid}-hint` && id !== `${this.#uid}-error`)
      .join(' ');
    this.#sync();
    // A nested nish-combobox / nish-search renders its input after this element mounts.
    if (this.#control && this.#control.localName.startsWith('nish-')) {
      this.#observer = new MutationObserver(() => {
        if (this.#target() && !this.#idsReady()) this.#sync();
      });
      this.#observer.observe(this.#control, { childList: true, subtree: true });
    }
  }

  /** The element that carries the id and the aria attributes. */
  #target(): HTMLElement | null {
    const control = this.#control;
    if (!control) return null;
    if (control.localName === 'nish-combobox' || control.localName === 'nish-search') {
      return control.querySelector<HTMLElement>('input');
    }
    return control;
  }

  #idsReady(): boolean {
    const target = this.#target();
    return !!target && !!target.id && this.#wrap?.querySelector('label.nish-field-label')?.getAttribute('for') === target.id;
  }

  #sync(): void {
    const wrap = this.#wrap;
    if (!wrap) return;
    const inline = this.layout === 'inline';
    wrap.classList.toggle('nish-field--inline', inline);
    if (inline && this.labelWidth) {
      wrap.style.setProperty('--nish-field-label-w', this.labelWidth);
      wrap.style.setProperty('--nish-field-label-width', this.labelWidth);
    } else {
      wrap.style.removeProperty('--nish-field-label-w');
      wrap.style.removeProperty('--nish-field-label-width');
    }

    const target = this.#target();
    if (target && !target.id) target.id = `${this.#uid}-control`;
    const controlId = target?.id ?? '';
    const hasError = !!this.error;
    const hasHint = !!this.hint && !hasError;

    let label = wrap.querySelector<HTMLLabelElement>(':scope > label.nish-field-label');
    if (this.label) {
      if (!label) {
        label = document.createElement('label');
        label.className = 'nish-field-label';
        wrap.prepend(label);
      }
      if (controlId) label.htmlFor = controlId;
      label.textContent = this.label;
      if (this.optional) {
        const opt = document.createElement('span');
        opt.className = 'nish-optional';
        opt.textContent = getStrings().optional;
        label.appendChild(opt);
      }
    } else label?.remove();

    const hintId = `${this.#uid}-hint`;
    const errorId = `${this.#uid}-error`;
    this.#message(wrap, 'hint', hasHint ? this.hint! : '', hintId);
    this.#message(wrap, 'error', hasError ? this.error! : '', errorId);

    if (target) {
      const ids = [this.#authorDescribedBy, hasError ? errorId : hasHint ? hintId : ''].filter(Boolean).join(' ');
      if (ids) target.setAttribute('aria-describedby', ids);
      else target.removeAttribute('aria-describedby');
      if (hasError) {
        target.setAttribute('aria-invalid', 'true');
        this.#setInvalid = true;
      } else if (this.#setInvalid) {
        target.removeAttribute('aria-invalid');
        this.#setInvalid = false;
      }
    }
  }

  #message(wrap: HTMLElement, kind: 'hint' | 'error', text: string, id: string): void {
    let el = wrap.querySelector<HTMLElement>(`:scope > small.nish-${kind}`);
    if (!text) {
      el?.remove();
      return;
    }
    if (!el) {
      el = document.createElement('small');
      el.className = `nish-${kind}`;
      if (kind === 'error') el.setAttribute('role', 'alert');
      wrap.appendChild(el);
    }
    el.id = id;
    if (el.textContent !== text) el.textContent = text;
  }
}

define('nish-field', NishField);
