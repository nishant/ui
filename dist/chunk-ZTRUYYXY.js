// src/format.ts
var DASH = "\u2013";
var MINUS = "\u2212";
function finite(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function fixed(abs, min, max) {
  return abs.toLocaleString("en-US", { minimumFractionDigits: min, maximumFractionDigits: max });
}
var COMPACT_UNITS = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "k"]
];
function compactAbs(abs, digits) {
  for (let i = 0; i < COMPACT_UNITS.length; i++) {
    const [size, suffix] = COMPACT_UNITS[i];
    if (abs < size) continue;
    if (i > 0 && Number((abs / size).toFixed(digits)) >= 1e3) {
      const [bigger, bigSuffix] = COMPACT_UNITS[i - 1];
      return fixed(abs / bigger, 0, digits) + bigSuffix;
    }
    return fixed(abs / size, 0, digits) + suffix;
  }
  return fixed(abs, 0, digits);
}
function isZeroAfterRounding(v, digits) {
  return Number(Math.abs(v).toFixed(digits)) === 0;
}
function currencySymbol(currency) {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol"
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency + " ";
  }
}
function moneyAbs(abs, o) {
  const symbol = currencySymbol(o.currency ?? "USD");
  if (o.compact && abs >= 1e3) return symbol + compactAbs(abs, 1);
  const cents = o.cents ?? "auto";
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const showCents = cents === "always" || cents === "auto" && (abs < 1e3 || hasCents);
  return symbol + (showCents ? fixed(abs, 2, 2) : fixed(abs, 0, 0));
}
function money(v, o = {}) {
  if (!finite(v)) return DASH;
  const text = moneyAbs(Math.abs(v), o);
  return v < 0 && Math.round(Math.abs(v) * 100) > 0 ? MINUS + text : text;
}
function signedMoney(v, o = {}) {
  if (!finite(v)) return DASH;
  if (Math.abs(v) < 5e-3) return "No change";
  return (v < 0 ? MINUS : "+") + moneyAbs(Math.abs(v), o);
}
function pct(v, o = {}) {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 1;
  const value = o.fromRatio ?? true ? v * 100 : v;
  const text = fixed(Math.abs(value), digits, digits) + "%";
  if (isZeroAfterRounding(value, digits)) return text;
  if (value < 0) return MINUS + text;
  return o.signed ? "+" + text : text;
}
function num(v, o = {}) {
  if (!finite(v)) return DASH;
  const sign = v < 0 && !isZeroAfterRounding(v, o.digits ?? 2) ? MINUS : "";
  const abs = Math.abs(v);
  if (o.compact && abs >= 1e3) return sign + compactAbs(abs, o.digits ?? 1);
  return sign + (o.digits === void 0 ? fixed(abs, 0, 2) : fixed(abs, o.digits, o.digits));
}
function signed(v, o = {}) {
  if (!finite(v)) return DASH;
  const digits = o.digits ?? 2;
  const text = fixed(Math.abs(v), digits, digits);
  if (isZeroAfterRounding(v, digits)) return text;
  return (v < 0 ? MINUS : "+") + text;
}
var BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];
function bytes(v) {
  if (!finite(v)) return DASH;
  let abs = Math.abs(v);
  let i = 0;
  while (abs >= 1024 && i < BYTE_UNITS.length - 1) {
    abs /= 1024;
    i++;
  }
  const text = i === 0 || abs >= 100 ? fixed(abs, 0, 0) : fixed(abs, 0, 1);
  return (v < 0 ? MINUS : "") + text + " " + BYTE_UNITS[i];
}
function duration(seconds, o = {}) {
  if (!finite(seconds)) return DASH;
  const long = o.style === "long";
  let rest = Math.round(Math.abs(seconds));
  const sign = seconds < 0 && rest > 0 ? MINUS : "";
  const parts = [
    [86400, "d", "day"],
    [3600, "h", "hour"],
    [60, "m", "minute"],
    [1, "s", "second"]
  ];
  const out = [];
  for (const [size, short, name] of parts) {
    const n = Math.floor(rest / size);
    rest -= n * size;
    if (n > 0 && out.length < 2) out.push(long ? `${n} ${name}${n === 1 ? "" : "s"}` : `${n}${short}`);
  }
  if (!out.length) return long ? "0 seconds" : "0s";
  return sign + out.join(" ");
}
function toDate(t) {
  if (t === null || t === void 0) return null;
  let d;
  if (t instanceof Date) d = t;
  else if (typeof t === "number") d = new Date(t);
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim());
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
  }
  return Number.isNaN(d.getTime()) ? null : d;
}
var rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
function ago(t, o = {}) {
  const d = toDate(t);
  if (!d) return DASH;
  const diff = Math.round((d.getTime() - (o.now ?? Date.now())) / 1e3);
  const abs = Math.abs(diff);
  if (abs < 45) return "just now";
  const units = [
    [60, "minute", "m"],
    [3600, "hour", "h"],
    [86400, "day", "d"],
    [86400 * 30, "month", "mo"],
    [86400 * 365, "year", "y"]
  ];
  let pick = units[0];
  for (const u of units) if (abs >= u[0]) pick = u;
  const n = Math.max(1, Math.round(abs / pick[0]));
  const past = diff < 0;
  if (o.style === "long") return rtf.format(past ? -n : n, pick[1]);
  return past ? `${n}${pick[2]} ago` : `in ${n}${pick[2]}`;
}
function norm(s) {
  return s.replace(/[  ]/g, " ");
}
function date(t, style = "short") {
  const d = toDate(t);
  if (!d) return DASH;
  switch (style) {
    case "medium":
      return norm(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    case "long":
      return norm(d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    case "weekday":
      return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getMonth() + 1}/${d.getDate()}`;
    default:
      return norm(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
}
function time(t, o = {}) {
  const d = toDate(t);
  if (!d) return DASH;
  return norm(
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: o.timeZone })
  );
}
function dateTime(t) {
  const d = toDate(t);
  if (!d) return DASH;
  return `${date(d, "short")}, ${time(d)}`;
}
function dateRange(a, b) {
  const from = toDate(a);
  const to = toDate(b);
  if (!from || !to) return DASH;
  if (from.getFullYear() !== to.getFullYear()) return `${date(from, "medium")} \u2013 ${date(to, "medium")}`;
  if (from.getMonth() === to.getMonth()) {
    if (from.getDate() === to.getDate()) return date(from, "short");
    return `${date(from, "short")} \u2013 ${to.getDate()}`;
  }
  return `${date(from, "short")} \u2013 ${date(to, "short")}`;
}

export {
  money,
  signedMoney,
  pct,
  num,
  signed,
  bytes,
  duration,
  ago,
  date,
  time,
  dateTime,
  dateRange
};
//# sourceMappingURL=chunk-ZTRUYYXY.js.map