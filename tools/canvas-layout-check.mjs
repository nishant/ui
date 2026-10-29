// Self-test for layoutSystem and routeEdges. Run after `npm run build`: lays out a 6-column
// fixture and asserts no two group boxes and no two node boxes overlap, every node sits inside
// its group, and the result is deterministic. Then routes a 12-group graph and asserts every
// edge is made of horizontal and vertical segments only, no segment enters a card, and no two
// edges overlap on a line unless they share a source port or a target port. Exits non-zero
// on any failure.
import assert from 'node:assert/strict';
import { layoutSystem, routeEdges } from '../dist/index.js';

const sizes = [2, 5, 1, 7, 3, 4, 6, 2, 1, 4, 3];
const groups = sizes.map((n, i) => ({
  id: `g${i}`,
  title: `Group ${i}`,
  column: i % 6,
  nodes: Array.from({ length: n }, (_, j) => ({ id: `g${i}/n${j}`, label: `Node ${j}` })),
}));

const lay = layoutSystem(groups);
assert.deepEqual(layoutSystem(groups), lay, 'layout is deterministic');

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const check = (boxes, what) => {
  const ids = Object.keys(boxes);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      assert.ok(!overlap(boxes[ids[i]], boxes[ids[j]]), `${what} ${ids[i]} overlaps ${ids[j]}`);
    }
  }
};
check(lay.groups, 'group');
check(lay.nodes, 'node');

for (const g of groups) {
  const gb = lay.groups[g.id];
  assert.ok(gb.x >= 0 && gb.y >= 0 && gb.x + gb.w <= lay.width && gb.y + gb.h <= lay.height, `${g.id} is inside the layout`);
  for (const n of g.nodes) {
    const nb = lay.nodes[n.id];
    assert.ok(nb.x >= gb.x && nb.y >= gb.y && nb.x + nb.w <= gb.x + gb.w && nb.y + nb.h <= gb.y + gb.h, `${n.id} is inside ${g.id}`);
  }
}

// Columns are at least 420 apart.
const xs = [...new Set(groups.map((g) => lay.groups[g.id].x))].sort((a, b) => a - b);
assert.equal(xs.length, 6);
for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 420, 'columns are 420 apart or more');

// A group of one node has a single column; the empty layout is empty.
assert.equal(lay.groups.g2.w, 204);
assert.deepEqual(layoutSystem([]), { width: 0, height: 0, groups: {}, nodes: {} });

// The edge channels outside the outermost sub-columns fit inside the layout.
const left = Math.min(...groups.map((g) => lay.groups[g.id].x));
const right = Math.max(...groups.map((g) => lay.groups[g.id].x + lay.groups[g.id].w));
assert.ok(left >= 60 && lay.width >= right + 60, 'layout leaves a 60 px channel on both sides');

// --- routeEdges ---------------------------------------------------------------------
// 12 groups over 6 layers; layer 2 is tall, so layoutSystem wraps it into two sub-columns.
const grp = (id, column, count) => ({
  id,
  title: id,
  column,
  nodes: Array.from({ length: count }, (_, j) => ({ id: `${id}/n${j}`, label: `Node ${j}` })),
});
const rg = [
  grp('A', 0, 2),
  grp('B', 1, 3),
  grp('C', 1, 2),
  grp('D1', 2, 2),
  grp('D2', 2, 3),
  grp('D3', 2, 2),
  grp('D4', 2, 3),
  grp('D5', 2, 2),
  grp('E', 3, 4),
  grp('F', 3, 2),
  grp('G', 4, 3),
  grp('H', 5, 1),
];
const rl = layoutSystem(rg);
const subColumns = new Set(rg.map((g) => rl.groups[g.id].x));
assert.equal(subColumns.size, 7, 'one layer wraps into two sub-columns');

const e = (id, from, to) => ({ id, from, to });
const redges = [
  // fan-out: one node, eight targets (next and further sub-columns, nodes and a group)
  e('out1', 'B/n0', 'D1/n0'),
  e('out2', 'B/n0', 'D2/n1'),
  e('out3', 'B/n0', 'D3/n0'),
  e('out4', 'B/n0', 'D4/n2'),
  e('out5', 'B/n0', 'D5/n1'),
  e('out6', 'B/n0', 'E/n0'),
  e('out7', 'B/n0', 'E/n3'),
  e('out8', 'B/n0', 'F'),
  // a second edge from the same port (B/n0 and B/n1 sit on one row)
  e('twin', 'B/n1', 'D5/n0'),
  // fan-in: four sources into one node
  e('in1', 'E/n0', 'G/n0'),
  e('in2', 'E/n2', 'G/n0'),
  e('in3', 'F/n0', 'G/n0'),
  e('in4', 'D2/n0', 'G/n0'),
  // long edges skipping sub-columns
  e('long', 'A/n0', 'F/n1'),
  e('long2', 'A/n1', 'G/n2'),
  // backward edges, one inside a sub-column, and an edge inside one group
  e('back1', 'G/n1', 'C/n0'),
  e('back2', 'H/n0', 'B/n2'),
  e('same-col', 'D4/n0', 'D1/n1'),
  e('same-group', 'E/n0', 'E/n3'),
  // group ends
  e('group-ends', 'C', 'D2'),
  e('last', 'G', 'H'),
  e('dangling', 'nope', 'H'),
];
const routes = routeEdges(rl, rg, redges);
assert.deepEqual(routeEdges(rl, rg, redges), routes, 'routing is deterministic');
assert.deepEqual(routeEdges(layoutSystem(rg), rg, [...redges]), routes, 'routing is repeatable from a fresh layout');
assert.equal(routes.dangling, undefined, 'an edge with an unknown end is skipped');
assert.equal(Object.keys(routes).length, redges.length - 1, 'every other edge is routed');

