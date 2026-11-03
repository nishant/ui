import { describe, expect, it } from 'vitest';
import { followStep, followTargets, type FollowTarget } from './follow';
import { chooseLayout, layoutCandidates, layoutSystem, pickLayout, SCROLL_K } from './layout';
import { labelPoint, routeEdges } from './route';
import type { CanvasEdge, CanvasGroup } from './types';
import { centerOn, clampK, ease, MAX_K, MIN_K, PHONE_K, zoomAround } from './view';

const grp = (id: string, column: number, count: number, band?: number): CanvasGroup => ({
  id,
  title: id,
  column,
  band,
  nodes: Array.from({ length: count }, (_, j) => ({ id: `${id}/n${j}`, label: `Node ${j}` })),
});

describe('view math', () => {
  it('clampK keeps the zoom between the limits and passes values inside', () => {
    expect(clampK(0.1)).toBe(MIN_K);
    expect(clampK(9)).toBe(MAX_K);
    expect(clampK(1)).toBe(1);
    expect(clampK(MIN_K)).toBe(MIN_K);
    expect(clampK(MAX_K)).toBe(MAX_K);
  });

  it('ease starts at 0, ends at 1, is 0.5 in the middle and never decreases', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.5, 9);
    expect(ease(0.25)).toBeCloseTo(4 * 0.25 ** 3, 9);
    expect(ease(0.75)).toBeCloseTo(1 - Math.pow(-2 * 0.75 + 2, 3) / 2, 9);
    let last = -1;
    for (let t = 0; t <= 1; t += 0.05) {
      expect(ease(t)).toBeGreaterThanOrEqual(last);
      last = ease(t);
    }
  });

  it('zoomAround keeps the point under the cursor fixed', () => {
    const v = { x: 10, y: 20, k: 1 };
    const next = zoomAround(v, 2, 110, 120);
    expect(next.k).toBe(2);
    // world point under (110, 120) before: ((110-10)/1, (120-20)/1) = (100, 100); after: 100 * 2 + x = 110
    expect(next.x + 100 * 2).toBeCloseTo(110, 9);
    expect(next.y + 100 * 2).toBeCloseTo(120, 9);
  });

  it('zoomAround clamps the zoom and then keeps the point fixed for the clamped zoom', () => {
    const v = { x: 0, y: 0, k: 1 };
    const next = zoomAround(v, 50, 100, 100);
    expect(next.k).toBe(MAX_K);
    expect(next.x).toBeCloseTo(100 - 100 * MAX_K, 9);
  });

  it('centerOn puts the middle of a box in the middle of the viewport', () => {
    const v = centerOn(800, 600, 0.5, { x: 100, y: 200, w: 200, h: 100 });
    expect(v.k).toBe(0.5);
    expect(v.x).toBe(400 - 200 * 0.5);
    expect(v.y).toBe(300 - 250 * 0.5);
  });
});

