import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaChip, MediaRow, MediaThumb } from './media';
import { NishProvider } from './provider';

afterEach(cleanup);

const loads = (src: string) => render(<MediaThumb src={src} fallback={<i />} />).container.querySelector('img') !== null;

describe('MediaThumb source filtering', () => {
  it('loads https, http and relative sources', () => {
    expect(loads('https://ok.example/a.png')).toBe(true);
    expect(loads('http://ok.example/a.png')).toBe(true);
    expect(loads('/img/a.png')).toBe(true);
    expect(loads('a.png')).toBe(true);
    expect(loads('//cdn.example/a.png')).toBe(true);
  });
  it.each([
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
    '  JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'vbscript:x',
    'file:///etc/passwd',
    '',
  ])('shows the fallback for %j', (src) => {
    expect(loads(src)).toBe(false);
  });
  it('shows the fallback without a src', () => {
    const { container } = render(<MediaThumb fallback={<i data-testid="fb" />} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('fb')).toBeTruthy();
  });
});

describe('MediaThumb', () => {
  it('loads lazily, without a referrer, undraggable, with empty alt by default', () => {
    const { container } = render(<MediaThumb src="/a.png" />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('draggable')).toBe('false');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('src')).toBe('/a.png');
  });
  it('uses the alt text you give', () => {
    const { container } = render(<MediaThumb src="/a.png" alt="Cover" />);
    expect(container.querySelector('img')!.getAttribute('alt')).toBe('Cover');
  });
  it('falls back when the image fails, and tries a new src', () => {
    const { container, rerender } = render(<MediaThumb src="/a.png" fallback={<i data-testid="fb" />} />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('fb')).toBeTruthy();
    rerender(<MediaThumb src="/b.png" fallback={<i data-testid="fb" />} />);
    expect(container.querySelector('img')!.getAttribute('src')).toBe('/b.png');
  });
  it('gives the fallback an img role only when there is alt text', () => {
    const { container, rerender } = render(<MediaThumb fallback={<i />} />);
    expect((container.firstElementChild as HTMLElement).getAttribute('role')).toBeNull();
    rerender(<MediaThumb fallback={<i />} alt="Cover" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Cover');
  });
  it.each([
    ['wide', 'sm', 'aspect-video w-16'],
    ['wide', 'md', 'aspect-video w-[72px]'],
    ['round', 'sm', 'size-9 rounded-full'],
    ['round', 'md', 'size-12 rounded-full'],
    ['square', 'sm', 'size-9'],
    ['square', 'md', 'size-12'],
  ] as const)('sizes %s %s', (shape, size, cls) => {
    const { container } = render(<MediaThumb shape={shape} size={size} fallback={<i />} />);
    expect((container.firstElementChild as HTMLElement).className).toContain(cls);
  });
  it('defaults to a wide md thumbnail', () => {
    const { container } = render(<MediaThumb fallback={<i />} />);
    expect((container.firstElementChild as HTMLElement).className).toContain('min-[420px]:w-24');
  });
  it('forwards ref, className and rest on the image box and on the fallback box', () => {
    const ref = createRef<HTMLSpanElement>();
    const { rerender } = render(<MediaThumb ref={ref} src="/a.png" className="extra" data-testid="th" />);
    expect(ref.current).toBe(screen.getByTestId('th'));
    expect(ref.current?.className).toContain('extra');
    rerender(<MediaThumb ref={ref} className="extra" data-testid="th" fallback={<i />} />);
    expect(ref.current).toBe(screen.getByTestId('th'));
    expect(ref.current?.className).toContain('extra');
  });
});

