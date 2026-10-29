import { useState } from 'react';
import docgen from 'virtual:nish-docgen';
import { CodeBlock } from '../lib/code';
import { ExternalIcon } from '../lib/icons';
import { Tabs } from '../../src';
import { PageHeader, Prose, Section, ThemeColumns } from '../lib/ui';
import { STATIC_STORIES, StaticHtml, storyCode } from '../components/static-classes';

export function StaticSitesPage() {
  const [ex, setEx] = useState<'module' | 'classic'>('module');
  const page = ex === 'module' ? 'index.html' : 'classic.html';
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Start"
        title="Static sites"
        lead="Sites with no build step (minecraft.nish.software, the trip pages) get the same theme by vendoring a handful of dist files from a release tag."
      />

      <Section title="How hosting vendors them" note="nishant/hosting pins one tag and copies the files into each static site.">
        <ol className="max-w-2xl list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-th-hi2 marker:text-th-hi3">
          <li>
            <code className="inline">ui.json</code> at the hosting repo root names the tag, for example <code className="inline">v{docgen.version}</code>, and
            the hash of every vendored file.
          </li>
          <li>
            <code className="inline">node scripts/sync-ui.mjs</code> downloads that tag from codeload.github.com (curl and tar only, no npm) and copies the
            files into <code className="inline">minecraft/site/assets/nish/</code> and <code className="inline">static/trips/nish/</code>.
          </li>
          <li>
            <code className="inline">--check --offline</code> fails CI when a vendored copy differs from the pinned hashes, so nobody edits them by hand.
          </li>
          <li>Pages link the files with a ?v= hash, and font files carry a content hash in their names, so /assets can be cached for a year.</li>
        </ol>
        <CodeBlock title="the files (dist/files.json)" code={docgen.distFiles.join('\n')} />
      </Section>

      <Section
        title="Link them"
        note="theme-init.js first and render-blocking, then the stylesheet, then the opt-in component classes if the page uses them. Then either the module or the classic script."
      >
        <CodeBlock
          title="<head>"
          code={`<script src="nish/theme-init.js"></script>
<link rel="stylesheet" href="nish/nish.css">
<link rel="stylesheet" href="nish/nish-components.css">`}
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <CodeBlock
            title="a toggle, as a module"
            code={`<button id="theme" type="button">Theme</button>
<script type="module">
  import { initTheme, cycleTheme } from './nish/theme.js';
  initTheme();
  document.querySelector('#theme')
    .addEventListener('click', cycleTheme);
</script>`}
          />
          <CodeBlock
            title="a toggle, as a classic script"
            code={`<button id="theme" type="button">Theme</button>
<script src="nish/theme.global.js"></script>
<script>
  nishTheme.initTheme();
  document.querySelector('#theme')
    .addEventListener('click', nishTheme.cycleTheme);
</script>`}
          />
        </div>
        <Prose>
          <p>
            <code>cycleTheme()</code> steps System, Light, Dark. A preset chosen on another subdomain (Mocha on jobs, say) still applies here, and the next
            click goes back to System. <code>window.nishTheme</code> has <code>initTheme</code>, <code>setThemeChoice</code>, <code>cycleTheme</code>,{' '}
            <code>onThemeChange</code>, <code>readToken</code>, <code>registerThemes</code> and <code>getThemeChoice</code>.
          </p>
          <p>
            For a ready-made toggle, give a <code>{'<button class="nish-theme-btn">'}</code> to <code>mountThemeToggle(button)</code>: it fills in the
            three icons, keeps <code>aria-label</code> and <code>title</code> current ("Theme: Light. Switch to Dark") and returns a cleanup function.
          </p>
        </Prose>
      </Section>

      <ComponentClasses />

      <Section
        title="Live example"
        note="A plain HTML page in a frame, using only the files above, built from this release's dist. It shares this site's saved choice, so switching the theme in the header switches it too."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            variant="pill"
            label="Example"
            value={ex}
            onChange={(v) => setEx(v as 'module' | 'classic')}
            items={[
              { value: 'module', label: 'theme.js (module)' },
              { value: 'classic', label: 'theme.global.js' },
            ]}
          />
          <a className="doc-link inline-flex items-center gap-1.5 text-sm" href={`static-example/${page}`} target="_blank" rel="noreferrer">
            Open on its own <ExternalIcon size={13} />
          </a>
        </div>
        <div className="overflow-hidden rounded-xl border border-th-line">
          <div className="flex items-center gap-2 border-b border-th-line bg-th-surface px-3 py-2">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-th-loss-fill" />
              <span className="size-2.5 rounded-full bg-th-warn-fill" />
              <span className="size-2.5 rounded-full bg-th-ok-fill" />
            </span>
            <code className="min-w-0 truncate font-mono text-xs text-th-hi3">trips.nish.software/smokies/ · static-example/{page}</code>
          </div>
          <iframe key={page} src={`static-example/${page}`} title="Static page example" className="block h-[720px] w-full border-0 bg-th-bg" />
        </div>
      </Section>
    </div>
  );
}

