// @vitest-environment happy-dom
// Two separately loaded copies of the package on one page share their theme state, their toast
// list and their overlay stack. The copies are real: dist/esm is copied twice under
// node_modules/.nish-multicopy, so every module is a different file with its own module state
// (a query string on the entry would still share its imports). Skipped when dist is not built.
import { existsSync, cpSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { act, createElement as h } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { fireEvent } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const dist = resolve(root, 'dist/esm');
const work = resolve(root, 'node_modules/.nish-multicopy');
const built = existsSync(resolve(dist, 'index.js'));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Copy = typeof import('../../src/index');
let a: Copy;
let b: Copy;
let themeA: typeof import('../../src/theme');
let themeB: typeof import('../../src/theme');

const load = <T>(dir: string, file: string) => import(/* @vite-ignore */ pathToFileURL(resolve(work, dir, file)).href) as Promise<T>;

describe.skipIf(!built)('two copies of nish-ui on one page', () => {
  beforeAll(async () => {
    rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });
    cpSync(dist, resolve(work, 'a'), { recursive: true });
    cpSync(dist, resolve(work, 'b'), { recursive: true });
    [a, b, themeA, themeB] = await Promise.all([
      load<Copy>('a', 'index.js'),
      load<Copy>('b', 'index.js'),
      load<typeof import('../../src/theme')>('a', 'theme.js'),
      load<typeof import('../../src/theme')>('b', 'theme.js'),
    ]);
  });
  afterAll(() => rmSync(work, { recursive: true, force: true }));

  it('loads two distinct module instances', () => {
    expect(a).not.toBe(b);
    expect(a.Button).not.toBe(b.Button);
    expect(a.VERSION).toBe(b.VERSION);
  });

  it('keeps one shared record on the page', async () => {
    // The slots are created on first use, so use one of each first.
    await act(async () => void a.toast('seed'));
    const el = document.createElement('div');
    document.body.append(el);
    const r = createRoot(el);
    await act(async () => r.render(h(b.Modal, { open: true, onClose: () => {}, title: 'Seed', children: 'x' })));
    await act(async () => r.render(null));
    await act(async () => void r.unmount());
    const rt = (globalThis as Record<symbol, { slots: Record<string, unknown>; versions: Set<string> } | undefined>)[
      Symbol.for('nish-ui.runtime.v1')
    ];
    expect(rt).toBeDefined();
    expect(rt!.versions.size).toBe(1);
    expect(Object.keys(rt!.slots)).toEqual(expect.arrayContaining(['overlay', 'toast']));
  });

  it('shows a toast raised by one copy in the Toaster of the other', async () => {
    const el = document.createElement('div');
    document.body.append(el);
    const r = createRoot(el);
    await act(async () => r.render(h(a.Toaster)));
    await act(async () => void b.toast('from copy b'));
    expect(document.body.textContent).toContain('from copy b');
    await act(async () => void r.unmount());
  });

  it('lets one copy follow theme changes made by the other, and by the /theme entry', async () => {
    const seen: string[] = [];
    function Probe() {
      const t = b.useTheme();
      seen.push(t.choice);
      return h('output', { 'data-testid': 'theme' }, t.choice);
    }
    const el = document.createElement('div');
    document.body.append(el);
    const r = createRoot(el);
    await act(async () => r.render(h(Probe)));
    await act(async () => void themeA.setThemeChoice('light'));
    expect(el.textContent).toBe('light');
    await act(async () => void themeB.setThemeChoice('dark'));
    expect(el.textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await act(async () => void r.unmount());
  });

  it('stacks overlays across copies so Escape closes only the top one', async () => {
    const closed: string[] = [];
    const el = document.createElement('div');
    document.body.append(el);
    const r: Root = createRoot(el);
    await act(async () =>
      r.render(
        h(
          'div',
          null,
          h(a.Modal, { open: true, onClose: () => closed.push('a'), title: 'Copy A', children: 'first' }),
          h(b.Modal, { open: true, onClose: () => closed.push('b'), title: 'Copy B', children: 'second' }),
        ),
      ),
    );
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    // A modal answers Escape by playing its exit animation, then calls onClose.
    await act(async () => void (await new Promise((done) => setTimeout(done, 400))));
    expect(closed).toEqual(['b']);
    await act(async () => r.render(null));
    await act(async () => void r.unmount());
  });

  it('sends the headers set by configureApi in one copy from apiFetch in the other', async () => {
    const seen: Array<Headers> = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      seen.push(new Headers((init as RequestInit | undefined)?.headers));
      return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
    });
    try {
      a.configureApi({ headers: () => ({ authorization: 'Bearer from-a' }) });
      await b.apiFetch('/thing');
      expect(seen[0]?.get('authorization')).toBe('Bearer from-a');
    } finally {
      a.configureApi({ headers: undefined });
      fetchSpy.mockRestore();
    }
  });

  it('warns once when two different versions are loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rt = (globalThis as Record<symbol, { versions: Set<string>; warned?: boolean }>)[Symbol.for('nish-ui.runtime.v1')]!;
    rt.versions.add('0.0.0-other');
    rt.warned = false;
    // A third copy registers on import and sees two versions in the record.
    cpSync(dist, resolve(work, 'c'), { recursive: true });
    await load('c', 'runtime.js').then((m) => (m as { shared: (k: string, f: () => number) => number }).shared('probe', () => 1));
    const messages = warn.mock.calls.map((c) => String(c[0]));
    warn.mockRestore();
    rt.versions.delete('0.0.0-other');
    expect(messages.filter((m) => m.includes('two versions are loaded')).length).toBe(1);
  });
});
