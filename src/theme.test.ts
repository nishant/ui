import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  confirmDialog,
  cycleTheme,
  getThemeChoice,
  initTheme,
  isThemeName,
  mountThemeToggle,
  mountTooltips,
  onThemeChange,
  readToken,
  registerThemes,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  showToast,
} from './theme';

type HappyWindow = Window & { happyDOM: { setURL(url: string): void } };

const root = document.documentElement;

/** Visit `url`, optionally with <html data-nish-domain>, pick a theme, and return the cookie it wrote. */
function cookieWritten(url: string, domainAttr?: string): string | null {
  (window as unknown as HappyWindow).happyDOM.setURL(url);
  if (domainAttr === undefined) root.removeAttribute('data-nish-domain');
  else root.setAttribute('data-nish-domain', domainAttr);
  const set = vi.spyOn(document, 'cookie', 'set');
  setThemeChoice('mocha');
  const written = set.mock.calls.map((c) => String(c[0]));
  set.mockRestore();
  return written[0] ?? null;
}

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0]!.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

function stubScheme(light: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({
      matches: q.includes('light') ? light : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

beforeEach(() => {
  (window as unknown as HappyWindow).happyDOM.setURL('http://localhost:5173/');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  for (const a of ['data-nish-domain', 'data-nish-themes', 'data-nish-storage-key', 'data-theme', 'data-scheme', 'data-theme-choice', 'data-nish-theme-switching']) {
    root.removeAttribute(a);
  }
  root.style.colorScheme = '';
  localStorage.clear();
  clearCookies();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
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

  it('writes a year-long Lax cookie on the root path', () => {
    const c = cookieWritten('https://jobs.nish.software/')!;
    expect(c).toContain('Path=/;');
    expect(c).toContain(`Max-Age=${60 * 60 * 24 * 365};`);
    expect(c).toContain('SameSite=Lax');
  });
});

describe('isThemeName', () => {
  it('knows shared themes and nothing inherited from Object.prototype', () => {
    expect(isThemeName('dark')).toBe(true);
    expect(isThemeName('ocean')).toBe(true);
    expect(isThemeName('system')).toBe(false);
    expect(isThemeName('constructor')).toBe(false);
    expect(isThemeName('__proto__')).toBe(false);
    expect(isThemeName('toString')).toBe(false);
    expect(isThemeName(3)).toBe(false);
    expect(isThemeName(null)).toBe(false);
  });

  it('knows registered themes', () => {
    expect(isThemeName('rose')).toBe(false);
    registerThemes({ rose: 'dark', paper: 'light' });
    expect(isThemeName('rose')).toBe(true);
    expect(schemeOf('rose')).toBe('dark');
    expect(schemeOf('paper')).toBe('light');
    expect(schemeOf('nope')).toBe('dark');
    expect(schemeOf('constructor')).toBe('dark');
  });
});

describe('getThemeChoice', () => {
  it('is system with nothing saved', () => {
    expect(getThemeChoice()).toBe('system');
  });

  it('reads localStorage', () => {
    localStorage.setItem('nish-theme', 'light');
    expect(getThemeChoice()).toBe('light');
  });

  it('prefers the cookie over localStorage', () => {
    localStorage.setItem('nish-theme', 'light');
    document.cookie = 'nish-theme=mocha; Path=/';
    expect(getThemeChoice()).toBe('mocha');
  });

  it('reads the cookie among others', () => {
    document.cookie = 'a=1; Path=/';
    document.cookie = 'nish-theme=ocean; Path=/';
    document.cookie = 'z=2; Path=/';
    expect(getThemeChoice()).toBe('ocean');
  });

  it('does not take a cookie whose name only ends in nish-theme', () => {
    document.cookie = 'xnish-theme=light; Path=/';
    expect(getThemeChoice()).toBe('system');
  });

  it('falls back to system for unknown or inherited names', () => {
    localStorage.setItem('nish-theme', 'neon');
    expect(getThemeChoice()).toBe('system');
    localStorage.setItem('nish-theme', 'constructor');
    expect(getThemeChoice()).toBe('system');
    document.cookie = 'nish-theme=Light; Path=/';
    localStorage.clear();
    expect(getThemeChoice()).toBe('system');
  });

  it('keeps system', () => {
    localStorage.setItem('nish-theme', 'system');
    expect(getThemeChoice()).toBe('system');
  });

  it('survives throwing storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(getThemeChoice()).toBe('system');
  });

  it('survives a throwing cookie jar', () => {
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new Error('sandboxed');
    });
    localStorage.setItem('nish-theme', 'light');
    expect(getThemeChoice()).toBe('light');
  });

  it('uses data-nish-storage-key for storage and cookie', () => {
    root.setAttribute('data-nish-storage-key', 'my-app-theme');
    localStorage.setItem('nish-theme', 'light');
    expect(getThemeChoice()).toBe('system');
    localStorage.setItem('my-app-theme', 'mocha');
    expect(getThemeChoice()).toBe('mocha');
    document.cookie = 'my-app-theme=ocean; Path=/';
    expect(getThemeChoice()).toBe('ocean');
    setThemeChoice('light');
    expect(localStorage.getItem('my-app-theme')).toBe('light');
  });

  it('ignores an unusable storage key', () => {
    root.setAttribute('data-nish-storage-key', 'a b; x=y');
    setThemeChoice('light');
    expect(localStorage.getItem('nish-theme')).toBe('light');
  });
});

