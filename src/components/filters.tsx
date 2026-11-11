'use client';
import { useState, type ComponentPropsWithRef, type ReactNode, type SVGProps } from 'react';
import { cn } from '../cn';
import { SearchInput } from './forms';
import { useIsClient } from './client';
import { NARROW_QUERY, useMediaQuery } from './hooks';
import { Drawer } from './drawer';
import { Badge, Button } from './primitives';
import { useStrings } from './provider';
import { FILTER_STRINGS, FIELD_STRINGS } from './strings';

const LG_QUERY = '(max-width: 1023.98px)';

function FunnelIcon({ size = 16, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  );
}

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  /** Heading of the sheet. Default: the `filters` string ("Filters"). */
  title?: string;
  children: ReactNode;
  /** Shows a ghost "Clear" button in the footer. */
  onClear?: () => void;
  /** Disables Clear while it is 0. */
  activeCount?: number;
  /** Text of the primary footer button, e.g. "Show 42 results". Default: the `done` string ("Done"). */
  resultLabel?: string;
}

/** A bottom sheet for the filter controls of a FilterBar on a phone. Footer: Clear and a
 *  primary button that closes the sheet. */
export function FilterSheet({ open, onClose, title, children, onClear, activeCount, resultLabel }: FilterSheetProps) {
  const strings = useStrings(FILTER_STRINGS, FIELD_STRINGS);
  if (!open) return null;
  return (
    <Drawer
      side="bottom"
      size="lg"
      title={title ?? strings.filters}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {onClear ? (
            <Button variant="ghost" onClick={onClear} disabled={activeCount === 0}>
              {strings.clear}
            </Button>
          ) : null}
          <Button variant="primary" onClick={onClose} className="ms-auto">
            {resultLabel ?? strings.done}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">{children}</div>
    </Drawer>
  );
}

export interface FilterBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Search box value and change handler. Leave out for no search box. */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string };
  /** The filter controls (Chips, Selects, Segmented). Shown inline from md up; behind the Filters button below md. */
  children?: ReactNode;
  /** How many filters differ from their defaults: shown as a count on the Filters button. */
  activeCount?: number;
  /** Shows "Clear filters" inline from md (or lg) when activeCount > 0; below the breakpoint the sheet footer always shows Clear, disabled while activeCount is 0. */
  onClear?: () => void;
  /** Right-aligned extras that stay visible at every width (a sort Select, a view toggle). */
  trailing?: ReactNode;
  /** Sticks under the header (top: var(--nish-header-h)). Default false. */
  sticky?: boolean;
  /** Title of the phone sheet. Default: the `filters` string ("Filters"). */
  sheetTitle?: string;
  /** Below this breakpoint the children move into the FilterSheet. Default 'md' (768); 'lg' (1024) for wide filter sets. */
  sheetBelow?: 'md' | 'lg';
  /** Result count line under the bar, e.g. "42 jobs". */
  summary?: ReactNode;
  className?: string;
}

/** The search and filter row of a list page. From md up the controls sit inline; below md
 *  they move into a bottom sheet behind a Filters button that shows how many are on.
 *
 *  On the server and the first client render the layout is chosen by CSS at the breakpoint, so
 *  phones see the Filters button from the first paint, then the media query takes over. */
