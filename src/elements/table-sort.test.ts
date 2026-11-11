import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import './index';
import './data';

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

// happy-dom has no HTMLTableSectionElement.rows; browsers do.
if (!('rows' in HTMLTableSectionElement.prototype)) {
  Object.defineProperty(HTMLTableSectionElement.prototype, 'rows', {
    get(this: HTMLTableSectionElement) {
      return Array.from(this.children).filter((c) => c.localName === 'tr');
    },
  });
}

beforeEach(() => {
  document.body.replaceChildren();
});
afterEach(() => {
  document.body.replaceChildren();
});

function mountTable(rows: string[][]): HTMLTableElement {
  const cols = rows[0].length;
  const head = Array.from({ length: cols }, (_, i) => `<th data-sort="c${i}">C${i}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
  document.body.insertAdjacentHTML(
    'beforeend',
    `<nish-table-sort><table class="nish-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></nish-table-sort>`,
  );
  return document.querySelector('table')!;
}

async function sortAsc(table: HTMLTableElement, col: number): Promise<string[]> {
  await tick();
  table.querySelectorAll('th')[col].querySelector('button')!.click();
  await tick();
  return Array.from(table.tBodies[0].rows).map((r) => r.cells[col].textContent!);
}

describe('<nish-table-sort> number parsing', () => {
  it('sorts compact currency, negatives and placeholders', async () => {
    const t = mountTable([['$950'], ['$4.5M'], ['–'], ['$12.3k'], ['−$20']]);
    expect(await sortAsc(t, 0)).toEqual(['−$20', '$950', '$12.3k', '$4.5M', '–']);
  });

  it('sorts a letters-only unit as the plain number', async () => {
    const t = mountTable([['12 GB'], ['3 GB'], ['100 GB']]);
    expect(await sortAsc(t, 0)).toEqual(['3 GB', '12 GB', '100 GB']);
  });

  it('keeps ID-style cells as text, in natural order', async () => {
    const t = mountTable([['UI-392'], ['UI-400'], ['UI-35']]);
    expect(await sortAsc(t, 0)).toEqual(['UI-35', 'UI-392', 'UI-400']);
  });

  it('does not read a date as a number', async () => {
    const t = mountTable([['Nov 5, 2026'], ['Nov 5, 2025']]);
    expect(await sortAsc(t, 0)).toEqual(['Nov 5, 2025', 'Nov 5, 2026']);
  });

  it('reads the bytes unit B as bytes, not billions', async () => {
    const t = mountTable([['2 M'], ['512 B'], ['900 B']]);
    expect(await sortAsc(t, 0)).toEqual(['512 B', '900 B', '2 M']);
  });

  it('still reads a spaceless B suffix as billions', async () => {
    const t = mountTable([['$1.2B'], ['$900M']]);
    expect(await sortAsc(t, 0)).toEqual(['$900M', '$1.2B']);
  });

  it('sorts other currencies and code prefixes', async () => {
    const t = mountTable([['¥1,200'], ['CHF 12'], ['₹5']]);
    expect(await sortAsc(t, 0)).toEqual(['₹5', 'CHF 12', '¥1,200']);
  });
});
