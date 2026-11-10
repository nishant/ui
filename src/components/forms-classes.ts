import type { Ref } from 'react';
import { cn } from '../cn';

// Pure helpers of forms.tsx, segmented.tsx and combobox.tsx. No directive and no React
// runtime import, so a React Server Component can call chipClass().

/** Sets a callback or object ref. */
export function setRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

export type ChipVariant = 'toggle' | 'suggestion' | 'tag';

const CHIP_BASE = 'inline-flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors duration-150';
const CHIP_SIZE = { sm: 'h-7 px-2.5 text-xs', md: 'h-8 px-3 text-sm' } as const;

// A pressed chip is an accent tint, which forced-colors mode removes: it gets Highlight.
const CHIP_LOOK: Record<ChipVariant | 'pressed', string> = {
  toggle: 'border-th-line-control text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
  pressed:
    'border-th-accent/60 bg-th-accent-soft text-th-accent hover:bg-th-accent/20 forced-colors:border-[color:Highlight] forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]',
  suggestion: 'border-dashed border-th-line-control text-th-hi3 hover:border-th-hi3 hover:text-th-hi',
  tag: 'border-th-line bg-th-elevated text-th-hi2',
};

export interface ChipClassOptions {
  /** The pressed (on) look of a toggle chip: the accent tint. On a link, set
   *  aria-current="page" for the active one (links take aria-current, not aria-pressed). */
  pressed?: boolean;
  /** Same variants as Chip. Default "toggle". */
  variant?: ChipVariant;
  /** md: 32px (default), sm: 28px. Both reach 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<Chip>` renders, for router links and anchors that look like chips:
 *  `<Link className={chipClass({ pressed: active })} aria-current={active ? 'page' : undefined}>`.
 *  Mirrors .nish-chip in nish-components.css. */
export function chipClass({ pressed = false, variant = 'toggle', size = 'md', className }: ChipClassOptions = {}): string {
  return cn(
    CHIP_BASE,
    CHIP_SIZE[size],
    variant !== 'tag' && 'pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center',
    CHIP_LOOK[variant === 'toggle' && pressed ? 'pressed' : variant],
    className,
  );
}

export type SegmentedTone = 'accent' | 'warn' | 'loss';

// Full literal class names, so Tailwind's scanner finds every one. The ring is a
// box-shadow, which forced-colors mode drops, so the selected option also gets Highlight.
export const SEGMENTED_SELECTED: Record<SegmentedTone, string> = {
  accent:
    'bg-th-accent-soft text-th-accent ring-1 ring-th-accent/40 forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]',
  warn: 'bg-th-warn-soft text-th-warn ring-1 ring-th-warn/40 forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]',
  loss: 'bg-th-loss-soft text-th-loss ring-1 ring-th-loss/40 forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]',
};

export const SEGMENTED_SIZE = {
  xs: 'h-6 px-2 text-2xs',
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-sm',
} as const;

export interface ComboboxIndexed<O> {
  option: O;
  /** Lower-cased label. */
  label: string;
  /** Lower-cased hint, or undefined. */
  hint: string | undefined;
}

/** Lower-cases labels and hints once per options array, so each keystroke only runs
 *  `includes` over ready strings. */
export function indexComboboxOptions<O extends { label: string; hint?: string }>(options: readonly O[]): ComboboxIndexed<O>[] {
  return options.map((option) => ({ option, label: option.label.toLowerCase(), hint: option.hint?.toLowerCase() }));
}
