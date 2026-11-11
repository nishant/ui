import type { CanvasEdge, CanvasGroup, CanvasLayoutMode } from "./types";
import { FIT_PAD, PHONE_K, PHONE_MAX_W } from "./view";

// =====================================================================================
// Layout
// =====================================================================================

export interface CanvasLayout {
  mode: "columns" | "bands";
  width: number;
  height: number;
  /** World px above y = 0 taken by the headers: 36 in "columns" (titles sit above the cards), 0 in "bands" (titles sit inside). */
  titleRoom: number;
  /** Top-left of each column's ("columns") or band's ("bands") title, world px; `index` is the column or band value. */
  headers: { index: number; x: number; y: number }[];
  groups: Record<string, { x: number; y: number; w: number; h: number }>;
  nodes: Record<string, { x: number; y: number; w: number; h: number }>;
}

export const NODE_W = 172;
export const NODE_H = 56;
export const NODE_GAP = 12;
export const GROUP_PAD = 16;
export const GROUP_HEAD = 52;
export const MIN_COLUMN_STEP = 420;
export const CHANNEL_EDGE = 60; // width of the routing channel left of the first and right of the last sub-column
export const GROUP_GAP_X = 56; // "bands": horizontal gap between groups in a row
export const BAND_TITLE = 40; // "bands": extra room above a band's first row for its title

const GAP_MIN = 72; // "bands": smallest and largest gap between two rows
const GAP_MAX = 240;
const COLUMN_TITLE_ROOM = 36;

/** Options for `layoutSystem`. */
export interface LayoutOptions {
  /** Default "columns". */
  mode?: "columns" | "bands";
  /** "bands" only: the widest a row of groups may get, world px (at least one group per row). */
  width?: number;
  /** "bands" only: used to size the gaps between rows for the edge lanes. */
  edges?: CanvasEdge[];
  columnGap?: number;
  rowGap?: number;
}

interface Size {
  w: number;
  h: number;
  cols: number;
}

function sizeGroups(groups: CanvasGroup[]): Map<string, Size> {
  const sized = new Map<string, Size>();
  for (const g of groups) {
    const cols = g.nodes.length > 1 ? 2 : 1;
    const rows = Math.ceil(g.nodes.length / cols);
    const w = GROUP_PAD * 2 + cols * NODE_W + (cols - 1) * NODE_GAP;
    const h =
      GROUP_HEAD +
      GROUP_PAD +
      (rows > 0 ? rows * NODE_H + (rows - 1) * NODE_GAP : 0);
    sized.set(g.id, { w, h, cols });
  }
  return sized;
}

function placeGroup(
  out: CanvasLayout,
  g: CanvasGroup,
  s: Size,
  x: number,
  y: number,
) {
  out.groups[g.id] = { x, y, w: s.w, h: s.h };
  g.nodes.forEach((n, i) => {
    out.nodes[n.id] = {
      x: x + GROUP_PAD + (i % s.cols) * (NODE_W + NODE_GAP),
      y: y + GROUP_HEAD + Math.floor(i / s.cols) * (NODE_H + NODE_GAP),
      w: NODE_W,
      h: NODE_H,
    };
  });
}

interface Row {
  band: number;
  firstOfBand: boolean;
  list: CanvasGroup[];
  w: number;
  h: number;
}

