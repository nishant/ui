import { describe, expect, it } from 'vitest';
import { isDirectCall } from './direct-call';

const PORT = 8804;
const base = { host: `127.0.0.1:${PORT}` };
const make = (h: Record<string, string>, as: 'headers' | 'plain') => (as === 'headers' ? new Headers(h) : h);
const call = (h: Record<string, string>, as: 'headers' | 'plain', peer: string | null | undefined = '127.0.0.1', port = PORT) =>
  isDirectCall({ headers: make(h, as), remoteAddress: peer, port });

describe.each(['headers', 'plain'] as const)('isDirectCall (%s)', (as) => {
  it('accepts a loopback peer with the right host', () => {
    expect(call(base, as)).toBe(true);
    for (const peer of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) expect(call(base, as, peer)).toBe(true);
  });
  it('does not need x-inbox-action', () => {
    expect(call({ ...base, 'x-inbox-action': '1' }, as)).toBe(true);
    expect(call(base, as)).toBe(true);
  });
  it('refuses other, null, undefined and empty peers', () => {
    for (const peer of ['192.168.1.5', '10.0.0.1', '::ffff:10.0.0.1', '', null]) expect(call(base, as, peer)).toBe(false);
    expect(isDirectCall({ headers: make(base, as), remoteAddress: undefined, port: PORT })).toBe(false);
  });
  it('refuses a wrong or missing host or port', () => {
    expect(call({ host: 'app.nish.software' }, as)).toBe(false);
    expect(call({ host: 'localhost:8804' }, as)).toBe(false);
    expect(call({ host: '127.0.0.1:9999' }, as)).toBe(false);
    expect(call({}, as)).toBe(false);
    expect(call(base, as, '127.0.0.1', 9999)).toBe(false);
  });
  it('refuses proxy and origin headers', () => {
    for (const name of ['forwarded', 'via', 'x-real-ip', 'true-client-ip', 'cdn-loop', 'origin', 'x-forwarded-for', 'x-forwarded-proto', 'cf-ray', 'cf-connecting-ip']) {
      expect(call({ ...base, [name]: 'x' }, as), name).toBe(false);
    }
  });
  it('refuses sec-fetch-* except sec-fetch-mode: cors', () => {
    expect(call({ ...base, 'sec-fetch-mode': 'cors' }, as)).toBe(true);
    expect(call({ ...base, 'sec-fetch-mode': 'navigate' }, as)).toBe(false);
    expect(call({ ...base, 'sec-fetch-mode': 'no-cors' }, as)).toBe(false);
    for (const name of ['sec-fetch-site', 'sec-fetch-dest', 'sec-fetch-user']) expect(call({ ...base, [name]: 'same-origin' }, as), name).toBe(false);
  });
  it('compares header names case-insensitively', () => {
    if (as === 'plain') {
      expect(call({ Host: base.host }, as)).toBe(true);
      expect(call({ ...base, 'X-Forwarded-For': '1.2.3.4' }, as)).toBe(false);
      expect(call({ ...base, Origin: 'http://x' }, as)).toBe(false);
    }
  });
});

it('accepts a Node-style header bag with undefined and array values', () => {
  expect(isDirectCall({ headers: { host: base.host, via: undefined }, remoteAddress: '127.0.0.1', port: PORT })).toBe(true);
  expect(isDirectCall({ headers: { host: [base.host] as unknown as string }, remoteAddress: '127.0.0.1', port: PORT })).toBe(true);
});
