'use client';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import type { LayoutPresetOption } from './split-classes';

export { presetOptions, type LayoutPresetOption } from './split-classes';
import {
  computeDividers,
  computeRects,

  resizeAt,
  type Divider,
  type LayoutNode,
  type Rect,
} from '../split-layout';
import { isRtl, useIsoLayoutEffect } from './client';
import { useMediaQuery } from './hooks';
import { ScrollRow } from './nav';
import { Tooltip } from './tooltip';
import { useNishStrings } from './provider';

// Split panes: a layout tree drawn as flat, absolutely positioned panes, with drag handles
// between them and a preset picker. The math is in `@nish/ui/split-layout` (no React).

// --- Helpers ---------------------------------------------------------------------------------

function nodeAt(node: LayoutNode, path: number[]): LayoutNode | null {
  let cur: LayoutNode | null = node;
  for (const i of path) {
    if (!cur || cur.type !== 'split') return null;
    cur = cur.children[i] ?? null;
  }
  return cur;
}

function leafSlots(node: LayoutNode): number[] {
  return node.type === 'leaf' ? [node.slot] : node.children.flatMap(leafSlots);
}

/** The tree with the split at `path` set to equal sizes. Other splits are left as they are. */
function equalizeAt(node: LayoutNode, path: number[]): LayoutNode {
  if (node.type !== 'split') return node;
  if (path.length === 0) {
    const n = node.children.length;
    return { ...node, sizes: node.children.map(() => 1 / n) };
  }
  const [head, ...rest] = path;
  return {
    ...node,
    children: node.children.map((c, i) => (i === head ? equalizeAt(c, rest) : c)),
  };
}

// --- SplitDividers ---------------------------------------------------------------------------

export interface SplitDividersProps {
  /** The layout being drawn. For a narrow screen, build it with `narrowLayout`. */
  layout: LayoutNode;
  /** The width of the area the layout fills, in px. */
  w: number;
  /** The height of the area the layout fills, in px. */
  h: number;
  /** Gap between panes in px. Must match the gap the panes were positioned with. */
  gap: number;
  /** Called with the new tree while a divider moves, and on reset (equal sizes for that split). */
  onResize(next: LayoutNode): void;
  /** Called with true when a drag starts and false when it ends. */
  onDragChange?(dragging: boolean): void;
  /** The smallest a pane may get while resizing, in px (default 160 by 90). */
  minPane?: { w: number; h: number };
  /**
   * Px kept free at the top of each column divider (and above a row divider's line) so its hit
   * area stays off a pane bar shown there. Default 0.
   */
  barInset?: number;
  /** Set when the area is mirrored (right-to-left): positions are measured from the right edge,
   *  a drag to the right shrinks the first pane, and ArrowLeft grows it. `SplitStage` sets this. */
  rtl?: boolean;
  /** The DOM id of the pane in a slot, so each divider can list the panes it resizes in `aria-controls`.
   *  `SplitStage` passes it. */
  paneId?(slot: number): string | undefined;
}

interface DragStart {
  pointerId: number;
  x: number;
  y: number;
  layout: LayoutNode;
}

/**
 * Drag handles between panes. Each is a keyboard-focusable separator: arrow keys move it 2%,
 * Home and End move it to the smallest and largest pane size, Enter or a double-click resets
 * that split to equal sizes. With several handles in one direction, their names carry a number. The hit area is 24px, 44px on touch
 * screens; a thin accent bar shows on hover, focus and drag. Place it inside a `relative` box
 * that is `w` by `h` (`SplitStage` does).
 */
