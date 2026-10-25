import { useEffect, useState } from 'react';
import { Badge, Button, Card, SCALE } from '../../src';
import { CodeBlock } from '../lib/code';
import { PageHeader, Pill, Prose, Section } from '../lib/ui';

const TYPE_STEPS = ['4xl', '3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'] as const;
const TYPE_SAMPLE: Record<string, string> = {
  '4xl': 'Display: the hub',
  '3xl': 'Page title: Positions',
  '2xl': 'Section: Open orders',
  xl: 'Card title: Weekly digest',
  lg: 'Lead: the front door to everything on nish.software.',
  base: 'Body: secondary text sits one step back so headings and numbers lead.',
  sm: 'Small: table cells, form fields and most UI text.',
  xs: 'Caption: labels, metadata and timestamps.',
};

export function TypographyPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Foundations"
        title="Typography"
        lead="Inter Variable, self-hosted, for all UI text; the system monospace for code and aligned figures. Sizes follow Tailwind's scale, with line heights tuned for UI."
      />

      <Section title="Families">
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-th-hi3">Sans</p>
              <Pill>font-sans</Pill>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-th-hi">Aa Bb Cc 0123</p>
            <p className="text-sm text-th-hi2">Inter Variable, weights 100 to 900, Latin and Latin Extended.</p>
            <code className="block break-words font-mono text-xs text-th-hi3">--nish-font-sans: {SCALE['font-sans']}</code>
          </Card>
          <Card className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wider text-th-hi3">Mono</p>
              <Pill>font-mono</Pill>
            </div>
            <p className="font-mono text-3xl text-th-hi">1,234.56</p>
            <p className="text-sm text-th-hi2">The platform monospace: no download, and figures line up.</p>
            <code className="block break-words font-mono text-xs text-th-hi3">--nish-font-mono: {SCALE['font-mono']}</code>
          </Card>
        </div>
      </Section>

      <Section title="Scale" note="Each size has a matching line height token. Tailwind's text-* classes use the same sizes.">
        <Card padded={false} className="divide-y divide-th-line">
          {TYPE_STEPS.map((s) => (
            <div key={s} className="grid gap-2 px-4 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:px-5">
              <div className="space-y-1">
                <Pill>text-{s}</Pill>
                <p className="font-mono text-xs text-th-hi3">
                  {SCALE[`text-${s}`]} / {SCALE[`text-${s}-lh`]}
                </p>
              </div>
              <p
                className="min-w-0 font-semibold tracking-tight text-th-hi"
                style={{ fontSize: `var(--nish-text-${s})`, lineHeight: `var(--nish-text-${s}-lh)`, fontWeight: ['base', 'sm', 'xs', 'lg'].includes(s) ? 400 : 600 }}
              >
                {TYPE_SAMPLE[s]}
              </p>
            </div>
          ))}
        </Card>
      </Section>

      <Section title="Weights and tracking">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="space-y-2">
            {(['normal', 'medium', 'semibold', 'bold'] as const).map((w) => (
              <div key={w} className="flex items-baseline justify-between gap-3">
                <span className="text-lg text-th-hi" style={{ fontWeight: Number(SCALE[`weight-${w}`]) }}>
                  {w[0].toUpperCase() + w.slice(1)} {SCALE[`weight-${w}`]}
                </span>
                <Pill>font-{w}</Pill>
              </div>
            ))}
          </Card>
          <Card className="space-y-3">
            <div>
              <p className="text-2xl font-semibold text-th-hi" style={{ letterSpacing: 'var(--nish-tracking-tight)' }}>
                Tight headings
              </p>
              <code className="font-mono text-xs text-th-hi3">--nish-tracking-tight: {SCALE['tracking-tight']} · tracking-tight</code>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-th-hi3" style={{ letterSpacing: 'var(--nish-tracking-caps)' }}>
                Uppercase labels
              </p>
              <code className="font-mono text-xs text-th-hi3">--nish-tracking-caps: {SCALE['tracking-caps']}</code>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="Numbers">
        <Prose>
          <p>
            Tables get <code>tabular-nums</code> from base.css, so figures line up without a class. Elsewhere add <code>tabular-nums</code> or the{' '}
            <code>.nish-tabular</code> class.
          </p>
        </Prose>
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <tbody>
              {[
                ['AMD', '$171.20', '+2.41%'],
                ['NVDA', '$1,108.45', '-0.87%'],
                ['MSFT', '$498.10', '+11.02%'],
              ].map(([s, p, c]) => (
                <tr key={s} className="border-b border-th-line last:border-0">
                  <td className="px-4 py-2.5 font-medium text-th-hi">{s}</td>
                  <td className="px-4 py-2.5 text-right text-th-hi">{p}</td>
                  <td className={`px-4 py-2.5 text-right ${c.startsWith('+') ? 'text-th-ok' : 'text-th-loss'}`}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>
    </div>
  );
}

const SPACE = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '16'];
const RADII = ['xs', 'sm', 'md', 'lg', 'pill'];

