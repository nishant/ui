import { defineConfig } from 'vitest/config';

// Two projects. `dom` runs the unit tests for hooks, components and the node entries in
// happy-dom. `node` runs tests/ssr (renderToString and the multi-copy checks) with no DOM
// globals at all, which is what a server component sees. Overlay, hydration, a11y and CSP
// specs run in Playwright instead (playwright.config.ts), the consumer apps through
// tools/consumer-check.mjs.
//
// Coverage thresholds (checked by `vitest run --coverage`) are the level measured on 2026-11-03
// (statements 81.8, branches 79.3, functions 85.3, lines 84.1) plus five
// points, rounded down, so a drop shows up in CI; raise them, never lower them.
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
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/elements/**'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: { statements: 86, branches: 84, functions: 90, lines: 89 },
    },
  },
});
