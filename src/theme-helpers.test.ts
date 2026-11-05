import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  confirmDialog,
  getThemeChoice,
  mountChecklist as rawChecklist,
  mountHeightVar as rawHeightVar,
  mountScrollspy as rawScrollspy,
  mountStuck as rawStuck,
  mountThemeToggle as rawThemeToggle,
  mountTooltips as rawTooltips,
  onThemeChange,
  openSheet,
  registerThemes,
  resolveTheme,
  setThemeChoice,
} from './theme';

// The static layout helpers of theme.ts (sheets, height vars, stuck, scrollspy, checklists) plus
// the small branches theme.test.ts leaves out. Every test builds its own DOM and stubs; the
// afterEach below puts back whatever a test changed on window, document and the globals.

const root = document.documentElement;

/** Cleanups of everything a test mounted, run in afterEach so no observer or window listener
 *  outlives its test and fires into the next one. */
const mounted: (() => void)[] = [];
const track =
  <A extends unknown[]>(fn: (...args: A) => () => void) =>
  (...args: A): (() => void) => {
    const off = fn(...args);
    mounted.push(off);
    return off;
  };
const mountChecklist = track(rawChecklist);
const mountHeightVar = track(rawHeightVar);
const mountScrollspy = track(rawScrollspy);
const mountStuck = track(rawStuck);
const mountThemeToggle = track(rawThemeToggle);
const mountTooltips = track(rawTooltips);

/** Every property a test redefines on a shared object, put back by `restoreProps`. */
const saved: { obj: object; key: string; desc: PropertyDescriptor | undefined }[] = [];

function defineProp(obj: object, key: string, value: unknown): void {
  saved.push({ obj, key, desc: Object.getOwnPropertyDescriptor(obj, key) });
  Object.defineProperty(obj, key, { value, configurable: true, writable: true });
}

function restoreProps(): void {
  while (saved.length) {
    const { obj, key, desc } = saved.pop()!;
    if (desc) Object.defineProperty(obj, key, desc);
    else delete (obj as Record<string, unknown>)[key];
  }
}

/** matchMedia that answers true for every query `match` accepts. */
function stubMedia(match: (query: string) => boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({
      matches: match(q),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

const reduced = (q: string) => q.includes('prefers-reduced-motion');
const wide = (q: string) => q.includes('min-width: 640px');

function rect(r: Partial<DOMRect>): () => DOMRect {
  const full = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, ...r };
  return () => ({ ...full, toJSON: () => full }) as DOMRect;
}

beforeEach(() => {
  root.removeAttribute('style');
});

afterEach(() => {
  while (mounted.length) mounted.pop()!();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  restoreProps();
  for (const a of ['data-nish-domain', 'data-nish-themes', 'data-nish-storage-key', 'data-theme', 'data-scheme', 'data-theme-choice']) {
    root.removeAttribute(a);
  }
  root.removeAttribute('style');
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  localStorage.clear();
});

// --- openSheet ---------------------------------------------------------------------

interface SheetParts {
  dialog: HTMLDialogElement;
  header: HTMLElement;
  child: HTMLElement;
  closeBtn: HTMLElement;
  opener: HTMLButtonElement;
}

function makeSheet(height = 400): SheetParts {
  const opener = document.createElement('button');
  document.body.append(opener);
  opener.focus();
  const dialog = document.createElement('dialog');
  dialog.className = 'nish-sheet';
  const header = document.createElement('div');
  header.className = 'nish-sheet-header';
  const child = document.createElement('p');
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('data-sheet-close', '');
  const inner = document.createElement('span');
  closeBtn.append(inner);
  dialog.append(header, child, closeBtn);
  document.body.append(dialog);
  dialog.getBoundingClientRect = rect({ left: 0, top: 100, right: 300, bottom: 100 + height, width: 300, height });
  return { dialog, header, child, closeBtn, opener };
}

function pointer(type: string, init: { y?: number; x?: number; t?: number; pointerType?: string; primary?: boolean }): PointerEvent {
  const e = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 10,
    clientY: init.y ?? 0,
    pointerType: init.pointerType ?? 'touch',
    isPrimary: init.primary ?? true,
  });
  Object.defineProperty(e, 'timeStamp', { value: init.t ?? 0 });
  return e;
}

