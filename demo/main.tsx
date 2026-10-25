import { StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import {
  Badge,
  Button,
  Card,
  COLOR_ROLES,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Label,
  Modal,
  PRESETS,
  Select,
  Skeleton,
  SkeletonLines,
  ThemeToggle,
  Toaster,
  Tooltip,
  initTheme,
  toast,
  useTheme,
} from '../src';

initTheme();

// ?modal / ?toasts open those states at load so the visual check can capture them.
const params = new URLSearchParams(location.search);

function Section({ title, children, note }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-th-hi">{title}</h2>
        {note ? <p className="text-sm text-th-hi3">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ role }: { role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="size-9 shrink-0 rounded-lg border border-th-line"
        style={{ background: `var(--nish-${role})` }}
        aria-hidden="true"
      />
      <code className="min-w-0 truncate font-mono text-xs text-th-hi2">{role}</code>
    </div>
  );
}

const SURFACE_ROLES = ['bg', 'surface', 'elevated', 'overlay', 'line', 'line-strong'];
const TEXT_ROLES = ['hi', 'hi2', 'hi3', 'ghost', 'accent', 'accent2', 'on-accent', 'invert-bg', 'invert-text'];
const STATUS_ROLES = ['ok', 'loss', 'warn', 'info', 'scrim'];
const CHART = COLOR_ROLES.filter((r) => r.startsWith('chart-'));
const HUES = ['emerald', 'indigo', 'amber', 'lime', 'rose', 'sky', 'violet', 'teal'];

function Tokens() {
  return (
    <Section title="Color roles" note="Every app and site reads these. Pick roles, not raw colors.">
      <Card className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Surfaces', SURFACE_ROLES],
          ['Text and accents', TEXT_ROLES],
          ['Status', STATUS_ROLES],
          ['Chart series', CHART],
        ].map(([label, roles]) => (
          <div key={label as string} className="space-y-2.5">
            <Label>{label}</Label>
            <div className="grid gap-2">
              {(roles as string[]).map((r) => (
                <Swatch key={r} role={r} />
              ))}
            </div>
          </div>
        ))}
      </Card>
      <Card className="space-y-3">
        <Label>Hues (tile accents, tags)</Label>
        <div className="flex flex-wrap gap-2">
          {HUES.map((h) => (
            <span
              key={h}
              className="rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                color: `var(--nish-${h})`,
                borderColor: `color-mix(in srgb, var(--nish-${h}) 35%, transparent)`,
                background: `color-mix(in srgb, var(--nish-${h}) 12%, transparent)`,
              }}
            >
              {h}
            </span>
          ))}
        </div>
      </Card>
    </Section>
  );
}

function Type() {
  return (
    <Section title="Type">
      <Card className="space-y-3">
        <p className="text-4xl font-semibold tracking-tight">Display 36</p>
        <p className="text-3xl font-semibold tracking-tight">Heading 30</p>
        <p className="text-2xl font-semibold tracking-tight">Heading 24</p>
        <p className="text-xl font-semibold">Title 20</p>
        <p className="text-lg">Lead 18: the front door to everything on nish.software.</p>
        <p className="text-base text-th-hi2">
          Body 16. Secondary text sits one step back so headings and numbers lead. Links use the{' '}
          <a href="#type" className="font-medium text-th-accent underline-offset-2 hover:underline">
            accent color
          </a>
          .
        </p>
        <p className="text-sm text-th-hi3">Small 14, tertiary: labels, captions and metadata.</p>
        <p className="font-mono text-sm text-th-hi2">mono 14: 1,234.56 · +2.4% · 08/14/26</p>
      </Card>
    </Section>
  );
}

function Controls() {
  const [loading, setLoading] = useState(false);
  return (
    <Section title="Controls" note="Controls grow to a 44px tap target on touch screens.">
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="primary" loading={loading} onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}>
            {loading ? 'Saving' : 'Save'}
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary">Small</Button>
          <Button size="sm">Small</Button>
          <Button size="lg" variant="primary">Large</Button>
          <IconButton label="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
          </IconButton>
          <IconButton label="Pinned" active>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 17v5M9 10.76V6h6v4.76l2 2.24v2H7v-2z" /></svg>
          </IconButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="ok">Healthy</Badge>
          <Badge tone="loss">Down</Badge>
          <Badge tone="warn">Pending</Badge>
          <Badge tone="info">New</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <Label>Search</Label>
            <Input placeholder="Company or title" />
          </label>
          <label className="grid gap-1.5">
            <Label>Status</Label>
            <Select defaultValue="open">
              <option value="open">Open</option>
              <option value="applied">Applied</option>
              <option value="closed">Closed</option>
            </Select>
          </label>
          <label className="grid gap-1.5">
            <Label>Price target</Label>
            <Input invalid defaultValue="abc" aria-describedby="price-err" />
            <span id="price-err" className="text-xs text-th-loss">Enter a number.</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-th-hi2">
          <Tooltip tip="Implied volatility: how much the market expects the price to move over a year.">
            <span className="cursor-help underline decoration-th-ghost decoration-dotted underline-offset-2">IV rank</span>
          </Tooltip>
          <span>hover or focus for a tooltip</span>
        </div>
      </Card>
    </Section>
  );
}

