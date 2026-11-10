// Minimal props for every component export, shared by the SSR test (renderToString in Node)
// and the hydration spec (server HTML plus hydrateRoot in Chromium). A new component export
// without a case here fails tests/ssr/ssr.test.tsx, so the table cannot fall behind.
import { createRef, type ReactElement } from 'react';
import * as ui from '../../src';
import { Inbox } from '../../src/inbox';
import { ServiceTokensSection } from '../../src/service-tokens';
import { SystemCanvas } from '../../src/system-canvas';
import type { LayoutNode } from '../../src/split-layout';

const noop = () => {};
const nav = [
  { key: 'home', label: 'Home', icon: <span>H</span>, href: '/' },
  { key: 'set', label: 'Settings', icon: <span>S</span>, href: '/s', active: true },
];
const leaf: LayoutNode = { type: 'leaf', slot: 0 };
const split: LayoutNode = {
  type: 'split',
  dir: 'row',
  sizes: [0.5, 0.5],
  children: [
    { type: 'leaf', slot: 0 },
    { type: 'leaf', slot: 1 },
  ],
};
/** A fixed instant so the server and the client agree. */
export const NOW = 1767225600000;

type Case = () => ReactElement;

// The AppShell case also renders these two variants (the case table may only name component exports);
// each has its own mainId and no Toaster, so the page has one of each.
/** AppShellHeaderMode: navMode header with three items. */
export const AppShellHeaderMode = () => (
  <ui.AppShell name="Header mode" mainId="shell-header-mode" toaster={false} navMode="header" nav={[...nav, { key: 'more', label: 'More', icon: <span>M</span>, href: '/m' }]}>
    <p>body</p>
  </ui.AppShell>
);
/** AppShellSidebarBrand: a sidebar with a brand function and a hub pill. */
export const AppShellSidebarBrand = () => (
  <ui.AppShell
    name="Sidebar brand"
    mainId="shell-sidebar-brand"
    toaster={false}
    nav={nav}
    hub={{ href: 'https://nish.software', label: 'nish.software' }}
    sidebar={{ storageKey: false, brand: ({ collapsed }) => <span>{collapsed ? 'O' : 'OTA.'}</span> }}
  >
    <p>body</p>
  </ui.AppShell>
);

