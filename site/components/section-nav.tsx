import { SectionNav } from '../../src';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- SectionNav -----------------------------------------------------------------------------

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'flights', label: 'Flights', count: 3 },
  { id: 'hotels', label: 'Hotels', count: 2 },
  { id: 'packing', label: 'Packing' },
  { id: 'notes', label: 'Notes' },
];

function Page({ sticky = true, counts = true }: { sticky?: boolean; counts?: boolean }) {
  const items = SECTIONS.map((s) => (counts ? s : { id: s.id, label: s.label }));
  return (
    <div className="px-[var(--nish-page-gutter)] pt-4">
      <h2 className="text-lg font-semibold text-th-hi">Lisbon, March</h2>
      <p className="mb-2 text-sm text-th-hi3">Scroll: the chip of the section you are reading follows.</p>
      <SectionNav items={items} sticky={sticky} updateHash={false} />
      {SECTIONS.map((s) => (
        <section key={s.id} id={s.id} className="nish-scroll-target py-6">
          <h3 className="text-base font-semibold text-th-hi">{s.label}</h3>
          <div className="mt-2 grid gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-xl border border-th-line bg-th-surface p-4 text-sm text-th-hi2">
                {s.label} item {n}
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="h-64" />
    </div>
  );
}

export const sectionNav: ComponentDoc = {
  id: 'section-nav',
  name: 'SectionNav',
  exports: ['SectionNav'],
  summary:
    'A row of jump chips for a long page. It sticks under the app header, marks the section being read (aria-current="true", kept in view) and scrolls to a section when you tap its chip. It publishes its own height as --nish-sticky-extra so anchored sections stop below it.',
  importLine: "import { SectionNav } from '@nish/ui';",
  controls: [
    { key: 'sticky', label: 'Sticky', type: 'boolean' },
    { key: 'counts', label: 'Counts', type: 'boolean' },
  ],
  initial: { sticky: true, counts: true },
  render: (a) => (
    <Device doc="section-nav" args={a} height={420} title="SectionNav at 360px">
      <Page sticky={!!a.sticky} counts={!!a.counts} />
    </Device>
  ),
  code: (a) =>
    [
      '<SectionNav',
      '  items={[',
      ...SECTIONS.map((s) => `    { id: '${s.id}', label: '${s.label}'${a.counts && s.count ? `, count: ${s.count}` : ''} },`),
      '  ]}',
      ...(a.sticky ? [] : ['  sticky={false}']),
      '  updateHash={false} // hash-routed apps',
      '/>',
    ].join('\n'),
  html: {
    height: 400,
    code: `<nish-section-nav label="On this page" sticky="false">
  <a href="#overview">Overview</a>
  <a href="#install">Install</a>
  <a href="#usage">Usage</a>
</nish-section-nav>
<section id="overview" class="nish-scroll-target"><h3>Overview</h3><p>The link of the section you are reading is marked.</p></section>
<section id="install" class="nish-scroll-target"><h3>Install</h3><p>Click a link to scroll to its section.</p></section>
<section id="usage" class="nish-scroll-target"><h3>Usage</h3><p>With update-hash on, the address bar follows.</p></section>
<script>
  document.querySelector('nish-section-nav').addEventListener('nish-select', (e) => console.log(e.detail.id));
</script>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements-data.js"></script>`,
  },
  stories: [
    {
      id: 'sticky',
      name: 'Sticky under the header',
      note: 'Scroll inside the preview. Each section carries class nish-scroll-target.',
      render: () => (
        <Device doc="section-nav" story="sticky" height={420} title="Sticky SectionNav">
          <Page />
        </Device>
      ),
    },
    {
      id: 'inline',
      name: 'Not sticky',
      render: () => (
        <Device doc="section-nav" story="inline" height={320} title="Inline SectionNav">
          <Page sticky={false} counts={false} />
        </Device>
      ),
    },
  ],
  usage: `import { SectionNav } from '@nish/ui';

<SectionNav
  items={[
    { id: 'overview', label: 'Overview' },
    { id: 'flights', label: 'Flights', count: flights.length },
  ]}
/>

<section id="overview" className="nish-scroll-target">…</section>
<section id="flights" className="nish-scroll-target">…</section>`,
  guidelines: [
    'Give every target section an id and the class nish-scroll-target, so a jump stops below the header and this bar.',
    'The default updateHash writes #id; pass updateHash={false} in apps that use hash routing.',
    'Keep labels to a word or two. The row scrolls on a phone, but the chips you need should be on screen without scrolling.',
    'useScrollSpy(ids) is exported for a custom indicator, e.g. a progress rail on desktop.',
  ],
  api: { functions: ['useScrollSpy'], interfaces: [] },
};
