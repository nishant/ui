import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../cn';
import { ConnectionBanner, LoadingBar, PageContainer, type ConnectionBannerProps, type PageContainerProps } from './layout';
import { AppErrorBoundary } from './error-boundary';
import { AppHeader } from './display';
import { MoreIcon } from './icons';
import { BottomNav, MoreSheet, NavRail, type NavItem, type RenderLink } from './nav';
import { DropdownMenu, MenuItem } from './overlay';
import { IconButton } from './primitives';
import { tabClass } from './tabs';
import { ThemeToggle } from './theme-toggle';
import { Toaster, type ToasterProps } from './toast';

export interface AppShellProps {
  /** App name (wordmark) and icon for the header. */
  name: ReactNode;
  icon?: ReactNode;
  /** Home link on the icon and name. Default "/". */
  homeHref?: string;
  hubHref?: string;
  /** Every destination, in order. All show in the rail and the desktop header nav; the BottomNav shows the first `primary` and puts the rest in a MoreSheet. */
  nav: NavItem[];
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
 * Under 768px the BottomNav shows, from 768px the rail, from 1024px tabs in the header.
 */
export function AppShell({
  name,
  icon,
  homeHref = '/',
  hubHref,
  nav,
  primary = 4,
  moreItems = [],
  renderLink,
  actions,
  themeToggle,
  railFooter,
  loading = false,
  connection = {},
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

  const n = nav.length <= 5 ? nav.length : Math.max(0, primary);
  const bottomItems = nav.slice(0, n);
  const overflow = nav.slice(n);
  const sheetItems = [...overflow, ...moreItems];
  const hasSheet = sheetItems.length > 0;
  const moreActive = sheetItems.some((i) => i.active);

  // The MoreSheet's default footer has a Theme row, so below md the header toggle is redundant.
  const toggle =
    themeToggle === false ? false : hasSheet ? <span className="max-md:hidden">{themeToggle ?? <ThemeToggle />}</span> : themeToggle;

  const desktopNav = (
    <>
      {nav.map((item) => {
        const className = cn(tabClass({ active: !!item.active }), 'hidden lg:inline-flex');
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
      <div className="hidden md:inline-flex">
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
      <a href={`#${MAIN_ID}`} className="nish-skip-link">
        Skip to content
      </a>
      <AppHeader
        name={name}
        icon={icon}
        homeHref={homeHref}
        hubHref={hubHref}
        hideNameBelow={icon != null ? 'sm' : undefined}
        compactPill
        actions={
          <>
            {actions}
            {moreMenu}
          </>
        }
        themeToggle={toggle}
        nav={desktopNav}
        navLabel="Sections"
      />
      <LoadingBar active={loading} />
      {connection !== false ? <ConnectionBanner {...connection} /> : null}
      <div className="md:flex">
        <div className="sticky top-[var(--nish-header-h,0px)] hidden h-[calc(100dvh-var(--nish-header-h,0px))] self-start md:block lg:hidden">
          <NavRail items={nav} showFrom="md" hideFrom="lg" footer={railFooter} renderLink={renderLink} className="h-full" />
        </div>
        <div className="min-w-0 flex-1">
          <main id={MAIN_ID} tabIndex={-1} className="focus:outline-none">
            {container === false ? page : <PageContainer as="div" size={container}>{page}</PageContainer>}
          </main>
        </div>
      </div>
      <BottomNav
        items={bottomItems}
        more={
          hasSheet
            ? { active: moreActive, expanded: sheet, onToggle: () => setSheet((s) => !s) }
            : undefined
        }
        renderLink={renderLink}
      />
      <MoreSheet open={sheet} onClose={() => setSheet(false)} items={sheetItems} renderLink={renderLink} />
      {toaster !== false ? <Toaster {...toaster} /> : null}
    </>
  );
}
