// @vitest-environment node
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nishThemeInit } from './vite';

const dir = mkdtempSync(join(tmpdir(), 'nish-vite-'));
const file = join(dir, 'theme-init.js');
writeFileSync(file, '// a reader comment\n(function(){\n  // inner note\n  var a = "http://x"; // trailing stays\n})();\n');

const page = '<!doctype html><html><head><meta charset="UTF-8" /><title>x</title></head></html>';
const run = (o: Parameters<typeof nishThemeInit>[0], html = page) => nishThemeInit({ file, ...o }).transformIndexHtml.handler(html);

describe('nishThemeInit', () => {
  it('strips whole-line comments and keeps code', () => {
    const out = run({}) as string;
    expect(out).not.toContain('a reader comment');
    expect(out).not.toContain('inner note');
    expect(out).toContain('var a = "http://x"; // trailing stays');
  });

  it('auto puts the script right after <meta charset> so the charset stays in the first 1024 bytes', () => {
    const out = run({}) as string;
    expect(out.indexOf('<meta charset="UTF-8" /><script>')).toBeGreaterThan(-1);
    expect(out.indexOf('<meta charset')).toBeLessThan(1024);
  });

  it('auto falls back to head-prepend when the page has no charset', () => {
    expect(run({}, '<html><head></head></html>')).toEqual([expect.objectContaining({ tag: 'script', injectTo: 'head-prepend' })]);
  });

  it('head-prepend and after-charset still do what they say', () => {
    expect(run({ position: 'head-prepend' })).toEqual([expect.objectContaining({ injectTo: 'head-prepend' })]);
    expect(() => run({ position: 'after-charset' }, '<html><head></head></html>')).toThrow(/no <meta charset>/);
  });

  it('runs the legacy migration and prelude before theme-init', () => {
    const out = run({ legacyKey: 'theme', prelude: 'window.__p=1;' }) as string;
    const s = out.slice(out.indexOf('<script>'));
    expect(s.indexOf("'theme'") === -1 ? s.indexOf('"theme"') : s.indexOf("'theme'")).toBeLessThan(s.indexOf('window.__p=1'));
    expect(s.indexOf('window.__p=1')).toBeLessThan(s.indexOf('(function(){'));
  });
});