describe('openSheet', () => {
  beforeEach(() => {
    stubMedia(() => false);
  });

  it('opens the dialog with showModal and returns a closer', () => {
    const { dialog } = makeSheet();
    const spy = vi.spyOn(dialog, 'showModal');
    const close = openSheet(dialog);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);
    expect(typeof close).toBe('function');
  });

  it('on an already open dialog returns a closer and does not reopen', () => {
    const { dialog } = makeSheet();
    dialog.showModal();
    const spy = vi.spyOn(dialog, 'showModal');
    const close = openSheet(dialog);
    expect(spy).not.toHaveBeenCalled();
    expect(typeof close).toBe('function');
    expect(dialog.open).toBe(true);
  });

  it('with reduced motion the closer closes at once', () => {
    stubMedia(reduced);
    const { dialog } = makeSheet();
    const close = openSheet(dialog);
    close();
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute('data-closing')).toBe(false);
  });

  it('closing twice in a row does nothing the second time', () => {
    stubMedia(reduced);
    const { dialog } = makeSheet();
    const close = openSheet(dialog);
    close();
    const spy = vi.spyOn(dialog, 'close');
    close();
    expect(spy).not.toHaveBeenCalled();
  });

  it('without reduced motion sets data-closing and closes after 260 ms', () => {
    vi.useFakeTimers();
    const { dialog } = makeSheet();
    dialog.style.transform = 'translateY(40px)';
    const close = openSheet(dialog);
    close();
    expect(dialog.hasAttribute('data-closing')).toBe(true);
    expect(dialog.style.transform).toBe('');
    vi.advanceTimersByTime(259);
    expect(dialog.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute('data-closing')).toBe(false);
  });

  it('a second closer call while the exit animation plays does not restart it', () => {
    vi.useFakeTimers();
    const { dialog } = makeSheet();
    const close = openSheet(dialog);
    close();
    vi.advanceTimersByTime(200);
    close();
    vi.advanceTimersByTime(60);
    expect(dialog.open).toBe(false);
  });

  it('closes on animationend from the dialog, not from a child', () => {
    vi.useFakeTimers();
    const { dialog, child } = makeSheet();
    const close = openSheet(dialog);
    close();
    child.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(dialog.open).toBe(true);
    dialog.dispatchEvent(new Event('animationend'));
    expect(dialog.open).toBe(false);
    // the timer was cleared by finish(): nothing left to run
    expect(vi.getTimerCount()).toBe(0);
  });

  it('prevents cancel and closes', () => {
    stubMedia(reduced);
    const { dialog } = makeSheet();
    openSheet(dialog);
    const e = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
  });

  it('stops Escape from reaching outer handlers, and only Escape', () => {
    const { dialog, child } = makeSheet();
    openSheet(dialog);
    const outer = vi.fn();
    document.body.addEventListener('keydown', outer);
    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(outer).not.toHaveBeenCalled();
    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(outer).toHaveBeenCalledTimes(1);
    document.body.removeEventListener('keydown', outer);
  });

  it('closes on a click on the dialog outside its rect, not inside', () => {
    stubMedia(reduced);
    const { dialog } = makeSheet();
    openSheet(dialog);
    const at = (x: number, y: number) => dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    at(150, 300);
    expect(dialog.open).toBe(true);
    at(0, 100);
    expect(dialog.open).toBe(true);
    at(300, 500);
    expect(dialog.open).toBe(true);
    at(150, 99);
    expect(dialog.open).toBe(false);
  });

  it.each([
    ['left of it', 301, 300],
    ['right of it', -1, 300],
    ['above it', 150, 99],
    ['below it', 150, 501],
  ])('a click %s counts as the backdrop', (_name, x, y) => {
    stubMedia(reduced);
    const { dialog } = makeSheet();
    openSheet(dialog);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
    expect(dialog.open).toBe(false);
  });

  it('closes on a click on [data-sheet-close] or inside it', () => {
    stubMedia(reduced);
    const a = makeSheet();
    openSheet(a.dialog);
    a.child.click();
    expect(a.dialog.open).toBe(true);
    a.closeBtn.firstElementChild!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(a.dialog.open).toBe(false);
  });

  it('returns focus to the opener on close when it is still connected', () => {
    stubMedia(reduced);
    const { dialog, opener } = makeSheet();
    const close = openSheet(dialog);
    const other = document.createElement('button');
    document.body.append(other);
    other.focus();
    close();
    expect(document.activeElement).toBe(opener);
  });

  it('does not touch focus when the opener was removed', () => {
    stubMedia(reduced);
    const { dialog, opener } = makeSheet();
    const close = openSheet(dialog);
    const spy = vi.spyOn(opener, 'focus');
    opener.remove();
    close();
    expect(spy).not.toHaveBeenCalled();
  });

  it('works without an opener (the body had focus)', () => {
    stubMedia(reduced);
    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    (document.activeElement as HTMLElement | null)?.blur();
    const close = openSheet(dialog);
    close();
    expect(dialog.open).toBe(false);
  });

  it('removes its listeners after close: a second cancel does nothing', () => {
    stubMedia(reduced);
    const { dialog, child } = makeSheet();
    openSheet(dialog);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(dialog.open).toBe(false);
    const e = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    const outer = vi.fn();
    document.body.addEventListener('keydown', outer);
    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(outer).toHaveBeenCalledTimes(1);
    dialog.dispatchEvent(pointer('pointerdown', { y: 110 }));
    dialog.dispatchEvent(pointer('pointermove', { y: 400, t: 10 }));
    expect(dialog.style.transform).toBe('');
    document.body.removeEventListener('keydown', outer);
  });

  describe('swipe', () => {
    it('follows the finger with translateY and closes past 30% of the height', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      expect(dialog.style.transition).toBe('none');
      dialog.dispatchEvent(pointer('pointermove', { y: 180, t: 1000 }));
      expect(dialog.style.transform).toBe('translateY(60px)');
      dialog.dispatchEvent(pointer('pointermove', { y: 250, t: 2000 }));
      expect(dialog.style.transform).toBe('translateY(130px)');
      dialog.dispatchEvent(pointer('pointerup', { y: 250, t: 3000 }));
      expect(dialog.hasAttribute('data-closing')).toBe(true);
      vi.advanceTimersByTime(260);
      expect(dialog.open).toBe(false);
    });

    it('does not close at exactly 30% of the height when slow', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 240, t: 5000 }));
      dialog.dispatchEvent(pointer('pointerup', { y: 240, t: 6000 }));
      expect(dialog.open).toBe(true);
      expect(dialog.hasAttribute('data-closing')).toBe(false);
    });

    it('closes on a fast flick shorter than 30%', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 160, t: 40 }));
      dialog.dispatchEvent(pointer('pointerup', { y: 160, t: 50 }));
      expect(dialog.hasAttribute('data-closing')).toBe(true);
    });

    it('does not close on a velocity of exactly 0.5', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 150, t: 60 }));
      dialog.dispatchEvent(pointer('pointerup', { y: 150, t: 70 }));
      expect(dialog.open).toBe(true);
      expect(dialog.hasAttribute('data-closing')).toBe(false);
    });

    it('springs back after a short drag: transition set, transform cleared, transition cleared later', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 140, t: 1000 }));
      expect(dialog.style.transform).toBe('translateY(20px)');
      dialog.dispatchEvent(pointer('pointerup', { y: 140, t: 2000 }));
      expect(dialog.open).toBe(true);
      expect(dialog.style.transform).toBe('');
      expect(dialog.style.transition).toContain('transform 180ms');
      vi.advanceTimersByTime(199);
      expect(dialog.style.transition).toContain('transform 180ms');
      vi.advanceTimersByTime(1);
      expect(dialog.style.transition).toBe('');
    });

    it('damps an upward drag to 30%', () => {
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 20, t: 1000 }));
      expect(dialog.style.transform).toBe('translateY(-30px)');
    });

    it('a pointercancel never closes, even past the distance', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 300, t: 10 }));
      dialog.dispatchEvent(pointer('pointercancel', { y: 300, t: 20 }));
      expect(dialog.open).toBe(true);
      expect(dialog.hasAttribute('data-closing')).toBe(false);
      expect(dialog.style.transform).toBe('');
    });

    it('ignores moves and ups without a pointerdown', () => {
      const { dialog } = makeSheet(400);
      openSheet(dialog);
      dialog.dispatchEvent(pointer('pointermove', { y: 300, t: 10 }));
      expect(dialog.style.transform).toBe('');
      dialog.dispatchEvent(pointer('pointerup', { y: 300, t: 20 }));
      expect(dialog.style.transition).toBe('');
    });

    it('ignores a mouse pointerdown', () => {
      const { dialog, header } = makeSheet();
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, pointerType: 'mouse' }));
      dialog.dispatchEvent(pointer('pointermove', { y: 300, t: 10 }));
      expect(dialog.style.transform).toBe('');
      expect(dialog.style.transition).toBe('');
    });

    it('ignores a pointer that is not primary', () => {
      const { dialog, header } = makeSheet();
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, primary: false }));
      dialog.dispatchEvent(pointer('pointermove', { y: 300, t: 10 }));
      expect(dialog.style.transform).toBe('');
    });

    it('ignores the swipe at 640px and up', () => {
      stubMedia(wide);
      const { dialog, header } = makeSheet();
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 300, t: 10 }));
      expect(dialog.style.transform).toBe('');
      expect(dialog.style.transition).toBe('');
    });

    it('starts on the handle strip (top 28px) of the dialog body, but not lower', () => {
      const { dialog, child } = makeSheet(400);
      openSheet(dialog);
      // the dialog top is 100: clientY 128 is 28px down, 129 is 29px down
      child.dispatchEvent(pointer('pointerdown', { y: 129 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 200, t: 10 }));
      expect(dialog.style.transform).toBe('');
      child.dispatchEvent(pointer('pointerdown', { y: 128 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 200, t: 20 }));
      expect(dialog.style.transform).toBe('translateY(72px)');
    });

    it('starts from the header however far down it is', () => {
      const { dialog, header } = makeSheet(400);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 300 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 310, t: 10 }));
      expect(dialog.style.transform).toBe('translateY(10px)');
    });

    it('does not start a drag while the sheet is closing', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet();
      const close = openSheet(dialog);
      close();
      header.dispatchEvent(pointer('pointerdown', { y: 120 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 300, t: 10 }));
      expect(dialog.style.transform).toBe('');
    });

    it('does not clear the transition of a closing sheet after a spring back', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(400);
      const close = openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointerup', { y: 120, t: 5000 }));
      expect(dialog.style.transition).toContain('transform 180ms');
      close();
      dialog.style.transition = 'sentinel';
      vi.advanceTimersByTime(200);
      expect(dialog.style.transition).toBe('sentinel');
    });

    it('uses a height of 1 when the dialog has no layout', () => {
      vi.useFakeTimers();
      const { dialog, header } = makeSheet(0);
      dialog.getBoundingClientRect = rect({ left: 0, top: 100, right: 300, bottom: 100, width: 300, height: 0 });
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120, t: 0 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 122, t: 5000 }));
      dialog.dispatchEvent(pointer('pointerup', { y: 122, t: 6000 }));
      // 2px > 30% of 1px
      expect(dialog.hasAttribute('data-closing')).toBe(true);
    });

    it('captures and releases the pointer when the platform supports it', () => {
      const { dialog, header } = makeSheet(400);
      const set = vi.fn();
      const release = vi.fn();
      defineProp(dialog, 'setPointerCapture', set);
      defineProp(dialog, 'releasePointerCapture', release);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120 }));
      expect(set).toHaveBeenCalledTimes(1);
      dialog.dispatchEvent(pointer('pointerup', { y: 120, t: 5000 }));
      expect(release).toHaveBeenCalledTimes(1);
    });

    it('works when the platform has no pointer capture', () => {
      const { dialog, header } = makeSheet(400);
      defineProp(dialog, 'setPointerCapture', undefined);
      defineProp(dialog, 'releasePointerCapture', undefined);
      openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120 }));
      dialog.dispatchEvent(pointer('pointerup', { y: 120, t: 5000 }));
      expect(dialog.style.transition).toContain('transform 180ms');
    });

    it('works without matchMedia', () => {
      vi.stubGlobal('matchMedia', undefined);
      const { dialog, header } = makeSheet(400);
      const close = openSheet(dialog);
      header.dispatchEvent(pointer('pointerdown', { y: 120 }));
      dialog.dispatchEvent(pointer('pointermove', { y: 140, t: 10 }));
      expect(dialog.style.transform).toBe('translateY(20px)');
      // no matchMedia means no reduced-motion query: the exit animation runs
      vi.useFakeTimers();
      close();
      expect(dialog.hasAttribute('data-closing')).toBe(true);
    });
  });
});

