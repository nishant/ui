import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_THEME, THEMES } from './tokens.mjs';

// The same substitutions scripts/build.mjs makes.
const schemes = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.scheme]));
const bgs = Object.fromEntries(Object.entries(THEMES).map(([k, t]) => [k, t.colors.bg]));
const source = readFileSync(join(process.cwd(), 'src', 'theme-init.js'), 'utf8')
  .replace('var THEMES = __THEMES__;', `var THEMES = ${JSON.stringify(schemes)};`)
  .replace('var BG = __BG__;', `var BG = ${JSON.stringify(bgs)};`)
  .replace('var DEFAULT = __DEFAULT__;', `var DEFAULT = ${JSON.stringify(DEFAULT_THEME)};`);

const root = document.documentElement;
const run = () => new Function(source)();

function stubScheme(light: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({ matches: q.includes('light') ? light : false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  (window as unknown as { matchMedia: unknown }).matchMedia = globalThis.matchMedia;
}

const attr = (k: string) => root.getAttribute(k);
const metas = () => [...document.querySelectorAll('meta[name="theme-color"]')];

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0]!.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

beforeEach(() => {
  stubScheme(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const a of ['data-theme', 'data-scheme', 'data-theme-choice', 'data-nish-themes', 'data-nish-storage-key']) root.removeAttribute(a);
  root.style.colorScheme = '';
  localStorage.clear();
  clearCookies();
  document.head.innerHTML = '';
  delete (window as unknown as Record<string, unknown>).__nishExtraThemes;
});

describe('theme-init.js', () => {
  it('has no placeholders left after the build substitutions', () => {
    const code = source.replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/__[A-Z]+__/);
  });

  it('applies the system theme when nothing is saved (dark by default, light by OS)', () => {
    run();
    expect([attr('data-theme'), attr('data-scheme'), attr('data-theme-choice')]).toEqual(['dark', 'dark', 'system']);
    expect(root.style.colorScheme).toBe('dark');
    stubScheme(true);
    run();
    expect([attr('data-theme'), attr('data-scheme'), attr('data-theme-choice')]).toEqual(['light', 'light', 'system']);
    expect(root.style.colorScheme).toBe('light');
  });

  it('applies a saved choice from localStorage', () => {
    localStorage.setItem('nish-theme', 'mocha');
    run();
    expect([attr('data-theme'), attr('data-scheme'), attr('data-theme-choice')]).toEqual(['mocha', 'dark', 'mocha']);
  });

  it('prefers the cookie to localStorage', () => {
    localStorage.setItem('nish-theme', 'light');
    document.cookie = 'nish-theme=ocean; Path=/';
    run();
    expect(attr('data-theme')).toBe('ocean');
  });

  it('reads the cookie among others and only an exact name', () => {
    document.cookie = 'a=1; Path=/';
    document.cookie = 'nish-theme=slate; Path=/';
    run();
    expect(attr('data-theme')).toBe('slate');
    clearCookies();
    document.cookie = 'xnish-theme=light; Path=/';
    run();
    expect(attr('data-theme')).toBe('dark');
  });

  it('keeps system when that is the saved choice', () => {
    localStorage.setItem('nish-theme', 'system');
    stubScheme(true);
    run();
    expect([attr('data-theme'), attr('data-theme-choice')]).toEqual(['light', 'system']);
  });

  it('treats an unknown saved name as system', () => {
    localStorage.setItem('nish-theme', 'neon');
    run();
    expect([attr('data-theme'), attr('data-theme-choice')]).toEqual(['dark', 'system']);
  });

  it('ignores Object.prototype keys as theme names', () => {
    for (const name of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf']) {
      localStorage.setItem('nish-theme', name);
      run();
      expect([attr('data-theme'), attr('data-scheme'), attr('data-theme-choice')], name).toEqual(['dark', 'dark', 'system']);
      document.cookie = `nish-theme=${name}; Path=/`;
      run();
      expect(attr('data-theme'), `cookie ${name}`).toBe('dark');
      clearCookies();
    }
  });

  it('ignores prototype keys in window.__nishExtraThemes', () => {
    const extra = Object.create({ polluted: 'light' }) as Record<string, string>;
    extra.rose = 'dark';
    (window as unknown as Record<string, unknown>).__nishExtraThemes = extra;
    localStorage.setItem('nish-theme', 'polluted');
    run();
    expect(attr('data-theme-choice')).toBe('system');
    localStorage.setItem('nish-theme', 'rose');
    run();
    expect([attr('data-theme'), attr('data-scheme')]).toEqual(['rose', 'dark']);
  });

  it('knows an app theme from window.__nishExtraThemes but never overrides a shared one', () => {
    (window as unknown as Record<string, unknown>).__nishExtraThemes = { paper: 'light', dark: 'light' };
    localStorage.setItem('nish-theme', 'paper');
    run();
    expect([attr('data-theme'), attr('data-scheme'), root.style.colorScheme]).toEqual(['paper', 'light', 'light']);
    localStorage.setItem('nish-theme', 'dark');
    run();
    expect(attr('data-scheme')).toBe('dark');
  });

  it('limits to data-nish-themes, falling back to the base scheme', () => {
    root.setAttribute('data-nish-themes', 'dark light');
    localStorage.setItem('nish-theme', 'mocha');
    run();
    expect([attr('data-theme'), attr('data-scheme'), attr('data-theme-choice')]).toEqual(['dark', 'dark', 'mocha']);
    localStorage.setItem('nish-theme', 'light');
    run();
    expect(attr('data-theme')).toBe('light');
  });

  it('survives throwing localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(run).not.toThrow();
    expect(attr('data-theme')).toBe('dark');
  });

  it('survives a throwing cookie jar and still reads localStorage', () => {
    localStorage.setItem('nish-theme', 'light');
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new Error('sandboxed');
    });
    expect(run).not.toThrow();
    expect(attr('data-theme')).toBe('light');
  });

  it('survives both throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('x');
    });
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new Error('x');
    });
    expect(run).not.toThrow();
    expect(attr('data-theme-choice')).toBe('system');
  });

  it('reads the storage key from <html data-nish-storage-key>', () => {
    root.setAttribute('data-nish-storage-key', 'my-app-theme');
    localStorage.setItem('nish-theme', 'light');
    run();
    expect(attr('data-theme')).toBe('dark');
    localStorage.setItem('my-app-theme', 'mocha');
    run();
    expect(attr('data-theme')).toBe('mocha');
    document.cookie = 'my-app-theme=ocean; Path=/';
    run();
    expect(attr('data-theme')).toBe('ocean');
  });

  it('ignores an unusable storage key', () => {
    root.setAttribute('data-nish-storage-key', 'a b; x');
    localStorage.setItem('nish-theme', 'light');
    run();
    expect(attr('data-theme')).toBe('light');
  });

  describe('theme-color meta', () => {
    it('creates one data-nish meta with the theme bg', () => {
      localStorage.setItem('nish-theme', 'light');
      run();
      const [m, ...rest] = metas();
      expect(rest).toHaveLength(0);
      expect(m!.getAttribute('content')).toBe(THEMES.light.colors.bg);
      expect(m!.hasAttribute('data-nish')).toBe(true);
    });

    it('updates its own meta on a second run', () => {
      run();
      localStorage.setItem('nish-theme', 'light');
      run();
      expect(metas()).toHaveLength(1);
      expect(metas()[0]!.getAttribute('content')).toBe(THEMES.light.colors.bg);
    });

    it('removes a static meta without media, but keeps media and data-nish-keep ones', () => {
      document.head.innerHTML = [
        '<meta name="theme-color" content="#111111">',
        '<meta name="theme-color" content="#222222" media="(prefers-color-scheme: dark)">',
        '<meta name="theme-color" content="#333333" data-nish-keep>',
      ].join('');
      run();
      const contents = metas().map((m) => m.getAttribute('content'));
      expect(contents).toContain('#222222');
      expect(contents).toContain('#333333');
      expect(contents).not.toContain('#111111');
      expect(contents).toContain(THEMES.dark.colors.bg);
      expect(contents).toHaveLength(3);
    });

    it('writes no meta for an app theme with no baked color', () => {
      (window as unknown as Record<string, unknown>).__nishExtraThemes = { rose: 'dark' };
      localStorage.setItem('nish-theme', 'rose');
      run();
      expect(metas()).toHaveLength(0);
    });

    it('does not use an inherited key as a color', () => {
      // A host theme named like a prototype member must not read BG[theme] from the prototype.
      (window as unknown as Record<string, unknown>).__nishExtraThemes = { constructor: 'dark' };
      localStorage.setItem('nish-theme', 'constructor');
      expect(run).not.toThrow();
      expect(metas()).toHaveLength(0);
    });
  });
});
