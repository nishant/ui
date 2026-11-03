import { useState } from 'react';
import { Pagination } from '../../src/components/pagination';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

function Demo({ size, pageCount, siblings, boundaries, compact }: { size?: 'sm' | 'md'; pageCount: number; siblings?: number; boundaries?: number; compact?: boolean }) {
  const [page, setPage] = useState(5);
  return <Pagination page={page} onPageChange={setPage} pageCount={pageCount} size={size} siblings={siblings} boundaries={boundaries} compact={compact} />;
}

export const pagination: ComponentDoc = {
  id: 'pagination',
  name: 'Pagination',
  exports: ['Pagination'],
  summary:
    'Page navigation for long lists and tables: numbered pages with ellipses, previous and next, aria-current on the current page. Under 400px of its own width it shows "Page 3 of 10". renderLink makes each control a router link.',
  importLine: "import { Pagination } from '@nish/ui';",
  controls: [
    { key: 'size', label: 'Size', type: 'select', options: ['md', 'sm'] },
    { key: 'pageCount', label: 'Pages', type: 'number', min: 1, max: 100 },
    { key: 'siblings', label: 'Siblings', type: 'number', min: 0, max: 3 },
    { key: 'boundaries', label: 'Boundaries', type: 'number', min: 0, max: 3 },
    { key: 'compact', label: 'Compact', type: 'boolean' },
  ],
  initial: { size: 'md', pageCount: 20, siblings: 1, boundaries: 1, compact: false },
  render: (a) => (
    <Demo
      size={a.size === 'sm' ? 'sm' : 'md'}
      pageCount={Number(a.pageCount)}
      siblings={Number(a.siblings)}
      boundaries={Number(a.boundaries)}
      compact={a.compact ? true : undefined}
    />
  ),
  code: (a) =>
    jsx('Pagination', {
      page: '{page}',
      onPageChange: '{setPage}',
      pageCount: Number(a.pageCount),
      siblings: Number(a.siblings) === 1 ? undefined : Number(a.siblings),
      boundaries: Number(a.boundaries) === 1 ? undefined : Number(a.boundaries),
      size: a.size === 'md' ? undefined : a.size,
      compact: a.compact,
    }),
  stories: [
    { id: 'default', name: 'Default', render: () => <Demo pageCount={20} /> },
    { id: 'small', name: 'Small', render: () => <Demo pageCount={20} size="sm" /> },
    { id: 'short', name: 'Few pages (no ellipses)', render: () => <Demo pageCount={5} /> },
    { id: 'wide', name: 'More siblings and boundaries', wide: true, render: () => <Demo pageCount={40} siblings={2} boundaries={2} /> },
    { id: 'compact', name: 'Compact (also under 400px of width)', render: () => <Demo pageCount={10} compact /> },
    {
      id: 'links',
      name: 'Router links (renderLink)',
      render: () => (
        <Pagination
          defaultPage={2}
          pageCount={6}
          renderLink={(p, props) => <a href={`#/components/pagination?page=${p}`} {...props} />}
        />
      ),
    },
  ],
  usage: `import { Pagination } from '@nish/ui';

const [page, setPage] = useState(1);

<Pagination page={page} onPageChange={setPage} pageCount={Math.ceil(total / pageSize)} />

// With a router: every control is a real link
<Pagination
  page={page}
  pageCount={pages}
  renderLink={(p, props) => <Link to={\`?page=\${p}\`} {...props} />}
/>`,
  guidelines: [
    'Pages are 1-based. The component clamps page to 1..pageCount.',
    'The row keeps the same number of slots wherever the current page is, so the controls do not jump as you page.',
    'With renderLink, page state still follows clicks; read page from the URL and pass it in to keep one source of truth.',
    'The compact "Page 3 of 10" text is English by default; pass compactLabel for other languages. Labels for previous, next and each page come from NishProvider strings.',
    'Every control is at least 44px on touch screens. Page 1 and the last page stay reachable through the boundaries.',
  ],
};
