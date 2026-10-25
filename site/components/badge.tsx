import { Badge, Card } from '../../src';
import { badgeClass } from '../../src/components/primitives';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Badge --------------------------------------------------------------------------

const TONES = ['neutral', 'accent', 'ok', 'loss', 'warn', 'info'] as const;
const HUES = ['emerald', 'indigo', 'amber', 'lime', 'rose', 'sky', 'violet', 'teal'] as const;
const STORES: [string, (typeof HUES)[number]][] = [
  ['Best Buy', 'sky'],
  ['Target', 'rose'],
  ['Costco', 'indigo'],
  ['Amazon', 'amber'],
  ['REI', 'emerald'],
  ['Apple', 'violet'],
  ['Home Depot', 'lime'],
  ['Walmart', 'teal'],
];

export const badge: ComponentDoc = {
  id: 'badge',
  name: 'Badge',
  exports: ['Badge'],
  summary:
    'A small pill for a state, a count or a tag. Each tone is its color on its own soft tint, checked at 4.5:1 in every theme; hues color things with no meaning (stores, categories). Two sizes, a tag shape and a status dot.',
  importLine: "import { Badge } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: [...TONES] },
    { key: 'hue', label: 'Hue', type: 'select', options: ['none', ...HUES] },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'xs'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['pill', 'tag'] },
    { key: 'dot', label: 'Dot', type: 'boolean' },
    { key: 'label', label: 'Label', type: 'text' },
  ],
  initial: { tone: 'ok', hue: 'none', size: 'sm', variant: 'pill', dot: false, label: 'Healthy' },
  render: (a) => (
    <Badge
      tone={a.tone as 'ok'}
      hue={a.hue === 'none' ? undefined : (a.hue as 'sky')}
      size={a.size as 'sm'}
      variant={a.variant as 'pill'}
      dot={!!a.dot}
    >
      {String(a.label)}
    </Badge>
  ),
  code: (a) =>
    jsx(
      'Badge',
      {
        tone: a.tone === 'neutral' || a.hue !== 'none' ? undefined : a.tone,
        hue: a.hue === 'none' ? undefined : a.hue,
        size: a.size === 'sm' ? undefined : a.size,
        variant: a.variant === 'pill' ? undefined : a.variant,
        dot: a.dot,
      },
      String(a.label),
    ),
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
      id: 'hues',
      name: 'Hues',
      note: 'For colors with no meaning: stores, categories, tags. Text stays hi, so it reads in every theme.',
      render: () => (
        <Row>
          {STORES.map(([name, hue]) => (
            <Badge key={name} hue={hue} dot>
              {name}
            </Badge>
          ))}
        </Row>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      note: 'sm (default, 12px) and xs (10px) for dense rows and table cells.',
      render: () => (
        <Row>
          <Badge tone="accent">Small</Badge>
          <Badge tone="accent" size="xs">
            Extra small
          </Badge>
          <Badge tone="ok" size="xs" dot>
            Live
          </Badge>
        </Row>
      ),
    },
    {
      id: 'tag',
      name: 'Tag shape',
      note: 'variant="tag": square corners, bold uppercase. For tag-shaped labels.',
      render: () => (
        <Row>
          <Badge variant="tag" tone="ok">
            Call
          </Badge>
          <Badge variant="tag" tone="loss">
            Put
          </Badge>
          <Badge variant="tag" tone="info" size="xs">
            New
          </Badge>
          <Badge variant="tag" hue="violet" size="xs">
            Remote
          </Badge>
        </Row>
      ),
    },
    {
      id: 'dot',
      name: 'With a status dot',
      note: 'dot draws the tone\'s fill. The text still says the state.',
      render: () => (
        <Row>
          <Badge tone="ok" dot>
            Live
          </Badge>
          <Badge tone="warn" dot>
            Degraded
          </Badge>
          <Badge tone="loss" dot>
            Down
          </Badge>
          <Badge dot>Paused</Badge>
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
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card title="Sony WH-1000XM6" description="Tracked at 3 stores" action={<Badge tone="ok" dot>Below target</Badge>} className="w-full max-w-md">
          <div className="flex flex-wrap gap-1.5">
            <Badge hue="sky" size="xs">
              Best Buy
            </Badge>
            <Badge hue="amber" size="xs">
              Amazon
            </Badge>
            <Badge hue="indigo" size="xs">
              Costco
            </Badge>
          </div>
        </Card>
      ),
    },
    {
      id: 'class',
      name: 'badgeClass() on a link',
      note: 'The same recipe on an <a>, e.g. a filter link that looks like a tag.',
      render: () => (
        <a href="#/components/badge" className={badgeClass({ hue: 'teal' })}>
          Walmart
        </a>
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

<Badge tone={TONE[site.status]} dot>{site.status}</Badge>
<Badge hue={store.hue} size="xs">{store.name}</Badge>
<Badge variant="tag" tone="ok">Call</Badge>`,
  guidelines: [
    'Tone carries meaning: ok for healthy or gains, loss for errors or losses, warn for pending, info for neutral news.',
    'Hue is for colors with no meaning (stores, categories). Do not use a hue to say "good" or "bad".',
    'Do not rely on color alone. The text should say the state ("Down"), not just be red; the dot is decoration.',
    'Use size="xs" in dense table cells, and variant="tag" for short uppercase labels.',
  ],
};
