import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nishThemeInit } from 'nish-ui/vite';

export default defineConfig({
  plugins: [nishThemeInit(), react(), tailwindcss()],
  preview: { port: 5321, strictPort: true },
});
