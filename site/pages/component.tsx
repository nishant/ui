import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import docgen from 'virtual:nish-docgen';
import { Card, cn, CopyButton, Input, PRESETS, Select, SectionNav, Switch, tabClass, useTheme, type ThemeName } from '../../src';
import { COMPONENT_DOCS, RealModalButton, type ComponentDoc, type Control, type Story } from '../components';
import { CodeBlock } from '../lib/code';
import { ExternalIcon } from '../lib/icons';
import type { Args } from '../lib/jsx';
import { href } from '../lib/router';
import { PageHeader, PropsTable, Section, ThemeColumns } from '../lib/ui';

const REPO = 'https://github.com/nishant/ui';

/** URL of a preview frame: this same page, routed to #/frame/… */
export function frameUrl(doc: ComponentDoc, opts: { story?: string; theme?: ThemeName; args?: Args }): string {
  const q = new URLSearchParams();
  if (opts.story) q.set('story', opts.story);
  if (opts.theme) q.set('theme', opts.theme);
  if (opts.args) q.set('args', JSON.stringify(opts.args));
  return `${location.href.split('#')[0]}#/frame/${doc.id}?${q}`;
}

function Frame({ src, height, title, frameRef }: { src: string; height: number; title: string; frameRef?: React.Ref<HTMLIFrameElement> }) {
  return <iframe ref={frameRef} src={src} title={title} className="block w-full border-0 bg-th-bg" style={{ height }} />;
}

function ControlInput({ c, value, onChange }: { c: Control; value: Args[string]; onChange: (v: Args[string]) => void }) {
  if (c.type === 'boolean') {
    return <Switch checked={!!value} onChange={onChange} label={c.label} size="sm" className="w-full justify-between" />;
  }
  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-th-hi2">{c.label}</span>
      {c.type === 'select' ? (
        <Select value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {c.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      ) : c.type === 'number' ? (
        <Input type="number" min={c.min} max={c.max} value={Number(value)} onChange={(e) => onChange(Math.max(c.min, Math.min(c.max, Number(e.target.value) || c.min)))} />
      ) : (
        <Input value={String(value)} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function Canvas({ doc }: { doc: ComponentDoc }) {
  const [args, setArgs] = useState<Args>(doc.initial);
  const { theme } = useTheme();
  const frame = useRef<HTMLIFrameElement>(null);
  // The frame loads once per theme with the starting args; later changes go by message.
  const src = useMemo(() => (doc.framed ? frameUrl(doc, { theme, args }) : ''), [doc, theme]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: 'nish-args', args }, '*');
  }, [args]);

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-w-0 flex-col">
          {doc.framed ? (
            <Frame frameRef={frame} src={src} height={doc.framed.height} title={`${doc.name} preview`} />
          ) : (
            <div className="doc-canvas flex min-h-60 flex-1 items-center justify-center p-6 sm:p-10">{doc.render(args)}</div>
          )}
        </div>
        <div className="space-y-4 border-t border-th-line bg-th-surface p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-th-hi3">Controls</p>
            <button type="button" onClick={() => setArgs(doc.initial)} className="rounded text-xs font-medium text-th-accent hover:underline pointer-coarse:min-h-11 pointer-coarse:px-2">
              Reset
            </button>
          </div>
          {doc.controls.map((c) => (
            <ControlInput key={c.key} c={c} value={args[c.key]} onChange={(v) => setArgs((a) => ({ ...a, [c.key]: v }))} />
          ))}
          {doc.id === 'modal' ? <RealModalButton /> : null}
        </div>
      </div>
      <div className="border-t border-th-line p-3">
        <CodeBlock code={doc.code(args)} title="Usage with these controls" />
      </div>
    </Card>
  );
}

function StoryCard({ doc, story, theme }: { doc: ComponentDoc; story: Story; theme: ThemeName }) {
  return (
    <div className={cn('flex min-w-0 flex-col overflow-hidden rounded-xl border border-th-line bg-th-surface', (story.wide || doc.framed) && 'sm:col-span-2')}>
      <div className="border-b border-th-line px-4 py-2.5">
        <h3 className="text-sm font-semibold text-th-hi">{story.name}</h3>
        {story.note ? <p className="mt-0.5 text-xs text-th-hi3">{story.note}</p> : null}
      </div>
      {doc.framed ? (
        <Frame key={theme} src={frameUrl(doc, { story: story.id, theme })} height={doc.framed.height} title={`${doc.name}: ${story.name}`} />
      ) : (
        <div className="doc-canvas flex min-h-36 flex-1 items-center justify-center p-6">{story.render()}</div>
      )}
    </div>
  );
}

function ApiDocs({ doc }: { doc: ComponentDoc }) {
  if (!doc.api) return null;
  return (
    <>
      {doc.api.functions.map((name) => {
        const fn = docgen.functions[name];
        return (
          <div key={name} className="space-y-2">
            <h3 className="font-mono text-sm font-semibold text-th-hi">{name}</h3>
            {fn.description ? <p className="text-sm text-th-hi2">{fn.description}</p> : null}
            <CodeBlock code={fn.signatures.join('\n')} title="Signature" />
          </div>
        );
      })}
      {doc.api.interfaces.map((name) => (
        <div key={name} className="space-y-2">
          <h3 className="font-mono text-sm font-semibold text-th-hi">{name}</h3>
          <PropsTable rows={docgen.interfaces[name].props} />
        </div>
      ))}
    </>
  );
}

