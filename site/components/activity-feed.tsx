import { Card, ActivityFeed, type ActivityItem } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { useFlowDemo } from './flow-demo';

// --- ActivityFeed -------------------------------------------------------------------

const TONES: NonNullable<ActivityItem['tone']>[] = ['neutral', 'accent', 'ok', 'warn', 'loss'];
const NOW = Date.UTC(2026, 9, 28, 12, 0, 0);

function sample(n: number, tone: ActivityItem['tone']): ActivityItem[] {
  const text = ['Reading spec.md', 'Editing server/index.ts', 'Running npm test', 'Reviewing the diff', 'Writing findings', 'Release tagged'];
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i}`,
    at: NOW - i * 23_000,
    text: text[i % text.length]!,
    source: i % 2 ? 'Implement 2' : undefined,
    tone: i === 0 ? tone : 'neutral',
  }));
}

function Live() {
  const demo = useFlowDemo();
  return <ActivityFeed items={demo.items} now={demo.now} max={12} label="Demo activity" />;
}

export const activityFeed: ComponentDoc = {
  id: 'activity-feed',
  name: 'ActivityFeed',
  exports: ['ActivityFeed'],
  summary:
    'A timeline of short updates, newest first. New items open up at the top with a brief flash, so you can see what just happened.',
  importLine: "import { ActivityFeed } from '@nish/ui';",
  controls: [
    { key: 'count', label: 'Items', type: 'number', min: 0, max: 12 },
    { key: 'tone', label: 'Tone of the newest', type: 'select', options: TONES },
    { key: 'max', label: 'Max shown', type: 'number', min: 1, max: 12 },
  ],
  initial: { count: 5, tone: 'ok', max: 8 },
  render: (a) => (
    <ActivityFeed
      items={sample(Number(a.count), a.tone as ActivityItem['tone'])}
      now={NOW}
      max={Number(a.max)}
      className="w-full max-w-md"
    />
  ),
  code: (a) => jsx('ActivityFeed', { items: '{updates}', max: Number(a.max) === 50 ? undefined : Number(a.max) }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'Events from a simulated run arrive at the top.',
      wide: true,
      render: () => (
        <Card className="w-full max-w-lg">
          <Live />
        </Card>
      ),
    },
    {
      id: 'empty',
      name: 'Empty',
      render: () => <ActivityFeed items={[]} className="w-full max-w-sm" />,
    },
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <ActivityFeed
          items={TONES.map((tone, i) => ({ id: tone, at: NOW - i * 40_000, text: `A ${tone} update`, tone }))}
          now={NOW}
          className="w-full max-w-sm"
        />
      ),
    },
    {
      id: 'sources',
      name: 'With sources',
      render: () => <ActivityFeed items={sample(4, 'accent').map((x) => ({ ...x, source: 'Review 1' }))} now={NOW} className="w-full max-w-sm" />,
    },
    {
      id: 'custom-empty',
      name: 'Custom empty text',
      render: () => <ActivityFeed items={[]} empty="Nothing has happened yet." className="w-full max-w-sm" />,
    },
  ],
  usage: `import { ActivityFeed } from '@nish/ui';

<ActivityFeed
  items={updates.map((u) => ({ id: u.id, at: u.at, text: u.text, tone: u.tone, source: u.source }))}
  max={30}
/>`,
  guidelines: [
    'Use it for a running log people watch, not for a record they search. Keep each line to one short sentence.',
    'Give every item a stable id. Items with an id the feed has not seen animate in; the first render never animates.',
    'Pass now (a timestamp) to make ages match a clock you control; leave it out to use the current time.',
    'Tone adds meaning only beside the words. Do not rely on the dot color alone.',
    'Respects prefers-reduced-motion: no loops or movement, state changes are instant.',
  ],
};
