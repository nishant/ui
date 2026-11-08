import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as S from './strings';

const groups = Object.entries(S).filter(([name]) => name.endsWith('_STRINGS') && name !== 'DEFAULT_STRINGS') as [
  string,
  Record<string, unknown>,
][];

describe('string groups', () => {
  it('(a) key sets are pairwise disjoint', () => {
    const seen = new Map<string, string>();
    for (const [name, group] of groups) {
      for (const key of Object.keys(group)) {
        expect(seen.get(key), `${key} is in both ${seen.get(key)} and ${name}`).toBeUndefined();
        seen.set(key, name);
      }
    }
    expect(groups.length).toBeGreaterThan(20);
  });

  it('(b) their union equals the keys of DEFAULT_STRINGS', () => {
    const union = groups.flatMap(([, g]) => Object.keys(g)).sort();
    expect(union).toEqual(Object.keys(S.DEFAULT_STRINGS).sort());
  });

  it('(c) DEFAULT_STRINGS keeps today\'s values', () => {
    expect(S.DEFAULT_STRINGS.close).toBe('Close');
    expect(S.DEFAULT_STRINGS.more).toBe('More');
    expect(S.DEFAULT_STRINGS.loading).toBe('Loading');
    expect(S.DEFAULT_STRINGS.themeToggleLabel('Light', 'Dark')).toBe('Theme: Light. Switch to Dark');
    expect(S.DEFAULT_STRINGS.inboxHappened(3)).toBe('Happened 3 times');
  });

  // (d) Turn on in T6: change `it.todo(` to `it(` and pass `checkNoDirectHooks` as the body.
  // function checkNoDirectHooks() { ...the helper below... }
  it('(d) no file under src/ other than provider.tsx, strings.ts, index.ts and tests uses the public string hooks', checkNoDirectHooks);
});

/** The body of test (d): a skipped helper so enabling it is a one-line switch (`it('(d) ...', checkNoDirectHooks)`). */
export function checkNoDirectHooks(): void {
  const root = join(__dirname, '..');
  const allowed = new Set(['components/provider.tsx', 'components/strings.ts', 'index.ts']);
  const bad: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) {
        const rel = relative(root, full).split(sep).join('/');
        if (allowed.has(rel)) continue;
        if (/useNishStrings\(|useNishConfig\(|DEFAULT_STRINGS/.test(readFileSync(full, 'utf8'))) bad.push(rel);
      }
    }
  };
  walk(root);
  expect(bad).toEqual([]);
}
