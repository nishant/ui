import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Two pages for the Playwright overlay specs: harness.html (a bare page that opens each overlay)
// and tree-virtual.html (VirtualList, VirtualTable, TreeView, ContextMenu, HoverCard), served from
// this repo's own src so the specs test the code being released. Run `npm run build` first:
// the CSS comes from dist/. Port 5193.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5193, strictPort: true, fs: { allow: ['../..'] } },
});