export function FilterBar({
  search,
  children,
  activeCount = 0,
  onClear,
  trailing,
  sticky = false,
  sheetTitle,
  sheetBelow = 'md',
  summary,
  className,
  ref,
  ...rest
}: FilterBarProps) {
  const strings = useStrings(FILTER_STRINGS, FIELD_STRINGS);
  const isClient = useIsClient();
  const compact = useMediaQuery(sheetBelow === 'lg' ? LG_QUERY : NARROW_QUERY);
  const [openState, setOpen] = useState(false);
  // The sheet only exists in the compact layout; leaving it closes the sheet so it cannot reopen on its own.
  const open = openState && compact;
  if (!compact && openState) setOpen(false);
  const hasChildren = children != null && children !== false;
  const searchBox = search ? (
    <SearchInput
      value={search.value}
      onChange={(v) => search.onChange(v)}
      placeholder={search.placeholder}
      aria-label={search.label ?? search.placeholder ?? strings.search}
      className={compact ? 'min-w-[10rem] flex-1 basis-40' : 'w-full max-w-xs'}
    />
  ) : null;

  const hasSummary = summary != null && summary !== false && summary !== '';
  if (!isClient) {
    const lg = sheetBelow === 'lg';
    const searchClass = lg
      ? 'min-w-[10rem] flex-1 basis-40 lg:w-full lg:max-w-xs lg:flex-none lg:basis-auto'
      : 'min-w-[10rem] flex-1 basis-40 md:w-full md:max-w-xs md:flex-none md:basis-auto';
    const buttonClass = lg ? 'min-h-11 shrink-0 lg:hidden' : 'min-h-11 shrink-0 md:hidden';
    const wrapClass = lg ? 'contents max-lg:hidden' : 'contents max-md:hidden';
    return (
      <div
        {...rest}
        ref={ref}
        className={cn(sticky && 'sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] border-b border-th-line bg-th-bg py-2', className)}
      >
        <div className="flex flex-wrap items-center gap-2">
          {search ? (
            <SearchInput
              value={search.value}
              onChange={(v) => search.onChange(v)}
              placeholder={search.placeholder}
              aria-label={search.label ?? search.placeholder ?? strings.search}
              className={searchClass}
            />
          ) : null}
          {hasChildren ? (
            <Button variant="secondary" size="md" icon={<FunnelIcon />} aria-haspopup="dialog" aria-expanded={false} className={buttonClass}>
              {strings.filters}
              {activeCount > 0 ? (
                <Badge tone="accent" aria-label={strings.activeCount(activeCount)}>
                  {activeCount}
                </Badge>
              ) : null}
            </Button>
          ) : null}
          <div className={wrapClass}>
            {children}
            {activeCount > 0 && onClear ? (
              <Button variant="ghost" onClick={onClear}>
                {strings.clearFilters}
              </Button>
            ) : null}
          </div>
          {trailing ? <div className="ms-auto flex items-center gap-2">{trailing}</div> : null}
        </div>
        <div aria-live="polite" className={cn('text-sm text-th-hi3', hasSummary ? 'mt-2' : undefined)}>
          {summary ?? null}
        </div>
      </div>
    );
  }

  return (
    <div
      {...rest}
      ref={ref}
      className={cn(sticky && 'sticky top-[var(--nish-header-h,0px)] z-[var(--nish-z-sticky,20)] border-b border-th-line bg-th-bg py-2', className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        {searchBox}
        {compact ? (
          <>
            {hasChildren ? (
              <Button variant="secondary" size="md" icon={<FunnelIcon />} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="min-h-11 shrink-0">
                {strings.filters}
                {activeCount > 0 ? (
                  <Badge tone="accent" aria-label={strings.activeCount(activeCount)}>
                    {activeCount}
                  </Badge>
                ) : null}
              </Button>
            ) : null}
            {trailing}
          </>
        ) : (
          <>
            {children}
            {activeCount > 0 && onClear ? (
              <Button variant="ghost" onClick={onClear}>
                {strings.clearFilters}
              </Button>
            ) : null}
            {trailing ? <div className="ms-auto flex items-center gap-2">{trailing}</div> : null}
          </>
        )}
      </div>
      <div aria-live="polite" className={cn('text-sm text-th-hi3', hasSummary ? 'mt-2' : undefined)}>
        {summary ?? null}
      </div>
      {compact && hasChildren ? (
        <FilterSheet open={open} onClose={() => setOpen(false)} title={sheetTitle ?? strings.filters} onClear={onClear} activeCount={activeCount}>
          {children}
        </FilterSheet>
      ) : null}
    </div>
  );
}
