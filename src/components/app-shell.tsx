import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocalStorage } from './hooks';
import { useHeightVar } from './layout-vars';
import { cn } from '../cn';
import { ConnectionBanner, LoadingBar, PageContainer, type ConnectionBannerProps, type PageContainerProps } from './layout';
import { AppErrorBoundary } from './error-boundary';
import { AppHeader } from './display';
import { MoreIcon } from './icons';
import { BottomNav, MoreSheet, NavRail, NavSidebar, type NavItem, type RenderLink } from './nav';
import { DropdownMenu, MenuItem } from './overlay';
import { IconButton } from './primitives';
import { tabClass } from './tabs';
import { ThemeToggle } from './theme-toggle';
import { Toaster, type ToasterProps } from './toast';

export interface AppShellSidebar {
  /** Controlled collapsed state; pair it with onCollapsedChange. */
  collapsed?: boolean;
  /** Collapsed state on first load when uncontrolled. Default false. */
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** localStorage key that remembers the uncontrolled state across visits. Default
   *  "nish-sidebar-collapsed"; false keeps it in memory only. */
  storageKey?: string | false;
  /** Buttons above the nav (search, an assistant). Give them labels: collapsed, they stack as
   *  icons. Below 1024px, where there is no sidebar, they show in the header before `actions`. */
  tools?: ReactNode;
  /** Next to the collapse button at the bottom. Sidebar only: put anything people need on a
   *  phone in `actions` or `moreItems` too. */
  footer?: ReactNode;
}

export interface AppShellProps {
  /** App name (wordmark) and icon for the header. */
  name: ReactNode;
  icon?: ReactNode;
  /** Replaces the header's icon and name, and their home link, with your own node (a
   *  profile switcher, a wordmark with a subtitle). It is not wrapped in a link. */
  brand?: ReactNode;
  /** Home link on the icon and name. Default "/". */
  homeHref?: string;
  hubHref?: string;
  /** Every destination, in order. All show in the rail and the desktop header nav (or the sidebar); the BottomNav shows the first `primary` and puts the rest in a MoreSheet. Empty or left out, the shell has no nav at all (no tabs, rail, sidebar, BottomNav or sheet): the signed-out frame. */
  nav?: NavItem[];
  /** How many items the BottomNav shows before "More". Default 4; when nav.length <= 5 all fit and there is no More. */
  primary?: number;
  /** Extra MoreSheet-only items (settings, sign out) shown after the overflow nav items. From md up they sit in a "More" menu in the header. Give them `onSelect`: the menu runs it, and only follows `href` (a full page load) when there is no `onSelect`. */
  moreItems?: NavItem[];
  renderLink?: RenderLink;
  /** Header buttons before the theme toggle. */
  actions?: ReactNode;
  /** Replaces the header's ThemeToggle; false hides it. */
  themeToggle?: ReactNode | false;
  /** Pinned to the bottom of the NavRail. */
  railFooter?: ReactNode;
  /** Shows the top LoadingBar. */
  loading?: boolean;
  /** Passed to ConnectionBanner; false hides the banner. Default {} (browser online state only). */
  connection?: ConnectionBannerProps | false;
  /** App banners (a live alert, a maintenance notice) under the ConnectionBanner, in one
   *  sticky stack under the header. Its height is published as --nish-banners-h. */
  banner?: ReactNode;
  /** From 1024px, show the nav as a left sidebar that collapses to icons, instead of header
   *  tabs. true for the defaults; the collapsed state is remembered in localStorage. */
  sidebar?: boolean | AppShellSidebar;
  /** PageContainer size, or false to render children with no container (full-bleed pages). Default 'default'. */
  container?: PageContainerProps['size'] | false;
  /** Toaster props, or false when the app renders its own. Default {}. */
  toaster?: ToasterProps | false;
  /** Wraps the page in AppErrorBoundary (reset on resetKey change). Default true. */
  errorBoundary?: boolean;
  /** Changes reset the error boundary and close the MoreSheet (pass the pathname). */
  resetKey?: string;
  children: ReactNode;
}

const MAIN_ID = 'nish-main';

/**
 * The app frame: skip link, header with desktop tabs, loading bar, connection banner, the
 * NavRail (768 to 1023px), the BottomNav with a More sheet (under 768px), the page
 * container, an error boundary and the Toaster, all from one `nav` list.
 * Under 768px the BottomNav shows, from 768px the rail, from 1024px tabs in the header (or
 * the sidebar). With no nav it is the signed-out frame: header, banners and page only.
 */
