#!/usr/bin/env node

// src/node/th-check.ts
import { readdirSync, readFileSync, statSync } from "fs";
import { extname, join } from "path";
import { pathToFileURL } from "url";

// src/tokens.mjs
var COLOR_ROLES = [
  "bg",
  // page background
  "surface",
  // cards, panels, table bodies
  "elevated",
  // popovers, hovered rows, inputs, raised things inside cards
  "overlay",
  // the deepest inner layer: chips inside raised things, skeleton sheen
  "line",
  // borders and dividers
  "line-strong",
  // input borders, focused outlines that are not the accent
  "hi",
  // primary text
  "hi2",
  // secondary text
  "hi3",
  // tertiary text, labels
  "ghost",
  // placeholders, disabled, decorative icons (not for body text)
  "accent",
  // links, primary buttons, active nav, focus ring
  "accent2",
  // a second accent for paired highlights and the 2nd chart series
  "on-accent",
  // text and icons on an accent fill
  "on-accent2",
  // text and icons on an accent2 fill
  "on-ok",
  // text and icons on a solid ok-fill
  "on-loss",
  // ... on loss-fill and loss (danger buttons)
  "on-warn",
  // ... on warn-fill
  "on-info",
  // ... on info-fill
  "ok",
  // success, gains
  "loss",
  // errors, losses, destructive
  "warn",
  // warnings, pending
  "info",
  // neutral notices
  "ok-fill",
  // status colors for bars, meters and chart lines: brighter than the
  "loss-fill",
  // text versions in light themes, where text-safe colors look muddy as fills
  "warn-fill",
  "info-fill",
  "scrim",
  // modal and drawer backdrop tone
  "invert-bg",
  // inverted pill (today marker, active segmented control)
  "invert-text",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
  "chart-7",
  "chart-8",
  "emerald",
  "indigo",
  "amber",
  "lime",
  "rose",
  "sky",
  "violet",
  "teal"
];
var HUE_ROLES = ["emerald", "indigo", "amber", "lime", "rose", "sky", "violet", "teal"];
var SOFT_ROLES = ["accent", "ok", "loss", "warn", "info", ...HUE_ROLES];
var DARK_HUES = {
  emerald: "#34d399",
  indigo: "#8b93ff",
  amber: "#fbbf24",
  lime: "#a3e635",
  rose: "#fb7185",
  sky: "#38bdf8",
  violet: "#c084fc",
  teal: "#2dd4bf"
};
var LIGHT_HUES = {
  emerald: "#046d4f",
  indigo: "#4e45e3",
  amber: "#9b4708",
  lime: "#41690d",
  rose: "#b8113a",
  sky: "#036499",
  violet: "#7e22ce",
  teal: "#0e6b64"
};
var DARK_CHART = ["#8b93ff", "#34d399", "#fbbf24", "#fb7185", "#38bdf8", "#c084fc", "#fb923c", "#a3e635"];
var LIGHT_CHART = ["#6366f1", "#059669", "#c96d06", "#f43f5e", "#0284c7", "#a855f7", "#ea580c", "#5a910c"];
var chart = (list) => Object.fromEntries(list.map((c, i) => [`chart-${i + 1}`, c]));
var THEMES = {
  dark: {
    label: "Dark",
    scheme: "dark",
    colors: {
      bg: "#0a0b0f",
      surface: "#111218",
      elevated: "#191b23",
      overlay: "#22252f",
      line: "#262935",
      "line-strong": "#3a3e4d",
      hi: "#ececf1",
      hi2: "#a8aab7",
      hi3: "#8a8d9b",
      ghost: "#6b6e7c",
      accent: "#8b93ff",
      accent2: "#c084fc",
      "on-accent": "#0a0b0f",
      ok: "#34d399",
      loss: "#f87171",
      warn: "#fbbf24",
      info: "#38bdf8",
      scrim: "#000000",
      "invert-bg": "#ececf1",
      "invert-text": "#111218",
      ...chart(DARK_CHART),
      ...DARK_HUES
    }
  },
  light: {
    label: "Light",
    scheme: "light",
    colors: {
      bg: "#f7f6f3",
      surface: "#ffffff",
      elevated: "#f1f0ec",
      overlay: "#e6e4de",
      line: "#e2e0da",
      "line-strong": "#c9c6bd",
      hi: "#17171c",
      hi2: "#4f515c",
      hi3: "#666874",
      ghost: "#8a8c98",
      accent: "#4338ca",
      accent2: "#7e22ce",
      "on-accent": "#ffffff",
      // Light fills are mid-tones: white only clears 4.5:1 on loss and accent2.
      "on-accent2": "#ffffff",
      "on-ok": "#0a0a0c",
      "on-loss": "#ffffff",
      "on-warn": "#0a0a0c",
      "on-info": "#0a0a0c",
      ok: "#065f46",
      "ok-fill": "#059669",
      "loss-fill": "#dc2626",
      "warn-fill": "#c96d06",
      "info-fill": "#0284c7",
      loss: "#a91b1b",
      warn: "#92400e",
      info: "#075985",
      scrim: "#17171c",
      "invert-bg": "#17171c",
      "invert-text": "#f7f6f3",
      ...chart(LIGHT_CHART),
      ...LIGHT_HUES
    }
  },
  slate: {
    label: "Slate",
    scheme: "dark",
    colors: {
      bg: "#18181b",
      surface: "#202024",
      elevated: "#2c2c32",
      overlay: "#36363d",
      line: "#3a3a42",
      "line-strong": "#52525b",
      hi: "#f4f4f5",
      hi2: "#a1a1aa",
      hi3: "#8f8f99",
      ghost: "#71717a",
      accent: "#a5b4fc",
      accent2: "#c084fc",
      "on-accent": "#18181b",
      ok: "#4ade80",
      loss: "#fda4af",
      warn: "#facc15",
      info: "#38bdf8",
      scrim: "#000000",
      "invert-bg": "#f4f4f5",
      "invert-text": "#202024",
      ...chart(["#818cf8", "#4ade80", "#facc15", "#fb7185", "#38bdf8", "#c084fc", "#fb923c", "#a3e635"]),
      ...DARK_HUES,
      // Lifted so tinted chips stay readable on this theme's lighter cards.
      indigo: "#9aa1ff",
      rose: "#fc8395",
      violet: "#c792fc"
    }
  },
  terminal: {
    label: "Terminal",
    scheme: "dark",
    colors: {
      bg: "#050807",
      surface: "#0c110e",
      elevated: "#141c17",
      overlay: "#1c2820",
      line: "#233028",
      "line-strong": "#34483b",
      hi: "#d1fae5",
      hi2: "#8fc4a8",
      hi3: "#74a68b",
      ghost: "#4f7a62",
      accent: "#34d399",
      accent2: "#2dd4bf",
      "on-accent": "#050807",
      ok: "#4ade80",
      loss: "#f87171",
      warn: "#fbbf24",
      info: "#67e8f9",
      scrim: "#000000",
      "invert-bg": "#d1fae5",
      "invert-text": "#0c110e",
      ...chart(["#34d399", "#67e8f9", "#fbbf24", "#f87171", "#a3e635", "#c084fc", "#fb923c", "#2dd4bf"]),
      ...DARK_HUES
    }
  },
  mocha: {
    label: "Mocha",
    scheme: "dark",
    colors: {
      bg: "#1c1917",
      surface: "#292524",
      elevated: "#393432",
      overlay: "#44403c",
      line: "#44403c",
      "line-strong": "#57534e",
      hi: "#f5f0eb",
      hi2: "#b3ada8",
      hi3: "#a39d98",
      ghost: "#78716c",
      accent: "#fdba74",
      accent2: "#f472b6",
      "on-accent": "#1c1917",
      ok: "#4ade80",
      loss: "#fca5a5",
      warn: "#facc15",
      info: "#7dd3fc",
      scrim: "#000000",
      "invert-bg": "#f5f0eb",
      "invert-text": "#292524",
      ...chart(["#fb923c", "#4ade80", "#facc15", "#f472b6", "#7dd3fc", "#c4b5fd", "#f87171", "#bef264"]),
      ...DARK_HUES,
      // Lifted so tinted chips stay readable on this theme's lighter cards.
      indigo: "#a9afff",
      rose: "#fc99a7",
      sky: "#3ebff8",
      violet: "#cfa2fd"
    }
  },
  ocean: {
    label: "Ocean",
    scheme: "dark",
    colors: {
      bg: "#020c18",
      surface: "#061528",
      elevated: "#0a243e",
      overlay: "#103658",
      line: "#123050",
      "line-strong": "#1f4a72",
      hi: "#e0f2fe",
      hi2: "#9ccde6",
      hi3: "#6fa9c6",
      ghost: "#3f7392",
      accent: "#38bdf8",
      accent2: "#a78bfa",
      "on-accent": "#020c18",
      ok: "#34d399",
      loss: "#fb7185",
      warn: "#fbbf24",
      info: "#7dd3fc",
      scrim: "#000000",
      "invert-bg": "#38bdf8",
      "invert-text": "#020c18",
      ...chart(["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf", "#fb923c", "#a3e635"]),
      ...DARK_HUES
    }
  },
  contrast: {
    label: "High contrast",
    scheme: "dark",
    colors: {
      bg: "#000000",
      surface: "#080808",
      elevated: "#141414",
      overlay: "#222222",
      line: "#4a4a4a",
      "line-strong": "#8a8a8a",
      hi: "#ffffff",
      hi2: "#d4d4d4",
      hi3: "#bdbdbd",
      ghost: "#8f8f8f",
      accent: "#ffd60a",
      accent2: "#7dd3fc",
      "on-accent": "#000000",
      ok: "#4ade80",
      loss: "#ff6b6b",
      warn: "#ffd60a",
      info: "#7dd3fc",
      scrim: "#000000",
      "invert-bg": "#ffffff",
      "invert-text": "#000000",
      ...chart(["#ffd60a", "#4ade80", "#7dd3fc", "#ff6b6b", "#c4b5fd", "#fb923c", "#f9a8d4", "#bef264"]),
      ...DARK_HUES
    }
  }
};
for (const t of Object.values(THEMES)) {
  for (const r of ["ok", "loss", "warn", "info"]) {
    t.colors[`${r}-fill`] ??= t.colors[r];
    t.colors[`on-${r}`] ??= t.colors["on-accent"];
  }
  t.colors["on-accent2"] ??= t.colors["on-accent"];
}

