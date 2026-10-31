import { defineConfig, devices } from '@playwright/test';

// Overlay interaction specs: Escape order, focus trap and return, back button, inert and
// toast live regions. They run against a small Vite harness (tests/overlay/), because the
// docs site renders overlays in iframes where history handling is off on purpose.
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: 'npx vite --config tests/overlay/vite.config.ts --port 5193 --strictPort',
    url: 'http://localhost:5193/harness.html',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
