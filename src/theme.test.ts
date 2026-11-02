import { afterEach, describe, expect, it, vi } from 'vitest';
import { setThemeChoice } from './theme';

type HappyWindow = Window & { happyDOM: { setURL(url: string): void } };

/** Visit `url`, optionally with <html data-nish-domain>, pick a theme, and return the cookie it wrote. */
function cookieWritten(url: string, domainAttr?: string): string | null {
  (window as unknown as HappyWindow).happyDOM.setURL(url);
  const root = document.documentElement;
  if (domainAttr === undefined) root.removeAttribute('data-nish-domain');
  else root.setAttribute('data-nish-domain', domainAttr);
  const set = vi.spyOn(document, 'cookie', 'set');
  setThemeChoice('mocha');
  const written = set.mock.calls.map((c) => String(c[0]));
  set.mockRestore();
  return written[0] ?? null;
}

afterEach(() => {
  document.documentElement.removeAttribute('data-nish-domain');
  localStorage.clear();
});

describe('theme cookie domain', () => {
  it('shares on .nish.software for nish.software hosts with no attribute', () => {
    expect(cookieWritten('https://jobs.nish.software/')).toMatch(/^nish-theme=mocha; Domain=\.nish\.software; .*Secure$/);
    expect(cookieWritten('https://nish.software/')).toContain('Domain=.nish.software');
  });

  it('writes no cookie elsewhere, so localStorage is the only store', () => {
    expect(cookieWritten('http://localhost:5173/')).toBeNull();
    expect(cookieWritten('https://example.com/')).toBeNull();
    expect(cookieWritten('https://notnish.software/')).toBeNull();
    expect(localStorage.getItem('nish-theme')).toBe('mocha');
  });

  it('shares on the domain a page names with data-nish-domain', () => {
    expect(cookieWritten('https://app.example.com/', 'example.com')).toContain('Domain=.example.com;');
    expect(cookieWritten('https://example.com/', '.Example.COM')).toContain('Domain=.example.com;');
    expect(cookieWritten('http://app.example.com/', 'example.com')).not.toContain('Secure');
  });

  it('ignores a data-nish-domain this host is not under', () => {
    expect(cookieWritten('https://app.example.org/', 'example.com')).toBeNull();
    expect(cookieWritten('https://jobs.nish.software/', 'example.com')).toBeNull();
    expect(cookieWritten('https://badexample.com/', 'example.com')).toBeNull();
  });
});
