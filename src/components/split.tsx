import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import {
  computeDividers,
  computeRects,
  presetsFor,
  resizeAt,
  type Divider,
  type LayoutNode,
  type Rect,
} from '../split-layout';
import { useMediaQuery } from './hooks';
import { ScrollRow } from './nav';
import { Tooltip } from './overlay';

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
}

interface DragStart {
  pointerId: number;
  x: number;
  y: number;
  layout: LayoutNode;
}

/**
 * Drag handles between panes. Each is a keyboard-focusable separator: arrow keys move it 2%,
 * Enter or a double-click resets that split to equal sizes. The hit area is 24px, 44px on touch
 * screens; a thin accent bar shows on hover, focus and drag. Place it inside a `relative` box
 * that is `w` by `h` (`SplitStage` does).
 */
export function SplitDividers({ layout, w, h, gap, onResize, onDragChange, minPane }: SplitDividersProps) {
  const coarse = useMediaQuery('(pointer: coarse)');
  const drag = useRef<DragStart | null>(null);
  const hit = coarse ? 44 : 24;
  const min = minPane ?? { w: 160, h: 90 };

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
    const delta = d.dir === 'row' ? e.clientX - start.x : e.clientY - start.y;
    if (delta === 0) return;
    onResize(resizeAt(start.layout, d.path, d.index, delta, w, h, gap, min));
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
    const dec = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const inc = horizontal ? 'ArrowRight' : 'ArrowDown';
    if (e.key === dec || e.key === inc) {
      e.preventDefault();
      const step = (e.key === inc ? 1 : -1) * 0.02;
      onResize(resizeAt(layout, d.path, d.index, step * splitLength(d), w, h, gap, min));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      reset(d);
    }
  };

  return (
    <>
      {dividers.map((d) => {
        const vertical = d.dir === 'row';
        const pad = (hit - (vertical ? d.w : d.h)) / 2;
        const style = vertical
          ? { left: d.x - pad, top: d.y, width: d.w + pad * 2, height: d.h }
          : { left: d.x, top: d.y - pad, width: d.w, height: d.h + pad * 2 };
        return (
          <div
            key={`${d.path.join('.')}:${d.index}`}
            role="separator"
            aria-orientation={vertical ? 'vertical' : 'horizontal'}
            aria-label={vertical ? 'Resize columns' : 'Resize rows'}
            aria-valuenow={Math.round(fraction(d) * 100)}
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
                'rounded-full bg-th-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100',
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

export interface SplitStageProps {
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
  children,
  className,
}: SplitStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [resizing, setResizing] = useState(false);
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const onSizeRef = useRef(onSize);
  useEffect(() => {
    onSizeRef.current = onSize;
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
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
    <div ref={ref} className={cn('relative overflow-hidden', className)} {...(active ? { 'data-dragging': '' } : {})}>
      {layout &&
        // DOM order follows `items`, not slot order, so a swap never moves a node.
        items.map((id) => {
          const slot = slots.indexOf(id);
          const rect = slot >= 0 ? rects[slot] : undefined;
          if (!rect) return null;
          return (
            <div
              key={id}
              data-split-pane={id}
              style={{
                position: 'absolute',
                left: rect.x,
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
      {resizable && layout && measured && slots.length > 1 && (
        <SplitDividers
          layout={layout}
          w={size.w}
          h={size.h}
          gap={gap}
          onResize={(next) => onLayoutChange?.(next)}
          onDragChange={setResizing}
        />
      )}
      {children}
    </div>
  );
}

// --- LayoutPresetIcon ------------------------------------------------------------------------

export interface LayoutPresetIconProps {
  /** The layout to draw: one rounded rectangle per pane. */
  node: LayoutNode;
  /** Width of the drawing in px (default 56). */
  width?: number;
  /** Height of the drawing in px (default 36). */
  height?: number;
  className?: string;
}

/** A small drawing of a layout in the current text color. Decorative: name it with a label beside it. */
export function LayoutPresetIcon({ node, width = 56, height = 36, className }: LayoutPresetIconProps) {
  const rects = computeRects(node, width - 4, height - 4, 2);
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
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

export interface LayoutPresetOption {
  /** The value passed to `onChange`. */
  id: string;
  /** The visible name under the icon. */
  label: string;
  /** A short explanation, shown in a tooltip and read as part of the accessible name. */
  hint: string;
  /** The layout the icon draws. */
  node: LayoutNode;
}

export interface LayoutPresetPickerProps {
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
  /** Name of the radio group for screen readers (default "Layout presets"). */
  label?: string;
}

/** The preset options for a pane count, from `presetsFor`. */
export function presetOptions(count: 1 | 2 | 3 | 4): LayoutPresetOption[] {
  return presetsFor(count).map((p) => ({ id: p.id, label: p.label, hint: p.hint, node: p.build() }));
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
  label = 'Layout presets',
}: LayoutPresetPickerProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-3 border-b border-th-line px-3 py-2',
        overlay ? 'bg-th-surface/85 shadow-lg backdrop-blur-md' : 'bg-th-surface',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <ScrollRow label={label}>
          <div role="radiogroup" aria-label={label} className="flex items-start gap-1">
            {options.map((o) => {
              const on = value === o.id;
              return (
                <Tooltip key={o.id} tip={o.hint} side="bottom" focusable={false}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={`${o.label}: ${o.hint}`}
                    onClick={() => onChange(o.id)}
                    className={cn(
                      'flex min-h-11 shrink-0 flex-col items-center gap-0.5 rounded-lg border px-2 py-1 text-xs',
                      'focus-visible:outline-2 focus-visible:outline-th-accent',
                      on
                        ? 'border-th-accent bg-th-accent-soft text-th-hi'
                        : 'border-transparent text-th-hi3 hover:bg-th-elevated hover:text-th-hi2',
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
