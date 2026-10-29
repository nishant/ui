import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '../cn';
import { TickerText, usePrefersReducedMotion } from './flow';
import { IconButton } from './primitives';

// SystemCanvas: a pannable, zoomable graph-paper canvas of grouped nodes and edges that
// light up where work is happening. The layout is computed (layoutSystem), never stored.
//
// Pan and zoom never go through React state: the view lives in a ref and is written
// straight to the world layer (`transform`) and the viewport's background-position and
// background-size, so a drag or a wheel tick re-renders nothing. Motion lives in CSS
// (src/css/base.css, `nish-canvas-*`), inside `prefers-reduced-motion: no-preference`.

export type CanvasHue = 'indigo' | 'emerald' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';
export type CanvasNodeKind = 'ui' | 'service' | 'worker' | 'library' | 'infra' | 'data' | 'tool' | 'docs';

export interface CanvasNode {
  id: string;
  label: string;
  kind?: CanvasNodeKind;
  detail?: string;
  /** 0..1 afterglow */
  heat?: number;
  /** live work here now */
  active?: boolean;
  /** shown under an active node, max ~48 chars */
  note?: string;
  /** sessions/agents here */
  count?: number;
}

export interface CanvasGroup {
  id: string;
  title: string;
  subtitle?: string;
  hue?: CanvasHue;
  column: number;
  badge?: ReactNode;
  nodes: CanvasNode[];
}

export interface CanvasEdge {
  id: string;
  /** node or group id */
  from: string;
  /** node or group id */
  to: string;
  dashed?: boolean;
  label?: string;
}

export interface SystemCanvasProps {
  groups: CanvasGroup[];
  edges: CanvasEdge[];
  /** Faint titles above each column ("Edge", "Infra", "Apps", ...), by column index. */
  columns?: string[];
  selected?: string | null;
  onSelect?: (id: string, type: 'node' | 'group') => void;
  /** CSS height of the viewport. Default "100%". */
  height?: string;
  /** aria-label. Default "System map". */
  label?: string;
  className?: string;
}

// =====================================================================================
// Layout
// =====================================================================================

export interface CanvasLayout {
  width: number;
  height: number;
  groups: Record<string, { x: number; y: number; w: number; h: number }>;
  nodes: Record<string, { x: number; y: number; w: number; h: number }>;
}

const NODE_W = 172;
const NODE_H = 56;
const NODE_GAP = 12;
const GROUP_PAD = 16;
const GROUP_HEAD = 52;
const MIN_COLUMN_STEP = 420;
const CHANNEL_EDGE = 60; // width of the routing channel left of the first and right of the last sub-column

/** Where every group and node sits, in world units (px at zoom 1). Columns are the distinct
 *  `column` values in ascending order, groups stack in the order given, nodes sit in a
 *  2-column grid inside their group (1 column for a group of one), and each column is
 *  centered against the tallest. The first sub-column starts 60 px in and `width` includes
 *  60 px after the last, which is room for the edge lanes outside the cards. Pure and
 *  deterministic. */