export function ComponentPage({ id, view }: { id: string; view: 'docs' | 'themes' }) {
  const doc = COMPONENT_DOCS.find((d) => d.id === id);
  const { theme } = useTheme();
  if (!doc) return <p className="text-th-hi2">No component called {id}.</p>;
  const file = doc.source ?? docgen.components[doc.exports[0]]?.file;
  const tabs = [
    { id: 'docs', label: 'Docs', to: `/components/${doc.id}` },
    { id: 'themes', label: 'All themes', to: `/components/${doc.id}/themes` },
  ];

  const hasProps = doc.exports.length > 0 || !!doc.api;
  const jumps = [
    { id: 'usage', label: 'Usage' },
    { id: 'preview', label: 'Preview' },
    { id: 'stories', label: 'Stories' },
    ...(hasProps ? [{ id: 'props', label: 'Props' }] : []),
    { id: 'guidelines', label: 'Guidelines' },
  ];

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Component" title={doc.name} lead={doc.summary}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-th-line bg-th-surface py-1 pl-3 pr-1">
            <code className="min-w-0 truncate font-mono text-[13px] text-th-hi">{doc.importLine}</code>
            <CopyButton text={doc.importLine} iconOnly label="Copy import line" />
          </div>
          <a
            href={`${REPO}/blob/master/${file}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-th-hi2 hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11"
          >
            {file}
            <ExternalIcon size={13} />
          </a>
        </div>
        <nav aria-label={`${doc.name} views`} className="flex gap-1 pt-2">
          {tabs.map((t) => (
            <a
              key={t.id}
              href={href(t.to)}
              aria-current={view === t.id ? 'page' : undefined}
              className={tabClass({ active: view === t.id, variant: 'pill' })}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </PageHeader>

      {view === 'themes' ? (
        <AllThemes doc={doc} />
      ) : (
        <>
          <Section id="usage" title="Usage">
            <CodeBlock code={doc.usage} title={`${doc.name.toLowerCase()}-example.tsx`} collapseAt={12} />
          </Section>
          <SectionNav items={jumps} updateHash={false} label={`${doc.name} sections`} />
          <Section id="preview" title="Preview" note="Change the controls to re-render it. The snippet below follows along.">
            <Canvas doc={doc} />
          </Section>
          <Section id="stories" title="Stories" note={`Every state worth knowing, in the current theme (${PRESETS.find((p) => p.id === theme)?.label}). See them in every theme under All themes.`}>
            <div className="grid gap-4 sm:grid-cols-2">
              {doc.stories.map((s) => (
                <StoryCard key={s.id} doc={doc} story={s} theme={theme} />
              ))}
            </div>
          </Section>
          {hasProps ? (
            <Section id="props" title="Props" note="Generated from the TypeScript source at build time.">
              <div className="space-y-6">
                {doc.exports.filter((name) => docgen.components[name]).map((name) => (
                  <div key={name} className="space-y-2">
                    {doc.exports.length > 1 || doc.api ? <h3 className="font-mono text-sm font-semibold text-th-hi">{name}</h3> : null}
                    {docgen.components[name].description && doc.exports.length > 1 ? (
                      <p className="text-sm text-th-hi2">{docgen.components[name].description}</p>
                    ) : null}
                  <PropsTable doc={docgen.components[name]} />
                </div>
              ))}
              <ApiDocs doc={doc} />
            </div>
          </Section>
          ) : null}
          <Section id="guidelines" title="Guidelines">
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-th-hi2 marker:text-th-ghost">
              {doc.guidelines.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}

function AllThemes({ doc }: { doc: ComponentDoc }) {
  return (
    <Section
      title="All themes"
      note={
        <>
          Every story in all seven themes at once. Each column is a <code className="inline">[data-theme]</code> container, so the components inside
          read that theme&apos;s variables.{doc.framed ? ' This component renders on document.body, so each story runs in its own frame.' : ''}
        </>
      }
    >
      <ThemeColumns
        min={doc.framed ? 340 : 320}
        render={(theme) => (
          <div className="divide-y divide-th-line">
            {doc.stories.map((s) => (
              <StoryInTheme key={s.id} doc={doc} story={s} theme={theme} />
            ))}
          </div>
        )}
      />
    </Section>
  );
}

function StoryInTheme({ doc, story, theme }: { doc: ComponentDoc; story: Story; theme: ThemeName }): ReactNode {
  return (
    <div className="min-w-0">
      <p className="px-3.5 pt-3 text-xs font-medium text-th-hi3">{story.name}</p>
      {doc.framed ? (
        <div className="p-3">
          <div className="overflow-hidden rounded-lg border border-th-line">
            <Frame src={frameUrl(doc, { story: story.id, theme })} height={doc.framed.height} title={`${doc.name}: ${story.name}, ${theme}`} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-20 items-center p-3.5">{story.render()}</div>
      )}
    </div>
  );
}