// --- mountHeightVar ----------------------------------------------------------------

describe('mountHeightVar', () => {
  class FakeRO {
    static all: FakeRO[] = [];
    observed: Element[] = [];
    disconnected = false;
    constructor(public cb: () => void) {
      FakeRO.all.push(this);
    }
    observe(el: Element) {
      this.observed.push(el);
    }
    disconnect() {
      this.disconnected = true;
    }
  }

  beforeEach(() => {
    FakeRO.all = [];
  });

  it('writes the offsetHeight in px on <html>', () => {
    const el = document.createElement('nav');
    defineProp(el, 'offsetHeight', 56);
    mountHeightVar(el, '--nish-bottom-nav-h');
    expect(root.style.getPropertyValue('--nish-bottom-nav-h')).toBe('56px');
  });

  it('removes the property at height 0', () => {
    const el = document.createElement('nav');
    root.style.setProperty('--x-h', '10px');
    defineProp(el, 'offsetHeight', 0);
    mountHeightVar(el, '--x-h');
    expect(root.style.getPropertyValue('--x-h')).toBe('');
  });

  it('rewrites on a ResizeObserver callback and observes the element', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const el = document.createElement('nav');
    let h = 40;
    Object.defineProperty(el, 'offsetHeight', { get: () => h, configurable: true });
    mountHeightVar(el, '--x-h');
    expect(FakeRO.all).toHaveLength(1);
    expect(FakeRO.all[0]!.observed).toEqual([el]);
    h = 72;
    FakeRO.all[0]!.cb();
    expect(root.style.getPropertyValue('--x-h')).toBe('72px');
    h = 0;
    FakeRO.all[0]!.cb();
    expect(root.style.getPropertyValue('--x-h')).toBe('');
  });

  it('does not listen to window resize when ResizeObserver exists', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const add = vi.spyOn(window, 'addEventListener');
    mountHeightVar(document.createElement('nav'), '--x-h');
    expect(add.mock.calls.some((c) => c[0] === 'resize')).toBe(false);
  });

  it('falls back to the window resize event without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const el = document.createElement('nav');
    let h = 30;
    Object.defineProperty(el, 'offsetHeight', { get: () => h, configurable: true });
    const off = mountHeightVar(el, '--x-h');
    h = 44;
    window.dispatchEvent(new Event('resize'));
    expect(root.style.getPropertyValue('--x-h')).toBe('44px');
    off();
    h = 99;
    window.dispatchEvent(new Event('resize'));
    expect(root.style.getPropertyValue('--x-h')).toBe('');
  });

  it('cleanup disconnects and removes the property', () => {
    vi.stubGlobal('ResizeObserver', FakeRO);
    const el = document.createElement('nav');
    defineProp(el, 'offsetHeight', 20);
    const off = mountHeightVar(el, '--x-h');
    expect(root.style.getPropertyValue('--x-h')).toBe('20px');
    off();
    expect(FakeRO.all[0]!.disconnected).toBe(true);
    expect(root.style.getPropertyValue('--x-h')).toBe('');
  });

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined);
    const off = mountHeightVar({} as HTMLElement, '--x-h');
    expect(off()).toBeUndefined();
  });
});

