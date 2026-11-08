import type { CSSProperties, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  AppHeader,
  BarChart,
  BottomNav,
  Button,
  Callout,
  ChartLegend,
  Checkbox,
  Chip,
  ChipGroup,
  Combobox,
  CommandPalette,
  ConfirmDialog,
  CopyButton,
  Disclosure,
  EmptyState,
  ErrorState,
  Field,
  FieldGroup,
  FilterBar,
  IconButton,
  Input,
  Kbd,
  KeyValueList,
  Label,
  LineChart,
  ListRow,
  MediaChip,
  MediaRow,
  MediaThumb,
  Meter,
  Modal,
  MoreSheet,
  NavRail,
  PageHeader,
  RangeBar,
  ScrollRow,
  SearchInput,
  Segmented,
  Select,
  SectionHeader,
  SectionNav,
  SettingRow,
  SettingsSection,
  Skeleton,
  Sparkline,
  Spinner,
  SplitStage,
  Stat,
  StatusDot,
  Switch,
  Table,
  TableWrap,
  Tabs,
  Td,
  Textarea,
  Th,
  ThemeToggle,
  Toaster,
  Tr,
  tabClass,
  toast,
} from '../../src';

// The React side of the parity test. ?c=<component>&... picks what to render, with the same
// names as elements.ts. Wave 1: toggle, sheet, dialog, toast&tone=ok|warn|loss|info|neutral, nav.
// The React twins: ThemeToggle variant="pill", Modal (a bottom sheet under 640px, a centered
// panel from 640px, like .nish-sheet), ConfirmDialog (like .nish-dialog), toast and BottomNav.
// Wave 2 (WAVE2 below): one case per nish-* class and element of Stage D, in a 28rem stage. Most
// render the React component with className="case", which parity.spec.ts uses as the box. A few
// cases click first, the same way on both sides: ?open=1 opens the combobox, ?copied=1 copies.
// Wave 3 (WAVE3 below): the same for the Stage E classes and elements (tables, filter bar, media rows, settings,
// nav rail, scroll row, section nav, split, command palette, charts, range bar).
// The page sets <html data-ready> when the component is on screen and settled.

const q = new URLSearchParams(location.search);
const c = q.get('c') ?? 'toggle';
const noop = () => undefined;

const svg = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
    <path d={d} />
  </svg>
);
const HOME = svg('M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z');
const LIST = svg('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01');
const GEAR = svg('M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3');

// React tones -> the static tone names.
const TONES = { neutral: 'info', ok: 'success', warn: 'warn', loss: 'error', info: 'info' } as const;

// --- Wave 2 ---------------------------------------------------------------------------

const ico = (d: string, size = 20) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width={size} height={size}>
    <path d={d} />
  </svg>
);
const FOLDER = ico('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z');
const CITIES = [
  { value: 'a', label: 'Austin', hint: 'TX' },
  { value: 'b', label: 'Boston', hint: 'MA' },
  { value: 'c', label: 'Chicago', hint: 'IL' },
];
const TAB_ITEMS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'settings', label: 'Settings' },
];
const RANGE = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
];
const WRAP_URL = 'https://minecraft.nish.software/world/overworld/regions/r.0.0.mca';
const kv = (wrap?: true) => [
  { key: 'host', label: 'Host', value: 'mc.nish.software' },
  { key: 'path', label: 'Path', value: WRAP_URL, wrap },
];
const tabs = (props: { variant?: 'pill'; size?: 'sm' | 'xs'; block?: boolean }) => (
  <Tabs label="Sections" value="overview" onChange={noop} items={TAB_ITEMS} {...props} />
);
const seg = (props: { size?: 'xs' | 'md'; block?: boolean }) => <Segmented label="Range" options={RANGE} value="7d" onChange={noop} {...props} />;
const callout = (tone: 'ok' | 'warn' | 'loss' | 'info' | 'accent') => (
  <Callout className="case" tone={tone} title="Heads up">
    Body text for the notice.
  </Callout>
);
const stat = (props: Partial<Parameters<typeof Stat>[0]>) => <Stat className="case" label="Blocks mined" value="1,284" {...props} />;
const listRow = (props: Partial<Parameters<typeof ListRow>[0]>) => (
  <ListRow as="div" className="case" icon={FOLDER} title="Backups" subtitle="Last run 2h ago" meta="12 GB" href="/jobs" {...props} />
);
const SPARK = [3, 5, 4, 8, 6, 9, 7];
const legendItems = [
  { label: 'CPU', tone: 'chart-1' as const },
  { label: 'Memory', tone: 'chart-2' as const },
];

