// Self-test for routeEdges in "bands" and "columns" layouts. Run after `npm run build`: routes a
// 12-group, 3-band graph with 20 edges (downward, upward, same-row, group-to-group, node-to-node)
// and asserts every line is axis-aligned, starts on the source card's bottom border and ends on
// the target card's top border with `dir === 'down'`, and no segment passes through a card.
// Then the same for a columns layout (right border to left border, `dir === 'right'`), and
// determinism. Uses layoutSystem's bands layout once it exists, else a hand-built one.
// Exits non-zero on any failure.
import assert from 'node:assert/strict';
import { layoutSystem, routeEdges } from '../dist/index.js';

const grp = (id, column, count, band) => ({
  id,
  title: id,
  column,
  band,
  nodes: Array.from({ length: count }, (_, j) => ({ id: `${id}/n${j}`, label: `Node ${j}` })),
});
const groups = [
  grp('A', 0, 2, 0),
  grp('B', 1, 1, 0),
  grp('C', 2, 2, 0),
  grp('D', 0, 3, 1),
  grp('E', 1, 2, 1),
  grp('F', 2, 4, 1),
  grp('G', 3, 2, 1),
  grp('H', 4, 1, 1),
  grp('I', 0, 2, 2),
  grp('J', 1, 3, 2),
  grp('K', 2, 1, 2),
  grp('L', 3, 2, 2),
];
const e = (id, from, to) => ({ id, from, to });
const edges = [
  // downward, one source fanning out
  e('d1', 'A/n0', 'D/n0'),
  e('d2', 'A/n0', 'E/n1'),
  e('d3', 'A/n0', 'F/n2'),
  e('d4', 'A/n0', 'G'),
  e('d5', 'B', 'E/n0'),
  e('d6', 'C/n1', 'H/n0'),
  // two bands down
  e('dd1', 'A/n1', 'J/n2'),
  e('dd2', 'C/n0', 'L/n0'),
  // fan-in
  e('in1', 'D/n1', 'I/n0'),
  e('in2', 'E/n0', 'I/n0'),
  e('in3', 'F/n0', 'I/n0'),
  // upward
  e('up1', 'J/n0', 'D/n2'),
  e('up2', 'K/n0', 'B'),
  e('up3', 'H/n0', 'C/n0'),
  // same row
  e('row1', 'D/n0', 'E/n1'),
  e('row2', 'G/n1', 'E/n0'),
  e('row3', 'I', 'L'),
  // group to group
  e('gg1', 'B', 'F'),
  e('gg2', 'K', 'J'),
  e('gg3', 'F', 'G'),
  e('dangling', 'nope', 'H'),
];

// --- layouts ------------------------------------------------------------------------
const size = (g) => {
  const cols = g.nodes.length > 1 ? 2 : 1;
  const rows = Math.ceil(g.nodes.length / cols);
  return { cols, w: 32 + cols * 172 + (cols - 1) * 12, h: 52 + 16 + (rows > 0 ? rows * 56 + (rows - 1) * 12 : 0) };
};
/** Three bands, rows of up to four groups, 56 px between groups and 140 px between rows. */
function handBands() {
  const out = { mode: 'bands', width: 0, height: 0, titleRoom: 0, headers: [], groups: {}, nodes: {} };
  const rows = [];
  for (let b = 0; b < 3; b++) {
    const list = groups.filter((g) => g.band === b);
    for (let i = 0; i < list.length; i += 3) rows.push(list.slice(i, i + 3));
  }
  const widths = rows.map((r) => r.reduce((s, g) => s + size(g).w, 0) + (r.length - 1) * 56);
  const widest = Math.max(...widths);
  let y = 60;
  rows.forEach((r, ri) => {
    let x = 60 + (widest - widths[ri]) / 2;
    let rowH = 0;
    for (const g of r) {
      const s = size(g);
      out.groups[g.id] = { x, y, w: s.w, h: s.h };
      g.nodes.forEach((n, i) => {
        out.nodes[n.id] = { x: x + 16 + (i % s.cols) * 184, y: y + 52 + Math.floor(i / s.cols) * 68, w: 172, h: 56 };
      });
      x += s.w + 56;
      rowH = Math.max(rowH, s.h);
    }
    y += rowH + 140;
  });
  out.width = 60 + widest + 60;
  out.height = y - 140 + 60;
  return out;
}
let bands = layoutSystem(groups, { mode: 'bands', width: 900, edges });
if (bands.mode !== 'bands') bands = handBands();
const columns = layoutSystem(groups);

