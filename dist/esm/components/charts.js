"use client";

// src/components/charts.tsx
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { CHART, seriesColor, tooltipStyle } from "../chart.js";
import { isRtl } from "./client.js";
import { chartNumber, decimateMinMax, mergeRefs } from "./data-classes.js";
import { Skeleton } from "./feedback.js";
import { useMediaQuery } from "./hooks.js";
import { useNishContext, useStrings } from "./provider.js";
import { DISPLAY_STRINGS } from "./strings.js";
import { jsx, jsxs } from "react/jsx-runtime";
function toneColor(tone, index) {
  if (!tone) return seriesColor(index);
  if (tone === "ok") return "var(--nish-ok-fill)";
  if (tone === "loss") return "var(--nish-loss-fill)";
  if (tone === "accent") return "var(--nish-accent)";
  return `var(--nish-${tone})`;
}
function useWidth() {
  const [el, setEl] = useState(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!el) {
      setWidth(0);
      return;
    }
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, width, el];
}
function useChartRtl(el) {
  const { dir } = useNishContext();
  const [measured, setMeasured] = useState(false);
  useEffect(() => {
    setMeasured(isRtl(el));
  }, [el, dir]);
  return dir ? dir === "rtl" : measured;
}
function xPos(x, xMin, xMax, padLeft, plotW, rtl) {
  const f = (x - xMin) / (xMax - xMin);
  return padLeft + (rtl ? 1 - f : f) * plotW;
}
function ticksBetween(min, max, count) {
  const n = Math.max(2, Math.floor(count));
  return Array.from({ length: n }, (_, i) => min + (max - min) * i / (n - 1));
}
var PAD_TOP = 10;
var PAD_BOTTOM = 24;
var PAD_RIGHT = 12;
function LineChart({
  data,
  series,
  height = 200,
  area,
  yFormat,
  xFormat,
  yTicks = 4,
  xTicks = 4,
  baseline,
  tone,
  label,
  loading,
  empty,
  locale,
  className,
  ref,
  ...rest
}) {
  const t = useStrings(DISPLAY_STRINGS);
  const config = useNishContext();
  const loc = locale ?? config.locale ?? "en-US";
  const yFmt = yFormat ?? ((v) => chartNumber(v, loc));
  const xFmt = xFormat ?? ((v) => chartNumber(v, loc));
  const [wrapRef, width, wrapEl] = useWidth();
  const rtl = useChartRtl(wrapEl);
  const gradId = `nish-area-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [active, setActive] = useState(null);
  const fromKey = useRef(false);
  const lines = useMemo(() => series ?? (data ? [{ label, tone, points: data }] : []), [series, data, label, tone]);
  const xs = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    for (const s of lines) for (const p of s.points) if (p.y != null && Number.isFinite(p.y) && Number.isFinite(p.x)) set.add(p.x);
    return [...set].sort((a, b) => a - b);
  }, [lines]);
  const lookup = useMemo(
    () => lines.map((s) => new Map(s.points.filter((p) => p.y != null && Number.isFinite(p.y)).map((p) => [p.x, p.y]))),
    [lines]
  );
  const scale = useMemo(() => {
    if (!xs.length) return null;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const s of lines) for (const p of s.points) if (p.y != null && Number.isFinite(p.y)) {
      yMin = Math.min(yMin, p.y);
      yMax = Math.max(yMax, p.y);
    }
    if (baseline != null && Number.isFinite(baseline)) {
      yMin = Math.min(yMin, baseline);
      yMax = Math.max(yMax, baseline);
    }
    if (yMin === yMax) {
      const d = Math.abs(yMin) * 0.05 || 1;
      yMin -= d;
      yMax += d;
    } else {
      const d = (yMax - yMin) * 0.06;
      yMin -= d;
      yMax += d;
    }
    const xMin = xs[0];
    const xMax = xs[xs.length - 1];
    return { xMin, xMax: xMax === xMin ? xMin + 1 : xMax, yMin, yMax };
  }, [lines, xs, baseline]);
  const runs = useMemo(
    () => lines.map((s) => {
      const out = [];
      let cur = [];
      for (const p of [...s.points].sort((a, b) => a.x - b.x)) {
        if (p.y == null || !Number.isFinite(p.y) || !Number.isFinite(p.x)) {
          if (cur.length) out.push(cur);
          cur = [];
        } else cur.push({ x: p.x, y: p.y });
      }
      if (cur.length) out.push(cur);
      return out;
    }),
    [lines]
  );
  useEffect(() => {
    if (active == null) return;
    const onDown = (e) => {
      if (wrapEl && !wrapEl.contains(e.target)) setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active, wrapEl]);
  const yLabels = scale ? ticksBetween(scale.yMin, scale.yMax, yTicks).map((v) => ({ v, text: yFmt(v) })) : [];
  const padLeft = Math.ceil(Math.max(0, ...yLabels.map((l) => l.text.length)) * 6.6) + 10;
  const plotW = Math.max(0, width - padLeft - PAD_RIGHT);
  const plotX = rtl ? PAD_RIGHT : padLeft;
  const plotH = Math.max(0, height - PAD_TOP - PAD_BOTTOM);
  const paths = useMemo(() => {
    if (!scale) return [];
    const sy2 = (y) => PAD_TOP + (1 - (y - scale.yMin) / (scale.yMax - scale.yMin)) * plotH;
    return runs.map(
      (segs) => segs.map(
        (seg) => decimateMinMax(seg, scale.xMin, scale.xMax, plotW).map(
          (p) => `${xPos(p.x, scale.xMin, scale.xMax, plotX, plotW, rtl).toFixed(1)},${sy2(p.y).toFixed(1)}`
        )
      )
    );
  }, [runs, scale, plotW, plotH, plotX, rtl]);
  if (loading) return /* @__PURE__ */ jsx(Skeleton, { className: cn("w-full rounded-xl", className), style: { height } });
  if (!scale) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ...rest,
        ref,
        role: "img",
        "aria-label": t.noDataNamed(label),
        className: cn("flex w-full items-center justify-center text-sm text-th-hi3", className),
        style: { height, ...rest.style },
        children: empty ?? t.noData
      }
    );
  }
  const sx = (x) => xPos(x, scale.xMin, scale.xMax, plotX, plotW, rtl);
  const sy = (y) => PAD_TOP + (1 - (y - scale.yMin) / (scale.yMax - scale.yMin)) * plotH;
  const bottom = PAD_TOP + plotH;
  const xLabels = ticksBetween(scale.xMin, scale.xMax, Math.min(xTicks, Math.max(2, Math.floor(plotW / 72))));
  const moveTo = (clientX, el) => {
    const rect = el.getBoundingClientRect();
    const f = (clientX - rect.left - plotX) / (plotW || 1);
    const x = scale.xMin + (rtl ? 1 - f : f) * (scale.xMax - scale.xMin);
    let lo = 0;
    let hi = xs.length - 1;
    while (hi - lo > 1) {
      const mid = lo + hi >> 1;
      if (xs[mid] < x) lo = mid;
      else hi = mid;
    }
    setActive(Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi);
  };
  const onPointer = (e) => {
    fromKey.current = false;
    moveTo(e.clientX, e.currentTarget);
  };
  const onKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      fromKey.current = true;
      const dir = (e.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      setActive((a) => a == null ? dir > 0 ? 0 : xs.length - 1 : Math.min(xs.length - 1, Math.max(0, a + dir)));
    } else if (e.key === "Escape") setActive(null);
  };
  const ax = active != null ? xs[active] : null;
  const cx = ax != null ? sx(ax) : 0;
  const tipRows = ax != null ? lines.map((s, i) => ({ s, i, y: lookup[i].get(ax) })).filter((r) => r.y != null) : [];
  const tipRight = cx < width / 2;
  const tableXs = xs.slice(0, 200);
  return /* @__PURE__ */ jsxs("div", { ...rest, ref: mergeRefs(wrapRef, ref), className: cn("relative w-full select-none", className), style: { height, ...rest.style }, children: [
    width > 0 && /* @__PURE__ */ jsxs(
      "svg",
      {
        width,
        height,
        role: "img",
        tabIndex: 0,
        "aria-label": label,
        className: "block rounded-md outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight] focus-visible:ring-2 focus-visible:ring-th-accent",
        style: { touchAction: "pan-y" },
        onPointerDown: onPointer,
        onPointerMove: onPointer,
        onPointerLeave: (e) => {
          if (e.pointerType === "mouse") setActive(null);
        },
        onKeyDown: onKey,
        onBlur: () => {
          if (fromKey.current) setActive(null);
        },
        children: [
          area && lines[0] && /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: toneColor(lines[0].tone, 0), stopOpacity: 0.2 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: toneColor(lines[0].tone, 0), stopOpacity: 0 })
          ] }) }),
          yLabels.map((l, i) => /* @__PURE__ */ jsxs("g", { children: [
            /* @__PURE__ */ jsx("line", { x1: plotX, x2: plotX + plotW, y1: sy(l.v), y2: sy(l.v), stroke: CHART.grid, strokeWidth: 1 }),
            /* @__PURE__ */ jsx(
              "text",
              {
                x: rtl ? plotX + plotW + 6 : plotX - 6,
                y: sy(l.v),
                textAnchor: rtl ? "start" : "end",
                dominantBaseline: "middle",
                fontSize: 11,
                fill: CHART.text,
                style: { fontVariantNumeric: "tabular-nums" },
                children: l.text
              }
            )
          ] }, i)),
          xLabels.map((v, i) => /* @__PURE__ */ jsx(
            "text",
            {
              x: sx(v),
              y: height - 6,
              textAnchor: i === 0 ? rtl ? "end" : "start" : i === xLabels.length - 1 ? rtl ? "start" : "end" : "middle",
              fontSize: 11,
              fill: CHART.text,
              style: { fontVariantNumeric: "tabular-nums" },
              children: xFmt(v)
            },
            i
          )),
          baseline != null && Number.isFinite(baseline) && /* @__PURE__ */ jsx("line", { x1: plotX, x2: plotX + plotW, y1: sy(baseline), y2: sy(baseline), stroke: CHART.zero, strokeWidth: 1, strokeDasharray: "4 4" }),
          area && paths[0]?.map((seg, i) => /* @__PURE__ */ jsx("polygon", { points: `${seg[0].split(",")[0]},${bottom} ${seg.join(" ")} ${seg[seg.length - 1].split(",")[0]},${bottom}`, fill: `url(#${gradId})` }, i)),
          paths.map(
            (segs, si) => segs.map(
              (seg, i) => seg.length === 1 ? /* @__PURE__ */ jsx("circle", { cx: seg[0].split(",")[0], cy: seg[0].split(",")[1], r: 2, fill: toneColor(lines[si].tone, si) }, `${si}-${i}`) : /* @__PURE__ */ jsx("polyline", { points: seg.join(" "), fill: "none", stroke: toneColor(lines[si].tone, si), strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }, `${si}-${i}`)
            )
          ),
          ax != null && /* @__PURE__ */ jsxs("g", { pointerEvents: "none", children: [
            /* @__PURE__ */ jsx("line", { x1: cx, x2: cx, y1: PAD_TOP, y2: bottom, stroke: CHART.axis, strokeWidth: 1 }),
            tipRows.map((r) => /* @__PURE__ */ jsx("circle", { cx, cy: sy(r.y), r: 4, fill: toneColor(r.s.tone, r.i), stroke: "var(--nish-surface)", strokeWidth: 2 }, r.i))
          ] })
        ]
      }
    ),
    ax != null && width > 0 && /* @__PURE__ */ jsxs(
      "div",
      {
        ref: (el) => {
          if (!el) return;
          const w = el.offsetWidth;
          if (tipRight) el.style.left = `${Math.max(0, Math.min(cx + 10, width - w))}px`;
          else el.style.right = `${Math.max(0, Math.min(width - cx + 10, width - w))}px`;
        },
        className: "pointer-events-none absolute top-1 z-[var(--nish-z-tooltip,10)] overflow-hidden whitespace-nowrap px-2 py-1 tabular-nums",
        style: { ...tooltipStyle, maxWidth: "calc(100% - 8px)", ...tipRight ? { left: cx + 10 } : { right: width - cx + 10 } },
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-th-hi3", children: xFmt(ax) }),
          tipRows.map((r) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "inline-block size-2 rounded-full", style: { background: toneColor(r.s.tone, r.i) } }),
            lines.length > 1 && /* @__PURE__ */ jsx("span", { className: "text-th-hi3", children: r.s.label }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: yFmt(r.y) })
          ] }, r.i))
        ]
      }
    ),
    /* @__PURE__ */ jsxs("table", { className: "sr-only", children: [
      /* @__PURE__ */ jsx("caption", { children: label }),
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "col", children: "x" }),
        lines.map((s, i) => /* @__PURE__ */ jsx("th", { scope: "col", children: s.label }, i))
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: tableXs.map((x) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "row", children: xFmt(x) }),
        lines.map((_, i) => /* @__PURE__ */ jsx("td", { children: lookup[i].has(x) ? yFmt(lookup[i].get(x)) : "" }, i))
      ] }, x)) })
    ] })
  ] });
}
var BAR_TOP = 18;
var BAR_BOTTOM = 22;
function BarChart({
  data,
  height = 140,
  tone = "chart-1",
  valueFormat,
  showValues = "auto",
  xTicks = "ends",
  label,
  empty,
  locale,
  className,
  ref,
  ...rest
}) {
  const t = useStrings(DISPLAY_STRINGS);
  const config = useNishContext();
  const loc = locale ?? config.locale ?? "en-US";
  const fmt = valueFormat ?? ((v) => chartNumber(v, loc));
  const [wrapRef, width, wrapEl] = useWidth();
  const rtl = useChartRtl(wrapEl);
  const coarse = useMediaQuery("(pointer: coarse)");
  const [pickedBar, setSelected] = useState(null);
  const selected = pickedBar != null && pickedBar < data.length ? pickedBar : null;
  const color = toneColor(tone, 0);
  const pick = useCallback(
    (clientX, el) => {
      const rect = el.getBoundingClientRect();
      const i = Math.floor((clientX - rect.left) / (rect.width || 1) * data.length);
      const clamped = Math.min(data.length - 1, Math.max(0, i));
      setSelected(rtl ? data.length - 1 - clamped : clamped);
    },
    [data.length, rtl]
  );
  if (!data.length) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ...rest,
        ref,
        role: "img",
        "aria-label": t.noDataNamed(label),
        className: cn("flex w-full items-center justify-center text-sm text-th-hi3", className),
        style: { height, ...rest.style },
        children: empty ?? t.noData
      }
    );
  }
  const values = data.map((d) => Number.isFinite(d.value) ? d.value : 0);
  const vMax = Math.max(0, ...values);
  const vMin = Math.min(0, ...values);
  const span = vMax - vMin || 1;
  const plotH = Math.max(0, height - BAR_TOP - BAR_BOTTOM);
  const zeroY = BAR_TOP + vMax / span * plotH;
  const band = width / data.length;
  const barW = Math.max(1, band * 0.72);
  const printValues = showValues === "always" || coarse;
  const slot = (i) => rtl ? data.length - 1 - i : i;
  const onKey = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const dir = (e.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
      setSelected(() => selected == null ? dir > 0 ? 0 : data.length - 1 : Math.min(data.length - 1, Math.max(0, selected + dir)));
    } else if (e.key === "Escape") setSelected(null);
  };
  return /* @__PURE__ */ jsxs("div", { ...rest, ref: mergeRefs(wrapRef, ref), className: cn("w-full", className), children: [
    width > 0 && /* @__PURE__ */ jsxs(
      "svg",
      {
        width,
        height,
        role: "img",
        tabIndex: 0,
        "aria-label": label,
        className: "block rounded-md outline-none forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-solid forced-colors:focus-visible:outline-[Highlight] focus-visible:ring-2 focus-visible:ring-th-accent",
        style: { touchAction: "pan-y" },
        onPointerDown: (e) => pick(e.clientX, e.currentTarget),
        onPointerMove: (e) => {
          if (e.pointerType === "mouse" || e.buttons) pick(e.clientX, e.currentTarget);
        },
        onPointerLeave: (e) => {
          if (e.pointerType === "mouse") setSelected(null);
        },
        onKeyDown: onKey,
        children: [
          /* @__PURE__ */ jsx("line", { x1: 0, x2: width, y1: zeroY, y2: zeroY, stroke: CHART.grid, strokeWidth: 1 }),
          values.map((v, i) => {
            const h = Math.max(2, Math.abs(v) / span * plotH);
            const y = v < 0 ? zeroY : zeroY - h;
            const x = slot(i) * band + (band - barW) / 2;
            const isSel = selected === i;
            const showVal = isSel || printValues && (showValues === "always" || band >= 26);
            return /* @__PURE__ */ jsxs("g", { children: [
              /* @__PURE__ */ jsx("rect", { x, y, width: barW, height: h, rx: 2, fill: color, opacity: selected == null || isSel ? 1 : 0.55 }),
              showVal && /* @__PURE__ */ jsx("text", { x: x + barW / 2, y: v < 0 ? y + h + 11 : Math.max(11, y - 4), textAnchor: "middle", fontSize: 11, fill: CHART.text, style: { fontVariantNumeric: "tabular-nums" }, children: fmt(v) })
            ] }, i);
          }),
          data.map((d, i) => {
            const show = xTicks === "all" || i === 0 || i === data.length - 1;
            if (!show) return null;
            const atLeft = slot(i) === 0;
            const anchor = xTicks === "all" ? "middle" : atLeft ? "start" : "end";
            const x = xTicks === "all" ? slot(i) * band + band / 2 : atLeft ? 0 : width;
            return /* @__PURE__ */ jsx("text", { x, y: height - 6, textAnchor: anchor, fontSize: 11, fill: CHART.text, children: d.label }, i);
          })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-1 min-h-5 text-sm tabular-nums text-th-hi2", "aria-live": "polite", children: selected != null ? `${data[selected].label}: ${fmt(values[selected])}` : "" }),
    /* @__PURE__ */ jsxs("table", { className: "sr-only", children: [
      /* @__PURE__ */ jsx("caption", { children: label }),
      /* @__PURE__ */ jsx("tbody", { children: data.map((d, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { scope: "row", children: d.label }),
        /* @__PURE__ */ jsx("td", { children: fmt(values[i]) })
      ] }, i)) })
    ] })
  ] });
}
function RangeBar({ min, max, low, high, current, label, locale, className, ref, ...rest }) {
  const config = useNishContext();
  const loc = locale ?? config.locale ?? "en-US";
  const num = (v) => chartNumber(v, loc);
  const span = max - min;
  const pos = (v) => span > 0 ? Math.min(100, Math.max(0, (v - min) / span * 100)) : 0;
  const a = pos(Math.min(low, high));
  const b = pos(Math.max(low, high));
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ...rest,
      ref,
      role: "img",
      "aria-label": label ?? `Range ${num(low)} to ${num(high)}${current != null ? `, current ${num(current)}` : ""}, within ${num(min)} to ${num(max)}`,
      className: cn("relative h-1.5 w-full rounded-full bg-th-line forced-colors:bg-[color:GrayText]", className),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-y-0 rounded-full bg-gradient-to-r from-[var(--nish-chart-2)] to-[var(--nish-chart-5)] rtl:bg-gradient-to-l forced-colors:bg-none forced-colors:bg-[color:Highlight]",
            style: { insetInlineStart: `${a}%`, width: `${Math.max(b - a, 1)}%` }
          }
        ),
        current != null && /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-th-surface bg-th-hi rtl:translate-x-1/2 forced-colors:bg-[color:CanvasText]",
            style: { insetInlineStart: `${pos(current)}%` }
          }
        )
      ]
    }
  );
}
export {
  BarChart,
  LineChart,
  RangeBar
};
