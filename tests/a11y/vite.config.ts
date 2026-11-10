import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two pages for the Playwright a11y specs: index.html (a broad set of components) and
// pickers.html (Calendar, DatePicker, MultiSelect, Carousel), served from src. Port 5195.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5195, strictPort: true, fs: { allow: ['../..'] } },
});
