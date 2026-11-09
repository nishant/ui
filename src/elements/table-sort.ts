import { NishElement, define, whenParsed } from './base';

type Direction = 'ascending' | 'descending';

const SVG_NS = 'http://www.w3.org/2000/svg';

function sortMark(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '10');
  svg.setAttribute('height', '10');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of ['M2 4 5 1l3 3', 'M2 6l3 3 3-3']) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('opacity', '0.35');
    svg.appendChild(path);
  }
  return svg;
}

/** Does a mutation concern the header (inside a `<thead>`, or adding a table or head)? */
function touchesHead(rec: MutationRecord): boolean {
  const target = rec.target instanceof Element ? rec.target : rec.target.parentElement;
  if (target?.closest('thead')) return true;
  return Array.from(rec.addedNodes).some(
    (n) => n instanceof Element && (n.localName === 'thead' || n.localName === 'table' || n.localName === 'tr' || n.localName === 'th' || n.querySelector('thead') !== null),
  );
}

/** A number from a cell key. Reads what `nish-ui/format` writes: U+2212 minus, currency and
 *  grouping marks, a percent sign, and a letters-only unit after the number ("12 GB"). */
function parseNumber(key: string): number | null {
  const cleaned = key.replace(/\u2212/g, '-').replace(/[\s,$€£%]/g, '');
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)[a-z/]*$/i.exec(cleaned);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** The placeholder `nish-ui/format` writes for a missing value: sorts last like an empty cell. */
const PLACEHOLDER = /^[\u2013\u2014]$/;

/** `<nish-table-sort manual>` wrapping a `<table class="nish-table">`: every `th[data-sort]` gets a
 *  `.nish-th-sort` button. A click sorts the `tbody` rows by that column (numeric when the column
 *  is `nish-th--num` or every key parses as a number, else `localeCompare`), cycles `aria-sort`
 *  none, ascending, descending, and fires `nish-sort` (`detail: { column, direction }`). `column`
 *  is the `data-sort` value, else the header text. `manual` only fires the event (server sorting).
 *  A cell's key is its `data-value`, else its text; blank keys sort last in both directions.
 *  A table, `<thead>` or header cell added after mount is decorated too. */
export class NishTableSort extends NishElement {
  static override properties = {
    manual: { type: Boolean, reflect: true },
  };

  declare manual: boolean;

  #observer: MutationObserver | null = null;
  readonly #onClickBound = (e: Event): void => this.#onClick(e);

  constructor() {
    super();
    this.manual = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this.#onClickBound);
    whenParsed(() => this.#mount());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClickBound);
    this.#observer?.disconnect();
    this.#observer = null;
  }

  #mount(): void {
    if (!this.isConnected || this.#observer) return;
    this.#decorate();
    this.#observer = new MutationObserver((records) => {
      if (!records.some(touchesHead)) return; // sorting reorders body rows: not worth a pass
      this.#observer?.disconnect();
      this.#decorate();
      this.#observe();
    });
    this.#observe();
  }

  /** Watch the whole element, so a header row, a `<thead>` or a `<table>` a framework renders after
   *  mount is decorated too. `touchesHead` filters out the body-row churn. */
  #observe(): void {
    this.#observer?.observe(this, { childList: true, subtree: true });
  }

  #headers(): HTMLTableCellElement[] {
    return Array.from(this.querySelectorAll<HTMLTableCellElement>('thead th[data-sort]'));
  }

  #decorate(): void {
    for (const th of this.#headers()) {
      if (!th.hasAttribute('scope')) th.setAttribute('scope', 'col');
      if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
      if (th.querySelector(':scope > .nish-th-sort')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nish-th-sort';
      while (th.firstChild) button.appendChild(th.firstChild);
      button.appendChild(sortMark());
      th.appendChild(button);
      this.#paint(th);
    }
  }

  #paint(th: HTMLElement): void {
    const paths = th.querySelectorAll('.nish-th-sort svg path');
    const sort = th.getAttribute('aria-sort');
    paths[0]?.setAttribute('opacity', sort === 'ascending' ? '1' : '0.35');
    paths[1]?.setAttribute('opacity', sort === 'descending' ? '1' : '0.35');
  }

  #columnName(th: HTMLElement): string {
    const named = th.getAttribute('data-sort');
    if (named) return named;
    const button = th.querySelector('.nish-th-sort');
    let text = '';
    (button ?? th).childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE || (n instanceof HTMLElement && n.namespaceURI !== SVG_NS)) text += n.textContent ?? '';
    });
    return text.trim();
  }

  #onClick(e: Event): void {
    const target = e.target as Element | null;
    const button = target?.closest<HTMLElement>('.nish-th-sort');
    const th = button?.closest<HTMLTableCellElement>('th[data-sort]');
    if (!button || !th || !this.contains(th)) return;
    const direction: Direction = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    for (const other of this.#headers()) {
      other.setAttribute('aria-sort', other === th ? direction : 'none');
      this.#paint(other);
    }
    if (!this.manual) this.#sortRows(th, direction);
    this.dispatchEvent(new CustomEvent('nish-sort', { bubbles: true, detail: { column: this.#columnName(th), direction: direction === 'ascending' ? 'asc' : 'desc' } }));
  }

  #sortRows(th: HTMLTableCellElement, direction: Direction): void {
    const index = th.cellIndex;
    const sign = direction === 'ascending' ? 1 : -1;
    const table = th.closest('table');
    if (!table) return;
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    for (const tbody of Array.from(table.tBodies)) {
      const rows = Array.from(tbody.rows).map((row, order) => {
        const cell = row.cells[index];
        const raw = cell ? (cell.getAttribute('data-value') ?? cell.textContent ?? '').trim() : '';
        const key = PLACEHOLDER.test(raw) ? '' : raw;
        return { row, key, num: parseNumber(key), order };
      });
      const filled = rows.filter((r) => r.key !== '');
      const blank = rows.filter((r) => r.key === '');
      const numeric = th.classList.contains('nish-th--num') || (filled.length > 0 && filled.every((r) => r.num !== null));
      // In a numeric column the keys that still do not parse go after the numbers, as text.
      const parsed = numeric ? filled.filter((r) => r.num !== null) : filled;
      const unparsed = numeric ? filled.filter((r) => r.num === null) : [];
      parsed.sort((a, b) => {
        const cmp = numeric ? (a.num as number) - (b.num as number) : collator.compare(a.key, b.key);
        return cmp * sign || a.order - b.order;
      });
      unparsed.sort((a, b) => collator.compare(a.key, b.key) * sign || a.order - b.order);
      const frag = document.createDocumentFragment();
      for (const r of [...parsed, ...unparsed, ...blank]) frag.appendChild(r.row);
      tbody.appendChild(frag);
    }
  }
}

define('nish-table-sort', NishTableSort);
