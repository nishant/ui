import docgen from 'virtual:nish-docgen';
import { Badge, Card, COLOR_ROLES, PRESETS } from '../../src';
import { COMPONENT_DOCS } from '../components';
import { ArrowRightIcon } from '../lib/icons';
import { href } from '../lib/router';
import { PageHeader, Prose, Section, ThemeScope } from '../lib/ui';

const APPS: { host: string; name: string; what: string; how: 'npm' | 'vendored'; stack: string }[] = [
  { host: 'nish.software', name: 'The hub', what: 'The front door: a tile for every site and app.', how: 'npm', stack: 'React + Tailwind 4' },
  { host: 'jobs.nish.software', name: 'Jobs', what: 'Job search and application tracking.', how: 'npm', stack: 'React + Tailwind 4' },
  { host: 'trading.nish.software', name: 'Trading', what: 'Options ideas, scores and positions.', how: 'npm', stack: 'React + Tailwind 4, pnpm' },
  { host: 'Nishboard', name: 'Nishboard', what: 'Desktop dashboard with its own extra themes.', how: 'npm', stack: 'Electron + React, pnpm' },
  { host: 'status.nish.software', name: 'Status', what: 'Uptime and response times for every site.', how: 'npm', stack: 'React + Tailwind 4' },
  { host: 'trackers.nish.software', name: 'Trackers', what: 'Price trackers and drop alerts.', how: 'npm', stack: 'React + Tailwind 4' },
  { host: 'minecraft.nish.software', name: 'Minecraft', what: 'Build guides, with a pixel display face.', how: 'vendored', stack: 'Static HTML' },
  { host: 'trips.nish.software', name: 'Trips', what: 'Trip pages, with a serif display face.', how: 'vendored', stack: 'Static HTML' },
];

const STEPS = [
  ['Change', 'Edit src/tokens.mjs or a component. Check it here with npm run dev:site.'],
  ['Check', 'npm run check: typecheck, WCAG contrast of every theme, build and the theme-init tests.'],
  ['Release', 'npm run release patch: bumps master, then tags a commit that adds the built dist/.'],
  ['Apps', 'scripts/bump-consumers.sh vX.Y.Z opens a PR in each app moving it to the tag.'],
  ['Static sites', "Hosting pins the tag in ui.json; scripts/sync-ui.mjs vendors the dist files."],
];

export function OverviewPage() {
  const colorCount = COLOR_ROLES.length;
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Design system"
        title="One theme for every nish.software app"
        lead={
          <>
            <code className="inline">@nish/ui</code> holds the design tokens, the seven themes, the theme switching that follows one choice across
            subdomains, and the small React components every app ended up writing for itself. This site is built from the same source, so what you
            see here is exactly what ships in v{docgen.version}.
          </>
        }
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={href('/getting-started')}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-th-accent px-4 text-sm font-medium text-th-on-accent transition-colors hover:bg-th-accent/90 pointer-coarse:min-h-11"
          >
            Get started <ArrowRightIcon size={15} />
          </a>
          <a
            href={href('/components/button')}
            className="inline-flex h-10 items-center rounded-lg border border-th-line-strong bg-th-surface px-4 text-sm font-medium text-th-hi transition-colors hover:bg-th-elevated pointer-coarse:min-h-11"
          >
            Browse components
          </a>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(PRESETS.length), 'themes', '/themes'],
          [String(colorCount), 'color roles', '/color'],
          [String(COMPONENT_DOCS.length), 'components', '/components/button'],
          ['8', 'apps and sites', '/overview'],
        ].map(([n, label, to]) => (
          <a key={label} href={href(to)} className="block rounded-xl">
            <Card interactive className="h-full">
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-th-hi">{n}</p>
              <p className="text-sm text-th-hi2">{label}</p>
            </Card>
          </a>
        ))}
      </div>

      <Section title="What is in it" note="Everything is a role, never a raw color, so every app restyles together.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Tokens', 'src/tokens.mjs is the one source: colors per theme, type, spacing, radii, shadows, motion, z-index. The build turns it into CSS variables (--nish-*) and Tailwind classes (bg-th-surface).'],
            ['Themes', 'Dark (the default), Light, and the presets Slate, Terminal, Mocha, Ocean and High contrast. Every pair of text and background is checked against WCAG in CI.'],
            ['Theme switching', 'theme-init.js applies the saved choice before first paint; theme.ts handles switching. The choice lives in a cookie on .nish.software, so it is the same on every subdomain.'],
            ['Components', 'Button, IconButton, Card, Badge, fields, skeletons, empty and error states, toasts, Modal, Tooltip and ThemeToggle. Small, accessible, and 44px tap targets on touch screens.'],
          ].map(([t, d]) => (
            <Card key={t}>
              <p className="font-semibold text-th-hi">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-th-hi2">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Who uses it" note="Apps install a git tag from npm; static sites vendor the CSS and scripts from the same tag.">
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-th-line">
            {APPS.map((a) => (
              <li key={a.host} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-medium text-th-hi">
                    {a.name} <span className="font-mono text-xs font-normal text-th-hi3">{a.host}</span>
                  </p>
                  <p className="text-sm text-th-hi2">{a.what}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-th-hi3">{a.stack}</span>
                  <Badge tone={a.how === 'npm' ? 'accent' : 'info'}>{a.how === 'npm' ? 'npm git tag' : 'vendored dist'}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="How a release reaches them">
        <ol className="divide-y divide-th-line overflow-hidden rounded-xl border border-th-line bg-th-surface">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-4 px-4 py-3.5 sm:px-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-th-accent-soft text-xs font-semibold text-th-accent">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold text-th-hi">{t}</p>
                <p className="text-sm leading-relaxed text-th-hi2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Prose>
          <p>
            A release changes nothing in an app until its PR merges, so each app moves on its own schedule. Static sites move when hosting changes the
            tag in <code>ui.json</code> and re-runs the sync. See <a href={href('/changelog')}>the changelog</a> for what each version changed.
          </p>
        </Prose>
      </Section>

      <Section title="Seven themes, one set of components" note="The same card in every theme. Each is a [data-theme] container on this page.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <ThemeScope key={p.id} theme={p.id} className="rounded-xl border border-th-line p-3">
              <div className="rounded-lg border border-th-line bg-th-surface p-3 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-th-hi">{p.label}</p>
                  <Badge tone="ok">Up</Badge>
                </div>
                <p className="mt-1 text-xs text-th-hi2">212 ms p95 · 8 sites</p>
                <div className="mt-3 flex gap-1">
                  {['accent', 'accent2', 'ok', 'warn', 'loss', 'info'].map((r) => (
                    <span key={r} className="h-1.5 flex-1 rounded-full" style={{ background: `var(--nish-${r === 'ok' || r === 'warn' || r === 'loss' || r === 'info' ? r + '-fill' : r})` }} />
                  ))}
                </div>
              </div>
            </ThemeScope>
          ))}
        </div>
      </Section>
    </div>
  );
}