// --- mountStuck --------------------------------------------------------------------

describe('mountStuck', () => {
  class FakeIO {
    static all: FakeIO[] = [];
    observed: Element[] = [];
    disconnected = false;
    constructor(
      public cb: () => void,
      public options: IntersectionObserverInit,
    ) {
      FakeIO.all.push(this);
    }
    observe(el: Element) {
      this.observed.push(el);
    }
    disconnect() {
      this.disconnected = true;
    }
  }
  class FakeRO {
    static all: FakeRO[] = [];
    disconnected = false;
    constructor(public cb: () => void) {
      FakeRO.all.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }

  let el: HTMLElement;
  let top: number;

  /** A sticky element whose box is at `top` px from the viewport top. */
  function setup(opts: { position?: string; stickyTop?: string; boxTop?: number } = {}) {
    el = document.createElement('div');
    document.body.append(el);
    el.style.position = opts.position ?? 'sticky';
    el.style.top = opts.stickyTop ?? '10px';
    top = opts.boxTop ?? 10;
    el.getBoundingClientRect = () => rect({ top })();
  }

  beforeEach(() => {
    FakeIO.all = [];
    FakeRO.all = [];
    vi.stubGlobal('IntersectionObserver', FakeIO);
    vi.stubGlobal('ResizeObserver', FakeRO);
    defineProp(window, 'scrollY', 0);
    defineProp(root, 'scrollTop', 0);
  });

  it('is a no-op without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    setup();
    const onChange = vi.fn();
    const off = mountStuck(el, onChange);
    expect(FakeIO.all).toHaveLength(0);
    expect(off()).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined);
    expect(mountStuck({} as HTMLElement)()).toBeUndefined();
  });

  it('is stuck only when sticky, at its top, and scrolled', () => {
    setup();
    const onChange = vi.fn();
    mountStuck(el, onChange);
    // scroll 0: not stuck even though the box rests at its top
    expect(el.hasAttribute('data-stuck')).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    defineProp(window, 'scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('fires onChange once per change, not once per scroll event', () => {
    setup();
    const onChange = vi.fn();
    mountStuck(el, onChange);
    defineProp(window, 'scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(onChange).toHaveBeenCalledTimes(1);
    top = 200;
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(false);
    window.dispatchEvent(new Event('scroll'));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('works without an onChange callback', () => {
    setup();
    mountStuck(el);
    defineProp(window, 'scrollY', 5);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
  });

  it('is not stuck when the element is not position: sticky', () => {
    setup({ position: 'relative' });
    mountStuck(el);
    defineProp(window, 'scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(false);
  });

  it('is stuck within 1px of the sticky top and not at 1px or more', () => {
    setup({ boxTop: 10.9 });
    mountStuck(el);
    defineProp(window, 'scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
    top = 11;
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(false);
    top = 9.1;
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
    top = 9;
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(false);
  });

  it('treats a sticky top that is not a number as 0', () => {
    setup({ stickyTop: 'auto', boxTop: 0 });
    mountStuck(el);
    defineProp(window, 'scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
    expect(FakeIO.all[0]!.options.rootMargin).toBe('-1px 0px 0px 0px');
  });

  it('counts documentElement.scrollTop as scrolled when window.scrollY is 0', () => {
    setup();
    mountStuck(el);
    defineProp(root, 'scrollTop', 30);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
  });

  it('counts a scrolled ancestor, stopping at the body', () => {
    setup();
    const scroller = document.createElement('section');
    scroller.append(el);
    document.body.append(scroller);
    mountStuck(el);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(false);
    defineProp(scroller, 'scrollTop', 12);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
  });

  it('does not count the body scrollTop as an ancestor', () => {
    setup();
    defineProp(document.body, 'scrollTop', 40);
    mountStuck(el);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(false);
  });

  it('evaluates when the IntersectionObserver reports', () => {
    setup();
    mountStuck(el);
    defineProp(window, 'scrollY', 50);
    FakeIO.all[0]!.cb();
    expect(el.hasAttribute('data-stuck')).toBe(true);
  });

  it('observes the element with the thresholds and a root margin cut 1px below top', () => {
    setup({ stickyTop: '16px', boxTop: 16 });
    mountStuck(el);
    expect(FakeIO.all).toHaveLength(1);
    expect(FakeIO.all[0]!.observed).toEqual([el]);
    expect(FakeIO.all[0]!.options.rootMargin).toBe('-17px 0px 0px 0px');
    expect(FakeIO.all[0]!.options.threshold).toEqual([0, 0.25, 0.5, 0.75, 0.9, 0.99, 1]);
  });

  it('rebuilds the observer only when the rounded top changes', () => {
    setup({ stickyTop: '10px' });
    mountStuck(el);
    expect(FakeIO.all).toHaveLength(1);
    // the same top: the resize callback keeps the observer
    FakeRO.all[0]!.cb();
    expect(FakeIO.all).toHaveLength(1);
    el.style.top = '10.4px';
    FakeRO.all[0]!.cb();
    expect(FakeIO.all).toHaveLength(1);
    el.style.top = '24px';
    FakeRO.all[0]!.cb();
    expect(FakeIO.all).toHaveLength(2);
    expect(FakeIO.all[0]!.disconnected).toBe(true);
    expect(FakeIO.all[1]!.options.rootMargin).toBe('-25px 0px 0px 0px');
    expect(FakeIO.all[1]!.observed).toEqual([el]);
  });

  it('rebuilds when <html> style changes (MutationObserver)', async () => {
    setup({ stickyTop: '10px' });
    mountStuck(el);
    el.style.top = '30px';
    root.style.setProperty('--nish-header-h', '30px');
    await vi.waitFor(() => expect(FakeIO.all).toHaveLength(2));
    expect(FakeIO.all[1]!.options.rootMargin).toBe('-31px 0px 0px 0px');
  });

  it('works without ResizeObserver and MutationObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    vi.stubGlobal('MutationObserver', undefined);
    setup();
    const off = mountStuck(el);
    defineProp(window, 'scrollY', 5);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
    off();
    expect(el.hasAttribute('data-stuck')).toBe(false);
  });

  it('cleanup removes the scroll listener, disconnects and clears data-stuck', () => {
    setup();
    const onChange = vi.fn();
    const off = mountStuck(el, onChange);
    defineProp(window, 'scrollY', 50);
    window.dispatchEvent(new Event('scroll'));
    expect(el.hasAttribute('data-stuck')).toBe(true);
    off();
    expect(el.hasAttribute('data-stuck')).toBe(false);
    expect(FakeIO.all[0]!.disconnected).toBe(true);
    expect(FakeRO.all[0]!.disconnected).toBe(true);
    onChange.mockClear();
    top = 200;
    window.dispatchEvent(new Event('scroll'));
    top = 10;
    window.dispatchEvent(new Event('scroll'));
    expect(onChange).not.toHaveBeenCalled();
    expect(el.hasAttribute('data-stuck')).toBe(false);
  });

  it('listens to scroll in the capture phase, so a scrolling ancestor counts', () => {
    setup();
    const scroller = document.createElement('section');
    scroller.append(el);
    document.body.append(scroller);
    mountStuck(el);
    defineProp(scroller, 'scrollTop', 5);
    // scroll does not bubble: only a capture listener on window sees it
    scroller.dispatchEvent(new Event('scroll', { bubbles: false }));
    expect(el.hasAttribute('data-stuck')).toBe(true);
  });
});

// --- mountScrollspy ----------------------------------------------------------------

describe('mountScrollspy', () => {
  let nav: HTMLElement;
  let links: HTMLAnchorElement[];
  let sections: Record<string, HTMLElement>;
  let tops: Record<string, number>;
  let frames: FrameRequestCallback[];

  function build(ids: string[], hrefs: string[] = ids.map((i) => `#${i}`)) {
    nav = document.createElement('nav');
    links = hrefs.map((h) => {
      const a = document.createElement('a');
      a.setAttribute('href', h);
      nav.append(a);
      return a;
    });
    document.body.append(nav);
    sections = {};
    tops = {};
    for (const id of ids) {
      const s = document.createElement('section');
      s.id = id;
      tops[id] = 1000;
      s.getBoundingClientRect = () => rect({ top: tops[id]! })();
      document.body.append(s);
      sections[id] = s;
    }
  }

  const current = () => links.filter((a) => a.getAttribute('aria-current') === 'true');
  const flush = () => {
    const run = frames.splice(0);
    run.forEach((cb) => cb(0));
  };

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('ResizeObserver', undefined);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    defineProp(window, 'scrollY', 0);
    defineProp(window, 'innerHeight', 700);
    defineProp(root, 'scrollHeight', 5000);
  });

  it('makes the first link current at the top of the page', () => {
    build(['a', 'b', 'c']);
    tops.a = 500;
    mountScrollspy(nav, { offset: 100 });
    expect(current()).toEqual([links[0]]);
  });

  it('makes the last section whose top passed the line current, and the previous one loses it', () => {
    build(['a', 'b', 'c']);
    mountScrollspy(nav, { offset: 100 });
    tops.a = -400;
    tops.b = 90;
    tops.c = 600;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[1]]);
    tops.b = -300;
    tops.c = 101;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[2]]);
    expect(links[1]!.hasAttribute('aria-current')).toBe(false);
  });

  it('counts a section 1px past the line, not 2px', () => {
    build(['a', 'b']);
    mountScrollspy(nav, { offset: 100 });
    tops.b = 102;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[0]]);
    tops.b = 101;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[1]]);
  });

  it('skips links without a target when picking the current one', () => {
    build(['a', 'b'], ['#a', '#missing', '#b']);
    mountScrollspy(nav, { offset: 100 });
    tops.a = -10;
    tops.b = 900;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[0]]);
  });

  it('ignores links that are not in-page hashes or are a bare "#"', () => {
    build(['a', 'b'], ['#a', '#', '#b']);
    links[1]!.setAttribute('href', 'https://example.com/#a');
    links[1]!.setAttribute('href', '#');
    mountScrollspy(nav, { offset: 100 });
    tops.a = -10;
    tops.b = -5;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[2]]);
    links[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(current()).toEqual([links[2]]);
  });

  it('at the bottom of the page the last link with a target is current', () => {
    build(['a', 'b', 'c'], ['#a', '#b', '#c', '#nope']);
    mountScrollspy(nav, { offset: 100 });
    defineProp(window, 'scrollY', 4298);
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[2]]);
  });

  it('is not at the bottom one pixel short of the 2px slack', () => {
    build(['a', 'b']);
    mountScrollspy(nav, { offset: 100 });
    defineProp(window, 'scrollY', 4297);
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[0]]);
  });

  it('offset overrides the line; the default is header + nav height + 8', () => {
    build(['a', 'b']);
    tops.b = 150;
    const off = mountScrollspy(nav, { offset: 200 });
    expect(current()).toEqual([links[1]]);
    off();
    root.style.setProperty('--nish-header-h', '50px');
    defineProp(nav, 'offsetHeight', 40);
    // line = 50 + 40 + 8 = 98
    mountScrollspy(nav, { height: false });
    expect(current()).toEqual([links[0]]);
    tops.b = 100;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[0]]);
    tops.b = 99;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[1]]);
  });

  it('with no header variable the line is the nav height plus 8', () => {
    build(['a', 'b']);
    defineProp(nav, 'offsetHeight', 20);
    tops.b = 28;
    mountScrollspy(nav, { height: false });
    expect(current()).toEqual([links[1]]);
  });

  it('writes --nish-sticky-extra by default and not with height: false', () => {
    build(['a']);
    defineProp(nav, 'offsetHeight', 44);
    mountScrollspy(nav, { offset: 10, height: false });
    expect(root.style.getPropertyValue('--nish-sticky-extra')).toBe('');
    mountScrollspy(nav, { offset: 10 });
    expect(root.style.getPropertyValue('--nish-sticky-extra')).toBe('44px');
  });

  it('sets data-at-start and data-at-end from scrollLeft', () => {
    build(['a']);
    defineProp(nav, 'scrollWidth', 600);
    defineProp(nav, 'clientWidth', 300);
    mountScrollspy(nav, { offset: 10 });
    expect(nav.dataset.atStart).toBe('true');
    expect(nav.dataset.atEnd).toBe('false');
    nav.scrollLeft = 2;
    nav.dispatchEvent(new Event('scroll'));
    expect(nav.dataset.atStart).toBe('false');
    expect(nav.dataset.atEnd).toBe('false');
    nav.scrollLeft = 299;
    nav.dispatchEvent(new Event('scroll'));
    expect(nav.dataset.atEnd).toBe('true');
    nav.scrollLeft = 298;
    nav.dispatchEvent(new Event('scroll'));
    expect(nav.dataset.atEnd).toBe('false');
    nav.scrollLeft = 1;
    nav.dispatchEvent(new Event('scroll'));
    expect(nav.dataset.atStart).toBe('true');
  });

  it('is at the end when the nav does not overflow', () => {
    build(['a']);
    defineProp(nav, 'scrollWidth', 301);
    defineProp(nav, 'clientWidth', 300);
    mountScrollspy(nav, { offset: 10 });
    expect(nav.dataset.atEnd).toBe('true');
  });

  it('a click on a link activates it, and a click elsewhere does not', () => {
    build(['a', 'b', 'c']);
    mountScrollspy(nav, { offset: 100 });
    const inner = document.createElement('i');
    links[2]!.append(inner);
    inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(current()).toEqual([links[2]]);
    nav.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(current()).toEqual([links[2]]);
  });

  it('ignores a malformed percent-escape in a hash', () => {
    build(['a'], ['#a', '#%E0%A4%A']);
    expect(() => mountScrollspy(nav, { offset: 100 })).not.toThrow();
    tops.a = -10;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[0]]);
  });

  it('finds a section by a decoded hash', () => {
    build(['café', 'z'], ['#caf%C3%A9', '#z']);
    mountScrollspy(nav, { offset: 100 });
    tops['café'] = 50;
    tops.z = 900;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(current()).toEqual([links[0]]);
  });

  it('does nothing harmful with no links', () => {
    build([]);
    const off = mountScrollspy(nav, { offset: 100 });
    expect(current()).toEqual([]);
    expect(() => off()).not.toThrow();
  });

  it('batches updates in one animation frame', () => {
    build(['a', 'b']);
    mountScrollspy(nav, { offset: 100 });
    const spy = vi.spyOn(sections.a!, 'getBoundingClientRect');
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);
    expect(spy).not.toHaveBeenCalled();
    flush();
    expect(spy).toHaveBeenCalledTimes(1);
    // after the frame ran, the next event schedules again
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1);
  });

  it('observes the nav with ResizeObserver when present and updates edges and the spy', () => {
    const cbs: (() => void)[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          cbs.push(cb);
        }
        observe() {}
        disconnect() {
          disconnect();
        }
      },
    );
    build(['a', 'b']);
    defineProp(nav, 'scrollWidth', 600);
    defineProp(nav, 'clientWidth', 300);
    const off = mountScrollspy(nav, { offset: 100, height: false });
    expect(cbs).toHaveLength(1);
    defineProp(nav, 'scrollWidth', 300);
    tops.b = 10;
    cbs[0]!();
    expect(nav.dataset.atEnd).toBe('true');
    expect(frames).toHaveLength(1);
    flush();
    expect(current()).toEqual([links[1]]);
    off();
    expect(disconnect).toHaveBeenCalled();
  });

  it('scrolls the current link into view inside the nav', () => {
    build(['a', 'b', 'c']);
    defineProp(nav, 'clientWidth', 200);
    defineProp(nav, 'scrollWidth', 900);
    defineProp(nav, 'offsetLeft', 10);
    const place = (a: HTMLAnchorElement, left: number, width: number) => {
      defineProp(a, 'offsetLeft', left);
      defineProp(a, 'offsetWidth', width);
    };
    place(links[0]!, 10, 80);
    place(links[1]!, 400, 80);
    place(links[2]!, 100, 80);
    mountScrollspy(nav, { offset: 100 });
    // link b: left = 390, far right of the 200px view -> 390 + 80 - 200 + 24 = 294
    tops.b = 10;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(nav.scrollLeft).toBe(294);
    // link c: left = 90 is left of scrollLeft + 24 -> 66
    tops.c = 10;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(nav.scrollLeft).toBe(66);
    // link a: left = 0 -> 0
    tops.b = 900;
    tops.c = 900;
    tops.a = 10;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(nav.scrollLeft).toBe(0);
  });

  it('leaves the scroll position alone when the link is already visible', () => {
    build(['a', 'b']);
    defineProp(nav, 'clientWidth', 400);
    defineProp(nav, 'scrollWidth', 900);
    defineProp(nav, 'offsetLeft', 0);
    for (const a of links) {
      defineProp(a, 'offsetLeft', 100);
      defineProp(a, 'offsetWidth', 100);
    }
    nav.scrollLeft = 50;
    mountScrollspy(nav, { offset: 100 });
    tops.b = 10;
    window.dispatchEvent(new Event('scroll'));
    flush();
    expect(nav.scrollLeft).toBe(50);
  });

  it('cleanup cancels the frame and removes attributes and listeners', () => {
    build(['a', 'b']);
    defineProp(nav, 'offsetHeight', 30);
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const off = mountScrollspy(nav, { offset: 100 });
    expect(current()).toEqual([links[0]]);
    expect(nav.dataset.atStart).toBe('true');
    window.dispatchEvent(new Event('scroll'));
    off();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(current()).toEqual([]);
    expect(nav.dataset.atStart).toBeUndefined();
    expect(nav.dataset.atEnd).toBeUndefined();
    expect(root.style.getPropertyValue('--nish-sticky-extra')).toBe('');
    // listeners are gone: nothing is scheduled any more
    frames.length = 0;
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    nav.dispatchEvent(new Event('scroll'));
    links[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(frames).toHaveLength(0);
    expect(current()).toEqual([]);
    expect(nav.dataset.atStart).toBeUndefined();
  });

  it('cleanup without a pending frame does not cancel anything', () => {
    build(['a']);
    const cancel = vi.fn();
    vi.stubGlobal('cancelAnimationFrame', cancel);
    mountScrollspy(nav, { offset: 100 })();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined);
    expect(mountScrollspy({} as HTMLElement)()).toBeUndefined();
  });
});

