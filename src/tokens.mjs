// The one source of truth for every design token. scripts/build.mjs turns this into
// dist/tokens.css (--nish-* custom properties), tools/contrast.mjs checks it, and
// src/theme.ts reads PRESETS from it. Edit values here, never in generated CSS.
//
// Colors are plain hex so static pages can use them as-is; Tailwind opacity
// modifiers (bg-th-surface/50) work through color-mix in Tailwind 4.

/** Roles every theme must define. Soft tints are derived, not listed here. */
export const COLOR_ROLES = [
  'bg', // page background
  'surface', // cards, panels, table bodies
  'elevated', // popovers, hovered rows, inputs, raised things inside cards
  'overlay', // the deepest inner layer: chips inside raised things, skeleton sheen
  'line', // borders and dividers
  'line-strong', // input borders, focused outlines that are not the accent
  'hi', // primary text
  'hi2', // secondary text
  'hi3', // tertiary text, labels
  'ghost', // placeholders, disabled, decorative icons (not for body text)
  'accent', // links, primary buttons, active nav, focus ring
  'accent2', // a second accent for paired highlights and the 2nd chart series
  'on-accent', // text and icons on an accent fill
  'on-accent2', // text and icons on an accent2 fill
  'on-ok', // text and icons on a solid ok-fill
  'on-loss', // ... on loss-fill and loss (danger buttons)
  'on-warn', // ... on warn-fill
  'on-info', // ... on info-fill
  'ok', // success, gains
  'loss', // errors, losses, destructive
  'warn', // warnings, pending
  'info', // neutral notices
  'ok-fill', // status colors for bars, meters and chart lines: brighter than the
  'loss-fill', // text versions in light themes, where text-safe colors look muddy as fills
  'warn-fill',
  'info-fill',
  'scrim', // modal and drawer backdrop tone
  'invert-bg', // inverted pill (today marker, active segmented control)
  'invert-text',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
  'chart-7',
  'chart-8',
  'emerald',
  'indigo',
  'amber',
  'lime',
  'rose',
  'sky',
  'violet',
  'teal',
];

/** Tints mixed from a role over transparent, for badges, banners and soft fills. */
export const SOFT_ROLES = ['accent', 'ok', 'loss', 'warn', 'info'];

const DARK_HUES = {
  emerald: '#34d399',
  indigo: '#8b93ff',
  amber: '#fbbf24',
  lime: '#a3e635',
  rose: '#fb7185',
  sky: '#38bdf8',
  violet: '#c084fc',
  teal: '#2dd4bf',
};

const LIGHT_HUES = {
  emerald: '#046d4f',
  indigo: '#4e45e3',
  amber: '#9b4708',
  lime: '#41690d',
  rose: '#b8113a',
  sky: '#036499',
  violet: '#7e22ce',
  teal: '#0e6b64',
};

// Categorical series ordered so neighbors never share a hue family.
const DARK_CHART = ['#8b93ff', '#34d399', '#fbbf24', '#fb7185', '#38bdf8', '#c084fc', '#fb923c', '#a3e635'];
// Light series are the most vivid shades that still clear 3:1 (chart marks, not text)
// on bg, surface and elevated; darker text-safe shades read as muddy lines.
const LIGHT_CHART = ['#6366f1', '#059669', '#c96d06', '#f43f5e', '#0284c7', '#a855f7', '#ea580c', '#5a910c'];

const chart = (list) => Object.fromEntries(list.map((c, i) => [`chart-${i + 1}`, c]));

/**
 * Every theme. `scheme` is what a page that only knows light/dark falls back to.
 * The first entry is the default.
 */
