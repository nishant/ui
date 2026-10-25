import type { ReactNode } from 'react';
import { cn } from '../cn';
import { AlertTriangleIcon, LoaderIcon, RotateIcon } from './icons';

/** One shimmer block; size it with width/height classes. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('nish-skeleton rounded-md', className)} />;
}

/** A padded stack of shimmer bars: the default loading body for a card or widget. */
export function SkeletonLines({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5 p-3', className)} aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3', i % 2 === 0 ? 'w-full' : 'w-4/5')} />
      ))}
    </div>
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  detail?: ReactNode;
  action?: ReactNode;
  /** compact: no border, fills a widget body. Default: dashed box on a page. */
  compact?: boolean;
  className?: string;
}

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
  message?: ReactNode;
  /** Shows a Retry button when given. */
  onRetry?: () => void;
  retrying?: boolean;
  compact?: boolean;
  className?: string;
}

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
