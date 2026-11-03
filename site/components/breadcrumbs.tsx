import { Breadcrumbs, type BreadcrumbItem } from '../../src/components/breadcrumbs';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

const SHORT: BreadcrumbItem[] = [{ label: 'Home', href: '#/' }, { label: 'Components', href: '#/components' }, { label: 'Breadcrumbs' }];
const LONG: BreadcrumbItem[] = [
  { label: 'Home', href: '#/' },
  { label: 'Projects', href: '#/projects' },
  { label: 'Acme', href: '#/projects/acme' },
  { label: 'Boards', href: '#/projects/acme/boards' },
  { label: 'Roadmap', href: '#/projects/acme/boards/roadmap' },
  { label: 'Q4' },
];

export const breadcrumbs: ComponentDoc = {
  id: 'breadcrumbs',
  name: 'Breadcrumbs',
  exports: ['Breadcrumbs'],
  summary:
    'The trail from the root to the current page. The last crumb is the current page (aria-current="page"). A long trail collapses its middle crumbs into a "…" menu on narrow containers. Hrefs go through safeUrl.',
  importLine: "import { Breadcrumbs } from '@nish/ui';",
  controls: [
    { key: 'collapse', label: 'Collapse', type: 'select', options: ['auto', 'always', 'never'] },
    { key: 'maxItems', label: 'Max items', type: 'number', min: 2, max: 8 },
    { key: 'long', label: 'Long trail', type: 'boolean' },
  ],
  initial: { collapse: 'auto', maxItems: 4, long: true },
  render: (a) => (
    <Breadcrumbs
      items={a.long ? LONG : SHORT}
      collapse={a.collapse === 'always' || a.collapse === 'never' ? a.collapse : 'auto'}
      maxItems={Number(a.maxItems)}
    />
  ),
  code: (a) =>
    jsx('Breadcrumbs', {
      items: '{items}',
      collapse: a.collapse === 'auto' ? undefined : a.collapse,
      maxItems: Number(a.maxItems) === 4 ? undefined : Number(a.maxItems),
    }),
  stories: [
    { id: 'short', name: 'Short trail', render: () => <Breadcrumbs items={SHORT} /> },
    { id: 'long', name: 'Collapsed (always)', render: () => <Breadcrumbs items={LONG} collapse="always" /> },
    { id: 'sep', name: 'Custom separator', render: () => <Breadcrumbs items={SHORT} separator="/" /> },
    {
      id: 'children',
      name: 'Children',
      render: () => (
        <Breadcrumbs>
          <a href="#/" className="text-th-hi3 hover:text-th-hi">
            Home
          </a>
          <a href="#/components" className="text-th-hi3 hover:text-th-hi">
            Components
          </a>
          <a href="#/components/breadcrumbs">Breadcrumbs</a>
        </Breadcrumbs>
      ),
    },
  ],
  usage: `import { Breadcrumbs } from '@nish/ui';

<Breadcrumbs items={[
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Acme' },
]} />

// With a router
<Breadcrumbs items={items} renderLink={(item, props) => <Link to={props.href} {...props} />} />`,
  guidelines: [
    'List the trail root first. The last item is the current page and is never a link.',
    'Collapsing keeps the first crumb and the last maxItems - 2. In the menu, an item with onClick runs it; one with only an href navigates with window.location, so give router users an onClick.',
    'Crumbs passed as children are never collapsed; the last child gets aria-current="page".',
    'The chevron mirrors in right-to-left layouts. The landmark label and the "…" button label come from NishProvider strings.',
  ],
};
