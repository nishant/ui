import { memo, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { TickerText } from '../flow';
import { KIND_ICON, Svg } from './icons';
import type { CanvasHue, CanvasNode } from './types';

export function hueStyle(hue: CanvasHue | undefined): CSSProperties {
  return {
    '--c': hue ? `var(--nish-${hue})` : 'var(--nish-accent)',
    '--c-soft': hue ? `var(--nish-${hue}-soft)` : 'var(--nish-accent-soft)',
  } as CSSProperties;
}

interface NodeViewProps {
  node: CanvasNode;
  groupTitle: string;
  hue: CanvasHue | undefined;
  box: { x: number; y: number; w: number; h: number };
  selected: boolean;
  /** Hover or selection focus is on something else: fade this card. */
  dim: boolean;
  delay: number;
  onSelect: ((id: string, type: 'node' | 'group') => void) | undefined;
}

export const clamp01 = (n: number | undefined) => (n == null || !Number.isFinite(n) ? 0 : Math.min(1, Math.max(0, n)));

/** Plays a one-time "ping" when `active` turns on after mount. Sets data-fx on the DOM so a
 *  re-render with the same data cannot cut it short. */
function usePing(active: boolean) {
  const ref = useRef<HTMLButtonElement>(null);
  const prev = useRef(active);
  useLayoutEffect(() => {
    const was = prev.current;
    prev.current = active;
    const el = ref.current;
    if (!el || was || !active) return;
    el.removeAttribute('data-fx');
    void el.offsetWidth;
    el.setAttribute('data-fx', 'ping');
    const timer = setTimeout(() => el.removeAttribute('data-fx'), 450);
    return () => clearTimeout(timer);
  }, [active]);
  return ref;
}

export const NodeView = memo(
  function NodeView({ node, groupTitle, hue, box, selected, dim, delay, onSelect }: NodeViewProps) {
    const active = !!node.active;
    const heat = clamp01(node.heat);
    const ref = usePing(active);
    const count = node.count ?? 0;
    const style: CSSProperties = {
      ...hueStyle(hue),
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      '--nish-canvas-delay': `${delay}ms`,
    } as CSSProperties;
    // The afterglow is drawn by the card (`.nish-canvas-node[data-heat]` in base.css), whose rounded
    // corners and border the slot does not have; the slot only carries the values.
    if (!active && heat > 0) {
      const vars = style as Record<string, string>;
      vars['--nish-canvas-heat-line'] = `color-mix(in srgb, var(--c) ${Math.round(heat * 70)}%, var(--nish-line))`;
      vars['--nish-canvas-heat-glow'] = `0 0 ${Math.round(6 + heat * 16)}px color-mix(in srgb, var(--c) ${Math.round(heat * 60)}%, transparent)`;
    }
    const aria = `${node.label}, ${groupTitle}${active ? (node.note ? `, active: ${node.note}` : ', active') : ''}`;
    return (
      <div className="nish-canvas-slot" style={style} data-active={active || undefined} data-dim={dim || undefined}>
        <button
          ref={ref}
          type="button"
          className="nish-canvas-node"
          data-canvas-id={node.id}
          data-active={active || undefined}
          data-selected={selected || undefined}
          data-heat={heat > 0 || undefined}
          aria-label={aria}
          title={node.detail || undefined}
          aria-pressed={selected}
          onClick={() => onSelect?.(node.id, 'node')}
        >
          {node.kind ? (
            <span className="nish-canvas-icon" aria-hidden="true">
              <Svg>{KIND_ICON[node.kind]}</Svg>
            </span>
          ) : null}
          <span className="nish-canvas-text">
            <span className="nish-canvas-label">{node.label}</span>
            {active && node.note ? (
              <span className="nish-canvas-note" aria-hidden="true">
                <TickerText text={node.note} as="span" />
              </span>
            ) : node.detail ? (
              <span className="nish-canvas-detail">{node.detail}</span>
            ) : null}
          </span>
          {count > 1 ? <span className="nish-canvas-count">{count}</span> : null}
          {active ? <span className="nish-canvas-live" aria-hidden="true" /> : null}
        </button>
      </div>
    );
  },
  (a, b) =>
    a.groupTitle === b.groupTitle &&
    a.hue === b.hue &&
    a.selected === b.selected &&
    a.dim === b.dim &&
    a.delay === b.delay &&
    a.onSelect === b.onSelect &&
    a.box.x === b.box.x &&
    a.box.y === b.box.y &&
    a.node.id === b.node.id &&
    a.node.label === b.node.label &&
    a.node.kind === b.node.kind &&
    a.node.detail === b.node.detail &&
    a.node.active === b.node.active &&
    a.node.note === b.node.note &&
    a.node.count === b.node.count &&
    Math.round(clamp01(a.node.heat) * 100) === Math.round(clamp01(b.node.heat) * 100),
);
