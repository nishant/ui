// Self-test for layoutSystem and routeEdges. Run after `npm run build`: lays out a 6-column
// fixture and asserts no two group boxes and no two node boxes overlap, every node sits inside
// its group, and the result is deterministic. Then routes a 12-group graph and asserts every
// edge is made of horizontal and vertical segments only, no segment enters a card, and no two
// edges overlap on a line unless they share a source port or a target port. Exits non-zero
// on any failure.
import assert from "node:assert/strict";
import { routeEdges } from "../dist/esm/index.js";
import { buildSync } from "esbuild";

// layout.ts is bundled straight from source so the check sees pickLayout and the layout
// constants whether or not the public entry exports them yet.
const built = buildSync({
  entryPoints: ["src/components/canvas/layout.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  logLevel: "silent",
});
const { layoutSystem, pickLayout, GROUP_GAP_X, BAND_TITLE } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString("base64")}`
);

const sizes = [2, 5, 1, 7, 3, 4, 6, 2, 1, 4, 3];
const groups = sizes.map((n, i) => ({
  id: `g${i}`,
  title: `Group ${i}`,
  column: i % 6,
  nodes: Array.from({ length: n }, (_, j) => ({
    id: `g${i}/n${j}`,
    label: `Node ${j}`,
  })),
}));

const lay = layoutSystem(groups);
assert.deepEqual(layoutSystem(groups), lay, "layout is deterministic");

const overlap = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const check = (boxes, what) => {
  const ids = Object.keys(boxes);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      assert.ok(
        !overlap(boxes[ids[i]], boxes[ids[j]]),
        `${what} ${ids[i]} overlaps ${ids[j]}`,
      );
    }
  }
};
check(lay.groups, "group");
check(lay.nodes, "node");

for (const g of groups) {
  const gb = lay.groups[g.id];
  assert.ok(
    gb.x >= 0 &&
      gb.y >= 0 &&
      gb.x + gb.w <= lay.width &&
      gb.y + gb.h <= lay.height,
    `${g.id} is inside the layout`,
  );
  for (const n of g.nodes) {
    const nb = lay.nodes[n.id];
    assert.ok(
      nb.x >= gb.x &&
        nb.y >= gb.y &&
        nb.x + nb.w <= gb.x + gb.w &&
        nb.y + nb.h <= gb.y + gb.h,
      `${n.id} is inside ${g.id}`,
    );
  }
}

// Columns are at least 420 apart.
const xs = [...new Set(groups.map((g) => lay.groups[g.id].x))].sort(
  (a, b) => a - b,
);
assert.equal(xs.length, 6);
for (let i = 1; i < xs.length; i++)
  assert.ok(xs[i] - xs[i - 1] >= 420, "columns are 420 apart or more");

// A group of one node has a single column; the empty layout is empty.
assert.equal(lay.groups.g2.w, 204);
assert.deepEqual(layoutSystem([]), {
  mode: "columns",
  width: 0,
  height: 0,
  titleRoom: 36,
  headers: [],
  groups: {},
  nodes: {},
});

// Columns headers: one per column value, above the column's topmost group.
assert.equal(lay.headers.length, 6, "columns layout has one header per column");
assert.equal(lay.titleRoom, 36);
assert.equal(lay.mode, "columns");
for (const h of lay.headers) {
  const inCol = groups
    .filter((g) => g.column === h.index)
    .map((g) => lay.groups[g.id]);
  assert.equal(h.x, Math.min(...inCol.map((b) => b.x)));
  assert.equal(h.y, Math.min(...inCol.map((b) => b.y)) - 36);
}

// The edge channels outside the outermost sub-columns fit inside the layout.
const left = Math.min(...groups.map((g) => lay.groups[g.id].x));
const right = Math.max(
  ...groups.map((g) => lay.groups[g.id].x + lay.groups[g.id].w),
);
assert.ok(
  left >= 60 && lay.width >= right + 60,
  "layout leaves a 60 px channel on both sides",
);

// --- routeEdges ---------------------------------------------------------------------
// 12 groups over 6 layers; layer 2 is tall, so layoutSystem wraps it into two sub-columns.
const grp = (id, column, count) => ({
  id,
  title: id,
  column,
  nodes: Array.from({ length: count }, (_, j) => ({
    id: `${id}/n${j}`,
    label: `Node ${j}`,
  })),
});
const rg = [
  grp("A", 0, 2),
  grp("B", 1, 3),
  grp("C", 1, 2),
  grp("D1", 2, 2),
  grp("D2", 2, 3),
  grp("D3", 2, 2),
  grp("D4", 2, 3),
  grp("D5", 2, 2),
  grp("E", 3, 4),
  grp("F", 3, 2),
  grp("G", 4, 3),
  grp("H", 5, 1),
];
const rl = layoutSystem(rg);
const subColumns = new Set(rg.map((g) => rl.groups[g.id].x));
assert.equal(subColumns.size, 7, "one layer wraps into two sub-columns");

const e = (id, from, to) => ({ id, from, to });
const redges = [
  // fan-out: one node, eight targets (next and further sub-columns, nodes and a group)
  e("out1", "B/n0", "D1/n0"),
  e("out2", "B/n0", "D2/n1"),
  e("out3", "B/n0", "D3/n0"),
  e("out4", "B/n0", "D4/n2"),
  e("out5", "B/n0", "D5/n1"),
  e("out6", "B/n0", "E/n0"),
  e("out7", "B/n0", "E/n3"),
  e("out8", "B/n0", "F"),
  // a second edge from the same port (B/n0 and B/n1 sit on one row)
  e("twin", "B/n1", "D5/n0"),
  // fan-in: four sources into one node
  e("in1", "E/n0", "G/n0"),
  e("in2", "E/n2", "G/n0"),
  e("in3", "F/n0", "G/n0"),
  e("in4", "D2/n0", "G/n0"),
  // long edges skipping sub-columns
  e("long", "A/n0", "F/n1"),
  e("long2", "A/n1", "G/n2"),
  // backward edges, one inside a sub-column, and an edge inside one group
  e("back1", "G/n1", "C/n0"),
  e("back2", "H/n0", "B/n2"),
  e("same-col", "D4/n0", "D1/n1"),
  e("same-group", "E/n0", "E/n3"),
  // group ends
  e("group-ends", "C", "D2"),
  e("last", "G", "H"),
  e("dangling", "nope", "H"),
];
const routes = routeEdges(rl, rg, redges);
assert.deepEqual(
  routeEdges(rl, rg, redges),
  routes,
  "routing is deterministic",
);
assert.deepEqual(
  routeEdges(layoutSystem(rg), rg, [...redges]),
  routes,
  "routing is repeatable from a fresh layout",
);
assert.equal(
  routes.dangling,
  undefined,
  "an edge with an unknown end is skipped",
);
assert.equal(
  Object.keys(routes).length,
  redges.length - 1,
  "every other edge is routed",
);

const endOf = (id) => {
  const g = rg.find((x) => x.id === id || x.nodes.some((n) => n.id === id));
  const nb = rl.nodes[id];
  return {
    card: rl.groups[g.id],
    y: nb ? nb.y + nb.h / 2 : rl.groups[g.id].y + rl.groups[g.id].h / 2,
  };
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
  assert.deepEqual(
    r.points[0],
    [a.card.x + a.card.w, a.y],
    `${edge.id} starts at the source port`,
  );
  assert.deepEqual(
    r.points.at(-1),
    [b.card.x, b.y],
    `${edge.id} ends at the target port`,
  );
  // Only horizontal and vertical segments, none of zero length, and none through a card.
  for (const [p, q] of segs(r.points)) {
    assert.ok(
      (p[0] === q[0]) !== (p[1] === q[1]),
      `${edge.id} segment ${p} to ${q} is axis-aligned and not empty`,
    );
    for (const [id, c] of cards) {
      const inside =
        Math.min(p[0], q[0]) < c.x + c.w &&
        Math.max(p[0], q[0]) > c.x &&
        Math.min(p[1], q[1]) < c.y + c.h &&
        Math.max(p[1], q[1]) > c.y;
      assert.ok(!inside, `${edge.id} segment ${p} to ${q} crosses card ${id}`);
    }
  }
  for (const [x] of r.points)
    assert.ok(
      x >= 0 && x <= rl.width,
      `${edge.id} stays inside the layout width`,
    );
  // The path is M, L and A commands only, and ends at the target port.
  assert.ok(
    /^M[-\d. ]+(?:[LA][-\d. ]+)*$/.test(r.d),
    `${edge.id} path data is plain M, L and A`,
  );
  const end = r.points.at(-1);
  assert.ok(
    r.d.endsWith(`L${end[0]} ${end[1]}`),
    `${edge.id} path ends at the target port`,
  );
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
        const shared =
          Math.min(Math.max(p[k], q[k]), Math.max(u[k], v[k])) -
          Math.max(Math.min(p[k], q[k]), Math.min(u[k], v[k]));
        assert.ok(
          shared <= 1,
          `${ids[i]} and ${ids[j]} run on one line for ${shared} px`,
        );
      }
    }
  }
}

// The fan-out edges (and the twin from the same port) leave on one trunk: same first two points.
const trunk = Object.values(routes).filter(
  (r) => r.id.startsWith("out") || r.id === "twin",
);
assert.equal(trunk.length, 9);
for (const r of trunk)
  assert.deepEqual(
    r.points.slice(0, 2),
    trunk[0].points.slice(0, 2),
    `${r.id} shares the fan-out trunk`,
  );
// The fan-in edges merge: they all end at one point, and most of them on the same last segment.
const fanIn = ["in1", "in2", "in3", "in4"].map((id) =>
  routes[id].points.slice(-2),
);
for (const last of fanIn)
  assert.deepEqual(last[1], fanIn[0][1], "fan-in edges end at one port");
assert.ok(
  fanIn.filter((last) => String(last) === String(fanIn[2])).length >= 3,
  "fan-in edges merge into one lane",
);

// --- bands layout --------------------------------------------------------------------
const bg = groups.map((g, i) => ({ ...g, band: i % 3 }));
const bedges = [
  { id: "b1", from: "g0/n0", to: "g1" },
  { id: "b2", from: "g1/n1", to: "g5/n0" },
  { id: "b3", from: "g8", to: "g2/n0" },
  { id: "b4", from: "g4", to: "g7" },
  { id: "b5", from: "nope", to: "g7" },
];
const bl = layoutSystem(bg, { mode: "bands", width: 900, edges: bedges });
assert.deepEqual(
  layoutSystem(bg, { mode: "bands", width: 900, edges: bedges }),
  bl,
  "bands layout is deterministic",
);
assert.equal(bl.mode, "bands");
assert.equal(bl.titleRoom, 0);
check(bl.groups, "bands group");
check(bl.nodes, "bands node");
for (const g of bg) {
  const gb = bl.groups[g.id];
  assert.ok(
    gb.x >= 60 &&
      gb.y >= 100 &&
      gb.x + gb.w <= bl.width - 60 &&
      gb.y + gb.h <= bl.height - 60,
    `${g.id} is inside the bands layout`,
  );
  for (const n of g.nodes) {
    const nb = bl.nodes[n.id];
    assert.ok(
      nb.x >= gb.x &&
        nb.y >= gb.y &&
        nb.x + nb.w <= gb.x + gb.w &&
        nb.y + nb.h <= gb.y + gb.h,
      `${n.id} is inside ${g.id} (bands)`,
    );
  }
}
// Groups of a row share y; a band is entirely below the previous one.
const bandBoxes = [0, 1, 2].map((b) =>
  bg.filter((g) => g.band === b).map((g) => bl.groups[g.id]),
);
for (const boxes of bandBoxes) {
  const ys = [...new Set(boxes.map((b) => b.y))].sort((a, b) => a - b);
  for (const y of ys) {
    const row = boxes.filter((b) => b.y === y);
    const rowWidth =
      row.reduce((s, b) => s + b.w, 0) + (row.length - 1) * GROUP_GAP_X;
    assert.ok(rowWidth <= 900 || row.length === 1, "a row is no wider than W");
  }
  for (let i = 1; i < ys.length; i++) {
    const above = boxes.filter((b) => b.y === ys[i - 1]);
    assert.ok(
      ys[i] >= Math.max(...above.map((b) => b.y + b.h)) + 72,
      "rows keep at least 72 px apart",
    );
  }
}
for (let b = 1; b < 3; b++) {
  const prevBottom = Math.max(...bandBoxes[b - 1].map((x) => x.y + x.h));
  const top = Math.min(...bandBoxes[b].map((x) => x.y));
  assert.ok(
    top >= prevBottom + 72 + BAND_TITLE,
    `band ${b} starts below band ${b - 1}`,
  );
}
assert.equal(bl.headers.length, 3, "bands layout has one header per band");
bl.headers.forEach((h, b) => {
  assert.equal(h.index, b);
  const first = bandBoxes[b].reduce((m, x) =>
    x.y < m.y || (x.y === m.y && x.x < m.x) ? x : m,
  );
  assert.deepEqual(
    [h.x, h.y],
    [first.x, first.y - 12],
    `band ${b} header sits over its first group`,
  );
});
// Groups in a band read in column order.
let lastKey = -1;
for (const g of bg
  .filter((x) => x.band === 0)
  .sort((a, b) => a.column - b.column)) {
  const key = bl.groups[g.id].y * 10000 + bl.groups[g.id].x;
  assert.ok(key > lastKey, "band 0 groups read in column order");
  lastKey = key;
}
// Edges only widen the gaps; they default to none.
const quiet = layoutSystem(bg, { mode: "bands", width: 900, edges: [] });
assert.ok(quiet.height <= bl.height, "edges only widen the gaps");
assert.deepEqual(
  layoutSystem(bg, { mode: "bands", width: 900 }),
  quiet,
  "edges default to none",
);

// Edge cases: empty, zero-node and one-node groups, a group wider than W.
assert.deepEqual(layoutSystem([], { mode: "bands", width: 900 }), {
  mode: "bands",
  width: 0,
  height: 0,
  titleRoom: 0,
  headers: [],
  groups: {},
  nodes: {},
});
const odd = [
  { id: "x", title: "x", column: 0, nodes: [] },
  { id: "y", title: "y", column: 0, nodes: [{ id: "y/n", label: "n" }] },
  {
    id: "z",
    title: "z",
    column: 0,
    nodes: [
      { id: "z/a", label: "a" },
      { id: "z/b", label: "b" },
    ],
  },
];
const ol = layoutSystem(odd, { mode: "bands", width: 100 });
assert.equal(ol.groups.x.h, 68, "a group with no nodes is 68 tall");
assert.equal(
  new Set(Object.values(ol.groups).map((b) => b.y)).size,
  3,
  "a group wider than W gets its own row",
);
assert.equal(ol.headers.length, 1);
assert.ok(ol.width >= 60 + 388 + 60);

// --- pickLayout ----------------------------------------------------------------------
const rowCount = (l) => new Set(Object.values(l.groups).map((b) => b.y)).size;
const phone = pickLayout(bg, bedges, { w: 360, h: 780 }, "auto");
assert.equal(phone.mode, "bands", "phones get bands");
assert.equal(
  rowCount(phone),
  bg.length,
  "on a phone every row holds one group",
);
assert.equal(pickLayout(bg, bedges, { w: 360, h: 780 }, "bands").mode, "bands");
assert.equal(
  pickLayout(bg, bedges, { w: 360, h: 780 }, "columns").mode,
  "columns",
);

const score = (l, vw, vh) =>
  l.width <= 0 || l.height <= 0
    ? 1
    : Math.min((vw - 96) / l.width, (vh - 96) / (l.height + l.titleRoom), 1);
for (const [vw, vh] of [
  [3000, 800],
  [1440, 900],
  [840, 900],
  [2560, 1080],
]) {
  const picked = pickLayout(bg, bedges, { w: vw, h: vh }, "auto");
  assert.deepEqual(
    pickLayout(bg, bedges, { w: vw, h: vh }, "auto"),
    picked,
    "pickLayout is deterministic",
  );
  assert.ok(
    score(picked, vw, vh) >= score(layoutSystem(bg), vw, vh),
    `auto at ${vw}x${vh} scores at least as well as columns`,
  );
  const bandsPick = pickLayout(bg, bedges, { w: vw, h: vh }, "bands");
  assert.equal(bandsPick.mode, "bands");
  if (picked.mode === "bands")
    assert.deepEqual(
      picked,
      bandsPick,
      "auto picks the best bands candidate when it wins",
    );
}
assert.equal(pickLayout(bg, bedges, { w: 0, h: 0 }, "auto").mode, "bands");
assert.equal(
  rowCount(pickLayout(bg, bedges, { w: 0, h: 0 }, "auto")),
  bg.length,
  "an unknown viewport gets the one-group-per-row layout",
);
assert.equal(pickLayout(bg, bedges, { w: 0, h: 0 }, "columns").mode, "columns");
assert.deepEqual(pickLayout([], [], { w: 1000, h: 800 }, "auto").groups, {});

// Canvases of 480 to 600 px (docs previews): the chosen layout must fit at max(fit, phone zoom).
for (const [w, h] of [
  [555, 460],
  [555, 520],
  [500, 400],
  [599, 600],
]) {
  for (const mode of ["auto", "bands"]) {
    const chosen = pickLayout(bg, bedges, { w, h }, mode);
    const fit = Math.min(
      (w - 2 * 48) / chosen.width,
      (h - 2 * 48) / (chosen.height + chosen.titleRoom),
      1,
    );
    assert.ok(
      chosen.width * Math.max(fit, 0.55) <= w + 0.5,
      `${mode} ${w}x${h}: layout ${chosen.width} wide fits at k >= 0.55`,
    );
  }
}

console.log("canvas-layout-check: ok");
