import type { CanvasEdge, CanvasGroup } from './types';
import { CHANNEL_EDGE, NODE_GAP, type CanvasLayout } from './layout';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoutedEdge {
  id: string;
  /** The corners of the line, source port first. Every segment is horizontal or vertical. */
  points: [number, number][];
  /** The same line as an SVG path with rounded corners; also valid for CSS `offset-path`. */
  d: string;
  /** Direction of travel of the last segment: "right" in "columns", "down" in "bands". */
  dir: 'right' | 'down';
}

const LANE_MARGIN = 16; // a lane keeps this far from the cards on both sides of its channel
const TRACK_GAP = 8; // distance between corridor tracks
const CLEARANCE = 8; // distance a corridor track keeps from group boxes
const OUTSIDE_GAP = 24; // first track above the top group or below the bottom group
const CORNER_R = 6;

interface Port {
  key: string;
  x: number;
  y: number;
  col: number;
}

interface Wire {
  edge: CanvasEdge;
  src: Port;
  dst: Port;
  mode: 'next' | 'far' | 'back';
  exit: string;
  entry: string;
}

interface Lane {
  key: string;
  ys: number;
  n: number;
  x: number;
}

/** A horizontal stretch some edge already occupies; `track` marks corridor tracks. */
interface HSeg {
  y: number;
  xa: number;
  xb: number;
  src: string;
  dst: string;
  track: boolean;
}

/** `pts` as an SVG path whose corners are quarter arcs of radius 6 (less on short segments). */
function roundedPath(pts: [number, number][]): string {
  const f = (v: number) => String(Math.round(v * 100) / 100);
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1]!;
    const [bx, by] = pts[i]!;
    const [cx, cy] = pts[i + 1]!;
    const r = Math.min(CORNER_R, (Math.abs(bx - ax) + Math.abs(by - ay)) / 2, (Math.abs(cx - bx) + Math.abs(cy - by)) / 2);
    const ux = Math.sign(bx - ax);
    const uy = Math.sign(by - ay);
    const vx = Math.sign(cx - bx);
    const vy = Math.sign(cy - by);
    d += `L${f(bx - ux * r)} ${f(by - uy * r)}A${f(r)} ${f(r)} 0 0 ${ux * vy - uy * vx > 0 ? 1 : 0} ${f(bx + vx * r)} ${f(by + vy * r)}`;
  }
  const last = pts[pts.length - 1]!;
  return `${d}L${f(last[0])} ${f(last[1])}`;
}

/** Drops repeated points and the middle point of three in a row, so only corners stay. */
function corners(pts: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  for (const p of pts) {
    const prev = out[out.length - 1];
    if (prev && prev[0] === p[0] && prev[1] === p[1]) continue;
    const before = out[out.length - 2];
    if (prev && before && ((before[0] === prev[0] && prev[0] === p[0]) || (before[1] === prev[1] && prev[1] === p[1]))) out.pop();
    out.push(p);
  }
  return out;
}

/** Where an edge label sits: the middle of the longest segment. */
export function labelPoint(pts: [number, number][]): { x: number; y: number } {
  let best = { x: pts[0]![0], y: pts[0]![1] };
  let len = -1;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]!;
    const [bx, by] = pts[i]!;
    const l = Math.abs(bx - ax) + Math.abs(by - ay);
    if (l > len) {
      len = l;
      best = { x: (ax + bx) / 2, y: (ay + by) / 2 };
    }
  }
  return best;
}

const flip = (b: Box): Box => ({ x: b.y, y: b.x, w: b.h, h: b.w });

/** Routes every edge as an orthogonal line (horizontal and vertical segments, rounded corners)
 *  from the right border of its source card to the left border of its target card. A node
 *  attaches at its own center height, a group at its card's middle. Group boxes are clustered
 *  into sub-columns by x; the gaps between them (and 60 px outside the first and last) are
 *  channels, where vertical lanes run: one lane per source port (edges from a port share a
 *  trunk) and one per target port (edges into a port merge). An edge to a sub-column further
 *  right than the next travels along a horizontal corridor free of cards; backward edges and
 *  edges inside one sub-column do the same, mirrored. Two edges share a line only at a shared
 *  source or target port. Pure and deterministic; the result is keyed by edge id and skips
 *  edges with an unknown end. In a "bands" layout the same router runs on the transposed layout
 *  (x and y swapped) and the points are swapped back: lines leave the bottom border of the
 *  source card and enter the top border of the target card, and `dir` is "down". */
