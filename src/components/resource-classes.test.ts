import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, configureApi } from './resource';

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });
}

describe('apiFetch: headers, bodies and errors', () => {
  const fetchMock = vi.fn();
  const sent = (i = 0) => new Headers(fetchMock.mock.calls[i][1].headers);
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    configureApi({ baseUrl: '', onUnauthorized: undefined, headers: undefined, headersFor: undefined });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('sends configureApi headers to relative and same-origin URLs only', async () => {
    configureApi({ headers: () => ({ authorization: 'Bearer t' }) });
    fetchMock.mockImplementation(() => Promise.resolve(json({})));
    await apiFetch('/api/a');
    await apiFetch('api/b');
    await apiFetch(`${location.origin}/api/c`);
    await apiFetch('https://other.example/api/d');
    await apiFetch('//other.example/api/e');
    expect(sent(0).get('authorization')).toBe('Bearer t');
    expect(sent(1).get('authorization')).toBe('Bearer t');
    expect(sent(2).get('authorization')).toBe('Bearer t');
    expect(sent(3).get('authorization')).toBeNull();
    expect(sent(4).get('authorization')).toBeNull();
  });

  it('does not send headers to backslash, tab or space-prefixed cross-origin paths', async () => {
    configureApi({ headers: () => ({ authorization: 'Bearer t' }) });
    fetchMock.mockImplementation(() => Promise.resolve(json({})));
    const bad = [String.raw`/\evil.example/x`, String.raw`\\evil.example/x`, ' //evil.example/x', '/\t/evil.example/x', '\t//evil.example/x'];
    for (const u of bad) await apiFetch(u);
    bad.forEach((_, i) => expect(sent(i).get('authorization')).toBeNull());
  });

  it('headersFor lets a cross-origin URL have the headers and is told the URL', async () => {
    const headersFor = vi.fn((url: string) => url.startsWith('https://api.partner.example/'));
    configureApi({ headers: () => ({ authorization: 'Bearer t' }), headersFor });
    fetchMock.mockImplementation(() => Promise.resolve(json({})));
    await apiFetch('https://api.partner.example/x');
    await apiFetch('https://evil.example/x');
    expect(sent(0).get('authorization')).toBe('Bearer t');
    expect(sent(1).get('authorization')).toBeNull();
    expect(headersFor).toHaveBeenCalledWith('https://api.partner.example/x');
    expect(headersFor).toHaveBeenCalledWith('https://evil.example/x');
  });

  it('headersFor is not asked about a same-origin URL', async () => {
    const headersFor = vi.fn(() => false);
    configureApi({ headers: () => ({ 'x-a': '1' }), headersFor });
    fetchMock.mockResolvedValue(json({}));
    await apiFetch('/same');
    expect(headersFor).not.toHaveBeenCalled();
    expect(sent().get('x-a')).toBe('1');
  });

  it('the origin of baseUrl is trusted with the headers', async () => {
    configureApi({ baseUrl: 'https://api.mine.example', headers: () => ({ 'x-a': '1' }) });
    fetchMock.mockResolvedValue(json({}));
    await apiFetch('/v1/things');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.mine.example/v1/things');
    expect(sent().get('x-a')).toBe('1');
  });

  it('per-call headers always apply and win over configured ones', async () => {
    configureApi({ headers: () => ({ 'x-a': 'config', 'x-b': 'config' }) });
    fetchMock.mockResolvedValue(json({}));
    await apiFetch('https://other.example/x', { headers: { 'x-b': 'call' } });
    expect(sent().get('x-a')).toBeNull();
    expect(sent().get('x-b')).toBe('call');
  });

  it('a 2xx body that says JSON but is not JSON becomes an ApiError with status and excerpt', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>\n  Bad gateway page that is quite long '.padEnd(400, 'x'), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const err = await apiFetch('/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const e = err as ApiError;
    expect(e.status).toBe(200);
    expect(e.url).toBe('/x');
    expect(typeof e.body).toBe('string');
    expect((e.body as string).length).toBeLessThanOrEqual(121);
    expect(e.body as string).not.toContain('\n');
    expect(e.message).toContain('not valid JSON');
    expect(e.message).toContain('<html>');
  });

  it('a failed response with a broken JSON body keeps its status and the text', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 502, headers: { 'content-type': 'application/json' } }));
    const e = (await apiFetch('/x').catch((x: unknown) => x)) as ApiError;
    expect(e.status).toBe(502);
    expect(e.body).toBe('oops');
    expect(e.message).toBe('The server answered 502.');
  });

  it('a non-JSON content type resolves the text; an empty body resolves undefined', async () => {
    fetchMock.mockResolvedValueOnce(new Response('plain', { status: 200, headers: { 'content-type': 'text/plain' } }));
    expect(await apiFetch('/t')).toBe('plain');
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));
    expect(await apiFetch('/e')).toBeUndefined();
  });

  it('a 4xx/5xx rejects (never resolves null) unless it is a 404 with nullOn404', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'Gone' }, { status: 404 }));
    await expect(apiFetch('/a')).rejects.toBeInstanceOf(ApiError);
    fetchMock.mockResolvedValueOnce(json({ error: 'Nope' }, { status: 403 }));
    await expect(apiFetch('/b', { nullOn404: true })).rejects.toMatchObject({ status: 403 });
    fetchMock.mockResolvedValueOnce(json({ error: 'Boom' }, { status: 500 }));
    await expect(apiFetch('/c', { nullOn404: true })).rejects.toMatchObject({ status: 500 });
    fetchMock.mockResolvedValueOnce(json({ error: 'Gone' }, { status: 404 }));
    expect(await apiFetch('/d', { nullOn404: true })).toBeNull();
  });

  it('onUnauthorized fires for 401 only', async () => {
    const onUnauthorized = vi.fn();
    configureApi({ onUnauthorized });
    for (const status of [403, 500, 404]) {
      fetchMock.mockResolvedValueOnce(json({ error: 'x' }, { status }));
      await apiFetch('/p').catch(() => undefined);
    }
    expect(onUnauthorized).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(json({ error: 'x' }, { status: 401 }));
    await apiFetch('/p').catch(() => undefined);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized.mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  it('retryable: network and 5xx yes, 499 and 400 no', () => {
    const mk = (status: number) => new ApiError('x', { status, url: '/' });
    expect(mk(0).retryable).toBe(true);
    expect(mk(500).retryable).toBe(true);
    expect(mk(503).retryable).toBe(true);
    expect(mk(499).retryable).toBe(false);
    expect(mk(400).retryable).toBe(false);
  });

  it('error messages: sentence from error or message, status sentence for codes', async () => {
    const message = async () => ((await apiFetch('/m').catch((e: unknown) => e)) as ApiError).message;
    fetchMock.mockResolvedValueOnce(json({ message: 'Name is taken' }, { status: 409 }));
    expect(await message()).toBe('Name is taken');
    fetchMock.mockResolvedValueOnce(json({ error: 'not_found' }, { status: 404 }));
    expect(await message()).toBe('That was not found.');
    fetchMock.mockResolvedValueOnce(json({ error: 'server_error' }, { status: 500 }));
    expect(await message()).toBe('The server had a problem. Try again.');
    fetchMock.mockResolvedValueOnce(json({ error: 'unauthorized' }, { status: 401 }));
    expect(await message()).toBe('Log in to continue.');
  });

  it('sends FormData, Blob and URLSearchParams as they are, with no JSON content type', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(json({})));
    const fd = new FormData();
    fd.set('a', '1');
    const blob = new Blob(['x']);
    const usp = new URLSearchParams('a=1');
    await apiFetch('/f', { method: 'POST', body: fd });
    await apiFetch('/b', { method: 'POST', body: blob });
    await apiFetch('/u', { method: 'POST', body: usp });
    expect(fetchMock.mock.calls[0][1].body).toBe(fd);
    expect(fetchMock.mock.calls[1][1].body).toBe(blob);
    expect(fetchMock.mock.calls[2][1].body).toBe(usp);
    for (let i = 0; i < 3; i++) expect(sent(i).get('content-type')).toBeNull();
  });

  it('keeps a content type the caller set on a JSON body', async () => {
    fetchMock.mockResolvedValue(json({}));
    await apiFetch('/c', { method: 'POST', body: { a: 1 }, headers: { 'content-type': 'application/merge-patch+json' } });
    expect(sent().get('content-type')).toBe('application/merge-patch+json');
    expect(fetchMock.mock.calls[0][1].body).toBe('{"a":1}');
  });

  it('an already-aborted caller signal aborts the request at once', async () => {
    fetchMock.mockImplementation((_u: string, init: RequestInit) =>
      init.signal!.aborted ? Promise.reject(new DOMException('aborted', 'AbortError')) : Promise.resolve(json({})),
    );
    const ctl = new AbortController();
    ctl.abort();
    await expect(apiFetch('/x', { signal: ctl.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('clears its timeout timer on success and on failure', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(json({}));
    await apiFetch('/ok');
    expect(vi.getTimerCount()).toBe(0);
    fetchMock.mockResolvedValueOnce(json({ error: 'x' }, { status: 500 }));
    await apiFetch('/bad').catch(() => undefined);
    expect(vi.getTimerCount()).toBe(0);
  });
});
