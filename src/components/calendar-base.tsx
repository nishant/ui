'use client';
import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { getDefaultLocale } from '../format';
import {
  addDays,
  calendarDayClass,
  calendarKeyTarget,
  clampIso,
  dayNumber,
  firstOfMonth,
  fullDate,
  inRange,
  isoToday,
  monthGrid,
  monthNames,
  monthOf,
  monthTitle,
  parseIso,
  parseMonth,
  resolveLocale,
  shiftMonth,
  weekStartFor,
  weekdayNames,
  type DayBand,
  type WeekDay,
} from './calendar-classes';
import { isRtl, useIsoLayoutEffect } from './client';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { IconButton, Select } from './primitives';
import { useNishContext, useStrings } from './provider';
import { PICKER_STRINGS } from './strings';

/** Props Calendar and RangeCalendar share. */
export interface CalendarSharedProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children'> {
  /** The root element. */
  ref?: Ref<HTMLDivElement>;
  /** The month shown, as YYYY-MM (controlled). Pair with onMonthChange. */
  month?: string;
  /** The first month shown when uncontrolled. Default: the value's month, else this month. */
  defaultMonth?: string;
  /** Called with YYYY-MM when the shown month changes (buttons, keys, dropdowns). */
  onMonthChange?: (month: string) => void;
  /** Earliest day that can be picked (YYYY-MM-DD). */
  min?: string;
  /** Latest day that can be picked (YYYY-MM-DD). */
  max?: string;
  /** Return true to disable a day (YYYY-MM-DD), e.g. weekends. */
  isDateDisabled?: (date: string) => boolean;
  /** BCP 47 tag for month and weekday names. Default NishProvider locale, then setDefaultLocale() (en-US). */
  locale?: string;
  /** First column: 0 Sunday to 6 Saturday. Default from the locale's region. */
  weekStartsOn?: WeekDay;
  /** 'label' (default): the month name with previous and next buttons. 'dropdowns': month and year selects as well. */
  captionLayout?: 'label' | 'dropdowns';
  /** First year in the year select. Default min's year, else this year minus 100. */
  fromYear?: number;
  /** Last year in the year select. Default max's year, else this year plus 10. */
  toYear?: number;
  /** Focus the day that has the Tab stop when the calendar mounts (DatePicker sets it). */
  autoFocus?: boolean;
  /** Accessible name of the previous-month button. Default "Previous month". */
  previousMonthLabel?: string;
  /** Accessible name of the next-month button. Default "Next month". */
  nextMonthLabel?: string;
}


/** @internal How CalendarBase draws one day. */
export interface CalendarDayLook {
  /** Accent fill. */
  filled: boolean;
  /** Where the day sits in a band of more than one day. */
  band: DayBand;
  /** The gridcell's aria-selected. */
  ariaSelected: boolean;
  /** The day is part of the preview band. */
  preview?: boolean;
}

/** @internal */
export interface CalendarBaseProps extends CalendarSharedProps {
  /** Prefix of dev warnings. */
  componentName: 'Calendar' | 'RangeCalendar';
  /** Month used when uncontrolled and no defaultMonth (read once, at mount). */
  initialMonth: string | null;
  /** The Tab stop after the focused day: Calendar's value, RangeCalendar's anchor or from. */
  focusPreference: string | null;
  /** How one day is drawn. */
  dayLook: (iso: string) => CalendarDayLook;
  /** A day was pressed (enabled days only). */
  onPick: (iso: string) => void;
  /** A day got focus. */
  onDayFocus?: (iso: string) => void;
  /** The pointer entered a day, or left the grid (null). Touch pointers are ignored. */
  onDayHover?: (iso: string | null) => void;
  /** Runs first on a grid key; the base skips its own keys when e.defaultPrevented. */
  onGridKeyDown?: (e: KeyboardEvent<HTMLTableElement>) => void;
  /** Sets aria-multiselectable on the grid. */
  multiselectable?: boolean;
  /** Rendered after the table. */
  children?: ReactNode;
}

const warned = new Set<string>();
const noopSubscribe = (): (() => void) => () => {};
const EMPTY_GRID: null[][] = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null));
const pad2 = (n: number): string => String(n).padStart(2, '0');
const pad4 = (n: number): string => String(n).padStart(4, '0');