export function AppShell({
  name,
  icon,
  brand,
  homeHref = '/',
  hubHref,
  nav = [],
  primary = 4,
  moreItems = [],
  renderLink,
  actions,
  themeToggle,
  railFooter,
  loading = false,
  connection = {},
  banner,
  sidebar = false,
  container = 'default',
  toaster = {},
  errorBoundary = true,
  resetKey,
  children,
}: AppShellProps) {
  const [sheet, setSheet] = useState(false);
  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    setSheet(false);
  }, [resetKey]);

  const side: AppShellSidebar | null = sidebar === false ? null : sidebar === true ? {} : sidebar;
  const storageKey = side?.storageKey === false ? null : (side?.storageKey ?? 'nish-sidebar-collapsed');
  const [storedCollapsed, setStoredCollapsed] = useLocalStorage(storageKey ?? 'nish-sidebar-collapsed', side?.defaultCollapsed ?? false);
  const [memoryCollapsed, setMemoryCollapsed] = useState(side?.defaultCollapsed ?? false);
  const collapsed = side?.collapsed ?? (storageKey ? storedCollapsed : memoryCollapsed);
  const setCollapsed = (next: boolean) => {
    if (side?.collapsed === undefined) (storageKey ? setStoredCollapsed : setMemoryCollapsed)(next);
    side?.onCollapsedChange?.(next);
  };

  const bannersRef = useRef<HTMLDivElement>(null);
  useHeightVar(bannersRef, '--nish-banners-h');

  const hasNav = nav.length > 0;
  const n = nav.length <= 5 ? nav.length : Math.max(0, primary);
  const bottomItems = nav.slice(0, n);
  const overflow = nav.slice(n);
  const sheetItems = hasNav ? [...overflow, ...moreItems] : [];
  const hasSheet = sheetItems.length > 0;
  const moreActive = sheetItems.some((i) => i.active);
  // The rail and the sidebar stick under the header and the banner stack.
  const stickTop =
    'sticky top-[calc(var(--nish-header-h,0px)+var(--nish-banners-h,0px))] h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))] self-start';

  // The MoreSheet's default footer has a Theme row, so below md the header toggle is redundant.
  const toggle =
    themeToggle === false ? false : hasSheet ? <span className="max-md:hidden">{themeToggle ?? <ThemeToggle />}</span> : themeToggle;

  const desktopNav = (
    <>
      {nav.map((item) => {
        const className = cn(tabClass({ active: !!item.active }), 'inline-flex');
        const current = item.active ? ('page' as const) : undefined;
        if (renderLink && item.href != null) {
          return (
            <Fragment key={item.key}>
              {renderLink(item, { className, children: item.label, 'aria-current': current, onClick: item.onSelect })}
            </Fragment>
          );
        }
        return item.href != null ? (
          <a key={item.key} href={item.href} className={className} aria-current={current} onClick={item.onSelect}>
            {item.label}
          </a>
        ) : (
          <button key={item.key} type="button" className={className} aria-current={current} onClick={item.onSelect}>
            {item.label}
          </button>
        );
      })}
    </>
  );

  const moreMenu =
    moreItems.length > 0 ? (
      // With nav, under 768px these items live in the MoreSheet; signed out there is no sheet.
      <div className={hasNav ? 'hidden md:inline-flex' : 'inline-flex'}>
        <DropdownMenu
          align="end"
          trigger={
            <IconButton label="More">
              <MoreIcon size={20} />
            </IconButton>
          }
        >
          {moreItems.map((item) => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              active={item.active}
              onSelect={() => {
                if (item.onSelect) item.onSelect();
                else if (item.href != null) window.location.assign(item.href);
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </DropdownMenu>
      </div>
    ) : null;

  const page = errorBoundary ? <AppErrorBoundary resetKeys={[resetKey]}>{children}</AppErrorBoundary> : children;

  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className="nish-skip-link"
        onClick={(e) => {
          // A fragment link would change the route in hash-routed apps; move focus instead.
          const main = document.getElementById(MAIN_ID);
          if (!main) return;
          e.preventDefault();
          main.focus();
          main.scrollIntoView?.();
        }}
      >
        Skip to content
      </a>
      <AppHeader
        name={name}
        icon={icon}
        brand={brand}
        homeHref={homeHref}
        hubHref={hubHref}
        hideNameBelow={icon != null ? 'sm' : undefined}
        compactPill
        actions={
          <>
            {hasNav && side?.tools != null ? <span className="flex items-center gap-2 lg:hidden">{side.tools}</span> : null}
            {actions}
            {moreMenu}
          </>
        }
        themeToggle={toggle}
        className="max-lg:[&>nav]:hidden"
        nav={hasNav && !side ? desktopNav : undefined}
        navLabel="Sections"
      />
      <LoadingBar active={loading} />
      <div ref={bannersRef} className="sticky top-[var(--nish-header-h,0px)] z-20 empty:hidden">
        {connection !== false ? <ConnectionBanner {...connection} /> : null}
        {banner}
      </div>
      <div className="md:flex">
        {hasNav ? (
          <div className={cn(stickTop, 'hidden md:block lg:hidden')}>
            <NavRail items={nav} showFrom="md" hideFrom="lg" footer={railFooter} renderLink={renderLink} className="h-full" />
          </div>
        ) : null}
        {hasNav && side ? (
          <div className={cn(stickTop, 'hidden lg:block')}>
            <NavSidebar
              items={nav}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              tools={side.tools}
              footer={side.footer}
              renderLink={renderLink}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <main id={MAIN_ID} tabIndex={-1} className="focus:outline-none">
            {container === false ? page : <PageContainer as="div" size={container}>{page}</PageContainer>}
          </main>
        </div>
      </div>
      {hasNav ? (
        <>
          <BottomNav
            items={bottomItems}
            more={hasSheet ? { active: moreActive, expanded: sheet, onToggle: () => setSheet((s) => !s) } : undefined}
            renderLink={renderLink}
          />
          <MoreSheet open={sheet} onClose={() => setSheet(false)} items={sheetItems} renderLink={renderLink} />
        </>
      ) : null}
      {toaster !== false ? <Toaster {...toaster} /> : null}
    </>
  );
}
