import { Badge } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Badge --------------------------------------------------------------------------

const TONES = ['neutral', 'accent', 'ok', 'loss', 'warn', 'info'] as const;

export const badge: ComponentDoc = {
  id: 'badge',
  name: 'Badge',
  exports: ['Badge'],
  summary: 'A small pill for a state, a count or a tag. Each tone is its color on its own soft tint, checked at 4.5:1 in every theme.',
  importLine: "import { Badge } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: [...TONES] },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  initial: { tone: 'ok', label: 'Healthy' },
  render: (a) => <Badge tone={a.tone as 'ok'}>{String(a.label)}</Badge>,
  code: (a) => jsx('Badge', { tone: a.tone === 'neutral' ? undefined : a.tone }, String(a.label)),
  stories: [
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <Row>
          <Badge>Draft</Badge>
          <Badge tone="accent">Pinned</Badge>
          <Badge tone="ok">Healthy</Badge>
          <Badge tone="loss">Down</Badge>
          <Badge tone="warn">Pending</Badge>
          <Badge tone="info">New</Badge>
        </Row>
      ),
    },
    {
      id: 'counts',
      name: 'Counts',
      render: () => (
        <Row>
          <span className="inline-flex items-center gap-2 text-sm text-th-hi2">
            Interviews <Badge tone="accent">3</Badge>
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-th-hi2">
            Alerts <Badge tone="loss">12</Badge>
          </span>
        </Row>
      ),
    },
    {
      id: 'dot',
      name: 'With a status dot',
      render: () => (
        <Row>
          <Badge tone="ok">
            <span className="size-1.5 rounded-full bg-th-ok-fill" aria-hidden="true" />
            Live
          </Badge>
          <Badge tone="warn">
            <span className="size-1.5 rounded-full bg-th-warn-fill" aria-hidden="true" />
            Degraded
          </Badge>
        </Row>
      ),
    },
    {
      id: 'long',
      name: 'Long text',
      note: 'Badges never wrap. Keep them to two or three words.',
      render: () => <Badge tone="warn">Waiting on recruiter</Badge>,
    },
  ],
  usage: `import { Badge } from '@nish/ui';

const TONE = { up: 'ok', slow: 'warn', down: 'loss' } as const;

<Badge tone={TONE[site.status]}>{site.status}</Badge>`,
  guidelines: [
    'Tone carries meaning: ok for healthy or gains, loss for errors or losses, warn for pending, info for neutral news.',
    'Do not rely on color alone. The text should say the state ("Down"), not just be red.',
  ],
};
