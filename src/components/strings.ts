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
  /** DatePicker: custom validity message for text that is not a date. */
  invalidDate: string;
  /** DatePicker: calendar button name while empty. */
  chooseDate: string;
  /** DatePicker: calendar button name once a date is set. */
  changeDate: (date: string) => string;
  /** Calendar: previous month button. */
  previousMonth: string;
  /** Calendar: next month button. */
  nextMonth: string;
  /** Calendar: month select name. */
  month: string;
  /** Calendar: year select name. */
  year: string;
  /** DatePicker: day token in the placeholder. */
  dayToken: string;
  /** DatePicker: month token in the placeholder. */
  monthToken: string;
  /** DatePicker: year token in the placeholder. */
  yearToken: string;
  /** DateRangePicker: calendar button name while empty, and the popover name. */
  chooseDates: string;
  /** DateRangePicker: calendar button name once a range is set. */
  changeDates: (range: string) => string;
  /** RangeCalendar, DateRangePicker: two dates read as a range. */
  dateRange: (from: string, to: string) => string;
  /** RangeCalendar: live-region text after the first day is picked. */
  rangeStarted: (start: string) => string;
  /** DateRangePicker: custom validity message for text that is not a range. */
  invalidDateRange: string;
  /** TimeField: name of the hour box. */
  hour: string;
  /** TimeField: name of the minute box. */
  minute: string;
  /** TimeField: name of the AM/PM select. */
  dayPeriod: string;
  /** TimeField: custom validity message for a time that is incomplete or not allowed. */
  invalidTime: string;
  /** MultiSelect: announcement after a value is added. */
  optionAdded: (label: string) => string;
  /** MultiSelect: announcement after a value is removed. */
  optionRemoved: (label: string) => string;
  /** MultiSelect: clear-all button. */
  clearAll: string;
  /** MultiSelect: announcement when the pick limit is reached. */
  maxSelected: (max: number) => string;
  /** Carousel: role description of the region. */
  carouselRole: string;
  /** Carousel: role description of each slide. */
  slideRole: string;
  /** Carousel: label of each slide. */
  slideLabel: (n: number, count: number) => string;
  /** Carousel: previous slide button. */
  previousSlide: string;
  /** Carousel: next slide button. */
  nextSlide: string;
  /** Carousel: slide picker dot name. */
  goToSlide: (n: number) => string;
  /** Carousel: label of the slide picker group. */
  slidePicker: string;
  /** Carousel: start auto-rotation button. */
  startRotation: string;
  /** Carousel: stop auto-rotation button. */
  stopRotation: string;
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

/* Groups are module-level constants: `useStrings` memoizes on their identity, so never build one inside a
 * component. Every key of NishStrings is in exactly one group (checked below and in strings.test.ts). */

/** @internal Defaults for Modal, Drawer, SheetHandle, ConfirmDialog, CommandPalette, DropdownMenu, ContextMenu. */
export const OVERLAY_STRINGS = {
  close: 'Close',
  cancel: 'Cancel',
  menu: 'Menu',
  back: 'Back: ',
  contextMenu: 'Actions',
} satisfies Partial<NishStrings>;

