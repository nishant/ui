import { useState } from 'react';
import { Button, Card, cn, SCALE } from '../../src';
// Straight from the tokens until src/index.ts re-exports HUE_ROLES (LANE.md).
import { HUE_ROLES } from '../../src';
import type { ComponentDoc } from './types';

// --- Base utilities: hue tints, small type, radii and the base.css helpers -----------

const HUE_LABEL: Record<string, string> = {
  emerald: 'Groceries',
  indigo: 'Travel',
  amber: 'Bills',
  lime: 'Garden',
  rose: 'Health',
  sky: 'Work',
  violet: 'Music',
  teal: 'Home',
};

// Written out so Tailwind sees every class (it cannot read built names).
const HUE_CHIP: Record<string, string> = {
  emerald: 'bg-th-emerald-soft text-th-emerald border-th-emerald/30',
  indigo: 'bg-th-indigo-soft text-th-indigo border-th-indigo/30',
  amber: 'bg-th-amber-soft text-th-amber border-th-amber/30',
  lime: 'bg-th-lime-soft text-th-lime border-th-lime/30',
  rose: 'bg-th-rose-soft text-th-rose border-th-rose/30',
  sky: 'bg-th-sky-soft text-th-sky border-th-sky/30',
  violet: 'bg-th-violet-soft text-th-violet border-th-violet/30',
  teal: 'bg-th-teal-soft text-th-teal border-th-teal/30',
};
const HUE_TILE: Record<string, string> = {
  emerald: 'bg-th-emerald-soft text-th-emerald',
  indigo: 'bg-th-indigo-soft text-th-indigo',
  amber: 'bg-th-amber-soft text-th-amber',
  lime: 'bg-th-lime-soft text-th-lime',
  rose: 'bg-th-rose-soft text-th-rose',
  sky: 'bg-th-sky-soft text-th-sky',
  violet: 'bg-th-violet-soft text-th-violet',
  teal: 'bg-th-teal-soft text-th-teal',
};

const HueChips = () => (
  <div className="flex flex-wrap gap-2">
    {HUE_ROLES.map((h) => (
      <span key={h} className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', HUE_CHIP[h])}>
        {HUE_LABEL[h]}
      </span>
    ))}
  </div>
);

const HueTiles = () => (
  <div className="grid w-full grid-cols-4 gap-2">
    {HUE_ROLES.map((h) => (
      <div key={h} className="flex flex-col items-center gap-1.5">
        <span className={cn('flex size-10 items-center justify-center rounded-xl text-sm font-bold', HUE_TILE[h])} aria-hidden="true">
          {h[0].toUpperCase()}
        </span>
        <span className="text-2xs text-th-hi2">{h}</span>
      </div>
    ))}
  </div>
);

const SmallType = () => (
  <div className="w-full space-y-2">
    {(
      [
        ['text-xs', 'text-xs text-th-hi'],
        ['text-2xs', 'text-2xs text-th-hi'],
        ['text-3xs', 'text-3xs text-th-hi'],
      ] as const
    ).map(([name, cls]) => (
      <div key={name} className="flex items-baseline gap-3">
        <code className="w-20 shrink-0 font-mono text-xs text-th-hi3">{name}</code>
        <span className={cls}>Last sync 2 min ago · 14 widgets</span>
        <span className="ml-auto font-mono text-2xs tabular-nums text-th-hi3">
          {name === 'text-xs' ? '12px' : SCALE[`${name}`]}
        </span>
      </div>
    ))}
  </div>
);

const RADII = [
  ['Controls', 'rounded-lg', 'radius-sm', 'rounded-lg'],
  ['Cards', 'rounded-xl', 'radius-card', 'rounded-xl'],
  ['Dialogs', 'rounded-2xl', '16px', 'rounded-2xl'],
  ['Pills', 'rounded-full', 'radius-pill', 'rounded-full'],
] as const;

const Radii = () => (
  <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
    {RADII.map(([what, cls, token, round]) => (
      <div key={what} className="space-y-1.5 text-center">
        <div className={cn('flex h-14 items-center justify-center border border-th-line-strong bg-th-elevated', round)}>
          <span className="text-xs font-medium text-th-hi2">{what}</span>
        </div>
        <code className="block font-mono text-2xs text-th-hi3">
          {cls} · {token.startsWith('radius') ? `--nish-${token}` : token}
        </code>
      </div>
    ))}
  </div>
);

function SlideIn() {
  const [run, setRun] = useState(0);
  return (
    <div className="w-full space-y-3">
      <div className="relative h-20 overflow-hidden rounded-lg border border-th-line bg-th-bg">
        <div key={`r${run}`} className="absolute inset-y-0 right-0 w-1/2 animate-slide-in-right border-l border-th-line bg-th-elevated p-2 text-xs text-th-hi2">
          slide-in-right
        </div>
        <div key={`l${run}`} className="absolute inset-y-0 left-0 w-2/5 animate-slide-in-left border-r border-th-line bg-th-surface p-2 text-xs text-th-hi2">
          slide-in-left
        </div>
      </div>
      <Button size="sm" variant="secondary" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  );
}

