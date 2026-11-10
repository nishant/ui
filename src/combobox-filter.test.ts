import { describe, expect, it } from 'vitest';
import { COMBOBOX_MAX_SHOWN, defaultComboboxFilter } from './combobox-filter';

describe('defaultComboboxFilter', () => {
  it('matches everything for an empty or blank query', () => {
    expect(defaultComboboxFilter({ label: 'Apple' }, '')).toBe(true);
    expect(defaultComboboxFilter({ label: 'Apple' }, '   ')).toBe(true);
  });

  it('is a case-insensitive substring match on the label', () => {
    expect(defaultComboboxFilter({ label: 'Banana' }, 'ANA')).toBe(true);
    expect(defaultComboboxFilter({ label: 'Banana' }, 'xyz')).toBe(false);
  });

  it('matches the hint too', () => {
    expect(defaultComboboxFilter({ label: 'Banana', hint: 'Yellow fruit' }, 'yellow')).toBe(true);
    expect(defaultComboboxFilter({ label: 'Banana' }, 'yellow')).toBe(false);
  });

  it('trims the query but does not split it into words', () => {
    expect(defaultComboboxFilter({ label: 'Big Apple' }, '  big apple ')).toBe(true);
    expect(defaultComboboxFilter({ label: 'Big Apple' }, 'apple big')).toBe(false);
  });

  it('exposes the 50-option display cap', () => {
    expect(COMBOBOX_MAX_SHOWN).toBe(50);
  });
});
