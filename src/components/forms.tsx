'use client';
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SVGProps,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../cn';
import { FIELD, IconButton, Input } from './primitives';
import { XIcon } from './icons';
import { isRtl, useIsoLayoutEffect } from './client';
import { useStrings } from './provider';
import { FIELD_STRINGS } from './strings';
import { warnDev } from './display-classes';
import { chipClass, setRef, type ChipClassOptions, type ChipVariant } from './forms-classes';

// Pure helpers live in forms-classes.ts (no directive, callable from a server component);
// they are re-exported here so existing import paths keep working.
export { chipClass };
export type { ChipClassOptions };

// Form controls: Textarea, Checkbox, Switch, Field, FieldGroup, SearchInput, Chip and
// ChipGroup. Every interactive control grows to the 44px tap target on touch screens
// (pointer-coarse) and stays compact under a mouse.

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function Svg({ size = 16, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}
const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);
const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M12 5v14" />
  </Svg>
);
const CheckIcon = (p: IconProps) => (
  <Svg strokeWidth={3} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);
const MinusIcon = (p: IconProps) => (
  <Svg strokeWidth={3} {...p}>
    <path d="M5 12h14" />
  </Svg>
);

const noop = (): void => {};

/** Calls `onReset` when the form that owns `ref` is reset, so an uncontrolled control
 *  returns to its default like a native one. */
function useFormReset(ref: { current: HTMLElement | null }, onReset: () => void) {
  const latest = useRef(onReset);
  useEffect(() => {
    latest.current = onReset;
  });
  useEffect(() => {
    const form = (ref.current as HTMLInputElement | null)?.form;
    if (!form) return;
    const handler = () => latest.current();
    form.addEventListener('reset', handler);
    return () => form.removeEventListener('reset', handler);
  }, [ref]);
}

// --- Textarea ---------------------------------------------------------------------

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** The textarea element. */
  ref?: Ref<HTMLTextAreaElement>;
  /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby
   *  (Field does both for you). */
  invalid?: boolean;
  /** md: the standard field. sm: tighter padding and 12px text under a mouse, for dense
   *  panels. Touch screens always get 16px text so iOS does not zoom. */
  size?: 'sm' | 'md';
  /** Grow with the content instead of scrolling (chat composers, notes). `true` grows
   *  without limit; `{ maxRows }` stops growing and scrolls past that many lines. `rows`
   *  stays the minimum height. Turns off the manual resize handle. */
  autoGrow?: boolean | { maxRows: number };
}

/** Multi-line text with the shared field look. 16px text on touch screens (no iOS zoom); the
 *  reader can resize it vertically, or it grows with its content when autoGrow is set. */
export function Textarea({ ref, invalid, size = 'md', autoGrow = false, className, rows = 4, value, onInput, ...rest }: TextareaProps) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const grow = autoGrow !== false;
  const maxRows = typeof autoGrow === 'object' ? autoGrow.maxRows : undefined;

  const resize = useCallback(() => {
    const el = inner.current;
    if (!el || !grow) return;
    el.style.height = 'auto';
    const cs = getComputedStyle(el);
    const border = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    let h = el.scrollHeight + border;
    if (maxRows) {
      const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
      const max = line * maxRows + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + border;
      el.style.overflowY = h > max ? 'auto' : 'hidden';
      h = Math.min(h, max);
    } else {
      el.style.overflowY = 'hidden';
    }
    el.style.height = `${h}px`;
  }, [grow, maxRows]);

  useIsoLayoutEffect(() => {
    resize();
  }, [resize, value]);

  return (
    <textarea
      ref={(node) => {
        inner.current = node;
        setRef(ref, node);
      }}
      rows={rows}
      value={value}
      aria-invalid={invalid || undefined}
      onInput={(e) => {
        resize();
        onInput?.(e);
      }}
      className={cn(
        FIELD,
        'block leading-relaxed',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        'pointer-coarse:text-base',
        grow ? 'resize-none' : 'resize-y',
        className,
      )}
      {...rest}
    />
  );
}

