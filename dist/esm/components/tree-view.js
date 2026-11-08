"use client";

// src/components/tree-view.tsx
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { cn } from "../cn.js";
import { isRtl, useIsoLayoutEffect } from "./client.js";
import { warnOnce } from "./data-classes.js";
import { useLatest } from "./latest.js";
import { duplicateIds, hasChildren, parentMap, treeRowClass, visibleNodes } from "./tree-view-classes.js";
import { jsx, jsxs } from "react/jsx-runtime";
function Chevron({ open }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      className: cn("transition-transform motion-reduce:transition-none rtl:-scale-x-100", open && "rotate-90 rtl:-rotate-90"),
      children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" })
    }
  );
}
var TreeItem = memo(function TreeItem2({
  node,
  level,
  posinset,
  setsize,
  open,
  selectable,
  selected,
  isTarget,
  labelId,
  itemRef,
  onRowClick,
  onToggle,
  children
}) {
  const parent = hasChildren(node);
  return /* @__PURE__ */ jsxs(
    "li",
    {
      ref: itemRef,
      role: "treeitem",
      "data-id": node.id,
      "aria-labelledby": labelId,
      "aria-level": level,
      "aria-setsize": setsize,
      "aria-posinset": posinset,
      "aria-expanded": parent ? open : void 0,
      "aria-selected": selectable ? selected : void 0,
      "aria-disabled": node.disabled || void 0,
      "data-state": parent ? open ? "open" : "closed" : void 0,
      "data-disabled": node.disabled ? "" : void 0,
      tabIndex: isTarget ? 0 : -1,
      className: "outline-none [&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-th-accent",
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: treeRowClass({ selected: selectable && selected, disabled: node.disabled }),
            style: { paddingInlineStart: `calc(${level - 1} * 1.25rem + 0.25rem)` },
            onClick: () => onRowClick(node),
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": "true",
                  "data-tree-toggle": "",
                  onClick: parent ? (e) => {
                    e.stopPropagation();
                    onToggle(node);
                  } : void 0,
                  className: "inline-flex w-6 shrink-0 self-stretch items-center justify-center text-th-hi3 pointer-coarse:w-11",
                  children: parent ? /* @__PURE__ */ jsx(Chevron, { open }) : null
                }
              ),
              node.icon ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "inline-flex shrink-0 text-th-hi3", children: node.icon }) : null,
              /* @__PURE__ */ jsx("span", { id: labelId, className: "min-w-0 flex-1 truncate", children: node.label }),
              node.trailing != null ? /* @__PURE__ */ jsx("span", { className: "ms-auto shrink-0 text-xs text-th-hi3", children: node.trailing }) : null
            ]
          }
        ),
        open ? /* @__PURE__ */ jsx("ul", { role: "group", className: "grid gap-px", children }) : null
      ]
    }
  );
});
function TreeView(props) {
  const {
    items,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    selected: selectedProp,
    defaultSelected,
    onSelectedChange,
    onActivate,
    selectable = true,
    toggleOnSelect = true,
    className,
    ref,
    onKeyDown: onKeyDownProp,
    onFocus: onFocusProp,
    onBlur: onBlurProp,
    ...rest
  } = props;
  const uid = useId();
  const [internalExpanded, setInternalExpanded] = useState(() => defaultExpanded ?? []);
  const expandedControlled = expandedProp !== void 0;
  const expandedList = expandedControlled ? expandedProp : internalExpanded;
  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);
  const [internalSelected, setInternalSelected] = useState(() => defaultSelected ?? null);
  const selectedId = selectedProp !== void 0 ? selectedProp : internalSelected;
  const [focusedId, setFocusedId] = useState(null);
  const flat = useMemo(() => visibleNodes(items, expandedSet), [items, expandedSet]);
  const parents = useMemo(() => parentMap(items), [items]);
  const visible = useMemo(() => new Set(flat.map((f) => f.node.id)), [flat]);
  let targetId = null;
  if (flat.length > 0) {
    let cursor = focusedId;
    while (cursor != null && !visible.has(cursor)) cursor = parents.get(cursor);
    if (cursor != null) targetId = cursor;
    else if (selectedId != null && visible.has(selectedId)) targetId = selectedId;
    else targetId = flat[0].node.id;
  }
  const elements = useRef(/* @__PURE__ */ new Map());
  const pendingFocus = useRef(null);
  const focusWithin = useRef(false);
  const lastFocused = useRef(null);
  const setExpanded = (next) => {
    const list = [...next];
    if (!expandedControlled) setInternalExpanded(list);
    onExpandedChange?.(list);
  };
  const expand = (id) => {
    if (!expandedSet.has(id)) setExpanded(new Set(expandedSet).add(id));
  };
  const collapse = (id) => {
    if (!expandedSet.has(id)) return;
    const next = new Set(expandedSet);
    next.delete(id);
    setExpanded(next);
  };
  const toggle = (id) => expandedSet.has(id) ? collapse(id) : expand(id);
  const select = (node) => {
    if (!selectable || node.disabled) return;
    if (selectedProp === void 0) setInternalSelected(node.id);
    onSelectedChange?.(node.id, node);
  };
  const activate = (node) => {
    if (node.disabled) return;
    onActivate?.(node);
  };
  const focusNode = (id) => {
    setFocusedId(id);
    pendingFocus.current = id;
    const el = elements.current.get(id);
    if (el) {
      pendingFocus.current = null;
      el.focus();
    }
  };
  useIsoLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (pending !== null) {
      const el = elements.current.get(pending);
      if (el) {
        pendingFocus.current = null;
        el.focus();
        return;
      }
    }
    const last = lastFocused.current;
    if (focusWithin.current && last && !last.isConnected && typeof document !== "undefined" && document.activeElement === document.body && targetId !== null) {
      lastFocused.current = null;
      elements.current.get(targetId)?.focus();
    }
  });
  useEffect(() => {
    const dupes = duplicateIds(items);
    if (dupes.length > 0) warnOnce("tree-dup", `TreeView: node ids must be unique; "${dupes[0]}" appears more than once.`);
  }, [items]);
  const labelled = !!(rest["aria-label"] || rest["aria-labelledby"]);
  useEffect(() => {
    if (!labelled) warnOnce("tree-label", "TreeView: give the tree an aria-label or aria-labelledby.");
  }, [labelled]);
  const onFocus = (e) => {
    onFocusProp?.(e);
    focusWithin.current = true;
    const t = e.target;
    if (t.getAttribute("role") === "treeitem") {
      lastFocused.current = t;
      const id = t.getAttribute("data-id");
      if (id !== null) setFocusedId(id);
    }
  };
  const onBlur = (e) => {
    onBlurProp?.(e);
    const next = e.relatedTarget;
    if (next ? !e.currentTarget.contains(next) : e.target.isConnected) focusWithin.current = false;
  };
  const onKeyDown = (e) => {
    onKeyDownProp?.(e);
    if (e.defaultPrevented) return;
    const target = e.target;
    if (target.getAttribute("role") !== "treeitem") return;
    const id = target.getAttribute("data-id");
    const index = flat.findIndex((f) => f.node.id === id);
    if (index < 0) return;
    const current = flat[index];
    const node = current.node;
    const parent = hasChildren(node);
    const open = parent && expandedSet.has(node.id);
    const rtl = isRtl(e.currentTarget);
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const go = (i) => {
      const f = flat[i];
      if (f) focusNode(f.node.id);
    };
    if (e.key === "ArrowDown") go(Math.min(index + 1, flat.length - 1));
    else if (e.key === "ArrowUp") go(Math.max(index - 1, 0));
    else if (e.key === forward) {
      if (parent && !open) expand(node.id);
      else if (open) go(index + 1);
    } else if (e.key === back) {
      if (open) collapse(node.id);
      else if (current.parentId !== null) focusNode(current.parentId);
    } else if (e.key === "Home") go(0);
    else if (e.key === "End") go(flat.length - 1);
    else if (e.key === "Enter") {
      select(node);
      activate(node);
      if (parent && toggleOnSelect) toggle(node.id);
    } else if (e.key === " ") select(node);
    else if (e.key === "*") {
      const next = new Set(expandedSet);
      for (const f of flat) if (f.parentId === current.parentId && hasChildren(f.node)) next.add(f.node.id);
      if (next.size !== expandedSet.size) setExpanded(next);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ch = e.key.toLowerCase();
      for (let step = 1; step < flat.length; step++) {
        const f = flat[(index + step) % flat.length];
        if (f.node.label.toLowerCase().startsWith(ch)) {
          focusNode(f.node.id);
          break;
        }
      }
    } else return;
    e.preventDefault();
  };
  const itemRef = useCallback((el) => {
    const id = el?.getAttribute("data-id");
    if (!el || id == null) return void 0;
    elements.current.set(id, el);
    return () => {
      if (elements.current.get(id) === el) elements.current.delete(id);
    };
  }, []);
  const latest = useLatest({ focusNode, select, activate, toggle, toggleOnSelect });
  const onRowClick = useCallback(
    (node) => {
      const l = latest.current;
      l.focusNode(node.id);
      l.select(node);
      l.activate(node);
      if (hasChildren(node) && l.toggleOnSelect) l.toggle(node.id);
    },
    [latest]
  );
  const onToggle = useCallback(
    (node) => {
      const l = latest.current;
      l.focusNode(node.id);
      l.toggle(node.id);
    },
    [latest]
  );
  const renderNodes = (nodes, level) => nodes.map((node, i) => {
    const open = hasChildren(node) && expandedSet.has(node.id);
    return /* @__PURE__ */ jsx(
      TreeItem,
      {
        node,
        level,
        posinset: i + 1,
        setsize: nodes.length,
        open,
        selectable,
        selected: selectedId === node.id,
        isTarget: node.id === targetId,
        labelId: `${uid}-${encodeURIComponent(node.id)}`,
        itemRef,
        onRowClick,
        onToggle,
        children: open ? renderNodes(node.children, level + 1) : null
      },
      node.id
    );
  });
  return /* @__PURE__ */ jsx("ul", { ...rest, ref, role: "tree", className: cn("grid gap-px text-sm", className), onKeyDown, onFocus, onBlur, children: renderNodes(items, 1) });
}
export {
  TreeView
};
