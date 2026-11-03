import type { PropertyValues } from 'lit';
import { COMBOBOX_DEBOUNCE_MS, COMBOBOX_MAX_SHOWN, defaultComboboxFilter } from '../combobox-filter';
import { NishElement, define, whenParsed } from './base';
import { getStrings } from './strings';

export interface NishComboboxOption {
  value: string;
  label: string;
  /** Secondary text shown after the label and matched by the default filter. */
  hint?: string;
  disabled?: boolean;
}

export interface NishComboboxChangeDetail {
  /** The chosen option's value, the typed text for a custom entry, or null when cleared. */
  value: string | null;
  /** The chosen option; null for a custom entry or a clear. */
  option: NishComboboxOption | null;
}

let seq = 0;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SR_ONLY =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

function icon(path: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}

/** `<nish-combobox>`: a text input with a listbox of suggestions (ARIA 1.2 combobox), the
 *  keyboard model of the React `Combobox`. Options come from child `<option value data-hint>`
 *  elements (read once, then removed) or the `options` property. `allow-custom` commits typed
 *  text. Typing fires `nish-query` (debounced 200 ms) for server search: replace `options`, set
 *  `loading` meanwhile, and set `filter` to `() => true` when the server already filtered.
 *  A commit fires `change` and `nish-change` (`detail: { value, option }`); clearing fires them
 *  with `null`. A hidden input named `name` holds the value for forms.
 *  Attributes: `value`, `placeholder`, `label` (the input's aria-label), `allow-custom`,
 *  `empty-text` (default "No matches"), `size="sm"`, `disabled`, `loading`, `name`. */
export class NishCombobox extends NishElement {
  static override properties = {
    value: { type: String, reflect: true },
    placeholder: { type: String },
    label: { type: String },
    allowCustom: { type: Boolean, attribute: 'allow-custom', reflect: true },
    emptyText: { type: String, attribute: 'empty-text' },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
    name: { type: String },
    options: { attribute: false },
    filter: { attribute: false },
  };

  declare value: string | null;
  declare placeholder: string | null;
  declare label: string | null;
  declare allowCustom: boolean;
  declare emptyText: string;
  declare size: string | null;
  declare disabled: boolean;
  declare loading: boolean;
  declare name: string | null;
  declare options: NishComboboxOption[];
  /** Replaces the default filter. Return true for every option when the server filtered them. */
  declare filter: ((option: NishComboboxOption, query: string) => boolean) | null;

  readonly #uid = ++seq;
  #root: HTMLDivElement | null = null;
  #input: HTMLInputElement | null = null;
  #clearBtn: HTMLButtonElement | null = null;
  #status: HTMLSpanElement | null = null;
  #list: HTMLUListElement | null = null;
  #hidden: HTMLInputElement | null = null;
  #open = false;
  #text = '';
  #dirty = false;
  #active = -1;
  #timer: number | undefined;
  #waiting = false;

  constructor() {
    super();
    this.value = null;
    this.placeholder = null;
    this.label = null;
    this.allowCustom = false;
    this.emptyText = '';
    this.size = null;
    this.disabled = false;
    this.loading = false;
    this.name = null;
    this.options = [];
    this.filter = null;
  }