describe('layoutSystem: columns', () => {
  it('sizes groups from their node count: 1 column for one node, 2 for more', () => {
    const lay = layoutSystem([grp('A', 0, 1), grp('B', 1, 3)]);
    expect(lay.groups.A).toMatchObject({ w: 204, h: 124 });
    expect(lay.groups.B).toMatchObject({ w: 388, h: 192 });
  });

  it('places columns 420px apart at least, with a 60px channel before and after', () => {
    const lay = layoutSystem([grp('A', 0, 1), grp('B', 1, 1)]);
    expect(lay.mode).toBe('columns');
    expect(lay.titleRoom).toBe(36);
    expect(lay.groups.A!.x).toBe(60);
    expect(lay.groups.B!.x).toBe(480);
    expect(lay.width).toBe(480 + 204 + 60);
    expect(lay.height).toBe(124);
  });

  it('a wide group pushes the next column by its width plus the column gap', () => {
    const lay = layoutSystem([grp('A', 0, 2), grp('B', 1, 1)]);
    expect(lay.groups.B!.x).toBe(60 + Math.max(420, 388 + 120));
    const gapped = layoutSystem([grp('A', 0, 1), grp('B', 1, 1)], { columnGap: 400 });
    expect(gapped.groups.B!.x).toBe(60 + 604);
  });

  it('centers a short column against the tallest', () => {
    const lay = layoutSystem([grp('A', 0, 3), grp('B', 1, 1)]);
    expect(lay.groups.A!.y).toBe(0);
    expect(lay.groups.B!.y).toBe((192 - 124) / 2);
  });

  it('places nodes in the group grid with the head and padding offsets', () => {
    const lay = layoutSystem([grp('A', 0, 3)]);
    const g = lay.groups.A!;
    expect(lay.nodes['A/n0']).toEqual({ x: g.x + 16, y: g.y + 52, w: 172, h: 56 });
    expect(lay.nodes['A/n1']).toEqual({ x: g.x + 16 + 172 + 12, y: g.y + 52, w: 172, h: 56 });
    expect(lay.nodes['A/n2']).toEqual({ x: g.x + 16, y: g.y + 52 + 56 + 12, w: 172, h: 56 });
  });

  it('stacks groups of one column in the order given with the row gap between', () => {
    const lay = layoutSystem([grp('A', 0, 1), grp('B', 0, 1)]);
    expect(lay.groups.B!.y - lay.groups.A!.y).toBe(124 + 40);
    expect(layoutSystem([grp('A', 0, 1), grp('B', 0, 1)], { rowGap: 10 }).groups.B!.y).toBe(134);
  });

  it('puts a header over each column at the top of its groups', () => {
    const lay = layoutSystem([grp('A', 0, 1), grp('B', 2, 1)]);
    expect(lay.headers).toEqual([
      { index: 0, x: 60, y: -36 },
      { index: 2, x: 480, y: -36 },
    ]);
  });

  it('wraps a column much taller than the median into side by side sub-columns, keeping order', () => {
    const lay = layoutSystem([grp('A', 0, 1), grp('B', 0, 1), grp('C', 0, 1), grp('D', 1, 1), grp('E', 2, 1)]);
    const xs = ['A', 'B', 'C'].map((id) => lay.groups[id]!.x);
    expect(new Set(xs).size).toBe(3);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it('an empty map has no size', () => {
    const lay = layoutSystem([]);
    expect(lay).toMatchObject({ width: 0, height: 0, headers: [], groups: {}, nodes: {} });
  });

  it('is deterministic', () => {
    const groups = [grp('A', 0, 2), grp('B', 1, 3), grp('C', 1, 1), grp('D', 2, 4)];
    expect(layoutSystem(groups)).toEqual(layoutSystem(groups));
  });
});

describe('layoutSystem: bands', () => {
  const bands = (groups: CanvasGroup[], width: number, edges: CanvasEdge[] = []) => layoutSystem(groups, { mode: 'bands', width, edges });

  it('puts the groups of a band side by side while they fit, 56px apart', () => {
    const lay = bands([grp('A', 0, 1, 0), grp('B', 1, 1, 0)], 464);
    expect(lay.mode).toBe('bands');
    expect(lay.titleRoom).toBe(0);
    expect(lay.groups.A).toMatchObject({ x: 60, y: 100 });
    expect(lay.groups.B).toMatchObject({ x: 60 + 204 + 56, y: 100 });
    expect(lay.width).toBe(60 + 464 + 60);
    expect(lay.height).toBe(100 + 124 + 60);
  });

  it('wraps into rows when the width is one pixel short, and fits at exactly the width', () => {
    expect(bands([grp('A', 0, 1, 0), grp('B', 1, 1, 0)], 464).groups.B!.y).toBe(100);
    const wrapped = bands([grp('A', 0, 1, 0), grp('B', 1, 1, 0)], 463);
    expect(wrapped.groups.B!.y).toBe(100 + 124 + 72);
    expect(wrapped.groups.B!.x).toBe(60);
  });

  it('always puts at least one group in a row', () => {
    const lay = bands([grp('A', 0, 2, 0), grp('B', 1, 2, 0)], 10);
    expect(lay.groups.A!.y).toBeLessThan(lay.groups.B!.y);
  });

  it('centers a short row against the widest', () => {
    const lay = bands([grp('A', 0, 1, 0), grp('B', 1, 1, 0), grp('C', 1, 1, 1)], 464);
    // Band 0 holds A and B (a full row); band 1 holds C alone: 260 narrower, so 130 further in.
    expect(lay.groups.C!.x).toBe(60 + 130);
  });

  it('orders bands by band number (or column) and groups inside by column then input order', () => {
    const lay = bands([grp('B', 1, 1, 0), grp('A', 0, 1, 0), grp('Z', 0, 1, 1)], 600);
    expect(lay.groups.A!.x).toBeLessThan(lay.groups.B!.x);
    expect(lay.groups.Z!.y).toBeGreaterThan(lay.groups.A!.y);
    expect(lay.headers.map((h) => h.index)).toEqual([0, 1]);
  });

  it('leaves 72px between rows, plus a title room before a new band', () => {
    const lay = bands([grp('A', 0, 1, 0), grp('B', 1, 1, 0), grp('C', 1, 1, 1)], 204);
    expect(lay.groups.B!.y - (lay.groups.A!.y + 124)).toBe(72);
    expect(lay.groups.C!.y - (lay.groups.B!.y + 124)).toBe(72 + 40);
  });

  it('puts a header above the first row of each band, 12px over the group', () => {
    const lay = bands([grp('A', 0, 1, 0), grp('B', 1, 1, 1)], 204);
    expect(lay.headers).toEqual([
      { index: 0, x: 60, y: 100 - 12 },
      { index: 1, x: 60, y: lay.groups.B!.y - 12 },
    ]);
  });

  it('grows the gap with the edge ends that need lanes there, 8px each from 40', () => {
    const groups = [grp('A', 0, 1, 0), grp('B', 1, 1, 0), grp('C', 2, 1, 0), grp('D', 0, 1, 1), grp('E', 1, 1, 1), grp('F', 2, 1, 1)];
    const edges: CanvasEdge[] = [
      { id: '1', from: 'A', to: 'D' },
      { id: '2', from: 'B', to: 'E' },
      { id: '3', from: 'C', to: 'F' },
    ];
    const plain = bands(groups, 724);
    const laned = bands(groups, 724, edges);
    expect(plain.groups.D!.y - plain.groups.A!.y - 124).toBe(72 + 40);
    // Six distinct ends (3 sources below row 0, 3 targets above row 1): 40 + 8 * 6 = 88.
    expect(laned.groups.D!.y - laned.groups.A!.y - 124).toBe(88 + 40);
  });

  it('counts an end once however many edges use it, and caps the gap at 240px', () => {
    const groups = [grp('A', 0, 1, 0), grp('D', 0, 1, 1)];
    const many: CanvasEdge[] = Array.from({ length: 30 }, (_, i) => ({ id: `e${i}`, from: 'A', to: 'D' }));
    const lay = bands(groups, 300, many);
    expect(lay.groups.D!.y - lay.groups.A!.y - 124).toBe(72 + 40);
    const nodes = Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, label: `N${i}` }));
    const wide: CanvasGroup[] = [{ id: 'S', title: 'S', column: 0, band: 0, nodes }, grp('T', 0, 1, 1)];
    const edges: CanvasEdge[] = nodes.map((n, i) => ({ id: `x${i}`, from: n.id, to: 'T' }));
    const capped = bands(wide, 500, edges);
    expect(capped.groups.T!.y - (capped.groups.S!.y + capped.groups.S!.h)).toBe(240 + 40);
  });

  it('an edge inside one row needs no lane', () => {
    const groups = [grp('A', 0, 1, 0), grp('B', 1, 1, 0)];
    const lay = bands(groups, 464, [{ id: 'e', from: 'A', to: 'B' }]);
    expect(lay.height).toBe(100 + 124 + 60);
  });

  it('an empty map has no size', () => {
    expect(bands([], 500)).toMatchObject({ width: 0, height: 0, mode: 'bands' });
  });
});

