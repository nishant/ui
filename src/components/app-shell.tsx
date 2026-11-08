'use client';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocalStorage } from './hooks';
import { useHeightVar } from './layout-vars';
import { cn } from '../cn';
import { safeUrl } from '../url';
import { ConnectionBanner, LoadingBar, PageContainer, type ConnectionBannerProps, type PageContainerProps } from './layout';
import { AppErrorBoundary } from './error-boundary';
import { AppHeader, type AppHeaderHub } from './display';
import { warnDev } from './display-classes';
import { Skeleton } from './feedback';
import { MoreIcon } from './icons';
import { lazyModule, preloadWhenIdle, useLazyModule } from './lazy-module';
import { BottomNav, NavRail, NavSidebar, type NavItem, type RenderLink } from './nav';
import { visibleNavItems } from './nav-items';
import { NavBadge } from './nav-items';
import { DropdownMenu, MenuItem } from './menu';
import { IconButton } from './primitives';
import { useStrings } from './provider';
import { SHELL_STRINGS, STATUS_STRINGS } from './strings';
import { tabClass } from './tabs-classes';
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
  /** From 1024px, hides the header and puts this brand at the top of the sidebar, under the hub pill.
   *  The sidebar then also holds `actions` (after `tools`), the theme toggle and the More menu (in its foot).
   *  Collapsed, a slim bar above the page shows the hub pill and the brand. A function gets the collapsed
   *  state, for a shorter brand in the bar. Below 1024px the header is unchanged. */
  brand?: ReactNode | ((state: { collapsed: boolean }) => ReactNode);
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
  /** A pill at the start of the header that links back to a hub site ("← nish.software"). Default false: no pill. The nish.software apps pass `{ href: 'https://nish.software', label: 'nish.software' }`. */
  hub?: AppHeaderHub | false;
  /** Every destination, in order. All show in the rail and the desktop header nav (or the sidebar); the BottomNav shows the first `primary` and puts the rest in a MoreSheet. Empty or left out, the shell has no nav at all (no tabs, rail, sidebar, BottomNav or sheet): the signed-out frame. */
  nav?: NavItem[];
  /** How many items the BottomNav shows before "More". Default 4; when nav.length <= 5 all fit and there is no More. */
  primary?: number;
  /** Extra MoreSheet-only items (settings, sign out) shown after the overflow nav items. From md up they sit in a "More" menu in the header. Give them `onSelect`: the menu runs it, and only follows `href` (a full page load) when there is no `onSelect`. */
  moreItems?: NavItem[];
  renderLink?: RenderLink;
  /** Names the nav landmark (header tabs, rail, sidebar nav and BottomNav; only one shows at a time). Default: the provider's `sections` string. */
  navLabel?: string;
  /** id of the `main` element and target of the skip link. Default "nish-main"; give each shell on a page its own. */
  mainId?: string;
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
  /** adaptive (default): BottomNav under 768px, the rail to 1023px, then header tabs or the sidebar.
   *  header: the nav stays as tabs on the header's second row at every width, with no BottomNav, rail,
   *  sidebar or More sheet; moreItems go in the header More menu. For apps with two or three pages. */
  navMode?: 'adaptive' | 'header';
  /** The look of the header nav. underline (default): tabs on the header's second row. pill: from 1024px,
   *  pills in the header row before `actions` (header mode keeps them on the second row). */
  tabs?: 'underline' | 'pill';
  /** Keys of the BottomNav items, in order, instead of the first `primary`. The other nav items go in the
   *  More sheet, in nav order, before moreItems. Unknown keys are skipped with a dev warning. */
  bottomNav?: string[];
  /** false removes the header More menu, so moreItems are only in the phone More sheet. Then put those
   *  actions in `actions` from 768px yourself, so none is phone-only. Default true. */
  moreMenu?: boolean;
  /** Classes for the header's inner rows (AppHeader innerClassName), e.g. "mx-auto max-w-7xl". */
  headerInnerClassName?: string;
  /** Classes merged into the PageContainer (a max width, a top padding). Ignored with container={false}. */
  containerClassName?: string;
  /** After the main landmark, in the same container: the page footer. Not rendered with fullHeight. */
  footer?: ReactNode;
  /** The main element gets exactly the height under the header and banners, as a flex column that does not
   *  scroll, for a page that scrolls inside its own panes. container and footer are not used. */
  fullHeight?: boolean;
  /** While nav is empty (sign-in being checked), this many placeholder tabs in the header, so it keeps its
   *  height. Shown where tabs show: from 1024px, or at every width with navMode="header". Default 0. */
  navPending?: number;
  children: ReactNode;
}

