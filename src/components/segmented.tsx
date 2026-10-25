import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Screen-reader name when the label is only an icon. */
  ariaLabel?: string;
}

export interface SegmentedProps<T extends string> {
  /** Name of the whole group for screen readers: "Chart range". */
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

/** A small set of mutually exclusive choices shown side by side (24h / 7d / 30d).
 *  The selected option gets the accent tint and ring, so it reads at a glance in
 *  light themes too. Arrow keys move the choice, like a native radio group. */
export function Segmented<T extends string>({ label, options, value, onChange, size = 'sm', className }: SegmentedProps<T>) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + dir + options.length) % options.length];
    if (next) onChange(next.value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex rounded-lg border border-th-line bg-th-elevated p-0.5', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium tabular-nums transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              on ? 'bg-th-accent-soft text-th-accent ring-1 ring-th-accent/40' : 'text-th-hi2 hover:text-th-hi',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