export const THEMES = {
  dark: {
    label: 'Dark',
    scheme: 'dark',
    colors: {
      bg: '#0a0b0f',
      surface: '#111218',
      elevated: '#191b23',
      overlay: '#22252f',
      line: '#262935',
      'line-strong': '#3a3e4d',
      hi: '#ececf1',
      hi2: '#a8aab7',
      hi3: '#8a8d9b',
      ghost: '#6b6e7c',
      accent: '#8b93ff',
      accent2: '#c084fc',
      'on-accent': '#0a0b0f',
      ok: '#34d399',
      loss: '#f87171',
      warn: '#fbbf24',
      info: '#38bdf8',
      scrim: '#000000',
      'invert-bg': '#ececf1',
      'invert-text': '#111218',
      ...chart(DARK_CHART),
      ...DARK_HUES,
    },
  },
  light: {
    label: 'Light',
    scheme: 'light',
    colors: {
      bg: '#f7f6f3',
      surface: '#ffffff',
      elevated: '#f1f0ec',
      overlay: '#e6e4de',
      line: '#e2e0da',
      'line-strong': '#c9c6bd',
      hi: '#17171c',
      hi2: '#4f515c',
      hi3: '#666874',
      ghost: '#8a8c98',
      accent: '#4338ca',
      accent2: '#7e22ce',
      'on-accent': '#ffffff',
      // Light fills are mid-tones: white only clears 4.5:1 on loss and accent2.
      'on-accent2': '#ffffff',
      'on-ok': '#0a0a0c',
      'on-loss': '#ffffff',
      'on-warn': '#0a0a0c',
      'on-info': '#0a0a0c',
      ok: '#065f46',
      'ok-fill': '#059669',
      'loss-fill': '#dc2626',
      'warn-fill': '#c96d06',
      'info-fill': '#0284c7',
      loss: '#a91b1b',
      warn: '#92400e',
      info: '#075985',
      scrim: '#17171c',
      'invert-bg': '#17171c',
      'invert-text': '#f7f6f3',
      ...chart(LIGHT_CHART),
      ...LIGHT_HUES,
    },
  },
  slate: {
    label: 'Slate',
    scheme: 'dark',
    colors: {
      bg: '#18181b',
      surface: '#202024',
      elevated: '#2c2c32',
      overlay: '#36363d',
      line: '#3a3a42',
      'line-strong': '#52525b',
      hi: '#f4f4f5',
      hi2: '#a1a1aa',
      hi3: '#8f8f99',
      ghost: '#71717a',
      accent: '#a5b4fc',
      accent2: '#c084fc',
      'on-accent': '#18181b',
      ok: '#4ade80',
      loss: '#fda4af',
      warn: '#facc15',
      info: '#38bdf8',
      scrim: '#000000',
      'invert-bg': '#f4f4f5',
      'invert-text': '#202024',
      ...chart(['#818cf8', '#4ade80', '#facc15', '#fb7185', '#38bdf8', '#c084fc', '#fb923c', '#a3e635']),
      ...DARK_HUES,
      // Lifted so tinted chips stay readable on this theme's lighter cards.
      indigo: '#9aa1ff', rose: '#fc8395', violet: '#c792fc',
    },
  },
  terminal: {
    label: 'Terminal',
    scheme: 'dark',
    colors: {
      bg: '#050807',
      surface: '#0c110e',
      elevated: '#141c17',
      overlay: '#1c2820',
      line: '#233028',
      'line-strong': '#34483b',
      hi: '#d1fae5',
      hi2: '#8fc4a8',
      hi3: '#74a68b',
      ghost: '#4f7a62',
      accent: '#34d399',
      accent2: '#2dd4bf',
      'on-accent': '#050807',
      ok: '#4ade80',
      loss: '#f87171',
      warn: '#fbbf24',
      info: '#67e8f9',
      scrim: '#000000',
      'invert-bg': '#d1fae5',
      'invert-text': '#0c110e',
      ...chart(['#34d399', '#67e8f9', '#fbbf24', '#f87171', '#a3e635', '#c084fc', '#fb923c', '#2dd4bf']),
      ...DARK_HUES,
    },
  },
  mocha: {
    label: 'Mocha',
    scheme: 'dark',
    colors: {
      bg: '#1c1917',
      surface: '#292524',
      elevated: '#393432',
      overlay: '#44403c',
      line: '#44403c',
      'line-strong': '#57534e',
      hi: '#f5f0eb',
      hi2: '#b3ada8',
      hi3: '#a39d98',
      ghost: '#78716c',
      accent: '#fdba74',
      accent2: '#f472b6',
      'on-accent': '#1c1917',
      ok: '#4ade80',
      loss: '#fca5a5',
      warn: '#facc15',
      info: '#7dd3fc',
      scrim: '#000000',
      'invert-bg': '#f5f0eb',
      'invert-text': '#292524',
      ...chart(['#fb923c', '#4ade80', '#facc15', '#f472b6', '#7dd3fc', '#c4b5fd', '#f87171', '#bef264']),
      ...DARK_HUES,
      // Lifted so tinted chips stay readable on this theme's lighter cards.
      indigo: '#a9afff', rose: '#fc99a7', sky: '#3ebff8', violet: '#cfa2fd',
    },
  },
  ocean: {
    label: 'Ocean',
    scheme: 'dark',
    colors: {
      bg: '#020c18',
      surface: '#061528',
      elevated: '#0a243e',
      overlay: '#103658',
      line: '#123050',
      'line-strong': '#1f4a72',
      hi: '#e0f2fe',
      hi2: '#9ccde6',
      hi3: '#6fa9c6',
      ghost: '#3f7392',
      accent: '#38bdf8',
      accent2: '#a78bfa',
      'on-accent': '#020c18',
      ok: '#34d399',
      loss: '#fb7185',
      warn: '#fbbf24',
      info: '#7dd3fc',
      scrim: '#000000',
      'invert-bg': '#38bdf8',
      'invert-text': '#020c18',
      ...chart(['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#2dd4bf', '#fb923c', '#a3e635']),
      ...DARK_HUES,
    },
  },
  contrast: {
    label: 'High contrast',
    scheme: 'dark',
    colors: {
      bg: '#000000',
      surface: '#080808',
      elevated: '#141414',
      overlay: '#222222',
      line: '#4a4a4a',
      'line-strong': '#8a8a8a',
      hi: '#ffffff',
      hi2: '#d4d4d4',
      hi3: '#bdbdbd',
      ghost: '#8f8f8f',
      accent: '#ffd60a',
      accent2: '#7dd3fc',
      'on-accent': '#000000',
      ok: '#4ade80',
      loss: '#ff6b6b',
      warn: '#ffd60a',
      info: '#7dd3fc',
      scrim: '#000000',
      'invert-bg': '#ffffff',
      'invert-text': '#000000',
      ...chart(['#ffd60a', '#4ade80', '#7dd3fc', '#ff6b6b', '#c4b5fd', '#fb923c', '#f9a8d4', '#bef264']),
      ...DARK_HUES,
    },
  },
};

