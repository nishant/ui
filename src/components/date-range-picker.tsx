'use client';
import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { cn } from '../cn';
import { getDefaultLocale } from '../format';
import {
  firstDisabledIn,
  formatRangeField,
  fullDate,
  inRange,
  parseIso,
  parseRangeField,
  rangePlaceholder,
  resolveLocale,
  sameRange,
  toRange,
  type DateRange,
  type WeekDay,
} from './calendar-classes';
import { setRef } from './forms-classes';
import { Popover } from './popover';
import { CalendarIcon } from './icons';
import { RangeCalendar } from './range-calendar';
import { fieldClass } from './primitives-classes';
import { useNishContext, useStrings } from './provider';
import { PICKER_STRINGS } from './strings';

export type { DateRange, WeekDay } from './calendar-classes';

export interface DateRangePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'
> {
  /** The text input. The remaining div attributes go to the wrapper. */
  ref?: Ref<HTMLInputElement>;
  /** The range as { from, to } in YYYY-MM-DD, or null for none (controlled). */
  value?: DateRange | null;
  /** The starting range of an uncontrolled picker. */
  defaultValue?: DateRange | null;
  /** Called with { from, to }, or null when the field is cleared. */
  onValueChange?: (value: DateRange | null) => void;
  /** Earliest date that can be picked or typed (YYYY-MM-DD). */
  min?: string;
  /** Latest date that can be picked or typed (YYYY-MM-DD). */
  max?: string;
  /** Return true to disable a date in the calendar and refuse a typed range that ends on or covers it. */
  isDateDisabled?: (date: string) => boolean;
  /** Let a range cover days isDateDisabled returns true for (weekends inside a vacation). Default false: a second press that would cover one starts a new range there. */
  allowDisabledInRange?: boolean;
  /** BCP 47 tag for the field format and the calendar. Default NishProvider locale, then setDefaultLocale(). */
  locale?: string;
  /** First column of the calendar: 0 Sunday to 6 Saturday. Default from the locale's region. */
  weekStartsOn?: WeekDay;
  /** Passed to the RangeCalendar: 'dropdowns' adds month and year selects (birth dates). */
  captionLayout?: 'label' | 'dropdowns';
  /** Shown while empty. Default the locale's pattern twice, e.g. "MM/DD/YYYY – MM/DD/YYYY". */
  placeholder?: string;
  /** Accessible name when there is no visible <label htmlFor={id}>. */
  'aria-label'?: string;
  /** Names the field by another element's id. */
  'aria-labelledby'?: string;
  /** Ids of help or error text; reaches the input (Field sets it). */
  'aria-describedby'?: string;
  /** Reaches the input (Field sets it on error). */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Same as aria-invalid="true". */
  invalid?: boolean;
  /** The id of the text input, so a <label htmlFor> and Field reach it. */
  id?: string;
  /** Field name for a native form: a hidden input posts from/to (2026-11-05/2026-11-09), or an empty string. */
  name?: string;
  /** The id of the <form> the hidden input belongs to, when it is not an ancestor. */
  form?: string;
  /** Marks the field required. */
  required?: boolean;
  /** Turns off the text input and the calendar button. */
  disabled?: boolean;
  /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Accessible name of the calendar button. Default "Choose dates", or "Change dates, <from> to <to>" once set. */
  calendarLabel?: string;
  /** Extra classes for the wrapper around the input and the calendar button. */
  className?: string;
}

/** A date range field: type both dates in the reader's own numeric order (or ISO), or pick them
 *  from a RangeCalendar in a Popover. The value is { from, to } as YYYY-MM-DD strings. `ref`,
 *  `id`, `aria-*`, `name` and `required` belong to the input; `className` and other attributes
 *  go to the wrapper. */
