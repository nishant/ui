import { DEFAULT_STRINGS } from '../../src/components/strings';
import { NishProvider, useNishConfig } from '../../src/components/provider';
import { Button } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- NishProvider -------------------------------------------------------------------

const KEYS = Object.keys(DEFAULT_STRINGS).sort();

/** What a function string returns for a sample argument, so the table shows real text. */
function sample(value: unknown): string {
  if (typeof value !== 'function') return JSON.stringify(value);
  const fn = value as (...a: unknown[]) => string;
  const n = fn.length;
  try {
    return `(${Array.from({ length: n }, (_, i) => `arg${i + 1}`).join(', ')}) → ${JSON.stringify(
      fn(...Array.from({ length: n }, (_, i) => (i === 0 ? 3 : 'x'))),
    )}`;
  } catch {
    return '(function)';
  }
}

function Readout() {
  const c = useNishConfig();
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-th-hi2">
      <dt className="text-th-hi3">locale</dt>
      <dd>{c.locale ?? '(default)'}</dd>
      <dt className="text-th-hi3">dir</dt>
      <dd>{c.dir ?? '(inherit)'}</dd>
      <dt className="text-th-hi3">close</dt>
      <dd>{c.strings.close}</dd>
      <dt className="text-th-hi3">copy</dt>
      <dd>{c.strings.copy}</dd>
    </dl>
  );
}

export const provider: ComponentDoc = {
  id: 'provider',
  name: 'NishProvider',
  exports: ['NishProvider', 'useNishConfig', 'useNishStrings'],
  summary:
    'Sets strings, locale, text direction and the portal container once for every component below it. Providers nest: an inner one overrides the outer one key by key. Without a provider everything is English, left to right, and portals go to document.body.',
  importLine: "import { NishProvider, useNishStrings } from '@nish/ui';",
  controls: [
    { key: 'locale', label: 'Locale', type: 'select', options: ['en-US', 'fr-FR', 'de-DE', 'ar-EG'] },
    { key: 'dir', label: 'Direction', type: 'select', options: ['ltr', 'rtl'] },
    { key: 'close', label: 'strings.close', type: 'text' },
  ],
  initial: { locale: 'en-US', dir: 'ltr', close: 'Close' },
  render: (a) => (
    <NishProvider locale={String(a.locale)} dir={a.dir as 'ltr'} strings={{ close: String(a.close) }}>
      <div dir={String(a.dir)} className="grid gap-2">
        <Readout />
        <Button variant="secondary" size="sm">
          {String(a.close)}
        </Button>
      </div>
    </NishProvider>
  ),
  code: (a) =>
    jsx('NishProvider', {
      locale: String(a.locale),
      dir: a.dir === 'ltr' ? undefined : a.dir,
      strings: a.close === 'Close' ? undefined : `{{ close: '${String(a.close)}' }}`,
    }, '<App />'),
  stories: [
    {
      id: 'nested',
      name: 'Nesting',
      note: 'The inner provider changes copy only; the outer locale stays.',
      render: () => (
        <NishProvider locale="fr-FR" strings={{ close: 'Fermer', copy: 'Copier' }}>
          <div className="grid w-full gap-3">
            <Readout />
            <NishProvider strings={{ copy: 'Copier le lien' }}>
              <Readout />
            </NishProvider>
          </div>
        </NishProvider>
      ),
    },
    {
      id: 'strings',
      name: 'Every string',
      note: `${KEYS.length} keys. Each one is replaceable; a function string receives the arguments shown.`,
      wide: true,
      render: () => (
        <div className="max-h-96 w-full overflow-auto rounded-lg border border-th-line outline-none focus-visible:ring-2 focus-visible:ring-th-accent" tabIndex={0} role="region" aria-label="Every string">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-th-elevated text-th-hi3">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Key
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  English default
                </th>
              </tr>
            </thead>
            <tbody>
              {KEYS.map((k) => (
                <tr key={k} className="border-t border-th-line align-top">
                  <th scope="row" className="px-3 py-1.5 font-mono font-normal text-th-hi">
                    {k}
                  </th>
                  <td className="px-3 py-1.5 text-th-hi2">{sample((DEFAULT_STRINGS as unknown as Record<string, unknown>)[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ],
  usage: `import { NishProvider } from '@nish/ui';

<NishProvider
  locale="fr-FR"
  dir="ltr"
  strings={{ close: 'Fermer', themeToggleLabel: (current, next) => \`Thème : \${current}. Passer à \${next}\` }}
  portalContainer={document.getElementById('overlays')}
>
  <App />
</NishProvider>

// Inside your own component:
const strings = useNishStrings();
const { locale, dir } = useNishConfig();`,
  guidelines: [
    'Mount one NishProvider near the root. Pass a stable strings object (module constant or useMemo), since a new object each render re-renders every component that reads strings.',
    'A prop on one component (label, closeLabel, aria-label) always wins over the provider.',
    'The provider sets direction for components that read it; it does not set the dir attribute. Put dir="rtl" on html or your root element too.',
    'Custom elements (nish-*) do not read React context: use configureStrings() for them.',
    'locale feeds RelativeTime and charts. The formatters keep en-US unless you pass a locale or call setDefaultLocale().',
    'portalContainer={null} on a nested provider resets the container to document.body; leaving the prop out inherits the outer one.',
  ],
};
