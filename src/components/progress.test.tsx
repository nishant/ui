import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { Progress } from './progress';
import { NishProvider } from './provider';

afterEach(cleanup);

describe('Progress', () => {
  it('is a determinate progressbar with value, min and max', () => {
    render(<Progress value={40} max={80} aria-label="Upload" />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('80');
    expect(bar.getAttribute('aria-valuetext')).toBe('50%');
    expect(bar.getAttribute('data-state')).toBe('loading');
    expect((bar.querySelector('[data-part=fill]') as HTMLElement).style.width).toBe('50%');
  });
  it('clamps the value', () => {
    render(<Progress value={500} aria-label="a" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(bar.getAttribute('data-state')).toBe('complete');
  });
  it('clamps below zero', () => {
    render(<Progress value={-5} aria-label="a" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
  it('is indeterminate without a value: no valuenow, no valuetext', () => {
    render(<Progress value={null} />);
    const bar = screen.getByRole('progressbar', { name: 'Loading' });
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(bar.hasAttribute('aria-valuetext')).toBe(false);
    expect(bar.getAttribute('data-state')).toBe('indeterminate');
    expect((bar.firstElementChild as HTMLElement).className).toContain('animate-pulse');
  });
  it('uses formatValue for aria-valuetext and the visible value', () => {
    render(<Progress value={3} max={10} label="Files" showValue formatValue={(v, m) => `${v} of ${m}`} />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('3 of 10');
    expect(screen.getByText('3 of 10')).toBeTruthy();
  });
  it('names the bar from the visible label', () => {
    render(<Progress value={10} label="Importing" />);
    expect(screen.getByRole('progressbar', { name: 'Importing' })).toBeTruthy();
  });
  it('applies tone and size classes', () => {
    render(<Progress value={10} aria-label="a" tone="loss" size="lg" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.className).toContain('h-4');
    expect(bar.firstElementChild!.className).toContain('bg-th-loss-fill');
  });
  it('has forced-colors styles on the fill', () => {
    render(<Progress value={10} aria-label="a" />);
    expect(screen.getByRole('progressbar').firstElementChild!.className).toContain('forced-colors:bg-[Highlight]');
  });
  it('passes ref, className, id and data attributes to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Progress ref={ref} value={1} aria-label="a" className="mt-2" id="p" data-x="1" />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current!.className).toContain('mt-2');
    expect(ref.current!.id).toBe('p');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
  });
  it('indeterminate fill is a short bar under reduced motion and forced colors', () => {
    render(<Progress />);
    const fill = document.querySelector('[data-part="fill"]') as HTMLElement;
    expect(fill.className).toContain('motion-reduce:!w-2/5');
    expect(fill.className).toContain('forced-colors:!w-2/5');
  });

  it('reads the indeterminate label from the provider', () => {
    render(
      <NishProvider strings={{ progressIndeterminate: 'Chargement' }}>
        <Progress />
      </NishProvider>,
    );
    expect(screen.getByRole('progressbar', { name: 'Chargement' })).toBeTruthy();
  });
  it('renders on the server', () => {
    expect(renderToString(<Progress value={5} aria-label="a" />)).toContain('role="progressbar"');
  });
});
