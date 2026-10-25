import { Card } from '../../src';
import { StatusDot, type StatusTone } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- StatusDot ----------------------------------------------------------------------

const TONES: StatusTone[] = ['ok', 'warn', 'loss', 'info', 'accent', 'neutral'];
const SIZES = ['xs', 'sm', 'md', 'lg'] as const;
const WORD: Record<StatusTone, string> = { ok: 'Up', warn: 'Slow', loss: 'Down', info: 'Syncing', accent: 'Pinned', neutral: 'Paused' };

export const statusDot: ComponentDoc = {
  id: 'status-dot',
  name: 'StatusDot',
  exports: ['StatusDot'],
  summary: 'A small round status mark in a status fill. Pair it with text, or give it a label for screen readers.',
  importLine: "import { StatusDot } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: TONES },
    { key: 'size', label: 'Size', type: 'select', options: [...SIZES] },
    { key: 'pulse', label: 'Pulse', type: 'boolean' },
    { key: 'halo', label: 'Halo', type: 'boolean' },
  ],
  initial: { tone: 'ok', size: 'md', pulse: false, halo: true },
  render: (a) => (
    <span className="inline-flex items-center gap-2 text-sm text-th-hi2">
      <StatusDot tone={a.tone as StatusTone} size={a.size as 'md'} pulse={!!a.pulse} halo={!!a.halo} />
      {WORD[a.tone as StatusTone]}
    </span>
  ),
  code: (a) =>
    jsx('StatusDot', {
      tone: a.tone,
      size: a.size === 'sm' ? undefined : a.size,
      pulse: a.pulse || undefined,
      halo: a.halo || undefined,
    }),
  stories: [
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <Row className="gap-4">
          {TONES.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-sm text-th-hi2">
              <StatusDot tone={t} /> {WORD[t]}
            </span>
          ))}
        </Row>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      note: '6, 8, 10 and 14px.',
      render: () => (
        <Row className="gap-4">
          {SIZES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs text-th-hi3">
              <StatusDot tone="ok" size={s} /> {s}
            </span>
          ))}
        </Row>
      ),
    },
    {
      id: 'halo-pulse',
      name: 'Halo and pulse',
      note: 'Pulse holds still under reduced motion.',
      render: () => (
        <Row className="gap-5">
          <span className="inline-flex items-center gap-2 text-sm text-th-hi2">
            <StatusDot tone="ok" size="md" halo /> Operational
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-th-hi2">
            <StatusDot tone="info" size="md" pulse /> Live
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-th-hi2">
            <StatusDot tone="loss" size="md" halo pulse /> Outage
          </span>
        </Row>
      ),
    },
    {
      id: 'label',
      name: 'Labelled, on its own',
      note: 'With label the dot carries hidden text for screen readers.',
      render: () => (
        <Row className="gap-3">
          <StatusDot tone="ok" size="lg" label="All systems up" />
          <StatusDot tone="warn" size="lg" label="Degraded" />
        </Row>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      render: () => (
        <Card padded={false} className="w-full max-w-sm divide-y divide-th-line">
          {(['ok', 'ok', 'warn', 'loss'] as StatusTone[]).map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
              <StatusDot tone={t} />
              <span className="flex-1 text-th-hi">{['jobs', 'trading', 'mc', 'trackers'][i]}.nish.software</span>
              <span className="text-xs text-th-hi3">{WORD[t]}</span>
            </div>
          ))}
        </Card>
      ),
    },
  ],
  usage: `import { StatusDot } from '@nish/ui';

<span className="inline-flex items-center gap-1.5">
  <StatusDot tone={site.up ? 'ok' : 'loss'} /> {site.up ? 'Up' : 'Down'}
</span>`,
  guidelines: [
    'Color is never the only signal: put the state in words beside the dot, or pass label.',
    'Use pulse only for something live or running right now, and at most once per view.',
    'Dots use the -fill roles; never color a dot with a text role such as text-th-ok.',
  ],
};
