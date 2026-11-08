// src/components/canvas/layout.ts
import { FIT_PAD, PHONE_K, PHONE_MAX_W } from "./view.js";
var NODE_W = 172;
var NODE_H = 56;
var NODE_GAP = 12;
var GROUP_PAD = 16;
var GROUP_HEAD = 52;
var MIN_COLUMN_STEP = 420;
var CHANNEL_EDGE = 60;
var GROUP_GAP_X = 56;
var BAND_TITLE = 40;
var GAP_MIN = 72;
var GAP_MAX = 240;
var COLUMN_TITLE_ROOM = 36;
function sizeGroups(groups) {
  const sized = /* @__PURE__ */ new Map();
  for (const g of groups) {
    const cols = g.nodes.length > 1 ? 2 : 1;
    const rows = Math.ceil(g.nodes.length / cols);
    const w = GROUP_PAD * 2 + cols * NODE_W + (cols - 1) * NODE_GAP;
    const h = GROUP_HEAD + GROUP_PAD + (rows > 0 ? rows * NODE_H + (rows - 1) * NODE_GAP : 0);
    sized.set(g.id, { w, h, cols });
  }
  return sized;
}
function placeGroup(out, g, s, x, y) {
  out.groups[g.id] = { x, y, w: s.w, h: s.h };
  g.nodes.forEach((n, i) => {
    out.nodes[n.id] = {
      x: x + GROUP_PAD + i % s.cols * (NODE_W + NODE_GAP),
      y: y + GROUP_HEAD + Math.floor(i / s.cols) * (NODE_H + NODE_GAP),
      w: NODE_W,
      h: NODE_H
    };
  });
}
function layoutBands(groups, width, edges) {
  const out = {
    mode: "bands",
    width: 0,
    height: 0,
    titleRoom: 0,
    headers: [],
    groups: {},
    nodes: {}
  };
  if (groups.length === 0) return out;
  const sized = sizeGroups(groups);
  const bandOf = (g) => g.band ?? g.column;
  const bandIds = [...new Set(groups.map(bandOf))].sort((a, b) => a - b);
  const rows = [];
  for (const band of bandIds) {
    const members = groups.map((g, i) => ({ g, i })).filter((m) => bandOf(m.g) === band).sort((a, b) => a.g.column - b.g.column || a.i - b.i).map((m) => m.g);
    let cur = null;
    for (const g of members) {
      const s = sized.get(g.id);
      if (cur && cur.w + GROUP_GAP_X + s.w <= width) {
        cur.list.push(g);
        cur.w += GROUP_GAP_X + s.w;
        cur.h = Math.max(cur.h, s.h);
      } else {
        cur = { band, firstOfBand: cur === null, list: [g], w: s.w, h: s.h };
        rows.push(cur);
      }
    }
  }
  const rowOf = /* @__PURE__ */ new Map();
  rows.forEach((r, ri) => {
    for (const g of r.list) {
      rowOf.set(g.id, ri);
      for (const n of g.nodes) rowOf.set(n.id, ri);
    }
  });
  const ends = Array.from(
    { length: Math.max(0, rows.length - 1) },
    () => /* @__PURE__ */ new Set()
  );
  for (const e of edges) {
    const s = rowOf.get(e.from);
    const t = rowOf.get(e.to);
    if (s === void 0 || t === void 0 || s === t) continue;
    if (s < t) {
      ends[s].add(`df:${e.from}`);
      ends[t - 1].add(`dt:${e.to}`);
    } else {
      ends[s - 1].add(`uf:${e.from}`);
      ends[t].add(`ut:${e.to}`);
    }
  }
  const widest = rows.reduce((m, r) => Math.max(m, r.w), 0);
  out.width = CHANNEL_EDGE + widest + CHANNEL_EDGE;
  let y = CHANNEL_EDGE + BAND_TITLE;
  rows.forEach((r, ri) => {
    if (ri > 0) {
      const gap = Math.min(
        GAP_MAX,
        Math.max(GAP_MIN, 40 + 8 * ends[ri - 1].size)
      );
      y += gap + (r.firstOfBand ? BAND_TITLE : 0);
    }
    let x = CHANNEL_EDGE + (widest - r.w) / 2;
    r.list.forEach((g, gi) => {
      const s = sized.get(g.id);
      placeGroup(out, g, s, x, y);
      if (r.firstOfBand && gi === 0)
        out.headers.push({ index: r.band, x, y: y - 12 });
      x += s.w + GROUP_GAP_X;
    });
    if (ri === rows.length - 1) out.height = y + r.h + CHANNEL_EDGE;
    y += r.h;
  });
  return out;
}
function layoutSystem(groups, o = {}) {
  if (o.mode === "bands")
    return layoutBands(groups, o.width ?? 0, o.edges ?? []);
  const columnGap = o.columnGap ?? 120;
  const rowGap = o.rowGap ?? 40;
  const columns = [...new Set(groups.map((g) => g.column))].sort(
    (a, b) => a - b
  );
  const sized = sizeGroups(groups);
  const stackHeight = (list) => list.reduce((sum, g) => sum + sized.get(g.id).h, 0) + Math.max(0, list.length - 1) * rowGap;
  const whole = columns.map((c) => groups.filter((g) => g.column === c));
  const sorted = whole.map(stackHeight).sort((a, b) => a - b);
  const median = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];
  const members = [];
  for (const list of whole) {
    const h = stackHeight(list);
    const parts = median > 0 && list.length > 1 ? Math.min(3, list.length, Math.ceil(h / (median * 1.5))) : 1;
    if (parts <= 1) {
      members.push(list);
      continue;
    }
    const goal = h / parts;
    let cur = [];
    let cuts = 0;
    for (const g of list) {
      if (cur.length > 0 && cuts < parts - 1 && stackHeight(cur) + rowGap + sized.get(g.id).h / 2 > goal) {
        members.push(cur);
        cur = [];
        cuts++;
      }
      cur.push(g);
    }
    members.push(cur);
  }
  const heights = members.map(stackHeight);
  const tallest = heights.reduce((m, h) => Math.max(m, h), 0);
  const out = {
    mode: "columns",
    width: 0,
    height: tallest,
    titleRoom: COLUMN_TITLE_ROOM,
    headers: [],
    groups: {},
    nodes: {}
  };
  let x = members.length > 0 ? CHANNEL_EDGE : 0;
  members.forEach((list, ci) => {
    const widest = list.reduce((m, g) => Math.max(m, sized.get(g.id).w), 0);
    let y = (tallest - heights[ci]) / 2;
    for (const g of list) {
      placeGroup(out, g, sized.get(g.id), x, y);
      y += sized.get(g.id).h + rowGap;
    }
    out.width = Math.max(out.width, x + widest);
    x += Math.max(MIN_COLUMN_STEP, widest + columnGap);
  });
  if (members.length > 0) out.width += CHANNEL_EDGE;
  for (const c of columns) {
    const boxes = groups.filter((g) => g.column === c).map((g) => out.groups[g.id]);
    out.headers.push({
      index: c,
      x: Math.min(...boxes.map((b) => b.x)),
      y: Math.min(...boxes.map((b) => b.y)) - COLUMN_TITLE_ROOM
    });
  }
  return out;
}
function layoutCandidates(groups, edges, mode = "auto") {
  if (mode === "columns")
    return {
      mode,
      bands: [],
      columns: layoutSystem(groups, { mode: "columns" })
    };
  const sized = sizeGroups(groups);
  const widths = groups.map((g) => sized.get(g.id).w).sort((a, b) => b - a);
  const perBand = /* @__PURE__ */ new Map();
  for (const g of groups) {
    const b = g.band ?? g.column;
    perBand.set(b, (perBand.get(b) ?? 0) + 1);
  }
  const maxN = Math.max(0, ...perBand.values());
  const rowWidths = [];
  let sum = 0;
  for (let n = 1; n <= maxN; n++) {
    sum += widths[n - 1];
    rowWidths.push(sum + (n - 1) * GROUP_GAP_X);
  }
  if (rowWidths.length === 0) rowWidths.push(0);
  return {
    mode,
    bands: [...new Set(rowWidths)].map(
      (width) => layoutSystem(groups, { mode: "bands", width, edges })
    ),
    columns: mode === "auto" ? layoutSystem(groups, { mode: "columns" }) : null
  };
}
var PHONE_LAYOUT_W = 480;
var SCROLL_K = 0.35;
function chooseLayout(c, viewport) {
  if (c.mode === "columns") return c.columns;
  const candidates = c.bands;
  if (viewport.w <= 0 || viewport.h <= 0) return candidates[0];
  const score = (l) => {
    if (l.width <= 0 || l.height <= 0) return 1;
    return Math.min(
      (viewport.w - 2 * FIT_PAD) / l.width,
      (viewport.h - 2 * FIT_PAD) / (l.height + l.titleRoom),
      1
    );
  };
  const scores = candidates.map(score);
  const top = Math.max(...scores);
  let best = 0;
  scores.forEach((s, i) => {
    if (top - s < 5e-3) best = i;
  });
  if (viewport.w < PHONE_LAYOUT_W || top < (viewport.w < PHONE_MAX_W ? PHONE_K : SCROLL_K)) {
    let pick = candidates[0];
    for (const x of candidates) if (x.width * PHONE_K <= viewport.w - 24) pick = x;
    return pick;
  }
  const bands = candidates[best];
  if (c.mode === "bands" || !c.columns) return bands;
  return score(c.columns) > scores[best] ? c.columns : bands;
}
function pickLayout(groups, edges, viewport, mode = "auto") {
  return chooseLayout(layoutCandidates(groups, edges, mode), viewport);
}
export {
  BAND_TITLE,
  CHANNEL_EDGE,
  GROUP_GAP_X,
  GROUP_HEAD,
  GROUP_PAD,
  MIN_COLUMN_STEP,
  NODE_GAP,
  NODE_H,
  NODE_W,
  SCROLL_K,
  chooseLayout,
  layoutCandidates,
  layoutSystem,
  pickLayout
};
