import { useEffect, useRef } from 'react';
import { Card, cn, mountThemeToggle, type ThemeToggleLabels } from '../../src';
import type { ComponentDoc } from './types';

// --- mountThemeToggle (static pages) -------------------------------------------------

// The look of IconButton, written out so the story shows a plain <button> the way a
// static page has one. Static pages use .nish-theme-btn from nish-components.css.
const BTN =
  'inline-flex size-9 items-center justify-center rounded-lg border border-th-line bg-th-surface text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:size-11';

/** A plain <button> handed to mountThemeToggle, the way a static page uses it. */
function StaticThemeButton({ labels, className }: { labels?: ThemeToggleLabels; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => (ref.current ? mountThemeToggle(ref.current, { labels }) : undefined), [labels]);
  return <button ref={ref} className={cn(BTN, className)} />;
}

const SPANISH: ThemeToggleLabels = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' };

// `source` (the file the page links to, for pages with no component export) is a field
// the integrator adds to ComponentDoc; see LANE.md.
export const mountThemeToggleDoc: ComponentDoc & { source: string } = {
  id: 'mount-theme-toggle',
  name: 'mountThemeToggle',
  exports: [],
  source: 'src/theme.ts',
  summary:
    'The one-button theme toggle for static pages (mc, trips, the hub, trip gates): hand it a <button> and it fills in the icon, the label and the click. It cycles System → Light → Dark like ThemeToggle compact, and stays in sync across tabs and subdomains.',
  importLine: "import { initTheme, mountThemeToggle } from '@nish/ui/theme';",
  controls: [{ key: 'labels', label: 'Custom labels', type: 'boolean' }],
  initial: { labels: false },
  render: (a) => <StaticThemeButton labels={a.labels ? SPANISH : undefined} />,
  code: (a) =>
    a.labels
      ? "mountThemeToggle(button, {\n  labels: { system: 'Sistema', light: 'Claro', dark: 'Oscuro' },\n});"
      : 'mountThemeToggle(document.getElementById(\'theme\'));',
  api: { functions: ['mountThemeToggle'], interfaces: ['MountThemeToggleOptions'] },
  stories: [
    {
      id: 'default',
      name: 'Default',
      note: 'Clicking changes this whole site. Hover for the label: "Theme: Light. Switch to Dark".',
      render: () => <StaticThemeButton />,
    },
    {
      id: 'labels',
      name: 'Custom labels',
      note: 'labels replaces the words in aria-label and title.',
      render: () => <StaticThemeButton labels={SPANISH} />,
    },
    {
      id: 'round',
      name: 'Round, on a band',
      render: () => (
        <div className="flex w-full items-center justify-center rounded-lg bg-th-elevated p-4">
          <StaticThemeButton className="rounded-full" />
        </div>
      ),
    },
    {
      id: 'header',
      name: 'In a static page header',
      wide: true,
      render: () => (
        <Card padded={false} className="flex w-full items-center justify-between gap-3 px-4 py-2.5">
          <a className="nish-pill-link" href="https://nish.software" title="Back to nish.software">
            ← nish.software
          </a>
          <p className="truncate font-semibold text-th-hi">Trips</p>
          <StaticThemeButton />
        </Card>
      ),
    },
  ],
  usage: `<!-- In <head>: theme-init.js, then nish.css. In the header: -->
<button class="nish-theme-btn" id="theme"></button>

<script type="module">
  import { initTheme, mountThemeToggle } from './nish/theme.js';
  initTheme();
  const stop = mountThemeToggle(document.getElementById('theme'));
</script>

<!-- Classic scripts: theme.global.js defines window.nishTheme.mountThemeToggle. -->`,
  guidelines: [
    'Use it for every one-button toggle on a static page instead of wiring cycleTheme() by hand; it keeps the label right when a preset was picked on another site ("Theme: Mocha (set on another site). Switch to System").',
    'The button keeps its own classes: style it with .nish-theme-btn (nish-components.css) or your own. Only the current icon is visible; data-choice holds the saved choice for CSS.',
    'Call initTheme() first. The returned function removes the click handler and the theme subscription.',
    'React apps use <ThemeToggle compact /> instead.',
  ],
};
