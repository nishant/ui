import { describe, expect, it } from "vitest";
import {
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
  swapSlots,
  type Rect,
} from "./split-layout";
import type { LayoutNode } from "./split-layout";

const counts = [1, 2, 3, 4] as const;
const leaf = (slot: number): LayoutNode => ({ type: "leaf", slot });
const area = (r: Rect): number => r.w * r.h;

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

describe("presets", () => {
  it("lists the presets in order", () => {
    expect(presetsFor(1).map((p) => p.id)).toEqual(["single"]);
    expect(presetsFor(2).map((p) => p.id)).toEqual([
      "side",
      "stack",
      "main-side",
    ]);
    expect(presetsFor(3).map((p) => p.id)).toEqual([
      "main-right",
      "main-bottom",
      "cols-3",
      "rows-3",
    ]);
    expect(presetsFor(4).map((p) => p.id)).toEqual([
      "grid",
      "main-right",
      "main-bottom",
      "cols-4",
    ]);
  });

  it("builds valid layouts", () => {
    for (const n of counts)
      for (const p of presetsFor(n))
        expect(isValidLayout(p.build(), n), `${n} ${p.id}`).toBeTruthy();
  });

  it("computes tiling rects with integer pixels", () => {
    const W = 1000;
    const H = 600;
    const gap = 4;
    for (const n of counts) {
      for (const p of presetsFor(n)) {
        const rects = computeRects(p.build(), W, H, gap);
        expect(rects.length).toBe(n);
        for (const r of rects) {
          for (const v of [r.x, r.y, r.w, r.h])
            expect(Number.isInteger(v), `${p.id} integer`).toBeTruthy();
          expect(
            r.w > 0 &&
              r.h > 0 &&
              r.x >= 0 &&
              r.y >= 0 &&
              r.x + r.w <= W &&
              r.y + r.h <= H,
            `${p.id} inside`,
          ).toBeTruthy();
        }
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++)
            expect(
              !overlaps(rects[i] as Rect, rects[j] as Rect),
              `${p.id} overlap`,
            ).toBeTruthy();
        }
        // Cover: every pixel is in a rect, or in a gap band (not covered by any rect only inside gaps).
        const covered = rects.reduce((s, r) => s + area(r), 0);
        const dividers = computeDividers(p.build(), W, H, gap);
        const gapArea = dividers.reduce((s, d) => s + d.w * d.h, 0);
        // gap bands may overlap at crossings, so covered + gaps >= total, and never less.
        expect(
          covered + gapArea >= W * H,
          `${p.id} covers the stage`,
        ).toBeTruthy();
        expect(covered <= W * H, `${p.id} within the stage`).toBeTruthy();
        // With a single split there are no crossings, so the sum is exact.
        if (dividers.length === 1) expect(covered + gapArea).toBe(W * H);
        // Rightmost and bottommost edges reach the stage edges.
        expect(Math.max(...rects.map((r) => r.x + r.w))).toBe(W);
        expect(Math.max(...rects.map((r) => r.y + r.h))).toBe(H);
      }
    }
  });

  it("places dividers over the gap", () => {
    const tree = presetsFor(2)[0]!.build();
    const rects = computeRects(tree, 1000, 600, 4);
    const [d] = computeDividers(tree, 1000, 600, 4);
    expect(d).toBeTruthy();
    expect(d.path).toEqual([]);
    expect(d.index).toBe(0);
    expect(d.dir).toBe("row");
    expect(d.x).toBe((rects[0] as Rect).x + (rects[0] as Rect).w);
    expect(d.w).toBe(4);
    expect(d.h).toBe(600);
  });

  it("picks default presets by aspect", () => {
    expect(defaultPreset(1, 2)).toBe("single");
    expect(defaultPreset(2, 1.6)).toBe("side");
    expect(defaultPreset(2, 0.5)).toBe("stack");
    expect(defaultPreset(3, 1.6)).toBe("main-right");
    expect(defaultPreset(3, 0.5)).toBe("main-bottom");
    expect(defaultPreset(4, 0.5)).toBe("grid");
  });
});

