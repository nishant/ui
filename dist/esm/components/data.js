"use client";

// src/components/data.tsx
import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { safeUrl } from "../url.js";
import { useIsoLayoutEffect } from "./client.js";
import {
  FAVICON_HUES,
  getFaviconResolver,
  hashString,
  hostnameOf,
  mergeRefs,
  sortRows,
  warnOnce
} from "./data-classes.js";
import { useMediaQuery } from "./hooks.js";
import { StatusDot } from "./display.js";
import { CardListSkeleton, EmptyState, ErrorState, SkeletonRows } from "./feedback.js";
import { useLatest } from "./latest.js";
import { useStrings } from "./provider.js";
import { STATUS_STRINGS, TABLE_STRINGS } from "./strings.js";
import { Table, TableWrap, Td, Th, Tr } from "./table.js";
import { cardClass, IconButton, Select } from "./primitives.js";
import { configureFavicons, googleFavicon } from "./data-classes.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Glyph({ size = 16, children, ...rest }) {
  return /* @__PURE__ */ jsx(
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
var ChevronRight = (p) => /* @__PURE__ */ jsx(Glyph, { ...p, className: cn("rtl:-scale-x-100", p.className), children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) });
var ExternalGlyph = (p) => /* @__PURE__ */ jsx(Glyph, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }) });
var ArrowUp = (p) => /* @__PURE__ */ jsx(Glyph, { ...p, children: /* @__PURE__ */ jsx("path", { d: "m5 12 7-7 7 7M12 19V5" }) });
var ArrowDown = (p) => /* @__PURE__ */ jsx(Glyph, { ...p, children: /* @__PURE__ */ jsx("path", { d: "M12 5v14M19 12l-7 7-7-7" }) });
function fromInteractive(e) {
  const el = e.target?.closest?.('a,button,input,select,textarea,label,summary,[role="button"],[role="link"]');
  return !!el && el !== e.currentTarget && e.currentTarget.contains(el);
}
var TABLE_SHOW = { sm: "hidden sm:block", md: "hidden md:block", lg: "hidden lg:block" };
var BP_PX = { sm: 640, md: 768, lg: 1024 };
var CARDS_SHOW = { sm: "sm:hidden", md: "md:hidden", lg: "lg:hidden" };
var HIDE_BELOW = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell"
};
var TONE_EDGE = {
  ok: "border-s-[3px] border-s-[var(--nish-ok-fill)]",
  warn: "border-s-[3px] border-s-[var(--nish-warn-fill)]",
  loss: "border-s-[3px] border-s-[var(--nish-loss-fill)]"
};
var DEFAULT_SORT_TEXT = {
  announce: (header, dir) => dir ? `Sorted by ${header}, ${dir === "asc" ? "ascending" : "descending"}` : "Sorting cleared",
  toggle: (dir) => dir === "desc" ? "Sorted descending, switch to ascending" : "Sorted ascending, switch to descending"
};
var BodyRow = /* @__PURE__ */ memo(function BodyRow2({ row, columns, tone, interactive, onGo }) {
  return /* @__PURE__ */ jsx(
    Tr,
    {
      tone,
      interactive,
      tabIndex: interactive ? 0 : void 0,
      onClick: interactive ? (e) => {
        if (!fromInteractive(e)) onGo(row, e);
      } : void 0,
      onKeyDown: interactive ? (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onGo(row, e);
        }
      } : void 0,
      children: columns.map((c) => /* @__PURE__ */ jsx(Td, { numeric: c.numeric, className: cn(c.hideBelow && HIDE_BELOW[c.hideBelow]), children: c.cell(row) }, c.key))
    }
  );
});
function ResponsiveTable({
  rows,
  columns,
  rowKey,
  cardsBelow = "md",
  onRowClick,
  rowHref,
  onNavigate,
  rowTone,
  sort,
  onSortChange,
  minWidth = 640,
  stickyHeader,
  maxHeight,
  stickyFirstColumn,
  loading = false,
  empty,
  error,
  label,
  renderCard,
  sortText,
  className,
  ref,
  ...rest
}) {
  const t = useStrings(STATUS_STRINGS, TABLE_STRINGS);
  const text = { ...DEFAULT_SORT_TEXT, ...sortText };
  const [innerSort, setInnerSort] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const sortId = useId();
  const wide = useMediaQuery(`(min-width: ${BP_PX[cardsBelow]}px)`);
  const external = sort !== void 0 || onSortChange !== void 0;
  const current = sort !== void 0 ? sort : innerSort;
  const sortKey = current?.key;
  const sortDir = current?.dir;
  const changeSort = (next) => {
    setInnerSort(next);
    onSortChange?.(next);
    const header = columns.find((c) => c.key === next?.key)?.header ?? "";
    setAnnouncement(text.announce(header, next ? next.dir : null));
  };
  const sorted = useMemo(() => {
    if (external || !sortKey || !sortDir) return rows;
    const get = columns.find((c) => c.key === sortKey)?.sortValue;
    return get ? sortRows(rows, get, sortDir) : rows;
  }, [rows, sortKey, sortDir, external]);
  const sortable = columns.filter((c) => c.sortValue);
  const toggle = (key) => changeSort(current?.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const interactive = !!(onRowClick || rowHref);
  const latest = useLatest({ onRowClick, rowHref, onNavigate });
  const go = useCallback((row, e) => {
    const { onRowClick: click, rowHref: hrefOf, onNavigate: navigate } = latest.current;
    if (!hrefOf) return click?.(row);
    const raw = hrefOf(row);
    const href = safeUrl(raw);
    if (href === null) {
      warnOnce("table-href", `ResponsiveTable ignored an unsafe rowHref (${JSON.stringify(raw)}).`);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || "button" in e && e.button === 1) window.open(href, "_blank", "noopener");
    else if (navigate) navigate(href);
    else window.location.assign(href);
  }, [latest]);
  if (error) return /* @__PURE__ */ jsx(ErrorState, { message: error.message, onRetry: error.onRetry, className });
  const emptyNode = empty ?? /* @__PURE__ */ jsx(EmptyState, { title: t.nothingHere });
  const hasRows = sorted.length > 0;
  const table = !wide ? null : loading ? /* @__PURE__ */ jsx(SkeletonRows, { rows: 5, height: 44, label: t.loadingNamed(label) }) : !hasRows ? emptyNode : /* @__PURE__ */ jsx(TableWrap, { minWidth, stickyHeader, maxHeight, stickyFirstColumn, label, children: /* @__PURE__ */ jsxs(Table, { "aria-label": label, children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((c) => /* @__PURE__ */ jsx(
      Th,
      {
        numeric: c.numeric,
        sort: c.sortValue ? current?.key === c.key ? current.dir : false : void 0,
        onSort: c.sortValue ? () => toggle(c.key) : void 0,
        className: cn(c.hideBelow && HIDE_BELOW[c.hideBelow]),
        style: c.width ? { width: c.width } : void 0,
        children: c.header
      },
      c.key
    )) }) }),
    /* @__PURE__ */ jsx("tbody", { children: sorted.map((row) => /* @__PURE__ */ jsx(BodyRow, { row, columns, tone: rowTone?.(row), interactive, onGo: go }, rowKey(row))) })
  ] }) });
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const secondary = columns.find((c) => c.secondary && c !== primary);
  const rest2 = columns.filter((c) => c !== primary && c !== secondary);
  const cardBody = (row) => renderCard ? renderCard(row) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("span", { className: "block min-w-0", children: [
      /* @__PURE__ */ jsx("span", { className: "block truncate font-semibold text-th-hi", children: primary?.cell(row) }),
      secondary ? /* @__PURE__ */ jsx("span", { className: "mt-0.5 block text-sm text-th-hi3", children: secondary.cell(row) }) : null
    ] }),
    rest2.length > 0 ? /* @__PURE__ */ jsx("span", { className: "mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm", children: rest2.map((c) => /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-baseline justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "shrink-0 text-xs text-th-hi3", children: c.header }),
      /* @__PURE__ */ jsx("span", { className: cn("min-w-0 text-th-hi2", c.numeric && "whitespace-nowrap text-end tabular-nums"), children: c.cell(row) })
    ] }, c.key)) }) : null
  ] });
  const cardClassFor = (tone, live) => cardClass({
    padding: "sm",
    interactive: live,
    className: cn("block min-h-11 w-full text-start", tone && TONE_EDGE[tone])
  });
  const cardItem = (row) => {
    const tone = rowTone?.(row);
    const href = rowHref ? safeUrl(rowHref(row)) : null;
    if (rowHref && href === null) warnOnce("table-href", `ResponsiveTable ignored an unsafe rowHref (${JSON.stringify(rowHref(row))}).`);
    if (href !== null) {
      return /* @__PURE__ */ jsx("a", { href, className: cardClassFor(tone, true), children: cardBody(row) });
    }
    if (onRowClick) {
      return /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onRowClick(row), className: cardClassFor(tone, true), children: cardBody(row) });
    }
    return /* @__PURE__ */ jsx("div", { className: cardClassFor(tone, false), children: cardBody(row) });
  };
  const cards = wide ? null : loading ? /* @__PURE__ */ jsx(CardListSkeleton, { count: 3, lines: 2 }) : !hasRows ? emptyNode : /* @__PURE__ */ jsxs(Fragment, { children: [
    sortable.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("label", { className: "shrink-0 text-xs text-th-hi3", htmlFor: sortId, children: t.sortBy }),
      /* @__PURE__ */ jsxs(
        Select,
        {
          id: sortId,
          size: "sm",
          className: "min-w-0 flex-1",
          value: current?.key ?? "",
          onChange: (e) => changeSort(e.target.value ? { key: e.target.value, dir: current?.dir ?? "asc" } : null),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: t.sortDefault }),
            sortable.map((c) => /* @__PURE__ */ jsx("option", { value: c.key, children: c.header }, c.key))
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        IconButton,
        {
          label: text.toggle(current ? current.dir : null),
          variant: "subtle",
          disabled: !current,
          onClick: () => current && changeSort({ key: current.key, dir: current.dir === "asc" ? "desc" : "asc" }),
          children: current?.dir === "desc" ? /* @__PURE__ */ jsx(ArrowDown, { size: 16 }) : /* @__PURE__ */ jsx(ArrowUp, { size: 16 })
        }
      )
    ] }) : null,
    /* @__PURE__ */ jsx("ul", { "aria-label": label, className: "grid gap-2", children: sorted.map((row) => /* @__PURE__ */ jsx("li", { children: cardItem(row) }, rowKey(row))) })
  ] });
  return /* @__PURE__ */ jsxs("div", { ...rest, ref, className, children: [
    wide ? /* @__PURE__ */ jsx("div", { className: TABLE_SHOW[cardsBelow], children: table }) : /* @__PURE__ */ jsx("div", { className: CARDS_SHOW[cardsBelow], children: cards }),
    /* @__PURE__ */ jsx("div", { role: "status", "aria-live": "polite", className: "sr-only", children: announcement })
  ] });
}
function ListRow({
  icon,
  title,
  titleLines = 1,
  subtitle,
  meta,
  trailing,
  href,
  onClick,
  active = false,
  tone,
  chevron,
  dense = false,
  compact = false,
  external = false,
  className,
  as: wrapperTag = "li",
  ref,
  ...rest
}) {
  const Wrapper = wrapperTag;
  const url = href === void 0 ? null : safeUrl(href);
  const interactive = !!(url || onClick);
  const showChevron = chevron ?? !!url;
  const rowClass = cn(
    "flex w-full items-center rounded-[var(--nish-radius-sm)] px-3 text-start",
    compact ? "gap-2.5" : "gap-3",
    dense || compact ? "min-h-11" : "min-h-[52px]",
    !subtitle && "py-1",
    subtitle && (compact ? "py-1.5" : "py-2"),
    interactive && "transition-colors hover:bg-th-elevated focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-th-accent",
    // The active row is shown by a tint; forced colors drop it, so it gets an outline.
    active && "bg-th-accent-soft forced-colors:outline forced-colors:outline-2 forced-colors:outline-[color:Highlight]",
    className
  );
  const body = /* @__PURE__ */ jsxs(Fragment, { children: [
    icon ? /* @__PURE__ */ jsx("span", { className: "flex shrink-0 items-center text-th-hi3 [&>svg]:size-5", children: icon }) : null,
    /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "block",
            titleLines === 2 ? "line-clamp-2 break-words" : "truncate",
            compact && "text-2xs font-medium leading-snug",
            tone === "danger" ? "text-th-loss" : "text-th-hi"
          ),
          children: title
        }
      ),
      subtitle ? /* @__PURE__ */ jsx("span", { className: cn("line-clamp-2 block", compact ? "mt-0.5 text-3xs" : "text-sm", active ? "text-th-hi2" : "text-th-hi3"), children: subtitle }) : null
    ] }),
    meta ? /* @__PURE__ */ jsx("span", { className: cn("shrink-0 text-end tabular-nums", compact ? "text-3xs" : "text-xs", active ? "text-th-hi2" : "text-th-hi3"), children: meta }) : null,
    trailing ? /* @__PURE__ */ jsx("span", { className: "flex shrink-0 items-center", children: trailing }) : null,
    external ? /* @__PURE__ */ jsx(ExternalGlyph, { size: 14, className: "shrink-0 text-th-hi3" }) : null,
    showChevron && !external ? /* @__PURE__ */ jsx(ChevronRight, { size: compact ? 13 : 16, className: "shrink-0 text-th-ghost" }) : null
  ] });
  let inner;
  if (url) {
    inner = /* @__PURE__ */ jsx(
      "a",
      {
        href: url,
        className: rowClass,
        "aria-current": active ? "true" : void 0,
        ...external ? { target: "_blank", rel: "noopener noreferrer" } : null,
        children: body
      }
    );
  } else if (onClick) {
    inner = /* @__PURE__ */ jsx("button", { type: "button", onClick, className: rowClass, "aria-current": active ? "true" : void 0, children: body });
  } else {
    inner = /* @__PURE__ */ jsx("div", { className: rowClass, children: body });
  }
  return /* @__PURE__ */ jsx(Wrapper, { ...rest, ref, className: "min-w-0", children: inner });
}
function Favicon({ url, size = 16, label, src, resolve, className, style, ref, ...rest }) {
  const host = hostnameOf(url);
  const imgSrc = useMemo(() => {
    const own = src !== void 0 ? safeUrl(src) : host ? (resolve ?? getFaviconResolver())(host, size) : null;
    return own === null ? null : safeUrl(own);
  }, [src, host, resolve, size]);
  const [seen, setSeen] = useState(null);
  const status = imgSrc && seen?.src === imgSrc ? seen.status : "loading";
  const box = { width: size, height: size };
  if (!imgSrc || status === "failed") {
    const seed = label ?? host ?? url;
    const n = hashString(seed) % FAVICON_HUES + 1;
    const letter = (seed.replace(/^www\./, "").match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();
    return /* @__PURE__ */ jsx(
      "span",
      {
        "aria-hidden": "true",
        ...rest,
        ref,
        className: cn("inline-flex shrink-0 select-none items-center justify-center rounded-sm font-semibold leading-none", className),
        style: {
          ...box,
          fontSize: Math.round(size * 0.6),
          color: `var(--nish-chart-${n})`,
          background: `color-mix(in srgb, var(--nish-chart-${n}) 20%, transparent)`,
          ...style
        },
        children: letter
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "img",
    {
      "aria-hidden": "true",
      ...rest,
      ref,
      src: imgSrc,
      width: size,
      height: size,
      alt: "",
      loading: "lazy",
      decoding: "async",
      referrerPolicy: "no-referrer",
      onLoad: () => setSeen({ src: imgSrc, status: "loaded" }),
      onError: () => setSeen({ src: imgSrc, status: "failed" }),
      className: cn("inline-block shrink-0 rounded-sm transition-opacity duration-150 motion-reduce:transition-none", status === "loaded" ? "opacity-100" : "opacity-0", className),
      style: { ...box, ...style }
    }
  );
}
var AUTO_BREAK = 600;
var widthWatches = /* @__PURE__ */ new WeakMap();
function watchWidth(el, fn) {
  fn(el.clientWidth);
  if (typeof ResizeObserver === "undefined") return () => {
  };
  let w = widthWatches.get(el);
  if (!w) {
    const subs = /* @__PURE__ */ new Set();
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      subs.forEach((f) => f(width));
    });
    ro.observe(el);
    w = { ro, subs };
    widthWatches.set(el, w);
  }
  w.subs.add(fn);
  const watch = w;
  return () => {
    watch.subs.delete(fn);
    if (!watch.subs.size) {
      watch.ro.disconnect();
      widthWatches.delete(el);
    }
  };
}
function LinkCard({
  href,
  title,
  blurb,
  icon,
  favicon = false,
  accent = "accent",
  meta,
  status,
  badge,
  disabled = false,
  layout = "auto",
  external = false,
  className,
  ref: forwardedRef,
  ...rest
}) {
  const ref = useRef(null);
  const [wide, setWide] = useState(false);
  const url = safeUrl(href);
  const dead = disabled || url === null;
  if (!disabled && url === null) warnOnce("linkcard-href", `LinkCard ignored an unsafe href (${JSON.stringify(href)}).`);
  useIsoLayoutEffect(() => {
    if (layout !== "auto") return;
    const parent = ref.current?.parentElement;
    if (!parent) return;
    return watchWidth(parent, (w) => setWide(w >= AUTO_BREAK));
  }, [layout]);
  const isCard = layout === "card" || layout === "auto" && wide;
  const color = accent === "accent" ? "var(--nish-accent)" : `var(--nish-${accent})`;
  const glyph = icon ?? (favicon ? /* @__PURE__ */ jsx(Favicon, { url: href, size: 20, label: title }) : null);
  const tile = glyph ? /* @__PURE__ */ jsx(
    "span",
    {
      "aria-hidden": "true",
      className: cn("flex shrink-0 items-center justify-center rounded-[var(--nish-radius-sm)] [&>svg]:size-5", isCard ? "size-10" : "size-9"),
      style: { color, background: `color-mix(in srgb, ${color} 16%, transparent)` },
      children: glyph
    }
  ) : null;
  const statusEl = status ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 text-xs text-th-hi3", children: [
    /* @__PURE__ */ jsx(StatusDot, { tone: status.tone, size: "xs" }),
    status.label
  ] }) : null;
  const base = cn(
    "group/link @container flex min-h-11 rounded-xl border bg-th-surface text-start",
    dead ? "border-dashed border-th-line-strong text-th-hi3" : "border-th-line shadow-card",
    !dead && "transition-[transform,box-shadow,border-color,background-color] duration-150 hover:border-th-line-strong hover:bg-th-elevated/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-th-accent [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-pop",
    isCard ? "flex-col gap-3 p-4" : "min-h-16 items-center gap-3 px-3 py-2",
    className
  );
  const content = isCard ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("span", { className: "flex items-start justify-between gap-2", children: [
      tile ?? /* @__PURE__ */ jsx("span", {}),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        badge,
        external ? /* @__PURE__ */ jsx(ExternalGlyph, { size: 14, className: "text-th-hi3" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
      /* @__PURE__ */ jsx("span", { className: cn("block font-semibold", dead ? "text-th-hi2" : "text-th-hi"), children: title }),
      blurb ? /* @__PURE__ */ jsx("span", { className: "mt-1 line-clamp-3 block text-sm text-th-hi3", children: blurb }) : null
    ] }),
    meta || statusEl ? /* @__PURE__ */ jsxs("span", { className: "mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-th-hi3", children: [
      statusEl,
      meta
    ] }) : null
  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    tile,
    /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: cn("truncate font-semibold", dead ? "text-th-hi2" : "text-th-hi"), children: title }),
        status ? /* @__PURE__ */ jsx(StatusDot, { tone: status.tone, size: "xs", label: status.label }) : null
      ] }),
      blurb ? /* @__PURE__ */ jsx("span", { className: "line-clamp-1 block text-sm text-th-hi3", children: blurb }) : null
    ] }),
    badge,
    external ? /* @__PURE__ */ jsx(ExternalGlyph, { size: 14, className: "shrink-0 text-th-hi3" }) : /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "shrink-0 text-th-ghost" })
  ] });
  if (dead) {
    return /* @__PURE__ */ jsx("span", { ...rest, ref: mergeRefs(ref, forwardedRef), "aria-disabled": "true", className: base, children: content });
  }
  return /* @__PURE__ */ jsx(
    "a",
    {
      ...rest,
      ref: mergeRefs(ref, forwardedRef),
      href: url,
      className: base,
      ...external ? { target: "_blank", rel: "noopener noreferrer" } : null,
      children: content
    }
  );
}
function AsyncPanel({ status, skeleton, error, empty, children, className, ref, ...rest }) {
  const t = useStrings(STATUS_STRINGS, TABLE_STRINGS);
  let body;
  if (status === "loading") body = skeleton ?? /* @__PURE__ */ jsx(SkeletonRows, {});
  else if (status === "error")
    body = /* @__PURE__ */ jsx(
      ErrorState,
      {
        message: error?.title ? `${error.title}: ${error.message}` : error?.message ?? t.failedToLoad,
        onRetry: error?.onRetry
      }
    );
  else if (status === "empty")
    body = /* @__PURE__ */ jsx(EmptyState, { title: empty?.title ?? t.nothingHere, detail: empty?.description, action: empty?.action });
  else body = children;
  return /* @__PURE__ */ jsx("div", { ...rest, ref, "aria-busy": status === "loading" || void 0, className, children: body });
}
export {
  AsyncPanel,
  Favicon,
  LinkCard,
  ListRow,
  ResponsiveTable,
  configureFavicons,
  googleFavicon
};