// --- Checkbox ---------------------------------------------------------------------

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** The checkbox input. */
  ref?: Ref<HTMLInputElement>;
  /** Text beside the box; clicking it toggles the box. Optional when the box has an
   *  aria-label instead (a table row's select box). */
  label?: ReactNode;
  /** A quieter line under the label. It describes the box (aria-describedby) and is not
   *  part of its name. */
  hint?: ReactNode;
  /** The "some but not all" state of a select-all box. Set through the DOM property, so
   *  screen readers announce it as mixed. Clicking still toggles `checked`. */
  indeterminate?: boolean;
  /** A right-aligned slot on the same row (a price, a count). The row then fills its
   *  container's width. Described by, not part of, the box's name. */
  trailing?: ReactNode;
  /** md: 16px box, 14px text. sm: 14px box, 12px text for dense lists. The row is the
   *  44px tap target on touch screens either way. */
  size?: 'sm' | 'md';
  /** Red border and aria-invalid. Field sets it for you. */
  invalid?: boolean;
}

/** A checkbox with its label. The box is drawn from theme roles (its unchecked border
 *  reads in light themes too), and the whole row is the 44px tap target on touch. Props
 *  other than `className` go to the `<input>` (name, checked, onChange, form). */
export function Checkbox({ ref, label, hint, indeterminate = false, trailing, size = 'md', invalid, className, id, disabled, onChange, ...rest }: CheckboxProps) {
  const auto = useId();
  const boxId = id ?? `${auto}-box`;
  const labelId = `${auto}-label`;
  const hintId = `${auto}-hint`;
  const trailingId = `${auto}-trailing`;
  const inner = useRef<HTMLInputElement | null>(null);
  // Mirrors the box for data-state when it keeps its own state (no `checked` prop).
  const [live, setLive] = useState(rest.defaultChecked ?? false);
  const isChecked = rest.checked ?? live;
  useFormReset(inner, () => setLive(rest.defaultChecked ?? false));
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const sm = size === 'sm';
  const describedBy =
    [rest['aria-describedby'], hint ? hintId : undefined, trailing != null ? trailingId : undefined].filter(Boolean).join(' ') || undefined;
  // Name = the label text alone, so the hint and trailing text are not read twice.
  const named = label != null && (hint || trailing != null) && !rest['aria-label'] && !rest['aria-labelledby'];
  return (
    <label
      htmlFor={boxId}
      data-state={indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'cursor-pointer items-start gap-2.5 text-th-hi pointer-coarse:min-h-11 pointer-coarse:py-2.5',
        sm ? 'gap-2 text-xs' : 'text-sm',
        trailing != null ? 'flex w-full' : 'inline-flex',
        label == null && hint == null && 'items-center pointer-coarse:min-w-11 pointer-coarse:justify-center',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className={cn('relative inline-flex shrink-0', label != null && (sm ? 'mt-px' : 'mt-0.5'))}>
        <input
          {...rest}
          ref={(node) => {
            inner.current = node;
            setRef(ref, node);
          }}
          id={boxId}
          type="checkbox"
          disabled={disabled}
          onChange={(e) => {
            setLive(e.target.checked);
            onChange?.(e);
          }}
          aria-invalid={invalid || rest['aria-invalid'] || undefined}
          aria-labelledby={named ? labelId : rest['aria-labelledby']}
          aria-describedby={describedBy}
          className={cn(
            'peer m-0 shrink-0 cursor-[inherit] appearance-none rounded border border-th-line-control bg-th-surface transition-colors',
            'checked:border-th-accent checked:bg-th-accent indeterminate:border-th-accent indeterminate:bg-th-accent',
            'aria-[invalid=true]:border-th-loss',
            'forced-colors:checked:border-[color:Highlight] forced-colors:checked:bg-[color:Highlight] forced-colors:indeterminate:border-[color:Highlight] forced-colors:indeterminate:bg-[color:Highlight]',
            sm ? 'size-3.5' : 'size-4',
          )}
        />
        <CheckIcon
          size={sm ? 10 : 12}
          className="pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-checked:block peer-indeterminate:hidden forced-colors:text-[color:HighlightText]"
        />
        <MinusIcon
          size={sm ? 10 : 12}
          className="pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-indeterminate:block forced-colors:text-[color:HighlightText]"
        />
      </span>
      {label != null || hint != null ? (
        <span className="min-w-0">
          {label != null ? (
            <span id={labelId} className="block leading-snug">
              {label}
            </span>
          ) : null}
          {hint ? (
            <span id={hintId} className="mt-0.5 block text-xs text-th-hi3">
              {hint}
            </span>
          ) : null}
        </span>
      ) : null}
      {trailing != null ? (
        <span id={trailingId} className="ms-auto shrink-0 ps-2 text-th-hi2 tabular-nums">
          {trailing}
        </span>
      ) : null}
    </label>
  );
}

// --- Switch -----------------------------------------------------------------------

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'type' | 'value' | 'defaultValue' | 'name' | 'form'> {
  /** The switch button. */
  ref?: Ref<HTMLButtonElement>;
  /** On or off, when you keep the state yourself. Leave it out and use `defaultChecked`
   *  for an uncontrolled switch. */
  checked?: boolean;
  /** The starting state of an uncontrolled switch (no `checked`). */
  defaultChecked?: boolean;
  /** Called with the new value when the switch is clicked or toggled with Space or Enter.
   *  Use it with react-hook-form's Controller (`onCheckedChange={field.onChange}`). Need the
   *  click event? Use `onClick`. */
  onCheckedChange?: (checked: boolean) => void;
  /** Field name for a native form. With it, a hidden checkbox mirrors the state, so
   *  FormData and `<form action>` carry the value. */
  name?: string;
  /** The submitted value while on. Default "on", like a native checkbox. */
  value?: string;
  /** Marks the control required (aria-required, and the hidden checkbox blocks submit). */
  required?: boolean;
  /** The id of the `<form>` the hidden checkbox belongs to, when it is not an ancestor. */
  form?: string;
  /** Visible label, linked to the switch by aria-labelledby. Clicking it toggles too.
   *  Without one, pass aria-label or aria-labelledby. */
  label?: ReactNode;
  /** A quieter line under the label, linked by aria-describedby. */
  description?: ReactNode;
  /** md: 36×20 track. sm: 28×16 for dense settings lists. Both get a 44px tap target on
   *  touch screens. */
  size?: 'sm' | 'md';
  /** The label and description sit before the switch (a settings row, default) or
   *  after it. */
  labelSide?: 'start' | 'end';
}

/** An on/off switch that takes effect immediately (a setting, not a form choice that
 *  waits for Save; use Checkbox for that). A `<button role="switch" aria-checked>`; with a
 *  `name` it also posts in native forms. `ref` and the remaining props go to the button;
 *  `className` goes to the row (or to the button when there is no label). */
export function Switch({
  ref,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  name,
  value = 'on',
  required,
  form,
  label,
  description,
  size = 'md',
  labelSide = 'start',
  disabled,
  className,
  id,
  onClick,
  ...allRest
}: SwitchProps) {
  const { onChange: removedOnChange, ...rest } = allRest as typeof allRest & { onChange?: unknown };
  const removed = removedOnChange !== undefined;
  useEffect(() => {
    if (removed) warnDev('Switch: onChange was removed in nish-ui 3.0. Use onCheckedChange(checked).');
  }, [removed]);
  const auto = useId();
  const btnId = id ?? `${auto}-switch`;
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const sm = size === 'sm';
  const [inner, setInner] = useState(defaultChecked);
  const controlled = checkedProp !== undefined;
  const checked = controlled ? checkedProp : inner;
  const hidden = useRef<HTMLInputElement | null>(null);
  useFormReset(hidden, () => {
    if (!controlled) setInner(defaultChecked);
  });
  const state = checked ? 'checked' : 'unchecked';
  const button = (
    <button
      {...rest}
      ref={ref}
      id={btnId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-required={required || undefined}
      aria-labelledby={label != null ? labelId : rest['aria-labelledby']}
      aria-describedby={description != null ? descId : rest['aria-describedby']}
      data-state={state}
      data-disabled={disabled ? '' : undefined}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        const next = !checked;
        if (!controlled) setInner(next);
        onCheckedChange?.(next);
      }}
      className={cn(
        'group relative inline-flex shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50',
        'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        label == null && className,
      )}
    >
      <span
        aria-hidden="true"
        data-state={state}
        className={cn(
          'inline-flex items-center rounded-full p-0.5 transition-colors duration-150 forced-color-adjust-none',
          'forced-colors:border forced-colors:border-[color:ButtonText] forced-colors:group-disabled:border-[color:GrayText]',
          sm ? 'h-4 w-7' : 'h-5 w-9',
          checked ? 'bg-th-accent forced-colors:bg-[color:Highlight]' : 'bg-th-line-control forced-colors:bg-[color:Canvas]',
        )}
      >
        <span
          className={cn(
            'rounded-full shadow-card transition-transform duration-150 motion-reduce:transition-none',
            sm ? 'size-3' : 'size-4',
            checked
              ? cn(sm ? 'translate-x-3 rtl:-translate-x-3' : 'translate-x-4 rtl:-translate-x-4', 'bg-th-on-accent forced-colors:bg-[color:HighlightText]')
              : 'translate-x-0 bg-th-surface forced-colors:bg-[color:ButtonText]',
          )}
        />
      </span>
    </button>
  );
  // Not focusable and hidden from assistive tech: the button is the control, this only
  // makes the state part of the form's data.
  const mirror =
    name != null ? (
      <input
        ref={hidden}
        type="checkbox"
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only pointer-events-none"
        name={name}
        value={value}
        form={form}
        required={required}
        disabled={disabled}
        checked={checked}
        onChange={noop}
      />
    ) : null;
  if (label == null)
    return (
      <>
        {button}
        {mirror}
      </>
    );
  const text = (
    <span className="min-w-0">
      <span id={labelId} className={cn('block leading-snug text-th-hi', sm ? 'text-xs' : 'text-sm')}>
        {label}
      </span>
      {description != null ? (
        <span id={descId} className="mt-0.5 block text-xs text-th-hi3">
          {description}
        </span>
      ) : null}
    </span>
  );
  return (
    <>
      <label
        htmlFor={btnId}
        data-state={state}
        data-disabled={disabled ? '' : undefined}
        className={cn(
          'flex cursor-pointer items-start gap-3 pointer-coarse:items-center',
          labelSide === 'start' && 'justify-between',
          disabled && 'cursor-not-allowed',
          className,
        )}
      >
        {labelSide === 'start' ? text : null}
        <span className={cn('inline-flex', sm ? 'pt-0' : 'pt-px', 'pointer-coarse:pt-0')}>{button}</span>
        {labelSide === 'end' ? text : null}
      </label>
      {mirror}
    </>
  );
}

