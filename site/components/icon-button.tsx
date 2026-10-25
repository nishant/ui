import { IconButton } from '../../src';
import { BellIcon, PinIcon, RefreshIcon, SettingsIcon, TrashIcon } from '../lib/icons';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';
import { ICONS, Row } from './shared';

// --- IconButton ---------------------------------------------------------------------

export const iconButton: ComponentDoc = {
  id: 'icon-button',
  name: 'IconButton',
  exports: ['IconButton'],
  summary: 'A square, icon-only button for toolbars and table rows. The label is required: it becomes the accessible name and the hover title.',
  importLine: "import { IconButton } from '@nish/ui';",
  controls: [
    { key: 'icon', label: 'Icon', type: 'select', options: Object.keys(ICONS) },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md'] },
    { key: 'active', label: 'Active', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { icon: 'refresh', size: 'md', active: false, disabled: false },
  render: (a) => {
    const I = ICONS[String(a.icon)];
    return (
      <IconButton label={String(a.icon) === 'refresh' ? 'Refresh' : String(a.icon)} size={a.size as 'md'} active={!!a.active} disabled={!!a.disabled}>
        <I size={a.size === 'sm' ? 14 : 16} />
      </IconButton>
    );
  },
  code: (a) => {
    const name = `${String(a.icon)[0].toUpperCase()}${String(a.icon).slice(1)}Icon`;
    return jsx(
      'IconButton',
      { label: String(a.icon) === 'refresh' ? 'Refresh' : String(a.icon), size: a.size === 'md' ? undefined : a.size, active: a.active, disabled: a.disabled },
      `<${name} size={${a.size === 'sm' ? 14 : 16}} />`,
    );
  },
  stories: [
    {
      id: 'sizes',
      name: 'Sizes',
      render: () => (
        <Row>
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
          <IconButton label="Refresh" disabled>
            <RefreshIcon size={16} />
          </IconButton>
        </Row>
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
            <IconButton label="Delete tracker" size="sm">
              <TrashIcon size={14} />
            </IconButton>
          </div>
        </div>
      ),
    },
  ],
  usage: `import { IconButton } from '@nish/ui';
import { RefreshCw } from 'lucide-react';

<IconButton label="Refresh prices" onClick={refetch} disabled={isFetching}>
  <RefreshCw size={16} />
</IconButton>`,
  guidelines: [
    'Only for icons everyone recognizes (refresh, close, delete, settings). Otherwise use a Button with a label.',
    'The label is what screen readers announce and what the hover title shows. Name the action, not the icon.',
    'Use size="sm" inside dense table rows; both sizes reach 44px on touch screens.',
  ],
};
