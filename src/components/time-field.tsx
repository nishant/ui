'use client';
import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { cn } from '../cn';
import { getDefaultLocale } from '../format';
import { resolveLocale } from './calendar-classes';
import { useIsoLayoutEffect } from './client';
import { setRef } from './forms-classes';
import { fieldClass } from './primitives-classes';
import { Select } from './primitives';
import { useNishConfig, useNishStrings } from './provider';
import {
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
  type TimeDraft,
} from './time-field-classes';

export type { HourCycle } from './time-field-classes';

export interface TimeFieldProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'
> {
  /** The hour box. The remaining div attributes go to the group. */
  ref?: Ref<HTMLInputElement>;
  /** The time as HH:mm in 24-hour time, or null for none (controlled). */
  value?: string | null;
  /** The starting time of an uncontrolled field. */
  defaultValue?: string | null;
  /** Called with HH:mm when both boxes hold a valid time inside min and max, or null when both are emptied. */
  onValueChange?: (value: string | null) => void;
  /** Earliest allowed time (HH:mm). An earlier time marks the field invalid and is not reported. */
  min?: string;
  /** Latest allowed time (HH:mm). */
  max?: string;
  /** Minutes per ArrowUp or ArrowDown on the minute box, 1 to 60. Default 1. Typed minutes are kept as typed. */
  step?: number;
  /** 12 shows 1-12 and an AM/PM select, 24 shows 00-23. Default from the locale (12 in en-US, 24 in de-DE). */
  hourCycle?: 12 | 24;
  /** BCP 47 tag for the clock and the AM/PM words. Default NishProvider locale, then setDefaultLocale(). */
  locale?: string;
  /** Accessible name when there is no Field or visible label; each box is named "<name> Hour", "<name> Minute". */
  'aria-label'?: string;
  /** Names the field by another element's id. */
  'aria-labelledby'?: string;
  /** Ids of help or error text; reaches both boxes (Field sets it). */
  'aria-describedby'?: string;
  /** Reaches both boxes (Field sets it on error). */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Same as aria-invalid="true". */
  invalid?: boolean;
  /** The id of the hour box, so a <label htmlFor> and Field reach it. */
  id?: string;
  /** Field name for a native form: a hidden input posts HH:mm, or an empty string. */
  name?: string;
  /** The id of the <form> the hidden input belongs to, when it is not an ancestor. */
  form?: string;
  /** Marks both boxes required. */
  required?: boolean;
  /** Turns off both boxes and the AM/PM select. */
  disabled?: boolean;
  /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Extra classes for the group. */
  className?: string;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');
const warned = new Set<string>();
function warnOnce(message: string) {
  if (process.env.NODE_ENV === 'production' || warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/** The number in a box when it is a whole hour or minute inside lo..hi, else null. */
function boxNumber(text: string, lo: number, hi: number): number | null {
  if (!/^\d{1,2}$/.test(text)) return null;
  const n = Number(text);
  return n >= lo && n <= hi ? n : null;
}

/** A time field: an hour box and a minute box (and AM/PM where the locale uses it). Arrow keys step the focused
 *  box, typing moves on to the minutes, and the value is HH:mm in 24-hour time, like <input type="time">. */
export function TimeField({
  ref,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  min,
  max,
  step,
  hourCycle,
  locale,
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
  className,
  ...rest
}: TimeFieldProps) {
  const strings = useNishStrings();
  const config = useNishConfig();
  const loc = resolveLocale(locale ?? config.locale ?? getDefaultLocale());
  const cycle = hourCycle ?? hourCycleFor(loc);
  const st = normalizeStep(step);
  const [am, pm] = dayPeriodNames(loc);
  const minT = parseTime(min) ? (min as string) : null;
  const maxT = parseTime(max) ? (max as string) : null;

  const auto = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `nish-tf-${auto}`;
  const nameId = `nish-tf-${auto}-name`;
  const hId = `nish-tf-${auto}-h`;
  const mId = `nish-tf-${auto}-m`;
  const pId = `nish-tf-${auto}-p`;
  // The derived "<id>-label" is the label Field renders. Without a Field it does not exist, so it is dropped
  // after the first commit (the first render matches the server).
  const derived = ariaLabelledBy == null && ariaLabel == null && id != null;
  const [labelId, setLabelId] = useState<string | null>(id != null ? `${id}-label` : null);
  useIsoLayoutEffect(() => {
    if (!derived) return;
    if (document.getElementById(`${id}-label`)) {
      setLabelId(`${id}-label`);
      return;
    }
    // A plain <label htmlFor>: use its id when it has one (the user's DOM is never changed).
    const native = (document.getElementById(id as string) as HTMLInputElement | null)?.labels?.[0]?.id || null;
    setLabelId(native);
    if (!native) warnOnce('TimeField: give it a Field, an aria-label or aria-labelledby.');
  }, [derived, id]);
  const src = ariaLabelledBy ?? (ariaLabel != null ? nameId : derived ? (labelId ?? undefined) : undefined);
  const names = (own: string) => [src, own].filter(Boolean).join(' ');
  if (ariaLabel == null && ariaLabelledBy == null && id == null) {
    warnOnce('TimeField: give it a Field, an aria-label or aria-labelledby.');
  }

  const controlled = valueProp !== undefined;
  const okProp = (prop: string, v: string | null | undefined): string | null => {
    if (v == null) return null;
    if (parseTime(v)) return v;
    warnOnce(`TimeField: "${prop}" must be HH:mm`);
    return null;
  };
  const [own, setOwn] = useState<string | null>(() => okProp('defaultValue', defaultValue));
  const value = controlled ? okProp('value', valueProp) : own;

  // The boxes as typed, with the value they committed. The text stays as typed while focus is in the group; it is
  // dropped on blur, or when the value is no longer the one the draft committed (the parent changed it).
  const [draftState, setDraft] = useState<{ d: TimeDraft; base: string | null } | null>(null);
  const draft = draftState !== null && draftState.base === value ? draftState.d : null;
  const [bad, setBad] = useState(false);
  const hourRef = useRef<HTMLInputElement | null>(null);
  const minuteRef = useRef<HTMLInputElement | null>(null);
  const shown = draft ?? draftFromTime(value, cycle);
  const draftBad = (): boolean => {
    if (draft === null) return false;
    const t = draftTime(draft, cycle);
    return t === undefined || (t !== null && !inTimeRange(t, minT, maxT));
  };

  const outside = value !== null && !inTimeRange(value, minT, maxT);
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true' || bad || outside;

  useEffect(() => {
    hourRef.current?.setCustomValidity(bad || outside ? strings.invalidTime : '');
  }, [bad, outside, strings.invalidTime]);

  // An uncontrolled field returns to its default when its form is reset.
  useEffect(() => {
    const f = hourRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => {
      setOwn(okProp('defaultValue', defaultValue));
      setDraft(null);
      setBad(false);
    };
    f.addEventListener('reset', onReset);
    return () => f.removeEventListener('reset', onReset);
  }, [name, form, controlled, defaultValue]);

  const commit = (v: string | null) => {
    if (!controlled) setOwn(v);
    onValueChange?.(v);
  };

  const update = (next: TimeDraft) => {
    const t = draftTime(next, cycle);
    if (t === null) {
      if (value !== null) commit(null);
      setDraft({ d: next, base: null });
      setBad(false);
    } else if (typeof t === 'string' && inTimeRange(t, minT, maxT)) {
      if (t !== value) commit(t);
      setDraft({ d: next, base: t });
      setBad(false);
    } else {
      setDraft({ d: next, base: value });
    }
  };

  const focusMinute = () => {
    minuteRef.current?.focus();
    minuteRef.current?.select();
  };

  const onKey = (which: 'h' | 'm') => (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const key = e.key;
    if (key === 'Enter') {
      if (draftBad()) {
        e.preventDefault();
        setBad(true);
      }
      return;
    }
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      e.preventDefault();
      const dir = key === 'ArrowUp' ? 1 : -1;
      if (which === 'h') {
        const hn = boxNumber(shown.h, cycle === 12 ? 1 : 0, cycle === 12 ? 12 : 23);
        const cur = hn === null ? null : cycle === 12 ? from12(hn, shown.pm) : hn;
        const next = stepHour(cur, dir);
        update({ ...shown, h: hourText(next, cycle), pm: next >= 12 });
      } else {
        const cur = boxNumber(shown.m, 0, 59);
        update({ ...shown, m: pad2(stepMinute(cur, dir, st)) });
      }
    } else if (key === 'Home') {
      e.preventDefault();
      update(which === 'h' ? { ...shown, h: hourText(0, cycle), pm: false } : { ...shown, m: '00' });
    } else if (key === 'End') {
      e.preventDefault();
      update(which === 'h' ? { ...shown, h: hourText(23, cycle), pm: true } : { ...shown, m: pad2(lastMinute(st)) });
    } else if (cycle === 12 && (key === 'a' || key === 'A' || key === 'p' || key === 'P')) {
      e.preventDefault();
      update({ ...shown, pm: key === 'p' || key === 'P' });
    } else if (which === 'h' && (key === ':' || key === '.')) {
      e.preventDefault();
      focusMinute();
    } else if (which === 'm' && key === 'Backspace' && shown.m === '') {
      e.preventDefault();
      hourRef.current?.focus();
    }
  };

  const hourNow = boxNumber(shown.h, cycle === 12 ? 1 : 0, cycle === 12 ? 12 : 23);
  const minuteNow = boxNumber(shown.m, 0, 59);
  const boxClass = fieldClass({
    size,
    invalid: isInvalid,
    className: 'w-12 ps-0 pe-0 text-center tabular-nums pointer-coarse:w-14',
  });
  const common = {
    type: 'text' as const,
    inputMode: 'numeric' as const,
    autoComplete: 'off',
    spellCheck: false,
    maxLength: 2,
    role: 'spinbutton' as const,
    placeholder: '--',
    disabled,
    required,
    'aria-required': required || undefined,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': isInvalid || undefined,
    className: boxClass,
    onFocus: (e: { currentTarget: HTMLInputElement }) => e.currentTarget.select(),
  };

  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={src}
      data-disabled={disabled ? '' : undefined}
      className={cn('inline-flex items-center gap-2', className)}
      onBlur={(e) => {
        rest.onBlur?.(e);
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        const isBad = draftBad();
        setBad(isBad);
        if (!isBad) setDraft(null);
      }}
    >
      {ariaLabel != null ? (
        <span id={nameId} hidden>
          {ariaLabel}
        </span>
      ) : null}
      <span id={hId} hidden>
        {strings.hour}
      </span>
      <span id={mId} hidden>
        {strings.minute}
      </span>
      {cycle === 12 ? (
        <span id={pId} hidden>
          {strings.dayPeriod}
        </span>
      ) : null}
      <span dir="ltr" className="inline-flex items-center gap-1">
        <input
          {...common}
          ref={(node) => {
            hourRef.current = node;
            setRef(ref, node);
          }}
          id={inputId}
          value={shown.h}
          aria-labelledby={names(hId)}
          aria-valuemin={cycle === 12 ? 1 : 0}
          aria-valuemax={cycle === 12 ? 12 : 23}
          aria-valuenow={hourNow ?? undefined}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 2);
            update({ ...shown, h: d });
            if (hourAdvances(d, cycle)) focusMinute();
          }}
          onKeyDown={(e) => onKey('h')(e)}
        />
        <span aria-hidden="true" className="text-th-hi3">
          :
        </span>
        <input
          {...common}
          ref={minuteRef}
          value={shown.m}
          aria-labelledby={names(mId)}
          aria-valuemin={0}
          aria-valuemax={59}
          aria-valuenow={minuteNow ?? undefined}
          onChange={(e) => update({ ...shown, m: e.target.value.replace(/\D/g, '').slice(0, 2) })}
          onKeyDown={(e) => onKey('m')(e)}
        />
      </span>
      {cycle === 12 ? (
        <Select
          value={shown.pm ? 'pm' : 'am'}
          onChange={(e) => update({ ...shown, pm: e.target.value === 'pm' })}
          size={size}
          disabled={disabled}
          aria-labelledby={names(pId)}
          className="w-auto shrink-0"
        >
          <option value="am">{am}</option>
          <option value="pm">{pm}</option>
        </Select>
      ) : null}
      {name != null ? <input type="hidden" name={name} value={value ?? ''} form={form} disabled={disabled} /> : null}
    </div>
  );
}