// --- Field ------------------------------------------------------------------------

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The wrapper element. */
  ref?: Ref<HTMLDivElement>;
  /** The visible label, in sentence case ("Email address"). Rendered as a real <label>
   *  tied to the control. */
  label: ReactNode;
  /** Help text under the control, tied by aria-describedby. Hidden while an error shows. */
  hint?: ReactNode;
  /** Error message under the control, announced (role="alert") and tied by
   *  aria-describedby. Also sets aria-invalid on the control. */
  error?: ReactNode;
  /** Shows a quiet "Optional" tag after the label. */
  optional?: boolean;
  /** Marks the control required: `required` and `aria-required` on it, and a "*" after
   *  the label (hidden from screen readers, which hear "required" from the control). */
  required?: boolean;
  /** The control's id. Leave it out and Field gives the control one (or uses the id the
   *  control already has). */
  htmlFor?: string;
  /** stack: label above the control (forms). inline: a small label to the left, for
   *  settings panels and filters. */
  layout?: 'stack' | 'inline';
  /** Width of the label column in the inline layout. Any CSS length; default 7rem. */
  labelWidth?: string;
  /** One control: Input, Select, Textarea, SearchInput, Checkbox, Switch, Combobox,
   *  Segmented or a native element. */
  children: ReactNode;
}

