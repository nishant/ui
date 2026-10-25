import { useEffect, useRef } from 'react';
import { Tooltip } from '../../src';
import { BellIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Tooltip (framed) ---------------------------------------------------------------

function TooltipPreview({ tip, side, trigger = 'text' }: { tip: string; side: 'top' | 'bottom'; trigger?: 'text' | 'icon' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Hover the trigger so the static preview shows the tip.
    const t = ref.current?.querySelector('[tabindex="0"]');
    const id = window.setTimeout(() => t?.dispatchEvent(new MouseEvent('mouseenter')), 50);
    return () => window.clearTimeout(id);
  }, [tip, side]);
  return (
    <div ref={ref} className="flex w-full justify-center">
      <Tooltip tip={tip} side={side}>
        {trigger === 'icon' ? (
          <span className="inline-flex size-9 items-center justify-center rounded-lg text-th-hi3">
            <BellIcon size={16} />
          </span>
        ) : (
          <span className="cursor-help text-sm text-th-hi2 underline decoration-th-ghost decoration-dotted underline-offset-4">IV rank</span>
        )}
      </Tooltip>
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
    { key: 'side', label: 'Side', type: 'select', options: ['top', 'bottom'] },
  ],
  initial: { tip: 'Where implied volatility sits in its 52-week range.', side: 'top' },
  render: (a) => <TooltipPreview tip={String(a.tip)} side={a.side as 'top'} />,
  code: (a) => jsx('Tooltip', { tip: String(a.tip), side: a.side === 'top' ? undefined : a.side }, '<span>IV rank</span>'),
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
  ],
  usage: `import { Tooltip } from '@nish/ui';

<Tooltip tip="Where implied volatility sits in its 52-week range.">
  <span className="underline decoration-dotted">IV rank</span>
</Tooltip>

// inside a table, make the row the trigger
<Tooltip as="tr" tip={row.note}>
  <td>{row.symbol}</td>
</Tooltip>`,
  guidelines: [
    'Tooltips explain; they never hold the only copy of something people need. Touch screens cannot hover.',
    'The trigger becomes focusable, so keyboard users get the tip on focus.',
    'For icon-only buttons, IconButton already sets a title and aria-label.',
  ],
};
