import { Card, ThemeToggle } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- ThemeToggle --------------------------------------------------------------------

export const themeToggle: ComponentDoc = {
  id: 'theme-toggle',
  name: 'ThemeToggle',
  exports: ['ThemeToggle'],
  summary:
    'System, Light and Dark as a Segmented radio group, with optional text labels and a preset picker, or one cycling icon button when compact. The choice is saved to the shared cookie, so it follows people across every nish.software subdomain.',
  importLine: "import { ThemeToggle } from '@nish/ui';",
  controls: [
    { key: 'presets', label: 'Presets', type: 'boolean' },
    { key: 'labels', label: 'Labels', type: 'boolean' },
    { key: 'size', label: 'Size', type: 'select', options: ['sm', 'md'] },
    { key: 'compact', label: 'Compact', type: 'boolean' },
  ],
  initial: { presets: true, labels: false, size: 'sm', compact: false },
  render: (a) => <ThemeToggle presets={!!a.presets} labels={!!a.labels} size={a.size === 'md' ? 'md' : 'sm'} compact={!!a.compact} />,
  code: (a) => jsx('ThemeToggle', { presets: a.presets, labels: a.labels, size: a.size === 'sm' ? undefined : a.size, compact: a.compact }),
  api: { functions: ['useTheme'], interfaces: ['ThemeState'] },
  stories: [
    { id: 'modes', name: 'System, light, dark', note: 'Clicking changes this whole site.', render: () => <ThemeToggle /> },
    { id: 'md', name: 'Medium', render: () => <ThemeToggle size="md" /> },
    { id: 'labels', name: 'With labels', render: () => <ThemeToggle labels /> },
    { id: 'presets', name: 'With presets', render: () => <ThemeToggle presets /> },
    { id: 'block', name: 'Block, with labels', wide: true, render: () => <div className="w-full max-w-sm"><ThemeToggle labels block /></div> },
    { id: 'compact', name: 'Compact', note: 'One button that cycles System, Light, Dark.', render: () => <ThemeToggle compact /> },
    {
      id: 'phone',
      name: 'Segmented on phones too',
      note: 'By default the segmented toggle becomes the compact button below 640px, so a phone header keeps to one row. phone="segmented" keeps the radio group at every width.',
      render: () => <ThemeToggle phone="segmented" />,
    },
    {
      id: 'header',
      name: 'In an app header',
      wide: true,
      render: () => (
        <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-th-line bg-th-surface px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate font-semibold text-th-hi">trading</p>
            <p className="text-xs text-th-hi3">Options ideas</p>
          </div>
          <ThemeToggle />
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a settings card',
      wide: true,
      render: () => (
        <Card className="w-full max-w-md">
          <p className="mb-1 text-sm font-semibold text-th-hi">Appearance</p>
          <p className="mb-3 text-xs text-th-hi3">Follows you across every nish.software app.</p>
          <ThemeToggle labels block />
        </Card>
      ),
    },

    {
      id: 'pill',
      name: 'Pill (variant="pill")',
      note: 'One cycling button in a 44px pill, to sit next to the hub pill. With labels it shows the current choice.',
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <a className="nish-pill-link" href="#/components/theme-toggle" title="Back to nish.software">
            ← nish.software
          </a>
          <ThemeToggle variant="pill" />
          <ThemeToggle variant="pill" labels />
        </div>
      ),
    },
  ],
  usage: `import { ThemeToggle, useTheme, initTheme } from '@nish/ui';

initTheme(); // once, before render

function Header() {
  const { theme } = useTheme(); // re-renders when the theme changes
  return (
    <header className="flex items-center justify-between">
      <Logo dark={theme !== 'light'} />
      <ThemeToggle presets />
    </header>
  );
}

// A collapsed sidebar
<ThemeToggle compact />`,
  guidelines: [
    'Call initTheme() once at startup; ThemeToggle and useTheme only read and change the choice.',
    'Apps that only support light and dark set <html data-nish-themes="dark light">; presets then render as their base theme.',
    'Use compact only where space is tight: it hides the other choices behind a click.',
  ],
};
