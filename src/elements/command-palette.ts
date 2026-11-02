import type { PropertyValues } from 'lit';
import { COMMAND_QUERY_DEBOUNCE_MS, filterCommandItems } from '../command-filter';
import { NishElement, define, whenParsed } from './base';

export interface NishCommandItem {
  /** Stable key, unique within the list. */
  id: string;
  label: string;
  group?: string;
  /** Short right-aligned text (a shortcut, a path, a type). */
  hint?: string;
  /** Extra words the query also matches. */
  keywords?: string[];
  /** Followed on select (`location.assign`). */
  href?: string;
}

export interface NishCommandSelectDetail {
  id: string;
}

let seq = 0;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SR_ONLY =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

function closeIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24',
    width: '16',
    height: '16',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  })) {
    svg.setAttribute(k, v);
  }
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', 'M18 6 6 18M6 6l12 12');
  svg.append(p);
  return svg;
}

function searchIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    viewBox: '0 0 24 24',
    width: '18',
    height: '18',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  })) {
    svg.setAttribute(k, v);
  }
  const c = document.createElementNS(SVG_NS, 'circle');
  c.setAttribute('cx', '11');
  c.setAttribute('cy', '11');
  c.setAttribute('r', '8');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', 'm21 21-4.3-4.3');
  svg.append(c, p);
  return svg;
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
}

/** `<nish-command-palette>`: a search-and-jump dialog (a modal `<dialog class="nish-command">`:
 *  a full-height sheet on a phone, a 560px panel from 640px). Items are child `<a href data-group data-hint
 *  data-keywords>` or `<button data-group ...>` elements (read once, then hidden; a child item
 *  is clicked on select, so an anchor is followed and a button runs its listeners), or the
 *  `items` property. Every word of the query must match the label, hint or keywords.
 *  ArrowUp/Down move, Home/End jump, Enter selects, Escape closes and focus returns to the
 *  opener. Typing fires `nish-query` (`detail: { query }`, debounced 200 ms): replace `items`
 *  to show server results. A select fires `nish-select` (`detail: { id }`); closing fires
 *  `nish-close`.
 *  Attributes: `open`, `hotkey` (Ctrl/Cmd+K outside other fields), `placeholder`
 *  (default "Search…"), `empty-text` (default "No results"). */
