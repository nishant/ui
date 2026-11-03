import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NishProvider } from './provider';
import { Toaster, dismissToast, toast, useToast } from './toast';
import { shared } from '../runtime';

interface Store {
  items: Array<{ id: number; title: string; tone: string; duration: number | 'sticky'; slot?: string }>;
  timers: Map<number, unknown>;
}
// Creating the first toast makes the module build its own store; the helper below only reads it.
dismissToast(toast('seed'));
const store = () => shared<Store>('toast', () => ({ items: [], timers: new Map() }) as unknown as Store);
const titles = () => store().items.map((t) => t.title);

function clearStore() {
  for (const t of [...store().items]) dismissToast(t.id);
}

beforeEach(() => {
  vi.useFakeTimers();
  clearStore();
});

afterEach(() => {
  cleanup();
  clearStore();
  vi.useRealTimers();
});

// toast() updates mounted Toasters, so it runs inside act.
const fire = <T,>(fn: () => T): T => {
  let out!: T;
  act(() => {
    out = fn();
  });
  return out;
};
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('toast store', () => {
  it('returns increasing ids and records tone, title, body and action', () => {
    const action = { label: 'Undo', onClick: () => {} };
    const a = toast('first');
    const b = toast.success('second', { body: 'detail', action });
    const c = toast.warn('third');
    const d = toast.info('fourth', 'text body');
    expect(b).toBe(a + 1);
    expect(c).toBe(b + 1);
    expect(d).toBe(c + 1);
    const [i1, i2, i3, i4] = store().items;
    expect([i1.tone, i2.tone, i3.tone, i4.tone]).toEqual(['info', 'success', 'warn', 'info']);
    expect(i2).toMatchObject({ title: 'second', body: 'detail', action });
    expect(i4).toMatchObject({ body: 'text body' });
  });

  it('useToast returns the same function', () => {
    expect(useToast()).toBe(toast);
  });

  it('dismisses itself after 4000 ms', () => {
    fire(() => toast('bye'));
    tick(3999);
    expect(titles()).toEqual(['bye']);
    tick(1);
    expect(titles()).toEqual([]);
  });

  it('honors a custom duration', () => {
    fire(() => toast('quick', { duration: 500 }));
    tick(499);
    expect(titles()).toEqual(['quick']);
    tick(1);
    expect(titles()).toEqual([]);
  });

  it('keeps errors until dismissed, unless a duration is given', () => {
    fire(() => toast.error('broke'));
    fire(() => toast.error('brief', { duration: 1000 }));
    tick(60_000);
    expect(titles()).toEqual(['broke']);
  });

  it('treats duration Infinity and sticky as sticky', () => {
    fire(() => toast('a', { duration: Infinity }));
    fire(() => toast('b', { duration: 'sticky' }));
    tick(60_000);
    expect(titles()).toEqual(['a', 'b']);
    expect(store().items.map((t) => t.duration)).toEqual(['sticky', 'sticky']);
    expect(store().timers.size).toBe(0);
  });

  it('dismissToast removes one toast and clears its timer, and ignores unknown ids', () => {
    const a = toast('a');
    fire(() => toast('b'));
    dismissToast(a);
    expect(titles()).toEqual(['b']);
    expect(store().timers.size).toBe(1);
    const before = store().items;
    dismissToast(99_999);
    expect(store().items).toBe(before);
  });

  it('replaces a toast in the same slot instead of stacking, and restarts the timer', () => {
    fire(() => toast('v1', { id: 'undo', duration: 3000 }));
    tick(2000);
    fire(() => toast('v2', { id: 'undo', duration: 3000 }));
    expect(titles()).toEqual(['v2']);
    tick(2000);
    expect(titles()).toEqual(['v2']);
    tick(1000);
    expect(titles()).toEqual([]);
    expect(store().timers.size).toBe(0);
  });

  it('keeps only four toasts and evicts the oldest ordinary one first', () => {
    const ids = [toast('1'), toast('2'), toast('3'), toast('4')];
    expect(titles()).toEqual(['1', '2', '3', '4']);
    fire(() => toast('5'));
    expect(titles()).toEqual(['2', '3', '4', '5']);
    // The evicted toast's timer is gone with it.
    expect(store().timers.has(ids[0])).toBe(false);
    expect(store().timers.size).toBe(4);
  });

  it('never evicts sticky toasts or errors; the oldest ordinary one goes instead', () => {
    fire(() => toast('sticky', { duration: Infinity }));
    fire(() => toast.error('error'));
    fire(() => toast('plain-1'));
    fire(() => toast('plain-2'));
    fire(() => toast('newest'));
    expect(titles()).toEqual(['sticky', 'error', 'plain-2', 'newest']);
  });

  it('lets the stack grow past four when everything on screen is kept', () => {
    fire(() => toast.error('e1'));
    fire(() => toast.error('e2'));
    fire(() => toast.error('e3'));
    fire(() => toast.error('e4'));
    fire(() => toast.error('e5'));
    expect(titles()).toEqual(['e1', 'e2', 'e3', 'e4', 'e5']);
  });

  it('pauses the timer on hover and resumes with at least one second left', () => {
    vi.useFakeTimers();
    render(<Toaster />);
    tick(0);
    fire(() => toast('hover me', { duration: 4000 }));
    tick(10);
    const card = screen.getByText('hover me').closest('div[class*="rounded-xl"]')!;
    tick(3000);
    fireEvent.pointerEnter(card, { pointerType: 'mouse' });
    tick(60_000);
    expect(titles()).toEqual(['hover me']);
    fireEvent.pointerLeave(card, { pointerType: 'mouse' });
    // 1000 ms were left; the floor is one second.
    tick(999);
    expect(titles()).toEqual(['hover me']);
    tick(1);
    expect(titles()).toEqual([]);
  });

  it('ignores touch pointer enter so a tap cannot pin the toast', () => {
    render(<Toaster />);
    fire(() => toast('tap'));
    tick(10);
    const card = screen.getByText('tap').closest('div[class*="rounded-xl"]')!;
    fireEvent.pointerEnter(card, { pointerType: 'touch' });
    tick(4000);
    expect(titles()).toEqual([]);
  });

  it('counts overlapping hover and focus pauses', () => {
    render(<Toaster />);
    fire(() => toast('both'));
    tick(10);
    const card = screen.getByText('both').closest('div[class*="rounded-xl"]')!;
    fireEvent.pointerEnter(card, { pointerType: 'mouse' });
    fireEvent.focus(card);
    fireEvent.pointerLeave(card, { pointerType: 'mouse' });
    tick(60_000);
    expect(titles()).toEqual(['both']);
    fireEvent.blur(card);
    // The time left when the first pause began (about 3990 ms) runs out.
    tick(3989);
    expect(titles()).toEqual(['both']);
    tick(11);
    expect(titles()).toEqual([]);
  });

  it('shares one store between module copies', async () => {
    fire(() => toast('from copy one'));
    vi.resetModules();
    const other = await import('./toast');
    expect(titles()).toEqual(['from copy one']);
    const id = other.toast('from copy two');
    expect(titles()).toEqual(['from copy one', 'from copy two']);
    dismissToast(id);
    expect(titles()).toEqual(['from copy one']);
  });
});

