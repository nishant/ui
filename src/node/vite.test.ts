// @vitest-environment node
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { nishThemeInit } from './vite';

const dir = mkdtempSync(join(tmpdir(), 'nish-vite-'));
const file = join(dir, 'theme-init.js');
writeFileSync(file, '// comment\nwindow.__init = 1;\n');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

type Tag = { tag: string; attrs?: Record<string, string>; children: string; injectTo: string };
const run = (o: Parameters<typeof nishThemeInit>[0], html: string) => nishThemeInit({ file, ...o }).transformIndexHtml.handler(html);

describe('nishThemeInit nonce', () => {
  it('adds no attrs without a nonce', () => {
    const tags = run({}, '<html><head></head></html>') as Tag[];
    expect(tags).toHaveLength(1);
    expect(tags[0].attrs).toBeUndefined();
    expect(tags[0].children).toBe('window.__init = 1;');
    expect(tags[0].injectTo).toBe('head-prepend');
  });
  it('puts a string nonce on the injected tag', () => {
    const tags = run({ nonce: 'abc123' }, '<html><head></head></html>') as Tag[];
    expect(tags[0].attrs).toEqual({ nonce: 'abc123' });
  });
  it('calls a nonce function for every page', () => {
    let n = 0;
    const plugin = nishThemeInit({ file, nonce: () => `n${++n}` });
    const a = plugin.transformIndexHtml.handler('<html><head></head></html>') as Tag[];
    const b = plugin.transformIndexHtml.handler('<html><head></head></html>') as Tag[];
    expect(a[0].attrs).toEqual({ nonce: 'n1' });
    expect(b[0].attrs).toEqual({ nonce: 'n2' });
  });
  it('puts the nonce on the spliced script after <meta charset>', () => {
    const out = run({ nonce: 'x"y' }, '<head><meta charset="utf-8"><title>t</title></head>') as string;
    expect(out).toContain('<meta charset="utf-8"><script nonce="x&quot;y">window.__init = 1;</script>');
  });
  it('splices a plain script without a nonce', () => {
    const out = run({}, '<head><meta charset="utf-8"></head>') as string;
    expect(out).toContain('<meta charset="utf-8"><script>window.__init = 1;</script>');
  });
  it('treats an empty nonce as none', () => {
    const tags = run({ nonce: '' }, '<html><head></head></html>') as Tag[];
    expect(tags[0].attrs).toBeUndefined();
  });
  it('still throws for after-charset without a charset', () => {
    expect(() => run({ position: 'after-charset' }, '<head></head>')).toThrow(/no <meta charset>/);
  });
});
