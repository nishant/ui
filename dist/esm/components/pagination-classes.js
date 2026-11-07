// src/components/pagination-classes.ts
function range(from, to) {
  const out = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}
function paginationRange(page, pageCount, siblings = 1, boundaries = 1) {
  const total = Math.max(0, Math.floor(pageCount));
  const sib = Math.max(0, Math.floor(siblings));
  const bnd = Math.max(0, Math.floor(boundaries));
  if (total === 0) return [];
  const slots = sib * 2 + 3 + bnd * 2;
  if (total <= slots) return range(1, total);
  const current = Math.min(Math.max(1, page), total);
  const left = Math.max(current - sib, bnd + 1);
  const right = Math.min(current + sib, total - bnd);
  const dotsLeft = left > bnd + 2;
  const dotsRight = right < total - bnd - 1;
  if (!dotsLeft && dotsRight) {
    return [...range(1, sib * 2 + bnd + 2), "dots-end", ...range(total - bnd + 1, total)];
  }
  if (dotsLeft && !dotsRight) {
    return [...range(1, bnd), "dots-start", ...range(total - (sib * 2 + bnd + 2) + 1, total)];
  }
  return [...range(1, bnd), "dots-start", ...range(left, right), "dots-end", ...range(total - bnd + 1, total)];
}
export {
  paginationRange
};
