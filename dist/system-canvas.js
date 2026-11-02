// src/components/canvas/system-canvas.tsx
import {
  Fragment as Fragment4,
  useCallback as useCallback3,
  useEffect as useEffect7,
  useLayoutEffect as useLayoutEffect3,
  useMemo as useMemo2,
  useRef as useRef8,
  useState as useState6
} from "react";

// src/cn.ts
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
var twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["2xs", "3xs"]
    },
    classGroups: {
      shadow: [{ shadow: ["card", "pop", "modal"] }]
    }
  }
});
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/components/flow.tsx
import {
  useEffect as useEffect2,
  useLayoutEffect,
  useMemo,
  useRef as useRef2,
  useState as useState2
} from "react";

// src/components/hooks.tsx
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { jsx } from "react/jsx-runtime";
function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {
      };
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );
  const get = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, get, () => false);
}
var BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 };
var BREAKPOINT_QUERIES = ["xl", "lg", "md", "sm"].map((name) => [
  name,
  `(min-width: ${BREAKPOINTS[name]}px)`
]);

// src/components/icons.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function Svg({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx2(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      children
    }
  );
}
var LoaderIcon = (p) => /* @__PURE__ */ jsx2(Svg, { ...p, children: /* @__PURE__ */ jsx2("path", { d: "M21 12a9 9 0 1 1-6.22-8.56" }) });
var ChevronDownIcon = (p) => /* @__PURE__ */ jsx2(Svg, { ...p, children: /* @__PURE__ */ jsx2("path", { d: "m6 9 6 6 6-6" }) });

