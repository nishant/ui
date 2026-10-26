import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type SVGProps,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../cn';
import { FIELD, IconButton, Input } from './primitives';
import { XIcon } from './icons';

// Form controls: Textarea, Checkbox, Switch, Field, SearchInput, Chip and ChipGroup.
// Every interactive control grows to the 44px tap target on touch screens
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

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

// --- Textarea ---------------------------------------------------------------------

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, size = 'md', autoGrow = false, className, rows = 4, value, onInput, ...rest },
  ref,
) {
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
});

// --- Checkbox ---------------------------------------------------------------------

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Text beside the box; clicking it toggles the box. Optional when the box has an
   *  aria-label instead (a table row's select box). */
  label?: ReactNode;
  /** A quieter line under the label. */
  hint?: ReactNode;
  /** The "some but not all" state of a select-all box. Set through the DOM property, so
   *  screen readers announce it as mixed. Clicking still toggles `checked`. */
  indeterminate?: boolean;
  /** A right-aligned slot on the same row (a price, a count). The row then fills its
   *  container's width. */
  trailing?: ReactNode;
  /** md: 16px box, 14px text. sm: 14px box, 12px text for dense lists. The row is the
   *  44px tap target on touch screens either way. */
  size?: 'sm' | 'md';
}

/** A checkbox with its label. The box is drawn from theme roles (its unchecked border
 *  reads in light themes too), and the whole row is the 44px tap target on touch. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, indeterminate = false, trailing, size = 'md', className, id, disabled, ...rest },
  ref,
) {
  const auto = useId();
  const boxId = id ?? auto;
  const inner = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const sm = size === 'sm';
  return (
    <label
      htmlFor={boxId}
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
          ref={(node) => {
            inner.current = node;
            setRef(ref, node);
          }}
          id={boxId}
          type="checkbox"
          disabled={disabled}
          className={cn(
            'peer m-0 shrink-0 cursor-[inherit] appearance-none rounded border border-th-line-strong bg-th-surface transition-colors',
            'checked:border-th-accent checked:bg-th-accent indeterminate:border-th-accent indeterminate:bg-th-accent',
            sm ? 'size-3.5' : 'size-4',
          )}
          {...rest}
        />
        <CheckIcon
          size={sm ? 10 : 12}
          className="pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-checked:block peer-indeterminate:hidden"
        />
        <MinusIcon size={sm ? 10 : 12} className="pointer-events-none absolute inset-0 m-auto hidden text-th-on-accent peer-indeterminate:block" />
      </span>
      {label != null || hint != null ? (
        <span className="min-w-0">
          {label != null ? <span className="block leading-snug">{label}</span> : null}
          {hint ? <span className="mt-0.5 block text-xs text-th-hi3">{hint}</span> : null}
        </span>
      ) : null}
      {trailing != null ? <span className="ml-auto shrink-0 pl-2 text-th-hi2 tabular-nums">{trailing}</span> : null}
    </label>
  );
});

// --- Switch -----------------------------------------------------------------------

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'type' | 'value'> {
  /** On or off. Switch is controlled: keep the state and update it from onChange. */
  checked: boolean;
  /** Called with the new value when the switch is clicked or toggled with Space/Enter. */
  onChange: (checked: boolean, event: MouseEvent<HTMLButtonElement>) => void;
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
 *  waits for Save; use Checkbox for that). A `<button role="switch" aria-checked>`. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, label, description, size = 'md', labelSide = 'start', disabled, className, id, onClick, ...rest },
  ref,
) {
  const auto = useId();
  const btnId = id ?? `${auto}-switch`;
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const sm = size === 'sm';
  const button = (
    <button
      ref={ref}
      id={btnId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label != null ? labelId : rest['aria-labelledby']}
      aria-describedby={description != null ? descId : rest['aria-describedby']}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onChange(!checked, e);
      }}
      className={cn(
        'group relative inline-flex shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50',
        'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        label == null && className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex items-center rounded-full p-0.5 transition-colors duration-150',
          sm ? 'h-4 w-7' : 'h-5 w-9',
          checked ? 'bg-th-accent' : 'bg-th-line-strong',
        )}
      >
        <span
          className={cn(
            'rounded-full shadow-card transition-transform duration-150 motion-reduce:transition-none',
            sm ? 'size-3' : 'size-4',
            checked ? (sm ? 'translate-x-3 bg-th-on-accent' : 'translate-x-4 bg-th-on-accent') : 'translate-x-0 bg-th-surface',
          )}
        />
      </span>
    </button>
  );
  if (label == null) return button;
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
    <label
      htmlFor={btnId}
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
  );
});

