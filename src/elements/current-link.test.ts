import { afterEach, describe, expect, it } from 'vitest';
import { mountCurrentLink } from './current-link';

function nav(...hrefs: string[]): HTMLElement {
  const el = document.createElement('nav');
  for (const h of hrefs) {
    const a = document.createElement('a');
    a.setAttribute('href', h);
    el.appendChild(a);
  }
  document.body.appendChild(el);
  return el;
}
const current = (el: HTMLElement): string[] =>
  Array.from(el.querySelectorAll('a')).filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.getAttribute('href')!);

afterEach(() => {
  document.body.replaceChildren();
  history.replaceState(null, '', '/');
});

describe('mountCurrentLink', () => {
  it('picks the longest path prefix', () => {
    history.replaceState(null, '', '/jobs/42');
    const el = nav('/', '/jobs', '/jobs/42', '/jobs/4');
    const off = mountCurrentLink(el);
    expect(current(el)).toEqual(['/jobs/42']);
    off();
  });

  it('matches "/" only on "/"', () => {
    history.replaceState(null, '', '/x');
    const el = nav('/');
    mountCurrentLink(el)();
    expect(current(el)).toEqual([]);
    history.replaceState(null, '', '/');
    mountCurrentLink(el)();
    expect(current(el)).toEqual(['/']);
  });

  it('never marks href="#" or a query-only link, whatever the order', () => {
    history.replaceState(null, '', '/jobs/42');
    const el = nav('/jobs', '#', '?tab=x');
    mountCurrentLink(el)();
    expect(current(el)).toEqual(['/jobs']);
  });

  it('matches a hash link on the hash', () => {
    history.replaceState(null, '', '/page#b');
    const el = nav('/page#a', '/page#b');
    mountCurrentLink(el)();
    expect(current(el)).toEqual(['/page#b']);
  });

  it('leaves an author-set aria-current alone when nothing matches', () => {
    history.replaceState(null, '', '/elsewhere');
    const el = nav('/a', '/b');
    el.querySelector('a')!.setAttribute('aria-current', 'page');
    mountCurrentLink(el)();
    expect(current(el)).toEqual(['/a']);
  });
});
