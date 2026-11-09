"use client";

// src/components/flow.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { ago } from "../format.js";
import { useIsoLayoutEffect } from "./client.js";
import { useMediaQuery, useNow } from "./hooks.js";
import { Tooltip } from "./tooltip.js";
import { Badge } from "./primitives.js";
import { useNishContext, useStrings } from "./provider.js";
import { PROGRESS_STRINGS, FLOW_STRINGS } from "./strings.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
var warned = /* @__PURE__ */ new Set();
function warnDev(message) {
  if (warned.has(message)) return;
  try {
    if (process.env.NODE_ENV !== "production") {
      warned.add(message);
      console.warn(message);
    }
  } catch {
  }
}
function assignRef(ref, el) {
  if (typeof ref === "function") ref(el);
  else if (ref) ref.current = el;
}
function useMergedRef(a, b) {
  return useCallback(
    (el) => {
      assignRef(a, el);
      assignRef(b, el);
    },
    [a, b]
  );
}
function useTransitionFx(value, ref, pick) {
  const prev = useRef(value);
  useIsoLayoutEffect(() => {
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("data-fx");
    const fx = pick(from, value);
    if (!fx) return;
    void el.offsetWidth;
    el.setAttribute("data-fx", fx);
    const timer = setTimeout(() => el.removeAttribute("data-fx"), 700);
    return () => {
      clearTimeout(timer);
      el.removeAttribute("data-fx");
    };
  }, [value, ref, pick]);
}
function useFreshIds(ids, skipFirst) {
  const key = ids.join("\n");
  const [seen, setSeen] = useState(() => ({
    key,
    known: new Set(ids),
    fresh: new Set(skipFirst ? [] : ids)
  }));
  if (seen.key === key) return seen.fresh;
  const fresh = new Set([...seen.fresh].filter((id) => ids.includes(id)));
  for (const id of ids) if (!seen.known.has(id)) fresh.add(id);
  setSeen({ key, known: new Set(ids), fresh });
  return fresh;
}
function CheckSvg({ size, className }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("nish-flow-check", className),
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 3,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: /* @__PURE__ */ jsx("path", { d: "M5 12.5l4.5 4.5L19 7.5", pathLength: 1 })
    }
  );
}
function CrossSvg({ size }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 3,
      strokeLinecap: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: /* @__PURE__ */ jsx("path", { d: "M6.5 6.5l11 11M17.5 6.5l-11 11" })
    }
  );
}
var NODE_STATUS = {
  pending: "border-2 border-th-line text-th-hi3",
  active: "border-2 border-th-accent text-th-hi",
  done: "bg-th-ok-fill text-th-on-ok forced-colors:border-2 forced-colors:border-[color:Highlight]",
  failed: "bg-th-loss-fill text-th-on-loss forced-colors:border-2 forced-colors:border-dashed forced-colors:border-[color:CanvasText]"
};
function pickStepFx(from, to) {
  if (to === "done") return "done";
  if (to === "failed") return "failed";
  return from === to ? null : null;
}
function withFullText(text, label) {
  if (typeof text !== "string") return label;
  return /* @__PURE__ */ jsx(Tooltip, { tip: text, className: "nish-flow-label-tip max-w-full min-w-0", children: label });
}
function StepRow({
  step,
  index,
  last,
  sweeping,
  statusWord
}) {
  const nodeRef = useRef(null);
  useTransitionFx(step.status, nodeRef, pickStepFx);
  const { status } = step;
  return /* @__PURE__ */ jsxs(
    "li",
    {
      className: "nish-flow-step nish-flow-rise",
      "data-status": status,
      "aria-current": status === "active" ? "step" : void 0,
      style: { "--nish-flow-delay": `${Math.min(index * 40, 400)}ms` },
      children: [
        /* @__PURE__ */ jsxs(
          "span",
          {
            ref: nodeRef,
            className: cn(
              "nish-flow-node grid size-7 place-items-center rounded-full text-xs font-medium tabular-nums",
              NODE_STATUS[status]
            ),
            "aria-hidden": "true",
            children: [
              status === "done" ? /* @__PURE__ */ jsx(CheckSvg, { size: 16 }) : status === "failed" ? /* @__PURE__ */ jsx(CrossSvg, { size: 14 }) : index + 1,
              status === "active" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("svg", { className: "nish-flow-arc text-th-accent", viewBox: "0 0 28 28", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ jsx("circle", { cx: "14", cy: "14", r: "13", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeDasharray: "20 62" }) }),
                /* @__PURE__ */ jsx("span", { className: "nish-flow-ripple" })
              ] }) : null
            ]
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "nish-flow-text", children: [
          withFullText(
            step.label,
            /* @__PURE__ */ jsxs(
              "span",
              {
                className: cn(
                  "nish-flow-label text-sm",
                  status === "active" ? "font-medium text-th-hi" : status === "failed" ? "text-th-loss" : "text-th-hi2"
                ),
                children: [
                  step.label,
                  statusWord ? /* @__PURE__ */ jsx("span", { className: "sr-only", children: statusWord }) : null
                ]
              }
            )
          ),
          step.meta != null ? /* @__PURE__ */ jsx("span", { className: "nish-flow-meta text-xs text-th-hi3", children: step.meta }) : null
        ] }),
        last ? null : /* @__PURE__ */ jsxs(
          "span",
          {
            className: "nish-flow-conn",
            "data-on": status === "done",
            "aria-hidden": "true",
            style: sweeping ? { "--nish-flow-delay": `${index * 60}ms` } : void 0,
            children: [
              /* @__PURE__ */ jsx("span", { className: "nish-flow-fill" }),
              /* @__PURE__ */ jsx("span", { className: "nish-flow-shimmer" }),
              /* @__PURE__ */ jsx("span", { className: "nish-flow-sweep" })
            ]
          }
        )
      ]
    }
  );
}
function FlowSteps({ steps, orientation = "auto", label, statusLabels, className, ref, ...rest }) {
  const s = useStrings(PROGRESS_STRINGS, FLOW_STRINGS);
  const allDone = steps.length > 0 && steps.every((s2) => s2.status === "done");
  const prevAll = useRef(null);
  const [sweeping, setSweeping] = useState(false);
  useIsoLayoutEffect(() => {
    const was = prevAll.current;
    prevAll.current = allDone;
    if (!allDone) {
      setSweeping(false);
      return;
    }
    if (was === false && steps.length > 1) {
      setSweeping(true);
      const timer = setTimeout(() => setSweeping(false), steps.length * 60 + 1e3);
      return () => clearTimeout(timer);
    }
  }, [allDone]);
  const orient = orientation === "auto" && steps.length > 8 ? "vertical" : orientation;
  return /* @__PURE__ */ jsx("div", { ...rest, ref, className: cn("nish-flow-steps-box", className), children: /* @__PURE__ */ jsx("ol", { className: "nish-flow-steps", "data-orient": orient, "data-sweep": sweeping || void 0, "aria-label": label ?? s.progress, children: steps.map((step, i) => /* @__PURE__ */ jsx(
    StepRow,
    {
      step,
      index: i,
      last: i === steps.length - 1,
      sweeping,
      statusWord: step.status === "done" || step.status === "failed" ? statusLabels?.[step.status] ?? (step.status === "done" ? s.stepDone : s.stepFailed) : void 0
    },
    step.id
  )) }) });
}
function StepBar({ total, done, active = false, label, className, ref, ...rest }) {
  const s = useStrings(PROGRESS_STRINGS, FLOW_STRINGS);
  const t = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const d = Number.isFinite(done) ? Math.min(t, Math.max(0, Math.floor(done))) : 0;
  const props = {
    ...rest,
    ref,
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": t,
    "aria-valuenow": d,
    "aria-label": label ?? s.progress
  };
  if (t > 12) {
    return /* @__PURE__ */ jsxs("div", { ...props, className: cn("relative h-1.5 overflow-hidden rounded-full bg-th-line forced-colors:bg-[color:GrayText]", className), children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "h-full rounded-full bg-th-ok-fill motion-safe:transition-[width] motion-safe:duration-[400ms] forced-colors:bg-[color:Highlight]",
          style: { width: `${d / t * 100}%` }
        }
      ),
      active && d < t ? /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-y-0 rounded-full bg-th-accent motion-safe:animate-pulse forced-colors:bg-[color:Highlight]",
          style: { insetInlineStart: `${d / t * 100}%`, width: `max(6px, ${100 / t}%)` }
        }
      ) : null
    ] });
  }
  return /* @__PURE__ */ jsx("div", { ...props, className: cn("flex h-1.5 gap-[3px]", className), children: Array.from({ length: t }, (_, i) => /* @__PURE__ */ jsxs("div", { className: "relative h-full min-w-0 flex-1 overflow-hidden rounded-full bg-th-line forced-colors:bg-[color:GrayText]", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "absolute inset-0 origin-left rounded-full bg-th-ok-fill motion-safe:transition-transform motion-safe:duration-[400ms] rtl:origin-right forced-colors:bg-[color:Highlight]",
          i < d ? "scale-x-100" : "scale-x-0"
        )
      }
    ),
    i === d ? /* @__PURE__ */ jsx("div", { className: cn("absolute inset-0 rounded-full bg-th-accent forced-colors:bg-[color:Highlight]", active ? "motion-safe:animate-pulse" : "opacity-0") }) : null
  ] }, i)) });
}
function TickerText({ text, as = "span", className, ref, ...rest }) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState({ text, prev: null });
  let cur = state;
  if (state.text !== text) {
    cur = { text, prev: reduced ? null : state.text };
    setState(cur);
  }
  const animating = cur.prev !== null;
  useEffect(() => {
    if (!animating) return;
    const timer = setTimeout(() => setState((s) => s.prev === null ? s : { ...s, prev: null }), 300);
    return () => clearTimeout(timer);
  }, [animating, cur.text]);
  const Tag = as;
  return /* @__PURE__ */ jsxs(Tag, { ...rest, ref, className: cn("nish-flow-ticker grid min-w-0 overflow-hidden", className), title: cur.text, children: [
    cur.prev !== null ? /* @__PURE__ */ jsx("span", { className: "nish-flow-ticker-out", "aria-hidden": "true", children: cur.prev }, `prev:${cur.prev}`) : null,
    /* @__PURE__ */ jsx("span", { className: animating ? "nish-flow-ticker-in" : void 0, children: cur.text }, cur.text)
  ] });
}
var AGENT_STATE = {
  queued: "border-dashed border-th-line opacity-70",
  running: "border-th-accent",
  done: "border-th-ok-fill/40",
  failed: "border-th-loss-fill"
};
var MODEL_HUE = [
  ["opus", "violet"],
  ["sonnet", "sky"],
  ["haiku", "emerald"],
  ["fable", "amber"]
];
function modelFamily(model) {
  const m = model.toLowerCase();
  return MODEL_HUE.find(([name]) => m.includes(name));
}
function ModelBadge({ model }) {
  const family = modelFamily(model);
  return /* @__PURE__ */ jsx(Badge, { size: "xs", hue: family?.[1], className: "shrink-0", children: family ? family[0] : model });
}
function pickAgentFx(from, to) {
  if (from === to) return null;
  if (to === "done") return "done";
  if (to === "failed") return "failed";
  return null;
}
function AgentIcon({ state }) {
  if (state === "running") {
    return /* @__PURE__ */ jsx("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center text-th-accent", children: /* @__PURE__ */ jsxs("svg", { className: "nish-flow-agent-spin", width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx("circle", { cx: "8", cy: "8", r: "6", stroke: "currentColor", strokeOpacity: "0.25", strokeWidth: "2" }),
      /* @__PURE__ */ jsx("path", { d: "M8 2a6 6 0 0 1 6 6", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" })
    ] }) });
  }
  if (state === "done") {
    return /* @__PURE__ */ jsx("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center rounded-full bg-th-ok-fill text-th-on-ok", children: /* @__PURE__ */ jsx(CheckSvg, { size: 12 }) });
  }
  if (state === "failed") {
    return /* @__PURE__ */ jsx("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center rounded-full bg-th-loss-fill text-th-on-loss", children: /* @__PURE__ */ jsx(CrossSvg, { size: 11 }) });
  }
  return /* @__PURE__ */ jsx("span", { className: "nish-flow-agent-icon grid size-5 shrink-0 place-items-center", children: /* @__PURE__ */ jsx("span", { className: "size-4 rounded-full border-2 border-dashed border-th-ghost" }) });
}
function AgentNode({ label, state, model, activity, meta, onClick, stateLabels, className, ref: refProp, ...rest }) {
  const own = useRef(null);
  const ref = useMergedRef(own, refProp);
  useTransitionFx(state, own, pickAgentFx);
  const s = useStrings(FLOW_STRINGS);
  const stateWord = {
    queued: s.agentQueued,
    running: s.agentRunning,
    done: s.agentDone,
    failed: s.agentFailed
  };
  const aria = `${label}: ${stateLabels?.[state] ?? stateWord[state]}`;
  const classes = cn(
    "nish-flow-agent block min-h-16 w-full min-w-0 rounded-xl border bg-th-surface p-3 text-start",
    AGENT_STATE[state],
    onClick && "cursor-pointer transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent",
    className
  );
  const body = /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-start gap-2", children: [
      /* @__PURE__ */ jsx(AgentIcon, { state }),
      /* @__PURE__ */ jsx("span", { className: "line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-5 text-th-hi [overflow-wrap:anywhere]", children: label }),
      meta != null ? /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs leading-5 tabular-nums text-th-hi3", children: meta }) : null
    ] }),
    model || activity ? /* @__PURE__ */ jsxs("span", { className: "mt-1.5 flex min-w-0 items-center gap-2", children: [
      model ? /* @__PURE__ */ jsx(ModelBadge, { model }) : null,
      activity ? /* @__PURE__ */ jsx(TickerText, { as: "span", text: activity, className: "min-w-0 flex-1 text-xs text-th-hi3" }) : null
    ] }) : null
  ] });
  if (onClick) {
    return /* @__PURE__ */ jsx(
      "button",
      {
        ...rest,
        type: "button",
        ref,
        className: classes,
        "data-state": state,
        "aria-label": aria,
        onClick,
        children: body
      }
    );
  }
  return /* @__PURE__ */ jsx("article", { ...rest, ref, className: classes, "data-state": state, "aria-label": aria, children: body });
}
var OTHER_ID = "__nish-flow-other__";
function phaseState(agents) {
  if (agents.length === 0) return "waiting";
  if (agents.some((a) => a.state === "running")) return "active";
  if (agents.every((a) => a.state === "done" || a.state === "failed")) return "done";
  return "pending";
}
function PhaseConnector({ flowing }) {
  return /* @__PURE__ */ jsxs("svg", { className: "nish-flow-phase-conn", "data-flow": flowing, viewBox: "0 0 24 12", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("path", { className: "nish-flow-dashline", d: "M1 6h15", strokeDasharray: "3 3" }),
    /* @__PURE__ */ jsx("path", { d: "M16 2.5L20.5 6 16 9.5" })
  ] });
}
function WorkflowBoard({ phases, agents, label, otherLabel, waitingLabel, className, ref, ...rest }) {
  const s = useStrings(PROGRESS_STRINGS, FLOW_STRINGS);
  const otherTitle = otherLabel ?? s.other;
  const fresh = useFreshIds(
    agents.map((a) => a.id),
    false
  );
  const columns = useMemo(() => {
    const byId = /* @__PURE__ */ new Map();
    const byTitle = /* @__PURE__ */ new Map();
    for (const p of phases) {
      if (!byId.has(p.id)) byId.set(p.id, p);
      if (!byTitle.has(p.title)) byTitle.set(p.title, p);
    }
    const groups = /* @__PURE__ */ new Map();
    const other = [];
    for (const a of agents) {
      const phase = a.phase === null ? void 0 : byId.get(a.phase) ?? byTitle.get(a.phase);
      if (!phase) {
        other.push(a);
        continue;
      }
      const list = groups.get(phase.id);
      if (list) list.push(a);
      else groups.set(phase.id, [a]);
    }
    const cols = phases.map((phase) => {
      const list = groups.get(phase.id) ?? [];
      return { phase, agents: list, state: phaseState(list) };
    });
    const seen = /* @__PURE__ */ new Set();
    for (const c of cols) {
      if (seen.has(c.phase.id)) {
        c.agents = [];
        c.state = "waiting";
      }
      seen.add(c.phase.id);
    }
    if (other.length) cols.push({ phase: { id: OTHER_ID, title: otherTitle }, agents: other, state: phaseState(other) });
    return cols;
  }, [phases, agents, otherTitle]);
  return /* @__PURE__ */ jsx("section", { ...rest, ref, "aria-label": label ?? s.workflow, className: cn("nish-flow-board-box", className), children: /* @__PURE__ */ jsx("div", { className: "nish-flow-board", children: columns.map((col, ci) => {
    const { phase, state } = col;
    const finished = col.agents.filter((a) => a.state === "done" || a.state === "failed").length;
    const total = col.agents.length;
    const next = columns[ci + 1];
    const flowing = (state === "done" || state === "active") && next !== void 0 && (next.state === "waiting" || next.state === "pending" || next.state === "active");
    return /* @__PURE__ */ jsxs(
      "div",
      {
        role: "group",
        "aria-label": phase.title,
        "data-state": state,
        className: cn(
          "nish-flow-phase rounded-xl border bg-th-elevated/40 p-3",
          state === "active" ? "border-th-accent/50" : "border-th-line"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: cn("flex min-w-0 items-center gap-2", state === "waiting" && "opacity-60"), children: [
            state === "done" ? /* @__PURE__ */ jsx("span", { className: "grid size-4 shrink-0 place-items-center rounded-full bg-th-ok-fill text-th-on-ok", children: /* @__PURE__ */ jsx(CheckSvg, { size: 10 }) }) : null,
            /* @__PURE__ */ jsx("span", { className: cn("min-w-0 flex-1 truncate text-sm font-medium", state === "active" ? "text-th-accent" : "text-th-hi"), children: phase.title }),
            phase.model ? /* @__PURE__ */ jsx(ModelBadge, { model: phase.model }) : null,
            /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-xs tabular-nums text-th-hi3", children: [
              finished,
              "/",
              total
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: cn("mt-2 h-1 overflow-hidden rounded-full bg-th-line forced-colors:bg-[color:GrayText]", state === "waiting" && "opacity-60"),
              "aria-hidden": "true",
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "h-full rounded-full bg-th-ok-fill motion-safe:transition-[width] motion-safe:duration-500 forced-colors:bg-[color:Highlight]",
                  style: { width: total ? `${finished / total * 100}%` : "0%" }
                }
              )
            }
          ),
          phase.detail != null ? /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs text-th-hi3", children: phase.detail }) : null,
          /* @__PURE__ */ jsx("div", { className: "mt-3 flex min-w-0 flex-col gap-2", children: total === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-th-hi3", children: waitingLabel ?? s.waiting }) : col.agents.map((a, ai) => {
            const { id, phase: _phase, ...node } = a;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: fresh.has(id) ? "nish-flow-rise" : void 0,
                style: fresh.has(id) ? { "--nish-flow-delay": `${Math.min(ai * 60, 600)}ms` } : void 0,
                children: /* @__PURE__ */ jsx(AgentNode, { ...node })
              },
              id
            );
          }) }),
          next ? /* @__PURE__ */ jsx(PhaseConnector, { flowing }) : null
        ]
      },
      phase.id
    );
  }) }) });
}
var FEED_DOT = {
  neutral: "bg-th-ghost",
  accent: "bg-th-accent",
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill"
};
var FEED_DOT_FORCED = "forced-colors:bg-[color:CanvasText]";
function ActivityFeed({ items, max = 50, now, label, empty, className, ref, ...rest }) {
  const s = useStrings(PROGRESS_STRINGS, FLOW_STRINGS);
  const { locale } = useNishContext();
  const internalNow = useNow(15e3);
  const clock = now ?? internalNow;
  const shown = useMemo(() => [...items].sort((a, b) => b.at - a.at).slice(0, Math.max(0, max)), [items, max]);
  const fresh = useFreshIds(
    shown.map((i) => i.id),
    true
  );
  if (shown.length === 0) {
    return /* @__PURE__ */ jsx("div", { ...rest, ref, className: cn("text-sm text-th-hi3", className), children: empty ?? s.noActivity });
  }
  return /* @__PURE__ */ jsx("ol", { ...rest, ref, className: cn("nish-flow-feed", className), "aria-label": label ?? s.activity, children: shown.map((item) => /* @__PURE__ */ jsx("li", { className: "nish-flow-feed-item", "data-fresh": fresh.has(item.id) || void 0, "data-tone": item.tone ?? "neutral", children: /* @__PURE__ */ jsx("div", { className: "nish-flow-feed-inner", children: /* @__PURE__ */ jsxs("div", { className: "nish-flow-feed-row", children: [
    /* @__PURE__ */ jsx("span", { className: cn("nish-flow-feed-dot", FEED_DOT[item.tone ?? "neutral"], FEED_DOT_FORCED), "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("div", { className: "break-words text-sm text-th-hi2", children: item.text }),
      item.source != null ? /* @__PURE__ */ jsx("div", { className: "break-words text-xs text-th-hi3", children: item.source }) : null
    ] }),
    /* @__PURE__ */ jsx("span", { className: "pt-0.5 text-end text-xs tabular-nums text-th-hi3", children: ago(item.at, { now: clock, style: "short", locale }) })
  ] }) }) }, item.id)) });
}
var ENTER_MS = 400;
var MOVE_MS = 300;
var MAX_ANIMATED = 50;
function reconcile(prev, items, getKey, animate) {
  const prevMap = new Map(prev.map((e) => [e.key, e]));
  const seen = /* @__PURE__ */ new Set();
  const next = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      warnDev(`AnimatedList: duplicate key "${key}"; only the first item with it is shown.`);
      continue;
    }
    seen.add(key);
    const old = prevMap.get(key);
    const phase = !old ? animate ? "enter" : "idle" : old.phase === "exit" ? "idle" : old.phase;
    next.push({ key, item, phase: animate ? phase : "idle" });
  }
  if (!animate) return next;
  const exitAfter = /* @__PURE__ */ new Map();
  const leading = [];
  prev.forEach((e, i) => {
    if (seen.has(e.key)) return;
    const gone = e.phase === "exit" ? e : { ...e, phase: "exit" };
    if (i === 0) leading.push(gone);
    else exitAfter.set(prev[i - 1].key, gone);
  });
  if (leading.length === 0 && exitAfter.size === 0) return next;
  const out = [];
  const trail = (key) => {
    for (let gone = exitAfter.get(key); gone; gone = exitAfter.get(gone.key)) out.push(gone);
  };
  for (const e of leading) {
    out.push(e);
    trail(e.key);
  }
  for (const e of next) {
    out.push(e);
    trail(e.key);
  }
  return out;
}
function AnimatedList({
  items,
  getKey,
  children,
  exitMs = 420,
  as = "ul",
  className,
  itemClassName,
  ref,
  ...rest
}) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState(() => ({
    src: items,
    reduced,
    entries: reconcile([], items, getKey, false)
  }));
  let current = state;
  if (state.src !== items || state.reduced !== reduced) {
    current = { src: items, reduced, entries: reconcile(state.entries, items, getKey, !reduced) };
    setState(current);
  }
  const entries = current.entries;
  const els = useRef(/* @__PURE__ */ new Map());
  const rects = useRef(/* @__PURE__ */ new Map());
  const anims = useRef(/* @__PURE__ */ new Map());
  const lastKeys = useRef(null);
  const timers = useRef(/* @__PURE__ */ new Map());
  const itemRef = useCallback((el) => {
    const key = el?.getAttribute("data-nish-key");
    if (!el || key == null) return;
    els.current.set(key, el);
    return () => {
      if (els.current.get(key) === el) els.current.delete(key);
    };
  }, []);
  useEffect(() => {
    const wanted = /* @__PURE__ */ new Set();
    for (const e of entries) {
      if (e.phase === "idle") continue;
      const id = `${e.phase}:${e.key}`;
      wanted.add(id);
      if (timers.current.has(id)) continue;
      timers.current.set(
        id,
        setTimeout(
          () => {
            timers.current.delete(id);
            if (e.phase === "exit") {
              const fresh = /* @__PURE__ */ new Map();
              els.current.forEach((el, k) => fresh.set(k, { x: el.offsetLeft, y: el.offsetTop }));
              rects.current = fresh;
            }
            setState((s) => ({
              ...s,
              entries: e.phase === "exit" ? s.entries.filter((x) => !(x.key === e.key && x.phase === "exit")) : s.entries.map((x) => x.key === e.key && x.phase === "enter" ? { ...x, phase: "idle" } : x)
            }));
          },
          e.phase === "exit" ? exitMs : ENTER_MS
        )
      );
    }
    timers.current.forEach((timer, id) => {
      if (!wanted.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    });
  }, [entries, exitMs]);
  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    []
  );
  useIsoLayoutEffect(() => {
    const next = /* @__PURE__ */ new Map();
    els.current.forEach((el, k) => next.set(k, { x: el.offsetLeft, y: el.offsetTop }));
    const keyList = entries.map((e) => e.key).join("\n");
    const reordered = lastKeys.current !== null && lastKeys.current !== keyList;
    lastKeys.current = keyList;
    const live = new Set(entries.map((e) => e.key));
    anims.current.forEach((anim, k) => {
      if (!live.has(k)) {
        anim.cancel();
        anims.current.delete(k);
      }
    });
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (active) {
      const ei = entries.findIndex((e) => e.phase === "exit" && els.current.get(e.key)?.contains(active));
      if (ei !== -1) {
        const target = [...entries.slice(ei + 1), ...entries.slice(0, ei).reverse()].find((e) => e.phase !== "exit");
        const focusable = target ? els.current.get(target.key)?.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])') : null;
        if (focusable) focusable.focus({ preventScroll: true });
      }
    }
    if (!reduced && reordered) {
      const moves = [];
      for (const e of entries) {
        if (e.phase === "exit") continue;
        const a = rects.current.get(e.key);
        const b = next.get(e.key);
        const el = els.current.get(e.key);
        if (!a || !b || !el || typeof el.animate !== "function") continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const running = anims.current.get(e.key);
        if (!running && Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        moves.push({ key: e.key, el, dx, dy, running });
      }
      const drawn = moves.map((m) => m.el.getBoundingClientRect());
      for (const m of moves) {
        if (!m.running) continue;
        m.running.cancel();
        anims.current.delete(m.key);
      }
      const settled = moves.map((m) => m.running ? m.el.getBoundingClientRect() : null);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const inView = (r, dx, dy) => r.bottom + dy >= 0 && r.top + dy <= vh && r.right + dx >= 0 && r.left + dx <= vw;
      let started = 0;
      moves.forEach((m, i) => {
        const r1 = drawn[i];
        const r2 = settled[i];
        let { dx, dy } = m;
        if (r2) {
          dx += r1.left - r2.left;
          dy += r1.top - r2.top;
        }
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        if (started >= MAX_ANIMATED) return;
        const home = r2 ?? r1;
        if (!inView(home, 0, 0) && !inView(home, dx, dy)) return;
        started++;
        const anim = m.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
          duration: MOVE_MS,
          easing: EASE
        });
        anims.current.set(m.key, anim);
        anim.onfinish = () => {
          if (anims.current.get(m.key) === anim) anims.current.delete(m.key);
        };
      });
    }
    rects.current = next;
  }, [entries, reduced]);
  const Root = as;
  const Item = as === "div" ? "div" : "li";
  return /* @__PURE__ */ jsx(Root, { ...rest, ref, className, children: entries.map((e) => /* @__PURE__ */ jsx(
    Item,
    {
      ref: itemRef,
      "data-nish-key": e.key,
      className: cn("nish-flow-item", itemClassName),
      "data-phase": e.phase,
      "aria-hidden": e.phase === "exit" || void 0,
      inert: e.phase === "exit" || void 0,
      style: e.phase === "exit" ? { "--nish-flow-exit-ms": `${exitMs}ms` } : void 0,
      children: /* @__PURE__ */ jsx("div", { className: "nish-flow-item-inner", children: children(e.item, e.phase) })
    },
    e.key
  )) });
}
export {
  ActivityFeed,
  AgentNode,
  AnimatedList,
  FlowSteps,
  StepBar,
  TickerText,
  WorkflowBoard,
  usePrefersReducedMotion
};