describe('toast.promise', () => {
  it('shows a sticky loading toast, then replaces it with the success message', async () => {
    let resolve!: (v: number) => void;
    const p = new Promise<number>((r) => (resolve = r));
    const returned = toast.promise(p, { loading: 'Saving', success: (n) => `Saved ${n}`, error: 'Failed' });
    expect(returned).toBe(p);
    expect(store().items.map((t) => [t.title, t.tone, t.duration])).toEqual([['Saving', 'info', 'sticky']]);
    tick(60_000);
    expect(titles()).toEqual(['Saving']);
    resolve(3);
    await act(async () => {
      await p;
    });
    expect(store().items.map((t) => [t.title, t.tone])).toEqual([['Saved 3', 'success']]);
    tick(4000);
    expect(titles()).toEqual([]);
  });

  it('replaces the loading toast with the error message, which stays', async () => {
    const p = Promise.reject(new Error('nope'));
    const returned = toast.promise(p, { loading: 'Saving', success: 'Saved', error: (e) => `Failed: ${(e as Error).message}` });
    await act(async () => {
      await returned.catch(() => {});
    });
    expect(store().items.map((t) => [t.title, t.tone])).toEqual([['Failed: nope', 'error']]);
    tick(60_000);
    expect(titles()).toEqual(['Failed: nope']);
  });

  it('uses plain strings as given and keeps the loading toast in place', async () => {
    fire(() => toast('other'));
    const p = Promise.resolve(1);
    toast.promise(p, { loading: 'L', success: 'S', error: 'E' });
    expect(titles()).toEqual(['other', 'L']);
    await act(async () => {
      await p;
    });
    expect(titles()).toEqual(['other', 'S']);
  });

  it('adds the result as a new toast when the loading toast was dismissed', async () => {
    const p = Promise.resolve(1);
    toast.promise(p, { loading: 'L', success: 'S', error: 'E' });
    clearStore();
    await act(async () => {
      await p;
    });
    expect(titles()).toEqual(['S']);
  });
});

