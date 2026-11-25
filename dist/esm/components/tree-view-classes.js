// src/components/tree-view-classes.ts
import { cn } from "../cn.js";
import { FORCED_MARK } from "./display-classes.js";
function hasChildren(node) {
  return !!node.children && node.children.length > 0;
}
function visibleNodes(items, expanded) {
  const out = [];
  const walk = (nodes, level, parentId) => {
    nodes.forEach((node, i) => {
      out.push({ node, level, parentId, posInSet: i + 1, setSize: nodes.length });
      if (hasChildren(node) && expanded.has(node.id)) walk(node.children, level + 1, node.id);
    });
  };
  walk(items, 1, null);
  return out;
}
function parentMap(items) {
  const map = /* @__PURE__ */ new Map();
  const walk = (nodes, parentId) => {
    for (const node of nodes) {
      if (!map.has(node.id)) map.set(node.id, parentId);
      if (node.children) walk(node.children, node.id);
    }
  };
  walk(items, null);
  return map;
}
function duplicateIds(items) {
  const seen = /* @__PURE__ */ new Set();
  const dupes = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (seen.has(node.id)) {
        if (!dupes.includes(node.id)) dupes.push(node.id);
      } else seen.add(node.id);
      if (node.children) walk(node.children);
    }
  };
  walk(items);
  return dupes;
}
function treeRowClass({ selected, disabled, className }) {
  return cn(
    "flex min-h-8 w-full cursor-pointer select-none items-center gap-1.5 rounded-md pe-2 text-start transition-colors pointer-coarse:min-h-11",
    selected ? `bg-th-accent-soft font-medium text-th-accent ${FORCED_MARK}` : !disabled && "text-th-hi2 hover:bg-th-overlay hover:text-th-hi",
    disabled && "cursor-default text-th-ghost forced-colors:text-[GrayText]",
    className
  );
}
export {
  duplicateIds,
  hasChildren,
  parentMap,
  treeRowClass,
  visibleNodes
};
