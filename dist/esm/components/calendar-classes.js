// src/components/calendar-classes.ts
var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
var MONTH_RE = /^(\d{4})-(\d{2})$/;
function pad(n, width) {
  let s = String(n);
  while (s.length < width) s = "0" + s;
  return s;
}
function utcDate(y, m, d) {
  const t = /* @__PURE__ */ new Date(0);
  t.setUTCFullYear(y, m - 1, d);
  return t;
}
function fromDate(t) {
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
function daysInMonth(y, m) {
  return utcDate(y, m + 1, 0).getUTCDate();
}
function parseIso(s) {
  if (typeof s !== "string") return null;
  const match = ISO_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}
function toIso(p) {
  return `${pad(p.y, 4)}-${pad(p.m, 2)}-${pad(p.d, 2)}`;
}
function parseMonth(s) {
  if (typeof s !== "string") return null;
  const match = MONTH_RE.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (y < 1 || m < 1 || m > 12) return null;
  return { y, m };
}
function monthOf(iso) {
  return iso.slice(0, 7);
}
function firstOfMonth(month) {
  return `${month}-01`;
}
function dateOf(iso) {
  const p = parseIso(iso);
  return p ? utcDate(p.y, p.m, p.d) : /* @__PURE__ */ new Date(NaN);
}
function addDays(iso, n) {
  const p = parseIso(iso);
  if (!p) return iso;
  const t = utcDate(p.y, p.m, p.d);
  t.setUTCDate(t.getUTCDate() + n);
  const q = fromDate(t);
  if (q.y > 9999) return "9999-12-31";
  if (q.y < 1) return "0001-01-01";
  return toIso(q);
}
function addMonthsYmd(p, n) {
  const total = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = total - y * 12 + 1;
  if (y > 9999) return { y: 9999, m: 12, d: p.d };
  if (y < 1) return { y: 1, m: 1, d: p.d };
  return { y, m, d: Math.min(p.d, daysInMonth(y, m)) };
}
function addMonths(iso, n) {
  const p = parseIso(iso);
  return p ? toIso(addMonthsYmd(p, n)) : iso;
}
function addYears(iso, n) {
  return addMonths(iso, n * 12);
}
function shiftMonth(month, n) {
  const p = parseMonth(month);
  if (!p) return month;
  const q = addMonthsYmd({ y: p.y, m: p.m, d: 1 }, n);
  return `${pad(q.y, 4)}-${pad(q.m, 2)}`;
}
function weekday(iso) {
  return dateOf(iso).getUTCDay();
}
function startOfWeek(iso, weekStartsOn) {
  return addDays(iso, -((weekday(iso) - weekStartsOn + 7) % 7));
}
function endOfWeek(iso, weekStartsOn) {
  return addDays(startOfWeek(iso, weekStartsOn), 6);
}
function clampIso(iso, min, max) {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}
function inRange(iso, min, max) {
  if (min && iso < min) return false;
  if (max && iso > max) return false;
  return true;
}
function monthGrid(month, weekStartsOn) {
  const p = parseMonth(month);
  const rows = [];
  const count = p ? daysInMonth(p.y, p.m) : 0;
  const lead = p ? (weekday(firstOfMonth(month)) - weekStartsOn + 7) % 7 : 0;
  let day = 1 - lead;
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 7; c++) {
      row.push(p && day >= 1 && day <= count ? `${month}-${pad(day, 2)}` : null);
      day++;
    }
    rows.push(row);
  }
  return rows;
}
function calendarKeyTarget(key, shiftKey, from, weekStartsOn, rtl) {
  switch (key) {
    case "ArrowRight":
      return addDays(from, rtl ? -1 : 1);
    case "ArrowLeft":
      return addDays(from, rtl ? 1 : -1);
    case "ArrowDown":
      return addDays(from, 7);
    case "ArrowUp":
      return addDays(from, -7);
    case "Home":
      return startOfWeek(from, weekStartsOn);
    case "End":
      return endOfWeek(from, weekStartsOn);
    case "PageUp":
      return shiftKey ? addYears(from, -1) : addMonths(from, -1);
    case "PageDown":
      return shiftKey ? addYears(from, 1) : addMonths(from, 1);
    default:
      return null;
  }
}
function isoToday(now = /* @__PURE__ */ new Date()) {
  return toIso({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}
var resolved = /* @__PURE__ */ new Map();
function resolveLocale(locale) {
  if (!locale) return "en-US";
  const hit = resolved.get(locale);
  if (hit) return hit;
  let out = "en-US";
  try {
    out = Intl.getCanonicalLocales(locale)[0] ?? "en-US";
  } catch {
    out = "en-US";
  }
  resolved.set(locale, out);
  return out;
}
var SUNDAY_FIRST = new Set(
  "AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW".split(
    " "
  )
);
var SATURDAY_FIRST = new Set("AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "));
var weekStarts = /* @__PURE__ */ new Map();
function weekStartFor(locale) {
  const hit = weekStarts.get(locale);
  if (hit !== void 0) return hit;
  const v = computeWeekStart(locale);
  weekStarts.set(locale, v);
  return v;
}
function computeWeekStart(locale) {
  let region = "US";
  try {
    region = new Intl.Locale(resolveLocale(locale)).maximize().region ?? "US";
  } catch {
    region = "US";
  }
  if (SUNDAY_FIRST.has(region)) return 0;
  if (SATURDAY_FIRST.has(region)) return 6;
  return 1;
}
var formatters = /* @__PURE__ */ new Map();
function formatter(locale, options) {
  const opts = { ...options, timeZone: "UTC", calendar: "gregory" };
  const key = `${locale}|${JSON.stringify(opts)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    formatters.set(key, f);
  }
  return f;
}
var BIDI_MARKS_RE = /[‎‏؜]/g;
var fieldParts = /* @__PURE__ */ new Map();
function dateFieldParts(locale) {
  const cached = fieldParts.get(locale);
  if (cached) return cached;
  const parts = formatter(locale, { year: "numeric", month: "2-digit", day: "2-digit", numberingSystem: "latn" }).formatToParts(utcDate(2026, 12, 31)).map((p) => {
    if (p.type === "day" || p.type === "month" || p.type === "year") return { type: p.type, value: p.value };
    return { type: "literal", value: p.value.replace(BIDI_MARKS_RE, "") };
  });
  fieldParts.set(locale, parts);
  return parts;
}
function formatDateField(iso, locale) {
  const p = parseIso(iso);
  if (!p) return "";
  return dateFieldParts(locale).map((part) => {
    if (part.type === "year") return String(p.y).padStart(4, "0");
    if (part.type === "month") return String(p.m).padStart(2, "0");
    if (part.type === "day") return String(p.d).padStart(2, "0");
    return part.value;
  }).join("");
}
var FIELD_JUNK_RE = /[^\d\s/.,-]/;
var ISO_FIELD_RE = /^\d{4}-\d{2}-\d{2}$/;
var DIGITS_RE = /\d+/g;
function parseDateField(text, locale) {
  const t = text.replace(BIDI_MARKS_RE, "").trim();
  if (t === "") return null;
  if (FIELD_JUNK_RE.test(t)) return null;
  if (ISO_FIELD_RE.test(t)) {
    const p = parseIso(t);
    return p ? toIso(p) : null;
  }
  const order = dateFieldParts(locale).map((p) => p.type).filter((type) => type !== "literal");
  const groups = t.match(DIGITS_RE);
  if (!groups) return null;
  let raw;
  if (groups.length === 3) {
    raw = groups;
  } else if (groups.length === 1 && groups[0].length === 8) {
    const digits = groups[0];
    raw = [];
    let at = 0;
    for (const type of order) {
      const width = type === "year" ? 4 : 2;
      raw.push(digits.slice(at, at + width));
      at += width;
    }
  } else {
    return null;
  }
  if (order.length !== 3) return null;
  const found = { day: "", month: "", year: "" };
  order.forEach((type, i) => {
    found[type] = raw[i];
  });
  let y = Number(found.year);
  if (found.year.length === 3 || found.year.length > 4) return null;
  if (found.year.length <= 2) y = 2e3 + y;
  const m = Number(found.month);
  const d = Number(found.day);
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return toIso({ y, m, d });
}
function datePlaceholder(locale, tokens) {
  return dateFieldParts(locale).map((p) => p.type === "literal" ? p.value : tokens[p.type]).join("");
}
function monthTitle(month, locale) {
  const p = parseMonth(month);
  if (!p) return "";
  return formatter(locale, { month: "long", year: "numeric" }).format(utcDate(p.y, p.m, 1));
}
function monthNames(locale) {
  const f = formatter(locale, { month: "long" });
  const names = [];
  for (let m = 1; m <= 12; m++) names.push(f.format(utcDate(2026, m, 1)));
  return names;
}
function weekdayNames(locale, weekStartsOn) {
  const short = formatter(locale, { weekday: "short" });
  const long = formatter(locale, { weekday: "long" });
  const narrow = formatter(locale, { weekday: "narrow" });
  const days = [];
  for (let i = 0; i < 7; i++) days.push(utcDate(2026, 11, 1 + (weekStartsOn + i) % 7));
  const shorts = days.map((t) => short.format(t));
  const useNarrow = shorts.some((n) => n.length > 4);
  return days.map((t, i) => ({
    short: useNarrow ? narrow.format(t) : shorts[i],
    long: long.format(t)
  }));
}
function dayNumber(iso, locale) {
  const p = parseIso(iso);
  return p ? formatter(locale, { day: "numeric" }).format(utcDate(p.y, p.m, p.d)) : "";
}
function fullDate(iso, locale) {
  const p = parseIso(iso);
  if (!p) return "";
  return formatter(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(
    utcDate(p.y, p.m, p.d)
  );
}
export {
  addDays,
  addMonths,
  addYears,
  calendarKeyTarget,
  clampIso,
  dateFieldParts,
  datePlaceholder,
  dayNumber,
  daysInMonth,
  endOfWeek,
  firstOfMonth,
  formatDateField,
  fullDate,
  inRange,
  isoToday,
  monthGrid,
  monthNames,
  monthOf,
  monthTitle,
  parseDateField,
  parseIso,
  parseMonth,
  resolveLocale,
  shiftMonth,
  startOfWeek,
  toIso,
  weekStartFor,
  weekday,
  weekdayNames
};
