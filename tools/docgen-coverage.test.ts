import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { docgen } from '../site/docgen.mjs';
import { COMPONENT_DOCS } from '../site/components/index';

// A docs page that names something docgen does not know crashes or loses its props table.
describe('docs pages vs docgen', () => {
  const data = docgen(resolve(__dirname, '..')) as {
    components: Record<string, unknown>;
    functions: Record<string, unknown>;
    interfaces: Record<string, unknown>;
  };

  it('every api name exists in docgen', () => {
    const missing: string[] = [];
    for (const doc of COMPONENT_DOCS) {
      for (const n of doc.api?.functions ?? []) if (!data.functions[n]) missing.push(`${doc.id}: function ${n}`);
      for (const n of doc.api?.interfaces ?? []) if (!data.interfaces[n]) missing.push(`${doc.id}: interface ${n}`);
    }
    expect(missing).toEqual([]);
  }, 60000);

  it('split-stage and media-row exports have props tables', () => {
    for (const id of ['split-stage', 'media-row']) {
      const doc = COMPONENT_DOCS.find((d) => d.id === id)!;
      for (const n of doc.exports) expect(data.components[n], `${id}: ${n}`).toBeTruthy();
    }
  }, 60000);
});
