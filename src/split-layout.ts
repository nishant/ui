// @nish/ui/split-layout: the split-tree layout math behind SplitStage, with no React and no
// imports, so a Node server can validate saved layouts with it. A layout is a tree of
// leaves (a slot is an index into the consumer's item list) and row/col splits.

export type LayoutNode =
  | { type: "leaf"; slot: number }
  | {
      type: "split";
      dir: "row" | "col";
      sizes: number[];
      children: LayoutNode[];
    };

/** A narrow-screen layout: one or two panes, split along `dir` ('auto' picks by aspect). */
export interface NarrowLayout {
  dir: "auto" | "row" | "col";
  /** Share of the first pane, 0.2 to 0.8. */
  split: number;
}

export const MAX_PANES = 4;
export const NARROW_MAX = 2;
export const NARROW_BREAKPOINT = 640;

export interface Preset {
  id: string;
  /** Short name shown under the icon. */
  label: string;
  /** Longer description for the tooltip and screen readers. */
  hint: string;
  build: () => LayoutNode;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Divider {
  path: number[];
  index: number;
  dir: "row" | "col";
  x: number;
  y: number;
  w: number;
  h: number;
}

type SplitNode = Extract<LayoutNode, { type: "split" }>;

const leaf = (slot: number): LayoutNode => ({ type: "leaf", slot });
const row = (sizes: number[], children: LayoutNode[]): LayoutNode => ({
  type: "split",
  dir: "row",
  sizes,
  children,
});
const col = (sizes: number[], children: LayoutNode[]): LayoutNode => ({
  type: "split",
  dir: "col",
  sizes,
  children,
});
const equal = (n: number): number[] => Array.from({ length: n }, () => 1 / n);
const leaves = (...slots: number[]): LayoutNode[] => slots.map(leaf);

export function presetsFor(count: 1 | 2 | 3 | 4): Preset[] {
  switch (count) {
    case 1:
      return [
        {
          id: "single",
          label: "Single",
          hint: "One stream",
          build: () => leaf(0),
        },
      ];
    case 2:
      return [
        {
          id: "side",
          label: "Slice",
          hint: "Side by side",
          build: () => row([0.5, 0.5], leaves(0, 1)),
        },
        {
          id: "stack",
          label: "Stack",
          hint: "One above the other",
          build: () => col([0.5, 0.5], leaves(0, 1)),
        },
        {
          id: "main-side",
          label: "Main 1",
          hint: "One big, one small on the right",
          build: () => row([0.7, 0.3], leaves(0, 1)),
        },
      ];
    case 3:
      return [
        {
          id: "main-right",
          label: "Main 1",
          hint: "One big, two on the right",
          build: () =>
            row([0.66, 0.34], [leaf(0), col([0.5, 0.5], leaves(1, 2))]),
        },
        {
          id: "main-bottom",
          label: "Main 2",
          hint: "One big, two below",
          build: () =>
            col([0.66, 0.34], [leaf(0), row([0.5, 0.5], leaves(1, 2))]),
        },
        {
          id: "cols-3",
          label: "Slice",
          hint: "Three side by side",
          build: () => row(equal(3), leaves(0, 1, 2)),
        },
        {
          id: "rows-3",
          label: "Stack",
          hint: "Three stacked",
          build: () => col(equal(3), leaves(0, 1, 2)),
        },
      ];
    case 4:
      return [
        {
          id: "grid",
          label: "Grid",
          hint: "Two by two",
          build: () =>
            col(
              [0.5, 0.5],
              [row([0.5, 0.5], leaves(0, 1)), row([0.5, 0.5], leaves(2, 3))],
            ),
        },
        {
          id: "main-right",
          label: "Main 1",
          hint: "One big, three on the right",
          build: () =>
            row([0.7, 0.3], [leaf(0), col(equal(3), leaves(1, 2, 3))]),
        },
        {
          id: "main-bottom",
          label: "Main 2",
          hint: "One big, three below",
          build: () =>
            col([0.7, 0.3], [leaf(0), row(equal(3), leaves(1, 2, 3))]),
        },
        {
          id: "cols-4",
          label: "Slice",
          hint: "Four side by side",
          build: () => row(equal(4), leaves(0, 1, 2, 3)),
        },
      ];
  }
}

export function defaultPreset(count: 1 | 2 | 3 | 4, aspect: number): string {
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

function slotMax(node: LayoutNode): number {
  if (node.type === "leaf") return node.slot;
  return node.children.reduce((m, c) => Math.max(m, slotMax(c)), -1);
}

export function countLeaves(node: LayoutNode | null): number {
  if (!node) return 0;
  if (node.type === "leaf") return 1;
  return node.children.reduce((n, c) => n + countLeaves(c), 0);
}

/** Pixel extents of a split's children along its axis (rounded, last child takes the remainder). */
function childExtents(node: SplitNode, total: number, gap: number): number[] {
  const n = node.children.length;
  const room = Math.max(0, total - gap * (n - 1));
  const out: number[] = [];
  let used = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      out.push(room - used);
    } else {
      const size = Math.max(
        0,
        Math.min(room - used, Math.round((node.sizes[i] ?? 0) * room)),
      );
      out.push(size);
      used += size;
    }
  }
  return out;
}

