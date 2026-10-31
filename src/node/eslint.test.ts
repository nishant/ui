// @vitest-environment node
import { RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';
import preset, { plugin, rules } from './eslint';

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rule = (id: string) => rules[id] as any;

tester.run('no-unknown-th-class', rule('no-unknown-th-class'), {
  valid: ['const a = "bg-th-elevated text-th-hi2"', 'const a = <div className="hover:bg-th-accent-soft/50" />', 'const a = `border-th-line-strong`'],
  invalid: [
    { code: 'const a = "p-2 bg-th-hover"', errors: [{ message: /Unknown theme class "bg-th-hover"/ }] },
    { code: 'const a = <div className="text-th-hi1" />', errors: 1 },
    { code: 'const a = `flex ${x} bg-th-surface-2 `', errors: 1 },
  ],
});

tester.run('no-raw-palette', rule('no-raw-palette'), {
  valid: ['const a = "text-th-hi2 bg-th-ok-soft"'],
  invalid: [
    { code: 'const a = "bg-red-500"', errors: 1 },
    { code: 'const a = <div className="p-2 hover:text-slate-300" />', errors: 1 },
    { code: 'const a = `border-emerald-400`', errors: 1 },
  ],
});

tester.run('no-white-black', rule('no-white-black'), {
  valid: ['const a = "text-th-on-accent bg-th-surface"', 'const a = "whitespace-nowrap"'],
  invalid: [
    { code: 'const a = "text-white"', errors: 1 },
    { code: 'const a = <div className="p-2 bg-black/50" />', errors: 1 },
    { code: 'const a = `hover:border-white`', errors: 1 },
  ],
});

tester.run('no-legacy-th-alias', rule('no-legacy-th-alias'), {
  valid: ['const a = "text-th-ok text-th-hi2 bg-th-loss"'],
  invalid: [
    { code: 'const a = "text-th-gain"', errors: 1 },
    { code: 'const a = <div className="p-2 bg-th-danger" />', errors: 1 },
    { code: 'const a = `hover:text-th-3`', errors: 1 },
  ],
});

tester.run('no-hand-mixed-tint', rule('no-hand-mixed-tint'), {
  valid: ['const a = "bg-th-accent-soft border-th-accent/30"', 'const a = "bg-th-accent/50"'],
  invalid: [
    { code: 'const a = "bg-th-accent/10"', errors: 1 },
    { code: 'const a = <div className="p-2 hover:bg-th-ok/5" />', errors: 1 },
    { code: 'const a = `bg-th-loss/15`', errors: 1 },
  ],
});

tester.run('no-arbitrary-text-size', rule('no-arbitrary-text-size'), {
  valid: ['const a = "text-2xs text-sm"', 'const a = "text-th-hi"'],
  invalid: [
    { code: 'const a = "text-[13px]"', errors: 1 },
    { code: 'const a = <div className="p-2 md:text-[0.8rem]" />', errors: 1 },
    { code: 'const a = `text-[11px]`', errors: 1 },
  ],
});

describe('preset', () => {
  it('react and recommended enable every rule under the nish plugin', () => {
    for (const list of [preset.configs.react, preset.configs.recommended]) {
      const theme = list.find((c) => c.name === 'nish/theme')!;
      expect(theme.plugins!.nish).toBe(plugin);
      for (const id of Object.keys(rules)) expect(theme.rules[`nish/${id}`]).toBe('error');
      expect(list.some((c) => c.name === 'nish/base')).toBe(true);
    }
  });
  it('node has the core rules and no theme rules', () => {
    expect(preset.configs.node.map((c) => c.name)).toEqual(['nish/base']);
    expect(preset.configs.node[0].rules['no-empty']).toEqual(['error', { allowEmptyCatch: false }]);
  });
  it('the core rules run under ESLint', async () => {
    const { Linter } = await import('eslint');
    const msgs = new Linter().verify('var a = 1; try { a++ } catch {}', [...preset.configs.node] as never, 'x.js');
    expect(msgs.map((m) => m.ruleId).sort()).toEqual(['no-empty', 'no-var']);
  });
});
