"use client";

// src/components/canvas/system-canvas.tsx
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../../cn.js";
import { useIsoLayoutEffect } from "../client.js";
import { usePrefersReducedMotion } from "../flow.js";
import { IconButton } from "../primitives.js";
import { useStrings } from "../provider.js";
import { CANVAS_STRINGS } from "../strings.js";
import { FollowCaption } from "./follow-caption.js";
import { useFollow } from "./follow.js";
import { FitIcon, FollowIcon, MinusIcon, PlusIcon } from "./icons.js";
import { chooseLayout, layoutCandidates, SCROLL_K } from "./layout.js";
import { EdgeLegend } from "./legend.js";
import { Minimap } from "./minimap.js";
import { hueStyle, NodeView } from "./node.js";
import { labelPoint, routeEdges } from "./route.js";
import { DEFAULT_CANVAS_LABELS } from "./types.js";
import { ANIM_MS, centerOn, clampK, DOUBLE_MS, DOUBLE_PX, DRAG_PX, ease, FIT_PAD, FOLLOW_MS, KEY_PAN, LABEL_K, LOD_K, MIN_K, PHONE_K, PHONE_MAX_W, ZOOM_STEP, zoomAround } from "./view.js";
import { jsx, jsxs } from "react/jsx-runtime";
var insetFor = (w, minimap) => minimap && w >= MINIMAP_MIN_W ? TOP_INSET_MINIMAP : TOP_INSET;
var NO_KINDS = [];
var TOP_INSET = 64;
var TOP_INSET_MINIMAP = 150;
var MINIMAP_MIN_W = 600;
var CORNER_W = 200;
var initialHidden = (kinds) => new Set(kinds.filter((k) => k.hidden).map((k) => k.id));
var VISUALLY_HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
  listStyle: "none"
};
function SystemCanvas({
  groups,
  edges,
  columns,
  bands,
  layout: layoutMode = "auto",
  edgeKinds,
  follow,
  onFollowChange,
  minimap = true,
  selected = null,
  onSelect,
  height = "100%",
  label: labelProp,
  labels: labelOverrides,
  className,
  style,
  ref: forwardedRef,
  ...rest
}) {
  const strings = useStrings(CANVAS_STRINGS);
  const label = labelProp ?? strings.systemMap;
  const labels = useMemo(() => ({ ...DEFAULT_CANVAS_LABELS, ...labelOverrides }), [labelOverrides]);
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef(null);
  const setViewportRef = useCallback(
    (node) => {
      viewportRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );
  const worldRef = useRef(null);
  const view = useRef({ x: 0, y: 0, k: 1 });
  const target = useRef(null);
  const raf = useRef(0);
  const size = useRef({ w: 0, h: 0 });
  const touched = useRef(false);
  const zoomLabelRef = useRef(null);
  const miniRef = useRef(null);
  const [labelsOn, setLabelsOn] = useState(true);
  const [hoverId, setHoverId] = useState(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const kindList = edgeKinds ?? NO_KINDS;
  const kindSig = kindList.map((k) => k.id).join("|");
  const [hiddenState, setHiddenState] = useState(() => ({
    sig: kindSig,
    set: initialHidden(kindList)
  }));
  let hiddenKinds = hiddenState.set;
  if (hiddenState.sig !== kindSig) {
    const next = { sig: kindSig, set: initialHidden(kindList) };
    setHiddenState(next);
    hiddenKinds = next.set;
  }
  const toggleKind = useCallback((id) => {
    setHiddenState((s) => {
      const set = new Set(s.set);
      if (!set.delete(id)) set.add(id);
      return { sig: s.sig, set };
    });
  }, []);
  const visibleEdges = useMemo(() => edges.filter((e) => !e.kind || !hiddenKinds.has(e.kind)), [edges, hiddenKinds]);
  const lineOf = useMemo(() => new Map(kindList.map((k) => [k.id, k.line ?? "solid"])), [kindList]);
  const [internalFollow, setInternalFollow] = useState(false);
  const followOn = follow ?? internalFollow;
  const followRef = useRef(followOn);
  const followProps = useRef({ controlled: follow !== void 0, onFollowChange });
  const setFollow = useCallback((on) => {
    if (!followProps.current.controlled) setInternalFollow(on);
    followProps.current.onFollowChange?.(on);
  }, []);
  const markMoved = useCallback(() => {
    touched.current = true;
    if (followRef.current) {
      followRef.current = false;
      setFollow(false);
    }
  }, [setFollow]);
  const sig = groups.map((g) => `${g.id}:${g.column}:${g.band ?? ""}:${g.nodes.map((n) => n.id).join(",")}`).join("|");
  const visSig = visibleEdges.map((e) => `${e.id}:${e.from}:${e.to}`).join("|");
  const cands = useMemo(() => layoutCandidates(groups, visibleEdges, layoutMode), [sig, visSig, layoutMode]);
  const [picked, setPicked] = useState(() => ({ layout: chooseLayout(cands, { w: 0, h: 0 }), w: 0, h: 0 }));
  const layout = picked.layout;
  const latest = useRef({
    cands,
    minimap,
    groups,
    layout,
    vis: visibleEdges,
    mode: layoutMode
  });
  useIsoLayoutEffect(() => {
    followRef.current = followOn;
    followProps.current = { controlled: follow !== void 0, onFollowChange };
    latest.current = { cands, minimap, groups, layout, vis: visibleEdges, mode: layoutMode };
  });
  const apply = useCallback((v) => {
    view.current = v;
    const world = worldRef.current;
    const vp = viewportRef.current;
    if (world) world.style.transform = `translate3d(${v.x}px,${v.y}px,0) scale(${v.k})`;
    if (vp) {
      const maj = `${120 * v.k}px ${120 * v.k}px`;
      const min = `${24 * v.k}px ${24 * v.k}px`;
      vp.style.backgroundPosition = `${v.x}px ${v.y}px`;
      vp.style.backgroundSize = `${maj}, ${maj}, ${min}, ${min}`;
      vp.dataset.grid = v.k < LOD_K ? "major" : "both";
      const lod = v.k < LOD_K ? "far" : "near";
      if (vp.dataset.lod !== lod) vp.dataset.lod = lod;
    }
    miniRef.current?.setView(v, size.current);
    const zl = zoomLabelRef.current;
    if (zl) {
      const text = `${Math.round(v.k * 100)}%`;
      if (zl.textContent !== text) zl.textContent = text;
    }
    const on = v.k >= LABEL_K;
    setLabelsOn((old) => old === on ? old : on);
  }, []);
  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    target.current = null;
  }, []);
  const go = useCallback(
    (v, animate, ms = ANIM_MS) => {
      cancelAnimationFrame(raf.current);
      if (!animate || reduced) {
        target.current = null;
        apply(v);
        return;
      }
      const from = { ...view.current };
      target.current = v;
      const t0 = performance.now();
      const step2 = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = ease(t);
        const k = from.k * Math.pow(v.k / from.k, e);
        apply({
          k,
          x: from.x + (v.x - from.x) * e,
          y: from.y + (v.y - from.y) * e
        });
        if (t < 1) raf.current = requestAnimationFrame(step2);
        else {
          raf.current = 0;
          target.current = null;
          apply(v);
        }
      };
      raf.current = requestAnimationFrame(step2);
    },
    [apply, reduced]
  );
  const fitView = useCallback(() => {
    const { w, h } = size.current;
    const { groups: gs, layout: lay, minimap: mini } = latest.current;
    const cw = Math.max(1, lay.width);
    const ch = Math.max(1, lay.height + lay.titleRoom);
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
    if (fit >= PHONE_K || w >= PHONE_MAX_W && fit >= SCROLL_K - 0.05 || gs.length === 0) {
      const k = clampK(Number.isFinite(fit) && fit > 0 ? fit : 1);
      return {
        k,
        x: (w - lay.width * k) / 2,
        y: top + (availH - ch * k) / 2 + lay.titleRoom * k
      };
    }
    let box;
    let activeGroup;
    for (const g of gs) {
      const n = g.nodes.find((node) => node.active);
      if (n) {
        box = lay.nodes[n.id];
        activeGroup = lay.groups[g.id];
        break;
      }
    }
    const pk = clampK(Math.min(1, Math.max(PHONE_K, (w - 48) / Math.max(1, lay.width))));
    const pinY = (y) => Math.max(Math.min(y, top + lay.titleRoom * pk), h - FIT_PAD - lay.height * pk);
    const centerX = lay.width * pk <= w - 24 ? (w - lay.width * pk) / 2 : void 0;
    if (!box) {
      const first = lay.groups[gs[0].id];
      const x = centerX ?? (first ? w / 2 - (first.x + first.w / 2) * pk : FIT_PAD);
      return { k: pk, x, y: top + lay.titleRoom * pk };
    }
    const v = centerOn(w, h, pk, box);
    const gb = activeGroup;
    if (centerX !== void 0) v.x = centerX;
    else if (gb && gb.w * pk <= w - 24) v.x = w / 2 - (gb.x + gb.w / 2) * pk;
    return { ...v, y: pinY(Math.max(h / 2, top + box.h * pk / 2) - (box.y + box.h / 2) * pk) };
  }, []);
  const doFit = useCallback(
    (animate) => {
      if (size.current.w <= 0 || size.current.h <= 0) return;
      go(fitView(), animate);
    },
    [fitView, go]
  );
  const relayout = useCallback(
    (data) => {
      const { cands: cs, layout: cur } = latest.current;
      const { w, h } = size.current;
      const next = chooseLayout(cs, { w, h });
      if (!data && next.mode === cur.mode && next.width === cur.width && next.height === cur.height) {
        if (!touched.current && !followRef.current) doFit(false);
        return;
      }
      setPicked({ layout: next, w, h });
      if (followRef.current) setViewport((old) => old.w === w && old.h === h ? old : { w, h });
    },
    [doFit]
  );
  const layoutRaf = useRef(0);
  const settleTimer = useRef(void 0);
  const syncViewport = useCallback(() => {
    const { w, h } = size.current;
    setViewport((old) => old.w === w && old.h === h ? old : { w, h });
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
        miniRef.current?.setView(view.current, size.current);
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
  const prevLayout = useRef(null);
  const fitted = useRef(false);
  const relayoutTimer = useRef(void 0);
  useIsoLayoutEffect(() => {
    const prev = prevLayout.current;
    prevLayout.current = layout;
    if (picked.w <= 0 || picked.h <= 0) return;
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
      vp.dataset.relayout = "true";
      clearTimeout(relayoutTimer.current);
      relayoutTimer.current = setTimeout(() => {
        delete vp.dataset.relayout;
      }, 500);
    }
    stop();
    if (!touched.current && !followRef.current) doFit(true);
  }, [layout, picked.w, picked.h, doFit, stop]);
  useEffect(() => () => clearTimeout(relayoutTimer.current), []);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const zoomBy = useCallback(
    (factor, animate) => {
      markMoved();
      const base = target.current ?? view.current;
      const { w, h } = size.current;
      go(zoomAround(base, base.k * factor, w / 2, h / 2), animate);
    },
    [go, markMoved]
  );
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e) => {
      if (e.target?.closest("[data-canvas-ui]")) return;
      e.preventDefault();
      stop();
      markMoved();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.current.h : 1;
      const v = view.current;
      if (e.ctrlKey) {
        const r = vp.getBoundingClientRect();
        apply(zoomAround(v, v.k * Math.exp(-e.deltaY * unit * 15e-4), e.clientX - r.left, e.clientY - r.top));
      } else {
        apply({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit });
      }
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [apply, stop, markMoved]);
  const pointers = useRef(/* @__PURE__ */ new Map());
  const gesture = useRef({
    mode: "none",
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    pinchDist: 1,
    pinchMid: { x: 0, y: 0 },
    pinchView: { x: 0, y: 0, k: 1 }
  });
  const dragged = useRef(false);
  const lastTap = useRef(null);
  const lastDouble = useRef(0);
  const local = (e) => {
    const r = viewportRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const doubleAt = (el, p) => {
    if (el.closest("[data-canvas-ui]") || el.closest(".nish-canvas-slot")) return;
    const { w, h } = size.current;
    const head = el.closest(".nish-canvas-head");
    if (head) {
      const box = latest.current.layout.groups[head.dataset.canvasId ?? ""];
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
  const onDoubleClick = (e) => {
    if (performance.now() - lastDouble.current < 600) return;
    doubleAt(e.target, local(e));
  };
  const startPinch = () => {
    const pts = [...pointers.current.values()];
    const [a, b] = pts;
    const g = gesture.current;
    g.mode = "pinch";
    g.pinchDist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
    g.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    g.pinchView = { ...view.current };
    dragged.current = true;
  };
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("[data-canvas-ui]")) return;
    stop();
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const vp = viewportRef.current;
    const g = gesture.current;
    if (pointers.current.size === 1) {
      dragged.current = false;
      g.mode = "pending";
      g.startX = g.lastX = p.x;
      g.startY = g.lastY = p.y;
    } else if (pointers.current.size === 2) {
      for (const id of pointers.current.keys()) {
        try {
          vp.setPointerCapture(id);
        } catch {
        }
      }
      markMoved();
      startPinch();
    }
  };
  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const s = g.pinchView;
      const k = clampK(s.k * (dist / g.pinchDist));
      const wx = (g.pinchMid.x - s.x) / s.k;
      const wy = (g.pinchMid.y - s.y) / s.k;
      apply({ k, x: mid.x - wx * k, y: mid.y - wy * k });
      return;
    }
    if (g.mode === "pending") {
      if (Math.hypot(p.x - g.startX, p.y - g.startY) < DRAG_PX) return;
      stop();
      g.mode = "pan";
      dragged.current = true;
      markMoved();
      setHoverId(null);
      try {
        viewportRef.current.setPointerCapture(e.pointerId);
      } catch {
      }
      viewportRef.current.dataset.dragging = "true";
    }
    if (g.mode === "pan") {
      const v = view.current;
      apply({ ...v, x: v.x + (p.x - g.lastX), y: v.y + (p.y - g.lastY) });
      g.lastX = p.x;
      g.lastY = p.y;
    }
  };
  const endPointer = (e) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const vp = viewportRef.current;
    try {
      vp.releasePointerCapture(e.pointerId);
    } catch {
    }
    const g = gesture.current;
    if (pointers.current.size === 1 && g.mode === "pinch") {
      const [rest2] = [...pointers.current.values()];
      g.mode = "pan";
      g.lastX = rest2.x;
      g.lastY = rest2.y;
    } else if (pointers.current.size === 0) {
      if (g.mode === "pending" && e.pointerType === "touch" && e.type === "pointerup") {
        const p = local(e);
        const now = performance.now();
        const el = e.target.closest("[data-canvas-id]") ?? e.target;
        const lt = lastTap.current;
        if (lt && now - lt.t <= DOUBLE_MS && lt.el === el && Math.hypot(p.x - lt.x, p.y - lt.y) <= DOUBLE_PX) {
          lastTap.current = null;
          lastDouble.current = now;
          doubleAt(e.target, p);
        } else {
          lastTap.current = { t: now, x: p.x, y: p.y, el };
        }
      }
      g.mode = "none";
      delete vp.dataset.dragging;
      setTimeout(() => {
        dragged.current = false;
      }, 0);
    }
  };
  const onClickCapture = (e) => {
    if (dragged.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  const onPointerOver = (e) => {
    if (e.pointerType === "touch" || gesture.current.mode === "pan" || gesture.current.mode === "pinch") return;
    if (typeof window.matchMedia === "function" && !window.matchMedia("(hover: hover)").matches) return;
    const id = e.target.closest("[data-canvas-id]")?.getAttribute("data-canvas-id") ?? null;
    setHoverId((old) => old === id ? old : id);
  };
  const onPointerLeave = () => setHoverId(null);
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
    if (w < PHONE_MAX_W) next.y = h * 0.45 / 2 - (box.y + box.h / 2) * k;
    touched.current = true;
    go(next, true);
  }, [selected, go]);
  const onScroll = () => {
    const vp = viewportRef.current;
    if (vp && (vp.scrollLeft !== 0 || vp.scrollTop !== 0)) {
      vp.scrollLeft = 0;
      vp.scrollTop = 0;
    }
  };
  const onFocusCapture = (e) => {
    const vp = viewportRef.current;
    const el = e.target;
    if (!vp || el === vp) return;
    if (pointers.current.size > 0 || !el.matches(":focus-visible")) return;
    const id = el.closest("[data-canvas-id]")?.dataset.canvasId;
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
  const onKeyDown = (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.target.closest("[data-canvas-ui]")) return;
    const v = view.current;
    switch (e.key) {
      case "ArrowLeft":
        stop();
        markMoved();
        apply({ ...v, x: v.x + KEY_PAN });
        break;
      case "ArrowRight":
        stop();
        markMoved();
        apply({ ...v, x: v.x - KEY_PAN });
        break;
      case "ArrowUp":
        stop();
        markMoved();
        apply({ ...v, y: v.y + KEY_PAN });
        break;
      case "ArrowDown":
        stop();
        markMoved();
        apply({ ...v, y: v.y - KEY_PAN });
        break;
      case "+":
      case "=":
        zoomBy(ZOOM_STEP, true);
        break;
      case "-":
      case "_":
        zoomBy(1 / ZOOM_STEP, true);
        break;
      case "0":
        touched.current = false;
        doFit(true);
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const columnIndex = useMemo(() => {
    const order = [...new Set(groups.map((g) => g.column))].sort((a, b) => a - b);
    return new Map(order.map((c, i) => [c, i]));
  }, [sig]);
  const lookup = useMemo(() => {
    const nodes = /* @__PURE__ */ new Map();
    const grps = /* @__PURE__ */ new Map();
    for (const g of groups) {
      grps.set(g.id, g);
      for (const n of g.nodes) nodes.set(n.id, { group: g, node: n });
    }
    return { nodes, grps };
  }, [groups]);
  const headerViews = useMemo(
    () => layout.headers.flatMap((h) => {
      const text = layout.mode === "bands" ? bands?.[h.index] ?? columns?.[h.index] : columns?.[h.index];
      return text ? [{ key: `${layout.mode}:${h.index}`, x: h.x, y: h.y, text }] : [];
    }),
    [layout, bands, columns]
  );
  const routes = useMemo(() => routeEdges(layout, groups, visibleEdges), [layout, visSig]);
  const { edgeViews, ports } = useMemo(() => {
    const hueOf = (id) => {
      const n = lookup.nodes.get(id);
      if (n) return { hue: n.group.hue, active: !!n.node.active };
      const g = lookup.grps.get(id);
      if (g) return { hue: g.hue, active: g.nodes.some((x) => x.active) };
      return void 0;
    };
    const views = visibleEdges.flatMap((edge) => {
      const route = routes[edge.id];
      const to = hueOf(edge.to);
      if (!route || !to) return [];
      const line = edge.dashed ? "dashed" : (edge.kind ? lineOf.get(edge.kind) : void 0) ?? "solid";
      return [
        {
          edge,
          route,
          line,
          mid: labelPoint(route.points),
          hue: to.hue,
          active: to.active
        }
      ];
    });
    views.sort((a, b) => Number(a.active) - Number(b.active));
    const dots = /* @__PURE__ */ new Map();
    for (const v of views) {
      const p = v.route.points[0];
      const key = `${p[0]}|${p[1]}`;
      const old = dots.get(key);
      if (!old || v.active && !old.active) dots.set(key, { x: p[0], y: p[1], hue: v.hue, active: v.active });
    }
    return { edgeViews: views, ports: [...dots.entries()] };
  }, [visibleEdges, routes, lookup, lineOf]);
  const focus = useMemo(() => {
    const id = hoverId ?? selected;
    if (!id) return null;
    const node = lookup.nodes.get(id);
    const grp = node ? node.group : lookup.grps.get(id);
    if (!grp) return null;
    const mine = new Set(node ? [id] : [id, ...grp.nodes.map((n) => n.id)]);
    const related = /* @__PURE__ */ new Set([id, grp.id]);
    if (!node) for (const n of grp.nodes) related.add(n.id);
    const addEnd = (eid) => {
      related.add(eid);
      const n = lookup.nodes.get(eid);
      if (n) related.add(n.group.id);
      const g = lookup.grps.get(eid);
      if (g) for (const x of g.nodes) related.add(x.id);
    };
    const hot = /* @__PURE__ */ new Set();
    for (const e of visibleEdges) {
      if (!mine.has(e.from) && !mine.has(e.to)) continue;
      hot.add(e.id);
      addEnd(e.from);
      addEnd(e.to);
    }
    return { related, hot };
  }, [hoverId, selected, lookup, visibleEdges]);
  const fly = useCallback((v) => go(v, true, FOLLOW_MS), [go]);
  const { step } = useFollow({
    on: followOn,
    groups,
    layout,
    size: viewport,
    fit: fitView,
    inset: TOP_INSET,
    fly
  });
  const canFollow = useMemo(() => groups.some((g) => g.nodes.some((n) => n.active !== void 0)), [groups]);
  const jumpTo = useCallback(
    (wx, wy) => {
      stop();
      markMoved();
      const { w, h } = size.current;
      const v = view.current;
      apply({ k: v.k, x: w / 2 - wx * v.k, y: h / 2 - wy * v.k });
    },
    [apply, stop, markMoved]
  );
  const layoutKey = `${layout.mode}:${layout.width}`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref: setViewportRef,
      role: "application",
      "aria-label": label,
      "aria-roledescription": "canvas",
      tabIndex: 0,
      className: cn("nish-canvas", className),
      style: { height, ...style },
      "data-grid": "both",
      "data-lod": "near",
      "data-focus": focus ? "true" : void 0,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerOver,
      onPointerLeave,
      onDoubleClick,
      onClickCapture,
      onKeyDown,
      onScroll,
      onFocusCapture,
      children: [
        /* @__PURE__ */ jsxs("div", { ref: worldRef, className: "nish-canvas-world", style: { width: layout.width, height: layout.height }, children: [
          headerViews.map((t) => /* @__PURE__ */ jsx("div", { className: "nish-canvas-coltitle", style: layout.mode === "bands" ? { left: t.x, top: t.y, lineHeight: 1, transform: "translateY(-100%)" } : { left: t.x, top: t.y }, children: t.text }, t.key)),
          /* @__PURE__ */ jsx("svg", { className: "nish-canvas-edges", width: layout.width, height: layout.height, "aria-hidden": "true", focusable: "false", children: edgeViews.map(({ edge, route, line, mid, hue, active }) => {
            const hot = focus?.hot.has(edge.id) ?? false;
            const end = route.points[route.points.length - 1];
            const [ex, ey] = end;
            const arrow = route.dir === "down" ? `M${ex} ${ey}L${ex - 3.5} ${ey - 8}L${ex + 3.5} ${ey - 8}Z` : `M${ex} ${ey}L${ex - 8} ${ey - 3.5}L${ex - 8} ${ey + 3.5}Z`;
            return /* @__PURE__ */ jsxs("g", { style: hueStyle(hue), className: "nish-canvas-edge", "data-active": active || void 0, "data-line": line, "data-hot": hot || void 0, children: [
              /* @__PURE__ */ jsx("path", { className: "nish-canvas-edge-line", d: route.d, fill: "none" }),
              /* @__PURE__ */ jsx("path", { className: "nish-canvas-arrow", d: arrow }),
              active ? /* @__PURE__ */ jsx("circle", { className: "nish-canvas-dot", r: "3.5", style: { offsetPath: `path("${route.d}")` } }) : null,
              edge.label && (labelsOn || hot) ? /* @__PURE__ */ jsx("text", { className: "nish-canvas-edge-label", x: mid.x, y: mid.y - 6, textAnchor: "middle", children: edge.label }) : null
            ] }, edge.id);
          }) }, `e${layoutKey}`),
          /* @__PURE__ */ jsx("svg", { className: "nish-canvas-ports", width: layout.width, height: layout.height, "aria-hidden": "true", focusable: "false", children: ports.map(([key, p]) => /* @__PURE__ */ jsx("circle", { className: "nish-canvas-port", cx: p.x, cy: p.y, r: 3, style: hueStyle(p.hue), "data-active": p.active || void 0 }, key)) }, `p${layoutKey}`),
          groups.map((g) => {
            const box = layout.groups[g.id];
            if (!box) return null;
            const live = g.nodes.some((n) => n.active);
            const delay = (columnIndex.get(g.column) ?? 0) * 80;
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "nish-canvas-group",
                  style: {
                    ...hueStyle(g.hue),
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    "--nish-canvas-delay": `${delay}ms`
                  },
                  "data-live": live || void 0,
                  "data-selected": selected === g.id || void 0,
                  "data-related": focus?.related.has(g.id) || void 0,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "nish-canvas-band", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "nish-canvas-head", "data-canvas-id": g.id, "aria-pressed": selected === g.id, onClick: () => onSelect?.(g.id, "group"), children: [
                      /* @__PURE__ */ jsxs("span", { className: "nish-canvas-headtext", children: [
                        /* @__PURE__ */ jsx("span", { className: "nish-canvas-title", children: g.title }),
                        g.subtitle ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-subtitle", children: g.subtitle }) : null
                      ] }),
                      g.badge ? /* @__PURE__ */ jsx("span", { className: "nish-canvas-badge", children: g.badge }) : null
                    ] })
                  ]
                }
              ),
              g.nodes.map((n) => {
                const nb = layout.nodes[n.id];
                if (!nb) return null;
                return /* @__PURE__ */ jsx(
                  NodeView,
                  {
                    node: n,
                    groupTitle: g.title,
                    hue: g.hue,
                    box: nb,
                    selected: selected === n.id,
                    dim: focus ? !focus.related.has(n.id) : false,
                    delay,
                    onSelect
                  },
                  n.id
                );
              })
            ] }, g.id);
          })
        ] }),
        edgeViews.length > 0 ? /* @__PURE__ */ jsx("ul", { style: VISUALLY_HIDDEN, children: edgeViews.map(({ edge }) => {
          const name = (id) => lookup.nodes.get(id)?.node.label ?? lookup.grps.get(id)?.title ?? id;
          return /* @__PURE__ */ jsxs("li", { children: [
            name(edge.from),
            " ",
            "\u2192",
            " ",
            name(edge.to),
            edge.label ? ` (${edge.label})` : ""
          ] }, edge.id);
        }) }) : null,
        /* @__PURE__ */ jsx(EdgeLegend, { kinds: kindList, hidden: hiddenKinds, onToggle: toggleKind, labels }),
        minimap ? /* @__PURE__ */ jsx(Minimap, { layout, groups, handleRef: miniRef, onJump: jumpTo }) : null,
        /* @__PURE__ */ jsx(FollowCaption, { step, labels }),
        /* @__PURE__ */ jsxs("div", { "data-canvas-ui": true, className: "nish-canvas-controls", children: [
          /* @__PURE__ */ jsx("span", { ref: zoomLabelRef, className: "nish-canvas-zoom", "aria-hidden": "true", children: "100%" }),
          /* @__PURE__ */ jsx(IconButton, { label: strings.zoomOut, variant: "ghost", className: "size-11", onClick: () => zoomBy(1 / ZOOM_STEP, true), children: /* @__PURE__ */ jsx(MinusIcon, {}) }),
          /* @__PURE__ */ jsx(IconButton, { label: strings.zoomIn, variant: "ghost", className: "size-11", onClick: () => zoomBy(ZOOM_STEP, true), children: /* @__PURE__ */ jsx(PlusIcon, {}) }),
          /* @__PURE__ */ jsx(
            IconButton,
            {
              label: strings.fitToScreen,
              variant: "ghost",
              className: "size-11",
              onClick: () => {
                touched.current = false;
                doFit(true);
              },
              children: /* @__PURE__ */ jsx(FitIcon, {})
            }
          ),
          canFollow ? /* @__PURE__ */ jsx(IconButton, { label: strings.followActivity, variant: "ghost", className: "size-11", active: followOn, "aria-pressed": followOn, onClick: () => setFollow(!followOn), children: /* @__PURE__ */ jsx(FollowIcon, {}) }) : null
        ] })
      ]
    }
  );
}
export {
  SystemCanvas
};
