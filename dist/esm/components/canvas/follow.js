"use client";

// src/components/canvas/follow.ts
import { useEffect, useRef, useState } from "react";
import { centerOn, clampK } from "./view.js";
var CYCLE_MS = 6e3;
var BBOX_PAD = 80;
var VIEW_PAD = 96;
var PHONE_W = 600;
var PHONE_TOP = 0.45;
function followTargets(groups, layout) {
  const out = [];
  for (const g of groups) {
    for (const n of g.nodes) {
      const box = layout.nodes[n.id];
      if (!n.active || !box) continue;
      out.push({ id: n.id, label: n.label, group: g.title, note: n.note, box, groupBox: layout.groups[g.id], at: n.activeAt ?? 0 });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}
function place(w, h, k, box, groupBox, top = 0) {
  const v = centerOn(w, h, k, box);
  if (w >= PHONE_W) return v;
  const y = Math.max(h * PHONE_TOP / 2, top + box.h * k / 2) - (box.y + box.h / 2) * k;
  if (groupBox && groupBox.w * k <= w - 24) return { ...v, x: w / 2 - (groupBox.x + groupBox.w / 2) * k, y };
  return { ...v, y };
}
function followStep(targets, i, w, h, fit, top = 0) {
  if (targets.length === 0) return { mode: "idle", view: fit, targets: [] };
  const phone = w < PHONE_W;
  const single = phone ? 0.8 : 1;
  if (targets.length === 1) {
    return { mode: "all", targets, view: place(w, h, single, targets[0].box, targets[0].groupBox, top) };
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
  const bbox = { x: x0 - BBOX_PAD, y: y0 - BBOX_PAD, w: x1 - x0 + 2 * BBOX_PAD, h: y1 - y0 + 2 * BBOX_PAD };
  const kAll = Math.min((w - VIEW_PAD) / bbox.w, (h - VIEW_PAD) / bbox.h, 1.1);
  if (kAll >= (phone ? 0.55 : 0.75)) {
    return { mode: "all", targets, view: place(w, h, clampK(kAll), bbox, void 0, top) };
  }
  const target = targets[(i % targets.length + targets.length) % targets.length];
  return { mode: "one", targets: [target], view: place(w, h, single, target.box, target.groupBox, top) };
}
var followSignature = (targets) => targets.map((t) => t.id).sort().join("|");
var captionKey = (targets) => targets.map((t) => `${t.id}:${t.label}:${t.group}:${t.note ?? ""}`).join("|");
function useFollow(o) {
  const { on, groups, layout, size } = o;
  const latest = useRef(o);
  useEffect(() => {
    latest.current = o;
  });
  const index = useRef(0);
  const visiting = useRef(null);
  const [step, setStep] = useState(null);
  const targets = on ? followTargets(groups, layout) : [];
  const sig = followSignature(targets);
  const caption = captionKey(targets);
  const indexKey = useRef("");
  useEffect(() => {
    if (!on) {
      indexKey.current = "";
      return;
    }
    const key = sig;
    if (indexKey.current !== key) {
      indexKey.current = key;
      index.current = 0;
      visiting.current = null;
    }
    let timer;
    const run = (advance) => {
      const cur = latest.current;
      const ts = followTargets(cur.groups, cur.layout);
      const at = visiting.current ? ts.findIndex((t) => t.id === visiting.current) : -1;
      index.current = at < 0 ? 0 : advance ? at + 1 : at;
      const next = followStep(ts, index.current, cur.size.w, cur.size.h, cur.fit(), cur.inset ?? 0);
      visiting.current = next.mode === "one" ? next.targets[0]?.id ?? null : null;
      setStep(next);
      cur.fly(next.view);
      if (next.mode === "one" && timer === void 0) timer = setInterval(() => run(true), CYCLE_MS);
      if (next.mode !== "one" && timer !== void 0) {
        clearInterval(timer);
        timer = void 0;
      }
    };
    run(false);
    return () => {
      if (timer !== void 0) clearInterval(timer);
    };
  }, [on, sig, layout, size.w, size.h]);
  useEffect(() => {
    if (!on) return;
    const cur = latest.current;
    const ts = followTargets(cur.groups, cur.layout);
    setStep((prev) => {
      if (!prev || prev.mode === "idle") return prev;
      const fresh = prev.mode === "one" ? ts.filter((t) => t.id === visiting.current) : ts;
      if (fresh.length === 0 || captionKey(prev.targets) === captionKey(fresh)) return prev;
      return { ...prev, targets: fresh };
    });
  }, [on, caption]);
  return { step: on ? step : null };
}
export {
  followSignature,
  followStep,
  followTargets,
  useFollow
};
