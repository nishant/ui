// src/command-filter.ts
var COMMAND_MAX_RESULTS = 50;
var COMMAND_QUERY_DEBOUNCE_MS = 200;
function matchesCommandQuery(item, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.label, item.hint ?? "", ...item.keywords ?? []].join("\n").toLowerCase();
  return words.every((w) => haystack.includes(w));
}
function filterCommandItems(items, query) {
  const order = [];
  const buckets = /* @__PURE__ */ new Map();
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
  order.sort((a, b) => a === null ? -1 : b === null ? 1 : 0);
  return order.flatMap((g) => buckets.get(g)).slice(0, COMMAND_MAX_RESULTS);
}
export {
  COMMAND_MAX_RESULTS,
  COMMAND_QUERY_DEBOUNCE_MS,
  filterCommandItems,
  matchesCommandQuery
};
