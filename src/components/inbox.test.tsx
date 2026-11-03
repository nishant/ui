import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InboxItem, InboxView } from '../inbox-types';
import { Inbox, SNOOZE_OPTIONS, type InboxProps } from './inbox';
import { NishProvider } from './provider';

function stubWidth(width: number) {
  vi.stubGlobal('matchMedia', (query: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(query);
    const min = /min-width:\s*([\d.]+)px/.exec(query);
    const matches = (max ? width <= Number(max[1]) : true) && (min ? width >= Number(min[1]) : true);
    return { matches, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} };
  });
}

const NOW = '2026-11-03T12:00:00.000Z';

function item(o: Partial<InboxItem> & { id: number }): InboxItem {
  return {
    source: 'ci',
    kind: 'run-failed',
    title: `Item ${o.id}`,
    body: null,
    url: null,
    severity: 'normal',
    count: 1,
    createdAt: NOW,
    updatedAt: NOW,
    occurredAt: NOW,
    handledAt: null,
    handledBy: null,
    snoozedUntil: null,
    data: null,
    actions: [],
    lastAction: null,
    ...o,
  };
}

function setup(props: Partial<InboxProps> = {}) {
  const handlers = {
    onViewChange: vi.fn(),
    onSourceChange: vi.fn(),
    onHandle: vi.fn(),
    onUnhandle: vi.fn(),
    onSnooze: vi.fn(),
    onUnsnooze: vi.fn(),
  };
  const all: InboxProps = {
    items: [item({ id: 1 }), item({ id: 2, source: 'trading', severity: 'urgent' })],
    view: 'open' as InboxView,
    counts: { open: 2, snoozed: 3, handled: 0 },
    sources: [
      { id: 'ci', open: 1 },
      { id: 'trading', open: 1 },
    ],
    source: null,
    ...handlers,
    ...props,
  };
  const utils = render(<Inbox {...all} />);
  return { ...handlers, ...utils, all };
}

beforeEach(() => {
  stubWidth(1200);
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Inbox root and tabs', () => {
  it('puts ref, className and rest props on the card', () => {
    const ref = { current: null as HTMLElement | null };
    setup({ ref, className: 'mine', 'data-testid': 'inbox', id: 'in' } as Partial<InboxProps>);
    const root = screen.getByTestId('inbox');
    expect(ref.current).toBe(root);
    expect(root.id).toBe('in');
    expect(root.className).toContain('mine');
    expect(root.className).toContain('min-w-0');
  });

  it('shows three views, marks the current one and counts open and snoozed only', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Open2', 'Snoozed3', 'Handled']);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(screen.getByRole('tablist').getAttribute('aria-label')).toBe('Inbox views');
  });

  it('picking a tab reports its view', () => {
    const { onViewChange } = setup();
    fireEvent.click(screen.getByRole('tab', { name: /Snoozed/ }));
    expect(onViewChange).toHaveBeenCalledWith('snoozed');
    fireEvent.click(screen.getByRole('tab', { name: /Handled/ }));
    expect(onViewChange).toHaveBeenLastCalledWith('handled');
  });

  it('tab names and view label come from the provider', () => {
    render(
      <NishProvider strings={{ inboxOpen: 'Ouvert', inboxSnoozed: 'Reporté', inboxHandled: 'Traité', inboxViews: 'Vues' }}>
        <Inbox
          items={[]}
          view="open"
          counts={{ open: 0, snoozed: 0, handled: 0 }}
          sources={[]}
          source={null}
          onViewChange={() => {}}
          onSourceChange={() => {}}
          onHandle={() => {}}
          onUnhandle={() => {}}
          onSnooze={() => {}}
          onUnsnooze={() => {}}
        />
      </NishProvider>,
    );
    expect(screen.getByRole('tablist').getAttribute('aria-label')).toBe('Vues');
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Ouvert0', 'Reporté0', 'Traité']);
  });
});

