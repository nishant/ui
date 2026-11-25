// src/command-filter.ts
var COMMAND_MAX_RESULTS = 50;
var COMMAND_QUERY_DEBOUNCE_MS = 200;
function matchesCommandQuery(item, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [item.label, item.hint ?? "", ...item.keywords ?? []].join("\n").toLowerCase();
  return words.every((w) => haystack.includes(w));
}
function isWordStart(text, i) {
  return i === 0 || !/[a-z0-9]/i.test(text[i - 1]);
}
function matchText(text, q) {
  const at = text.indexOf(q);
  if (at >= 0) {
    let tier = at === 0 ? 0 : 2;
    let start = at;
    if (tier === 2) {
      for (let from2 = at; from2 >= 0; from2 = text.indexOf(q, from2 + 1)) {
        if (isWordStart(text, from2)) {
          tier = 1;
          start = from2;
          break;
        }
        if (from2 + 1 >= text.length) break;
      }
    }
    return { tier, idx: Array.from({ length: q.length }, (_, k) => start + k) };
  }
  const idx = [];
  let from = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, from);
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  return { tier: 3, idx };
}
function rankCommandItems(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, COMMAND_MAX_RESULTS).map((item) => ({ item, marks: [] }));
  const scored = [];
  items.forEach((item, order) => {
    const label = matchText(item.label.toLowerCase(), q);
    if (label) {
      scored.push({ r: { item, marks: label.idx }, score: label.tier, order });
      return;
    }
    let best = null;
    for (const kw of item.keywords ?? []) {
      const m = matchText(kw.toLowerCase(), q);
      if (m && m.tier < 3 && (best === null || m.tier < best)) best = m.tier;
    }
    if (best !== null) scored.push({ r: { item, marks: [] }, score: 4 + best, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, COMMAND_MAX_RESULTS).map((s) => s.r);
}
function filterCommandItems(items, query) {
  const order = [];
  const buckets = /* @__PURE__ */ new Map();
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
  order.sort((a, b) => a === null ? -1 : b === null ? 1 : 0);
  return order.flatMap((g) => buckets.get(g));
}
export {
  COMMAND_MAX_RESULTS,
  COMMAND_QUERY_DEBOUNCE_MS,
  filterCommandItems,
  matchText,
  matchesCommandQuery,
  rankCommandItems
};
