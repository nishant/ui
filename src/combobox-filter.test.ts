import { describe, expect, it } from 'vitest';
import { defaultComboboxFilter, matchesComboboxNeedle } from './combobox-filter';

describe('matchesComboboxNeedle', () => {
  it('matches everything for an empty needle', () => {
    expect(matchesComboboxNeedle('apple', undefined, '')).toBe(true);
  });
  it('matches on the label', () => {
    expect(matchesComboboxNeedle('apple', undefined, 'ppl')).toBe(true);
  });
  it('matches on the hint alone', () => {
    expect(matchesComboboxNeedle('apple', 'a fruit', 'fruit')).toBe(true);
  });
  it('rejects when neither matches', () => {
    expect(matchesComboboxNeedle('apple', 'a fruit', 'zzz')).toBe(false);
    expect(matchesComboboxNeedle('apple', undefined, 'zzz')).toBe(false);
  });
});

describe('defaultComboboxFilter', () => {
  const o = { label: 'Apple', hint: 'Red Fruit' };
  it('is case-insensitive and trims the query', () => {
    expect(defaultComboboxFilter(o, '  APP ')).toBe(true);
    expect(defaultComboboxFilter(o, 'red FRUIT')).toBe(true);
    expect(defaultComboboxFilter(o, 'pear')).toBe(false);
  });
  it('matches everything for a blank query', () => {
    expect(defaultComboboxFilter(o, '   ')).toBe(true);
  });
});
