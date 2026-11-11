// src/components/data-classes.ts
import { shared } from "../runtime.js";
var ALIGN = { left: "text-start", center: "text-center", right: "text-end" };
var ROW_TONE = {
  ok: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-ok-fill)] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_var(--nish-ok-fill)] rtl:[&>th:first-child]:shadow-[inset_-3px_0_0_var(--nish-ok-fill)] forced-colors:[&>td:first-child]:border-s-[3px] forced-colors:[&>td:first-child]:border-s-[color:Highlight]",
  warn: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-warn-fill)] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_var(--nish-warn-fill)] rtl:[&>th:first-child]:shadow-[inset_-3px_0_0_var(--nish-warn-fill)] forced-colors:[&>td:first-child]:border-s-[3px] forced-colors:[&>td:first-child]:border-s-[color:Highlight]",
  loss: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] [&>th:first-child]:shadow-[inset_3px_0_0_var(--nish-loss-fill)] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_var(--nish-loss-fill)] rtl:[&>th:first-child]:shadow-[inset_-3px_0_0_var(--nish-loss-fill)] forced-colors:[&>td:first-child]:border-s-[3px] forced-colors:[&>td:first-child]:border-s-[color:Highlight]"
};
var WRAP = "relative overflow-auto rounded-xl border border-th-line bg-th-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent";
var STICKY = "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[var(--nish-z-sticky,1)] [&_thead_th]:bg-th-surface";
var TABLE = "w-full border-collapse text-sm tabular-nums text-th-hi2";
var ZEBRA = "[&_tbody>tr:nth-child(even)]:bg-th-elevated/50";
var TH = "whitespace-nowrap border-b border-th-line px-3 text-start align-middle text-xs font-medium uppercase tracking-wider text-th-hi3";
var TD = "px-3 align-middle";
var PAD = { normal: "py-2.5", dense: "py-1.5" };
var TR = "border-b border-th-line last:border-b-0";
var TR_INTERACTIVE = "cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated";
var NUMERIC = "whitespace-nowrap text-end tabular-nums";
var STICKY_COL = "[&_thead_tr]:bg-th-surface [&_tbody_tr]:bg-th-surface [&_thead_tr>:first-child]:z-[calc(var(--nish-z-sticky,1)+10)] [&_tr>:first-child]:sticky [&_tr>:first-child]:start-0 [&_tr>:first-child]:z-[calc(var(--nish-z-sticky,1)+9)] [&_tr>:first-child]:bg-inherit [&_tr>:first-child]:after:pointer-events-none [&_tr>:first-child]:after:absolute [&_tr>:first-child]:after:inset-y-0 [&_tr>:first-child]:after:start-full [&_tr>:first-child]:after:w-2.5 [&_tr>:first-child]:after:bg-gradient-to-r rtl:[&_tr>:first-child]:after:bg-gradient-to-l [&_tr>:first-child]:after:from-[color-mix(in_srgb,var(--nish-hi)_14%,transparent)] [&_tr>:first-child]:after:to-transparent [&_tr>:first-child]:after:opacity-0 [&_tr>:first-child]:after:transition-opacity ltr:[&[data-at-start=false]_tr>:first-child]:after:opacity-100 rtl:[&[data-at-end=false]_tr>:first-child]:after:opacity-100";
var tableClass = {
  /** The scroll box around the table. */
  wrap: WRAP,
  /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
  sticky: STICKY,
  /** The <table>. */
  table: TABLE,
  /** Add to table for striped rows. */
  zebra: ZEBRA,
  /** A header cell (add padY.normal or padY.dense). */
  th: TH,
  /** A body cell (add padY.normal or padY.dense). */
  td: TD,
  /** Vertical cell padding: normal or dense. */
  padY: PAD,
  /** A body row. */
  tr: TR,
  /** Add to tr for a clickable row. */
  trInteractive: TR_INTERACTIVE,
  /** Add to th or td for a right-aligned number column. */
  numeric: NUMERIC,
  /** Add to tr for a status edge. */
  tone: ROW_TONE
};
var tableInternals = { ALIGN, STICKY_COL, WRAP, STICKY, TABLE, ZEBRA, TH, TD, PAD, TR, TR_INTERACTIVE };
function mergeRefs(...refs) {
  return (node) => {
    const cleanups = [];
    const withCleanup = /* @__PURE__ */ new Set();
    for (const ref of refs) {
      if (typeof ref === "function") {
        const out = ref(node);
        if (typeof out === "function") {
          cleanups.push(out);
          withCleanup.add(ref);
        }
      } else if (ref) ref.current = node;
    }
    if (cleanups.length) {
      return () => {
        for (const ref of refs) {
          if (typeof ref === "function") {
            if (!withCleanup.has(ref)) ref(null);
          } else if (ref) ref.current = null;
        }
        cleanups.forEach((fn) => fn());
      };
    }
  };
}
var COLLATOR = /* @__PURE__ */ new Intl.Collator(void 0, { numeric: true, sensitivity: "base" });
function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return COLLATOR.compare(String(a), String(b));
}
function sortRows(rows, get, dir) {
  const sign = dir === "asc" ? 1 : -1;
  const keyed = rows.map((row, index) => ({ row, index, key: get(row) }));
  keyed.sort((x, y) => {
    const c = x.key === null || y.key === null ? compareValues(x.key, y.key) : sign * compareValues(x.key, y.key);
    return c || x.index - y.index;
  });
  return keyed.map((k) => k.row);
}
var googleFavicon = (host, size) => `https://www.google.com/s2/favicons?sz=${size * 2 > 32 ? 64 : 32}&domain=${encodeURIComponent(host)}`;
var favicons = () => shared("favicons", () => ({ resolve: (() => null) }));
function configureFavicons(options) {
  favicons().resolve = options.resolve ?? (() => null);
}
function getFaviconResolver() {
  return favicons().resolve;
}
var FAVICON_HUES = 8;
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
  return Math.abs(h);
}
function hostnameOf(url) {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}
function decimateMinMax(points, xMin, xMax, buckets) {
  const n = Math.max(1, Math.floor(buckets));
  if (points.length <= n * 2) return points.slice();
  const span = xMax - xMin || 1;
  const out = [];
  let b = -1;
  let lo = null;
  let hi = null;
  const flush = () => {
    if (!lo || !hi) return;
    if (lo === hi) out.push(lo);
    else if (lo.x <= hi.x) out.push(lo, hi);
    else out.push(hi, lo);
  };
  for (const p of points) {
    const idx = Math.min(n - 1, Math.max(0, Math.floor((p.x - xMin) / span * n)));
    if (idx !== b) {
      flush();
      b = idx;
      lo = p;
      hi = p;
    } else {
      if (lo && p.y < lo.y) lo = p;
      if (hi && p.y > hi.y) hi = p;
    }
  }
  flush();
  return out;
}
var NUMBER_FORMATS = /* @__PURE__ */ new Map();
function chartNumber(v, locale = "en-US") {
  let f = NUMBER_FORMATS.get(locale);
  if (!f) {
    f = {
      whole: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
      small: new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false })
    };
    NUMBER_FORMATS.set(locale, f);
  }
  const r = Math.round(v * 100) / 100 || 0;
  if (Math.abs(r) >= 1e3) return f.whole.format(r);
  return f.small.format(r);
}
var warned = /* @__PURE__ */ new Set();
function warnOnce(key, message) {
  const env = globalThis.process?.env;
  if (env?.NODE_ENV === "production" || warned.has(key)) return;
  warned.add(key);
  console.warn(`nish-ui: ${message}`);
}
export {
  FAVICON_HUES,
  chartNumber,
  compareValues,
  configureFavicons,
  decimateMinMax,
  getFaviconResolver,
  googleFavicon,
  hashString,
  hostnameOf,
  mergeRefs,
  sortRows,
  tableClass,
  tableInternals,
  warnOnce
};