// src/components/primitives.tsx
import {
  forwardRef,
  useId
} from "react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var BUTTON_VARIANT = {
  primary: "bg-th-accent text-th-on-accent hover:bg-th-accent/90 active:bg-th-accent/80",
  secondary: "border border-th-line-strong bg-th-surface text-th-hi hover:bg-th-elevated",
  ghost: "text-th-hi2 hover:bg-th-elevated hover:text-th-hi",
  danger: "bg-th-loss text-th-on-loss hover:bg-th-loss/90 active:bg-th-loss/80",
  soft: "bg-th-accent-soft text-th-accent hover:bg-th-accent/20 active:bg-th-accent/25",
  subtle: "bg-th-elevated text-th-hi hover:bg-th-overlay",
  link: "h-auto p-0 font-medium text-th-accent underline-offset-2 hover:underline"
};
var BUTTON_SIZE = {
  xs: "h-6 gap-1 px-2 text-2xs pointer-coarse:min-h-11",
  sm: "h-7 gap-1.5 px-2.5 text-xs pointer-coarse:min-h-11",
  md: "h-9 gap-2 px-3.5 text-sm pointer-coarse:min-h-11",
  lg: "h-11 gap-2 px-5 text-base"
};
var LINK_SIZE = {
  xs: "gap-1 text-2xs",
  sm: "gap-1 text-xs",
  md: "gap-1.5 text-sm",
  lg: "gap-2 text-base"
};
var BUTTON_BASE = "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,transform] duration-150";
var PRESS = "pointer-coarse:not-disabled:active:scale-[0.97]";
var LINK_HIT = "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3 pointer-coarse:after:content-['']";
var BUTTON_DISABLED = "disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none";
var LINK_DISABLED = "disabled:pointer-events-none disabled:text-th-ghost disabled:no-underline";
function buttonClass({ variant = "secondary", size = "md", inline = false, className } = {}) {
  return cn(
    BUTTON_BASE,
    variant === "link" ? LINK_SIZE[size] : BUTTON_SIZE[size],
    variant === "link" ? !inline && LINK_HIT : PRESS,
    BUTTON_VARIANT[variant],
    className
  );
}
var Button = forwardRef(function Button2({ variant = "secondary", size = "md", inline = false, loading = false, icon, className, children, disabled, type = "button", ...rest }, ref) {
  return /* @__PURE__ */ jsxs2(
    "button",
    {
      ref,
      type,
      disabled: disabled || loading,
      "aria-busy": loading || void 0,
      className: buttonClass({
        variant,
        size,
        inline,
        className: cn(variant === "link" ? LINK_DISABLED : BUTTON_DISABLED, className)
      }),
      ...rest,
      children: [
        loading ? /* @__PURE__ */ jsx3(LoaderIcon, { size: size === "xs" || size === "sm" ? 12 : 14, className: "animate-spin" }) : icon,
        children
      ]
    }
  );
});
var ICON_SIZE = {
  "2xs": "size-5 rounded",
  xs: "size-6 rounded-md",
  sm: "size-7 rounded-lg",
  md: "size-9 rounded-lg"
};
var ICON_VARIANT = {
  ghost: { idle: "text-th-hi3 hover:bg-th-elevated hover:text-th-hi", active: "bg-th-elevated text-th-hi" },
  subtle: { idle: "bg-th-elevated text-th-hi hover:bg-th-overlay", active: "bg-th-overlay text-th-hi" },
  soft: { idle: "bg-th-accent-soft text-th-accent hover:bg-th-accent/20", active: "bg-th-accent/25 text-th-accent" }
};
var ICON_DANGER = "hover:bg-th-loss-soft hover:text-th-loss active:bg-th-loss-soft active:text-th-loss";
function iconButtonClass({
  size = "md",
  variant = "ghost",
  tone = "neutral",
  active = false,
  className
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center transition-[color,background-color,border-color,transform] duration-150",
    PRESS,
    "disabled:pointer-events-none disabled:bg-transparent disabled:text-th-ghost",
    "pointer-coarse:min-h-11 pointer-coarse:min-w-11",
    ICON_SIZE[size],
    ICON_VARIANT[variant].idle,
    active && ICON_VARIANT[variant].active,
    tone === "danger" && ICON_DANGER,
    active && tone === "danger" && "bg-th-loss-soft text-th-loss",
    className
  );
}
var IconButton = forwardRef(function IconButton2({ label, size = "md", active = false, variant = "ghost", tone = "neutral", className, children, type = "button", ...rest }, ref) {
  return /* @__PURE__ */ jsx3(
    "button",
    {
      ref,
      type,
      "aria-label": label,
      title: label,
      "aria-pressed": active || void 0,
      className: iconButtonClass({ size, variant, tone, active, className }),
      ...rest,
      children
    }
  );
});
var CARD_PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4 sm:p-5",
  lg: "p-6"
};
var resolvePadding = (padding, padded) => padding ?? (padded === false ? "none" : "md");
function cardClass({ padding, padded, interactive = false, variant = "surface", className } = {}) {
  const inset = variant === "inset";
  return cn(
    inset ? "rounded-lg border border-transparent bg-th-elevated" : "rounded-xl border border-th-line bg-th-surface shadow-card",
    CARD_PADDING[resolvePadding(padding, padded)],
    interactive && (inset ? "transition-colors duration-150 hover:bg-th-overlay" : "transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60"),
    className
  );
}
function CardHeader({
  title,
  description,
  action,
  icon,
  as: Heading = "h2",
  divided = false,
  titleId,
  className,
  ...rest
}) {
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-2",
        divided && "border-b border-th-line px-4 py-3",
        className
      ),
      ...rest,
      children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex min-w-0 items-start gap-2", children: [
          icon ? /* @__PURE__ */ jsx3("span", { className: "mt-0.5 inline-flex shrink-0 text-th-hi3", "aria-hidden": "true", children: icon }) : null,
          /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx3(Heading, { id: titleId, className: "text-sm font-semibold text-th-hi", children: title }),
            description ? /* @__PURE__ */ jsx3("p", { className: "mt-0.5 text-xs text-th-hi3", children: description }) : null
          ] })
        ] }),
        action ? /* @__PURE__ */ jsx3("div", { className: "flex shrink-0 flex-wrap items-center gap-2", children: action }) : null
      ]
    }
  );
}
var Card = forwardRef(function Card2({ as = "div", padding, padded, interactive = false, variant = "surface", title, description, action, className, children, ...rest }, ref) {
  const Tag = as;
  const pad = resolvePadding(padding, padded);
  const headingId = useId();
  const region = title != null && (as === "section" || as === "article" || as === "aside");
  return /* @__PURE__ */ jsxs2(
    Tag,
    {
      ref,
      "aria-labelledby": region && !rest["aria-label"] && !rest["aria-labelledby"] ? headingId : void 0,
      className: cardClass({ padding: pad, interactive, variant, className }),
      ...rest,
      children: [
        title != null ? /* @__PURE__ */ jsx3(
          CardHeader,
          {
            title,
            description,
            action,
            titleId: headingId,
            divided: pad === "none",
            className: pad === "none" ? void 0 : "mb-3"
          }
        ) : null,
        children
      ]
    }
  );
});
var FIELD = "w-full min-w-0 rounded-lg border border-th-line-strong bg-th-elevated text-th-hi placeholder:text-th-ghost transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-th-loss";
var FIELD_SIZE = {
  xs: { box: "h-7 pointer-coarse:min-h-11", pad: "pl-2 pr-2", text: "text-2xs pointer-coarse:text-base" },
  sm: { box: "h-8 pointer-coarse:min-h-11", pad: "pl-2.5 pr-2.5", text: "text-xs pointer-coarse:text-base" },
  md: { box: "h-9 pointer-coarse:min-h-11", pad: "pl-3 pr-3", text: "text-sm pointer-coarse:text-base" }
};
var FIELD_INVALID = "border-th-loss hover:border-th-loss";
function fieldClass({ size = "md", invalid = false, className } = {}) {
  const s = FIELD_SIZE[size];
  return cn(FIELD, s.box, s.pad, s.text, invalid && FIELD_INVALID, className);
}
var Input = forwardRef(function Input2({ invalid, size = "md", leading, trailing, wrapperClassName, className, ...rest }, ref) {
  const input = /* @__PURE__ */ jsx3(
    "input",
    {
      ref,
      "aria-invalid": invalid || void 0,
      className: fieldClass({ size, className: cn(leading != null && "pl-8", trailing != null && "pr-8", className) }),
      ...rest
    }
  );
  if (leading == null && trailing == null) return input;
  return /* @__PURE__ */ jsxs2("span", { className: cn("relative inline-flex w-full min-w-0 items-center", wrapperClassName), children: [
    leading != null ? /* @__PURE__ */ jsx3("span", { className: "pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center text-sm text-th-hi2", children: leading }) : null,
    input,
    trailing != null ? /* @__PURE__ */ jsx3("span", { className: "absolute inset-y-0 right-0 flex min-w-8 items-center justify-center pr-0.5 text-sm text-th-hi2", children: trailing }) : null
  ] });
});
var SELECT_SIZE = {
  xs: { pad: "pl-2 pr-6", chevron: "right-1.5", icon: 12 },
  sm: { pad: "pl-2.5 pr-7", chevron: "right-2", icon: 13 },
  md: { pad: "pl-3 pr-8", chevron: "right-2.5", icon: 14 }
};
var Select = forwardRef(function Select2({ invalid, size = "md", selectClassName, className, children, ...rest }, ref) {
  const s = SELECT_SIZE[size];
  return /* @__PURE__ */ jsxs2("span", { className: cn("relative inline-flex w-full min-w-0", className), children: [
    /* @__PURE__ */ jsx3(
      "select",
      {
        ref,
        "aria-invalid": invalid || void 0,
        className: fieldClass({ size, className: cn("appearance-none", s.pad, selectClassName) }),
        ...rest,
        children
      }
    ),
    /* @__PURE__ */ jsx3(ChevronDownIcon, { size: s.icon, className: cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3", s.chevron) })
  ] });
});

// src/components/flow.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
function TickerText({ text, as = "span", className }) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState2({ text, prev: null });
  let cur = state;
  if (state.text !== text) {
    cur = { text, prev: reduced ? null : state.text };
    setState(cur);
  }
  const animating = cur.prev !== null;
  useEffect2(() => {
    if (!animating) return;
    const timer = setTimeout(() => setState((s) => s.prev === null ? s : { ...s, prev: null }), 300);
    return () => clearTimeout(timer);
  }, [animating, cur.text]);
  const Tag = as;
  return /* @__PURE__ */ jsxs3(Tag, { className: cn("nish-flow-ticker grid min-w-0 overflow-hidden", className), title: cur.text, children: [
    cur.prev !== null ? /* @__PURE__ */ jsx4("span", { className: "nish-flow-ticker-out", "aria-hidden": "true", children: cur.prev }, `prev:${cur.prev}`) : null,
    /* @__PURE__ */ jsx4("span", { className: animating ? "nish-flow-ticker-in" : void 0, children: cur.text }, cur.text)
  ] });
}

// src/components/canvas/follow-caption.tsx
import { memo } from "react";

// src/components/display.tsx
import {
  createContext,
  useContext,
  useEffect as useEffect3,
  useRef as useRef3,
  useState as useState3
} from "react";
import { Fragment as Fragment2, jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var FILL = {
  ok: "bg-th-ok-fill",
  warn: "bg-th-warn-fill",
  loss: "bg-th-loss-fill",
  info: "bg-th-info-fill",
  accent: "bg-th-accent",
  neutral: "bg-th-ghost"
};
var DOT_SIZE = { xs: "size-1.5", sm: "size-2", md: "size-2.5", lg: "size-3.5" };
var HALO = {
  ok: "ring-4 ring-th-ok-fill/25",
  warn: "ring-4 ring-th-warn-fill/25",
  loss: "ring-4 ring-th-loss-fill/25",
  info: "ring-4 ring-th-info-fill/25",
  accent: "ring-4 ring-th-accent/25",
  neutral: "ring-4 ring-th-ghost/25"
};
function StatusDot({ tone, size = "sm", pulse = false, halo = false, label, className }) {
  return /* @__PURE__ */ jsx5(
    "span",
    {
      role: label ? "img" : void 0,
      "aria-label": label,
      "aria-hidden": label ? void 0 : true,
      className: cn(
        "inline-block shrink-0 rounded-full",
        DOT_SIZE[size],
        FILL[tone],
        halo && HALO[tone],
        pulse && "motion-safe:animate-pulse",
        className
      )
    }
  );
}
var InStatGrid = createContext(false);

// src/components/canvas/follow-caption.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var FollowCaption = memo(function FollowCaption2({ step }) {
  if (!step) return null;
  const only = step.targets.length === 1 ? step.targets[0] : null;
  const text = step.mode === "idle" ? "Following \xB7 waiting for activity" : only ? `Following \xB7 ${only.group} \u203A ${only.label}` : `Following ${step.targets.length} active pieces`;
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      "data-canvas-ui": true,
      role: "status",
      "aria-live": "polite",
      className: "absolute bottom-[68px] left-3 z-10 flex max-w-[min(420px,calc(100%-24px))] items-center gap-2 rounded-xl border border-th-line bg-th-surface px-3 py-2 text-xs text-th-hi shadow-card min-[600px]:bottom-3",
      children: [
        /* @__PURE__ */ jsx6(StatusDot, { tone: "accent", pulse: step.mode !== "idle" }),
        /* @__PURE__ */ jsxs5("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx6("div", { className: "truncate", children: text }),
          only?.note ? /* @__PURE__ */ jsx6(TickerText, { as: "div", text: only.note, className: "truncate text-th-ghost" }) : null
        ] })
      ]
    }
  );
});

// src/components/canvas/follow.ts
import { useEffect as useEffect4, useRef as useRef4, useState as useState4 } from "react";