/** A labelled form row: label, one control, and its hint or error, all wired up for
 *  screen readers (id, aria-describedby, aria-invalid, aria-required). */
export function Field({
  ref,
  label,
  hint,
  error,
  optional = false,
  required = false,
  htmlFor,
  layout = 'stack',
  labelWidth = '7rem',
  children,
  className,
  style,
  ...rest
}: FieldProps) {
  const auto = useId();
  const strings = useStrings(FIELD_STRINGS);
  const only = Children.count(children) === 1 && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const childId = only && typeof only.props.id === 'string' ? (only.props.id as string) : undefined;
  const controlId = htmlFor ?? childId ?? `${auto}-control`;
  const hasError = error != null && error !== false && error !== '';
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy = [only?.props['aria-describedby'] as string | undefined, hasError ? errorId : hint != null ? hintId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  // Only ARIA attributes are cloned on: `invalid` is a prop of some shared controls and an
  // unknown attribute on others, and aria-invalid reaches every one of them.
  const control = only
    ? cloneElement(only, {
        id: htmlFor ?? childId ?? controlId,
        'aria-describedby': describedBy,
        ...(hasError ? { 'aria-invalid': true } : null),
        ...(required ? { required: true, 'aria-required': true } : null),
      })
    : children;

  const inline = layout === 'inline';
  const labelEl = (
    <label
      id={`${controlId}-label`}
      htmlFor={controlId}
      className={cn(
        'flex flex-wrap items-baseline gap-x-1.5',
        inline ? 'text-xs text-th-hi3 pointer-coarse:min-h-11 pointer-coarse:items-center' : 'text-sm font-medium text-th-hi',
      )}
    >
      <span>
        {label}
        {required ? (
          <span aria-hidden="true" data-nish-required="" className="ms-0.5 text-th-loss">
            *
          </span>
        ) : null}
      </span>
      {optional && !required ? <span className="text-xs font-normal text-th-hi3">{strings.optional}</span> : null}
    </label>
  );
  const message = hasError ? (
    <p id={errorId} role="alert" className="text-xs text-th-loss">
      {error}
    </p>
  ) : hint != null ? (
    <p id={hintId} className="text-xs text-th-hi3">
      {hint}
    </p>
  ) : null;

  if (inline) {
    return (
      <div
        {...rest}
        ref={ref}
        className={cn('grid items-center gap-x-3 gap-y-1', className)}
        style={{ ...style, gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }}
      >
        {labelEl}
        <div className="min-w-0">{control}</div>
        {message ? <div className="col-start-2">{message}</div> : null}
      </div>
    );
  }
  return (
    <div {...rest} ref={ref} style={style} className={cn('grid w-full gap-1.5', className)}>
      {labelEl}
      {control}
      {message}
    </div>
  );
}

// --- FieldGroup -------------------------------------------------------------------

export interface FieldGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** The fieldset element. */
  ref?: Ref<HTMLFieldSetElement>;
  /** The group's visible name, in sentence case ("Work mode"). Rendered as the
   *  fieldset's <legend>, styled like Field's stack label. */
  label: ReactNode;
  /** Help text under the controls, tied to the fieldset by aria-describedby. Hidden
   *  while an error shows. */
  hint?: ReactNode;
  /** Error message under the controls, announced (role="alert") and tied by
   *  aria-describedby. */
  error?: ReactNode;
  /** Shows a quiet "Optional" tag after the label. */
  optional?: boolean;
  /** Several controls: a ChipGroup, a city and state pair, a column of Checkboxes. */
  children: ReactNode;
}

