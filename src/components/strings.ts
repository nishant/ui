/* User-facing English strings, one typed object. No directive, no React. Set them once with
 * <NishProvider strings>; a per-instance prop always wins. */

export interface NishStrings {
  /** Modal, Drawer, SheetHandle, CommandPalette: close button label. */
  close: string;
  /** ConfirmDialog, service-tokens revoke dialog: cancel button. */
  cancel: string;
  /** DropdownMenu: sheet title on phones. */
  menu: string;
  /** DropdownMenu sub-menu header, read by screen readers before the parent label. */
  back: string;
  /** ContextMenu: the menu's accessible name when no menuLabel is given. */
  contextMenu: string;
  /** VirtualTable: live-region message after the sort changes (dir null when cleared). */
  sortAnnounce: (header: string, dir: 'asc' | 'desc' | null) => string;
  /** Toast, Callout: dismiss button. */
  dismiss: string;
  /** Callout: badge label for a repeat count. */
  moreCount: (count: number) => string;
  /** CopyButton: idle label. */
  copy: string;
  /** CopyButton: label after copying. */
  copied: string;
  /** AppHeader: hub pill title. */
  hubTitle: string;
  /** AppHeader: hub pill text. */
  hubLabel: string;
  /** AppHeader: overflow kebab. */
  moreActions: string;
  /** BottomNav, MoreSheet, AppShell: the More tab and sheet title. */
  more: string;
  /** ChartLegend, LineChart: legend landmark. */
  legend: string;
  /** Field, FieldGroup: tag for a non-required field. */
  optional: string;
  /** SearchInput, FilterBar, CommandPalette: input placeholder and aria fallback. */
  search: string;
  /** SearchInput: clear button. */
  clearSearch: string;
  /** Chip: remove button without a name. */
  remove: string;
  /** Chip: remove button for a named chip. */
  removeNamed: (name: string) => string;
  /** Combobox, CommandPalette: empty list. */
  noMatches: string;
  /** Combobox, FilterBar, FilterSheet: clear button. */
  clear: string;
  /** Combobox: loading row. */
  searching: string;
  /** CommandPalette: input placeholder. */
  searchPlaceholder: string;
  /** CommandPalette: nothing found. */
  noResults: string;
  /** CommandPalette: listbox label. */
  results: string;
  /** Spinner, Skeleton, SkeletonRows, SkeletonCard, LoadingBar, Progress: announced loading state. */
  loading: string;
  /** ErrorState, AsyncPanel: default message. */
  failedToLoad: string;
  /** ErrorState, ConnectionBanner: retry button. */
  retry: string;
  /** StickyActionBar: landmark label. */
  actions: string;
  /** ConnectionBanner: offline message. */
  offline: string;
  /** ResponsiveTable, AsyncPanel: empty state. */
  nothingHere: string;
  /** ResponsiveTable: skeleton label. */
  loadingNamed: (label: string) => string;
  /** ResponsiveTable: phone sort select label. */
  sortBy: string;
  /** ResponsiveTable: phone sort default option. */
  sortDefault: string;
  /** LineChart, BarChart: empty text. */
  noData: string;
  /** LineChart, BarChart: aria label of an empty chart. */
  noDataNamed: (label: string) => string;
  /** FilterBar, FilterSheet: title. */
  filters: string;
  /** FilterBar: clear all filters. */
  clearFilters: string;
  /** FilterSheet: result button. */
  done: string;
  /** FilterBar: badge aria label. */
  activeCount: (n: number) => string;
  /** Nav badges: aria label. */
  newCount: (value: string | number) => string;
  /** BottomNav, NavRail, SectionNav: landmark. */
  sections: string;
  /** MoreSheet: theme row. */
  theme: string;
  /** NavRail: sidebar landmark. */
  sidebar: string;
  /** NavRail: expand button. */
  expandSidebar: string;
  /** NavRail: collapse button. */
  collapseSidebar: string;
  /** AppShell: skip link. */
  skipToContent: string;
  /** ThemeToggle: name of the system mode. */
  themeSystem: string;
  /** ThemeToggle: name of the light mode. */
  themeLight: string;
  /** ThemeToggle: name of the dark mode. */
  themeDark: string;
  /** ThemeToggle: button label for the current and next mode. */
  themeToggleLabel: (current: string, next: string) => string;
  /** ThemeToggle: preset select aria label. */
  themePreset: string;
  /** ThemeToggle: preset select placeholder. */
  themePresetPlaceholder: string;
  /** AppErrorBoundary: title when a new version is deployed. */
  errorStaleTitle: string;
  /** AppErrorBoundary: body when a new version is deployed. */
  errorStaleBody: string;
  /** AppErrorBoundary: title. */
  errorTitle: string;
  /** AppErrorBoundary: body when the error has no message. */
  errorBody: string;
  /** AppErrorBoundary: stack summary. */
  errorDetails: string;
  /** AppErrorBoundary: reset button. */
  errorTryAgain: string;
  /** AppErrorBoundary: reload button. */
  errorReload: string;
  /** useSaveStatus, SettingRow: saving. */
  saving: string;
  /** useSaveStatus, SettingRow: saved. */
  saved: string;
  /** useSaveStatus, SettingRow: failed with no message. */
  saveFailed: string;
  /** NumberField: validation message. */
  enterNumber: string;
  /** SplitDividers: column divider label. */
  resizeColumns: string;
  /** SplitDividers: row divider label. */
  resizeRows: string;
  /** LayoutPresetPicker: group label. */
  layoutPresets: string;
  /** MediaRow: live badge. */
  live: string;
  /** MediaRow: offline badge. */
  offlineBadge: string;
  /** FlowSteps: group label. */
  progress: string;
  /** WorkflowBoard: group label. */
  workflow: string;
  /** ActivityFeed: group label. */
  activity: string;
  /** WorkflowBoard: catch-all column. */
  other: string;
  /** WorkflowBoard: waiting column. */
  waiting: string;
  /** ActivityFeed: empty text. */
  noActivity: string;
  /** SystemCanvas: region label. */
  systemMap: string;
  /** SystemCanvas: zoom out button. */
  zoomOut: string;
  /** SystemCanvas: zoom in button. */
  zoomIn: string;
  /** SystemCanvas: fit button. */
  fitToScreen: string;
  /** SystemCanvas: follow button. */
  followActivity: string;
  /** SystemCanvas legend: menu label. */
  canvasLines: string;
  /** ServiceTokens: title. */
  serviceTokens: string;
  /** ServiceTokens: intro text. */
  serviceTokensIntro: string;
  /** ServiceTokens: loading label. */
  loadingServiceTokens: string;
  /** ServiceTokens: revoke button and confirm label. */
  tokenRevoke: string;
  /** ServiceTokens: revoked tag. */
  tokenRevoked: string;
  /** ServiceTokens: revoked tag title with a time. */
  tokenRevokedAt: (when: string) => string;
  /** ServiceTokens: revoke button aria label. */
  tokenRevokeNamed: (name: string) => string;
  /** ServiceTokens: confirm dialog title. */
  tokenRevokeTitle: (name: string) => string;
  /** ServiceTokens: revoke failure with no message. */
  tokenRevokeFailed: string;
  /** Inbox: mark-handled action. */
  inboxMarkHandled: string;
  /** Inbox: snooze action. */
  inboxSnooze: string;
  /** Inbox: row actions menu. */
  inboxActions: string;
  /** Inbox: tab list label. */
  inboxViews: string;
  /** Inbox: Open tab. */
  inboxOpen: string;
  /** Inbox: Snoozed tab. */
  inboxSnoozed: string;
  /** Inbox: Handled tab. */
  inboxHandled: string;
  /** Inbox: source chip group label. */
  inboxFilterBySource: string;
  /** Inbox: repeat count aria label. */
  inboxHappened: (count: number) => string;
  /** Pagination: previous button. */
  previousPage: string;
  /** Pagination: next button. */
  nextPage: string;
  /** Pagination: page button aria label. */
  pageLabel: (n: number) => string;
  /** Pagination: nav landmark. */
  paginationLabel: string;
  /** Breadcrumbs: nav landmark. */
  breadcrumbs: string;
  /** TagInput: remove button aria label. */
  removeTag: (tag: string) => string;
  /** FileDropzone: drop area text. */
  dropzoneLabel: string;
  /** FileDropzone: browse button. */
  browseFiles: string;
  /** FileDropzone: remove button aria label. */
  removeFile: (name: string) => string;
  /** Avatar: fallback image label. */
  avatar: string;
  /** AvatarGroup: overflow badge aria label. */
  avatarMore: (count: number) => string;
  /** Slider: minimum thumb label on a range. */
  sliderMin: string;
  /** Slider: maximum thumb label on a range. */
  sliderMax: string;
  /** Accordion: group label. */
  accordion: string;
  /** Progress: label of an indeterminate bar. */
  progressIndeterminate: string;
}

