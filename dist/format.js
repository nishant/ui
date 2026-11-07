// src/runtime.ts
var version = true ? "2.1.1" : "dev";
var KEY = /* @__PURE__ */ Symbol.for("nish-ui.runtime.v1");
function runtime() {
  const g = globalThis;
  return g[KEY] ??= { versions: /* @__PURE__ */ new Set(), slots: {} };
}
function register(rt) {
  rt.versions.add(version);
  if (rt.versions.size > 1 && !rt.warned && globalThis.process?.env?.NODE_ENV !== "production") {
    rt.warned = true;
    console.warn(
      `nish-ui: two versions are loaded on this page (${[...rt.versions].join(", ")}). Overlays, toasts and theme state are shared, but mixing versions is unsupported.`
    );
  }
}
var registered = false;
function shared(key, init) {
  const rt = runtime();
  if (!registered) {
    registered = true;
    register(rt);
  }
  if (!(key in rt.slots)) rt.slots[key] = init();
  return rt.slots[key];
}

// src/format.ts
var DASH = "\u2013";
var MINUS = "\u2212";
var FALLBACK_LOCALE = "en-US";
var state = /* @__PURE__ */ shared("format", () => ({ locale: FALLBACK_LOCALE }));
var validLocales = /* @__PURE__ */ new Map();
function safeLocale(locale) {
  let ok = validLocales.get(locale);
  if (ok === void 0) {
    try {
      ok = Intl.getCanonicalLocales(locale)[0] ?? FALLBACK_LOCALE;
    } catch {
      ok = FALLBACK_LOCALE;
    }
    validLocales.set(locale, ok);
  }
  return ok;
}
function setDefaultLocale(locale) {
  state.locale = safeLocale(locale);
}
function getDefaultLocale() {
  return state.locale;
}
function loc(o) {
  return o?.locale ? safeLocale(o.locale) : state.locale;
}
function isEnglish(locale) {
  return locale === "en" || locale.startsWith("en-");
}
function isUs(locale) {
  return locale === "en" || locale === "en-US";
}
var formatters = /* @__PURE__ */ new Map();
function cached(key, make) {
  let f = formatters.get(key);
  if (f === void 0) {
    f = make();
    formatters.set(key, f);
  }
  return f;
}
function nf(locale, min, max) {
  return cached(
    `n|${locale}|${min}|${max}`,
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max })
  );
}
function dtf(locale, key, options, timeZone) {
  return cached(
    `d|${locale}|${key}|${timeZone ?? ""}`,
    () => new Intl.DateTimeFormat(locale, timeZone ? { ...options, timeZone } : options)
  );
}
function finite(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function fixed(abs, min, max, locale) {
  return nf(locale, min, max).format(abs);
}
var COMPACT_UNITS = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "k"]
];
function compactAbs(abs, digits, locale) {
  for (let i = 0; i < COMPACT_UNITS.length; i++) {
    const [size, suffix] = COMPACT_UNITS[i];
    if (abs < size) continue;
    if (i > 0 && Number((abs / size).toFixed(digits)) >= 1e3) {
      const [bigger, bigSuffix] = COMPACT_UNITS[i - 1];
      return fixed(abs / bigger, 0, digits, locale) + bigSuffix;
    }
    return fixed(abs / size, 0, digits, locale) + suffix;
  }
  return fixed(abs, 0, digits, locale);
}
function isZeroAfterRounding(v, digits) {
  return Number(Math.abs(v).toFixed(digits)) === 0;
}
var symbols = /* @__PURE__ */ new Map();
function currencySymbol(currency, locale) {
  const key = `${locale}|${currency}`;
  let s = symbols.get(key);
  if (s === void 0) {
    try {
      const parts = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol"
      }).formatToParts(0);
      s = parts.find((p) => p.type === "currency")?.value ?? currency;
    } catch {
      s = currency + " ";
    }
    symbols.set(key, s);
  }
  return s;
}
function moneyAbs(abs, o, locale) {
  const symbol = currencySymbol(o.currency ?? "USD", locale);
  if (o.compact && abs >= 1e3) return symbol + compactAbs(abs, 1, locale);
  const cents = o.cents ?? "auto";
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const showCents = cents === "always" || cents === "auto" && (abs < 1e3 || hasCents);
  return symbol + (showCents ? fixed(abs, 2, 2, locale) : fixed(abs, 0, 0, locale));
}
function money(v, o = {}) {
  if (!finite(v)) return DASH;
  const text = moneyAbs(Math.abs(v), o, loc(o));
  return v < 0 && Math.round(Math.abs(v) * 100) > 0 ? MINUS + text : text;
}
function signedMoney(v, o = {}) {
  if (!finite(v)) return DASH;
  if (Math.abs(v) < 5e-3) return "No change";
  return (v < 0 ? MINUS : "+") + moneyAbs(Math.abs(v), o, loc(o));
}
function pct(v, o = {}) {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 1;
  const value = o.fromRatio ?? true ? v * 100 : v;
  const text = fixed(Math.abs(value), digits, digits, loc(o)) + "%";
  if (isZeroAfterRounding(value, digits)) return text;
  if (value < 0) return MINUS + text;
  return o.signed ? "+" + text : text;
}
function num(v, o = {}) {
  if (!finite(v)) return DASH;
  const locale = loc(o);
  const sign = v < 0 && !isZeroAfterRounding(v, o.digits ?? 2) ? MINUS : "";
  const abs = Math.abs(v);
  if (o.compact && abs >= 1e3) return sign + compactAbs(abs, o.digits ?? 1, locale);
  return sign + (o.digits === void 0 ? fixed(abs, 0, 2, locale) : fixed(abs, o.digits, o.digits, locale));
}
function signed(v, o = {}) {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 2;
  const text = fixed(Math.abs(v), digits, digits, loc(o));
  if (isZeroAfterRounding(v, digits)) return text;
  return (v < 0 ? MINUS : "+") + text;
}
var BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];
function bytes(v, o = {}) {
  if (!finite(v)) return DASH;
  const locale = loc(o);
  let abs = Math.abs(v);
  let i = 0;
  while (abs >= 1024 && i < BYTE_UNITS.length - 1) {
    abs /= 1024;
    i++;
  }
  const text = i === 0 || abs >= 100 ? fixed(abs, 0, 0, locale) : fixed(abs, 0, 1, locale);
  return (v < 0 ? MINUS : "") + text + " " + BYTE_UNITS[i];
}
var DURATION_PARTS = [
  [86400, "d", "day"],
  [3600, "h", "hour"],
  [60, "m", "minute"],
  [1, "s", "second"]
];
function unitFormat(locale, unit, long) {
  return cached(
    `u|${locale}|${unit}|${long}`,
    () => new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: long ? "long" : "narrow" })
  );
}
function duration(seconds, o = {}) {
  if (!finite(seconds)) return DASH;
  const locale = loc(o);
  const english = isEnglish(locale);
  const long = o.style === "long";
  let rest = Math.round(Math.abs(seconds));
  const sign = seconds < 0 && rest > 0 ? MINUS : "";
  const out = [];
  for (const [size, short, name] of DURATION_PARTS) {
    const n = Math.floor(rest / size);
    rest -= n * size;
    if (n > 0 && out.length < 2) {
      if (english) out.push(long ? `${n} ${name}${n === 1 ? "" : "s"}` : `${n}${short}`);
      else out.push(unitFormat(locale, name, long).format(n));
    }
  }
  if (!out.length) {
    if (english) return long ? "0 seconds" : "0s";
    return unitFormat(locale, "second", long).format(0);
  }
  return sign + out.join(" ");
}
var DAY_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
function toMoment(t) {
  if (t === null || t === void 0) return null;
  let d;
  let dayOnly = false;
  if (t instanceof Date) d = t;
  else if (typeof t === "number") d = new Date(t);
  else {
    const m = DAY_ONLY.exec(t.trim());
    dayOnly = !!m;
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
  }
  return Number.isNaN(d.getTime()) ? null : { d, dayOnly };
}
function zone(m, o) {
  return m.dayOnly ? void 0 : o.timeZone;
}
function norm(s) {
  return s.replace(/[\u202f\u00a0]/g, " ");
}
var AGO_UNITS = [
  [60, "minute", "m"],
  [3600, "hour", "h"],
  [86400, "day", "d"],
  [86400 * 30, "month", "mo"],
  [86400 * 365, "year", "y"]
];
function rtf(locale, style) {
  return cached(`r|${locale}|${style}`, () => new Intl.RelativeTimeFormat(locale, { numeric: "auto", style }));
}
function ago(t, o = {}) {
  const m = toMoment(t);
  if (!m) return DASH;
  const locale = loc(o);
  const english = isEnglish(locale);
  const long = o.style === "long";
  const diff = Math.round((m.d.getTime() - (o.now ?? Date.now())) / 1e3);
  const abs = Math.abs(diff);
  if (abs < 45) return english ? "just now" : rtf(locale, long ? "long" : "narrow").format(0, "second");
  let pick = AGO_UNITS[0];
  for (const u of AGO_UNITS) if (abs >= u[0]) pick = u;
  const n = Math.max(1, Math.round(abs / pick[0]));
  const past = diff < 0;
  if (!english) return rtf(locale, long ? "long" : "narrow").format(past ? -n : n, pick[1]);
  if (long) return rtf(locale, "long").format(past ? -n : n, pick[1]);
  return past ? `${n}${pick[2]} ago` : `in ${n}${pick[2]}`;
}
var MEDIUM = { month: "short", day: "numeric", year: "numeric" };
var LONG = { weekday: "long", month: "long", day: "numeric", year: "numeric" };
var SHORT = { month: "short", day: "numeric" };
var WEEKDAY = { weekday: "short" };
var NUMERIC_MD = { month: "numeric", day: "numeric" };
var TIME = { hour: "numeric", minute: "2-digit" };
var TIME_12 = { hour: "numeric", minute: "2-digit", hour12: true };
var YMD = { year: "numeric", month: "numeric", day: "numeric" };
function ymd(d, timeZone) {
  if (!timeZone) return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  const out = { year: 0, month: 0, day: 0 };
  for (const p of dtf("en-US", "ymd", YMD, timeZone).formatToParts(d)) {
    if (p.type === "year" || p.type === "month" || p.type === "day") out[p.type] = Number(p.value);
  }
  return out;
}
function dateOf(m, style, o, locale) {
  const tz = zone(m, o);
  switch (style) {
    case "medium":
      return norm(dtf(locale, "medium", MEDIUM, tz).format(m.d));
    case "long":
      return norm(dtf(locale, "long", LONG, tz).format(m.d));
    case "weekday": {
      const wd = dtf(locale, "weekday", WEEKDAY, tz).format(m.d);
      if (!isUs(locale)) return `${wd} ${dtf(locale, "md", NUMERIC_MD, tz).format(m.d)}`;
      const p = ymd(m.d, tz);
      return `${wd} ${p.month}/${p.day}`;
    }
    default:
      return norm(dtf(locale, "short", SHORT, tz).format(m.d));
  }
}
function date(t, style = "short", o = {}) {
  const m = toMoment(t);
  if (!m) return DASH;
  return dateOf(m, style, o, loc(o));
}
function timeOf(m, o, locale) {
  const us = isUs(locale);
  return norm(dtf(locale, us ? "time12" : "time", us ? TIME_12 : TIME, zone(m, o)).format(m.d));
}
function time(t, o = {}) {
  const m = toMoment(t);
  if (!m) return DASH;
  return timeOf(m, o, loc(o));
}
function dateTime(t, o = {}) {
  const m = toMoment(t);
  if (!m) return DASH;
  const locale = loc(o);
  return `${dateOf(m, "short", o, locale)}, ${timeOf(m, o, locale)}`;
}
function dateRange(a, b, o = {}) {
  const from = toMoment(a);
  const to = toMoment(b);
  if (!from || !to) return DASH;
  const locale = loc(o);
  const f = ymd(from.d, zone(from, o));
  const t = ymd(to.d, zone(to, o));
  if (f.year !== t.year) return `${dateOf(from, "medium", o, locale)} \u2013 ${dateOf(to, "medium", o, locale)}`;
  if (f.month === t.month) {
    if (f.day === t.day) return dateOf(from, "short", o, locale);
    return `${dateOf(from, "short", o, locale)} \u2013 ${dtf(locale, "day", { day: "numeric" }, zone(to, o)).format(to.d)}`;
  }
  return `${dateOf(from, "short", o, locale)} \u2013 ${dateOf(to, "short", o, locale)}`;
}
export {
  ago,
  bytes,
  date,
  dateRange,
  dateTime,
  duration,
  getDefaultLocale,
  money,
  num,
  pct,
  setDefaultLocale,
  signed,
  signedMoney,
  time
};
//# sourceMappingURL=format.js.map