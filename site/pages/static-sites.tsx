import { useState } from 'react';
import docgen from 'virtual:nish-docgen';
import { CodeBlock } from '../lib/code';
import { ExternalIcon } from '../lib/icons';
import { PageHeader, Prose, Section, Tabs } from '../lib/ui';

export function StaticSitesPage() {
  const [ex, setEx] = useState<'module' | 'classic'>('module');
  const page = ex === 'module' ? 'index.html' : 'classic.html';
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Start"
        title="Static sites"
        lead="Sites with no build step (mc.nish.software, the trip pages) get the same theme by vendoring a handful of dist files from a release tag."
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

      <Section title="Link them" note="theme-init.js first and render-blocking, then the stylesheet. Then either the module or the classic script.">
        <CodeBlock
          title="<head>"
          code={`<script src="nish/theme-init.js"></script>
<link rel="stylesheet" href="nish/nish.css">`}
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
        </Prose>
      </Section>

      <Section
        title="Live example"
        note="A plain HTML page in a frame, using only the files above, built from this release's dist. It shares this site's saved choice, so switching the theme in the header switches it too."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            label="Example"
            value={ex}
            onChange={setEx}
            options={[
              { id: 'module', label: 'theme.js (module)' },
              { id: 'classic', label: 'theme.global.js' },
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
          <iframe key={page} src={`static-example/${page}`} title="Static page example" className="block h-[400px] w-full border-0 bg-th-bg" />
        </div>
      </Section>
    </div>
  );
}
