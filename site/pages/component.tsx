import { lazy, Suspense, use, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import docgen from 'virtual:nish-docgen';
import pkg from 'virtual:nish-pkg';
import { Callout, Card, cn, CopyButton, Input, PRESETS, Select, SectionNav, Switch, Tabs, tabClass, useTheme, type ThemeName } from '../../src';
import type { ComponentDoc, Control, Story } from '../components/types';
import { CodeBlock, nishName } from '../lib/code';
import { loadDoc, loadDocModule } from '../lib/docs';
import { ExternalIcon } from '../lib/icons';
import type { Args } from '../lib/jsx';
import { href } from '../lib/router';
import { PageHeader, PropsTable, Section, ThemeColumns } from '../lib/ui';

const REPO = 'https://github.com/nishant/ui';

/** Source links point at the release the page documents, not at master, so they cannot drift. */
const SOURCE_REF = `v${pkg.version}`;

/** The real Modal demo button lives in the modal doc's file; load it only on the modal page. */
const RealModalButton = lazy(() => loadDocModule('modal.tsx').then((m) => ({ default: m.RealModalButton as ComponentType })));

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

type CodeTab = 'react' | 'html';
const CODE_TAB_KEY = 'nish-docs-code-tab';

function readCodeTab(): CodeTab {
  try {
    return localStorage.getItem(CODE_TAB_KEY) === 'html' ? 'html' : 'react';
  } catch {
    return 'react';
  }
}

/** The snippets name the jsDelivr copy; the live frame swaps in this site's own dist files. */
const CDN_DIST = /https:\/\/cdn\.jsdelivr\.net\/npm\/nish-ui@[\w.-]+\/dist\//g;

/** The vendored dist files, resolved against this page (hash routes, so drop the hash). */
function nishBase(): string {
  return new URL('static-example/nish/', location.href.split('#')[0]).href;
}

function frameDocument(code: string): string {
  const base = nishBase();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script src="${base}theme-init.js"></script>
<link rel="stylesheet" href="${base}nish.css">
<link rel="stylesheet" href="${base}nish-components.css">
<script type="module" src="${base}elements.js"></script>
<script type="module" src="${base}elements-forms.js"></script>
<script type="module" src="${base}elements-data.js"></script>
<script type="module" src="${base}elements-charts.js"></script>
<style>body{margin:0;padding:16px}</style></head><body>${code.replace(CDN_DIST, base)}</body></html>`;
}

/** The HTML snippet running in a frame of its own, kept in step with this site's theme. */
function HtmlFrame({ code, height, title }: { code: string; height: number; title: string }) {
  const { theme } = useTheme();
  const ref = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => frameDocument(code), [code]);
  const sync = () => {
    const root = ref.current?.contentDocument?.documentElement;
    const parent = document.documentElement;
    if (!root) return;
    for (const a of ['data-theme', 'data-scheme']) {
      const v = parent.getAttribute(a);
      if (v) root.setAttribute(a, v);
    }
    root.style.colorScheme = parent.style.colorScheme;
  };
  useEffect(sync, [theme]);
  return (
    <div className="overflow-hidden rounded-lg border border-th-line">
      <iframe ref={ref} srcDoc={srcDoc} onLoad={sync} title={title} className="mx-auto block w-full border-0 bg-th-bg" style={{ height }} />
    </div>
  );
}

function UsageCode({ doc }: { doc: ComponentDoc }) {
  const [tab, setTab] = useState<CodeTab>(readCodeTab);
  const react = <CodeBlock code={doc.usage} title={`${doc.name.toLowerCase()}-example.tsx`} collapseAt={12} />;
  if (!doc.html) return react;
  const pick = (v: string) => {
    setTab(v as CodeTab);
    try {
      localStorage.setItem(CODE_TAB_KEY, v);
    } catch {
      /* the choice just is not remembered */
    }
  };
  return (
    <div className="space-y-3">
      <Tabs
        variant="pill"
        label="Code"
        value={tab}
        onChange={pick}
        items={[
          { value: 'react', label: 'React' },
          { value: 'html', label: 'HTML' },
        ]}
      />
      {tab === 'react' ? (
        react
      ) : (
        <>
          <CodeBlock code={doc.html.code.replaceAll('nish-ui@X.Y.Z', `nish-ui@${pkg.version}`)} title={`${doc.id}.html`} collapseAt={16} />
          <p className="text-sm text-th-hi3">
            Live, with no React. The page links <code className="inline">nish.css</code>, <code className="inline">nish-components.css</code> and{' '}
            the element files (<code className="inline">elements*.js</code>); see{' '}
            <a className="doc-link" href={href('/static-sites')}>
              Static sites
            </a>
            .
          </p>
          <HtmlFrame code={doc.html.code} height={doc.html.height ?? 220} title={`${doc.name} as HTML`} />
        </>
      )}
    </div>
  );
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
          {doc.id === 'modal' ? (
            <Suspense fallback={null}>
              <RealModalButton />
            </Suspense>
          ) : null}
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
        {story.note ? <p className="mt-0.5 text-xs text-th-hi3">{typeof story.note === 'string' ? nishName(story.note) : story.note}</p> : null}
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
        if (!fn) return null;
        return (
          <div key={name} className="space-y-2">
            <h3 className="font-mono text-sm font-semibold text-th-hi">{name}</h3>
            {fn.description ? <p className="text-sm text-th-hi2">{fn.description}</p> : null}
            <CodeBlock code={fn.signatures.join('\n')} title="Signature" />
          </div>
        );
      })}
      {doc.api.interfaces.map((name) => {
        const iface = docgen.interfaces[name];
        if (!iface) return null;
        return (
          <div key={name} className="space-y-2">
            <h3 className="font-mono text-sm font-semibold text-th-hi">{name}</h3>
            <PropsTable rows={iface.props} />
          </div>
        );
      })}
    </>
  );
}

export function ComponentPage({ id, view }: { id: string; view: 'docs' | 'themes' }) {
  const doc = use(loadDoc(id));
  const { theme } = useTheme();
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
      <PageHeader eyebrow="Component" title={doc.name} lead={nishName(doc.summary)}>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-th-line bg-th-surface py-1 pl-3 pr-1">
            <code className="min-w-0 truncate font-mono text-[13px] text-th-hi">{nishName(doc.importLine)}</code>
            <CopyButton text={nishName(doc.importLine)} iconOnly label="Copy import line" />
          </div>
          {file ? (
            <a
              href={`${REPO}/blob/${SOURCE_REF}/${file}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-th-hi2 hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11"
            >
              {file}
              <ExternalIcon size={13} />
            </a>
          ) : null}
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

      {doc.fleetOnly ? (
        <Callout tone="info" title="Fleet-only API">
          Built for the nish.software apps. It can change in a minor release, so a project outside the fleet should not depend on it. Import it from its own entry point, as in
          the import line above.
        </Callout>
      ) : null}

      {view === 'themes' ? (
        <AllThemes doc={doc} />
      ) : (
        <>
          <Section id="usage" title="Usage">
            <UsageCode doc={doc} />
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
                <li key={g}>{nishName(g)}</li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}

function AllThemes({ doc }: { doc: ComponentDoc }) {
  // A framed component opens one frame per theme, for one story at a time (7 frames, not 7 per story).
  const [story, setStory] = useState(doc.stories[0]?.id);
  return (
    <Section
      title="All themes"
      note={
        doc.framed ? (
          <>
            Every story in all seven themes at once. Each column is a <code className="inline">[data-theme]</code> container, so the components inside
            read that theme&apos;s variables. This component renders on document.body, so each theme runs the story picked below in its own frame.
          </>
        ) : (
          <>
            Every story in all seven themes at once. Each column is a <code className="inline">[data-theme]</code> container, so the components inside
            read that theme&apos;s variables.
          </>
        )
      }
    >
      <div className="space-y-4">
        {doc.framed ? (
          <label className="grid w-full max-w-xs gap-1.5">
            <span className="text-sm font-medium text-th-hi">Story</span>
            <Select value={story} onChange={(e) => setStory(e.target.value)}>
              {doc.stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <ThemeColumns
          min={doc.framed ? 340 : 320}
          render={(theme) =>
            doc.framed ? (
              <div className="p-3">
                <div className="overflow-hidden rounded-lg border border-th-line">
                  <Frame
                    key={`${story}${theme}`}
                    src={frameUrl(doc, { story, theme })}
                    height={doc.framed.height}
                    title={`${doc.name}: ${doc.stories.find((s) => s.id === story)?.name ?? ''}, ${theme}`}
                  />
                </div>
              </div>
            ) : (
              <div className="divide-y divide-th-line">
                {doc.stories.map((s) => (
                  <div key={s.id} className="min-w-0">
                    <p className="px-3.5 pt-3 text-xs font-medium text-th-hi3">{s.name}</p>
                    <div className="flex min-h-20 items-center p-3.5">{s.render()}</div>
                  </div>
                ))}
              </div>
            )
          }
        />
      </div>
    </Section>
  );
}
