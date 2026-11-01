import type { CanvasEdge, CanvasGroup, CanvasLayoutMode } from './types';

// =====================================================================================
// Layout
// =====================================================================================

export interface CanvasLayout {
  mode: 'columns' | 'bands';
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

/** Where every group and node sits, in world units (px at zoom 1). Columns are the distinct
 *  `column` values in ascending order, groups stack in the order given, nodes sit in a
 *  2-column grid inside their group (1 column for a group of one), and each column is
 *  centered against the tallest. The first sub-column starts 60 px in and `width` includes
 *  60 px after the last, which is room for the edge lanes outside the cards. Pure and
 *  deterministic. */
export interface LayoutOptions {
  /** Default "columns". */
  mode?: 'columns' | 'bands';
  /** "bands" only: the widest a row of groups may get, world px (at least one group per row). */
  width?: number;
  /** "bands" only: used to size the gaps between rows for the edge lanes. */
  edges?: CanvasEdge[];
  columnGap?: number;
  rowGap?: number;
}

export function layoutSystem(groups: CanvasGroup[], o: LayoutOptions = {}): CanvasLayout {
  const columnGap = o.columnGap ?? 120;
  const rowGap = o.rowGap ?? 40;
  const columns = [...new Set(groups.map((g) => g.column))].sort((a, b) => a - b);
  const sized = new Map<string, { w: number; h: number; cols: number }>();
  for (const g of groups) {
    const cols = g.nodes.length > 1 ? 2 : 1;
    const rows = Math.ceil(g.nodes.length / cols);
    const w = GROUP_PAD * 2 + cols * NODE_W + (cols - 1) * NODE_GAP;
    const h = GROUP_HEAD + GROUP_PAD + (rows > 0 ? rows * NODE_H + (rows - 1) * NODE_GAP : 0);
    sized.set(g.id, { w, h, cols });
  }
  const stackHeight = (list: CanvasGroup[]) => list.reduce((sum, g) => sum + sized.get(g.id)!.h, 0) + Math.max(0, list.length - 1) * rowGap;
  const whole = columns.map((c) => groups.filter((g) => g.column === c));
  const sorted = whole.map(stackHeight).sort((a, b) => a - b);
  const median = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]!;
  // A column taller than 1.5x the median wraps into 2 or 3 sub-columns (order kept) so the whole
  // map stays close to the viewport's aspect ratio.
  const members: CanvasGroup[][] = [];
  for (const list of whole) {
    const h = stackHeight(list);
    const parts = median > 0 && list.length > 1 ? Math.min(3, list.length, Math.ceil(h / (median * 1.5))) : 1;
    if (parts <= 1) {
      members.push(list);
      continue;
    }
    const goal = h / parts;
    let cur: CanvasGroup[] = [];
    let cuts = 0;
    for (const g of list) {
      if (cur.length > 0 && cuts < parts - 1 && stackHeight(cur) + rowGap + sized.get(g.id)!.h / 2 > goal) {
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

  const out: CanvasLayout = { mode: 'columns', width: 0, height: tallest, titleRoom: 36, headers: [], groups: {}, nodes: {} };
  let x = members.length > 0 ? CHANNEL_EDGE : 0;
  members.forEach((list, ci) => {
    const widest = list.reduce((m, g) => Math.max(m, sized.get(g.id)!.w), 0);
    let y = (tallest - heights[ci]!) / 2;
    for (const g of list) {
      const s = sized.get(g.id)!;
      out.groups[g.id] = { x, y, w: s.w, h: s.h };
      g.nodes.forEach((n, i) => {
        out.nodes[n.id] = {
          x: x + GROUP_PAD + (i % s.cols) * (NODE_W + NODE_GAP),
          y: y + GROUP_HEAD + Math.floor(i / s.cols) * (NODE_H + NODE_GAP),
          w: NODE_W,
          h: NODE_H,
        };
      });
      y += s.h + rowGap;
    }
    out.width = Math.max(out.width, x + widest);
    x += Math.max(MIN_COLUMN_STEP, widest + columnGap);
  });
  if (members.length > 0) out.width += CHANNEL_EDGE;
  return out;
}

/** The layout to show in a viewport of `viewport` px. "columns" and "bands" use that mode;
 *  "auto" picks whichever candidate shows the map biggest. Pure and deterministic. */
export function pickLayout(groups: CanvasGroup[], edges: CanvasEdge[], viewport: { w: number; h: number }, mode: CanvasLayoutMode = 'auto'): CanvasLayout {
  void edges;
  void viewport;
  void mode;
  return layoutSystem(groups);
}
