import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
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
// straight to the world layer (`transform`) and the viewport's graph-paper variables, so a
// drag or a wheel tick re-renders nothing. Motion lives in CSS (src/css/base.css,
// `nish-canvas-*`), inside `prefers-reduced-motion: no-preference`.

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

/** Where every group and node sits, in world units (px at zoom 1). Columns are the distinct
 *  `column` values in ascending order, groups stack in the order given, nodes sit in a
 *  2-column grid inside their group (1 column for a group of one), and each column is
 *  centered against the tallest. Pure and deterministic. */
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
  const members = columns.map((c) => groups.filter((g) => g.column === c));
  const heights = members.map((list) => list.reduce((sum, g) => sum + sized.get(g.id)!.h, 0) + Math.max(0, list.length - 1) * rowGap);
  const tallest = heights.reduce((m, h) => Math.max(m, h), 0);

  const out: CanvasLayout = { width: 0, height: tallest, groups: {}, nodes: {} };
  let x = 0;
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
            {node.detail ? <span className="nish-canvas-detail">{node.detail}</span> : null}
          </span>
          {count > 1 ? <span className="nish-canvas-count">{count}</span> : null}
          {active ? <span className="nish-canvas-live" aria-hidden="true" /> : null}
        </button>
        {active && node.note ? (
          <span className="nish-canvas-note" aria-hidden="true">
            <TickerText text={node.note} as="span" className="text-xs" />
          </span>
        ) : null}
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

interface EdgePath {
  d: string;
  mx: number;
  my: number;
}

/** Right middle of `a` to left middle of `b`; when `b` is not to the right, bottom to top
 *  (or top to bottom when `b` is above) with vertical control points. */
function edgePath(a: Box, b: Box): EdgePath {
  if (b.x >= a.x + a.w) {
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const dx = Math.max(40, (x2 - x1) / 2);
    return {
      d: `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`,
      mx: (x1 + x2) / 2,
      my: (y1 + y2) / 2,
    };
  }
  const down = b.y + b.h / 2 >= a.y + a.h / 2;
  const x1 = a.x + a.w / 2;
  const y1 = down ? a.y + a.h : a.y;
  const x2 = b.x + b.w / 2;
  const y2 = down ? b.y : b.y + b.h;
  const dy = Math.max(30, Math.abs(y2 - y1) / 2);
  const s = down ? 1 : -1;
  return {
    d: `M${x1} ${y1}C${x1} ${y1 + s * dy} ${x2} ${y2 - s * dy} ${x2} ${y2}`,
    mx: (x1 + x2) / 2,
    my: (y1 + y2) / 2,
  };
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
  const [percent, setPercent] = useState(100);
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
      vp.style.setProperty('--cx', `${v.x}px`);
      vp.style.setProperty('--cy', `${v.y}px`);
      vp.style.setProperty('--cmin', `${24 * v.k}px`);
      vp.style.setProperty('--cmaj', `${120 * v.k}px`);
      vp.dataset.grid = v.k < 0.6 ? 'major' : 'both';
    }
    const p = Math.round(v.k * 100);
    setPercent((old) => (old === p ? old : p));
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
    if (fit >= PHONE_K || gs.length === 0) {
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
    const seen = new Map<number, number>();
    for (const g of groups) {
      const box = layout.groups[g.id];
      if (box && (!seen.has(g.column) || box.x < seen.get(g.column)!)) seen.set(g.column, box.x);
    }
    return [...seen.entries()].filter(([c]) => columns[c]).map(([c, x]) => ({ c, x, text: columns[c]! }));
  }, [columns, groups, layout]);

  const edgeViews = useMemo(() => {
    const boxOf = (id: string): Box | undefined => layout.nodes[id] ?? layout.groups[id];
    const hueOf = (id: string): { hue: CanvasHue | undefined; active: boolean } | undefined => {
      const n = lookup.nodes.get(id);
      if (n) return { hue: n.group.hue, active: !!n.node.active };
      const g = lookup.grps.get(id);
      if (g) return { hue: g.hue, active: g.nodes.some((x) => x.active) };
      return undefined;
    };
    return edges.flatMap((edge) => {
      const a = boxOf(edge.from);
      const b = boxOf(edge.to);
      const to = hueOf(edge.to);
      if (!a || !b || !to) return [];
      return [{ edge, path: edgePath(a, b), hue: to.hue, active: to.active }];
    });
  }, [edges, layout, lookup]);

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
    >
      <div ref={worldRef} className="nish-canvas-world" style={{ width: layout.width, height: layout.height }}>
        {columnTitles.map((t) => (
          <div key={t.c} className="nish-canvas-coltitle" style={{ left: t.x, top: -TITLE_ROOM }}>
            {t.text}
          </div>
        ))}

        {groups.map((g) => {
          const box = layout.groups[g.id];
          if (!box) return null;
          const live = g.nodes.some((n) => n.active);
          const delay = (columnIndex.get(g.column) ?? 0) * 80;
          return (
            <div
              key={g.id}
              className="nish-canvas-group"
              style={{ ...hueStyle(g.hue), left: box.x, top: box.y, width: box.w, height: box.h, '--nish-canvas-delay': `${delay}ms` } as CSSProperties}
              data-live={live || undefined}
              data-selected={selected === g.id || undefined}
            >
              <span className="nish-canvas-band" aria-hidden="true" />
              <button
                type="button"
                className="nish-canvas-head"
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
          );
        })}

        <svg className="nish-canvas-edges" width={layout.width} height={layout.height} aria-hidden="true" focusable="false">
          {edgeViews.map(({ edge, path, hue, active }) => (
            <g key={edge.id} style={hueStyle(hue)} className="nish-canvas-edge" data-active={active || undefined} data-dashed={edge.dashed || undefined}>
              <path className="nish-canvas-edge-line" d={path.d} fill="none" />
              {active ? <circle className="nish-canvas-dot" r="3.5" style={{ offsetPath: `path("${path.d}")` }} /> : null}
              {edge.label && labelsOn ? (
                <text className="nish-canvas-edge-label" x={path.mx} y={path.my - 6} textAnchor="middle">
                  {edge.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>

        {groups.map((g) => {
          const delay = (columnIndex.get(g.column) ?? 0) * 80;
          return g.nodes.map((n) => {
            const box = layout.nodes[n.id];
            if (!box) return null;
            return (
              <NodeView
                key={n.id}
                node={n}
                groupTitle={g.title}
                hue={g.hue}
                box={box}
                selected={selected === n.id}
                delay={delay}
                onSelect={onSelect}
              />
            );
          });
        })}
      </div>

      <div data-canvas-ui className="nish-canvas-controls">
        <span className="nish-canvas-zoom" aria-hidden="true">
          {percent}%
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
