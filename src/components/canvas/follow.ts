import { useEffect, useRef, useState } from 'react';
import type { CanvasGroup } from './types';
import type { CanvasLayout } from './layout';
import type { Box } from './route';
import { centerOn, clampK, type View } from './view';

export interface FollowTarget {
  id: string;
  label: string;
  group: string;
  note?: string;
  box: Box;
  /** The node's group box; on a phone the camera centers x on it so the group is not cut off. */
  groupBox?: Box;
  at: number;
}

export interface FollowStep {
  /** 'all': every active node is in view (`targets`); 'one': visiting a single node (`targets` holds just that one); 'idle': nothing active. */
  view: View;
  targets: FollowTarget[];
  mode: 'all' | 'one' | 'idle';
}

const CYCLE_MS = 6000;
const BBOX_PAD = 80;
const VIEW_PAD = 96; // 2 x FIT_PAD
const PHONE_W = 600;
const PHONE_TOP = 0.45;

/** Active nodes newest first (activeAt desc, missing = 0; ties keep layout order: group order, then node order). */
export function followTargets(groups: CanvasGroup[], layout: CanvasLayout): FollowTarget[] {
  const out: FollowTarget[] = [];
  for (const g of groups) {
    for (const n of g.nodes) {
      const box = layout.nodes[n.id];
      if (!n.active || !box) continue;
      out.push({ id: n.id, label: n.label, group: g.title, note: n.note, box, groupBox: layout.groups[g.id], at: n.activeAt ?? 0 });
    }
  }
  // Array.prototype.sort is stable, so equal times keep layout order.
  return out.sort((a, b) => b.at - a.at);
}

/** `view` for centering a world rect at zoom `k`; on a phone the center sits in the top 45% of the viewport (the drawer may cover the rest). */
function place(w: number, h: number, k: number, box: Box, groupBox?: Box, top = 0): View {
  const v = centerOn(w, h, k, box);
  if (w >= PHONE_W) return v;
  // Never let the box head slide under the overlay row (`top` px): center at max(22.5% of h, top + half the box).
  const y = Math.max((h * PHONE_TOP) / 2, top + (box.h * k) / 2) - (box.y + box.h / 2) * k;
  // Center x on the node's group when the group fits the width, so its title and left cards stay on screen.
  if (groupBox && groupBox.w * k <= w - 24) return { ...v, x: w / 2 - (groupBox.x + groupBox.w / 2) * k, y };
  return { ...v, y };
}

/** The view for step `i` (0-based) of following `targets` in a w x h viewport. */
export function followStep(targets: FollowTarget[], i: number, w: number, h: number, fit: View, top = 0): FollowStep {
  if (targets.length === 0) return { mode: 'idle', view: fit, targets: [] };
  const phone = w < PHONE_W;
  const single = phone ? 0.8 : 1;
  if (targets.length === 1) {
    return { mode: 'all', targets, view: place(w, h, single, targets[0]!.box, targets[0]!.groupBox, top) };
  }
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const t of targets) {
    x0 = Math.min(x0, t.box.x);
    y0 = Math.min(y0, t.box.y);
    x1 = Math.max(x1, t.box.x + t.box.w);
    y1 = Math.max(y1, t.box.y + t.box.h);
  }
  const bbox: Box = { x: x0 - BBOX_PAD, y: y0 - BBOX_PAD, w: x1 - x0 + 2 * BBOX_PAD, h: y1 - y0 + 2 * BBOX_PAD };
  const kAll = Math.min((w - VIEW_PAD) / bbox.w, (h - VIEW_PAD) / bbox.h, 1.1);
  if (kAll >= (phone ? 0.55 : 0.75)) {
    return { mode: 'all', targets, view: place(w, h, clampK(kAll), bbox, undefined, top) };
  }
  const target = targets[((i % targets.length) + targets.length) % targets.length]!;
  return { mode: 'one', targets: [target], view: place(w, h, single, target.box, target.groupBox, top) };
}

// Sorted, so a reorder by activeAt alone (same set of ids) does not count as a change and re-fly.
const signature = (targets: FollowTarget[]) => targets.map((t) => t.id).sort().join('|');
const captionKey = (targets: FollowTarget[]) => targets.map((t) => `${t.id}:${t.label}:${t.group}:${t.note ?? ''}`).join('|');

/** While `on`, flies the camera to the active nodes: on switch-on, when the set of active ids
 *  changes, when the layout or viewport changes, and every 6 s while visiting one at a time.
 *  Data polls that leave the active ids alone do not fly. */
export function useFollow(o: {
  on: boolean;
  groups: CanvasGroup[];
  layout: CanvasLayout;
  size: { w: number; h: number };
  fit: () => View;
  /** Height in px of the overlay row (legend) a phone view keeps clear. */
  inset?: number;
  fly: (v: View) => void;
}): { step: FollowStep | null } {
  const { on, groups, layout, size } = o;
  const latest = useRef(o);
  useEffect(() => {
    latest.current = o;
  });
  const index = useRef(0);
  const [step, setStep] = useState<FollowStep | null>(null);

  const targets = on ? followTargets(groups, layout) : [];
  const sig = signature(targets);
  const caption = captionKey(targets);

  // The visiting index restarts only when follow turns on or the active ids change, not on a resize or relayout.
  const indexKey = useRef('');
  useEffect(() => {
    if (!on) {
      indexKey.current = '';
      return;
    }
    const key = sig;
    if (indexKey.current !== key) {
      indexKey.current = key;
      index.current = 0;
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    const run = (advance: boolean) => {
      const cur = latest.current;
      if (advance) index.current += 1;
      const next = followStep(followTargets(cur.groups, cur.layout), index.current, cur.size.w, cur.size.h, cur.fit(), cur.inset ?? 0);
      setStep(next);
      cur.fly(next.view);
      if (next.mode === 'one' && timer === undefined) timer = setInterval(() => run(true), CYCLE_MS);
      if (next.mode !== 'one' && timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    run(false);
    return () => {
      if (timer !== undefined) clearInterval(timer);
    };
  }, [on, sig, layout, size.w, size.h]);

  // Keep the caption's text fresh when a poll changes a note without changing which ids are active.
  useEffect(() => {
    if (!on) return;
    const cur = latest.current;
    const next = followStep(followTargets(cur.groups, cur.layout), index.current, cur.size.w, cur.size.h, cur.fit(), cur.inset ?? 0);
    setStep((prev) => (!prev || captionKey(prev.targets) === captionKey(next.targets) ? prev : { ...prev, targets: next.targets }));
  }, [on, caption]);

  return { step: on ? step : null };
}
