'use client';
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { isRtl, useIsoLayoutEffect } from './client';
import { CAROUSEL_MAX_DOTS, CAROUSEL_MIN_INTERVAL, nearestSlide, stepIndex } from './carousel-classes';
import { useMediaQuery } from './hooks';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from './icons';
import { IconButton } from './primitives';
import { useStrings } from './provider';
import { CAROUSEL_STRINGS } from './strings';

export interface CarouselProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'aria-label'> {
  /** The root <section>. */
  ref?: Ref<HTMLElement>;
  /** Required: names the carousel ("Featured trips"). */
  'aria-label': string;
  /** One child per slide. */
  children: ReactNode;
  /** The current slide (controlled), from 0. */
  index?: number;
  /** The first slide of an uncontrolled carousel. Default 0. */
  defaultIndex?: number;
  /** Called with the new index after a button, a key, a swipe or rotation. */
  onIndexChange?: (index: number) => void;
  /** Width of each slide, any CSS length. Default "100%"; "85%" shows the next slide peeking in. */
  slideWidth?: string;
  /** Previous at the first slide goes to the last, and next at the last goes to the first. Default false. */
  loop?: boolean;
  /** Rotate every this many milliseconds (at least 2000). Off by default. */
  autoPlay?: number;
  /** Dots to pick a slide. Default: shown when there are 7 slides or fewer, a "3 / 12" counter otherwise. */
  indicators?: boolean;
  /** Names each slide for screen readers. Default "1 of 5". */
  slideLabel?: (n: number, count: number) => string;
  /** Accessible name of the previous button. Default "Previous slide". */
  previousLabel?: string;
  /** Accessible name of the next button. Default "Next slide". */
  nextLabel?: string;
  /** Extra classes for the carousel root. */
  className?: string;
}

/** How long a button, key or focus move outranks the scroll position while the browser animates. */
const SETTLE_MS = 700;

