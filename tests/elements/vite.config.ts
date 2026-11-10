import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Harness for the Playwright elements specs. Four bare pages served from this repo's own src:
//   index.html  the custom elements (src/elements) with the static CSS from dist/ (parity, behavior)
//   react.html  the React twins (src) with Tailwind, like an app (parity)
//   data.html   static markup for the data and chart elements (data, hardening, touch-focus)
//   forms.html  static markup for the form elements (forms, touch-focus)
// parity.spec.ts renders the same component in index and react and compares them; the other specs
// drive the elements alone (behavior.spec.ts also routes a throwaway upgrade.html). Run `npm run build` first: the CSS comes from dist/.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { port: 5194, strictPort: true, fs: { allow: ['../..'] } },
});