/** Every class in nish-components.css: the static markup beside the React component it
 *  mirrors, or all of them in every theme. */
function ComponentClasses() {
  const [view, setView] = useState<'side' | 'themes'>('side');
  return (
    <Section
      id="component-classes"
      title="Component classes"
      note={
        <>
          <code className="inline">nish-components.css</code> gives static pages the same buttons, cards, badges, fields, callouts, stats, tables and
          meters as the React components. Every selector is wrapped in <code className="inline">:where()</code>, so a site&apos;s own CSS always wins
          and nothing changes until a page uses a <code className="inline">nish-*</code> class.
        </>
      }
    >
      <Tabs
        variant="pill"
        label="View"
        value={view}
        onChange={(v) => setView(v as 'side' | 'themes')}
        items={[
          { value: 'side', label: 'React vs static' },
          { value: 'themes', label: 'All themes' },
        ]}
      />
      {view === 'side' ? (
        <div className="grid gap-4">
          {STATIC_STORIES.map((s) => (
            <div key={s.id} id={`static-${s.id}`} className="min-w-0 overflow-hidden rounded-xl border border-th-line bg-th-surface">
              <div className="border-b border-th-line px-4 py-2.5">
                <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-th-hi">
                  {s.name}
                  <code className="font-mono text-xs font-normal text-th-hi3">{s.cls}</code>
                  <span className="text-xs font-normal text-th-hi3">mirrors {s.mirrors}</span>
                </h3>
                {s.note ? <p className="mt-0.5 text-xs text-th-hi3">{s.note}</p> : null}
              </div>
              <div className={s.react ? 'grid md:grid-cols-2' : 'grid'}>
                {s.react ? (
                  <div className="min-w-0 border-b border-th-line md:border-b-0 md:border-r">
                    <p className="px-4 pt-3 text-xs font-medium text-th-hi3">React</p>
                    <div className="doc-canvas flex min-h-28 items-center p-4 sm:p-6">{s.react()}</div>
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="px-4 pt-3 text-xs font-medium text-th-hi3">Static</p>
                  <StaticHtml story={s} className="doc-canvas flex min-h-28 items-center p-4 sm:p-6" />
                </div>
              </div>
              <div className="border-t border-th-line p-3">
                <CodeBlock code={storyCode(s)} title="HTML" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ThemeColumns
          render={() => (
            <div className="divide-y divide-th-line">
              {STATIC_STORIES.map((s) => (
                <div key={s.id} className="min-w-0">
                  <p className="px-3.5 pt-3 text-xs font-medium text-th-hi3">{s.name}</p>
                  <StaticHtml story={s} className="flex min-h-20 items-center p-3.5" />
                </div>
              ))}
            </div>
          )}
        />
      )}
    </Section>
  );
}