function walk(
  node: LayoutNode,
  rect: Rect,
  gap: number,
  onLeaf: (slot: number, r: Rect) => void,
  onDivider?: (d: Divider) => void,
  path: number[] = [],
): void {
  if (node.type === "leaf") {
    onLeaf(node.slot, rect);
    return;
  }
  const horizontal = node.dir === "row";
  const extents = childExtents(node, horizontal ? rect.w : rect.h, gap);
  let pos = horizontal ? rect.x : rect.y;
  node.children.forEach((child, i) => {
    const size = extents[i] ?? 0;
    const childRect: Rect = horizontal
      ? { x: pos, y: rect.y, w: size, h: rect.h }
      : { x: rect.x, y: pos, w: rect.w, h: size };
    walk(child, childRect, gap, onLeaf, onDivider, [...path, i]);
    if (onDivider && i < node.children.length - 1) {
      onDivider({
        path,
        index: i,
        dir: node.dir,
        x: horizontal ? pos + size : rect.x,
        y: horizontal ? rect.y : pos + size,
        w: horizontal ? gap : rect.w,
        h: horizontal ? rect.h : gap,
      });
    }
    pos += size + gap;
  });
}

export function computeRects(
  node: LayoutNode,
  w: number,
  h: number,
  gap: number,
): Rect[] {
  const rects: Rect[] = Array.from({ length: slotMax(node) + 1 }, () => ({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }));
  walk(
    node,
    { x: 0, y: 0, w: Math.round(w), h: Math.round(h) },
    gap,
    (slot, r) => {
      rects[slot] = r;
    },
  );
  return rects;
}

export function computeDividers(
  node: LayoutNode,
  w: number,
  h: number,
  gap: number,
): Divider[] {
  const out: Divider[] = [];
  walk(
    node,
    { x: 0, y: 0, w: Math.round(w), h: Math.round(h) },
    gap,
    () => {},
    (d) => out.push(d),
  );
  return out;
}

/** Smallest extent a subtree needs along an axis. */
function minExtent(
  node: LayoutNode,
  axis: "row" | "col",
  gap: number,
  min: { w: number; h: number },
): number {
  if (node.type === "leaf") return axis === "row" ? min.w : min.h;
  const parts = node.children.map((c) => minExtent(c, axis, gap, min));
  if (node.dir === axis)
    return parts.reduce((a, b) => a + b, 0) + gap * (node.children.length - 1);
  return parts.reduce((a, b) => Math.max(a, b), 0);
}

