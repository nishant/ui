import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Harness for the Playwright elements specs. Two bare pages served from this repo's own src:
//   index.html  the custom elements (src/elements) with the static CSS from dist/
//   react.html  the React twins (src) with Tailwind, like an app
// parity.spec.ts renders the same component in both and compares them; behavior.spec.ts
// drives the elements alone. Run `npm run build` first: the CSS comes from dist/.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5194, strictPort: true, fs: { allow: ['../..'] } },
});
