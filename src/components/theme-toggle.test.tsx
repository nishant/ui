import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChartTheme } from '../chart';
import { setThemeChoice } from '../theme';
import { NishProvider } from './provider';
import { ThemeToggle, useTheme } from './theme-toggle';

const root = document.documentElement;

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const a of ['data-theme', 'data-scheme', 'data-theme-choice', 'data-nish-themes', 'data-nish-storage-key']) root.removeAttribute(a);
  root.style.colorScheme = '';
  localStorage.clear();
  document.head.innerHTML = '';
});

describe('useTheme', () => {
  it('reads the saved choice and what it renders as', () => {
    localStorage.setItem('nish-theme', 'mocha');
    const { result } = renderHook(() => useTheme());
    expect(result.current.choice).toBe('mocha');
    expect(result.current.theme).toBe('mocha');
    expect(result.current.scheme).toBe('dark');
  });

  it('follows setChoice and changes made elsewhere', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.choice).toBe('system');
    act(() => result.current.setChoice('light'));
    expect(result.current).toMatchObject({ choice: 'light', theme: 'light', scheme: 'light' });
    act(() => {
      setThemeChoice('ocean');
    });
    expect(result.current).toMatchObject({ choice: 'ocean', theme: 'ocean', scheme: 'dark' });
  });

  it('returns the same state object while nothing changes (no render loop)', () => {
    let renders = 0;
    const { result, rerender } = renderHook(() => {
      renders += 1;
      return useTheme();
    });
    const first = result.current;
    rerender();
    expect(result.current.choice).toBe(first.choice);
    expect(renders).toBeLessThan(5);
  });

  it('re-applies the stored theme on mount when <html data-theme> was wiped', () => {
    localStorage.setItem('nish-theme', 'light');
    expect(root.hasAttribute('data-theme')).toBe(false);
    renderHook(() => useTheme());
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('leaves an existing data-theme alone on mount', () => {
    root.setAttribute('data-theme', 'ocean');
    root.setAttribute('data-theme-choice', 'ocean');
    localStorage.setItem('nish-theme', 'light');
    renderHook(() => useTheme());
    expect(root.getAttribute('data-theme')).toBe('ocean');
  });

  it('uses a custom storage key', () => {
    root.setAttribute('data-nish-storage-key', 'app-theme');
    localStorage.setItem('app-theme', 'light');
    const { result } = renderHook(() => useTheme());
    expect(result.current.choice).toBe('light');
  });
});

