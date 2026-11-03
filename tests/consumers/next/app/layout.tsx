import './globals.css';
import type { ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Next has no Vite plugin: inline theme-init.js first in <head> so the saved theme is applied
// before paint, and let React keep the <html data-theme> it did not render.
const themeInit = readFileSync(join(process.cwd(), 'node_modules/nish-ui/dist/theme-init.js'), 'utf8');

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
