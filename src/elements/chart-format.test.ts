import { describe, expect, it } from 'vitest';
import { defaultNum, nearestIndex, normalizeBars, normalizePoints, paddedRange, parseFormat } from './chart-format';

describe('parseFormat', () => {
  it('falls back for empty, null and unknown specs', () => {
    const fb = (v: number): string => `fb${v}`;
    expect(parseFormat('', fb)(1)).toBe('fb1');
    expect(parseFormat(null, fb)(1)).toBe('fb1');
    expect(parseFormat('wat', fb)(1)).toBe('fb1');
    expect(parseFormat(undefined)(1234)).toBe(defaultNum(1234));
  });

  it('percent takes a digit count and ignores bad ones', () => {
    expect(parseFormat('percent:0')(0.5)).toBe('50%');
    expect(parseFormat('percent:2')(0.5)).toBe('50.00%');
    expect(parseFormat('percent')(0.5)).toBe(parseFormat('percent:bad')(0.5));
    expect(parseFormat('percent:99')(0.5)).toBe(parseFormat('percent')(0.5));
  });

  it('currency uses the code, USD by default', () => {
    expect(parseFormat('currency:EUR')(5)).toContain('€');
    expect(parseFormat('currency')(5)).toContain('$');
  });
});

describe('paddedRange and nearestIndex', () => {
  it('pads a range by 6% and widens an equal one', () => {
    const [lo, hi] = paddedRange(0, 100);
    expect(lo).toBeCloseTo(-6);
    expect(hi).toBeCloseTo(106);
    expect(paddedRange(100, 100)).toEqual([95, 105]);
    expect(paddedRange(0, 0)).toEqual([-1, 1]);
  });

  it('finds the nearest index, the lower one on a tie', () => {
    expect(nearestIndex([0, 10, 20], 4)).toBe(0);
    expect(nearestIndex([0, 10, 20], 16)).toBe(2);
    expect(nearestIndex([0, 10], 5)).toBe(0);
    expect(nearestIndex([7], 100)).toBe(0);
  });
});

describe('normalizePoints and normalizeBars', () => {
  it('reads numbers, pairs and objects, keeping null gaps', () => {
    expect(normalizePoints([3, null, 5])).toEqual([{ x: 0, y: 3 }, { x: 1, y: null }, { x: 2, y: 5 }]);
    expect(normalizePoints([[1, 2], [3, null]])).toEqual([{ x: 1, y: 2 }, { x: 3, y: null }]);
    expect(normalizePoints([{ x: 4, y: 9 }, { y: 1 }])).toEqual([{ x: 4, y: 9 }]);
    expect(normalizePoints('nope')).toEqual([]);
  });

  it('reads bars from numbers, pairs and objects', () => {
    expect(normalizeBars([3, null])).toEqual([{ label: '1', value: 3 }, { label: '2', value: 0 }]);
    expect(normalizeBars([['Mon', 3]])).toEqual([{ label: 'Mon', value: 3 }]);
    expect(normalizeBars([{ label: 'A', value: '7' }, { value: 2 }])).toEqual([{ label: 'A', value: 7 }, { label: '2', value: 2 }]);
    expect(normalizeBars(null)).toEqual([]);
  });
});
