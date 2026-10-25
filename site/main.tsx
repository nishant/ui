import { useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import docgen from 'virtual:nish-docgen';
import { cn, IconButton, initTheme, ThemeToggle, Toaster } from '../src';
import { COMPONENT_DOCS } from './components';
import { CloseIcon, GithubIcon, MenuIcon } from './lib/icons';
import { href, useRoute, type Route } from './lib/router';
import { ChangelogPage } from './pages/changelog';
import { ColorPage } from './pages/color';
import { ComponentPage } from './pages/component';
import { ElevationPage, SpacingPage, TypographyPage, ZIndexPage } from './pages/foundations';
import { FramePage, guardFrameFocus } from './pages/frame';
import { GettingStartedPage } from './pages/getting-started';
import { OverviewPage } from './pages/overview';
import { PatternsPage } from './pages/patterns';
import { StaticSitesPage } from './pages/static-sites';
import { ThemesPage } from './pages/themes';
import { WallPage } from './pages/wall';

const isFrame = location.hash.startsWith('#/frame/');
// A frame paints the theme it is given; the site itself follows the saved choice.
if (isFrame) guardFrameFocus();
else initTheme();

interface NavItem {
  path: string;
  label: string;
  /** Only this exact path highlights it (a parent of the pages below it). */
  exact?: boolean;
}

const isOn = (it: NavItem, path: string) => path === it.path || (!it.exact && path.startsWith(it.path + '/'));

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: 'Start',
    items: [
      { path: '/overview', label: 'Overview' },
      { path: '/getting-started', label: 'Getting started' },
      { path: '/static-sites', label: 'Static sites' },
      { path: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Foundations',
    items: [
      { path: '/themes', label: 'Themes' },
      { path: '/color', label: 'Color' },
      { path: '/typography', label: 'Typography' },
      { path: '/spacing', label: 'Spacing & radius' },
      { path: '/elevation', label: 'Shadows & motion' },
      { path: '/z-index', label: 'Z-index & breakpoints' },
    ],
  },
  {
    title: 'Components',
    items: [{ path: '/components', label: 'All components', exact: true }, ...COMPONENT_DOCS.map((d) => ({ path: `/components/${d.id}`, label: d.name }))],
  },
  { title: 'Patterns', items: [{ path: '/patterns', label: 'App screens' }] },
];

const ALL = NAV.flatMap((g) => g.items);

function page(route: Route): { title: string; node: ReactNode; wide?: boolean } {
  const [first, second, third] = route.segments;
  switch (first) {
    case 'overview':
      return { title: 'Overview', node: <OverviewPage /> };
    case 'getting-started':
      return { title: 'Getting started', node: <GettingStartedPage /> };
    case 'static-sites':
      return { title: 'Static sites', node: <StaticSitesPage /> };
    case 'changelog':
      return { title: 'Changelog', node: <ChangelogPage /> };
    case 'themes':
      return { title: 'Themes', node: <ThemesPage /> };
    case 'color':
      return { title: 'Color', node: <ColorPage /> };
    case 'typography':
      return { title: 'Typography', node: <TypographyPage /> };
    case 'spacing':
      return { title: 'Spacing & radius', node: <SpacingPage /> };
    case 'elevation':
      return { title: 'Shadows & motion', node: <ElevationPage /> };
    case 'z-index':
      return { title: 'Z-index & breakpoints', node: <ZIndexPage /> };
    case 'patterns':
      return { title: 'Patterns', node: <PatternsPage view={second === 'themes' ? 'themes' : 'docs'} />, wide: second === 'themes' };
    case 'components': {
      if (!second) return { title: 'All components', node: <WallPage />, wide: true };
      const doc = COMPONENT_DOCS.find((d) => d.id === second);
      if (doc) return { title: doc.name, node: <ComponentPage key={doc.id} id={doc.id} view={third === 'themes' ? 'themes' : 'docs'} />, wide: third === 'themes' };
      break;
    }
  }
  return {
    title: 'Not found',
    node: (
      <div className="space-y-3 py-16 text-center">
        <p className="text-2xl font-semibold text-th-hi">No page at {route.path}</p>
        <a className="doc-link" href={href('/overview')}>
          Go to the overview
        </a>
      </div>
    ),
  };
}

function NavList({ current, onNavigate }: { current: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Docs" className="space-y-6">
      {NAV.map((g) => (
        <div key={g.title} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-th-hi3">{g.title}</p>
          <ul className="space-y-px">
            {g.items.map((it) => {
              const on = isOn(it, current);
              return (
                <li key={it.path}>
                  <a
                    href={href(it.path)}
                    onClick={onNavigate}
                    aria-current={on ? 'page' : undefined}
                    className={cn(
                      'flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors pointer-coarse:min-h-11',
                      on ? 'bg-th-accent-soft font-medium text-th-accent' : 'text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
                    )}
                  >
                    {it.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Logo() {
  return (
    <a href={href('/overview')} className="flex min-w-0 items-center gap-2.5 rounded-lg">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-th-accent text-th-on-accent" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18V6l12 12V6" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold leading-tight text-th-hi">{docgen.name}</span>
        <span className="block truncate text-xs leading-tight text-th-hi3">
          <span className="font-mono">v{docgen.version}</span> · design system
        </span>
      </span>
    </a>
  );
}

const GITHUB = 'https://github.com/nishant/ui';

function Shell() {
  const route = useRoute();
  const [drawer, setDrawer] = useState(false);
  const { title, node, wide } = page(route);
  const index = ALL.findIndex((it) => isOn(it, route.path));
  const prev = index > 0 ? ALL[index - 1] : null;
  const next = index >= 0 && index < ALL.length - 1 ? ALL[index + 1] : null;

  useEffect(() => {
    document.title = `${title} · @nish/ui`;
    window.scrollTo(0, 0);
    setDrawer(false);
  }, [route.path, title]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [drawer]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
        className="fixed left-3 top-3 z-[70] -translate-y-24 rounded-lg bg-th-accent px-3 py-2 text-sm font-medium text-th-on-accent transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-th-line bg-th-bg/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-5">
          <IconButton label="Open navigation" className="lg:hidden" onClick={() => setDrawer(true)}>
            <MenuIcon size={18} />
          </IconButton>
          <Logo />
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle presets className="hidden sm:inline-flex" />
            <ThemeToggle className="sm:hidden" />
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              aria-label="Source on GitHub"
              title="Source on GitHub"
              className="hidden size-9 items-center justify-center rounded-lg text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi sm:inline-flex"
            >
              <GithubIcon size={18} />
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-th-line px-3 py-6 lg:block">
          <NavList current={route.path} />
        </aside>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <div data-page={route.path} className={cn('mx-auto px-4 pb-16 pt-8 sm:px-8 sm:pt-10', wide ? 'max-w-[1400px]' : 'max-w-4xl')}>
            {node}
            {prev || next ? (
              <div className="mt-16 grid gap-3 border-t border-th-line pt-6 sm:grid-cols-2">
                {prev ? (
                  <a href={href(prev.path)} className="rounded-xl border border-th-line px-4 py-3 transition-colors hover:border-th-line-strong hover:bg-th-elevated/60">
                    <span className="block text-xs text-th-hi3">Previous</span>
                    <span className="font-medium text-th-hi">{prev.label}</span>
                  </a>
                ) : (
                  <span />
                )}
                {next ? (
                  <a href={href(next.path)} className="rounded-xl border border-th-line px-4 py-3 text-right transition-colors hover:border-th-line-strong hover:bg-th-elevated/60">
                    <span className="block text-xs text-th-hi3">Next</span>
                    <span className="font-medium text-th-hi">{next.label}</span>
                  </a>
                ) : null}
              </div>
            ) : null}
            <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-xs text-th-hi3">
              <span>
                {docgen.name} v{docgen.version}, built from this repo&apos;s own src.
              </span>
              <a className="doc-link" href={GITHUB} target="_blank" rel="noreferrer">
                github.com/nishant/ui
              </a>
            </footer>
          </div>
        </main>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-th-scrim/60 animate-fade-in" onClick={() => setDrawer(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col border-r border-th-line bg-th-surface shadow-modal animate-[nish-rise-in_160ms_var(--nish-ease-out)]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-th-line px-3">
              <Logo />
              <IconButton label="Close navigation" onClick={() => setDrawer(false)} autoFocus>
                <CloseIcon size={18} />
              </IconButton>
            </div>
            <div className="space-y-3 border-b border-th-line px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-th-hi3">Theme</p>
              <ThemeToggle presets />
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-mono text-xs text-th-hi2">v{docgen.version}</span>
                <a href={GITHUB} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-th-hi2 hover:text-th-hi">
                  <GithubIcon size={16} /> GitHub
                </a>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <NavList current={route.path} onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      ) : null}
      <Toaster />
    </div>
  );
}

function App() {
  const route = useRoute();
  return route.segments[0] === 'frame' ? <FramePage route={route} /> : <Shell />;
}

createRoot(document.getElementById('root')!).render(<App />);