describe('layoutCandidates and chooseLayout', () => {
  const groups = [grp('A', 0, 1, 0), grp('B', 1, 1, 0), grp('C', 2, 1, 0), grp('D', 0, 1, 1), grp('E', 1, 1, 1), grp('F', 2, 1, 1)];

  it('columns mode has only the columns layout; bands mode only bands; auto both', () => {
    const c = layoutCandidates(groups, [], 'columns');
    expect(c.bands).toEqual([]);
    expect(c.columns?.mode).toBe('columns');
    const b = layoutCandidates(groups, [], 'bands');
    expect(b.columns).toBeNull();
    expect(b.bands.length).toBeGreaterThan(0);
    const a = layoutCandidates(groups, [], 'auto');
    expect(a.columns?.mode).toBe('columns');
    expect(a.bands.length).toBeGreaterThan(0);
  });

  it('makes one candidate per row width: the n widest groups side by side', () => {
    const b = layoutCandidates(groups, [], 'bands');
    expect(b.bands.map((l) => l.width)).toEqual([60 + 204 + 60, 60 + 464 + 60, 60 + 724 + 60]);
  });

  it('an empty map still has a candidate', () => {
    const b = layoutCandidates([], [], 'bands');
    expect(b.bands).toHaveLength(1);
  });

  it('before the first measurement the first candidate is used', () => {
    const c = layoutCandidates(groups, [], 'bands');
    expect(chooseLayout(c, { w: 0, h: 0 })).toBe(c.bands[0]);
    expect(chooseLayout(c, { w: 500, h: 0 })).toBe(c.bands[0]);
  });

  it('columns mode ignores the viewport', () => {
    const c = layoutCandidates(groups, [], 'columns');
    expect(chooseLayout(c, { w: 100, h: 100 })).toBe(c.columns);
  });

  it('a phone gets the widest candidate that fits across at the phone zoom', () => {
    const c = layoutCandidates(groups, [], 'auto');
    const lay = chooseLayout(c, { w: 360, h: 640 });
    expect(lay.mode).toBe('bands');
    expect(lay.width * PHONE_K).toBeLessThanOrEqual(360 - 24);
    // 584 * 0.55 fits in 336; 844 * 0.55 does not.
    expect(lay.width).toBe(584);
  });

  it('a narrower phone gets a narrower candidate', () => {
    const c = layoutCandidates(groups, [], 'auto');
    expect(chooseLayout(c, { w: 300, h: 640 }).width).toBe(324);
  });

  it('a big screen picks the layout that shows the map biggest', () => {
    const c = layoutCandidates(groups, [], 'auto');
    const lay = chooseLayout(c, { w: 1600, h: 900 });
    const fit = (l: { width: number; height: number; titleRoom: number }) =>
      Math.min((1600 - 96) / l.width, (900 - 96) / (l.height + l.titleRoom), 1);
    const best = Math.max(...[...c.bands, c.columns!].map(fit));
    expect(fit(lay)).toBeCloseTo(best, 6);
  });

  it('when even the best candidate would open below the scroll zoom, a readable fits-across layout wins', () => {
    const many = Array.from({ length: 12 }, (_, i) => grp(`G${i}`, i % 3, 2, Math.floor(i / 3)));
    const c = layoutCandidates(many, [], 'auto');
    const lay = chooseLayout(c, { w: 700, h: 300 });
    const score = Math.max(...c.bands.map((l) => Math.min((700 - 96) / l.width, (300 - 96) / (l.height + l.titleRoom), 1)));
    expect(score).toBeLessThan(SCROLL_K);
    expect(lay.width * PHONE_K).toBeLessThanOrEqual(700 - 24);
  });

  it('pickLayout is the same as choosing from the candidates', () => {
    const viaPick = pickLayout(groups, [], { w: 1200, h: 800 });
    const via = chooseLayout(layoutCandidates(groups, [], 'auto'), { w: 1200, h: 800 });
    expect(viaPick).toEqual(via);
  });
});