export function SpacingPage() {
  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Foundations" title="Spacing & radius" lead="A 4px grid for space, five radii, and the layout constants every app shares." />
      <Section title="Space" note="Tailwind's spacing scale is the same 4px grid: p-4 is --nish-space-4, 16px.">
        <Card padded={false} className="divide-y divide-th-line">
          {SPACE.map((s) => (
            <div key={s} className="flex items-center gap-4 px-4 py-2.5 sm:px-5">
              <code className="w-28 shrink-0 font-mono text-xs text-th-hi2">--nish-space-{s}</code>
              <span className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-th-hi3">{SCALE[`space-${s}`]}</span>
              <span className="h-3 rounded-sm bg-th-accent" style={{ width: `var(--nish-space-${s})` }} aria-hidden="true" />
            </div>
          ))}
        </Card>
      </Section>
      <Section title="Radius" note="Cards use rounded-xl, controls rounded-lg, chips rounded-full.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {RADII.map((r) => (
            <div key={r} className="space-y-2">
              <div className="flex h-20 items-center justify-center border border-th-line-strong bg-th-elevated" style={{ borderRadius: `var(--nish-radius-${r})` }}>
                <span className="font-mono text-xs text-th-hi2">{SCALE[`radius-${r}`]}</span>
              </div>
              <code className="block text-center font-mono text-xs text-th-hi3">--nish-radius-{r}</code>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Layout">
        <Card padded={false} className="divide-y divide-th-line">
          {[
            ['page-max', 'Content width of a page: max-w-[var(--nish-page-max)]'],
            ['gutter', 'Side padding on phones'],
            ['tap-min', 'Minimum tap target on touch screens; controls grow to it with pointer-coarse:'],
            ['focus-width', 'Focus ring width'],
            ['focus-offset', 'Focus ring offset'],
          ].map(([k, d]) => (
            <div key={k} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
              <code className="w-36 font-mono text-sm text-th-hi">--nish-{k}</code>
              <span className="w-16 font-mono text-sm tabular-nums text-th-accent">{SCALE[k]}</span>
              <span className="min-w-0 flex-1 basis-60 text-sm text-th-hi2">{d}</span>
            </div>
          ))}
        </Card>
      </Section>
    </div>
  );
}

function Curve({ ease }: { ease: string }) {
  const [x1, y1, x2, y2] = (SCALE[ease].match(/[\d.]+/g) ?? []).map(Number);
  const p = (x: number, y: number) => `${8 + x * 104},${112 - y * 104}`;
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0" aria-hidden="true">
      <rect x="8" y="8" width="104" height="104" fill="none" stroke="var(--nish-line)" />
      <path d={`M${p(0, 0)} L${p(x1, y1)} M${p(1, 1)} L${p(x2, y2)}`} stroke="var(--nish-ghost)" strokeDasharray="3 3" />
      <path d={`M${p(0, 0)} C${p(x1, y1)} ${p(x2, y2)} ${p(1, 1)}`} fill="none" stroke="var(--nish-accent)" strokeWidth="2.5" />
    </svg>
  );
}

export function ElevationPage() {
  const [played, setPlayed] = useState(false);
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Foundations"
        title="Shadows & motion"
        lead="Three shadows built on the scrim color, so the same recipe is faint on dark themes and soft on light ones. Two easings and two durations for everything that moves."
      />
      <Section title="Shadows">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['card', 'Cards and panels'],
            ['pop', 'Popovers, tooltips, toasts'],
            ['modal', 'Dialogs and drawers'],
          ].map(([k, d]) => (
            <div key={k} className="space-y-3 rounded-xl bg-th-bg p-5">
              <div className="flex h-24 items-center justify-center rounded-xl border border-th-line bg-th-surface" style={{ boxShadow: `var(--nish-shadow-${k})` }}>
                <span className="text-sm font-medium text-th-hi">{d}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Pill>shadow-{k}</Pill>
                <Pill>--nish-shadow-{k}</Pill>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Easing and duration" note="Under prefers-reduced-motion, base.css cuts every animation and transition to 1ms.">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['ease-out', 'Things arriving: panels, toasts, sheets'],
            ['ease-in-out', 'Things moving from one place to another'],
          ].map(([e, d]) => (
            <Card key={e} className="flex items-center gap-4">
              <Curve ease={e} />
              <div className="min-w-0 space-y-1">
                <p className="font-mono text-sm font-medium text-th-hi">--nish-{e}</p>
                <p className="text-sm text-th-hi2">{d}</p>
                <code className="block break-words font-mono text-xs text-th-hi3">{SCALE[e]}</code>
              </div>
            </Card>
          ))}
        </div>
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>--nish-dur-fast {SCALE['dur-fast']}</Badge>
              <Badge>--nish-dur-med {SCALE['dur-med']}</Badge>
            </div>
            <Button size="sm" variant="primary" onClick={() => setPlayed((p) => !p)}>
              {played ? 'Reset' : 'Play'}
            </Button>
          </div>
          {(['fast', 'med'] as const).map((d) => (
            <div key={d} className="relative h-8 rounded-full bg-th-elevated">
              <span
                className="absolute top-1 size-6 rounded-full bg-th-accent"
                style={{
                  left: played ? 'calc(100% - 1.75rem)' : '0.25rem',
                  transition: `left var(--nish-dur-${d}) var(--nish-ease-out)`,
                }}
                aria-hidden="true"
              />
            </div>
          ))}
        </Card>
        <CodeBlock
          title="Tailwind and CSS"
          code={`<div className="animate-rise-in" />          {/* nish-rise-in, dur-fast, ease-out */}
<div className="transition-colors ease-nish" />

.sheet { transition: transform var(--nish-dur-med) var(--nish-ease-out); }`}
        />
      </Section>
    </div>
  );
}