const WAVE2: Record<string, () => ReactNode> = {
  input: () => <Input aria-label="Name" placeholder="Name" />,
  select: () => (
    <Select aria-label="Sort" defaultValue="b">
      <option value="a">Newest</option>
      <option value="b">Oldest</option>
    </Select>
  ),
  textarea: () => <Textarea aria-label="Notes" rows={3} placeholder="Notes" />,
  'textarea-grow': () => <Textarea aria-label="Notes" rows={3} autoGrow placeholder="Notes" />,
  label: () => <Label className="case">Section</Label>,
  field: () => (
    <Field className="case" label="Email" hint="We never share it">
      <Input type="email" />
    </Field>
  ),
  'field-error': () => (
    <Field className="case" label="Email" error="Enter a valid address">
      <Input type="email" />
    </Field>
  ),
  'field-inline': () => (
    <Field className="case" label="Nickname" optional layout="inline" hint="Shown on your profile">
      <Input type="text" />
    </Field>
  ),
  'field-group': () => (
    <FieldGroup className="case" label="Work mode" hint="Pick one">
      <ChipGroup label="Work mode">
        <Chip>Remote</Chip>
        <Chip>Hybrid</Chip>
      </ChipGroup>
    </FieldGroup>
  ),
  checkbox: () => <Checkbox label="Email me" />,
  'checkbox-checked': () => <Checkbox label="Email me" defaultChecked />,
  switch: () => <Switch checked={false} onCheckedChange={noop} label="Alerts" labelSide="end" />,
  'switch-on': () => <Switch checked onCheckedChange={noop} label="Alerts" description="Email me when it changes" labelSide="end" />,
  'switch-sm-on': () => <Switch checked onCheckedChange={noop} label="Alerts" size="sm" labelSide="end" />,
  'switch-start': () => <Switch checked onCheckedChange={noop} label="Alerts" description="Email me when it changes" />,
  search: () => <SearchInput value="bike" onChange={noop} aria-label="Search jobs" />,
  'search-sm': () => <SearchInput value="bike" onChange={noop} aria-label="Search jobs" size="sm" />,
  'search-xs': () => <SearchInput value="bike" onChange={noop} aria-label="Search jobs" size="xs" />,
  'search-empty': () => <SearchInput value="" onChange={noop} aria-label="Search jobs" />,
  'search-bare': () => <SearchInput value="bike" onChange={noop} aria-label="Search jobs" variant="bare" />,
  'chip-off': () => (
    <ChipGroup label="Status">
      <Chip>Open</Chip>
    </ChipGroup>
  ),
  'chip-on': () => (
    <ChipGroup label="Status">
      <Chip pressed>Open</Chip>
    </ChipGroup>
  ),
  'chip-sm': () => (
    <ChipGroup label="Status">
      <Chip pressed size="sm">
        Open
      </Chip>
    </ChipGroup>
  ),
  'chip-suggestion': () => (
    <ChipGroup label="Suggestions">
      <Chip variant="suggestion">Add tag</Chip>
    </ChipGroup>
  ),
  'chip-tag': () => (
    <ChipGroup label="Selected">
      <Chip variant="tag" onRemove={noop}>
        Draft
      </Chip>
    </ChipGroup>
  ),
  seg: () => seg({}),
  'seg-xs': () => seg({ size: 'xs' }),
  'seg-md': () => seg({ size: 'md' }),
  'seg-block': () => seg({ block: true }),
  'skeleton-text': () => <Skeleton className="case h-4 w-2/5" />,
  'skeleton-circle': () => <Skeleton className="case size-10 rounded-full" />,
  spinner: () => (
    <span className="case" style={{ display: 'inline-flex' }}>
      <Spinner />
    </span>
  ),
  'spinner-sm': () => (
    <span className="case" style={{ display: 'inline-flex' }}>
      <Spinner size="sm" />
    </span>
  ),
  'spinner-lg': () => (
    <span className="case" style={{ display: 'inline-flex' }}>
      <Spinner size="lg" />
    </span>
  ),
  empty: () => <EmptyState className="case" title="No trips yet" detail="Plan one with /trip-plan." />,
  'error-state': () => <ErrorState className="case" message="Failed to load" onRetry={noop} />,
  'callout-info': () => callout('info'),
  'callout-accent': () => callout('accent'),
  'callout-ok': () => callout('ok'),
  'callout-warn': () => callout('warn'),
  'callout-loss': () => callout('loss'),
  'dot-neutral': () => <StatusDot className="case" tone="neutral" />,
  'dot-accent': () => <StatusDot className="case" tone="accent" />,
  'dot-ok': () => <StatusDot className="case" tone="ok" />,
  'dot-warn': () => <StatusDot className="case" tone="warn" />,
  'dot-loss': () => <StatusDot className="case" tone="loss" />,
  'dot-info': () => <StatusDot className="case" tone="info" />,
  'dot-xs': () => <StatusDot className="case" tone="ok" size="xs" />,
  'dot-md': () => <StatusDot className="case" tone="ok" size="md" />,
  'dot-lg-halo': () => <StatusDot className="case" tone="ok" size="lg" halo />,
  stat: () => stat({}),
  'stat-ok': () => stat({ tone: 'ok', sub: '+12 today' }),
  'stat-inset': () => stat({ variant: 'inset' }),
  'stat-sm': () => stat({ size: 'sm' }),
  meter: () => <Meter className="case" label="Durability" value={64} tone="ok" />,
  'meter-xs': () => <Meter className="case" label="Durability" value={64} tone="ok" size="xs" />,
  'meter-sm': () => <Meter className="case" label="Durability" value={64} tone="ok" size="sm" />,
  'meter-md': () => <Meter className="case" label="Durability" value={64} tone="ok" size="md" />,
  disclosure: () => (
    <Disclosure className="case" summary="Sources">
      Three pages and a log.
    </Disclosure>
  ),
  'disclosure-open': () => (
    <Disclosure className="case" summary="Sources" defaultOpen>
      Three pages and a log.
    </Disclosure>
  ),
  'disclosure-card-open': () => (
    <Disclosure className="case" summary="Sources" variant="card" defaultOpen>
      Three pages and a log.
    </Disclosure>
  ),
  tabs: () => tabs({}),
  'tabs-sm': () => tabs({ size: 'sm' }),
  'tabs-xs': () => tabs({ size: 'xs' }),
  'tabs-block': () => tabs({ block: true }),
  'tabs-pill': () => tabs({ variant: 'pill' }),
  'tabs-pill-sm': () => tabs({ variant: 'pill', size: 'sm' }),
  'tabs-pill-xs': () => tabs({ variant: 'pill', size: 'xs' }),
  'tabs-pill-block': () => tabs({ variant: 'pill', block: true }),
  combobox: () => <Combobox options={CITIES} value="b" onChange={noop} aria-label="City" placeholder="City" />,
  'combobox-sm': () => <Combobox options={CITIES} value="b" onChange={noop} aria-label="City" placeholder="City" size="sm" />,
  'combobox-open': () => <Combobox options={CITIES} value="b" onChange={noop} aria-label="City" placeholder="City" />,
  'combobox-loading': () => <Combobox options={CITIES} value={null} onChange={noop} aria-label="City" placeholder="City" loading />,
  'combobox-empty': () => <Combobox options={[]} value={null} onChange={noop} aria-label="City" placeholder="City" />,
  'list-row': () => listRow({}),
  'list-row-active': () => listRow({ active: true }),
  'list-row-danger': () => listRow({ tone: 'danger' }),
  'list-row-dense': () => listRow({ dense: true, subtitle: undefined }),
  'list-row-compact': () => listRow({ compact: true }),
  'list-row-title2': () => listRow({ titleLines: 2, title: 'A backup job with a rather long name that runs to a second line on a phone' }),
  'list-row-plain': () => listRow({ href: undefined, icon: undefined, meta: undefined }),
  kbd: () => <Kbd className="case">Ctrl K</Kbd>,
  'page-header': () => <PageHeader className="case" title="Backups" description="Nightly copies of every site." actions={<Button>Run now</Button>} />,
  'section-header': () => <SectionHeader className="case" title="Services" meta="3 of 12" action={<Button size="sm">Add</Button>} />,
  kv: () => <KeyValueList className="case" as="dl" items={kv()} />,
  'kv-dense': () => <KeyValueList className="case" as="dl" dense items={kv()} />,
  'kv-wrap': () => <KeyValueList className="case" as="dl" items={kv(true)} />,
  'kv-words': () => (
    <KeyValueList
      className="case"
      as="dl"
      items={[
        { key: 'host', label: 'Host', value: 'mc.nish.software' },
        { key: 'status', label: 'Earnings Calendar', value: 'Last sync failed, retrying in a few minutes', wrap: 'words' },
      ]}
    />
  ),
  legend: () => <ChartLegend className="case" items={legendItems} />,
  'legend-dot': () => <ChartLegend className="case" marker="dot" items={legendItems} />,
  sparkline: () => <Sparkline className="case" values={SPARK} label="Response time" />,
  'sparkline-ok': () => <Sparkline className="case" values={SPARK} label="Response time" tone="ok" />,
  'sparkline-empty': () => <Sparkline className="case" values={[null, null]} label="Response time" />,
  'app-header': () => (
    <AppHeader
      className="case"
      name="Trackers"
      icon={ico('M3 3v18h18M7 15l4-4 3 3 5-6', 20)}
      homeHref="/"
      hub={{ href: 'https://nish.software', label: 'nish.software' }}
      sticky={false}
      themeToggle={false}
      actions={<IconButton label="Add">{ico('M5 12h14M12 5v14', 18)}</IconButton>}
    />
  ),
  'app-header-nav': () => (
    <AppHeader
      className="case"
      name="Trackers"
      sticky={false}
      themeToggle={false}
      navLabel="Trackers"
      nav={
        <>
          <a href="/" aria-current="page" className={tabClass({ active: true })}>
            Overview
          </a>
          <a href="/jobs" className={tabClass({ active: false })}>
            Jobs
          </a>
        </>
      }
    />
  ),
  copy: () => <CopyButton text="npm i nish-ui" />,
  'copy-icon': () => <CopyButton text="npm i nish-ui" iconOnly />,
  'copy-copied': () => <CopyButton text="npm i nish-ui" />,
};

