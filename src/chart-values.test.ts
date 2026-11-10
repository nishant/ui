import { describe, expect, it } from 'vitest';
import { seriesColor } from './chart-values';

describe('seriesColor', () => {
  it.each([
    [0, 1],
    [7, 8],
    [8, 1],
    [9, 2],
    [-1, 8],
    [-9, 8],
    [2.9, 3],
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
    [Number.NEGATIVE_INFINITY, 1],
  ])('seriesColor(%s) is chart-%s', (i, n) => {
    expect(seriesColor(i)).toBe(`var(--nish-chart-${n})`);
  });
});