export const baseUtilities: ComponentDoc & { source: string } = {
  id: 'base-utilities',
  name: 'Base utilities',
  exports: [],
  source: 'src/css/base.css',
  summary:
    'The small shared pieces under every component: hue tints, the two dense type sizes, the canonical radii, and the base.css helpers (skip link, kbd, scrollbar-none, drawer keyframes). Tailwind apps and static pages get the same ones.',
  importLine: "@import '@nish/ui/tailwind.css';  /* or <link rel=\"stylesheet\" href=\"nish/nish.css\"> */",
  controls: [{ key: 'part', label: 'Show', type: 'select', options: ['hue tints', 'small type', 'radii', 'kbd'] }],
  initial: { part: 'hue tints' },
  render: (a) =>
    a.part === 'small type' ? (
      <SmallType />
    ) : a.part === 'radii' ? (
      <Radii />
    ) : a.part === 'kbd' ? (
      <p className="text-sm text-th-hi2">
        Press <kbd>⌘</kbd> <kbd>K</kbd> to search.
      </p>
    ) : (
      <HueChips />
    ),
  code: (a) =>
    a.part === 'small type'
      ? '<span className="text-2xs text-th-hi3">Last sync 2 min ago</span>'
      : a.part === 'radii'
        ? '<div className="rounded-xl" />  /* card: --nish-radius-card */'
        : a.part === 'kbd'
          ? '<kbd>⌘</kbd> <kbd>K</kbd>'
          : '<span className="rounded-full border border-th-sky/30 bg-th-sky-soft text-th-sky">Work</span>',
  stories: [
    {
      id: 'hue-chips',
      name: 'Hue tints: tags',
      note: 'bg-th-<hue>-soft with the hue as text and a /30 border, the Badge recipe for colors with no meaning.',
      wide: true,
      render: () => <HueChips />,
    },
    {
      id: 'hue-tiles',
      name: 'Hue tints: tiles and icons',
      note: 'The hub tile icon and calendar-dot look.',
      render: () => <HueTiles />,
    },
    {
      id: 'hue-hi',
      name: 'hi text on a hue tint',
      render: () => (
        <div className="grid w-full gap-1.5">
          {HUE_ROLES.slice(0, 4).map((h) => (
            <div key={h} className={cn('rounded-lg px-3 py-2 text-sm text-th-hi', HUE_TILE[h].split(' ')[0])}>
              {HUE_LABEL[h]}: 3 items due this week
            </div>
          ))}
        </div>
      ),
    },
    { id: 'small-type', name: 'text-2xs and text-3xs', note: 'Dense UI only: widget chrome, table meta, hints. Never body text.', wide: true, render: () => <SmallType /> },
    { id: 'radii', name: 'Radii', note: 'Use these four. Tailwind’s rounded-* scale is unchanged.', wide: true, render: () => <Radii /> },
    {
      id: 'kbd',
      name: 'kbd',
      render: () => (
        <div className="space-y-2 text-sm text-th-hi2">
          <p>
            Press <kbd>?</kbd> for shortcuts, <kbd>Esc</kbd> to close.
          </p>
          <p className="text-xs">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
          </p>
        </div>
      ),
    },
    {
      id: 'skip-link',
      name: 'Skip link',
      note: 'Tab into this story: the link appears at the top left of the window.',
      render: () => (
        <div className="space-y-2 text-sm text-th-hi2">
          <a className="nish-skip-link" href="#main">
            Skip to content
          </a>
          <p>
            <code className="font-mono text-xs">{'<a class="nish-skip-link" href="#main">Skip to content</a>'}</code>
          </p>
        </div>
      ),
    },
    {
      id: 'scrollbar-none',
      name: 'scrollbar-none',
      note: 'Scrolls sideways with no scrollbar: tab strips and chip rows.',
      render: () => (
        <div className="scrollbar-none flex w-full gap-2 overflow-x-auto rounded-lg border border-th-line p-2">
          {['All', 'Open', 'Applied', 'Interview', 'Offer', 'Rejected', 'Archived', 'Starred', 'Remote'].map((t) => (
            <span key={t} className="shrink-0 rounded-full border border-th-line bg-th-elevated px-3 py-1 text-xs text-th-hi2">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    { id: 'slide-in', name: 'Drawer keyframes', note: 'animate-slide-in-right and animate-slide-in-left (Tailwind), or the nish-slide-in-* keyframes.', render: () => <SlideIn /> },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-th-hi">Watchlist</p>
            <span className="text-2xs text-th-hi3">
              Updated 2 min ago · <kbd>R</kbd> to refresh
            </span>
          </div>
          <HueChips />
          <div className="border-t pt-3 text-xs text-th-hi3">A bare border uses --nish-line, the Tailwind base default.</div>
        </Card>
      ),
    },
  ],
  usage: `// Tailwind apps
<span className="rounded-full border border-th-teal/30 bg-th-teal-soft px-2 text-xs text-th-teal">Home</span>
<span className="text-2xs text-th-hi3">{updatedAgo}</span>

/* Static pages */
.tile-icon { background: var(--nish-teal-soft); color: var(--nish-teal); border-radius: var(--nish-radius-card); }

<a class="nish-skip-link" href="#main">Skip to content</a>
<nav class="scrollbar-none">…</nav>
<kbd>Esc</kbd>`,
  guidelines: [
    'Hue tints are for colors with no meaning (tags, stores, tiles). Status uses the status soft tints (ok, loss, warn, info, accent).',
    'Never hand-mix a tint in an app (bg-th-sky/10): use th-<hue>-soft, and /30 for a border on a tint.',
    'text-2xs (11px) and text-3xs (10px) are for dense chrome only; cn() keeps a th-* color next to them.',
    'Cards use rounded-xl (--nish-radius-card, 12px), controls rounded-lg, dialogs rounded-2xl, pills rounded-full.',
    'The Tailwind base sets the default border color to --nish-line and a pointer cursor on enabled buttons, so apps can drop their own copies of both rules.',
  ],
};
