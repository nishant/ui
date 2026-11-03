"use client";

// src/components/command.tsx
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { safeUrl } from "../url.js";
import { XIcon } from "./icons.js";
import { Modal, whenHistorySettled } from "./overlay.js";
import { useLatest } from "./latest.js";
import { useNishStrings } from "./provider.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var MAX_RESULTS = 50;
function indexItems(items) {
  return items.map((item) => ({ item, label: item.label.toLowerCase(), keywords: (item.keywords ?? []).map((k) => k.toLowerCase()) }));
}
function isWordStart(text, i) {
  return i === 0 || !/[a-z0-9]/i.test(text[i - 1]);
}
function matchText(text, q) {
  const at = text.indexOf(q);
  if (at >= 0) {
    let tier = at === 0 ? 0 : 2;
    let start = at;
    if (tier === 2) {
      for (let from2 = at; from2 >= 0; from2 = text.indexOf(q, from2 + 1)) {
        if (isWordStart(text, from2)) {
          tier = 1;
          start = from2;
          break;
        }
        if (from2 + 1 >= text.length) break;
      }
    }
    return { tier, idx: Array.from({ length: q.length }, (_, k) => start + k) };
  }
  const idx = [];
  let from = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, from);
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  return { tier: 3, idx };
}
function navigateFromLayer(rawHref) {
  const href = safeUrl(rawHref);
  if (href === null) {
    warnUnsafe(rawHref);
    return;
  }
  const inLayer = !!history.state?.nishLayer;
  if (!inLayer) {
    window.location.assign(href);
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    window.location.assign(href);
  };
  window.setTimeout(() => whenHistorySettled(go), 0);
  window.setTimeout(go, 400);
}
function warnUnsafe(href) {
  try {
    if (process.env.NODE_ENV !== "production") console.warn(`CommandPalette: ignored an unsafe href (${href.slice(0, 40)}).`);
  } catch {
  }
}
function rankItems(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, MAX_RESULTS).map(({ item }) => ({ item, marks: [] }));
  const scored = [];
  items.forEach(({ item, label: lower, keywords }, order) => {
    const label = matchText(lower, q);
    if (label) {
      scored.push({ r: { item, marks: label.idx }, score: label.tier, order });
      return;
    }
    let best = null;
    for (const kw of keywords) {
      const m = matchText(kw, q);
      if (m && m.tier < 3 && (best === null || m.tier < best)) best = m.tier;
    }
    if (best !== null) scored.push({ r: { item, marks: [] }, score: 4 + best, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, MAX_RESULTS).map((s) => s.r);
}
function groupRows(rows) {
  const order = [];
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const g = r.item.group ?? null;
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g).push(r);
  }
  order.sort((a, b) => a === null ? -1 : b === null ? 1 : 0);
  let index = 0;
  return order.map((group) => ({ group, rows: map.get(group).map((r) => ({ r, index: index++ })) }));
}
function Highlighted({ text, marks }) {
  if (marks.length === 0) return /* @__PURE__ */ jsx(Fragment, { children: text });
  const set = new Set(marks);
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const on = set.has(i);
    let j = i;
    while (j < text.length && set.has(j) === on) j++;
    const chunk = text.slice(i, j);
    parts.push(
      on ? /* @__PURE__ */ jsx("mark", { className: "bg-transparent font-semibold text-th-accent", children: chunk }, i) : /* @__PURE__ */ jsx("span", { children: chunk }, i)
    );
    i = j;
  }
  return /* @__PURE__ */ jsx(Fragment, { children: parts });
}
function SearchIcon({ size = 18 }) {
  return /* @__PURE__ */ jsxs(
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
      children: [
        /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" }),
        /* @__PURE__ */ jsx("path", { d: "m21 21-4.3-4.3" })
      ]
    }
  );
}
function defaultResultsLabel(count) {
  return `${count} result${count === 1 ? "" : "s"}`;
}
function isTypingTarget(t) {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}
function useCommandHotkey(open, enabled = true) {
  const ref = useLatest(open);
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.defaultPrevented || e.isComposing) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current();
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        ref.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, ref]);
}
function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder,
  emptyText,
  resultsLabel,
  externalLabel,
  hotkey = true,
  onQuery,
  footer,
  onSubmitQuery
}) {
  const s = useNishStrings();
  useCommandHotkey(() => {
    if (!open) onOpenChange(true);
  }, hotkey);
  if (!open) return null;
  return /* @__PURE__ */ jsx(
    PaletteDialog,
    {
      onClose: () => onOpenChange(false),
      items,
      placeholder: placeholder ?? s.searchPlaceholder,
      emptyText: emptyText ?? s.noResults,
      resultsLabel,
      externalLabel: externalLabel ?? "opens in a new tab",
      onQuery,
      footer,
      onSubmitQuery
    }
  );
}
function PaletteDialog({ onClose, items, placeholder, emptyText, resultsLabel, externalLabel, onQuery, footer, onSubmitQuery }) {
  const s = useNishStrings();
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (i) => `${uid}-opt-${i}`;
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const isFn = typeof items === "function";
  const itemsRef = useLatest(items);
  const [dynamic, setDynamic] = useState([]);
  const [pending, setPending] = useState(isFn);
  useEffect(() => {
    const fn = itemsRef.current;
    if (typeof fn !== "function") return;
    let stale = false;
    let res;
    try {
      res = fn(query);
    } catch {
      res = [];
    }
    if (Array.isArray(res)) {
      setDynamic(res.slice(0, MAX_RESULTS));
      setPending(false);
      return;
    }
    setPending(true);
    res.then(
      (r) => {
        if (stale) return;
        setDynamic(r.slice(0, MAX_RESULTS));
        setPending(false);
      },
      () => {
        if (stale) return;
        setDynamic([]);
        setPending(false);
      }
    );
    return () => {
      stale = true;
    };
  }, [query, isFn, itemsRef]);
  const indexed = useMemo(() => isFn ? [] : indexItems(items), [isFn, items]);
  const rows = useMemo(() => {
    if (isFn) return dynamic.map((item) => ({ item, marks: matchText(item.label.toLowerCase(), query.trim().toLowerCase())?.idx ?? [] }));
    return rankItems(indexed, query);
  }, [isFn, dynamic, indexed, query]);
  const groups = useMemo(() => groupRows(rows), [rows]);
  const flat = useMemo(() => groups.flatMap((g) => g.rows.map((x) => x.r.item)), [groups]);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setActive(0);
  }, [query, flat.length]);
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const select = (item) => {
    onClose();
    if (item.href) {
      const href = safeUrl(item.href);
      if (href === null) warnUnsafe(item.href);
      else if (item.external) window.open(href, "_blank", "noopener,noreferrer");
      else navigateFromLayer(href);
    } else {
      item.onSelect?.();
    }
  };
  const onKeyDown = (e) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === "Home" && flat.length && !query) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) select(item);
      else if (!pending && query.trim() && onSubmitQuery) {
        onClose();
        onSubmitQuery(query.trim());
      }
    }
  };
  const header = /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b border-th-line px-4 pb-2 sm:pt-1", children: [
    /* @__PURE__ */ jsx("span", { className: "shrink-0 text-th-hi3", children: /* @__PURE__ */ jsx(SearchIcon, {}) }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "text",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": listId,
        "aria-autocomplete": "list",
        "aria-activedescendant": flat.length ? optionId(active) : void 0,
        "aria-label": placeholder.replace(/…$/, "") || s.search,
        value: query,
        placeholder,
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: false,
        enterKeyHint: flat.length ? "go" : "search",
        onChange: (e) => {
          setQuery(e.target.value);
          onQuery?.(e.target.value);
        },
        onKeyDown,
        className: "h-12 min-w-0 flex-1 bg-transparent text-base text-th-hi outline-none placeholder:text-th-hi3"
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: onClose,
        "aria-label": s.close,
        className: "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi sm:hidden",
        children: /* @__PURE__ */ jsx(XIcon, { size: 18 })
      }
    )
  ] });
  const showEmpty = flat.length === 0 && !pending;
  return /* @__PURE__ */ jsxs(
    Modal,
    {
      onClose,
      header,
      "aria-label": s.search,
      placement: "top",
      sheetHeight: "full",
      footer,
      className: "sm:max-w-[560px]",
      children: [
        /* @__PURE__ */ jsx("div", { "aria-live": "polite", className: "sr-only", children: showEmpty ? "" : (resultsLabel ?? defaultResultsLabel)(flat.length) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: listRef,
            id: listId,
            role: "listbox",
            "aria-label": s.results,
            "aria-busy": pending,
            className: "-mx-2",
            onMouseDown: (e) => e.preventDefault(),
            children: groups.map((g, gi) => {
              const headId = `${uid}-g-${gi}`;
              return /* @__PURE__ */ jsxs("div", { role: "group", "aria-labelledby": g.group ? headId : void 0, children: [
                g.group ? /* @__PURE__ */ jsx("div", { id: headId, className: "px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-th-hi3", children: g.group }) : null,
                g.rows.map(({ r, index }) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    id: optionId(index),
                    role: "option",
                    "aria-selected": index === active,
                    onMouseMove: () => index !== active && setActive(index),
                    onClick: () => select(r.item),
                    className: cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-th-hi2",
                      index === active && "bg-th-elevated text-th-hi"
                    ),
                    children: [
                      r.item.icon ? /* @__PURE__ */ jsx("span", { className: "inline-flex shrink-0 items-center text-th-hi3", children: r.item.icon }) : null,
                      /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: /* @__PURE__ */ jsx(Highlighted, { text: r.item.label, marks: r.marks }) }),
                      r.item.hint ? /* @__PURE__ */ jsx("span", { className: "max-w-[40%] shrink-0 truncate text-xs text-th-hi3", children: r.item.hint }) : null,
                      r.item.external ? /* @__PURE__ */ jsx("span", { className: "inline-block shrink-0 text-xs text-th-hi3 rtl:-scale-x-100", role: "img", "aria-label": externalLabel, children: "\u2197" }) : null
                    ]
                  },
                  r.item.id
                ))
              ] }, g.group ?? "__none");
            })
          }
        ),
        showEmpty ? /* @__PURE__ */ jsx("div", { role: "status", className: "px-3 py-8 text-center text-sm text-th-hi3", children: emptyText }) : null
      ]
    }
  );
}
export {
  CommandPalette,
  navigateFromLayer,
  useCommandHotkey
};