describe("addSlot", () => {
  it("starts from null", () => {
    expect(addSlot(null, 1600, 900, 4)).toEqual(leaf(0));
  });

  it("splits the largest pane on a wide stage", () => {
    const two = addSlot(leaf(0), 1600, 900, 4);
    expect(two).toEqual({
      type: "split",
      dir: "row",
      sizes: [0.5, 0.5],
      children: [leaf(0), leaf(1)],
    });
    const three = addSlot(two, 1600, 900, 4);
    // Tie on area: slot 0 wins. Its parent is a row, and slot 0 is wide-ish? 798x900 is taller, so col.
    expect(three).toEqual({
      type: "split",
      dir: "row",
      sizes: [0.5, 0.5],
      children: [
        {
          type: "split",
          dir: "col",
          sizes: [0.5, 0.5],
          children: [leaf(0), leaf(2)],
        },
        leaf(1),
      ],
    });
    const four = addSlot(three, 1600, 900, 4);
    expect(isValidLayout(four, 4)).toBeTruthy();
    expect(countLeaves(four)).toBe(4);
  });

  it("splits the largest pane on a tall stage", () => {
    const two = addSlot(leaf(0), 600, 900, 4);
    expect(two).toEqual({
      type: "split",
      dir: "col",
      sizes: [0.5, 0.5],
      children: [leaf(0), leaf(1)],
    });
    const three = addSlot(two, 600, 900, 4);
    // 600x448 panes are wider than tall, so slot 0 splits as a row inside the col.
    expect(three).toEqual({
      type: "split",
      dir: "col",
      sizes: [0.5, 0.5],
      children: [
        {
          type: "split",
          dir: "row",
          sizes: [0.5, 0.5],
          children: [leaf(0), leaf(2)],
        },
        leaf(1),
      ],
    });
    expect(isValidLayout(addSlot(three, 600, 900, 4), 4)).toBeTruthy();
  });

  it("adds a sibling when the parent already has that direction", () => {
    const t: LayoutNode = {
      type: "split",
      dir: "row",
      sizes: [0.7, 0.3],
      children: [leaf(0), leaf(1)],
    };
    const next = addSlot(t, 1600, 900, 0);
    // slot 0 is 1120x900: wide, so row. Parent is a row, so the new leaf becomes a sibling.
    expect(next.type).toBe("split");
    if (next.type !== "split") return;
    expect(next.dir).toBe("row");
    expect(next.children.length).toBe(3);
    expect(next.children.map((c) => (c.type === "leaf" ? c.slot : -1))).toEqual(
      [0, 2, 1],
    );
    expect(Math.abs((next.sizes[0] as number) - 0.35) < 1e-9).toBeTruthy();
    expect(Math.abs((next.sizes[1] as number) - 0.35) < 1e-9).toBeTruthy();
    expect(Math.abs((next.sizes[2] as number) - 0.3) < 1e-9).toBeTruthy();
    expect(isValidLayout(next, 3)).toBeTruthy();
  });
});

