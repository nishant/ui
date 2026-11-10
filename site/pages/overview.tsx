import pkg from 'virtual:nish-pkg';
import { Badge, Card, COLOR_ROLES, PRESETS, buttonClass, cardClass } from '../../src';
import { DOCS } from '../lib/docs';
import { ArrowRightIcon } from '../lib/icons';
import { href } from '../lib/router';
import { PageHeader, Prose, Section, ThemeScope } from '../lib/ui';

const WHERE: { name: string; what: string; how: string }[] = [
  { name: 'React + Tailwind 4 (Vite)', what: 'Components, hooks and the th-* color classes.', how: 'nish-ui, nish-ui/tailwind.css' },
  { name: 'Next.js App Router', what: 'Server components import it directly; modules that need the browser are client components.', how: 'nish-ui' },
  { name: 'Plain CSS and static HTML', what: 'Variables, the nish-* classes and a React-free theme switcher.', how: 'nish-ui/nish.css, nish-ui/theme' },
  { name: 'Custom elements', what: 'Sheets, dialogs, tabs, tables and charts for pages with no React.', how: 'nish-ui/elements' },
  { name: 'Electron', what: 'The same React app, with the native window kept in step with the scheme.', how: 'nish-ui' },
  { name: 'Node servers', what: 'A Hono login, session and inbox kit.', how: 'nish-ui/server' },
];

const STEPS = [
  ['Install', 'npm install nish-ui, plus Tailwind 4 for the Tailwind path.'],
  ['Import the CSS', "@import 'nish-ui/tailwind.css' after Tailwind, or link nish.css on a page without it."],
  ['Apply the theme early', 'theme-init.js (or the Vite plugin) sets the saved theme before first paint.'],
  ['Use the components', 'Import from nish-ui and style with color roles such as bg-th-surface.'],
];

export function OverviewPage() {
  const colorCount = COLOR_ROLES.length;
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Design system"
        title="Tokens, themes and components"
        lead={
          <>
            <code className="inline">nish-ui</code> holds the design tokens, the seven themes, the theme switching that follows one choice across
            tabs and subdomains, and accessible React components that also work from server components and plain HTML. This site is built from the same source, so what you
            see here is exactly what ships in v{pkg.version}.
          </>
        }
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <a
            href={href('/getting-started')}
            className={buttonClass({ variant: 'primary' })}
          >
            Get started <ArrowRightIcon size={15} />
          </a>
          <a
            href={href('/components/button')}
            className={buttonClass({ variant: 'secondary' })}
          >
            Browse components
          </a>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(PRESETS.length), 'themes', '/themes'],
          [String(colorCount), 'color roles', '/color'],
          [String(DOCS.filter((d) => d.exports.length > 0).length), 'components', '/components/button'],
          [String(WHERE.length), 'ways to use it', '/getting-started'],
        ].map(([n, label, to]) => (
          <a key={label} href={href(to)} className={cardClass({ interactive: true, className: 'block h-full' })}>
            <div>
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-th-hi">{n}</p>
              <p className="text-sm text-th-hi2">{label}</p>
            </div>
          </a>
        ))}
      </div>

      <Section title="What is in it" note="Everything is a role, never a raw color, so every app restyles together.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Tokens', 'src/tokens.mjs is the one source: colors per theme, type, spacing, radii, shadows, motion, z-index. The build turns it into CSS variables (--nish-*) and Tailwind classes (bg-th-surface).'],
            ['Themes', 'Dark (the default), Light, and the presets Slate, Terminal, Mocha, Ocean and High contrast. Every pair of text and background is checked against WCAG in CI.'],
            ['Theme switching', 'theme-init.js applies the saved choice before first paint; theme.ts handles switching. The choice is saved in localStorage and, for sites that opt in, a cookie on your domain, so it is the same on every subdomain.'],
            ['Components', '100+ components: buttons, forms, tables, overlays, charts, navigation, toasts and more. Small, accessible, and 44px tap targets on touch screens.'],
          ].map(([t, d]) => (
            <Card key={t}>
              <p className="font-semibold text-th-hi">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-th-hi2">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Where it works" note="One package, several ways in. Every one of them gets the same themes.">
        <Card padded={false} className="overflow-hidden">
          <ul className="divide-y divide-th-line">
            {WHERE.map((w) => (
              <li key={w.name} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-medium text-th-hi">{w.name}</p>
                  <p className="text-sm text-th-hi2">{w.what}</p>
                </div>
                <code className="min-w-0 max-w-full break-words font-mono text-xs text-th-hi3">{w.how}</code>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Getting started in four steps">
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
            The details, with Next.js and Electron, are in <a href={href('/getting-started')}>Getting started</a>. See{' '}
            <a href={href('/changelog')}>the changelog</a> for what each version changed.
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
