import { type ReactNode } from 'react';
import { Badge, Button, Card, cn, EmptyState, ErrorState, IconButton, Input, Label, Select, Skeleton } from '../../src';
import { CodeBlock } from '../lib/code';
import { DownloadIcon, InboxIcon, RefreshIcon, SearchIcon } from '../lib/icons';
import { href } from '../lib/router';
import { PageHeader, Section, ThemeColumns } from '../lib/ui';

// Realistic screens built only from @nish/ui components and th-* classes.

const SITES = [
  { host: 'nish.software', what: 'Hub', status: 'ok', p95: 38, uptime: '100%' },
  { host: 'jobs.nish.software', what: 'Job search', status: 'ok', p95: 41, uptime: '99.98%' },
  { host: 'trading.nish.software', what: 'Options ideas', status: 'ok', p95: 88, uptime: '99.95%' },
  { host: 'minecraft.nish.software', what: 'Minecraft guides', status: 'warn', p95: 612, uptime: '99.40%' },
  { host: 'trackers.nish.software', what: 'Price trackers', status: 'loss', p95: null, uptime: '97.12%' },
] as const;

const LABEL = { ok: 'Up', warn: 'Slow', loss: 'Down' } as const;
const BAR = { ok: 'bg-th-ok-fill', warn: 'bg-th-warn-fill', loss: 'bg-th-loss-fill' } as const;