// --- checks ---------------------------------------------------------------------------
const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);

function verify(label, lay, dir) {
  const routes = routeEdges(lay, groups, edges);
  assert.deepEqual(routeEdges(lay, groups, edges), routes, `${label}: routing is deterministic`);
  assert.equal(routes.dangling, undefined, `${label}: an edge with an unknown end is skipped`);
  assert.equal(Object.keys(routes).length, edges.length - 1, `${label}: every other edge is routed`);
  const cards = Object.entries(lay.groups);
  const endOf = (id) => {
    const g = groups.find((x) => x.id === id || x.nodes.some((n) => n.id === id));
    const nb = lay.nodes[id];
    const c = lay.groups[g.id];
    return { card: c, cx: nb ? nb.x + nb.w / 2 : c.x + c.w / 2, cy: nb ? nb.y + nb.h / 2 : c.y + c.h / 2 };
  };
  for (const edge of edges) {
    const r = routes[edge.id];
    if (!r) continue;
    assert.equal(r.id, edge.id);
    assert.equal(r.dir, dir, `${label}: ${edge.id} dir`);
    assert.ok(r.points.length >= 2, `${label}: ${edge.id} has a line`);
    const a = endOf(edge.from);
    const b = endOf(edge.to);
    if (dir === 'down') {
      assert.deepEqual(r.points[0], [a.cx, a.card.y + a.card.h], `${label}: ${edge.id} starts on the source's bottom border`);
      assert.deepEqual(r.points.at(-1), [b.cx, b.card.y], `${label}: ${edge.id} ends on the target's top border`);
      const [p, q] = r.points.slice(-2);
      assert.ok(p[0] === q[0] && q[1] > p[1], `${label}: ${edge.id} last segment points down`);
    } else {
      assert.deepEqual(r.points[0], [a.card.x + a.card.w, a.cy], `${label}: ${edge.id} starts on the source's right border`);
      assert.deepEqual(r.points.at(-1), [b.card.x, b.cy], `${label}: ${edge.id} ends on the target's left border`);
      const [p, q] = r.points.slice(-2);
      assert.ok(p[1] === q[1] && q[0] > p[0], `${label}: ${edge.id} last segment points right`);
    }
    for (const [p, q] of segs(r.points)) {
      assert.ok((p[0] === q[0]) !== (p[1] === q[1]), `${label}: ${edge.id} segment ${p} to ${q} is axis-aligned and not empty`);
      for (const [id, c] of cards) {
        const inside = Math.min(p[0], q[0]) < c.x + c.w && Math.max(p[0], q[0]) > c.x && Math.min(p[1], q[1]) < c.y + c.h && Math.max(p[1], q[1]) > c.y;
        assert.ok(!inside, `${label}: ${edge.id} segment ${p} to ${q} crosses card ${id}`);
      }
    }
    assert.ok(/^M[-\d. ]+(?:[LA][-\d. ]+)*$/.test(r.d), `${label}: ${edge.id} path data is plain M, L and A`);
    const end = r.points.at(-1);
    assert.ok(r.d.endsWith(`L${end[0]} ${end[1]}`), `${label}: ${edge.id} path ends at the target port`);
  }
  return routes;
}

const downRoutes = verify('bands', bands, 'down');
verify('columns', columns, 'right');
assert.deepEqual(routeEdges(bands, groups, [...edges]), downRoutes, 'bands routing is repeatable');
assert.deepEqual(routeEdges({ ...bands, groups: {}, nodes: {} }, groups, edges), {}, 'a layout with no boxes routes nothing');

console.log('canvas-route-check: ok');
