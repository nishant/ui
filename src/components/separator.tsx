'use client';

import { useId, type ComponentPropsWithoutRef, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';

export interface SeparatorProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** horizontal (default) draws a rule across; vertical draws one down inside a flex row. */
  orientation?: 'horizontal' | 'vertical';
  /** Purely visual: the separator is hidden from assistive technology (role="none"). Default true. Pass false to expose role="separator". */
  decorative?: boolean;
  /** Text centered on a horizontal rule ("or", "Today"). */
  label?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const LINE = 'bg-th-line forced-colors:bg-[CanvasText]';

/** A thin rule between groups of content, optionally with a label in the middle. */
export function Separator({ orientation = 'horizontal', decorative = true, label, className, ref, ...rest }: SeparatorProps) {
  const labelId = useId();
  const a11y = decorative
    ? { role: 'none' as const }
    : { role: 'separator' as const, 'aria-orientation': orientation };
  const hasLabel = label != null && label !== false && label !== '' && orientation === 'horizontal';
  if (hasLabel) {
    return (
      <div
        data-orientation={orientation}
        {...a11y}
        {...(!decorative && rest['aria-label'] === undefined && rest['aria-labelledby'] === undefined ? { 'aria-labelledby': labelId } : {})}
        {...rest}
        ref={ref}
        className={cn('flex w-full items-center gap-3 text-xs text-th-hi3', className)}
      >
        <span aria-hidden="true" className={cn('h-px flex-1', LINE)} />
        <span id={labelId} className="shrink-0">{label}</span>
        <span aria-hidden="true" className={cn('h-px flex-1', LINE)} />
      </div>
    );
  }
  return (
    <div
      data-orientation={orientation}
      {...a11y}
      {...rest}
      ref={ref}
      className={cn('shrink-0', LINE, orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch', className)}
    />
  );
}