// --- Wave 3 ---------------------------------------------------------------------------

const ROWS = [
  ['Cherry', '10'],
  ['Apple', '2'],
  ['Banana', '1,500'],
];
const table = (props: { dense?: boolean; zebra?: boolean } = {}, rowProps: Partial<Parameters<typeof Tr>[0]> = {}, wrap: Partial<Parameters<typeof TableWrap>[0]> = {}) => (
  <TableWrap className="case" fade={false} {...wrap}>
    <Table {...props}>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th numeric>Qty</Th>
          <Th sort="asc" onSort={noop}>
            Sorted
          </Th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map(([name, qty], i) => (
          <Tr key={name} {...(i === 0 ? rowProps : {})}>
            <Td>{name}</Td>
            <Td numeric>{qty}</Td>
            <Td>x</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  </TableWrap>
);
const filterBar = () => (
  <FilterBar
    className="case"
    search={{ value: '', onChange: noop, placeholder: 'Search jobs', label: 'Search jobs' }}
    activeCount={2}
    onClear={noop}
    trailing={
      <Select aria-label="View" defaultValue="list">
        <option value="list">List</option>
        <option value="grid">Grid</option>
      </Select>
    }
    summary="42 jobs"
  >
    <ChipGroup label="Status">
      <Chip pressed>Open</Chip>
      <Chip>Closed</Chip>
    </ChipGroup>
    <Select aria-label="Sort" defaultValue="new">
      <option value="new">Newest</option>
      <option value="old">Oldest</option>
    </Select>
  </FilterBar>
);
const mediaRow = (props: Partial<Parameters<typeof MediaRow>[0]> = {}) => (
  <MediaRow
    as="div"
    className="case"
    fallback={FOLDER}
    title="A long title that wraps to two lines on a phone because it keeps going"
    meta="Channel name"
    detail="12K views"
    href="/v/1"
    {...props}
  />
);
const RAIL_ITEMS = [
  { key: 'home', label: 'Home', icon: ico('M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z', 22), href: '/home', active: true },
  { key: 'trips', label: 'Trips', icon: ico('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01', 22), href: '/trips' },
];
const HALVES_COL = { type: 'split', dir: 'col', sizes: [0.5, 0.5], children: [{ type: 'leaf', slot: 0 }, { type: 'leaf', slot: 1 }] } as const;
// A NavRail item's classes, for the tools slot (React takes any node there, the element version a .nish-nav-rail-item).
const RAIL_TOOL_LINK =
  'group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-2xs leading-tight font-normal text-th-hi3 hover:text-th-hi';
const TOPICS = ['All', 'Guides', 'Builds', 'Redstone', 'Farms', 'Mods', 'Seeds', 'Servers'];
const HALVES = { type: 'split', dir: 'row', sizes: [0.5, 0.5], children: [{ type: 'leaf', slot: 0 }, { type: 'leaf', slot: 1 }] } as const;
const LINE_DATA = [
  { x: 1, y: 3 },
  { x: 2, y: 5 },
  { x: 3, y: 4 },
  { x: 4, y: 8 },
  { x: 5, y: 6 },
];
const BAR_DATA = [
  { label: 'Mon', value: 3 },
  { label: 'Tue', value: 9 },
  { label: 'Wed', value: 5 },
  { label: 'Thu', value: 7 },
];
const settings = (compact: boolean, row: Partial<Parameters<typeof SettingRow>[0]> = {}) => (
  <SettingsSection className="case" title="Notifications" description="Where alerts go." compact={compact} actions={<Button size="sm">Reset</Button>}>
    <SettingRow label="Channel" description="Pick one." htmlFor="ch" {...row}>
      <Select id="ch" defaultValue="a">
        <option value="a">Email</option>
        <option value="b">Push</option>
      </Select>
    </SettingRow>
    <SettingRow label="Digest" description="Once a day." htmlFor="dg">
      <Select id="dg" defaultValue="a">
        <option value="a">On</option>
      </Select>
    </SettingRow>
  </SettingsSection>
);
const PALETTE_ITEMS = [
  { id: 'jobs', label: 'Jobs', group: 'Pages', hint: '/jobs', href: '/jobs' },
  { id: 'trips', label: 'Trips', group: 'Pages', hint: '/trips', href: '/trips' },
  { id: 'theme', label: 'Toggle theme', group: 'Actions' },
];

const WAVE3: Record<string, () => ReactNode> = {
  table: () => table(),
  'table-dense': () => table({ dense: true }),
  'table-zebra': () => table({ zebra: true }),
  'table-tr-muted': () => table({}, { muted: true }),
  'table-tr-interactive': () => table({}, { interactive: true }),
  'table-tr-ok': () => table({}, { tone: 'ok' }),
  'table-tr-warn': () => table({}, { tone: 'warn' }),
  'table-tr-loss': () => table({}, { tone: 'loss' }),
  'table-wrap-sticky-first': () => table({}, {}, { stickyFirstColumn: true, minWidth: 480 }),
  'table-wrap-sticky-header': () => table({}, {}, { stickyHeader: true, maxHeight: 120 }),
  'filter-bar': filterBar,
  'media-thumb': () => <MediaThumb className="case" fallback={FOLDER} />,
  'media-thumb-sm': () => <MediaThumb className="case" size="sm" fallback={FOLDER} />,
  'media-thumb-round': () => <MediaThumb className="case" shape="round" fallback={FOLDER} />,
  'media-thumb-round-sm': () => <MediaThumb className="case" shape="round" size="sm" fallback={FOLDER} />,
  'media-thumb-square': () => <MediaThumb className="case" shape="square" fallback={FOLDER} />,
  'media-row': () => mediaRow(),
  'media-row-live': () => mediaRow({ live: true }),
  'media-row-offline': () => mediaRow({ live: false }),
  'media-row-dense': () => mediaRow({ dense: true, title: 'Short title' }),
  'media-row-compact': () => mediaRow({ compact: true, title: 'Short title' }),
  'media-row-round': () => mediaRow({ thumbShape: 'round', title: 'Channel name', meta: '1.2M subscribers', detail: undefined }),
  'media-chip': () => <MediaChip className="case" label="Backups" action="Bring back" onClick={noop} />,
  'media-chip-plain': () => <MediaChip className="case" label="A rather long recent item title that truncates" onClick={noop} />,
  'split-row': () => (
    <div className="case" style={{ height: 240, position: 'relative', display: 'flex' }}>
      <SplitStage
        className="flex-1"
        layout={HALVES}
        items={['a', 'b']}
        slots={['a', 'b']}
        resizable
        animate={false}
        renderPane={(id) => <div className="pane" style={{ height: '100%', background: id === 'a' ? 'var(--nish-surface)' : 'var(--nish-elevated)' }} />}
      />
    </div>
  ),
  'split-column': () => (
    <div className="case" style={{ height: 240, position: 'relative', display: 'flex' }}>
      <SplitStage
        className="flex-1"
        layout={HALVES_COL}
        items={['a', 'b']}
        slots={['a', 'b']}
        resizable
        animate={false}
        renderPane={(id) => <div className="pane" style={{ height: '100%', background: id === 'a' ? 'var(--nish-surface)' : 'var(--nish-elevated)' }} />}
      />
    </div>
  ),
  'nav-rail-tools': () => (
    <NavRail
      className="case"
      items={RAIL_ITEMS}
      showFrom="sm"
      hideFrom={false}
      tools={
        <a className={RAIL_TOOL_LINK} href="/search">
          <span className="relative inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors group-hover:bg-th-elevated">
            {ico('M21 21l-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 22)}
          </span>
          <span className="max-w-full truncate px-1">Search</span>
        </a>
      }
      footer={<ThemeToggle variant="pill" />}
    />
  ),
  'nav-rail': () => <NavRail className="case" items={RAIL_ITEMS} showFrom="sm" hideFrom={false} />,
  'nav-rail-default': () => <NavRail className="case" items={RAIL_ITEMS} />,
  'scroll-row': () => (
    <ScrollRow label="Topics" className="case">
      {TOPICS.map((t, i) => (
        <Chip key={t} pressed={i === 0} className="shrink-0">
          {t}
        </Chip>
      ))}
    </ScrollRow>
  ),
  'scroll-row-bleed': () => (
    <div style={{ '--nish-page-gutter': window.innerWidth >= 640 ? '1.5rem' : '1rem' } as CSSProperties}>
      <ScrollRow label="Topics" bleed className="case">
        {TOPICS.map((t, i) => (
          <Chip key={t} pressed={i === 0} className="shrink-0">
            {t}
          </Chip>
        ))}
      </ScrollRow>
    </div>
  ),
  // The page gutter comes from base.css in an app (this page loads only the Tailwind layer).
  'section-nav': () => (
    <div style={{ '--nish-page-gutter': window.innerWidth >= 640 ? '1.5rem' : '1rem' } as CSSProperties}>
      <SectionNav
        className="case"
        sticky={false}
        updateHash={false}
        items={[
          { id: 'sa', label: 'Overview' },
          { id: 'sb', label: 'Details' },
          { id: 'sc', label: 'History' },
        ]}
      />
    </div>
  ),
  'more-sheet': () => (
    <MoreSheet
      open
      onClose={noop}
      items={[
        { key: 's', label: 'Settings', icon: ico('M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 24), href: '/settings', hint: 'Theme and account' },
        { key: 'h', label: 'Help', icon: ico('M12 16v-4M12 8h.01', 24), href: '/help', hint: 'Guides and contact', active: true },
      ]}
    />
  ),
  'settings-section': () => settings(false),
  'settings-section-compact': () => settings(true),
  'setting-row-stacked': () => settings(false, { stacked: true }),
  'setting-row-inline': () => settings(false, { inline: true }),
  'setting-row-status': () => settings(false, { status: 'Saved', statusTone: 'ok' }),
  'setting-row-error': () => settings(false, { status: 'Failed', statusTone: 'error' }),
  command: () => <CommandPalette open onOpenChange={noop} hotkey={false} items={PALETTE_ITEMS} placeholder="Jump to…" emptyText="Nothing found" />,
  'line-chart': () => <LineChart className="case" label="Latency" height={160} data={LINE_DATA} />,
  'line-chart-area': () => <LineChart className="case" label="Latency" height={160} data={LINE_DATA} area />,
  'line-chart-multi': () => (
    <LineChart
      className="case"
      label="CPU and memory"
      height={160}
      series={[
        { label: 'CPU', points: LINE_DATA },
        { label: 'Memory', points: LINE_DATA.map((p) => ({ x: p.x, y: (p.y ?? 0) * 2 })) },
      ]}
    />
  ),
  'bar-chart': () => <BarChart className="case" label="Visits" height={140} data={BAR_DATA} />,
  'bar-chart-values': () => <BarChart className="case" label="Visits" height={140} data={BAR_DATA} showValues />,
  'range-bar': () => <RangeBar className="case" min={4} max={22} low={12} high={18} current={15} />,
};

function App() {
  switch (c) {
    case 'toggle':
      return (
        <div style={{ padding: 24 }}>
          <ThemeToggle variant="pill" />
        </div>
      );
    case 'sheet':
      return (
        <Modal
          title="Filters"
          onClose={noop}
          closeOnBack={false}
          footer={<Button variant="primary">Apply</Button>}
        >
          <p>Pick what to show in the list.</p>
        </Modal>
      );
    case 'dialog':
      return (
        <ConfirmDialog
          title="Discard changes?"
          body="Your edits are lost."
          confirmLabel="Discard"
          tone="primary"
          onConfirm={noop}
          onCancel={noop}
        />
      );
    case 'nav':
      return (
        <BottomNav
          items={[
            { key: 'home', label: 'Home', icon: HOME, href: '/home', active: true },
            { key: 'lists', label: 'Lists', icon: LIST, href: '/lists' },
            { key: 'settings', label: 'Settings', icon: GEAR, href: '/settings' },
          ]}
        />
      );
    default: {
      const render = Object.hasOwn(WAVE2, c) ? WAVE2[c] : Object.hasOwn(WAVE3, c) ? WAVE3[c] : undefined;
      return render ? (
        <div id="stage" style={{ padding: 16, maxWidth: '28rem' }}>
          {render()}
        </div>
      ) : null;
    }
  }
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <>
    <App />
    <Toaster />
  </>,
);

if (c === 'toast') {
  const tone = (q.get('tone') ?? 'neutral') as keyof typeof TONES;
  setTimeout(() => toast[TONES[tone]]('Saved to the list', { duration: 'sticky' }), 50);
}

void (async () => {
  await new Promise((r) => setTimeout(r, 300));
  // The same two clicks as elements.ts: open a combobox; copy with a clipboard that accepts.
  if (q.has('open')) document.querySelector<HTMLElement>('input[role="combobox"]')?.click();
  if (q.has('copied')) {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => undefined }, configurable: true });
    document.querySelector<HTMLElement>('#stage button')?.click();
  }
  await new Promise((r) => setTimeout(r, 100));
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // Spinners and pulsing dots repeat forever: wait only for animations that end.
  await Promise.all(
    document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined)),
  );
  document.documentElement.dataset.ready = '1';
})();