export function layoutSystem(groups: CanvasGroup[], o: { columnGap?: number; rowGap?: number } = {}): CanvasLayout {
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

  const out: CanvasLayout = { width: 0, height: tallest, groups: {}, nodes: {} };
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

// =====================================================================================
// View math
// =====================================================================================

interface View {
  x: number;
  y: number;
  k: number;
}

const MIN_K = 0.3;
const MAX_K = 2;
const PHONE_K = 0.55;
const PHONE_MAX_W = 600; // viewports narrower than this keep the readable phone zoom when fit is small
const FIT_PAD = 48;
const TITLE_ROOM = 36; // world px above y=0 taken by the column titles
const LABEL_K = 0.8;
const ANIM_MS = 300;
const DRAG_PX = 4;
const KEY_PAN = 48;
const ZOOM_STEP = 1.25;

const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The view after zooming to `k` while keeping the world point under (px, py) fixed. */
function zoomAround(v: View, k: number, px: number, py: number): View {
  const nk = clampK(k);
  const r = nk / v.k;
  return { k: nk, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}

function centerOn(w: number, h: number, k: number, box: { x: number; y: number; w: number; h: number }): View {
  return { k, x: w / 2 - (box.x + box.w / 2) * k, y: h / 2 - (box.y + box.h / 2) * k };
}

// =====================================================================================
// Icons (16px, 24 grid, lucide geometry)
// =====================================================================================

function Svg({ children, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

const KIND_ICON: Record<CanvasNodeKind, ReactNode> = {
  ui: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </>
  ),
  service: (
    <>
      <rect x="3" y="3" width="18" height="7" rx="2" />
      <rect x="3" y="14" width="18" height="7" rx="2" />
      <path d="M7 6.5h.01M7 17.5h.01" />
    </>
  ),
  worker: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </>
  ),
  library: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  infra: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  data: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </>
  ),
  tool: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  docs: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
};

const PlusIcon = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
const MinusIcon = () => (
  <Svg>
    <path d="M5 12h14" />
  </Svg>
);
const FitIcon = () => (
  <Svg>
    <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </Svg>
);

// =====================================================================================
// Colors
// =====================================================================================

function hueStyle(hue: CanvasHue | undefined): CSSProperties {
  return {
    '--c': hue ? `var(--nish-${hue})` : 'var(--nish-accent)',
    '--c-soft': hue ? `var(--nish-${hue}-soft)` : 'var(--nish-accent-soft)',
  } as CSSProperties;
}

// =====================================================================================
// Nodes
// =====================================================================================

interface NodeViewProps {
  node: CanvasNode;
  groupTitle: string;
  hue: CanvasHue | undefined;
  box: { x: number; y: number; w: number; h: number };
  selected: boolean;
  delay: number;
  onSelect: ((id: string, type: 'node' | 'group') => void) | undefined;
}

const clamp01 = (n: number | undefined) => (n == null || !Number.isFinite(n) ? 0 : Math.min(1, Math.max(0, n)));

/** Plays a one-time "ping" when `active` turns on after mount. Sets data-fx on the DOM so a
 *  re-render with the same data cannot cut it short. */
function usePing(active: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const prev = useRef(active);
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = active;
    const el = ref.current;
    if (!el || was || !active) return;
    el.removeAttribute('data-fx');
    void el.offsetWidth;
    el.setAttribute('data-fx', 'ping');
    const timer = setTimeout(() => el.removeAttribute('data-fx'), 450);
    return () => clearTimeout(timer);
  }, [active]);
  return ref;
}

const NodeView = memo(
  function NodeView({ node, groupTitle, hue, box, selected, delay, onSelect }: NodeViewProps) {
    const active = !!node.active;
    const heat = clamp01(node.heat);
    const ref = usePing(active);
    const count = node.count ?? 0;
    const style: CSSProperties = {
      ...hueStyle(hue),
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      '--nish-canvas-delay': `${delay}ms`,
    } as CSSProperties;
    if (!active && heat > 0) {
      style.borderColor = `color-mix(in srgb, var(--c) ${Math.round(heat * 70)}%, var(--nish-line))`;
      style.boxShadow = `0 0 ${Math.round(6 + heat * 16)}px color-mix(in srgb, var(--c) ${Math.round(heat * 60)}%, transparent)`;
    }
    const aria = `${node.label}, ${groupTitle}${active ? (node.note ? `, active: ${node.note}` : ', active') : ''}`;
    return (
      <div className="nish-canvas-slot" style={style} data-active={active || undefined}>
        <button
          ref={ref}
          type="button"
          className="nish-canvas-node"
          data-canvas-id={node.id}
          data-active={active || undefined}
          data-selected={selected || undefined}
          data-heat={heat > 0 || undefined}
          aria-label={aria}
          aria-pressed={selected}
          onClick={() => onSelect?.(node.id, 'node')}
        >
          {node.kind ? (
            <span className="nish-canvas-icon" aria-hidden="true">
              <Svg>{KIND_ICON[node.kind]}</Svg>
            </span>
          ) : null}
          <span className="nish-canvas-text">
            <span className="nish-canvas-label">{node.label}</span>
            {active && node.note ? (
              <span className="nish-canvas-note" aria-hidden="true">
                <TickerText text={node.note} as="span" />
              </span>
            ) : node.detail ? (
              <span className="nish-canvas-detail">{node.detail}</span>
            ) : null}
          </span>
          {count > 1 ? <span className="nish-canvas-count">{count}</span> : null}
          {active ? <span className="nish-canvas-live" aria-hidden="true" /> : null}
        </button>
      </div>
    );
  },
  (a, b) =>
    a.groupTitle === b.groupTitle &&
    a.hue === b.hue &&
    a.selected === b.selected &&
    a.delay === b.delay &&
    a.onSelect === b.onSelect &&
    a.box.x === b.box.x &&
    a.box.y === b.box.y &&
    a.node.id === b.node.id &&
    a.node.label === b.node.label &&
    a.node.kind === b.node.kind &&
    a.node.detail === b.node.detail &&
    a.node.active === b.node.active &&
    a.node.note === b.node.note &&
    a.node.count === b.node.count &&
    Math.round(clamp01(a.node.heat) * 100) === Math.round(clamp01(b.node.heat) * 100),
);

