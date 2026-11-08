'use client';
import { useState } from 'react';
import { monthOf } from './calendar-classes';
import { CalendarBase, checkIso, type CalendarSharedProps } from './calendar-base';

export type { WeekDay } from './calendar-classes';

export interface CalendarProps extends CalendarSharedProps {
  /** The picked day as YYYY-MM-DD (controlled), or null for none. */
  value?: string | null;
  /** The first picked day of an uncontrolled calendar. */
  defaultValue?: string | null;
  /** Called with the day the reader picks (YYYY-MM-DD). */
  onValueChange?: (value: string) => void;
}

/** A month grid that picks one day. Arrow keys move by day and week, Page Up and Page Down by
 *  month (with Shift, by year), Home and End to the ends of the week. Values are YYYY-MM-DD
 *  strings, the same as `<input type="date">`. */
export function Calendar({ value, defaultValue, onValueChange, ...rest }: CalendarProps) {
  const valueIso = checkIso('Calendar', 'value', value);
  const defaultIso = checkIso('Calendar', 'defaultValue', defaultValue);
  const controlled = value !== undefined;
  const [own, setOwn] = useState<string | null>(defaultIso);
  const selected = controlled ? valueIso : own;
  return (
    <CalendarBase
      {...rest}
      componentName="Calendar"
      initialMonth={selected ? monthOf(selected) : null}
      focusPreference={selected}
      dayLook={(iso) => ({ filled: iso === selected, band: null, ariaSelected: iso === selected })}
      onPick={(iso) => {
        if (!controlled) setOwn(iso);
        onValueChange?.(iso);
      }}
    />
  );
}
