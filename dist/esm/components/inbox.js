"use client";

// src/components/inbox.tsx
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../cn.js";
import { ago, dateTime, time } from "../format.js";
import { INBOX_SOURCE_LABELS } from "../inbox-types.js";
import { safeUrl } from "../url.js";
import { ChipGroup, Chip } from "./forms.js";
import { StatusDot } from "./display.js";
import { EmptyState, ErrorState, SkeletonRows } from "./feedback.js";
import { RelativeTime, useMediaQuery, useNow } from "./hooks.js";
import { CheckIcon, ClockIcon, MoreIcon } from "./icons.js";
import { DropdownMenu, MenuItem, MenuLabel, MenuSeparator } from "./menu.js";
import { ConfirmDialog } from "./modal.js";
import { Button, Card, IconButton } from "./primitives.js";
import { useNishContext, useStrings } from "./provider.js";
import { INBOX_STRINGS, SHELL_STRINGS, STATUS_STRINGS, OVERLAY_STRINGS } from "./strings.js";
import { Tabs } from "./tabs.js";
import { DEFAULT_INBOX_LABELS } from "./inbox-classes.js";
import { DEFAULT_INBOX_LABELS as DEFAULT_INBOX_LABELS2 } from "./inbox-classes.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var useInboxStrings = () => useStrings(INBOX_STRINGS, SHELL_STRINGS, STATUS_STRINGS, OVERLAY_STRINGS);
var DOT_TONE = {
  urgent: "loss",
  normal: "accent",
  info: "neutral"
};
function at8(now, days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(8, 0, 0, 0);
  return d;
}
var SNOOZE_OPTIONS = [
  { id: "snooze1h", until: (now) => new Date(now.getTime() + 36e5) },
  { id: "snooze4h", until: (now) => new Date(now.getTime() + 4 * 36e5) },
  { id: "snoozeTomorrow", until: (now) => at8(now, 1) },
  // The next Monday; a week ahead when today is Monday.
  { id: "snoozeMonday", until: (now) => at8(now, (8 - now.getDay()) % 7 || 7) }
];
function looksClamped(body) {
  return body.length > 100 || body.split("\n").length > 3;
}
function lastActionText(result, item, labels, now, locale) {
  const label = item.actions?.find((a) => a.id === result.actionId)?.label ?? result.actionId;
  const ms = Date.parse(result.at);
  const at = new Date(ms).toDateString() === new Date(now).toDateString() ? time(ms, { locale }) : dateTime(ms, { locale });
  if (result.ok) return labels.actionRan(label, at);
  const why = result.error ?? (result.status != null ? `HTTP ${result.status}` : null);
  return labels.actionFailed(label, at, why);
}
function Row({ item, view, label, wide, selected, expanded, domId, onToggle, onHandle, onUnhandle, onSnooze, onUnsnooze, running, onAction, labels, strings }) {
  const { locale } = useNishContext();
  const clock = useNow();
  const severity = item.severity in DOT_TONE ? item.severity : "normal";
  const dot = { tone: DOT_TONE[severity], label: labels[severity] };
  const long = item.body != null && looksClamped(item.body);
  const href = item.url ? safeUrl(item.url) : null;
  const actions = onAction && view !== "handled" ? item.actions ?? [] : [];
  const last = item.lastAction ?? null;
  const snoozeItems = SNOOZE_OPTIONS.map((o) => /* @__PURE__ */ jsx(MenuItem, { icon: wide ? void 0 : /* @__PURE__ */ jsx(ClockIcon, { size: 14 }), onSelect: () => onSnooze(item.id, o.until(/* @__PURE__ */ new Date())), children: labels[o.id] }, o.id));
  return /* @__PURE__ */ jsxs(
    "li",
    {
      id: domId,
      "data-selected": selected || void 0,
      className: cn("flex items-start gap-3 px-4 py-3", selected && "bg-th-accent-soft forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]"),
      children: [
        /* @__PURE__ */ jsx(StatusDot, { tone: dot.tone, label: dot.label, className: "mt-1.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: cn("flex flex-wrap items-center gap-x-2 text-xs", selected ? "text-th-hi2" : "text-th-hi3"), children: [
            /* @__PURE__ */ jsx("span", { children: label }),
            /* @__PURE__ */ jsx(RelativeTime, { value: item.updatedAt, style: "short" }),
            item.count > 1 ? /* @__PURE__ */ jsxs("span", { role: "img", "aria-label": strings.inboxHappened(item.count), className: "tabular-nums", children: [
              "\xD7",
              item.count
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx("p", { className: "m-0 line-clamp-2 break-words text-sm font-medium text-th-hi", children: href ? /* @__PURE__ */ jsx("a", { href, target: "_blank", rel: "noopener noreferrer", className: "break-words hover:underline", children: item.title }) : item.title }),
          item.body ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("p", { className: cn("m-0 mt-0.5 whitespace-pre-line break-words text-sm text-th-hi2", !expanded && "line-clamp-3"), children: item.body }),
            long ? /* @__PURE__ */ jsx(Button, { variant: "link", size: "sm", className: "pointer-coarse:-mx-2 pointer-coarse:min-h-11 pointer-coarse:px-2", "aria-expanded": expanded, onClick: () => onToggle(item.id), children: expanded ? labels.less : strings.more }) : null
          ] }) : null,
          actions.length > 0 ? /* @__PURE__ */ jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: actions.map((a) => /* @__PURE__ */ jsx(
            Button,
            {
              size: "sm",
              variant: "secondary",
              loading: running === a.id,
              disabled: running !== null && running !== a.id,
              onClick: () => onAction?.(item.id, a.id),
              children: a.label
            },
            a.id
          )) }) : null,
          last && (actions.length > 0 || view === "handled") ? /* @__PURE__ */ jsx("p", { className: cn("m-0 mt-1 text-xs", last.ok ? "text-th-hi3" : "text-th-loss"), children: lastActionText(last, item, labels, clock, locale) }) : null,
          view === "snoozed" && item.snoozedUntil ? /* @__PURE__ */ jsx("p", { className: "m-0 mt-0.5 text-xs text-th-hi3", children: labels.until(dateTime(item.snoozedUntil, { locale })) }) : null,
          view === "handled" && item.handledAt ? /* @__PURE__ */ jsxs("p", { className: "m-0 mt-0.5 text-xs text-th-hi3", children: [
            labels.handledAgo(ago(item.handledAt, { now: clock, locale })),
            item.handledBy === "source" ? labels.handledByApp : item.handledBy === "expired" ? labels.handledAutomatically : ""
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
          view === "open" && wide ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(IconButton, { label: strings.inboxMarkHandled, onClick: () => onHandle(item.id), children: /* @__PURE__ */ jsx(CheckIcon, { size: 18 }) }),
            /* @__PURE__ */ jsx(DropdownMenu, { align: "end", trigger: /* @__PURE__ */ jsx(IconButton, { label: strings.inboxSnooze, children: /* @__PURE__ */ jsx(ClockIcon, { size: 18 }) }), children: snoozeItems })
          ] }) : null,
          view === "open" && !wide ? /* @__PURE__ */ jsxs(DropdownMenu, { align: "end", sheetBelow: "sm", sheetTitle: strings.inboxActions, trigger: /* @__PURE__ */ jsx(IconButton, { label: strings.inboxActions, children: /* @__PURE__ */ jsx(MoreIcon, { size: 18 }) }), children: [
            /* @__PURE__ */ jsx(MenuItem, { icon: /* @__PURE__ */ jsx(CheckIcon, { size: 14 }), onSelect: () => onHandle(item.id), children: strings.inboxMarkHandled }),
            /* @__PURE__ */ jsx(MenuSeparator, {}),
            /* @__PURE__ */ jsx(MenuLabel, { children: strings.inboxSnooze }),
            snoozeItems
          ] }) : null,
          view === "snoozed" ? /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => onUnsnooze(item.id), children: labels.unsnooze }) : null,
          view === "handled" ? /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => onUnhandle(item.id), children: labels.moveBack }) : null
        ] })
      ]
    }
  );
}
function Inbox({
  items,
  view,
  onViewChange,
  counts,
  sources,
  source,
  onSourceChange,
  onHandle,
  onUnhandle,
  onSnooze,
  onUnsnooze,
  onHandleAll,
  onAction,
  loading = false,
  error = null,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  selectedId = null,
  sourceLabels = INBOX_SOURCE_LABELS,
  labels: labelOverrides,
  className,
  ref,
  ...rest
}) {
  const strings = useInboxStrings();
  const labels = { ...DEFAULT_INBOX_LABELS, ...labelOverrides };
  const idBase = useId().replace(/:/g, "");
  const wide = useMediaQuery("(min-width: 480px)");
  const [expanded, setExpanded] = useState(() => /* @__PURE__ */ new Set());
  const [confirmAll, setConfirmAll] = useState(false);
  const [running, setRunning] = useState(() => /* @__PURE__ */ new Map());
  const scrolled = useRef(null);
  const labelOf = (id) => sourceLabels[id] ?? id;
  const rowId = (id) => `${idBase}-item-${id}`;
  useEffect(() => {
    if (selectedId == null || scrolled.current === selectedId) return;
    const el = document.getElementById(rowId(selectedId));
    if (!el) return;
    scrolled.current = selectedId;
    el.scrollIntoView({ block: "center" });
  }, [selectedId, items]);
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const runAction = (itemId, actionId) => {
    if (!onAction || running.has(itemId)) return;
    setRunning((prev) => new Map(prev).set(itemId, actionId));
    const done = () => setRunning((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
    Promise.resolve().then(() => onAction(itemId, actionId)).catch(() => void 0).finally(done);
  };
  const tabs = [
    { value: "open", label: strings.inboxOpen, count: counts.open },
    { value: "snoozed", label: strings.inboxSnoozed, count: counts.snoozed },
    { value: "handled", label: strings.inboxHandled }
  ];
  const handleAllCount = source ? sources.find((s) => s.id === source)?.open ?? items.length : counts.open;
  const showHandleAll = view === "open" && !!onHandleAll && items.length > 0 && !loading && !error;
  let body;
  if (loading) {
    body = /* @__PURE__ */ jsx(SkeletonRows, { rows: 4, height: 64, label: strings.loading, className: "p-4" });
  } else if (error) {
    body = /* @__PURE__ */ jsx(ErrorState, { message: error, onRetry, retryLabel: strings.retry, compact: true, className: "py-8" });
  } else if (items.length === 0) {
    const from = source ? labelOf(source) : null;
    const title = view === "open" ? labels.emptyOpen(from) : view === "snoozed" ? labels.emptySnoozed(from) : labels.emptyHandled(from);
    body = /* @__PURE__ */ jsx(EmptyState, { title, compact: true, className: "py-10" });
  } else {
    body = /* @__PURE__ */ jsx("ul", { className: "m-0 list-none divide-y divide-th-line p-0", children: items.map((item) => /* @__PURE__ */ jsx(
      Row,
      {
        item,
        view,
        label: labelOf(item.source),
        wide,
        labels,
        strings,
        selected: item.id === selectedId,
        expanded: expanded.has(item.id),
        domId: rowId(item.id),
        onToggle: toggle,
        onHandle,
        onUnhandle,
        onSnooze,
        onUnsnooze,
        running: running.get(item.id) ?? null,
        onAction: onAction ? runAction : void 0
      },
      item.id
    )) });
  }
  return /* @__PURE__ */ jsxs(Card, { ...rest, ref, padding: "none", className: cn("min-w-0 overflow-hidden", className), children: [
    /* @__PURE__ */ jsx(Tabs, { label: strings.inboxViews, value: view, onValueChange: (v) => onViewChange(v), items: tabs, className: "px-4" }),
    sources.length > 1 ? /* @__PURE__ */ jsx("div", { className: "min-w-0 border-b border-th-line py-2", children: /* @__PURE__ */ jsxs(ChipGroup, { label: strings.inboxFilterBySource, scroll: true, className: "px-4", children: [
      /* @__PURE__ */ jsx(Chip, { size: "sm", pressed: source === null, onClick: () => onSourceChange(null), children: labels.all }),
      sources.map((s) => /* @__PURE__ */ jsx(
        Chip,
        {
          size: "sm",
          pressed: source === s.id,
          onClick: () => onSourceChange(s.id),
          trailing: /* @__PURE__ */ jsx("span", { className: "tabular-nums text-th-hi3", children: s.open }),
          className: "shrink-0",
          children: labelOf(s.id)
        },
        s.id
      ))
    ] }) }) : null,
    showHandleAll ? /* @__PURE__ */ jsx("div", { className: "flex justify-end px-4 pt-2", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => setConfirmAll(true), children: labels.markAllHandled }) }) : null,
    body,
    hasMore && !loading && !error ? /* @__PURE__ */ jsx("div", { className: "flex justify-center border-t border-th-line p-2", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", loading: loadingMore, onClick: onLoadMore, children: labels.loadMore }) }) : null,
    confirmAll ? /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        title: labels.markAllTitle(handleAllCount),
        confirmLabel: strings.inboxMarkHandled,
        cancelLabel: strings.cancel,
        tone: "primary",
        onCancel: () => setConfirmAll(false),
        onConfirm: () => {
          setConfirmAll(false);
          onHandleAll?.();
        }
      }
    ) : null
  ] });
}
export {
  DEFAULT_INBOX_LABELS2 as DEFAULT_INBOX_LABELS,
  Inbox,
  SNOOZE_OPTIONS
};
