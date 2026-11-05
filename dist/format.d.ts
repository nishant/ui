/** Sets the locale every formatter uses when it is not given one. Default 'en-US'. */
declare function setDefaultLocale(locale: string): void;
/** The locale formatters use when not given one. */
declare function getDefaultLocale(): string;
/** Options every formatter accepts. */
interface LocaleOptions {
    /** BCP 47 tag, e.g. 'de-DE'. Default getDefaultLocale() ('en-US'). */
    locale?: string;
}
/** Options for the date formatters. */
interface DateOptions extends LocaleOptions {
    /** IANA zone such as 'UTC'. Default the viewer's zone. A bare YYYY-MM-DD string is a calendar day and ignores it. */
    timeZone?: string;
}
interface MoneyOptions extends LocaleOptions {
    /** 'auto' (default) shows cents when |v| < 1000 or v has cents; 'always'; 'never'. */
    cents?: 'auto' | 'always' | 'never';
    /** Short form: $12.3k, $4.5M. */
    compact?: boolean;
    /** ISO 4217 code. Default USD. */
    currency?: string;
}
/** Money: 1234.56 → "$1,234.56"; negatives use a true minus sign. The symbol always comes first. */
declare function money(v: number | null | undefined, o?: MoneyOptions): string;
/** Signed money: "+$12.30", "−$4.00", and "No change" when |v| < 0.005. */
declare function signedMoney(v: number | null | undefined, o?: MoneyOptions): string;
interface PctOptions extends LocaleOptions {
    /** Fraction digits. Default 1. */
    digits?: number;
    /** True (default): the value is a ratio, 0.123 → "12.3%". False: it is already a percent. */
    fromRatio?: boolean;
    /** Always show + or −. */
    signed?: boolean;
}
/** Percent: 0.123 → "12.3%". */
declare function pct(v: number | null | undefined, o?: PctOptions): string;
interface NumOptions extends LocaleOptions {
    /** Fixed fraction digits. Default: up to 2, trailing zeros trimmed (1 when compact). */
    digits?: number;
    /** Short form: 12.3k, 4.5M. */
    compact?: boolean;
}
/** A plain number with thousands separators: 1234.5 → "1,234.5". */
declare function num(v: number | null | undefined, o?: NumOptions): string;
/** A number with an explicit sign: "+1.20", "−0.40". Digits default 2. */
declare function signed(v: number | null | undefined, o?: LocaleOptions & {
    digits?: number;
}): string;
/** File sizes in 1024 steps: 1258291 → "1.2 MB". */
declare function bytes(v: number | null | undefined, o?: LocaleOptions): string;
/** A length of time from seconds, two largest units: 24000 → "6h 40m" (long: "6 hours 40 minutes"). */
declare function duration(seconds: number | null | undefined, o?: LocaleOptions & {
    style?: 'short' | 'long';
}): string;
type DateInput = Date | number | string;
interface AgoOptions extends LocaleOptions {
    now?: number;
    style?: 'short' | 'long';
}
/** How long ago (or from now): "just now", "3m ago", "in 2h". Long style: "3 minutes ago". Other languages use Intl.RelativeTimeFormat. */
declare function ago(t: DateInput | null | undefined, o?: AgoOptions): string;
type DateStyle = 'short' | 'medium' | 'long' | 'weekday';
/** A calendar date: 'short' "Oct 28", 'medium' "Oct 28, 2026", 'long' "Wednesday, October 28, 2026", 'weekday' "Wed 10/28". */
declare function date(t: DateInput | null | undefined, style?: DateStyle, o?: DateOptions): string;
/** Time of day: "7:42 AM". Pass timeZone for a zone other than the viewer's. */
declare function time(t: DateInput | null | undefined, o?: DateOptions): string;
/** Date and time: "Oct 28, 7:42 AM". */
declare function dateTime(t: DateInput | null | undefined, o?: DateOptions): string;
/** A span of days: "Dec 12 – 16", "Dec 30 – Jan 2", "Dec 30, 2026 – Jan 2, 2027". */
declare function dateRange(a: DateInput | null | undefined, b: DateInput | null | undefined, o?: DateOptions): string;

export { ago, bytes, date, dateRange, dateTime, duration, getDefaultLocale, money, num, pct, setDefaultLocale, signed, signedMoney, time };
export type { AgoOptions, DateOptions, LocaleOptions, MoneyOptions, NumOptions, PctOptions };