describe('resolveTheme and applyTheme', () => {
  it('resolves system by the OS scheme', () => {
    stubScheme(true);
    expect(resolveTheme('system')).toBe('light');
    stubScheme(false);
    expect(resolveTheme('system')).toBe('dark');
  });

  it('resolves a named choice to itself', () => {
    expect(resolveTheme('mocha')).toBe('mocha');
    expect(resolveTheme('light')).toBe('light');
  });

  it('uses the saved choice by default', () => {
    localStorage.setItem('nish-theme', 'ocean');
    expect(resolveTheme()).toBe('ocean');
  });

  it('limits to data-nish-themes, falling back to the base scheme', () => {
    root.setAttribute('data-nish-themes', 'dark light');
    expect(resolveTheme('mocha')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
    root.setAttribute('data-nish-themes', 'light');
    expect(resolveTheme('mocha')).toBe('dark');
    root.setAttribute('data-nish-themes', 'dark light mocha bogus');
    expect(resolveTheme('mocha')).toBe('mocha');
  });

  it('paints data attributes and color-scheme', () => {
    expect(applyTheme('light')).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.getAttribute('data-scheme')).toBe('light');
    expect(root.getAttribute('data-theme-choice')).toBe('light');
    expect(root.style.colorScheme).toBe('light');
    applyTheme('mocha');
    expect(root.getAttribute('data-theme')).toBe('mocha');
    expect(root.getAttribute('data-scheme')).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('does not save', () => {
    applyTheme('light');
    expect(localStorage.getItem('nish-theme')).toBeNull();
  });

  it('keeps the choice system while rendering the OS theme', () => {
    stubScheme(true);
    applyTheme('system');
    expect(root.getAttribute('data-theme-choice')).toBe('system');
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});

describe('setThemeChoice', () => {
  it('saves to localStorage and applies', () => {
    expect(setThemeChoice('light')).toBe('light');
    expect(localStorage.getItem('nish-theme')).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('ignores an unknown name with a dev warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    setThemeChoice('light');
    expect(setThemeChoice('neon')).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('nish-theme')).toBe('light');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('neon');
    setThemeChoice('constructor');
    expect(localStorage.getItem('nish-theme')).toBe('light');
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    setThemeChoice('neon');
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('accepts a registered theme', () => {
    registerThemes({ rose: 'dark' });
    expect(setThemeChoice('rose')).toBe('rose');
    expect(root.getAttribute('data-theme')).toBe('rose');
  });

  it('does not throw when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() => setThemeChoice('light')).not.toThrow();
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('does not throw when the cookie jar throws', () => {
    (window as unknown as HappyWindow).happyDOM.setURL('https://jobs.nish.software/');
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new Error('sandboxed');
    });
    expect(() => setThemeChoice('mocha')).not.toThrow();
    expect(root.getAttribute('data-theme')).toBe('mocha');
    expect(localStorage.getItem('nish-theme')).toBe('mocha');
  });

  it('does not throw when both throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('x');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('x');
    });
    vi.spyOn(document, 'cookie', 'get').mockImplementation(() => {
      throw new Error('x');
    });
    expect(() => cycleTheme()).not.toThrow();
  });
});

describe('theme switching attribute', () => {
  it('is set for one frame (two animation frames) when the theme changes', () => {
    vi.useFakeTimers();
    applyTheme('dark');
    expect(root.hasAttribute('data-nish-theme-switching')).toBe(false); // first paint: nothing to suspend
    applyTheme('light');
    expect(root.hasAttribute('data-nish-theme-switching')).toBe(true);
    vi.advanceTimersByTime(100);
    expect(root.hasAttribute('data-nish-theme-switching')).toBe(false);
  });

  it('is not set when the theme stays the same', () => {
    vi.useFakeTimers();
    applyTheme('dark');
    applyTheme('dark');
    expect(root.hasAttribute('data-nish-theme-switching')).toBe(false);
  });

  it('stays until the latest switch finishes', () => {
    vi.useFakeTimers();
    applyTheme('dark');
    applyTheme('light');
    vi.advanceTimersByTime(20);
    applyTheme('mocha');
    vi.advanceTimersByTime(20);
    expect(root.hasAttribute('data-nish-theme-switching')).toBe(true);
    vi.advanceTimersByTime(100);
    expect(root.hasAttribute('data-nish-theme-switching')).toBe(false);
  });
});

describe('theme-color meta', () => {
  beforeEach(() => {
    root.style.setProperty('--nish-bg', '#123456');
  });
  afterEach(() => {
    root.style.removeProperty('--nish-bg');
  });

  it('creates a data-nish meta with the bg', () => {
    applyTheme('dark');
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
    expect(metas[0]!.getAttribute('content')).toBe('#123456');
    expect(metas[0]!.hasAttribute('data-nish')).toBe(true);
  });

  it('keeps metas scoped by media or marked data-nish-keep', () => {
    document.head.innerHTML =
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000"><meta name="theme-color" data-nish-keep content="#111">';
    applyTheme('dark');
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')];
    expect(metas).toHaveLength(3);
    expect(metas[0]!.getAttribute('content')).toBe('#000');
    expect(metas[1]!.getAttribute('content')).toBe('#111');
    expect(metas[2]!.getAttribute('content')).toBe('#123456');
  });

  it('reuses its own meta and adopts a plain static one', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#abc">';
    applyTheme('dark');
    applyTheme('light');
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
    expect(metas[0]!.getAttribute('content')).toBe('#123456');
  });

  it('writes nothing when --nish-bg is unset', () => {
    root.style.removeProperty('--nish-bg');
    applyTheme('dark');
    expect(document.querySelector('meta[name="theme-color"]')).toBeNull();
  });
});

describe('readToken', () => {
  it('reads and trims a token from <html>', () => {
    root.style.setProperty('--nish-accent', '  #ff0000 ');
    expect(readToken('accent')).toBe('#ff0000');
    root.style.removeProperty('--nish-accent');
    expect(readToken('accent')).toBe('');
  });
});

describe('onThemeChange', () => {
  it('calls the listener with choice and theme, and stops after unsubscribe', () => {
    const fn = vi.fn();
    const off = onThemeChange(fn);
    setThemeChoice('mocha');
    expect(fn).toHaveBeenCalledWith('mocha', 'mocha');
    off();
    setThemeChoice('light');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe returns nothing and is repeatable', () => {
    const off = onThemeChange(() => undefined);
    expect(off()).toBeUndefined();
    expect(() => off()).not.toThrow();
  });

  it('re-applies when another tab saves a choice', () => {
    const fn = vi.fn();
    const off = onThemeChange(fn);
    localStorage.setItem('nish-theme', 'ocean');
    window.dispatchEvent(new StorageEvent('storage', { key: 'nish-theme', newValue: 'ocean' }));
    expect(fn).toHaveBeenCalledWith('ocean', 'ocean');
    fn.mockClear();
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'x' }));
    expect(fn).not.toHaveBeenCalled();
    off();
  });

  it('shares listeners across module copies (., /theme and /chart entries, two package copies)', async () => {
    vi.resetModules();
    const a = await import('./theme');
    vi.resetModules();
    const b = await import('./theme');
    expect(a).not.toBe(b);
    const seen = vi.fn();
    const off = a.onThemeChange(seen);
    b.setThemeChoice('mocha');
    expect(seen).toHaveBeenCalledWith('mocha', 'mocha');
    off();
  });

  it('shares registered themes across copies', async () => {
    vi.resetModules();
    const a = await import('./theme');
    vi.resetModules();
    const b = await import('./theme');
    a.registerThemes({ sunset: 'light' });
    expect(b.isThemeName('sunset')).toBe(true);
    expect(b.schemeOf('sunset')).toBe('light');
  });
});

