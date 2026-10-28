import { LinkCard, type LinkCardAccent } from '../../src';
import { BellIcon, ChartIcon, LayersIcon, SettingsIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- LinkCard -------------------------------------------------------------------------------

const ACCENTS: LinkCardAccent[] = ['accent', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8'];
type Layout = 'auto' | 'card' | 'row';

function Grid({ layout = 'auto' }: { layout?: Layout }) {
  return (
    <div className="grid w-full gap-3" style={{ gridTemplateColumns: layout === 'row' ? '1fr' : 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}>
      <LinkCard layout={layout} href="#/components/link-card" title="Trading" blurb="Positions, scans and the journal." icon={<ChartIcon size={20} />} accent="chart-1" status={{ tone: 'ok', label: 'Live' }} meta="Updated 2m ago" />
      <LinkCard layout={layout} href="#/components/link-card" title="Trips" blurb="Plans, bookings and packing lists." icon={<LayersIcon size={20} />} accent="chart-3" meta="2 upcoming" />
      <LinkCard layout={layout} href="#/components/link-card" title="Alerts" blurb="Price drops and reminders." icon={<BellIcon size={20} />} accent="chart-5" badge={<span className="rounded-full bg-th-loss-soft px-2 text-xs font-medium text-th-loss">3</span>} />
      <LinkCard layout={layout} href="#" title="Minecraft" blurb="Coming soon." icon={<SettingsIcon size={20} />} accent="chart-7" disabled />
    </div>
  );
}

export const linkCard: ComponentDoc = {
  id: 'link-card',
  name: 'LinkCard',
  exports: ['LinkCard'],
  summary:
    'A big link to another page or app: a tinted icon tile, a title and a blurb, with the whole card as the anchor. It is a tile on wide parents and a 64px row on narrow ones, decided by its own container so it works in a 360px column or a grid cell. Disabled cards are dashed and not links.',
  importLine: "import { LinkCard } from '@nish/ui';",
  controls: [
    { key: 'layout', label: 'Layout', type: 'select', options: ['auto', 'card', 'row'] },
    { key: 'accent', label: 'Accent', type: 'select', options: ACCENTS },
    { key: 'blurb', label: 'Blurb', type: 'boolean' },
    { key: 'meta', label: 'Meta', type: 'boolean' },
    { key: 'status', label: 'Status', type: 'boolean' },
    { key: 'external', label: 'External', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { layout: 'card', accent: 'chart-2', blurb: true, meta: true, status: true, external: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <LinkCard
        href="https://mc.nish.software"
        title="Minecraft"
        blurb={a.blurb ? 'Server status, players and controls for the family world.' : undefined}
        icon={<LayersIcon size={20} />}
        accent={a.accent as LinkCardAccent}
        layout={a.layout as Layout}
        meta={a.meta ? 'Up 3 days' : undefined}
        status={a.status ? { tone: 'ok', label: 'Online' } : undefined}
        external={!!a.external}
        disabled={!!a.disabled}
      />
    </div>
  ),
  code: (a) =>
    jsx('LinkCard', {
      href: 'https://mc.nish.software',
      title: 'Minecraft',
      blurb: a.blurb ? 'Server status, players and controls.' : undefined,
      icon: '{<CubeIcon />}',
      accent: a.accent === 'accent' ? undefined : a.accent,
      layout: a.layout === 'auto' ? undefined : a.layout,
      meta: a.meta ? 'Up 3 days' : undefined,
      status: a.status ? "{{ tone: 'ok', label: 'Online' }}" : undefined,
      external: a.external ? true : undefined,
      disabled: a.disabled ? true : undefined,
    }),
  stories: [
    { id: 'grid', name: 'Auto: tiles in a grid', note: 'Each card looks at the width of its parent: under 600px it is a row, from 600px a tile. Resize the window to see it switch.', wide: true, render: () => <Grid /> },
    { id: 'rows', name: 'Rows', render: () => <Grid layout="row" /> },
    { id: 'tiles', name: 'Tiles', wide: true, render: () => <Grid layout="card" /> },
    {
      id: 'accents',
      name: 'All accents',
      wide: true,
      render: () => (
        <div className="grid w-full gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))' }}>
          {ACCENTS.map((x) => (
            <LinkCard key={x} layout="row" href="#/components/link-card" title={x} icon={<ChartIcon size={20} />} accent={x} />
          ))}
        </div>
      ),
    },
  ],
  usage: `import { Favicon, LinkCard } from '@nish/ui';

<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {apps.map((app) => (
    <LinkCard
      key={app.id}
      href={app.url}
      title={app.name}
      blurb={app.blurb}
      icon={<Favicon url={app.url} size={20} />}
      accent={app.accent}
      status={{ tone: app.up ? 'ok' : 'loss', label: app.up ? 'Online' : 'Down' }}
      external
    />
  ))}
</div>`,
  guidelines: [
    'Use a grid with minmax columns; leave layout on auto so a one-column phone list becomes 64px rows by itself.',
    'The tile color is the app\'s identity: pick one accent per destination and keep it everywhere.',
    'A disabled card is for something not available yet. It is not focusable and says so with aria-disabled.',
    'Hover lift only happens on devices that hover, so touch screens never show a stuck raised card.',
  ],
};