// --- Field ------------------------------------------------------------------------

export interface FieldProps {
  /** The visible label, in sentence case ("Email address"). Rendered as a real <label>
   *  tied to the control. */
  label: ReactNode;
  /** Help text under the control, tied by aria-describedby. Hidden while an error shows. */
  hint?: ReactNode;
  /** Error message under the control, announced (role="alert") and tied by
   *  aria-describedby. Also sets invalid / aria-invalid on the control. */
  error?: ReactNode;
  /** Shows a quiet "Optional" tag after the label. */
  optional?: boolean;
  /** The control's id. Leave it out and Field gives the control one (or uses the id the
   *  control already has). */
  htmlFor?: string;
  /** stack: label above the control (forms). inline: a small label to the left, for
   *  settings panels and filters. */
  layout?: 'stack' | 'inline';
  /** Width of the label column in the inline layout. Any CSS length; default 7rem. */
  labelWidth?: string;
  /** One control: Input, Select, Textarea, SearchInput or a native element. */
  children: ReactNode;
  className?: string;
}

/** A labelled form row: label, one control, and its hint or error, all wired up for
 *  screen readers (id, aria-describedby, aria-invalid). */
export function Field({ label, hint, error, optional = false, htmlFor, layout = 'stack', labelWidth = '7rem', children, className }: FieldProps) {
  const auto = useId();
  const only = Children.count(children) === 1 && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const childId = only && typeof only.props.id === 'string' ? (only.props.id as string) : undefined;
  const controlId = htmlFor ?? childId ?? `${auto}-control`;
  const hasError = error != null && error !== false && error !== '';
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy = [only?.props['aria-describedby'] as string | undefined, hasError ? errorId : hint != null ? hintId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  const control = only
    ? cloneElement(only, {
        id: htmlFor ?? childId ?? controlId,
        'aria-describedby': describedBy,
        ...(hasError ? { 'aria-invalid': true } : null),
        // Shared components take `invalid`; native elements would warn on it.
        ...(hasError && typeof only.type !== 'string' ? { invalid: true } : null),
      })
    : children;

  const inline = layout === 'inline';
  const labelEl = (
    <label
      htmlFor={controlId}
      className={cn(
        'flex flex-wrap items-baseline gap-x-1.5',
        inline ? 'text-xs text-th-hi3 pointer-coarse:min-h-11 pointer-coarse:items-center' : 'text-sm font-medium text-th-hi',
      )}
    >
      <span>{label}</span>
      {optional ? <span className="text-xs font-normal text-th-hi3">Optional</span> : null}
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
      <div className={cn('grid items-center gap-x-3 gap-y-1', className)} style={{ gridTemplateColumns: `${labelWidth} minmax(0, 1fr)` }}>
        {labelEl}
        <div className="min-w-0">{control}</div>
        {message ? <div className="col-start-2">{message}</div> : null}
      </div>
    );
  }
  return (
    <div className={cn('grid w-full gap-1.5', className)}>
      {labelEl}
      {control}
      {message}
    </div>
  );
}

// --- FieldGroup -------------------------------------------------------------------