// =====================================================================================
// Edges
// =====================================================================================

interface Box {
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
function labelPoint(pts: [number, number][]): { x: number; y: number } {
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

/** Routes every edge as an orthogonal line (horizontal and vertical segments, rounded corners)
 *  from the right border of its source card to the left border of its target card. A node
 *  attaches at its own center height, a group at its card's middle. Group boxes are clustered
 *  into sub-columns by x; the gaps between them (and 60 px outside the first and last) are
 *  channels, where vertical lanes run: one lane per source port (edges from a port share a
 *  trunk) and one per target port (edges into a port merge). An edge to a sub-column further
 *  right than the next travels along a horizontal corridor free of cards; backward edges and
 *  edges inside one sub-column do the same, mirrored. Two edges share a line only at a shared
 *  source or target port. Pure and deterministic; the result is keyed by edge id and skips
 *  edges with an unknown end. */
export function routeEdges(layout: CanvasLayout, groups: CanvasGroup[], edges: CanvasEdge[]): Record<string, RoutedEdge> {
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
    result[w.edge.id] = { id: w.edge.id, points, d: roundedPath(points) };
  }
  return result;
}

// =====================================================================================
// SystemCanvas
// =====================================================================================

/** A pannable, zoomable graph-paper canvas of grouped nodes joined by edges. Nodes with
 *  `active` pulse in their group's hue, edges into them flow, and `heat` leaves a fading
 *  glow behind. Drag or scroll to pan, ctrl+scroll or pinch to zoom, arrow keys, `+`, `-`
 *  and `0` from the keyboard. */
export function SystemCanvas({
  groups,
  edges,
  columns,
  selected = null,
  onSelect,
  height = '100%',
  label = 'System map',
  className,
}: SystemCanvasProps) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ x: 0, y: 0, k: 1 });
  const target = useRef<View | null>(null); // where a running animation is heading
  const raf = useRef(0);
  const size = useRef({ w: 0, h: 0 });
  const touched = useRef(false); // the viewer moved the view; stop auto-fitting
  const zoomLabelRef = useRef<HTMLSpanElement>(null);
  const [labelsOn, setLabelsOn] = useState(true);

  const sig = groups.map((g) => `${g.id}:${g.column}:${g.nodes.map((n) => n.id).join(',')}`).join('|');
  const layout = useMemo(() => layoutSystem(groups), [sig]); // eslint-disable-line react-hooks/exhaustive-deps
  const latest = useRef({ groups, layout });
  latest.current = { groups, layout };

  // --- applying a view ---------------------------------------------------------
  const apply = useCallback((v: View) => {
    view.current = v;
    const world = worldRef.current;
    const vp = viewportRef.current;
    if (world) world.style.transform = `translate3d(${v.x}px,${v.y}px,0) scale(${v.k})`;
    if (vp) {
      // Written straight onto the viewport: inherited custom properties would restyle every descendant.
      const maj = `${120 * v.k}px ${120 * v.k}px`;
      const min = `${24 * v.k}px ${24 * v.k}px`;
      vp.style.backgroundPosition = `${v.x}px ${v.y}px`;
      vp.style.backgroundSize = `${maj}, ${maj}, ${min}, ${min}`;
      vp.dataset.grid = v.k < 0.6 ? 'major' : 'both';
    }
    const zl = zoomLabelRef.current;
    if (zl) {
      const text = `${Math.round(v.k * 100)}%`;
      if (zl.textContent !== text) zl.textContent = text;
    }
    const on = v.k >= LABEL_K;
    setLabelsOn((old) => (old === on ? old : on));
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    target.current = null;
  }, []);

  /** Moves to `v`: a 300 ms ease, or at once when `animate` is false or motion is reduced. */
  const go = useCallback(
    (v: View, animate: boolean) => {
      cancelAnimationFrame(raf.current);
      if (!animate || reduced) {
        target.current = null;
        apply(v);
        return;
      }
      const from = { ...view.current };
      target.current = v;
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ANIM_MS);
        const e = ease(t);
        // Interpolate zoom in log space so the motion feels even.
        const k = from.k * Math.pow(v.k / from.k, e);
        apply({ k, x: from.x + (v.x - from.x) * e, y: from.y + (v.y - from.y) * e });
        if (t < 1) raf.current = requestAnimationFrame(step);
        else {
          raf.current = 0;
          target.current = null;
          apply(v);
        }
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply, reduced],
  );

  /** The fitted view: the whole layout with 48 px padding; on a phone (fit below 0.55) the
   *  zoom stays 0.55 and the view centers on the first active node, else the first group. */
  const fitView = useCallback((): View => {
    const { w, h } = size.current;
    const { groups: gs, layout: lay } = latest.current;
    const cw = Math.max(1, lay.width);
    const ch = Math.max(1, lay.height + TITLE_ROOM);
    const fit = Math.min((w - FIT_PAD * 2) / cw, (h - FIT_PAD * 2) / ch, 1);
    if (fit >= PHONE_K || (w >= PHONE_MAX_W && fit >= MIN_K) || gs.length === 0) {
      const k = clampK(Number.isFinite(fit) && fit > 0 ? fit : 1);
      return { k, x: (w - lay.width * k) / 2, y: (h - ch * k) / 2 + TITLE_ROOM * k };
    }
    let box: Box | undefined;
    for (const g of gs) {
      const n = g.nodes.find((node) => node.active);
      if (n) {
        box = lay.nodes[n.id];
        break;
      }
    }
    box ??= lay.groups[gs[0]!.id];
    return box ? centerOn(w, h, PHONE_K, box) : { k: PHONE_K, x: FIT_PAD, y: FIT_PAD + TITLE_ROOM * PHONE_K };
  }, []);

  const doFit = useCallback(
    (animate: boolean) => {
      if (size.current.w <= 0 || size.current.h <= 0) return;
      go(fitView(), animate);
    },
    [fitView, go],
  );

  // First fit happens before paint; later size or layout changes refit until the viewer
  // moves the view themselves.
  useLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => {
      const r = vp.getBoundingClientRect();
      size.current = { w: r.width, h: r.height };
      if (!touched.current) doFit(false);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [doFit]);

  useLayoutEffect(() => {
    if (!touched.current) doFit(false);
  }, [sig, doFit]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // --- zoom and pan helpers ----------------------------------------------------
  const zoomBy = useCallback(
    (factor: number, animate: boolean) => {
      touched.current = true;
      const base = target.current ?? view.current;
      const { w, h } = size.current;
      go(zoomAround(base, base.k * factor, w / 2, h / 2), animate);
    },
    [go],
  );

  // --- wheel (needs a non-passive listener) ------------------------------------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element | null)?.closest('[data-canvas-ui]')) return;
      e.preventDefault();
      stop();
      touched.current = true;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.current.h : 1;
      const v = view.current;
      if (e.ctrlKey) {
        const r = vp.getBoundingClientRect();
        apply(zoomAround(v, v.k * Math.exp(-e.deltaY * unit * 0.0015), e.clientX - r.left, e.clientY - r.top));
      } else {
        apply({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit });
      }
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [apply, stop]);

  // --- pointers: drag, click vs drag, pinch ------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    mode: 'none' | 'pending' | 'pan' | 'pinch';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    pinchDist: number;
    pinchMid: { x: number; y: number };
    pinchView: View;
  }>({ mode: 'none', startX: 0, startY: 0, lastX: 0, lastY: 0, pinchDist: 1, pinchMid: { x: 0, y: 0 }, pinchView: { x: 0, y: 0, k: 1 } });
  const dragged = useRef(false);

  const local = (e: ReactPointerEvent) => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startPinch = () => {
    const pts = [...pointers.current.values()];
    const [a, b] = pts as [{ x: number; y: number }, { x: number; y: number }];
    const g = gesture.current;
    g.mode = 'pinch';
    g.pinchDist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    g.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    g.pinchView = { ...view.current };
    dragged.current = true;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as Element).closest('[data-canvas-ui]')) return;
    stop();
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const vp = viewportRef.current!;
    const g = gesture.current;
    if (pointers.current.size === 1) {
      dragged.current = false;
      g.mode = 'pending';
      g.startX = g.lastX = p.x;
      g.startY = g.lastY = p.y;
    } else if (pointers.current.size === 2) {
      for (const id of pointers.current.keys()) {
        try {
          vp.setPointerCapture(id);
        } catch {
          // The pointer already ended.
        }
      }
      touched.current = true;
      startPinch();
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (g.mode === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s = g.pinchView;
      const k = clampK(s.k * (dist / g.pinchDist));
      // The world point that was under the start midpoint follows the current midpoint.
      const wx = (g.pinchMid.x - s.x) / s.k;
      const wy = (g.pinchMid.y - s.y) / s.k;
      apply({ k, x: mid.x - wx * k, y: mid.y - wy * k });
      return;
    }
    if (g.mode === 'pending') {
      if (Math.hypot(p.x - g.startX, p.y - g.startY) < DRAG_PX) return;
      stop();
      g.mode = 'pan';
      dragged.current = true;
      touched.current = true;
      try {
        viewportRef.current!.setPointerCapture(e.pointerId);
      } catch {
        // The pointer already ended.
      }
      viewportRef.current!.dataset.dragging = 'true';
    }
    if (g.mode === 'pan') {
      const v = view.current;
      apply({ ...v, x: v.x + (p.x - g.lastX), y: v.y + (p.y - g.lastY) });
      g.lastX = p.x;
      g.lastY = p.y;
    }
  };

  const endPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const vp = viewportRef.current!;
    try {
      vp.releasePointerCapture(e.pointerId);
    } catch {
      // Not captured.
    }
    const g = gesture.current;
    if (pointers.current.size === 1 && g.mode === 'pinch') {
      // One finger stays down: carry on as a pan from where it is.
      const [rest] = [...pointers.current.values()] as [{ x: number; y: number }];
      g.mode = 'pan';
      g.lastX = rest.x;
      g.lastY = rest.y;
    } else if (pointers.current.size === 0) {
      g.mode = 'none';
      delete vp.dataset.dragging;
      // The click that follows this pointerup is swallowed when the pointer dragged.
      setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
  };

  const onClickCapture = (e: { stopPropagation: () => void; preventDefault: () => void }) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  // --- keyboard ----------------------------------------------------------------
  // The viewport is never scrolled by the browser; focus pans the view instead.
  const onScroll = () => {
    const vp = viewportRef.current;
    if (vp && (vp.scrollLeft !== 0 || vp.scrollTop !== 0)) {
      vp.scrollLeft = 0;
      vp.scrollTop = 0;
    }
  };

  const onFocusCapture = (e: ReactFocusEvent<HTMLDivElement>) => {
    const vp = viewportRef.current;
    const el = e.target as HTMLElement;
    if (!vp || el === vp) return;
    if (pointers.current.size > 0 || !el.matches(':focus-visible')) return;
    const id = (el.closest('[data-canvas-id]') as HTMLElement | null)?.dataset.canvasId;
    if (!id) return;
    const box = latest.current.layout.nodes[id] ?? latest.current.layout.groups[id];
    if (!box) return;
    const v = view.current;
    const { w, h } = size.current;
    const left = box.x * v.k + v.x;
    const top = box.y * v.k + v.y;
    if (left >= 0 && top >= 0 && left + box.w * v.k <= w && top + box.h * v.k <= h) return;
    touched.current = true;
    go(centerOn(w, h, v.k, box), true);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.metaKey) return;
    if ((e.target as Element).closest('[data-canvas-ui]')) return;
    const v = view.current;
    switch (e.key) {
      case 'ArrowLeft':
        stop();
        touched.current = true;
        apply({ ...v, x: v.x + KEY_PAN });
        break;
      case 'ArrowRight':
        stop();
        touched.current = true;
        apply({ ...v, x: v.x - KEY_PAN });
        break;
      case 'ArrowUp':
        stop();
        touched.current = true;
        apply({ ...v, y: v.y + KEY_PAN });
        break;
      case 'ArrowDown':
        stop();
        touched.current = true;
        apply({ ...v, y: v.y - KEY_PAN });
        break;
      case '+':
      case '=':
        zoomBy(ZOOM_STEP, true);
        break;
      case '-':
      case '_':
        zoomBy(1 / ZOOM_STEP, true);
        break;
      case '0':
        touched.current = false;
        doFit(true);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  // --- content (re-rendered only when data changes, never on pan or zoom) ------
  const columnIndex = useMemo(() => {
    const order = [...new Set(groups.map((g) => g.column))].sort((a, b) => a - b);
    return new Map(order.map((c, i) => [c, i]));
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  const lookup = useMemo(() => {
    const nodes = new Map<string, { group: CanvasGroup; node: CanvasNode }>();
    const grps = new Map<string, CanvasGroup>();
    for (const g of groups) {
      grps.set(g.id, g);
      for (const n of g.nodes) nodes.set(n.id, { group: g, node: n });
    }
    return { nodes, grps };
  }, [groups]);

  const columnTitles = useMemo(() => {
    if (!columns) return [];
    const seen = new Map<number, { x: number; y: number }>();
    for (const g of groups) {
      const box = layout.groups[g.id];
      if (!box) continue;
      const old = seen.get(g.column);
      if (!old) seen.set(g.column, { x: box.x, y: box.y });
      else
        seen.set(g.column, {
          x: Math.min(old.x, box.x),
          y: Math.min(old.y, box.y),
        });
    }
    return [...seen.entries()]
      .filter(([c]) => columns[c])
      .map(([c, p]) => ({ c, x: p.x, y: p.y - TITLE_ROOM, text: columns[c]! }));
  }, [columns, groups, layout]);

  // Routing depends only on the layout and the edge ends, so a pan, a zoom or an activity
  // update never recomputes it.
  const edgeSig = edges.map((e) => `${e.id}:${e.from}:${e.to}`).join('|');
  const routes = useMemo(() => routeEdges(layout, groups, edges), [layout, edgeSig]); // eslint-disable-line react-hooks/exhaustive-deps

  const { edgeViews, ports } = useMemo(() => {
    const hueOf = (id: string): { hue: CanvasHue | undefined; active: boolean } | undefined => {
      const n = lookup.nodes.get(id);
      if (n) return { hue: n.group.hue, active: !!n.node.active };
      const g = lookup.grps.get(id);
      if (g) return { hue: g.hue, active: g.nodes.some((x) => x.active) };
      return undefined;
    };
    const views = edges.flatMap((edge) => {
      const route = routes[edge.id];
      const to = hueOf(edge.to);
      if (!route || !to) return [];
      return [{ edge, route, mid: labelPoint(route.points), hue: to.hue, active: to.active }];
    });
    // Quiet edges first so an active edge that shares a trunk with one draws on top.
    views.sort((a, b) => Number(a.active) - Number(b.active));
    const dots = new Map<string, { x: number; y: number; hue: CanvasHue | undefined; active: boolean }>();
    for (const v of views) {
      for (const p of [v.route.points[0]!, v.route.points[v.route.points.length - 1]!]) {
        const key = `${p[0]}|${p[1]}`;
        const old = dots.get(key);
        if (!old || (v.active && !old.active)) dots.set(key, { x: p[0], y: p[1], hue: v.hue, active: v.active });
      }
    }
    return { edgeViews: views, ports: [...dots.entries()] };
  }, [edges, routes, lookup]);

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label={label}
      aria-roledescription="canvas"
      tabIndex={0}
      className={cn('nish-canvas', className)}
      style={{ height }}
      data-grid="both"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      onScroll={onScroll}
      onFocusCapture={onFocusCapture}
    >
      <div ref={worldRef} className="nish-canvas-world" style={{ width: layout.width, height: layout.height }}>
        {columnTitles.map((t) => (
          <div key={t.c} className="nish-canvas-coltitle" style={{ left: t.x, top: t.y }}>
            {t.text}
          </div>
        ))}

        <svg className="nish-canvas-edges" width={layout.width} height={layout.height} aria-hidden="true" focusable="false">
          {edgeViews.map(({ edge, route, mid, hue, active }) => (
            <g key={edge.id} style={hueStyle(hue)} className="nish-canvas-edge" data-active={active || undefined} data-dashed={edge.dashed || undefined}>
              <path className="nish-canvas-edge-line" d={route.d} fill="none" />
              {active ? <circle className="nish-canvas-dot" r="3.5" style={{ offsetPath: `path("${route.d}")` }} /> : null}
              {edge.label && labelsOn ? (
                <text className="nish-canvas-edge-label" x={mid.x} y={mid.y - 6} textAnchor="middle">
                  {edge.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>

        <svg className="nish-canvas-ports" width={layout.width} height={layout.height} aria-hidden="true" focusable="false">
          {ports.map(([key, p]) => (
            <circle key={key} className="nish-canvas-port" cx={p.x} cy={p.y} r={3} style={hueStyle(p.hue)} data-active={p.active || undefined} />
          ))}
        </svg>

        {groups.map((g) => {
          const box = layout.groups[g.id];
          if (!box) return null;
          const live = g.nodes.some((n) => n.active);
          const delay = (columnIndex.get(g.column) ?? 0) * 80;
          return (
            <Fragment key={g.id}>
              <div
                className="nish-canvas-group"
                style={
                  {
                    ...hueStyle(g.hue),
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    '--nish-canvas-delay': `${delay}ms`,
                  } as CSSProperties
                }
                data-live={live || undefined}
                data-selected={selected === g.id || undefined}
              >
                <span className="nish-canvas-band" aria-hidden="true" />
                <button
                  type="button"
                  className="nish-canvas-head"
                  data-canvas-id={g.id}
                  aria-pressed={selected === g.id}
                  onClick={() => onSelect?.(g.id, 'group')}
                >
                  <span className="nish-canvas-headtext">
                    <span className="nish-canvas-title">{g.title}</span>
                    {g.subtitle ? <span className="nish-canvas-subtitle">{g.subtitle}</span> : null}
                  </span>
                  {g.badge ? <span className="nish-canvas-badge">{g.badge}</span> : null}
                </button>
              </div>
              {g.nodes.map((n) => {
                const nb = layout.nodes[n.id];
                if (!nb) return null;
                return (
                  <NodeView
                    key={n.id}
                    node={n}
                    groupTitle={g.title}
                    hue={g.hue}
                    box={nb}
                    selected={selected === n.id}
                    delay={delay}
                    onSelect={onSelect}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>

      <div data-canvas-ui className="nish-canvas-controls">
        <span ref={zoomLabelRef} className="nish-canvas-zoom" aria-hidden="true">
          100%
        </span>
        <IconButton label="Zoom out" variant="ghost" className="size-11" onClick={() => zoomBy(1 / ZOOM_STEP, true)}>
          <MinusIcon />
        </IconButton>
        <IconButton label="Zoom in" variant="ghost" className="size-11" onClick={() => zoomBy(ZOOM_STEP, true)}>
          <PlusIcon />
        </IconButton>
        <IconButton
          label="Fit to screen"
          variant="ghost"
          className="size-11"
          onClick={() => {
            touched.current = false;
            doFit(true);
          }}
        >
          <FitIcon />
        </IconButton>
      </div>
    </div>
  );
}
