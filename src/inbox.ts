// nish-ui/inbox: the Inbox component, its labels and the inbox data types. Fleet-only: built for the
// nish.software apps, may change in a minor release. The same names stay on the root entry through 2.x.
export { Inbox } from './components/inbox';
export type { InboxProps, InboxLabels } from './components/inbox';
export { DEFAULT_INBOX_LABELS } from './components/inbox-classes';
export { INBOX_SOURCE_LABELS, INBOX_DEFAULT_SETTINGS, INBOX_ACTION_HEADER, INBOX_ACTION_TIMEOUT_MS } from './inbox-types';
export type { InboxItem, InboxView, InboxSeverity, InboxSettings, InboxListResponse, InboxAction, InboxActionResult, InboxActionCall } from './inbox-types';