export class NishCommandPalette extends NishElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    hotkey: { type: Boolean, reflect: true },
    placeholder: { type: String },
    emptyText: { type: String, attribute: 'empty-text' },
    items: { attribute: false },
  };

  declare open: boolean;
  declare hotkey: boolean;
  declare placeholder: string;
  declare emptyText: string;
  declare items: NishCommandItem[];

  readonly #uid = ++seq;
  #dialog: HTMLDialogElement | null = null;
  #input: HTMLInputElement | null = null;
  #list: HTMLDivElement | null = null;
  #status: HTMLSpanElement | null = null;
  #query = '';
  #active = 0;
  #flat: NishCommandItem[] = [];
  #sources = new Map<string, HTMLElement>();
  #opener: HTMLElement | null = null;
  #timer: number | undefined;
  #waiting = false;
  #hotkeyOn = false;

  constructor() {
    super();
    this.open = false;
    this.hotkey = false;
    this.placeholder = 'Search…';
    this.emptyText = 'No results';
    this.items = [];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#syncHotkey();
    if (this.#dialog) {
      this.#syncOpen();
      return;
    }
    if (!this.#waiting) {
      this.#waiting = true;
      whenParsed(() => {
        this.#waiting = false;
        if (this.isConnected) this.#mount();
      });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#setHotkey(false);
    window.clearTimeout(this.#timer);
    // A removed modal never fires `close` by itself. Clear `open` so a reconnect (a DOM move)
    // does not reopen it, and so one close fires one event.
    if (this.#dialog?.open) {
      this.open = false;
      this.#dialog.close();
    }
  }

  show(): void {
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  #setHotkey(on: boolean): void {
    if (on === this.#hotkeyOn) return;
    this.#hotkeyOn = on;
    if (on) document.addEventListener('keydown', this.#onHotkey);
    else document.removeEventListener('keydown', this.#onHotkey);
  }

  #syncHotkey(): void {
    this.#setHotkey(this.hotkey && this.isConnected);
  }

  #onHotkey = (e: KeyboardEvent): void => {
    if (e.defaultPrevented || e.isComposing) return;
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'k') return;
    if (isTypingTarget(e.target)) return;
    e.preventDefault();
    this.open = true;
  };

  #mount(): void {
    if (this.#dialog) return;
    // Author-written items are read once; an `items` property wins if it is already set.
    const children = Array.from(this.querySelectorAll<HTMLElement>(':scope > a, :scope > button'));
    if (this.items.length === 0 && children.length > 0) {
      const used = new Set<string>();
      const items: NishCommandItem[] = [];
      for (const el of children) {
        let id = el.dataset.id || el.getAttribute('href') || `item-${items.length + 1}`;
        while (used.has(id)) id = `${id}-${items.length + 1}`;
        used.add(id);
        const keywords = (el.dataset.keywords ?? '')
          .split(/[,\s]+/)
          .map((k) => k.trim())
          .filter(Boolean);
        items.push({
          id,
          label: el.textContent?.trim() ?? id,
          group: el.dataset.group || undefined,
          hint: el.dataset.hint || undefined,
          keywords: keywords.length ? keywords : undefined,
          href: el.getAttribute('href') ?? undefined,
        });
        this.#sources.set(id, el);
      }
      this.items = items;
    }
    for (const el of children) el.hidden = true;

    const dialog = document.createElement('dialog');
    dialog.className = 'nish-command';
    dialog.setAttribute('aria-label', 'Search');

    const listId = `nish-command-list-${this.#uid}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', listId);
    input.setAttribute('aria-autocomplete', 'list');
    input.autocomplete = 'off';
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.spellcheck = false;
    input.addEventListener('input', () => this.#onInput(input.value));
    input.addEventListener('keydown', (e) => this.#onKeyDown(e));
    // The inner input's native change must not escape as the palette's own.
    input.addEventListener('change', (e) => e.stopPropagation());

    const header = document.createElement('div');
    header.className = 'nish-command-input';
    // The close button shows on phones only (the CSS hides it from 640px).
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nish-icon-btn';
    close.setAttribute('aria-label', 'Close');
    close.append(closeIcon());
    close.addEventListener('click', () => {
      this.open = false;
    });
    header.append(searchIcon(), input, close);

    const list = document.createElement('div');
    list.className = 'nish-command-list';
    list.id = listId;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Results');
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('mousemove', (e) => {
      const row = (e.target as Element | null)?.closest<HTMLElement>('[data-index]');
      if (!row) return;
      const i = Number(row.dataset.index);
      if (i !== this.#active) this.#setActive(i, false);
    });
    list.addEventListener('click', (e) => {
      const row = (e.target as Element | null)?.closest<HTMLElement>('[data-index]');
      const item = row ? this.#flat[Number(row.dataset.index)] : undefined;
      if (item) this.#select(item);
    });

    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = SR_ONLY;

    dialog.append(header, list, status);
    dialog.addEventListener('click', this.#onDialogClick);
    dialog.addEventListener('cancel', this.#onCancel);
    dialog.addEventListener('close', this.#onDialogClose);
    dialog.addEventListener('keydown', (e) => {
      // Keep Escape from an outer framework dialog; the cancel event does the closing.
      if (e.key === 'Escape') e.stopPropagation();
    });
    this.append(dialog);
    this.#dialog = dialog;
    this.#input = input;
    this.#list = list;
    this.#status = status;
    this.#refreshStatic();
    this.#syncOpen();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('hotkey')) this.#syncHotkey();
    if (changed.has('placeholder') || changed.has('emptyText')) this.#refreshStatic();
    if (changed.has('items') && this.#dialog?.open) this.#renderList();
    if (changed.has('open')) this.#syncOpen();
  }

  #refreshStatic(): void {
    const input = this.#input;
    if (!input) return;
    input.placeholder = this.placeholder;
    input.setAttribute('aria-label', this.placeholder.replace(/…$/, '') || 'Search');
  }

  #syncOpen(): void {
    const dialog = this.#dialog;
    if (!dialog || !this.isConnected) return;
    if (this.open && !dialog.open) {
      this.#opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.#query = '';
      this.#active = 0;
      if (this.#input) this.#input.value = '';
      dialog.showModal();
      this.#renderList();
      this.#input?.focus();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  // ---- list ---------------------------------------------------------------------------

  #optionId(i: number): string {
    return `nish-command-${this.#uid}-opt-${i}`;
  }

  #renderList(): void {
    const list = this.#list;
    const input = this.#input;
    if (!list || !input) return;
    this.#flat = filterCommandItems(this.items, this.#query);
    if (this.#active >= this.#flat.length) this.#active = 0;
    list.textContent = '';

    let index = 0;
    let lastGroup: string | null | undefined;
    let wrap: HTMLElement = list;
    for (const item of this.#flat) {
      const g = item.group ?? null;
      if (g !== lastGroup) {
        lastGroup = g;
        if (g === null) {
          wrap = list;
        } else {
          const group = document.createElement('div');
          group.className = 'nish-command-group';
          group.setAttribute('role', 'group');
          const head = document.createElement('div');
          head.id = `nish-command-${this.#uid}-group-${index}`;
          head.textContent = g;
          group.setAttribute('aria-labelledby', head.id);
          group.append(head);
          list.append(group);
          wrap = group;
        }
      }
      const row = document.createElement('div');
      row.className = 'nish-command-item';
      row.id = this.#optionId(index);
      row.dataset.index = String(index);
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', index === this.#active ? 'true' : 'false');
      const label = document.createElement('span');
      label.textContent = item.label;
      row.append(label);
      if (item.hint) {
        const hint = document.createElement('span');
        hint.className = 'nish-command-item-hint';
        hint.textContent = item.hint;
        row.append(hint);
      }
      wrap.append(row);
      index++;
    }
    if (this.#flat.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'nish-command-empty';
      empty.textContent = this.emptyText;
      list.append(empty);
    }
    if (this.#flat.length) input.setAttribute('aria-activedescendant', this.#optionId(this.#active));
    else input.removeAttribute('aria-activedescendant');
    if (this.#status) {
      this.#status.textContent = this.#flat.length
        ? `${this.#flat.length} result${this.#flat.length === 1 ? '' : 's'}`
        : this.emptyText;
    }
  }

  #setActive(i: number, scroll = true): void {
    const n = this.#flat.length;
    if (n === 0) return;
    this.#active = ((i % n) + n) % n;
    const list = this.#list;
    if (!list) return;
    for (const row of Array.from(list.querySelectorAll<HTMLElement>('[data-index]'))) {
      const on = Number(row.dataset.index) === this.#active;
      row.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && scroll) row.scrollIntoView?.({ block: 'nearest' });
    }
    this.#input?.setAttribute('aria-activedescendant', this.#optionId(this.#active));
  }

  // ---- events -------------------------------------------------------------------------

  #onInput(next: string): void {
    this.#query = next;
    this.#active = 0;
    this.#renderList();
    window.clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      this.dispatchEvent(new CustomEvent('nish-query', { bubbles: true, detail: { query: next } }));
    }, COMMAND_QUERY_DEBOUNCE_MS);
  }

  #onKeyDown(e: KeyboardEvent): void {
    if (e.isComposing) return;
    const n = this.#flat.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#setActive(this.#active + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#setActive(this.#active - 1);
        break;
      case 'Home':
        if (n && !this.#query) {
          e.preventDefault();
          this.#setActive(0);
        }
        break;
      case 'End':
        if (n && !this.#query) {
          e.preventDefault();
          this.#setActive(n - 1);
        }
        break;
      case 'Enter': {
        e.preventDefault();
        const item = this.#flat[this.#active];
        if (item) this.#select(item);
        break;
      }
    }
  }

  #select(item: NishCommandItem): void {
    const source = this.#sources.get(item.id);
    this.open = false;
    this.#dialog?.close();
    this.dispatchEvent(
      new CustomEvent<NishCommandSelectDetail>('nish-select', { bubbles: true, detail: { id: item.id } }),
    );
    if (source) source.click();
    else if (item.href) window.location.assign(item.href);
  }

  #onDialogClick = (e: MouseEvent): void => {
    const dialog = this.#dialog;
    if (!dialog || e.target !== dialog) return;
    // A press on the backdrop targets the dialog itself, outside its box.
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) this.open = false;
  };

  #onCancel = (e: Event): void => {
    e.preventDefault();
    this.open = false;
  };

  #onDialogClose = (): void => {
    window.clearTimeout(this.#timer);
    if (this.open) this.open = false;
    const opener = this.#opener;
    this.#opener = null;
    if (opener?.isConnected) opener.focus();
    this.dispatchEvent(new CustomEvent('nish-close', { bubbles: true }));
  };
}

define('nish-command-palette', NishCommandPalette);
