import { cn } from '../cn';
import { FOCUS } from './nav-items';

/** A NavRail item's classes. Internal: shared with the parity harness, whose element side uses .nish-nav-rail-item. */
export function navRailItemClass(active: boolean): string {
  return cn('group flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-2xs leading-tight', FOCUS, active ? 'font-medium text-th-accent' : 'text-th-hi3 hover:text-th-hi');
}
