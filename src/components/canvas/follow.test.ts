import { describe, expect, it } from 'vitest';
import type { CanvasGroup } from './types';
import type { CanvasLayout } from './layout';
import { followSignature, followStep, followTargets } from './follow';

const box = (x: number, y: number) => ({ x, y, w: 172, h: 56 });

function fixture(): { groups: CanvasGroup[]; layout: CanvasLayout } {
  const groups: CanvasGroup[] = [
    {
      id: 'g1',
      title: 'Apps',
      column: 0,
      nodes: [
        { id: 'a', label: 'A', active: true, activeAt: 100 },
        { id: 'b', label: 'B', active: true, activeAt: 300 },
        { id: 'c', label: 'C', active: false, activeAt: 999 },
      ],
    },
    {
      id: 'g2',
      title: 'Shared',
      column: 1,
      nodes: [
        { id: 'd', label: 'D', active: true, activeAt: 300, note: 'building' },
        { id: 'e', label: 'E', active: true },
      ],
    },
  ];
  const layout: CanvasLayout = {
    mode: 'bands',
    width: 4000,
    height: 3000,
    titleRoom: 0,
    headers: [],
    groups: {},
    nodes: { a: box(0, 0), b: box(0, 100), c: box(0, 200), d: box(3000, 2500), e: box(3500, 100) },
  };
  return { groups, layout };
}

const fit = { x: 1, y: 2, k: 0.5 };

describe('followTargets', () => {
  it('orders active nodes newest first, ties by layout order, missing time last', () => {
    const { groups, layout } = fixture();
    expect(followTargets(groups, layout).map((t) => t.id)).toEqual(['b', 'd', 'a', 'e']);
  });

  it('carries the group title, label and note', () => {
    const { groups, layout } = fixture();
    const d = followTargets(groups, layout).find((t) => t.id === 'd')!;
    expect(d).toMatchObject({ group: 'Shared', label: 'D', note: 'building', at: 300 });
  });
});

describe('followStep', () => {
  it('is idle with the fit view when nothing is active', () => {
    expect(followStep([], 0, 1000, 800, fit)).toEqual({ mode: 'idle', view: fit, targets: [] });
  });

  it("shows 'all' when the targets fit at 0.75 or more", () => {
    const { groups, layout } = fixture();
    const near = followTargets(groups, layout).filter((t) => t.id === 'a' || t.id === 'b');
    const s = followStep(near, 0, 1000, 800, fit);
    expect(s.mode).toBe('all');
    expect(s.view.k).toBeGreaterThanOrEqual(0.75);
    expect(s.targets).toHaveLength(2);
  });

  it("cycles 'one' through the targets with i", () => {
    const { groups, layout } = fixture();
    const targets = followTargets(groups, layout);
    const ids = [0, 1, 2, 3, 4].map((i) => {
      const s = followStep(targets, i, 1000, 800, fit);
      expect(s.mode).toBe('one');
      expect(s.view.k).toBe(1);
      return s.targets[0]!.id;
    });
    expect(ids).toEqual(['b', 'd', 'a', 'e', 'b']);
  });

  it('centers a single target at zoom 1, or 0.8 on a phone', () => {
    const t = followTargets(fixture().groups, fixture().layout).slice(0, 1);
    const s = followStep(t, 0, 1000, 800, fit);
    expect(s.view.k).toBe(1);
    expect(s.view.x + (t[0]!.box.x + 86)).toBeCloseTo(500);
    expect(followStep(t, 0, 360, 780, fit).view.k).toBe(0.8);
  });

  it('puts the target in the top 45% of a phone viewport', () => {
    const t = followTargets(fixture().groups, fixture().layout).slice(0, 1);
    const v = followStep(t, 0, 360, 780, fit).view;
    const cy = t[0]!.box.y + 28;
    expect(cy * v.k + v.y).toBeCloseTo(780 * 0.225);
    const many = followStep(followTargets(fixture().groups, fixture().layout), 1, 360, 780, fit);
    const b = many.targets[0]!.box;
    expect((b.y + b.h / 2) * many.view.k + many.view.y).toBeLessThan(780 * 0.45);
  });

  it('on a phone centers x on the node group when the group fits', () => {
    const { groups, layout } = fixture();
    layout.groups = { g1: { x: 0, y: 0, w: 300, h: 300 } };
    layout.nodes.b = box(120, 100);
    const t = followTargets(groups, layout).filter((x) => x.id === 'b');
    const v = followStep(t, 0, 360, 780, fit).view;
    expect(150 * v.k + v.x).toBeCloseTo(180);
  });
});

describe('followSignature', () => {
  it('ignores order when two active nodes swap activeAt', () => {
    const { groups, layout } = fixture();
    const before = followSignature(followTargets(groups, layout));
    groups[0]!.nodes[0]!.activeAt = 500;
    groups[0]!.nodes[1]!.activeAt = 50;
    const after = followTargets(groups, layout);
    expect(after.map((t) => t.id)).not.toEqual(followTargets(fixture().groups, layout).map((t) => t.id));
    expect(followSignature(after)).toBe(before);
  });

  it('changes when a node joins or leaves', () => {
    const { groups, layout } = fixture();
    const before = followSignature(followTargets(groups, layout));
    groups[0]!.nodes[2]!.active = true;
    expect(followSignature(followTargets(groups, layout))).not.toBe(before);
    groups[0]!.nodes[2]!.active = false;
    groups[0]!.nodes[0]!.active = false;
    expect(followSignature(followTargets(groups, layout))).not.toBe(before);
  });
});
