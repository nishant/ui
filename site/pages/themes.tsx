import { useMemo, useState } from 'react';
import { Badge, cn, PRESETS, THEMES, useTheme, type ThemeName } from '../../src';
import { checkTheme, ON_FILL, ratio, RULES, TEXT, UI } from '../../tools/contrast-rules.mjs';
import { CodeBlock } from '../lib/code';
import { PageHeader, Prose, Section, ThemeScope } from '../lib/ui';

const SWATCHES = ['bg', 'surface', 'elevated', 'overlay', 'line', 'hi', 'hi2', 'hi3', 'accent', 'accent2', 'ok', 'loss', 'warn', 'info'];
const FOREGROUNDS = ['hi', 'hi2', 'hi3', 'ghost', 'accent', 'accent2', 'ok', 'loss', 'warn', 'info'];
const BACKGROUNDS = ['bg', 'surface', 'elevated', 'overlay'];

const colorsOf = (t: ThemeName) => THEMES[t as keyof typeof THEMES].colors;

/** The minimum CI enforces for a pair, or null when the pair is not used together. */
function required(fg: string, bg: string): number | null {
  let min: number | null = null;
  for (const [f, bgs, m] of RULES) if (f === fg && bgs.includes(bg)) min = Math.max(min ?? 0, m);
  return min;
}

const grade = (r: number) => (r >= 7 ? 'AAA' : r >= TEXT ? 'AA' : r >= UI ? 'AA large' : 'Fail');

function ThemeCard({ id }: { id: ThemeName }) {
  const p = PRESETS.find((x) => x.id === id)!;
  const results = checkTheme(p.colors);
  const failing = results.filter((r) => !r.pass).length;
  return (
    <ThemeScope theme={id} className="overflow-hidden rounded-xl border border-th-line">
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-th-hi">{p.label}</p>
            <p className="font-mono text-xs text-th-hi3">
              data-theme=&quot;{id}&quot; · {p.scheme}
            </p>
          </div>
          <Badge tone={failing ? 'loss' : 'ok'}>{failing ? `${failing} failing` : `${results.length} pairs pass`}</Badge>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {SWATCHES.map((r) => (
            <div key={r} className="min-w-0">
              <div className="aspect-square rounded-md border border-th-line" style={{ background: `var(--nish-${r})` }} title={`${r} ${p.colors[r]}`} />
              <p className="mt-1 truncate text-center font-mono text-[10px] text-th-hi3">{r}</p>
            </div>
          ))}
        </div>
        <div className="flex h-2 overflow-hidden rounded-full">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="flex-1" style={{ background: `var(--nish-chart-${i + 1})` }} />
          ))}
        </div>
        <div className="rounded-lg border border-th-line bg-th-surface p-3 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-th-hi">AMD Nov 20 $180 C</p>
            <span className="text-sm font-semibold tabular-nums text-th-ok">+$190.00</span>
          </div>
          <p className="text-xs text-th-hi3">2 contracts · 26 days left</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Badge tone="accent">Pinned</Badge>
            <Badge tone="warn">Earnings Oct 28</Badge>
          </div>
        </div>
      </div>
    </ThemeScope>
  );
}

function Cell({ fg, bg, colors }: { fg: string; bg: string; colors: Record<string, string> }) {
  const r = ratio(colors[fg], colors[bg]);
  const min = required(fg, bg);
  const pass = min == null ? null : r >= min;
  return (
    <td className="p-1">
      <div className={cn('rounded-lg border p-2', pass === false ? 'border-th-loss' : 'border-th-line')}>
        <div className="flex h-9 items-center justify-center rounded-md text-lg font-semibold" style={{ background: colors[bg], color: colors[fg] }}>
          <span className="doc-sample" data-sample="Aa" aria-hidden="true" />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="font-mono text-xs tabular-nums text-th-hi">{r.toFixed(2)}</span>
          {min == null ? (
            <span className="text-[11px] text-th-hi3">{grade(r)}</span>
          ) : (
            <span className={cn('text-[11px] font-semibold', pass ? 'text-th-ok' : 'text-th-loss')}>
              {pass ? '✓' : '✗'} {min}
            </span>
          )}
        </div>
      </div>
    </td>
  );
}

