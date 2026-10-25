// WCAG contrast check for every theme in src/tokens.mjs. Fails (exit 1) when any
// pair is under its minimum. Run in CI and before every release. The pairs live in
// tools/contrast-rules.mjs, shared with the docs site's contrast matrix.
import { THEMES } from '../src/tokens.mjs';
import { checkTheme } from './contrast-rules.mjs';

let failures = 0;
let checked = 0;
for (const [name, t] of Object.entries(THEMES)) {
  const results = checkTheme(t.colors);
  checked += results.length;
  const bad = results.filter((r) => !r.pass).map((r) => `${r.label}: ${r.ratio.toFixed(2)} < ${r.min}`);
  console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name}${bad.length ? '\n  ' + bad.join('\n  ') : ''}`);
  failures += bad.length;
}
if (failures) {
  console.error(`\n${failures} contrast failure(s)`);
  process.exit(1);
}
console.log(`\n${checked} pairs checked across ${Object.keys(THEMES).length} themes`);
