import { html, nothing, svg, type TemplateResult } from 'lit';
import { NishElement, define } from './base';

const COPIED_MS = 1500;
const HIDDEN =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';

const COPY_ICON = svg`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
const CHECK_ICON = svg`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nish-ok)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"></path></svg>`;

/** Writes text with the Clipboard API, falling back to a hidden textarea on insecure origins. */
async function writeText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // permission denied or not focused: try the fallback
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  const active = document.activeElement as HTMLElement | null;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  active?.focus?.();
  return ok;
}

/** `<nish-copy-button value="npm i nish-ui">` or `for="id-of-element"`: a button that copies text
 *  and shows "Copied" for 1.5 s. Attributes: `value` (the text; else the text of the element whose
 *  id is `for`), `label` (default "Copy"), `copied-label` (default "Copied"), `icon` (a square icon
 *  button; the label becomes its accessible name). Fires `nish-copy` (`detail: { text }`). */
export class NishCopyButton extends NishElement {
  static override properties = {
    value: { type: String, reflect: true },
    for: { type: String, reflect: true },
    label: { type: String, reflect: true },
    copiedLabel: { attribute: 'copied-label', reflect: true },
    icon: { type: Boolean, reflect: true },
    copied: { state: true },
    manual: { state: true },
  };

  declare value: string | null;
  declare for: string | null;
  declare label: string;
  declare copiedLabel: string;
  declare icon: boolean;
  declare copied: boolean;
  declare manual: boolean;

  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.value = null;
    this.for = null;
    this.label = 'Copy';
    this.copiedLabel = 'Copied';
    this.icon = false;
    this.copied = false;
    this.manual = false;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    this.copied = false;
    this.manual = false;
  }

  #text(): string {
    if (this.value != null) return this.value;
    const source = this.for ? document.getElementById(this.for) : null;
    return source?.textContent ?? '';
  }

  async #onClick(): Promise<void> {
    const text = this.#text();
    if (!(await writeText(text))) {
      await this.#manualCopy();
      return;
    }
    this.manual = false;
    this.copied = true;
    this.dispatchEvent(new CustomEvent('nish-copy', { bubbles: true, detail: { text } }));
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.copied = false;
      this.#timer = null;
    }, COPIED_MS);
  }

  /** The clipboard is refused (claude.ai frames): select the text and ask for Ctrl+C for 1.5 s. */
  async #manualCopy(): Promise<void> {
    this.copied = false;
    this.manual = true;
    await this.updateComplete;
    const source = this.value == null && this.for ? document.getElementById(this.for) : null;
    if (source) {
      const range = document.createRange();
      range.selectNodeContents(source);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else {
      const ta = this.querySelector<HTMLTextAreaElement>('textarea[data-copy-source]');
      ta?.focus();
      ta?.select();
    }
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      // The hidden textarea may hold focus; hand it back to the button before Lit removes it.
      if (document.activeElement?.matches('textarea[data-copy-source]') && this.contains(document.activeElement)) {
        this.querySelector('button')?.focus();
      }
      this.manual = false;
      this.#timer = null;
    }, COPIED_MS);
  }

  protected override render(): TemplateResult {
    const shown = this.copied ? this.copiedLabel : this.manual ? 'Press Ctrl+C' : this.label;
    const icon = this.copied ? CHECK_ICON : COPY_ICON;
    return html`${this.icon
        ? html`<button type="button" class="nish-icon-btn nish-icon-btn--sm nish-copy-btn" aria-label=${shown} title=${shown} ?data-copied=${this.copied} @click=${() => this.#onClick()}>
            ${icon}
          </button>`
        : html`<button type="button" class="nish-btn nish-btn--sm nish-copy-btn" ?data-copied=${this.copied} @click=${() => this.#onClick()}>
            ${icon}${shown}
          </button>`}<span role="status" aria-live="polite" style=${HIDDEN}>${this.copied ? this.copiedLabel : this.manual ? 'Press Ctrl+C' : nothing}</span>${this.manual && this.value != null ? html`<textarea data-copy-source readonly tabindex="-1" aria-label=${this.value} style=${HIDDEN} .value=${this.value}></textarea>` : nothing}`;
  }
}

define('nish-copy-button', NishCopyButton);
