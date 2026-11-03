import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { VisuallyHidden } from './visually-hidden';

afterEach(cleanup);

describe('VisuallyHidden', () => {
  it('renders a span by default and keeps the text readable', () => {
    render(<VisuallyHidden>Close dialog</VisuallyHidden>);
    const el = screen.getByText('Close dialog');
    expect(el.tagName).toBe('SPAN');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });
  it('renders a div with as="div"', () => {
    render(<VisuallyHidden as="div">Block</VisuallyHidden>);
    expect(screen.getByText('Block').tagName).toBe('DIV');
  });
  it('hides with inline styles, no stylesheet needed', () => {
    render(<VisuallyHidden>x</VisuallyHidden>);
    const s = screen.getByText('x').style;
    expect(s.position).toBe('absolute');
    expect(s.width).toBe('1px');
    expect(s.height).toBe('1px');
    expect(s.overflow).toBe('hidden');
    expect(s.whiteSpace).toBe('nowrap');
    expect(s.margin).toBe('-1px');
  });
  it('passes ref, id, data and aria attributes and merges style', () => {
    const ref = createRef<HTMLElement>();
    render(
      <VisuallyHidden ref={ref} id="a" data-x="1" aria-live="polite" style={{ color: 'red' }}>
        y
      </VisuallyHidden>,
    );
    const el = screen.getByText('y');
    expect(ref.current).toBe(el);
    expect(el.id).toBe('a');
    expect(el.getAttribute('data-x')).toBe('1');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.style.color).toBe('red');
    expect(el.style.position).toBe('absolute');
  });
  it('renders on the server', () => {
    expect(renderToString(<VisuallyHidden>z</VisuallyHidden>)).toContain('>z</span>');
  });
});
