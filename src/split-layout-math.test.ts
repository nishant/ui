import { describe, expect, it } from 'vitest';
import {
  addSlot,
  computeDividers,
  computeRects,
  countLeaves,
  defaultPreset,
  equalize,
  isValidLayout,
  narrowLayout,
  removeSlot,
  resizeAt,
  swapSlots,
  type LayoutNode,
} from './split-layout';

const leaf = (slot: number): LayoutNode => ({ type: 'leaf', slot });
const row = (sizes: number[], children: LayoutNode[]): LayoutNode => ({ type: 'split', dir: 'row', sizes, children });
const col = (sizes: number[], children: LayoutNode[]): LayoutNode => ({ type: 'split', dir: 'col', sizes, children });
const sizesOf = (n: LayoutNode | null): number[] => (n && n.type === 'split' ? n.sizes : []);

/** A chain of `levels` nested splits; the deepest leaf sits at depth `levels`. */
function chain(levels: number): LayoutNode {
  let node: LayoutNode = leaf(levels);
  for (let i = levels - 1; i >= 0; i--) node = row([0.5, 0.5], [leaf(i), node]);
  return node;
}

describe('isValidLayout', () => {
  it('null is valid only for zero panes', () => {
    expect(isValidLayout(null, 0)).toBe(true);
    expect(isValidLayout(null, 1)).toBe(false);
  });

  it('accepts a single leaf, and a leaf for the wrong count is invalid', () => {
    expect(isValidLayout(leaf(0), 1)).toBe(true);
    expect(isValidLayout(leaf(0), 2)).toBe(false);
    expect(isValidLayout(leaf(0), 0)).toBe(false);
  });

  it('depth: eight levels of splits are fine, nine are not', () => {
    expect(isValidLayout(chain(8), 9)).toBe(true);
    expect(isValidLayout(chain(9), 10)).toBe(false);
  });

  it('rejects a value that is not an object, or null inside the tree', () => {
    expect(isValidLayout('x' as unknown as LayoutNode, 1)).toBe(false);
    expect(isValidLayout(5 as unknown as LayoutNode, 1)).toBe(false);
    expect(isValidLayout(undefined as unknown as LayoutNode, 1)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5], [leaf(0), null as unknown as LayoutNode]), 2)).toBe(false);
  });

  it('rejects a slot that is not a whole number', () => {
    expect(isValidLayout({ type: 'leaf', slot: 0.5 }, 1)).toBe(false);
    expect(isValidLayout({ type: 'leaf', slot: '0' as unknown as number }, 1)).toBe(false);
    expect(isValidLayout({ type: 'leaf', slot: NaN }, 1)).toBe(false);
    expect(isValidLayout({ type: 'leaf' } as unknown as LayoutNode, 1)).toBe(false);
  });

  it('rejects an unknown node type', () => {
    expect(isValidLayout({ type: 'pane', slot: 0 } as unknown as LayoutNode, 1)).toBe(false);
    expect(isValidLayout({} as unknown as LayoutNode, 0)).toBe(false);
  });

  it('rejects a direction that is not row or col', () => {
    expect(isValidLayout({ type: 'split', dir: 'diag', sizes: [0.5, 0.5], children: [leaf(0), leaf(1)] } as unknown as LayoutNode, 2)).toBe(false);
    expect(isValidLayout({ type: 'split', sizes: [0.5, 0.5], children: [leaf(0), leaf(1)] } as unknown as LayoutNode, 2)).toBe(false);
    expect(isValidLayout(col([0.5, 0.5], [leaf(0), leaf(1)]), 2)).toBe(true);
  });

  it('rejects children or sizes that are not arrays', () => {
    expect(isValidLayout({ type: 'split', dir: 'row', sizes: 1, children: [leaf(0)] } as unknown as LayoutNode, 1)).toBe(false);
    expect(isValidLayout({ type: 'split', dir: 'row', sizes: [1], children: 'x' } as unknown as LayoutNode, 1)).toBe(false);
    expect(isValidLayout({ type: 'split', dir: 'row', sizes: [1] } as unknown as LayoutNode, 1)).toBe(false);
  });

  it('rejects empty or mismatched children and sizes', () => {
    expect(isValidLayout(row([], []), 0)).toBe(false);
    expect(isValidLayout(row([1], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5], [leaf(0)]), 1)).toBe(false);
  });

  it('size limits: NaN, below 0.02, above 1 and negative are rejected; 0.02 and 1 are allowed', () => {
    expect(isValidLayout(row([NaN, 1], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([Infinity, 0], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row(['0.5', '0.5'] as unknown as number[], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([0.0199, 0.9801], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([0.02, 0.98], [leaf(0), leaf(1)]), 2)).toBe(true);
    expect(isValidLayout(row([-0.1, 1.1], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([1.0001], [leaf(0)]), 1)).toBe(false);
    expect(isValidLayout(row([1], [leaf(0)]), 1)).toBe(true);
  });

  it('sizes must add up to 1', () => {
    expect(isValidLayout(row([0.5, 0.4], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([0.6, 0.5], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5 + 1e-5], [leaf(0), leaf(1)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5 + 1e-7], [leaf(0), leaf(1)]), 2)).toBe(true);
    expect(isValidLayout(row([1 / 3, 1 / 3, 1 / 3], [leaf(0), leaf(1), leaf(2)]), 3)).toBe(true);
  });

  it('slots must be 0..n-1 once each', () => {
    expect(isValidLayout(row([0.5, 0.5], [leaf(0), leaf(0)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5], [leaf(0), leaf(2)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5], [leaf(1), leaf(2)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5], [leaf(-1), leaf(0)]), 2)).toBe(false);
    expect(isValidLayout(row([0.5, 0.5], [leaf(1), leaf(0)]), 2)).toBe(true);
    expect(isValidLayout(row([0.5, 0.5], [leaf(0), leaf(1)]), 3)).toBe(false);
  });

  it('checks nested splits too', () => {
    expect(isValidLayout(row([0.5, 0.5], [leaf(0), col([0.5, 0.5], [leaf(1), leaf(2)])]), 3)).toBe(true);
    expect(isValidLayout(row([0.5, 0.5], [leaf(0), col([0.5, 0.4], [leaf(1), leaf(2)])]), 3)).toBe(false);
  });
});

describe('computeRects and computeDividers', () => {
  it('splits by size after removing the gaps, the last child takes the remainder', () => {
    const rects = computeRects(row([0.25, 0.25, 0.5], [leaf(0), leaf(1), leaf(2)]), 808, 100, 4);
    expect(rects).toEqual([
      { x: 0, y: 0, w: 200, h: 100 },
      { x: 204, y: 0, w: 200, h: 100 },
      { x: 408, y: 0, w: 400, h: 100 },
    ]);
  });

  it('a column split stacks panes and moves y by size plus gap', () => {
    const rects = computeRects(col([0.5, 0.5], [leaf(0), leaf(1)]), 100, 204, 4);
    expect(rects).toEqual([
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 0, y: 104, w: 100, h: 100 },
    ]);
  });

  it('never gives a pane a negative size when there is no room', () => {
    const rects = computeRects(row([0.5, 0.5], [leaf(0), leaf(1)]), 2, 50, 4);
    for (const r of rects) expect(r.w).toBeGreaterThanOrEqual(0);
  });

  it('returns one rect per slot, in slot order, not in tree order', () => {
    const rects = computeRects(row([0.5, 0.5], [leaf(1), leaf(0)]), 104, 10, 4);
    expect(rects).toHaveLength(2);
    expect(rects[1]!.x).toBe(0);
    expect(rects[0]!.x).toBe(54);
  });

  it('dividers sit in the gaps and carry the path and index', () => {
    const tree = row([0.5, 0.5], [leaf(0), col([0.5, 0.5], [leaf(1), leaf(2)])]);
    const dividers = computeDividers(tree, 204, 104, 4);
    expect(dividers).toHaveLength(2);
    const outer = dividers.find((d) => d.path.length === 0)!;
    expect(outer).toMatchObject({ index: 0, dir: 'row', x: 100, y: 0, w: 4, h: 104 });
    const inner = dividers.find((d) => d.path.length === 1)!;
    expect(inner).toMatchObject({ path: [1], index: 0, dir: 'col', x: 104, y: 50, w: 100, h: 4 });
  });
});

describe('resizeAt', () => {
  const two = row([0.5, 0.5], [leaf(0), leaf(1)]);

  it('moves the divider by the pixel delta, after taking the gap out', () => {
    const next = resizeAt(two, [], 0, 100, 804, 100, 4);
    expect(sizesOf(next)[0]).toBeCloseTo(500 / 800, 6);
    expect(sizesOf(next)[1]).toBeCloseTo(300 / 800, 6);
    expect(sizesOf(next)[0]! + sizesOf(next)[1]!).toBeCloseTo(1, 9);
  });

  it('a column split moves with the height, not the width', () => {
    const tree = col([0.5, 0.5], [leaf(0), leaf(1)]);
    const next = resizeAt(tree, [], 0, 50, 300, 404, 4);
    expect(sizesOf(next)[0]).toBeCloseTo(250 / 400, 6);
  });

  it('clamps so each pane keeps its minimum', () => {
    const grow = resizeAt(two, [], 0, 10_000, 804, 100, 4, { w: 160, h: 90 });
    expect(sizesOf(grow)[1]).toBeCloseTo(160 / 800, 6);
    const shrink = resizeAt(two, [], 0, -10_000, 804, 100, 4, { w: 160, h: 90 });
    expect(sizesOf(shrink)[0]).toBeCloseTo(160 / 800, 6);
  });

  it('uses the height minimum for a column split', () => {
    const tree = col([0.5, 0.5], [leaf(0), leaf(1)]);
    const next = resizeAt(tree, [], 0, -10_000, 300, 404, 4, { w: 160, h: 90 });
    expect(sizesOf(next)[0]).toBeCloseTo(90 / 400, 6);
  });

  it('stays where it is when both panes are already at or below the minimum (lo > hi)', () => {
    const next = resizeAt(two, [], 0, 50, 300, 100, 4, { w: 160, h: 90 });
    expect(sizesOf(next)[0]).toBeCloseTo(0.5, 9);
  });

  it('a delta that exactly fits moves; one pixel more than fits is clamped', () => {
    // 800 of room, minimum 160: the first pane may reach 640 (delta +240).
    expect(sizesOf(resizeAt(two, [], 0, 240, 804, 100, 4))[0]).toBeCloseTo(0.8, 6);
    expect(sizesOf(resizeAt(two, [], 0, 241, 804, 100, 4))[0]).toBeCloseTo(0.8, 6);
    expect(sizesOf(resizeAt(two, [], 0, 239, 804, 100, 4))[0]).toBeCloseTo(639 / 800, 6);
  });

  it('returns the same tree for a path that ends at a leaf or leaves the tree', () => {
    expect(resizeAt(two, [0], 0, 10, 804, 100, 4)).toBe(two);
    expect(resizeAt(two, [5], 0, 10, 804, 100, 4)).toBe(two);
    expect(resizeAt(two, [0, 0], 0, 10, 804, 100, 4)).toBe(two);
    expect(resizeAt(leaf(0), [], 0, 10, 804, 100, 4)).toEqual(leaf(0));
  });

  it('returns the same tree for a divider index that does not exist', () => {
    expect(resizeAt(two, [], 1, 10, 804, 100, 4)).toBe(two);
    expect(resizeAt(two, [], -1, 10, 804, 100, 4)).toBe(two);
  });

  it('returns the same tree when there is no room', () => {
    expect(resizeAt(two, [], 0, 10, 4, 100, 4)).toBe(two);
    expect(resizeAt(two, [], 0, 10, 3, 100, 4)).toBe(two);
  });

  it('works inside a nested split, measuring that split on its own', () => {
    const tree = row([0.5, 0.5], [leaf(0), col([0.5, 0.5], [leaf(1), leaf(2)])]);
    const next = resizeAt(tree, [1], 0, 50, 804, 404, 4);
    const inner = (next as { children: LayoutNode[] }).children[1]!;
    expect(sizesOf(inner)[0]).toBeCloseTo(250 / 400, 6);
    expect(sizesOf(next)).toEqual([0.5, 0.5]);
  });

  it('keeps the other sizes of a three-way split', () => {
    const three = row([0.25, 0.25, 0.5], [leaf(0), leaf(1), leaf(2)]);
    const next = resizeAt(three, [], 0, 40, 808, 100, 4);
    expect(sizesOf(next)[0]).toBeCloseTo(0.3, 6);
    expect(sizesOf(next)[1]).toBeCloseTo(0.2, 6);
    expect(sizesOf(next)[2]).toBeCloseTo(0.5, 9);
  });
});

describe('equalize', () => {
  it('sets every split to equal sizes, all the way down', () => {
    const tree = row([0.2, 0.8], [leaf(0), col([0.1, 0.3, 0.6], [leaf(1), leaf(2), leaf(3)])]);
    const out = equalize(tree) as { sizes: number[]; children: Array<{ sizes: number[] }> };
    expect(out.sizes).toEqual([0.5, 0.5]);
    expect(out.children[1]!.sizes.map((s) => Math.round(s * 1000))).toEqual([333, 333, 333]);
  });
});

describe('removeSlot', () => {
  it('removing the only pane leaves nothing', () => {
    expect(removeSlot(leaf(0), 0)).toBeNull();
  });

  it('removing a pane of two leaves the other as a lone leaf, renumbered', () => {
    expect(removeSlot(row([0.5, 0.5], [leaf(0), leaf(1)]), 0)).toEqual(leaf(0));
    expect(removeSlot(row([0.5, 0.5], [leaf(0), leaf(1)]), 1)).toEqual(leaf(0));
  });

  it('renumbers later slots down by one and keeps earlier ones', () => {
    const out = removeSlot(row([0.25, 0.25, 0.5], [leaf(0), leaf(1), leaf(2)]), 1);
    expect(out).toMatchObject({ children: [leaf(0), leaf(1)] });
  });

  it('shares the freed size among the rest in proportion', () => {
    const out = removeSlot(row([0.25, 0.25, 0.5], [leaf(0), leaf(1), leaf(2)]), 1);
    expect(sizesOf(out)[0]).toBeCloseTo(1 / 3, 9);
    expect(sizesOf(out)[1]).toBeCloseTo(2 / 3, 9);
  });

  it('removing a slot that is not there changes nothing but keeps the tree valid', () => {
    const tree = row([0.5, 0.5], [leaf(0), leaf(1)]);
    expect(removeSlot(tree, 7)).toEqual(tree);
  });

  it('a split left with one child collapses into that child', () => {
    const tree = row([0.5, 0.5], [leaf(0), col([0.5, 0.5], [leaf(1), leaf(2)])]);
    const out = removeSlot(tree, 2) as { children: LayoutNode[] };
    expect(out.children).toEqual([leaf(0), leaf(1)]);
  });

  it('merges a same-direction split into its parent', () => {
    const tree = row([0.5, 0.5], [col([0.5, 0.5], [leaf(0), leaf(1)]), row([0.5, 0.5], [leaf(2), leaf(3)])]);
    const out = removeSlot(tree, 0) as { dir: string; children: LayoutNode[]; sizes: number[] };
    expect(out.dir).toBe('row');
    expect(out.children).toEqual([leaf(0), leaf(1), leaf(2)]);
    expect(out.sizes.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    expect(isValidLayout(out as LayoutNode, 3)).toBe(true);
  });
});

describe('addSlot', () => {
  it('starts a layout from nothing', () => {
    expect(addSlot(null, 800, 450, 4)).toEqual(leaf(0));
  });

  it('splits a lone pane in two, side by side when it is wider than tall or square', () => {
    expect(addSlot(leaf(0), 800, 450, 4)).toEqual(row([0.5, 0.5], [leaf(0), leaf(1)]));
    expect(addSlot(leaf(0), 500, 500, 4)).toEqual(row([0.5, 0.5], [leaf(0), leaf(1)]));
    expect(addSlot(leaf(0), 450, 800, 4)).toEqual(col([0.5, 0.5], [leaf(0), leaf(1)]));
  });

  it('splits the largest pane by area, not the widest or the first', () => {
    const tree = col([0.2, 0.8], [row([0.5, 0.5], [leaf(0), leaf(1)]), leaf(2)]);
    const out = addSlot(tree, 1000, 1000, 4) as { children: LayoutNode[]; sizes: number[] };
    // Slot 2 (a 1000 x 796 band) is the largest; it is a row, so the new pane goes beside it.
    const last = out.children[1] as { type: string; dir: string; children: LayoutNode[] };
    expect(last.type).toBe('split');
    expect(last.dir).toBe('row');
    expect(last.children).toEqual([leaf(2), leaf(3)]);
    expect(out.children[0]).toEqual(row([0.5, 0.5], [leaf(0), leaf(1)]));
  });

  it('puts the new pane after the one it split, in the same row, halving that pane', () => {
    const tree = row([0.25, 0.75], [leaf(0), leaf(1)]);
    const out = addSlot(tree, 1000, 300, 4) as { children: LayoutNode[]; sizes: number[] };
    expect(out.children).toEqual([leaf(0), leaf(1), leaf(2)]);
    expect(out.sizes[0]).toBeCloseTo(0.25, 9);
    expect(out.sizes[1]).toBeCloseTo(0.375, 9);
    expect(out.sizes[2]).toBeCloseTo(0.375, 9);
  });

  it('inserts in the middle when the split pane is not the last', () => {
    const tree = row([0.75, 0.25], [leaf(0), leaf(1)]);
    const out = addSlot(tree, 1000, 300, 4) as { children: LayoutNode[] };
    expect(out.children).toEqual([leaf(0), leaf(2), leaf(1)]);
  });

  it('splits across the long side: a tall pane gets a column split', () => {
    const tree = row([0.5, 0.5], [leaf(0), leaf(1)]);
    const out = addSlot(tree, 400, 1000, 4) as { children: LayoutNode[] };
    expect(out.children[0]).toEqual(col([0.5, 0.5], [leaf(0), leaf(2)]));
  });

  it('the result is always a valid layout for one more pane', () => {
    let tree: LayoutNode | null = null;
    for (let n = 1; n <= 4; n++) {
      tree = addSlot(tree, 900, 500, 4);
      expect(isValidLayout(tree, n)).toBe(true);
      expect(countLeaves(tree)).toBe(n);
    }
  });
});

describe('presets by aspect, narrow layouts, swapping', () => {
  it('defaultPreset flips at an aspect of exactly 1', () => {
    expect(defaultPreset(2, 1)).toBe('side');
    expect(defaultPreset(2, 0.999)).toBe('stack');
    expect(defaultPreset(3, 1)).toBe('main-right');
    expect(defaultPreset(3, 0.999)).toBe('main-bottom');
    expect(defaultPreset(1, 5)).toBe('single');
    expect(defaultPreset(4, 5)).toBe('grid');
  });

  it('narrowLayout "auto" picks row from an aspect of 1.2 up and col below, and clamps the split', () => {
    const at = (aspect: number, split = 0.5) => narrowLayout(2, { dir: 'auto', split }, aspect);
    expect((at(1.2) as { dir: string }).dir).toBe('row');
    expect((at(1.19) as { dir: string }).dir).toBe('col');
    expect(sizesOf(at(1.2, 0.05))).toEqual([0.2, 0.8]);
    expect(sizesOf(at(1.2, 0.95))[0]).toBeCloseTo(0.8, 9);
    expect(sizesOf(at(1.2, 0.5))).toEqual([0.5, 0.5]);
    expect(sizesOf(at(1.2, NaN))).toEqual([0.5, 0.5]);
    expect(narrowLayout(1, { dir: 'row', split: 0.5 }, 1)).toEqual(leaf(0));
    expect((narrowLayout(2, { dir: 'col', split: 0.5 }, 3) as { dir: string }).dir).toBe('col');
  });

  it('swapSlots swaps two entries without touching the input, and ignores bad indexes', () => {
    const input = ['a', 'b', 'c'];
    expect(swapSlots(input, 0, 2)).toEqual(['c', 'b', 'a']);
    expect(input).toEqual(['a', 'b', 'c']);
    expect(swapSlots(input, 0, 9)).toEqual(['a', 'b', 'c']);
    expect(swapSlots(input, -1, 1)).toEqual(['a', 'b', 'c']);
  });
});
