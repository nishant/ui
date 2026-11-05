// Pure helpers of TreeView: the node type, the flattened visible list and the row classes. No directive.
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { FORCED_MARK } from './display-classes';

export interface TreeNode {
  /** Unique in the whole tree; keys selection and expansion. */
  id: string;
  /** The row text (also what typing a letter jumps to). */
  label: string;
  /** Leading icon (16px reads best). */
  icon?: ReactNode;
  /** Right-aligned extra: a count or a badge. */
  trailing?: ReactNode;
  /** Child nodes. An empty array counts as a leaf. */
  children?: TreeNode[];
  /** Shown and focusable, but cannot be selected or activated. */
  disabled?: boolean;
}

export interface FlatTreeNode {
  node: TreeNode;
  level: number;
  parentId: string | null;
  posInSet: number;
  setSize: number;
}

/** True when the node has at least one child. */
export function hasChildren(node: TreeNode): boolean {
  return !!node.children && node.children.length > 0;
}

/** Visible nodes in display order (children of expanded parents only). level starts at 1, posInSet at 1. */
export function visibleNodes(items: readonly TreeNode[], expanded: ReadonlySet<string>): FlatTreeNode[] {
  const out: FlatTreeNode[] = [];
  const walk = (nodes: readonly TreeNode[], level: number, parentId: string | null) => {
    nodes.forEach((node, i) => {
      out.push({ node, level, parentId, posInSet: i + 1, setSize: nodes.length });
      if (hasChildren(node) && expanded.has(node.id)) walk(node.children!, level + 1, node.id);
    });
  };
  walk(items, 1, null);
  return out;
}

/** Map of node id to parent id (null for roots) over the whole tree. */
export function parentMap(items: readonly TreeNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>();
  const walk = (nodes: readonly TreeNode[], parentId: string | null) => {
    for (const node of nodes) {
      if (!map.has(node.id)) map.set(node.id, parentId);
      if (node.children) walk(node.children, node.id);
    }
  };
  walk(items, null);
  return map;
}

/** Ids that appear more than once, in first-seen order. */
export function duplicateIds(items: readonly TreeNode[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  const walk = (nodes: readonly TreeNode[]) => {
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

/** Classes of one row. */
export function treeRowClass({ selected, disabled, className }: { selected?: boolean; disabled?: boolean; className?: string }): string {
  return cn(
    'flex min-h-8 w-full cursor-pointer select-none items-center gap-1.5 rounded-md pe-2 text-start transition-colors pointer-coarse:min-h-11',
    selected ? `bg-th-accent-soft font-medium text-th-accent ${FORCED_MARK}` : !disabled && 'text-th-hi2 hover:bg-th-overlay hover:text-th-hi',
    disabled && 'cursor-default text-th-ghost forced-colors:text-[GrayText]',
    className,
  );
}
