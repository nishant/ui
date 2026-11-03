import { afterEach, describe, expect, it, vi } from 'vitest';

const KEY = Symbol.for('nish-ui.runtime.v1');

afterEach(() => {
  delete (globalThis as unknown as Record<symbol, unknown>)[KEY];
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('runtime', () => {
  it('VERSION is dev in source', async () => {
    const m = await import('./runtime');
    expect(m.VERSION).toBe('dev');
  });

  it('runs init once per key and returns the same object', async () => {
    const { shared } = await import('./runtime');
    const init = vi.fn(() => ({ n: 1 }));
    const a = shared('k', init);
    const b = shared('k', init);
    expect(a).toBe(b);
    expect(init).toHaveBeenCalledTimes(1);
    expect(shared('other', () => ({ n: 2 }))).not.toBe(a);
  });

  it('two module copies share one record', async () => {
    const one = await import('./runtime');
    const a = one.shared('theme', () => ({ id: 'a' }));
    vi.resetModules();
    const two = await import('./runtime');
    expect(two).not.toBe(one);
    const b = two.shared('theme', () => ({ id: 'b' }));
    expect(b).toBe(a);
    expect(b.id).toBe('a');
  });

  it('keeps state under the well-known global symbol', async () => {
    const { shared } = await import('./runtime');
    shared('x', () => 5);
    const rt = (globalThis as unknown as Record<symbol, { versions: Set<string>; slots: Record<string, unknown> }>)[KEY]!;
    expect(rt.slots.x).toBe(5);
    expect([...rt.versions]).toEqual(['dev']);
  });

  it('warns once when a different version shares the page', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const one = await import('./runtime');
    one.__setVersionForTest('1.9.0');
    expect(warn).not.toHaveBeenCalled();
    vi.resetModules();
    const two = await import('./runtime');
    two.__setVersionForTest('2.0.0');
    two.shared('a', () => 1);
    two.shared('b', () => 2);
    one.shared('c', () => 3);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('two versions are loaded on this page (1.9.0, 2.0.0)');
  });

  it('does not warn when the versions match', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const one = await import('./runtime');
    one.__setVersionForTest('2.0.0');
    vi.resetModules();
    const two = await import('./runtime');
    two.__setVersionForTest('2.0.0');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn in production', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    const one = await import('./runtime');
    one.__setVersionForTest('1.0.0');
    vi.resetModules();
    const two = await import('./runtime');
    two.__setVersionForTest('2.0.0');
    expect(warn).not.toHaveBeenCalled();
  });
});