describe('routeEdges', () => {
  const groups = [grp('A', 0, 1), grp('B', 1, 1)];
  const lay = layoutSystem(groups);

  it('runs a straight line from the right border of the source to the left border of the target', () => {
    const r = routeEdges(lay, groups, [{ id: 'e', from: 'A/n0', to: 'B/n0' }]);
    const a = lay.nodes['A/n0']!;
    const b = lay.nodes['B/n0']!;
    const e = r.e!;
    expect(e.dir).toBe('right');
    // Lines leave the right border of the source's card (its group) and enter the left border of the target's.
    const ga = lay.groups.A!;
    const gb = lay.groups.B!;
    expect(e.points[0]).toEqual([ga.x + ga.w, a.y + a.h / 2]);
    expect(e.points.at(-1)).toEqual([gb.x, b.y + b.h / 2]);
    for (let i = 1; i < e.points.length; i++) {
      const [px, py] = e.points[i - 1]!;
      const [qx, qy] = e.points[i]!;
      expect(px === qx || py === qy).toBe(true);
    }
    expect(e.d.startsWith(`M${ga.x + ga.w} ${a.y + a.h / 2}`)).toBe(true);
    expect(e.d.endsWith(`L${gb.x} ${b.y + b.h / 2}`)).toBe(true);
  });

  it('a group end attaches at the middle of its card', () => {
    const r = routeEdges(lay, groups, [{ id: 'e', from: 'A', to: 'B' }]);
    const a = lay.groups.A!;
    expect(r.e!.points[0]).toEqual([a.x + a.w, a.y + a.h / 2]);
  });

  it('skips an edge with an unknown end', () => {
    const r = routeEdges(lay, groups, [
      { id: 'ok', from: 'A', to: 'B' },
      { id: 'bad', from: 'A', to: 'nope' },
      { id: 'bad2', from: 'nope', to: 'B' },
    ]);
    expect(Object.keys(r)).toEqual(['ok']);
  });

  it('is deterministic and keyed by edge id', () => {
    const edges: CanvasEdge[] = [
      { id: 'x', from: 'A', to: 'B' },
      { id: 'y', from: 'B', to: 'A' },
    ];
    expect(routeEdges(lay, groups, edges)).toEqual(routeEdges(lay, groups, edges));
    expect(Object.keys(routeEdges(lay, groups, edges)).sort()).toEqual(['x', 'y']);
  });

  it('in a bands layout lines leave the bottom of the source and enter the top of the target going down', () => {
    const bandGroups = [grp('A', 0, 1, 0), grp('B', 0, 1, 1)];
    const bl = layoutSystem(bandGroups, { mode: 'bands', width: 300 });
    const r = routeEdges(bl, bandGroups, [{ id: 'e', from: 'A', to: 'B' }]).e!;
    const a = bl.groups.A!;
    const b = bl.groups.B!;
    expect(r.dir).toBe('down');
    expect(r.points[0]![1]).toBe(a.y + a.h);
    expect(r.points.at(-1)![1]).toBe(b.y);
  });

  it('an edge between two nodes of one group is a short connector, not a loop around the card', () => {
    const g = [grp('A', 0, 2, 0)];
    const bl = layoutSystem(g, { mode: 'bands', width: 400 });
    const r = routeEdges(bl, g, [{ id: 'e', from: 'A/n0', to: 'A/n1' }]).e!;
    const box = bl.groups.A!;
    for (const [x, y] of r.points) {
      expect(x).toBeGreaterThanOrEqual(box.x - 1);
      expect(x).toBeLessThanOrEqual(box.x + box.w + 1);
      expect(y).toBeGreaterThanOrEqual(box.y - 1);
      expect(y).toBeLessThanOrEqual(box.y + box.h + 1);
    }
  });

  it('rounds corners with arcs of radius 6, shorter on short segments', () => {
    const three = [grp('A', 0, 1), grp('B', 1, 1), grp('C', 2, 3)];
    const l3 = layoutSystem(three);
    const r = routeEdges(l3, three, [{ id: 'e', from: 'A/n0', to: 'C/n2' }]).e!;
    const arcs = r.d.match(/A[\d. ]+/g) ?? [];
    expect(arcs.length).toBe(r.points.length - 2);
    for (const arc of arcs) {
      const radius = Number(arc.split(' ')[0]!.slice(1));
      expect(radius).toBeGreaterThan(0);
      expect(radius).toBeLessThanOrEqual(6);
    }
  });
});

