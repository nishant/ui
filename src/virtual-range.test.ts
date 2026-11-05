import { describe, expect, it } from 'vitest';
import { buildOffsets, extendRange, indexAt, sameRange, scrollDelta, visibleRange, withPinned } from './virtual-range';

describe('buildOffsets', () => {
  it('stacks fixed sizes and ends with the total', () => {
    expect(Array.from(buildOffsets(4, () => 10))).toEqual([0, 10, 20, 30, 40]);
  });
  it('uses the size function per index', () => {
    expect(Array.from(buildOffsets(3, (i) => (i + 1) * 10))).toEqual([0, 10, 30, 60]);
  });
  it('puts the gap between rows and not after the last one', () => {
    expect(Array.from(buildOffsets(3, () => 10, 5))).toEqual([0, 15, 30, 40]);
  });
  it('counts negative sizes as 0', () => {
    expect(Array.from(buildOffsets(3, (i) => (i === 1 ? -20 : 10)))).toEqual([0, 10, 10, 20]);
  });
  it('handles count 0', () => {
    expect(Array.from(buildOffsets(0, () => 10, 5))).toEqual([0]);
  });
});

describe('indexAt', () => {
  const o = buildOffsets(4, () => 10);
  it('finds rows', () => {
    expect(indexAt(o, 0)).toBe(0);
    expect(indexAt(o, 15)).toBe(1);
    expect(indexAt(o, 20)).toBe(2);
    expect(indexAt(o, 19.9)).toBe(1);
  });
  it('clamps below and past the end', () => {
    expect(indexAt(o, -50)).toBe(0);
    expect(indexAt(o, 40)).toBe(3);
    expect(indexAt(o, 9999)).toBe(3);
  });
  it('returns -1 for count 0', () => {
    expect(indexAt(buildOffsets(0, () => 10), 5)).toBe(-1);
  });
});

describe('visibleRange', () => {
  const o = buildOffsets(100, () => 10);
  it('widens a mid-list window by overscan', () => {
    expect(visibleRange(o, 300, 400, 2)).toEqual({ start: 28, end: 42 });
  });
  it('clamps at the start and the end', () => {
    expect(visibleRange(o, 0, 50, 3)).toEqual({ start: 0, end: 8 });
    expect(visibleRange(o, 950, 1000, 3)).toEqual({ start: 92, end: 100 });
  });
  it('handles a window above the list', () => {
    expect(visibleRange(o, -300, -100, 4)).toEqual({ start: 0, end: 4 });
    expect(visibleRange(o, -300, 0, 400)).toEqual({ start: 0, end: 100 });
  });
  it('handles a window below the list', () => {
    expect(visibleRange(o, 1000, 1200, 4)).toEqual({ start: 96, end: 100 });
    expect(visibleRange(o, 5000, 6000, 400)).toEqual({ start: 0, end: 100 });
  });
  it('excludes a row that only touches the bottom edge', () => {
    expect(visibleRange(o, 0, 30, 0)).toEqual({ start: 0, end: 3 });
  });
  it('returns an empty range for count 0', () => {
    expect(visibleRange(buildOffsets(0, () => 10), 0, 100, 5)).toEqual({ start: 0, end: 0 });
  });
});

describe('withPinned', () => {
  it('returns the range when the pin is inside it, null or invalid', () => {
    expect(withPinned({ start: 2, end: 5 }, 3, 10)).toEqual([2, 3, 4]);
    expect(withPinned({ start: 2, end: 5 }, null, 10)).toEqual([2, 3, 4]);
    expect(withPinned({ start: 2, end: 5 }, 12, 10)).toEqual([2, 3, 4]);
    expect(withPinned({ start: 2, end: 5 }, -1, 10)).toEqual([2, 3, 4]);
    expect(withPinned({ start: 2, end: 5 }, 1.5, 10)).toEqual([2, 3, 4]);
  });
  it('adds a pin outside the range in ascending order', () => {
    expect(withPinned({ start: 2, end: 5 }, 0, 10)).toEqual([0, 2, 3, 4]);
    expect(withPinned({ start: 2, end: 5 }, 9, 10)).toEqual([2, 3, 4, 9]);
    expect(withPinned({ start: 2, end: 5 }, 5, 10)).toEqual([2, 3, 4, 5]);
  });
});

describe('extendRange', () => {
  const r = { start: 50, end: 60 };
  it('keeps the range when the index is inside or null', () => {
    expect(extendRange(r, 55, 100, 200)).toBe(r);
    expect(extendRange(r, null, 100, 200)).toBe(r);
    expect(extendRange(r, 500, 100, 200)).toBe(r);
  });
  it('extends to an index within maxGap', () => {
    expect(extendRange(r, 20, 100, 200)).toEqual({ start: 20, end: 60 });
    expect(extendRange(r, 150, 100, 200)).toEqual({ start: 50, end: 151 });
  });
  it('leaves the range when the index is farther than maxGap', () => {
    expect(extendRange(r, 20, 10, 200)).toBe(r);
    expect(extendRange(r, 150, 10, 200)).toBe(r);
  });
});

describe('scrollDelta', () => {
  it('start, end and center', () => {
    expect(scrollDelta(500, 40, 100, 400, 'start')).toBe(400);
    expect(scrollDelta(500, 40, 100, 400, 'end')).toBe(140);
    expect(scrollDelta(500, 40, 100, 400, 'center')).toBe(270);
  });
  it('auto is 0 when the row is fully visible', () => {
    expect(scrollDelta(150, 40, 100, 400, 'auto')).toBe(0);
    expect(scrollDelta(100, 300, 100, 400, 'auto')).toBe(0);
  });
  it('auto scrolls up to the start for a row above', () => {
    expect(scrollDelta(50, 40, 100, 400, 'auto')).toBe(-50);
  });
  it('auto scrolls down to the end for a row below', () => {
    expect(scrollDelta(500, 40, 100, 400, 'auto')).toBe(140);
  });
  it('auto aligns the start of a row taller than the view', () => {
    expect(scrollDelta(500, 600, 100, 400, 'auto')).toBe(400);
  });
});

describe('sameRange', () => {
  it('compares start and end', () => {
    expect(sameRange({ start: 1, end: 2 }, { start: 1, end: 2 })).toBe(true);
    expect(sameRange({ start: 1, end: 2 }, { start: 1, end: 3 })).toBe(false);
    expect(sameRange({ start: 0, end: 2 }, { start: 1, end: 2 })).toBe(false);
  });
});
