import { Badge, ListRow, Switch } from '../../src';
import { BellIcon, ChartIcon, SettingsIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- ListRow --------------------------------------------------------------------------------

function Rows({ dense = false }: { dense?: boolean }) {
  return (
    <ul className="m-0 w-full list-none rounded-xl border border-th-line bg-th-surface p-1">
      <ListRow dense={dense} icon={<ChartIcon size={20} />} title="Portfolio" subtitle="Positions, orders and performance" meta="$48,210" href="#/components/list-row" />
      <ListRow dense={dense} icon={<BellIcon size={20} />} title="Alerts" subtitle="3 price alerts are armed" meta="Today" onClick={() => undefined} active />
      <ListRow dense={dense} icon={<SettingsIcon size={20} />} title="Settings" trailing={<Badge tone="info">New</Badge>} onClick={() => undefined} />
    </ul>
  );
}

const PRESETS = {
  link: { title: 'Portfolio', subtitle: 'Positions, orders and performance', meta: '$48,210', href: '#/components/list-row' },
} as const;

export const listRow: ComponentDoc = {
  id: 'list-row',
  name: 'ListRow',
  exports: ['ListRow'],
  summary:
    'The row every settings list, inbox and menu page writes by hand: icon, title, subtitle, a right-aligned meta, a trailing control and a chevron, where the whole row is the link or button. 52px tall (44px dense), with a hover and active tint.',
  importLine: "import { ListRow } from '@nish/ui';",
  controls: [
    { key: 'kind', label: 'Acts as', type: 'select', options: ['link', 'button', 'external'] },
    { key: 'subtitle', label: 'Subtitle', type: 'boolean' },
    { key: 'meta', label: 'Meta', type: 'boolean' },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'dense', label: 'Dense', type: 'boolean' },
    { key: 'active', label: 'Active', type: 'boolean' },
    { key: 'danger', label: 'Danger tone', type: 'boolean' },
  ],
  initial: { kind: 'link', subtitle: true, meta: true, icon: true, dense: false, active: false, danger: false },
  render: (a) => (
    <ul className="m-0 w-full max-w-md list-none rounded-xl border border-th-line bg-th-surface p-1">
      <ListRow
        icon={a.icon ? <ChartIcon size={20} /> : undefined}
        title={a.danger ? 'Delete account' : PRESETS.link.title}
        subtitle={a.subtitle ? PRESETS.link.subtitle : undefined}
        meta={a.meta ? PRESETS.link.meta : undefined}
        href={a.kind === 'button' ? undefined : a.kind === 'external' ? 'https://nish.software' : PRESETS.link.href}
        external={a.kind === 'external'}
        onClick={a.kind === 'button' ? () => undefined : undefined}
        dense={!!a.dense}
        active={!!a.active}
        tone={a.danger ? 'danger' : undefined}
      />
    </ul>
  ),
  code: (a) =>
    jsx('ListRow', {
      icon: a.icon ? '{<ChartIcon />}' : undefined,
      title: a.danger ? 'Delete account' : 'Portfolio',
      subtitle: a.subtitle ? 'Positions, orders and performance' : undefined,
      meta: a.meta ? '$48,210' : undefined,
      href: a.kind === 'button' ? undefined : a.kind === 'external' ? 'https://nish.software' : '/portfolio',
      external: a.kind === 'external' ? true : undefined,
      onClick: a.kind === 'button' ? '{open}' : undefined,
      dense: a.dense ? true : undefined,
      active: a.active ? true : undefined,
      tone: a.danger ? 'danger' : undefined,
    }),
  stories: [
    { id: 'list', name: 'A list', render: () => <Rows /> },
    { id: 'dense', name: 'Dense', render: () => <Rows dense /> },
    {
      id: 'trailing',
      name: 'With a trailing control',
      note: 'A row with no href or onClick is plain, so a Switch can sit in it as the trailing control.',
      render: () => (
        <ul className="m-0 w-full list-none rounded-xl border border-th-line bg-th-surface p-1">
          <ListRow as="li" icon={<BellIcon size={20} />} title="Price alerts" subtitle="Notify me when a target is hit" trailing={<Switch aria-label="Price alerts" checked onChange={() => undefined} />} />
          <ListRow as="li" title="Delete all data" tone="danger" onClick={() => undefined} />
        </ul>
      ),
    },
    {
      id: 'external',
      name: 'External link',
      render: () => (
        <ul className="m-0 w-full list-none rounded-xl border border-th-line bg-th-surface p-1">
          <ListRow icon={<ChartIcon size={20} />} title="Open the status page" subtitle="status.nish.software" href="https://status.nish.software" external />
        </ul>
      ),
    },
  ],
  usage: `import { ListRow } from '@nish/ui';

<ul>
  <ListRow icon={<GearIcon />} title="Settings" subtitle="Account and preferences" href="/settings" />
  <ListRow icon={<BellIcon />} title="Notifications" meta="On" onClick={openNotifications} />
  <ListRow title="Delete account" tone="danger" onClick={confirmDelete} />
</ul>`,
  guidelines: [
    'Use as="div" when the row is not inside a <ul> or <ol>.',
    'With a client-side router, pass onClick that navigates instead of href, so the row stays one control and the router handles the transition.',
    'Do not put a second button inside a row that is itself a link or button. Trailing is for non-interactive badges or a Switch in a plain row.',
    'Titles truncate; subtitles clamp to two lines. Keep meta to a short value such as a date or an amount.',
  ],
};
