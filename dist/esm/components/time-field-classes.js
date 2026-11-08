// src/components/time-field-classes.ts
var TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
var DIGITS_RE = /^\d{1,2}$/;
var pad2 = (n) => String(n).padStart(2, "0");
function parseTime(s) {
  if (typeof s !== "string") return null;
  const x = TIME_RE.exec(s);
  return x ? { h: Number(x[1]), m: Number(x[2]) } : null;
}
function toTime(h, m) {
  return `${pad2(h)}:${pad2(m)}`;
}
function inTimeRange(t, min, max) {
  if (parseTime(min) && t < min) return false;
  if (parseTime(max) && t > max) return false;
  return true;
}
var cycles = /* @__PURE__ */ new Map();
function hourCycleFor(locale) {
  const hit = cycles.get(locale);
  if (hit) return hit;
  let c = 24;
  try {
    const o = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).resolvedOptions();
    const twelve = o.hourCycle ? o.hourCycle === "h11" || o.hourCycle === "h12" : o.hour12 === true;
    c = twelve ? 12 : 24;
  } catch {
    c = 24;
  }
  cycles.set(locale, c);
  return c;
}
var periods = /* @__PURE__ */ new Map();
function dayPeriodNames(locale) {
  const hit = periods.get(locale);
  if (hit) return hit;
  let r = ["AM", "PM"];
  try {
    const f = new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true, timeZone: "UTC" });
    const word = (h) => f.formatToParts(new Date(Date.UTC(2026, 0, 1, h))).find((p) => p.type === "dayPeriod")?.value;
    r = [word(1) || "AM", word(13) || "PM"];
  } catch {
    r = ["AM", "PM"];
  }
  periods.set(locale, r);
  return r;
}
function to12(h) {
  return { hour: h % 12 === 0 ? 12 : h % 12, pm: h >= 12 };
}
function from12(hour, pm) {
  return hour % 12 + (pm ? 12 : 0);
}
function normalizeStep(step) {
  return Number.isFinite(step) ? Math.min(60, Math.max(1, Math.floor(step))) : 1;
}
function lastMinute(step) {
  return Math.floor(59 / step) * step;
}
function stepHour(h, dir) {
  return h === null ? dir > 0 ? 0 : 23 : (h + dir + 24) % 24;
}
function stepMinute(m, dir, step) {
  if (m === null) return dir > 0 ? 0 : lastMinute(step);
  if (dir > 0) {
    const n2 = (Math.floor(m / step) + 1) * step;
    return n2 > 59 ? 0 : n2;
  }
  const n = Math.ceil(m / step) * step - step;
  return n < 0 ? lastMinute(step) : n;
}
function hourText(h, cycle) {
  return cycle === 24 ? pad2(h) : String(to12(h).hour);
}
function draftFromTime(t, cycle) {
  const p = parseTime(t);
  if (!p) return { h: "", m: "", pm: false };
  return { h: hourText(p.h, cycle), m: pad2(p.m), pm: p.h >= 12 };
}
function draftTime(d, cycle) {
  if (d.h === "" && d.m === "") return null;
  if (d.h === "" || d.m === "") return void 0;
  if (!DIGITS_RE.test(d.h) || !DIGITS_RE.test(d.m)) return void 0;
  const hn = Number(d.h);
  const mn = Number(d.m);
  if (cycle === 24 ? hn > 23 : hn < 1 || hn > 12) return void 0;
  if (mn > 59) return void 0;
  return toTime(cycle === 12 ? from12(hn, d.pm) : hn, mn);
}
function hourAdvances(text, cycle) {
  const max = cycle === 24 ? 23 : 12;
  return text.length >= 2 || text.length === 1 && Number(text) * 10 > max;
}
export {
  dayPeriodNames,
  draftFromTime,
  draftTime,
  from12,
  hourAdvances,
  hourCycleFor,
  hourText,
  inTimeRange,
  lastMinute,
  normalizeStep,
  parseTime,
  stepHour,
  stepMinute,
  to12,
  toTime
};