describe("removeSlot", () => {
  it("stays valid and renumbers for every slot of every preset", () => {
    for (const n of [3, 4] as const) {
      for (const p of presetsFor(n)) {
        for (let slot = 0; slot < n; slot++) {
          const next = removeSlot(p.build(), slot);
          expect(next, `${p.id} minus ${slot}`).toBeTruthy();
          expect(
            isValidLayout(next, n - 1),
            `${p.id} minus ${slot} valid`,
          ).toBeTruthy();
          if (!next) continue;
          const rects = computeRects(next, 1000, 600, 0);
          expect(
            rects.reduce((s, r) => s + area(r), 0),
            `${p.id} minus ${slot} fills the stage`,
          ).toBe(1000 * 600);
        }
      }
    }
  });

  it("returns null for the only leaf", () => {
    expect(removeSlot(leaf(0), 0)).toBe(null);
  });

  it("gives the share to the neighbors", () => {
    const grid = presetsFor(4)[0]!.build();
    const before = computeRects(grid, 1000, 600, 0);
    const after = computeRects(removeSlot(grid, 1)!, 1000, 600, 0);
    const want = area(before[0] as Rect) + area(before[1] as Rect);
    expect(
      Math.abs(area(after[0] as Rect) - want) <= 2,
      "slot 0 absorbs slot 1",
    ).toBeTruthy();
    // Old slots 2 and 3 are now 1 and 2 and keep their size.
    expect(after[1]).toEqual(before[2]);
    expect(after[2]).toEqual(before[3]);
  });

  it("shares proportionally among several siblings", () => {
    const t: LayoutNode = {
      type: "split",
      dir: "row",
      sizes: [0.5, 0.3, 0.2],
      children: [leaf(0), leaf(1), leaf(2)],
    };
    const next = removeSlot(t, 1);
    expect(next && next.type === "split").toBeTruthy();
    if (!next || next.type !== "split") return;
    expect(Math.abs((next.sizes[0] as number) - 0.5 / 0.7) < 1e-9).toBeTruthy();
    expect(Math.abs((next.sizes[1] as number) - 0.2 / 0.7) < 1e-9).toBeTruthy();
  });

  it("merges a collapsed split into a parent with the same direction", () => {
    const t: LayoutNode = {
      type: "split",
      dir: "row",
      sizes: [0.5, 0.5],
      children: [
        leaf(0),
        {
          type: "split",
          dir: "col",
          sizes: [0.4, 0.6],
          children: [
            leaf(1),
            {
              type: "split",
              dir: "row",
              sizes: [0.5, 0.5],
              children: [leaf(2), leaf(3)],
            },
          ],
        },
      ],
    };
    const next = removeSlot(t, 1);
    expect(next && next.type === "split").toBeTruthy();
    if (!next || next.type !== "split") return;
    expect(next.dir).toBe("row");
    expect(next.children.length).toBe(3);
    expect(next.sizes.map((s) => Math.round(s * 1000) / 1000)).toEqual([
      0.5, 0.25, 0.25,
    ]);
    expect(isValidLayout(next, 3)).toBeTruthy();
  });
});

describe("resizeAt", () => {
  const side = presetsFor(2)[0]!.build();

  it("moves a divider and keeps the sum", () => {
    const next = resizeAt(side, [], 0, 100, 1000, 600, 4);
    expect(next.type === "split").toBeTruthy();
    if (next.type !== "split") return;
    const room = 996;
    expect(
      Math.abs((next.sizes[0] as number) * room - (498 + 100)) < 1e-6,
    ).toBeTruthy();
    expect(Math.abs(next.sizes[0]! + next.sizes[1]! - 1) < 1e-9).toBeTruthy();
    expect(isValidLayout(next, 2)).toBeTruthy();
  });

  it("does not mutate its input", () => {
    const copy = JSON.stringify(side);
    resizeAt(side, [], 0, 100, 1000, 600, 4);
    expect(JSON.stringify(side)).toBe(copy);
  });

  it("clamps at the minimum width on both sides", () => {
    const right = computeRects(
      resizeAt(side, [], 0, 100000, 1000, 600, 4),
      1000,
      600,
      4,
    );
    expect((right[1] as Rect).w).toBe(160);
    const left = computeRects(
      resizeAt(side, [], 0, -100000, 1000, 600, 4),
      1000,
      600,
      4,
    );
    expect((left[0] as Rect).w).toBe(160);
  });

  it("clamps at the minimum height for a column split", () => {
    const stack = presetsFor(2)[1]!.build();
    const rects = computeRects(
      resizeAt(stack, [], 0, 100000, 1000, 600, 4),
      1000,
      600,
      4,
    );
    expect((rects[1] as Rect).h).toBe(90);
  });

  it("respects the smallest pane inside a neighbor", () => {
    const t: LayoutNode = presetsFor(3)[0]!.build(); // row [leaf0, col[1,2]]
    const rects = computeRects(
      resizeAt(t, [], 0, 100000, 1000, 600, 4),
      1000,
      600,
      4,
    );
    expect((rects[1] as Rect).w).toBe(160);
    // Resizing the nested column clamps heights.
    const col = computeRects(
      resizeAt(t, [1], 0, 100000, 1000, 600, 4),
      1000,
      600,
      4,
    );
    expect((col[2] as Rect).h).toBe(90);
  });

  it("ignores an unknown path", () => {
    expect(resizeAt(side, [5], 0, 10, 1000, 600, 4)).toEqual(side);
    expect(resizeAt(side, [], 3, 10, 1000, 600, 4)).toEqual(side);
  });
});

