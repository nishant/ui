// Self-test for layoutSystem. Run after `npm run build`: lays out a 6-column fixture and
// asserts no two group boxes and no two node boxes overlap, every node sits inside its
// group, and the result is deterministic. Exits non-zero on any failure.
import assert from 'node:assert/strict';
import { layoutSystem } from '../dist/index.js';

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
console.log('canvas-layout-check: ok');
