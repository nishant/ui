// Pure helpers for the <nish-command-palette> element: no DOM, no imports.

export interface CommandFilterItem {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  keywords?: string[];
}

/** Most rows shown at once (the React CommandPalette's limit). */
export const COMMAND_MAX_RESULTS = 50;
/** Delay before a typed query is reported to the page. */
export const COMMAND_QUERY_DEBOUNCE_MS = 200;

/** True when every word of `query` appears (case-insensitive) in the label, hint or keywords.
 *  An empty query matches everything. */
export function matchesCommandQuery(item: CommandFilterItem, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.label, item.hint ?? '', ...(item.keywords ?? [])].join('\n').toLowerCase();
  return words.every((w) => haystack.includes(w));
}

/** The items that match `query`, at most `COMMAND_MAX_RESULTS`, grouped: ungrouped rows first,
 *  then each group in order of first appearance, items keeping their order inside a group. */
export function filterCommandItems<T extends CommandFilterItem>(items: readonly T[], query: string): T[] {
  const order: (string | null)[] = [];
  const buckets = new Map<string | null, T[]>();
  for (const item of items) {
    if (!matchesCommandQuery(item, query)) continue;
    const g = item.group ?? null;
    let bucket = buckets.get(g);
    if (!bucket) {
      bucket = [];
      buckets.set(g, bucket);
      order.push(g);
    }
    bucket.push(item);
  }
  order.sort((a, b) => (a === null ? -1 : b === null ? 1 : 0));
  return order.flatMap((g) => buckets.get(g)!).slice(0, COMMAND_MAX_RESULTS);
}