// --- mountChecklist ----------------------------------------------------------------

describe('mountChecklist', () => {
  function build(opts: { store?: string; progress?: 'before' | 'parent' | 'none'; ids?: string[] } = {}) {
    const wrap = document.createElement('div');
    const ids = opts.ids ?? ['a', 'b', 'c'];
    const list = document.createElement('ul');
    if (opts.store) list.dataset.store = opts.store;
    for (const id of ids) {
      const li = document.createElement('li');
      li.dataset.id = id;
      const box = document.createElement('input');
      box.type = 'checkbox';
      li.append(box);
      list.append(li);
    }
    const progress = document.createElement('div');
    progress.className = 'nish-checklist-progress';
    if (opts.progress === 'parent') {
      wrap.append(document.createElement('h2'), list, progress);
    } else if (opts.progress === 'none') {
      wrap.append(list);
    } else {
      wrap.append(progress, document.createElement('hr'), list);
    }
    document.body.append(wrap);
    const boxes = Array.from(list.querySelectorAll('input'));
    return { list, progress, boxes };
  }

  const toggle = (box: HTMLInputElement, on: boolean) => {
    box.checked = on;
    box.dispatchEvent(new Event('change', { bubbles: true }));
  };

  it('restores the checked ids from localStorage', () => {
    localStorage.setItem('k', JSON.stringify(['a', 'c']));
    const { list, boxes, progress } = build({ store: 'k' });
    mountChecklist(list);
    expect(boxes.map((b) => b.checked)).toEqual([true, false, true]);
    expect(progress.textContent).toBe('2 of 3');
  });

  it('starts unchecked when nothing is saved', () => {
    const { list, boxes, progress } = build({ store: 'k' });
    mountChecklist(list);
    expect(boxes.map((b) => b.checked)).toEqual([false, false, false]);
    expect(progress.textContent).toBe('0 of 3');
    expect((progress as HTMLElement).style.getPropertyValue('--p')).toBe('0%');
  });

  it('ignores corrupt JSON', () => {
    localStorage.setItem('k', '{not json');
    const { list, boxes } = build({ store: 'k' });
    expect(() => mountChecklist(list)).not.toThrow();
    expect(boxes.map((b) => b.checked)).toEqual([false, false, false]);
  });

  it('ignores a saved value that is not an array', () => {
    localStorage.setItem('k', JSON.stringify({ a: true }));
    const { list, boxes } = build({ store: 'k' });
    boxes[0]!.checked = true;
    mountChecklist(list);
    // not restored, so the markup's own state stays
    expect(boxes.map((b) => b.checked)).toEqual([true, false, false]);
  });

  it('unchecks boxes whose id is not in the saved array', () => {
    localStorage.setItem('k', JSON.stringify(['b']));
    const { list, boxes } = build({ store: 'k' });
    boxes[0]!.checked = true;
    mountChecklist(list);
    expect(boxes.map((b) => b.checked)).toEqual([false, true, false]);
  });

  it('saves the checked ids on change', () => {
    const { list, boxes } = build({ store: 'k' });
    mountChecklist(list);
    toggle(boxes[1]!, true);
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual(['b']);
    toggle(boxes[2]!, true);
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual(['b', 'c']);
    toggle(boxes[1]!, false);
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual(['c']);
  });

  it('ignores a change from something that is not a checkbox', () => {
    const { list, progress } = build({ store: 'k' });
    const text = document.createElement('input');
    text.type = 'text';
    list.querySelector('li')!.append(text);
    mountChecklist(list);
    progress.textContent = 'sentinel';
    text.dispatchEvent(new Event('change', { bubbles: true }));
    expect(localStorage.getItem('k')).toBeNull();
    expect(progress.textContent).toBe('sentinel');
    list.dispatchEvent(new Event('change', { bubbles: true }));
    expect(progress.textContent).toBe('sentinel');
  });

  it('writes "2 of 3" and --p as a share of the boxes', () => {
    const { list, boxes, progress } = build({ store: 'k' });
    mountChecklist(list);
    toggle(boxes[0]!, true);
    toggle(boxes[1]!, true);
    expect(progress.textContent).toBe('2 of 3');
    expect(parseFloat((progress as HTMLElement).style.getPropertyValue('--p'))).toBeCloseTo(66.6667, 3);
    expect((progress as HTMLElement).style.getPropertyValue('--p')).toMatch(/%$/);
    toggle(boxes[2]!, true);
    expect(progress.textContent).toBe('3 of 3');
    expect((progress as HTMLElement).style.getPropertyValue('--p')).toBe('100%');
  });

  it('shows 0 of 0 and 0% for an empty list', () => {
    const { list, progress } = build({ store: 'k', ids: [] });
    mountChecklist(list);
    expect(progress.textContent).toBe('0 of 0');
    expect((progress as HTMLElement).style.getPropertyValue('--p')).toBe('0%');
  });

  it('falls back to the first progress element in the parent', () => {
    const { list, progress, boxes } = build({ store: 'k', progress: 'parent' });
    mountChecklist(list);
    toggle(boxes[0]!, true);
    expect(progress.textContent).toBe('1 of 3');
  });

  it('prefers the nearest progress element before the list', () => {
    const { list, boxes } = build({ progress: 'before' });
    const nearer = document.createElement('div');
    nearer.className = 'nish-checklist-progress';
    list.before(nearer);
    mountChecklist(list);
    toggle(boxes[0]!, true);
    expect(nearer.textContent).toBe('1 of 3');
    expect(list.parentElement!.firstElementChild!.textContent).toBe('');
  });

  it('works with no progress element at all', () => {
    const { list, boxes } = build({ store: 'k', progress: 'none' });
    mountChecklist(list);
    expect(() => toggle(boxes[0]!, true)).not.toThrow();
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual(['a']);
  });

  it('counts without data-store and saves nothing', () => {
    const { list, boxes, progress } = build();
    const set = vi.spyOn(Storage.prototype, 'setItem');
    mountChecklist(list);
    toggle(boxes[0]!, true);
    expect(progress.textContent).toBe('1 of 3');
    expect(set).not.toHaveBeenCalled();
  });

  it('survives storage that throws on read and write', () => {
    const { list, boxes, progress } = build({ store: 'k' });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => mountChecklist(list)).not.toThrow();
    expect(() => toggle(boxes[0]!, true)).not.toThrow();
    expect(progress.textContent).toBe('1 of 3');
  });

  it('counts only boxes inside li[data-id]', () => {
    const { list, progress } = build({ store: 'k' });
    const stray = document.createElement('input');
    stray.type = 'checkbox';
    stray.checked = true;
    list.append(stray);
    const li = document.createElement('li');
    const noId = document.createElement('input');
    noId.type = 'checkbox';
    li.append(noId);
    list.append(li);
    mountChecklist(list);
    expect(progress.textContent).toBe('0 of 3');
  });

  it('cleanup removes the change listener', () => {
    const { list, boxes, progress } = build({ store: 'k' });
    const off = mountChecklist(list);
    toggle(boxes[0]!, true);
    off();
    toggle(boxes[1]!, true);
    expect(progress.textContent).toBe('1 of 3');
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual(['a']);
  });

  it('is a no-op without a document', () => {
    vi.stubGlobal('document', undefined);
    expect(mountChecklist({} as HTMLElement)()).toBeUndefined();
  });
});