describe('initTheme and cycleTheme', () => {
  it('applies the saved choice', () => {
    localStorage.setItem('nish-theme', 'light');
    expect(initTheme()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('cycles system, light, dark, system and a preset steps to system', () => {
    expect(cycleTheme()).toBe('light'); // from system
    expect(cycleTheme()).toBe('dark');
    expect(cycleTheme()).toBe('system');
    setThemeChoice('mocha');
    expect(cycleTheme()).toBe('system');
  });
});

describe('mountThemeToggle', () => {
  function mount(opts?: Parameters<typeof mountThemeToggle>[1]) {
    const button = document.createElement('button');
    document.body.append(button);
    const off = mountThemeToggle(button, opts);
    return { button, off };
  }

  it('fills three svg icons built as DOM nodes and shows the current one', () => {
    const innerHTML = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    const { button, off } = mount();
    expect(innerHTML).not.toHaveBeenCalled();
    const icons = [...button.querySelectorAll('svg')];
    expect(icons.map((i) => i.getAttribute('data-icon'))).toEqual(['system', 'light', 'dark']);
    expect(icons[0]!.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(icons[0]!.getAttribute('aria-hidden')).toBe('true');
    expect(icons[0]!.querySelector('rect')).not.toBeNull();
    expect(icons[1]!.querySelector('circle')).not.toBeNull();
    expect(icons[2]!.querySelector('path')).not.toBeNull();
    expect(icons[0]!.hasAttribute('display')).toBe(false);
    expect(icons[1]!.getAttribute('display')).toBe('none');
    expect(icons[2]!.getAttribute('display')).toBe('none');
    off();
  });

  it('sets type, data-choice, aria-label and title', () => {
    const { button, off } = mount();
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('data-choice')).toBe('system');
    expect(button.getAttribute('aria-label')).toBe('Theme: System. Switch to Light');
    expect(button.getAttribute('title')).toBe('Theme: System. Switch to Light');
    off();
  });

  it('keeps an existing type and does not add one to non-buttons', () => {
    const b = document.createElement('button');
    b.setAttribute('type', 'submit');
    mountThemeToggle(b);
    expect(b.getAttribute('type')).toBe('submit');
    const d = document.createElement('div');
    mountThemeToggle(d);
    expect(d.hasAttribute('type')).toBe(false);
  });

  it('cycles on click and updates the label and icon', () => {
    const { button, off } = mount();
    button.click();
    expect(button.getAttribute('data-choice')).toBe('light');
    expect(button.getAttribute('aria-label')).toBe('Theme: Light. Switch to Dark');
    expect(button.querySelector('svg[data-icon="light"]')!.hasAttribute('display')).toBe(false);
    expect(button.querySelector('svg[data-icon="system"]')!.getAttribute('display')).toBe('none');
    button.click();
    expect(button.getAttribute('aria-label')).toBe('Theme: Dark. Switch to System');
    off();
  });

  it('says so when a preset was saved on another site', () => {
    setThemeChoice('mocha');
    const { button, off } = mount();
    expect(button.getAttribute('aria-label')).toBe('Theme: Mocha (set on another site). Switch to System');
    // A preset shows the icon of its scheme.
    expect(button.querySelector('svg[data-icon="dark"]')!.hasAttribute('display')).toBe(false);
    off();
  });

  it('uses labels, strings and elsewhereLabel', () => {
    setThemeChoice('mocha');
    const { button, off } = mount({
      labels: { system: 'Sistema', light: 'Claro', dark: 'Oscuro' },
      strings: { themeToggleLabel: (c, n) => `Tema: ${c}. Cambiar a ${n}` },
      elsewhereLabel: 'otro sitio',
    });
    expect(button.getAttribute('aria-label')).toBe('Tema: Mocha (otro sitio). Cambiar a Sistema');
    off();
  });

  it('shows the word when asked, hidden from screen readers', () => {
    const { button, off } = mount({ showLabel: true });
    const word = button.querySelector('[data-theme-word]')!;
    expect(word.textContent).toBe('System');
    expect(word.getAttribute('aria-hidden')).toBe('true');
    button.click();
    expect(word.textContent).toBe('Light');
    off();
  });

  it('has no word span by default', () => {
    const { button, off } = mount();
    expect(button.querySelector('[data-theme-word]')).toBeNull();
    off();
  });

  it('follows changes made elsewhere and stops after cleanup', () => {
    const { button, off } = mount();
    setThemeChoice('dark');
    expect(button.getAttribute('data-choice')).toBe('dark');
    off();
    setThemeChoice('light');
    expect(button.getAttribute('data-choice')).toBe('dark');
    button.click();
    expect(getThemeChoice()).toBe('light');
  });
});

describe('showToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const region = () => document.querySelector<HTMLElement>('.nish-toast-region');
  const toasts = () => document.querySelectorAll('.nish-toast');

  it('creates one polite status region and inserts the toast after 50ms', () => {
    showToast('Saved');
    expect(region()!.getAttribute('role')).toBe('status');
    expect(region()!.getAttribute('aria-live')).toBe('polite');
    expect(toasts()).toHaveLength(0);
    vi.advanceTimersByTime(50);
    expect(toasts()).toHaveLength(1);
    expect(document.querySelector('.nish-toast-body')!.textContent).toBe('Saved');
    showToast('Again');
    vi.advanceTimersByTime(50);
    expect(document.querySelectorAll('.nish-toast-region')).toHaveLength(1);
    expect(toasts()).toHaveLength(1); // a new toast replaces the old
    expect(document.querySelector('.nish-toast-body')!.textContent).toBe('Again');
  });

  it('never parses text as HTML, and accepts a Node', () => {
    showToast('<img src=x onerror=alert(1)>');
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast img')).toBeNull();
    expect(document.querySelector('.nish-toast-body')!.textContent).toBe('<img src=x onerror=alert(1)>');
    const strong = document.createElement('strong');
    strong.textContent = 'bold';
    showToast(strong);
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast-body strong')).toBe(strong);
  });

  it('builds icons with DOM calls, not innerHTML', () => {
    const innerHTML = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    showToast('x', { tone: 'ok' });
    vi.advanceTimersByTime(50);
    expect(innerHTML).not.toHaveBeenCalled();
    const svg = document.querySelector('.nish-toast-icon svg')!;
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('width')).toBe('15');
    expect(svg.querySelector('circle')).not.toBeNull();
    const close = document.querySelector('.nish-toast-close svg')!;
    expect(close.getAttribute('width')).toBe('14');
    expect(close.querySelector('path')).not.toBeNull();
  });

  it('tints by tone', () => {
    showToast('x', { tone: 'loss' });
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast')!.classList.contains('nish-toast--loss')).toBe(true);
    showToast('x', { tone: 'neutral' });
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast')!.className).toBe('nish-toast');
  });

  it('hides itself after 6s by default, or the given duration', () => {
    showToast('x');
    vi.advanceTimersByTime(50 + 5_900);
    expect(toasts()).toHaveLength(1);
    vi.advanceTimersByTime(200);
    expect(toasts()).toHaveLength(0);
    showToast('y', { duration: 1_000 });
    vi.advanceTimersByTime(50 + 1_000);
    expect(toasts()).toHaveLength(0);
  });

  it('stays when sticky until the returned function runs', () => {
    const hide = showToast('x', { duration: 'sticky' });
    vi.advanceTimersByTime(60_000);
    expect(toasts()).toHaveLength(1);
    hide();
    expect(toasts()).toHaveLength(0);
  });

  it('names the dismiss button from DEFAULT_STRINGS, strings or dismissLabel', () => {
    showToast('x');
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast-close')!.getAttribute('aria-label')).toBe('Dismiss');
    showToast('x', { strings: { dismiss: 'Cerrar' } });
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast-close')!.getAttribute('aria-label')).toBe('Cerrar');
    showToast('x', { strings: { dismiss: 'Cerrar' }, dismissLabel: 'Fermer' });
    vi.advanceTimersByTime(50);
    expect(document.querySelector('.nish-toast-close')!.getAttribute('aria-label')).toBe('Fermer');
  });

  it('dismiss button and Escape hide it', () => {
    showToast('x');
    vi.advanceTimersByTime(50);
    document.querySelector<HTMLButtonElement>('.nish-toast-close')!.click();
    expect(toasts()).toHaveLength(0);
    showToast('y');
    vi.advanceTimersByTime(50);
    document.querySelector('.nish-toast')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(toasts()).toHaveLength(0);
  });

  it('renders a safe link action and hides after a click', () => {
    const onClick = vi.fn();
    showToast('x', { action: { label: 'Open', href: 'https://example.com/a', onClick } });
    vi.advanceTimersByTime(50);
    const a = document.querySelector<HTMLAnchorElement>('a.nish-toast-action')!;
    expect(a.getAttribute('href')).toBe('https://example.com/a');
    expect(a.textContent).toBe('Open');
    a.addEventListener('click', (e) => e.preventDefault());
    a.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toasts()).toHaveLength(0);
  });

  it('drops an action whose href is javascript:, data: or vbscript:', () => {
    for (const href of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\nscript:alert(1)', 'data:text/html,x', 'vbscript:x']) {
      showToast('x', { action: { label: 'Go', href } });
      vi.advanceTimersByTime(50);
      expect(document.querySelector('.nish-toast-action'), href).toBeNull();
      expect(document.querySelector('a[href^="javascript"]')).toBeNull();
    }
  });

  it('renders a button action without an href', () => {
    const onClick = vi.fn();
    showToast('x', { action: { label: 'Undo', onClick } });
    vi.advanceTimersByTime(50);
    const b = document.querySelector<HTMLButtonElement>('button.nish-toast-action')!;
    expect(b.type).toBe('button');
    b.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toasts()).toHaveLength(0);
  });

  it('pauses the timer while focus is inside, and gives a moment after', () => {
    showToast('x', { duration: 2_000, action: { label: 'Undo' } });
    vi.advanceTimersByTime(50);
    const box = document.querySelector('.nish-toast')!;
    const btn = box.querySelector<HTMLElement>('.nish-toast-action')!;
    vi.advanceTimersByTime(1_000);
    btn.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: null }));
    vi.advanceTimersByTime(60_000);
    expect(toasts()).toHaveLength(1);
    btn.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    vi.advanceTimersByTime(900);
    expect(toasts()).toHaveLength(1);
    vi.advanceTimersByTime(200);
    expect(toasts()).toHaveLength(0);
  });

  it('moving focus between its own controls does not pause or resume', () => {
    showToast('x', { duration: 2_000, action: { label: 'Undo' } });
    vi.advanceTimersByTime(50);
    const box = document.querySelector('.nish-toast')!;
    const close = box.querySelector<HTMLElement>('.nish-toast-close')!;
    box.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: close }));
    vi.advanceTimersByTime(2_100);
    expect(toasts()).toHaveLength(0);
  });
});

