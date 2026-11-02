import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';

const ACTIVE = '[aria-pressed="true"],[aria-selected="true"],[aria-current]:not([aria-current="false"]),[aria-checked="true"]';

/** `<nish-scroll-row label bleed snap fade>`: wraps its children in `<div class="nish-scroll-row">`,
 *  one row that scrolls sideways with no scrollbar. Sets `data-at-start` / `data-at-end` on the row
 *  as it scrolls or resizes (the edge fades read them) and, on connect, scrolls the child with
 *  `aria-current`, `aria-selected="true"`, `aria-pressed="true"` or `aria-checked="true"` into view
 *  without moving the page. Attributes: `label` (aria-label), `bleed` (run to the screen edges),
 *  `snap` (snap children to the start edge) and `fade` (edge fades, on by default; `fade="false"`
 *  turns them off). */
export class NishScrollRow extends NishElement {
  static override properties = {
    label: { type: String, reflect: true },
    bleed: { type: Boolean, reflect: true },
    snap: { type: Boolean, reflect: true },
    fade: {
      reflect: true,
      converter: {
        fromAttribute: (v: string | null): boolean => v !== 'false',
        toAttribute: (v: boolean): string | null => (v ? null : 'false'),
      },
    },
  };

  declare label: string;
  declare bleed: boolean;
  declare snap: boolean;
  declare fade: boolean;

  #row: HTMLElement | null = null;
  #resize: ResizeObserver | null = null;
  #late: MutationObserver | null = null;
  readonly #onScroll = (): void => this.#edges();

  constructor() {
    super();
    this.label = '';
    this.bleed = false;
    this.snap = false;
    this.fade = true;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#row?.removeEventListener('scroll', this.#onScroll);
    this.#resize?.disconnect();
    this.#resize = null;
    this.#late?.disconnect();
    this.#late = null;
    this.#row = null;
  }

  protected override updated(_changed: PropertyValues): void {
    this.#sync();
  }

  #mount(): void {
    if (!this.isConnected || this.#row) return;
    let row = this.querySelector<HTMLElement>(':scope > div.nish-scroll-row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'nish-scroll-row';
      while (this.firstChild) row.appendChild(this.firstChild);
      this.appendChild(row);
    }
    this.#row = row;
    // Children a framework renders after mount join the row.
    this.#late?.disconnect();
    this.#late = new MutationObserver(() => {
      const r = this.#row;
      if (!r) return;
      for (const n of Array.from(this.childNodes)) if (n !== r && n.nodeType === 1) r.appendChild(n);
    });
    this.#late.observe(this, { childList: true });
    this.#sync();
    row.addEventListener('scroll', this.#onScroll, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      this.#resize = new ResizeObserver(() => this.#edges());
      this.#resize.observe(row);
    }
    const active = row.querySelector<HTMLElement>(ACTIVE);
    if (active) this.#reveal(row, active);
    this.#edges();
  }

  /** Scroll the row just far enough to show `child`, never the page. */
  #reveal(row: HTMLElement, child: HTMLElement): void {
    const s = row.getBoundingClientRect();
    const c = child.getBoundingClientRect();
    const pad = 8;
    if (c.left < s.left + pad) row.scrollLeft += c.left - s.left - pad;
    else if (c.right > s.right - pad) row.scrollLeft += c.right - s.right + pad;
  }

  #edges(): void {
    const row = this.#row;
    if (!row) return;
    const max = row.scrollWidth - row.clientWidth;
    row.dataset.atStart = String(row.scrollLeft <= 1);
    row.dataset.atEnd = String(max <= 1 || row.scrollLeft >= max - 1);
  }

  #sync(): void {
    const row = this.#row;
    if (!row) return;
    if (this.label) row.setAttribute('aria-label', this.label);
    else row.removeAttribute('aria-label');
    row.classList.toggle('nish-scroll-row--bleed', this.bleed);
    row.classList.toggle('nish-scroll-row--snap', this.snap);
    row.classList.toggle('nish-scroll-row--no-fade', !this.fade);
  }
}

define('nish-scroll-row', NishScrollRow);
