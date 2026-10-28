import { RelativeTime } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- RelativeTime ---------------------------------------------------------------------------

const AGO: Record<string, number> = {
  'a few seconds': 20 * 1000,
  '3 minutes': 3 * 60 * 1000,
  '2 hours': 2 * 3600 * 1000,
  '5 days': 5 * 86400 * 1000,
  '3 hours from now': -3 * 3600 * 1000,
};

const at = (key: string) => new Date(Date.now() - AGO[key]);

export const relativeTime: ComponentDoc = {
  id: 'relative-time',
  name: 'RelativeTime',
  exports: ['RelativeTime'],
  summary:
    'A self-updating "3m ago" inside a real <time> element. The exact date and time show on hover and in the dateTime attribute. It refreshes on a timer that pauses while the tab is hidden.',
  importLine: "import { RelativeTime } from '@nish/ui';",
  controls: [
    { key: 'when', label: 'Moment', type: 'select', options: Object.keys(AGO) },
    { key: 'style', label: 'Style', type: 'select', options: ['short', 'long'] },
  ],
  initial: { when: '3 minutes', style: 'short' },
  render: (a) => (
    <span key={`${a.when}`} className="text-sm text-th-hi2">
      Updated <RelativeTime value={at(String(a.when))} style={a.style as 'short'} />
    </span>
  ),
  code: (a) => `<span>Updated ${jsx('RelativeTime', { value: '{updatedAt}', style: a.style === 'short' ? undefined : a.style })}</span>`,
  stories: [
    {
      id: 'all',
      name: 'Short and long',
      render: () => (
        <ul className="m-0 grid list-none gap-1.5 p-0 text-sm text-th-hi2">
          {Object.keys(AGO).map((k) => (
            <li key={k} className="flex flex-wrap items-baseline gap-x-3">
              <RelativeTime value={at(k)} />
              <span className="text-th-hi3">
                <RelativeTime value={at(k)} style="long" />
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'inputs',
      name: 'Dates, numbers and strings',
      render: () => (
        <ul className="m-0 grid list-none gap-1.5 p-0 text-sm text-th-hi2">
          <li><RelativeTime value={Date.now() - 90_000} /> (epoch ms)</li>
          <li><RelativeTime value={new Date(Date.now() - 7200_000).toISOString()} /> (ISO string)</li>
        </ul>
      ),
    },
  ],
  usage: `import { RelativeTime } from '@nish/ui';

<p>Synced <RelativeTime value={lastSync} /></p>
<p>Opened <RelativeTime value={opened} style="long" /></p>`,
  guidelines: [
    'Use for recent events (under a few days). For older dates, show the date with date() from @nish/ui/format.',
    'The visible text is relative; the tooltip and the dateTime attribute carry the exact moment for everyone else.',
    'Many instances are fine: each ticks only every refreshMs (30 seconds by default) and pauses in a hidden tab.',
    'Invalid dates render an en dash instead of "NaN ago".',
  ],
};
