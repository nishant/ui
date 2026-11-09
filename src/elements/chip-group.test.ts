import { afterEach, describe, expect, it } from 'vitest';
import './index';
import './forms';

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
afterEach(() => document.body.replaceChildren());

describe('<nish-chip-group> removal', () => {
  it('moves focus to the next chip control instead of dropping it to <body>', async () => {
    document.body.insertAdjacentHTML('beforeend',
      '<nish-chip-group><span class="nish-chip" data-removable>A</span><span class="nish-chip" data-removable>B</span></nish-chip-group>');
    await tick();
    await tick();
    const removes = document.querySelectorAll<HTMLElement>('[data-nish-remove]');
    removes[0].focus();
    removes[0].click();
    expect(document.activeElement).toBe(document.querySelector('[data-nish-remove]'));
    expect(document.activeElement).not.toBe(document.body);
  });
});
