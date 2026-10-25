// Every component page's content: canvas controls, stories, usage and guidance. The
// props tables come from the TypeScript source (site/docgen.mjs), not from here.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Badge,
  Button,
  Card,
  dismissToast,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Label,
  Textarea,
  Checkbox,
  Modal,
  Select,
  Skeleton,
  SkeletonLines,
  Segmented,
  ThemeToggle,
  toast,
  Tooltip,
  type ToastTone,
} from '../src';
import {
  BellIcon,
  ChartIcon,
  DownloadIcon,
  InboxIcon,
  PinIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  TrashIcon,
} from './lib/icons';
import { jsx, type Args } from './lib/jsx';

export type Control =
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'text' }
  | { key: string; label: string; type: 'number'; min: number; max: number };

export interface Story {
  id: string;
  name: string;
  note?: string;
  render: () => ReactNode;
  /** Spans the full row in the stories grid. */
  wide?: boolean;
}

export interface ComponentDoc {
  id: string;
  name: string;
  /** Names in the docgen output (src/index.ts exports) to show props for. */
  exports: string[];
  summary: string;
  importLine: string;
  controls: Control[];
  initial: Args;
  render: (a: Args) => ReactNode;
  code: (a: Args) => string;
  stories: Story[];
  usage: string;
  guidelines: string[];
  /** Portaled, fixed-position components render in an iframe per story, so each one
   *  gets a whole document (and a whole theme) of its own. */
  framed?: { height: number };
  /** Extra API to document below the props (functions, hooks, types). */
  api?: { functions: string[]; interfaces: string[] };
}

const ICONS: Record<string, (p: { size?: number }) => ReactNode> = {
  refresh: RefreshIcon,
  pin: PinIcon,
  settings: SettingsIcon,
  bell: BellIcon,
  trash: TrashIcon,
};

const Row = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
);

const Field = ({ label, children, hint, error, id }: { label: string; children: ReactNode; hint?: string; error?: string; id?: string }) => (
  <label className="grid w-full gap-1.5">
    <Label>{label}</Label>
    {children}
    {error ? (
      <span id={id} className="text-xs text-th-loss">
        {error}
      </span>
    ) : hint ? (
      <span id={id} className="text-xs text-th-hi3">
        {hint}
      </span>
    ) : null}
  </label>
);

// --- Button -------------------------------------------------------------------------

