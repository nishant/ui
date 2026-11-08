import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The Toaster loads its cards through import('./toast-card'). Here that import always rejects, so the plain
// fallback card has to carry the toast, and the load must not be retried.
let factoryRuns = 0;

afterEach(() => {
  cleanup();
  vi.doUnmock('./toast-card');
});

async function setup() {
  vi.resetModules();
  factoryRuns = 0;
  vi.doMock('./toast-card', () => {
    factoryRuns++;
    throw new Error('chunk failed');
  });
  return import('./toast');
}

describe('Toaster when the card chunk cannot load', () => {
  it('shows a fallback card whose action and dismiss button work, and does not retry', async () => {
    const { Toaster, toast, dismissToast } = await setup();
    const onClick = vi.fn();
    render(<Toaster />);
    let id = 0;
    act(() => {
      id = toast.success('Saved', { body: 'All good', duration: 'sticky', action: { label: 'Undo', onClick } });
    });
    await waitFor(() => expect(factoryRuns).toBe(1));
    const fallback = await screen.findByText('Saved');
    expect(fallback.closest('[data-nish-toast-fallback]')).not.toBeNull();
    expect(screen.getByText('All good')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Saved')).toBeNull();

    let id2 = 0;
    act(() => {
      id2 = toast('Second', { duration: 'sticky' });
    });
    expect(screen.getByText('Second').closest('[data-nish-toast-fallback]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Second')).toBeNull();

    let id3 = 0;
    act(() => {
      id3 = toast('Third', { duration: 'sticky' });
    });
    expect(screen.getByText('Third').closest('[data-nish-toast-fallback]')).not.toBeNull();
    expect(factoryRuns).toBe(1);
    act(() => {
      dismissToast(id);
      dismissToast(id2);
      dismissToast(id3);
    });
  });
});
