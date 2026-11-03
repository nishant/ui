// src/components/canvas/route.ts
import { CHANNEL_EDGE, NODE_GAP } from "./layout.js";
var LANE_MARGIN = 16;
var TRACK_GAP = 8;
var CLEARANCE = 8;
var OUTSIDE_GAP = 24;
var CORNER_R = 6;
function roundedPath(pts) {
  const f = (v) => String(Math.round(v * 100) / 100);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const [cx, cy] = pts[i + 1];
    const r = Math.min(CORNER_R, (Math.abs(bx - ax) + Math.abs(by - ay)) / 2, (Math.abs(cx - bx) + Math.abs(cy - by)) / 2);
    const ux = Math.sign(bx - ax);
    const uy = Math.sign(by - ay);
    const vx = Math.sign(cx - bx);
    const vy = Math.sign(cy - by);
    d += `L${f(bx - ux * r)} ${f(by - uy * r)}A${f(r)} ${f(r)} 0 0 ${ux * vy - uy * vx > 0 ? 1 : 0} ${f(bx + vx * r)} ${f(by + vy * r)}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${f(last[0])} ${f(last[1])}`;
}
function corners(pts) {
  const out = [];
  for (const p of pts) {
    const prev = out[out.length - 1];
    if (prev && prev[0] === p[0] && prev[1] === p[1]) continue;
    const before = out[out.length - 2];
    if (prev && before && (before[0] === prev[0] && prev[0] === p[0] || before[1] === prev[1] && prev[1] === p[1])) out.pop();
    out.push(p);
  }
  return out;
}
function labelPoint(pts) {
  let best = { x: pts[0][0], y: pts[0][1] };
  let len = -1;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const l = Math.abs(bx - ax) + Math.abs(by - ay);
    if (l > len) {
      len = l;
      best = { x: (ax + bx) / 2, y: (ay + by) / 2 };
    }
  }
  return best;
}
var flip = (b) => ({ x: b.y, y: b.x, w: b.h, h: b.w });
function routeEdges(layout, groups, edges) {
  if (layout.mode !== "bands") return routeColumns(layout, groups, edges);
  const t = { ...layout, mode: "columns", width: layout.height, height: layout.width, groups: {}, nodes: {} };
  for (const id of Object.keys(layout.groups)) t.groups[id] = flip(layout.groups[id]);
  for (const id of Object.keys(layout.nodes)) t.nodes[id] = flip(layout.nodes[id]);
  const groupOf = /* @__PURE__ */ new Map();
  for (const g of groups) for (const n of g.nodes) groupOf.set(n.id, g.id);
  const inside = [];
  const outside = [];
  for (const e of edges) {
    const g = groupOf.get(e.from);
    (g !== void 0 && g === groupOf.get(e.to) ? inside : outside).push(e);
  }
  const routed = routeColumns(t, groups, outside);
  const result = {};
  for (const e of inside) {
    const a = layout.nodes[e.from];
    const b = layout.nodes[e.to];
    if (!a || !b || e.from === e.to) continue;
    let points;
    let dir;
    if (b.y >= a.y + a.h) {
      const ax = a.x + a.w / 2;
      const bx = b.x + b.w / 2;
      if (b.y <= a.y + a.h + NODE_GAP + 1) {
        const my = (a.y + a.h + b.y) / 2;
        points = corners([[ax, a.y + a.h], [ax, my], [bx, my], [bx, b.y]]);
      } else {
        const gb = layout.groups[groupOf.get(e.from)];
        const hasRightColumn = !!gb && gb.x + gb.w - (a.x + a.w) > NODE_GAP + 20;
        const gx = hasRightColumn ? a.x + a.w + NODE_GAP / 2 : a.x - NODE_GAP / 2;
        const y1 = a.y + a.h + NODE_GAP / 2;
        const y2 = b.y - NODE_GAP / 2;
        points = corners([[ax, a.y + a.h], [ax, y1], [gx, y1], [gx, y2], [bx, y2], [bx, b.y]]);
      }
      dir = "down";
    } else if (b.x >= a.x + a.w && Math.abs(b.y - a.y) < 1) {
      const cy = a.y + a.h / 2;
      points = [[a.x + a.w, cy], [b.x, cy]];
      dir = "right";
    } else {
      continue;
    }
    result[e.id] = { id: e.id, points, d: roundedPath(points), dir };
  }
  for (const id of Object.keys(routed)) {
    const points = routed[id].points.map(([x, y]) => [y, x]);
    result[id] = { id, points, d: roundedPath(points), dir: "down" };
  }
  return result;
}
function routeColumns(layout, groups, edges) {
  const result = {};
  const cards = [];
  for (const g of groups) {
    const box = layout.groups[g.id];
    if (box) cards.push({ id: g.id, box });
  }
  if (cards.length === 0) return result;
  const colX = [...new Set(cards.map((c) => c.box.x))].sort((a, b) => a - b);
  const cols = colX.map((x) => ({ x, right: x, boxes: [] }));
  const colOf = /* @__PURE__ */ new Map();
  for (const { id, box } of cards) {
    const ci = colX.indexOf(box.x);
    colOf.set(id, ci);
    cols[ci].right = Math.max(cols[ci].right, box.x + box.w);
    cols[ci].boxes.push(box);
  }
  const channelOf = (j) => {
    if (j <= 0) return [cols[0].x - CHANNEL_EDGE, cols[0].x];
    if (j >= cols.length) return [cols[cols.length - 1].right, cols[cols.length - 1].right + CHANNEL_EDGE];
    return [cols[j - 1].right, cols[j].x];
  };
  const minY = cards.reduce((m, c) => Math.min(m, c.box.y), Infinity);
  const maxY = cards.reduce((m, c) => Math.max(m, c.box.y + c.box.h), -Infinity);
  const groupOfNode = /* @__PURE__ */ new Map();
  for (const g of groups) for (const n of g.nodes) groupOfNode.set(n.id, g.id);
  const portOf = (id, side) => {
    const nb = layout.nodes[id];
    const gid = nb ? groupOfNode.get(id) : id;
    const gb = gid ? layout.groups[gid] : void 0;
    if (!gid || !gb || !colOf.has(gid)) return void 0;
    const y = nb ? nb.y + nb.h / 2 : gb.y + gb.h / 2;
    return { key: `${side}|${gid}|${y}`, x: side === "o" ? gb.x + gb.w : gb.x, y, col: colOf.get(gid) };
  };
  const fanOut = /* @__PURE__ */ new Map();
  const wires = [];
  for (const edge of edges) {
    const src = portOf(edge.from, "o");
    const dst = portOf(edge.to, "i");
    if (!src || !dst) continue;
    fanOut.set(src.key, (fanOut.get(src.key) ?? 0) + 1);
    wires.push({ edge, src, dst, mode: dst.col === src.col + 1 ? "next" : dst.col > src.col ? "far" : "back", exit: "", entry: "" });
  }
  const lanes = /* @__PURE__ */ new Map();
  const inChannel = /* @__PURE__ */ new Map();
  const lane = (channel, key, w) => {
    const id = `${channel}|${key}`;
    let l = lanes.get(id);
    if (!l) {
      l = { key: id, ys: 0, n: 0, x: 0 };
      lanes.set(id, l);
      const list = inChannel.get(channel);
      if (list) list.push(l);
      else inChannel.set(channel, [l]);
    }
    l.ys += (w.src.y + w.dst.y) / 2;
    l.n++;
    return id;
  };
  for (const w of wires) {
    if (w.mode === "next") {
      w.exit = w.entry = lane(w.dst.col, fanOut.get(w.src.key) > 1 ? w.src.key : w.dst.key, w);
    } else {
      w.exit = lane(w.src.col + 1, w.src.key, w);
      w.entry = lane(w.dst.col, w.dst.key, w);
    }
  }
  for (const [channel, list] of inChannel) {
    const [l, r] = channelOf(channel);
    const lo = l + LANE_MARGIN;
    const hi = r - LANE_MARGIN;
    list.sort((a, b) => a.ys / a.n - b.ys / b.n || (a.key < b.key ? -1 : 1));
    list.forEach((ln, i) => {
      ln.x = list.length === 1 || hi <= lo ? (l + r) / 2 : lo + (hi - lo) * i / (list.length - 1);
    });
  }
  const taken = [];
  for (const w of wires) {
    taken.push({ y: w.src.y, xa: w.src.x, xb: lanes.get(w.exit).x, src: w.src.key, dst: w.dst.key, track: false });
    taken.push({ y: w.dst.y, xa: lanes.get(w.entry).x, xb: w.dst.x, src: w.src.key, dst: w.dst.key, track: false });
  }
  const sameLine = (h, w) => h.src === w.src.key || h.dst === w.dst.key;
  const trackFree = (y, xa, xb, w) => {
    for (const h of taken) {
      if (Math.min(xb, h.xb) - Math.max(xa, h.xa) <= 0.5) continue;
      const dy = Math.abs(h.y - y);
      if (dy < 0.5 ? !sameLine(h, w) : h.track && dy < TRACK_GAP - 0.5) return false;
    }
    return true;
  };
  const spanOf = (w) => w.mode === "far" ? [w.src.col + 1, w.dst.col - 1] : [w.dst.col, w.src.col];
  const cardFree = (y, c0, c1) => {
    for (let c = c0; c <= c1; c++) for (const b of cols[c].boxes) if (y > b.y - CLEARANCE + 1e-6 && y < b.y + b.h + CLEARANCE - 1e-6) return false;
    return true;
  };
  const bandCache = /* @__PURE__ */ new Map();
  const bandsOf = (c0, c1) => {
    const id = `${c0}-${c1}`;
    let bands = bandCache.get(id);
    if (bands) return bands;
    const spans = [];
    for (let c = c0; c <= c1; c++) for (const b of cols[c].boxes) spans.push([b.y - CLEARANCE, b.y + b.h + CLEARANCE]);
    spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    bands = [];
    let end = spans[0][1];
    for (const [a, b] of spans) {
      if (a >= end) bands.push([end, a]);
      end = Math.max(end, b);
    }
    bandCache.set(id, bands);
    return bands;
  };
  const gap = (avg, [lo, hi]) => avg < lo ? lo - avg : avg > hi ? avg - hi : 0;
  const wanted = /* @__PURE__ */ new Map();
  for (const w of wires) {
    if (w.mode === "next") continue;
    const avg = (w.src.y + w.dst.y) / 2;
    let best;
    for (const b of bandsOf(...spanOf(w))) if (!best || gap(avg, b) < gap(avg, best)) best = b;
    if (best) wanted.set(`${best[0]}|${best[1]}`, (wanted.get(`${best[0]}|${best[1]}`) ?? 0) + 1);
  }
  const trackYs = /* @__PURE__ */ new Map();
  for (const w of wires) {
    if (w.mode === "next") continue;
    const [c0, c1] = spanOf(w);
    const avg = (w.src.y + w.dst.y) / 2;
    const near = (a, b) => Math.abs(a - avg) - Math.abs(b - avg) || a - b;
    const candidates = [];
    for (const h of taken) if (h.track && sameLine(h, w) && !candidates.includes(h.y)) candidates.push(h.y);
    for (const b of [...bandsOf(c0, c1)].sort((p, q) => gap(avg, p) - gap(avg, q) || p[0] - q[0])) {
      const n = Math.min(Math.floor((b[1] - b[0]) / TRACK_GAP) + 1, wanted.get(`${b[0]}|${b[1]}`) ?? 1);
      const slots = [];
      for (let i = 0; i < n; i++) slots.push((b[0] + b[1]) / 2 + TRACK_GAP * (i - (n - 1) / 2));
      candidates.push(...slots.sort(near));
    }
    const outer = [];
    for (let k = 0; k <= wires.length; k++) outer.push(minY - OUTSIDE_GAP - TRACK_GAP * k, maxY + OUTSIDE_GAP + TRACK_GAP * k);
    candidates.push(...outer.sort(near));
    const xo = lanes.get(w.exit).x;
    const xe = lanes.get(w.entry).x;
    const xa = Math.min(xo, xe);
    const xb = Math.max(xo, xe);
    const y = candidates.find((c) => cardFree(c, c0, c1) && trackFree(c, xa, xb, w)) ?? candidates[candidates.length - 1];
    trackYs.set(w.edge.id, y);
    taken.push({ y, xa, xb, src: w.src.key, dst: w.dst.key, track: true });
  }
  for (const w of wires) {
    const { src, dst } = w;
    const xo = lanes.get(w.exit).x;
    const xe = lanes.get(w.entry).x;
    const ty = trackYs.get(w.edge.id);
    const raw = w.mode === "next" ? [[src.x, src.y], [xo, src.y], [xo, dst.y], [dst.x, dst.y]] : [[src.x, src.y], [xo, src.y], [xo, ty], [xe, ty], [xe, dst.y], [dst.x, dst.y]];
    const points = corners(raw);
    result[w.edge.id] = { id: w.edge.id, points, d: roundedPath(points), dir: "right" };
  }
  return result;
}
export {
  labelPoint,
  routeEdges
};
