import { defineConfig, devices } from '@playwright/test';

// Overlay interaction specs: Escape order, focus trap and return, back button, inert and
// toast live regions. They run against a small Vite harness (tests/overlay/), because the
// docs site renders overlays in iframes where history handling is off on purpose.
//
// Also here: the elements specs (tests/elements), hydration (tests/ssr), axe, forced-colors and
// RTL checks (tests/a11y, harness on port 5195) and the CSP spec (tests/a11y/csp.spec.ts).
// Firefox and WebKit run the overlay specs when NISH_BROWSERS=all (CI installs them with
// `npx playwright install --with-deps firefox webkit`); a plain local run uses Chromium only.
const allBrowsers = process.env.NISH_BROWSERS === 'all';
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5193',
    viewport: { width: 1280, height: 800 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    ...(allBrowsers
      ? [
          { name: 'firefox', testMatch: 'overlay/**/*.spec.ts', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 } } },
          { name: 'webkit', testMatch: 'overlay/**/*.spec.ts', use: { ...devices['Desktop Safari'], viewport: { width: 1280, height: 800 } } },
        ]
      : []),
  ],
  // Never reuse a server: a leftover one from another worktree would silently test that checkout (ports are --strictPort).
  webServer: [
    {
      command: 'npx vite --config tests/overlay/vite.config.ts --port 5193 --strictPort',
      url: 'http://localhost:5193/harness.html',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    // Elements specs (tests/elements): the custom elements and their React twins, on port 5194.
    {
      command: 'npx vite --config tests/elements/vite.config.ts --port 5194 --strictPort',
      url: 'http://localhost:5194/index.html',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    // A11y specs (tests/a11y): a broad component page for axe, forced colors and RTL, on port 5195.
    {
      command: 'npx vite --config tests/a11y/vite.config.ts --port 5195 --strictPort',
      url: 'http://localhost:5195/index.html',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
