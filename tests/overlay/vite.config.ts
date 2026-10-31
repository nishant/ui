import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Harness for the Playwright overlay specs: a bare page that opens each overlay, served
// from this repo's own src so the specs always test the code being released.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5193, strictPort: true, fs: { allow: ['../..'] } },
});