describe('MediaRow', () => {
  it('uses 11px title and 10px meta and detail, a small thumbnail and keeps the 44px row when compact', () => {
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
  it('uses a small thumbnail when dense, and thumbSize wins', () => {
    const { container, rerender } = render(<MediaRow as="div" dense title="T" />);
    expect(container.querySelector('.w-16')).not.toBeNull();
    rerender(<MediaRow as="div" dense thumbSize="md" title="T" />);
    expect(container.querySelector('.w-16')).toBeNull();
  });
  it('shows Live, Offline or nothing from live, and your extra badges', () => {
    const { container, rerender } = render(<MediaRow as="div" title="T" live />);
    expect(screen.getByText('Live')).toBeTruthy();
    expect(screen.queryByText('Offline')).toBeNull();
    rerender(<MediaRow as="div" title="T" live={false} badges={<b>On screen</b>} />);
    expect(screen.getByText('Offline')).toBeTruthy();
    expect(screen.getByText('On screen')).toBeTruthy();
    rerender(<MediaRow as="div" title="T" />);
    expect(container.textContent).toBe('T');
  });
  it('reads the badge text from the provider, and a prop wins', () => {
    render(
      <NishProvider strings={{ live: 'En direct', offlineBadge: 'Hors ligne' }}>
        <MediaRow as="div" title="A" live />
        <MediaRow as="div" title="B" live={false} />
        <MediaRow as="div" title="C" live liveLabel="Now" />
        <MediaRow as="div" title="D" live={false} offlineLabel="Gone" />
      </NishProvider>,
    );
    expect(screen.getByText('En direct')).toBeTruthy();
    expect(screen.getByText('Hors ligne')).toBeTruthy();
    expect(screen.getByText('Now')).toBeTruthy();
    expect(screen.getByText('Gone')).toBeTruthy();
  });
  it('makes the row a link or a button, and shows the title on two lines', () => {
    const onClick = vi.fn();
    const { rerender } = render(<MediaRow as="div" title="T" href="/x" />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('/x');
    expect(screen.getByText('T').className).toContain('line-clamp-2');
    rerender(<MediaRow as="div" title="T" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('does not link to an unsafe href', () => {
    render(<MediaRow as="div" title="T" href="javascript:alert(1)" />);
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('passes an unsafe thumbnail to the fallback', () => {
    const { container } = render(<MediaRow as="div" title="T" thumbnailUrl="javascript:alert(1)" fallback={<i data-testid="fb" />} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('fb')).toBeTruthy();
  });
  it('shows meta and detail lines, and trailing content', () => {
    render(<MediaRow as="div" title="T" meta="Chan" detail="2 days ago" trailing={<u>go</u>} />);
    expect(screen.getByText('Chan')).toBeTruthy();
    expect(screen.getByText('2 days ago').className).toContain('text-xs');
    expect(screen.getByText('go')).toBeTruthy();
  });
  it('forwards ref and rest to the wrapper, and className to the row', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ul>
        <MediaRow ref={ref} title="T" className="row-x" data-testid="mr" id="m1" />
      </ul>,
    );
    expect(ref.current).toBe(screen.getByTestId('mr'));
    expect(ref.current?.tagName).toBe('LI');
    expect(ref.current?.id).toBe('m1');
    expect(ref.current?.firstElementChild?.className).toContain('row-x');
  });
});

describe('MediaChip', () => {
  it('is a 44px button that shows the label, an action word and calls onClick', () => {
    const onClick = vi.fn();
    render(<MediaChip label="Clip" action="Bring back" onClick={onClick} />);
    const b = screen.getByRole('button');
    expect(b.className).toContain('h-11');
    expect(b.className).toContain('ps-1');
    expect(b.className).toContain('pe-4');
    expect(b.textContent).toBe('ClipBring back');
    expect(b.getAttribute('type')).toBe('button');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('loads a safe thumbnail and skips an unsafe or broken one', () => {
    const { container, rerender } = render(<MediaChip label="C" onClick={() => undefined} thumbnailUrl="/a.png" />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('loading')).toBe('lazy');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    rerender(<MediaChip label="C" onClick={() => undefined} thumbnailUrl="javascript:alert(1)" />);
    expect(container.querySelector('img')).toBeNull();
    rerender(<MediaChip label="C" onClick={() => undefined} thumbnailUrl="data:image/png;base64,AAAA" />);
    expect(container.querySelector('img')).toBeNull();
  });
  it('forwards ref, className and rest', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<MediaChip ref={ref} label="C" onClick={() => undefined} className="extra" aria-label="Open C" data-x="1" />);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Open C' }));
    expect(ref.current?.className).toContain('extra');
    expect(ref.current?.getAttribute('data-x')).toBe('1');
  });
});
