// Finds th-* color classes that @nish/ui does not define (a made-up color name after the th prefix).
// Shared by the ESLint rule `nish/no-unknown-th-class` and the `nish-th-check` CLI.
// Node only, no dependencies, nothing from React.
import { TH_COLOR_NAMES as NAMES } from '../th-colors.mjs';

/** Every `<name>` in `bg-th-<name>` that @nish/ui defines. */
export const TH_COLOR_NAMES: ReadonlySet<string> = new Set(NAMES);

const UTILITY =
  '(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|divide|decoration|fill|stroke|from|via|to|shadow|inset-shadow|inset-ring|accent|caret|placeholder)';

// One class token: optional variants (`hover:`, `md:`, `[&>a]:`), `!`, `-`, utility, `-th-<name>`, `/opacity`.
const CLASS_RE = new RegExp(
  String.raw`(?:^|[\s"'` + '`' + String.raw`{(,])((?:[a-z0-9-]+:|\[[^\]]+\]:)*!?-?` +
    UTILITY +
    String.raw`-th-([a-z0-9-]+?)(?:\/[\w.[\]%-]+)?)(?=$|[\s"'` + '`' + String.raw`}),;])`,
  'g',
);
const VAR_RE = /--color-th-([a-z0-9-]+)/g;

/** Every th-* class token in a string that names a color th does not define: the offending tokens. */
export function unknownThClasses(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(CLASS_RE)) {
    if (!TH_COLOR_NAMES.has(m[2])) out.push(m[1]);
  }
  for (const m of text.matchAll(VAR_RE)) {
    if (!TH_COLOR_NAMES.has(m[1])) out.push(m[0]);
  }
  return out;
}