export function routeEdges(layout: CanvasLayout, groups: CanvasGroup[], edges: CanvasEdge[]): Record<string, RoutedEdge> {
  if (layout.mode !== 'bands') return routeColumns(layout, groups, edges);
  const t: CanvasLayout = { ...layout, mode: 'columns', width: layout.height, height: layout.width, groups: {}, nodes: {} };
  for (const id of Object.keys(layout.groups)) t.groups[id] = flip(layout.groups[id]!);
  for (const id of Object.keys(layout.nodes)) t.nodes[id] = flip(layout.nodes[id]!);
  // An edge between two nodes of one group would loop around the whole card through the outer
  // corridors. Draw a short connector between the two cards inside the group instead.
  const groupOf = new Map<string, string>();
  for (const g of groups) for (const n of g.nodes) groupOf.set(n.id, g.id);
  const inside: CanvasEdge[] = [];
  const outside: CanvasEdge[] = [];
  for (const e of edges) {
    const g = groupOf.get(e.from);
    (g !== undefined && g === groupOf.get(e.to) ? inside : outside).push(e);
  }
  const routed = routeColumns(t, groups, outside);
  const result: Record<string, RoutedEdge> = {};
  for (const e of inside) {
    const a = layout.nodes[e.from];
    const b = layout.nodes[e.to];
    if (!a || !b || e.from === e.to) continue;
    let points: [number, number][];
    let dir: 'right' | 'down';
    if (b.y >= a.y + a.h) {
      // Target below: bottom border to top border, with a bend in the gap when not aligned.
      const ax = a.x + a.w / 2;
      const bx = b.x + b.w / 2;
      if (b.y <= a.y + a.h + NODE_GAP + 1) {
        const my = (a.y + a.h + b.y) / 2;
        points = corners([[ax, a.y + a.h], [ax, my], [bx, my], [bx, b.y]]);
      } else {
        // Rows are not adjacent: a straight drop would cross the cards in between. Leave a's
        // bottom, jog into the column gutter in the gap below a, run down it, then jog to b's
        // center in the gap above b.
        const gb = layout.groups[groupOf.get(e.from)!];
        const hasRightColumn = !!gb && gb.x + gb.w - (a.x + a.w) > NODE_GAP + 20;
        const gx = hasRightColumn ? a.x + a.w + NODE_GAP / 2 : a.x - NODE_GAP / 2;
        const y1 = a.y + a.h + NODE_GAP / 2;
        const y2 = b.y - NODE_GAP / 2;
        points = corners([[ax, a.y + a.h], [ax, y1], [gx, y1], [gx, y2], [bx, y2], [bx, b.y]]);
      }
      dir = 'down';
    } else if (b.x >= a.x + a.w && Math.abs(b.y - a.y) < 1) {
      // Same row, target to the right: right border to left border.
      const cy = a.y + a.h / 2;
      points = [[a.x + a.w, cy], [b.x, cy]];
      dir = 'right';
    } else {
      // Upward or leftward links inside a group have no clean short route; the link is left out.
      continue;
    }
    result[e.id] = { id: e.id, points, d: roundedPath(points), dir };
  }
  for (const id of Object.keys(routed)) {
    const points = routed[id]!.points.map(([x, y]): [number, number] => [y, x]);
    result[id] = { id, points, d: roundedPath(points), dir: 'down' };
  }
  return result;
}

