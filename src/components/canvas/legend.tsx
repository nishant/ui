import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../cn';
import { Svg } from './icons';
import type { CanvasEdgeKind } from './types';

const DASH: Record<NonNullable<CanvasEdgeKind['line']>, { dash?: string; width: number; cap?: 'round' }> = {
  solid: { width: 1.75 },
  dashed: { dash: '6 5', width: 1.75 },
  dotted: { dash: '0.5 6', width: 2.25, cap: 'round' },
};

function Sample({ line }: { line: CanvasEdgeKind['line'] }) {
  const d = DASH[line ?? 'solid'];
  return (
    <svg width={28} height={10} viewBox="0 0 28 10" aria-hidden="true" focusable="false" className="shrink-0">
      <line x1={2} y1={5} x2={26} y2={5} stroke="currentColor" strokeWidth={d.width} strokeDasharray={d.dash} strokeLinecap={d.cap} />
    </svg>
  );
}

/** The "Lines" button and its panel: one row per edge kind to show or hide it. */
export function EdgeLegend({ kinds, hidden, onToggle }: { kinds: CanvasEdgeKind[]; hidden: ReadonlySet<string>; onToggle: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  if (kinds.length === 0) return null;
  const nHidden = kinds.filter((k) => hidden.has(k.id)).length;

  return (
    <div ref={rootRef} data-canvas-ui className="absolute left-3 top-3 z-[5] flex flex-col items-start gap-1.5">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-th-line bg-th-surface px-3 text-sm text-th-hi shadow-pop outline-none hover:bg-th-elevated focus-visible:ring-2 focus-visible:ring-th-accent"
      >
        <Svg>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </Svg>
        <span>Lines</span>
        {nHidden > 0 ? <span className="text-th-hi3">· {nHidden} hidden</span> : null}
      </button>
      {open ? (
        <div id={panelId} role="menu" aria-label="Lines" className="overflow-hidden rounded-xl border border-th-line bg-th-surface shadow-pop" style={{ width: 'min(240px, calc(100vw - 24px))' }}>
          {kinds.map((k) => {
            const on = !hidden.has(k.id);
            return (
              <button
                key={k.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onToggle(k.id)}
                className={cn(
                  'flex h-11 w-full items-center gap-3 px-3 text-left text-sm outline-none hover:bg-th-elevated focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-th-accent',
                  on ? 'text-th-hi' : 'text-th-hi3',
                )}
              >
                <Sample line={k.line} />
                <span className="min-w-0 flex-1 truncate">{k.label}</span>
                <span aria-hidden="true" className={cn('relative h-5 w-9 shrink-0 rounded-full border transition-colors', on ? 'border-th-accent bg-th-accent' : 'border-th-line-strong bg-th-elevated')}>
                  <span className={cn('absolute top-0.5 size-3.5 rounded-full transition-all', on ? 'left-[18px] bg-th-on-accent' : 'left-0.5 bg-th-hi3')} />
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
