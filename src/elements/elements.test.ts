import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ELEMENT_STRINGS, configureStrings, getStrings, onStringsChange } from './strings';
import { defaultNum, normalizeSeries } from './chart-format';
import './index';
import './forms';
import './data';

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

type Lit = HTMLElement & { updateComplete: Promise<boolean> };

/** Count writes to `innerHTML` on anything but a <template> (Lit parses its own templates that way). */
function spyInnerHTML(): { calls: () => number; restore: () => void } {
  let proto: object | null = Element.prototype;
  let desc: PropertyDescriptor | undefined;
  while (proto && !(desc = Object.getOwnPropertyDescriptor(proto, 'innerHTML'))) proto = Object.getPrototypeOf(proto);
  if (!proto || !desc?.set) throw new Error('no innerHTML setter to spy on');
  const owner = proto;
  const original = desc;
  let n = 0;
  Object.defineProperty(owner, 'innerHTML', {
    ...original,
    set(this: Element, v: string) {
      if (this.localName !== 'template') n++;
      original.set!.call(this, v);
    },
  });
  return { calls: () => n, restore: () => Object.defineProperty(owner, 'innerHTML', original) };
}

beforeEach(() => {
  document.body.replaceChildren();
});
afterEach(() => {
  configureStrings(DEFAULT_ELEMENT_STRINGS);
  document.body.replaceChildren();
});