describe('Toaster', () => {
  const polite = () => document.querySelector('[role=status][aria-live=polite]')!;
  const assertive = () => document.querySelector('[role=alert][aria-live=assertive]')!;

  it('renders nothing on the server', () => {
    expect(renderToString(<Toaster />)).toBe('');
  });

  it('mounts empty live regions, polite for status and assertive for alerts', () => {
    render(<Toaster />);
    expect(polite().textContent).toBe('');
    expect(assertive().textContent).toBe('');
    expect(polite().getAttribute('aria-atomic')).toBe('true');
    expect(assertive().getAttribute('aria-atomic')).toBe('true');
  });

  it('sits in a keep-active stack on the toast z token, portaled to body', () => {
    render(<Toaster className="mine" data-testid="stack" />);
    const stack = screen.getByTestId('stack');
    expect(stack.parentElement).toBe(document.body);
    expect(stack.hasAttribute('data-nish-keep-active')).toBe(true);
    expect(stack.className).toContain('z-[var(--nish-z-toast,60)]');
    expect(stack.className).toContain('mine');
    expect(stack.className).toContain('sm:end-5');
  });

  it('passes ref and style, and sets the offset variable', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Toaster ref={ref} offset="5rem" style={{ opacity: 0.9 }} data-testid="stack" />);
    expect(ref.current).toBe(screen.getByTestId('stack'));
    expect(ref.current?.style.getPropertyValue('--nish-toast-offset')).toBe('5rem');
    expect(ref.current?.style.opacity).toBe('0.9');
  });

  it('applies the offsetUntil breakpoint', () => {
    const { rerender } = render(<Toaster offsetUntil="lg" data-testid="stack" />);
    expect(screen.getByTestId('stack').className).toContain('lg:pb-');
    rerender(<Toaster offsetUntil="sm" data-testid="stack" />);
    expect(screen.getByTestId('stack').className).not.toContain('md:pb-');
    expect(screen.getByTestId('stack').className).not.toContain('lg:pb-');
  });

  it('shows cards with title, body and the provider Dismiss label, and dismisses on click', () => {
    render(
      <NishProvider strings={{ dismiss: 'Schließen' }}>
        <Toaster />
      </NishProvider>,
    );
    fire(() => toast('Saved', { body: 'All good', duration: Infinity }));
    tick(10);
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByText('All good')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(titles()).toEqual([]);
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('runs the action and then dismisses the toast', () => {
    const onClick = vi.fn();
    render(<Toaster />);
    fire(() => toast('Archived', { action: { label: 'Undo', onClick }, duration: Infinity }));
    tick(10);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(titles()).toEqual([]);
  });

  it('announces a toast once after 100 ms, politely, with its body', () => {
    render(<Toaster />);
    fire(() => toast('Saved', 'Watchlist updated'));
    tick(99);
    expect(polite().textContent).toBe('');
    tick(1);
    expect(polite().textContent).toBe('Saved. Watchlist updated');
    expect(assertive().textContent).toBe('');
  });

  it('announces errors in the assertive region', () => {
    render(<Toaster />);
    fire(() => toast.error('Broke'));
    tick(100);
    expect(assertive().textContent).toBe('Broke');
    expect(polite().textContent).toBe('');
  });

  it('joins toasts that arrive within the same 100 ms window into one announcement', () => {
    render(<Toaster />);
    fire(() => toast('one'));
    tick(50);
    fire(() => toast('two'));
    tick(49);
    expect(polite().textContent).toBe('');
    tick(1);
    expect(polite().textContent).toBe('one. two');
    fire(() => toast.error('bad one'));
    fire(() => toast.error('bad two'));
    tick(100);
    expect(assertive().textContent).toBe('bad one. bad two');
  });

  it('clears an announcement after five seconds', () => {
    render(<Toaster />);
    fire(() => toast('gone soon', { duration: Infinity }));
    tick(100);
    expect(polite().textContent).toBe('gone soon');
    tick(4999);
    expect(polite().textContent).toBe('gone soon');
    tick(1);
    expect(polite().textContent).toBe('');
  });

  it('announces repeated text again by replacing the live node', () => {
    render(<Toaster />);
    fire(() => toast('same', { duration: Infinity }));
    tick(100);
    const first = polite().firstElementChild;
    fire(() => toast('same', { duration: Infinity }));
    tick(100);
    expect(polite().textContent).toBe('same');
    expect(polite().firstElementChild).not.toBe(first);
  });

  it('does not announce a toast that was dismissed before the buffer flushed twice, and forgets old ids', () => {
    render(<Toaster />);
    const id = fire(() => toast('quick', { duration: Infinity }));
    tick(100);
    expect(polite().textContent).toBe('quick');
    act(() => dismissToast(id));
    tick(5000);
    expect(polite().textContent).toBe('');
    fire(() => toast('next', { duration: Infinity }));
    tick(100);
    expect(polite().textContent).toBe('next');
  });

  it('clears every pending timer when it unmounts', () => {
    const { unmount } = render(<Toaster />);
    fire(() => toast('pending', { duration: Infinity }));
    fire(() => toast.error('pending error'));
    tick(50);
    unmount();
    // Toasts are sticky here, so any timer left over would be the Toaster's own.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('removes the dismissed card from the DOM', () => {
    render(<Toaster />);
    const id = fire(() => toast('card', { duration: Infinity }));
    tick(10);
    expect(screen.getByText('card')).toBeTruthy();
    act(() => dismissToast(id));
    expect(screen.queryByText('card')).toBeNull();
  });
});
