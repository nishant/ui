import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NavItem } from './nav';

// AppShell loads the More sheet through import('./more-sheet'). Each test gets a fresh module registry (the lazy module caches
// its result) and a controllable import: `release()` lets a deferred import resolve, `failNext` makes it reject.
const icon = createElement('svg', { 'aria-hidden': 'true' });
const item = (key: string, label: string, active = false): NavItem => ({ key, label, icon, href: `/${key}`, active });
const SIX = [item('home', 'Home', true), item('jobs', 'Jobs'), item('saved', 'Saved'), item('alerts', 'Alerts'), item('reports', 'Reports'), item('settings', 'Settings')];

let failNext = false;
let gate: Promise<void> = Promise.resolve();
let release: () => void = () => {};

async function setup() {
  vi.resetModules();
  vi.doMock('./more-sheet', async () => {
    await gate;
    if (failNext) {
      failNext = false;
      throw new Error('chunk failed');
    }
    return await vi.importActual<typeof import('./more-sheet')>('./more-sheet');
  });
  const { AppShell } = await import('./app-shell');
  render(<AppShell name="S" nav={SIX}>x</AppShell>);
}

const moreButton = () => screen.getAllByRole('button', { name: /more/i, hidden: true }).find((b) => b.hasAttribute('aria-expanded')) as HTMLElement;

beforeEach(() => {
  failNext = false;
  gate = Promise.resolve();
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  vi.doUnmock('./more-sheet');
  vi.restoreAllMocks();
});

describe('AppShell: lazy More sheet', () => {
  it('starts the import on the first tap and opens the dialog once it resolves', async () => {
    await setup();
    fireEvent.click(moreButton());
    expect(await screen.findByRole('dialog', { name: 'More' })).toBeTruthy();
    expect(moreButton().getAttribute('aria-expanded')).toBe('true');
  });

  it('closes again when the chunk fails and opens on the next tap', async () => {
    failNext = true;
    await setup();
    fireEvent.click(moreButton());
    await waitFor(() => expect(moreButton().getAttribute('aria-expanded')).toBe('false'));
    expect(screen.queryByRole('dialog', { name: 'More' })).toBeNull();
    fireEvent.click(moreButton());
    expect(await screen.findByRole('dialog', { name: 'More' })).toBeTruthy();
    expect(moreButton().getAttribute('aria-expanded')).toBe('true');
  });

  it('two quick taps before the chunk resolves leave the sheet closed', async () => {
    gate = new Promise<void>((r) => {
      release = r;
    });
    await setup();
    fireEvent.click(moreButton());
    fireEvent.click(moreButton());
    await act(async () => {
      release();
      await gate;
    });
    await waitFor(() => expect(moreButton().getAttribute('aria-expanded')).toBe('false'));
    expect(screen.queryByRole('dialog', { name: 'More' })).toBeNull();
  });
});
