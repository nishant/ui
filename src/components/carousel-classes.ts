// Pure helpers for Carousel: which slide is in view and how the buttons step. No React.

/** The shortest auto-rotation interval, in milliseconds. */
export const CAROUSEL_MIN_INTERVAL = 2000;
/** Dots are shown for up to this many slides; above it a "3 / 12" counter replaces them. */
export const CAROUSEL_MAX_DOTS = 7;

/** Index of the slide whose start edge is closest to the track's start edge. */
export function nearestSlide(starts: readonly number[], origin: number): number {
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < starts.length; i++) {
    const distance = Math.abs(starts[i] - origin);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

/** The slide a step lands on: clamped to the ends, or wrapped around when `loop` is set. */
export function stepIndex(index: number, dir: 1 | -1, count: number, loop: boolean): number {
  if (count <= 0) return 0;
  const next = index + dir;
  if (loop) return (next + count) % count;
  return Math.min(Math.max(next, 0), count - 1);
}
