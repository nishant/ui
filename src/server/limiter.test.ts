import { describe, expect, it } from 'vitest';
import { createLimiter } from './limiter';

describe('createLimiter', () => {
  it('allows the first max hits then refuses', () => {
    const l = createLimiter({ max: 3, windowMs: 1000 });
    expect([1, 2, 3, 4, 5].map((i) => l.hit('a', i))).toEqual([true, true, true, false, false]);
    expect(l.hit('a', 1001)).toBe(true);
  });

  it('fail counts toward allowed', () => {
    const l = createLimiter({ max: 2, windowMs: 1000 });
    expect(l.allowed('a', 0)).toBe(true);
    l.fail('a', 0);
    expect(l.allowed('a', 1)).toBe(true);
    l.fail('a', 1);
    expect(l.allowed('a', 2)).toBe(false);
    expect(l.allowed('a', 1000)).toBe(true);
  });

  it('reset forgets a key', () => {
    const l = createLimiter({ max: 1, windowMs: 1000 });
    l.hit('a', 0);
    l.hit('a', 1);
    expect(l.allowed('a', 2)).toBe(false);
    l.reset('a');
    expect(l.allowed('a', 2)).toBe(true);
    expect(l.size).toBe(0);
  });

  it('evicts expired entries first', () => {
    const l = createLimiter({ max: 5, windowMs: 100, cap: 3 });
    l.hit('old', 0);
    l.hit('live1', 50);
    l.hit('live2', 60);
    expect(l.hit('new', 100)).toBe(true);
    expect(l.size).toBe(3);
    for (let i = 0; i < 4; i++) l.hit('live1', 101);
    expect(l.allowed('live1', 102)).toBe(false);
  });

  it('evicts unlocked keys before locked ones', () => {
    const l = createLimiter({ max: 2, windowMs: 1000, cap: 3 });
    l.hit('locked', 0);
    l.hit('locked', 0);
    l.hit('x', 1);
    l.hit('y', 2);
    expect(l.hit('z', 3)).toBe(true);
    expect(l.allowed('locked', 4)).toBe(false);
    expect(l.allowed('x', 4)).toBe(true);
    expect(l.size).toBe(3);
  });

  it('admits a new key when full of locked keys and evicts the oldest locked one', () => {
    const l = createLimiter({ max: 1, windowMs: 1000, cap: 2 });
    for (const k of ['a', 'b']) {
      l.hit(k, 0);
      l.hit(k, 1);
    }
    expect(l.allowed('a', 2)).toBe(false);
    expect(l.hit('c', 3)).toBe(true);
    expect(l.size).toBe(2);
    expect(l.allowed('a', 4)).toBe(true);
    expect(l.allowed('b', 4)).toBe(false);
  });

  it('never exceeds cap', () => {
    const l = createLimiter({ max: 1, windowMs: 10_000, cap: 5 });
    for (let i = 0; i < 100; i++) {
      l.hit(`k${i}`, i);
      l.hit(`k${i}`, i);
      expect(l.size).toBeLessThanOrEqual(5);
    }
  });

  it('cap 0 refuses everything without looping', () => {
    const l = createLimiter({ cap: 0 });
    expect(l.hit('a', 0)).toBe(false);
    expect(l.size).toBe(0);
  });
});
