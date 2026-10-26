// WCAG contrast math and the pairs every theme must pass. tools/contrast.mjs runs
// them in CI; the docs site (site/pages/themes.tsx) renders the same pairs as a matrix.
import { HUE_ROLES } from '../src/tokens.mjs';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Relative luminance of a #rrggbb color (WCAG 2.x). */
export const luminance = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio of two #rrggbb colors, 1 to 21. */
export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** color-mix(in srgb, fg t, bg) as #rrggbb. */
export const mix = (fg, bg, t) =>
  '#' +
  hex(fg)
    .map((v, i) => Math.round(v * t + hex(bg)[i] * (1 - t)).toString(16).padStart(2, '0'))
    .join('');

// 4.5 = body text, 3 = large text, icons and UI boundaries. Ghost is for placeholders
// and disabled text, so it only needs 3 on bg.
export const TEXT = 4.5;
export const UI = 3;

export const HUES = HUE_ROLES;

/** [foreground, backgrounds, minimum]. */
export const RULES = [
  ['hi', ['bg', 'surface', 'elevated', 'overlay'], TEXT],
  ['hi2', ['bg', 'surface', 'elevated'], TEXT],
  ['hi3', ['bg', 'surface'], TEXT],
  ['hi3', ['elevated'], UI],
  ['ghost', ['bg', 'surface'], UI],
  ['accent', ['bg', 'surface'], TEXT],
  ['accent', ['elevated'], UI],
  ['accent2', ['bg', 'surface'], UI],
  ['ok', ['bg', 'surface'], TEXT],
  ['loss', ['bg', 'surface'], TEXT],
  ['warn', ['bg', 'surface'], TEXT],
  ['info', ['bg', 'surface'], TEXT],
  ['line-strong', ['surface'], 1.6],
  ...['ok-fill', 'loss-fill', 'warn-fill', 'info-fill'].map((f) => [f, ['bg', 'surface', 'elevated'], UI]),
  // Chart lines and bars sit on cards and on raised panels (hovered rows, popovers).
  ...Array.from({ length: 8 }, (_, i) => [`chart-${i + 1}`, ['bg', 'surface', 'elevated'], UI]),
  ...HUES.map((h) => [h, ['bg', 'surface'], UI]),
];

/** Text and icons on solid fills: [foreground, fill]. All need 4.5. Danger buttons put
 *  on-loss on loss, so that pair is checked as well as on-loss on loss-fill. */
export const ON_FILL = [
  ['on-accent', 'accent'],
  ['on-accent2', 'accent2'],
  ['on-ok', 'ok-fill'],
  ['on-loss', 'loss-fill'],
  ['on-loss', 'loss'],
  ['on-warn', 'warn-fill'],
  ['on-info', 'info-fill'],
  ['invert-text', 'invert-bg'],
];

/** Roles whose text sits on their own 14% tint in badges and banners. */
export const SOFT_TEXT = ['accent', 'ok', 'loss', 'warn', 'info', ...HUES];

/** Every checked pair for one theme's colors: { fg, bg, label, ratio, min, pass }. */
export function checkTheme(colors) {
  const out = [];
  const add = (fg, bg, fgHex, bgHex, min, label = `${fg} on ${bg}`) => {
    const r = ratio(fgHex, bgHex);
    out.push({ fg, bg, label, ratio: r, min, pass: r >= min, fgHex, bgHex });
  };
  for (const [fg, bgs, min] of RULES) for (const bg of bgs) add(fg, bg, colors[fg], colors[bg], min);
  for (const [fg, bg] of ON_FILL) add(fg, bg, colors[fg], colors[bg], TEXT);
  // Badge tone="on-accent": a small label inside a primary button, on-accent text over
  // a 20% on-accent tint on the accent fill.
  add('on-accent', 'on-accent-tint', colors['on-accent'], mix(colors['on-accent'], colors.accent, 0.2), TEXT, 'on-accent on on-accent/20 over accent');
  // Checked over surface and elevated (hovered table rows).
  for (const role of SOFT_TEXT) {
    for (const under of ['surface', 'elevated']) {
      const tint = mix(colors[role], colors[under], 0.14);
      add(role, `${role}-soft`, colors[role], tint, TEXT, `${role} on ${role}-soft over ${under}`);
    }
  }
  // Hue tints (th-<hue>-soft): hub tile icons and calendar dots put the hue on its own
  // tint straight on the page (a mark, 3:1), and tag chips put hi text on it.
  for (const h of HUES) {
    const onBg = mix(colors[h], colors.bg, 0.14);
    add(h, `${h}-soft`, colors[h], onBg, UI, `${h} on ${h}-soft over bg`);
    for (const under of ['bg', 'surface', 'elevated']) {
      const tint = mix(colors[h], colors[under], 0.14);
      add('hi', `${h}-soft`, colors.hi, tint, TEXT, `hi on ${h}-soft over ${under}`);
    }
  }
  return out;
}
