// Mutation testing of src/theme.ts, run on demand with `npm run mutation` (not in CI).
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.config.ts', related: true },
  mutate: ['src/theme.ts'],
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  disableTypeChecks: false,
  reporters: ['clear-text', 'progress', 'json'],
  jsonReporter: { fileName: 'reports/mutation/theme.json' },
  thresholds: { high: 80, low: 65, break: null },
  tempDirName: '.stryker-tmp',
};
