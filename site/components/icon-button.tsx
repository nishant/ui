import { Card, IconButton } from '../../src';
import { iconButtonClass } from '../../src/components/primitives';
import { BellIcon, ExternalIcon, PinIcon, RefreshIcon, SettingsIcon, TrashIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { ICONS, Row } from './shared';

// --- IconButton ---------------------------------------------------------------------

const px = (size: unknown) => (size === 'xs' ? 12 : size === 'sm' ? 14 : 16);

export const iconButton: ComponentDoc = {
  id: 'icon-button',
  name: 'IconButton',
  exports: ['IconButton'],
  summary:
    'A square, icon-only button for toolbars and table rows. Three sizes, three variants and a danger tone. The label is required: it becomes the accessible name and the hover title.',
  importLine: "import { IconButton } from '@nish/ui';",
  controls: [
    { key: 'icon', label: 'Icon', type: 'select', options: Object.keys(ICONS) },
    { key: 'size', label: 'Size', type: 'select', options: ['xs', 'sm', 'md'] },
    { key: 'variant', label: 'Variant', type: 'select', options: ['ghost', 'subtle', 'soft'] },
    { key: 'tone', label: 'Tone', type: 'select', options: ['neutral', 'danger'] },
    { key: 'active', label: 'Active', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { icon: 'refresh', size: 'md', variant: 'ghost', tone: 'neutral', active: false, disabled: false },
  render: (a) => {
    const I = ICONS[String(a.icon)];
    return (
      <IconButton
        label={String(a.icon) === 'refresh' ? 'Refresh' : String(a.icon)}
        size={a.size as 'md'}
        variant={a.variant as 'ghost'}
        tone={a.tone as 'neutral'}
        active={!!a.active}
        disabled={!!a.disabled}
      >
        <I size={px(a.size)} />
      </IconButton>
    );
  },
  code: (a) => {
    const name = `${String(a.icon)[0].toUpperCase()}${String(a.icon).slice(1)}Icon`;
    return jsx(
      'IconButton',
      {
        label: String(a.icon) === 'refresh' ? 'Refresh' : String(a.icon),
        size: a.size === 'md' ? undefined : a.size,
        variant: a.variant === 'ghost' ? undefined : a.variant,
        tone: a.tone === 'neutral' ? undefined : a.tone,
        active: a.active,
        disabled: a.disabled,
      },
      `<${name} size={${px(a.size)}} />`,
    );
  },
  stories: [
    {
      id: 'sizes',
      name: 'Sizes',
      note: 'xs 24px, sm 28px, md 36px. All grow to 44px on touch screens.',
      render: () => (
        <Row>
          <IconButton label="Refresh" size="xs">
            <RefreshIcon size={12} />
          </IconButton>
          <IconButton label="Refresh" size="sm">
            <RefreshIcon size={14} />
          </IconButton>
          <IconButton label="Refresh">
            <RefreshIcon size={16} />
          </IconButton>
        </Row>
      ),
    },
    {
      id: 'variants',
      name: 'Variants',
      note: 'ghost (default), subtle (a quiet filled square), soft (accent tint).',
      render: () => (
        <Row>
          <IconButton label="Settings">
            <SettingsIcon size={16} />
          </IconButton>
          <IconButton label="Settings" variant="subtle">
            <SettingsIcon size={16} />
          </IconButton>
          <IconButton label="Settings" variant="soft">
            <SettingsIcon size={16} />
          </IconButton>
        </Row>
      ),
    },
    {
      id: 'active',
      name: 'Active (pressed)',
      note: 'For toggles: sets aria-pressed.',
      render: () => (
        <Row>
          <IconButton label="Pin to top" active>
            <PinIcon size={16} />
          </IconButton>
          <IconButton label="Pin to top">
            <PinIcon size={16} />
          </IconButton>
          <IconButton label="Pin to top" variant="subtle" active>
            <PinIcon size={16} />
          </IconButton>
          <IconButton label="Pin to top" variant="soft" active>
            <PinIcon size={16} />
          </IconButton>
        </Row>
      ),
    },
    {
      id: 'danger',
      name: 'Danger tone',
      note: 'Hover and pressed turn loss-red. For delete and remove actions.',
      render: () => (
        <Row>
          <IconButton label="Delete tracker" tone="danger">
            <TrashIcon size={16} />
          </IconButton>
          <IconButton label="Delete tracker" tone="danger" variant="subtle">
            <TrashIcon size={16} />
          </IconButton>
          <IconButton label="Delete tracker" tone="danger" active>
            <TrashIcon size={16} />
          </IconButton>
        </Row>
      ),
    },
    {
      id: 'toolbar',
      name: 'Toolbar',
      render: () => (
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-th-line bg-th-surface p-1">
          <IconButton label="Refresh">
            <RefreshIcon size={16} />
          </IconButton>
          <IconButton label="Alerts">
            <BellIcon size={16} />
          </IconButton>
          <IconButton label="Pinned" active>
            <PinIcon size={16} />
          </IconButton>
          <span className="mx-1 h-5 w-px bg-th-line" aria-hidden="true" />
          <IconButton label="Settings">
            <SettingsIcon size={16} />
          </IconButton>
        </div>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <Row>
          <IconButton label="Delete" disabled>
            <TrashIcon size={16} />
          </IconButton>
          <IconButton label="Refresh" variant="subtle" disabled>
            <RefreshIcon size={16} />
          </IconButton>
          <IconButton label="Refresh" variant="soft" disabled>
            <RefreshIcon size={16} />
          </IconButton>
        </Row>
      ),
    },
    {
      id: 'class',
      name: 'iconButtonClass() on a link',
      note: 'An icon-only link with the same look. Give it an aria-label.',
      render: () => (
        <Row>
          <a href="#/components/icon-button" aria-label="Open in a new tab" className={iconButtonClass({ variant: 'subtle' })}>
            <ExternalIcon size={16} />
          </a>
        </Row>
      ),
    },
    {
      id: 'card',
      name: 'In a card header (xs)',
      wide: true,
      render: () => (
        <Card
          padding="none"
          title="Watchlist"
          description="14 symbols"
          action={
            <>
              <IconButton label="Refresh watchlist" size="xs">
                <RefreshIcon size={12} />
              </IconButton>
              <IconButton label="Watchlist settings" size="xs">
                <SettingsIcon size={12} />
              </IconButton>
            </>
          }
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <p className="text-sm font-medium text-th-hi">NVDA</p>
            <IconButton label="Remove NVDA" size="sm" tone="danger">
              <TrashIcon size={14} />
            </IconButton>
          </div>
        </Card>
      ),
    },
    {
      id: 'row',
      name: 'In a table row',
      wide: true,
      render: () => (
        <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-th-line bg-th-surface px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-th-hi">Sony WH-1000XM6 at Best Buy</p>
            <p className="text-xs text-th-hi3">$398.00 · checked 12 minutes ago</p>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <IconButton label="Check now" size="sm">
              <RefreshIcon size={14} />
            </IconButton>
            <IconButton label="Delete tracker" size="sm" tone="danger">
              <TrashIcon size={14} />
            </IconButton>
          </div>
        </div>
      ),
    },
  ],
  usage: `import { IconButton, iconButtonClass } from '@nish/ui';
import { RefreshCw, Trash2, ExternalLink } from 'lucide-react';

<IconButton label="Refresh prices" onClick={refetch} disabled={isFetching}>
  <RefreshCw size={16} />
</IconButton>

<IconButton label="Delete tracker" size="sm" tone="danger" onClick={remove}>
  <Trash2 size={14} />
</IconButton>

<a href={url} aria-label="Open listing" className={iconButtonClass({ variant: 'subtle' })}>
  <ExternalLink size={16} />
</a>`,
  guidelines: [
    'Only for icons everyone recognizes (refresh, close, delete, settings). Otherwise use a Button with a label.',
    'The label is what screen readers announce and what the hover title shows. Name the action, not the icon.',
    'Use size="sm" inside dense table rows and size="xs" in dense headers; every size reaches 44px on touch screens.',
    'Use tone="danger" for delete and remove, so the destructive one reads differently on hover.',
    'For an icon-only link, use iconButtonClass() and an aria-label instead of copying classes.',
  ],
};
