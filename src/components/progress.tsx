'use client';

import { useId, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { useStrings } from './provider';
import { PROGRESS_STRINGS } from './strings';

export type ProgressTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | 'neutral';

const FILL: Record<ProgressTone, string> = {
  accent: 'bg-th-accent',
  ok: 'bg-th-ok-fill',
  warn: 'bg-th-warn-fill',
  loss: 'bg-th-loss-fill',
  info: 'bg-th-info-fill',
  neutral: 'bg-th-hi3',
};

const THICK = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' } as const;

export interface ProgressProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Current value from 0 to max. Null (or omitted) shows an indeterminate bar. */
  value?: number | null;
  /** The value that means done. Default 100. */
  max?: number;
  /** Fill color. Default accent. */
  tone?: ProgressTone;
  /** Bar thickness: xs 4px, sm 6px (default), md 10px, lg 16px. */
  size?: keyof typeof THICK;
  /** A visible label above the bar. It also names the bar for screen readers. */
  label?: ReactNode;
  /** Shows the formatted value beside the label. */
  showValue?: boolean;
  /** Turns the value into the text screen readers (and showValue) use. Default: a rounded percent. */
  formatValue?: (value: number, max: number) => string;
  /** The wrapper element; the ARIA progressbar is the bar inside it. */
  ref?: Ref<HTMLDivElement>;
}

const percent = (value: number, max: number) => `${Math.round((value / (max || 1)) * 100)}%`;

/** A progress bar for work that finishes: determinate with a value, indeterminate without. */
export function Progress({
  value = null,
  max = 100,
  tone = 'accent',
  size = 'sm',
  label,
  showValue = false,
  formatValue = percent,
  className,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: ProgressProps) {
  const strings = useStrings(PROGRESS_STRINGS);
  const labelId = useId();
  const indeterminate = value == null || Number.isNaN(value);
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), max);
  const pct = indeterminate ? 100 : (clamped / (max || 1)) * 100;
  const text = indeterminate ? undefined : formatValue(clamped, max);
  const name = ariaLabelledBy ?? (label != null ? labelId : undefined);
  return (
    <div ref={ref} className={cn('grid w-full gap-1', className)} {...rest}>
      {label != null || (showValue && text) ? (
        <div className="flex items-baseline justify-between gap-2 text-xs text-th-hi2">
          {label != null ? <span id={labelId}>{label}</span> : <span />}
          {showValue && text ? <span aria-hidden="true" className="tabular-nums text-th-hi3">{text}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-label={name ? undefined : (ariaLabel ?? (indeterminate ? strings.progressIndeterminate : strings.progress))}
        aria-labelledby={name}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuetext={text}
        data-state={indeterminate ? 'indeterminate' : clamped >= max ? 'complete' : 'loading'}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-th-elevated',
          'forced-colors:border forced-colors:border-[ButtonText] forced-colors:bg-[Canvas]',
          THICK[size],
        )}
      >
        <div
          data-part="fill"
          className={cn(
            'absolute inset-y-0 start-0 rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none',
            FILL[tone],
            'forced-color-adjust-none forced-colors:bg-[Highlight]',
            // Pulses while motion is allowed; under reduced motion and forced colors it is a short bar, never a full one that reads as complete.
            indeterminate && 'motion-safe:animate-pulse motion-reduce:!w-2/5 forced-colors:!w-2/5',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