// src/components/canvas/view.ts
var MIN_K = 0.3;
var MAX_K = 2;
var PHONE_K = 0.55;
var PHONE_MAX_W = 600;
var FIT_PAD = 48;
var LABEL_K = 0.8;
var ANIM_MS = 300;
var FOLLOW_MS = 700;
var LOD_K = 0.6;
var DOUBLE_MS = 300;
var DOUBLE_PX = 10;
var DRAG_PX = 4;
var KEY_PAN = 48;
var ZOOM_STEP = 1.25;
var clampK = (k) => Math.min(MAX_K, Math.max(MIN_K, k));
var ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function zoomAround(v, k, px, py) {
  const nk = clampK(k);
  const r = nk / v.k;
  return { k: nk, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}
function centerOn(w, h, k, box) {
  return { k, x: w / 2 - (box.x + box.w / 2) * k, y: h / 2 - (box.y + box.h / 2) * k };
}

// src/components/canvas/follow.ts
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
  const latest = useRef4(o);
  useEffect4(() => {
    latest.current = o;
  });
  const index = useRef4(0);
  const visiting = useRef4(null);
  const [step, setStep] = useState4(null);
  const targets = on ? followTargets(groups, layout) : [];
  const sig = followSignature(targets);
  const caption = captionKey(targets);
  const indexKey = useRef4("");
  useEffect4(() => {
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
  useEffect4(() => {
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

// src/components/canvas/icons.tsx
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function Svg2({ children, ...rest }) {
  return /* @__PURE__ */ jsx7(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      ...rest,
      children
    }
  );
}
var KIND_ICON = {
  ui: /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx7("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2" }),
    /* @__PURE__ */ jsx7("path", { d: "M3 9h18" })
  ] }),
  service: /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx7("rect", { x: "3", y: "3", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ jsx7("rect", { x: "3", y: "14", width: "18", height: "7", rx: "2" }),
    /* @__PURE__ */ jsx7("path", { d: "M7 6.5h.01M7 17.5h.01" })
  ] }),
  worker: /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx7("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ jsx7("path", { d: "M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" })
  ] }),
  library: /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx7("path", { d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
    /* @__PURE__ */ jsx7("path", { d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
  ] }),
  infra: /* @__PURE__ */ jsx7("path", { d: "M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" }),
  data: /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx7("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }),
    /* @__PURE__ */ jsx7("path", { d: "M3 5v14a9 3 0 0 0 18 0V5" }),
    /* @__PURE__ */ jsx7("path", { d: "M3 12a9 3 0 0 0 18 0" })
  ] }),
  tool: /* @__PURE__ */ jsx7("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" }),
  docs: /* @__PURE__ */ jsxs6(Fragment3, { children: [
    /* @__PURE__ */ jsx7("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    /* @__PURE__ */ jsx7("path", { d: "M14 2v6h6M8 13h8M8 17h5" })
  ] })
};
var PlusIcon = () => /* @__PURE__ */ jsx7(Svg2, { children: /* @__PURE__ */ jsx7("path", { d: "M12 5v14M5 12h14" }) });
var MinusIcon = () => /* @__PURE__ */ jsx7(Svg2, { children: /* @__PURE__ */ jsx7("path", { d: "M5 12h14" }) });
var FitIcon = () => /* @__PURE__ */ jsxs6(Svg2, { children: [
  /* @__PURE__ */ jsx7("path", { d: "M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" }),
  /* @__PURE__ */ jsx7("rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" })
] });
var FollowIcon = () => /* @__PURE__ */ jsxs6(Svg2, { children: [
  /* @__PURE__ */ jsx7("circle", { cx: "12", cy: "12", r: "7" }),
  /* @__PURE__ */ jsx7("path", { d: "M12 2v3M12 19v3M2 12h3M19 12h3" }),
  /* @__PURE__ */ jsx7("circle", { cx: "12", cy: "12", r: "1.5", fill: "currentColor" })
] });

