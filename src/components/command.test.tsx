import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette, navigateFromLayer, useCommandHotkey, type CommandItem } from './command';
import { NishProvider } from './provider';

const ITEMS: CommandItem[] = [
  { id: 'trips', label: 'Trips', group: 'Pages', hint: 'g t', keywords: ['travel', 'flights'] },
  { id: 'settings', label: 'Settings', group: 'Pages' },
  { id: 'logout', label: 'Log out', onSelect: vi.fn() },
  { id: 'docs', label: 'Documentation', group: 'Links', href: 'https://docs.example.com', external: true },
];

let assign: ReturnType<typeof vi.fn>;
let open: ReturnType<typeof vi.fn>;

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  assign = vi.fn();
  open = vi.fn();
  vi.stubGlobal('open', open);
  vi.stubGlobal('location', { ...window.location, assign });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function openPalette(props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const onOpenChange = vi.fn();
  const utils = render(<CommandPalette open onOpenChange={onOpenChange} items={ITEMS} {...props} />);
  const input = (await screen.findByRole('combobox')) as HTMLInputElement;
  return { ...utils, onOpenChange, input };
}

const options = () => screen.getAllByRole('option');
const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

describe('CommandPalette rendering', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onOpenChange={() => {}} items={ITEMS} />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('is a combobox over a listbox of options, grouped, with ungrouped rows first', async () => {
    const { input } = await openPalette();
    const list = screen.getByRole('listbox', { name: 'Results' });
    expect(input.getAttribute('aria-controls')).toBe(list.id);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(options().map((o) => o.textContent)).toEqual(['Log out', 'Trips' + 'g t', 'Settings', 'Documentation↗']);
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(3);
    expect(groups[0].hasAttribute('aria-labelledby')).toBe(false);
    expect(groups[1].getAttribute('aria-labelledby')).not.toBeNull();
    expect(screen.getByText('Pages').id).toBe(groups[1].getAttribute('aria-labelledby'));
  });

  it('the input has an accessible name from the placeholder, focused on open', async () => {
    const { input } = await openPalette({ placeholder: 'Find a page…' });
    expect(input.getAttribute('aria-label')).toBe('Find a page');
    expect(input.placeholder).toBe('Find a page…');
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('defaults come from the provider strings; props win', async () => {
    const strings = { searchPlaceholder: 'Chercher…', noResults: 'Rien', search: 'Recherche', results: 'Resultats', close: 'Fermer' };
    const { input } = await openPalette({}).then(async (r) => {
      r.unmount();
      render(
        <NishProvider strings={strings}>
          <CommandPalette open onOpenChange={() => {}} items={ITEMS} />
        </NishProvider>,
      );
      return { input: (await screen.findByRole('combobox')) as HTMLInputElement };
    });
    expect(input.placeholder).toBe('Chercher…');
    expect(screen.getByRole('listbox', { name: 'Resultats' })).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Recherche' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Fermer' }).some((b) => b.tagName === 'BUTTON')).toBe(true);
    type(input, 'zzzz');
    expect(screen.getByText('Rien')).toBeTruthy();
  });

  it('the external mark is a named image with the default or given label', async () => {
    await openPalette();
    expect(screen.getByRole('img', { name: 'opens in a new tab' }).textContent).toBe('↗');
    cleanup();
    await openPalette({ externalLabel: 'ouvre un nouvel onglet' });
    expect(screen.getByRole('img', { name: 'ouvre un nouvel onglet' })).toBeTruthy();
  });

  it('shows hints and icons, and the footer', async () => {
    await openPalette({ footer: <p>Press enter</p>, items: [{ id: 'i', label: 'Icon row', icon: <svg data-testid="ic" />, hint: 'H' }] });
    expect(screen.getByTestId('ic')).toBeTruthy();
    expect(screen.getByText('H')).toBeTruthy();
    expect(screen.getByText('Press enter')).toBeTruthy();
  });

  it('the first row is active; aria-activedescendant points at it', async () => {
    const { input } = await openPalette();
    const first = options()[0];
    expect(first.getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
    expect(options()[1].getAttribute('aria-selected')).toBe('false');
  });

  it('announces the result count in a polite live region', async () => {
    await openPalette();
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe('4 results');
    cleanup();
    await openPalette({ items: [ITEMS[0]] });
    expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe('1 result');
    cleanup();
    await openPalette({ resultsLabel: (n) => `${n} resultats` });
    expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe('4 resultats');
  });
});