function layoutBands(
  groups: CanvasGroup[],
  width: number,
  edges: CanvasEdge[],
): CanvasLayout {
  const out: CanvasLayout = {
    mode: "bands",
    width: 0,
    height: 0,
    titleRoom: 0,
    headers: [],
    groups: {},
    nodes: {},
  };
  if (groups.length === 0) return out;
  const sized = sizeGroups(groups);
  const bandOf = (g: CanvasGroup) => g.band ?? g.column;
  const bandIds = [...new Set(groups.map(bandOf))].sort((a, b) => a - b);

  // Rows, filled greedily left to right; a row always holds at least one group.
  const rows: Row[] = [];
  for (const band of bandIds) {
    const members = groups
      .map((g, i) => ({ g, i }))
      .filter((m) => bandOf(m.g) === band)
      .sort((a, b) => a.g.column - b.g.column || a.i - b.i)
      .map((m) => m.g);
    let cur: Row | null = null;
    for (const g of members) {
      const s = sized.get(g.id)!;
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

  // Which row every group and node is in.
  const rowOf = new Map<string, number>();
  rows.forEach((r, ri) => {
    for (const g of r.list) {
      rowOf.set(g.id, ri);
      for (const n of g.nodes) rowOf.set(n.id, ri);
    }
  });

  // Edge ends that need a lane in the gap between row r and r + 1, counted by distinct id per
  // direction: the source end just below its row, the target end just above its row.
  const ends: Set<string>[] = Array.from(
    { length: Math.max(0, rows.length - 1) },
    () => new Set<string>(),
  );
  for (const e of edges) {
    const s = rowOf.get(e.from);
    const t = rowOf.get(e.to);
    if (s === undefined || t === undefined || s === t) continue;
    if (s < t) {
      ends[s]!.add(`df:${e.from}`);
      ends[t - 1]!.add(`dt:${e.to}`);
    } else {
      ends[s - 1]!.add(`uf:${e.from}`);
      ends[t]!.add(`ut:${e.to}`);
    }
  }

  const widest = rows.reduce((m, r) => Math.max(m, r.w), 0);
  out.width = CHANNEL_EDGE + widest + CHANNEL_EDGE;
  let y = CHANNEL_EDGE + BAND_TITLE;
  rows.forEach((r, ri) => {
    if (ri > 0) {
      const gap = Math.min(
        GAP_MAX,
        Math.max(GAP_MIN, 40 + 8 * ends[ri - 1]!.size),
      );
      y += gap + (r.firstOfBand ? BAND_TITLE : 0);
    }
    let x = CHANNEL_EDGE + (widest - r.w) / 2;
    r.list.forEach((g, gi) => {
      const s = sized.get(g.id)!;
      placeGroup(out, g, s, x, y);
      if (r.firstOfBand && gi === 0)
        out.headers.push({ index: r.band, x, y: y - 12 }); // the header's bottom edge sits here (see system-canvas.tsx), clear of arrowheads
      x += s.w + GROUP_GAP_X;
    });
    if (ri === rows.length - 1) out.height = y + r.h + CHANNEL_EDGE;
    y += r.h;
  });
  return out;
}

/** Where every group and node sits, in world units (px at zoom 1). Pure and deterministic.
 *
 *  "columns" (default): columns are the distinct `column` values in ascending order, groups
 *  stack in the order given, nodes sit in a 2-column grid inside their group (1 column for a
 *  group of one), and each column is centered against the tallest. The first sub-column starts
 *  60 px in and `width` includes 60 px after the last, which is room for the edge lanes
 *  outside the cards.
 *
 *  "bands": bands are the distinct `band ?? column` values in ascending order, stacked top to
 *  bottom; each band wraps its groups (by `column`, then input order) into rows no wider than
 *  `width`. The gaps between rows grow with the number of edge ends that need lanes there. */
export function layoutSystem(
  groups: CanvasGroup[],
  o: LayoutOptions = {},
): CanvasLayout {
  if (o.mode === "bands")
    return layoutBands(groups, o.width ?? 0, o.edges ?? []);
  const columnGap = o.columnGap ?? 120;
  const rowGap = o.rowGap ?? 40;
  const columns = [...new Set(groups.map((g) => g.column))].sort(
    (a, b) => a - b,
  );
  const sized = sizeGroups(groups);
  const stackHeight = (list: CanvasGroup[]) =>
    list.reduce((sum, g) => sum + sized.get(g.id)!.h, 0) +
    Math.max(0, list.length - 1) * rowGap;
  const whole = columns.map((c) => groups.filter((g) => g.column === c));
  const sorted = whole.map(stackHeight).sort((a, b) => a - b);
  const median =
    sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]!;
  // A column taller than 1.5x the median wraps into 2 or 3 sub-columns (order kept) so the whole
  // map stays close to the viewport's aspect ratio.
  const members: CanvasGroup[][] = [];
  for (const list of whole) {
    const h = stackHeight(list);
    const parts =
      median > 0 && list.length > 1
        ? Math.min(3, list.length, Math.ceil(h / (median * 1.5)))
        : 1;
    if (parts <= 1) {
      members.push(list);
      continue;
    }
    const goal = h / parts;
    let cur: CanvasGroup[] = [];
    let cuts = 0;
    for (const g of list) {
      if (
        cur.length > 0 &&
        cuts < parts - 1 &&
        stackHeight(cur) + rowGap + sized.get(g.id)!.h / 2 > goal
      ) {
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

  const out: CanvasLayout = {
    mode: "columns",
    width: 0,
    height: tallest,
    titleRoom: COLUMN_TITLE_ROOM,
    headers: [],
    groups: {},
    nodes: {},
  };
  let x = members.length > 0 ? CHANNEL_EDGE : 0;
  members.forEach((list, ci) => {
    const widest = list.reduce((m, g) => Math.max(m, sized.get(g.id)!.w), 0);
    let y = (tallest - heights[ci]!) / 2;
    for (const g of list) {
      placeGroup(out, g, sized.get(g.id)!, x, y);
      y += sized.get(g.id)!.h + rowGap;
    }
    out.width = Math.max(out.width, x + widest);
    x += Math.max(MIN_COLUMN_STEP, widest + columnGap);
  });
  if (members.length > 0) out.width += CHANNEL_EDGE;
  for (const c of columns) {
    const boxes = groups
      .filter((g) => g.column === c)
      .map((g) => out.groups[g.id]!);
    out.headers.push({
      index: c,
      x: Math.min(...boxes.map((b) => b.x)),
      y: Math.min(...boxes.map((b) => b.y)) - COLUMN_TITLE_ROOM,
    });
  }
  return out;
}

/** Layouts that do not depend on the viewport: every bands candidate (the row width that fits the
 *  n widest groups side by side, n = 1..most groups in a band) and, in "auto", the columns layout. */
export interface LayoutCandidates {
  mode: CanvasLayoutMode;
  bands: CanvasLayout[];
  columns: CanvasLayout | null;
}

export function layoutCandidates(
  groups: CanvasGroup[],
  edges: CanvasEdge[],
  mode: CanvasLayoutMode = "auto",
): LayoutCandidates {
  if (mode === "columns")
    return {
      mode,
      bands: [],
      columns: layoutSystem(groups, { mode: "columns" }),
    };
  const sized = sizeGroups(groups);
  const widths = groups.map((g) => sized.get(g.id)!.w).sort((a, b) => b - a);
  const perBand = new Map<number, number>();
  for (const g of groups) {
    const b = g.band ?? g.column;
    perBand.set(b, (perBand.get(b) ?? 0) + 1);
  }
  const maxN = Math.max(0, ...perBand.values());
  const rowWidths: number[] = [];
  let sum = 0;
  for (let n = 1; n <= maxN; n++) {
    sum += widths[n - 1]!;
    rowWidths.push(sum + (n - 1) * GROUP_GAP_X);
  }
  if (rowWidths.length === 0) rowWidths.push(0);
  return {
    mode,
    bands: [...new Set(rowWidths)].map((width) =>
      layoutSystem(groups, { mode: "bands", width, edges }),
    ),
    columns: mode === "auto" ? layoutSystem(groups, { mode: "columns" }) : null,
  };
}

// Only canvases narrower than this are treated as phones (one readable column at the phone zoom).
// From 480 to 600 px the best-scoring candidate is used unless it would fit below the phone zoom.
const PHONE_LAYOUT_W = 480;
// Below this best score a canvas 600 px or wider also gets the fits-across layout.
export const SCROLL_K = 0.35;

/** Picks from `layoutCandidates` for a viewport. Cheap, so it can run on every resize. */
export function chooseLayout(
  c: LayoutCandidates,
  viewport: { w: number; h: number },
): CanvasLayout {
  if (c.mode === "columns") return c.columns!;
  const candidates = c.bands;
  if (viewport.w <= 0 || viewport.h <= 0) return candidates[0]!;
  const score = (l: CanvasLayout) => {
    if (l.width <= 0 || l.height <= 0) return 1;
    return Math.min(
      (viewport.w - 2 * FIT_PAD) / l.width,
      (viewport.h - 2 * FIT_PAD) / (l.height + l.titleRoom),
      1,
    );
  };
  const scores = candidates.map(score);
  const top = Math.max(...scores);
  let best = 0; // ties (within 0.005 of the top score) go to the larger row width
  scores.forEach((s, i) => {
    if (top - s < 0.005) best = i;
  });
  // fitView keeps the phone zoom (PHONE_K) below PHONE_MAX_W when the fit is smaller, so below
  // PHONE_MAX_W use the same threshold here: the widest candidate that fits at the phone zoom.
  // From PHONE_MAX_W up the same happens when even the best candidate would open below
  // SCROLL_K (fitView's overlay insets make the real fit a little smaller than this score):
  // a readable map that fits across and scrolls down beats a whole map too small to read.
  if (
    viewport.w < PHONE_LAYOUT_W ||
    top < (viewport.w < PHONE_MAX_W ? PHONE_K : SCROLL_K)
  ) {
    let pick = candidates[0]!;
    for (const x of candidates) if (x.width * PHONE_K <= viewport.w - 24) pick = x;
    return pick;
  }
  const bands = candidates[best]!;
  if (c.mode === "bands" || !c.columns) return bands;
  return score(c.columns) > scores[best]! ? c.columns : bands;
}

/** The layout to show in a viewport of `viewport` px. "columns" and "bands" use that mode;
 *  "auto" picks whichever candidate shows the map biggest. Pure and deterministic. */
export function pickLayout(
  groups: CanvasGroup[],
  edges: CanvasEdge[],
  viewport: { w: number; h: number },
  mode: CanvasLayoutMode = "auto",
): CanvasLayout {
  return chooseLayout(layoutCandidates(groups, edges, mode), viewport);
}