/** Make every media query match, so <nish-filter-bar> takes its compact (sheet) layout. */
function compact(): () => void {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

function mount(html: string): void {
  document.body.insertAdjacentHTML('beforeend', html);
}

describe('configureStrings', () => {
  it('starts with the English defaults', () => {
    expect(getStrings().search).toBe('Search');
    expect(getStrings().removeNamed('a')).toBe('Remove a');
    expect(getStrings().resultCount(1)).toBe('1 result');
    expect(getStrings().resultCount(2)).toBe('2 results');
  });

  it('merges a partial object, keeps the rest, ignores undefined and unknown keys', () => {
    configureStrings({ search: 'Suche', clear: undefined, bogus: 'x' } as never);
    expect(getStrings().search).toBe('Suche');
    expect(getStrings().clear).toBe('Clear');
    expect('bogus' in getStrings()).toBe(false);
  });

  it('notifies subscribers until they unsubscribe', () => {
    const fn = vi.fn();
    const off = onStringsChange(fn);
    configureStrings({ close: 'Fermer' });
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    configureStrings({ close: 'Close' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('is one store per page: a second module instance sees the same values', async () => {
    configureStrings({ copy: 'Copiar' });
    vi.resetModules();
    const again = await import('./strings');
    expect(again.getStrings().copy).toBe('Copiar');
  });
});

describe('<nish-search> strings', () => {
  it('takes placeholder, aria-label and the clear label from the strings, an attribute wins', async () => {
    configureStrings({ search: 'Suche', clear: 'Leeren' });
    mount('<nish-search id="a" value="x"></nish-search><nish-search id="b" placeholder="" label="Mine"></nish-search>');
    const a = document.getElementById('a') as Lit;
    const b = document.getElementById('b') as Lit;
    await a.updateComplete;
    await b.updateComplete;
    const input = a.querySelector('input')!;
    expect(input.getAttribute('placeholder')).toBe('Suche');
    expect(input.getAttribute('aria-label')).toBe('Suche');
    expect(a.querySelector('button')!.getAttribute('aria-label')).toBe('Leeren');
    expect(b.querySelector('input')!.getAttribute('placeholder')).toBe('');
    expect(b.querySelector('input')!.getAttribute('aria-label')).toBe('Mine');
  });

  it('re-renders when the strings change after it is on the page', async () => {
    mount('<nish-search id="a"></nish-search>');
    const a = document.getElementById('a') as Lit;
    await a.updateComplete;
    expect(a.querySelector('input')!.getAttribute('placeholder')).toBe('Search');
    configureStrings({ search: 'Buscar' });
    await a.updateComplete;
    expect(a.querySelector('input')!.getAttribute('placeholder')).toBe('Buscar');
  });
});

describe('<nish-copy-button> and <nish-field> strings', () => {
  it('labels come from the strings; label attributes win', async () => {
    configureStrings({ copy: 'Copiar', copied: 'Copiado' });
    mount('<nish-copy-button id="a" value="x"></nish-copy-button><nish-copy-button id="b" label="Mine" value="y"></nish-copy-button>');
    const a = document.getElementById('a') as Lit;
    const b = document.getElementById('b') as Lit;
    await a.updateComplete;
    await b.updateComplete;
    expect(a.querySelector('button')!.textContent!.trim()).toBe('Copiar');
    expect(b.querySelector('button')!.textContent!.trim()).toBe('Mine');
  });

  it('the Optional tag of a field comes from the strings', async () => {
    configureStrings({ optional: 'Opcional' });
    mount('<nish-field label="Nombre" optional><input></nish-field>');
    await tick();
    expect(document.querySelector('.nish-optional')!.textContent).toBe('Opcional');
  });
});

describe('Trusted Types: no innerHTML', () => {
  it('chip-group builds the remove icon with DOM calls', async () => {
    mount('<nish-chip-group id="c"><span class="nish-chip" data-removable>Open</span></nish-chip-group>');
    const spy = spyInnerHTML();
    try {
      await tick();
      const remove = document.querySelector('[data-nish-remove]')!;
      expect(remove.getAttribute('aria-label')).toBe('Remove Open');
      const svg = remove.querySelector('svg')!;
      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(svg.querySelector('path')!.getAttribute('d')).toBe('M18 6 6 18M6 6l12 12');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      configureStrings({ removeNamed: (n) => `Quitar ${n}` });
      await tick();
      expect(remove.getAttribute('aria-label')).toBe('Quitar Open');
      expect(spy.calls()).toBe(0);
    } finally {
      spy.restore();
    }
  });

  it('filter-bar builds the funnel and close icons with DOM calls', async () => {
    const undo = compact();
    mount('<nish-filter-bar id="f" active-count="2"><button type="button">One</button></nish-filter-bar>');
    const spy = spyInnerHTML();
    try {
      await tick();
      await tick();
      const bar = document.getElementById('f')!;
      const button = bar.querySelector('.nish-filter-btn')!;
      expect(button.querySelector('svg')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(button.textContent).toContain('Filters');
      expect(bar.querySelector('[data-sheet-close] svg path')).not.toBeNull();
      expect(bar.querySelector('[data-sheet-close]')!.getAttribute('aria-label')).toBe('Close');
      expect(spy.calls()).toBe(0);
    } finally {
      spy.restore();
      undo();
    }
  });

  it('filter-bar strings follow configureStrings', async () => {
    const undo = compact();
    mount('<nish-filter-bar id="f" active-count="2"><button type="button">One</button></nish-filter-bar>');
    await tick();
    configureStrings({ filters: 'Filtres', clearFilters: 'Tout effacer', showResults: 'Voir', clear: 'Effacer', close: 'Fermer', activeCount: (n) => `${n} actifs` });
    await tick();
    await tick();
    const bar = document.getElementById('f')!;
    expect(bar.querySelector('.nish-filter-btn')!.textContent).toContain('Filtres');
    expect(bar.querySelector('.nish-sheet-footer .nish-btn--ghost')!.textContent).toBe('Effacer');
    expect(bar.querySelector('.nish-sheet-footer .nish-btn--primary')!.textContent).toBe('Voir');
    expect(bar.querySelector('.nish-badge')!.getAttribute('aria-label')).toBe('2 actifs');
    expect(bar.querySelector('[data-sheet-close]')!.getAttribute('aria-label')).toBe('Fermer');
    undo();
  });
});

describe('late children', () => {
  it('<nish-nav-rail> moves links and slots rendered after mount into the nav, in order', async () => {
    mount('<nish-nav-rail id="r"><a href="/a">A</a></nish-nav-rail>');
    await tick();
    const rail = document.getElementById('r')!;
    const nav = rail.querySelector('nav.nish-nav-rail')!;
    const link = document.createElement('a');
    link.href = '/b';
    link.textContent = 'B';
    const footer = document.createElement('div');
    footer.setAttribute('data-slot', 'footer');
    const footLink = document.createElement('a');
    footLink.href = '/f';
    footer.append(footLink);
    rail.append(footer, link);
    await tick();
    expect(link.parentElement).toBe(nav);
    expect(footer.parentElement).toBe(nav);
    expect(link.classList.contains('nish-nav-rail-item')).toBe(true);
    expect(footer.classList.contains('nish-nav-rail-footer')).toBe(true);
    expect(footLink.classList.contains('nish-nav-rail-item')).toBe(true);
    expect(nav.lastElementChild).toBe(footer);
    const extra = document.createElement('a');
    extra.href = '/g';
    footer.append(extra);
    await tick();
    expect(extra.classList.contains('nish-nav-rail-item')).toBe(true);
    expect(rail.querySelectorAll('nav.nish-nav-rail').length).toBe(1);
  });

  it('nav labels fall back to the Sections string', async () => {
    configureStrings({ sections: 'Secciones' });
    mount('<nish-nav-rail id="r"><a href="/a">A</a></nish-nav-rail><nish-bottom-nav id="b"><a href="/a">A</a></nish-bottom-nav>');
    await tick();
    expect(document.querySelector('#r nav')!.getAttribute('aria-label')).toBe('Secciones');
    expect(document.querySelector('#b nav')!.getAttribute('aria-label')).toBe('Secciones');
  });

  it('<nish-table-sort> decorates a table rendered after mount and ignores body-row churn', async () => {
    mount('<nish-table-sort id="t"></nish-table-sort>');
    await tick();
    const host = document.getElementById('t')!;
    const table = document.createElement('table');
    const thead = table.createTHead();
    const tr = thead.insertRow();
    const th = document.createElement('th');
    th.setAttribute('data-sort', 'name');
    th.textContent = 'Name';
    tr.append(th);
    const body = table.createTBody();
    body.insertRow().insertCell().textContent = 'b';
    body.insertRow().insertCell().textContent = 'a';
    host.append(table);
    await tick();
    expect(th.querySelector(':scope > button.nish-th-sort svg')).not.toBeNull();
    expect(th.getAttribute('aria-sort')).toBe('none');
    const th2 = document.createElement('th');
    th2.setAttribute('data-sort', 'qty');
    th2.textContent = 'Qty';
    tr.append(th2);
    await tick();
    expect(th2.querySelector('button.nish-th-sort')).not.toBeNull();
    expect(th.querySelectorAll('button').length).toBe(1);
    expect(body.children.length).toBe(2);
  });
});

describe('chart-format', () => {
  it('defaultNum groups thousands with en-US and builds at most one formatter', () => {
    const Real = Intl.NumberFormat;
    let built = 0;
    Intl.NumberFormat = class extends Real {
      constructor(...args: ConstructorParameters<typeof Real>) {
        super(...args);
        built++;
      }
    } as typeof Intl.NumberFormat;
    expect(defaultNum(1234567)).toBe('1,234,567');
    expect(defaultNum(-2500)).toBe('-2,500');
    expect(defaultNum(12.3456)).toBe('12.35');
    expect(defaultNum(1000.4)).toBe('1,000');
    Intl.NumberFormat = Real;
    expect(built).toBeLessThanOrEqual(1);
  });

  it('a series without a label is named from the strings', () => {
    configureStrings({ seriesNumber: (n) => `Serie ${n}` });
    const out = normalizeSeries([{ points: [] }, { label: 'X', points: [] }]);
    expect(out[0]!.label).toBe('Serie 1');
    expect(out[1]!.label).toBe('X');
  });
});