/** Field for a group of controls: a <fieldset> whose <legend> looks like Field's label,
 *  with the hint or error tied to the whole group. Use Field when there is exactly one
 *  control to label. */
export function FieldGroup({ ref, label, hint, error, optional = false, className, children, ...rest }: FieldGroupProps) {
  const auto = useId();
  const strings = useStrings(FIELD_STRINGS);
  const hasError = error != null && error !== false && error !== '';
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy =
    [rest['aria-describedby'], hasError ? errorId : hint != null ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset {...rest} ref={ref} aria-describedby={describedBy} className={cn('m-0 grid min-w-0 gap-1.5 border-0 p-0', className)}>
      <legend className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 p-0 text-sm font-medium text-th-hi">
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-th-hi3">{strings.optional}</span> : null}
      </legend>
      {children}
      {hasError ? (
        <p id={errorId} role="alert" className="text-xs text-th-loss">
          {error}
        </p>
      ) : hint != null ? (
        <p id={hintId} className="text-xs text-th-hi3">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

// --- SearchInput ------------------------------------------------------------------

const SEARCH_SIZE = {
  xs: 'h-7 text-2xs pointer-coarse:text-base',
  sm: 'h-8 text-xs pointer-coarse:text-base',
  md: 'h-9 text-sm pointer-coarse:text-base',
} as const;

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'size' | 'type'> {
  /** The `<input>` element. */
  ref?: Ref<HTMLInputElement>;
  /** The query, when you keep it yourself. Leave it out for an uncontrolled field. */
  value?: string;
  /** The starting query of an uncontrolled field. */
  defaultValue?: string;
  /** Called with the new query on typing, on Clear and on Escape. */
  onChange?: (value: string, event?: ChangeEvent<HTMLInputElement>) => void;
  /** Also called after Clear or Escape empties the field (e.g. to reset results). */
  onClear?: () => void;
  /** md: 36px, sm: 32px, xs: 28px (dense toolbars). All 44px with 16px text on touch screens. */
  size?: 'xs' | 'sm' | 'md';
  /** field: the standard bordered field. bare: no border or fill, for a search bar
   *  inside a header that already draws the box. The focus ring stays. */
  variant?: 'field' | 'bare';
  /** Names the field when there is no visible label: "Search jobs". */
  'aria-label'?: string;
  /** Class for the wrapper (width, margins). */
  className?: string;
  /** Class for the <input> itself. */
  inputClassName?: string;
  /** Accessible name of the Clear button. Default from NishProvider strings ("Clear search"). */
  clearLabel?: string;
}

/** A search field: leading search icon, a Clear button while it has a value, and
 *  Escape to clear. type="search" with the Search key on phone keyboards. `ref` and the
 *  remaining props go to the `<input>`; `className` goes to the wrapper. */
export function SearchInput({
  ref,
  value: valueProp,
  defaultValue = '',
  onChange,
  onClear,
  size = 'md',
  variant = 'field',
  className,
  inputClassName,
  onKeyDown,
  placeholder,
  clearLabel,
  disabled,
  ...rest
}: SearchInputProps) {
  const strings = useStrings(FIELD_STRINGS);
  const inner = useRef<HTMLInputElement | null>(null);
  const [own, setOwn] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : own;
  useFormReset(inner, () => {
    if (!controlled) setOwn(defaultValue);
  });
  const set = (next: string, event?: ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setOwn(next);
    onChange?.(next, event);
  };
  const clear = () => {
    set('');
    onClear?.();
  };
  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <SearchIcon
        size={size === 'md' ? 16 : 14}
        className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3', size === 'xs' ? 'start-2' : 'start-2.5')}
      />
      <Input
        {...rest}
        ref={(node) => {
          inner.current = node;
          setRef(ref, node);
        }}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder ?? strings.search}
        disabled={disabled}
        onChange={(e) => set(e.target.value, e)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === 'Escape' && value) {
            // Clear first; a second Escape reaches the dialog or page behind.
            e.preventDefault();
            e.stopPropagation();
            clear();
          }
        }}
        className={cn(
          SEARCH_SIZE[size],
          size === 'xs' ? 'ps-7' : size === 'sm' ? 'ps-8' : 'ps-9',
          value ? 'pe-8 pointer-coarse:pe-11' : size === 'xs' ? 'pe-2' : 'pe-3',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          variant === 'bare' && 'border-transparent bg-transparent hover:border-transparent focus:border-transparent',
          inputClassName,
        )}
      />
      {value && !disabled ? (
        <IconButton
          label={clearLabel ?? strings.clearSearch}
          size="xs"
          onClick={() => {
            clear();
            inner.current?.focus();
          }}
          className="absolute end-1 top-1/2 -translate-y-1/2"
        >
          <XIcon size={14} />
        </IconButton>
      ) : null}
    </div>
  );
}