// Dark themes use their status colors as fills too, with the same dark ink on every
// fill; only light themes override them. tools/contrast.mjs checks each on-* color on
// its fill (4.5:1).
for (const t of Object.values(THEMES)) {
  for (const r of ['ok', 'loss', 'warn', 'info']) {
    t.colors[`${r}-fill`] ??= t.colors[r];
    t.colors[`on-${r}`] ??= t.colors['on-accent'];
  }
  t.colors['on-accent2'] ??= t.colors['on-accent'];
}

export const DEFAULT_THEME = 'dark';

/** Everything that is not a color. Same in every theme. */
export const SCALE = {
  // Inter Variable is self-hosted (fonts.css). Sites with their own display face
  // (mc's pixel font, trips' serif) set it locally and keep these for UI text.
  'font-sans': "'Inter Variable', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  'font-mono': "ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",

  'text-xs': '0.75rem',
  'text-xs-lh': '1.1rem',
  'text-sm': '0.875rem',
  'text-sm-lh': '1.35rem',
  'text-base': '1rem',
  'text-base-lh': '1.55rem',
  'text-lg': '1.125rem',
  'text-lg-lh': '1.65rem',
  'text-xl': '1.25rem',
  'text-xl-lh': '1.75rem',
  'text-2xl': '1.5rem',
  'text-2xl-lh': '2rem',
  'text-3xl': '1.875rem',
  'text-3xl-lh': '2.3rem',
  'text-4xl': '2.25rem',
  'text-4xl-lh': '2.6rem',
  'weight-normal': '400',
  'weight-medium': '500',
  'weight-semibold': '600',
  'weight-bold': '700',
  'tracking-tight': '-0.015em',
  'tracking-caps': '0.08em',

  // 4px grid
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '20px',
  'space-6': '24px',
  'space-8': '32px',
  'space-10': '40px',
  'space-12': '48px',
  'space-16': '64px',

  'radius-xs': '4px',
  'radius-sm': '8px',
  'radius-md': '14px',
  'radius-lg': '20px',
  'radius-pill': '999px',

  'ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
  'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
  'dur-fast': '160ms',
  'dur-med': '320ms',

  'z-base': '0',
  'z-sticky': '20',
  'z-dropdown': '40',
  'z-modal': '50',
  'z-toast': '60',
  'z-tooltip': '100',

  'page-max': '1120px',
  gutter: '16px',
  'tap-min': '44px',
  'focus-width': '2px',
  'focus-offset': '2px',

  // Breakpoints for reference in JS and media queries (CSS vars cannot drive @media).
  'bp-sm': '640px',
  'bp-md': '768px',
  'bp-lg': '1024px',
  'bp-xl': '1280px',
};

/** Shadows reference --nish-scrim so the same recipe is faint on dark and soft on light. */
export const SHADOWS = {
  card: '0 1px 2px color-mix(in srgb, var(--nish-scrim) 10%, transparent), 0 6px 20px -8px color-mix(in srgb, var(--nish-scrim) 22%, transparent)',
  pop: '0 4px 12px -2px color-mix(in srgb, var(--nish-scrim) 24%, transparent), 0 12px 32px -8px color-mix(in srgb, var(--nish-scrim) 30%, transparent)',
  modal: '0 24px 64px -16px color-mix(in srgb, var(--nish-scrim) 45%, transparent)',
};
