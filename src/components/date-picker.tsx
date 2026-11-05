'use client';
import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { cn } from '../cn';
import { getDefaultLocale } from '../format';
import { Calendar } from './calendar';
import {
  datePlaceholder,
  formatDateField,
  fullDate,
  inRange,
  parseDateField,
  parseIso,
  resolveLocale,
  type WeekDay,
} from './calendar-classes';
import { setRef } from './forms-classes';
import { Popover } from './popover';
import { CalendarIcon } from './icons';
import { fieldClass } from './primitives-classes';
import { useNishConfig, useNishStrings } from './provider';

export type { WeekDay } from './calendar-classes';

export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'
> {
  /** The text input. The remaining div attributes go to the wrapper. */
  ref?: Ref<HTMLInputElement>;
  /** The date as YYYY-MM-DD, or null for none (controlled). */
  value?: string | null;
  /** The starting date of an uncontrolled picker. */
  defaultValue?: string | null;
  /** Called with YYYY-MM-DD, or null when the field is cleared. */
  onValueChange?: (value: string | null) => void;
  /** Earliest date that can be picked or typed (YYYY-MM-DD). */
  min?: string;
  /** Latest date that can be picked or typed (YYYY-MM-DD). */
  max?: string;
  /** Return true to disable a date in the calendar and refuse it when typed. */
  isDateDisabled?: (date: string) => boolean;
  /** BCP 47 tag for the field format and the calendar. Default NishProvider locale, then setDefaultLocale(). */
  locale?: string;
  /** First column of the calendar: 0 Sunday to 6 Saturday. Default from the locale's region. */
  weekStartsOn?: WeekDay;
  /** Passed to the Calendar: 'dropdowns' adds month and year selects (birth dates). */
  captionLayout?: 'label' | 'dropdowns';
  /** Shown while empty. Default the locale's pattern, e.g. "MM/DD/YYYY". */
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
  /** Field name for a native form: a hidden input posts YYYY-MM-DD. */
  name?: string;
  /** The id of the <form> the hidden input belongs to, when it is not an ancestor. */
  form?: string;
  /** Marks the field required. */
  required?: boolean;
  /** Turns off the text input and the calendar button. */
  disabled?: boolean;
  /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Accessible name of the calendar button. Default "Choose date", or "Change date, <date>" once set. */
  calendarLabel?: string;
  /** Extra classes for the wrapper around the input and the calendar button. */
  className?: string;
}

/** A date field: type the date in the reader's own numeric order (or ISO), or pick it from a
 *  Calendar in a Popover. The value is a YYYY-MM-DD string, like a native date input. `ref`,
 *  `id`, `aria-*`, `name` and `required` belong to the input; `className` and other attributes
 *  go to the wrapper. */
export function DatePicker({
  ref,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min: minProp,
  max: maxProp,
  isDateDisabled,
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
}: DatePickerProps) {
  const strings = useNishStrings();
  const config = useNishConfig();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `nish-dp-${autoId}`;

  const min = parseIso(minProp) ? (minProp as string) : null;
  const max = parseIso(maxProp) ? (maxProp as string) : null;

  const controlled = valueProp !== undefined;
  const [own, setOwn] = useState<string | null>(parseIso(defaultValue) ? defaultValue : null);
  const value = controlled ? (parseIso(valueProp) ? (valueProp as string) : null) : own;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [badText, setBadText] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const shown = dirty ? text : value ? formatDateField(value, loc) : '';
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true' || badText;

  // Unreadable text blocks native validation, so form.checkValidity() and submit refuse it.
  useEffect(() => {
    inputRef.current?.setCustomValidity(badText ? strings.invalidDate : '');
  }, [badText, strings.invalidDate]);

  // An uncontrolled picker returns to its default when its form is reset.
  useEffect(() => {
    const f = inputRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => {
      setOwn(parseIso(defaultValue) ? defaultValue : null);
      setDirty(false);
      setBadText(false);
    };
    f.addEventListener('reset', onReset);
    return () => f.removeEventListener('reset', onReset);
  }, [name, form, controlled, defaultValue]);

  const commit = (v: string | null) => {
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
    const iso = parseDateField(text, loc);
    if (iso && inRange(iso, min, max) && isDateDisabled?.(iso) !== true) {
      if (iso !== value) commit(iso);
      setDirty(false);
      setBadText(false);
      return;
    }
    setBadText(true);
  };

  const pickFromCalendar = (iso: string) => {
    commit(iso);
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

  const buttonLabel = calendarLabel ?? (value ? strings.changeDate(fullDate(value, loc)) : strings.chooseDate);

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
          datePlaceholder(loc, {
            day: strings.dayToken,
            month: strings.monthToken,
            year: strings.yearToken,
          })
        }
        disabled={disabled}
        required={required}
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
      {name != null ? <input type="hidden" name={name} value={value ?? ''} form={form} disabled={disabled} /> : null}
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
      <Popover open={open} onOpenChange={(o) => setOpen(o)} anchor={buttonRef} align="end" aria-label={strings.chooseDate} className="p-3">
        <Calendar
          value={value}
          onValueChange={pickFromCalendar}
          min={minProp}
          max={maxProp}
          isDateDisabled={isDateDisabled}
          locale={loc}
          weekStartsOn={weekStartsOn}
          captionLayout={captionLayout}
          autoFocus
        />
      </Popover>
    </div>
  );
}