// --- Chip and ChipGroup -----------------------------------------------------------

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The chip's button. For `variant="tag"` the chip is a `<span>` and this ref (and the
   *  remaining props) go to that span. */
  ref?: Ref<HTMLButtonElement>;
  /** toggle: an on/off filter (`aria-pressed`). suggestion: a dashed "+ add this" chip.
   *  tag: a static label (a <span>) with an optional remove button. */
  variant?: ChipVariant;
  /** Toggle chips only: whether the filter is on. Sets aria-pressed. */
  pressed?: boolean;
  /** Tag chips only: shows a remove button that calls this. */
  onRemove?: () => void;
  /** Accessible name of the remove button. Default "Remove <children>" when the chip's
   *  text is a plain string, else "Remove" (from NishProvider strings). */
  removeLabel?: string;
  /** Leading icon (14px for sm, 16px for md). Suggestion chips show "+" when unset. */
  icon?: ReactNode;
  /** Trailing content inside the chip: a count, a caret. */
  trailing?: ReactNode;
  /** md: 32px, sm: 28px. Both reach 44px on touch screens. */
  size?: 'sm' | 'md';
}

/** A compact pill for multi-select filters (toggle), quick suggestions and removable
 *  tags. For one choice among several, use Segmented instead. */
export function Chip({ ref, variant = 'toggle', pressed, onRemove, removeLabel, icon, trailing, size = 'md', className, children, type = 'button', ...rest }: ChipProps) {
  const strings = useStrings(FIELD_STRINGS);
  if (variant === 'tag') {
    const name = removeLabel ?? (typeof children === 'string' ? strings.removeNamed(children) : strings.remove);
    // A tag is a span: the button-only attributes in `rest` are dropped by the DOM.
    const spanProps = rest as unknown as HTMLAttributes<HTMLSpanElement>;
    return (
      <span
        {...spanProps}
        ref={ref as unknown as Ref<HTMLSpanElement>}
        className={chipClass({ variant: 'tag', size, className: cn(onRemove && (size === 'sm' ? 'pe-0.5' : 'pe-1'), className) })}
      >
        {icon}
        {children}
        {trailing}
        {onRemove ? (
          <IconButton label={name} size="xs" onClick={onRemove} className="rounded-full">
            <XIcon size={12} />
          </IconButton>
        ) : null}
      </span>
    );
  }
  const suggestion = variant === 'suggestion';
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-pressed={suggestion ? undefined : !!pressed}
      data-state={suggestion ? undefined : pressed ? 'active' : 'inactive'}
      data-disabled={rest.disabled ? '' : undefined}
      className={chipClass({
        variant: suggestion ? 'suggestion' : 'toggle',
        pressed: !!pressed,
        size,
        className: cn('disabled:pointer-events-none disabled:opacity-50 forced-colors:disabled:text-[color:GrayText]', className),
      })}
    >
      {icon ?? (suggestion ? <PlusIcon size={size === 'sm' ? 12 : 14} /> : null)}
      {children}
      {trailing}
    </button>
  );
}

export interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** The wrapper element. */
  ref?: Ref<HTMLDivElement>;
  /** Names the group for screen readers: "Filter by status". */
  label: string;
  /** On phones, one row that scrolls sideways instead of wrapping. */
  scroll?: boolean;
  children: ReactNode;
}

/** A labelled row of Chips (role="group"). Wraps by default. The arrow keys move focus
 *  between the chips (mirrored in a right-to-left layout); each chip stays a Tab stop. */
export function ChipGroup({ ref, label, scroll = false, className, children, onKeyDown, ...rest }: ChipGroupProps) {
  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-label={label}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const rtl = isRtl(e.currentTarget);
        const next = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight') ? 1 : e.key === (rtl ? 'ArrowRight' : 'ArrowLeft') ? -1 : 0;
        const home = e.key === 'Home';
        const end = e.key === 'End';
        if (!next && !home && !end) return;
        const chips = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const at = chips.indexOf(e.target as HTMLButtonElement);
        if (at < 0) return;
        e.preventDefault();
        const to = home ? 0 : end ? chips.length - 1 : (at + next + chips.length) % chips.length;
        chips[to]?.focus();
      }}
      className={cn(
        'flex flex-wrap items-center gap-2',
        scroll && 'max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:py-1 scrollbar-none',
        className,
      )}
    >
      {children}
    </div>
  );
}
