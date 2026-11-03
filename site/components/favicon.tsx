import { Favicon } from '../../src';
import { googleFavicon } from '../../src/components/data';
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
    'A site\'s favicon at a fixed size, for link lists and bookmarks. Out of the box it makes no request at all and shows a colored letter avatar; give it an image with src, a resolver with resolve, or set one for the whole app with configureFavicons. While an image loads, when it fails or when the address is not valid the avatar shows too, so a list never jumps or shows a broken image. Decorative: it is hidden from screen readers.',
  importLine: "import { Favicon, configureFavicons, googleFavicon } from '@nish/ui';",
  controls: [
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'size', label: 'Size (px)', type: 'number', min: 12, max: 64 },
    { key: 'label', label: 'Fallback letter from', type: 'text' },
    { key: 'resolver', label: 'Resolver', type: 'select', options: ['none (default)', 'google'] },
  ],
  initial: { url: 'https://github.com', size: 24, label: '', resolver: 'none (default)' },
  render: (a) => (
    <Favicon url={String(a.url)} size={Number(a.size)} label={String(a.label) || undefined} resolve={a.resolver === 'google' ? googleFavicon : undefined} />
  ),
  code: (a) =>
    jsx('Favicon', {
      url: a.url,
      size: Number(a.size) === 16 ? undefined : Number(a.size),
      label: a.label || undefined,
      resolve: a.resolver === 'google' ? '{googleFavicon}' : undefined,
    }),
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
  usage: `import { Favicon, configureFavicons, googleFavicon } from '@nish/ui';

// Once, at startup: opt in to one provider for every Favicon and LinkCard.
// Without this call no request is made and every site gets a letter avatar.
configureFavicons({ resolve: googleFavicon });

// Or per icon: your own resolver, or a fixed image.
<Favicon url={bookmark.url} resolve={(host, size) => \`/icons/\${host}.png\`} />
<Favicon url={bookmark.url} src={bookmark.icon} />

<a href={bookmark.url} className="flex items-center gap-2">
  <Favicon url={bookmark.url} label={bookmark.title} />
  {bookmark.title}
</a>`,
  guidelines: [
    'Nothing is requested by default: the avatar shows. The page that opts in decides where icons come from. googleFavicon asks google.com for the host and tells Google which sites you show; use your own resolver or a proxy when that matters (it also needs img-src to allow the provider under a strict CSP).',
    'Order: src (used as is) wins, then the resolve prop, then configureFavicons. A resolver returns null for "no image". Unsafe URLs (javascript:, data:) are ignored.',
    'Images load lazily with referrerPolicy no-referrer, so your page address never goes to the icon host.',
    'Always pass label when you have a title: the fallback letter then matches what the user sees.',
    'It is decorative (aria-hidden). Put the site name in text next to it.',
    'Inside a LinkCard, pass it as the icon at size 20, or set favicon on the LinkCard.',
  ],
};
