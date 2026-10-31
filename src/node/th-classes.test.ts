// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { unknownThClasses } from './th-classes';

describe('unknownThClasses', () => {
  it('reports colors th does not define', () => {
    expect(unknownThClasses('bg-th-hover')).toEqual(['bg-th-hover']);
    expect(unknownThClasses('p-2 text-th-hi1 flex')).toEqual(['text-th-hi1']);
    expect(unknownThClasses('"bg-th-surface-2"')).toEqual(['bg-th-surface-2']);
    expect(unknownThClasses('md:hover:bg-th-nope/50')).toEqual(['md:hover:bg-th-nope/50']);
    expect(unknownThClasses('color: var(--color-th-nope)')).toEqual(['--color-th-nope']);
  });

  it('accepts defined colors', () => {
    expect(unknownThClasses('bg-th-elevated')).toEqual([]);
    expect(unknownThClasses('hover:bg-th-accent-soft/50')).toEqual([]);
    expect(unknownThClasses('text-th-hi2')).toEqual([]);
    expect(unknownThClasses('border-th-line-strong')).toEqual([]);
    expect(unknownThClasses('var(--color-th-accent)')).toEqual([]);
  });

  it('ignores prose that is not a class', () => {
    expect(unknownThClasses('the th-hover state')).toEqual([]);
  });
});
