import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MediaThumb } from './media';

afterEach(cleanup);

const loads = (src: string) => render(<MediaThumb src={src} fallback={<i />} />).container.querySelector('img') !== null;

describe('MediaThumb source filtering', () => {
  it('loads https and relative sources', () => {
    expect(loads('https://ok.example/a.png')).toBe(true);
    expect(loads('/img/a.png')).toBe(true);
    expect(loads('a.png')).toBe(true);
  });
  it.each([
    '//evil.example/a.png',
    '/\\evil.example/a.png',
    '\\\\evil.example/a.png',
    '/\t/evil.example/a.png',
    '/\n/evil.example/a.png',
    'http://evil.example/a.png',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
  ])('shows the fallback for %j', (src) => {
    expect(loads(src)).toBe(false);
  });
});