function Matrix({ theme }: { theme: ThemeName }) {
  const colors = colorsOf(theme);
  const results = useMemo(() => checkTheme(colors), [colors]);
  const fails = results.filter((r) => !r.pass);
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-th-line bg-th-surface">
        <table className="w-full min-w-[620px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Contrast of each text color on each background in {theme}</caption>
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-th-hi3">Text \ background</th>
              {BACKGROUNDS.map((b) => (
                <th key={b} className="px-2 py-2 text-left font-mono text-xs font-medium text-th-hi2">
                  {b} <span className="text-th-hi3">{colors[b]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FOREGROUNDS.map((f) => (
              <tr key={f}>
                <th scope="row" className="whitespace-nowrap px-3 text-left font-mono text-xs font-medium text-th-hi">
                  {f}
                </th>
                {BACKGROUNDS.map((b) => (
                  <Cell key={b} fg={f} bg={b} colors={colors} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ON_FILL.map(([fg, bg]) => {
          const r = ratio(colors[fg], colors[bg]);
          return (
            <div key={fg + bg} className={cn('rounded-xl border bg-th-surface p-2.5', r >= TEXT ? 'border-th-line' : 'border-th-loss')}>
              <div className="flex h-11 items-center justify-center rounded-lg text-base font-semibold" style={{ background: colors[bg], color: colors[fg] }}>
                <span className="doc-sample" data-sample="Close position" aria-hidden="true" />
              </div>
              <p className="mt-2 truncate font-mono text-xs text-th-hi2">
                {fg} on {bg}
              </p>
              <p className="flex items-center justify-between font-mono text-xs">
                <span className="tabular-nums text-th-hi">{r.toFixed(2)}</span>
                <span className={cn('font-semibold', r >= TEXT ? 'text-th-ok' : 'text-th-loss')}>{r >= TEXT ? '✓ 4.5' : '✗ 4.5'}</span>
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-th-hi2">
        {fails.length === 0 ? (
          <>
            All <strong className="font-semibold text-th-hi">{results.length}</strong> pairs that CI checks for {theme} pass, including every role on its own
            soft tint over surface and elevated.
          </>
        ) : (
          <>
            {fails.length} of {results.length} checked pairs fail: {fails.map((f) => f.label).join(', ')}.
          </>
        )}
      </p>
    </div>
  );
}

export function ThemesPage() {
  const { theme } = useTheme();
  const [picked, setPicked] = useState<ThemeName | null>(null);
  const shown = picked ?? theme;
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Foundations"
        title="Themes"
        lead={
          <>
            Seven themes, each a full set of color roles. Dark is the default. Every preset declares whether it is dark or light, so a page limited to
            light and dark (<code className="inline">{'<html data-nish-themes="dark light">'}</code>) shows the one it is based on.
          </>
        }
      />

      <Section title="The themes" note="Each card is rendered in its own theme with a [data-theme] container.">
        <div className="grid gap-4 md:grid-cols-2">
          {PRESETS.map((p) => (
            <ThemeCard key={p.id} id={p.id} />
          ))}
        </div>
      </Section>

      <Section
        title="Contrast matrix"
        note={
          <>
            The real WCAG 2 ratio of each text color on each background, computed from the tokens. A ✓ or ✗ marks a pair CI enforces, with its minimum:
            4.5 for text, 3 for large text, icons and the placeholder color. Pairs without a mark are not meant to be used together; they show their
            grade only.
          </>
        }
      >
        <div role="radiogroup" aria-label="Theme for the matrix" className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={shown === p.id}
              onClick={() => setPicked(p.id)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors pointer-coarse:min-h-11',
                shown === p.id ? 'border-th-accent bg-th-accent-soft text-th-accent' : 'border-th-line bg-th-surface text-th-hi2 hover:text-th-hi',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Matrix theme={shown} />
      </Section>

      <Section title="Choosing a theme" note="The choice ('system' or a theme name) is shared across subdomains through one cookie.">
        <Prose>
          <p>
            <code>setThemeChoice()</code> writes <code>nish-theme</code> to a cookie on <code>.nish.software</code> and to <code>localStorage</code>.
            theme-init.js reads the cookie first, then localStorage (the only store on localhost and in Electron), then follows the OS. Pick Mocha on
            jobs.nish.software and trading.nish.software opens in Mocha.
          </p>
        </Prose>
        <CodeBlock
          title="the cookie"
          code={`nish-theme=mocha; Domain=.nish.software; Path=/; Max-Age=31536000; SameSite=Lax; Secure`}
        />
        <CodeBlock
          title="an app's own themes"
          code={`<!-- before theme-init.js, so the first paint knows them -->
<script>window.__nishExtraThemes = { rose: 'dark', paper: 'light' };</script>

// at startup, before initTheme()
import { registerThemes, initTheme } from '@nish/ui';
registerThemes({ rose: 'dark', paper: 'light' });
initTheme();

/* and style them: every --nish-* color role */
[data-theme='rose'] { --nish-bg: #1a0f12; --nish-surface: #24151a; /* … */ }`}
        />
      </Section>
    </div>
  );
}
