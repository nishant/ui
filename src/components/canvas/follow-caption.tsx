'use client';
import { memo } from 'react';
import { StatusDot } from '../display';
import { TickerText } from '../flow';
import type { FollowStep } from './follow';
import { DEFAULT_CANVAS_LABELS, type CanvasLabels } from './types';

/** The pill at the bottom left of the canvas saying what follow mode is looking at. */
export const FollowCaption = memo(function FollowCaption({ step, labels = DEFAULT_CANVAS_LABELS }: { step: FollowStep | null; labels?: CanvasLabels }) {
  if (!step) return null;
  const only = step.targets.length === 1 ? step.targets[0]! : null;
  const text =
    step.mode === 'idle'
      ? labels.followIdle
      : only
        ? labels.followOne(only.group, only.label)
        : labels.followMany(step.targets.length);
  return (
    <div
      data-canvas-ui
      role="status"
      aria-live="polite"
      className="absolute bottom-[68px] start-3 z-10 flex max-w-[min(420px,calc(100%-24px))] items-center gap-2 rounded-xl border border-th-line bg-th-surface px-3 py-2 text-xs text-th-hi shadow-card min-[600px]:bottom-3"
    >
      <StatusDot tone="accent" pulse={step.mode !== 'idle'} />
      <div className="min-w-0">
        <div className="truncate">{text}</div>
        {only?.note ? <TickerText as="div" text={only.note} className="truncate text-th-hi3" /> : null}
      </div>
    </div>
  );
});
