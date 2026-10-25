import { useEffect, useRef } from 'react';
import { Card, Tooltip } from '../../src';
import { BellIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Tooltip (framed) ---------------------------------------------------------------

type Side = 'top' | 'bottom' | 'left' | 'right';

/** Hovers the trigger once mounted, so the static preview shows the tip. */
function useHoverOnMount(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = ref.current?.querySelector('[data-tip-trigger]')?.parentElement ?? ref.current?.querySelector('[tabindex="0"]');
    const id = window.setTimeout(() => t?.dispatchEvent(new MouseEvent('mouseenter')), 50);
    return () => window.clearTimeout(id);
  }, deps);
  return ref;
}

function TooltipPreview({
  tip,
  side,
  trigger = 'text',
  variant = 'default',
}: {
  tip: string;
  side: Side;
  trigger?: 'text' | 'icon';
  variant?: 'default' | 'hint';
}) {
  const ref = useHoverOnMount([tip, side, variant]);
  return (
    <div ref={ref} className="flex w-full justify-center">
      <Tooltip tip={tip} side={side} variant={variant}>
        {trigger === 'icon' ? (
          <span data-tip-trigger className="inline-flex size-9 items-center justify-center rounded-lg text-th-hi3">
            <BellIcon size={16} />
          </span>
        ) : variant === 'hint' ? (
          <span data-tip-trigger className="text-sm text-th-hi2">
            IV rank
          </span>
        ) : (
          <span data-tip-trigger className="cursor-help text-sm text-th-hi2 underline decoration-th-ghost decoration-dotted underline-offset-4">
            IV rank
          </span>
        )}
      </Tooltip>
    </div>
  );
}

/** Dense chart bars: not in the Tab order (focusable=false); the values are in the table too. */
function BarsPreview() {
  const values = [12, 18, 9, 22, 16, 25, 14, 19, 11, 21];
  const ref = useHoverOnMount([]);
  return (
    <div ref={ref} className="flex h-24 items-end gap-1">
      {values.map((v, i) => (
        <Tooltip key={i} tip={`Day ${i + 1}: ${v} fills`} focusable={false}>
          <span data-tip-trigger={i === 5 ? '' : undefined} className="block w-4 rounded-sm bg-th-chart-1" style={{ height: v * 3 }} />
        </Tooltip>
      ))}
    </div>
  );
}

function CardPreview() {
  const ref = useHoverOnMount([]);
  return (
    <div ref={ref} className="w-full max-w-xs">
      <Card>
        <p className="text-xs text-th-hi3">
          <Tooltip variant="hint" tip="Profit or loss you would book if you closed every position at the mark.">
            <span data-tip-trigger>Unrealized P&amp;L</span>
          </Tooltip>
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-th-ok">+$1,240.18</p>
      </Card>
    </div>
  );
}

export const tooltip: ComponentDoc = {
  id: 'tooltip',
  name: 'Tooltip',
  exports: ['Tooltip'],
  summary:
    'A hover and focus hint, rendered through a portal so overflow:hidden parents never clip it, flipped and clamped to stay on screen.',
  importLine: "import { Tooltip } from '@nish/ui';",
  controls: [
    { key: 'tip', label: 'Tip', type: 'text' },
    { key: 'side', label: 'Side', type: 'select', options: ['top', 'bottom', 'left', 'right'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['default', 'hint'] },
  ],
  initial: { tip: 'Where implied volatility sits in its 52-week range.', side: 'top', variant: 'default' },
  render: (a) => <TooltipPreview tip={String(a.tip)} side={a.side as Side} variant={a.variant as 'default'} />,
  code: (a) =>
    jsx(
      'Tooltip',
      { tip: String(a.tip), side: a.side === 'top' ? undefined : a.side, variant: a.variant === 'default' ? undefined : a.variant },
      '<span>IV rank</span>',
    ),
  framed: { height: 170 },
  stories: [
    { id: 'short', name: 'Short tip', render: () => <TooltipPreview tip="Implied volatility rank" side="top" /> },
    {
      id: 'long',
      name: 'Long tip',
      note: 'Wraps at 320px.',
      render: () => (
        <TooltipPreview
          tip="Where today's implied volatility sits in its 52-week range: 0 is the lowest it has been this year, 100 the highest."
          side="top"
        />
      ),
    },
    { id: 'bottom', name: 'Below', render: () => <TooltipPreview tip="Alerts for price drops and outages" side="bottom" trigger="icon" /> },
    { id: 'right', name: 'Right', note: 'For a collapsed sidebar.', render: () => <TooltipPreview tip="Notifications" side="right" trigger="icon" /> },
    { id: 'left', name: 'Left', render: () => <TooltipPreview tip="Notifications" side="left" trigger="icon" /> },
    {
      id: 'hint',
      name: 'Hint',
      note: 'variant="hint": a dotted underline and a help cursor on the term.',
      render: () => <TooltipPreview tip="Where implied volatility sits in its 52-week range." side="top" variant="hint" />,
    },
    {
      id: 'dense',
      name: 'Dense marks, not focusable',
      note: 'focusable={false} keeps 60 chart bars out of the Tab order. Put the values somewhere reachable too.',
      render: () => <BarsPreview />,
    },
    { id: 'card', name: 'In a card', render: () => <CardPreview /> },
  ],
  usage: `import { Tooltip } from '@nish/ui';

<Tooltip variant="hint" tip="Where implied volatility sits in its 52-week range.">
  IV rank
</Tooltip>

// a collapsed sidebar
<Tooltip side="right" tip="Notifications">
  <IconButton label="Notifications"><BellIcon /></IconButton>
</Tooltip>

// inside a table, make the row the trigger
<Tooltip as="tr" tip={row.note}>
  <td>{row.symbol}</td>
</Tooltip>`,
  guidelines: [
    'Tooltips explain; they never hold the only copy of something people need. Touch screens cannot hover.',
    'The trigger becomes focusable, so keyboard users get the tip on focus. A focusable child (a button) shows it too.',
    'Use variant="hint" for a term the tip defines, instead of hand-styling a dotted underline.',
    'Set focusable={false} only for dense marks (chart bars), and give those values another way in.',
    'For icon-only buttons, IconButton already sets a title and aria-label.',
  ],
};