const Z = ['base', 'sticky', 'dropdown', 'modal', 'toast', 'tooltip'];
const Z_USE: Record<string, string> = {
  base: 'Page content',
  sticky: 'Sticky headers and table heads',
  dropdown: 'Menus and popovers',
  modal: 'Modal and drawer, with its scrim',
  toast: 'The toast stack, above dialogs',
  tooltip: 'Tooltips, above everything',
};
const BPS = ['sm', 'md', 'lg', 'xl'];

export function ZIndexPage() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const active = BPS.filter((b) => w >= parseInt(SCALE[`bp-${b}`]));
  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Foundations" title="Z-index & breakpoints" lead="One stacking order for every app, so a toast is never under a modal and a tooltip is never under a toast." />
      <Section title="Stacking order">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative h-72" aria-hidden="true">
            {Z.map((z, i) => (
              <div
                key={z}
                className="absolute flex h-16 w-[62%] items-start justify-between rounded-xl border border-th-line-strong bg-th-surface px-3 py-2 shadow-pop"
                style={{ left: `${i * 7.5}%`, top: `${(Z.length - 1 - i) * 40}px`, zIndex: Number(SCALE[`z-${z}`]) }}
              >
                <span className="text-xs font-semibold text-th-hi">{z}</span>
                <span className="font-mono text-xs text-th-accent">{SCALE[`z-${z}`]}</span>
              </div>
            ))}
          </div>
          <Card padded={false} className="divide-y divide-th-line self-start">
            {[...Z].reverse().map((z) => (
              <div key={z} className="flex items-baseline gap-3 px-4 py-2.5">
                <code className="w-32 shrink-0 font-mono text-xs text-th-hi">--nish-z-{z}</code>
                <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-th-accent">{SCALE[`z-${z}`]}</span>
                <span className="min-w-0 text-sm text-th-hi2">{Z_USE[z]}</span>
              </div>
            ))}
          </Card>
        </div>
      </Section>
      <Section
        title="Breakpoints"
        note={
          <>
            Tailwind&apos;s defaults, also exported as tokens for JS (CSS variables cannot drive <code className="inline">@media</code>). This window is{' '}
            <strong className="font-semibold text-th-hi">{w}px</strong> wide.
          </>
        }
      >
        <Card className="space-y-4">
          <div className="relative h-10 rounded-lg bg-th-elevated">
            {BPS.map((b) => {
              const px = parseInt(SCALE[`bp-${b}`]);
              return (
                <div key={b} className="absolute inset-y-0 border-l border-th-line-strong" style={{ left: `${(px / 1536) * 100}%` }}>
                  <span className="absolute left-1.5 top-1 font-mono text-[11px] text-th-hi2">{b}</span>
                </div>
              );
            })}
            <div className="absolute inset-y-0 left-0 rounded-l-lg bg-th-accent-soft" style={{ width: `${Math.min(100, (w / 1536) * 100)}%` }} aria-hidden="true" />
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {BPS.map((b) => (
              <div key={b} className="flex items-center justify-between rounded-lg border border-th-line px-3 py-2">
                <span className="font-mono text-sm text-th-hi">
                  {b}: {SCALE[`bp-${b}`]}
                </span>
                {active.includes(b) ? <Badge tone="ok">on</Badge> : <Badge>off</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <CodeBlock
          title="in JS"
          code={`import { SCALE } from '@nish/ui';
const wide = matchMedia(\`(min-width: \${SCALE['bp-md']})\`).matches;`}
        />
        <Prose>
          <p>
            Prefer <code>pointer-coarse:</code> over a width breakpoint for touch sizing: a narrow desktop window still has a mouse, and a wide tablet still
            has fingers.
          </p>
        </Prose>
      </Section>
    </div>
  );
}