export function DateRangePicker({
  ref,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min: minProp,
  max: maxProp,
  isDateDisabled,
  allowDisabledInRange = false,
  locale,
  weekStartsOn,
  captionLayout,
  placeholder,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  invalid,
  id,
  name,
  form,
  required,
  disabled = false,
  size = 'md',
  calendarLabel,
  className,
  ...rest
}: DateRangePickerProps) {
  const strings = useStrings(PICKER_STRINGS);
  const config = useNishContext();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `nish-drp-${autoId}`;

  const min = parseIso(minProp) ? (minProp as string) : null;
  const max = parseIso(maxProp) ? (maxProp as string) : null;

  const controlled = valueProp !== undefined;
  const [own, setOwn] = useState<DateRange | null>(() => toRange(defaultValue));
  const value = controlled ? toRange(valueProp) : own;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [badText, setBadText] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const shown = dirty ? text : value ? formatRangeField(value, loc) : '';
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true' || badText;

  // Unreadable text blocks native validation, so form.checkValidity() and submit refuse it.
  useEffect(() => {
    inputRef.current?.setCustomValidity(badText ? strings.invalidDateRange : '');
  }, [badText, strings.invalidDateRange]);

  // An uncontrolled picker returns to its default when its form is reset.
  useEffect(() => {
    const f = inputRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => {
      setOwn(toRange(defaultValue));
      setDirty(false);
      setBadText(false);
    };
    f.addEventListener('reset', onReset);
    return () => f.removeEventListener('reset', onReset);
  }, [name, form, controlled, defaultValue]);

  const commit = (v: DateRange | null) => {
    if (!controlled) setOwn(v);
    onValueChange?.(v);
  };

  const commitText = () => {
    if (!dirty) return;
    if (text.trim() === '') {
      if (value !== null) commit(null);
      setDirty(false);
      setBadText(false);
      return;
    }
    const r = parseRangeField(text, loc);
    if (
      r &&
      inRange(r.from, min, max) &&
      inRange(r.to, min, max) &&
      isDateDisabled?.(r.from) !== true &&
      isDateDisabled?.(r.to) !== true &&
      (allowDisabledInRange || !isDateDisabled || firstDisabledIn(r.from, r.to, isDateDisabled) === null)
    ) {
      if (!sameRange(r, value)) commit(r);
      setDirty(false);
      setBadText(false);
      return;
    }
    setBadText(true);
  };

  const pickFromCalendar = (r: DateRange) => {
    commit(r);
    setDirty(false);
    setBadText(false);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      if (dirty) {
        e.preventDefault();
        commitText();
      }
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      setOpen(true);
    } else if (e.key === 'Escape' && dirty) {
      e.preventDefault();
      e.stopPropagation();
      setDirty(false);
      setBadText(false);
    }
  };

  const buttonLabel = calendarLabel ??
    (value
      ? strings.changeDates(strings.dateRange(fullDate(value.from, loc), fullDate(value.to, loc)))
      : strings.chooseDates);

  return (
    <div
      {...rest}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      className={cn('relative w-full min-w-0', className)}
    >
      <input
        ref={(node) => {
          inputRef.current = node;
          setRef(ref, node);
        }}
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={shown}
        placeholder={
          placeholder ??
          rangePlaceholder(loc, {
            day: strings.dayToken,
            month: strings.monthToken,
            year: strings.yearToken,
          })
        }
        disabled={disabled}
        required={required}
        form={form}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={required || undefined}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        onBlur={commitText}
        onKeyDown={onKeyDown}
        className={fieldClass({
          size,
          invalid: isInvalid,
          className: 'pe-11 tabular-nums',
        })}
      />
      {name != null ? <input type="hidden" name={name} value={value ? `${value.from}/${value.to}` : ''} form={form} disabled={disabled} /> : null}
      <button
        ref={buttonRef}
        type="button"
        aria-label={buttonLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi disabled:pointer-events-none disabled:opacity-50"
      >
        <span className="flex size-8 items-center justify-center rounded-md hover:bg-th-elevated">
          <CalendarIcon size={16} />
        </span>
      </button>
      <Popover open={open} onOpenChange={(o) => setOpen(o)} anchor={buttonRef} align="end" aria-label={strings.chooseDates} className="p-3">
        <RangeCalendar
          value={value}
          onValueChange={pickFromCalendar}
          min={minProp}
          max={maxProp}
          isDateDisabled={isDateDisabled}
          allowDisabledInRange={allowDisabledInRange}
          locale={loc}
          weekStartsOn={weekStartsOn}
          captionLayout={captionLayout}
          autoFocus
        />
      </Popover>
    </div>
  );
}
