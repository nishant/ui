'use client';
import { memo, useCallback, useEffect, useImperativeHandle, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { CanvasLayout } from './layout';
import type { CanvasGroup } from './types';
import { PHONE_MAX_W, type View } from './view';

export interface MinimapHandle {
  setView(v: View, size: { w: number; h: number }): void;
}

const MAP_W = 176;
const MAP_MAX_H = 132;
const MAP_MIN_H = 60;

const hueVar = (hue: string | undefined, soft: boolean) => (hue ? `var(--nish-${hue}${soft ? '-soft' : ''})` : soft ? 'var(--nish-accent-soft)' : 'var(--nish-accent)');

/** A small overview of the whole map with the current view drawn on it. Click or drag to move the view. */
export const Minimap = memo(function Minimap({
  layout,
  groups,
  handleRef,
  onJump,
}: {
  layout: CanvasLayout;
  groups: CanvasGroup[];
  handleRef: RefObject<MinimapHandle | null>;
  onJump: (worldX: number, worldY: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rectRef = useRef<SVGRectElement>(null);
  const last = useRef<{ v: View; size: { w: number; h: number } } | null>(null);

  const totalH = layout.height + layout.titleRoom;
  const ok = layout.width > 0 && totalH > 0;
  const s = ok ? Math.min(MAP_W / layout.width, MAP_MAX_H / totalH) : 1;
  const mapH = ok ? Math.min(MAP_MAX_H, Math.max(MAP_MIN_H, (MAP_W * totalH) / layout.width)) : MAP_MIN_H;
  const ox = (MAP_W - layout.width * s) / 2;
  const oy = (mapH - totalH * s) / 2;

  const draw = useCallback(() => {
    const cur = last.current;
    const wrap = wrapRef.current;
    const rect = rectRef.current;
    if (!cur || !wrap || !rect) return;
    const { v, size } = cur;
    wrap.style.display = size.w < PHONE_MAX_W ? 'none' : '';
    const x0 = Math.max(0, ox + (-v.x / v.k) * s);
    const y0 = Math.max(0, oy + (-v.y / v.k + layout.titleRoom) * s);
    const x1 = Math.min(MAP_W, ox + ((-v.x + size.w) / v.k) * s);
    const y1 = Math.min(mapH, oy + ((-v.y + size.h) / v.k + layout.titleRoom) * s);
    rect.setAttribute('x', String(x0));
    rect.setAttribute('y', String(y0));
    rect.setAttribute('width', String(Math.max(0, x1 - x0)));
    rect.setAttribute('height', String(Math.max(0, y1 - y0)));
  }, [ox, oy, s, mapH, layout.titleRoom]);

  useImperativeHandle(
    handleRef,
    () => ({
      setView(v, size) {
        last.current = { v, size };
        draw();
      },
    }),
    [draw],
  );

  // The scale changed with a new layout: redraw the view rect from the last view.
  useEffect(() => {
    draw();
  }, [draw]);

  const jump = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !ok) return;
    const box = svg.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return;
    const px = ((e.clientX - box.left) / box.width) * MAP_W;
    const py = ((e.clientY - box.top) / box.height) * mapH;
    onJump((px - ox) / s, (py - oy) / s - layout.titleRoom);
  };

  return (
    <div
      ref={wrapRef}
      data-canvas-ui
      aria-hidden="true"
      className="nish-canvas-minimap absolute end-3 top-3 z-[5] overflow-hidden rounded-xl border border-th-line bg-th-surface shadow-pop"
      style={{ display: 'none' }}
    >
      <svg
        ref={svgRef}
        width={MAP_W}
        height={mapH}
        viewBox={`0 0 ${MAP_W} ${mapH}`}
        className="block cursor-pointer touch-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          jump(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) jump(e);
        }}
        onPointerUp={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        }}
      >
        {groups.map((g) => {
          const b = layout.groups[g.id];
          if (!b) return null;
          return (
            <rect
              key={g.id}
              x={ox + b.x * s}
              y={oy + (b.y + layout.titleRoom) * s}
              width={b.w * s}
              height={b.h * s}
              rx={3}
              fill={hueVar(g.hue, true)}
              stroke={hueVar(g.hue, false)}
              strokeWidth={1}
            />
          );
        })}
        {groups.map((g) =>
          g.nodes.map((n) => {
            const b = layout.nodes[n.id];
            if (!n.active || !b) return null;
            return <circle key={n.id} cx={ox + (b.x + b.w / 2) * s} cy={oy + (b.y + b.h / 2 + layout.titleRoom) * s} r={3} fill={hueVar(g.hue, false)} />;
          }),
        )}
        <rect ref={rectRef} x={0} y={0} width={0} height={0} fill="var(--nish-accent)" fillOpacity={0.1} stroke="var(--nish-accent)" strokeWidth={1} />
      </svg>
    </div>
  );
});
