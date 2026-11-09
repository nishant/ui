import { describe, expect, it } from 'vitest';
import { safeUrl } from './url';

describe('safeUrl', () => {
  it.each([
    ['/a?b#c', '/a?b#c'],
    ['#top', '#top'],
    ['page.html', 'page.html'],
    ['../up', '../up'],
    ['mailto:a@b', 'mailto:a@b'],
    ['tel:+1', 'tel:+1'],
    ['https://x', 'https://x'],
    ['http://x/y', 'http://x/y'],
    ['HTTPS://X', 'HTTPS://X'],
    ['//evil.com', '//evil.com'],
    ['  /padded  ', '/padded'],
  ])('passes %j', (input, out) => {
    expect(safeUrl(input)).toBe(out);
  });

  it.each([
    '  JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    '﻿javascript:alert(1)',
    ' javascript:x',
    '　javascript:x',
    'javascript:alert(1)',
    'java\tscript:x',
    'java\nscript:x',
    'java\u0000script:x',
    '\u0001javascript:x',
    'data:text/html,<b>',
    'vbscript:x',
    'file:///etc/passwd',
    'blob:https://x/y',
    '',
    '   ',
    null,
    undefined,
  ])('blocks %j', (input) => {
    expect(safeUrl(input as string | null | undefined)).toBeNull();
  });

  it('does not treat a colon later in a path as a scheme', () => {
    expect(safeUrl('/a:b')).toBe('/a:b');
    expect(safeUrl('?q=javascript:x')).toBe('?q=javascript:x');
  });
  it('refuses leading or trailing non-C0 Unicode whitespace', () => {
    expect(safeUrl('/page ')).toBeNull();
  });
});
