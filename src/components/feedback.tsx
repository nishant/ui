import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../cn';
import { AlertTriangleIcon, LoaderIcon, RotateIcon } from './icons';
import { cardClass } from './primitives';

/** One shimmer block; size it with width/height classes. */
export function Skeleton({
  className,
  style,
}: {
  /** Size and shape: h-4 w-2/5, size-9 rounded-full, … */
  className?: string;
  /** For sizes known only at runtime, e.g. { height: chartHeight }. */
  style?: CSSProperties;
}) {
  return <div aria-hidden="true" className={cn('nish-skeleton rounded-md', className)} style={style} />;
}

export interface SkeletonRowsProps {
  /** How many rows. Default 5. */
  rows?: number;
  /** Height of each row: pixels or any CSS length. Default 56. */
  height?: number | string;
  /** Space between rows: sm 6px, md 10px (default). */
  gap?: 'sm' | 'md';
  /** Accessible name of the loading region. Default "Loading". */
  label?: string;
  /** Classes for the column (padding, margins). */
  className?: string;
  /** Classes for every row, e.g. "h-16" instead of height, or "rounded-lg". */
  rowClassName?: string;
}

/** A column of full-width, card-shaped shimmer rows (rounded-xl) while a list or table
 *  loads, announced once (role="status"). The shimmer stops under reduced motion. For a
 *  card body's text lines, use SkeletonLines. */
export function SkeletonRows({ rows = 5, height = 56, gap = 'md', label = 'Loading', className, rowClassName }: SkeletonRowsProps) {
  return (
    <div role="status" aria-label={label} className={cn('grid', gap === 'sm' ? 'gap-1.5' : 'gap-2.5', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('w-full rounded-xl', rowClassName)} style={rowClassName && /\bh-/.test(rowClassName) ? undefined : { height }} />
      ))}
    </div>
  );
}

const SPINNER_SIZE = { xs: 12, sm: 14, md: 16, lg: 24 } as const;

export interface SpinnerProps {
  /** xs 12px, sm 14px, md 16px (default), lg 24px. */
  size?: keyof typeof SPINNER_SIZE;
  /** Announces the spinner (role="status") with this accessible name, e.g.
   *  "Loading jobs". Without it the spinner is decorative (aria-hidden); pair it with
   *  visible text or an aria-busy container. */
  label?: string;
  /** Color and spacing. The spinner draws in currentColor. */
  className?: string;
}

/** A spinning loader in the current text color: the one spinner every app uses,
 *  instead of hand-rolled border spinners. */
export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  if (!label) return <LoaderIcon size={SPINNER_SIZE[size]} className={cn('shrink-0 animate-spin', className)} />;
  // The name sits on the icon (role="img"), not in visually hidden text.
  return (
    <span role="status" className={cn('inline-flex shrink-0 items-center', className)}>
      <LoaderIcon size={SPINNER_SIZE[size]} className="animate-spin" role="img" aria-hidden={false} aria-label={label} />
    </span>
  );
}

/** A padded stack of shimmer bars: the default loading body for a card or widget. */
export function SkeletonLines({
  lines = 3,
  className,
}: {
  /** Body lines under the heading bar. */
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2.5 p-3', className)} aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i % 2 === 0 ? 'w-full' : 'w-4/5')} />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  /** Text lines under the title bar. Default 3. */
  lines?: number;
  /** A media block above the text: square (96px), wide (16:9) or none (default). */
  media?: 'square' | 'wide' | 'none';
  className?: string;
}

/** A card-shaped shimmer for one loading card: optional media, a title bar and text lines. */
export function SkeletonCard({ lines = 3, media = 'none', className }: SkeletonCardProps) {
  return (
    <div aria-hidden="true" className={cn(cardClass({ padding: 'md' }), 'flex flex-col gap-3', className)}>
      {media === 'square' ? <Skeleton className="size-24 rounded-lg" /> : null}
      {media === 'wide' ? <Skeleton className="aspect-video w-full rounded-lg" /> : null}
      <Skeleton className="h-4 w-2/5" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn('h-3', i % 2 === 0 ? 'w-full' : 'w-4/5')} />
        ))}
      </div>
    </div>
  );
}

export interface StatGridSkeletonProps {
  /** How many tiles. Default 4. */
  count?: number;
  className?: string;
}

/** Shimmer tiles that match a StatGrid (2 columns, 4 from md) while its numbers load. */
export function StatGridSkeleton({ count = 4, className }: StatGridSkeletonProps) {
  return (
    <div role="status" aria-label="Loading" className={cn('grid grid-cols-2 gap-3 md:grid-cols-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(cardClass({ padding: 'sm' }), 'min-w-0')}>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-1.5 h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export interface CardListSkeletonProps {
  /** How many cards. Default 3. */
  count?: number;
  /** Text lines in each card. Default 2. */
  lines?: number;
  className?: string;
}

/** A stack of shimmer cards while a card list loads, announced once (role="status"). */
export function CardListSkeleton({ count = 3, lines = 2, className }: CardListSkeletonProps) {
  return (
    <div role="status" aria-label="Loading" className={cn('grid gap-2.5', className)}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}

export interface EmptyStateProps {
  /** A 28px line icon, shown in the ghost color. */
  icon?: ReactNode;
  /** What is empty, in a few words: "No price drops yet". */
  title: string;
  /** One sentence on why, or what will fill it. */
  detail?: ReactNode;
  /** Usually one small Button that fixes the emptiness. */
  action?: ReactNode;
  /** compact: no border, fills a widget body. Default: dashed box on a page. */
  compact?: boolean;
  className?: string;
}

/** What a list, table or widget shows when there is nothing in it yet. */
export function EmptyState({ icon, title, detail, action, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'h-full gap-1.5 p-4' : 'gap-2 rounded-xl border border-dashed border-th-line px-6 py-12',
        className,
      )}
    >
      {icon ? <span className="text-th-ghost [&>svg]:size-7">{icon}</span> : null}
      <p className={cn('font-medium text-th-hi2', compact ? 'text-xs' : 'text-sm')}>{title}</p>
      {detail ? <p className="max-w-sm text-xs text-th-hi3">{detail}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export interface ErrorStateProps {
  /** What failed and, when known, what to do about it. */
  message?: ReactNode;
  /** Shows a Retry button when given. */
  onRetry?: () => void;
  /** Spinner on the Retry button while the retry runs. */
  retrying?: boolean;
  /** No box: fills a widget body. Default: a tinted box on a page. */
  compact?: boolean;
  className?: string;
}

/** A failed load, announced to screen readers (role="alert"), with an optional Retry. */
export function ErrorState({
  message = 'Failed to load',
  onRetry,
  retrying = false,
  compact = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'h-full gap-2 p-4' : 'gap-2 rounded-xl border border-th-loss/30 bg-th-loss-soft px-6 py-10',
        className,
      )}
    >
      <AlertTriangleIcon size={compact ? 16 : 22} className="shrink-0 text-th-loss" />
      <p className={cn('max-w-md text-th-hi2', compact ? 'text-xs' : 'text-sm')}>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-th-line-strong px-3 py-1 text-xs text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi disabled:opacity-50 pointer-coarse:min-h-11"
        >
          {retrying ? <LoaderIcon size={12} className="animate-spin" /> : <RotateIcon size={12} />}
          Retry
        </button>
      ) : null}
    </div>
  );
}
