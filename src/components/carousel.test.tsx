import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Carousel } from './carousel';
import { CAROUSEL_MAX_DOTS, CAROUSEL_MIN_INTERVAL, nearestSlide, stepIndex } from './carousel-classes';
import { NishProvider } from './provider';

const rtl = vi.hoisted(() => ({ on: false }));
vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  isRtl: () => rtl.on,
}));

const scrollIntoView = vi.fn();
const realMatchMedia = window.matchMedia;

beforeEach(() => {
  scrollIntoView.mockClear();
  Element.prototype.scrollIntoView = scrollIntoView as unknown as typeof Element.prototype.scrollIntoView;
});

afterEach(() => {
  cleanup();
  rtl.on = false;
  window.matchMedia = realMatchMedia;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function slidesOf(n: number) {
  return Array.from({ length: n }, (_, i) => <p key={i}>Content {i + 1}</p>);
}

function setup(n = 3, props: Partial<React.ComponentProps<typeof Carousel>> = {}) {
  return render(
    <Carousel aria-label="Trips" {...props}>
      {slidesOf(n)}
    </Carousel>,
  );
}

function slide(n: number, count: number) {
  return screen.getByRole('group', { name: `${n} of ${count}` });
}

function track(): HTMLElement {
  return document.querySelector('section [tabindex="0"]') as HTMLElement;
}

function live(): HTMLElement {
  return document.querySelector('[aria-live]') as HTMLElement;
}

function mockReducedMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

describe('Carousel structure', () => {
  it('reaches the section through ref, merges className and passes rest props', () => {
    let node: HTMLElement | null = null;
    render(
      <Carousel
        aria-label="Trips"
        ref={(n) => {
          node = n;
        }}
        className="custom"
        data-x="1"
        id="c1"
      >
        {slidesOf(2)}
      </Carousel>,
    );
    expect(node).toBeInstanceOf(HTMLElement);
    const section = document.querySelector('section') as HTMLElement;
    expect(node).toBe(section);
    expect(section.className).toContain('custom');
    expect(section.className).toContain('flex');
    expect(section.getAttribute('data-x')).toBe('1');
    expect(section.id).toBe('c1');
  });

  it('is a labelled carousel region with slides as labelled groups', () => {
    setup(3);
    const section = document.querySelector('section') as HTMLElement;
    expect(section.getAttribute('aria-roledescription')).toBe('carousel');
    expect(section.getAttribute('aria-label')).toBe('Trips');
    for (const n of [1, 2, 3]) {
      expect(slide(n, 3).getAttribute('aria-roledescription')).toBe('slide');
    }
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    expect(slide(2, 3).getAttribute('data-state')).toBe('inactive');
  });

  it('names slides with the slideLabel prop', () => {
    setup(2, { slideLabel: (n, c) => `Trip ${n}/${c}` });
    expect(screen.getByRole('group', { name: 'Trip 1/2' })).toBeTruthy();
  });

  it('renders no controls for one slide, even with autoPlay', () => {
    setup(1, { autoPlay: 3000 });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders an empty track with no controls and warns for no slides', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Carousel aria-label="Empty">{[]}</Carousel>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(warn).toHaveBeenCalledWith('Carousel: no slides');
  });

  it('uses strings from a provider, and the label props win', () => {
    render(
      <NishProvider strings={{ nextSlide: 'Weiter', previousSlide: 'Zurück' }}>
        <Carousel aria-label="Trips" previousLabel="Back">
          {slidesOf(2)}
        </Carousel>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Zurück' })).toBeNull();
  });
});

describe('Carousel announcements', () => {
  it('puts the new slide in the live node on next, a dot and a key, not on mount', () => {
    setup(3);
    expect(live().textContent).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(live().textContent).toBe('2 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(live().textContent).toBe('3 of 3');
    fireEvent.keyDown(track(), { key: 'Home' });
    expect(live().textContent).toBe('1 of 3');
  });

  it('names the focusable track', () => {
    setup(3);
    expect(track().getAttribute('aria-label')).toBe('Trips');
    expect(track().getAttribute('role')).toBe('group');
    expect(track().hasAttribute('aria-live')).toBe(false);
  });
});

describe('Carousel buttons', () => {
  it('next scrolls to slide 2 and makes it active', () => {
    setup(3);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(slide(2, 3));
    expect(scrollIntoView.mock.calls[0][0]).toMatchObject({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
    expect(slide(1, 3).getAttribute('data-state')).toBe('inactive');
  });

  it('previous at the first slide is aria-disabled and does nothing', () => {
    setup(3);
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.hasAttribute('disabled')).toBe(false);
    fireEvent.click(prev);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('next at the last slide is aria-disabled', () => {
    setup(2, { defaultIndex: 1 });
    expect(screen.getByRole('button', { name: 'Next slide' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Previous slide' }).getAttribute('aria-disabled')).toBeNull();
  });

  it('loop wraps in both directions', () => {
    setup(3, { loop: true });
    const prev = screen.getByRole('button', { name: 'Previous slide' });
    expect(prev.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(prev);
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('scrolls instantly under reduced motion', () => {
    mockReducedMotion();
    setup(3);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(scrollIntoView.mock.calls[0][0]).toMatchObject({ behavior: 'auto' });
  });
});

describe('Carousel indicators', () => {
  it('shows one dot per slide, marks the current one and jumps on click', () => {
    setup(3);
    const dots = screen.getByRole('group', { name: 'Choose slide' }).querySelectorAll('button');
    expect(dots).toHaveLength(3);
    expect(dots[0].getAttribute('aria-current')).toBe('true');
    expect(dots[1].getAttribute('aria-current')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
    expect(scrollIntoView.mock.contexts[0]).toBe(slide(3, 3));
    expect(screen.getByRole('button', { name: 'Go to slide 3' }).getAttribute('aria-current')).toBe('true');
  });

  it('shows a counter instead of dots above seven slides', () => {
    setup(CAROUSEL_MAX_DOTS + 1);
    expect(screen.queryByRole('group', { name: 'Choose slide' })).toBeNull();
    expect(screen.getByText('1 / 8')).toBeTruthy();
  });

  it('shows dots for exactly seven slides', () => {
    setup(CAROUSEL_MAX_DOTS);
    expect(screen.getByRole('group', { name: 'Choose slide' })).toBeTruthy();
  });

  it('indicators={false} hides the dots and shows the counter', () => {
    setup(3, { indicators: false });
    expect(screen.queryByRole('group', { name: 'Choose slide' })).toBeNull();
    expect(screen.getByText('1 / 3')).toBeTruthy();
  });

  it('indicators={true} forces dots on a long carousel', () => {
    setup(9, { indicators: true });
    expect(screen.getByRole('group', { name: 'Choose slide' }).querySelectorAll('button')).toHaveLength(9);
  });
});

describe('Carousel keyboard', () => {
  it('ArrowRight, ArrowLeft, End and Home move on the track', () => {
    setup(4);
    const t = track();
    fireEvent.keyDown(t, { key: 'ArrowRight' });
    expect(slide(2, 4).getAttribute('data-state')).toBe('active');
    fireEvent.keyDown(t, { key: 'ArrowLeft' });
    expect(slide(1, 4).getAttribute('data-state')).toBe('active');
    fireEvent.keyDown(t, { key: 'End' });
    expect(slide(4, 4).getAttribute('data-state')).toBe('active');
    fireEvent.keyDown(t, { key: 'Home' });
    expect(slide(1, 4).getAttribute('data-state')).toBe('active');
  });

  it('prevents default for handled keys and ignores others', () => {
    setup(3);
    const t = track();
    expect(fireEvent.keyDown(t, { key: 'ArrowRight' })).toBe(false);
    expect(fireEvent.keyDown(t, { key: 'a' })).toBe(true);
  });

  it('stops at the ends without loop, wraps with loop', () => {
    const { unmount } = setup(3);
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    unmount();
    setup(3, { loop: true });
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
  });

  it('swaps the arrows in right-to-left layouts', () => {
    rtl.on = true;
    setup(3);
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('ignores keys that bubble up from inside a slide', () => {
    render(
      <Carousel aria-label="Trips">
        <button type="button">Inner</button>
        <p>Two</p>
      </Carousel>,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Inner' }), { key: 'ArrowRight' });
    expect(slide(1, 2).getAttribute('data-state')).toBe('active');
  });
});

describe('Carousel index', () => {
  it('calls onIndexChange for buttons and keys, once per change', () => {
    const onIndexChange = vi.fn();
    setup(3, { onIndexChange });
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    fireEvent.keyDown(track(), { key: 'End' });
    expect(onIndexChange.mock.calls).toEqual([[1], [2]]);
  });

  it('follows a controlled index and reports changes without owning them', () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(
      <Carousel aria-label="Trips" index={0} onIndexChange={onIndexChange}>
        {slidesOf(3)}
      </Carousel>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    scrollIntoView.mockClear();
    rerender(
      <Carousel aria-label="Trips" index={2} onIndexChange={onIndexChange}>
        {slidesOf(3)}
      </Carousel>,
    );
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(slide(3, 3));
    expect(onIndexChange).toHaveBeenCalledTimes(1);
  });

  it('scrolls to defaultIndex on mount and clamps an index past the end', () => {
    setup(3, { defaultIndex: 2 });
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
    expect(scrollIntoView.mock.contexts[0]).toBe(slide(3, 3));
    cleanup();
    render(
      <Carousel aria-label="Trips" index={9}>
        {slidesOf(3)}
      </Carousel>,
    );
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
  });

  it('works as a controlled component inside a parent', () => {
    function Parent() {
      const [i, setI] = useState(0);
      return (
        <>
          <Carousel aria-label="Trips" index={i} onIndexChange={setI}>
            {slidesOf(3)}
          </Carousel>
          <output>{i}</output>
        </>
      );
    }
    render(<Parent />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(document.querySelector('output')?.textContent).toBe('2');
  });
});

describe('Carousel scrolling and focus', () => {
  function mockRects(tr: HTMLElement, starts: number[], trackStart = 0, width = 100) {
    vi.spyOn(tr, 'getBoundingClientRect').mockReturnValue({ left: trackStart, right: trackStart + width } as DOMRect);
    Array.from(tr.children).forEach((child, i) => {
      vi.spyOn(child, 'getBoundingClientRect').mockReturnValue({ left: starts[i], right: starts[i] + width } as DOMRect);
    });
  }

  let queued: FrameRequestCallback[] = [];
  beforeEach(() => {
    queued = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => queued.push(cb));
  });
  /** A scroll event, then the animation frame it asked for. */
  function scroll(el: HTMLElement) {
    fireEvent.scroll(el);
    act(() => queued.splice(0).forEach((cb) => cb(0)));
  }

  it('a scroll event updates the index to the nearest slide', () => {
    const onIndexChange = vi.fn();
    setup(3, { onIndexChange });
    const t = track();
    mockRects(t, [-210, -10, 190]);
    scroll(t);
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('uses the right edges in right-to-left layouts', () => {
    rtl.on = true;
    setup(3);
    const t = track();
    // Slide 3 starts (its right edge) at the track's right edge.
    vi.spyOn(t, 'getBoundingClientRect').mockReturnValue({ left: 0, right: 100 } as DOMRect);
    const rights = [500, 300, 100];
    Array.from(t.children).forEach((child, i) => {
      vi.spyOn(child, 'getBoundingClientRect').mockReturnValue({ left: rights[i] - 100, right: rights[i] } as DOMRect);
    });
    scroll(t);
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
  });

  it('ignores scroll positions while a button press is still scrolling, then accepts them', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date(2026, 10, 5, 12));
    const onIndexChange = vi.fn();
    setup(3, { onIndexChange });
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    const t = track();
    mockRects(t, [-5, 95, 195]); // still near slide 1 on the way to slide 2
    scroll(t);
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
    mockRects(t, [-100, 0, 100]); // arrived
    scroll(t);
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
    mockRects(t, [-5, 95, 195]); // reader swipes back
    scroll(t);
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('trusts the scroll position again after 700 ms', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(new Date(2026, 10, 5, 12));
    setup(3);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    const t = track();
    mockRects(t, [-5, 95, 195]);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    scroll(t);
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('batches scroll events into one frame', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    setup(3);
    const t = track();
    mockRects(t, [-210, -10, 190]);
    fireEvent.scroll(t);
    fireEvent.scroll(t);
    expect(frames).toHaveLength(1);
    act(() => frames[0](0));
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
  });

  it('cancels a pending frame on unmount', () => {
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', () => 7);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { unmount } = setup(3);
    fireEvent.scroll(track());
    unmount();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('focus inside a slide makes it current without scrolling it', () => {
    const onIndexChange = vi.fn();
    render(
      <Carousel aria-label="Trips" onIndexChange={onIndexChange}>
        <p>One</p>
        <p>Two</p>
        <button type="button">Three</button>
      </Carousel>,
    );
    act(() => screen.getByRole('button', { name: 'Three' }).focus());
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('Carousel auto-rotation', () => {
  function playing() {
    return screen.getByRole('button', { name: 'Stop slide rotation' });
  }

  it('is off without autoPlay', () => {
    vi.useFakeTimers();
    setup(3);
    expect(screen.queryByRole('button', { name: 'Stop slide rotation' })).toBeNull();
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    expect(live().getAttribute('aria-live')).toBe('polite');
  });

  it('advances after the interval and wraps at the end', () => {
    vi.useFakeTimers();
    setup(3, { autoPlay: 5000 });
    expect(live().getAttribute('aria-live')).toBe('off');
    expect(document.querySelector('section')?.getAttribute('data-state')).toBe('active');
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(slide(3, 3).getAttribute('data-state')).toBe('active');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('puts the stop button first in the tab order', () => {
    setup(3, { autoPlay: 5000 });
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBe(playing());
  });

  it('pauses while the pointer is over the carousel', () => {
    vi.useFakeTimers();
    setup(3, { autoPlay: 5000 });
    const section = document.querySelector('section') as HTMLElement;
    fireEvent.pointerEnter(section);
    expect(live().getAttribute('aria-live')).toBe('polite');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    fireEvent.pointerLeave(section);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
  });

  it('pauses while focus is inside and resumes when it leaves', () => {
    vi.useFakeTimers();
    setup(3, { autoPlay: 5000 });
    const next = screen.getByRole('button', { name: 'Next slide' });
    act(() => next.focus());
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    act(() => next.blur());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
  });

  it('pauses while the page is hidden', () => {
    vi.useFakeTimers();
    setup(3, { autoPlay: 5000 });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    try {
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      act(() => {
        vi.advanceTimersByTime(20000);
      });
      expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    } finally {
      Reflect.deleteProperty(document, 'visibilityState');
    }
  });

  it('the stop button stops rotation for good and the start button resumes it', () => {
    vi.useFakeTimers();
    setup(3, { autoPlay: 5000 });
    fireEvent.click(playing());
    const start = screen.getByRole('button', { name: 'Start slide rotation' });
    expect(live().getAttribute('aria-live')).toBe('polite');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    fireEvent.click(start);
    expect(screen.getByRole('button', { name: 'Stop slide rotation' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
  });

  it('re-arms the timer after a manual move', () => {
    vi.useFakeTimers();
    setup(4, { autoPlay: 5000 });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(slide(3, 4).getAttribute('data-state')).toBe('active');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(slide(4, 4).getAttribute('data-state')).toBe('active');
  });

  it('warns for an interval under 2000 and uses 2000', () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setup(3, { autoPlay: 500 });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('autoPlay must be at least 2000'));
    act(() => {
      vi.advanceTimersByTime(CAROUSEL_MIN_INTERVAL - 1);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(slide(2, 3).getAttribute('data-state')).toBe('active');
  });

  it('starts stopped under reduced motion', () => {
    vi.useFakeTimers();
    mockReducedMotion();
    setup(3, { autoPlay: 5000 });
    expect(screen.getByRole('button', { name: 'Start slide rotation' })).toBeTruthy();
    expect(live().getAttribute('aria-live')).toBe('polite');
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(slide(1, 3).getAttribute('data-state')).toBe('active');
  });

  it('uses rotation strings from a provider', () => {
    render(
      <NishProvider strings={{ stopRotation: 'Anhalten' }}>
        <Carousel aria-label="Trips" autoPlay={5000}>
          {slidesOf(2)}
        </Carousel>
      </NishProvider>,
    );
    expect(screen.getByRole('button', { name: 'Anhalten' })).toBeTruthy();
  });
});

describe('nearestSlide', () => {
  it('returns -1 for no slides', () => {
    expect(nearestSlide([], 0)).toBe(-1);
  });
  it('picks the start edge closest to the origin', () => {
    expect(nearestSlide([-300, -100, 100, 300], 0)).toBe(1);
    expect(nearestSlide([0, 200, 400], 0)).toBe(0);
    expect(nearestSlide([-400, -200, 0], 0)).toBe(2);
  });
  it('gives ties to the lower index', () => {
    expect(nearestSlide([-50, 50], 0)).toBe(0);
    expect(nearestSlide([10, 10], 10)).toBe(0);
  });
});

describe('stepIndex', () => {
  it('clamps without loop', () => {
    expect(stepIndex(0, -1, 3, false)).toBe(0);
    expect(stepIndex(2, 1, 3, false)).toBe(2);
    expect(stepIndex(1, 1, 3, false)).toBe(2);
    expect(stepIndex(1, -1, 3, false)).toBe(0);
  });
  it('wraps with loop', () => {
    expect(stepIndex(0, -1, 3, true)).toBe(2);
    expect(stepIndex(2, 1, 3, true)).toBe(0);
    expect(stepIndex(1, 1, 3, true)).toBe(2);
  });
  it('returns 0 for no slides', () => {
    expect(stepIndex(0, 1, 0, true)).toBe(0);
  });
});
