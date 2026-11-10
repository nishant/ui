import { defineConfig } from 'vitest/config';

// Two projects. `dom` runs the unit tests for hooks, components and the node entries in
// happy-dom. `node` runs tests/ssr (renderToString and the multi-copy checks) with no DOM
// globals at all, which is what a server component sees. Overlay, hydration, a11y and CSP
// specs run in Playwright instead (playwright.config.ts), the consumer apps through
// tools/consumer-check.mjs.
//
// Coverage thresholds (checked by `vitest run --coverage`) are the level measured on 2026-11-03
// (statements 81.8, branches 79.3, functions 85.6, lines 84.1), rounded down,
// so a drop shows up in CI; raise them, never lower them.
export default defineConfig({
  test: {
    setupFiles: ['tests/setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'happy-dom',
          include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/ssr/**/*.test.{ts,tsx}'],
          testTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        // no happy-dom unit test yet (UI-408); covered by tests/elements Playwright specs
        'src/elements/bar-chart.ts',
        'src/elements/combobox.ts',
        'src/elements/command-palette.ts',
        'src/elements/dialog.ts',
        'src/elements/line-chart.ts',
        'src/elements/public-check.ts',
        'src/elements/scroll-row.ts',
        'src/elements/segmented.ts',
        'src/elements/split.ts',
        'src/elements/theme-toggle.ts',
      ],
      reporter: ['text-summary', 'json-summary'],
      thresholds: {
        statements: 81,
        branches: 79,
        functions: 85,
        lines: 84,
        // src/elements/** (minus the files excluded above): measured 2026-11-10; raise it, never lower it.
        'src/elements/**': { lines: 72, statements: 69, branches: 50, functions: 65 },
        // theme.ts has its own floor (the ui-leftovers tests); raise it, never lower it.
        'src/theme.ts': { lines: 90, statements: 88, branches: 80, functions: 90 },
      },
    },
  },
});
