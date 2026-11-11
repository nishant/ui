import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSpaHandler } from './spa';

const sha = (s: string): string => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;
const html = (inline: string): string =>
  `<meta charset="utf-8"><script>${inline}</script><script type="module" src="/assets/a.js"></script>`;

let dir = '';
const get = (h: (r: Request) => Promise<Response>, path: string, method = 'GET'): Promise<Response> =>
  h(new Request(`http://x.test${path}`, { method }));

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'nish-spa-'));
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), html('window.x=1'));
  writeFileSync(join(dir, 'assets', 'a.js'), 'export {};');
  writeFileSync(join(dir, '.env'), 'secret');
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const expected = (inline: string, extra: { connect?: string; img?: string; frame?: string } = {}): string =>
  [
    "default-src 'self'",
    `script-src 'self' ${sha(inline)}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${extra.img ?? ''}`,
    `connect-src 'self'${extra.connect ?? ''}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    `frame-ancestors ${extra.frame ?? "'self'"}`,
  ].join('; ');

describe('createSpaHandler', () => {
  it('sends no CSP without the option', async () => {
    const res = await get(createSpaHandler({ dir }), '/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-security-policy')).toBeNull();
    expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });

  it("'strict' gives the exact policy on / and on a deep route, not on assets", async () => {
    const h = createSpaHandler({ dir, csp: 'strict', immutable: ['/assets/'] });
    for (const p of ['/', '/deep/route']) {
      const res = await get(h, p);
      expect(res.headers.get('content-security-policy')).toBe(expected('window.x=1'));
      expect(res.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    }
    const js = await get(h, '/assets/a.js');
    expect(js.status).toBe(200);
    expect(js.headers.get('content-security-policy')).toBeNull();
    expect(js.headers.get('content-security-policy-report-only')).toBeNull();
  });

  it('reportOnly uses the report-only header', async () => {
    const res = await get(createSpaHandler({ dir, csp: { reportOnly: true } }), '/');
    expect(res.headers.get('content-security-policy')).toBeNull();
    expect(res.headers.get('content-security-policy-report-only')).toBe(expected('window.x=1'));
  });

  it('appends connect, img and frameAncestors sources', async () => {
    const h = createSpaHandler({
      dir,
      csp: { connect: ['https://api.test'], img: ['https://img.test'], frameAncestors: ['https://a.test'] },
    });
    const res = await get(h, '/');
    expect(res.headers.get('content-security-policy')).toBe(
      expected('window.x=1', { connect: ' https://api.test', img: ' https://img.test', frame: 'https://a.test' }),
    );
  });

  it('throws on a bad source', () => {
    for (const bad of ['a;b', 'a,b', 'a\nb']) {
      expect(() => createSpaHandler({ dir, csp: { connect: [bad] } })).toThrow('@nish/ui/server: bad csp source: ' + bad);
    }
  });

  it('HEAD gets the same header as GET', async () => {
    const h = createSpaHandler({ dir, csp: 'strict' });
    const g = await get(h, '/');
    const hd = await get(h, '/', 'HEAD');
    expect(hd.headers.get('content-security-policy')).toBe(g.headers.get('content-security-policy'));
    expect(await hd.text()).toBe('');
  });

  it('recomputes the hash when index.html changes', async () => {
    const d = mkdtempSync(join(tmpdir(), 'nish-spa-'));
    try {
      const file = join(d, 'index.html');
      writeFileSync(file, html('a=1'));
      const h = createSpaHandler({ dir: d, csp: 'strict' });
      expect((await get(h, '/')).headers.get('content-security-policy')).toContain(sha('a=1'));
      writeFileSync(file, html('b=2'));
      const t = new Date(statSync(file).mtimeMs + 5000);
      utimesSync(file, t, t);
      const csp = (await get(h, '/')).headers.get('content-security-policy');
      expect(csp).toContain(sha('b=2'));
      expect(csp).not.toContain(sha('a=1'));
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('hashes uppercase tags once and skips src scripts', async () => {
    const d = mkdtempSync(join(tmpdir(), 'nish-spa-'));
    try {
      writeFileSync(join(d, 'index.html'), '<SCRIPT>q()</SCRIPT><script>q()</script><script SRC="/x.js"></script>');
      const csp = (await get(createSpaHandler({ dir: d, csp: 'strict' }), '/')).headers.get('content-security-policy');
      expect(csp).toContain(`script-src 'self' ${sha('q()')};`);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });

  it('keeps 404 for dotfiles and 503 when not built', async () => {
    const h = createSpaHandler({ dir });
    expect((await get(h, '/.env')).status).toBe(404);
    expect((await get(h, '/missing.js')).status).toBe(404);
    const empty = mkdtempSync(join(tmpdir(), 'nish-spa-'));
    try {
      const res = await get(createSpaHandler({ dir: empty, notBuilt: 'nope' }), '/');
      expect(res.status).toBe(503);
      expect(await res.text()).toBe('nope');
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
