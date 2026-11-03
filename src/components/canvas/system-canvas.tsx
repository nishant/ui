'use client';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { cn } from '../../cn';
import { useIsoLayoutEffect } from '../client';
import { usePrefersReducedMotion } from '../flow';
import { IconButton } from '../primitives';
import { useNishStrings } from '../provider';
import { FollowCaption } from './follow-caption';
import { useFollow } from './follow';
import { FitIcon, FollowIcon, MinusIcon, PlusIcon } from './icons';
import { chooseLayout, layoutCandidates, SCROLL_K, type CanvasLayout } from './layout';
import { EdgeLegend } from './legend';
import { Minimap, type MinimapHandle } from './minimap';
import { hueStyle, NodeView } from './node';
import { labelPoint, routeEdges, type Box } from './route';
import { DEFAULT_CANVAS_LABELS, type CanvasEdgeKind, type CanvasGroup, type CanvasHue, type CanvasLabels, type CanvasNode, type SystemCanvasProps } from './types';
import { ANIM_MS, centerOn, clampK, DOUBLE_MS, DOUBLE_PX, DRAG_PX, ease, FIT_PAD, FOLLOW_MS, KEY_PAN, LABEL_K, LOD_K, MIN_K, PHONE_K, PHONE_MAX_W, ZOOM_STEP, zoomAround, type View } from './view';

