import { describe, expect, it } from 'vitest';
import { COMMAND_MAX_RESULTS, filterCommandItems, matchesCommandQuery, type CommandFilterItem } from './command-filter';

const item = (id: string, extra: Partial<CommandFilterItem> = {}): CommandFilterItem => ({ id, label: id, ...extra });
const ids = (xs: CommandFilterItem[]) => xs.map((x) => x.id);

describe('matchesCommandQuery', () => {
  it('matches everything for an empty or blank query', () => {
    expect(matchesCommandQuery(item('Open'), '')).toBe(true);
    expect(matchesCommandQuery(item('Open'), '   ')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(matchesCommandQuery(item('Open file'), 'OPEN')).toBe(true);
  });

  it('needs every word (AND), in any order', () => {
    const open = item('Open file');
    expect(matchesCommandQuery(open, 'file open')).toBe(true);
    expect(matchesCommandQuery(open, 'open save')).toBe(false);
  });

  it('matches the hint and the keywords', () => {
    const open = item('Open', { hint: 'Ctrl+O', keywords: ['load', 'import'] });
    expect(matchesCommandQuery(open, 'ctrl')).toBe(true);
    expect(matchesCommandQuery(open, 'import')).toBe(true);
    expect(matchesCommandQuery(open, 'open ctrl import')).toBe(true);
    expect(matchesCommandQuery(open, 'export')).toBe(false);
  });

  it('does not match the id or group', () => {
    expect(matchesCommandQuery({ id: 'zzz', label: 'Open', group: 'Files' }, 'files')).toBe(false);
    expect(matchesCommandQuery({ id: 'zzz', label: 'Open' }, 'zzz')).toBe(false);
  });
});

describe('filterCommandItems', () => {
  it('returns every item for an empty query, in input order when nothing is grouped', () => {
    expect(ids(filterCommandItems([item('b'), item('a'), item('c')], ''))).toEqual(['b', 'a', 'c']);
  });

  it('orders groups by first appearance, ungrouped rows first, items keeping their order', () => {
    const items = [
      item('g2a', { group: 'Two' }),
      item('g1a', { group: 'One' }),
      item('u1'),
      item('g2b', { group: 'Two' }),
      item('u2'),
      item('g1b', { group: 'One' }),
    ];
    expect(ids(filterCommandItems(items, ''))).toEqual(['u1', 'u2', 'g2a', 'g2b', 'g1a', 'g1b']);
  });

  it('applies the query before grouping', () => {
    const items = [item('Open', { group: 'File' }), item('Close', { group: 'File' }), item('Open tab')];
    expect(ids(filterCommandItems(items, 'open'))).toEqual(['Open tab', 'Open']);
  });

  it('returns nothing when no item matches', () => {
    expect(filterCommandItems([item('a')], 'zzz')).toEqual([]);
  });

  it('caps the result at COMMAND_MAX_RESULTS', () => {
    expect(COMMAND_MAX_RESULTS).toBe(50);
    const many = Array.from({ length: 80 }, (_, i) => item(`row ${i}`));
    const out = filterCommandItems(many, '');
    expect(out).toHaveLength(50);
    expect(out[49]!.id).toBe('row 49');
  });

  it('cuts the cap after grouping, so ungrouped rows survive and late rows are dropped', () => {
    const grouped = Array.from({ length: 60 }, (_, i) => item(`g${i}`, { group: 'G' }));
    const out = filterCommandItems([...grouped, item('ungrouped')], '');
    expect(out[0]!.id).toBe('ungrouped');
    expect(out).toHaveLength(50);
  });
});
