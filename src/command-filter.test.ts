import { describe, expect, it } from 'vitest';
import { COMMAND_MAX_RESULTS, filterCommandItems, matchesCommandQuery, rankCommandItems, type CommandFilterItem } from './command-filter';

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

  it('ranks before grouping: rank order is kept inside a group', () => {
    const items = [item('Reopen', { group: 'File' }), item('Open', { group: 'File' }), item('Open tab')];
    expect(ids(filterCommandItems(items, 'open'))).toEqual(['Open tab', 'Open', 'Reopen']);
  });

  it('no longer matches a hint (was matched by the old word-substring filter)', () => {
    expect(ids(filterCommandItems([item('Open', { hint: 'Ctrl+O' })], 'ctrl'))).toEqual([]);
  });

  it('treats a multi-word query as one phrase (the old filter matched words in any order)', () => {
    expect(ids(filterCommandItems([item('Open file')], 'file open'))).toEqual([]);
    expect(ids(filterCommandItems([item('Open file')], 'open f'))).toEqual(['Open file']);
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

  it('caps before grouping, like React: a late ungrouped row is dropped past the cap', () => {
    const grouped = Array.from({ length: 60 }, (_, i) => item(`g${i}`, { group: 'G' }));
    const out = filterCommandItems([...grouped, item('ungrouped')], '');
    expect(out).toHaveLength(50);
    expect(ids(out)).not.toContain('ungrouped');
  });
});

describe('rankCommandItems', () => {
  it('ranks prefix, then word start, then substring, then subsequence', () => {
    const items = [item('xxopxx'), item('a o-p'), item('my op'), item('op thing'), item('o_x_p')];
    const out = rankCommandItems(items, 'op');
    expect(out.map((r) => r.item.id)).toEqual(['op thing', 'my op', 'xxopxx', 'a o-p', 'o_x_p']);
    expect(out[0]!.marks).toEqual([0, 1]);
  });

  it('ranks a keyword-only match after every label match, with no marks', () => {
    const items = [item('Zed', { keywords: ['open'] }), item('Reopen file')];
    const out = rankCommandItems(items, 'open');
    expect(out.map((r) => r.item.id)).toEqual(['Reopen file', 'Zed']);
    expect(out[1]!.marks).toEqual([]);
  });

  it('returns the first rows with no marks for a blank query', () => {
    const many = Array.from({ length: 80 }, (_, i) => item(`r${i}`));
    const out = rankCommandItems(many, '  ');
    expect(out).toHaveLength(COMMAND_MAX_RESULTS);
    expect(out[0]).toEqual({ item: many[0], marks: [] });
  });
});

describe('filterCommandItems parity with the React palette', () => {
  const items: CommandFilterItem[] = [
    item('Open file', { group: 'File', hint: 'Ctrl+O', keywords: ['load'] }),
    item('Open tab', { hint: 'Ctrl+T' }),
    item('Save', { group: 'File', hint: 'Ctrl+S', keywords: ['write', 'open'] }),
    item('Reopen closed', { group: 'Tabs' }),
    item('Close tab', { group: 'Tabs', hint: 'Ctrl+W' }),
    item('Offline mode', { keywords: ['network'] }),
    item('Settings', { group: 'App', hint: 'Ctrl+,' }),
    item('Open settings', { group: 'App', keywords: ['preferences'] }),
  ];
  // The React palette's groupRows: ungrouped first, then groups by first appearance, rank order inside.
  const reactIds = (q: string) => {
    const ranked = rankCommandItems(items, q).map((r) => r.item);
    const keys = [...new Set(ranked.map((i) => i.group ?? null))].sort((a, b) => (a === null ? -1 : b === null ? 1 : 0));
    return keys.flatMap((g) => ranked.filter((i) => (i.group ?? null) === g).map((i) => i.id));
  };
  it.each(['', 'op', 'file', 'of', 'ctrl', 'zzz'])('query %j', (q) => {
    expect(ids(filterCommandItems(items, q))).toEqual(reactIds(q));
  });
  it('a hint-only query matches nothing', () => {
    expect(filterCommandItems(items, 'ctrl')).toEqual([]);
  });
});
