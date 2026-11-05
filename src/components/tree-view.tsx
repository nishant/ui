'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { isRtl, useIsoLayoutEffect } from './client';
import { warnOnce } from './data-classes';
import { duplicateIds, hasChildren, parentMap, treeRowClass, visibleNodes, type TreeNode } from './tree-view-classes';

export type { TreeNode } from './tree-view-classes';

export interface TreeViewProps extends Omit<ComponentPropsWithoutRef<'ul'>, 'children' | 'className' | 'onSelect' | 'defaultValue'> {
  /** The root nodes. */
  items: TreeNode[];
  /** Ids of the open parents, when you control expansion. */
  expanded?: string[];
  /** Ids open on mount when uncontrolled. Default none. */
  defaultExpanded?: string[];
  /** Called with every open id after a node opens or closes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** The selected id, when you control selection (null for none). */
  selected?: string | null;
  /** The id selected on mount when uncontrolled. Default none. */
  defaultSelected?: string | null;
  /** Called when a node is selected (click, Enter, Space). */
  onSelectedChange?: (id: string, node: TreeNode) => void;
  /** Called when a node is activated (click or Enter): navigate or open it here. */
  onActivate?: (node: TreeNode) => void;
  /** Whether nodes can be selected (aria-selected). Default true. false: activation only. */
  selectable?: boolean;
  /** A click or Enter on a parent also opens or closes it. Default true. false: only the chevron, the arrow keys and * do. */
  toggleOnSelect?: boolean;
  /** Accessible name of the tree. Give this or aria-labelledby. */
  'aria-label'?: string;
  /** Id of the element that names the tree. */
  'aria-labelledby'?: string;
  /** Classes for the tree (the ul). */
  className?: string;
  /** The tree element (role="tree"). */
  ref?: Ref<HTMLUListElement>;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('transition-transform motion-reduce:transition-none rtl:-scale-x-100', open && 'rotate-90 rtl:-rotate-90')}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** A tree of nested items, like folders or a section outline, following the WAI-ARIA tree view pattern:
 *  open and close branches, select one item, arrow keys, Home, End, type a letter to jump, * to open siblings. */