// --- branches theme.test.ts leaves out ---------------------------------------------

describe('themeLabel through mountThemeToggle', () => {
  it('capitalizes the name of a registered theme that is not a preset', () => {
    registerThemes({ oceanic: 'dark' });
    localStorage.setItem('nish-theme', 'oceanic');
    const button = document.createElement('button');
    document.body.append(button);
    const off = mountThemeToggle(button, { showLabel: true });
    expect(button.querySelector('[data-theme-word]')!.textContent).toBe('Oceanic');
    expect(button.getAttribute('aria-label')).toContain('Oceanic (set on another site)');
    off();
  });

  it('uses the preset label for a shared preset', () => {
    localStorage.setItem('nish-theme', 'mocha');
    const button = document.createElement('button');
    document.body.append(button);
    const off = mountThemeToggle(button, { showLabel: true });
    expect(button.querySelector('[data-theme-word]')!.textContent).toBe('Mocha');
    off();
  });

  it('uses the given words for system, light and dark', () => {
    const button = document.createElement('button');
    document.body.append(button);
    const off = mountThemeToggle(button, { showLabel: true, labels: { system: 'Auto' } });
    expect(button.querySelector('[data-theme-word]')!.textContent).toBe('Auto');
    off();
  });
});

describe('mountTooltips Escape', () => {
  function tip(): HTMLElement {
    const t = document.createElement('span');
    t.className = 'nish-tooltip';
    const c = document.createElement('span');
    c.className = 'nish-tooltip-content';
    c.textContent = 'hint';
    t.append(c);
    document.body.append(t);
    return t;
  }

  it('hides the tips that are hovered or focused with data-tooltip-hidden', () => {
    const open = tip();
    const idle = tip();
    const off = mountTooltips();
    const original = document.querySelectorAll.bind(document);
    vi.spyOn(document, 'querySelectorAll').mockImplementation(((sel: string) => {
      if (sel === '.nish-tooltip:hover, .nish-tooltip:focus-within') return [open] as unknown as NodeListOf<Element>;
      return original(sel);
    }) as typeof document.querySelectorAll);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(open.hasAttribute('data-tooltip-hidden')).toBe(true);
    expect(idle.hasAttribute('data-tooltip-hidden')).toBe(false);
    off();
  });

  it('ignores other keys', () => {
    const open = tip();
    const off = mountTooltips();
    open.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(open.hasAttribute('data-tooltip-hidden')).toBe(false);
    off();
  });

  it('shows the tip again when the pointer leaves, but not when it moves inside', () => {
    const t = tip();
    t.setAttribute('data-tooltip-hidden', '');
    const off = mountTooltips();
    t.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: t.firstElementChild }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(true);
    t.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(false);
    t.setAttribute('data-tooltip-hidden', '');
    t.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(false);
    off();
  });

  it('ignores mouseout outside any tooltip', () => {
    const t = tip();
    t.setAttribute('data-tooltip-hidden', '');
    const off = mountTooltips();
    document.body.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(true);
    off();
  });

  it('keeps an existing role, id and describedby, and adds a missing one once', () => {
    const t = tip();
    const c = t.firstElementChild as HTMLElement;
    c.setAttribute('role', 'status');
    c.id = 'mine';
    t.setAttribute('aria-describedby', 'other mine');
    mountTooltips()();
    expect(c.getAttribute('role')).toBe('status');
    expect(c.id).toBe('mine');
    expect(t.getAttribute('aria-describedby')).toBe('other mine');
    const t2 = tip();
    t2.setAttribute('aria-describedby', 'x');
    mountTooltips()();
    const c2 = t2.firstElementChild as HTMLElement;
    expect(c2.getAttribute('role')).toBe('tooltip');
    expect(t2.getAttribute('aria-describedby')).toBe(`x ${c2.id}`);
  });

  it('skips a trigger with no content child', () => {
    const t = document.createElement('span');
    t.className = 'nish-tooltip';
    document.body.append(t);
    mountTooltips()();
    expect(t.hasAttribute('aria-describedby')).toBe(false);
  });

  it('cleanup removes the listeners', () => {
    const t = tip();
    const off = mountTooltips();
    off();
    t.setAttribute('data-tooltip-hidden', '');
    t.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
    expect(t.hasAttribute('data-tooltip-hidden')).toBe(true);
  });
});

