import { useMemo } from 'react';
import { Badge, Chip, ChipGroup, FilterBar, Select, useUrlState, type UrlStateAdapter } from '../../src';
import { jsx } from '../lib/jsx';
import { Device } from './bottom-nav';
import type { ComponentDoc } from './types';

// --- FilterBar, FilterSheet and useUrlState -------------------------------------------------
// Registered by the integrator: needs the filter exports in src/index.ts and the names in
// site/docgen.mjs COMPONENTS before COMPONENT_DOCS can list it.

type Status = 'open' | 'interview' | 'offer' | 'closed';

const STATUSES: { value: Status; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'closed', label: 'Closed' },
];

const JOBS: { id: number; title: string; company: string; status: Status; salary: number }[] = [
  { id: 1, title: 'Staff Engineer', company: 'Northwind', status: 'open', salary: 210 },
  { id: 2, title: 'Platform Engineer', company: 'Contoso', status: 'interview', salary: 185 },
  { id: 3, title: 'Frontend Lead', company: 'Fabrikam', status: 'offer', salary: 195 },
  { id: 4, title: 'Data Engineer', company: 'Tailspin', status: 'closed', salary: 170 },
  { id: 5, title: 'Site Reliability Engineer', company: 'Litware', status: 'open', salary: 180 },
  { id: 6, title: 'Backend Engineer', company: 'Adventure Works', status: 'interview', salary: 175 },
  { id: 7, title: 'Engineering Manager', company: 'Wingtip', status: 'open', salary: 220 },
  { id: 8, title: 'Mobile Engineer', company: 'Proseware', status: 'closed', salary: 165 },
  { id: 9, title: 'Security Engineer', company: 'Woodgrove', status: 'open', salary: 190 },
  { id: 10, title: 'Machine Learning Engineer', company: 'Lucerne', status: 'interview', salary: 200 },
  { id: 11, title: 'Design Engineer', company: 'Margie', status: 'offer', salary: 172 },
  { id: 12, title: 'Developer Advocate', company: 'Coho', status: 'closed', salary: 150 },
];

const DEFAULTS = { q: '', status: [] as string[], sort: 'newest' };

/** The docs site routes with the hash, so locationAdapter would fight it: keep the query in memory. */
function useMemoryAdapter(): UrlStateAdapter {
  return useMemo(() => {
    let params = new URLSearchParams();
    const listeners = new Set<() => void>();
    return {
      get: () => new URLSearchParams(params),
      set(next) {
        params = new URLSearchParams(next);
        listeners.forEach((l) => l());
      },
      subscribe(l) {
        listeners.add(l);
        return () => {
          listeners.delete(l);
        };
      },
    };
  }, []);
}

function JobsList({ sticky = false, sheetBelow = 'md' as 'md' | 'lg', withSearch = true }) {
  const adapter = useMemoryAdapter();
  const [f, patch, reset] = useUrlState(DEFAULTS, { adapter });
  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const list = JOBS.filter(
      (j) => (!q || `${j.title} ${j.company}`.toLowerCase().includes(q)) && (f.status.length === 0 || f.status.includes(j.status)),
    );
    if (f.sort === 'salary') return [...list].sort((a, b) => b.salary - a.salary);
    if (f.sort === 'company') return [...list].sort((a, b) => a.company.localeCompare(b.company));
    return list;
  }, [f.q, f.status, f.sort]);
  const activeCount = (f.q ? 1 : 0) + f.status.length;

  return (
    <div className="w-full px-[var(--nish-page-gutter,1rem)] py-4">
      <FilterBar
        sticky={sticky}
        sheetBelow={sheetBelow}
        search={withSearch ? { value: f.q, onChange: (q) => patch({ q }), placeholder: 'Search jobs' } : undefined}
        activeCount={activeCount}
        onClear={reset}
        summary={`${rows.length} ${rows.length === 1 ? 'job' : 'jobs'}`}
        trailing={
          <Select aria-label="Sort by" value={f.sort} onChange={(e) => patch({ sort: e.target.value })} className="w-auto">
            <option value="newest">Newest</option>
            <option value="salary">Salary</option>
            <option value="company">Company</option>
          </Select>
        }
      >
        <ChipGroup label="Filter by status">
          {STATUSES.map((s) => (
            <Chip
              key={s.value}
              pressed={f.status.includes(s.value)}
              onClick={() =>
                patch((prev) => ({ status: prev.status.includes(s.value) ? prev.status.filter((v) => v !== s.value) : [...prev.status, s.value] }))
              }
            >
              {s.label}
            </Chip>
          ))}
        </ChipGroup>
      </FilterBar>
      <ul className="mt-3 divide-y divide-th-line rounded-xl border border-th-line bg-th-surface">
        {rows.map((j) => (
          <li key={j.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-th-hi">{j.title}</p>
              <p className="truncate text-sm text-th-hi3">
                {j.company} · ${j.salary}k
              </p>
            </div>
            <Badge tone={j.status === 'offer' ? 'ok' : j.status === 'closed' ? 'neutral' : j.status === 'interview' ? 'info' : 'accent'}>{j.status}</Badge>
          </li>
        ))}
        {rows.length === 0 ? <li className="px-4 py-6 text-center text-sm text-th-hi3">No jobs match these filters.</li> : null}
      </ul>
    </div>
  );
}