function routeColumns(layout: CanvasLayout, groups: CanvasGroup[], edges: CanvasEdge[]): Record<string, RoutedEdge> {
  const result: Record<string, RoutedEdge> = {};
  const cards: { id: string; box: Box }[] = [];
  for (const g of groups) {
    const box = layout.groups[g.id];
    if (box) cards.push({ id: g.id, box });
  }
  if (cards.length === 0) return result;

  // --- sub-columns and channels ----------------------------------------------------
  const colX = [...new Set(cards.map((c) => c.box.x))].sort((a, b) => a - b);
  const cols = colX.map((x) => ({ x, right: x, boxes: [] as Box[] }));
  const colOf = new Map<string, number>();
  for (const { id, box } of cards) {
    const ci = colX.indexOf(box.x);
    colOf.set(id, ci);
    cols[ci]!.right = Math.max(cols[ci]!.right, box.x + box.w);
    cols[ci]!.boxes.push(box);
  }
  /** Channel j is left of sub-column j; channel 0 and channel `cols.length` are the outer ones. */
  const channelOf = (j: number): [number, number] => {
    if (j <= 0) return [cols[0]!.x - CHANNEL_EDGE, cols[0]!.x];
    if (j >= cols.length) return [cols[cols.length - 1]!.right, cols[cols.length - 1]!.right + CHANNEL_EDGE];
    return [cols[j - 1]!.right, cols[j]!.x];
  };
  const minY = cards.reduce((m, c) => Math.min(m, c.box.y), Infinity);
  const maxY = cards.reduce((m, c) => Math.max(m, c.box.y + c.box.h), -Infinity);

  // --- ports and wires ---------------------------------------------------------------
  const groupOfNode = new Map<string, string>();
  for (const g of groups) for (const n of g.nodes) groupOfNode.set(n.id, g.id);
  const portOf = (id: string, side: 'o' | 'i'): Port | undefined => {
    const nb = layout.nodes[id];
    const gid = nb ? groupOfNode.get(id) : id;
    const gb = gid ? layout.groups[gid] : undefined;
    if (!gid || !gb || !colOf.has(gid)) return undefined;
    const y = nb ? nb.y + nb.h / 2 : gb.y + gb.h / 2;
    return { key: `${side}|${gid}|${y}`, x: side === 'o' ? gb.x + gb.w : gb.x, y, col: colOf.get(gid)! };
  };
  const fanOut = new Map<string, number>();
  const wires: Wire[] = [];
  for (const edge of edges) {
    const src = portOf(edge.from, 'o');
    const dst = portOf(edge.to, 'i');
    if (!src || !dst) continue;
    fanOut.set(src.key, (fanOut.get(src.key) ?? 0) + 1);
    wires.push({ edge, src, dst, mode: dst.col === src.col + 1 ? 'next' : dst.col > src.col ? 'far' : 'back', exit: '', entry: '' });
  }

  // --- lanes -------------------------------------------------------------------------
  const lanes = new Map<string, Lane>();
  const inChannel = new Map<number, Lane[]>();
  const lane = (channel: number, key: string, w: Wire): string => {
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
    if (w.mode === 'next') {
      // One vertical in the channel between the two sub-columns: the source trunk when the
      // source fans out, else the target's merge lane.
      w.exit = w.entry = lane(w.dst.col, fanOut.get(w.src.key)! > 1 ? w.src.key : w.dst.key, w);
    } else {
      w.exit = lane(w.src.col + 1, w.src.key, w);
      w.entry = lane(w.dst.col, w.dst.key, w);
    }
  }
  // Lanes spread evenly over the channel minus the margins, ordered by the average height of
  // their edges (6 px apart or more while they fit; more lanes than that share the width evenly).
  for (const [channel, list] of inChannel) {
    const [l, r] = channelOf(channel);
    const lo = l + LANE_MARGIN;
    const hi = r - LANE_MARGIN;
    list.sort((a, b) => a.ys / a.n - b.ys / b.n || (a.key < b.key ? -1 : 1));
    list.forEach((ln, i) => {
      ln.x = list.length === 1 || hi <= lo ? (l + r) / 2 : lo + ((hi - lo) * i) / (list.length - 1);
    });
  }

  // --- horizontal stretches already taken, then corridor tracks -------------------------
  const taken: HSeg[] = [];
  for (const w of wires) {
    taken.push({ y: w.src.y, xa: w.src.x, xb: lanes.get(w.exit)!.x, src: w.src.key, dst: w.dst.key, track: false });
    taken.push({ y: w.dst.y, xa: lanes.get(w.entry)!.x, xb: w.dst.x, src: w.src.key, dst: w.dst.key, track: false });
  }
  const sameLine = (h: HSeg, w: Wire) => h.src === w.src.key || h.dst === w.dst.key;
  const trackFree = (y: number, xa: number, xb: number, w: Wire) => {
    for (const h of taken) {
      if (Math.min(xb, h.xb) - Math.max(xa, h.xa) <= 0.5) continue;
      const dy = Math.abs(h.y - y);
      if (dy < 0.5 ? !sameLine(h, w) : h.track && dy < TRACK_GAP - 0.5) return false;
    }
    return true;
  };
  const spanOf = (w: Wire): [number, number] => (w.mode === 'far' ? [w.src.col + 1, w.dst.col - 1] : [w.dst.col, w.src.col]);
  const cardFree = (y: number, c0: number, c1: number) => {
    for (let c = c0; c <= c1; c++) for (const b of cols[c]!.boxes) if (y > b.y - CLEARANCE + 1e-6 && y < b.y + b.h + CLEARANCE - 1e-6) return false;
    return true;
  };
  const bandCache = new Map<string, [number, number][]>();
  /** The free horizontal bands between group boxes across sub-columns c0..c1, top to bottom. */
  const bandsOf = (c0: number, c1: number): [number, number][] => {
    const id = `${c0}-${c1}`;
    let bands = bandCache.get(id);
    if (bands) return bands;
    const spans: [number, number][] = [];
    for (let c = c0; c <= c1; c++) for (const b of cols[c]!.boxes) spans.push([b.y - CLEARANCE, b.y + b.h + CLEARANCE]);
    spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    bands = [];
    let end = spans[0]![1];
    for (const [a, b] of spans) {
      if (a >= end) bands.push([end, a]);
      end = Math.max(end, b);
    }
    bandCache.set(id, bands);
    return bands;
  };
  const gap = (avg: number, [lo, hi]: [number, number]) => (avg < lo ? lo - avg : avg > hi ? avg - hi : 0);
  // How many corridor edges prefer each band, so its tracks can be centered on the band.
  const wanted = new Map<string, number>();
  for (const w of wires) {
    if (w.mode === 'next') continue;
    const avg = (w.src.y + w.dst.y) / 2;
    let best: [number, number] | undefined;
    for (const b of bandsOf(...spanOf(w))) if (!best || gap(avg, b) < gap(avg, best)) best = b;
    if (best) wanted.set(`${best[0]}|${best[1]}`, (wanted.get(`${best[0]}|${best[1]}`) ?? 0) + 1);
  }
  const trackYs = new Map<string, number>();
  for (const w of wires) {
    if (w.mode === 'next') continue;
    const [c0, c1] = spanOf(w);
    const avg = (w.src.y + w.dst.y) / 2;
    const near = (a: number, b: number) => Math.abs(a - avg) - Math.abs(b - avg) || a - b;
    // Candidates, best first: a track an edge of the same source or target already uses, then
    // the free bands nearest the ports, then lines above the top group or below the bottom one.
    const candidates: number[] = [];
    for (const h of taken) if (h.track && sameLine(h, w) && !candidates.includes(h.y)) candidates.push(h.y);
    for (const b of [...bandsOf(c0, c1)].sort((p, q) => gap(avg, p) - gap(avg, q) || p[0] - q[0])) {
      const n = Math.min(Math.floor((b[1] - b[0]) / TRACK_GAP) + 1, wanted.get(`${b[0]}|${b[1]}`) ?? 1);
      const slots: number[] = [];
      for (let i = 0; i < n; i++) slots.push((b[0] + b[1]) / 2 + TRACK_GAP * (i - (n - 1) / 2));
      candidates.push(...slots.sort(near));
    }
    const outer: number[] = [];
    for (let k = 0; k <= wires.length; k++) outer.push(minY - OUTSIDE_GAP - TRACK_GAP * k, maxY + OUTSIDE_GAP + TRACK_GAP * k);
    candidates.push(...outer.sort(near));
    const xo = lanes.get(w.exit)!.x;
    const xe = lanes.get(w.entry)!.x;
    const xa = Math.min(xo, xe);
    const xb = Math.max(xo, xe);
    const y = candidates.find((c) => cardFree(c, c0, c1) && trackFree(c, xa, xb, w)) ?? candidates[candidates.length - 1]!;
    trackYs.set(w.edge.id, y);
    taken.push({ y, xa, xb, src: w.src.key, dst: w.dst.key, track: true });
  }

  // --- paths ---------------------------------------------------------------------------
  for (const w of wires) {
    const { src, dst } = w;
    const xo = lanes.get(w.exit)!.x;
    const xe = lanes.get(w.entry)!.x;
    const ty = trackYs.get(w.edge.id)!;
    const raw: [number, number][] =
      w.mode === 'next'
        ? [[src.x, src.y], [xo, src.y], [xo, dst.y], [dst.x, dst.y]]
        : [[src.x, src.y], [xo, src.y], [xo, ty], [xe, ty], [xe, dst.y], [dst.x, dst.y]];
    const points = corners(raw);
    result[w.edge.id] = { id: w.edge.id, points, d: roundedPath(points), dir: 'right' };
  }
  return result;
}
