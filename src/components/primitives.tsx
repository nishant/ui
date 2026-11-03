'use client';
import {
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../cn';
import { ChevronDownIcon, LoaderIcon } from './icons';
import {
  BUTTON_DISABLED,
  DOT_HUE,
  DOT_TONE,
  LINK_DISABLED,
  SELECT_SIZE,
  badgeClass,
  buttonClass,
  cardClass,
  fieldClass,
  iconButtonClass,
  resolvePadding,
  type BadgeHue,
  type BadgeTone,
  type ButtonSize,
  type ButtonVariant,
  type CardElement,
  type CardPadding,
  type FieldSize,
  type IconButtonSize,
  type IconButtonVariant,
} from './primitives-classes';

// The class recipes and their size/variant tables live in primitives-classes.ts (no React,
// no directive) so a server component can call them. They are re-exported here, so
// existing import paths keep working.
export {
  FIELD,
  badgeClass,
  buttonClass,
  cardClass,
  fieldClass,
  iconButtonClass,
  linkClass,
  revealClass,
} from './primitives-classes';
export type {
  BadgeClassOptions,
  BadgeHue,
  BadgeTone,
  ButtonClassOptions,
  ButtonSize,
  ButtonVariant,
  CardClassOptions,
  CardElement,
  CardPadding,
  FieldClassOptions,
  FieldSize,
  IconButtonClassOptions,
  IconButtonSize,
  IconButtonVariant,
  LinkClassOptions,
} from './primitives-classes';

/** Dev-only console warning, once per message. Bundlers replace `process.env.NODE_ENV`
 *  in app builds; where nothing does, `globalThis.process` is read so a bare browser
 *  import does not throw. */
const warned = new Set<string>();
function warnOnce(message: string): void {
  if (globalThis.process?.env?.NODE_ENV === 'production' || warned.has(message)) return;
  warned.add(message);
  console.warn(`nish-ui: ${message}`);
}

// --- Button -------------------------------------------------------------------------

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The button element. */
  ref?: Ref<HTMLButtonElement>;
  /** primary: the one main action in a view. secondary: everything else. ghost:
   *  toolbars and quiet actions. danger: destructive actions. soft: an accent action
   *  that is not the main one (replaces "accent outline" buttons). subtle: a filled,
   *  quiet button for dense toolbars and chips on a surface. link: looks like a text
   *  link and sits inline in text (no height or padding; on touch screens an invisible
   *  44px hit area, unless `inline`). */
  variant?: ButtonVariant;
  /** xs for dense tool rows (24px), sm for dense rows and toolbars, lg for a page's
   *  main call to action. xs, sm and md grow to 44px on touch screens. */
  size?: ButtonSize;
  /** Link variant only: skip the 44px touch hit area, for a link inside running text. */
  inline?: boolean;
  /** Shows a spinner, disables the button and sets aria-busy. */
  loading?: boolean;
  /** Icon before the label (16px for md and lg, 12–14px for xs and sm). Replaced by the
   *  spinner while loading. */
  icon?: ReactNode;
}

/** The standard button. Defaults to type="button", so it never submits a form by
 *  accident; pass type="submit" for the one that should. */
