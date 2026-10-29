import { useEffect, useState } from 'react';
import { Card, TickerText } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { DEMO_ACTIVITY } from './flow-demo';

// --- TickerText ---------------------------------------------------------------------

function Live() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => n + 1), 1800);
    return () => window.clearInterval(id);
  }, []);
  return <TickerText text={DEMO_ACTIVITY[i % DEMO_ACTIVITY.length]!} as="div" className="text-sm text-th-hi2" />;
}

export const tickerText: ComponentDoc = {
  id: 'ticker-text',
  name: 'TickerText',
  exports: ['TickerText'],
  summary: 'One line of text that slides up and fades when it changes: the old line leaves as the new one arrives.',
  importLine: "import { TickerText } from '@nish/ui';",
  controls: [
    { key: 'text', label: 'Text', type: 'text' },
    { key: 'as', label: 'Element', type: 'select', options: ['span', 'p', 'div'] },
  ],
  initial: { text: 'Editing server/index.ts', as: 'div' },
  render: (a) => <TickerText text={String(a.text)} as={a.as as 'div'} className="w-full max-w-sm text-sm text-th-hi2" />,
  code: (a) => jsx('TickerText', { text: String(a.text), as: a.as === 'span' ? undefined : a.as }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'The text changes every 1.8 seconds.',
      wide: true,
      render: () => (
        <Card className="w-full max-w-sm">
          <Live />
        </Card>
      ),
    },
    {
      id: 'static',
      name: 'Still',
      note: 'The first text appears without animation.',
      render: () => <TickerText text="Running npm test" as="div" className="w-full max-w-xs text-sm text-th-hi2" />,
    },
    {
      id: 'long',
      name: 'Long text',
      note: 'Stays on one line and ends in an ellipsis.',
      render: () => (
        <TickerText
          text="Reading a very long path that cannot possibly fit in this narrow box without being cut"
          as="div"
          className="w-full max-w-xs text-sm text-th-hi2"
        />
      ),
    },
  ],
  usage: `import { TickerText } from '@nish/ui';

<TickerText text={session.activity} as="div" className="text-sm text-th-hi2" />`,
  guidelines: [
    'Use it for a single line that changes while someone watches, such as what a task is doing right now.',
    'Give it a width (a block parent or a max width) so the ellipsis has somewhere to cut.',
    'Changes that happen every second or faster read as flicker. Slow them down or use ActivityFeed.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
