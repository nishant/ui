// Every Tailwind color name `th-<name>` that @nish/ui defines, with the token role it
// points at. scripts/build.mjs writes them into dist/tailwind.css and src/node/th-classes.ts
// checks class names against them. Plain data: imports only tokens.mjs, no React.
import { COLOR_ROLES, SOFT_ROLES } from './tokens.mjs';

/** [tailwind name, token role] pairs: `bg-th-<name>` reads `var(--nish-<role>)`. */
export const TH_COLORS = [
  ...COLOR_ROLES.filter((r) => !r.startsWith('chart-')).map((r) => [r, r]),
  ...COLOR_ROLES.filter((r) => r.startsWith('chart-')).map((r) => [r, r]),
  ...SOFT_ROLES.flatMap((r) => [[`${r}-soft`, `${r}-soft`], [`${r}-soft-solid`, `${r}-soft-solid`]]),
  // Aliases for the names trading and nishboard already use.
  ['gain', 'ok'],
  ['danger', 'loss'],
  ['2', 'hi2'],
  ['3', 'hi3'],
  ['bar', 'surface'],
  ['focus', 'focus'],
];

/** Just the names: the valid `<name>` in `bg-th-<name>`. */
export const TH_COLOR_NAMES = TH_COLORS.map(([name]) => name);