/** @internal The dev-warning prop check: v when it is YYYY-MM-DD (or YYYY-MM), else null and one warning per component and prop. */
export function checkIso(component: string, prop: string, v: string | null | undefined, isMonth = false): string | null {
  if (v == null) return null;
  const ok = isMonth ? parseMonth(v) !== null : parseIso(v) !== null;
  if (ok) return v;
  const id = `${component}:${prop}`;
  if (process.env.NODE_ENV !== 'production' && !warned.has(id)) {
    warned.add(id);
    console.warn(`${component}: "${prop}" must be ${isMonth ? 'YYYY-MM' : 'YYYY-MM-DD'}`);
  }
  return null;
}

/** @internal The month grid Calendar and RangeCalendar share: caption, keys, focus and day cells. */
export function CalendarBase({
  componentName,
  initialMonth,
  focusPreference,
  dayLook,
  onPick,
  onDayFocus,
  onDayHover,
  onGridKeyDown,
  multiselectable,
  children,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  min: minProp,
  max: maxProp,
  isDateDisabled,
  locale,
  weekStartsOn,
  captionLayout = 'label',
  fromYear,
  toYear,
  autoFocus = false,
  previousMonthLabel,
  nextMonthLabel,
  className,
  ref,
  ...rest
}: CalendarBaseProps) {
  const strings = useStrings(PICKER_STRINGS);
  const config = useNishContext();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const ws: WeekDay = weekStartsOn ?? weekStartFor(loc);
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const focusPending = useRef(false);

  const min = checkIso(componentName, 'min', minProp);
  const max = checkIso(componentName, 'max', maxProp);
  const monthControlled = checkIso(componentName, 'month', monthProp, true);
  const defaultMonthIso = checkIso(componentName, 'defaultMonth', defaultMonth, true);

  const [ownMonth, setOwnMonth] = useState<string | null>(() => defaultMonthIso ?? initialMonth);
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const today = useSyncExternalStore(
    noopSubscribe,
    () => isoToday(),
    () => null,
  );
  const shown = monthControlled ?? ownMonth ?? (today ? monthOf(today) : null);

  const setMonth = (raw: string) => {
    const next = clampIso(raw, '0001-01', '9999-12');
    if (next === shown) return;
    if (monthProp === undefined) setOwnMonth(next);
    onMonthChange?.(next);
  };

  const disabled = (iso: string): boolean => !inRange(iso, min, max) || isDateDisabled?.(iso) === true;
  const inShown = (iso: string | null): iso is string => iso !== null && shown !== null && monthOf(iso) === shown;

  let tabStop: string | null = null;
  if (shown) {
    if (inShown(focusedDate)) tabStop = focusedDate;
    else if (inShown(focusPreference)) tabStop = focusPreference;
    else if (inShown(today)) tabStop = today;
    else {
      const days = monthGrid(shown, ws)
        .flat()
        .filter((d): d is string => d !== null);
      tabStop = days.find((d) => !disabled(d)) ?? days[0] ?? null;
    }
  }

  useIsoLayoutEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    if (!focusedDate) return;
    rootRef.current?.querySelector<HTMLElement>(`[data-date="${focusedDate}"]`)?.focus();
  });

  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
  };

  const pick = (iso: string) => {
    if (disabled(iso)) return;
    setFocusedDate(iso);
    onPick(iso);
  };

  const onGridKey = (e: KeyboardEvent<HTMLTableElement>) => {
    onGridKeyDown?.(e);
    if (e.defaultPrevented) return;
    const from = (e.target as HTMLElement).closest?.('[data-date]')?.getAttribute('data-date') ?? tabStop;
    if (!from) return;
    const raw = calendarKeyTarget(e.key, e.shiftKey, from, ws, isRtl(e.currentTarget));
    if (!raw) return;
    e.preventDefault();
    const target = clampIso(raw, min ?? '0001-01-01', max ?? '9999-12-31');
    const moved = target !== focusedDate || monthOf(target) !== shown;
    setFocusedDate(target);
    setMonth(monthOf(target));
    if (moved) {
      focusPending.current = true;
    } else {
      // No render will follow, so focus now; arming the flag would steal focus on a later render.
      e.currentTarget.querySelector<HTMLElement>(`[data-date="${target}"]`)?.focus();
    }
  };

  const grid = shown ? monthGrid(shown, ws) : EMPTY_GRID;
  const names = weekdayNames(loc, ws);
  const dropdowns = captionLayout === 'dropdowns';
  const shownYear = shown ? Number(shown.slice(0, 4)) : null;
  const shownMonthNo = shown ? Number(shown.slice(5, 7)) : null;
  const prevDisabled = !shown || shown <= '0001-01' || (min !== null && addDays(firstOfMonth(shown), -1) < min);
  const nextDisabled = !shown || shown >= '9999-12' || (max !== null && firstOfMonth(shiftMonth(shown, 1)) > max);

  let years: number[] = [];
  if (dropdowns) {
    const baseYear = today ? Number(today.slice(0, 4)) : (shownYear ?? 2026);
    const from = fromYear ?? (min ? Number(min.slice(0, 4)) : baseYear - 100);
    const to = toYear ?? (max ? Number(max.slice(0, 4)) : baseYear + 10);
    for (let y = from; y <= to; y++) years.push(y);
    if (shownYear !== null && !years.includes(shownYear)) years = [...years, shownYear].sort((a, b) => a - b);
  }

  return (
    <div {...rest} ref={setRoot} className={cn('inline-flex select-none flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-1">
        <IconButton
          size="sm"
          label={previousMonthLabel ?? strings.previousMonth}
          aria-disabled={prevDisabled || undefined}
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
          onClick={() => !prevDisabled && shown && setMonth(shiftMonth(shown, -1))}
        >
          <ChevronLeftIcon className="rtl:-scale-x-100" />
        </IconButton>
        <div id={titleId} aria-live="polite" className={cn('text-sm font-semibold text-th-hi', dropdowns && 'sr-only')}>
          {shown ? monthTitle(shown, loc) : ''}
        </div>
        {dropdowns && (
          <div className="flex min-w-0 items-center gap-1">
            <Select
              size="sm"
              aria-label={strings.month}
              value={shownMonthNo ?? ''}
              disabled={!shown}
              onChange={(e) => shownYear !== null && setMonth(`${pad4(shownYear)}-${pad2(Number(e.target.value))}`)}
            >
              {monthNames(loc).map((name, i) => (
                <option key={i} value={i + 1}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              size="sm"
              aria-label={strings.year}
              value={shownYear ?? ''}
              disabled={!shown}
              onChange={(e) => shownMonthNo !== null && setMonth(`${pad4(Number(e.target.value))}-${pad2(shownMonthNo)}`)}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        )}
        <IconButton
          size="sm"
          label={nextMonthLabel ?? strings.nextMonth}
          aria-disabled={nextDisabled || undefined}
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
          onClick={() => !nextDisabled && shown && setMonth(shiftMonth(shown, 1))}
        >
          <ChevronRightIcon className="rtl:-scale-x-100" />
        </IconButton>
      </div>
      <table
        role="grid"
        aria-labelledby={titleId}
        aria-multiselectable={multiselectable || undefined}
        className="border-collapse"
        onKeyDown={onGridKey}
        onPointerLeave={onDayHover ? () => onDayHover(null) : undefined}
      >
        <thead>
          <tr>
            {names.map((n) => (
              <th
                key={n.long}
                scope="col"
                abbr={n.long}
                className="size-10 overflow-hidden px-0.5 py-0 text-center text-xs font-medium text-th-hi3 pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]"
              >
                {n.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((iso, c) => {
                if (!iso) {
                  return (
                    <td key={c} className="p-0">
                      <div
                        aria-hidden="true"
                        className="size-10 pointer-coarse:h-11 pointer-coarse:w-[min(2.75rem,calc((100vw_-_2.6rem)/7))]"
                      />
                    </td>
                  );
                }
                const look = dayLook(iso);
                const isDisabled = disabled(iso);
                const isTabStop = iso === tabStop;
                return (
                  <td key={c} role="gridcell" aria-selected={look.ariaSelected} className="p-0">
                    <button
                      type="button"
                      tabIndex={isTabStop ? 0 : -1}
                      data-date={iso}
                      data-autofocus={autoFocus && isTabStop ? '' : undefined}
                      aria-label={fullDate(iso, loc)}
                      aria-current={iso === today ? 'date' : undefined}
                      aria-disabled={isDisabled || undefined}
                      data-state={look.filled ? 'active' : 'inactive'}
                      data-range={look.band ?? undefined}
                      data-preview={look.preview ? '' : undefined}
                      data-disabled={isDisabled ? '' : undefined}
                      onClick={() => pick(iso)}
                      onFocus={onDayFocus ? () => onDayFocus(iso) : undefined}
                      onPointerEnter={
                        onDayHover
                          ? (e) => {
                              if (e.pointerType !== 'touch') onDayHover(iso);
                            }
                          : undefined
                      }
                      className={calendarDayClass({
                        filled: look.filled,
                        band: look.band,
                        today: iso === today,
                        disabled: isDisabled,
                      })}
                    >
                      {dayNumber(iso, loc)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {children}
    </div>
  );
}
