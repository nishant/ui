'use client';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { FORCED_MARK } from './display-classes';
import { Drawer } from './drawer';
import { visibleNavItems, type NavItem, type RenderLink } from './nav';
import { FOCUS, NavBadge, renderItem } from './nav-items';
import { useNishStrings } from './provider';
import { ThemeToggle } from './theme-toggle';

export interface MoreSheetProps {
  open: boolean;
  /** Called on Escape, a scrim click, the swipe, Android back and after a row is chosen. */
  onClose: () => void;
  items: NavItem[];
  /** Default: the provider's `more` string. */
  title?: string;
  /** Pinned under the list. Defaults to a "Theme" row (the provider's `theme` string) with a
   *  segmented ThemeToggle. */
  footer?: ReactNode;
  renderLink?: RenderLink;
}

/** The overflow sheet behind BottomNav's More button: a bottom Drawer lifted above the bar,
 *  so the bar stays visible and tappable. Rows are 52px with an icon, a label and a
 *  one-line hint. Choosing a row navigates and closes the sheet. */
export function MoreSheet({ open, onClose, items, title, footer, renderLink }: MoreSheetProps) {
  const strings = useNishStrings();
  if (!open) return null;
  const shown = visibleNavItems(items);
  const row = (active: boolean) =>
    cn(
      'flex min-h-[52px] w-full items-center gap-3 rounded-lg px-3 text-start transition-colors',
      active ? cn('bg-th-accent-soft text-th-accent', FORCED_MARK) : 'text-th-hi hover:bg-th-elevated',
      FOCUS,
    );
  return (
    <Drawer
      side="bottom"
      title={title ?? strings.more}
      onClose={onClose}
      bottomOffset="var(--nish-bottom-nav-h, 0px)"
      footer={
        footer ?? (
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="text-sm font-medium text-th-hi">{strings.theme}</span>
            <ThemeToggle phone="segmented" />
          </div>
        )
      }
    >
      <ul className="m-0 list-none p-2">
        {shown.map((item) => (
          <li key={item.key}>
            {renderItem(
              item,
              row(!!item.active),
              <>
                <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
                  {item.icon}
                  <NavBadge value={item.badge} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.label}</span>
                  {item.hint ? <span className={cn('block truncate text-xs', item.active ? 'text-th-accent/80' : 'text-th-hi3')}>{item.hint}</span> : null}
                </span>
              </>,
              renderLink,
              onClose,
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
