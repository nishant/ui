# Consumer fixtures

Small apps that install the packed `nish-ui` tarball the way an outside team would. They are
not part of the workspace: `node tools/consumer-check.mjs` copies each folder to a temp dir,
installs the tarball next to its own dependencies and builds or type-checks it.

- `next/`: a Next.js App Router app. Server components import `cn`, `buttonClass`, `Card`,
  `Badge`, `Button` and render `Modal`, `Combobox`, `Tabs`, `Toaster`, `ThemeToggle` and
  `AppShell` directly (no `'use client'` wrapper). `next build` must pass and `next start`
  must serve pages with no console errors and no hydration warnings (port 5320).
- `vite/`: a Vite + Tailwind 4 app using `nishThemeInit()`. `vite build` must pass, and the
  preview must render with no console errors (port 5321). `tsc -p tsconfig.json --noEmit` (strict,
  `skipLibCheck: false`) runs in the fixture before `vite build` and a non-zero exit fails the check,
  since Vite strips types without checking them.
- `ts/`: one file that uses 20 components and every subpath, type-checked with TypeScript 5.4,
  5.9 and 6.0 under `moduleResolution` bundler and node16, with `strict`,
  `exactOptionalPropertyTypes` and `skipLibCheck: false`.

`package.json` files here are templates: the tool fills in the `nish-ui` tarball path.

Every dependency in these `package.json` files is pinned to an exact version (no `^` or `~`),
and installs run with `--ignore-scripts`, so a third-party release cannot turn the check red or
run install scripts. The pins are moved by hand, to the newest release that is at least 14 days
old; Dependabot cannot parse the `__NISH_UI_TARBALL__` placeholder.