// src/th-colors.mjs
var TH_COLORS = [
  ...COLOR_ROLES.filter((r) => !r.startsWith("chart-")).map((r) => [r, r]),
  ...COLOR_ROLES.filter((r) => r.startsWith("chart-")).map((r) => [r, r]),
  ...SOFT_ROLES.flatMap((r) => [[`${r}-soft`, `${r}-soft`], [`${r}-soft-solid`, `${r}-soft-solid`]]),
  // Aliases for the names trading and nishboard already use.
  ["gain", "ok"],
  ["danger", "loss"],
  ["2", "hi2"],
  ["3", "hi3"],
  ["bar", "surface"],
  ["focus", "focus"]
];
var TH_COLOR_NAMES = TH_COLORS.map(([name]) => name);

// src/node/th-classes.ts
var TH_COLOR_NAMES2 = new Set(TH_COLOR_NAMES);
var UTILITY = "(?:bg|text|border(?:-[xytrblse])?|ring(?:-offset)?|outline|divide|decoration|fill|stroke|from|via|to|shadow|inset-shadow|inset-ring|accent|caret|placeholder)";
var CLASS_RE = new RegExp(
  String.raw`(?:^|[\s"'` + "`" + String.raw`{(,])((?:[a-z0-9-]+:|\[[^\]]+\]:)*!?-?` + UTILITY + String.raw`-th-([a-z0-9-]+?)(?:\/[\w.[\]%-]+)?)(?=$|[\s"'` + "`" + String.raw`}),;])`,
  "g"
);
var VAR_RE = /--color-th-([a-z0-9-]+)/g;
function unknownThClasses(text) {
  const out = [];
  for (const m of text.matchAll(CLASS_RE)) {
    if (!TH_COLOR_NAMES2.has(m[2])) out.push(m[1]);
  }
  for (const m of text.matchAll(VAR_RE)) {
    if (!TH_COLOR_NAMES2.has(m[1])) out.push(m[0]);
  }
  return out;
}

