// The docs, loaded one page at a time. The list (id, name, summary, exports, framed, fleetOnly)
// is read from the doc sources at build time (site/docs-meta.mjs); a doc's full content (stories,
// code, controls) is its own chunk, fetched when its page opens.
import meta from 'virtual:nish-docs-meta';
import type { DocMeta } from '../docs-meta.mjs';
import type { ComponentDoc } from '../components/types';

export type { DocMeta };

export const DOCS: DocMeta[] = meta;

export function docMeta(id: string): DocMeta | undefined {
  return DOCS.find((d) => d.id === id);
}

const modules = import.meta.glob<Record<string, unknown>>('../components/*.tsx');
const moduleCache = new Map<string, Promise<Record<string, unknown>>>();
const docCache = new Map<string, Promise<ComponentDoc>>();
let allDocs: Promise<ComponentDoc[]> | null = null;

/** One doc file's module (site/components/<file>), loaded once. */
export function loadDocModule(file: string): Promise<Record<string, unknown>> {
  let p = moduleCache.get(file);
  if (!p) {
    const load = modules[`../components/${file}`];
    p = load ? load() : Promise.reject(new Error(`No doc file called ${file}`));
    moduleCache.set(file, p);
  }
  return p;
}

/** One doc, loaded once: the same id always gives the same promise (React's use() needs that). */
export function loadDoc(id: string): Promise<ComponentDoc> {
  let p = docCache.get(id);
  if (!p) {
    const m = docMeta(id);
    p = m ? loadDocModule(m.file).then((mod) => mod[m.exportName] as ComponentDoc) : Promise.reject(new Error(`No doc called ${id}`));
    docCache.set(id, p);
  }
  return p;
}

/** Every doc, in DOCS order (the wall page). */
export function loadAllDocs(): Promise<ComponentDoc[]> {
  allDocs ??= Promise.all(DOCS.map((d) => loadDoc(d.id)));
  return allDocs;
}
