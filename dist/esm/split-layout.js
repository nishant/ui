// src/split-layout.ts
var MAX_PANES = 4;
var NARROW_MAX = 2;
var NARROW_BREAKPOINT = 640;
var leaf = (slot) => ({ type: "leaf", slot });
var row = (sizes, children) => ({
  type: "split",
  dir: "row",
  sizes,
  children
});
var col = (sizes, children) => ({
  type: "split",
  dir: "col",
  sizes,
  children
});
var equal = (n) => Array.from({ length: n }, () => 1 / n);
var leaves = (...slots) => slots.map(leaf);
function presetsFor(count) {
  switch (count) {
    case 1:
      return [
        {
          id: "single",
          label: "Single",
          hint: "One stream",
          build: () => leaf(0)
        }
      ];
    case 2:
      return [
        {
          id: "side",
          label: "Slice",
          hint: "Side by side",
          build: () => row([0.5, 0.5], leaves(0, 1))
        },
        {
          id: "stack",
          label: "Stack",
          hint: "One above the other",
          build: () => col([0.5, 0.5], leaves(0, 1))
        },
        {
          id: "main-side",
          label: "Main 1",
          hint: "One big, one small on the right",
          build: () => row([0.7, 0.3], leaves(0, 1))
        }
      ];
    case 3:
      return [
        {
          id: "main-right",
          label: "Main 1",
          hint: "One big, two on the right",
          build: () => row([0.66, 0.34], [leaf(0), col([0.5, 0.5], leaves(1, 2))])
        },
        {
          id: "main-bottom",
          label: "Main 2",
          hint: "One big, two below",
          build: () => col([0.66, 0.34], [leaf(0), row([0.5, 0.5], leaves(1, 2))])
        },
        {
          id: "cols-3",
          label: "Slice",
          hint: "Three side by side",
          build: () => row(equal(3), leaves(0, 1, 2))
        },
        {
          id: "rows-3",
          label: "Stack",
          hint: "Three stacked",
          build: () => col(equal(3), leaves(0, 1, 2))
        }
      ];
    case 4:
      return [
        {
          id: "grid",
          label: "Grid",
          hint: "Two by two",
          build: () => col(
            [0.5, 0.5],
            [row([0.5, 0.5], leaves(0, 1)), row([0.5, 0.5], leaves(2, 3))]
          )
        },
        {
          id: "main-right",
          label: "Main 1",
          hint: "One big, three on the right",
          build: () => row([0.7, 0.3], [leaf(0), col(equal(3), leaves(1, 2, 3))])
        },
        {
          id: "main-bottom",
          label: "Main 2",
          hint: "One big, three below",
          build: () => col([0.7, 0.3], [leaf(0), row(equal(3), leaves(1, 2, 3))])
        },
        {
          id: "cols-4",
          label: "Slice",
          hint: "Four side by side",
          build: () => row(equal(4), leaves(0, 1, 2, 3))
        }
      ];
  }
}
function defaultPreset(count, aspect) {
  switch (count) {
    case 1:
      return "single";
    case 2:
      return aspect >= 1 ? "side" : "stack";
    case 3:
      return aspect >= 1 ? "main-right" : "main-bottom";
    case 4:
      return "grid";
  }
}
function slotMax(node) {
  if (node.type === "leaf") return node.slot;
  return node.children.reduce((m, c) => Math.max(m, slotMax(c)), -1);
}
function countLeaves(node) {
  if (!node) return 0;
  if (node.type === "leaf") return 1;
  return node.children.reduce((n, c) => n + countLeaves(c), 0);
}
function childExtents(node, total, gap) {
  const n = node.children.length;
  const room = Math.max(0, total - gap * (n - 1));
  const out = [];
  let used = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      out.push(room - used);
    } else {
      const size = Math.max(
        0,
        Math.min(room - used, Math.round((node.sizes[i] ?? 0) * room))
      );
      out.push(size);
      used += size;
    }
  }
  return out;
}
function walk(node, rect, gap, onLeaf, onDivider, path = []) {
  if (node.type === "leaf") {
    onLeaf(node.slot, rect);
    return;
  }
  const horizontal = node.dir === "row";
  const extents = childExtents(node, horizontal ? rect.w : rect.h, gap);
  let pos = horizontal ? rect.x : rect.y;
  node.children.forEach((child, i) => {
    const size = extents[i] ?? 0;
    const childRect = horizontal ? { x: pos, y: rect.y, w: size, h: rect.h } : { x: rect.x, y: pos, w: rect.w, h: size };
    walk(child, childRect, gap, onLeaf, onDivider, [...path, i]);
    if (onDivider && i < node.children.length - 1) {
      onDivider({
        path,
        index: i,
        dir: node.dir,
        x: horizontal ? pos + size : rect.x,
        y: horizontal ? rect.y : pos + size,
        w: horizontal ? gap : rect.w,
        h: horizontal ? rect.h : gap
      });
    }
    pos += size + gap;
  });
}
function computeRects(node, w, h, gap) {
  const rects = Array.from({ length: slotMax(node) + 1 }, () => ({
    x: 0,
    y: 0,
    w: 0,
    h: 0
  }));
  walk(
    node,
    { x: 0, y: 0, w: Math.round(w), h: Math.round(h) },
    gap,
    (slot, r) => {
      rects[slot] = r;
    }
  );
  return rects;
}
function computeDividers(node, w, h, gap) {
  const out = [];
  walk(
    node,
    { x: 0, y: 0, w: Math.round(w), h: Math.round(h) },
    gap,
    () => {
    },
    (d) => out.push(d)
  );
  return out;
}
function minExtent(node, axis, gap, min) {
  if (node.type === "leaf") return axis === "row" ? min.w : min.h;
  const parts = node.children.map((c) => minExtent(c, axis, gap, min));
  if (node.dir === axis)
    return parts.reduce((a, b) => a + b, 0) + gap * (node.children.length - 1);
  return parts.reduce((a, b) => Math.max(a, b), 0);
}
function resizeAt(node, path, index, deltaPx, w, h, gap, minPx = { w: 160, h: 90 }) {
  let cur = node;
  let cw = w;
  let ch = h;
  for (const p of path) {
    if (cur.type !== "split") return node;
    const child = cur.children[p];
    if (!child) return node;
    const horizontal = cur.dir === "row";
    const room2 = Math.max(
      0,
      (horizontal ? cw : ch) - gap * (cur.children.length - 1)
    );
    const share = (cur.sizes[p] ?? 0) * room2;
    if (horizontal) cw = share;
    else ch = share;
    cur = child;
  }
  if (cur.type !== "split") return node;
  const target = cur;
  const a = target.children[index];
  const b = target.children[index + 1];
  const sa = target.sizes[index];
  const sb = target.sizes[index + 1];
  if (!a || !b || sa === void 0 || sb === void 0) return node;
  const room = Math.max(
    0,
    (target.dir === "row" ? cw : ch) - gap * (target.children.length - 1)
  );
  if (room <= 0) return node;
  const pxA = sa * room;
  const pxB = sb * room;
  const minA = minExtent(a, target.dir, gap, minPx);
  const minB = minExtent(b, target.dir, gap, minPx);
  const lo = minA - pxA;
  const hi = pxB - minB;
  let delta = deltaPx;
  if (lo > hi) delta = 0;
  else delta = Math.min(hi, Math.max(lo, delta));
  const newA = pxA + delta;
  const pair = sa + sb;
  const fracA = pair * newA / (pxA + pxB);
  const sizes = target.sizes.slice();
  sizes[index] = fracA;
  sizes[index + 1] = pair - fracA;
  const replace = (n, depth) => {
    if (n.type === "leaf") return n;
    if (depth === path.length) return { ...n, sizes, children: n.children };
    const p = path[depth];
    return {
      ...n,
      children: n.children.map((c, i) => i === p ? replace(c, depth + 1) : c)
    };
  };
  return replace(node, 0);
}
function equalize(node) {
  if (node.type === "leaf") return node;
  return {
    ...node,
    sizes: equal(node.children.length),
    children: node.children.map(equalize)
  };
}
function normalize(node) {
  const sizes = [];
  const children = [];
  node.children.forEach((child, i) => {
    const s = node.sizes[i] ?? 0;
    if (child.type === "split" && child.dir === node.dir) {
      child.children.forEach((gc, j) => {
        children.push(gc);
        sizes.push(s * (child.sizes[j] ?? 0));
      });
    } else {
      children.push(child);
      sizes.push(s);
    }
  });
  return { ...node, sizes, children };
}
function removeSlot(node, slot) {
  if (node.type === "leaf") {
    if (node.slot === slot) return null;
    return node.slot > slot ? leaf(node.slot - 1) : node;
  }
  const kept = [];
  const keptSizes = [];
  let removed = 0;
  node.children.forEach((child, i) => {
    const next = removeSlot(child, slot);
    const s = node.sizes[i] ?? 0;
    if (next === null) removed += s;
    else {
      kept.push(next);
      keptSizes.push(s);
    }
  });
  if (kept.length === 0) return null;
  const rest = 1 - removed;
  const sizes = removed > 0 && rest > 0 ? keptSizes.map((s) => s / rest) : keptSizes;
  if (kept.length === 1) return kept[0];
  return normalize({ ...node, sizes, children: kept });
}
function addSlot(node, w, h, gap) {
  if (!node) return leaf(0);
  const count = countLeaves(node);
  const rects = computeRects(node, w, h, gap);
  let best = 0;
  let bestArea = -1;
  rects.forEach((r2, slot) => {
    const area = r2.w * r2.h;
    if (area > bestArea) {
      best = slot;
      bestArea = area;
    }
  });
  const r = rects[best];
  const dir = r.w >= r.h ? "row" : "col";
  const fresh = leaf(count);
  const rec = (n) => {
    if (n.type === "leaf") {
      return n.slot === best ? { type: "split", dir, sizes: [0.5, 0.5], children: [n, fresh] } : n;
    }
    const idx = n.children.findIndex(
      (c) => c.type === "leaf" && c.slot === best
    );
    if (idx >= 0 && n.dir === dir) {
      const children = n.children.slice();
      const sizes = n.sizes.slice();
      const half = (sizes[idx] ?? 0) / 2;
      children.splice(idx + 1, 0, fresh);
      sizes.splice(idx, 1, half, half);
      return { ...n, sizes, children };
    }
    return { ...n, children: n.children.map(rec) };
  };
  return rec(node);
}
function swapSlots(slots, a, b) {
  const out = slots.slice();
  const x = out[a];
  const y = out[b];
  if (x === void 0 || y === void 0) return out;
  out[a] = y;
  out[b] = x;
  return out;
}
function narrowLayout(count, n, aspect) {
  if (count === 1) return leaf(0);
  const dir = n.dir === "auto" ? aspect >= 1.2 ? "row" : "col" : n.dir;
  const s = Number.isFinite(n.split) ? n.split : 0.5;
  const split = Math.min(0.8, Math.max(0.2, s));
  return {
    type: "split",
    dir,
    sizes: [split, 1 - split],
    children: leaves(0, 1)
  };
}
var MAX_DEPTH = 8;
function isValidLayout(node, count) {
  if (node === null) return count === 0;
  const seen = [];
  const ok = (n, depth) => {
    if (depth > MAX_DEPTH || typeof n !== "object" || n === null) return false;
    const x = n;
    if (x.type === "leaf") {
      if (typeof x.slot !== "number" || !Number.isInteger(x.slot)) return false;
      seen.push(x.slot);
      return true;
    }
    if (x.type !== "split") return false;
    if (x.dir !== "row" && x.dir !== "col") return false;
    if (!Array.isArray(x.children) || !Array.isArray(x.sizes)) return false;
    if (x.children.length === 0 || x.children.length !== x.sizes.length)
      return false;
    let sum = 0;
    for (const s of x.sizes) {
      if (typeof s !== "number" || !Number.isFinite(s) || s < 0.02 || s > 1)
        return false;
      sum += s;
    }
    if (Math.abs(sum - 1) > 1e-6) return false;
    return x.children.every((c) => ok(c, depth + 1));
  };
  if (!ok(node, 0)) return false;
  if (seen.length !== count) return false;
  const sorted = seen.slice().sort((a, b) => a - b);
  return sorted.every((s, i) => s === i);
}
export {
  MAX_PANES,
  NARROW_BREAKPOINT,
  NARROW_MAX,
  addSlot,
  computeDividers,
  computeRects,
  countLeaves,
  defaultPreset,
  equalize,
  isValidLayout,
  narrowLayout,
  presetsFor,
  removeSlot,
  resizeAt,
  swapSlots
};