function States() {
  return (
    <Section title="States">
      <div className="grid gap-4 md:grid-cols-3">
        <EmptyState
          title="No price drops yet"
          detail="Trackers check every hour. You will see changes here."
          action={<Button size="sm">Add a tracker</Button>}
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m19 9-5 5-4-4-3 3" /></svg>}
        />
        <ErrorState message="Could not reach the API. Check that the server is running." onRetry={() => toast.info('Retrying')} />
        <Card padded={false}>
          <SkeletonLines lines={4} />
        </Card>
      </div>
    </Section>
  );
}

function Feedback() {
  const [open, setOpen] = useState(params.has('modal'));
  useEffect(() => {
    // StrictMode runs effects twice in dev; show the sample toasts once.
    if (!params.has('toasts') || document.body.dataset.sampleToasts) return;
    document.body.dataset.sampleToasts = '1';
    toast.success('Saved', 'Watchlist updated with 3 symbols.');
    toast.error('Sync failed', 'The store returned 503. It will retry in 5 minutes.');
    toast.info('New version deployed');
  }, []);
  return (
    <Section title="Overlays" note="Modals become bottom sheets on phones. Error toasts stay until dismissed.">
      <Card className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <Button onClick={() => toast.success('Saved', 'Changes are live.')}>Success toast</Button>
        <Button onClick={() => toast.warn('Running low', 'Under 20 API calls left today.')}>Warning toast</Button>
        <Button onClick={() => toast.error('Could not save', 'Server said 500.')}>Error toast</Button>
      </Card>
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
          <p>Close 2 contracts of AMD 08/14/26 $180 C at market? This can't be undone.</p>
          <label className="mt-4 grid gap-1.5">
            <Label>Note</Label>
            <Input placeholder="Why are you closing?" />
          </label>
        </Modal>
      ) : null}
    </Section>
  );
}

const ROWS = [
  ['jobs.nish.software', 'Job search', 'ok', '41 ms'],
  ['trading.nish.software', 'Options ideas', 'ok', '88 ms'],
  ['mc.nish.software', 'Minecraft guides', 'warn', '612 ms'],
  ['trackers.nish.software', 'Price trackers', 'loss', 'timeout'],
] as const;

function SampleApp() {
  return (
    <Section title="In an app" note="A typical screen built only from these parts.">
      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-th-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="font-semibold text-th-hi">Sites</p>
            <p className="text-xs text-th-hi3">Checked 2 minutes ago</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Export</Button>
            <Button size="sm" variant="primary">Check now</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-th-line sm:grid-cols-4">
          {[
            ['Up', '8', 'text-th-ok'],
            ['Slow', '1', 'text-th-warn'],
            ['Down', '1', 'text-th-loss'],
            ['p95', '212 ms', 'text-th-hi'],
          ].map(([k, v, c]) => (
            <div key={k} className="bg-th-surface px-4 py-3 sm:px-5">
              <p className="text-xs text-th-hi3">{k}</p>
              <p className={`text-2xl font-semibold tabular-nums ${c}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-y border-th-line bg-th-elevated/50 text-left text-xs text-th-hi3">
                <th className="px-4 py-2 font-medium sm:px-5">Host</th>
                <th className="px-4 py-2 font-medium">What</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium sm:px-5">Response</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([host, what, s, ms]) => (
                <tr key={host} className="border-b border-th-line last:border-0 hover:bg-th-elevated/50">
                  <td className="px-4 py-2.5 font-medium text-th-hi sm:px-5">{host}</td>
                  <td className="px-4 py-2.5 text-th-hi2">{what}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={s}>{s === 'ok' ? 'Up' : s === 'warn' ? 'Slow' : 'Down'}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-th-hi2 sm:px-5">{ms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="grid gap-px overflow-hidden p-0 sm:grid-cols-2 lg:grid-cols-4" padded={false}>
        {CHART.slice(0, 4).map((c, i) => (
          <div key={c} className="bg-th-surface p-4">
            <p className="text-xs text-th-hi3">Series {i + 1}</p>
            <svg viewBox="0 0 120 40" className="mt-2 h-10 w-full" aria-hidden="true">
              <polyline
                fill="none"
                stroke={`var(--nish-${c})`}
                strokeWidth="2"
                points={Array.from({ length: 12 }, (_, x) => `${x * 11},${20 + Math.sin(x * (0.7 + i * 0.3)) * 12}`).join(' ')}
              />
            </svg>
          </div>
        ))}
      </Card>
    </Section>
  );
}

function App() {
  const { theme } = useTheme();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-th-line bg-th-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-[var(--nish-page-max)] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="font-semibold text-th-hi">@nish/ui</p>
            <p className="text-xs text-th-hi3">
              Theme: {PRESETS.find((p) => p.id === theme)?.label}
            </p>
          </div>
          <ThemeToggle presets />
        </div>
      </header>
      <main className="mx-auto max-w-[var(--nish-page-max)] space-y-10 px-4 py-8 sm:px-6">
        <SampleApp />
        <Tokens />
        <Type />
        <Controls />
        <States />
        <Feedback />
        <Card className="space-y-2">
          <Label>Skeleton</Label>
          <Skeleton className="h-24 w-full" />
        </Card>
      </main>
      <Toaster />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
