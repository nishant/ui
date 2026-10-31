import { useEffect, useState } from 'react';
import { PRESETS, readToken, THEMES, useTheme } from '../../src';
import { mix } from '../../tools/contrast-rules.mjs';
import { CodeBlock } from '../lib/code';
import { PageHeader, Prose, Section } from '../lib/ui';

interface Role {
  role: string;
  purpose: string;
  /** The Tailwind class people reach for first. */
  cls: string;
  soft?: boolean;
}

const GROUPS: { title: string; note: string; roles: Role[] }[] = [
  {
    title: 'Surfaces and lines',
    note: 'Layers from the page back to the deepest chip. Each step is a little lighter in dark themes and a little darker in light ones.',
    roles: [
      { role: 'bg', purpose: 'Page background', cls: 'bg-th-bg' },
      { role: 'surface', purpose: 'Cards, panels, table bodies', cls: 'bg-th-surface' },
      { role: 'elevated', purpose: 'Popovers, hovered rows, inputs, raised things inside cards', cls: 'bg-th-elevated' },
      { role: 'overlay', purpose: 'The deepest layer: chips inside raised things, skeleton sheen', cls: 'bg-th-overlay' },
      { role: 'line', purpose: 'Borders and dividers', cls: 'border-th-line' },
      { role: 'line-strong', purpose: 'Input borders, outlines that are not the accent', cls: 'border-th-line-strong' },
    ],
  },
  {
    title: 'Text',
    note: 'hi through hi3 all clear 4.5:1 on bg and surface. ghost is for placeholders, disabled text and decorative icons only.',
    roles: [
      { role: 'hi', purpose: 'Primary text, headings, numbers', cls: 'text-th-hi' },
      { role: 'hi2', purpose: 'Secondary text, body copy', cls: 'text-th-hi2' },
      { role: 'hi3', purpose: 'Tertiary text, labels, metadata', cls: 'text-th-hi3' },
      { role: 'ghost', purpose: 'Placeholders, disabled, decorative icons (not body text)', cls: 'text-th-ghost' },
    ],
  },
  {
    title: 'Accents',
    note: 'The accent is links, primary buttons, active nav and the focus ring.',
    roles: [
      { role: 'accent', purpose: 'Links, primary buttons, active nav, focus ring', cls: 'text-th-accent' },
      { role: 'accent-soft', purpose: 'Accent at 14%: selected rows, active nav, accent badges', cls: 'bg-th-accent-soft', soft: true },
      { role: 'accent2', purpose: 'A second accent for paired highlights', cls: 'text-th-accent2' },
      // eslint-disable-next-line nish/no-legacy-th-alias -- `focus` is a real role (th-colors.mjs); the rule's legacy list also matches it
      { role: 'focus', purpose: 'Keyboard focus ring (follows accent)', cls: 'ring-th-focus' },
    ],
  },
  {
    title: 'Status',
    note: 'Text-safe status colors: 4.5:1 on bg and surface, and on their own soft tint.',
    roles: [
      { role: 'ok', purpose: 'Success, gains, healthy', cls: 'text-th-ok' },
      { role: 'loss', purpose: 'Errors, losses, destructive', cls: 'text-th-loss' },
      { role: 'warn', purpose: 'Warnings, pending', cls: 'text-th-warn' },
      { role: 'info', purpose: 'Neutral notices', cls: 'text-th-info' },
      { role: 'ok-soft', purpose: 'ok at 14%: badges and banners', cls: 'bg-th-ok-soft', soft: true },
      { role: 'loss-soft', purpose: 'loss at 14%', cls: 'bg-th-loss-soft', soft: true },
      { role: 'warn-soft', purpose: 'warn at 14%', cls: 'bg-th-warn-soft', soft: true },
      { role: 'info-soft', purpose: 'info at 14%', cls: 'bg-th-info-soft', soft: true },
    ],
  },
  {
    title: 'Fills',
    note: 'For bars, meters, dots and chart lines. In light themes they are brighter than the text versions, which look muddy as large fills. Dark themes use the same color for both.',
    roles: [
      { role: 'ok-fill', purpose: 'Healthy bars, gain columns', cls: 'bg-th-ok-fill' },
      { role: 'loss-fill', purpose: 'Error bars, loss columns', cls: 'bg-th-loss-fill' },
      { role: 'warn-fill', purpose: 'Warning meters', cls: 'bg-th-warn-fill' },
      { role: 'info-fill', purpose: 'Neutral bars and progress', cls: 'bg-th-info-fill' },
    ],
  },
  {
    title: 'On colors',
    note: 'Text and icons on a solid fill. Each clears 4.5:1 on its fill in every theme.',
    roles: [
      { role: 'on-accent', purpose: 'On bg-th-accent: primary buttons', cls: 'text-th-on-accent' },
      { role: 'on-accent2', purpose: 'On bg-th-accent2', cls: 'text-th-on-accent2' },
      { role: 'on-ok', purpose: 'On bg-th-ok-fill', cls: 'text-th-on-ok' },
      { role: 'on-loss', purpose: 'On bg-th-loss-fill and bg-th-loss: danger buttons', cls: 'text-th-on-loss' },
      { role: 'on-warn', purpose: 'On bg-th-warn-fill', cls: 'text-th-on-warn' },
      { role: 'on-info', purpose: 'On bg-th-info-fill', cls: 'text-th-on-info' },
    ],
  },
  {
    title: 'Scrim and inverted',
    note: 'The modal backdrop tone, and an inverted pill for a today marker or an active segment.',
    roles: [
      { role: 'scrim', purpose: 'Modal and drawer backdrop (used at 60%)', cls: 'bg-th-scrim/60' },
      { role: 'invert-bg', purpose: 'Inverted pill background', cls: 'bg-th-invert-bg' },
      { role: 'invert-text', purpose: 'Text on the inverted pill', cls: 'text-th-invert-text' },
    ],
  },
];