export const DEFAULT_STRINGS: NishStrings = {
  close: 'Close',
  cancel: 'Cancel',
  menu: 'Menu',
  back: 'Back: ',
  contextMenu: 'Actions',
  sortAnnounce: (header, dir) => (dir ? `Sorted by ${header}, ${dir === 'asc' ? 'ascending' : 'descending'}` : 'Sorting cleared'),
  dismiss: 'Dismiss',
  moreCount: (count) => `${count} more`,
  copy: 'Copy',
  copied: 'Copied',
  hubTitle: 'Back to nish.software',
  hubLabel: '← nish.software',
  moreActions: 'More actions',
  more: 'More',
  legend: 'Legend',
  optional: 'Optional',
  search: 'Search',
  clearSearch: 'Clear search',
  remove: 'Remove',
  removeNamed: (name) => `Remove ${name}`,
  noMatches: 'No matches',
  clear: 'Clear',
  searching: 'Searching…',
  searchPlaceholder: 'Search…',
  noResults: 'No results',
  results: 'Results',
  loading: 'Loading',
  failedToLoad: 'Failed to load',
  retry: 'Retry',
  actions: 'Actions',
  offline: "You're offline",
  nothingHere: 'Nothing here yet',
  loadingNamed: (label) => `Loading ${label}`,
  sortBy: 'Sort by',
  sortDefault: 'Default',
  noData: 'No data',
  noDataNamed: (label) => `${label}: no data`,
  filters: 'Filters',
  clearFilters: 'Clear filters',
  done: 'Done',
  activeCount: (n) => `${n} active`,
  newCount: (value) => `${value} new`,
  sections: 'Sections',
  theme: 'Theme',
  sidebar: 'Sidebar',
  expandSidebar: 'Expand sidebar',
  collapseSidebar: 'Collapse sidebar',
  skipToContent: 'Skip to content',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeToggleLabel: (current, next) => `Theme: ${current}. Switch to ${next}`,
  themePreset: 'Theme preset',
  themePresetPlaceholder: 'Preset…',
  errorStaleTitle: 'A new version is available',
  errorStaleBody: 'Reload the page to get the latest version.',
  errorTitle: 'Something went wrong',
  errorBody: 'An unexpected error occurred.',
  errorDetails: 'Details',
  errorTryAgain: 'Try again',
  errorReload: 'Reload page',
  saving: 'Saving…',
  saved: 'Saved',
  saveFailed: 'Could not save',
  enterNumber: 'Enter a number',
  resizeColumns: 'Resize columns',
  resizeRows: 'Resize rows',
  layoutPresets: 'Layout presets',
  live: 'Live',
  offlineBadge: 'Offline',
  progress: 'Progress',
  workflow: 'Workflow',
  activity: 'Activity',
  other: 'Other',
  waiting: 'Waiting',
  noActivity: 'No activity yet',
  systemMap: 'System map',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  fitToScreen: 'Fit to screen',
  followActivity: 'Follow activity',
  canvasLines: 'Lines',
  serviceTokens: 'Service tokens',
  serviceTokensIntro:
    'Machine clients, like the nish MCP server, use these tokens to read this app. Revoking one stops it at once.',
  loadingServiceTokens: 'Loading service tokens',
  tokenRevoke: 'Revoke',
  tokenRevoked: 'Revoked',
  tokenRevokedAt: (when) => `Revoked ${when}`,
  tokenRevokeNamed: (name) => `Revoke ${name}`,
  tokenRevokeTitle: (name) => `Revoke ${name}?`,
  tokenRevokeFailed: 'Could not revoke the token.',
  inboxMarkHandled: 'Mark handled',
  inboxSnooze: 'Snooze',
  inboxActions: 'Actions',
  inboxViews: 'Inbox views',
  inboxOpen: 'Open',
  inboxSnoozed: 'Snoozed',
  inboxHandled: 'Handled',
  inboxFilterBySource: 'Filter by source',
  inboxHappened: (count) => `Happened ${count} times`,
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageLabel: (n) => `Page ${n}`,
  paginationLabel: 'Pagination',
  breadcrumbs: 'Breadcrumbs',
  removeTag: (tag) => `Remove ${tag}`,
  dropzoneLabel: 'Drop files here or browse',
  browseFiles: 'Browse files',
  removeFile: (name) => `Remove ${name}`,
  avatar: 'Avatar',
  avatarMore: (count) => `${count} more`,
  sliderMin: 'Minimum',
  sliderMax: 'Maximum',
  accordion: 'Accordion',
  progressIndeterminate: 'Loading',
};
