import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  AppHeader,
  BottomNav,
  Button,
  Callout,
  ChartLegend,
  Checkbox,
  Chip,
  ChipGroup,
  Combobox,
  ConfirmDialog,
  CopyButton,
  Disclosure,
  EmptyState,
  ErrorState,
  Field,
  FieldGroup,
  IconButton,
  Input,
  Kbd,
  KeyValueList,
  Label,
  ListRow,
  Meter,
  Modal,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  SectionHeader,
  Skeleton,
  Sparkline,
  Spinner,
  Stat,
  StatusDot,
  Switch,
  Tabs,
  Textarea,
  ThemeToggle,
  Toaster,
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
  switch: () => <Switch checked={false} onChange={noop} label="Alerts" labelSide="end" />,
  'switch-on': () => <Switch checked onChange={noop} label="Alerts" description="Email me when it changes" labelSide="end" />,
  'switch-sm-on': () => <Switch checked onChange={noop} label="Alerts" size="sm" labelSide="end" />,
  'switch-start': () => <Switch checked onChange={noop} label="Alerts" description="Email me when it changes" />,
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
      const render = WAVE2[c];
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
