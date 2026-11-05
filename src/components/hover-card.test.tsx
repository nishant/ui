import { act, cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HoverCard } from './hover-card';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const mouse = (el: Element, type: 'mouseenter' | 'mouseleave') => act(() => void el.dispatchEvent(new MouseEvent(type)));
const wait = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const card = () => screen.queryByTestId('card');

function setup(props: Partial<React.ComponentProps<typeof HoverCard>> = {}) {
  const utils = render(
    <HoverCard content="Preview text" data-testid="card" {...props}>
      <a href="#x">Link</a>
    </HoverCard>,
  );
  const link = screen.getByRole('link', { name: 'Link' });
  return { ...utils, link, wrapper: link.parentElement! };
}

describe('HoverCard', () => {
  it('puts ref, className and rest on the card', () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref, className: 'mine', id: 'my-card', defaultOpen: true });
    const el = card()!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains('mine')).toBe(true);
    expect(el.id).toBe('my-card');
    expect(el.textContent).toBe('Preview text');
    expect(el.getAttribute('data-state')).toBe('open');
  });

  it('opens after openDelay and not before', () => {
    const onOpenChange = vi.fn();
    const { wrapper } = setup({ onOpenChange });
    mouse(wrapper, 'mouseenter');
    wait(499);
    expect(card()).toBeNull();
    wait(1);
    expect(card()).not.toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('closes after closeDelay when the pointer leaves', () => {
    const onOpenChange = vi.fn();
    const { wrapper } = setup({ defaultOpen: true, onOpenChange });
    mouse(wrapper, 'mouseleave');
    wait(299);
    expect(card()).not.toBeNull();
    wait(1);
    expect(card()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('stays open while the pointer is on the card', () => {
    const { wrapper } = setup({ defaultOpen: true });
    mouse(wrapper, 'mouseleave');
    wait(200);
    // React's onPointerEnter is driven by pointerover/pointerout.
    act(() => {
      card()!.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, relatedTarget: document.body }));
    });
    wait(1000);
    expect(card()).not.toBeNull();
    act(() => {
      card()!.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
    });
    wait(300);
    expect(card()).toBeNull();
  });

  it('opens from keyboard focus, not from pointer focus', () => {
    const { link } = setup();
    const matches = vi.spyOn(Element.prototype, 'matches').mockImplementation(function () {
      return false;
    });
    act(() => void link.focus());
    wait(600);
    expect(card()).toBeNull();
    act(() => void link.blur());
    matches.mockRestore();
    vi.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, sel: string) {
      return sel === ':focus-visible';
    });
    act(() => void link.focus());
    wait(500);
    expect(card()).not.toBeNull();
  });

  it('closes after closeDelay when focus leaves', () => {
    const { link } = setup();
    vi.spyOn(Element.prototype, 'matches').mockImplementation((sel: string) => sel === ':focus-visible');
    act(() => void link.focus());
    wait(500);
    expect(card()).not.toBeNull();
    act(() => void link.blur());
    wait(300);
    expect(card()).toBeNull();
  });

  it('never opens from touch, and a touch press closes an open card', () => {
    const { wrapper } = setup();
    act(() => void wrapper.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' })));
    mouse(wrapper, 'mouseenter');
    wait(1000);
    expect(card()).toBeNull();

    cleanup();
    const second = setup({ defaultOpen: true });
    act(() => void second.wrapper.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch' })));
    expect(card()).toBeNull();
  });

  it('closes on Escape and stops the event from reaching a dialog', () => {
    setup({ defaultOpen: true });
    const outer = vi.fn();
    window.addEventListener('keydown', outer);
    act(() => void document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    window.removeEventListener('keydown', outer);
    expect(card()).toBeNull();
    expect(outer).not.toHaveBeenCalled();
  });

  it('closes the first card when a second one opens', () => {
    render(
      <>
        <HoverCard content="First card" data-testid="first">
          <a href="#1">One</a>
        </HoverCard>
        <HoverCard content="Second card" data-testid="second">
          <a href="#2">Two</a>
        </HoverCard>
      </>,
    );
    mouse(screen.getByText('One').parentElement!, 'mouseenter');
    wait(500);
    expect(screen.queryByTestId('first')).not.toBeNull();
    mouse(screen.getByText('One').parentElement!, 'mouseleave');
    mouse(screen.getByText('Two').parentElement!, 'mouseenter');
    wait(500);
    expect(screen.queryByTestId('first')).toBeNull();
    expect(screen.queryByTestId('second')).not.toBeNull();
  });

  it('merges aria-describedby with the child own while open', () => {
    render(
      <HoverCard content="c" data-testid="card" defaultOpen>
        <a href="#x" aria-describedby="hint">
          Link
        </a>
      </HoverCard>,
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-describedby')).toBe(`hint ${card()!.id}`);
    act(() => void link.parentElement!.dispatchEvent(new MouseEvent('mouseleave')));
    wait(300);
    expect(link.getAttribute('aria-describedby')).toBe('hint');
  });

  it('is controlled by open and reports changes through onOpenChange', () => {
    const onOpenChange = vi.fn();
    const { rerender, wrapper } = setup({ open: false, onOpenChange });
    mouse(wrapper, 'mouseenter');
    wait(500);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(card()).toBeNull();
    rerender(
      <HoverCard content="Preview text" data-testid="card" open onOpenChange={onOpenChange}>
        <a href="#x">Link</a>
      </HoverCard>,
    );
    expect(card()).not.toBeNull();
  });

  it('opens on mount with defaultOpen', () => {
    setup({ defaultOpen: true });
    expect(card()).not.toBeNull();
  });

  it('warns once and renders the children alone when they are not one element', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <HoverCard content="c">
        {'plain text' as unknown as React.ReactElement}
      </HoverCard>,
    );
    expect(screen.getByText('plain text')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith('nish-ui: HoverCard: children must be one element, such as a link.');
  });

  it('clears its timers when the trigger unmounts', () => {
    const onOpenChange = vi.fn();
    const { wrapper, unmount } = setup({ onOpenChange });
    mouse(wrapper, 'mouseenter');
    unmount();
    wait(1000);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders only the trigger on the server', () => {
    const html = renderToString(
      <HoverCard content="Preview text" defaultOpen>
        <a href="#x">Link</a>
      </HoverCard>,
    );
    expect(html).toContain('Link');
    expect(html).not.toContain('Preview text');
  });
});
