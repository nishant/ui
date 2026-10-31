// @nish/ui/eslint: a flat-config preset (plugin `nish`) that stops theme-class typos and
// raw colors from reaching the page. Put it after `tseslint.configs.recommended`.
// It ships its own rules instead of `no-restricted-syntax`, so it never replaces an app's
// own `no-restricted-syntax` options. No parser, no runtime dependencies, nothing from React.
import { TH_COLOR_NAMES, unknownThClasses } from './th-classes';

interface RuleContext {
  report(d: { node: unknown; message?: string; messageId?: string; data?: Record<string, string> }): void;
}
interface StringNode { value?: unknown }
interface TemplateNode { value: { cooked?: string | null } }
interface NishRule {
  meta: {
    type: 'problem';
    docs: { description: string; url: string };
    schema: [];
    messages?: Record<string, string>;
  };
  create(context: RuleContext): { Literal(node: StringNode): void; TemplateElement(node: TemplateNode): void };
}

const DOCS_URL = 'https://design.nish.software/#/getting-started';

/** Runs `check` on every string Literal and TemplateElement and reports each message it returns. */
function stringRule(description: string, check: (text: string) => string[]): NishRule {
  return {
    meta: { type: 'problem', docs: { description, url: DOCS_URL }, schema: [] },
    create(context) {
      const run = (node: unknown, text: string) => {
        for (const message of check(text)) context.report({ node, message });
      };
      return {
        Literal(node) {
          if (typeof node.value === 'string') run(node, node.value);
        },
        TemplateElement(node) {
          if (typeof node.value.cooked === 'string') run(node, node.value.cooked);
        },
      };
    },
  };
}

/** A rule that reports `message` once per match of `re` (the same `(^|[\s:])` lead trading used, so `hover:bg-red-500` matches). */
function patternRule(description: string, re: RegExp, message: string): NishRule {
  return stringRule(description, (text) => (re.test(text) ? [message] : []));
}

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const THEME_NAMES_HINT = 'th-hi, th-hi2, th-elevated, th-surface, th-line, th-accent';

export const rules: Record<string, NishRule> = {
  'no-unknown-th-class': stringRule('Disallow th-* color classes that @nish/ui does not define.', (text) =>
    unknownThClasses(text).map((cls) => {
      const name = /th-([a-z0-9-]+?)(?:\/[\w.[\]%-]+)?$/.exec(cls)?.[1] ?? cls;
      return `Unknown theme class "${cls}": th-${name} is not a @nish/ui color. Use one of ${THEME_NAMES_HINT}, … (design.nish.software/#/color).`;
    }),
  ),
  'no-raw-palette': patternRule(
    'Disallow raw Tailwind palette classes (bg-red-500) that bypass the theme.',
    new RegExp(String.raw`(^|[\s:])(bg|text|border|ring|fill|stroke|outline|divide|decoration|from|to|via)-(${PALETTE})-\d`),
    'Raw palette classes bypass the theme. Use a th-* role (text-th-hi2, bg-th-ok-soft, …).',
  ),
  'no-white-black': patternRule(
    'Disallow text-white / bg-black, which ignore the theme.',
    /(^|[\s:])(bg|text|border)-(white|black)(?=$|[\s/"'`])/,
    'text-white / bg-black ignore the theme. Use th-on-* on solid fills, or a surface role.',
  ),
  'no-legacy-th-alias': patternRule(
    'Disallow the legacy th-* aliases (gain, danger, 2, 3, bar, focus).',
    /(^|[\s:])-?[a-z-]+-th-(gain|danger|2|3|bar|focus)(?=$|[\s/"'`])/,
    'Legacy th-* alias. Gains are th-ok, danger is th-loss, th-2/th-3 are th-hi2/th-hi3.',
  ),
  'no-hand-mixed-tint': patternRule(
    'Disallow hand-mixed tints (bg-th-accent/10) in favour of the -soft roles.',
    /(^|[\s:])bg-th-(accent|ok|loss|warn|info)\/(5|10|15)(?=$|[\s"'`])/,
    'Hand-mixed tint. Use bg-th-<role>-soft (and border-th-<role>/30 on it).',
  ),
  'no-arbitrary-text-size': patternRule(
    'Disallow arbitrary font sizes (text-[13px]); use the type scale.',
    /(^|[\s:])text-\[\d+(\.\d+)?(px|rem)\]/,
    'Arbitrary font size. Use the scale, including text-2xs (11px) and text-3xs (10px).',
  ),
};

/** The ESLint plugin object: `plugins: { nish: plugin }`. */
export const plugin = { meta: { name: 'nish' }, rules };

/** Exposed so tooling can list the defined colors. */
export { TH_COLOR_NAMES };

const config = [
  {
    name: 'nish/recommended',
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    plugins: { nish: plugin },
    rules: Object.fromEntries(Object.keys(rules).map((id) => [`nish/${id}`, 'error' as const])),
  },
];

export default config;
