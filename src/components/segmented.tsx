import { useRef, type ReactNode } from 'react';
import { cn } from '../cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Screen-reader name when the label is only an icon. */
  ariaLabel?: string;
  /** Hover tooltip (the native title), mainly for icon-only options. */
  title?: string;
  /** Shown but not selectable; the arrow keys skip it. */
  disabled?: boolean;
}

const SIZE = {
  xs: 'h-6 px-2 text-2xs',
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
} as const;

export interface SegmentedProps<T extends string> {
  /** Name of the whole group for screen readers: "Chart range". */
  label: string;
  options: SegmentedOption<T>[];
  /** The selected value; a value not among the options leaves none selected. */
  value: T | (string & {});
  onChange: (value: T) => void;
  /** xs: 24px for dense widget headers. sm: 28px (default). md: 32px. All grow to 44px
   *  on touch screens. */
  size?: 'xs' | 'sm' | 'md';
  /** Fill the container's width, with equal-width options. */
  block?: boolean;
  className?: string;
}

/** A small set of mutually exclusive choices shown side by side (24h / 7d / 30d): a
 *  radio group. The selected option gets the accent tint and ring, so it reads at a
 *  glance in light themes too. Arrow keys, Home and End move the choice and the focus,
 *  like a native radio group. For multi-select toggles use ChipGroup and Chip. */
export function Segmented<T extends string>({ label, options, value, onChange, size = 'sm', block = false, className }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selected = options.findIndex((o) => o.value === value);

  const pick = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    onChange(o.value);
    refs.current[i]?.focus();
  };
  const move = (from: number, dir: 1 | -1) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(from);
    const next = pos < 0 ? enabled[dir === 1 ? 0 : enabled.length - 1] : enabled[(pos + dir + enabled.length) % enabled.length];
    pick(next);
  };
  // With nothing selected (e.g. a preset outside the options is active), the first
  // enabled option takes the Tab stop so the group stays reachable by keyboard.
  const tabStop = selected >= 0 && !options[selected].disabled ? selected : (enabled[0] ?? -1);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('rounded-lg border border-th-line bg-th-elevated p-0.5', block ? 'flex w-full' : 'inline-flex', className)}
      onKeyDown={(e) => {
        const from = refs.current.findIndex((el) => el === document.activeElement);
        const at = from >= 0 ? from : selected;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(at, 1); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(at, -1); }
        else if (e.key === 'Home') { e.preventDefault(); if (enabled.length) pick(enabled[0]); }
        else if (e.key === 'End') { e.preventDefault(); if (enabled.length) pick(enabled[enabled.length - 1]); }
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            title={o.title}
            disabled={o.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => pick(i)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium tabular-nums transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11',
              'disabled:cursor-not-allowed disabled:text-th-ghost',
              block && 'min-w-0 flex-1',
              SIZE[size],
              on ? 'bg-th-accent-soft text-th-accent ring-1 ring-th-accent/40' : 'text-th-hi2 hover:text-th-hi disabled:hover:text-th-ghost',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
