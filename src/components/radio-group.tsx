'use client';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { isRtl, useIsoLayoutEffect } from './client';

interface RadioContextValue {
  name: string | undefined;
  /** The selected value: the controlled prop, else the internal mirror of the DOM. */
  current: string | undefined;
  controlled: boolean;
  defaultValue: string | undefined;
  disabled: boolean;
  required: boolean;
  invalid: boolean;
  select: (value: string) => void;
}

const RadioContext = /* @__PURE__ */ createContext<RadioContextValue | null>(null);

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** The id of the `<label for=id>` outside the control (a Field's label), so a non-labelable
 *  root (role=radiogroup) can be named with aria-labelledby. Gives that label an id if it has none. */
function useExternalLabelId(root: { current: HTMLElement | null }, id: string | undefined, skip: boolean): string | undefined {
  const [labelId, setLabelId] = useState<string | undefined>(undefined);
  useIsoLayoutEffect(() => {
    const doc = root.current?.ownerDocument;
    if (skip || !id || !doc) {
      setLabelId(undefined);
      return;
    }
    const label = Array.from(doc.getElementsByTagName('label')).find((l) => l.htmlFor === id);
    if (!label) {
      setLabelId(undefined);
      return;
    }
    if (!label.id) label.id = `${id}-label`;
    setLabelId(label.id);
  }, [id, skip]);
  return labelId;
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  /** A quieter line under the label, linked by aria-describedby. */
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
  /** The selected value (controlled). */
  value?: string;
  /** The initially selected value (uncontrolled). */
  defaultValue?: string;
  /** Called with the new value when the selection changes. */
  onValueChange?: (value: string) => void;
  /** The form field name every radio posts under. Defaults to a generated name, so the
   *  radios always form one native group. */
  name?: string;
  /** Radios to render from data. Use `<Radio>` children instead for custom layouts. */
  options?: RadioOption[];
  /** vertical (default) stacks the radios; horizontal lays them in a wrapping row. */
  orientation?: 'vertical' | 'horizontal';
  /** Disables every radio. */
  disabled?: boolean;
  /** Marks the group required (aria-required, and native validation on the inputs). */
  required?: boolean;
  /** Red radios and aria-invalid. Field sets it from its `error`. */
  invalid?: boolean;
  /** `<Radio>` children, used when `options` is not given. */
  children?: ReactNode;
  /** The `role="radiogroup"` element. */
  ref?: Ref<HTMLDivElement>;
}

/** A group of native radio buttons. Posts in FormData, works with react-hook-form's
 *  `register` (leave `value` out and put `register(...)` on each `<Radio>`), and follows the
 *  APG radio group keyboard model: the arrows move and select, mirrored in right-to-left. */
export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  name,
  options,
  orientation = 'vertical',
  disabled = false,
  required = false,
  invalid = false,
  className,
  children,
  ref,
  id,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: RadioGroupProps) {
  const auto = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value : inner;
  const fieldLabelId = useExternalLabelId(rootRef, id, ariaLabel != null || ariaLabelledBy != null);

  const select = useCallback(
    (next: string) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
    let dir = 0;
    if (e.key === 'ArrowDown') dir = 1;
    else if (e.key === 'ArrowUp') dir = -1;
    else if (e.key === 'ArrowRight') dir = isRtl(e.currentTarget) ? -1 : 1;
    else if (e.key === 'ArrowLeft') dir = isRtl(e.currentTarget) ? 1 : -1;
    if (!dir) return;
    const radios = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]')).filter((r) => !r.disabled);
    const at = radios.indexOf(target);
    if (at < 0 || radios.length < 2) return;
    e.preventDefault();
    const next = radios[(at + dir + radios.length) % radios.length]!;
    next.focus();
    next.click();
  };

  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true';
  const ctx: RadioContextValue = {
    name: name ?? `${auto}-radio`,
    current,
    controlled,
    defaultValue,
    disabled,
    required,
    invalid: isInvalid,
    select,
  };

  return (
    <RadioContext.Provider value={ctx}>
      <div
        {...rest}
        ref={(node) => {
          rootRef.current = node;
          setRef(ref, node);
        }}
        id={id}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy ?? fieldLabelId}
        aria-required={required || undefined}
        aria-invalid={isInvalid || undefined}
        aria-disabled={disabled || undefined}
        data-orientation={orientation}
        data-disabled={disabled ? '' : undefined}
        onKeyDown={handleKeyDown}
        className={cn('flex gap-1', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-5', className)}
      >
        {options
          ? options.map((o) => (
              <Radio key={o.value} value={o.value} label={o.label} description={o.description} disabled={o.disabled} />
            ))
          : children}
      </div>
    </RadioContext.Provider>
  );
}

export interface RadioProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'value' | 'checked' | 'defaultChecked' | 'size' | 'children' | 'className'> {
  /** The value this radio posts and selects. */
  value: string;
  /** The visible label. Clicking it selects the radio. Without one, pass aria-label. */
  label?: ReactNode;
  /** A quieter line under the label, linked by aria-describedby. */
  description?: ReactNode;
  /** Classes for the label row. */
  className?: string;
  /** The native `<input type="radio">` (so `register(...)` from react-hook-form can attach). */
  ref?: Ref<HTMLInputElement>;
}

/** One radio inside a RadioGroup: a native input, a drawn circle, a label and an optional
 *  description. The whole row is a 44px target on touch screens. */
export function Radio({ value, label, description, className, disabled, required, name, onChange, ref, ...rest }: RadioProps) {
  const ctx = useContext(RadioContext);
  const descId = useId();
  const off = disabled === true || ctx?.disabled === true;
  const checkedProps = ctx ? (ctx.controlled ? { checked: ctx.current === value } : { defaultChecked: ctx.defaultValue === value }) : null;
  return (
    <label
      data-state={ctx ? (ctx.current === value ? 'checked' : 'unchecked') : undefined}
      data-disabled={off ? '' : undefined}
      className={cn(
        'relative flex cursor-pointer items-start gap-2.5 py-1 pointer-coarse:min-h-11 pointer-coarse:items-center',
        off && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        {...rest}
        {...checkedProps}
        ref={ref}
        type="radio"
        value={value}
        name={name ?? ctx?.name}
        disabled={off}
        required={required ?? ctx?.required}
        aria-describedby={description != null ? descId : rest['aria-describedby']}
        onChange={(e) => {
          onChange?.(e);
          if (e.target.checked) ctx?.select(value);
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-th-line-control bg-th-elevated pointer-coarse:mt-0',
          'transition-colors duration-150 after:block after:size-2 after:scale-0 after:rounded-full after:bg-th-accent after:content-[""]',
          'after:transition-transform after:duration-150 motion-reduce:after:transition-none',
          'peer-checked:border-th-accent peer-checked:after:scale-100 peer-focus-visible:ring-2 peer-focus-visible:ring-th-accent/40',
          ctx?.invalid && 'border-th-loss',
          'forced-colors:forced-color-adjust-none forced-colors:border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:after:bg-[Highlight]',
          'forced-colors:peer-checked:border-[Highlight] forced-colors:peer-focus-visible:outline forced-colors:peer-focus-visible:outline-2 forced-colors:peer-focus-visible:outline-[Highlight]',
          'forced-colors:peer-disabled:border-[GrayText] forced-colors:peer-disabled:after:bg-[GrayText]',
        )}
      />
      {label != null || description != null ? (
        <span className="min-w-0">
          {label != null ? <span className="block text-sm leading-snug text-th-hi">{label}</span> : null}
          {description != null ? (
            <span id={descId} className="mt-0.5 block text-xs text-th-hi3">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}