export const filterBar: ComponentDoc = {
  id: 'filter-bar',
  name: 'FilterBar',
  exports: ['FilterBar', 'FilterSheet'],
  summary:
    'The search and filter row of a list page. From 768px the filter controls sit inline next to the search box; below it they move into a bottom sheet behind a Filters button that shows how many filters are on. useUrlState keeps the filters in the query string, so a filtered list can be shared and survives a reload.',
  importLine: "import { FilterBar, FilterSheet, useUrlState } from '@nish/ui';",
  controls: [
    { key: 'sticky', label: 'Sticky', type: 'boolean' },
    { key: 'search', label: 'Search box', type: 'boolean' },
    { key: 'sheetBelow', label: 'Sheet below', type: 'select', options: ['md', 'lg'] },
  ],
  initial: { sticky: false, search: true, sheetBelow: 'md' },
  render: (a) => (
    <Device doc="filter-bar" args={a} title="FilterBar at 360px" height={560}>
      <JobsList sticky={!!a.sticky} withSearch={!!a.search} sheetBelow={a.sheetBelow === 'lg' ? 'lg' : 'md'} />
    </Device>
  ),
  code: (a) =>
    [
      'const [f, patch, reset] = useUrlState({ q: \'\', status: [], sort: \'newest\' });',
      '',
      jsx(
        'FilterBar',
        {
          search: a.search ? '{{ value: f.q, onChange: (q) => patch({ q }) }}' : undefined,
          activeCount: '{activeCount}',
          onClear: '{reset}',
          trailing: '{<SortSelect />}',
          sticky: a.sticky ? true : undefined,
          sheetBelow: a.sheetBelow === 'lg' ? 'lg' : undefined,
          summary: '{`${rows.length} jobs`}',
        },
        '<StatusChips />',
      ),
    ].join('\n'),
  stories: [
    {
      id: 'wide',
      name: 'Wide (1024px): controls inline',
      note: 'From md the Chips sit next to the search box, Clear filters appears once a filter is on, and the sort Select stays on the right.',
      wide: true,
      render: () => (
        <Device doc="filter-bar" story="wide" width={1024} height={460} title="FilterBar at 1024px">
          <JobsList />
        </Device>
      ),
    },
    {
      id: 'unfolded',
      name: 'Unfolded (840px) with sheetBelow="lg"',
      note: 'A wide filter set can keep the sheet until 1024px.',
      wide: true,
      render: () => (
        <Device doc="filter-bar" story="unfolded" width={840} height={460} title="FilterBar at 840px, sheet below lg">
          <JobsList sheetBelow="lg" />
        </Device>
      ),
    },
  ],
  usage: `import { Chip, ChipGroup, FilterBar, Select, useUrlState } from '@nish/ui';

const DEFAULTS = { q: '', status: [] as string[], sort: 'newest' };

export function Jobs({ jobs }) {
  const [f, patch, reset] = useUrlState(DEFAULTS);
  const rows = filterJobs(jobs, f);
  const activeCount = (f.q ? 1 : 0) + f.status.length;
  return (
    <>
      <FilterBar
        sticky
        search={{ value: f.q, onChange: (q) => patch({ q }), placeholder: 'Search jobs' }}
        activeCount={activeCount}
        onClear={reset}
        summary={\`\${rows.length} jobs\`}
        trailing={
          <Select aria-label="Sort by" value={f.sort} onChange={(e) => patch({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="salary">Salary</option>
          </Select>
        }
      >
        <ChipGroup label="Filter by status">
          {STATUSES.map((s) => (
            <Chip
              key={s}
              pressed={f.status.includes(s)}
              onClick={() => patch((p) => ({ status: p.status.includes(s) ? p.status.filter((v) => v !== s) : [...p.status, s] }))}
            >
              {s}
            </Chip>
          ))}
        </ChipGroup>
      </FilterBar>
      <JobList rows={rows} />
    </>
  );
}

// React Router: pass an adapter backed by useSearchParams.
// useUrlState(DEFAULTS, { adapter, prefix: 'j' })  ->  ?j.q=rust&j.status=open`,
  guidelines: [
    'Filter state belongs to the page. FilterBar only lays the controls out; useUrlState is the usual place to keep them.',
    'useUrlState replaces the history entry (no Back-button trail of keystrokes) and leaves the hash, history.state and unknown query keys alone. Values equal to the default are left out of the URL.',
    'Pass activeCount so the Filters button shows how many filters are on; without it a phone user cannot tell that the list is filtered.',
    'Put the one control people change most (a sort Select, a view toggle) in trailing: it stays visible at every width.',
    'On a router that owns the URL, pass an adapter built on its search-params hook instead of the default location adapter.',
    'Do not put controls that need the whole row (a date range with two fields) inline on a phone: they belong in the sheet, which is where children go below md.',
  ],
  api: { functions: ['useUrlState'], interfaces: ['FilterBarProps', 'FilterSheetProps', 'UrlStateAdapter'] },
};
