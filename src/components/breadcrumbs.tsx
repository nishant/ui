'use client';

import { Children, Fragment, cloneElement, isValidElement, useCallback, useRef, useState, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { safeUrl } from '../url';
import { useIsoLayoutEffect } from './client';
import { DropdownMenu, MenuItem } from './overlay';
import { useNishStrings } from './provider';

export interface BreadcrumbItem {
  /** The crumb's text. */
  label: ReactNode;
  /** Where the crumb goes. Passed through `safeUrl`: a `javascript:` URL renders as plain text. */
  href?: string;
  /** Runs on click. With `href` it runs before the link navigates; alone it makes a button. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

/** What `renderLink` receives for a crumb: spread it on the router link. */
export interface BreadcrumbLinkProps {
  className: string;
  /** The href after `safeUrl`. */
  href: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export interface BreadcrumbsProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'children'> {
  /** The trail, root first. The last item is the current page. Use this or children. */
  items?: BreadcrumbItem[];
  /** Ready-made crumbs (links, spans), root first, when `items` does not fit. These are never collapsed. */
  children?: ReactNode;
  /** Renders a crumb with a href as a router link: `(item, props) => <Link to={props.href} {...props} />`. */
  renderLink?: (item: BreadcrumbItem, props: BreadcrumbLinkProps) => ReactNode;
  /** The separator between crumbs. Default: a chevron that mirrors in RTL. */
  separator?: ReactNode;
  /** More crumbs than this collapse the middle ones into a "…" menu (default 4). */
  maxItems?: number;
  /** auto (default): collapse only under 640px of container width. always: whenever there are more than maxItems. never: show every crumb. */
  collapse?: 'auto' | 'always' | 'never';
  /** The nav landmark label. Default: `breadcrumbs` from NishProvider strings. */
  label?: string;
  /** The label of the "…" button. Default: `more` from the strings. */
  moreLabel?: string;
  ref?: Ref<HTMLElement>;
}

const LINK = cn(
  'inline-flex items-center rounded text-th-hi3 transition-colors duration-150 hover:text-th-hi hover:underline',
  'pointer-coarse:min-h-11',
);
const CURRENT = 'inline-flex items-center font-medium text-th-hi pointer-coarse:min-h-11';

function Chevron() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0 text-th-ghost rtl:-scale-x-100"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Crumb({
  item,
  current,
  renderLink,
}: {
  item: BreadcrumbItem;
  current: boolean;
  renderLink: BreadcrumbsProps['renderLink'];
}) {
  const href = item.href !== undefined ? safeUrl(item.href) : null;
  if (current) {
    return (
      <span aria-current="page" className={cn(CURRENT, 'min-w-0 truncate')}>
        {item.label}
      </span>
    );
  }
  if (href !== null) {
    const props: BreadcrumbLinkProps = { className: cn(LINK, 'min-w-0'), href, children: item.label, onClick: item.onClick };
    if (renderLink) return <>{renderLink(item, props)}</>;
    return <a {...props} />;
  }
  if (item.onClick) {
    return (
      <button type="button" className={cn(LINK, 'min-w-0')} onClick={item.onClick}>
        {item.label}
      </button>
    );
  }
  return <span className="inline-flex min-w-0 items-center text-th-hi3 pointer-coarse:min-h-11">{item.label}</span>;
}

/** A trail of where the page sits: links, a chevron between them and aria-current="page" on the
 *  last crumb. A long trail collapses its middle crumbs into a "…" menu on narrow containers. */
export function Breadcrumbs({
  items,
  children,
  renderLink,
  separator,
  maxItems = 4,
  collapse = 'auto',
  label,
  moreLabel,
  className,
  ref,
  ...rest
}: BreadcrumbsProps) {
  const strings = useNishStrings();
  const navRef = useRef<HTMLElement | null>(null);
  const [narrow, setNarrow] = useState(false);

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      navRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLElement | null }).current = node;
    },
    [ref],
  );

  useIsoLayoutEffect(() => {
    const el = navRef.current;
    if (collapse !== 'auto' || !el || typeof ResizeObserver === 'undefined') return;
    const measure = (w: number) => setNarrow(w > 0 && w < 640);
    measure(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== undefined) measure(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [collapse]);

  const sep = separator ?? <Chevron />;
  const nodes: ReactNode[] = [];

  if (items) {
    const limit = Math.max(2, Math.floor(maxItems));
    const shouldCollapse = items.length > limit && (collapse === 'always' || (collapse === 'auto' && narrow));
    const tail = Math.max(1, limit - 2);
    const hidden = shouldCollapse ? items.slice(1, items.length - tail) : [];
    const shown = shouldCollapse ? [items[0], null, ...items.slice(items.length - tail)] : items;
    shown.forEach((item, i) => {
      if (item === null) {
        nodes.push(
          <DropdownMenu
            key="more"
            aria-label={moreLabel ?? strings.more}
            trigger={
              <button
                type="button"
                aria-label={moreLabel ?? strings.more}
                className={cn(LINK, 'min-h-8 min-w-8 justify-center px-1 pointer-coarse:min-w-11')}
              >
                <span aria-hidden="true">…</span>
              </button>
            }
          >
            {hidden.map((h, j) => (
              <MenuItem
                key={j}
                onSelect={(e) => {
                  if (h.onClick) h.onClick(e as unknown as MouseEvent<HTMLElement>);
                  else {
                    const href = h.href !== undefined ? safeUrl(h.href) : null;
                    if (href !== null && typeof window !== 'undefined') window.location.assign(href);
                  }
                }}
              >
                {h.label}
              </MenuItem>
            ))}
          </DropdownMenu>,
        );
      } else {
        nodes.push(<Crumb key={`i${i}`} item={item} current={i === shown.length - 1} renderLink={renderLink} />);
      }
    });
  } else {
    const kids = Children.toArray(children);
    kids.forEach((k, i) => {
      const last = i === kids.length - 1;
      let node: ReactNode = k;
      if (last) {
        node = isValidElement<{ 'aria-current'?: string }>(k) ? (
          cloneElement(k, { 'aria-current': 'page' })
        ) : (
          <span aria-current="page" className={CURRENT}>
            {k}
          </span>
        );
      }
      nodes.push(<Fragment key={i}>{node}</Fragment>);
    });
  }

  return (
    <nav aria-label={label ?? strings.breadcrumbs} {...rest} ref={setRefs} className={cn('min-w-0 text-sm', className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {nodes.map((node, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" data-separator="" className="flex shrink-0 items-center text-th-ghost">
                {sep}
              </span>
            )}
            {node}
          </li>
        ))}
      </ol>
    </nav>
  );
}
