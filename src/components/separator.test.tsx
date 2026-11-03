import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Separator } from './separator';

afterEach(cleanup);

describe('Separator', () => {
  it('is decorative by default: role none, no aria-orientation', () => {
    const { container } = render(<Separator />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('role')).toBe('none');
    expect(el.hasAttribute('aria-orientation')).toBe(false);
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('exposes role=separator and aria-orientation when not decorative', () => {
    render(<Separator decorative={false} orientation="vertical" />);
    const el = screen.getByRole('separator');
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.className).toContain('w-px');
    expect(el.className).not.toContain('h-px');
  });

  it('draws a horizontal rule across', () => {
    render(<Separator decorative={false} />);
    const el = screen.getByRole('separator');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.className).toContain('h-px');
    expect(el.className).toContain('w-full');
  });

  it('centers a label between two rules', () => {
    render(<Separator decorative={false} label="or" />);
    const el = screen.getByRole('separator');
    expect(el.textContent).toBe('or');
    expect(el.querySelectorAll('[aria-hidden=true]').length).toBe(2);
  });

  it('ignores the label on a vertical separator', () => {
    render(<Separator decorative={false} orientation="vertical" label="or" />);
    expect(screen.getByRole('separator').textContent).toBe('');
  });

  it('forwards ref, merges className and spreads rest', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Separator ref={ref} className="my-4" id="s" data-x="1" style={{ opacity: 0.5 }} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current!.className).toContain('my-4');
    expect(ref.current!.className).toContain('bg-th-line');
    expect(ref.current!.id).toBe('s');
    expect(ref.current!.getAttribute('data-x')).toBe('1');
    expect(ref.current!.style.opacity).toBe('0.5');
  });

  it('renders on the server', () => {
    expect(renderToString(<Separator />)).toContain('role="none"');
  });
});