const ON_PAIRS: [string, string][] = [
  ['on-accent', 'accent'],
  ['on-accent2', 'accent2'],
  ['on-ok', 'ok-fill'],
  ['on-loss', 'loss-fill'],
  ['on-warn', 'warn-fill'],
  ['on-info', 'info-fill'],
];

const CHART = Array.from({ length: 8 }, (_, i) => `chart-${i + 1}`);
const HUES = ['emerald', 'indigo', 'amber', 'lime', 'rose', 'sky', 'violet', 'teal'];
/** The light chart series before the unreleased change, to show what moved. */
const OLD_LIGHT_CHART = ['#4f46e5', '#047857', '#b45309', '#be123c', '#0369a1', '#7e22ce', '#c2410c', '#4d7c0f'];

/** Live values from the page, re-read whenever the theme changes. */
function useTokens(names: string[]): Record<string, string> {
  const { theme } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
    setValues(Object.fromEntries(names.map((n) => [n, readToken(n)])));
  }, [theme]);
  return values;
}

function value(role: Role, live: Record<string, string>, colors: Record<string, string>): string {
  if (role.soft) {
    const base = role.role.replace(/-soft$/, '');
    return `${base} 14% ≈ ${mix(colors[base], colors.surface, 0.14)} on surface`;
  }
  return live[role.role] || colors[role.role] || '';
}

function RoleRow({ r, live, colors }: { r: Role; live: Record<string, string>; colors: Record<string, string> }) {
  const sw = r.role.startsWith('on-') ? ON_PAIRS.find(([f]) => f === r.role)?.[1] : null;
  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-4 py-3 md:grid-cols-[2.75rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <span
        className="row-span-2 flex size-11 items-center justify-center rounded-lg border border-th-line text-sm font-semibold md:row-span-1"
        style={sw ? { background: `var(--nish-${sw})`, color: `var(--nish-${r.role})` } : { background: `var(--nish-${r.role})` }}
        aria-hidden="true"
      >
        {sw ? <span className="doc-sample" data-sample="Aa" /> : null}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-sm font-medium text-th-hi">{r.role}</p>
        <p className="text-xs text-th-hi2">{r.purpose}</p>
      </div>
      <div className="col-start-2 flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 md:contents">
        <code className="min-w-0 break-all font-mono text-xs text-th-hi2">--nish-{r.role}</code>
        <code className="min-w-0 break-all font-mono text-xs text-th-info">{r.cls}</code>
        <code className="min-w-0 break-all font-mono text-xs text-th-hi">{value(r, live, colors)}</code>
      </div>
    </li>
  );
}