export const cases: Record<string, Case> = {
  Accordion: () => (
    <ui.Accordion type="single" defaultValue="a" label="FAQ">
      <ui.AccordionItem value="a" title="One">
        first
      </ui.AccordionItem>
      <ui.AccordionItem value="b" title="Two">
        second
      </ui.AccordionItem>
    </ui.Accordion>
  ),
  AccordionItem: () => (
    <ui.Accordion type="multiple" label="FAQ">
      <ui.AccordionItem value="a" title="One">
        first
      </ui.AccordionItem>
    </ui.Accordion>
  ),
  ActivityFeed: () => <ui.ActivityFeed items={[{ id: 'a', at: NOW - 60000, text: 'Deployed' }]} now={NOW} />,
  AgentNode: () => <ui.AgentNode label="Agent" state="running" />,
  AnimatedList: () => (
    <ui.AnimatedList items={['a', 'b']} getKey={(x: string) => x}>
      {(x: string) => <div>{x}</div>}
    </ui.AnimatedList>
  ),
  AppErrorBoundary: () => (
    <ui.AppErrorBoundary>
      <p>ok</p>
    </ui.AppErrorBoundary>
  ),
  AppHeader: () => <ui.AppHeader name="App" />,
  AppShell: () => (
    <>
      <ui.AppShell name="App" nav={nav}>
        <p>body</p>
      </ui.AppShell>
      <AppShellHeaderMode />
      <AppShellSidebarBrand />
    </>
  ),
  AsyncPanel: () => (
    <ui.AsyncPanel status="ready">
      <p>ready</p>
    </ui.AsyncPanel>
  ),
  Avatar: () => <ui.Avatar name="Ada Lovelace" status="ok" />,
  AvatarGroup: () => (
    <ui.AvatarGroup max={2}>
      <ui.Avatar name="Ada Lovelace" />
      <ui.Avatar name="Grace Hopper" />
      <ui.Avatar name="Alan Turing" />
    </ui.AvatarGroup>
  ),
  Badge: () => <ui.Badge>New</ui.Badge>,
  BarChart: () => (
    <ui.BarChart
      data={[
        { label: 'a', value: 1 },
        { label: 'b', value: 3 },
      ]}
      label="Bars"
    />
  ),
  BellIcon: () => <ui.BellIcon />,
  BottomNav: () => <ui.BottomNav items={nav} />,
  Breadcrumbs: () => (
    <ui.Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Docs', href: '/docs' },
        { label: 'Page' },
      ]}
    />
  ),
  Button: () => <ui.Button>Go</ui.Button>,
  Calendar: () => <ui.Calendar defaultValue="2026-01-15" locale="en-US" />,
  Callout: () => <ui.Callout>Note</ui.Callout>,
  Card: () => <ui.Card>Card</ui.Card>,
  CardHeader: () => <ui.CardHeader title="Title" />,
  CardListSkeleton: () => <ui.CardListSkeleton />,
  Carousel: () => (
    <ui.Carousel aria-label="Slides">
      <div>one</div>
      <div>two</div>
    </ui.Carousel>
  ),
  ChartLegend: () => <ui.ChartLegend items={[{ label: 'A', tone: 'chart-1' }]} />,
  CheckIcon: () => <ui.CheckIcon />,
  CheckCircleIcon: () => <ui.CheckCircleIcon />,
  AlertTriangleIcon: () => <ui.AlertTriangleIcon />,
  InfoIcon: () => <ui.InfoIcon />,
  RotateIcon: () => <ui.RotateIcon />,
  LoaderIcon: () => <ui.LoaderIcon />,
  SunIcon: () => <ui.SunIcon />,
  MoonIcon: () => <ui.MoonIcon />,
  MonitorIcon: () => <ui.MonitorIcon />,
  ChevronDownIcon: () => <ui.ChevronDownIcon />,
  PanelLeftCloseIcon: () => <ui.PanelLeftCloseIcon />,
  PanelLeftOpenIcon: () => <ui.PanelLeftOpenIcon />,
  ChevronLeftIcon: () => <ui.ChevronLeftIcon />,
  ChevronRightIcon: () => <ui.ChevronRightIcon />,
  CalendarIcon: () => <ui.CalendarIcon />,
  PauseIcon: () => <ui.PauseIcon />,
  PlayIcon: () => <ui.PlayIcon />,
  Checkbox: () => <ui.Checkbox label="Agree" defaultChecked />,
  Chip: () => <ui.Chip>chip</ui.Chip>,
  ChipGroup: () => (
    <ui.ChipGroup label="Chips">
      <ui.Chip>a</ui.Chip>
    </ui.ChipGroup>
  ),
  ClockIcon: () => <ui.ClockIcon />,
  Combobox: () => (
    <ui.Combobox
      options={[
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
      ]}
      value="a"
      onChange={noop}
      aria-label="Fruit"
    />
  ),
  CommandPalette: () => <ui.CommandPalette open onOpenChange={noop} items={[{ id: '1', label: 'Open' }]} />,
  ConfirmDialog: () => <ui.ConfirmDialog open title="Sure?" confirmLabel="Yes" onConfirm={noop} onCancel={noop} />,
  ConnectionBanner: () => <ui.ConnectionBanner />,
  ContextMenu: () => (
    <ui.ContextMenu menu={<ui.MenuItem>Rename</ui.MenuItem>}>
      <div>Area</div>
    </ui.ContextMenu>
  ),
  CopyButton: () => <ui.CopyButton text="x" />,
  DatePicker: () => <ui.DatePicker aria-label="Due" defaultValue="2026-01-15" locale="en-US" name="due" />,
  DateRangePicker: () => <ui.DateRangePicker aria-label="Trip" defaultValue={{ from: '2026-01-15', to: '2026-01-18' }} locale="en-US" name="trip" />,
  Disclosure: () => <ui.Disclosure summary="More">hidden</ui.Disclosure>,
  Drawer: () => (
    <ui.Drawer open title="Drawer" onClose={noop}>
      content
    </ui.Drawer>
  ),
  DropdownMenu: () => (
    <ui.DropdownMenu trigger={<button type="button">Menu</button>}>
      <ui.MenuItem onSelect={noop}>One</ui.MenuItem>
    </ui.DropdownMenu>
  ),
  EmptyState: () => <ui.EmptyState title="Nothing" />,
  ErrorState: () => <ui.ErrorState />,
  Favicon: () => <ui.Favicon url="https://example.com" />,
  Field: () => (
    <ui.Field label="Name">
      <ui.Input />
    </ui.Field>
  ),
  FieldGroup: () => (
    <ui.FieldGroup label="Group">
      <ui.Input aria-label="x" />
    </ui.FieldGroup>
  ),
  FileDropzone: () => <ui.FileDropzone name="files" />,
  FilterBar: () => <ui.FilterBar>filters</ui.FilterBar>,
  FilterSheet: () => (
    <ui.FilterSheet open onClose={noop}>
      f
    </ui.FilterSheet>
  ),
  FlowSteps: () => (
    <ui.FlowSteps
      steps={[
        { id: '1', label: 'One', status: 'done' },
        { id: '2', label: 'Two', status: 'active' },
      ]}
    />
  ),
  HoverCard: () => (
    <ui.HoverCard content="Apple Inc.">
      <a href="/aapl">AAPL</a>
    </ui.HoverCard>
  ),
  IconButton: () => (
    <ui.IconButton label="Bell">
      <ui.BellIcon />
    </ui.IconButton>
  ),
  Inbox: () => (
    <Inbox
      items={[]}
      view="open"
      onViewChange={noop}
      counts={{ open: 0, snoozed: 0, handled: 0 }}
      sources={[]}
      source={null}
      onSourceChange={noop}
      onHandle={noop}
      onUnhandle={noop}
      onSnooze={noop}
      onUnsnooze={noop}
    />
  ),
  Input: () => <ui.Input aria-label="x" />,
  Kbd: () => <ui.Kbd>K</ui.Kbd>,
  KeyValueList: () => <ui.KeyValueList items={[{ key: 'a', label: 'A', value: '1' }]} />,
  Label: () => <ui.Label>Label</ui.Label>,
  LayoutPresetIcon: () => <ui.LayoutPresetIcon node={split} />,
  LayoutPresetPicker: () => (
    <ui.LayoutPresetPicker options={[{ id: 'one', label: 'One', hint: 'single', node: leaf }]} value="one" onChange={noop} />
  ),
  LineChart: () => (
    <ui.LineChart
      label="Line"
      data={[
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ]}
    />
  ),
  LinkCard: () => <ui.LinkCard href="/x" title="Link" />,
  ListRow: () => <ui.ListRow title="Row" />,
  LoadingBar: () => <ui.LoadingBar active />,
  MediaChip: () => <ui.MediaChip label="Chip" onClick={noop} />,
  MediaRow: () => <ui.MediaRow title="Row" />,
  MediaThumb: () => <ui.MediaThumb />,
  MenuItem: () => <ui.MenuItem>Item</ui.MenuItem>,
  MenuLabel: () => <ui.MenuLabel>Label</ui.MenuLabel>,
  MenuSeparator: () => <ui.MenuSeparator />,
  MenuSubHeader: () => <ui.MenuSubHeader onBack={noop}>Sub</ui.MenuSubHeader>,
  Meter: () => <ui.Meter value={40} label="Meter" />,
  Modal: () => (
    <ui.Modal open onClose={noop} title="Modal">
      content
    </ui.Modal>
  ),
  MoreIcon: () => <ui.MoreIcon />,
  MoreSheet: () => <ui.MoreSheet open onClose={noop} items={nav} />,
  MultiSelect: () => (
    <ui.MultiSelect
      aria-label="Fruit"
      options={[
        { value: 'a', label: 'Apple' },
        { value: 'b', label: 'Banana' },
      ]}
      defaultValue={['a']}
      name="fruit"
    />
  ),
  NavRail: () => <ui.NavRail items={nav} />,
  NishProvider: () => (
    <ui.NishProvider locale="ar" dir="rtl" strings={{ close: 'Fermer' }}>
      <ui.Callout>content</ui.Callout>
    </ui.NishProvider>
  ),
  NumberField: () => <ui.NumberField value={3} onCommit={noop} aria-label="Num" />,
  PageContainer: () => <ui.PageContainer>page</ui.PageContainer>,
  PageHeader: () => <ui.PageHeader title="Page" />,
  Pagination: () => <ui.Pagination page={3} pageCount={9} />,
  Popover: () => (
    <ui.Popover open onOpenChange={noop} anchor={createRef<HTMLElement>()}>
      pop
    </ui.Popover>
  ),
  Portal: () => (
    <ui.Portal>
      <p>portal</p>
    </ui.Portal>
  ),
  Progress: () => <ui.Progress value={40} aria-label="Upload" />,
  Radio: () => (
    <ui.RadioGroup aria-label="Pick" defaultValue="a">
      <ui.Radio value="a" label="A" />
    </ui.RadioGroup>
  ),
  RadioGroup: () => (
    <ui.RadioGroup
      aria-label="Pick"
      name="pick"
      defaultValue="a"
      options={[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]}
    />
  ),
  RangeBar: () => <ui.RangeBar min={0} max={10} low={2} high={8} />,
  RangeCalendar: () => <ui.RangeCalendar aria-label="Trip" defaultValue={{ from: '2026-01-15', to: '2026-01-18' }} locale="en-US" />,
  RelativeTime: () => <ui.RelativeTime value={NOW - 3600000} />,
  ResponsiveTable: () => (
    <ui.ResponsiveTable
      rows={[{ id: 'r', n: 1 }]}
      columns={[{ key: 'n', header: 'N', cell: (r: { n: number }) => r.n }]}
      rowKey={(r: { id: string }) => r.id}
      label="Table"
    />
  ),
  ScrollRow: () => (
    <ui.ScrollRow>
      <div>a</div>
    </ui.ScrollRow>
  ),
  SearchInput: () => <ui.SearchInput value="" onChange={noop} />,
  SectionHeader: () => <ui.SectionHeader title="Section" />,
  SectionNav: () => <ui.SectionNav items={[{ id: 's1', label: 'One' }]} />,
  Segmented: () => (
    <ui.Segmented
      label="Seg"
      options={[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]}
      value="a"
      onChange={noop}
    />
  ),
  Select: () => (
    <ui.Select aria-label="s">
      <option>a</option>
    </ui.Select>
  ),
  Separator: () => <ui.Separator label="or" />,
  ServiceTokensSection: () => <ServiceTokensSection tokens={[]} onRevoke={async () => {}} />,
  SettingRow: () => (
    <ui.SettingRow label="Row">
      <ui.Switch checked onCheckedChange={noop} aria-label="x" />
    </ui.SettingRow>
  ),
  SettingsIcon: () => <ui.SettingsIcon />,
  SettingsSection: () => <ui.SettingsSection title="Settings">x</ui.SettingsSection>,
  Skeleton: () => <ui.Skeleton />,
  SkeletonCard: () => <ui.SkeletonCard />,
  SkeletonLines: () => <ui.SkeletonLines />,
  SkeletonRows: () => <ui.SkeletonRows />,
  Slider: () => <ui.Slider aria-label="Volume" defaultValue={30} name="vol" />,
  Sparkline: () => <ui.Sparkline values={[1, 3, 2]} label="Spark" />,
  Spinner: () => <ui.Spinner />,
  SplitDividers: () => <ui.SplitDividers layout={split} w={800} h={600} gap={8} onResize={noop} />,
  SplitStage: () => (
    <ui.SplitStage layout={split} items={['a', 'b']} slots={['a', 'b']} renderPane={(id: string) => <div>{id}</div>} />
  ),
  Stat: () => <ui.Stat label="Stat" value="42" />,
  StatGrid: () => (
    <ui.StatGrid>
      <ui.Stat label="A" value={1} />
    </ui.StatGrid>
  ),
  StatGridSkeleton: () => <ui.StatGridSkeleton />,
  StatusDot: () => <ui.StatusDot tone="ok" />,
  StepBar: () => <ui.StepBar total={4} done={2} />,
  StickyActionBar: () => <ui.StickyActionBar open primary={<ui.Button>Save</ui.Button>} />,
  StickyBar: () => <ui.StickyBar>bar</ui.StickyBar>,
  Switch: () => <ui.Switch checked={false} onCheckedChange={noop} aria-label="sw" name="sw" />,
  SystemCanvas: () => (
    <SystemCanvas
      groups={[
        {
          id: 'g',
          title: 'G',
          column: 0,
          nodes: [
            { id: 'n1', label: 'N1' },
            { id: 'n2', label: 'N2' },
          ],
        },
      ]}
      edges={[{ id: 'e', from: 'n1', to: 'n2' }]}
    />
  ),
  TabPanel: () => <ui.TabPanel value="a">panel</ui.TabPanel>,
  Table: () => (
    <ui.Table>
      <tbody>
        <ui.Tr>
          <ui.Td>1</ui.Td>
        </ui.Tr>
      </tbody>
    </ui.Table>
  ),
  TableWrap: () => (
    <ui.TableWrap>
      <table />
    </ui.TableWrap>
  ),
  Tabs: () => (
    <ui.Tabs
      value="a"
      onChange={noop}
      items={[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]}
      label="Tabs"
    />
  ),
  TagInput: () => <ui.TagInput aria-label="Tags" defaultValue={['one', 'two']} name="tags" />,
  Td: () => (
    <table>
      <tbody>
        <tr>
          <ui.Td>x</ui.Td>
        </tr>
      </tbody>
    </table>
  ),
  Textarea: () => <ui.Textarea aria-label="t" />,
  Th: () => (
    <table>
      <thead>
        <tr>
          <ui.Th>x</ui.Th>
        </tr>
      </thead>
    </table>
  ),
  ThemeToggle: () => <ui.ThemeToggle presets />,
  TickerText: () => <ui.TickerText text="Hello" />,
  TimeField: () => <ui.TimeField aria-label="Start" defaultValue="09:30" locale="en-US" name="start" />,
  Toaster: () => <ui.Toaster />,
  Tooltip: () => (
    <ui.Tooltip tip="tip">
      <button type="button">t</button>
    </ui.Tooltip>
  ),
  TreeView: () => (
    <ui.TreeView
      aria-label="Files"
      items={[{ id: 'src', label: 'src', children: [{ id: 'a', label: 'a.ts' }] }, { id: 'b', label: 'b.ts' }]}
      defaultExpanded={['src']}
    />
  ),
  Tr: () => (
    <table>
      <tbody>
        <ui.Tr>
          <td>x</td>
        </ui.Tr>
      </tbody>
    </table>
  ),
  VirtualList: () => <ui.VirtualList aria-label="Rows" count={1000} itemSize={40} height={200} renderItem={(i) => <span>Row {i}</span>} />,
  VirtualTable: () => (
    <ui.VirtualTable
      label="Rows"
      rows={[{ id: '1', n: 1 }, { id: '2', n: 2 }]}
      rowKey={(r) => r.id}
      columns={[{ key: 'n', header: 'N', cell: (r) => r.n, numeric: true }]}
    />
  ),
  VisuallyHidden: () => <ui.VisuallyHidden>hidden</ui.VisuallyHidden>,
  WorkflowBoard: () => (
    <ui.WorkflowBoard
      phases={[{ id: 'p', title: 'Phase' }]}
      agents={[{ id: 'a', label: 'A', state: 'running', phase: 'p' }]}
    />
  ),
};