/** @internal Defaults for AppShell, AppHeader, BottomNav, NavRail, MoreSheet, Breadcrumbs, Inbox. */
export const SHELL_STRINGS = {
  sections: 'Sections',
  more: 'More',
  hubTitle: 'Back to nish.software',
  hubLabel: '← nish.software',
  moreActions: 'More actions',
  skipToContent: 'Skip to content',
  sidebar: 'Sidebar',
  expandSidebar: 'Expand sidebar',
  collapseSidebar: 'Collapse sidebar',
  newCount: (value) => `${value} new`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Spinner, Skeleton, ErrorState, AsyncPanel, ConnectionBanner, StickyActionBar, ResponsiveTable. */
export const STATUS_STRINGS = {
  loading: 'Loading',
  failedToLoad: 'Failed to load',
  retry: 'Retry',
  nothingHere: 'Nothing here yet',
  loadingNamed: (label) => `Loading ${label}`,
  offline: "You're offline",
  actions: 'Actions',
} satisfies Partial<NishStrings>;

/** @internal Defaults for ThemeToggle, MoreSheet and the React-free theme entry. */
export const THEME_STRINGS = {
  theme: 'Theme',
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeToggleLabel: (current, next) => `Theme: ${current}. Switch to ${next}`,
  themePreset: 'Theme preset',
  themePresetPlaceholder: 'Preset…',
} satisfies Partial<NishStrings>;

/** @internal Defaults for AppErrorBoundary and the service-tokens retry button. */
export const ERROR_STRINGS = {
  errorStaleTitle: 'A new version is available',
  errorStaleBody: 'Reload the page to get the latest version.',
  errorTitle: 'Something went wrong',
  errorBody: 'An unexpected error occurred.',
  errorDetails: 'Details',
  errorTryAgain: 'Try again',
  errorReload: 'Reload page',
} satisfies Partial<NishStrings>;

/** @internal Defaults for Toast, Callout, CopyButton, ChartLegend, LineChart, BarChart. */
export const DISPLAY_STRINGS = {
  dismiss: 'Dismiss',
  moreCount: (count) => `${count} more`,
  copy: 'Copy',
  copied: 'Copied',
  legend: 'Legend',
  noData: 'No data',
  noDataNamed: (label) => `${label}: no data`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Field, SearchInput, Chip, Combobox, MultiSelect, TagInput, FilterBar, CommandPalette. */
export const FIELD_STRINGS = {
  optional: 'Optional',
  search: 'Search',
  clearSearch: 'Clear search',
  remove: 'Remove',
  removeNamed: (name) => `Remove ${name}`,
  clear: 'Clear',
  noMatches: 'No matches',
  searching: 'Searching…',
  removeTag: (tag) => `Remove ${tag}`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for FilterBar, FilterSheet. */
export const FILTER_STRINGS = {
  filters: 'Filters',
  clearFilters: 'Clear filters',
  done: 'Done',
  activeCount: (n) => `${n} active`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Calendar, RangeCalendar, DatePicker, DateRangePicker. */
export const PICKER_STRINGS = {
  invalidDate: 'Enter a valid date.',
  chooseDate: 'Choose date',
  changeDate: (date) => `Change date, ${date}`,
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  month: 'Month',
  year: 'Year',
  dayToken: 'DD',
  monthToken: 'MM',
  yearToken: 'YYYY',
  chooseDates: 'Choose dates',
  changeDates: (range) => `Change dates, ${range}`,
  dateRange: (from, to) => `${from} to ${to}`,
  rangeStarted: (start) => `Start date ${start}. Pick the end date.`,
  invalidDateRange: 'Enter a valid date range.',
} satisfies Partial<NishStrings>;

/** @internal Defaults for MultiSelect. */
export const MULTI_SELECT_STRINGS = {
  optionAdded: (l) => `Added ${l}`,
  optionRemoved: (l) => `Removed ${l}`,
  clearAll: 'Clear all',
  maxSelected: (n) => `You can pick up to ${n}`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Carousel. */
export const CAROUSEL_STRINGS = {
  carouselRole: 'carousel',
  slideRole: 'slide',
  slideLabel: (n, c) => `${n} of ${c}`,
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  goToSlide: (n) => `Go to slide ${n}`,
  slidePicker: 'Choose slide',
  startRotation: 'Start slide rotation',
  stopRotation: 'Stop slide rotation',
} satisfies Partial<NishStrings>;

/** @internal Defaults for CommandPalette. */
export const COMMAND_STRINGS = {
  searchPlaceholder: 'Search…',
  noResults: 'No results',
  results: 'Results',
} satisfies Partial<NishStrings>;

/** @internal Defaults for VirtualTable, ResponsiveTable. */
export const TABLE_STRINGS = {
  sortAnnounce: (header, dir) => (dir ? `Sorted by ${header}, ${dir === 'asc' ? 'ascending' : 'descending'}` : 'Sorting cleared'),
  sortBy: 'Sort by',
  sortDefault: 'Default',
} satisfies Partial<NishStrings>;

/** @internal Defaults for useSaveStatus, SettingRow, NumberField. */
export const SETTINGS_STRINGS = {
  saving: 'Saving…',
  saved: 'Saved',
  saveFailed: 'Could not save',
  enterNumber: 'Enter a number',
} satisfies Partial<NishStrings>;

/** @internal Defaults for SplitDividers, LayoutPresetPicker. */
export const SPLIT_STRINGS = {
  resizeColumns: 'Resize columns',
  resizeRows: 'Resize rows',
  layoutPresets: 'Layout presets',
} satisfies Partial<NishStrings>;

/** @internal Defaults for MediaRow, SystemCanvas nodes. */
export const MEDIA_STRINGS = {
  live: 'Live',
  offlineBadge: 'Offline',
} satisfies Partial<NishStrings>;

/** @internal Defaults for Progress, FlowSteps. */
export const PROGRESS_STRINGS = {
  progress: 'Progress',
  progressIndeterminate: 'Loading',
} satisfies Partial<NishStrings>;

/** @internal Defaults for WorkflowBoard, ActivityFeed. */
export const FLOW_STRINGS = {
  workflow: 'Workflow',
  activity: 'Activity',
  other: 'Other',
  waiting: 'Waiting',
  noActivity: 'No activity yet',
} satisfies Partial<NishStrings>;

/** @internal Defaults for SystemCanvas and its legend. */
export const CANVAS_STRINGS = {
  systemMap: 'System map',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  fitToScreen: 'Fit to screen',
  followActivity: 'Follow activity',
  canvasLines: 'Lines',
} satisfies Partial<NishStrings>;

/** @internal Defaults for ServiceTokens. */
export const TOKEN_STRINGS = {
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
} satisfies Partial<NishStrings>;

/** @internal Defaults for Inbox. */
export const INBOX_STRINGS = {
  inboxMarkHandled: 'Mark handled',
  inboxSnooze: 'Snooze',
  inboxActions: 'Actions',
  inboxViews: 'Inbox views',
  inboxOpen: 'Open',
  inboxSnoozed: 'Snoozed',
  inboxHandled: 'Handled',
  inboxFilterBySource: 'Filter by source',
  inboxHappened: (count) => `Happened ${count} times`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Pagination, Breadcrumbs. */
export const PAGING_STRINGS = {
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageLabel: (n) => `Page ${n}`,
  paginationLabel: 'Pagination',
  breadcrumbs: 'Breadcrumbs',
} satisfies Partial<NishStrings>;

/** @internal Defaults for FileDropzone. */
export const FILE_STRINGS = {
  dropzoneLabel: 'Drop files here or browse',
  browseFiles: 'Browse files',
  removeFile: (name) => `Remove ${name}`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Avatar, AvatarGroup. */
export const AVATAR_STRINGS = {
  avatar: 'Avatar',
  avatarMore: (count) => `${count} more`,
} satisfies Partial<NishStrings>;

/** @internal Defaults for Slider. */
export const SLIDER_STRINGS = {
  sliderMin: 'Minimum',
  sliderMax: 'Maximum',
} satisfies Partial<NishStrings>;

/** @internal Defaults for Accordion. */
export const ACCORDION_STRINGS = {
  accordion: 'Accordion',
} satisfies Partial<NishStrings>;

/** @internal Defaults for TimeField. */
export const TIME_STRINGS = {
  hour: 'Hour',
  minute: 'Minute',
  dayPeriod: 'AM/PM',
  invalidTime: 'Enter a valid time.',
} satisfies Partial<NishStrings>;

/** Every English default. Built from the groups; components read their own groups through `useStrings`. */
export const DEFAULT_STRINGS: NishStrings = /* @__PURE__ */ Object.assign(
  {},
  OVERLAY_STRINGS,
  SHELL_STRINGS,
  STATUS_STRINGS,
  THEME_STRINGS,
  ERROR_STRINGS,
  DISPLAY_STRINGS,
  FIELD_STRINGS,
  FILTER_STRINGS,
  PICKER_STRINGS,
  MULTI_SELECT_STRINGS,
  CAROUSEL_STRINGS,
  COMMAND_STRINGS,
  TABLE_STRINGS,
  SETTINGS_STRINGS,
  SPLIT_STRINGS,
  MEDIA_STRINGS,
  PROGRESS_STRINGS,
  FLOW_STRINGS,
  CANVAS_STRINGS,
  TOKEN_STRINGS,
  INBOX_STRINGS,
  PAGING_STRINGS,
  FILE_STRINGS,
  AVATAR_STRINGS,
  SLIDER_STRINGS,
  ACCORDION_STRINGS,
  TIME_STRINGS,
) as NishStrings;

/* Compile-time completeness check: a key of NishStrings that no group defines makes this record non-empty and
 * fails to compile. */
type AllGroups =
    typeof OVERLAY_STRINGS
  & typeof SHELL_STRINGS
  & typeof STATUS_STRINGS
  & typeof THEME_STRINGS
  & typeof ERROR_STRINGS
  & typeof DISPLAY_STRINGS
  & typeof FIELD_STRINGS
  & typeof FILTER_STRINGS
  & typeof PICKER_STRINGS
  & typeof MULTI_SELECT_STRINGS
  & typeof CAROUSEL_STRINGS
  & typeof COMMAND_STRINGS
  & typeof TABLE_STRINGS
  & typeof SETTINGS_STRINGS
  & typeof SPLIT_STRINGS
  & typeof MEDIA_STRINGS
  & typeof PROGRESS_STRINGS
  & typeof FLOW_STRINGS
  & typeof CANVAS_STRINGS
  & typeof TOKEN_STRINGS
  & typeof INBOX_STRINGS
  & typeof PAGING_STRINGS
  & typeof FILE_STRINGS
  & typeof AVATAR_STRINGS
  & typeof SLIDER_STRINGS
  & typeof ACCORDION_STRINGS
  & typeof TIME_STRINGS;
const _complete: Record<Exclude<keyof NishStrings, keyof AllGroups>, never> = {};
void _complete;
