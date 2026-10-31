import { defineConfig } from 'vitest/config';

// Unit tests for hooks, components and the node entries. Overlay interaction specs run in
// Playwright instead (playwright.config.ts).
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
  },
});