const endOf = (id) => {
  const g = rg.find((x) => x.id === id || x.nodes.some((n) => n.id === id));
  const nb = rl.nodes[id];
  return { card: rl.groups[g.id], y: nb ? nb.y + nb.h / 2 : rl.groups[g.id].y + rl.groups[g.id].h / 2 };
};
const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
const cards = Object.entries(rl.groups);

for (const edge of redges) {
  const r = routes[edge.id];
  if (!r) continue;
  assert.equal(r.id, edge.id);
  assert.ok(r.points.length >= 2, `${edge.id} has a line`);
  // The source port is on its card's right border and the target port on its card's left
  // border, at the node's center (the group's middle for a group).
  const a = endOf(edge.from);
  const b = endOf(edge.to);
  assert.deepEqual(r.points[0], [a.card.x + a.card.w, a.y], `${edge.id} starts at the source port`);
  assert.deepEqual(r.points.at(-1), [b.card.x, b.y], `${edge.id} ends at the target port`);
  // Only horizontal and vertical segments, none of zero length, and none through a card.
  for (const [p, q] of segs(r.points)) {
    assert.ok((p[0] === q[0]) !== (p[1] === q[1]), `${edge.id} segment ${p} to ${q} is axis-aligned and not empty`);
    for (const [id, c] of cards) {
      const inside = Math.min(p[0], q[0]) < c.x + c.w && Math.max(p[0], q[0]) > c.x && Math.min(p[1], q[1]) < c.y + c.h && Math.max(p[1], q[1]) > c.y;
      assert.ok(!inside, `${edge.id} segment ${p} to ${q} crosses card ${id}`);
    }
  }
  for (const [x] of r.points) assert.ok(x >= 0 && x <= rl.width, `${edge.id} stays inside the layout width`);
  // The path is M, L and A commands only, and ends at the target port.
  assert.ok(/^M[-\d. ]+(?:[LA][-\d. ]+)*$/.test(r.d), `${edge.id} path data is plain M, L and A`);
  const end = r.points.at(-1);
  assert.ok(r.d.endsWith(`L${end[0]} ${end[1]}`), `${edge.id} path ends at the target port`);
}

// Two edges overlap on a line only when they share a source port or a target port.
const ids = Object.keys(routes);
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const r1 = routes[ids[i]];
    const r2 = routes[ids[j]];
    if (String(r1.points[0]) === String(r2.points[0])) continue;
    if (String(r1.points.at(-1)) === String(r2.points.at(-1))) continue;
    for (const [p, q] of segs(r1.points)) {
      for (const [u, v] of segs(r2.points)) {
        const horizontal = p[1] === q[1] && u[1] === v[1] && p[1] === u[1];
        const vertical = p[0] === q[0] && u[0] === v[0] && p[0] === u[0];
        if (!horizontal && !vertical) continue;
        const k = horizontal ? 0 : 1;
        const shared = Math.min(Math.max(p[k], q[k]), Math.max(u[k], v[k])) - Math.max(Math.min(p[k], q[k]), Math.min(u[k], v[k]));
        assert.ok(shared <= 1, `${ids[i]} and ${ids[j]} run on one line for ${shared} px`);
      }
    }
  }
}

// The fan-out edges (and the twin from the same port) leave on one trunk: same first two points.
const trunk = Object.values(routes).filter((r) => r.id.startsWith('out') || r.id === 'twin');
assert.equal(trunk.length, 9);
for (const r of trunk) assert.deepEqual(r.points.slice(0, 2), trunk[0].points.slice(0, 2), `${r.id} shares the fan-out trunk`);
// The fan-in edges merge: they all end at one point, and most of them on the same last segment.
const fanIn = ['in1', 'in2', 'in3', 'in4'].map((id) => routes[id].points.slice(-2));
for (const last of fanIn) assert.deepEqual(last[1], fanIn[0][1], 'fan-in edges end at one port');
assert.ok(fanIn.filter((last) => String(last) === String(fanIn[2])).length >= 3, 'fan-in edges merge into one lane');

console.log('canvas-layout-check: ok');
