import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { docsMeta } from '../site/docs-meta.mjs';
import { COMPONENT_DOCS } from '../site/components/index';

const root = resolve(__dirname, '..');

const clean = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

// The site shell lists pages from docs-meta without importing them; it must agree with the real docs.
describe('docs-meta', () => {
  const meta = docsMeta(root);

  it('matches COMPONENT_DOCS, in the same order', () => {
    const real = COMPONENT_DOCS.map((d) => clean({ id: d.id, name: d.name, summary: d.summary, exports: d.exports, framed: d.framed, fleetOnly: d.fleetOnly }));
    const read = meta.map((m) => clean({ id: m.id, name: m.name, summary: m.summary, exports: m.exports, framed: m.framed, fleetOnly: m.fleetOnly }));
    expect(read).toEqual(real);
  });

  it('points at doc files that exist', () => {
    for (const m of meta) expect(existsSync(join(root, 'site', 'components', m.file)), m.file).toBe(true);
  });
});