  /** The inner text input (a `<nish-field>` puts its id and aria attributes here). */
  get input(): HTMLInputElement | null {
    return this.#input;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.#root) {
      this.#refresh();
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
    window.clearTimeout(this.#timer);
    this.#closeList();
  }

  #mount(): void {
    if (this.#root) return;
    // Author-written <option>s become the options once; an `options` property wins if set.
    const children = Array.from(this.querySelectorAll<HTMLOptionElement>(':scope > option'));
    const fromChildren = children.map(
      (o): NishComboboxOption => ({
        value: o.value,
        label: o.textContent?.trim() ?? o.value,
        hint: o.dataset.hint || undefined,
        disabled: o.disabled || undefined,
      }),
    );
    for (const o of children) o.remove();
    if (this.options.length === 0 && fromChildren.length > 0) this.options = fromChildren;

    const root = document.createElement('div');
    root.className = 'nish-combobox';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'nish-input nish-combobox-input';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.autocomplete = 'off';
    input.setAttribute('autocapitalize', 'off');
    input.spellcheck = false;
    input.addEventListener('input', () => this.#onInput(input.value));
    input.addEventListener('keydown', (e) => this.#onKeyDown(e));
    input.addEventListener('focus', () => this.#openList());
    input.addEventListener('click', () => this.#openList());
    input.addEventListener('blur', () => {
      if (!this.#commitEmpty()) {
        this.#closeList();
        this.#reset();
        this.#refresh();
      }
    });
    // The element fires its own `change`: the inner input's would bubble out as a second one.
    input.addEventListener('change', (e) => e.stopPropagation());

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'nish-icon-btn nish-combobox-clear';
    clear.tabIndex = -1;
    clear.hidden = true;
    clear.append(icon('M18 6 6 18M6 6l12 12'));
    clear.addEventListener('mousedown', (e) => e.preventDefault());
    clear.addEventListener('click', () => {
      this.#closeList();
      this.#commit(null, null);
      input.focus();
    });

    const status = document.createElement('span');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = SR_ONLY;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';

    root.append(input, clear, status);
    this.append(root, hidden);
    this.#root = root;
    this.#input = input;
    this.#clearBtn = clear;
    this.#status = status;
    this.#hidden = hidden;
    this.#refresh();
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('value') && changed.get('value') !== undefined) this.#reset();
    if (changed.has('disabled') && this.disabled) this.#closeList();
    if (changed.has('options') || changed.has('filter') || changed.has('loading')) this.#clampActive();
    this.#refresh();
  }

  // ---- state helpers ------------------------------------------------------------------

  get #selected(): NishComboboxOption | null {
    return this.options.find((o) => o.value === this.value) ?? null;
  }

  get #hasValue(): boolean {
    return this.value != null && this.value !== '';
  }

  get #shown(): string {
    if (this.#dirty) return this.#text;
    return this.#selected?.label ?? this.value ?? '';
  }

  get #visible(): NishComboboxOption[] {
    const test = this.filter ?? defaultComboboxFilter;
    const list = this.#dirty ? this.options.filter((o) => test(o, this.#text)) : this.options;
    return list.slice(0, COMBOBOX_MAX_SHOWN);
  }

  #clampActive(): void {
    if (this.#active >= this.#visible.length) this.#active = -1;
  }

  #reset(): void {
    this.#dirty = false;
    this.#text = '';
  }

  #openList(): void {
    if (this.#open || this.disabled || !this.#input) return;
    this.#open = true;
    const sel = this.#selected;
    const at = sel ? this.#visible.findIndex((o) => o.value === sel.value) : -1;
    this.#active = at >= 0 ? at : -1;
    this.#refresh();
  }

  #closeList(): void {
    this.#open = false;
    this.#active = -1;
    this.#list?.remove();
    this.#list = null;
    if (this.#input) {
      this.#input.setAttribute('aria-expanded', 'false');
      this.#input.removeAttribute('aria-controls');
      this.#input.removeAttribute('aria-activedescendant');
    }
    if (this.#status) this.#status.textContent = '';
  }

