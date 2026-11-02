import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MediaRow, MediaThumb } from './media';

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

describe('MediaRow compact', () => {
  it('uses 11px title and 10px meta and detail, a small thumbnail and keeps the 44px row', () => {
    const { container } = render(
      <MediaRow compact as="div" title="Title" meta="Meta" detail="Detail" live onClick={() => undefined} />,
    );
    const row = container.querySelector('button');
    expect(row?.className).toContain('min-h-11');
    expect(container.querySelector('.text-2xs')?.textContent).toBe('Title');
    expect(container.querySelector('.text-3xs')?.textContent).toContain('Meta');
    expect(container.querySelector('.w-16')).not.toBeNull();
  });
  it('leaves the default row at its normal sizes', () => {
    const { container } = render(<MediaRow as="div" title="Title" meta="Meta" onClick={() => undefined} />);
    expect(container.querySelector('.text-2xs')).toBeNull();
    expect(container.querySelector('.text-sm')?.textContent).toContain('Meta');
  });
});
