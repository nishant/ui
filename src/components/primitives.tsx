import { forwardRef, useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';
import { ChevronDownIcon, LoaderIcon } from './icons';

// Controls grow to the 44px tap target on touch screens (pointer-coarse) and stay
// compact under a mouse, so dense desktop tables keep their density.

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-th-accent text-th-on-accent hover:bg-th-accent/90 active:bg-th-accent/80',
  secondary: 'border border-th-line-strong bg-th-surface text-th-hi hover:bg-th-elevated',
  ghost: 'text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
  danger: 'bg-th-loss text-th-on-loss hover:bg-th-loss/90 active:bg-th-loss/80',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-xs pointer-coarse:min-h-11',
  md: 'h-9 gap-2 px-3.5 text-sm pointer-coarse:min-h-11',
  lg: 'h-11 gap-2 px-5 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: the one main action in a view. secondary: everything else. ghost:
   *  toolbars and quiet actions. danger: destructive actions. */
  variant?: ButtonVariant;
  /** sm for dense rows and toolbars, lg for a page's main call to action. All grow to
   *  44px on touch screens. */
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Icon before the label (16px for md and lg, 12–14px for sm). Replaced by the
   *  spinner while loading. */
  icon?: ReactNode;
}

/** The standard button. Defaults to type="button", so it never submits a form by
 *  accident; pass type="submit" for the one that should. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, icon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150',
        // Disabled reads as disabled in every theme: a flat, quiet fill and faint text,
        // instead of a dimmed copy of the enabled color.
        'disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none',
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderIcon size={size === 'sm' ? 12 : 14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only button needs a name for screen readers and tooltips. */
  label: string;
  /** sm: 28px, md: 36px. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Pressed state for toggles (sets aria-pressed). */
  active?: boolean;
}

/** A square button holding only an icon, with its label as aria-label and title. */

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', active = false, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg text-th-hi3 transition-colors duration-150',
        'hover:bg-th-elevated hover:text-th-hi disabled:pointer-events-none disabled:text-th-ghost',
        'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
        size === 'sm' ? 'size-7' : 'size-9',
        active && 'bg-th-elevated text-th-hi',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the default inner padding. Off for cards that hold tables edge to edge. */
  padded?: boolean;
  /** Hover styles for cards that are links or buttons. */
  interactive?: boolean;
}

/** The surface panel every widget, table and form sits in. */

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded = true, interactive = false, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-th-line bg-th-surface shadow-card',
        padded && 'p-4 sm:p-5',
        interactive && 'transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60',
        className,
      )}
      {...rest}
    />
  );
});

type Tone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info';

const BADGE_TONE: Record<Tone, string> = {
  neutral: 'border-th-line bg-th-elevated text-th-hi2',
  accent: 'border-th-accent/30 bg-th-accent-soft text-th-accent',
  ok: 'border-th-ok/30 bg-th-ok-soft text-th-ok',
  loss: 'border-th-loss/30 bg-th-loss-soft text-th-loss',
  warn: 'border-th-warn/30 bg-th-warn-soft text-th-warn',
  info: 'border-th-info/30 bg-th-info-soft text-th-info',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Text on its own soft tint; every tone clears 4.5:1 in every theme. */
  tone?: Tone;
}

/** A small status pill: counts, states, tags. */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-4',
        BADGE_TONE[tone],
        className,
      )}
      {...rest}
    />
  );
}

const FIELD =
  'w-full min-w-0 rounded-lg border border-th-line-strong bg-th-elevated text-th-hi placeholder:text-th-ghost ' +
  'transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-th-loss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby. */
  invalid?: boolean;
}

/** Text input. 16px text on phones so iOS does not zoom the page on focus. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(FIELD, 'h-9 px-3 text-base sm:text-sm pointer-coarse:min-h-11', className)}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Red border and aria-invalid. */
  invalid?: boolean;
}

/** Multi-line text with the shared field look. 16px text on phones (no iOS zoom); it
 *  grows with its rows and the reader can resize it vertically. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(FIELD, 'block resize-y px-3 py-2 text-base leading-relaxed sm:text-sm', className)}
      {...rest}
    />
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Text beside the box; clicking it toggles the box. */
  label: ReactNode;
  /** A quieter line under the label. */
  hint?: ReactNode;
}

/** A checkbox with its label. The whole row is the 44px tap target on touch screens. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className, id, disabled, ...rest },
  ref,
) {
  const auto = useId();
  const boxId = id ?? auto;
  return (
    <label
      htmlFor={boxId}
      className={cn(
        'inline-flex cursor-pointer items-start gap-2.5 text-sm text-th-hi pointer-coarse:min-h-11 pointer-coarse:py-2.5',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        ref={ref}
        id={boxId}
        type="checkbox"
        disabled={disabled}
        className="mt-0.5 size-4 shrink-0 cursor-[inherit] rounded border-th-line-strong accent-[var(--nish-accent)]"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block leading-snug">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-th-hi3">{hint}</span> : null}
      </span>
    </label>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Red border and aria-invalid. */
  invalid?: boolean;
}

/** Native select (keeps the platform picker on phones) with the shared field look. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, ...rest },
  ref,
) {
  return (
    <span className={cn('relative inline-flex w-full min-w-0', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(FIELD, 'h-9 appearance-none pl-3 pr-8 text-base sm:text-sm pointer-coarse:min-h-11')}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-th-hi3" />
    </span>
  );
});

/** Small uppercase label for form fields and section headings. */
export function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-xs font-medium uppercase tracking-wider text-th-hi3', className)} {...rest} />;
}
