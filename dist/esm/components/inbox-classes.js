// src/components/inbox-classes.ts
var DEFAULT_INBOX_LABELS = {
  urgent: "Urgent",
  normal: "Normal",
  info: "Info",
  snooze1h: "1 hour",
  snooze4h: "4 hours",
  snoozeTomorrow: "Tomorrow 8 AM",
  snoozeMonday: "Monday 8 AM",
  unsnooze: "Unsnooze",
  moveBack: "Move back",
  markAllHandled: "Mark all handled",
  markAllTitle: (n) => `Mark ${n} ${n === 1 ? "item" : "items"} handled?`,
  all: "All",
  loadMore: "Load more",
  less: "Less",
  until: (when) => `Until ${when}`,
  handledAgo: (when) => `Handled ${when}`,
  handledByApp: " by the app",
  handledAutomatically: " automatically",
  actionRan: (label, at) => `${label} ran ${at}`,
  actionFailed: (label, at, why) => `${label} failed ${at}${why ? ` \xB7 ${why}` : ""}`,
  emptyOpen: (src) => `Nothing open${src ? ` from ${src}` : ""}`,
  emptySnoozed: (src) => `Nothing snoozed${src ? ` from ${src}` : ""}`,
  emptyHandled: (src) => `Nothing handled${src ? ` from ${src}` : ""} in the last 30 days`
};
export {
  DEFAULT_INBOX_LABELS
};
