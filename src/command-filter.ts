// Pure helpers shared by the React CommandPalette and the <nish-command-palette> element: no DOM, no imports.

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

/** The old word-substring test: true when every word of `query` appears (case-insensitive) in the
 *  label, hint or keywords. An empty query matches everything. Kept for compatibility; the palette
 *  now uses `rankCommandItems`, which does not search hints. */
export function matchesCommandQuery(item: CommandFilterItem, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.label, item.hint ?? '', ...(item.keywords ?? [])].join('\n').toLowerCase();
  return words.every((w) => haystack.includes(w));
}

function isWordStart(text: string, i: number): boolean {
  return i === 0 || !/[a-z0-9]/i.test(text[i - 1]!);
}

/** Match tier of `q` in `text` (both lowercase): 0 prefix, 1 word start, 2 substring,
 *  3 subsequence; null when no match. `idx` are the matched character positions. */
export function matchText(text: string, q: string): { tier: number; idx: number[] } | null {
  const at = text.indexOf(q);
  if (at >= 0) {
    let tier = at === 0 ? 0 : 2;
    let start = at;
    if (tier === 2) {
      for (let from = at; from >= 0; from = text.indexOf(q, from + 1)) {
        if (isWordStart(text, from)) {
          tier = 1;
          start = from;
          break;
        }
        if (from + 1 >= text.length) break;
      }
    }
    return { tier, idx: Array.from({ length: q.length }, (_, k) => start + k) };
  }
  const idx: number[] = [];
  let from = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, from);
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  return { tier: 3, idx };
}

export interface CommandRank<T> {
  item: T;
  /** Indices of `label` to highlight (empty when only a keyword matched). */
  marks: number[];
}

/** Ranks `items` for `query`: label prefix, word start, substring, subsequence, then keywords
 *  (prefix, word start, substring only). Ties keep input order; at most `COMMAND_MAX_RESULTS`.
 *  A blank query returns the first rows unranked. Hints are not searched. */
export function rankCommandItems<T extends CommandFilterItem>(items: readonly T[], query: string): CommandRank<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, COMMAND_MAX_RESULTS).map((item) => ({ item, marks: [] }));
  const scored: { r: CommandRank<T>; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    const label = matchText(item.label.toLowerCase(), q);
    if (label) {
      scored.push({ r: { item, marks: label.idx }, score: label.tier, order });
      return;
    }
    let best: number | null = null;
    for (const kw of item.keywords ?? []) {
      const m = matchText(kw.toLowerCase(), q);
      // Keywords match by prefix, word start or substring only; a loose subsequence
      // over long keywords (summaries) would match almost any short query.
      if (m && m.tier < 3 && (best === null || m.tier < best)) best = m.tier;
    }
    if (best !== null) scored.push({ r: { item, marks: [] }, score: 4 + best, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, COMMAND_MAX_RESULTS).map((s) => s.r);
}

/** The ranked items for `query`, grouped like the React palette: ungrouped rows first, then each
 *  group in order of first appearance, rank order kept inside a group. */
export function filterCommandItems<T extends CommandFilterItem>(items: readonly T[], query: string): T[] {
  const order: (string | null)[] = [];
  const buckets = new Map<string | null, T[]>();
  for (const { item } of rankCommandItems(items, query)) {
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
  return order.flatMap((g) => buckets.get(g)!);
}