const MAIN_ID = 'nish-main';

const sheetModule = /* @__PURE__ */ lazyModule(() => import('./more-sheet'));

/**
 * The app frame: skip link, header, loading bar, connection banner, the NavRail (768 to
 * 1023px), the BottomNav with a More sheet (under 768px, loaded on demand), the page
 * container, an error boundary and the Toaster, all from one `nav` list. Under 768px the
 * BottomNav shows, from 768px the rail, from 1024px tabs in the header or the sidebar;
 * navMode="header" keeps header tabs at every width. With no nav it is the signed-out frame:
 * header, banners and page only.
 */
export function AppShell({
  name,
  icon,
  brand,
  homeHref = '/',
  hub = false,
  nav: navProp = [],
  primary = 4,
  moreItems: moreItemsProp = [],
  renderLink,
  navLabel: navLabelProp,
  mainId = MAIN_ID,
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
  navMode = 'adaptive',
  tabs = 'underline',
  bottomNav,
  moreMenu: moreMenuProp = true,
  headerInnerClassName,
  containerClassName,
  footer,
  fullHeight = false,
  navPending = 0,
  children,
}: AppShellProps) {
  const strings = useStrings(SHELL_STRINGS, STATUS_STRINGS);
  const navLabel = navLabelProp ?? strings.sections;
  const nav = visibleNavItems(navProp);
  const moreItems = visibleNavItems(moreItemsProp);
  const [sheet, setSheet] = useState(false);
  const firstKey = useRef(true);
  useEffect(() => {
    if (firstKey.current) {
      firstKey.current = false;
      return;
    }
    setSheet(false);
  }, [resetKey]);

  const headerMode = navMode === 'header';
  if (headerMode && sidebar !== false) warnDev('nish-ui: AppShell navMode="header" ignores sidebar.');
  const side: AppShellSidebar | null = headerMode || sidebar === false ? null : sidebar === true ? {} : sidebar;
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
  const brandMode = hasNav && side?.brand != null;
  const brandNode = (isCollapsed: boolean): ReactNode => (typeof side?.brand === 'function' ? side.brand({ collapsed: isCollapsed }) : side?.brand);

  let bottomItems: NavItem[];
  let overflow: NavItem[];
  if (headerMode) {
    bottomItems = [];
    overflow = [];
  } else if (bottomNav) {
    bottomItems = [];
    for (const key of bottomNav) {
      const found = nav.find((i) => i.key === key);
      if (found) bottomItems.push(found);
      else warnDev(`nish-ui: AppShell bottomNav key "${key}" is not in nav.`);
    }
    if (bottomNav.length > 5) warnDev('nish-ui: AppShell bottomNav has more than 5 items; they do not fit a 360px screen.');
    overflow = nav.filter((i) => !bottomItems.includes(i));
  } else {
    const n = nav.length <= 5 ? nav.length : Math.max(0, primary);
    bottomItems = nav.slice(0, n);
    overflow = nav.slice(n);
  }
  const sheetItems = hasNav && !headerMode ? [...overflow, ...moreItems] : [];
  const hasSheet = sheetItems.length > 0;
  const moreActive = sheetItems.some((i) => i.active);
  const sheetMod = useLazyModule(sheetModule, sheet, () => setSheet(false));
  useEffect(() => (hasSheet ? preloadWhenIdle(sheetModule) : undefined), [hasSheet]);
  const showMoreMenu = moreItems.length > 0 && moreMenuProp !== false;
  if (headerMode && moreMenuProp === false && moreItems.length > 0) warnDev('nish-ui: AppShell moreMenu={false} with navMode="header" hides moreItems.');
  if (fullHeight && footer != null) warnDev('nish-ui: AppShell fullHeight does not render footer.');
  // The rail and the sidebar stick under the header and the banner stack.
  const stickTop =
    'sticky top-[calc(var(--nish-header-h,0px)+var(--nish-banners-h,0px))] h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))] self-start';

  // The MoreSheet's default footer has a Theme row, so below md the header toggle is redundant.
  const toggle =
    themeToggle === false ? false : hasSheet ? <span className="max-md:hidden">{themeToggle ?? <ThemeToggle />}</span> : themeToggle;

  const tabNodes = (variant: 'underline' | 'pill') => (
    <>
      {nav.map((item) => {
        const className = cn(tabClass({ active: !!item.active, variant }), 'inline-flex', variant === 'pill' && 'items-center');
        const current = item.active ? ('page' as const) : undefined;
        const children = (
          <>
            {item.label}
            <NavBadge value={item.badge} />
          </>
        );
        if (renderLink && item.href != null) {
          return (
            <Fragment key={item.key}>{renderLink(item, { className, children, 'aria-current': current, onClick: item.onSelect })}</Fragment>
          );
        }
        return item.href != null ? (
          <a key={item.key} href={item.href} className={className} aria-current={current} onClick={item.onSelect}>
            {children}
          </a>
        ) : (
          <button key={item.key} type="button" className={className} aria-current={current} onClick={item.onSelect}>
            {children}
          </button>
        );
      })}
    </>
  );
  const showHeaderTabs = hasNav && !side && (headerMode || tabs !== 'pill');
  const showPills = hasNav && !side && !headerMode && tabs === 'pill';
  const headerNav =
    !hasNav && navPending > 0
      ? [
          // Skeleton is already aria-hidden; this keeps the placeholder landmark from being empty.
          <span key="loading" className="sr-only">
            {strings.loading}
          </span>,
          ...Array.from({ length: navPending }, (_, i) => <Skeleton key={i} className={cn('w-24 rounded-lg pointer-coarse:h-11', tabs === 'pill' ? 'h-8' : 'h-10')} />),
        ]
      : showHeaderTabs
        ? tabNodes(tabs === 'pill' ? 'pill' : 'underline')
        : undefined;

  const moreMenuNode = (menuSide?: 'top') => (
    <DropdownMenu
      align="end"
      side={menuSide}
      trigger={
        <IconButton label={strings.more}>
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
            else if (item.href != null) {
              const href = safeUrl(item.href);
              if (href !== null) window.location.assign(href);
            }
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </DropdownMenu>
  );
  // With nav, under 768px these items live in the MoreSheet; signed out (or in header mode) there is no sheet.
  const moreMenu = showMoreMenu ? <div className={hasNav && !headerMode ? 'hidden md:inline-flex' : 'inline-flex'}>{moreMenuNode()}</div> : null;

  const hubHref = hub ? safeUrl(hub.href) : null;
  const hubPill =
    hub && hubHref != null ? (
      <a className="nish-pill-link" href={hubHref} title={hub.title ?? strings.hubTitle}>
        <span className="inline-block rtl:-scale-x-100">←</span> <span className="nish-pill-link-label">{hub.label}</span>
      </a>
    ) : null;
  const sidebarToggle = themeToggle === false ? null : (themeToggle ?? <ThemeToggle compact={collapsed} />);

  const page = errorBoundary ? <AppErrorBoundary resetKeys={[resetKey]}>{children}</AppErrorBoundary> : children;

  return (
    <>
      <a
        href={`#${mainId}`}
        className="nish-skip-link"
        onClick={(e) => {
          // A fragment link would change the route in hash-routed apps; move focus instead.
          const main = document.getElementById(mainId);
          if (!main) return;
          e.preventDefault();
          main.focus();
          main.scrollIntoView?.();
        }}
      >
        {strings.skipToContent}
      </a>
      <AppHeader
        name={name}
        icon={icon}
        brand={brand}
        homeHref={homeHref}
        hub={hub}
        hideNameBelow={icon != null ? 'sm' : undefined}
        compactPill
        actions={
          <>
            {showPills ? (
              <nav aria-label={navLabel} className="hidden items-center gap-1 lg:flex">
                {tabNodes('pill')}
              </nav>
            ) : null}
            {hasNav && side?.tools != null ? <span className="flex items-center gap-2 lg:hidden">{side.tools}</span> : null}
            {actions}
            {moreMenu}
          </>
        }
        themeToggle={toggle}
        className={cn(!headerMode && 'max-lg:[&>nav]:hidden', brandMode && 'lg:hidden')}
        innerClassName={headerInnerClassName}
        nav={headerNav}
        navLabel={navLabel}
      />
      <LoadingBar active={loading} />
      <div ref={bannersRef} data-nish-bar=""
        className="sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] empty:hidden">
        {connection !== false ? <ConnectionBanner {...connection} /> : null}
        {banner}
      </div>
      <div className="md:flex">
        {hasNav && !headerMode ? (
          <div className={cn(stickTop, 'hidden md:block lg:hidden')}>
            <NavRail items={nav} showFrom="md" hideFrom="lg" footer={railFooter} renderLink={renderLink} label={navLabel} className="h-full" />
          </div>
        ) : null}
        {hasNav && side ? (
          <div className={cn(stickTop, 'hidden lg:block')}>
            <NavSidebar
              items={nav}
              collapsed={collapsed}
              onCollapsedChange={setCollapsed}
              header={brandMode && !collapsed ? <>{hubPill}{brandNode(false)}</> : undefined}
              tools={brandMode ? <>{side.tools}{actions}</> : side.tools}
              footer={brandMode ? <>{sidebarToggle}{side.footer}{showMoreMenu ? moreMenuNode('top') : null}</> : side.footer}
              renderLink={renderLink}
              label={navLabel}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {brandMode && collapsed ? (
            <div className="hidden h-14 items-center gap-3 border-b border-th-line px-[var(--nish-page-gutter,1rem)] py-[5px] lg:flex">
              {hubPill}
              {brandNode(true)}
            </div>
          ) : null}
          {fullHeight ? (
            <main
              id={mainId}
              tabIndex={-1}
              className={cn(
                'flex min-h-0 flex-col overflow-hidden focus:outline-none h-[calc(100dvh-var(--nish-header-h,0px)-var(--nish-banners-h,0px))] pb-[var(--nish-bottom-inset,0px)]',
                brandMode && collapsed && 'lg:h-[calc(100dvh-var(--nish-banners-h,0px)-3.5rem)]',
              )}
            >
              {page}
            </main>
          ) : container === false ? (
            <>
              <main id={mainId} tabIndex={-1} className="focus:outline-none">
                {page}
              </main>
              {footer}
            </>
          ) : (
            <PageContainer as="div" size={container} className={containerClassName}>
              <main id={mainId} tabIndex={-1} className="focus:outline-none">
                {page}
              </main>
              {footer}
            </PageContainer>
          )}
        </div>
      </div>
      {hasNav && !headerMode ? (
        <>
          <BottomNav
            items={bottomItems}
            more={
              hasSheet
                ? {
                    active: moreActive,
                    expanded: sheet,
                    onToggle: () => {
                      void sheetModule.load().catch(() => undefined);
                      setSheet((s) => !s);
                    },
                  }
                : undefined
            }
            renderLink={renderLink}
            label={navLabel}
          />
          {sheetMod ? <sheetMod.MoreSheet open={sheet} onClose={() => setSheet(false)} items={sheetItems} renderLink={renderLink} /> : null}
        </>
      ) : null}
      {toaster !== false ? <Toaster {...toaster} /> : null}
    </>
  );
}