const button: ComponentDoc = {
  id: 'button',
  name: 'Button',
  exports: ['Button'],
  summary:
    'The standard action. Four variants by intent, three sizes, a built-in loading state, and a disabled look that reads as disabled in every theme.',
  importLine: "import { Button } from '@nish/ui';",
  controls: [
    { key: 'variant', label: 'Variant', type: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md', 'lg'] },
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
      icon={a.icon ? <DownloadIcon size={a.size === 'sm' ? 13 : 16} /> : undefined}
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
        icon: a.icon ? `{<DownloadIcon size={${a.size === 'sm' ? 13 : 16}} />}` : undefined,
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
      id: 'sizes',
      name: 'Sizes',
      note: 'sm and md grow to 44px on touch screens.',
      render: () => (
        <Row>
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
        </Row>
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
  ],
};

// --- IconButton ---------------------------------------------------------------------

const iconButton: ComponentDoc = {
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

// --- Card ---------------------------------------------------------------------------

const ROWS = [
  ['jobs.nish.software', 'Job search', 'ok', '41 ms'],
  ['trading.nish.software', 'Options ideas', 'ok', '88 ms'],
  ['mc.nish.software', 'Minecraft guides', 'warn', '612 ms'],
  ['trackers.nish.software', 'Price trackers', 'loss', 'timeout'],
] as const;

function MiniTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-th-line bg-th-elevated/50 text-left text-xs text-th-hi3">
            <th className="px-4 py-2 font-medium">Host</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">Response</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([host, , s, ms]) => (
            <tr key={host} className="border-b border-th-line last:border-0">
              <td className="px-4 py-2.5 font-medium text-th-hi">{host}</td>
              <td className="px-4 py-2.5">
                <Badge tone={s}>{s === 'ok' ? 'Up' : s === 'warn' ? 'Slow' : 'Down'}</Badge>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-th-hi2">{ms}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const card: ComponentDoc = {
  id: 'card',
  name: 'Card',
  exports: ['Card'],
  summary: 'The surface everything sits on: widgets, tables, forms. A border, the surface color and the card shadow, with optional padding and hover.',
  importLine: "import { Card } from '@nish/ui';",
  controls: [
    { key: 'content', label: 'Content', type: 'select', options: ['text', 'table', 'stat'] },
    { key: 'padded', label: 'Padded', type: 'boolean' },
    { key: 'interactive', label: 'Interactive', type: 'boolean' },
  ],
  initial: { content: 'text', padded: true, interactive: false },
  render: (a) => (
    <Card padded={!!a.padded} interactive={!!a.interactive} className="w-full max-w-md">
      {a.content === 'table' ? (
        <MiniTable />
      ) : a.content === 'stat' ? (
        <div className={a.padded ? '' : 'p-4'}>
          <p className="text-xs text-th-hi3">Open applications</p>
          <p className="text-3xl font-semibold tabular-nums text-th-hi">24</p>
          <p className="text-xs text-th-ok">+5 this week</p>
        </div>
      ) : (
        <div className={a.padded ? 'space-y-1' : 'space-y-1 p-4'}>
          <p className="font-semibold text-th-hi">Weekly digest</p>
          <p className="text-sm text-th-hi2">Every Monday at 8 am: new roles that match your saved searches, and the trackers that dropped in price.</p>
        </div>
      )}
    </Card>
  ),
  code: (a) => jsx('Card', { padded: a.padded ? undefined : '{false}', interactive: a.interactive }, a.content === 'table' ? '…table…' : '…'),
  stories: [
    {
      id: 'default',
      name: 'Default',
      render: () => (
        <Card className="w-full">
          <p className="font-semibold text-th-hi">Weekly digest</p>
          <p className="mt-1 text-sm text-th-hi2">Every Monday at 8 am: new roles that match your saved searches.</p>
        </Card>
      ),
    },
    {
      id: 'interactive',
      name: 'Interactive',
      note: 'For cards that are links. Hover lifts the border and the fill.',
      render: () => (
        <a href="#/components/card" className="block w-full rounded-xl">
          <Card interactive className="w-full">
            <p className="text-xs font-medium uppercase tracking-wider text-th-hi3">jobs.nish.software</p>
            <p className="mt-1 font-semibold text-th-hi">Job search</p>
            <p className="text-sm text-th-hi2">24 open applications, 3 interviews this week.</p>
          </Card>
        </a>
      ),
    },
    {
      id: 'table',
      name: 'Unpadded, table edge to edge',
      wide: true,
      render: () => (
        <Card padded={false} className="w-full overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-th-line px-4 py-3">
            <p className="font-semibold text-th-hi">Sites</p>
            <Badge tone="ok">8 up</Badge>
          </div>
          <MiniTable />
        </Card>
      ),
    },
    {
      id: 'stats',
      name: 'Stat tiles',
      wide: true,
      render: () => (
        <Card padded={false} className="grid w-full grid-cols-2 gap-px overflow-hidden bg-th-line sm:grid-cols-4">
          {[
            ['Up', '8', 'text-th-ok'],
            ['Slow', '1', 'text-th-warn'],
            ['Down', '1', 'text-th-loss'],
            ['p95', '212 ms', 'text-th-hi'],
          ].map(([k, v, c]) => (
            <div key={k} className="bg-th-surface px-4 py-3">
              <p className="text-xs text-th-hi3">{k}</p>
              <p className={`text-2xl font-semibold tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </Card>
      ),
    },
  ],
  usage: `import { Card, Badge } from '@nish/ui';

<Card padded={false} className="overflow-hidden">
  <div className="flex items-center justify-between border-b border-th-line px-4 py-3">
    <h2 className="font-semibold text-th-hi">Sites</h2>
    <Badge tone="ok">8 up</Badge>
  </div>
  <table className="w-full text-sm">…</table>
</Card>`,
  guidelines: [
    'Turn padding off (padded={false}) for tables and lists that run edge to edge, and pad the header yourself.',
    'Raised things inside a card use bg-th-elevated; the deepest layer (chips inside those) uses bg-th-overlay.',
    'Use interactive only when the whole card is a link or a button.',
  ],
};

// --- Badge --------------------------------------------------------------------------

const TONES = ['neutral', 'accent', 'ok', 'loss', 'warn', 'info'] as const;

const badge: ComponentDoc = {
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

// --- Input --------------------------------------------------------------------------

const input: ComponentDoc = {
  id: 'input',
  name: 'Input',
  exports: ['Input'],
  summary: 'The shared text field. 16px text on phones so iOS does not zoom on focus, 44px tall on touch screens, and an invalid state.',
  importLine: "import { Input } from '@nish/ui';",
  controls: [
    { key: 'type', label: 'Type', type: 'select', options: ['text', 'email', 'number', 'search'] },
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { type: 'text', placeholder: 'Company or title', invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <Field label="Search" error={a.invalid ? 'Enter at least 2 characters.' : undefined} id="canvas-input-msg">
        <Input
          type={String(a.type)}
          placeholder={String(a.placeholder)}
          invalid={!!a.invalid}
          disabled={!!a.disabled}
          aria-describedby={a.invalid ? 'canvas-input-msg' : undefined}
        />
      </Field>
    </div>
  ),
  code: (a) =>
    jsx('Input', {
      type: a.type === 'text' ? undefined : a.type,
      placeholder: a.placeholder || undefined,
      invalid: a.invalid,
      disabled: a.disabled,
      'aria-describedby': a.invalid ? 'search-error' : undefined,
    }),
  stories: [
    {
      id: 'label',
      name: 'With a label',
      render: () => (
        <Field label="Company">
          <Input defaultValue="Figma" />
        </Field>
      ),
    },
    {
      id: 'placeholder',
      name: 'Placeholder and hint',
      render: () => (
        <Field label="Price target" hint="In dollars, without the $.">
          <Input inputMode="decimal" placeholder="180.00" />
        </Field>
      ),
    },
    {
      id: 'invalid',
      name: 'Invalid',
      render: () => (
        <Field label="Price target" error="Enter a number." id="story-invalid">
          <Input invalid defaultValue="abc" aria-describedby="story-invalid" />
        </Field>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <Field label="API key">
          <Input disabled defaultValue="Managed by the server" />
        </Field>
      ),
    },
    {
      id: 'icon',
      name: 'With a leading icon',
      render: () => (
        <div className="relative w-full">
          <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-th-hi3" />
          <Input type="search" placeholder="Search 1,204 listings" aria-label="Search listings" className="pl-9" />
        </div>
      ),
    },
    {
      id: 'long',
      name: 'Long value',
      render: () => (
        <Field label="Feed URL">
          <Input defaultValue="https://trackers.nish.software/api/feeds/price-drops?since=2026-10-01&format=rss" />
        </Field>
      ),
    },
  ],
  usage: `import { Input, Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Price target</Label>
  <Input
    inputMode="decimal"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    invalid={!!error}
    aria-describedby="target-error"
  />
  {error ? <span id="target-error" className="text-xs text-th-loss">{error}</span> : null}
</label>`,
  guidelines: [
    'Always give the field a visible Label. Placeholders vanish as soon as someone types.',
    'With invalid, show the reason as text and tie it to the input with aria-describedby.',
    'Use inputMode for numbers ("decimal", "numeric") so phones show the right keyboard.',
  ],
};

// --- Select -------------------------------------------------------------------------

const select: ComponentDoc = {
  id: 'select',
  name: 'Select',
  exports: ['Select'],
  summary: 'A native select with the shared field look. It keeps the platform picker on phones, which beats any custom dropdown there.',
  importLine: "import { Select } from '@nish/ui';",
  controls: [
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-xs">
      <Field label="Status" error={a.invalid ? 'Pick a status.' : undefined}>
        <Select defaultValue="applied" invalid={!!a.invalid} disabled={!!a.disabled}>
          <option value="open">Open</option>
          <option value="applied">Applied</option>
          <option value="interview">Interviewing</option>
          <option value="closed">Closed</option>
        </Select>
      </Field>
    </div>
  ),
  code: (a) =>
    jsx(
      'Select',
      { defaultValue: 'applied', invalid: a.invalid, disabled: a.disabled },
      '\n  <option value="open">Open</option>\n  <option value="applied">Applied</option>\n',
    ).replace('>\n  \n', '>\n'),
  stories: [
    {
      id: 'default',
      name: 'Default',
      render: () => (
        <Field label="Status">
          <Select defaultValue="applied">
            <option value="open">Open</option>
            <option value="applied">Applied</option>
            <option value="closed">Closed</option>
          </Select>
        </Field>
      ),
    },
    {
      id: 'invalid',
      name: 'Invalid',
      render: () => (
        <Field label="Expiry" error="Pick an expiry date.">
          <Select invalid defaultValue="">
            <option value="">Choose…</option>
            <option value="2026-11-20">Nov 20, 2026</option>
          </Select>
        </Field>
      ),
    },
    {
      id: 'disabled',
      name: 'Disabled',
      render: () => (
        <Field label="Region">
          <Select disabled defaultValue="us">
            <option value="us">United States</option>
          </Select>
        </Field>
      ),
    },
    {
      id: 'filters',
      name: 'Filter row',
      wide: true,
      render: () => (
        <div className="grid w-full gap-3 sm:grid-cols-3">
          <Field label="Search">
            <Input placeholder="Company or title" />
          </Field>
          <Field label="Status">
            <Select defaultValue="all">
              <option value="all">All statuses</option>
              <option value="applied">Applied</option>
            </Select>
          </Field>
          <Field label="Sort">
            <Select defaultValue="recent">
              <option value="recent">Most recent</option>
              <option value="salary">Highest salary</option>
            </Select>
          </Field>
        </div>
      ),
    },
  ],
  usage: `import { Select, Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Status</Label>
  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
    <option value="open">Open</option>
    <option value="applied">Applied</option>
    <option value="closed">Closed</option>
  </Select>
</label>`,
  guidelines: [
    'className goes on the wrapper, so width classes (w-40) size the whole control including the chevron.',
    'For more than about 15 options, or when people need to search, use an Input with suggestions instead.',
  ],
};

// --- Label --------------------------------------------------------------------------

const label: ComponentDoc = {
  id: 'label',
  name: 'Label',
  exports: ['Label'],
  summary: 'The small uppercase label above fields and over sections of a card.',
  importLine: "import { Label } from '@nish/ui';",
  controls: [{ key: 'text', label: 'Text', type: 'text' }],
  initial: { text: 'Price target' },
  render: (a) => <Label>{String(a.text)}</Label>,
  code: (a) => jsx('Label', {}, String(a.text)),
  stories: [
    {
      id: 'field',
      name: 'Field label',
      render: () => (
        <Field label="Email">
          <Input type="email" defaultValue="me@nish.software" />
        </Field>
      ),
    },
    {
      id: 'section',
      name: 'Section heading in a card',
      render: () => (
        <Card className="w-full space-y-2">
          <Label>Upcoming</Label>
          <p className="text-sm text-th-hi">Interview with Linear, Thursday 2 pm</p>
          <p className="text-sm text-th-hi">Offer call with Vercel, Friday 11 am</p>
        </Card>
      ),
    },
    {
      id: 'count',
      name: 'With a count',
      render: () => (
        <div className="flex items-center gap-2">
          <Label>Watchlist</Label>
          <Badge>14</Badge>
        </div>
      ),
    },
  ],
  usage: `import { Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Email</Label>
  <Input type="email" />
</label>`,
  guidelines: [
    'Label renders a span. Wrap the Label and the field in a <label> element (or use htmlFor on your own label) so clicking it focuses the field.',
  ],
};

// --- Skeleton -----------------------------------------------------------------------

const skeleton: ComponentDoc = {
  id: 'skeleton',
  name: 'Skeleton',
  exports: ['Skeleton', 'SkeletonLines'],
  summary: 'Shimmer placeholders for content that is loading. Skeleton is one block you size; SkeletonLines is a ready-made card body.',
  importLine: "import { Skeleton, SkeletonLines } from '@nish/ui';",
  controls: [
    { key: 'kind', label: 'Kind', type: 'select', options: ['lines', 'block', 'list'] },
    { key: 'lines', label: 'Lines', type: 'number', min: 1, max: 8 },
  ],
  initial: { kind: 'lines', lines: 3 },
  render: (a) =>
    a.kind === 'block' ? (
      <Skeleton className="h-32 w-full max-w-md rounded-xl" />
    ) : a.kind === 'list' ? (
      <div className="w-full max-w-md space-y-3">
        {Array.from({ length: Number(a.lines) }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <Card padded={false} className="w-full max-w-md">
        <SkeletonLines lines={Number(a.lines)} />
      </Card>
    ),
  code: (a) =>
    a.kind === 'block'
      ? '<Skeleton className="h-32 w-full rounded-xl" />'
      : a.kind === 'list'
        ? '<div className="flex items-center gap-3">\n  <Skeleton className="size-9 rounded-full" />\n  <Skeleton className="h-3.5 w-2/5" />\n</div>'
        : jsx('SkeletonLines', { lines: a.lines === 3 ? undefined : Number(a.lines) }),
  stories: [
    {
      id: 'lines',
      name: 'SkeletonLines in a card',
      render: () => (
        <Card padded={false} className="w-full">
          <SkeletonLines />
        </Card>
      ),
    },
    {
      id: 'chart',
      name: 'Chart placeholder',
      render: () => (
        <Card className="w-full space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </Card>
      ),
    },
    {
      id: 'rows',
      name: 'Table rows',
      wide: true,
      render: () => (
        <Card padded={false} className="w-full divide-y divide-th-line">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="ml-auto h-3.5 w-16" />
            </div>
          ))}
        </Card>
      ),
    },
  ],
  usage: `import { Card, SkeletonLines } from '@nish/ui';

<Card padded={false}>
  {isLoading ? <SkeletonLines lines={4} /> : <JobList jobs={data} />}
</Card>`,
  guidelines: [
    'Match the shape of what is coming, so the page does not jump when it arrives.',
    'The shimmer stops under prefers-reduced-motion; the blocks stay.',
    'SkeletonLines sets aria-busy and an aria-label of "Loading"; a bare Skeleton is hidden from screen readers.',
  ],
};

// --- EmptyState ---------------------------------------------------------------------

const emptyState: ComponentDoc = {
  id: 'empty-state',
  name: 'EmptyState',
  exports: ['EmptyState'],
  summary: 'What a list, table or widget shows when there is nothing in it yet: a title, one line of why, and usually one action.',
  importLine: "import { EmptyState } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'detail', label: 'Detail', type: 'boolean' },
    { key: 'icon', label: 'Icon', type: 'boolean' },
    { key: 'action', label: 'Action', type: 'boolean' },
    { key: 'compact', label: 'Compact', type: 'boolean' },
  ],
  initial: { title: 'No price drops yet', detail: true, icon: true, action: true, compact: false },
  render: (a) => (
    <div className="w-full max-w-lg">
      <EmptyState
        title={String(a.title)}
        detail={a.detail ? 'Trackers check every hour. Changes show up here.' : undefined}
        icon={a.icon ? <ChartIcon /> : undefined}
        action={a.action ? <Button size="sm">Add a tracker</Button> : undefined}
        compact={!!a.compact}
      />
    </div>
  ),
  code: (a) =>
    jsx('EmptyState', {
      icon: a.icon ? '{<LineChart />}' : undefined,
      title: String(a.title),
      detail: a.detail ? 'Trackers check every hour. Changes show up here.' : undefined,
      action: a.action ? '{<Button size="sm">Add a tracker</Button>}' : undefined,
      compact: a.compact,
    }),
  stories: [
    {
      id: 'page',
      name: 'On a page',
      render: () => (
        <EmptyState
          className="w-full"
          icon={<InboxIcon />}
          title="No applications yet"
          detail="Save a job from any listing and it lands here."
          action={
            <Button size="sm" variant="primary" icon={<PlusIcon size={13} />}>
              Add a job
            </Button>
          }
        />
      ),
    },
    {
      id: 'compact',
      name: 'Compact, in a widget',
      render: () => (
        <Card padded={false} className="h-40 w-full">
          <EmptyState compact icon={<BellIcon />} title="No alerts" detail="You will see price and status alerts here." />
        </Card>
      ),
    },
    {
      id: 'bare',
      name: 'Title only',
      render: () => <EmptyState className="w-full" title="Nothing matches these filters" />,
    },
    {
      id: 'long',
      name: 'Long detail',
      render: () => (
        <EmptyState
          className="w-full"
          icon={<SearchIcon />}
          title="No listings in this area"
          detail="We searched 14 sites for 2-bedroom rentals under $2,400 within 3 miles of downtown Austin. Try widening the radius or raising the budget."
        />
      ),
    },
  ],
  usage: `import { EmptyState, Button } from '@nish/ui';
import { Inbox } from 'lucide-react';

{jobs.length === 0 ? (
  <EmptyState
    icon={<Inbox />}
    title="No applications yet"
    detail="Save a job from any listing and it lands here."
    action={<Button size="sm" onClick={openAdd}>Add a job</Button>}
  />
) : (
  <JobTable jobs={jobs} />
)}`,
  guidelines: [
    'Say what is empty, then why or what fills it. Skip the cheerful filler.',
    'Use compact inside a Card or widget; the default dashed box is for a whole page or section.',
    'For a failed load use ErrorState, not an empty state: they mean different things.',
  ],
};

// --- ErrorState ---------------------------------------------------------------------

const errorState: ComponentDoc = {
  id: 'error-state',
  name: 'ErrorState',
  exports: ['ErrorState'],
  summary: 'A failed load with an optional Retry. It is a live region (role="alert"), so screen readers announce it when it appears.',
  importLine: "import { ErrorState } from '@nish/ui';",
  controls: [
    { key: 'message', label: 'Message', type: 'text' },
    { key: 'retry', label: 'onRetry', type: 'boolean' },
    { key: 'retrying', label: 'Retrying', type: 'boolean' },
    { key: 'compact', label: 'Compact', type: 'boolean' },
  ],
  initial: { message: 'Could not reach the API. Check that the server is running.', retry: true, retrying: false, compact: false },
  render: (a) => (
    <div className="w-full max-w-lg">
      <ErrorState message={String(a.message)} onRetry={a.retry ? () => toast.info('Retrying') : undefined} retrying={!!a.retrying} compact={!!a.compact} />
    </div>
  ),
  code: (a) =>
    jsx('ErrorState', {
      message: String(a.message),
      onRetry: a.retry ? '{refetch}' : undefined,
      retrying: a.retrying ? '{isFetching}' : undefined,
      compact: a.compact,
    }),
  stories: [
    { id: 'default', name: 'Default message', render: () => <ErrorState className="w-full" /> },
    {
      id: 'retry',
      name: 'With Retry',
      render: () => <ErrorState className="w-full" message="Could not load positions. The broker API returned 503." onRetry={() => undefined} />,
    },
    {
      id: 'retrying',
      name: 'Retrying',
      render: () => <ErrorState className="w-full" message="Could not load positions. The broker API returned 503." onRetry={() => undefined} retrying />,
    },
    {
      id: 'compact',
      name: 'Compact, in a widget',
      render: () => (
        <Card padded={false} className="h-40 w-full">
          <ErrorState compact message="Weather is unavailable right now." onRetry={() => undefined} />
        </Card>
      ),
    },
  ],
  usage: `import { ErrorState, SkeletonLines } from '@nish/ui';

if (query.isLoading) return <SkeletonLines />;
if (query.isError)
  return (
    <ErrorState
      message={\`Could not load positions: \${query.error.message}\`}
      onRetry={() => query.refetch()}
      retrying={query.isFetching}
    />
  );`,
  guidelines: [
    'Say what failed and, when you know, what to do. "Failed to load" is the fallback, not the goal.',
    'Pass onRetry whenever trying again can help; pass retrying so the button shows progress.',
  ],
};

// --- Toast (framed) -----------------------------------------------------------------

/** Pushes toasts that stay put, for static previews. toast() schedules its own
 *  dismissal with setTimeout; inside a preview frame that timer is skipped. */
function StaticToasts({ items }: { items: { tone: ToastTone; title: string; body?: string }[] }) {
  const key = JSON.stringify(items);
  useEffect(() => {
    const realTimeout = window.setTimeout;
    window.setTimeout = ((() => 0) as unknown) as typeof window.setTimeout;
    const ids = items.map((t) => toast[t.tone](t.title, t.body));
    window.setTimeout = realTimeout;
    return () => ids.forEach(dismissToast);
  }, [key]);
  return null;
}

const toastDoc: ComponentDoc = {
  id: 'toast',
  name: 'Toast',
  exports: ['Toaster'],
  summary:
    'Short notices about something that just happened. Mount <Toaster /> once; call toast() from anywhere, including outside React. Errors stay until dismissed.',
  importLine: "import { Toaster, toast } from '@nish/ui';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: ['success', 'error', 'warn', 'info'] },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'text' },
  ],
  initial: { tone: 'success', title: 'Saved', body: 'Watchlist updated with 3 symbols.' },
  render: (a) => <StaticToasts items={[{ tone: a.tone as ToastTone, title: String(a.title), body: String(a.body) || undefined }]} />,
  code: (a) => `toast.${a.tone}(${JSON.stringify(String(a.title)).replace(/"/g, "'")}${a.body ? `, ${JSON.stringify(String(a.body)).replace(/"/g, "'")}` : ''});`,
  framed: { height: 220 },
  api: { functions: ['toast', 'dismissToast', 'useToast'], interfaces: ['ToastItem'] },
  stories: [
    { id: 'success', name: 'Success', render: () => <StaticToasts items={[{ tone: 'success', title: 'Saved', body: 'Changes are live.' }]} /> },
    {
      id: 'error',
      name: 'Error',
      note: 'Stays until dismissed.',
      render: () => <StaticToasts items={[{ tone: 'error', title: 'Sync failed', body: 'The store returned 503. It will retry in 5 minutes.' }]} />,
    },
    { id: 'warn', name: 'Warning', render: () => <StaticToasts items={[{ tone: 'warn', title: 'Running low', body: 'Under 20 API calls left today.' }]} /> },
    { id: 'info', name: 'Info, title only', render: () => <StaticToasts items={[{ tone: 'info', title: 'New version deployed' }]} /> },
    {
      id: 'stack',
      name: 'Stack',
      note: 'Newest at the bottom; at most four.',
      render: () => (
        <StaticToasts
          items={[
            { tone: 'info', title: 'Checking 8 sites' },
            { tone: 'success', title: '7 sites are up' },
            { tone: 'error', title: 'trackers.nish.software is down', body: 'No response after 10 seconds.' },
          ]}
        />
      ),
    },
    {
      id: 'long',
      name: 'Long body',
      render: () => (
        <StaticToasts
          items={[
            {
              tone: 'warn',
              title: 'Some listings were skipped',
              body: 'Zillow rate-limited the scraper after 120 requests, so 38 listings in 78704 were not refreshed. They will be retried on the next run at 3:00 pm.',
            },
          ]}
        />
      ),
    },
  ],
  usage: `// once, at the root
import { Toaster } from '@nish/ui';
<Toaster />

// anywhere: handlers, query callbacks, plain modules
import { toast } from '@nish/ui';
toast.success('Saved', 'Watchlist updated with 3 symbols.');
toast.error('Could not save', err.message); // stays until dismissed`,
  guidelines: [
    'Toasts confirm what just happened. Anything people must act on belongs on the page or in a Modal.',
    'Errors stay until dismissed, because a failure you did not see is one you will assume succeeded.',
    'Keep the title to a few words; put detail in the body.',
  ],
};

// --- Modal (framed) -----------------------------------------------------------------

function ModalPreview({ size, footer, long, title, subtitle }: { size: 'md' | 'lg' | 'xl'; footer: boolean; long: boolean; title: string; subtitle?: ReactNode }) {
  return (
    <Modal
      title={title}
      subtitle={subtitle}
      size={size}
      onClose={() => undefined}
      footer={
        footer ? (
          <>
            <Button>Cancel</Button>
            <Button variant="danger">Close position</Button>
          </>
        ) : undefined
      }
    >
      <p>Close 2 contracts of AMD Nov 20 $180 calls at market? This cannot be undone.</p>
      {long ? (
        <div className="mt-4 space-y-3">
          {[
            ['Mark price', '$4.15'],
            ['Cost basis', '$3.20'],
            ['Unrealized gain', '+$190.00'],
            ['Days to expiry', '26'],
            ['Delta', '0.42'],
            ['Implied volatility', '48%'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-th-line pb-2">
              <span className="text-th-hi3">{k}</span>
              <span className="tabular-nums text-th-hi">{v}</span>
            </div>
          ))}
          <p>Market orders fill at the best available price, which can differ from the mark during fast moves.</p>
        </div>
      ) : (
        <label className="mt-4 grid gap-1.5">
          <Label>Note</Label>
          <Input placeholder="Why are you closing?" />
        </label>
      )}
    </Modal>
  );
}

function RealModalButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Open a real one
      </Button>
      {open ? (
        <Modal
          title="Close position"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Close position
              </Button>
            </>
          }
        >
          <p>Close 2 contracts of AMD Nov 20 $180 calls at market? This cannot be undone.</p>
          <p className="mt-3 text-th-hi3">Press Escape, click the backdrop or use a button to close. Tab stays inside the dialog.</p>
        </Modal>
      ) : null}
    </>
  );
}

const modal: ComponentDoc = {
  id: 'modal',
  name: 'Modal',
  exports: ['Modal'],
  summary:
    'A dialog: a centered panel on wide screens and a bottom sheet under 640px. It closes on Escape and backdrop click, traps Tab, returns focus to the opener and locks page scroll.',
  importLine: "import { Modal } from '@nish/ui';",
  controls: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'lg', 'xl'] },
    { key: 'footer', label: 'Footer', type: 'boolean' },
    { key: 'long', label: 'Long body', type: 'boolean' },
  ],
  initial: { title: 'Close position', size: 'md', footer: true, long: false },
  render: (a) => <ModalPreview size={a.size as 'md'} footer={!!a.footer} long={!!a.long} title={String(a.title)} />,
  code: (a) =>
    [
      '{open ? (',
      '  <Modal',
      `    title="${String(a.title)}"`,
      ...(a.size === 'md' ? [] : [`    size="${a.size}"`]),
      '    onClose={() => setOpen(false)}',
      ...(a.footer
        ? [
            '    footer={',
            '      <>',
            '        <Button onClick={() => setOpen(false)}>Cancel</Button>',
            '        <Button variant="danger" onClick={closePosition}>Close position</Button>',
            '      </>',
            '    }',
          ]
        : []),
      '  >',
      '    <p>Close 2 contracts of AMD Nov 20 $180 calls at market?</p>',
      '  </Modal>',
      ') : null}',
    ].join('\n'),
  framed: { height: 460 },
  stories: [
    { id: 'confirm', name: 'Confirm', render: () => <ModalPreview size="md" footer long={false} title="Close position" /> },
    { id: 'details', name: 'Long body, lg', note: 'The body scrolls; the footer stays.', render: () => <ModalPreview size="lg" footer long title="Review the order" /> },
    { id: 'plain', name: 'No footer', render: () => <ModalPreview size="md" footer={false} long={false} title="Add a note" /> },
    {
      id: 'subtitle',
      name: 'Long title, pinned subtitle',
      note: 'Titles wrap to two lines; the subtitle stays put while the body scrolls.',
      render: () => (
        <ModalPreview
          size="lg"
          footer
          long
          title="Nintendo Switch 2 Mario Kart World Bundle, Console with Joy-Con 2 and Charging Grip"
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold tabular-nums text-th-hi">$449.99</span>
              <Badge tone="ok">Lowest in 30 days</Badge>
              <span className="text-th-hi3">Best Buy · checked 12m ago</span>
            </span>
          }
        />
      ),
    },
  ],
  usage: `import { useState } from 'react';
import { Button, Modal } from '@nish/ui';

export function DeleteTracker({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
      {open ? (
        <Modal
          title="Delete this tracker?"
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={onDelete}>Delete</Button>
            </>
          }
        >
          Its price history goes with it.
        </Modal>
      ) : null}
    </>
  );
}`,
  guidelines: [
    'Render the Modal only while it is open; unmounting is what closes it and returns focus.',
    'Put autofocus on the field people should type in first. Otherwise the panel itself takes focus.',
    'Keep it to one decision. Long flows belong on a page.',
  ],
};

// --- Tooltip (framed) ---------------------------------------------------------------

function TooltipPreview({ tip, side, trigger = 'text' }: { tip: string; side: 'top' | 'bottom'; trigger?: 'text' | 'icon' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Hover the trigger so the static preview shows the tip.
    const t = ref.current?.querySelector('[tabindex="0"]');
    const id = window.setTimeout(() => t?.dispatchEvent(new MouseEvent('mouseenter')), 50);
    return () => window.clearTimeout(id);
  }, [tip, side]);
  return (
    <div ref={ref} className="flex w-full justify-center">
      <Tooltip tip={tip} side={side}>
        {trigger === 'icon' ? (
          <span className="inline-flex size-9 items-center justify-center rounded-lg text-th-hi3">
            <BellIcon size={16} />
          </span>
        ) : (
          <span className="cursor-help text-sm text-th-hi2 underline decoration-th-ghost decoration-dotted underline-offset-4">IV rank</span>
        )}
      </Tooltip>
    </div>
  );
}

const tooltip: ComponentDoc = {
  id: 'tooltip',
  name: 'Tooltip',
  exports: ['Tooltip'],
  summary:
    'A hover and focus hint, rendered through a portal so overflow:hidden parents never clip it, flipped and clamped to stay on screen.',
  importLine: "import { Tooltip } from '@nish/ui';",
  controls: [
    { key: 'tip', label: 'Tip', type: 'text' },
    { key: 'side', label: 'Side', type: 'select', options: ['top', 'bottom'] },
  ],
  initial: { tip: 'Where implied volatility sits in its 52-week range.', side: 'top' },
  render: (a) => <TooltipPreview tip={String(a.tip)} side={a.side as 'top'} />,
  code: (a) => jsx('Tooltip', { tip: String(a.tip), side: a.side === 'top' ? undefined : a.side }, '<span>IV rank</span>'),
  framed: { height: 170 },
  stories: [
    { id: 'short', name: 'Short tip', render: () => <TooltipPreview tip="Implied volatility rank" side="top" /> },
    {
      id: 'long',
      name: 'Long tip',
      note: 'Wraps at 320px.',
      render: () => (
        <TooltipPreview
          tip="Where today's implied volatility sits in its 52-week range: 0 is the lowest it has been this year, 100 the highest."
          side="top"
        />
      ),
    },
    { id: 'bottom', name: 'Below', render: () => <TooltipPreview tip="Alerts for price drops and outages" side="bottom" trigger="icon" /> },
  ],
  usage: `import { Tooltip } from '@nish/ui';

<Tooltip tip="Where implied volatility sits in its 52-week range.">
  <span className="underline decoration-dotted">IV rank</span>
</Tooltip>

// inside a table, make the row the trigger
<Tooltip as="tr" tip={row.note}>
  <td>{row.symbol}</td>
</Tooltip>`,
  guidelines: [
    'Tooltips explain; they never hold the only copy of something people need. Touch screens cannot hover.',
    'The trigger becomes focusable, so keyboard users get the tip on focus.',
    'For icon-only buttons, IconButton already sets a title and aria-label.',
  ],
};

// --- Textarea ------------------------------------------------------------------------

const textarea: ComponentDoc = {
  id: 'textarea',
  name: 'Textarea',
  exports: ['Textarea'],
  summary: 'Multi-line text with the shared field look: 16px text on phones so iOS does not zoom, vertical resize, and an invalid state.',
  importLine: "import { Textarea } from '@nish/ui';",
  controls: [
    { key: 'rows', label: 'Rows', type: 'select', options: ['3', '4', '6'] },
    { key: 'invalid', label: 'Invalid', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { rows: '4', invalid: false, disabled: false },
  render: (a) => (
    <div className="w-full max-w-sm">
      <Field label="Notes" error={a.invalid ? 'Keep it under 500 characters.' : undefined} id="canvas-textarea-msg">
        <Textarea
          rows={Number(a.rows)}
          invalid={!!a.invalid}
          disabled={!!a.disabled}
          placeholder="Why this trade, what would make you close it"
          aria-describedby={a.invalid ? 'canvas-textarea-msg' : undefined}
        />
      </Field>
    </div>
  ),
  code: (a) => jsx('Textarea', { rows: a.rows === '4' ? undefined : Number(a.rows), invalid: a.invalid, disabled: a.disabled }),
  stories: [
    { id: 'label', name: 'With a label', render: () => <div className="w-full max-w-sm"><Field label="Paste a resume"><Textarea rows={3} defaultValue="Senior engineer, 8 years of TypeScript and React." /></Field></div> },
    { id: 'invalid', name: 'Invalid', render: () => <div className="w-full max-w-sm"><Field label="Notes" error="Keep it under 500 characters." id="story-textarea-err"><Textarea invalid aria-describedby="story-textarea-err" defaultValue="Too long" /></Field></div> },
    { id: 'disabled', name: 'Disabled', render: () => <div className="w-full max-w-sm"><Textarea disabled defaultValue="Read only while the import runs." /></div> },
  ],
  usage: `import { Label, Textarea } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Notes</Label>
  <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
</label>`,
  guidelines: [
    'Pair it with a Label; a placeholder is not a label.',
    'For errors, set invalid and point aria-describedby at the message.',
  ],
};

// --- Checkbox ------------------------------------------------------------------------

const checkbox: ComponentDoc = {
  id: 'checkbox',
  name: 'Checkbox',
  exports: ['Checkbox'],
  summary: 'A checkbox with its label and an optional hint. The whole row toggles it, and it is a 44px tap target on touch screens.',
  importLine: "import { Checkbox } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'hint', label: 'Hint', type: 'boolean' },
    { key: 'disabled', label: 'Disabled', type: 'boolean' },
  ],
  initial: { label: 'Email me when the price drops', hint: true, disabled: false },
  render: (a) => (
    <Checkbox
      label={String(a.label)}
      hint={a.hint ? 'At most one email a day per item.' : undefined}
      disabled={!!a.disabled}
      defaultChecked
    />
  ),
  code: (a) => jsx('Checkbox', { label: a.label, hint: a.hint ? 'At most one email a day per item.' : undefined, disabled: a.disabled, defaultChecked: true }),
  stories: [
    { id: 'plain', name: 'Plain', render: () => <Checkbox label="Hide YouTube Shorts" /> },
    { id: 'checked', name: 'Checked, with a hint', render: () => <Checkbox label="Only stores with a problem" hint="Hides the 14 stores that read fine." defaultChecked /> },
    {
      id: 'group',
      name: 'A group',
      render: () => (
        <fieldset className="grid gap-1">
          <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-th-hi3">Stores</legend>
          <Checkbox label="Best Buy" defaultChecked />
          <Checkbox label="Amazon" defaultChecked />
          <Checkbox label="Target" />
          <Checkbox label="Walmart" disabled hint="Blocks automated checks." />
        </fieldset>
      ),
    },
  ],
  usage: `import { Checkbox } from '@nish/ui';

<Checkbox
  label="Email me when the price drops"
  hint="At most one email a day per item."
  checked={notify}
  onChange={(e) => setNotify(e.target.checked)}
/>`,
  guidelines: [
    'Use it for independent on/off choices. For one choice among several, use Segmented or Select.',
    'Group related boxes in a fieldset with a legend.',
  ],
};

// --- Segmented ----------------------------------------------------------------------

function RangeDemo({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');
  return (
    <Segmented
      label="Chart range"
      size={size}
      value={range}
      onChange={setRange}
      options={[
        { value: '24h', label: '24h' },
        { value: '7d', label: '7d' },
        { value: '30d', label: '30d' },
      ]}
    />
  );
}

const segmented: ComponentDoc = {
  id: 'segmented',
  name: 'Segmented',
  exports: ['Segmented'],
  summary:
    'Two to five mutually exclusive choices side by side, such as a chart range. The selected option takes the accent tint and ring, so it reads at a glance in every theme. Arrow keys move the choice.',
  importLine: "import { Segmented } from '@nish/ui';",
  controls: [{ key: 'size', label: 'Size', type: 'select', options: ['sm', 'md'] }],
  initial: { size: 'sm' },
  render: (a) => <RangeDemo size={a.size === 'md' ? 'md' : 'sm'} />,
  code: (a) =>
    `<Segmented\n  label="Chart range"${a.size === 'md' ? "\n  size=\"md\"" : ''}\n  value={range}\n  onChange={setRange}\n  options={[{ value: '24h', label: '24h' }, { value: '7d', label: '7d' }, { value: '30d', label: '30d' }]}\n/>`,
  api: { functions: [], interfaces: ['SegmentedProps', 'SegmentedOption'] },
  stories: [
    { id: 'range', name: 'Chart range', render: () => <RangeDemo /> },
    { id: 'md', name: 'Medium', render: () => <RangeDemo size="md" /> },
    {
      id: 'card-header',
      name: 'In a card header',
      wide: true,
      render: () => (
        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-th-line bg-th-surface px-4 py-2.5">
          <p className="font-semibold text-th-hi">Response time</p>
          <RangeDemo />
        </div>
      ),
    },
  ],
  usage: `import { useState } from 'react';
import { Segmented } from '@nish/ui';

const [range, setRange] = useState<'24h' | '7d' | '30d'>('7d');

<Segmented
  label="Chart range"
  value={range}
  onChange={setRange}
  options={[
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
  ]}
/>`,
  guidelines: [
    'Use it for 2 to 5 short, mutually exclusive options that change a view. For more, or for long labels, use Select.',
    'Always pass label: it names the group for screen readers.',
    'Icon-only options need ariaLabel.',
  ],
};

// --- ThemeToggle --------------------------------------------------------------------

const themeToggle: ComponentDoc = {
  id: 'theme-toggle',
  name: 'ThemeToggle',
  exports: ['ThemeToggle'],
  summary:
    'System, Light and Dark as a segmented control, with an optional preset picker. The choice is saved to the shared cookie, so it follows people across every nish.software subdomain.',
  importLine: "import { ThemeToggle } from '@nish/ui';",
  controls: [{ key: 'presets', label: 'Presets', type: 'boolean' }],
  initial: { presets: true },
  render: (a) => <ThemeToggle presets={!!a.presets} />,
  code: (a) => jsx('ThemeToggle', { presets: a.presets }),
  api: { functions: ['useTheme'], interfaces: ['ThemeState'] },
  stories: [
    { id: 'modes', name: 'System, light, dark', note: 'Clicking changes this whole site.', render: () => <ThemeToggle /> },
    { id: 'presets', name: 'With presets', render: () => <ThemeToggle presets /> },
    {
      id: 'header',
      name: 'In an app header',
      wide: true,
      render: () => (
        <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-th-line bg-th-surface px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate font-semibold text-th-hi">trading</p>
            <p className="text-xs text-th-hi3">Options ideas</p>
          </div>
          <ThemeToggle />
        </div>
      ),
    },
  ],
  usage: `import { ThemeToggle, useTheme, initTheme } from '@nish/ui';

initTheme(); // once, before render

function Header() {
  const { theme } = useTheme(); // re-renders when the theme changes
  return (
    <header className="flex items-center justify-between">
      <Logo dark={theme !== 'light'} />
      <ThemeToggle presets />
    </header>
  );
}`,
  guidelines: [
    'Call initTheme() once at startup; ThemeToggle and useTheme only read and change the choice.',
    'Apps that only support light and dark set <html data-nish-themes="dark light">; presets then render as their base theme.',
  ],
};

export const COMPONENT_DOCS: ComponentDoc[] = [
  button,
  iconButton,
  card,
  badge,
  input,
  textarea,
  checkbox,
  select,
  label,
  skeleton,
  emptyState,
  errorState,
  toastDoc,
  modal,
  tooltip,
  segmented,
  themeToggle,
];

export { RealModalButton };
