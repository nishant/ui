import { afterEach, describe, expect, it } from 'vitest';
import './tabs';
import './switch';

afterEach(() => {
  document.body.innerHTML = '';
});

/** Parse markup detached, then attach it, so children exist when the elements connect. */
function mount(markup: string): void {
  const t = document.createElement('template');
  t.innerHTML = markup;
  document.body.append(t.content);
}

const tick = () => new Promise((r) => setTimeout(r, 20));

describe('nish-tabs ids', () => {
  it('gives tabs and panels with non-ASCII or colliding values unique ids', async () => {
    mount(`<nish-tabs id="t" label="x"><button>概要</button><button>設定</button><button value="a b">A</button><button value="a-b">B</button></nish-tabs>
      <div data-tabs="t" data-tab-panel="概要"></div><div data-tabs="t" data-tab-panel="設定"></div>`);
    await tick();
    const ids = Array.from(document.querySelectorAll('nish-tabs button')).map((b) => b.id);
    expect(new Set(ids).size).toBe(4);
    const panels = Array.from(document.querySelectorAll('[data-tab-panel]')).map((p) => p.id);
    expect(new Set(panels).size).toBe(2);
  });
});

describe('nish-switch name', () => {
  it('moves the host aria-label to the button', async () => {
    mount('<nish-switch aria-label="Alerts"></nish-switch>');
    await tick();
    expect(document.querySelector('nish-switch button')?.getAttribute('aria-label')).toBe('Alerts');
  });
});