/** Calendar with no value and no month: the server renders the null-month path (empty title,
 *  6x7 empty grid); today's ring appears only after hydration. Used by
 *  src/components/calendar.hydration.test.tsx. */
export const calendarNullMonth: Case = () => <ui.Calendar aria-label="Pick a day" locale="en-US" />;

/** Exports that look like components (capitalised functions) but are not. */
export const NOT_COMPONENTS = ['ApiError'];

/** Hook probes: the value is printed as text, so a server/client difference shows up as a mismatch. */
function probe(name: string, fn: () => unknown) {
  return function Probe() {
    return <output data-hook={name}>{JSON.stringify(fn())}</output>;
  };
}
const P = (name: string, fn: () => unknown): Case => {
  const C = probe(name, fn);
  return () => <C />;
};
export const hookCases: Record<string, Case> = {
  useTheme: P('useTheme', () => {
    const t = ui.useTheme();
    return [t.choice, t.theme, t.scheme];
  }),
  useLocalStorage: P('useLocalStorage', () => ui.useLocalStorage('ssr-k', 'server')[0]),
  useMediaQuery: P('useMediaQuery', () => ui.useMediaQuery('(max-width: 600px)')),
  usePhone: P('usePhone', () => ui.usePhone()),
  useNarrow: P('useNarrow', () => ui.useNarrow()),
  useBreakpoint: P('useBreakpoint', () => ui.useBreakpoint()),
  usePrefersReducedMotion: P('usePrefersReducedMotion', () => ui.usePrefersReducedMotion()),
  useOnline: P('useOnline', () => ui.useOnline()),
  useUrlState: P('useUrlState', () => ui.useUrlState({ q: '' })[0]),
  useIsClient: P('useIsClient', () => ui.useIsClient()),
  useNishStrings: P('useNishStrings', () => ui.useNishStrings().close),
};
