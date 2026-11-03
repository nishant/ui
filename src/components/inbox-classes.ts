/** Text the Inbox shows that has no key in `NishStrings`. Give any of them to `Inbox` as `labels`;
 *  each one wins over its English default. */
export interface InboxLabels {
  /** Names of the severity dots. */
  urgent: string;
  normal: string;
  info: string;
  /** Snooze menu entries. */
  snooze1h: string;
  snooze4h: string;
  snoozeTomorrow: string;
  snoozeMonday: string;
  /** Button of a snoozed item. */
  unsnooze: string;
  /** Button of a handled item. */
  moveBack: string;
  /** "Mark all handled" button, and the confirm dialog's title. */
  markAllHandled: string;
  markAllTitle: (count: number) => string;
  /** The "All" chip of the source filter. */
  all: string;
  loadMore: string;
  /** Collapses a long body. The expand button is the `more` string. */
  less: string;
  /** "Until 14:00" under a snoozed item. */
  until: (when: string) => string;
  /** "Handled 2 hours ago" under a handled item, then optionally the suffix for who handled it. */
  handledAgo: (when: string) => string;
  handledByApp: string;
  handledAutomatically: string;
  /** "Retry ran 14:02" and "Retry failed 14:02 · HTTP 500". `why` is null when nothing is known. */
  actionRan: (label: string, at: string) => string;
  actionFailed: (label: string, at: string, why: string | null) => string;
  /** The empty list of each view; `source` is the name of the filtered source, or null. */
  emptyOpen: (source: string | null) => string;
  emptySnoozed: (source: string | null) => string;
  emptyHandled: (source: string | null) => string;
}

export const DEFAULT_INBOX_LABELS: InboxLabels = {
  urgent: 'Urgent',
  normal: 'Normal',
  info: 'Info',
  snooze1h: '1 hour',
  snooze4h: '4 hours',
  snoozeTomorrow: 'Tomorrow 8 AM',
  snoozeMonday: 'Monday 8 AM',
  unsnooze: 'Unsnooze',
  moveBack: 'Move back',
  markAllHandled: 'Mark all handled',
  markAllTitle: (n) => `Mark ${n} ${n === 1 ? 'item' : 'items'} handled?`,
  all: 'All',
  loadMore: 'Load more',
  less: 'Less',
  until: (when) => `Until ${when}`,
  handledAgo: (when) => `Handled ${when}`,
  handledByApp: ' by the app',
  handledAutomatically: ' automatically',
  actionRan: (label, at) => `${label} ran ${at}`,
  actionFailed: (label, at, why) => `${label} failed ${at}${why ? ` · ${why}` : ''}`,
  emptyOpen: (src) => `Nothing open${src ? ` from ${src}` : ''}`,
  emptySnoozed: (src) => `Nothing snoozed${src ? ` from ${src}` : ''}`,
  emptyHandled: (src) => `Nothing handled${src ? ` from ${src}` : ''} in the last 30 days`,
};
