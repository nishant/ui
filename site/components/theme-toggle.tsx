import { ThemeToggle } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- ThemeToggle --------------------------------------------------------------------

export const themeToggle: ComponentDoc = {
  id: 'theme-toggle',
  name: 'ThemeToggle',
  exports: ['ThemeToggle'],
  summary:
    'System, Light and Dark as a segmented control, with an optional preset picker. The choice is saved to the shared cookie, so it follows people across every nish.software subdomain.',
  importLine: "import { ThemeToggle } from '@nish/ui';",
  controls: [{ key: 'presets', label: 'Presets', type: 'boolean' }],
  initial: { presets: true },
  render: (a) => <ThemeToggle presets={!!a.presets} />,
  code: (a) => jsx('ThemeToggle', { presets: a.presets }),
  api: { functions: ['useTheme'], interfaces: ['ThemeState'] },
  stories: [
    { id: 'modes', name: 'System, light, dark', note: 'Clicking changes this whole site.', render: () => <ThemeToggle /> },
    { id: 'presets', name: 'With presets', render: () => <ThemeToggle presets /> },
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
}`,
  guidelines: [
    'Call initTheme() once at startup; ThemeToggle and useTheme only read and change the choice.',
    'Apps that only support light and dark set <html data-nish-themes="dark light">; presets then render as their base theme.',
  ],
};
