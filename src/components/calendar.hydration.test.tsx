import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calendarNullMonth } from '../../tests/ssr/cases';

describe('Calendar with no value and no month', () => {
  const actFlag = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const prevAct = actFlag.IS_REACT_ACT_ENVIRONMENT;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 5, 12));
  });
  afterEach(() => {
    actFlag.IS_REACT_ACT_ENVIRONMENT = prevAct;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('server-renders an empty grid, then hydrates without a mismatch and rings today', async () => {
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => void errors.push(a.map(String).join(' ')));
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    const html = renderToString(calendarNullMonth());
    expect(html).not.toContain('data-date');
    expect(html).not.toContain('aria-current="date"');
    expect(html).not.toContain('November');

    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(host, calendarNullMonth(), { onRecoverableError: (e) => errors.push(String(e)) });
    });

    expect(errors).toEqual([]);
    expect(host.textContent).toContain('November 2026');
    const today = host.querySelector('[aria-current="date"]');
    expect(today?.getAttribute('data-date')).toBe('2026-11-05');

    await act(async () => root.unmount());
    host.remove();
  });
});