function Dashboard() {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-th-line px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="font-semibold text-th-hi">Sites</h3>
          <p className="text-xs text-th-hi3">Checked 2 minutes ago · every 60 seconds</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" icon={<DownloadIcon size={13} />}>
            Export
          </Button>
          <Button size="sm" variant="primary" icon={<RefreshIcon size={13} />}>
            Check now
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px border-b border-th-line bg-th-line sm:grid-cols-4">
        {[
          ['Up', '3', 'text-th-ok'],
          ['Slow', '1', 'text-th-warn'],
          ['Down', '1', 'text-th-loss'],
          ['p95', '212 ms', 'text-th-hi'],
        ].map(([k, v, c]) => (
          <div key={k} className="bg-th-surface px-4 py-3 sm:px-5">
            <p className="text-xs text-th-hi3">{k}</p>
            <p className={cn('text-2xl font-semibold tabular-nums', c)}>{v}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-th-line bg-th-elevated/50 text-left text-xs text-th-hi3">
              <th className="px-4 py-2 font-medium sm:px-5">Host</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">30-day uptime</th>
              <th className="px-4 py-2 text-right font-medium sm:px-5">p95</th>
            </tr>
          </thead>
          <tbody>
            {SITES.map((s) => (
              <tr key={s.host} className="border-b border-th-line last:border-0 hover:bg-th-elevated/50">
                <td className="px-4 py-2.5 sm:px-5">
                  <p className="font-medium text-th-hi">{s.host}</p>
                  <p className="text-xs text-th-hi3">{s.what}</p>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={s.status}>{LABEL[s.status]}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-th-elevated sm:w-20">
                      <div className={cn('h-full rounded-full', BAR[s.status])} style={{ width: `${Math.max(8, (parseFloat(s.uptime) - 96) * 25)}%` }} />
                    </div>
                    <span className="tabular-nums text-th-hi2">{s.uptime}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-th-hi2 sm:px-5">{s.p95 == null ? 'timeout' : `${s.p95} ms`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Settings() {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-th-line px-4 py-3 sm:px-5">
        <h3 className="font-semibold text-th-hi">Alerts</h3>
        <p className="text-xs text-th-hi3">How trackers tell you about price drops.</p>
      </div>
      <form className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5" onSubmit={(e) => e.preventDefault()}>
        <label className="grid gap-1.5">
          <Label>Email</Label>
          <Input type="email" defaultValue="me@nish.software" />
        </label>
        <label className="grid gap-1.5">
          <Label>Send</Label>
          <Select defaultValue="instant">
            <option value="instant">As soon as a price drops</option>
            <option value="daily">Once a day, at 8 am</option>
            <option value="weekly">Weekly digest</option>
          </Select>
        </label>
        <label className="grid gap-1.5">
          <Label>Minimum drop</Label>
          <Input inputMode="decimal" defaultValue="5" aria-describedby="drop-hint" />
          <span id="drop-hint" className="text-xs text-th-hi3">
            Percent below the price when you added it.
          </span>
        </label>
        <label className="grid gap-1.5">
          <Label>Webhook URL</Label>
          <Input invalid defaultValue="hooks.slack.com/T0/B0" aria-describedby="hook-err" />
          <span id="hook-err" className="text-xs text-th-loss">
            Start with https://
          </span>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-th-line pt-4 sm:col-span-2">
          <p className="text-xs text-th-hi3">Last saved Oct 24 at 9:12 pm</p>
          <div className="flex gap-2">
            <Button variant="ghost">Discard</Button>
            <Button variant="primary" type="submit">
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

function States() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-th-line px-4 py-3">
          <h3 className="font-semibold text-th-hi">Applications</h3>
          <IconButton label="Search applications" size="sm">
            <SearchIcon size={14} />
          </IconButton>
        </div>
        <div className="p-4">
          <EmptyState
            icon={<InboxIcon />}
            title="No applications yet"
            detail="Save a job from any listing and it lands here, with its status and next step."
            action={
              <Button size="sm" variant="primary">
                Find jobs
              </Button>
            }
          />
        </div>
      </Card>
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-th-line px-4 py-3">
          <h3 className="font-semibold text-th-hi">Positions</h3>
          <Badge tone="loss">Offline</Badge>
        </div>
        <div className="space-y-4 p-4">
          <ErrorState message="Could not load positions. The broker API returned 503 Service Unavailable." onRetry={() => undefined} />
          <div className="space-y-2" aria-hidden="true">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </Card>
    </div>
  );
}

const PATTERNS: { id: string; title: string; note: string; render: () => ReactNode; code: string }[] = [
  {
    id: 'dashboard',
    title: 'Dashboard card with a table',
    note: 'Card unpadded, a header row, stat tiles on a 1px line grid, and a table that scrolls sideways on phones instead of squashing.',
    render: () => <Dashboard />,
    code: `<Card padded={false} className="overflow-hidden">
  <div className="flex items-center justify-between border-b border-th-line px-4 py-3">…</div>
  <div className="grid grid-cols-2 gap-px bg-th-line sm:grid-cols-4">
    <div className="bg-th-surface px-4 py-3">…</div>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full min-w-[480px] text-sm">…</table>
  </div>
</Card>`,
  },
  {
    id: 'settings',
    title: 'Settings form',
    note: 'Label over each field, hints and errors tied with aria-describedby, and the actions in a footer row.',
    render: () => <Settings />,
    code: `<label className="grid gap-1.5">
  <Label>Webhook URL</Label>
  <Input invalid aria-describedby="hook-err" />
  <span id="hook-err" className="text-xs text-th-loss">Start with https://</span>
</label>`,
  },
  {
    id: 'states',
    title: 'Empty and error pages',
    note: 'EmptyState says what is empty and how to fill it; ErrorState says what failed and offers Retry.',
    render: () => <States />,
    code: `{isError ? (
  <ErrorState message={error.message} onRetry={refetch} />
) : items.length === 0 ? (
  <EmptyState icon={<Inbox />} title="No applications yet" action={<Button size="sm">Find jobs</Button>} />
) : (
  <List items={items} />
)}`,
  },
];

export function PatternsPage({ view }: { view: 'docs' | 'themes' }) {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Patterns"
        title="App screens"
        lead="Three screens every app has, built only from the package. Copy the structure; the components and roles do the rest."
      >
        <nav aria-label="Pattern views" className="flex gap-1 pt-2">
          {[
            ['docs', 'Screens', '/patterns'],
            ['themes', 'All themes', '/patterns/themes'],
          ].map(([id, label, to]) => (
            <a
              key={id}
              href={href(to)}
              aria-current={view === id ? 'page' : undefined}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors pointer-coarse:min-h-11 pointer-coarse:py-2.5',
                view === id ? 'bg-th-accent-soft text-th-accent' : 'text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
              )}
            >
              {label}
            </a>
          ))}
        </nav>
      </PageHeader>
      {PATTERNS.map((p) => (
        <Section key={p.id} id={p.id} title={p.title} note={p.note}>
          {view === 'themes' ? (
            <ThemeColumns min={520} render={() => <div className="p-3">{p.render()}</div>} />
          ) : (
            <>
              <div className="rounded-2xl bg-th-bg">{p.render()}</div>
              <CodeBlock code={p.code} title="The structure" />
            </>
          )}
        </Section>
      ))}
    </div>
  );
}