export interface FieldGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
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
export function FieldGroup({ label, hint, error, optional = false, className, children, ...rest }: FieldGroupProps) {
  const auto = useId();
  const hasError = error != null && error !== false && error !== '';
  const hintId = `${auto}-hint`;
  const errorId = `${auto}-error`;
  const describedBy =
    [rest['aria-describedby'], hasError ? errorId : hint != null ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset {...rest} aria-describedby={describedBy} className={cn('m-0 grid min-w-0 gap-1.5 border-0 p-0', className)}>
      <legend className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 p-0 text-sm font-medium text-th-hi">
        <span>{label}</span>
        {optional ? <span className="text-xs font-normal text-th-hi3">Optional</span> : null}
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

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'type'> {
  /** The query. SearchInput is controlled. */
  value: string;
  /** Called with the new query on typing, on Clear and on Escape. */
  onChange: (value: string, event?: ChangeEvent<HTMLInputElement>) => void;
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
}

/** A search field: leading search icon, a Clear button while it has a value, and
 *  Escape to clear. type="search" with the Search key on phone keyboards. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, onClear, size = 'md', variant = 'field', className, inputClassName, onKeyDown, placeholder = 'Search', disabled, ...rest },
  ref,
) {
  const inner = useRef<HTMLInputElement | null>(null);
  const clear = () => {
    onChange('');
    onClear?.();
  };
  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <SearchIcon
        size={size === 'md' ? 16 : 14}
        className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3', size === 'xs' ? 'left-2' : 'left-2.5')}
      />
      <Input
        ref={(node) => {
          inner.current = node;
          setRef(ref, node);
        }}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value, e)}
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
          size === 'xs' ? 'pl-7' : size === 'sm' ? 'pl-8' : 'pl-9',
          value ? 'pr-8 pointer-coarse:pr-11' : size === 'xs' ? 'pr-2' : 'pr-3',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          variant === 'bare' && 'border-transparent bg-transparent hover:border-transparent focus:border-transparent',
          inputClassName,
        )}
        {...rest}
      />
      {value && !disabled ? (
        <IconButton
          label="Clear search"
          size="xs"
          onClick={() => {
            clear();
            inner.current?.focus();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <XIcon size={14} />
        </IconButton>
      ) : null}
    </div>
  );
});

// --- Chip and ChipGroup -----------------------------------------------------------

type ChipVariant = 'toggle' | 'suggestion' | 'tag';

const CHIP_BASE = 'inline-flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors duration-150';
const CHIP_SIZE = { sm: 'h-7 px-2.5 text-xs', md: 'h-8 px-3 text-sm' } as const;

const CHIP_LOOK: Record<ChipVariant | 'pressed', string> = {
  toggle: 'border-th-line-strong text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
  pressed: 'border-th-accent/60 bg-th-accent-soft text-th-accent hover:bg-th-accent/20',
  suggestion: 'border-dashed border-th-line-strong text-th-hi3 hover:border-th-hi3 hover:text-th-hi',
  tag: 'border-th-line bg-th-elevated text-th-hi2',
};

export interface ChipClassOptions {
  /** The pressed (on) look of a toggle chip: the accent tint. On a link, set
   *  aria-current="page" for the active one (links take aria-current, not aria-pressed). */
  pressed?: boolean;
  /** Same variants as Chip. Default "toggle". */
  variant?: ChipVariant;
  /** md: 32px (default), sm: 28px. Both reach 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<Chip>` renders, for router links and anchors that look like chips:
 *  `<Link className={chipClass({ pressed: active })} aria-current={active ? 'page' : undefined}>`.
 *  Mirrors .nish-chip in nish-components.css. */
export function chipClass({ pressed = false, variant = 'toggle', size = 'md', className }: ChipClassOptions = {}): string {
  return cn(
    CHIP_BASE,
    CHIP_SIZE[size],
    variant !== 'tag' && 'pointer-coarse:min-h-11',
    CHIP_LOOK[variant === 'toggle' && pressed ? 'pressed' : variant],
    className,
  );
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** toggle: an on/off filter (`aria-pressed`). suggestion: a dashed "+ add this" chip.
   *  tag: a static label (a <span>) with an optional remove button. */
  variant?: ChipVariant;
  /** Toggle chips only: whether the filter is on. Sets aria-pressed. */
  pressed?: boolean;
  /** Tag chips only: shows a remove button that calls this. */
  onRemove?: () => void;
  /** Accessible name of the remove button. Default "Remove <children>" when the chip's
   *  text is a plain string, else "Remove". */
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
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { variant = 'toggle', pressed, onRemove, removeLabel, icon, trailing, size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  if (variant === 'tag') {
    const name = removeLabel ?? (typeof children === 'string' ? `Remove ${children}` : 'Remove');
    return (
      <span className={chipClass({ variant: 'tag', size, className: cn(onRemove && (size === 'sm' ? 'pr-0.5' : 'pr-1'), className) })}>
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
      ref={ref}
      type={type}
      aria-pressed={suggestion ? undefined : !!pressed}
      className={chipClass({
        variant: suggestion ? 'suggestion' : 'toggle',
        pressed: !!pressed,
        size,
        className: cn('disabled:pointer-events-none disabled:opacity-50', className),
      })}
      {...rest}
    >
      {icon ?? (suggestion ? <PlusIcon size={size === 'sm' ? 12 : 14} /> : null)}
      {children}
      {trailing}
    </button>
  );
});

export interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Names the group for screen readers: "Filter by status". */
  label: string;
  /** On phones, one row that scrolls sideways instead of wrapping. */
  scroll?: boolean;
  children: ReactNode;
}

/** A labelled row of Chips (role="group"). Wraps by default. */
export function ChipGroup({ label, scroll = false, className, children, ...rest }: ChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex flex-wrap items-center gap-2',
        scroll && 'max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:py-1 scrollbar-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