export function ColorPage() {
  const { theme } = useTheme();
  const label = PRESETS.find((p) => p.id === theme)?.label;
  const colors = THEMES[theme as keyof typeof THEMES]?.colors ?? THEMES.dark.colors;
  const live = useTokens([...GROUPS.flatMap((g) => g.roles.map((r) => r.role)), ...CHART, ...HUES]);

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Foundations"
        title="Color"
        lead={
          <>
            Colors are roles, not hues: pick what a color is for, and every theme fills it in. Each role is a CSS variable (
            <code className="inline">--nish-surface</code>) and a Tailwind class (<code className="inline">bg-th-surface</code>). Values below are live
            for the current theme, {label}; switch themes in the header to see them change.
          </>
        }
      />

      {GROUPS.map((g) => (
        <Section key={g.title} title={g.title} note={g.note}>
          <div className="overflow-hidden rounded-xl border border-th-line bg-th-surface">
            <div className="hidden grid-cols-[2.75rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 border-b border-th-line bg-th-elevated/50 px-4 py-2 text-xs font-medium text-th-hi3 md:grid">
              <span />
              <span>Role</span>
              <span>CSS variable</span>
              <span>Tailwind</span>
              <span>Value in {label}</span>
            </div>
            <ul className="divide-y divide-th-line">
              {g.roles.map((r) => (
                <RoleRow key={r.role} r={r} live={live} colors={colors} />
              ))}
            </ul>
          </div>
        </Section>
      ))}

      <Section
        title="Chart series"
        note="Eight categorical colors, ordered so neighbors never share a hue family. Each clears 3:1 on bg, surface and elevated. Read them in canvas code with readToken('chart-1')."
      >
        <div className="overflow-hidden rounded-xl border border-th-line bg-th-surface">
          <div className="grid grid-cols-2 gap-px bg-th-line sm:grid-cols-4">
            {CHART.map((c, i) => (
              <div key={c} className="bg-th-surface p-3">
                <svg viewBox="0 0 120 36" className="h-9 w-full" aria-hidden="true">
                  <polyline
                    fill="none"
                    stroke={`var(--nish-${c})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={Array.from({ length: 12 }, (_, x) => `${x * 10.5 + 2},${18 + Math.sin(x * (0.6 + i * 0.25) + i) * 12}`).join(' ')}
                  />
                </svg>
                <div className="mt-2 flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded-sm" style={{ background: `var(--nish-${c})` }} aria-hidden="true" />
                  <code className="font-mono text-xs text-th-hi">{c}</code>
                </div>
                <code className="mt-0.5 block font-mono text-xs text-th-hi2">{live[c]}</code>
                <code className="block font-mono text-xs text-th-hi3">stroke-th-{c}</code>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-th-line bg-th-surface p-4">
          <p className="text-sm font-semibold text-th-hi">Brighter light series (unreleased)</p>
          <p className="mt-1 text-sm text-th-hi2">
            The light theme&apos;s series used to be text-dark shades; chart-3 read as rust brown on a line. Chart marks need 3:1, not 4.5, so each moved to
            the most vivid shade of its hue that still clears 3:1 on bg, surface and elevated. Shown on the light surface:
          </p>
          <div className="mt-3 space-y-1.5 rounded-lg p-3" style={{ background: THEMES.light.colors.surface }}>
            {[OLD_LIGHT_CHART, CHART.map((c) => THEMES.light.colors[c])].map((row, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-12 shrink-0 text-xs font-medium" style={{ color: THEMES.light.colors.hi2 }}>
                  {i === 0 ? 'Before' : 'After'}
                </span>
                {row.map((hex, j) => (
                  <span key={j} className="h-6 flex-1 rounded" style={{ background: hex }} title={hex} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Hues" note="Named colors for tile accents, tags and avatars, when a color needs no meaning. Each clears 4.5:1 on its own 14% tint.">
        <div className="flex flex-wrap gap-2">
          {HUES.map((h) => (
            <span
              key={h}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
              style={{
                color: `var(--nish-${h})`,
                borderColor: `color-mix(in srgb, var(--nish-${h}) 35%, transparent)`,
                background: `color-mix(in srgb, var(--nish-${h}) 14%, transparent)`,
              }}
            >
              {h}
              <code className="font-mono text-xs">{live[h]}</code>
            </span>
          ))}
        </div>
        <Prose>
          <p>
            Classes: <code>text-th-emerald</code>, <code>bg-th-rose/15</code>. Variables: <code>var(--nish-sky)</code>.
          </p>
        </Prose>
      </Section>

      <Section title="Using them">
        <CodeBlock
          title="Tailwind"
          code={`<div className="rounded-xl border border-th-line bg-th-surface p-4">
  <p className="text-th-hi">Sony WH-1000XM6</p>
  <p className="text-sm text-th-hi3">Best Buy · checked 12 minutes ago</p>
  <span className="rounded-full bg-th-ok-soft px-2 text-xs text-th-ok">-$50.00</span>
  <div className="h-1.5 rounded-full bg-th-elevated">
    <div className="h-full w-2/3 rounded-full bg-th-ok-fill" />
  </div>
</div>

{/* opacity modifiers work: */}
<tr className="hover:bg-th-elevated/50" />`}
        />
        <CodeBlock
          title="CSS and canvas"
          code={`.price { color: var(--nish-hi); }
.drop  { color: var(--nish-ok); background: var(--nish-ok-soft); }

import { readToken, onThemeChange } from '@nish/ui';
const draw = () => chart.update({ line: readToken('chart-1'), grid: readToken('line') });
onThemeChange(draw);`}
        />
      </Section>
    </div>
  );
}