// src/node/th-check.ts
var EXTENSIONS = /* @__PURE__ */ new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".html", ".css", ".vue", ".svelte"]);
var SKIP_DIRS = /* @__PURE__ */ new Set(["node_modules", "dist", "site-dist", ".git", "coverage"]);
var SKIP_FILE = /[.]test[.][a-z]+$/;
function collect(path, out) {
  let isDir;
  try {
    isDir = statSync(path).isDirectory();
  } catch {
    return;
  }
  if (isDir) {
    for (const name of readdirSync(path)) {
      if (!SKIP_DIRS.has(name)) collect(join(path, name), out);
    }
  } else if (EXTENSIONS.has(extname(path)) && !SKIP_FILE.test(path)) {
    out.push(path);
  }
}
function scan(files) {
  const found = [];
  for (const file of files) {
    readFileSync(file, "utf8").split(/\r?\n/).forEach((text, i) => {
      for (const cls of unknownThClasses(text)) found.push({ file, line: i + 1, cls });
    });
  }
  return found;
}
function checkFiles(paths) {
  const files = [];
  for (const p of paths) collect(p, files);
  return scan(files);
}
function main() {
  const args = process.argv.slice(2);
  const files = [];
  for (const p of args.length ? args : ["src"]) collect(p, files);
  const found = scan(files);
  for (const f of found) console.log(`${f.file.split("\\").join("/")}:${f.line}: unknown theme class ${f.cls}`);
  if (found.length) process.exit(1);
  console.log(`th-check: ${files.length} files, no unknown th-* classes`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
export {
  checkFiles
};