describe("equalize, swap, narrow", () => {
  it("equalizes every split", () => {
    const t = resizeAt(presetsFor(3)[0]!.build(), [], 0, 100, 1000, 600, 4);
    const eq = equalize(t);
    expect(isValidLayout(eq, 3)).toBeTruthy();
    expect(eq.type === "split").toBeTruthy();
    if (eq.type !== "split") return;
    expect(eq.sizes).toEqual([0.5, 0.5]);
  });

  it("swaps slots without mutating", () => {
    const slots = ["a", "b", "c"];
    expect(swapSlots(slots, 0, 2)).toEqual(["c", "b", "a"]);
    expect(slots).toEqual(["a", "b", "c"]);
    expect(swapSlots(slots, 0, 9)).toEqual(["a", "b", "c"]);
  });

  it("builds the narrow layout by aspect", () => {
    expect(narrowLayout(1, { dir: "auto", split: 0.5 }, 0.5)).toEqual(leaf(0));
    const portrait = narrowLayout(2, { dir: "auto", split: 0.4 }, 0.46);
    expect(portrait.type === "split" && portrait.dir === "col").toBeTruthy();
    expect((portrait as { sizes: number[] }).sizes).toEqual([0.4, 0.6]);
    const wide = narrowLayout(2, { dir: "auto", split: 0.5 }, 1.2);
    expect(wide.type === "split" && wide.dir === "row").toBeTruthy();
    const squarish = narrowLayout(2, { dir: "auto", split: 0.5 }, 1.1);
    expect(squarish.type === "split" && squarish.dir === "col").toBeTruthy();
    const forced = narrowLayout(2, { dir: "row", split: 0.5 }, 0.4);
    expect(forced.type === "split" && forced.dir === "row").toBeTruthy();
    expect(isValidLayout(portrait, 2)).toBeTruthy();
  });
});

describe("isValidLayout", () => {
  it("rejects bad trees", () => {
    expect(!isValidLayout(leaf(1), 1)).toBeTruthy();
    expect(!isValidLayout(leaf(0), 2)).toBeTruthy();
    expect(!isValidLayout(null, 1)).toBeTruthy();
    expect(isValidLayout(null, 0)).toBeTruthy();
    expect(
      !isValidLayout(
        {
          type: "split",
          dir: "row",
          sizes: [0.5],
          children: [leaf(0), leaf(1)],
        },
        2,
      ),
    ).toBeTruthy();
    expect(
      !isValidLayout(
        {
          type: "split",
          dir: "row",
          sizes: [0.6, 0.6],
          children: [leaf(0), leaf(1)],
        },
        2,
      ),
    ).toBeTruthy();
    expect(
      !isValidLayout(
        {
          type: "split",
          dir: "row",
          sizes: [0.01, 0.99],
          children: [leaf(0), leaf(1)],
        },
        2,
      ),
    ).toBeTruthy();
    expect(
      !isValidLayout(
        {
          type: "split",
          dir: "row",
          sizes: [0.5, 0.5],
          children: [leaf(0), leaf(0)],
        },
        2,
      ),
    ).toBeTruthy();
    expect(
      !isValidLayout(
        {
          type: "split",
          dir: "diag",
          sizes: [0.5, 0.5],
          children: [leaf(0), leaf(1)],
        } as never,
        2,
      ),
    ).toBeTruthy();
  });
});
