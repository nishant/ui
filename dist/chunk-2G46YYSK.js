// src/server/inbox/types.ts
var INBOX_ACTION_HEADER = "X-Inbox-Action";
var INBOX_ACTION_TIMEOUT_MS = 8e3;
var INBOX_DEFAULT_SETTINGS = {
  timezone: "America/Chicago",
  quietHours: { enabled: true, start: "22:00", end: "07:00" },
  digest: { enabled: true, time: "08:00" },
  mutedSources: []
};
var INBOX_SOURCE_LABELS = {
  trading: "Trading",
  trackers: "Trackers",
  "job-apps": "Jobs",
  status: "Status",
  ci: "CI",
  "mc-packs": "Packs",
  workflows: "Workflows"
};

export {
  INBOX_ACTION_HEADER,
  INBOX_ACTION_TIMEOUT_MS,
  INBOX_DEFAULT_SETTINGS,
  INBOX_SOURCE_LABELS
};
//# sourceMappingURL=chunk-2G46YYSK.js.map