describe('Inbox source filter', () => {
  it('is hidden with one source or none', () => {
    setup({ sources: [{ id: 'ci', open: 1 }] });
    expect(screen.queryByRole('group', { name: 'Filter by source' })).toBeNull();
    cleanup();
    setup({ sources: [] });
    expect(screen.queryByRole('group', { name: 'Filter by source' })).toBeNull();
  });

  it('shows All and one chip per source with its count and display name, and marks the picked one', () => {
    const { onSourceChange } = setup({ source: 'trading' });
    const group = screen.getByRole('group', { name: 'Filter by source' });
    const chips = within(group).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(['All', 'CI1', 'Trading1']);
    expect(chips.map((c) => c.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
    fireEvent.click(chips[0]!);
    expect(onSourceChange).toHaveBeenLastCalledWith(null);
    fireEvent.click(chips[1]!);
    expect(onSourceChange).toHaveBeenLastCalledWith('ci');
  });

  it('unknown source ids show as they are and sourceLabels wins', () => {
    setup({
      items: [item({ id: 1, source: 'weird' })],
      sources: [
        { id: 'weird', open: 1 },
        { id: 'ci', open: 1 },
      ],
      sourceLabels: { ci: 'Pipelines' },
    });
    expect(screen.getByRole('button', { name: /^weird/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Pipelines/ })).toBeTruthy();
  });

  it('the label and "All" can be replaced', () => {
    setup({ labels: { all: 'Tout' } });
    expect(screen.getByRole('button', { name: 'Tout' })).toBeTruthy();
  });
});

describe('Inbox rows', () => {
  it('shows title, source name, severity dot name and the merge count', () => {
    setup({ items: [item({ id: 1, title: 'Build broke', count: 3, severity: 'urgent', source: 'ci' })] });
    const row = screen.getByText('Build broke').closest('li')!;
    expect(within(row).getByText('CI')).toBeTruthy();
    expect(within(row).getByLabelText('Urgent')).toBeTruthy();
    expect(within(row).getByLabelText('Happened 3 times').textContent).toBe('×3');
  });

  it('shows no count for a single event', () => {
    setup({ items: [item({ id: 1, count: 1 })] });
    expect(screen.queryByText(/×/)).toBeNull();
  });

  it('severity names and the count text come from labels and the provider', () => {
    render(
      <NishProvider strings={{ inboxHappened: (n: number) => `Arrivé ${n} fois` }}>
        <Inbox
          items={[item({ id: 1, count: 2, severity: 'info' })]}
          view="open"
          counts={{ open: 1, snoozed: 0, handled: 0 }}
          sources={[]}
          source={null}
          labels={{ info: 'Information' }}
          onViewChange={() => {}}
          onSourceChange={() => {}}
          onHandle={() => {}}
          onUnhandle={() => {}}
          onSnooze={() => {}}
          onUnsnooze={() => {}}
        />
      </NishProvider>,
    );
    expect(screen.getByLabelText('Information')).toBeTruthy();
    expect(screen.getByLabelText('Arrivé 2 fois')).toBeTruthy();
  });

  it('an unknown severity is shown as normal', () => {
    setup({ items: [item({ id: 1, severity: 'weird' as never })] });
    expect(screen.getByLabelText('Normal')).toBeTruthy();
  });

  it('a link opens in a new tab with noopener for http and https only', () => {
    setup({
      items: [
        item({ id: 1, title: 'Web', url: 'https://example.com/a' }),
        item({ id: 2, title: 'Script', url: 'javascript:alert(1)' }),
        item({ id: 3, title: 'Data', url: 'data:text/html,<b>x</b>' }),
        item({ id: 4, title: 'Spaced', url: '  JaVaScRiPt:alert(1)' }),
        item({ id: 5, title: 'Plain' }),
      ],
    });
    const web = screen.getByRole('link', { name: 'Web' });
    expect(web.getAttribute('href')).toBe('https://example.com/a');
    expect(web.getAttribute('target')).toBe('_blank');
    expect(web.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByRole('link', { name: 'Script' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Data' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Spaced' })).toBeNull();
    expect(screen.getByText('Script')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Plain' })).toBeNull();
  });

  it('a long body can be expanded and collapsed', () => {
    const body = 'x'.repeat(150);
    setup({ items: [item({ id: 1, body })] });
    const toggle = screen.getByRole('button', { name: 'More' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const p = screen.getByText(body);
    expect(p.className).toContain('line-clamp-3');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Less' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(body).className).not.toContain('line-clamp-3');
    fireEvent.click(screen.getByRole('button', { name: 'Less' }));
    expect(screen.getByText(body).className).toContain('line-clamp-3');
  });

  it('a short body has no toggle; four lines or 101 characters do', () => {
    setup({ items: [item({ id: 1, body: 'short' })] });
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    cleanup();
    setup({ items: [item({ id: 1, body: 'x'.repeat(100) })] });
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    cleanup();
    setup({ items: [item({ id: 1, body: 'x'.repeat(101) })] });
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy();
    cleanup();
    setup({ items: [item({ id: 1, body: 'a\nb\nc' })] });
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull();
    cleanup();
    setup({ items: [item({ id: 1, body: 'a\nb\nc\nd' })] });
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy();
  });

  it('the More and Less words come from the provider and labels', () => {
    render(
      <NishProvider strings={{ more: 'Plus' }}>
        <Inbox
          items={[item({ id: 1, body: 'x'.repeat(150) })]}
          view="open"
          counts={{ open: 1, snoozed: 0, handled: 0 }}
          sources={[]}
          source={null}
          labels={{ less: 'Moins' }}
          onViewChange={() => {}}
          onSourceChange={() => {}}
          onHandle={() => {}}
          onUnhandle={() => {}}
          onSnooze={() => {}}
          onUnsnooze={() => {}}
        />
      </NishProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    expect(screen.getByRole('button', { name: 'Moins' })).toBeTruthy();
  });

  it('scrolls the selected item into view once and highlights it', () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const { rerender, all } = setup({ selectedId: 2 });
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith({ block: 'center' });
    const row = screen.getByText('Item 2').closest('li')!;
    expect(row.className).toContain('bg-th-accent-soft');
    expect(row.getAttribute('data-selected')).toBe('true');
    expect(screen.getByText('Item 1').closest('li')!.hasAttribute('data-selected')).toBe(false);
    rerender(<Inbox {...all} selectedId={2} items={[...all.items]} />);
    expect(scroll).toHaveBeenCalledTimes(1);
    rerender(<Inbox {...all} selectedId={1} />);
    expect(scroll).toHaveBeenCalledTimes(2);
  });
});

describe('Inbox row actions on a wide screen', () => {
  it('has Mark handled and a Snooze menu in the open view', () => {
    const { onHandle, onSnooze } = setup({ items: [item({ id: 7 })] });
    fireEvent.click(screen.getByRole('button', { name: 'Mark handled' }));
    expect(onHandle).toHaveBeenCalledWith(7);
    fireEvent.click(screen.getByRole('button', { name: 'Snooze' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['1 hour', '4 hours', 'Tomorrow 8 AM', 'Monday 8 AM']);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T12:00:00'));
    fireEvent.click(within(menu).getByRole('menuitem', { name: '4 hours' }));
    expect(onSnooze).toHaveBeenCalledTimes(1);
    expect(onSnooze.mock.calls[0]![0]).toBe(7);
    expect((onSnooze.mock.calls[0]![1] as Date).toISOString()).toBe(new Date('2026-11-03T16:00:00').toISOString());
  });

  it('snooze labels come from labels', () => {
    setup({ items: [item({ id: 7 })], labels: { snooze1h: 'Une heure' } });
    fireEvent.click(screen.getByRole('button', { name: 'Snooze' }));
    expect(screen.getByRole('menuitem', { name: 'Une heure' })).toBeTruthy();
  });

  it('button names come from the provider', () => {
    render(
      <NishProvider strings={{ inboxMarkHandled: 'Traiter', inboxSnooze: 'Reporter' }}>
        <Inbox
          items={[item({ id: 1 })]}
          view="open"
          counts={{ open: 1, snoozed: 0, handled: 0 }}
          sources={[]}
          source={null}
          onViewChange={() => {}}
          onSourceChange={() => {}}
          onHandle={() => {}}
          onUnhandle={() => {}}
          onSnooze={() => {}}
          onUnsnooze={() => {}}
        />
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Traiter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reporter' })).toBeTruthy();
  });

  it('snooze options: one hour, four hours, 8 AM tomorrow, and the next Monday at 8 AM', () => {
    const wed = new Date('2026-11-04T10:30:00');
    const [h1, h4, tomorrow, monday] = SNOOZE_OPTIONS.map((o) => o.until(wed));
    expect(h1!.getTime() - wed.getTime()).toBe(3_600_000);
    expect(h4!.getTime() - wed.getTime()).toBe(4 * 3_600_000);
    expect(tomorrow!.getDate()).toBe(5);
    expect([tomorrow!.getHours(), tomorrow!.getMinutes()]).toEqual([8, 0]);
    expect(monday!.getDay()).toBe(1);
    expect(monday!.getDate()).toBe(9);
    expect(monday!.getHours()).toBe(8);
    // On a Monday it is the Monday a week ahead; on a Sunday, the next day.
    expect(SNOOZE_OPTIONS[3]!.until(new Date('2026-11-02T09:00:00')).getDate()).toBe(9);
    expect(SNOOZE_OPTIONS[3]!.until(new Date('2026-11-08T09:00:00')).getDate()).toBe(9);
  });
});

describe('Inbox row actions on a phone', () => {
  it('collapses into one Actions menu with Mark handled and the snooze options', () => {
    stubWidth(360);
    const { onHandle } = setup({ items: [item({ id: 3 })] });
    expect(screen.queryByRole('button', { name: 'Mark handled' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const items = screen.getAllByRole('menuitem').map((m) => m.textContent);
    expect(items).toEqual(['Mark handled', '1 hour', '4 hours', 'Tomorrow 8 AM', 'Monday 8 AM']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Mark handled' }));
    expect(onHandle).toHaveBeenCalledWith(3);
  });
});

describe('Inbox other views', () => {
  it('snoozed: Unsnooze and the time it comes back', () => {
    const { onUnsnooze } = setup({
      view: 'snoozed',
      items: [item({ id: 4, snoozedUntil: '2026-11-04T08:00:00.000Z' })],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Unsnooze' }));
    expect(onUnsnooze).toHaveBeenCalledWith(4);
    expect(screen.getByText(/^Until /)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mark handled' })).toBeNull();
  });

  it('handled: Move back, who handled it, and no open-view buttons', () => {
    const recent = new Date(Date.now() - 3600_000).toISOString();
    const { onUnhandle } = setup({
      view: 'handled',
      items: [
        item({ id: 5, handledAt: recent, handledBy: 'user' }),
        item({ id: 6, handledAt: recent, handledBy: 'source' }),
        item({ id: 8, handledAt: recent, handledBy: 'expired' }),
      ],
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Move back' })[0]!);
    expect(onUnhandle).toHaveBeenCalledWith(5);
    const notes = screen.getAllByText(/^Handled /).map((n) => n.textContent!);
    expect(notes[0]).toMatch(/^Handled .*ago$/);
    expect(notes[1]).toMatch(/ by the app$/);
    expect(notes[2]).toMatch(/ automatically$/);
    expect(screen.queryByRole('button', { name: 'Snooze' })).toBeNull();
  });

  it('Move back, Unsnooze and the handled notes can be translated', () => {
    setup({
      view: 'handled',
      items: [item({ id: 5, handledAt: new Date().toISOString(), handledBy: 'source' })],
      labels: { moveBack: 'Remettre', handledAgo: (w) => `Traité ${w}`, handledByApp: ' par l’appli' },
    });
    expect(screen.getByRole('button', { name: 'Remettre' })).toBeTruthy();
    expect(screen.getByText(/^Traité .* par l’appli$/)).toBeTruthy();
  });
});

describe('Inbox item actions', () => {
  const act1 = [
    { id: 'retry', label: 'Retry', method: 'POST' as const, target: 'http://127.0.0.1:1/x' },
    { id: 'skip', label: 'Skip', method: 'POST' as const, target: 'http://127.0.0.1:1/y' },
  ];

  it('shows buttons only when onAction is given and the view is not handled', () => {
    setup({ items: [item({ id: 1, actions: act1 })] });
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
    cleanup();
    setup({ items: [item({ id: 1, actions: act1 })], onAction: async () => {} });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    cleanup();
    setup({ view: 'snoozed', items: [item({ id: 1, actions: act1 })], onAction: async () => {} });
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
    cleanup();
    setup({ view: 'handled', items: [item({ id: 1, actions: act1 })], onAction: async () => {} });
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('while one action runs it shows busy and the other actions of that item are disabled', async () => {
    let finish!: () => void;
    const onAction = vi.fn(() => new Promise<void>((r) => (finish = r)));
    setup({ items: [item({ id: 1, actions: act1 }), item({ id: 2, actions: act1 })], onAction });
    const retry = screen.getAllByRole('button', { name: 'Retry' })[0]!;
    await act(async () => {
      fireEvent.click(retry);
    });
    expect(onAction).toHaveBeenCalledWith(1, 'retry');
    expect((screen.getAllByRole('button', { name: 'Skip' })[0] as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getAllByRole('button', { name: 'Skip' })[1] as HTMLButtonElement).disabled).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Skip' })[0]!);
    });
    expect(onAction).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
    });
    expect((screen.getAllByRole('button', { name: 'Skip' })[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it('a rejected action is ignored and the buttons come back', async () => {
    const onAction = vi.fn().mockRejectedValue(new Error('x'));
    setup({ items: [item({ id: 1, actions: act1 })], onAction });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect((screen.getByRole('button', { name: 'Skip' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the outcome of the last action, red when it failed', () => {
    setup({
      onAction: async () => {},
      items: [
        item({
          id: 1,
          actions: act1,
          lastAction: { actionId: 'retry', ok: false, status: 500, error: null, at: new Date().toISOString() },
        }),
        item({
          id: 2,
          actions: act1,
          lastAction: { actionId: 'skip', ok: true, status: 200, error: null, at: new Date().toISOString() },
        }),
        item({
          id: 3,
          actions: act1,
          lastAction: { actionId: 'retry', ok: false, status: null, error: 'timeout', at: new Date().toISOString() },
        }),
      ],
    });
    const failed = screen.getByText(/^Retry failed .* · HTTP 500$/);
    expect(failed.className).toContain('text-th-loss');
    const ok = screen.getByText(/^Skip ran /);
    expect(ok.className).toContain('text-th-hi3');
    expect(screen.getByText(/^Retry failed .* · timeout$/)).toBeTruthy();
  });

  it('the outcome sentences can be translated', () => {
    setup({
      onAction: async () => {},
      labels: { actionRan: (l, at) => `${l} fait ${at}` },
      items: [
        item({
          id: 1,
          actions: act1,
          lastAction: { actionId: 'retry', ok: true, status: 200, error: null, at: new Date().toISOString() },
        }),
      ],
    });
    expect(screen.getByText(/^Retry fait /)).toBeTruthy();
  });
});

describe('Inbox list states', () => {
  it('loading shows skeleton rows and no list', () => {
    setup({ loading: true });
    expect(screen.getByRole('status').textContent).toBe('Loading');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('an error shows the message and a Retry that calls onRetry', () => {
    const onRetry = vi.fn();
    setup({ error: 'Could not reach the inbox', onRetry });
    expect(screen.getByRole('alert').textContent).toContain('Could not reach the inbox');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('the empty state names the view and the filtered source', () => {
    setup({ items: [], view: 'open' });
    expect(screen.getByText('Nothing open')).toBeTruthy();
    cleanup();
    setup({ items: [], view: 'snoozed', source: 'ci' });
    expect(screen.getByText('Nothing snoozed from CI')).toBeTruthy();
    cleanup();
    setup({ items: [], view: 'handled', source: 'trading' });
    expect(screen.getByText('Nothing handled from Trading in the last 30 days')).toBeTruthy();
    cleanup();
    setup({ items: [], view: 'handled' });
    expect(screen.getByText('Nothing handled in the last 30 days')).toBeTruthy();
  });

  it('empty texts can be translated', () => {
    setup({ items: [], labels: { emptyOpen: (s) => (s ? `Rien de ${s}` : 'Rien') } });
    expect(screen.getByText('Rien')).toBeTruthy();
  });

  it('Load more shows with hasMore, reports clicks and is busy while loading', () => {
    const onLoadMore = vi.fn();
    const { rerender, all } = setup({ hasMore: true, onLoadMore });
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    rerender(<Inbox {...all} hasMore onLoadMore={onLoadMore} loadingMore />);
    expect(screen.getByRole('button', { name: /Load more/ }).getAttribute('aria-busy') ?? screen.getByRole('button', { name: /Load more/ }).hasAttribute('disabled')).toBeTruthy();
    rerender(<Inbox {...all} hasMore onLoadMore={onLoadMore} loading />);
    expect(screen.queryByRole('button', { name: /Load more/ })).toBeNull();
    rerender(<Inbox {...all} hasMore onLoadMore={onLoadMore} error="x" />);
    expect(screen.queryByRole('button', { name: /Load more/ })).toBeNull();
    rerender(<Inbox {...all} hasMore={false} />);
    expect(screen.queryByRole('button', { name: /Load more/ })).toBeNull();
  });
});

describe('Inbox mark all handled', () => {
  it('needs onHandleAll, items, the open view and no loading or error', () => {
    const f = () => screen.queryByRole('button', { name: 'Mark all handled' });
    setup();
    expect(f()).toBeNull();
    cleanup();
    setup({ onHandleAll: () => {} });
    expect(f()).not.toBeNull();
    cleanup();
    setup({ onHandleAll: () => {}, items: [] });
    expect(f()).toBeNull();
    cleanup();
    setup({ onHandleAll: () => {}, view: 'snoozed' });
    expect(f()).toBeNull();
    cleanup();
    setup({ onHandleAll: () => {}, loading: true });
    expect(f()).toBeNull();
    cleanup();
    setup({ onHandleAll: () => {}, error: 'x' });
    expect(f()).toBeNull();
  });

  it('asks first, counts the filtered source, and calls onHandleAll only on confirm', () => {
    const onHandleAll = vi.fn();
    setup({ onHandleAll, source: 'trading', counts: { open: 9, snoozed: 0, handled: 0 } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark all handled' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Mark 1 item handled?')).toBeTruthy();
    expect(onHandleAll).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onHandleAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Mark all handled' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Mark handled' }));
    expect(onHandleAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('without a source filter the count is the open total, and a plural is used', () => {
    setup({ onHandleAll: () => {}, counts: { open: 9, snoozed: 0, handled: 0 } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark all handled' }));
    expect(screen.getByText('Mark 9 items handled?')).toBeTruthy();
  });

  it('the dialog texts come from the provider and labels', () => {
    render(
      <NishProvider strings={{ inboxMarkHandled: 'Traiter', cancel: 'Annuler' }}>
        <Inbox
          items={[item({ id: 1 })]}
          view="open"
          counts={{ open: 1, snoozed: 0, handled: 0 }}
          sources={[]}
          source={null}
          onHandleAll={() => {}}
          labels={{ markAllHandled: 'Tout traiter', markAllTitle: (n) => `Traiter ${n} ?` }}
          onViewChange={() => {}}
          onSourceChange={() => {}}
          onHandle={() => {}}
          onUnhandle={() => {}}
          onSnooze={() => {}}
          onUnsnooze={() => {}}
        />
      </NishProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tout traiter' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Traiter 1 ?')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Annuler' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Traiter' })).toBeTruthy();
  });
});