export function TreeView(props: TreeViewProps) {
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

  const [internalExpanded, setInternalExpanded] = useState<string[]>(() => defaultExpanded ?? []);
  const expandedControlled = expandedProp !== undefined;
  const expandedList = expandedControlled ? expandedProp : internalExpanded;
  const expandedSet = useMemo(() => new Set(expandedList), [expandedList]);

  const [internalSelected, setInternalSelected] = useState<string | null>(() => defaultSelected ?? null);
  const selectedId = selectedProp !== undefined ? selectedProp : internalSelected;

  const [focusedId, setFocusedId] = useState<string | null>(null);

  const flat = useMemo(() => visibleNodes(items, expandedSet), [items, expandedSet]);
  const parents = useMemo(() => parentMap(items), [items]);

  let targetId: string | null = null;
  if (flat.length > 0) {
    const visible = new Set(flat.map((f) => f.node.id));
    let cursor: string | null | undefined = focusedId;
    while (cursor != null && !visible.has(cursor)) cursor = parents.get(cursor);
    if (cursor != null) targetId = cursor;
    else if (selectedId != null && visible.has(selectedId)) targetId = selectedId;
    else targetId = flat[0]!.node.id;
  }

  const elements = useRef(new Map<string, HTMLLIElement>());
  const pendingFocus = useRef<string | null>(null);
  const focusWithin = useRef(false);
  const lastFocused = useRef<HTMLElement | null>(null);

  const setExpanded = (next: Set<string>) => {
    const list = [...next];
    if (!expandedControlled) setInternalExpanded(list);
    onExpandedChange?.(list);
  };
  const expand = (id: string) => {
    if (!expandedSet.has(id)) setExpanded(new Set(expandedSet).add(id));
  };
  const collapse = (id: string) => {
    if (!expandedSet.has(id)) return;
    const next = new Set(expandedSet);
    next.delete(id);
    setExpanded(next);
  };
  const toggle = (id: string) => (expandedSet.has(id) ? collapse(id) : expand(id));

  const select = (node: TreeNode) => {
    if (!selectable || node.disabled) return;
    if (selectedProp === undefined) setInternalSelected(node.id);
    onSelectedChange?.(node.id, node);
  };
  const activate = (node: TreeNode) => {
    if (node.disabled) return;
    onActivate?.(node);
  };

  const focusNode = (id: string) => {
    setFocusedId(id);
    pendingFocus.current = id;
    const el = elements.current.get(id);
    if (el) {
      pendingFocus.current = null;
      el.focus();
    }
  };

  // Moves focus to a node that was not mounted when focusNode ran, and keeps focus in the tree when the
  // focused node was removed (its branch collapsed) and the browser dropped focus to the body.
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
    if (focusWithin.current && last && !last.isConnected && typeof document !== 'undefined' && document.activeElement === document.body && targetId !== null) {
      lastFocused.current = null;
      elements.current.get(targetId)?.focus();
    }
  });

  useEffect(() => {
    const dupes = duplicateIds(items);
    if (dupes.length > 0) warnOnce('tree-dup', `TreeView: node ids must be unique; "${dupes[0]}" appears more than once.`);
  }, [items]);
  const labelled = !!(rest['aria-label'] || rest['aria-labelledby']);
  useEffect(() => {
    if (!labelled) warnOnce('tree-label', 'TreeView: give the tree an aria-label or aria-labelledby.');
  }, [labelled]);

  const onFocus = (e: FocusEvent<HTMLUListElement>) => {
    onFocusProp?.(e);
    focusWithin.current = true;
    const t = e.target as HTMLElement;
    if (t.getAttribute('role') === 'treeitem') {
      lastFocused.current = t;
      const id = t.getAttribute('data-id');
      if (id !== null) setFocusedId(id);
    }
  };
  const onBlur = (e: FocusEvent<HTMLUListElement>) => {
    onBlurProp?.(e);
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next)) focusWithin.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    onKeyDownProp?.(e);
    if (e.defaultPrevented) return;
    const target = e.target as HTMLElement;
    if (target.getAttribute('role') !== 'treeitem') return;
    const id = target.getAttribute('data-id');
    const index = flat.findIndex((f) => f.node.id === id);
    if (index < 0) return;
    const current = flat[index]!;
    const node = current.node;
    const parent = hasChildren(node);
    const open = parent && expandedSet.has(node.id);
    const rtl = isRtl(e.currentTarget);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const go = (i: number) => {
      const f = flat[i];
      if (f) focusNode(f.node.id);
    };

    if (e.key === 'ArrowDown') go(Math.min(index + 1, flat.length - 1));
    else if (e.key === 'ArrowUp') go(Math.max(index - 1, 0));
    else if (e.key === forward) {
      if (parent && !open) expand(node.id);
      else if (open) go(index + 1);
    } else if (e.key === back) {
      if (open) collapse(node.id);
      else if (current.parentId !== null) focusNode(current.parentId);
    } else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(flat.length - 1);
    else if (e.key === 'Enter') {
      select(node);
      activate(node);
      if (parent && toggleOnSelect) toggle(node.id);
    } else if (e.key === ' ') select(node);
    else if (e.key === '*') {
      const next = new Set(expandedSet);
      for (const f of flat) if (f.parentId === current.parentId && hasChildren(f.node)) next.add(f.node.id);
      if (next.size !== expandedSet.size) setExpanded(next);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const ch = e.key.toLowerCase();
      for (let step = 1; step < flat.length; step++) {
        const f = flat[(index + step) % flat.length]!;
        if (f.node.label.toLowerCase().startsWith(ch)) {
          focusNode(f.node.id);
          break;
        }
      }
    } else return;
    e.preventDefault();
  };

  const itemRef = (id: string) => (el: HTMLLIElement | null) => {
    if (!el) return undefined;
    elements.current.set(id, el);
    return () => {
      if (elements.current.get(id) === el) elements.current.delete(id);
    };
  };

  const renderNodes = (nodes: readonly TreeNode[], level: number): ReactNode =>
    nodes.map((node, i) => {
      const parent = hasChildren(node);
      const open = parent && expandedSet.has(node.id);
      const isSelected = selectedId === node.id;
      const labelId = `${uid}-${encodeURIComponent(node.id)}`;
      const onRowClick = () => {
        focusNode(node.id);
        select(node);
        activate(node);
        if (parent && toggleOnSelect) toggle(node.id);
      };
      const onToggleClick = (e: MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        focusNode(node.id);
        toggle(node.id);
      };
      return (
        <li
          key={node.id}
          ref={itemRef(node.id)}
          role="treeitem"
          data-id={node.id}
          aria-labelledby={labelId}
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-expanded={parent ? open : undefined}
          aria-selected={selectable ? isSelected : undefined}
          aria-disabled={node.disabled || undefined}
          data-state={parent ? (open ? 'open' : 'closed') : undefined}
          data-disabled={node.disabled ? '' : undefined}
          tabIndex={node.id === targetId ? 0 : -1}
          className="outline-none [&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-th-accent"
        >
          <div
            className={treeRowClass({ selected: selectable && isSelected, disabled: node.disabled })}
            style={{ paddingInlineStart: `calc(${level - 1} * 1.25rem + 0.25rem)` }}
            onClick={onRowClick}
          >
            <span
              aria-hidden="true"
              data-tree-toggle=""
              onClick={parent ? onToggleClick : undefined}
              className="inline-flex w-6 shrink-0 self-stretch items-center justify-center text-th-hi3 pointer-coarse:w-11"
            >
              {parent ? <Chevron open={open} /> : null}
            </span>
            {node.icon ? (
              <span aria-hidden="true" className="inline-flex shrink-0 text-th-hi3">
                {node.icon}
              </span>
            ) : null}
            <span id={labelId} className="min-w-0 flex-1 truncate">
              {node.label}
            </span>
            {node.trailing != null ? <span className="ms-auto shrink-0 text-xs text-th-hi3">{node.trailing}</span> : null}
          </div>
          {open ? (
            <ul role="group" className="grid gap-px">
              {renderNodes(node.children!, level + 1)}
            </ul>
          ) : null}
        </li>
      );
    });

  return (
    <ul {...rest} ref={ref} role="tree" className={cn('grid gap-px text-sm', className)} onKeyDown={onKeyDown} onFocus={onFocus} onBlur={onBlur}>
      {renderNodes(items, 1)}
    </ul>
  );
}
