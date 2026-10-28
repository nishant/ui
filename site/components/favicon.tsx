import { Favicon } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Favicon --------------------------------------------------------------------------------

// Addresses that cannot be parsed never ask the network for an icon, so they show the letter avatar.
const SITES = [
  ['https://github.com', 'GitHub'],
  ['https://www.wikipedia.org', 'Wikipedia'],
  ['https://www.mozilla.org', 'Mozilla'],
  ['https://', 'Notes'],
  ['://', 'Recipes'],
  ['https://:', 'Trips'],
] as const;

export const favicon: ComponentDoc = {
  id: 'favicon',
  name: 'Favicon',
  exports: ['Favicon'],
  summary:
    'A site\'s favicon at a fixed size, for link lists and bookmarks. While it loads, when it fails or when the address is not valid it shows a colored letter avatar of the same size, so a list never jumps or shows a broken image. Decorative: it is hidden from screen readers.',
  importLine: "import { Favicon } from '@nish/ui';",
  controls: [
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'size', label: 'Size (px)', type: 'number', min: 12, max: 64 },
    { key: 'label', label: 'Fallback letter from', type: 'text' },
  ],
  initial: { url: 'https://github.com', size: 24, label: '' },
  render: (a) => <Favicon url={String(a.url)} size={Number(a.size)} label={String(a.label) || undefined} />,
  code: (a) => jsx('Favicon', { url: a.url, size: Number(a.size) === 16 ? undefined : Number(a.size), label: a.label || undefined }),
  stories: [
    {
      id: 'sizes',
      name: 'Sizes',
      render: () => (
        <div className="flex items-end gap-3">
          {[16, 20, 24, 32, 48].map((s) => (
            <Favicon key={s} url="https://github.com" size={s} />
          ))}
        </div>
      ),
    },
    {
      id: 'fallbacks',
      name: 'Letter fallbacks',
      note: 'Addresses that cannot be parsed show the avatar straight away; so does a real site whose icon fails to load. The color comes from the 8 chart colors by a hash of the label, so a site always gets the same avatar.',
      render: () => (
        <ul className="m-0 grid list-none gap-2 p-0">
          {SITES.map(([url, label]) => (
            <li key={label} className="flex items-center gap-3 text-sm text-th-hi">
              <Favicon url={url} label={label} size={24} />
              <span>{label}</span>
              <span className="text-th-hi3">{url}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'list',
      name: 'In a bookmark list',
      render: () => (
        <ul className="m-0 w-full list-none rounded-xl border border-th-line bg-th-surface p-2">
          {SITES.slice(0, 4).map(([url, label]) => (
            <li key={label} className="flex min-h-11 items-center gap-3 px-2 text-sm text-th-hi">
              <Favicon url={url} label={label} />
              {label}
            </li>
          ))}
        </ul>
      ),
    },
  ],
  usage: `import { Favicon } from '@nish/ui';

<a href={bookmark.url} className="flex items-center gap-2">
  <Favicon url={bookmark.url} label={bookmark.title} />
  {bookmark.title}
</a>`,
  guidelines: [
    'It requests the icon from Google\'s favicon service by host name only, at twice the size for sharp screens. Only the host leaves the page, never the path.',
    'Always pass label when you have a title: the fallback letter then matches what the user sees.',
    'It is decorative (aria-hidden). Put the site name in text next to it.',
    'Inside a LinkCard, pass it as the icon at size 20.',
  ],
};
