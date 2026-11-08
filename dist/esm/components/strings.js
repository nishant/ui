// src/components/strings.ts
var OVERLAY_STRINGS = {
  close: "Close",
  cancel: "Cancel",
  menu: "Menu",
  back: "Back: ",
  contextMenu: "Actions"
};
var SHELL_STRINGS = {
  sections: "Sections",
  more: "More",
  hubTitle: "Back to nish.software",
  hubLabel: "\u2190 nish.software",
  moreActions: "More actions",
  skipToContent: "Skip to content",
  sidebar: "Sidebar",
  expandSidebar: "Expand sidebar",
  collapseSidebar: "Collapse sidebar",
  newCount: (value) => `${value} new`
};
var STATUS_STRINGS = {
  loading: "Loading",
  failedToLoad: "Failed to load",
  retry: "Retry",
  nothingHere: "Nothing here yet",
  loadingNamed: (label) => `Loading ${label}`,
  offline: "You're offline",
  actions: "Actions"
};
var THEME_STRINGS = {
  theme: "Theme",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  themeToggleLabel: (current, next) => `Theme: ${current}. Switch to ${next}`,
  themePreset: "Theme preset",
  themePresetPlaceholder: "Preset\u2026"
};
var ERROR_STRINGS = {
  errorStaleTitle: "A new version is available",
  errorStaleBody: "Reload the page to get the latest version.",
  errorTitle: "Something went wrong",
  errorBody: "An unexpected error occurred.",
  errorDetails: "Details",
  errorTryAgain: "Try again",
  errorReload: "Reload page"
};
var DISPLAY_STRINGS = {
  dismiss: "Dismiss",
  moreCount: (count) => `${count} more`,
  copy: "Copy",
  copied: "Copied",
  legend: "Legend",
  noData: "No data",
  noDataNamed: (label) => `${label}: no data`
};
var FIELD_STRINGS = {
  optional: "Optional",
  search: "Search",
  clearSearch: "Clear search",
  remove: "Remove",
  removeNamed: (name) => `Remove ${name}`,
  clear: "Clear",
  noMatches: "No matches",
  searching: "Searching\u2026",
  removeTag: (tag) => `Remove ${tag}`
};
var FILTER_STRINGS = {
  filters: "Filters",
  clearFilters: "Clear filters",
  done: "Done",
  activeCount: (n) => `${n} active`
};
var PICKER_STRINGS = {
  invalidDate: "Enter a valid date.",
  chooseDate: "Choose date",
  changeDate: (date) => `Change date, ${date}`,
  previousMonth: "Previous month",
  nextMonth: "Next month",
  month: "Month",
  year: "Year",
  dayToken: "DD",
  monthToken: "MM",
  yearToken: "YYYY",
  chooseDates: "Choose dates",
  changeDates: (range) => `Change dates, ${range}`,
  dateRange: (from, to) => `${from} to ${to}`,
  rangeStarted: (start) => `Start date ${start}. Pick the end date.`,
  invalidDateRange: "Enter a valid date range."
};
var MULTI_SELECT_STRINGS = {
  optionAdded: (l) => `Added ${l}`,
  optionRemoved: (l) => `Removed ${l}`,
  clearAll: "Clear all",
  maxSelected: (n) => `You can pick up to ${n}`
};
var CAROUSEL_STRINGS = {
  carouselRole: "carousel",
  slideRole: "slide",
  slideLabel: (n, c) => `${n} of ${c}`,
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToSlide: (n) => `Go to slide ${n}`,
  slidePicker: "Choose slide",
  startRotation: "Start slide rotation",
  stopRotation: "Stop slide rotation"
};
var COMMAND_STRINGS = {
  searchPlaceholder: "Search\u2026",
  noResults: "No results",
  results: "Results"
};
var TABLE_STRINGS = {
  sortAnnounce: (header, dir) => dir ? `Sorted by ${header}, ${dir === "asc" ? "ascending" : "descending"}` : "Sorting cleared",
  sortBy: "Sort by",
  sortDefault: "Default"
};
var SETTINGS_STRINGS = {
  saving: "Saving\u2026",
  saved: "Saved",
  saveFailed: "Could not save",
  enterNumber: "Enter a number"
};
var SPLIT_STRINGS = {
  resizeColumns: "Resize columns",
  resizeRows: "Resize rows",
  layoutPresets: "Layout presets"
};
var MEDIA_STRINGS = {
  live: "Live",
  offlineBadge: "Offline"
};
var PROGRESS_STRINGS = {
  progress: "Progress",
  progressIndeterminate: "Loading"
};
var FLOW_STRINGS = {
  workflow: "Workflow",
  activity: "Activity",
  other: "Other",
  waiting: "Waiting",
  noActivity: "No activity yet"
};
var CANVAS_STRINGS = {
  systemMap: "System map",
  zoomOut: "Zoom out",
  zoomIn: "Zoom in",
  fitToScreen: "Fit to screen",
  followActivity: "Follow activity",
  canvasLines: "Lines"
};
var TOKEN_STRINGS = {
  serviceTokens: "Service tokens",
  serviceTokensIntro: "Machine clients, like the nish MCP server, use these tokens to read this app. Revoking one stops it at once.",
  loadingServiceTokens: "Loading service tokens",
  tokenRevoke: "Revoke",
  tokenRevoked: "Revoked",
  tokenRevokedAt: (when) => `Revoked ${when}`,
  tokenRevokeNamed: (name) => `Revoke ${name}`,
  tokenRevokeTitle: (name) => `Revoke ${name}?`,
  tokenRevokeFailed: "Could not revoke the token."
};
var INBOX_STRINGS = {
  inboxMarkHandled: "Mark handled",
  inboxSnooze: "Snooze",
  inboxActions: "Actions",
  inboxViews: "Inbox views",
  inboxOpen: "Open",
  inboxSnoozed: "Snoozed",
  inboxHandled: "Handled",
  inboxFilterBySource: "Filter by source",
  inboxHappened: (count) => `Happened ${count} times`
};
var PAGING_STRINGS = {
  previousPage: "Previous page",
  nextPage: "Next page",
  pageLabel: (n) => `Page ${n}`,
  paginationLabel: "Pagination",
  breadcrumbs: "Breadcrumbs"
};
var FILE_STRINGS = {
  dropzoneLabel: "Drop files here or browse",
  browseFiles: "Browse files",
  removeFile: (name) => `Remove ${name}`
};
var AVATAR_STRINGS = {
  avatar: "Avatar",
  avatarMore: (count) => `${count} more`
};
var SLIDER_STRINGS = {
  sliderMin: "Minimum",
  sliderMax: "Maximum"
};
var ACCORDION_STRINGS = {
  accordion: "Accordion"
};
var TIME_STRINGS = {
  hour: "Hour",
  minute: "Minute",
  dayPeriod: "AM/PM",
  invalidTime: "Enter a valid time."
};
var DEFAULT_STRINGS = /* @__PURE__ */ Object.assign(
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
  TIME_STRINGS
);
export {
  ACCORDION_STRINGS,
  AVATAR_STRINGS,
  CANVAS_STRINGS,
  CAROUSEL_STRINGS,
  COMMAND_STRINGS,
  DEFAULT_STRINGS,
  DISPLAY_STRINGS,
  ERROR_STRINGS,
  FIELD_STRINGS,
  FILE_STRINGS,
  FILTER_STRINGS,
  FLOW_STRINGS,
  INBOX_STRINGS,
  MEDIA_STRINGS,
  MULTI_SELECT_STRINGS,
  OVERLAY_STRINGS,
  PAGING_STRINGS,
  PICKER_STRINGS,
  PROGRESS_STRINGS,
  SETTINGS_STRINGS,
  SHELL_STRINGS,
  SLIDER_STRINGS,
  SPLIT_STRINGS,
  STATUS_STRINGS,
  TABLE_STRINGS,
  THEME_STRINGS,
  TIME_STRINGS,
  TOKEN_STRINGS
};
