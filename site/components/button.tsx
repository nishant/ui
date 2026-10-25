import { Button, Card } from '../../src';
import { buttonClass } from '../../src/components/primitives';
import { DownloadIcon, PlusIcon, RefreshIcon, TrashIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- Button -------------------------------------------------------------------------

export const button: ComponentDoc = {
  id: 'button',
  name: 'Button',
  exports: ['Button'],
  summary:
    'The standard action. Seven variants by intent, four sizes, a built-in loading state, a disabled look that reads as disabled in every theme, and buttonClass() for links that look like buttons.',
  importLine: "import { Button } from '@nish/ui';",
  controls: [
    { key: 'variant', label: 'Variant', type: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'soft', 'subtle', 'link'] },
    { key: 'size', label: 'Size', type: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'loading', label: 'Loading', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { variant: 'primary', size: 'md', label: 'Save changes', icon: false, loading: false, disabled: false },
  render: (a) => (
    <Button
      variant={a.variant as 'primary'}
      size={a.size as 'md'}
      loading={!!a.loading}
      disabled={!!a.disabled}
      icon={a.icon ? <DownloadIcon size={a.size === 'xs' ? 12 : a.size === 'sm' ? 13 : 16} /> : undefined}
    >
      {String(a.label)}
    </Button>
  ),
  code: (a) =>
    jsx(
      'Button',
      {
        variant: a.variant === 'secondary' ? undefined : a.variant,
        size: a.size === 'md' ? undefined : a.size,
        icon: a.icon ? `{<DownloadIcon size={${a.size === 'xs' ? 12 : a.size === 'sm' ? 13 : 16}} />}` : undefined,
        loading: a.loading,
        disabled: a.disabled,
      },
      String(a.label),
    ),
  stories: [
    {
      id: 'variants',
      name: 'Variants',
      note: 'One primary per view. Secondary is the default.',
      render: () => (
        <Row>
          <Button variant="primary">Save changes</Button>
          <Button>Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Delete tracker</Button>
        </Row>
      ),
    },
    {
      id: 'soft-subtle-link',
      name: 'Soft, subtle and link',
      note: 'soft: an accent action that is not the main one. subtle: a filled quiet button for dense toolbars. link: inline in text.',
      render: () => (
        <Row>
          <Button variant="soft">Add to watchlist</Button>
          <Button variant="subtle">Filters</Button>
          <Button variant="link">View all 24</Button>
        </Row>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      note: 'xs, sm and md grow to 44px on touch screens.',
      render: () => (
        <Row>
          <Button size="xs" variant="primary">
            Extra small
          </Button>
          <Button size="sm" variant="primary">
            Small
          </Button>
          <Button variant="primary">Medium</Button>
          <Button size="lg" variant="primary">
            Large
          </Button>
        </Row>
      ),
    },
    {
      id: 'icon',
      name: 'With an icon',
      render: () => (
        <Row>
          <Button variant="primary" icon={<PlusIcon size={16} />}>
            New tracker
          </Button>
          <Button icon={<DownloadIcon size={16} />}>Export CSV</Button>
          <Button size="sm" variant="ghost" icon={<RefreshIcon size={13} />}>
            Refresh
          </Button>
        </Row>
      ),
    },
    {
      id: 'loading',
      name: 'Loading',
      note: 'The spinner replaces the icon and the button disables itself.',
      render: () => (
        <Row>
          <Button variant="primary" loading>
            Saving
          </Button>
          <Button loading>Syncing</Button>
          <Button size="sm" loading>
            Checking
          </Button>
        </Row>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      note: 'Every variant flattens to the same quiet look.',
      render: () => (
        <Row>
          <Button variant="primary" disabled>
            Primary
          </Button>
          <Button disabled>Secondary</Button>
          <Button variant="ghost" disabled>
            Ghost
          </Button>
          <Button variant="danger" disabled>
            Danger
          </Button>
          <Button variant="soft" disabled>
            Soft
          </Button>
          <Button variant="subtle" disabled>
            Subtle
          </Button>
          <Button variant="link" disabled>
            Link
          </Button>
        </Row>
      ),
    },
    {
      id: 'dense',
      name: 'Dense toolbar (xs, subtle)',
      note: 'For dashboards with many small controls. Still 44px on touch screens.',
      render: () => (
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-th-line bg-th-surface p-1.5">
          <Button size="xs" variant="subtle" icon={<RefreshIcon size={12} />}>
            Refresh
          </Button>
          <Button size="xs" variant="subtle">
            1D
          </Button>
          <Button size="xs" variant="soft">
            1W
          </Button>
          <Button size="xs" variant="ghost">
            Clear
          </Button>
        </div>
      ),
    },
    {
      id: 'class',
      name: 'buttonClass() on a link',
      note: 'The same recipe on an <a> or a router <Link>, so a link that looks like a button matches exactly.',
      render: () => (
        <Row>
          <a href="#/components/button" className={buttonClass({ variant: 'primary' })}>
            Open the board
          </a>
          <a href="#/components/button" className={buttonClass({ variant: 'soft', size: 'sm' })}>
            Download CSV
          </a>
          <a href="#/components/button" className={buttonClass({ variant: 'link' })}>
            Back to jobs
          </a>
        </Row>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card title="Export applications" description="CSV with every field, one row per application." className="w-full max-w-md">
          <p className="text-sm text-th-hi2">
            24 applications match your filters. <Button variant="link">Change filters</Button>
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button variant="soft">Copy link</Button>
            <Button variant="primary" icon={<DownloadIcon size={16} />}>
              Export CSV
            </Button>
          </div>
        </Card>
      ),
    },
    {
      id: 'confirm',
      name: 'Confirm row',
      note: 'A destructive pair: the safe choice first, the danger last.',
      render: () => (
        <div className="flex w-full flex-wrap justify-end gap-2 rounded-lg border border-th-line bg-th-surface p-3">
          <Button variant="ghost">Keep it</Button>
          <Button variant="danger" icon={<TrashIcon size={16} />}>
            Delete 3 alerts
          </Button>
        </div>
      ),
    },
    {
      id: 'long',
      name: 'Long label, full width',
      note: 'Labels never wrap. On phones, give the main action the full width.',
      wide: true,
      render: () => (
        <div className="grid w-full max-w-sm gap-2">
          <Button variant="primary" size="lg" className="w-full">
            Close all 3 positions at market
          </Button>
          <Button className="w-full">Review before closing</Button>
        </div>
      ),
    },
  ],
  usage: `import { Button } from '@nish/ui';
import { Download } from 'lucide-react';

// buttonClass gives a router link the same look:
// <Link to="/board" className={buttonClass({ variant: 'soft', size: 'sm' })}>Open board</Link>

export function ExportBar({ onExport, busy }: { onExport: () => void; busy: boolean }) {
  return (
    <div className="flex gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary" icon={<Download size={16} />} loading={busy} onClick={onExport}>
        {busy ? 'Exporting' : 'Export CSV'}
      </Button>
    </div>
  );
}`,
  guidelines: [
    'Use one primary button per view: the action most people came to take.',
    'Label with a verb and an object ("Save changes", "Delete tracker"), not "OK".',
    'Danger is for actions that destroy something. Confirm them in a Modal when they cannot be undone.',
    'Button defaults to type="button". Pass type="submit" on the one that submits a form.',
    'soft replaces hand-made "accent outline" buttons; subtle is the filled quiet look for dense toolbars and chips.',
    'For a link that looks like a button (<a>, router <Link>, <a download>), use buttonClass({ variant, size }). Never copy the class string.',
    'variant="link" is for actions inside text. It has no touch growth, so do not use it as a standalone control in a toolbar.',
  ],
};
