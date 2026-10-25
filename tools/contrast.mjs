// WCAG contrast check for every theme in src/tokens.mjs. Fails (exit 1) when any
// pair is under its minimum. Run in CI and before every release.
import { THEMES } from '../src/tokens.mjs';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// color-mix(in srgb, fg t, bg) as hex.
const mix = (fg, bg, t) =>
  '#' +
  hex(fg)
    .map((v, i) => Math.round(v * t + hex(bg)[i] * (1 - t)).toString(16).padStart(2, '0'))
    .join('');

// [foreground, backgrounds, minimum]. 4.5 = body text, 3 = large text, icons and UI
// boundaries. Ghost is for placeholders and disabled text, so it only needs 3 on bg.
const TEXT = 4.5;
const UI = 3;
const RULES = [
  ['hi', ['bg', 'surface', 'elevated', 'overlay'], TEXT],
  ['hi2', ['bg', 'surface', 'elevated'], TEXT],
  ['hi3', ['bg', 'surface'], TEXT],
  ['hi3', ['elevated'], UI],
  ['ghost', ['bg', 'surface'], UI],
  ['accent', ['bg', 'surface'], TEXT],
  ['accent', ['elevated'], UI],
  ['accent2', ['bg', 'surface'], UI],
  ['on-accent', ['accent'], TEXT],
  ['ok', ['bg', 'surface'], TEXT],
  ['loss', ['bg', 'surface'], TEXT],
  ['warn', ['bg', 'surface'], TEXT],
  ['info', ['bg', 'surface'], TEXT],
  ['invert-text', ['invert-bg'], TEXT],
  ['line-strong', ['surface'], 1.6],
  ...Array.from({ length: 8 }, (_, i) => [`chart-${i + 1}`, ['bg', 'surface'], UI]),
  ...['emerald', 'indigo', 'amber', 'lime', 'rose', 'sky', 'violet', 'teal'].map((h) => [h, ['bg', 'surface'], UI]),
];

let failures = 0;
for (const [name, t] of Object.entries(THEMES)) {
  const bad = [];
  for (const [fg, bgs, min] of RULES) {
    for (const bg of bgs) {
      const r = ratio(t.colors[fg], t.colors[bg]);
      if (r < min) bad.push(`${fg} on ${bg}: ${r.toFixed(2)} < ${min}`);
    }
  }
  // Badges and banners put a role's text on its own soft tint (14% over the card).
  // Checked over surface and elevated (hovered table rows).
  for (const role of ['accent', 'ok', 'loss', 'warn', 'info', 'emerald', 'indigo', 'amber', 'lime', 'rose', 'sky', 'violet', 'teal']) {
    for (const under of ['surface', 'elevated']) {
      const r = ratio(t.colors[role], mix(t.colors[role], t.colors[under], 0.14));
      if (r < TEXT) bad.push(`${role} on ${role}-soft over ${under}: ${r.toFixed(2)} < ${TEXT}`);
    }
  }
  // Danger buttons put on-accent text on a loss fill.
  const dangerText = ratio(t.colors['on-accent'], t.colors.loss);
  if (dangerText < TEXT) bad.push(`on-accent on loss: ${dangerText.toFixed(2)} < ${TEXT}`);
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name}${bad.length ? '\n  ' + bad.join('\n  ') : ''}`);
  failures += bad.length;
}
if (failures) {
  console.error(`\n${failures} contrast failure(s)`);
  process.exit(1);
}