describe('confirmDialog', () => {
  function stubDialog() {
    const proto = HTMLDialogElement.prototype;
    vi.spyOn(proto, 'showModal').mockImplementation(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    vi.spyOn(proto, 'close').mockImplementation(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    });
  }

  it('builds a labelled dialog from DOM calls and resolves true on confirm', async () => {
    stubDialog();
    const innerHTML = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    const p = confirmDialog({ title: 'Save?', body: 'Unsaved changes', confirmLabel: 'Save' });
    const dialog = document.querySelector('dialog.nish-dialog')!;
    const title = dialog.querySelector('h2')!;
    expect(title.textContent).toBe('Save?');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(dialog.querySelector('.nish-dialog-body')!.textContent).toBe('Unsaved changes');
    expect(dialog.getAttribute('aria-describedby')).toBe(dialog.querySelector('.nish-dialog-body')!.id);
    const buttons = dialog.querySelectorAll('button');
    expect(buttons[0]!.textContent).toBe('Cancel');
    expect(buttons[1]!.textContent).toBe('Save');
    expect(buttons[1]!.className).toContain('nish-btn--primary');
    expect(buttons[1]!.autofocus).toBe(true);
    expect(innerHTML).not.toHaveBeenCalled();
    buttons[1]!.click();
    await expect(p).resolves.toBe(true);
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('resolves false on Cancel, and starts focus on Cancel for danger', async () => {
    stubDialog();
    const p = confirmDialog({ title: 'Delete?', tone: 'danger' });
    const buttons = document.querySelectorAll<HTMLButtonElement>('dialog button');
    expect(buttons[0]!.autofocus).toBe(true);
    expect(buttons[1]!.hasAttribute('autofocus')).toBe(false);
    expect(buttons[1]!.className).toContain('nish-btn--danger');
    expect(buttons[1]!.textContent).toBe('Confirm');
    expect(document.querySelector('.nish-dialog-body')).toBeNull();
    buttons[0]!.click();
    await expect(p).resolves.toBe(false);
  });

  it('takes the cancel label from strings, and cancelLabel wins', async () => {
    stubDialog();
    const p1 = confirmDialog({ title: 'x', strings: { cancel: 'Cancelar' } });
    expect(document.querySelectorAll('dialog button')[0]!.textContent).toBe('Cancelar');
    document.querySelectorAll<HTMLButtonElement>('dialog button')[0]!.click();
    await p1;
    const p2 = confirmDialog({ title: 'x', strings: { cancel: 'Cancelar' }, cancelLabel: 'Non' });
    expect(document.querySelectorAll('dialog button')[0]!.textContent).toBe('Non');
    document.querySelectorAll<HTMLButtonElement>('dialog button')[0]!.click();
    await p2;
  });

  it('resolves false on the cancel event and keeps Escape from the page', async () => {
    stubDialog();
    const pageKey = vi.fn();
    document.addEventListener('keydown', pageKey);
    const p = confirmDialog({ title: 'x' });
    const dialog = document.querySelector('dialog')!;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(pageKey).not.toHaveBeenCalled();
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    await expect(p).resolves.toBe(false);
    document.removeEventListener('keydown', pageKey);
  });

  it('returns focus to the opener', async () => {
    stubDialog();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const p = confirmDialog({ title: 'x' });
    document.querySelectorAll<HTMLButtonElement>('dialog button')[0]!.click();
    await p;
    expect(document.activeElement).toBe(opener);
  });

  it('a backdrop click cancels; a click inside does not', async () => {
    stubDialog();
    const p = confirmDialog({ title: 'x' });
    const dialog = document.querySelector('dialog')!;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({ left: 10, right: 110, top: 10, bottom: 110 } as DOMRect);
    dialog.dispatchEvent(new MouseEvent('click', { clientX: 50, clientY: 50 }));
    expect(document.querySelector('dialog')).not.toBeNull();
    dialog.dispatchEvent(new MouseEvent('click', { clientX: 500, clientY: 50 }));
    await expect(p).resolves.toBe(false);
  });
});

describe('mountTooltips', () => {
  const html =
    '<span class="nish-tooltip" tabindex="0">Trigger<span class="nish-tooltip-content">Tip</span></span>';

  it('links the tip to its trigger and gives it a role', () => {
    document.body.innerHTML = html;
    const off = mountTooltips();
    const t = document.querySelector('.nish-tooltip')!;
    const tip = document.querySelector('.nish-tooltip-content')!;
    expect(tip.getAttribute('role')).toBe('tooltip');
    expect(tip.id).toMatch(/^nish-tip-\d+$/);
    expect(t.getAttribute('aria-describedby')).toBe(tip.id);
    off();
  });

  it('keeps an existing id, role and describedby entries', () => {
    document.body.innerHTML =
      '<span class="nish-tooltip" aria-describedby="other"><span class="nish-tooltip-content" id="mine" role="note">Tip</span></span>';
    mountTooltips()();
    const t = document.querySelector('.nish-tooltip')!;
    expect(t.getAttribute('aria-describedby')).toBe('other mine');
    expect(document.querySelector('#mine')!.getAttribute('role')).toBe('note');
    mountTooltips()();
    expect(t.getAttribute('aria-describedby')).toBe('other mine');
  });

  it('ignores a trigger without a tip', () => {
    document.body.innerHTML = '<span class="nish-tooltip">No tip</span>';
    expect(() => mountTooltips()()).not.toThrow();
    expect(document.querySelector('.nish-tooltip')!.hasAttribute('aria-describedby')).toBe(false);
  });

  it('removes the tip-hidden mark when focus leaves, and stops after cleanup', () => {
    document.body.innerHTML = html;
    const off = mountTooltips();
    const t = document.querySelector<HTMLElement>('.nish-tooltip')!;
    t.setAttribute('data-tooltip-hidden', '');
    const inner = t.querySelector('.nish-tooltip-content')!;
    t.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: inner }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(true); // focus moved inside the trigger
    t.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(false);
    off();
    t.setAttribute('data-tooltip-hidden', '');
    t.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(true);
  });
});