describe('ThemeToggle', () => {
  it('renders three radios named from the default strings', () => {
    render(<ThemeToggle collapse="never" />);
    const group = screen.getByRole('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Theme');
    expect(screen.getByRole('radio', { name: 'System' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeTruthy();
  });

  it('marks the saved choice and changes it on click', () => {
    localStorage.setItem('nish-theme', 'dark');
    render(<ThemeToggle collapse="never" />);
    expect(screen.getByRole('radio', { name: 'Dark' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(localStorage.getItem('nish-theme')).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('radio', { name: 'Light' }).getAttribute('aria-checked')).toBe('true');
  });

  it('shows the words with labels', () => {
    render(<ThemeToggle collapse="never" labels />);
    expect(screen.getByRole('radio', { name: 'Light' }).textContent).toBe('Light');
  });

  it('takes every word from a NishProvider', () => {
    render(
      <NishProvider
        strings={{
          theme: 'Tema',
          themeSystem: 'Sistema',
          themeLight: 'Claro',
          themeDark: 'Oscuro',
          themePreset: 'Ajuste de tema',
          themePresetPlaceholder: 'Ajuste…',
          themeToggleLabel: (c, n) => `Tema: ${c}. Cambiar a ${n}`,
        }}
      >
        <ThemeToggle collapse="never" presets />
        <ThemeToggle compact />
      </NishProvider>,
    );
    expect(screen.getByRole('radiogroup').getAttribute('aria-label')).toBe('Tema');
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeTruthy();
    const preset = screen.getByLabelText('Ajuste de tema') as HTMLSelectElement;
    expect(preset.options[0]!.textContent).toBe('Ajuste…');
    expect(screen.getByRole('button', { name: 'Tema: Sistema. Cambiar a Claro' })).toBeTruthy();
  });

  it('lists the presets and picks one', () => {
    render(<ThemeToggle collapse="never" presets />);
    const select = screen.getByLabelText('Theme preset') as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toEqual(['', 'slate', 'terminal', 'mocha', 'ocean', 'contrast']);
    expect(select.options[0]!.textContent).toBe('Preset…');
    expect(select.value).toBe('');
    fireEvent.change(select, { target: { value: 'ocean' } });
    expect(localStorage.getItem('nish-theme')).toBe('ocean');
    expect(select.value).toBe('ocean');
  });

  it('has no preset select unless asked', () => {
    render(<ThemeToggle collapse="never" />);
    expect(screen.queryByLabelText('Theme preset')).toBeNull();
  });

  it('compact cycles system, light, dark, system with a descriptive label', () => {
    render(<ThemeToggle compact />);
    const btn = () => screen.getByRole('button');
    expect(btn().getAttribute('aria-label')).toBe('Theme: System. Switch to Light');
    expect(btn().getAttribute('data-choice')).toBe('system');
    fireEvent.click(btn());
    expect(btn().getAttribute('aria-label')).toBe('Theme: Light. Switch to Dark');
    fireEvent.click(btn());
    expect(btn().getAttribute('aria-label')).toBe('Theme: Dark. Switch to System');
    fireEvent.click(btn());
    expect(localStorage.getItem('nish-theme')).toBe('system');
  });

  it('says "set on another site" for a preset, and elsewhereLabel renames it', () => {
    localStorage.setItem('nish-theme', 'mocha');
    const { unmount } = render(<ThemeToggle compact />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Theme: Mocha (set on another site). Switch to System');
    unmount();
    render(<ThemeToggle compact elsewhereLabel="otro sitio" />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Theme: Mocha (otro sitio). Switch to System');
  });

  it('pill is a 44px cycling button; labels add the word', () => {
    const { unmount } = render(<ThemeToggle variant="pill" />);
    const pill = screen.getByRole('button');
    expect(pill.className).toContain('h-11');
    expect(pill.className).toContain('w-11');
    expect(pill.getAttribute('title')).toBe(pill.getAttribute('aria-label'));
    fireEvent.click(pill);
    expect(localStorage.getItem('nish-theme')).toBe('light');
    unmount();
    render(<ThemeToggle variant="pill" labels />);
    expect(screen.getByRole('button').textContent).toBe('Light');
    expect(screen.getByRole('button').className).not.toContain('w-11');
    expect(screen.getByRole('button').className).toContain('ps-3');
  });

  it('by default renders the phone button next to the group', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button').className).toContain('sm:hidden');
    expect(screen.getByRole('radiogroup').parentElement!.className).toContain('max-sm:hidden');
  });

  it('phone="segmented", collapse="never" and block render only the group', () => {
    for (const props of [{ phone: 'segmented' as const }, { collapse: 'never' as const }, { block: true }]) {
      const { container, unmount } = render(<ThemeToggle {...props} />);
      expect(container.querySelectorAll('button[data-choice]')).toHaveLength(0);
      expect(container.querySelector('.max-sm\\:hidden')).toBeNull();
      expect(screen.getByRole('radiogroup')).toBeTruthy();
      unmount();
    }
  });

  it('block fills the width', () => {
    const { container } = render(<ThemeToggle block />);
    expect((container.firstElementChild as HTMLElement).className).toContain('w-full');
  });

  it('merges className on the root of every variant', () => {
    const { container, unmount } = render(<ThemeToggle collapse="never" className="mine" />);
    expect((container.firstElementChild as HTMLElement).className).toContain('mine');
    unmount();
    render(<ThemeToggle variant="pill" className="mine" />);
    expect(screen.getByRole('button').className).toContain('mine');
  });

  it('passes id, data-* and aria-* to the root and the ref to the root element', () => {
    const ref = createRef<HTMLElement>();
    const { container, unmount } = render(<ThemeToggle collapse="never" ref={ref} id="t1" data-x="y" aria-describedby="d" />);
    const group = container.firstElementChild as HTMLElement;
    expect(group.id).toBe('t1');
    expect(group.getAttribute('data-x')).toBe('y');
    expect(group.getAttribute('aria-describedby')).toBe('d');
    expect(ref.current).toBe(group);
    unmount();
    const ref2 = createRef<HTMLElement>();
    render(<ThemeToggle compact ref={ref2} id="t2" data-x="z" />);
    expect(ref2.current).toBe(screen.getByRole('button'));
    expect(ref2.current!.id).toBe('t2');
    expect(ref2.current!.getAttribute('data-x')).toBe('z');
  });

  it('does not put a duplicate id on the phone twin', () => {
    const { container } = render(<ThemeToggle id="only" />);
    expect(container.querySelectorAll('#only')).toHaveLength(1);
  });

  it('md size grows the segments', () => {
    render(<ThemeToggle collapse="never" size="md" />);
    expect(screen.getByRole('radiogroup').className).toContain('[&>button]:w-8');
  });
});

describe('server rendering and hydration', () => {
  it('renders on the server with the system choice, whatever is saved', () => {
    // renderToString has no access to a stored theme; it must not touch it either.
    const html = renderToString(<ThemeToggle collapse="never" />);
    expect(html).toContain('System');
    expect(html).toMatch(/aria-checked="true"[^>]*>.*?<\/button>/s);
  });

  it('server and the toggle in compact mode agree on the label', () => {
    const html = renderToString(<ThemeToggle compact />);
    expect(html).toContain('Theme: System. Switch to Light');
  });

  it('hydrates with a stored theme and reports no recoverable error', async () => {
    const server = renderToString(<ThemeToggle collapse="never" labels presets />);
    // The browser has a stored choice that the server could not know.
    localStorage.setItem('nish-theme', 'mocha');
    root.setAttribute('data-theme', 'mocha');
    root.setAttribute('data-theme-choice', 'mocha');
    const container = document.createElement('div');
    container.innerHTML = server;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    let hydrated: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      hydrated = hydrateRoot(container, <ThemeToggle collapse="never" labels presets />, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    // After hydration the real choice shows: a preset selects itself in the select.
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('mocha');
    act(() => hydrated!.unmount());
    container.remove();
  });

  it('hydrates a stored light theme in a hook consumer without warnings', async () => {
    function Probe() {
      const { theme } = useTheme();
      return <p data-testid="probe">{theme}</p>;
    }
    const server = renderToString(<Probe />);
    expect(server).toContain('dark');
    localStorage.setItem('nish-theme', 'light');
    const container = document.createElement('div');
    container.innerHTML = server;
    document.body.append(container);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recoverable = vi.fn();
    let hydrated: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      hydrated = hydrateRoot(container, <Probe />, { onRecoverableError: recoverable });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    expect(container.textContent).toBe('light');
    act(() => hydrated!.unmount());
    container.remove();
  });
});

describe('useChartTheme', () => {
  it('starts empty (server-safe), then reads the tokens, and follows a theme change', () => {
    root.style.setProperty('--nish-grid-probe', 'x');
    root.style.setProperty('--nish-line', '#111111');
    root.style.setProperty('--nish-chart-1', '#aa0000');
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.grid).toBe('#111111');
    expect(result.current.series[0]).toBe('#aa0000');
    expect(result.current.series).toHaveLength(8);
    root.style.setProperty('--nish-line', '#222222');
    act(() => {
      setThemeChoice('light');
    });
    expect(result.current.grid).toBe('#222222');
    root.style.removeProperty('--nish-line');
    root.style.removeProperty('--nish-chart-1');
    root.style.removeProperty('--nish-grid-probe');
  });

  it('renders on the server with empty colors', () => {
    let seen: ReturnType<typeof useChartTheme> | undefined;
    function Probe() {
      seen = useChartTheme();
      return null;
    }
    renderToString(<Probe />);
    expect(seen!.grid).toBe('');
    expect(seen!.series).toEqual([]);
  });

  it('shares theme changes made through another copy of the theme module', async () => {
    vi.resetModules();
    const other = await import('../theme');
    const { result } = renderHook(() => useChartTheme());
    root.style.setProperty('--nish-bg', '#abcdef');
    act(() => {
      other.setThemeChoice('mocha');
    });
    expect(result.current.bg).toBe('#abcdef');
    root.style.removeProperty('--nish-bg');
  });
});
