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
      out.push({ id: n.id, label: n.label, group: g.title, note: n.note, box, at: n.activeAt ?? 0 });
    }
  }
  // Array.prototype.sort is stable, so equal times keep layout order.
  return out.sort((a, b) => b.at - a.at);
}

/** `view` for centering a world rect at zoom `k`; on a phone the center sits in the top 45% of the viewport (the drawer may cover the rest). */
function place(w: number, h: number, k: number, box: Box): View {
  const v = centerOn(w, h, k, box);
  return w < PHONE_W ? { ...v, y: (h * PHONE_TOP) / 2 - (box.y + box.h / 2) * k } : v;
}

/** The view for step `i` (0-based) of following `targets` in a w x h viewport. */
export function followStep(targets: FollowTarget[], i: number, w: number, h: number, fit: View): FollowStep {
  if (targets.length === 0) return { mode: 'idle', view: fit, targets: [] };
  const phone = w < PHONE_W;
  const single = phone ? 0.8 : 1;
  if (targets.length === 1) {
    return { mode: 'all', targets, view: place(w, h, single, targets[0]!.box) };
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
    return { mode: 'all', targets, view: place(w, h, clampK(kAll), bbox) };
  }
  const target = targets[((i % targets.length) + targets.length) % targets.length]!;
  return { mode: 'one', targets: [target], view: place(w, h, single, target.box) };
}

const signature = (targets: FollowTarget[]) => targets.map((t) => t.id).join('|');
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

  useEffect(() => {
    if (!on) return;
    index.current = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const run = (advance: boolean) => {
      const cur = latest.current;
      if (advance) index.current += 1;
      const next = followStep(followTargets(cur.groups, cur.layout), index.current, cur.size.w, cur.size.h, cur.fit());
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
    const next = followStep(followTargets(cur.groups, cur.layout), index.current, cur.size.w, cur.size.h, cur.fit());
    setStep((prev) => (!prev || captionKey(prev.targets) === captionKey(next.targets) ? prev : { ...prev, targets: next.targets }));
  }, [on, caption]);

  return { step: on ? step : null };
}