  /** The next enabled index from `from` in `dir`, wrapping; -1 when none is enabled. */
  #step(from: number, dir: 1 | -1): number {
    const vis = this.#visible;
    const n = vis.length;
    if (n === 0) return -1;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (!vis[i].disabled) return i;
    }
    return -1;
  }

  #edge(dir: 1 | -1): number {
    return dir === 1 ? this.#step(-1, 1) : this.#step(0, -1);
  }

  #commit(value: string | null, option: NishComboboxOption | null): void {
    this.value = value;
    this.#reset();
    this.#refresh();
    const detail: NishComboboxChangeDetail = { value, option };
    this.dispatchEvent(new Event('change', { bubbles: true }));
    this.dispatchEvent(new CustomEvent<NishComboboxChangeDetail>('nish-change', { bubbles: true, detail }));
  }

  #select(opt: NishComboboxOption): void {
    if (opt.disabled) return;
    this.#closeList();
    this.#commit(opt.value, opt);
  }

  /** An emptied input is a clear: the keyboard path to a null commit. */
  #commitEmpty(): boolean {
    if (!this.#dirty || this.#text.trim() !== '' || !this.#hasValue) return false;
    this.#closeList();
    this.#commit(null, null);
    return true;
  }

  #commitCustom(): boolean {
    const t = this.#text.trim();
    if (!this.allowCustom || !this.#dirty || !t) return false;
    const exact = this.options.find((o) => !o.disabled && o.label.toLowerCase() === t.toLowerCase());
    this.#closeList();
    if (exact) this.#commit(exact.value, exact);
    else this.#commit(t, null);
    return true;
  }

  // ---- events -------------------------------------------------------------------------

  #onInput(next: string): void {
    this.#text = next;
    this.#dirty = true;
    this.#open = true;
    // Without allow-custom the first match is armed for Enter; with it, Enter commits the typed text.
    if (this.allowCustom || next.trim() === '') this.#active = -1;
    else this.#active = this.#visible.findIndex((o) => !o.disabled);
    window.clearTimeout(this.#timer);
    this.#timer = window.setTimeout(() => {
      this.dispatchEvent(new CustomEvent('nish-query', { bubbles: true, detail: { query: next } }));
    }, COMBOBOX_DEBOUNCE_MS);
    this.#refresh();
  }

  #onKeyDown(e: KeyboardEvent): void {
    if (this.disabled) return;
    const vis = this.#visible;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        if (!this.#open) {
          this.#open = true;
          const sel = this.#selected;
          const at = sel ? vis.findIndex((o) => o.value === sel.value) : -1;
          this.#active = at >= 0 ? at : this.#edge(dir);
        } else {
          this.#setActive(this.#active < 0 ? this.#edge(dir) : this.#step(this.#active, dir));
          break;
        }
        this.#refresh();
        break;
      }
      case 'Home':
      case 'End':
        if (this.#open) {
          e.preventDefault();
          this.#setActive(this.#edge(e.key === 'Home' ? 1 : -1));
        }
        break;
      case 'Enter':
        if (this.#open && this.#active >= 0 && vis[this.#active]) {
          e.preventDefault();
          this.#select(vis[this.#active]);
        } else if (this.#commitEmpty() || this.#commitCustom()) {
          e.preventDefault();
        } else if (this.#open) {
          e.preventDefault();
        }
        break;
      case 'Escape':
        // Keep the Escape for the combobox so an enclosing dialog or sheet stays open.
        if (this.#open) {
          e.preventDefault();
          e.stopPropagation();
          this.#closeList();
          this.#refresh();
        } else if (this.#dirty) {
          e.preventDefault();
          e.stopPropagation();
          this.#reset();
          this.#refresh();
        }
        break;
      case 'Tab':
        this.#closeList();
        break;
    }
  }

  // ---- rendering ----------------------------------------------------------------------

  /** Bring the DOM in step with the attributes and state. */
  #refresh(): void {
    const input = this.#input;
    const root = this.#root;
    if (!input || !root || !this.#clearBtn || !this.#hidden || !this.#status) return;

    root.classList.toggle('nish-combobox--sm', this.size === 'sm');
    const shown = this.#shown;
    if (input.value !== shown) input.value = shown;
    input.disabled = this.disabled;
    if (this.placeholder) input.placeholder = this.placeholder;
    else input.removeAttribute('placeholder');
    if (this.label) input.setAttribute('aria-label', this.label);
    else input.removeAttribute('aria-label');
    this.#clearBtn.setAttribute('aria-label', getStrings().clear);
    this.#clearBtn.hidden = !(this.#hasValue && !this.disabled);

    const hidden = this.#hidden;
    if (this.name) hidden.name = this.name;
    else hidden.removeAttribute('name');
    hidden.value = this.value ?? '';
    hidden.disabled = this.disabled;

    if (!this.#open) {
      if (this.#list) this.#closeList();
      return;
    }
    this.#renderList(input, root, this.#status);
  }

  /** Move the active option. When the list is already drawn for these options, only the
   *  `data-active` mark, `aria-activedescendant` and scroll position change; no rebuild. */
  #setActive(next: number): void {
    const prev = this.#active;
    this.#active = next;
    const list = this.#list;
    const input = this.#input;
    if (!list || !input || !this.#open) {
      this.#refresh();
      return;
    }
    list.querySelector('[data-active]')?.removeAttribute('data-active');
    const li = next >= 0 ? list.querySelector<HTMLElement>(`[data-index="${next}"]`) : null;
    if (!li) {
      if (prev !== next) this.#refresh();
      else input.removeAttribute('aria-activedescendant');
      return;
    }
    li.dataset.active = '';
    input.setAttribute('aria-activedescendant', li.id);
    li.scrollIntoView?.({ block: 'nearest' });
  }

  #renderList(input: HTMLInputElement, root: HTMLDivElement, status: HTMLSpanElement): void {
    const s = getStrings();
    const listId = `nish-cb-list-${this.#uid}`;
    const vis = this.#visible;
    const sel = this.#selected;
    let list = this.#list;
    if (!list) {
      list = document.createElement('ul');
      list.id = listId;
      list.className = 'nish-combobox-list';
      list.setAttribute('role', 'listbox');
      // One delegated set of listeners for every row, so a rebuild adds none.
      const rowOf = (e: Event): { o: NishComboboxOption; i: number } | null => {
        const li = (e.target as Element | null)?.closest<HTMLElement>('li[data-index]');
        if (!li || !list!.contains(li)) return null;
        const i = Number(li.dataset.index);
        const o = this.#visible[i];
        return o ? { o, i } : null;
      };
      list.addEventListener('mousedown', (e) => e.preventDefault());
      list.addEventListener('mousemove', (e) => {
        const row = rowOf(e);
        if (row && !row.o.disabled && this.#active !== row.i) this.#setActive(row.i);
      });
      list.addEventListener('click', (e) => {
        const row = rowOf(e);
        if (row) this.#select(row.o);
      });
      this.#list = list;
      root.append(list);
    }
    if (this.label) {
      list.setAttribute('aria-label', this.label);
      list.removeAttribute('aria-labelledby');
    } else {
      list.removeAttribute('aria-label');
      if (!input.id) input.id = `nish-cb-${this.#uid}`;
      list.setAttribute('aria-labelledby', input.id);
    }

    const items: HTMLElement[] = vis.map((o, i) => {
      const li = document.createElement('li');
      li.id = `${listId}-opt-${i}`;
      li.className = 'nish-combobox-option';
      li.setAttribute('role', 'option');
      li.dataset.index = String(i);
      li.setAttribute('aria-selected', String(sel?.value === o.value));
      if (o.disabled) li.setAttribute('aria-disabled', 'true');
      if (i === this.#active) li.dataset.active = '';
      const text = document.createElement('span');
      text.className = 'nish-combobox-label';
      text.textContent = o.label;
      li.append(text);
      if (o.hint) {
        const hint = document.createElement('span');
        hint.className = 'nish-combobox-hint';
        hint.textContent = o.hint;
        li.append(hint);
      }
      if (sel?.value === o.value) li.append(icon('M20 6 9 17l-5-5'));
      return li;
    });
    if (this.loading) {
      const row = document.createElement('li');
      row.setAttribute('role', 'presentation');
      row.className = 'nish-combobox-loading';
      const spin = document.createElement('span');
      spin.className = 'nish-spinner nish-spinner--sm';
      spin.setAttribute('aria-hidden', 'true');
      row.append(spin, document.createTextNode(s.searching));
      items.push(row);
    } else if (vis.length === 0) {
      const row = document.createElement('li');
      row.setAttribute('role', 'presentation');
      row.className = 'nish-combobox-empty';
      row.textContent = this.emptyText || s.noMatches;
      items.push(row);
    }
    list.replaceChildren(...items);

    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', listId);
    if (this.#active >= 0 && vis[this.#active]) input.setAttribute('aria-activedescendant', `${listId}-opt-${this.#active}`);
    else input.removeAttribute('aria-activedescendant');

    status.textContent = this.loading ? s.searching : vis.length === 0 ? this.emptyText || s.noMatches : s.resultCount(vis.length);

    this.#place(list, input);
    list.querySelector<HTMLElement>(`[data-index="${this.#active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }

  /** Flip the list above the input when it does not fit below and there is more room above. */
  #place(list: HTMLUListElement, input: HTMLInputElement): void {
    list.style.top = '';
    list.style.bottom = '';
    list.style.marginTop = '';
    list.style.marginBottom = '';
    delete list.dataset.above;
    const r = input.getBoundingClientRect();
    const h = list.getBoundingClientRect().height;
    const below = window.innerHeight - r.bottom;
    if (h > below && r.top > below) {
      list.dataset.above = '';
      list.style.top = 'auto';
      list.style.bottom = '100%';
      list.style.marginTop = '0';
      list.style.marginBottom = '4px';
    }
  }
}

define('nish-combobox', NishCombobox);
