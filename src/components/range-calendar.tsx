'use client';
import { useState, type KeyboardEvent } from 'react';
import { getDefaultLocale } from '../format';
import {
  firstDisabledIn,
  fullDate,
  inRange,
  monthOf,
  orderRange,
  parseIso,
  resolveLocale,
  toRange,
  type DateRange,
} from './calendar-classes';
import { CalendarBase, type CalendarDayLook, type CalendarSharedProps } from './calendar-base';
import { useStrings, useNishContext } from './provider';
import { PICKER_STRINGS } from './strings';

export type { DateRange, WeekDay } from './calendar-classes';

export interface RangeCalendarProps extends CalendarSharedProps {
  /** The picked range as { from, to } in YYYY-MM-DD (controlled), or null for none. */
  value?: DateRange | null;
  /** The first range of an uncontrolled calendar. */
  defaultValue?: DateRange | null;
  /** Called with { from, to } once the second day is picked; from is never after to. A half-picked range is not reported. */
  onValueChange?: (value: DateRange) => void;
  /** Let a range cover days isDateDisabled returns true for (weekends inside a vacation). Default false: a second press that would cover one starts a new range there. */
  allowDisabledInRange?: boolean;
}

const warned = new Set<string>();
const OUTSIDE: CalendarDayLook = { filled: false, band: null, ariaSelected: false };

function warnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === 'production' || warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function checkRange(prop: string, v: DateRange | null | undefined): DateRange | null {
  if (v == null) return null;
  const r = toRange(v);
  if (!r) {
    warnOnce(`${prop}:shape`, `RangeCalendar: "${prop}" must be { from, to } with YYYY-MM-DD days`);
    return null;
  }
  if (v.from > v.to) warnOnce(`${prop}:order`, `RangeCalendar: "${prop}" has from after to; the days were swapped`);
  return r;
}

/** A month grid that picks a range of days: the first press sets the start, the second the end, and the days
 *  between light up as the pointer or focus moves. Same keys as Calendar; Escape drops a start with no end. */
export function RangeCalendar({
  value,
  defaultValue,
  onValueChange,
  allowDisabledInRange = false,
  ...shared
}: RangeCalendarProps) {
  const strings = useStrings(PICKER_STRINGS);
  const config = useNishContext();
  const loc = resolveLocale(shared.locale ?? config.locale ?? getDefaultLocale());
  const { min: minProp, max: maxProp, isDateDisabled } = shared;
  const min = minProp != null && parseIso(minProp) ? minProp : null;
  const max = maxProp != null && parseIso(maxProp) ? maxProp : null;

  const controlled = value !== undefined;
  const [own, setOwn] = useState<DateRange | null>(() => checkRange('defaultValue', defaultValue));
  const [anchor, setAnchor] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const range = controlled ? checkRange('value', value) : own;

  const off = (iso: string): boolean => !inRange(iso, min, max) || isDateDisabled?.(iso) === true;
  const blocks = (r: DateRange): boolean =>
    !allowDisabledInRange && !!isDateDisabled && firstDisabledIn(r.from, r.to, isDateDisabled) !== null;

  let band: DateRange | null = range;
  if (anchor) {
    const target = hover ?? focusDay ?? anchor;
    const r = orderRange(anchor, target);
    band = off(target) || blocks(r) ? { from: anchor, to: anchor } : r;
  }

  const dayLook = (iso: string): CalendarDayLook => {
    if (!band || iso < band.from || iso > band.to) return OUTSIDE;
    const single = band.from === band.to;
    return {
      filled: anchor ? iso === anchor : iso === band.from || iso === band.to,
      band: single ? null : iso === band.from ? 'start' : iso === band.to ? 'end' : 'middle',
      ariaSelected: anchor ? iso === anchor : true,
      preview: !!anchor && iso !== anchor,
    };
  };

  const start = (iso: string) => {
    setAnchor(iso);
    setStatus(strings.rangeStarted(fullDate(iso, loc)));
  };

  const onPick = (iso: string) => {
    if (!anchor) {
      start(iso);
      return;
    }
    const r = orderRange(anchor, iso);
    if (blocks(r)) {
      start(iso);
      return;
    }
    setAnchor(null);
    setHover(null);
    if (!controlled) setOwn(r);
    setStatus(strings.dateRange(fullDate(r.from, loc), fullDate(r.to, loc)));
    onValueChange?.(r);
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLTableElement>) => {
    if (e.key === 'Escape' && anchor !== null) {
      e.preventDefault();
      e.stopPropagation();
      setAnchor(null);
      setHover(null);
      setStatus('');
    }
  };

  return (
    <CalendarBase
      {...shared}
      componentName="RangeCalendar"
      initialMonth={range ? monthOf(range.from) : null}
      focusPreference={anchor ?? range?.from ?? null}
      dayLook={dayLook}
      onPick={onPick}
      onDayFocus={setFocusDay}
      onDayHover={setHover}
      onGridKeyDown={onGridKeyDown}
      multiselectable
    >
      <p aria-live="polite" className="sr-only">
        {status}
      </p>
    </CalendarBase>
  );
}