export function SplitDividers({ layout, w, h, gap, onResize, onDragChange, minPane, barInset = 0, rtl = false, paneId }: SplitDividersProps) {
  const strings = useNishStrings();
  const coarse = useMediaQuery('(pointer: coarse)');
  const drag = useRef<DragStart | null>(null);
  const hit = coarse ? 44 : 24;
  const baseMin = minPane ?? { w: 160, h: 90 };
  const onDragChangeRef = useRef(onDragChange);
  useEffect(() => {
    onDragChangeRef.current = onDragChange;
  });
  // Unmounting mid-drag never gets a pointerup, so report the end of the drag here.
  useEffect(
    () => () => {
      if (drag.current) {
        drag.current = null;
        onDragChangeRef.current?.(false);
      }
    },
    [],
  );

  const dividers = computeDividers(layout, w, h, gap);

  /** Length along the split's axis, for the keyboard step. */
  const splitLength = (d: Divider): number => {
    const node = nodeAt(layout, d.path);
    if (!node) return d.dir === 'row' ? w : h;
    const rects = computeRects(layout, w, h, gap);
    const own = leafSlots(node)
      .map((s) => rects[s])
      .filter((r): r is Rect => !!r);
    if (own.length === 0) return d.dir === 'row' ? w : h;
    if (d.dir === 'row') return Math.max(...own.map((r) => r.x + r.w)) - Math.min(...own.map((r) => r.x));
    return Math.max(...own.map((r) => r.y + r.h)) - Math.min(...own.map((r) => r.y));
  };

  /** The minimum pane size, capped to what fits so a divider can always move. */
  const minFor = (d: Divider): { w: number; h: number } => {
    const node = nodeAt(layout, d.path);
    const n = node && node.type === 'split' ? Math.max(node.children.length, 1) : 1;
    const len = splitLength(d);
    // Real pane room (gaps removed); the cap stays strictly below the equal share.
    const room = Math.max(0, len - gap * (n - 1));
    const cap = (room / n) * 0.5;
    return d.dir === 'row'
      ? { w: Math.min(baseMin.w, cap), h: baseMin.h }
      : { w: baseMin.w, h: Math.min(baseMin.h, cap) };
  };

  const fraction = (d: Divider): number => {
    const node = nodeAt(layout, d.path);
    return node && node.type === 'split' ? (node.sizes[d.index] ?? 0.5) : 0.5;
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, layout };
    onDragChange?.(true);
  };
  const move = (e: PointerEvent<HTMLDivElement>, d: Divider) => {
    const start = drag.current;
    if (!start || start.pointerId !== e.pointerId) return;
    const delta = d.dir === 'row' ? (rtl ? start.x - e.clientX : e.clientX - start.x) : e.clientY - start.y;
    if (delta === 0) return;
    onResize(resizeAt(start.layout, d.path, d.index, delta, w, h, gap, minFor(d)));
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    onDragChange?.(false);
  };

  const reset = (d: Divider) => onResize(equalizeAt(layout, d.path));

  const key = (e: KeyboardEvent<HTMLDivElement>, d: Divider) => {
    const horizontal = d.dir === 'row';
    // The first pane grows with ArrowRight (ArrowLeft when mirrored) or ArrowDown.
    const dec = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const inc = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    if (e.key === dec || e.key === inc) {
      e.preventDefault();
      const step = (e.key === inc ? 1 : -1) * 0.02;
      onResize(resizeAt(layout, d.path, d.index, step * splitLength(d), w, h, gap, minFor(d)));
    } else if (e.key === 'Home' || e.key === 'End') {
      // The first pane to its smallest (Home) or largest (End); resizeAt clamps to the minimum pane size.
      e.preventDefault();
      const far = (e.key === 'End' ? 1 : -1) * (w + h);
      onResize(resizeAt(layout, d.path, d.index, far, w, h, gap, minFor(d)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      reset(d);
    }
  };

  const perDir = { row: dividers.filter((d) => d.dir === 'row').length, col: dividers.filter((d) => d.dir === 'col').length };
  const seen = { row: 0, col: 0 };

  /** The ids of every pane on either side of a divider. */
  const controls = (d: Divider): string | undefined => {
    if (!paneId) return undefined;
    const node = nodeAt(layout, d.path);
    if (!node || node.type !== 'split') return undefined;
    const sides = [node.children[d.index], node.children[d.index + 1]];
    const ids = sides.flatMap((c) => (c ? leafSlots(c) : [])).map((slot) => paneId(slot));
    const list = ids.filter((id): id is string => !!id);
    return list.length > 0 ? list.join(' ') : undefined;
  };

  return (
    <>
      {dividers.map((d) => {
        const vertical = d.dir === 'row';
        const pad = (hit - (vertical ? d.w : d.h)) / 2;
        const x = rtl ? w - d.x - d.w : d.x;
        const style = vertical
          ? { left: x - pad, top: d.y + barInset, width: d.w + pad * 2, height: Math.max(0, d.h - barInset) }
          : { left: x, top: d.y - (barInset > 0 ? pad * 2 : pad), width: d.w, height: d.h + pad * 2 };
        const base = vertical ? strings.resizeColumns : strings.resizeRows;
        const nth = ++seen[d.dir];
        const pct = Math.round(fraction(d) * 100);
        return (
          <div
            key={`${d.path.join('.')}:${d.index}`}
            role="separator"
            aria-orientation={vertical ? 'vertical' : 'horizontal'}
            aria-label={perDir[d.dir] > 1 ? `${base} ${nth}` : base}
            aria-controls={controls(d)}
            aria-valuenow={pct}
            aria-valuetext={`${pct}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onPointerDown={down}
            onPointerMove={(e) => move(e, d)}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={(e) => key(e, d)}
            onDoubleClick={() => reset(d)}
            style={{ ...style, touchAction: 'none' }}
            className={cn(
              'group absolute z-20 flex items-center justify-center outline-none',
              vertical ? 'cursor-col-resize' : 'cursor-row-resize',
            )}
          >
            <span
              className={cn(
                'rounded-full bg-th-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 forced-colors:bg-[Highlight]',
                vertical ? 'h-full w-1' : 'h-1 w-full',
              )}
            />
          </div>
        );
      })}
    </>
  );
}

// --- SplitStage ------------------------------------------------------------------------------

export interface SplitStageProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** The layout tree; null renders no panes. Leaves cover slots 0..n-1. */
  layout: LayoutNode | null;
  /** Item ids in DOM order. Keep this order stable (for example, insertion order); never sort it by slot, or panes move in the DOM and iframes reload. */
  items: string[];
  /** The item id in each slot. Ids not in slots are not rendered. */
  slots: string[];
  /** Gap between panes in px (default 4). */
  gap?: number;
  /** Shows the dividers and lets them resize the layout. */
  resizable?: boolean;
  /** Called with the new tree while a divider moves (resizeAt), and on reset (equalize that split). */
  onLayoutChange?(layout: LayoutNode): void;
  /** Renders one pane's content; the stage positions it. */
  renderPane(id: string, info: { rect: Rect; slot: number }): ReactNode;
  /** Reports the measured size (for addSlot, which needs it). */
  onSize?(size: { w: number; h: number }): void;
  /** Sets data-dragging on the stage (an app's own pane drag); dividers set it while they move. */
  dragging?: boolean;
  /** Animate position changes (default true; off under prefers-reduced-motion and while dragging). */
  animate?: boolean;
  /** The smallest a pane may get while resizing, in px (default 160 by 90). Passed to the dividers. */
  minPane?: { w: number; h: number };
  /** Px kept free at the top of column dividers so handles stay off pane bars (see SplitDividers). */
  barInset?: number;
  /** Extra elements over the stage (an overlay preset bar, a drag ghost). */
  children?: ReactNode;
  className?: string;
}

/**
 * Draws a split layout as flat panes. Every pane is an absolutely positioned child keyed by its
 * item id and rendered in the order of `items`, so presets, resizing and swapping only change
 * style values and never move a DOM node (a moved iframe reloads). Give the stage a size from
 * its parent (for example `flex-1 min-h-0`); it measures itself.
 */
export function SplitStage({
  layout,
  items,
  slots,
  gap = 4,
  resizable = false,
  onLayoutChange,
  renderPane,
  onSize,
  dragging = false,
  animate = true,
  minPane,
  barInset,
  children,
  className,
  ref: forwardedRef,
  ...rest
}: SplitStageProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) (forwardedRef as { current: HTMLDivElement | null }).current = node;
    },
    [forwardedRef],
  );
  const paneBase = useId();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [rtl, setRtl] = useState(false);
  const [resizing, setResizing] = useState(false);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const showDividers = resizable && !!layout && slots.length > 1;
  // The dividers unmount when they are no longer shown; a drag then never ends on its own.
  if (!showDividers && resizing) setResizing(false);
  const onSizeRef = useRef(onSize);
  useEffect(() => {
    onSizeRef.current = onSize;
  });

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      const mirrored = isRtl(el);
      setRtl((prev) => (prev === mirrored ? prev : mirrored));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    onSizeRef.current?.(size);
  }, [size]);

  const measured = size.w > 0 && size.h > 0;
  const rects = layout && measured ? computeRects(layout, size.w, size.h, gap) : [];
  const active = dragging || resizing;
  const move = animate && !reduced && !active;
  const transition = move
    ? 'left 180ms ease-out, top 180ms ease-out, width 180ms ease-out, height 180ms ease-out'
    : 'none';

  return (
    <div {...rest} ref={setRef} className={cn('relative overflow-hidden', className)} {...(active ? { 'data-dragging': '' } : {})}>
      {layout &&
        // DOM order follows `items`, not slot order, so a swap never moves a node.
        items.map((id) => {
          const slot = slots.indexOf(id);
          const rect = slot >= 0 ? rects[slot] : undefined;
          if (!rect) return null;
          return (
            <div
              key={id}
              id={`${paneBase}-pane-${slot}`}
              data-split-pane={id}
              style={{
                position: 'absolute',
                left: rtl ? size.w - rect.x - rect.w : rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
                transition,
              }}
            >
              {renderPane(id, { rect, slot })}
            </div>
          );
        })}
      {showDividers && measured && layout && (
        <SplitDividers
          layout={layout}
          w={size.w}
          h={size.h}
          gap={gap}
          onResize={(next) => onLayoutChange?.(next)}
          onDragChange={setResizing}
          rtl={rtl}
          paneId={(slot) => (slots[slot] !== undefined && items.includes(slots[slot]) ? `${paneBase}-pane-${slot}` : undefined)}
          {...(minPane ? { minPane } : {})}
          {...(barInset ? { barInset } : {})}
        />
      )}
      {children}
    </div>
  );
}

// --- LayoutPresetIcon ------------------------------------------------------------------------

export interface LayoutPresetIconProps extends Omit<ComponentPropsWithRef<'svg'>, 'width' | 'height' | 'children'> {
  /** The layout to draw: one rounded rectangle per pane. */
  node: LayoutNode;
  /** Width of the drawing in px (default 56). */
  width?: number;
  /** Height of the drawing in px (default 36). */
  height?: number;
  className?: string;
}

/** A small drawing of a layout in the current text color. Decorative: name it with a label beside it. */
export function LayoutPresetIcon({ node, width = 56, height = 36, className, ref, ...rest }: LayoutPresetIconProps) {
  const rects = computeRects(node, width - 4, height - 4, 2);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
      ref={ref}
      {...(className ? { className } : {})}
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x + 2.5}
          y={r.y + 2.5}
          width={Math.max(r.w - 1, 1)}
          height={Math.max(r.h - 1, 1)}
          rx={2}
          fill="currentColor"
          fillOpacity={0.14}
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

// --- LayoutPresetPicker ----------------------------------------------------------------------

export interface LayoutPresetPickerProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange' | 'children'> {
  /** One radio per option. */
  options: LayoutPresetOption[];
  /** The id of the chosen option, or null when the layout is custom (for example after a resize). */
  value: string | null;
  /** Called with the id of the option picked. */
  onChange(id: string): void;
  /** Controls shown at the right of the bar, for example an "Equal sizes" button. */
  actions?: ReactNode;
  /** A hint shown at lg and up, for example "Drag the lines to resize." */
  note?: ReactNode;
  /** Translucent with blur and a shadow, for a bar floating over the stage. */
  overlay?: boolean;
  /** Extra classes for the bar, for example an inset like `pr-52`. */
  className?: string;
  /** Name of the radio group for screen readers. Default: the `layoutPresets` string ("Layout presets"). */
  label?: string;
}


/** A bar of layout presets: one icon radio per option in a scrolling row, with a tooltip hint on each. */
export function LayoutPresetPicker({
  options,
  value,
  onChange,
  actions,
  note,
  overlay = false,
  className,
  label: labelProp,
  ref,
  ...rest
}: LayoutPresetPickerProps) {
  const strings = useNishStrings();
  const label = labelProp ?? strings.layoutPresets;
  const group = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = options.length;
    if (n === 0) return;
    let to = -1;
    const cur = Math.max(0, options.findIndex((o) => o.id === value));
    // The row reads right to left on a right-to-left page: ArrowLeft goes to the next option.
    const rtl = isRtl(group.current);
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward || e.key === 'ArrowDown') to = (cur + 1) % n;
    else if (e.key === backward || e.key === 'ArrowUp') to = (cur - 1 + n) % n;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    const next = options[to];
    if (!next) return;
    onChange(next.id);
    group.current?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus();
  };
  return (
    <div
      {...rest}
      ref={ref}
      className={cn(
        'flex shrink-0 items-center gap-3 border-b border-th-line px-3 py-2',
        overlay ? 'bg-th-surface/85 shadow-lg backdrop-blur-md' : 'bg-th-surface',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <ScrollRow label={label}>
          <div
            ref={group}
            role="radiogroup"
            aria-label={label}
            onKeyDown={onKeyDown}
            className="flex items-start gap-1"
          >
            {options.map((o, i) => {
              const on = value === o.id;
              const hasValue = options.some((x) => x.id === value);
              return (
                <Tooltip key={o.id} tip={o.hint} side="bottom" focusable={false}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on || (!hasValue && i === 0) ? 0 : -1}
                    aria-label={`${o.label}: ${o.hint}`}
                    data-state={on ? 'checked' : 'unchecked'}
                    onClick={() => onChange(o.id)}
                    className={cn(
                      'flex min-h-11 shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-1 text-xs',
                      'focus-visible:outline-2 focus-visible:outline-th-accent',
                      on
                        ? 'border-th-accent bg-th-accent-soft text-th-hi forced-color-adjust-none forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]'
                        : 'border-transparent text-th-hi3 hover:bg-th-elevated hover:text-th-hi2 forced-colors:border-[ButtonText]',
                    )}
                  >
                    <LayoutPresetIcon node={o.node} />
                    <span className="whitespace-nowrap">{o.label}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </ScrollRow>
      </div>
      {actions}
      {note ? <p className="hidden shrink-0 text-xs text-th-hi3 lg:block">{note}</p> : null}
    </div>
  );
}
