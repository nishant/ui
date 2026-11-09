import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInboxClient } from './client';

afterEach(() => vi.useRealTimers());

describe('inbox client backoff', () => {
  it('does not retry on a new send while the retry timer is pending', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => ({ status: 429, headers: { get: () => '3600' }, json: async () => ({}) }) as unknown as Response);
    const client = createInboxClient({ source: 'app', url: 'http://inbox.test', fetch: fetchMock as unknown as typeof fetch, log: () => {} });
    const first = await client.send({ kind: 'note', title: 'one' } as never);
    expect(first.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const second = await client.send({ kind: 'note', title: 'two' } as never);
    await vi.advanceTimersByTimeAsync(1000);
    expect(second.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(client.pending).toBe(2);
  });
});