export function resizeAt(
  node: LayoutNode,
  path: number[],
  index: number,
  deltaPx: number,
  w: number,
  h: number,
  gap: number,
  minPx: { w: number; h: number } = { w: 160, h: 90 },
): LayoutNode {
  // Find the split and its size on the screen.
  let cur: LayoutNode = node;
  let cw = w;
  let ch = h;
  for (const p of path) {
    if (cur.type !== "split") return node;
    const child: LayoutNode | undefined = cur.children[p];
    if (!child) return node;
    const horizontal = cur.dir === "row";
    const room = Math.max(
      0,
      (horizontal ? cw : ch) - gap * (cur.children.length - 1),
    );
    const share = (cur.sizes[p] ?? 0) * room;
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
  if (!a || !b || sa === undefined || sb === undefined) return node;
  const room = Math.max(
    0,
    (target.dir === "row" ? cw : ch) - gap * (target.children.length - 1),
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
  const fracA = (pair * newA) / (pxA + pxB);
  const sizes = target.sizes.slice();
  sizes[index] = fracA;
  sizes[index + 1] = pair - fracA;

  const replace = (n: LayoutNode, depth: number): LayoutNode => {
    if (n.type === "leaf") return n;
    if (depth === path.length) return { ...n, sizes, children: n.children };
    const p = path[depth] as number;
    return {
      ...n,
      children: n.children.map((c, i) => (i === p ? replace(c, depth + 1) : c)),
    };
  };
  return replace(node, 0);
}

export function equalize(node: LayoutNode): LayoutNode {
  if (node.type === "leaf") return node;
  return {
    ...node,
    sizes: equal(node.children.length),
    children: node.children.map(equalize),
  };
}

/** Merges nested splits that share a direction into their parent. */
function normalize(node: SplitNode): LayoutNode {
  const sizes: number[] = [];
  const children: LayoutNode[] = [];
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

export function removeSlot(node: LayoutNode, slot: number): LayoutNode | null {
  if (node.type === "leaf") {
    if (node.slot === slot) return null;
    return node.slot > slot ? leaf(node.slot - 1) : node;
  }
  const kept: LayoutNode[] = [];
  const keptSizes: number[] = [];
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
  const sizes =
    removed > 0 && rest > 0 ? keptSizes.map((s) => s / rest) : keptSizes;
  if (kept.length === 1) return kept[0] as LayoutNode;
  return normalize({ ...node, sizes, children: kept });
}

export function addSlot(
  node: LayoutNode | null,
  w: number,
  h: number,
  gap: number,
): LayoutNode {
  if (!node) return leaf(0);
  const count = countLeaves(node);
  const rects = computeRects(node, w, h, gap);
  let best = 0;
  let bestArea = -1;
  rects.forEach((r, slot) => {
    const area = r.w * r.h;
    if (area > bestArea) {
      best = slot;
      bestArea = area;
    }
  });
  const r = rects[best] as Rect;
  const dir: "row" | "col" = r.w >= r.h ? "row" : "col";
  const fresh = leaf(count);

  const rec = (n: LayoutNode): LayoutNode => {
    if (n.type === "leaf") {
      return n.slot === best
        ? { type: "split", dir, sizes: [0.5, 0.5], children: [n, fresh] }
        : n;
    }
    const idx = n.children.findIndex(
      (c) => c.type === "leaf" && c.slot === best,
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

export function swapSlots(slots: string[], a: number, b: number): string[] {
  const out = slots.slice();
  const x = out[a];
  const y = out[b];
  if (x === undefined || y === undefined) return out;
  out[a] = y;
  out[b] = x;
  return out;
}

export function narrowLayout(
  count: 1 | 2,
  n: NarrowLayout,
  aspect: number,
): LayoutNode {
  if (count === 1) return leaf(0);
  const dir: "row" | "col" =
    n.dir === "auto" ? (aspect >= 1.2 ? "row" : "col") : n.dir;
  const split = Math.min(0.8, Math.max(0.2, n.split));
  return {
    type: "split",
    dir,
    sizes: [split, 1 - split],
    children: leaves(0, 1),
  };
}

const MAX_DEPTH = 8;

export function isValidLayout(node: LayoutNode | null, count: number): boolean {
  if (node === null) return count === 0;
  const seen: number[] = [];
  const ok = (n: unknown, depth: number): boolean => {
    if (depth > MAX_DEPTH || typeof n !== "object" || n === null) return false;
    const x = n as Record<string, unknown>;
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