describe('without a document', () => {
  it('mountTooltips and confirmDialog return their empty results', async () => {
    vi.stubGlobal('document', undefined);
    expect(mountTooltips()()).toBeUndefined();
    await expect(confirmDialog({ title: 'Sure?' } as Parameters<typeof confirmDialog>[0])).resolves.toBe(false);
  });

  it('openSheet returns a no-op closer', () => {
    vi.stubGlobal('document', undefined);
    expect(openSheet({} as HTMLDialogElement)()).toBeUndefined();
  });

  it('getThemeChoice and resolveTheme fall back without touching the document', () => {
    vi.stubGlobal('document', undefined);
    expect(getThemeChoice()).toBe('system');
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('mocha')).toBe('mocha');
  });

  it('the storage key is the default one without a document', () => {
    localStorage.setItem('nish-theme', 'light');
    root.setAttribute('data-nish-storage-key', 'custom');
    vi.stubGlobal('document', undefined);
    expect(getThemeChoice()).toBe('light');
  });

  it('onThemeChange subscribes without a window', () => {
    vi.stubGlobal('window', undefined);
    const fn = vi.fn();
    const off = onThemeChange(fn);
    expect(typeof off).toBe('function');
    off();
  });

  it('setThemeChoice writes no cookie without a location', () => {
    vi.stubGlobal('location', undefined);
    const set = vi.spyOn(document, 'cookie', 'set');
    setThemeChoice('mocha');
    expect(set).not.toHaveBeenCalled();
    expect(localStorage.getItem('nish-theme')).toBe('mocha');
  });
});
