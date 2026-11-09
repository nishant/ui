// src/components/canvas/types.ts
var DEFAULT_CANVAS_LABELS = {
  hidden: (count) => `\xB7 ${count} hidden`,
  followIdle: "Following \xB7 waiting for activity",
  followOne: (group, label) => `Following \xB7 ${group} \u203A ${label}`,
  followMany: (count) => `Following ${count} active pieces`
};
export {
  DEFAULT_CANVAS_LABELS
};