// src/components/canvas/layout.ts
var NODE_W = 172;
var NODE_H = 56;
var NODE_GAP = 12;
var GROUP_PAD = 16;
var GROUP_HEAD = 52;
var MIN_COLUMN_STEP = 420;
var CHANNEL_EDGE = 60;
var GROUP_GAP_X = 56;
var BAND_TITLE = 40;
var GAP_MIN = 72;
var GAP_MAX = 240;
var COLUMN_TITLE_ROOM = 36;
function sizeGroups(groups) {
  const sized = /* @__PURE__ */ new Map();
  for (const g of groups) {
    const cols = g.nodes.length > 1 ? 2 : 1;
    const rows = Math.ceil(g.nodes.length / cols);
    const w = GROUP_PAD * 2 + cols * NODE_W + (cols - 1) * NODE_GAP;
    const h = GROUP_HEAD + GROUP_PAD + (rows > 0 ? rows * NODE_H + (rows - 1) * NODE_GAP : 0);
    sized.set(g.id, { w, h, cols });
  }
  return sized;
}
function placeGroup(out, g, s, x, y) {
  out.groups[g.id] = { x, y, w: s.w, h: s.h };
  g.nodes.forEach((n, i) => {
    out.nodes[n.id] = {
      x: x + GROUP_PAD + i % s.cols * (NODE_W + NODE_GAP),
      y: y + GROUP_HEAD + Math.floor(i / s.cols) * (NODE_H + NODE_GAP),
      w: NODE_W,
      h: NODE_H
    };
  });
}
function layoutBands(groups, width, edges) {
  const out = {
    mode: "bands",
    width: 0,
    height: 0,
    titleRoom: 0,
    headers: [],
    groups: {},
    nodes: {}
  };
  if (groups.length === 0) return out;
  const sized = sizeGroups(groups);
  const bandOf = (g) => g.band ?? g.column;
  const bandIds = [...new Set(groups.map(bandOf))].sort((a, b) => a - b);
  const rows = [];
  for (const band of bandIds) {
    const members = groups.map((g, i) => ({ g, i })).filter((m) => bandOf(m.g) === band).sort((a, b) => a.g.column - b.g.column || a.i - b.i).map((m) => m.g);
    let cur = null;
    for (const g of members) {
      const s = sized.get(g.id);
      if (cur && cur.w + GROUP_GAP_X + s.w <= width) {
        cur.list.push(g);
        cur.w += GROUP_GAP_X + s.w;
        cur.h = Math.max(cur.h, s.h);
      } else {
        cur = { band, firstOfBand: cur === null, list: [g], w: s.w, h: s.h };
        rows.push(cur);
      }
    }
  }
  const rowOf = /* @__PURE__ */ new Map();
  rows.forEach((r, ri) => {
    for (const g of r.list) {
      rowOf.set(g.id, ri);
      for (const n of g.nodes) rowOf.set(n.id, ri);
    }
  });
  const ends = Array.from(
    { length: Math.max(0, rows.length - 1) },
    () => /* @__PURE__ */ new Set()
  );
  for (const e of edges) {
    const s = rowOf.get(e.from);
    const t = rowOf.get(e.to);
    if (s === void 0 || t === void 0 || s === t) continue;
    if (s < t) {
      ends[s].add(`df:${e.from}`);
      ends[t - 1].add(`dt:${e.to}`);
    } else {
      ends[s - 1].add(`uf:${e.from}`);
      ends[t].add(`ut:${e.to}`);
    }
  }
  const widest = rows.reduce((m, r) => Math.max(m, r.w), 0);
  out.width = CHANNEL_EDGE + widest + CHANNEL_EDGE;
  let y = CHANNEL_EDGE + BAND_TITLE;
  rows.forEach((r, ri) => {
    if (ri > 0) {
      const gap = Math.min(
        GAP_MAX,
        Math.max(GAP_MIN, 40 + 8 * ends[ri - 1].size)
      );
      y += gap + (r.firstOfBand ? BAND_TITLE : 0);
    }
    let x = CHANNEL_EDGE + (widest - r.w) / 2;
    r.list.forEach((g, gi) => {
      const s = sized.get(g.id);
      placeGroup(out, g, s, x, y);
      if (r.firstOfBand && gi === 0)
        out.headers.push({ index: r.band, x, y: y - 12 });
      x += s.w + GROUP_GAP_X;
    });
    if (ri === rows.length - 1) out.height = y + r.h + CHANNEL_EDGE;
    y += r.h;
  });
  return out;
}
function layoutSystem(groups, o = {}) {
  if (o.mode === "bands")
    return layoutBands(groups, o.width ?? 0, o.edges ?? []);
  const columnGap = o.columnGap ?? 120;
  const rowGap = o.rowGap ?? 40;
  const columns = [...new Set(groups.map((g) => g.column))].sort(
    (a, b) => a - b
  );
  const sized = sizeGroups(groups);
  const stackHeight = (list) => list.reduce((sum, g) => sum + sized.get(g.id).h, 0) + Math.max(0, list.length - 1) * rowGap;
  const whole = columns.map((c) => groups.filter((g) => g.column === c));
  const sorted = whole.map(stackHeight).sort((a, b) => a - b);
  const median = sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)];
  const members = [];
  for (const list of whole) {
    const h = stackHeight(list);
    const parts = median > 0 && list.length > 1 ? Math.min(3, list.length, Math.ceil(h / (median * 1.5))) : 1;
    if (parts <= 1) {
      members.push(list);
      continue;
    }
    const goal = h / parts;
    let cur = [];
    let cuts = 0;
    for (const g of list) {
      if (cur.length > 0 && cuts < parts - 1 && stackHeight(cur) + rowGap + sized.get(g.id).h / 2 > goal) {
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
  const out = {
    mode: "columns",
    width: 0,
    height: tallest,
    titleRoom: COLUMN_TITLE_ROOM,
    headers: [],
    groups: {},
    nodes: {}
  };
  let x = members.length > 0 ? CHANNEL_EDGE : 0;
  members.forEach((list, ci) => {
    const widest = list.reduce((m, g) => Math.max(m, sized.get(g.id).w), 0);
    let y = (tallest - heights[ci]) / 2;
    for (const g of list) {
      placeGroup(out, g, sized.get(g.id), x, y);
      y += sized.get(g.id).h + rowGap;
    }
    out.width = Math.max(out.width, x + widest);
    x += Math.max(MIN_COLUMN_STEP, widest + columnGap);
  });
  if (members.length > 0) out.width += CHANNEL_EDGE;
  for (const c of columns) {
    const boxes = groups.filter((g) => g.column === c).map((g) => out.groups[g.id]);
    out.headers.push({
      index: c,
      x: Math.min(...boxes.map((b) => b.x)),
      y: Math.min(...boxes.map((b) => b.y)) - COLUMN_TITLE_ROOM
    });
  }
  return out;
}
function layoutCandidates(groups, edges, mode = "auto") {
  if (mode === "columns")
    return {
      mode,
      bands: [],
      columns: layoutSystem(groups, { mode: "columns" })
    };
  const sized = sizeGroups(groups);
  const widths = groups.map((g) => sized.get(g.id).w).sort((a, b) => b - a);
  const perBand = /* @__PURE__ */ new Map();
  for (const g of groups) {
    const b = g.band ?? g.column;
    perBand.set(b, (perBand.get(b) ?? 0) + 1);
  }
  const maxN = Math.max(0, ...perBand.values());
  const rowWidths = [];
  let sum = 0;
  for (let n = 1; n <= maxN; n++) {
    sum += widths[n - 1];
    rowWidths.push(sum + (n - 1) * GROUP_GAP_X);
  }
  if (rowWidths.length === 0) rowWidths.push(0);
  return {
    mode,
    bands: [...new Set(rowWidths)].map(
      (width) => layoutSystem(groups, { mode: "bands", width, edges })
    ),
    columns: mode === "auto" ? layoutSystem(groups, { mode: "columns" }) : null
  };
}
var PHONE_LAYOUT_W = 480;
var SCROLL_K = 0.35;
function chooseLayout(c, viewport) {
  if (c.mode === "columns") return c.columns;
  const candidates = c.bands;
  if (viewport.w <= 0 || viewport.h <= 0) return candidates[0];
  const score = (l) => {
    if (l.width <= 0 || l.height <= 0) return 1;
    return Math.min(
      (viewport.w - 2 * FIT_PAD) / l.width,
      (viewport.h - 2 * FIT_PAD) / (l.height + l.titleRoom),
      1
    );
  };
  const scores = candidates.map(score);
  const top = Math.max(...scores);
  let best = 0;
  scores.forEach((s, i) => {
    if (top - s < 5e-3) best = i;
  });
  if (viewport.w < PHONE_LAYOUT_W || top < (viewport.w < PHONE_MAX_W ? PHONE_K : SCROLL_K)) {
    let pick = candidates[0];
    for (const x of candidates) if (x.width * PHONE_K <= viewport.w - 24) pick = x;
    return pick;
  }
  const bands = candidates[best];
  if (c.mode === "bands" || !c.columns) return bands;
  return score(c.columns) > scores[best] ? c.columns : bands;
}
function pickLayout(groups, edges, viewport, mode = "auto") {
  return chooseLayout(layoutCandidates(groups, edges, mode), viewport);
}

// src/components/canvas/legend.tsx
import { memo as memo2, useEffect as useEffect5, useId as useId2, useRef as useRef5, useState as useState5 } from "react";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var DASH = {
  solid: { width: 1.75 },
  dashed: { dash: "6 5", width: 1.75 },
  dotted: { dash: "0.5 6", width: 2.25, cap: "round" }
};
function Sample({ line }) {
  const d = DASH[line ?? "solid"];
  return /* @__PURE__ */ jsx8("svg", { width: 28, height: 10, viewBox: "0 0 28 10", "aria-hidden": "true", focusable: "false", className: "shrink-0", children: /* @__PURE__ */ jsx8("line", { x1: 2, y1: 5, x2: 26, y2: 5, stroke: "currentColor", strokeWidth: d.width, strokeDasharray: d.dash, strokeLinecap: d.cap }) });
}
var EdgeLegend = memo2(function EdgeLegend2({ kinds, hidden, onToggle }) {
  const [open, setOpen] = useState5(false);
  const rootRef = useRef5(null);
  const buttonRef = useRef5(null);
  const panelId = useId2();
  useEffect5(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  if (kinds.length === 0) return null;
  const nHidden = kinds.filter((k) => hidden.has(k.id)).length;
  return /* @__PURE__ */ jsxs7("div", { ref: rootRef, "data-canvas-ui": true, className: "absolute left-3 top-3 z-[5] flex flex-col items-start gap-1.5", children: [
    /* @__PURE__ */ jsxs7(
      "button",
      {
        ref: buttonRef,
        type: "button",
        "aria-expanded": open,
        "aria-controls": open ? panelId : void 0,
        onClick: () => setOpen((o) => !o),
        className: "inline-flex h-11 items-center gap-2 rounded-xl border border-th-line bg-th-surface px-3 text-sm text-th-hi shadow-pop outline-none hover:bg-th-elevated focus-visible:ring-2 focus-visible:ring-th-accent",
        children: [
          /* @__PURE__ */ jsx8(Svg2, { children: /* @__PURE__ */ jsx8("path", { d: "M3 6h18M3 12h18M3 18h18" }) }),
          /* @__PURE__ */ jsx8("span", { children: "Lines" }),
          nHidden > 0 ? /* @__PURE__ */ jsxs7("span", { className: "text-th-hi3", children: [
            "\xB7 ",
            nHidden,
            " hidden"
          ] }) : null
        ]
      }
    ),
    open ? /* @__PURE__ */ jsx8("div", { id: panelId, role: "menu", "aria-label": "Lines", className: "overflow-hidden rounded-xl border border-th-line bg-th-surface shadow-pop", style: { width: "min(240px, calc(100vw - 24px))" }, children: kinds.map((k) => {
      const on = !hidden.has(k.id);
      return /* @__PURE__ */ jsxs7(
        "button",
        {
          type: "button",
          role: "menuitemcheckbox",
          "aria-checked": on,
          onClick: () => onToggle(k.id),
          className: cn(
            "flex h-11 w-full items-center gap-3 px-3 text-left text-sm outline-none hover:bg-th-elevated focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-th-accent",
            on ? "text-th-hi" : "text-th-hi3"
          ),
          children: [
            /* @__PURE__ */ jsx8(Sample, { line: k.line }),
            /* @__PURE__ */ jsx8("span", { className: "min-w-0 flex-1 truncate", children: k.label }),
            /* @__PURE__ */ jsx8("span", { "aria-hidden": "true", className: cn("relative h-5 w-9 shrink-0 rounded-full border transition-colors", on ? "border-th-accent bg-th-accent" : "border-th-line-strong bg-th-elevated"), children: /* @__PURE__ */ jsx8("span", { className: cn("absolute top-0.5 size-3.5 rounded-full transition-all", on ? "left-[18px] bg-th-on-accent" : "left-0.5 bg-th-hi3") }) })
          ]
        },
        k.id
      );
    }) }) : null
  ] });
});

// src/components/canvas/minimap.tsx
import { memo as memo3, useCallback as useCallback2, useEffect as useEffect6, useImperativeHandle, useRef as useRef6 } from "react";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
var MAP_W = 176;
var MAP_MAX_H = 132;
var MAP_MIN_H = 60;
var MIN_CANVAS_W = 600;
var hueVar = (hue, soft) => hue ? `var(--nish-${hue}${soft ? "-soft" : ""})` : soft ? "var(--nish-accent-soft)" : "var(--nish-accent)";
var Minimap = memo3(function Minimap2({
  layout,
  groups,
  handleRef,
  onJump
}) {
  const wrapRef = useRef6(null);
  const svgRef = useRef6(null);
  const rectRef = useRef6(null);
  const last = useRef6(null);
  const totalH = layout.height + layout.titleRoom;
  const ok = layout.width > 0 && totalH > 0;
  const s = ok ? Math.min(MAP_W / layout.width, MAP_MAX_H / totalH) : 1;
  const mapH = ok ? Math.min(MAP_MAX_H, Math.max(MAP_MIN_H, MAP_W * totalH / layout.width)) : MAP_MIN_H;
  const ox = (MAP_W - layout.width * s) / 2;
  const oy = (mapH - totalH * s) / 2;
  const draw = useCallback2(() => {
    const cur = last.current;
    const wrap = wrapRef.current;
    const rect = rectRef.current;
    if (!cur || !wrap || !rect) return;
    const { v, size } = cur;
    wrap.style.display = size.w < MIN_CANVAS_W ? "none" : "";
    const x0 = Math.max(0, ox + -v.x / v.k * s);
    const y0 = Math.max(0, oy + (-v.y / v.k + layout.titleRoom) * s);
    const x1 = Math.min(MAP_W, ox + (-v.x + size.w) / v.k * s);
    const y1 = Math.min(mapH, oy + ((-v.y + size.h) / v.k + layout.titleRoom) * s);
    rect.setAttribute("x", String(x0));
    rect.setAttribute("y", String(y0));
    rect.setAttribute("width", String(Math.max(0, x1 - x0)));
    rect.setAttribute("height", String(Math.max(0, y1 - y0)));
  }, [ox, oy, s, mapH, layout.titleRoom]);
  useImperativeHandle(
    handleRef,
    () => ({
      setView(v, size) {
        last.current = { v, size };
        draw();
      }
    }),
    [draw]
  );
  useEffect6(() => {
    draw();
  }, [draw]);
  const jump = (e) => {
    const svg = svgRef.current;
    if (!svg || !ok) return;
    const box = svg.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const px = (e.clientX - box.left) / box.width * MAP_W;
    const py = (e.clientY - box.top) / box.height * mapH;
    onJump((px - ox) / s, (py - oy) / s - layout.titleRoom);
  };
  return /* @__PURE__ */ jsx9(
    "div",
    {
      ref: wrapRef,
      "data-canvas-ui": true,
      "aria-hidden": "true",
      className: "nish-canvas-minimap absolute right-3 top-3 z-[5] overflow-hidden rounded-xl border border-th-line bg-th-surface shadow-pop",
      style: { display: "none" },
      children: /* @__PURE__ */ jsxs8(
        "svg",
        {
          ref: svgRef,
          width: MAP_W,
          height: mapH,
          viewBox: `0 0 ${MAP_W} ${mapH}`,
          className: "block cursor-pointer touch-none",
          onPointerDown: (e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            jump(e);
          },
          onPointerMove: (e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) jump(e);
          },
          onPointerUp: (e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          },
          children: [
            groups.map((g) => {
              const b = layout.groups[g.id];
              if (!b) return null;
              return /* @__PURE__ */ jsx9(
                "rect",
                {
                  x: ox + b.x * s,
                  y: oy + (b.y + layout.titleRoom) * s,
                  width: b.w * s,
                  height: b.h * s,
                  rx: 3,
                  fill: hueVar(g.hue, true),
                  stroke: hueVar(g.hue, false),
                  strokeWidth: 1
                },
                g.id
              );
            }),
            groups.map(
              (g) => g.nodes.map((n) => {
                const b = layout.nodes[n.id];
                if (!n.active || !b) return null;
                return /* @__PURE__ */ jsx9("circle", { cx: ox + (b.x + b.w / 2) * s, cy: oy + (b.y + b.h / 2 + layout.titleRoom) * s, r: 3, fill: hueVar(g.hue, false) }, n.id);
              })
            ),
            /* @__PURE__ */ jsx9("rect", { ref: rectRef, x: 0, y: 0, width: 0, height: 0, fill: "var(--nish-accent)", fillOpacity: 0.1, stroke: "var(--nish-accent)", strokeWidth: 1 })
          ]
        }
      )
    }
  );
});

// src/components/canvas/node.tsx
import { memo as memo4, useLayoutEffect as useLayoutEffect2, useRef as useRef7 } from "react";
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function hueStyle(hue) {
  return {
    "--c": hue ? `var(--nish-${hue})` : "var(--nish-accent)",
    "--c-soft": hue ? `var(--nish-${hue}-soft)` : "var(--nish-accent-soft)"
  };
}
var clamp01 = (n) => n == null || !Number.isFinite(n) ? 0 : Math.min(1, Math.max(0, n));
function usePing(active) {
  const ref = useRef7(null);
  const prev = useRef7(active);
  useLayoutEffect2(() => {
    const was = prev.current;
    prev.current = active;
    const el = ref.current;
    if (!el || was || !active) return;
    el.removeAttribute("data-fx");
    void el.offsetWidth;
    el.setAttribute("data-fx", "ping");
    const timer = setTimeout(() => el.removeAttribute("data-fx"), 450);
    return () => clearTimeout(timer);
  }, [active]);
  return ref;
}
var NodeView = memo4(
  function NodeView2({ node, groupTitle, hue, box, selected, dim, delay, onSelect }) {
    const active = !!node.active;
    const heat = clamp01(node.heat);
    const ref = usePing(active);
    const count = node.count ?? 0;
    const style = {
      ...hueStyle(hue),
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      "--nish-canvas-delay": `${delay}ms`
    };
    if (!active && heat > 0) {
      const vars = style;
      vars["--nish-canvas-heat-line"] = `color-mix(in srgb, var(--c) ${Math.round(heat * 70)}%, var(--nish-line))`;
      vars["--nish-canvas-heat-glow"] = `0 0 ${Math.round(6 + heat * 16)}px color-mix(in srgb, var(--c) ${Math.round(heat * 60)}%, transparent)`;
    }
    const aria = `${node.label}, ${groupTitle}${active ? node.note ? `, active: ${node.note}` : ", active" : ""}`;
    return /* @__PURE__ */ jsx10("div", { className: "nish-canvas-slot", style, "data-active": active || void 0, "data-dim": dim || void 0, children: /* @__PURE__ */ jsxs9(
      "button",
      {
        ref,
        type: "button",
        className: "nish-canvas-node",
        "data-canvas-id": node.id,
        "data-active": active || void 0,
        "data-selected": selected || void 0,
        "data-heat": heat > 0 || void 0,
        "aria-label": aria,
        title: node.detail || void 0,
        "aria-pressed": selected,
        onClick: () => onSelect?.(node.id, "node"),
        children: [
          node.kind ? /* @__PURE__ */ jsx10("span", { className: "nish-canvas-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsx10(Svg2, { children: KIND_ICON[node.kind] }) }) : null,
          /* @__PURE__ */ jsxs9("span", { className: "nish-canvas-text", children: [
            /* @__PURE__ */ jsx10("span", { className: "nish-canvas-label", children: node.label }),
            active && node.note ? /* @__PURE__ */ jsx10("span", { className: "nish-canvas-note", "aria-hidden": "true", children: /* @__PURE__ */ jsx10(TickerText, { text: node.note, as: "span" }) }) : node.detail ? /* @__PURE__ */ jsx10("span", { className: "nish-canvas-detail", children: node.detail }) : null
          ] }),
          count > 1 ? /* @__PURE__ */ jsx10("span", { className: "nish-canvas-count", children: count }) : null,
          active ? /* @__PURE__ */ jsx10("span", { className: "nish-canvas-live", "aria-hidden": "true" }) : null
        ]
      }
    ) });
  },
  (a, b) => a.groupTitle === b.groupTitle && a.hue === b.hue && a.selected === b.selected && a.dim === b.dim && a.delay === b.delay && a.onSelect === b.onSelect && a.box.x === b.box.x && a.box.y === b.box.y && a.node.id === b.node.id && a.node.label === b.node.label && a.node.kind === b.node.kind && a.node.detail === b.node.detail && a.node.active === b.node.active && a.node.note === b.node.note && a.node.count === b.node.count && Math.round(clamp01(a.node.heat) * 100) === Math.round(clamp01(b.node.heat) * 100)
);

// src/components/canvas/route.ts
var LANE_MARGIN = 16;
var TRACK_GAP = 8;
var CLEARANCE = 8;
var OUTSIDE_GAP = 24;
var CORNER_R = 6;
function roundedPath(pts) {
  const f = (v) => String(Math.round(v * 100) / 100);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const [cx, cy] = pts[i + 1];
    const r = Math.min(CORNER_R, (Math.abs(bx - ax) + Math.abs(by - ay)) / 2, (Math.abs(cx - bx) + Math.abs(cy - by)) / 2);
    const ux = Math.sign(bx - ax);
    const uy = Math.sign(by - ay);
    const vx = Math.sign(cx - bx);
    const vy = Math.sign(cy - by);
    d += `L${f(bx - ux * r)} ${f(by - uy * r)}A${f(r)} ${f(r)} 0 0 ${ux * vy - uy * vx > 0 ? 1 : 0} ${f(bx + vx * r)} ${f(by + vy * r)}`;
  }
  const last = pts[pts.length - 1];
  return `${d}L${f(last[0])} ${f(last[1])}`;
}
function corners(pts) {
  const out = [];
  for (const p of pts) {
    const prev = out[out.length - 1];
    if (prev && prev[0] === p[0] && prev[1] === p[1]) continue;
    const before = out[out.length - 2];
    if (prev && before && (before[0] === prev[0] && prev[0] === p[0] || before[1] === prev[1] && prev[1] === p[1])) out.pop();
    out.push(p);
  }
  return out;
}
function labelPoint(pts) {
  let best = { x: pts[0][0], y: pts[0][1] };
  let len = -1;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const l = Math.abs(bx - ax) + Math.abs(by - ay);
    if (l > len) {
      len = l;
      best = { x: (ax + bx) / 2, y: (ay + by) / 2 };
    }
  }
  return best;
}
var flip = (b) => ({ x: b.y, y: b.x, w: b.h, h: b.w });
function routeEdges(layout, groups, edges) {
  if (layout.mode !== "bands") return routeColumns(layout, groups, edges);
  const t = { ...layout, mode: "columns", width: layout.height, height: layout.width, groups: {}, nodes: {} };
  for (const id of Object.keys(layout.groups)) t.groups[id] = flip(layout.groups[id]);
  for (const id of Object.keys(layout.nodes)) t.nodes[id] = flip(layout.nodes[id]);
  const groupOf = /* @__PURE__ */ new Map();
  for (const g of groups) for (const n of g.nodes) groupOf.set(n.id, g.id);
  const inside = [];
  const outside = [];
  for (const e of edges) {
    const g = groupOf.get(e.from);
    (g !== void 0 && g === groupOf.get(e.to) ? inside : outside).push(e);
  }
  const routed = routeColumns(t, groups, outside);
  const result = {};
  for (const e of inside) {
    const a = layout.nodes[e.from];
    const b = layout.nodes[e.to];
    if (!a || !b || e.from === e.to) continue;
    let points;
    let dir;
    if (b.y >= a.y + a.h) {
      const ax = a.x + a.w / 2;
      const bx = b.x + b.w / 2;
      if (b.y <= a.y + a.h + NODE_GAP + 1) {
        const my = (a.y + a.h + b.y) / 2;
        points = corners([[ax, a.y + a.h], [ax, my], [bx, my], [bx, b.y]]);
      } else {
        const gb = layout.groups[groupOf.get(e.from)];
        const hasRightColumn = !!gb && gb.x + gb.w - (a.x + a.w) > NODE_GAP + 20;
        const gx = hasRightColumn ? a.x + a.w + NODE_GAP / 2 : a.x - NODE_GAP / 2;
        const y1 = a.y + a.h + NODE_GAP / 2;
        const y2 = b.y - NODE_GAP / 2;
        points = corners([[ax, a.y + a.h], [ax, y1], [gx, y1], [gx, y2], [bx, y2], [bx, b.y]]);
      }
      dir = "down";
    } else if (b.x >= a.x + a.w && Math.abs(b.y - a.y) < 1) {
      const cy = a.y + a.h / 2;
      points = [[a.x + a.w, cy], [b.x, cy]];
      dir = "right";
    } else {
      continue;
    }
    result[e.id] = { id: e.id, points, d: roundedPath(points), dir };
  }
  for (const id of Object.keys(routed)) {
    const points = routed[id].points.map(([x, y]) => [y, x]);
    result[id] = { id, points, d: roundedPath(points), dir: "down" };
  }
  return result;
}
function routeColumns(layout, groups, edges) {
  const result = {};
  const cards = [];
  for (const g of groups) {
    const box = layout.groups[g.id];
    if (box) cards.push({ id: g.id, box });
  }
  if (cards.length === 0) return result;
  const colX = [...new Set(cards.map((c) => c.box.x))].sort((a, b) => a - b);
  const cols = colX.map((x) => ({ x, right: x, boxes: [] }));
  const colOf = /* @__PURE__ */ new Map();
  for (const { id, box } of cards) {
    const ci = colX.indexOf(box.x);
    colOf.set(id, ci);
    cols[ci].right = Math.max(cols[ci].right, box.x + box.w);
    cols[ci].boxes.push(box);
  }
  const channelOf = (j) => {
    if (j <= 0) return [cols[0].x - CHANNEL_EDGE, cols[0].x];
    if (j >= cols.length) return [cols[cols.length - 1].right, cols[cols.length - 1].right + CHANNEL_EDGE];
    return [cols[j - 1].right, cols[j].x];
  };
  const minY = cards.reduce((m, c) => Math.min(m, c.box.y), Infinity);
  const maxY = cards.reduce((m, c) => Math.max(m, c.box.y + c.box.h), -Infinity);
  const groupOfNode = /* @__PURE__ */ new Map();
  for (const g of groups) for (const n of g.nodes) groupOfNode.set(n.id, g.id);
  const portOf = (id, side) => {
    const nb = layout.nodes[id];
    const gid = nb ? groupOfNode.get(id) : id;
    const gb = gid ? layout.groups[gid] : void 0;
    if (!gid || !gb || !colOf.has(gid)) return void 0;
    const y = nb ? nb.y + nb.h / 2 : gb.y + gb.h / 2;
    return { key: `${side}|${gid}|${y}`, x: side === "o" ? gb.x + gb.w : gb.x, y, col: colOf.get(gid) };
  };
  const fanOut = /* @__PURE__ */ new Map();
  const wires = [];
  for (const edge of edges) {
    const src = portOf(edge.from, "o");
    const dst = portOf(edge.to, "i");
    if (!src || !dst) continue;
    fanOut.set(src.key, (fanOut.get(src.key) ?? 0) + 1);
    wires.push({ edge, src, dst, mode: dst.col === src.col + 1 ? "next" : dst.col > src.col ? "far" : "back", exit: "", entry: "" });
  }
  const lanes = /* @__PURE__ */ new Map();
  const inChannel = /* @__PURE__ */ new Map();
  const lane = (channel, key, w) => {
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
    if (w.mode === "next") {
      w.exit = w.entry = lane(w.dst.col, fanOut.get(w.src.key) > 1 ? w.src.key : w.dst.key, w);
    } else {
      w.exit = lane(w.src.col + 1, w.src.key, w);
      w.entry = lane(w.dst.col, w.dst.key, w);
    }
  }
  for (const [channel, list] of inChannel) {
    const [l, r] = channelOf(channel);
    const lo = l + LANE_MARGIN;
    const hi = r - LANE_MARGIN;
    list.sort((a, b) => a.ys / a.n - b.ys / b.n || (a.key < b.key ? -1 : 1));
    list.forEach((ln, i) => {
      ln.x = list.length === 1 || hi <= lo ? (l + r) / 2 : lo + (hi - lo) * i / (list.length - 1);
    });
  }
  const taken = [];
  for (const w of wires) {
    taken.push({ y: w.src.y, xa: w.src.x, xb: lanes.get(w.exit).x, src: w.src.key, dst: w.dst.key, track: false });
    taken.push({ y: w.dst.y, xa: lanes.get(w.entry).x, xb: w.dst.x, src: w.src.key, dst: w.dst.key, track: false });
  }
  const sameLine = (h, w) => h.src === w.src.key || h.dst === w.dst.key;
  const trackFree = (y, xa, xb, w) => {
    for (const h of taken) {
      if (Math.min(xb, h.xb) - Math.max(xa, h.xa) <= 0.5) continue;
      const dy = Math.abs(h.y - y);
      if (dy < 0.5 ? !sameLine(h, w) : h.track && dy < TRACK_GAP - 0.5) return false;
    }
    return true;
  };
  const spanOf = (w) => w.mode === "far" ? [w.src.col + 1, w.dst.col - 1] : [w.dst.col, w.src.col];
  const cardFree = (y, c0, c1) => {
    for (let c = c0; c <= c1; c++) for (const b of cols[c].boxes) if (y > b.y - CLEARANCE + 1e-6 && y < b.y + b.h + CLEARANCE - 1e-6) return false;
    return true;
  };
  const bandCache = /* @__PURE__ */ new Map();
  const bandsOf = (c0, c1) => {
    const id = `${c0}-${c1}`;
    let bands = bandCache.get(id);
    if (bands) return bands;
    const spans = [];
    for (let c = c0; c <= c1; c++) for (const b of cols[c].boxes) spans.push([b.y - CLEARANCE, b.y + b.h + CLEARANCE]);
    spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    bands = [];
    let end = spans[0][1];
    for (const [a, b] of spans) {
      if (a >= end) bands.push([end, a]);
      end = Math.max(end, b);
    }
    bandCache.set(id, bands);
    return bands;
  };
  const gap = (avg, [lo, hi]) => avg < lo ? lo - avg : avg > hi ? avg - hi : 0;
  const wanted = /* @__PURE__ */ new Map();
  for (const w of wires) {
    if (w.mode === "next") continue;
    const avg = (w.src.y + w.dst.y) / 2;
    let best;
    for (const b of bandsOf(...spanOf(w))) if (!best || gap(avg, b) < gap(avg, best)) best = b;
    if (best) wanted.set(`${best[0]}|${best[1]}`, (wanted.get(`${best[0]}|${best[1]}`) ?? 0) + 1);
  }
  const trackYs = /* @__PURE__ */ new Map();
  for (const w of wires) {
    if (w.mode === "next") continue;
    const [c0, c1] = spanOf(w);
    const avg = (w.src.y + w.dst.y) / 2;
    const near = (a, b) => Math.abs(a - avg) - Math.abs(b - avg) || a - b;
    const candidates = [];
    for (const h of taken) if (h.track && sameLine(h, w) && !candidates.includes(h.y)) candidates.push(h.y);
    for (const b of [...bandsOf(c0, c1)].sort((p, q) => gap(avg, p) - gap(avg, q) || p[0] - q[0])) {
      const n = Math.min(Math.floor((b[1] - b[0]) / TRACK_GAP) + 1, wanted.get(`${b[0]}|${b[1]}`) ?? 1);
      const slots = [];
      for (let i = 0; i < n; i++) slots.push((b[0] + b[1]) / 2 + TRACK_GAP * (i - (n - 1) / 2));
      candidates.push(...slots.sort(near));
    }
    const outer = [];
    for (let k = 0; k <= wires.length; k++) outer.push(minY - OUTSIDE_GAP - TRACK_GAP * k, maxY + OUTSIDE_GAP + TRACK_GAP * k);
    candidates.push(...outer.sort(near));
    const xo = lanes.get(w.exit).x;
    const xe = lanes.get(w.entry).x;
    const xa = Math.min(xo, xe);
    const xb = Math.max(xo, xe);
    const y = candidates.find((c) => cardFree(c, c0, c1) && trackFree(c, xa, xb, w)) ?? candidates[candidates.length - 1];
    trackYs.set(w.edge.id, y);
    taken.push({ y, xa, xb, src: w.src.key, dst: w.dst.key, track: true });
  }
  for (const w of wires) {
    const { src, dst } = w;
    const xo = lanes.get(w.exit).x;
    const xe = lanes.get(w.entry).x;
    const ty = trackYs.get(w.edge.id);
    const raw = w.mode === "next" ? [[src.x, src.y], [xo, src.y], [xo, dst.y], [dst.x, dst.y]] : [[src.x, src.y], [xo, src.y], [xo, ty], [xe, ty], [xe, dst.y], [dst.x, dst.y]];
    const points = corners(raw);
    result[w.edge.id] = { id: w.edge.id, points, d: roundedPath(points), dir: "right" };
  }
  return result;
}

// src/components/canvas/system-canvas.tsx
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
var insetFor = (w, minimap) => minimap && w >= MINIMAP_MIN_W ? TOP_INSET_MINIMAP : TOP_INSET;
var NO_KINDS = [];
var TOP_INSET = 64;
var TOP_INSET_MINIMAP = 150;
var MINIMAP_MIN_W = 600;
var CORNER_W = 200;
var initialHidden = (kinds) => new Set(kinds.filter((k) => k.hidden).map((k) => k.id));
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
  label = "System map",
  className
}) {
  const reduced = usePrefersReducedMotion();
  const viewportRef = useRef8(null);
  const worldRef = useRef8(null);
  const view = useRef8({ x: 0, y: 0, k: 1 });
  const target = useRef8(null);
  const raf = useRef8(0);
  const size = useRef8({ w: 0, h: 0 });
  const touched = useRef8(false);
  const zoomLabelRef = useRef8(null);
  const miniRef = useRef8(null);
  const [labelsOn, setLabelsOn] = useState6(true);
  const [hoverId, setHoverId] = useState6(null);
  const [viewport, setViewport] = useState6({ w: 0, h: 0 });
  const kindList = edgeKinds ?? NO_KINDS;
  const kindSig = kindList.map((k) => k.id).join("|");
  const [hiddenState, setHiddenState] = useState6(() => ({
    sig: kindSig,
    set: initialHidden(kindList)
  }));
  let hiddenKinds = hiddenState.set;
  if (hiddenState.sig !== kindSig) {
    const next = { sig: kindSig, set: initialHidden(kindList) };
    setHiddenState(next);
    hiddenKinds = next.set;
  }
  const toggleKind = useCallback3((id) => {
    setHiddenState((s) => {
      const set = new Set(s.set);
      if (!set.delete(id)) set.add(id);
      return { sig: s.sig, set };
    });
  }, []);
  const visibleEdges = useMemo2(() => edges.filter((e) => !e.kind || !hiddenKinds.has(e.kind)), [edges, hiddenKinds]);
  const lineOf = useMemo2(() => new Map(kindList.map((k) => [k.id, k.line ?? "solid"])), [kindList]);
  const [internalFollow, setInternalFollow] = useState6(false);
  const followOn = follow ?? internalFollow;
  const followRef = useRef8(followOn);
  const followProps = useRef8({ controlled: follow !== void 0, onFollowChange });
  const setFollow = useCallback3((on) => {
    if (!followProps.current.controlled) setInternalFollow(on);
    followProps.current.onFollowChange?.(on);
  }, []);
  const markMoved = useCallback3(() => {
    touched.current = true;
    if (followRef.current) {
      followRef.current = false;
      setFollow(false);
    }
  }, [setFollow]);
  const sig = groups.map((g) => `${g.id}:${g.column}:${g.band ?? ""}:${g.nodes.map((n) => n.id).join(",")}`).join("|");
  const visSig = visibleEdges.map((e) => `${e.id}:${e.from}:${e.to}`).join("|");
  const cands = useMemo2(() => layoutCandidates(groups, visibleEdges, layoutMode), [sig, visSig, layoutMode]);
  const [picked, setPicked] = useState6(() => ({ layout: chooseLayout(cands, { w: 0, h: 0 }), w: 0, h: 0 }));
  const layout = picked.layout;
  const latest = useRef8({
    cands,
    minimap,
    groups,
    layout,
    vis: visibleEdges,
    mode: layoutMode
  });
  useLayoutEffect3(() => {
    followRef.current = followOn;
    followProps.current = { controlled: follow !== void 0, onFollowChange };
    latest.current = { cands, minimap, groups, layout, vis: visibleEdges, mode: layoutMode };
  });
  const apply = useCallback3((v) => {
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
  const stop = useCallback3(() => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    target.current = null;
  }, []);
  const go = useCallback3(
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
  const fitView = useCallback3(() => {
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
  const doFit = useCallback3(
    (animate) => {
      if (size.current.w <= 0 || size.current.h <= 0) return;
      go(fitView(), animate);
    },
    [fitView, go]
  );
  const relayout = useCallback3(
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
  const layoutRaf = useRef8(0);
  const settleTimer = useRef8(void 0);
  const syncViewport = useCallback3(() => {
    const { w, h } = size.current;
    setViewport((old) => old.w === w && old.h === h ? old : { w, h });
  }, []);
  useLayoutEffect3(() => {
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
  useEffect7(() => {
    if (followOn) syncViewport();
  }, [followOn, syncViewport]);
  const firstData = useRef8(true);
  useLayoutEffect3(() => {
    if (firstData.current) {
      firstData.current = false;
      return;
    }
    relayout(true);
  }, [sig, visSig, layoutMode, relayout]);
  const prevLayout = useRef8(null);
  const fitted = useRef8(false);
  const relayoutTimer = useRef8(void 0);
  useLayoutEffect3(() => {
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
  useEffect7(() => () => clearTimeout(relayoutTimer.current), []);
  useEffect7(() => () => cancelAnimationFrame(raf.current), []);
  const zoomBy = useCallback3(
    (factor, animate) => {
      markMoved();
      const base = target.current ?? view.current;
      const { w, h } = size.current;
      go(zoomAround(base, base.k * factor, w / 2, h / 2), animate);
    },
    [go, markMoved]
  );
  useEffect7(() => {
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
  const pointers = useRef8(/* @__PURE__ */ new Map());
  const gesture = useRef8({
    mode: "none",
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    pinchDist: 1,
    pinchMid: { x: 0, y: 0 },
    pinchView: { x: 0, y: 0, k: 1 }
  });
  const dragged = useRef8(false);
  const lastTap = useRef8(null);
  const lastDouble = useRef8(0);
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
      const [rest] = [...pointers.current.values()];
      g.mode = "pan";
      g.lastX = rest.x;
      g.lastY = rest.y;
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
  const prevSelected = useRef8(selected);
  useEffect7(() => {
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
    if (e.altKey || e.metaKey) return;
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
  const columnIndex = useMemo2(() => {
    const order = [...new Set(groups.map((g) => g.column))].sort((a, b) => a - b);
    return new Map(order.map((c, i) => [c, i]));
  }, [sig]);
  const lookup = useMemo2(() => {
    const nodes = /* @__PURE__ */ new Map();
    const grps = /* @__PURE__ */ new Map();
    for (const g of groups) {
      grps.set(g.id, g);
      for (const n of g.nodes) nodes.set(n.id, { group: g, node: n });
    }
    return { nodes, grps };
  }, [groups]);
  const headerViews = useMemo2(
    () => layout.headers.flatMap((h) => {
      const text = layout.mode === "bands" ? bands?.[h.index] ?? columns?.[h.index] : columns?.[h.index];
      return text ? [{ key: `${layout.mode}:${h.index}`, x: h.x, y: h.y, text }] : [];
    }),
    [layout, bands, columns]
  );
  const routes = useMemo2(() => routeEdges(layout, groups, visibleEdges), [layout, visSig]);
  const { edgeViews, ports } = useMemo2(() => {
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
  const focus = useMemo2(() => {
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
  const fly = useCallback3((v) => go(v, true, FOLLOW_MS), [go]);
  const { step } = useFollow({
    on: followOn,
    groups,
    layout,
    size: viewport,
    fit: fitView,
    inset: TOP_INSET,
    fly
  });
  const canFollow = useMemo2(() => groups.some((g) => g.nodes.some((n) => n.active !== void 0)), [groups]);
  const jumpTo = useCallback3(
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
  return /* @__PURE__ */ jsxs10(
    "div",
    {
      ref: viewportRef,
      role: "application",
      "aria-label": label,
      "aria-roledescription": "canvas",
      tabIndex: 0,
      className: cn("nish-canvas", className),
      style: { height },
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
        /* @__PURE__ */ jsxs10("div", { ref: worldRef, className: "nish-canvas-world", style: { width: layout.width, height: layout.height }, children: [
          headerViews.map((t) => /* @__PURE__ */ jsx11("div", { className: "nish-canvas-coltitle", style: layout.mode === "bands" ? { left: t.x, top: t.y, lineHeight: 1, transform: "translateY(-100%)" } : { left: t.x, top: t.y }, children: t.text }, t.key)),
          /* @__PURE__ */ jsx11("svg", { className: "nish-canvas-edges", width: layout.width, height: layout.height, "aria-hidden": "true", focusable: "false", children: edgeViews.map(({ edge, route, line, mid, hue, active }) => {
            const hot = focus?.hot.has(edge.id) ?? false;
            const end = route.points[route.points.length - 1];
            const [ex, ey] = end;
            const arrow = route.dir === "down" ? `M${ex} ${ey}L${ex - 3.5} ${ey - 8}L${ex + 3.5} ${ey - 8}Z` : `M${ex} ${ey}L${ex - 8} ${ey - 3.5}L${ex - 8} ${ey + 3.5}Z`;
            return /* @__PURE__ */ jsxs10("g", { style: hueStyle(hue), className: "nish-canvas-edge", "data-active": active || void 0, "data-line": line, "data-hot": hot || void 0, children: [
              /* @__PURE__ */ jsx11("path", { className: "nish-canvas-edge-line", d: route.d, fill: "none" }),
              /* @__PURE__ */ jsx11("path", { className: "nish-canvas-arrow", d: arrow }),
              active ? /* @__PURE__ */ jsx11("circle", { className: "nish-canvas-dot", r: "3.5", style: { offsetPath: `path("${route.d}")` } }) : null,
              edge.label && (labelsOn || hot) ? /* @__PURE__ */ jsx11("text", { className: "nish-canvas-edge-label", x: mid.x, y: mid.y - 6, textAnchor: "middle", children: edge.label }) : null
            ] }, edge.id);
          }) }, `e${layoutKey}`),
          /* @__PURE__ */ jsx11("svg", { className: "nish-canvas-ports", width: layout.width, height: layout.height, "aria-hidden": "true", focusable: "false", children: ports.map(([key, p]) => /* @__PURE__ */ jsx11("circle", { className: "nish-canvas-port", cx: p.x, cy: p.y, r: 3, style: hueStyle(p.hue), "data-active": p.active || void 0 }, key)) }, `p${layoutKey}`),
          groups.map((g) => {
            const box = layout.groups[g.id];
            if (!box) return null;
            const live = g.nodes.some((n) => n.active);
            const delay = (columnIndex.get(g.column) ?? 0) * 80;
            return /* @__PURE__ */ jsxs10(Fragment4, { children: [
              /* @__PURE__ */ jsxs10(
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
                    /* @__PURE__ */ jsx11("span", { className: "nish-canvas-band", "aria-hidden": "true" }),
                    /* @__PURE__ */ jsxs10("button", { type: "button", className: "nish-canvas-head", "data-canvas-id": g.id, "aria-pressed": selected === g.id, onClick: () => onSelect?.(g.id, "group"), children: [
                      /* @__PURE__ */ jsxs10("span", { className: "nish-canvas-headtext", children: [
                        /* @__PURE__ */ jsx11("span", { className: "nish-canvas-title", children: g.title }),
                        g.subtitle ? /* @__PURE__ */ jsx11("span", { className: "nish-canvas-subtitle", children: g.subtitle }) : null
                      ] }),
                      g.badge ? /* @__PURE__ */ jsx11("span", { className: "nish-canvas-badge", children: g.badge }) : null
                    ] })
                  ]
                }
              ),
              g.nodes.map((n) => {
                const nb = layout.nodes[n.id];
                if (!nb) return null;
                return /* @__PURE__ */ jsx11(
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
        /* @__PURE__ */ jsx11(EdgeLegend, { kinds: kindList, hidden: hiddenKinds, onToggle: toggleKind }),
        minimap ? /* @__PURE__ */ jsx11(Minimap, { layout, groups, handleRef: miniRef, onJump: jumpTo }) : null,
        /* @__PURE__ */ jsx11(FollowCaption, { step }),
        /* @__PURE__ */ jsxs10("div", { "data-canvas-ui": true, className: "nish-canvas-controls", children: [
          /* @__PURE__ */ jsx11("span", { ref: zoomLabelRef, className: "nish-canvas-zoom", "aria-hidden": "true", children: "100%" }),
          /* @__PURE__ */ jsx11(IconButton, { label: "Zoom out", variant: "ghost", className: "size-11", onClick: () => zoomBy(1 / ZOOM_STEP, true), children: /* @__PURE__ */ jsx11(MinusIcon, {}) }),
          /* @__PURE__ */ jsx11(IconButton, { label: "Zoom in", variant: "ghost", className: "size-11", onClick: () => zoomBy(ZOOM_STEP, true), children: /* @__PURE__ */ jsx11(PlusIcon, {}) }),
          /* @__PURE__ */ jsx11(
            IconButton,
            {
              label: "Fit to screen",
              variant: "ghost",
              className: "size-11",
              onClick: () => {
                touched.current = false;
                doFit(true);
              },
              children: /* @__PURE__ */ jsx11(FitIcon, {})
            }
          ),
          canFollow ? /* @__PURE__ */ jsx11(IconButton, { label: "Follow activity", variant: "ghost", className: "size-11", active: followOn, "aria-pressed": followOn, onClick: () => setFollow(!followOn), children: /* @__PURE__ */ jsx11(FollowIcon, {}) }) : null
        ] })
      ]
    }
  );
}
export {
  SystemCanvas,
  layoutSystem,
  pickLayout,
  routeEdges
};
//# sourceMappingURL=system-canvas.js.map