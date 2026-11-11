import { describe, expect, it } from 'vitest';
import { sparklineGeometry } from './sparkline-path';

const count = (d: string) => (d.match(/[ML]/g) ?? []).length;

describe('sparklineGeometry decimation', () => {
  it('limits a 10k series to 2 points per pixel and keeps the extremes', () => {
    const v = Array.from({ length: 10000 }, (_, i) => Math.sin(i / 50) * 10);
    v[5000] = 100;
    v[7000] = -100;
    const g = sparklineGeometry(v, 120, 30);
    expect(count(g.lines[0])).toBeLessThanOrEqual(240);
    // the top (y=2) and bottom (y=28) of the box are reached by the spike and the dip
    expect(g.lines[0]).toMatch(/,2(?![\d.])/);
    expect(g.lines[0]).toMatch(/,28(?![\d.])/);
  });
  it('does not throw on 300k values', () => {
    const v = Array.from({ length: 300000 }, (_, i) => i % 97);
    expect(() => sparklineGeometry(v, 120, 30)).not.toThrow();
  });
  it('leaves short series alone', () => {
    expect(count(sparklineGeometry([1, 2, 3], 120, 30).lines[0])).toBe(3);
  });
});
