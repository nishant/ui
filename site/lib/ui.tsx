import type { ReactNode } from 'react';
import type { ComponentDocgen, PropDoc } from 'virtual:nish-docgen';
import { Badge, cn, PageHeader as DsPageHeader, PRESETS, useMediaQuery, type ThemeName } from '../../src';

/** A docs page's title block: the DS PageHeader, plus a slot under it for the import line, links and view tabs. */
export function PageHeader({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-3 border-b border-th-line pb-6">
      <DsPageHeader eyebrow={<span className="font-semibold tracking-[0.08em] text-th-accent">{eyebrow}</span>} title={title} description={lead} className="[&_h1]:text-3xl sm:[&_h1]:text-4xl [&_p:not(:first-child)]:max-w-2xl [&_p:not(:first-child)]:text-base [&_p:not(:first-child)]:leading-relaxed" />
      {children}
    </div>
  );
}

export function Section({ id, title, note, children, className }: { id?: string; title: string; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('nish-scroll-target space-y-4', className)}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-th-hi">{title}</h2>
        {note ? <div className="max-w-2xl text-sm leading-relaxed text-th-hi2">{note}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('doc-prose max-w-2xl text-[15px] leading-relaxed text-th-hi2', className)}>{children}</div>;
}

/** A subtree in another theme. tokens.css re-declares every variable on [data-theme],
 *  and data-scheme keeps the dark:/light: variants and native controls right. */
export function ThemeScope({ theme, children, className }: { theme: ThemeName; children: ReactNode; className?: string }) {
  const preset = PRESETS.find((p) => p.id === theme);
  return (
    <div data-theme={theme} data-scheme={preset?.scheme} style={{ colorScheme: preset?.scheme }} className={cn('bg-th-bg text-th-hi', className)}>
      {children}
    </div>
  );
}

/** One column per theme, labelled. */
export function ThemeColumns({ render, min = 320, className }: { render: (theme: ThemeName) => ReactNode; min?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4', className)} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${min}px), 1fr))` }}>
      {PRESETS.map((p) => (
        <ThemeScope key={p.id} theme={p.id} className="min-w-0 overflow-hidden rounded-xl border border-th-line">
          <div className="flex items-center justify-between gap-2 border-b border-th-line bg-th-surface px-3.5 py-2">
            <span className="text-sm font-semibold text-th-hi">{p.label}</span>
            <span className="font-mono text-xs text-th-hi3">
              {p.id} · {p.scheme}
            </span>
          </div>
          <div className="min-w-0">{render(p.id)}</div>
        </ThemeScope>
      ))}
    </div>
  );
}

const propDescription = (p: PropDoc) =>
  p.description || (p.name === 'className' ? 'Extra classes, merged with cn() so yours win over the defaults.' : '');

export function PropsTable({ doc, rows }: { doc?: ComponentDocgen; rows?: PropDoc[] }) {
  const props = rows ?? doc?.props ?? [];
  const wide = useMediaQuery('(min-width: 640px)');
  return (
    <div className="space-y-3">
      {props.length && !wide ? (
        <ul className="divide-y divide-th-line overflow-hidden rounded-xl border border-th-line bg-th-surface">
          {props.map((p) => (
            <li key={p.name} className="space-y-1.5 px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-[13px] font-semibold text-th-hi [overflow-wrap:anywhere]">{p.name}</code>
                {p.required ? <Badge tone="warn">required</Badge> : null}
              </div>
              <code className="block w-fit max-w-full whitespace-pre-wrap break-words rounded-md bg-th-elevated px-2 py-1 font-mono text-xs text-th-info">{p.type}</code>
              {p.default ? (
                <p className="text-xs text-th-hi3">
                  Default: <code className="font-mono">{p.default}</code>
                </p>
              ) : null}
              {propDescription(p) ? <p className="text-sm text-th-hi2">{propDescription(p)}</p> : null}
            </li>
          ))}
        </ul>
      ) : props.length ? (
        <div className="overflow-x-auto rounded-xl border border-th-line bg-th-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-th-line bg-th-elevated/50 text-xs text-th-hi3">
                <th className="px-4 py-2 font-medium">Prop</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Default</th>
                <th className="px-4 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {props.map((p) => (
                <tr key={p.name} className="border-b border-th-line align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <code className="font-mono text-[13px] font-medium text-th-hi">{p.name}</code>
                    {p.required ? (
                      <Badge tone="warn" className="ml-2 align-middle">
                        required
                      </Badge>
                    ) : null}
                  </td>
                  <td className="max-w-[16rem] px-4 py-2.5">
                    <code className="break-words font-mono text-xs text-th-info">{p.type}</code>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {p.default ? <code className="font-mono text-xs text-th-hi2">{p.default}</code> : <span className="text-th-hi3">–</span>}
                  </td>
                  <td className="min-w-[14rem] px-4 py-2.5 text-th-hi2">{propDescription(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-th-hi2">No props of its own.</p>
      )}
      {doc && (doc.inherits.length || doc.forwardsRef) ? (
        <p className="text-sm text-th-hi3">
          {doc.inherits.length ? (
            <>
              Also takes every attribute of <code className="inline">{doc.inherits.join(', ')}</code>, passed through to the element.{' '}
            </>
          ) : null}
          {doc.forwardsRef ? 'Forwards its ref.' : null}
        </p>
      ) : null}
    </div>
  );
}

