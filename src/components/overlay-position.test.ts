import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EDGE, GAP, place } from './overlay-position';

// A 360 x 640 phone cover screen.
beforeEach(() => {
  vi.stubGlobal('innerWidth', 360);
  vi.stubGlobal('innerHeight', 640);
});
afterEach(() => vi.unstubAllGlobals());

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;

describe('place', () => {
  it('goes below the anchor when it fits', () => {
    const p = place(rect(100, 100, 100, 40), 120, 100, 'bottom', 'start', GAP);
    expect(p).toEqual({ side: 'bottom', top: 148, left: 100, maxHeight: 640 - 140 - GAP - EDGE });
  });

  it('flips to the top when the bottom edge is too close and the top has more room', () => {
    const p = place(rect(100, 560, 100, 40), 120, 100, 'bottom', 'start', GAP);
    expect(p.side).toBe('top');
    expect(p.top).toBe(560 - GAP - 100);
    expect(p.maxHeight).toBe(560 - GAP - EDGE);
  });

  it('stays on the requested side when the opposite side has no more room', () => {
    // 300px above and below the anchor, a 400px panel: neither side fits, equal room keeps `bottom`.
    const p = place(rect(100, 300, 100, 40), 120, 400, 'bottom', 'start', GAP);
    expect(p.side).toBe('bottom');
    // Pinned inside the viewport rather than hanging off the bottom.
    expect(p.top).toBe(640 - 400 - EDGE);
  });

  it('aligns start at the anchor start, end at the anchor end and center on its middle', () => {
    const r = rect(100, 100, 100, 40);
    expect(place(r, 60, 50, 'bottom', 'start', GAP).left).toBe(100);
    expect(place(r, 60, 50, 'bottom', 'end', GAP).left).toBe(200 - 60);
    expect(place(r, 60, 50, 'bottom', 'center', GAP).left).toBe(150 - 30);
  });

  it('puts a start-aligned panel on the right edge of the anchor in a right-to-left layout', () => {
    const r = rect(200, 100, 100, 40);
    const p = place(r, 120, 50, 'bottom', 'start', GAP, true);
    expect(p.left + 120).toBe(r.right);
    expect(place(r, 120, 50, 'bottom', 'end', GAP, true).left).toBe(r.left);
    // center is the same either way
    expect(place(r, 120, 50, 'bottom', 'center', GAP, true).left).toBe(place(r, 120, 50, 'bottom', 'center', GAP).left);
  });

  it('pins a panel wider than the viewport to the edge constant', () => {
    const p = place(rect(100, 100, 100, 40), 400, 50, 'bottom', 'start', GAP);
    expect(p.left).toBe(EDGE);
  });

  it('keeps the panel inside the right edge', () => {
    const p = place(rect(300, 100, 50, 40), 120, 50, 'bottom', 'start', GAP);
    expect(p.left).toBe(360 - 120 - EDGE);
  });

  it('gives left and right panels the whole viewport height as max-height', () => {
    const p = place(rect(150, 300, 60, 40), 100, 50, 'right', 'center', GAP);
    expect(p.side).toBe('right');
    expect(p.left).toBe(210 + GAP);
    expect(p.maxHeight).toBe(640 - 2 * EDGE);
  });

  it('flips a right panel to the left when the right side is too narrow', () => {
    const p = place(rect(250, 300, 100, 40), 150, 50, 'right', 'center', GAP);
    expect(p.side).toBe('left');
    expect(p.left).toBe(250 - GAP - 150);
  });
});