describe('labelPoint', () => {
  it('is the middle of the longest segment', () => {
    expect(
      labelPoint([
        [0, 0],
        [10, 0],
        [10, 50],
        [30, 50],
      ]),
    ).toEqual({ x: 10, y: 25 });
  });

  it('the first of two equally long segments wins', () => {
    expect(
      labelPoint([
        [0, 0],
        [10, 0],
        [10, 10],
      ]),
    ).toEqual({ x: 5, y: 0 });
  });

  it('a single point is its own label point', () => {
    expect(labelPoint([[3, 4]])).toEqual({ x: 3, y: 4 });
  });

  it('measures a vertical segment by its height', () => {
    expect(
      labelPoint([
        [0, 0],
        [0, 100],
      ]),
    ).toEqual({ x: 0, y: 50 });
  });
});

describe('follow: targets and camera', () => {
  const box = { x: 1000, y: 800, w: 172, h: 56 };
  const target = (id: string, extra: Partial<FollowTarget> = {}): FollowTarget => ({ id, label: id, group: 'G', box, at: 0, ...extra });

  it('followTargets lists only active nodes that have a box, newest first, ties in layout order', () => {
    const groups: CanvasGroup[] = [
      {
        id: 'g',
        title: 'G',
        column: 0,
        nodes: [
          { id: 'a', label: 'A', active: true, activeAt: 5 },
          { id: 'b', label: 'B', active: true, activeAt: 9 },
          { id: 'c', label: 'C', active: true, activeAt: 5 },
          { id: 'd', label: 'D', active: false, activeAt: 99 },
          { id: 'e', label: 'E', active: true, activeAt: 99 },
          { id: 'f', label: 'F', active: true },
        ],
      },
    ];
    const layout = layoutSystem(groups);
    delete layout.nodes.e;
    const ts = followTargets(groups, layout);
    expect(ts.map((t) => t.id)).toEqual(['b', 'a', 'c', 'f']);
    expect(ts[0]).toMatchObject({ label: 'B', group: 'G', at: 9 });
    expect(ts.at(-1)!.at).toBe(0);
  });

  it('no targets: idle at the fitted view', () => {
    const fit = { x: 1, y: 2, k: 0.5 };
    expect(followStep([], 0, 800, 600, fit)).toEqual({ mode: 'idle', view: fit, targets: [] });
  });

  it('one target at 600px or wider is centered at zoom 1', () => {
    const step = followStep([target('a')], 0, 600, 400, { x: 0, y: 0, k: 1 });
    expect(step.mode).toBe('all');
    expect(step.view.k).toBe(1);
    expect(step.view.x).toBeCloseTo(300 - (1000 + 86), 6);
    expect(step.view.y).toBeCloseTo(200 - (800 + 28), 6);
  });

  it('one target below 600px uses zoom 0.8 and sits in the top 45% of the viewport', () => {
    const step = followStep([target('a')], 0, 599, 800, { x: 0, y: 0, k: 1 });
    expect(step.view.k).toBe(0.8);
    expect(step.view.y).toBeCloseTo((800 * 0.45) / 2 - (800 + 28) * 0.8, 6);
    expect(step.view.x).toBeCloseTo(599 / 2 - (1000 + 86) * 0.8, 6);
  });

  it('on a phone the camera centers on the group when the group fits the width', () => {
    const groupBox = { x: 900, y: 700, w: 300, h: 300 };
    const step = followStep([target('a', { groupBox })], 0, 400, 800, { x: 0, y: 0, k: 1 });
    expect(step.view.x).toBeCloseTo(200 - (900 + 150) * 0.8, 6);
    const wide = followStep([target('a', { groupBox: { ...groupBox, w: 600 } })], 0, 400, 800, { x: 0, y: 0, k: 1 });
    expect(wide.view.x).toBeCloseTo(200 - (1000 + 86) * 0.8, 6);
  });

  it('a phone keeps the card head clear of the overlay row', () => {
    const near = followStep([target('a', { box: { x: 0, y: 0, w: 172, h: 56 } })], 0, 400, 800, { x: 0, y: 0, k: 1 }, 64);
    // y = max(h * 0.225, top + box.h * k / 2) - (box.y + box.h / 2) * k
    expect(near.view.y).toBeCloseTo(Math.max(180, 64 + 22.4) - 28 * 0.8, 6);
  });

  it('several targets close together show all at once, framed with 80px padding', () => {
    const ts = [target('a', { box: { x: 0, y: 0, w: 172, h: 56 } }), target('b', { box: { x: 300, y: 0, w: 172, h: 56 } })];
    const step = followStep(ts, 0, 1000, 700, { x: 0, y: 0, k: 1 });
    expect(step.mode).toBe('all');
    expect(step.targets).toHaveLength(2);
    // bbox: 472 + 160 wide, 56 + 160 tall; k = min((1000-96)/632, (700-96)/216, 1.1) = 1.1 capped
    expect(step.view.k).toBeCloseTo(Math.min(904 / 632, 604 / 216, 1.1), 6);
  });

  it('targets spread too far apart visit one at a time, wrapping around by index', () => {
    const far = [
      target('a', { box: { x: 0, y: 0, w: 172, h: 56 } }),
      target('b', { box: { x: 5000, y: 3000, w: 172, h: 56 } }),
      target('c', { box: { x: 9000, y: 0, w: 172, h: 56 } }),
    ];
    const one = (i: number) => followStep(far, i, 1000, 700, { x: 0, y: 0, k: 1 });
    expect(one(0).mode).toBe('one');
    expect(one(0).targets.map((t) => t.id)).toEqual(['a']);
    expect(one(1).targets.map((t) => t.id)).toEqual(['b']);
    expect(one(3).targets.map((t) => t.id)).toEqual(['a']);
    expect(one(-1).targets.map((t) => t.id)).toEqual(['c']);
    expect(one(0).view.k).toBe(1);
  });

  it('the all-at-once threshold is 0.55 below 600px and 0.75 from 600px', () => {
    // Two cards 360px apart: the framed box is 692px wide, so the fit zoom is (w - 96) / 692.
    const pair = [target('a', { box: { x: 0, y: 0, w: 172, h: 56 } }), target('b', { box: { x: 360, y: 0, w: 172, h: 56 } })];
    const fit = { x: 0, y: 0, k: 1 };
    // 599px: 0.727 is above the phone threshold of 0.55: both are shown.
    expect(followStep(pair, 0, 599, 700, fit).mode).toBe('all');
    // 600px: 0.728 is below the threshold of 0.75: one at a time.
    expect(followStep(pair, 0, 600, 700, fit).mode).toBe('one');
    // 700px: 0.873 is above 0.75: both again.
    expect(followStep(pair, 0, 700, 700, fit).mode).toBe('all');
    // A phone too narrow for 0.55 (box 692 wide needs 96 + 0.55 * 692 = 477px): one at a time.
    expect(followStep(pair, 0, 470, 700, fit).mode).toBe('one');
    expect(followStep(pair, 0, 480, 700, fit).mode).toBe('all');
  });
});