/** A scroll-snap carousel: swipe, previous and next buttons, slide dots, arrow keys and optional auto-rotation. */
export function Carousel({
  'aria-label': ariaLabel,
  children,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  slideWidth = '100%',
  loop = false,
  autoPlay,
  indicators,
  slideLabel,
  previousLabel,
  nextLabel,
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...rest
}: CarouselProps) {
  const strings = useStrings(CAROUSEL_STRINGS);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const slides = Children.toArray(children);
  const count = slides.length;
  const label = slideLabel ?? strings.slideLabel;
  const prevName = previousLabel ?? strings.previousSlide;
  const nextName = nextLabel ?? strings.nextSlide;

  const [ownIndex, setOwnIndex] = useState(defaultIndex);
  const index = count === 0 ? 0 : Math.min(Math.max(indexProp ?? ownIndex, 0), count - 1);
  const canPrev = loop || index > 0;
  const canNext = loop || index < count - 1;
  const coarse = useMediaQuery('(pointer: coarse)');
  const [slotWidth, setSlotWidth] = useState(0);
  // Dots are 32px (44px on touch). Past what the middle slot holds they give way to the counter,
  // so they never run under the arrows. indicators={true} forces them.
  const dotsFit = slotWidth === 0 || count * (coarse ? 44 : 32) <= slotWidth;
  const showDots = indicators ?? (count <= CAROUSEL_MAX_DOTS && dotsFit);
  const [announce, setAnnounce] = useState('');

  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const viewRef = useRef(0); // the slide the track shows or is scrolling to
  const targetRef = useRef<{ index: number; at: number } | null>(null);
  const frameRef = useRef(0);
  const slotCleanup = useRef<(() => void) | null>(null);
  const latest = useRef({ onIndexChange, reduced, label, count });
  useIsoLayoutEffect(() => {
    latest.current = { onIndexChange, reduced, label, count };
    indexRef.current = index;
  });

  const [hovered, setHovered] = useState(false);
  const [focusedIn, setFocusedIn] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [playState, setPlayState] = useState<'auto' | 'on' | 'off'>('auto');
  const playing = playState === 'on' || (playState === 'auto' && !reduced);
  const paused = hovered || focusedIn || hidden;
  const interval = Math.max(autoPlay ?? 0, CAROUSEL_MIN_INTERVAL);
  const rotating = !!autoPlay && count > 1 && playing && !paused;

  const setCurrent = useCallback((i: number) => {
    if (i === indexRef.current) return;
    indexRef.current = i;
    setOwnIndex(i);
    latest.current.onIndexChange?.(i);
  }, []);

  const scrollToSlide = useCallback((i: number, behavior: ScrollBehavior) => {
    viewRef.current = i;
    targetRef.current = { index: i, at: Date.now() };
    const el = trackRef.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior, block: 'nearest', inline: 'start' });
  }, []);

  const goTo = useCallback(
    (i: number) => {
      setCurrent(i);
      // Announced from here (buttons, dots, keys, rotation), never from scroll or focus syncing.
      setAnnounce(latest.current.label(i + 1, latest.current.count));
      scrollToSlide(i, latest.current.reduced ? 'auto' : 'smooth');
    },
    [setCurrent, scrollToSlide],
  );
  const goToRef = useRef(goTo);
  useIsoLayoutEffect(() => {
    goToRef.current = goTo;
  });

  // A controlled index (or a defaultIndex past 0) that differs from the slide in view scrolls there,
  // without calling onIndexChange.
  const mounted = useRef(false);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (count === 0 || index === viewRef.current) return;
    scrollToSlide(index, first || latest.current.reduced ? 'auto' : 'smooth');
  }, [index, count, scrollToSlide]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rtl = isRtl(track);
    const edge = (el: Element) => {
      const r = el.getBoundingClientRect();
      return rtl ? r.right : r.left;
    };
    const n = nearestSlide(Array.from(track.children, edge), edge(track));
    if (n < 0) return;
    const target = targetRef.current;
    if (target) {
      if (n === target.index) targetRef.current = null;
      else if (Date.now() - target.at < SETTLE_MS) return;
      else targetRef.current = null;
    }
    viewRef.current = n;
    setCurrent(n);
  }, [setCurrent]);

  const onScroll = () => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      measure();
    });
  };
  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const setFromFocus = useCallback(
    (i: number) => {
      viewRef.current = i;
      targetRef.current = { index: i, at: Date.now() };
      setCurrent(i);
    },
    [setCurrent],
  );

  const onTrackKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || count < 2) return;
    const rtl = isRtl(e.currentTarget);
    let to: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const forward = (e.key === 'ArrowRight') !== rtl;
      if (forward ? canNext : canPrev) to = stepIndex(index, forward ? 1 : -1, count, loop);
    } else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = count - 1;
    else return;
    e.preventDefault();
    if (to !== null) goTo(to);
  };

  // Pause while the page is hidden.
  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === 'hidden');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // Rotation: one timeout, re-armed on every index change. It always wraps.
  useEffect(() => {
    if (!rotating) return;
    const id = setTimeout(() => goToRef.current(index === count - 1 ? 0 : index + 1), interval);
    return () => clearTimeout(id);
  }, [rotating, index, count, interval]);

  const empty = count === 0;
  const tooFast = autoPlay !== undefined && autoPlay > 0 && autoPlay < CAROUSEL_MIN_INTERVAL;
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && empty) console.warn('Carousel: no slides');
  }, [empty]);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && tooFast) {
      console.warn(`Carousel: autoPlay must be at least ${CAROUSEL_MIN_INTERVAL} ms; using ${CAROUSEL_MIN_INTERVAL}.`);
    }
  }, [tooFast]);

  const handlePointerEnter = (e: PointerEvent<HTMLElement>) => {
    setHovered(true);
    onPointerEnter?.(e);
  };
  const handlePointerLeave = (e: PointerEvent<HTMLElement>) => {
    setHovered(false);
    onPointerLeave?.(e);
  };
  const handleFocus = (e: FocusEvent<HTMLElement>) => {
    setFocusedIn(true);
    onFocus?.(e);
  };
  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusedIn(false);
    onBlur?.(e);
  };

  const slotRef = useCallback((el: HTMLDivElement | null) => {
    slotCleanup.current?.();
    slotCleanup.current = null;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setSlotWidth(el.clientWidth));
    ro.observe(el);
    setSlotWidth(el.clientWidth);
    slotCleanup.current = () => ro.disconnect();
  }, []);

  const togglePlay = () => setPlayState(playing ? 'off' : 'on');
  const arrowClass = 'aria-disabled:cursor-not-allowed aria-disabled:opacity-40';

  return (
    <section
      {...rest}
      ref={ref}
      aria-roledescription={strings.carouselRole}
      aria-label={ariaLabel}
      data-state={rotating ? 'active' : 'inactive'}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('flex w-full min-w-0 flex-col gap-2', className)}
    >
      <div aria-live={rotating ? 'off' : 'polite'} aria-atomic="true" className="sr-only">
        {announce}
      </div>
      <div className="relative min-w-0">
        {autoPlay && count > 1 ? (
          <IconButton
            label={playing ? strings.stopRotation : strings.startRotation}
            size="sm"
            variant="subtle"
            onClick={togglePlay}
            className="absolute end-2 top-2 z-[1] rounded-full shadow-pop"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
        ) : null}
        <div
          ref={trackRef}
          tabIndex={0}
          role="group"
          aria-label={ariaLabel}
          onKeyDown={onTrackKey}
          onScroll={onScroll}
          className="flex w-full min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription={strings.slideRole}
              aria-label={label(i + 1, count)}
              data-index={i}
              data-state={i === index ? 'active' : 'inactive'}
              onFocus={() => setFromFocus(i)}
              className="min-w-0 shrink-0 snap-start"
              style={{ width: slideWidth }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      {count > 1 ? (
        <div className="flex items-center gap-2">
          <IconButton
            label={prevName}
            size="sm"
            aria-disabled={!canPrev || undefined}
            onClick={() => canPrev && goTo(stepIndex(index, -1, count, loop))}
            className={arrowClass}
          >
            <ChevronLeftIcon className="rtl:-scale-x-100" />
          </IconButton>
          <div ref={slotRef} className="flex min-w-0 flex-1 justify-center">
            {showDots ? (
              <div role="group" aria-label={strings.slidePicker} className="flex">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={strings.goToSlide(i + 1)}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => goTo(i)}
                    className="flex size-8 items-center justify-center rounded-full min-w-0 pointer-coarse:size-11"
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full transition-colors',
                        i === index
                          ? 'bg-th-accent forced-colors:bg-[Highlight]'
                          : 'bg-th-line-strong forced-colors:bg-[ButtonText]',
                      )}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs tabular-nums text-th-hi3" aria-hidden="true">
                {index + 1} / {count}
              </span>
            )}
          </div>
          <IconButton
            label={nextName}
            size="sm"
            aria-disabled={!canNext || undefined}
            onClick={() => canNext && goTo(stepIndex(index, 1, count, loop))}
            className={arrowClass}
          >
            <ChevronRightIcon className="rtl:-scale-x-100" />
          </IconButton>
        </div>
      ) : null}
    </section>
  );
}
