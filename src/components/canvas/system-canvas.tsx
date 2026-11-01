import {
  Fragment,
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
} from 'react';
import { cn } from '../../cn';
import { usePrefersReducedMotion } from '../flow';
import { IconButton } from '../primitives';
import { FitIcon, MinusIcon, PlusIcon } from './icons';
import { layoutSystem } from './layout';
import { hueStyle, NodeView } from './node';
import { labelPoint, routeEdges, type Box } from './route';
import type { CanvasGroup, CanvasHue, CanvasNode, SystemCanvasProps } from './types';
import { ANIM_MS, centerOn, clampK, DRAG_PX, ease, FIT_PAD, KEY_PAN, LABEL_K, MIN_K, PHONE_K, PHONE_MAX_W, TITLE_ROOM, ZOOM_STEP, zoomAround, type View } from './view';

// SystemCanvas: a pannable, zoomable graph-paper canvas of grouped nodes and edges that
// light up where work is happening. The layout is computed (layoutSystem), never stored.
//
// Pan and zoom never go through React state: the view lives in a ref and is written
// straight to the world layer (`transform`) and the viewport's background-position and
// background-size, so a drag or a wheel tick re-renders nothing. Motion lives in CSS
// (src/css/base.css, `nish-canvas-*`), inside `prefers-reduced-motion: no-preference`.
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
