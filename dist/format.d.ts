interface MoneyOptions {
    /** 'auto' (default) shows cents when |v| < 1000 or v has cents; 'always'; 'never'. */
    cents?: 'auto' | 'always' | 'never';
    /** Short form: $12.3k, $4.5M. */
    compact?: boolean;
    /** ISO 4217 code. Default USD. */
    currency?: string;
}
/** Money: 1234.56 → "$1,234.56"; negatives use a true minus sign. */
declare function money(v: number | null | undefined, o?: MoneyOptions): string;
/** Signed money: "+$12.30", "−$4.00", and "No change" when |v| < 0.005. */
declare function signedMoney(v: number | null | undefined, o?: MoneyOptions): string;
interface PctOptions {
    /** Fraction digits. Default 1. */
    digits?: number;
    /** True (default): the value is a ratio, 0.123 → "12.3%". False: it is already a percent. */
    fromRatio?: boolean;
    /** Always show + or −. */
    signed?: boolean;
}
/** Percent: 0.123 → "12.3%". */
declare function pct(v: number | null | undefined, o?: PctOptions): string;
interface NumOptions {
    /** Fixed fraction digits. Default: up to 2, trailing zeros trimmed (1 when compact). */
    digits?: number;
    /** Short form: 12.3k, 4.5M. */
    compact?: boolean;
}
/** A plain number with thousands separators: 1234.5 → "1,234.5". */
declare function num(v: number | null | undefined, o?: NumOptions): string;
/** A number with an explicit sign: "+1.20", "−0.40". Digits default 2. */
declare function signed(v: number | null | undefined, o?: {
    digits?: number;
}): string;
/** File sizes in 1024 steps: 1258291 → "1.2 MB". */
declare function bytes(v: number | null | undefined): string;
/** A length of time from seconds, two largest units: 24000 → "6h 40m" (long: "6 hours 40 minutes"). */
declare function duration(seconds: number | null | undefined, o?: {
    style?: 'short' | 'long';
}): string;
type DateInput = Date | number | string;
/** How long ago (or from now): "just now", "3m ago", "in 2h". Long style: "3 minutes ago". */
declare function ago(t: DateInput | null | undefined, o?: {
    now?: number;
    style?: 'short' | 'long';
}): string;
/** A calendar date: 'short' "Oct 28", 'medium' "Oct 28, 2026", 'long' "Wednesday, October 28, 2026", 'weekday' "Wed 10/28". */
declare function date(t: DateInput | null | undefined, style?: 'short' | 'medium' | 'long' | 'weekday'): string;
/** Time of day: "7:42 AM". Pass timeZone for a zone other than the viewer's. */
declare function time(t: DateInput | null | undefined, o?: {
    timeZone?: string;
}): string;
/** Date and time: "Oct 28, 7:42 AM". */
declare function dateTime(t: DateInput | null | undefined): string;
/** A span of days: "Dec 12 – 16", "Dec 30 – Jan 2", "Dec 30, 2026 – Jan 2, 2027". */
declare function dateRange(a: DateInput | null | undefined, b: DateInput | null | undefined): string;

export { ago, bytes, date, dateRange, dateTime, duration, money, num, pct, signed, signedMoney, time };
export type { MoneyOptions, NumOptions, PctOptions };