export function Button({
  variant = 'secondary',
  size = 'md',
  inline = false,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  const off = !!disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={off}
      aria-busy={loading || undefined}
      data-disabled={off ? '' : undefined}
      className={buttonClass({
        variant,
        size,
        inline,
        className: cn(variant === 'link' ? LINK_DISABLED : BUTTON_DISABLED, className),
      })}
      {...rest}
    >
      {loading ? (
        <LoaderIcon
          size={size === 'xs' || size === 'sm' ? 12 : 14}
          className="animate-spin motion-reduce:animate-pulse"
          data-nish-spin=""
        />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

// --- IconButton ---------------------------------------------------------------------

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The button element. */
  ref?: Ref<HTMLButtonElement>;
  /** Required: an icon-only button needs a name for screen readers and tooltips. It is
   *  also the title, so tests that query by title keep working. */
  label: string;
  /** 2xs: 20px (row-level reveal actions, 22px widget title bars; under a mouse its hit
   *  area is 24px), xs: 24px (dense headers), sm: 28px, md: 36px. All grow to 44px on
   *  touch screens. */
  size?: IconButtonSize;
  /** Pressed state for toggles (sets aria-pressed). */
  active?: boolean;
  /** ghost: no fill until hover (default). subtle: a quiet filled square for toolbars on
   *  a surface. soft: an accent tint for the highlighted action. */
  variant?: IconButtonVariant;
  /** danger: hover and pressed turn loss-red, for delete and remove actions. (Button's
   *  destructive look is `variant="danger"`; an icon button keeps the tone.) */
  tone?: 'neutral' | 'danger';
}

/** A square button holding only an icon, with its label as aria-label and title. */
export function IconButton({
  label,
  size = 'md',
  active,
  variant = 'ghost',
  tone = 'neutral',
  className,
  children,
  type = 'button',
  disabled,
  ref,
  ...rest
}: IconButtonProps) {
  if (!label && !rest['aria-label'] && !rest['aria-labelledby']) {
    warnOnce('<IconButton> has no `label`. An icon-only button needs an accessible name.');
  }
  const pressed = active === true;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={pressed || undefined}
      data-state={active === undefined ? undefined : pressed ? 'active' : 'inactive'}
      data-disabled={disabled ? '' : undefined}
      className={iconButtonClass({ size, variant, tone, active: pressed, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

// --- Card and CardHeader ------------------------------------------------------------

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The header row element. */
  ref?: Ref<HTMLDivElement>;
  /** The card's heading. */
  title: ReactNode;
  /** A quieter line under the title. */
  description?: ReactNode;
  /** End-aligned slot (right in left-to-right layouts): a Button, an IconButton, a Badge,
   *  a Segmented. It wraps under the title on narrow cards. */
  action?: ReactNode;
  /** A small icon before the title (16px). */
  icon?: ReactNode;
  /** The heading level. Default "h2". */
  as?: 'h2' | 'h3' | 'h4';
  /** A bottom border and its own padding (px-4 py-3), for unpadded cards whose content
   *  runs edge to edge (tables, lists, widgets). */
  divided?: boolean;
  /** id for the heading element, so a section can point aria-labelledby at it. */
  titleId?: string;
}

/** The header row of a card: title, optional description and icon, and an action slot. */
export function CardHeader({
  title,
  description,
  action,
  icon,
  as: Heading = 'h2',
  divided = false,
  titleId,
  className,
  ref,
  ...rest
}: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-2',
        divided && 'border-b border-th-line px-4 py-3',
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-start gap-2">
        {icon ? (
          <span className="mt-0.5 inline-flex shrink-0 text-th-hi3" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <Heading id={titleId} className="text-sm font-semibold text-th-hi">
            {title}
          </Heading>
          {description ? <p className="mt-0.5 text-xs text-th-hi3">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The card element (whatever `as` renders). */
  ref?: Ref<HTMLElement>;
  /** The element to render. Use section or article for a titled region, li inside a list. */
  as?: CardElement;
  /** Inner padding: sm p-3, md p-4 (p-5 from 640px; the default), lg p-6, none for
   *  tables and lists that run edge to edge. Use this, not className="p-3", which would
   *  keep md's sm:p-5. */
  padding?: CardPadding;
  /** Kept from v0.2: false is the same as padding="none". padding wins when both are set. */
  padded?: boolean;
  /** Hover styles for cards that are links or buttons. */
  interactive?: boolean;
  /** surface: the bordered panel with the card shadow (default). inset: bg-th-elevated,
   *  no border color, no shadow and rounded-lg, for a box inside another card. */
  variant?: 'surface' | 'inset';
  /** Renders a CardHeader first. On an unpadded card the header is divided (its own
   *  padding and a bottom border). */
  title?: ReactNode;
  /** The header's description; only with title. */
  description?: ReactNode;
  /** The header's end-aligned action slot; only with title. */
  action?: ReactNode;
}

/** The surface panel every widget, table and form sits in. */
export function Card({
  as = 'div',
  padding,
  padded,
  interactive = false,
  variant = 'surface',
  title,
  description,
  action,
  className,
  children,
  ref,
  ...rest
}: CardProps) {
  const Tag = as as 'div';
  const pad = resolvePadding(padding, padded);
  const headingId = useId();
  const region = title != null && (as === 'section' || as === 'article' || as === 'aside');
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      aria-labelledby={region && !rest['aria-label'] && !rest['aria-labelledby'] ? headingId : undefined}
      className={cardClass({ padding: pad, interactive, variant, className })}
      {...rest}
    >
      {title != null ? (
        <CardHeader
          title={title}
          description={description}
          action={action}
          titleId={headingId}
          divided={pad === 'none'}
          className={pad === 'none' ? undefined : 'mb-3'}
        />
      ) : null}
      {children}
    </Tag>
  );
}

// --- Badge --------------------------------------------------------------------------

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** The badge element. */
  ref?: Ref<HTMLSpanElement>;
  /** Text on its own soft tint; every tone clears 4.5:1 in every theme. on-accent: a
   *  small label inside a solid accent fill (a primary Button, an accent link), in the
   *  on-accent color over a 20% on-accent tint. It has no hover state; pair a short
   *  label with sr-only text that says what it means. */
  tone?: BadgeTone;
  /** A color with no meaning (stores, categories, tags): the hue's soft tint with hi
   *  text, so it reads in every theme. Overrides tone. */
  hue?: BadgeHue;
  /** sm: the default 12px pill. xs: 10px text for dense rows and table cells. */
  size?: 'xs' | 'sm';
  /** pill: rounded (default). tag: square corners, no border, bold uppercase, for
   *  tag-shaped labels ("CALL", "NEW"). */
  variant?: 'pill' | 'tag';
  /** A leading 6px status dot in the tone's fill (or the hue). Pair it with text that
   *  says the state; the dot itself is hidden from screen readers. */
  dot?: boolean;
}

/** A small status pill: counts, states, tags. */
export function Badge({
  tone = 'neutral',
  hue,
  size = 'sm',
  variant = 'pill',
  dot = false,
  className,
  children,
  ref,
  ...rest
}: BadgeProps) {
  return (
    <span ref={ref} className={badgeClass({ tone, hue, size, variant, className })} {...rest}>
      {dot ? (
        <span aria-hidden="true" className={cn('inline-block size-1.5 shrink-0 rounded-full', hue ? DOT_HUE[hue] : DOT_TONE[tone])} />
      ) : null}
      {children}
    </span>
  );
}

// --- Fields: Input, Select ----------------------------------------------------------

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** The input element (not the wrapper, when there are slots). */
  ref?: Ref<HTMLInputElement>;
  /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby. */
  invalid?: boolean;
  /** md h-9 (default), sm h-8 with 12px text, xs h-7 with 11px text. Touch screens
   *  always get 16px text and a 44px height. (Replaces the native size attribute; set a width with
   *  className instead.) */
  size?: FieldSize;
  /** A decorative slot inside the start edge (left in left-to-right layouts): a search
   *  icon, a "$" prefix. It ignores pointer events, so clicks reach the input. */
  leading?: ReactNode;
  /** A slot inside the end edge that may be interactive: a clear IconButton, a unit
   *  suffix. */
  trailing?: ReactNode;
  /** Classes for the wrapper span that holds the slots (only rendered with leading or
   *  trailing). className stays on the input. */
  wrapperClassName?: string;
}

/** Text input. 16px text on touch screens so iOS does not zoom the page on focus. `rest`
 *  lands on the input, also when the slots add a wrapper. */
export function Input({ invalid, size = 'md', leading, trailing, wrapperClassName, className, ref, ...rest }: InputProps) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={fieldClass({ size, className: cn(leading != null && 'ps-8', trailing != null && 'pe-8', className) })}
      {...rest}
    />
  );
  if (leading == null && trailing == null) return input;
  return (
    <span className={cn('relative inline-flex w-full min-w-0 items-center', wrapperClassName)}>
      {leading != null ? (
        <span className="pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center text-sm text-th-hi2">
          {leading}
        </span>
      ) : null}
      {input}
      {trailing != null ? (
        <span className="absolute inset-y-0 end-0 flex min-w-8 items-center justify-center pe-0.5 text-sm text-th-hi2">{trailing}</span>
      ) : null}
    </span>
  );
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** The select element (not the wrapper). */
  ref?: Ref<HTMLSelectElement>;
  /** Red border and aria-invalid. */
  invalid?: boolean;
  /** md h-9 (default), sm h-8, xs h-7, the same as Input. Touch screens get 16px text
   *  and a 44px height. (Replaces the native size attribute, which turns a select into a list box.) */
  size?: FieldSize;
  /** Classes for the inner <select> itself. className sizes the wrapper (width, margin);
   *  use this instead of reaching in with [&>select]:… */
  selectClassName?: string;
}

/** Native select (keeps the platform picker on phones) with the shared field look. The
 *  wrapper span takes `className`; `rest` and `ref` go to the select, so `name`,
 *  `value` and `onChange` work as on a native select. */
export function Select({ invalid, size = 'md', selectClassName, className, children, ref, ...rest }: SelectProps) {
  const s = SELECT_SIZE[size];
  return (
    <span className={cn('relative inline-flex w-full min-w-0', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={fieldClass({ size, className: cn('appearance-none', s.pad, selectClassName) })}
        {...rest}
      >
        {children}
      </select>
      <ChevronDownIcon
        size={s.icon}
        className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3', s.chevron)}
      />
    </span>
  );
}

// --- Label --------------------------------------------------------------------------

export interface LabelProps extends HTMLAttributes<HTMLSpanElement> {
  /** The span element. */
  ref?: Ref<HTMLSpanElement>;
}

/** Small uppercase label for form fields and section headings. */
export function Label({ className, ref, ...rest }: LabelProps) {
  return <span ref={ref} className={cn('text-xs font-medium uppercase tracking-wider text-th-hi3', className)} {...rest} />;
}
