import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Harness for the Playwright a11y specs (axe, forced colors, RTL): one page with a broad set
// of components, served from this repo's own src. Port 5195.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5195, strictPort: true, fs: { allow: ['../..'] } },
});