describe('CommandPalette filtering', () => {
  it('filters by label prefix, word start, substring and subsequence, best match first', async () => {
    const items: CommandItem[] = [
      { id: 'sub', label: 'My settings' },
      { id: 'pre', label: 'Settings' },
      { id: 'word', label: 'Open settings' },
      { id: 'seq', label: 'Sorting engine tools' },
      { id: 'no', label: 'Zebra' },
    ];
    const { input } = await openPalette({ items });
    type(input, 'set');
    // prefix (Settings), word start (My settings, Open settings), then the subsequence row.
    expect(options().map((o) => o.textContent)).toEqual(['Settings', 'My settings', 'Open settings', 'Sorting engine tools']);
    type(input, 'zeb');
    expect(options().map((o) => o.textContent)).toEqual(['Zebra']);
  });

  it('a substring that is not at a word start ranks below a word start', async () => {
    const items: CommandItem[] = [{ id: 'a', label: 'xset' }, { id: 'b', label: 'a set' }];
    const { input } = await openPalette({ items });
    type(input, 'set');
    expect(options().map((o) => o.textContent)).toEqual(['a set', 'xset']);
  });

  it('highlights the matched characters', async () => {
    const { input } = await openPalette({ items: [{ id: 'a', label: 'Settings' }] });
    type(input, 'set');
    const mark = document.querySelector('mark')!;
    expect(mark.textContent).toBe('Set');
  });

  it('matches keywords below labels, but only by prefix, word start or substring', async () => {
    const { input } = await openPalette();
    type(input, 'travel');
    expect(options().map((o) => o.textContent)).toEqual(['Trips' + 'g t']);
    expect(document.querySelector('mark')).toBeNull();
    type(input, 'tvl');
    // A loose subsequence over a keyword does not match; "Trips" label has no t-v-l either.
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('keywords are matched case-insensitively (lowercased once)', async () => {
    const { input } = await openPalette({ items: [{ id: 'a', label: 'Alpha', keywords: ['TRAVEL Plans'] }] });
    type(input, 'PLANS');
    expect(options()).toHaveLength(1);
  });

  it('a label match beats a keyword match', async () => {
    const items: CommandItem[] = [
      { id: 'kw', label: 'Alpha', keywords: ['beta'] },
      { id: 'lb', label: 'Beta' },
    ];
    const { input } = await openPalette({ items });
    type(input, 'beta');
    expect(options().map((o) => o.textContent)).toEqual(['Beta', 'Alpha']);
  });

  it('shows at most 50 rows', async () => {
    const items = Array.from({ length: 80 }, (_, i): CommandItem => ({ id: String(i), label: `Item ${i}` }));
    const { input } = await openPalette({ items });
    expect(options()).toHaveLength(50);
    type(input, 'item');
    expect(options()).toHaveLength(50);
  });

  it('a whitespace-only query shows everything', async () => {
    const { input } = await openPalette();
    type(input, '   ');
    expect(options()).toHaveLength(4);
  });

  it('calls onQuery on every keystroke', async () => {
    const onQuery = vi.fn();
    const { input } = await openPalette({ onQuery });
    type(input, 'a');
    type(input, 'ab');
    expect(onQuery.mock.calls.map((c) => c[0])).toEqual(['a', 'ab']);
  });

  it('the empty message is a status outside the listbox', async () => {
    const { input } = await openPalette({ emptyText: 'Nothing found' });
    type(input, 'qqqq');
    const empty = screen.getByText('Nothing found');
    expect(empty.getAttribute('role')).toBe('status');
    expect(screen.getByRole('listbox').contains(empty)).toBe(false);
    expect(screen.getByRole('listbox').children).toHaveLength(0);
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
    expect(input.getAttribute('enterkeyhint')).toBe('search');
    expect(document.querySelector('[aria-live="polite"]')!.textContent).toBe('');
  });

  it('a lone empty message disappears when rows come back', async () => {
    const { input } = await openPalette();
    type(input, 'qqqq');
    expect(screen.getByText('No results')).toBeTruthy();
    type(input, '');
    expect(screen.queryByText('No results')).toBeNull();
    expect(input.getAttribute('enterkeyhint')).toBe('go');
  });
});

describe('CommandPalette keyboard and select', () => {
  it('ArrowDown and ArrowUp move the active row and wrap', async () => {
    const { input } = await openPalette();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options()[3].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('arrow keys are prevented; Home resets only with an empty query', async () => {
    const { input } = await openPalette();
    expect(fireEvent.keyDown(input, { key: 'ArrowDown' })).toBe(false);
    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(fireEvent.keyDown(input, { key: 'Home' })).toBe(false);
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
    type(input, 's');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(fireEvent.keyDown(input, { key: 'Home' })).toBe(true);
  });

  it('typing resets the active row to the first', async () => {
    const { input } = await openPalette();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    type(input, 't');
    expect(options()[0].getAttribute('aria-selected')).toBe('true');
  });

  it('hovering a row makes it active', async () => {
    await openPalette();
    fireEvent.mouseMove(options()[2]);
    expect(options()[2].getAttribute('aria-selected')).toBe('true');
  });

  it('Enter runs onSelect of the active row and closes', async () => {
    const onSelect = vi.fn();
    const { input, onOpenChange } = await openPalette({ items: [{ id: 'x', label: 'Run it', onSelect }] });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clicking a row selects it', async () => {
    const onSelect = vi.fn();
    const { onOpenChange } = await openPalette({ items: [{ id: 'x', label: 'Click me', onSelect }] });
    fireEvent.click(screen.getByRole('option', { name: 'Click me' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('an external href opens a new tab with noopener,noreferrer', async () => {
    const { input } = await openPalette({ items: [{ id: 'd', label: 'Docs', href: 'https://docs.example.com/x', external: true }] });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(open).toHaveBeenCalledWith('https://docs.example.com/x', '_blank', 'noopener,noreferrer');
    expect(assign).not.toHaveBeenCalled();
  });

  it('an internal href navigates; href wins over onSelect', async () => {
    const onSelect = vi.fn();
    const { input } = await openPalette({ items: [{ id: 'd', label: 'Docs', href: '/trips?x=1', onSelect }] });
    fireEvent.keyDown(input, { key: 'Enter' });
    // The closing layer drops its history entry first, so the navigation follows a tick later.
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/trips?x=1'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('Enter with no rows and a query calls onSubmitQuery with the trimmed query and closes', async () => {
    const onSubmitQuery = vi.fn();
    const { input, onOpenChange } = await openPalette({ onSubmitQuery });
    type(input, '  weather in paris ');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmitQuery).toHaveBeenCalledWith('weather in paris');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('Enter with no rows and no query does nothing', async () => {
    const onSubmitQuery = vi.fn();
    const { input, onOpenChange } = await openPalette({ onSubmitQuery, items: [] });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmitQuery).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('keys during IME composition are ignored', async () => {
    const onSelect = vi.fn();
    const { input } = await openPalette({ items: [{ id: 'x', label: 'Run it', onSelect }] });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('the Close button closes', async () => {
    const { onOpenChange } = await openPalette();
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).find((b) => b.tagName === 'BUTTON')!);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('CommandPalette safeUrl', () => {
  it.each(['javascript:alert(1)', '  JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:x', 'file:///etc/passwd'])(
    'an unsafe href %j neither navigates nor opens a window, and closes',
    async (href) => {
      for (const external of [false, true]) {
        const onSelect = vi.fn();
        const { input, onOpenChange, unmount } = await openPalette({ items: [{ id: 'bad', label: 'Bad', href, external, onSelect }] });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(assign).not.toHaveBeenCalled();
        expect(open).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
        unmount();
      }
    },
  );

  it('warns in development about an unsafe href', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { input } = await openPalette({ items: [{ id: 'bad', label: 'Bad', href: 'javascript:alert(1)' }] });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(String((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain('unsafe href');
    vi.unstubAllEnvs();
  });

  it('does not warn in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { input } = await openPalette({ items: [{ id: 'bad', label: 'Bad', href: 'javascript:alert(1)' }] });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(console.warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it.each(['/a?b#c', '#top', 'mailto:a@b.c', 'tel:+15551234', 'https://x.example', '//cdn.example.com/x', 'relative/path'])(
    'a safe href %j navigates',
    async (href) => {
      const { input } = await openPalette({ items: [{ id: 'ok', label: 'Ok', href }] });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => expect(assign).toHaveBeenCalledWith(href));
    },
  );

  it('navigateFromLayer ignores an unsafe href and passes a safe one to location.assign', () => {
    navigateFromLayer('javascript:alert(1)');
    expect(assign).not.toHaveBeenCalled();
    navigateFromLayer('/ok');
    expect(assign).toHaveBeenCalledWith('/ok');
  });

  it('navigateFromLayer inside a history layer waits one tick, then navigates (or at the 400ms net)', () => {
    vi.useFakeTimers();
    history.replaceState({ nishLayer: 'x' }, '');
    navigateFromLayer('/later');
    expect(assign).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/later');
    history.replaceState(null, '');
  });
});

describe('CommandPalette dynamic items', () => {
  it('a function of the query shows its results in the order returned', async () => {
    const fn = vi.fn((q: string): CommandItem[] => [
      { id: 'b', label: `B ${q}` },
      { id: 'a', label: `A ${q}` },
    ]);
    const { input } = await openPalette({ items: fn });
    expect(options().map((o) => o.textContent)).toEqual(['B ', 'A ']);
    type(input, 'zz');
    await waitFor(() => expect(options().map((o) => o.textContent)).toEqual(['B zz', 'A zz']));
    expect(fn).toHaveBeenLastCalledWith('zz');
  });

  it('an async function marks the list busy, then shows rows; a stale response is dropped', async () => {
    const resolvers: Record<string, (r: CommandItem[]) => void> = {};
    const fn = (q: string) => new Promise<CommandItem[]>((res) => (resolvers[q] = res));
    const { input } = await openPalette({ items: fn });
    expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByText('No results')).toBeNull();
    type(input, 'x');
    await act(async () => {
      resolvers['x']([{ id: 'x1', label: 'X result' }]);
      resolvers['']([{ id: 'old', label: 'Old result' }]);
    });
    await waitFor(() => expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('false'));
    expect(options().map((o) => o.textContent)).toEqual(['X result']);
  });

  it('a rejecting or throwing function shows the empty state', async () => {
    const { input } = await openPalette({ items: () => Promise.reject(new Error('down')) });
    await waitFor(() => expect(screen.getByText('No results')).toBeTruthy());
    cleanup();
    await openPalette({
      items: () => {
        throw new Error('sync');
      },
    });
    expect(screen.getByText('No results')).toBeTruthy();
    void input;
  });

  it('highlights the query in dynamic rows', async () => {
    const { input } = await openPalette({ items: () => [{ id: 'a', label: 'Settings' }] });
    type(input, 'set');
    await waitFor(() => expect(document.querySelector('mark')?.textContent).toBe('Set'));
  });

  it('shows at most 50 dynamic rows', async () => {
    await openPalette({ items: () => Array.from({ length: 70 }, (_, i): CommandItem => ({ id: String(i), label: `r${i}` })) });
    expect(options()).toHaveLength(50);
  });

  it('Enter on an empty async result does not submit while pending', async () => {
    const onSubmitQuery = vi.fn();
    const { input } = await openPalette({ items: () => new Promise<CommandItem[]>(() => {}), onSubmitQuery });
    type(input, 'abc');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmitQuery).not.toHaveBeenCalled();
  });
});

describe('hotkeys', () => {
  function Harness({ hotkey }: { hotkey?: boolean }) {
    const [isOpen, setOpen] = useState(false);
    return (
      <>
        <input data-testid="field" />
        <CommandPalette open={isOpen} onOpenChange={setOpen} items={ITEMS} hotkey={hotkey} />
      </>
    );
  }

  it('Ctrl+K and Cmd+K open it', async () => {
    render(<Harness />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('combobox')).toBeTruthy();
    cleanup();
    render(<Harness />);
    fireEvent.keyDown(document, { key: 'K', metaKey: true });
    expect(await screen.findByRole('combobox')).toBeTruthy();
  });

  it('/ opens it unless focus is in a field', async () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByTestId('field'), { key: '/' });
    await act(async () => {});
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(await screen.findByRole('combobox')).toBeTruthy();
  });

  it('ignores Ctrl+Shift+K, Alt+K, composing and already-prevented keys', async () => {
    render(<Harness />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, shiftKey: true });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, altKey: true });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, isComposing: true });
    fireEvent.keyDown(document, { key: '/', ctrlKey: true });
    await act(async () => {});
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('hotkey={false} turns them off', async () => {
    render(<Harness hotkey={false} />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await act(async () => {});
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('useCommandHotkey calls the latest callback and stops when disabled or unmounted', () => {
    const first = vi.fn();
    const second = vi.fn();
    function Probe({ cb, enabled }: { cb: () => void; enabled?: boolean }) {
      useCommandHotkey(cb, enabled);
      return null;
    }
    const { rerender, unmount } = render(<Probe cb={first} />);
    rerender(<Probe cb={second} />);
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    rerender(<Probe cb={second} enabled={false} />);
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(second).toHaveBeenCalledTimes(1);
    rerender(<Probe cb={second} />);
    unmount();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not reopen when already open', async () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} items={ITEMS} />);
    await screen.findByRole('combobox');
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
