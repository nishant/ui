import { useMemo, useState } from 'react';
import { Input, useTheme } from '../../src';
import { COMPONENT_DOCS, type ComponentDoc } from '../components';
import { href } from '../lib/router';
import { PageHeader } from '../lib/ui';
import { frameUrl } from './component';

/** One tile: the component as it renders with its starting props, its name, and a way into its page. */
function Tile({ doc }: { doc: ComponentDoc }) {
  const { theme } = useTheme();
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-th-line bg-th-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-th-line px-4 py-2.5">
        <h2 className="min-w-0 truncate text-sm font-semibold text-th-hi">{doc.name}</h2>
        <a href={href(`/components/${doc.id}`)} className="shrink-0 text-xs font-medium text-th-accent hover:underline pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center">
          Open <span aria-hidden="true">&rarr;</span>
          <span className="sr-only"> {doc.name}</span>
        </a>
      </header>
      {doc.framed ? (
        // Portaled components (Toast, Modal, Tooltip) need a whole document of their own.
        <iframe key={theme} src={frameUrl(doc, { theme, args: doc.initial })} title={`${doc.name} preview`} className="block w-full border-0 bg-th-bg" style={{ height: doc.framed.height }} />
      ) : (
        <div className="doc-canvas flex min-h-40 flex-1 items-center justify-center overflow-x-auto p-6">{doc.render(doc.initial)}</div>
      )}
      <p className="border-t border-th-line px-4 py-2.5 text-xs leading-relaxed text-th-hi3">{doc.summary}</p>
    </article>
  );
}

export function WallPage() {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? COMPONENT_DOCS.filter((d) => `${d.name} ${d.summary}`.toLowerCase().includes(needle)) : COMPONENT_DOCS;
  }, [q]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Components"
        title="All components"
        lead={`Every component on one page, rendered with its starting props. Switch the theme in the header to see them all change at once; open one for its controls, variants, props and usage.`}
      >
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <label className="grid w-full max-w-sm gap-1.5">
            <span className="sr-only">Filter components</span>
            <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter components" aria-label="Filter components" />
          </label>
          <p className="text-sm text-th-hi3" aria-live="polite">
            {shown.length} of {COMPONENT_DOCS.length}
          </p>
        </div>
      </PageHeader>

      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((doc) => (
            <Tile key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-th-hi2">No component matches &ldquo;{q}&rdquo;.</p>
      )}
    </div>
  );
}
