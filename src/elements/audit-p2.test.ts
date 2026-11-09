import { afterEach, describe, expect, it } from 'vitest';
import './sparkline';

afterEach(() => {
  document.body.innerHTML = '';
});

const tick = () => new Promise((r) => setTimeout(r, 20));

describe('nish-sparkline values', () => {
  it('does not throw when values is set to null', async () => {
    const el = document.createElement('nish-sparkline') as HTMLElement & { values: unknown };
    document.body.append(el);
    await tick();
    el.values = [1, 2, 3];
    await tick();
    el.values = null;
    await tick();
    expect(el.isConnected).toBe(true);
    expect(el.hasAttribute('values')).toBe(false);
  });
});