const insetFor = (w: number, minimap: boolean) => (minimap && w >= MINIMAP_MIN_W ? TOP_INSET_MINIMAP : TOP_INSET);
const NO_KINDS: CanvasEdgeKind[] = [];
// World-free screen px kept clear at the top for the legend button (12 px offset + 44 px button + gap), and with the minimap (176 x ~130 at top 12) shown.
const TOP_INSET = 64;
const TOP_INSET_MINIMAP = 150;
const MINIMAP_MIN_W = 600;
// Screen px from either side that the corner overlays (legend, minimap) can cover.
const CORNER_W = 200;
const initialHidden = (kinds: CanvasEdgeKind[]) => new Set(kinds.filter((k) => k.hidden).map((k) => k.id));

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
  bands,
  layout: layoutMode = 'auto',
  edgeKinds,
  follow,
  onFollowChange,
  minimap = true,
  selected = null,
  onSelect,
  height = '100%',
  label: labelProp,
  labels: labelOverrides,
  className,
  style,
  ref: forwardedRef,
  ...rest
}: SystemCanvasProps) {
  const strings = useNishStrings();
  const label = labelProp ?? strings.systemMap;
  const labels: CanvasLabels = useMemo(() => ({ ...DEFAULT_CANVAS_LABELS, ...labelOverrides }), [labelOverrides]);
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) (forwardedRef as { current: HTMLDivElement | null }).current = node;
    },
    [forwardedRef],
  );
  const worldRef = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ x: 0, y: 0, k: 1 });
  const target = useRef<View | null>(null); // where a running animation is heading
  const raf = useRef(0);
  const size = useRef({ w: 0, h: 0 });
  const touched = useRef(false); // the viewer moved the view; stop auto-fitting
  const zoomLabelRef = useRef<HTMLSpanElement>(null);
  const miniRef = useRef<MinimapHandle>(null);
  const [labelsOn, setLabelsOn] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 }); // follow re-flies when this changes

  // --- edge kinds: hidden kinds are left out of the layout and the routing ----------
  const kindList = edgeKinds ?? NO_KINDS;
  const kindSig = kindList.map((k) => k.id).join('|');
  const [hiddenState, setHiddenState] = useState(() => ({
    sig: kindSig,
    set: initialHidden(kindList),
  }));
  let hiddenKinds = hiddenState.set;
  if (hiddenState.sig !== kindSig) {
    const next = { sig: kindSig, set: initialHidden(kindList) };
    setHiddenState(next);
    hiddenKinds = next.set;
  }
  const toggleKind = useCallback((id: string) => {
    setHiddenState((s) => {
      const set = new Set(s.set);
      if (!set.delete(id)) set.add(id);
      return { sig: s.sig, set };
    });
  }, []);
  const visibleEdges = useMemo(() => edges.filter((e) => !e.kind || !hiddenKinds.has(e.kind)), [edges, hiddenKinds]);
  const lineOf = useMemo(() => new Map(kindList.map((k) => [k.id, k.line ?? 'solid'] as const)), [kindList]);

  // --- follow is controlled when `follow` is set ----------------------------------
  const [internalFollow, setInternalFollow] = useState(false);
  const followOn = follow ?? internalFollow;
  const followRef = useRef(followOn);
  const followProps = useRef({ controlled: follow !== undefined, onFollowChange });
  const setFollow = useCallback((on: boolean) => {
    if (!followProps.current.controlled) setInternalFollow(on);
    followProps.current.onFollowChange?.(on);
  }, []);
  /** The viewer moved the view: stop auto-fitting and stop following. */
  const markMoved = useCallback(() => {
    touched.current = true;
    if (followRef.current) {
      followRef.current = false; // a burst of events in one frame stops follow once
      setFollow(false);
    }
  }, [setFollow]);

  const sig = groups.map((g) => `${g.id}:${g.column}:${g.band ?? ''}:${g.nodes.map((n) => n.id).join(',')}`).join('|');
  const visSig = visibleEdges.map((e) => `${e.id}:${e.from}:${e.to}`).join('|');
  // The layout and the viewport size it was picked for (0 until the first measurement).
  // The candidates do not depend on the viewport, so a resize only re-chooses between them.
  const cands = useMemo(() => layoutCandidates(groups, visibleEdges, layoutMode), [sig, visSig, layoutMode]); // eslint-disable-line react-hooks/exhaustive-deps
  const [picked, setPicked] = useState(() => ({ layout: chooseLayout(cands, { w: 0, h: 0 }), w: 0, h: 0 }));
  const layout = picked.layout;
  const latest = useRef({
    cands,
    minimap,
    groups,
    layout,
    vis: visibleEdges,
    mode: layoutMode,
  });
  // Event handlers and effects read the latest props through refs; synced first, before the other layout effects.
  useIsoLayoutEffect(() => {
    followRef.current = followOn;
    followProps.current = { controlled: follow !== undefined, onFollowChange };
    latest.current = { cands, minimap, groups, layout, vis: visibleEdges, mode: layoutMode };
  });

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
      vp.dataset.grid = v.k < LOD_K ? 'major' : 'both';
      const lod = v.k < LOD_K ? 'far' : 'near';
      if (vp.dataset.lod !== lod) vp.dataset.lod = lod;
    }
    miniRef.current?.setView(v, size.current);
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

  /** Moves to `v`: a 300 ms ease (`ms`), or at once when `animate` is false or motion is reduced. */
  const go = useCallback(
    (v: View, animate: boolean, ms = ANIM_MS) => {
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
        const t = Math.min(1, (now - t0) / ms);
        const e = ease(t);
        // Interpolate zoom in log space so the motion feels even.
        const k = from.k * Math.pow(v.k / from.k, e);
        apply({
          k,
          x: from.x + (v.x - from.x) * e,
          y: from.y + (v.y - from.y) * e,
        });
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
    const { groups: gs, layout: lay, minimap: mini } = latest.current;
    const cw = Math.max(1, lay.width);
    const ch = Math.max(1, lay.height + lay.titleRoom);
    // The legend and minimap sit in the top corners: keep a strip clear for them only when a card
    // of the map, fitted without that strip, would land under one of them.
    const inset = insetFor(w, mini);
    const free = Math.min((w - FIT_PAD * 2) / cw, (h - FIT_PAD * 2) / ch, 1);
    const fx = (w - cw * free) / 2;
    const fy = FIT_PAD + (h - FIT_PAD * 2 - ch * free) / 2 + lay.titleRoom * free;
    const underCorner = Object.values(lay.groups).some((b) => {
      const top0 = fy + b.y * free;
      const left = fx + b.x * free;
      const right = left + b.w * free;
      return top0 < inset && (left < CORNER_W || right > w - CORNER_W);
    });
    const top = underCorner ? inset : FIT_PAD;
    const availH = h - top - FIT_PAD;
    const fit = Math.min((w - FIT_PAD * 2) / cw, availH / ch, 1);
    if (fit >= PHONE_K || (w >= PHONE_MAX_W && fit >= SCROLL_K - 0.05) || gs.length === 0) {
      const k = clampK(Number.isFinite(fit) && fit > 0 ? fit : 1);
      return {
        k,
        x: (w - lay.width * k) / 2,
        y: top + (availH - ch * k) / 2 + lay.titleRoom * k,
      };
    }
    let box: Box | undefined;
    let activeGroup: Box | undefined;
    for (const g of gs) {
      const n = g.nodes.find((node) => node.active);
      if (n) {
        box = lay.nodes[n.id];
        activeGroup = lay.groups[g.id];
        break;
      }
    }
    // Fill the width when the map is narrower than the canvas at the phone zoom (an unfolded Fold).
    const pk = clampK(Math.min(1, Math.max(PHONE_K, (w - 48) / Math.max(1, lay.width))));
    // The map's top edge never drops below the overlay row and its bottom never rises above the
    // bottom padding, so the view never opens on empty canvas above or below the map.
    const pinY = (y: number) => Math.max(Math.min(y, top + lay.titleRoom * pk), h - FIT_PAD - lay.height * pk);
    const centerX = (lay.width * pk <= w - 24 ? (w - lay.width * pk) / 2 : undefined);
    if (!box) {
      // Nothing active: open on the top of the map (the first band), centered across when it fits.
      const first = lay.groups[gs[0]!.id];
      const x = centerX ?? (first ? w / 2 - (first.x + first.w / 2) * pk : FIT_PAD);
      return { k: pk, x, y: top + lay.titleRoom * pk };
    }
    // Keep the box head clear of the overlay row. A node centers x on its group (as follow does) when
    // the group fits, so the group's left cards and title are not cut off.
    const v = centerOn(w, h, pk, box);
    const gb = activeGroup;
    if (centerX !== undefined) v.x = centerX;
    else if (gb && gb.w * pk <= w - 24) v.x = w / 2 - (gb.x + gb.w / 2) * pk;
    return { ...v, y: pinY(Math.max(h / 2, top + (box.h * pk) / 2) - (box.y + box.h / 2) * pk) };
  }, []);

  const doFit = useCallback(
    (animate: boolean) => {
      if (size.current.w <= 0 || size.current.h <= 0) return;
      go(fitView(), animate);
    },
    [fitView, go],
  );

  // Pick the layout for the current viewport and data. A resize only swaps the layout when the
  // chosen candidate (mode or row width) changes, so a resize inside one candidate re-renders
  // nothing; otherwise it just refits.
  const relayout = useCallback(
    (data: boolean) => {
      const { cands: cs, layout: cur } = latest.current;
      const { w, h } = size.current;
      const next = chooseLayout(cs, { w, h });
      if (!data && next.mode === cur.mode && next.width === cur.width && next.height === cur.height) {
        if (!touched.current && !followRef.current) doFit(false);
        return;
      }
      setPicked({ layout: next, w, h });
      // Publish the size in the same render as the new layout so follow flies once, for the real size.
      if (followRef.current) setViewport((old) => (old.w === w && old.h === h ? old : { w, h }));
    },
    [doFit],
  );

  // The first measurement happens before paint; later size changes are throttled to a frame.
  const layoutRaf = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Publishes the measured size to follow's state once a resize settles, also while follow is off, so
   *  switching follow on never starts from a stale size. */
  const syncViewport = useCallback(() => {
    const { w, h } = size.current;
    setViewport((old) => (old.w === w && old.h === h ? old : { w, h }));
  }, []);
  useIsoLayoutEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let first = true;
    const measure = () => {
      const r = vp.getBoundingClientRect();
      size.current = { w: r.width, h: r.height };
      if (first) {
        first = false;
        setViewport({ w: r.width, h: r.height });
        relayout(true);
        return;
      }
      if (layoutRaf.current) return;
      layoutRaf.current = requestAnimationFrame(() => {
        layoutRaf.current = 0;
        relayout(false);
        // The minimap's visibility and view rect follow the new size even when the view stays put.
        miniRef.current?.setView(view.current, size.current);
        // Follow re-flies only once a resize settles; nothing re-renders per frame.
        clearTimeout(settleTimer.current);
        settleTimer.current = setTimeout(syncViewport, 150);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(layoutRaf.current);
      layoutRaf.current = 0;
      clearTimeout(settleTimer.current);
    };
  }, [relayout, syncViewport]);

  // Switching follow on picks up any size change that happened while it was off.
  useEffect(() => {
    if (followOn) syncViewport();
  }, [followOn, syncViewport]);

  const firstData = useRef(true);
  useIsoLayoutEffect(() => {
    if (firstData.current) {
      firstData.current = false;
      return;
    }
    relayout(true);
  }, [sig, visSig, layoutMode, relayout]);

  // A new layout: the first one fits at once; a different one slides the cards to their new
  // places (data-relayout switches the CSS transition on for a moment) and refits.
  const prevLayout = useRef<CanvasLayout | null>(null);
  const fitted = useRef(false);
  const relayoutTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useIsoLayoutEffect(() => {
    const prev = prevLayout.current;
    prevLayout.current = layout;
    if (picked.w <= 0 || picked.h <= 0) return; // picked before the first measurement
    if (!fitted.current) {
      fitted.current = true;
      doFit(false);
      return;
    }
    const moved = !prev || prev.mode !== layout.mode || prev.width !== layout.width || prev.height !== layout.height;
    if (!moved) {
      if (!touched.current && !followRef.current) doFit(false);
      return;
    }
    const vp = viewportRef.current;
    if (vp) {
      vp.dataset.relayout = 'true';
      clearTimeout(relayoutTimer.current);
      relayoutTimer.current = setTimeout(() => {
        delete vp.dataset.relayout;
      }, 500);
    }
    stop(); // a running fly would aim at the old layout
    if (!touched.current && !followRef.current) doFit(true);
  }, [layout, picked.w, picked.h, doFit, stop]);

  useEffect(() => () => clearTimeout(relayoutTimer.current), []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // --- zoom and pan helpers ----------------------------------------------------
  const zoomBy = useCallback(
    (factor: number, animate: boolean) => {
      markMoved();
      const base = target.current ?? view.current;
      const { w, h } = size.current;
      go(zoomAround(base, base.k * factor, w / 2, h / 2), animate);
    },
    [go, markMoved],
  );

  // --- wheel (needs a non-passive listener) ------------------------------------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element | null)?.closest('[data-canvas-ui]')) return;
      e.preventDefault();
      stop();
      markMoved();
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
  }, [apply, stop, markMoved]);

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
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    pinchDist: 1,
    pinchMid: { x: 0, y: 0 },
    pinchView: { x: 0, y: 0, k: 1 },
  });
  const dragged = useRef(false);
  const lastTap = useRef<{
    t: number;
    x: number;
    y: number;
    el: Element;
  } | null>(null);
  const lastDouble = useRef(0); // when a double-tap last fired, so the browser's own dblclick is ignored

  const local = (e: { clientX: number; clientY: number }) => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /** A double-click or double-tap: on a group head zoom to the group, on empty canvas zoom in. */
  const doubleAt = (el: Element, p: { x: number; y: number }) => {
    if (el.closest('[data-canvas-ui]') || el.closest('.nish-canvas-slot')) return;
    const { w, h } = size.current;
    const head = el.closest('.nish-canvas-head');
    if (head) {
      const box = latest.current.layout.groups[(head as HTMLElement).dataset.canvasId ?? ''];
      if (!box) return;
      const k = Math.min(1.5, Math.max(MIN_K, Math.min((w - FIT_PAD * 2) / box.w, (h - FIT_PAD * 2) / box.h)));
      markMoved();
      go(centerOn(w, h, k, box), true);
      return;
    }
    markMoved();
    const base = target.current ?? view.current;
    go(zoomAround(base, base.k * 1.5, p.x, p.y), true);
  };

  const onDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (performance.now() - lastDouble.current < 600) return;
    doubleAt(e.target as Element, local(e));
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
      markMoved();
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
      markMoved();
      setHoverId(null);
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
      if (g.mode === 'pending' && e.pointerType === 'touch' && e.type === 'pointerup') {
        // A touch tap that did not drag; two close together on the same thing are a double-tap.
        const p = local(e);
        const now = performance.now();
        const el = (e.target as Element).closest('[data-canvas-id]') ?? (e.target as Element);
        const lt = lastTap.current;
        if (lt && now - lt.t <= DOUBLE_MS && lt.el === el && Math.hypot(p.x - lt.x, p.y - lt.y) <= DOUBLE_PX) {
          lastTap.current = null;
          lastDouble.current = now;
          doubleAt(e.target as Element, p);
        } else {
          lastTap.current = { t: now, x: p.x, y: p.y, el };
        }
      }
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

  // --- hover focus (mouse and pen only; touch uses selection) -------------------
  const onPointerOver = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || gesture.current.mode === 'pan' || gesture.current.mode === 'pinch') return;
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(hover: hover)').matches) return;
    const id = (e.target as Element).closest('[data-canvas-id]')?.getAttribute('data-canvas-id') ?? null;
    setHoverId((old) => (old === id ? old : id));
  };
  const onPointerLeave = () => setHoverId(null);

  // --- selecting something brings it into view ---------------------------------
  const prevSelected = useRef(selected);
  useEffect(() => {
    if (prevSelected.current === selected) return;
    prevSelected.current = selected;
    if (!selected || followRef.current) return;
    const lay = latest.current.layout;
    const box = lay.nodes[selected] ?? lay.groups[selected];
    const { w, h } = size.current;
    if (!box || w <= 0 || h <= 0) return;
    const v = target.current ?? view.current;
    const left = box.x * v.k + v.x;
    const top = box.y * v.k + v.y;
    const inside = left >= 0 && top >= 0 && left + box.w * v.k <= w && top + box.h * v.k <= h;
    if (inside && v.k >= LOD_K) return;
    const k = clampK(Math.max(v.k, 0.8));
    const next = centerOn(w, h, k, box);
    // On a phone the drawer covers the bottom: use the top 45%.
    if (w < PHONE_MAX_W) next.y = (h * 0.45) / 2 - (box.y + box.h / 2) * k;
    touched.current = true;
    go(next, true);
  }, [selected, go]);

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
    markMoved();
    go(centerOn(w, h, v.k, box), true);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.metaKey) return;
    if ((e.target as Element).closest('[data-canvas-ui]')) return;
    const v = view.current;
    switch (e.key) {
      case 'ArrowLeft':
        stop();
        markMoved();
        apply({ ...v, x: v.x + KEY_PAN });
        break;
      case 'ArrowRight':
        stop();
        markMoved();
        apply({ ...v, x: v.x - KEY_PAN });
        break;
      case 'ArrowUp':
        stop();
        markMoved();
        apply({ ...v, y: v.y + KEY_PAN });
        break;
      case 'ArrowDown':
        stop();
        markMoved();
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

  const headerViews = useMemo(
    () =>
      layout.headers.flatMap((h) => {
        const text = layout.mode === 'bands' ? (bands?.[h.index] ?? columns?.[h.index]) : columns?.[h.index];
        return text ? [{ key: `${layout.mode}:${h.index}`, x: h.x, y: h.y, text }] : [];
      }),
    [layout, bands, columns],
  );

  // Routing depends only on the layout and the visible edge ends, so a pan, a zoom or an
  // activity update never recomputes it.
  const routes = useMemo(() => routeEdges(layout, groups, visibleEdges), [layout, visSig]); // eslint-disable-line react-hooks/exhaustive-deps

  const { edgeViews, ports } = useMemo(() => {
    const hueOf = (id: string): { hue: CanvasHue | undefined; active: boolean } | undefined => {
      const n = lookup.nodes.get(id);
      if (n) return { hue: n.group.hue, active: !!n.node.active };
      const g = lookup.grps.get(id);
      if (g) return { hue: g.hue, active: g.nodes.some((x) => x.active) };
      return undefined;
    };
    const views = visibleEdges.flatMap((edge) => {
      const route = routes[edge.id];
      const to = hueOf(edge.to);
      if (!route || !to) return [];
      const line = edge.dashed ? 'dashed' : ((edge.kind ? lineOf.get(edge.kind) : undefined) ?? 'solid');
      return [
        {
          edge,
          route,
          line,
          mid: labelPoint(route.points),
          hue: to.hue,
          active: to.active,
        },
      ];
    });
    // Quiet edges first so an active edge that shares a trunk with one draws on top.
    views.sort((a, b) => Number(a.active) - Number(b.active));
    // Source ports only: the arrowheads mark where an edge ends.
    const dots = new Map<string, { x: number; y: number; hue: CanvasHue | undefined; active: boolean }>();
    for (const v of views) {
      const p = v.route.points[0]!;
      const key = `${p[0]}|${p[1]}`;
      const old = dots.get(key);
      if (!old || (v.active && !old.active)) dots.set(key, { x: p[0], y: p[1], hue: v.hue, active: v.active });
    }
    return { edgeViews: views, ports: [...dots.entries()] };
  }, [visibleEdges, routes, lookup, lineOf]);

  // Focus: the hovered thing, else the selected one. Its edges stay lit, the cards at their
  // other ends stay clear, everything else dims.
  const focus = useMemo(() => {
    const id = hoverId ?? selected;
    if (!id) return null;
    const node = lookup.nodes.get(id);
    const grp = node ? node.group : lookup.grps.get(id);
    if (!grp) return null;
    const mine = new Set<string>(node ? [id] : [id, ...grp.nodes.map((n) => n.id)]);
    const related = new Set<string>([id, grp.id]);
    if (!node) for (const n of grp.nodes) related.add(n.id);
    const addEnd = (eid: string) => {
      related.add(eid);
      const n = lookup.nodes.get(eid);
      if (n) related.add(n.group.id);
      const g = lookup.grps.get(eid);
      if (g) for (const x of g.nodes) related.add(x.id);
    };
    const hot = new Set<string>();
    for (const e of visibleEdges) {
      if (!mine.has(e.from) && !mine.has(e.to)) continue;
      hot.add(e.id);
      addEnd(e.from);
      addEnd(e.to);
    }
    return { related, hot };
  }, [hoverId, selected, lookup, visibleEdges]);

  // --- follow --------------------------------------------------------------------
  const fly = useCallback((v: View) => go(v, true, FOLLOW_MS), [go]);
  const { step } = useFollow({
    on: followOn,
    groups,
    layout,
    size: viewport,
    fit: fitView,
    inset: TOP_INSET,
    fly,
  });
  const canFollow = useMemo(() => groups.some((g) => g.nodes.some((n) => n.active !== undefined)), [groups]);

  const jumpTo = useCallback(
    (wx: number, wy: number) => {
      stop();
      markMoved();
      const { w, h } = size.current;
      const v = view.current;
      apply({ k: v.k, x: w / 2 - wx * v.k, y: h / 2 - wy * v.k });
    },
    [apply, stop, markMoved],
  );

  const layoutKey = `${layout.mode}:${layout.width}`;

  return (
    <div
      {...rest}
      ref={setViewportRef}
      role="application"
      aria-label={label}
      aria-roledescription="canvas"
      tabIndex={0}
      className={cn('nish-canvas', className)}
      style={{ height, ...style }}
      data-grid="both"
      data-lod="near"
      data-focus={focus ? 'true' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerOver={onPointerOver}
      onPointerLeave={onPointerLeave}
      onDoubleClick={onDoubleClick}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      onScroll={onScroll}
      onFocusCapture={onFocusCapture}
    >
      <div ref={worldRef} className="nish-canvas-world" style={{ width: layout.width, height: layout.height }}>
        {headerViews.map((t) => (
          <div key={t.key} className="nish-canvas-coltitle" style={layout.mode === 'bands' ? { left: t.x, top: t.y, lineHeight: 1, transform: 'translateY(-100%)' } : { left: t.x, top: t.y }}>
            {t.text}
          </div>
        ))}

        <svg key={`e${layoutKey}`} className="nish-canvas-edges" width={layout.width} height={layout.height} aria-hidden="true" focusable="false">
          {edgeViews.map(({ edge, route, line, mid, hue, active }) => {
            const hot = focus?.hot.has(edge.id) ?? false;
            const end = route.points[route.points.length - 1]!;
            const [ex, ey] = end;
            const arrow = route.dir === 'down' ? `M${ex} ${ey}L${ex - 3.5} ${ey - 8}L${ex + 3.5} ${ey - 8}Z` : `M${ex} ${ey}L${ex - 8} ${ey - 3.5}L${ex - 8} ${ey + 3.5}Z`;
            return (
              <g key={edge.id} style={hueStyle(hue)} className="nish-canvas-edge" data-active={active || undefined} data-line={line} data-hot={hot || undefined}>
                <path className="nish-canvas-edge-line" d={route.d} fill="none" />
                <path className="nish-canvas-arrow" d={arrow} />
                {active ? <circle className="nish-canvas-dot" r="3.5" style={{ offsetPath: `path("${route.d}")` }} /> : null}
                {edge.label && (labelsOn || hot) ? (
                  <text className="nish-canvas-edge-label" x={mid.x} y={mid.y - 6} textAnchor="middle">
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        <svg key={`p${layoutKey}`} className="nish-canvas-ports" width={layout.width} height={layout.height} aria-hidden="true" focusable="false">
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
                data-related={focus?.related.has(g.id) || undefined}
              >
                <span className="nish-canvas-band" aria-hidden="true" />
                <button type="button" className="nish-canvas-head" data-canvas-id={g.id} aria-pressed={selected === g.id} onClick={() => onSelect?.(g.id, 'group')}>
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
                    dim={focus ? !focus.related.has(n.id) : false}
                    delay={delay}
                    onSelect={onSelect}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>

      <EdgeLegend kinds={kindList} hidden={hiddenKinds} onToggle={toggleKind} labels={labels} />
      {minimap ? <Minimap layout={layout} groups={groups} handleRef={miniRef} onJump={jumpTo} /> : null}
      <FollowCaption step={step} labels={labels} />

      <div data-canvas-ui className="nish-canvas-controls">
        <span ref={zoomLabelRef} className="nish-canvas-zoom" aria-hidden="true">
          100%
        </span>
        <IconButton label={strings.zoomOut} variant="ghost" className="size-11" onClick={() => zoomBy(1 / ZOOM_STEP, true)}>
          <MinusIcon />
        </IconButton>
        <IconButton label={strings.zoomIn} variant="ghost" className="size-11" onClick={() => zoomBy(ZOOM_STEP, true)}>
          <PlusIcon />
        </IconButton>
        <IconButton
          label={strings.fitToScreen}
          variant="ghost"
          className="size-11"
          onClick={() => {
            touched.current = false;
            doFit(true);
          }}
        >
          <FitIcon />
        </IconButton>
        {canFollow ? (
          <IconButton label={strings.followActivity} variant="ghost" className="size-11" active={followOn} aria-pressed={followOn} onClick={() => setFollow(!followOn)}>
            <FollowIcon />
          </IconButton>
        ) : null}
      </div>
    </div>
  );
}
