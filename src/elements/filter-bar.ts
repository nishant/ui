import type { PropertyValues } from 'lit';
import { NishElement, define, whenParsed } from './base';
import './sheet';
import type { NishSheet } from './sheet';

const FUNNEL =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path></svg>';
const X_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"></path></svg>';

const QUERY = { md: '(max-width: 767.98px)', lg: '(max-width: 1023.98px)' } as const;

let seq = 0;

function div(className: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

/** `<nish-filter-bar active-count sheet-title="Filters" sheet-below="md|lg" sticky>`: lays out
 *  `.nish-filter-bar`. A child `<nish-search>` goes in the search slot, children with
 *  `data-slot="trailing"` and `data-slot="summary"` in theirs, every other child in the chips row.
 *  Below `sheet-below` (`md`, 768px, by default; `lg` is 1024px) the chips row moves into a
 *  `<nish-sheet>` opened by a "Filters" `.nish-filter-btn` that shows `active-count`; the sheet has
 *  "Clear" (fires `nish-clear`, disabled at 0) and "Show results" (closes it). From that width up,
 *  a "Clear filters" button follows the chips while `active-count` is above 0. Children are moved,
 *  never copied, so their listeners keep working; crossing the breakpoint moves them back (closing
 *  the sheet first). `sticky` sticks the bar under the app header. The root carries
 *  `data-compact="true"` while the sheet layout is on. */
export class NishFilterBar extends NishElement {
  static override properties = {
    activeCount: { attribute: 'active-count', type: Number, reflect: true },
    sheetTitle: { attribute: 'sheet-title', type: String, reflect: true },
    sheetBelow: { attribute: 'sheet-below', type: String, reflect: true },
    sticky: { type: Boolean, reflect: true },
  };

  declare activeCount: number;
  declare sheetTitle: string;
  declare sheetBelow: 'md' | 'lg';
  declare sticky: boolean;

  #root: HTMLElement | null = null;
  readonly #searchSlot = div('nish-filter-bar-search');
  readonly #chips = div('nish-filter-bar-chips');
  readonly #trailing = div('nish-filter-bar-trailing');
  readonly #summary = div('nish-filter-bar-summary');
  #button: HTMLButtonElement | null = null;
  #count: HTMLSpanElement | null = null;
  #clear: HTMLButtonElement | null = null;
  #sheet: NishSheet | null = null;
  #sheetBody: HTMLElement | null = null;
  #sheetClear: HTMLButtonElement | null = null;
  #sheetTitleEl: HTMLElement | null = null;
  #filters: HTMLElement[] = [];
  #mode: 'wide' | 'compact' | null = null;
  #mql: MediaQueryList | null = null;
  #mqlQuery = '';
  #observer: MutationObserver | null = null;
  readonly #onMedia = (): void => this.#layout();

  constructor() {
    super();
    this.activeCount = 0;
    this.sheetTitle = 'Filters';
    this.sheetBelow = 'md';
    this.sticky = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#mql?.removeEventListener('change', this.#onMedia);
    this.#mql = null;
    this.#mqlQuery = '';
    this.#observer?.disconnect();
    this.#observer = null;
    // Give the author's controls back as direct children so a reconnect (a DOM move) starts clean.
    if (this.#root) {
      this.#sheet?.close();
      for (const node of this.#filters) this.appendChild(node);
      for (const slot of [this.#searchSlot, this.#trailing, this.#summary]) while (slot.firstChild) this.appendChild(slot.firstChild);
      this.#root.remove();
      this.#sheet?.remove();
      this.#root = null;
      this.#button = null;
      this.#clear = null;
      this.#sheet = null;
      this.#sheetBody = null;
      this.#filters = [];
      this.#mode = null;
    }
  }

  protected override updated(_changed: PropertyValues): void {
    if (!this.#root) return;
    this.#watchMedia();
    this.#layout();
  }

  #mount(): void {
    if (!this.isConnected || this.#root) return;
    const root = document.createElement('div');
    root.className = 'nish-filter-bar';
    this.#summary.setAttribute('aria-live', 'polite');
    root.append(this.#searchSlot, this.#chips, this.#trailing, this.#summary);
    this.#root = root;
    for (const child of Array.from(this.childNodes)) this.#route(child);
    this.appendChild(root);
    this.#buildSheet();
    this.#watchMedia();
    this.#layout();
    this.#observer = new MutationObserver((records) => {
      for (const rec of records) {
        rec.addedNodes.forEach((n) => {
          if (n !== root && n.parentNode === this) this.#route(n);
        });
      }
      this.#layout();
    });
    this.#observer.observe(this, { childList: true });
    // Also watch the containers the filters live in, so a page removing one updates the bar.
    this.#observer.observe(this.#chips, { childList: true });
    if (this.#sheetBody) this.#observer.observe(this.#sheetBody, { childList: true });
  }

  /** Forget filters the page removed (their parent is no longer the chips row or sheet body). */
  #prune(): void {
    this.#filters = this.#filters.filter((n) => n.parentNode === this.#chips || n.parentNode === this.#sheetBody);
  }

  /** Put one author-written node in its slot (loose text between elements is dropped). */
  #route(node: Node): void {
    if (node === this.#root || node instanceof Comment) return; // Lit's marker comments stay put
    if (!(node instanceof HTMLElement)) {
      node.parentNode?.removeChild(node);
      return;
    }
    const slot = node.getAttribute('data-slot');
    if (slot === 'trailing') this.#trailing.appendChild(node);
    else if (slot === 'summary') this.#summary.appendChild(node);
    else if (node.localName === 'nish-search' && !this.#searchSlot.firstChild) this.#searchSlot.appendChild(node);
    else {
      this.#prune();
      if (!this.#filters.includes(node)) this.#filters.push(node);
      (this.#mode === 'compact' ? (this.#sheetBody ?? this.#chips) : this.#chips).appendChild(node);
    }
  }

  #buildSheet(): void {
    const id = ++seq;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nish-btn nish-btn--secondary nish-filter-btn';
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = FUNNEL;
    button.append(document.createTextNode('Filters'));
    const count = document.createElement('span');
    count.className = 'nish-badge nish-badge--accent';
    button.appendChild(count);
    button.addEventListener('click', () => this.#sheet?.show());
    this.#button = button;
    this.#count = count;

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'nish-btn nish-btn--ghost nish-filter-bar-clear';
    clear.textContent = 'Clear filters';
    clear.addEventListener('click', () => this.#fireClear());
    this.#clear = clear;

    const sheet = document.createElement('nish-sheet') as NishSheet;
    const header = document.createElement('header');
    header.className = 'nish-sheet-header';
    const title = document.createElement('h2');
    title.className = 'nish-sheet-title';
    title.id = `nish-filter-sheet-title-${id}`;
    header.appendChild(title);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nish-icon-btn';
    close.setAttribute('data-sheet-close', '');
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = X_ICON;
    header.appendChild(close);
    const body = document.createElement('div');
    body.className = 'nish-sheet-body nish-filter-sheet-body';
    const footer = document.createElement('footer');
    footer.className = 'nish-sheet-footer';
    const sheetClear = document.createElement('button');
    sheetClear.type = 'button';
    sheetClear.className = 'nish-btn nish-btn--ghost';
    sheetClear.textContent = 'Clear';
    sheetClear.addEventListener('click', () => this.#fireClear());
    const done = document.createElement('button');
    done.type = 'button';
    done.className = 'nish-btn nish-btn--primary';
    done.style.marginInlineStart = 'auto';
    done.textContent = 'Show results';
    done.addEventListener('click', () => this.#sheet?.close());
    footer.append(sheetClear, done);
    sheet.append(header, body, footer);
    this.#sheet = sheet;
    this.#sheetBody = body;
    this.#sheetClear = sheetClear;
    this.#sheetTitleEl = title;
  }

  #fireClear(): void {
    this.dispatchEvent(new CustomEvent('nish-clear', { bubbles: true }));
  }

  #watchMedia(): void {
    const query = QUERY[this.sheetBelow === 'lg' ? 'lg' : 'md'];
    if (query === this.#mqlQuery) return;
    this.#mql?.removeEventListener('change', this.#onMedia);
    this.#mqlQuery = query;
    this.#mql = typeof matchMedia === 'undefined' ? null : matchMedia(query);
    this.#mql?.addEventListener('change', this.#onMedia);
  }

  #layout(): void {
    const root = this.#root;
    const sheet = this.#sheet;
    const body = this.#sheetBody;
    const button = this.#button;
    const clear = this.#clear;
    if (!root || !sheet || !body || !button || !clear) return;
    this.#prune();
    const mode = this.#mql?.matches ? 'compact' : 'wide';
    if (mode !== this.#mode) {
      if (mode === 'compact') {
        this.#chips.remove();
        clear.remove();
        this.#searchSlot.after(button);
        body.append(...this.#filters);
        root.appendChild(sheet);
      } else {
        // Close the sheet before its content moves out from under it.
        sheet.close();
        button.remove();
        this.#chips.append(...this.#filters, clear);
        this.#searchSlot.after(this.#chips);
        sheet.remove();
      }
      this.#mode = mode;
      root.setAttribute('data-compact', String(mode === 'compact'));
    }
    const count = Math.max(0, Number.isFinite(this.activeCount) ? Math.floor(this.activeCount) : 0);
    root.classList.toggle('nish-filter-bar--sticky', this.sticky);
    button.hidden = this.#filters.length === 0;
    clear.hidden = count === 0;
    if (this.#count) {
      this.#count.textContent = String(count);
      this.#count.hidden = count === 0;
      this.#count.setAttribute('aria-label', `${count} active`);
    }
    if (this.#sheetClear) this.#sheetClear.disabled = count === 0;
    if (this.#sheetTitleEl) this.#sheetTitleEl.textContent = this.sheetTitle || 'Filters';
  }
}

define('nish-filter-bar', NishFilterBar);
