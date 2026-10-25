import {
  forwardRef,
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

// Controls grow to the 44px tap target on touch screens (pointer-coarse) and stay
// compact under a mouse, so dense desktop tables keep their density.
//
// One recipe per look: each component that also has a class form (buttonClass,
// iconButtonClass, cardClass, fieldClass, badgeClass) renders exactly that function's
// output, so an <a>, a router <Link> or a one-off control can match it without copying
// a class string.

// --- Button -------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'subtle' | 'link';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-th-accent text-th-on-accent hover:bg-th-accent/90 active:bg-th-accent/80',
  secondary: 'border border-th-line-strong bg-th-surface text-th-hi hover:bg-th-elevated',
  ghost: 'text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
  danger: 'bg-th-loss text-th-on-loss hover:bg-th-loss/90 active:bg-th-loss/80',
  soft: 'bg-th-accent-soft text-th-accent hover:bg-th-accent/20 active:bg-th-accent/25',
  subtle: 'bg-th-elevated text-th-hi hover:bg-th-overlay',
  link: 'h-auto p-0 font-medium text-th-accent underline-offset-2 hover:underline',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  xs: 'h-6 gap-1 px-2 text-2xs pointer-coarse:min-h-11',
  sm: 'h-7 gap-1.5 px-2.5 text-xs pointer-coarse:min-h-11',
  md: 'h-9 gap-2 px-3.5 text-sm pointer-coarse:min-h-11',
  lg: 'h-11 gap-2 px-5 text-base',
};

// A link button sits inline in text: it keeps the size's type and gap, but has no
// height, no padding and no touch growth.
const LINK_SIZE: Record<ButtonSize, string> = {
  xs: 'gap-1 text-2xs',
  sm: 'gap-1 text-xs',
  md: 'gap-1.5 text-sm',
  lg: 'gap-2 text-base',
};

const BUTTON_BASE =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150';

// Disabled reads as disabled in every theme: a flat, quiet fill and faint text, instead
// of a dimmed copy of the enabled color. A link only fades its text.
const BUTTON_DISABLED =
  'disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none';
const LINK_DISABLED = 'disabled:pointer-events-none disabled:text-th-ghost disabled:no-underline';

export interface ButtonClassOptions {
  /** Same variants as Button. Default "secondary". */
  variant?: ButtonVariant;
  /** Same sizes as Button. Default "md". */
  size?: ButtonSize;
  /** Extra classes, merged last (tailwind-merge resolves conflicts). */
  className?: string;
}

/** The classes `<Button>` renders, minus its `disabled:` styles. Use it on `<a>`, router
 *  `<Link>`s and `<a download>` so links that look like buttons match them exactly. */
export function buttonClass({ variant = 'secondary', size = 'md', className }: ButtonClassOptions = {}): string {
  return cn(BUTTON_BASE, variant === 'link' ? LINK_SIZE[size] : BUTTON_SIZE[size], BUTTON_VARIANT[variant], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: the one main action in a view. secondary: everything else. ghost:
   *  toolbars and quiet actions. danger: destructive actions. soft: an accent action
   *  that is not the main one (replaces "accent outline" buttons). subtle: a filled,
   *  quiet button for dense toolbars and chips on a surface. link: looks like a text
   *  link and sits inline in text (no height, no padding, no touch growth). */
  variant?: ButtonVariant;
  /** xs for dense tool rows (24px), sm for dense rows and toolbars, lg for a page's
   *  main call to action. xs, sm and md grow to 44px on touch screens. */
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Icon before the label (16px for md and lg, 12–14px for xs and sm). Replaced by the
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
      className={buttonClass({
        variant,
        size,
        className: cn(variant === 'link' ? LINK_DISABLED : BUTTON_DISABLED, className),
      })}
      {...rest}
    >
      {loading ? <LoaderIcon size={size === 'xs' || size === 'sm' ? 12 : 14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
});

// --- IconButton ---------------------------------------------------------------------

export type IconButtonSize = 'xs' | 'sm' | 'md';
export type IconButtonVariant = 'ghost' | 'subtle' | 'soft';

const ICON_SIZE: Record<IconButtonSize, string> = {
  xs: 'size-6 rounded-md',
  sm: 'size-7 rounded-lg',
  md: 'size-9 rounded-lg',
};

const ICON_VARIANT: Record<IconButtonVariant, { idle: string; active: string }> = {
  ghost: { idle: 'text-th-hi3 hover:bg-th-elevated hover:text-th-hi', active: 'bg-th-elevated text-th-hi' },
  subtle: { idle: 'bg-th-elevated text-th-hi hover:bg-th-overlay', active: 'bg-th-overlay text-th-hi' },
  soft: { idle: 'bg-th-accent-soft text-th-accent hover:bg-th-accent/20', active: 'bg-th-accent/25 text-th-accent' },
};

const ICON_DANGER = 'hover:bg-th-loss-soft hover:text-th-loss active:bg-th-loss-soft active:text-th-loss';

export interface IconButtonClassOptions {
  /** Same sizes as IconButton. Default "md". */
  size?: IconButtonSize;
  /** Same variants as IconButton. Default "ghost". */
  variant?: IconButtonVariant;
  /** Same tones as IconButton. Default "neutral". */
  tone?: 'neutral' | 'danger';
  /** The pressed look (IconButton also sets aria-pressed; set it yourself on a link). */
  active?: boolean;
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<IconButton>` renders. Use it on an icon-only `<a>` or router `<Link>`,
 *  and give that element an aria-label. */
export function iconButtonClass({
  size = 'md',
  variant = 'ghost',
  tone = 'neutral',
  active = false,
  className,
}: IconButtonClassOptions = {}): string {
  return cn(
    'inline-flex shrink-0 items-center justify-center transition-colors duration-150',
    'disabled:pointer-events-none disabled:bg-transparent disabled:text-th-ghost',
    'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
    ICON_SIZE[size],
    ICON_VARIANT[variant].idle,
    active && ICON_VARIANT[variant].active,
    tone === 'danger' && ICON_DANGER,
    active && tone === 'danger' && 'bg-th-loss-soft text-th-loss',
    className,
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: an icon-only button needs a name for screen readers and tooltips. It is
   *  also the title, so tests that query by title keep working. */
  label: string;
  /** xs: 24px (dense headers), sm: 28px, md: 36px. All grow to 44px on touch screens. */
  size?: IconButtonSize;
  /** Pressed state for toggles (sets aria-pressed). */
  active?: boolean;
  /** ghost: no fill until hover (default). subtle: a quiet filled square for toolbars on
   *  a surface. soft: an accent tint for the highlighted action. */
  variant?: IconButtonVariant;
  /** danger: hover and pressed turn loss-red, for delete and remove actions. */
  tone?: 'neutral' | 'danger';
}

/** A square button holding only an icon, with its label as aria-label and title. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', active = false, variant = 'ghost', tone = 'neutral', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={iconButtonClass({ size, variant, tone, active, className })}
      {...rest}
    >
      {children}
    </button>
  );
});

// --- Card and CardHeader ------------------------------------------------------------

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li';

const CARD_PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6',
};

export interface CardClassOptions {
  /** Inner padding. Default "md". */
  padding?: CardPadding;
  /** Kept from v0.2: false is the same as padding="none". */
  padded?: boolean;
  /** Hover styles for cards that are links or buttons. */
  interactive?: boolean;
  /** surface: the bordered panel (default). inset: a quiet elevated box for use inside
   *  another card. */
  variant?: 'surface' | 'inset';
  /** Extra classes, merged last. */
  className?: string;
}

const resolvePadding = (padding: CardPadding | undefined, padded: boolean | undefined): CardPadding =>
  padding ?? (padded === false ? 'none' : 'md');

/** The classes `<Card>` renders. Use it on a router `<Link>` or `<a>` that is a whole
 *  card: `<Link className={cardClass({ interactive: true })}>`. */
export function cardClass({ padding, padded, interactive = false, variant = 'surface', className }: CardClassOptions = {}): string {
  const inset = variant === 'inset';
  return cn(
    inset ? 'rounded-lg border border-transparent bg-th-elevated' : 'rounded-xl border border-th-line bg-th-surface shadow-card',
    CARD_PADDING[resolvePadding(padding, padded)],
    interactive &&
      (inset
        ? 'transition-colors duration-150 hover:bg-th-overlay'
        : 'transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60'),
    className,
  );
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The card's heading. */
  title: ReactNode;
  /** A quieter line under the title. */
  description?: ReactNode;
  /** Right-aligned slot: a Button, an IconButton, a Badge, a Segmented. It wraps under
   *  the title on narrow cards. */
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
  ...rest
}: CardHeaderProps) {
  return (
    <div
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
  /** The header's right-aligned action slot; only with title. */
  action?: ReactNode;
}

/** The surface panel every widget, table and form sits in. */
export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { as = 'div', padding, padded, interactive = false, variant = 'surface', title, description, action, className, children, ...rest },
  ref,
) {
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
});

// --- Badge --------------------------------------------------------------------------

type Tone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info';
export type BadgeHue = 'emerald' | 'indigo' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';

const BADGE_TONE: Record<Tone, string> = {
  neutral: 'border-th-line bg-th-elevated text-th-hi2',
  accent: 'border-th-accent/30 bg-th-accent-soft text-th-accent',
  ok: 'border-th-ok/30 bg-th-ok-soft text-th-ok',
  loss: 'border-th-loss/30 bg-th-loss-soft text-th-loss',
  warn: 'border-th-warn/30 bg-th-warn-soft text-th-warn',
  info: 'border-th-info/30 bg-th-info-soft text-th-info',
};

// Full literal class names, so Tailwind's scanner finds every one.
const BADGE_HUE: Record<BadgeHue, string> = {
  emerald: 'border-th-emerald/30 bg-th-emerald-soft text-th-hi',
  indigo: 'border-th-indigo/30 bg-th-indigo-soft text-th-hi',
  amber: 'border-th-amber/30 bg-th-amber-soft text-th-hi',
  lime: 'border-th-lime/30 bg-th-lime-soft text-th-hi',
  rose: 'border-th-rose/30 bg-th-rose-soft text-th-hi',
  sky: 'border-th-sky/30 bg-th-sky-soft text-th-hi',
  violet: 'border-th-violet/30 bg-th-violet-soft text-th-hi',
  teal: 'border-th-teal/30 bg-th-teal-soft text-th-hi',
};

// The dot is StatusDot's xs recipe (6px, the tone's -fill).
const DOT_TONE: Record<Tone, string> = {
  neutral: 'bg-th-ghost',
  accent: 'bg-th-accent',
  ok: 'bg-th-ok-fill',
  loss: 'bg-th-loss-fill',
  warn: 'bg-th-warn-fill',
  info: 'bg-th-info-fill',
};

const DOT_HUE: Record<BadgeHue, string> = {
  emerald: 'bg-th-emerald',
  indigo: 'bg-th-indigo',
  amber: 'bg-th-amber',
  lime: 'bg-th-lime',
  rose: 'bg-th-rose',
  sky: 'bg-th-sky',
  violet: 'bg-th-violet',
  teal: 'bg-th-teal',
};

export interface BadgeClassOptions {
  /** Same tones as Badge. Default "neutral". */
  tone?: Tone;
  /** Same hues as Badge; overrides tone. */
  hue?: BadgeHue;
  /** Same sizes as Badge. Default "sm". */
  size?: 'xs' | 'sm';
  /** Same variants as Badge. Default "pill". */
  variant?: 'pill' | 'tag';
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<Badge>` renders (without the dot), for a badge-shaped link or a
 *  label inside a third-party renderer. */
export function badgeClass({ tone = 'neutral', hue, size = 'sm', variant = 'pill', className }: BadgeClassOptions = {}): string {
  return cn(
    'inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-medium',
    size === 'xs' ? 'px-1.5 py-0 text-3xs leading-4' : 'px-2 py-0.5 text-xs leading-4',
    hue ? BADGE_HUE[hue] : BADGE_TONE[tone],
    variant === 'tag' && 'rounded-sm border-transparent font-semibold uppercase tracking-wide',
    className,
  );
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Text on its own soft tint; every tone clears 4.5:1 in every theme. */
  tone?: Tone;
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
export function Badge({ tone = 'neutral', hue, size = 'sm', variant = 'pill', dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={badgeClass({ tone, hue, size, variant, className })} {...rest}>
      {dot ? (
        <span aria-hidden="true" className={cn('inline-block size-1.5 shrink-0 rounded-full', hue ? DOT_HUE[hue] : DOT_TONE[tone])} />
      ) : null}
      {children}
    </span>
  );
}

// --- Fields: Input, Select (and the shared FIELD recipe) -----------------------------

export type FieldSize = 'xs' | 'sm' | 'md';

/** The field look without size: border, fill, hover, focus ring, disabled and invalid.
 *  Internal to the package (Textarea in forms.tsx builds on it); apps use fieldClass(). */
export const FIELD =
  'w-full min-w-0 rounded-lg border border-th-line-strong bg-th-elevated text-th-hi placeholder:text-th-ghost ' +
  'transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-th-loss';

// Phones always get 16px text (text-base), so iOS does not zoom on focus; from 640px
// the size's own text size applies.
// Padding is split into pl and pr, so a slot or a select chevron can replace one side
// without fighting a px class.
const FIELD_SIZE: Record<FieldSize, { box: string; pad: string; text: string }> = {
  xs: { box: 'h-7 pointer-coarse:min-h-11', pad: 'pl-2 pr-2', text: 'text-base sm:text-2xs' },
  sm: { box: 'h-8 pointer-coarse:min-h-11', pad: 'pl-2.5 pr-2.5', text: 'text-base sm:text-xs' },
  md: { box: 'h-9 pointer-coarse:min-h-11', pad: 'pl-3 pr-3', text: 'text-base sm:text-sm' },
};

const FIELD_INVALID = 'border-th-loss hover:border-th-loss';

export interface FieldClassOptions {
  /** md h-9 (default), sm h-8, xs h-7. All grow to 44px on touch screens. */
  size?: FieldSize;
  /** The red invalid border, for elements that do not set aria-invalid themselves. */
  invalid?: boolean;
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes `<Input>` renders: the shared field look at a size. Use it for a one-off
 *  control (a date input, a contenteditable) instead of copying a class string. */
export function fieldClass({ size = 'md', invalid = false, className }: FieldClassOptions = {}): string {
  const s = FIELD_SIZE[size];
  return cn(FIELD, s.box, s.pad, s.text, invalid && FIELD_INVALID, className);
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby. */
  invalid?: boolean;
  /** md h-9 (default), sm h-8 with 12px text, xs h-7 with 11px text. Phones always get
   *  16px text and a 44px height. (Replaces the native size attribute; set a width with
   *  className instead.) */
  size?: FieldSize;
  /** A decorative slot inside the left edge: a search icon, a "$" prefix. It ignores
   *  pointer events, so clicks reach the input. */
  leading?: ReactNode;
  /** A slot inside the right edge that may be interactive: a clear IconButton, a unit
   *  suffix. */
  trailing?: ReactNode;
  /** Classes for the wrapper span that holds the slots (only rendered with leading or
   *  trailing). className stays on the input. */
  wrapperClassName?: string;
}

/** Text input. 16px text on phones so iOS does not zoom the page on focus. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, size = 'md', leading, trailing, wrapperClassName, className, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={fieldClass({ size, className: cn(leading != null && 'pl-8', trailing != null && 'pr-8', className) })}
      {...rest}
    />
  );
  if (leading == null && trailing == null) return input;
  return (
    <span className={cn('relative inline-flex w-full min-w-0 items-center', wrapperClassName)}>
      {leading != null ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center text-sm text-th-hi2">
          {leading}
        </span>
      ) : null}
      {input}
      {trailing != null ? (
        <span className="absolute inset-y-0 right-0 flex min-w-8 items-center justify-center pr-0.5 text-sm text-th-hi2">{trailing}</span>
      ) : null}
    </span>
  );
});

const SELECT_SIZE: Record<FieldSize, { pad: string; chevron: string; icon: number }> = {
  xs: { pad: 'pl-2 pr-6', chevron: 'right-1.5', icon: 12 },
  sm: { pad: 'pl-2.5 pr-7', chevron: 'right-2', icon: 13 },
  md: { pad: 'pl-3 pr-8', chevron: 'right-2.5', icon: 14 },
};

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Red border and aria-invalid. */
  invalid?: boolean;
  /** md h-9 (default), sm h-8, xs h-7, the same as Input. Phones get 16px text and a
   *  44px height. (Replaces the native size attribute, which turns a select into a list box.) */
  size?: FieldSize;
  /** Classes for the inner <select> itself. className sizes the wrapper (width, margin);
   *  use this instead of reaching in with [&>select]:… */
  selectClassName?: string;
}

/** Native select (keeps the platform picker on phones) with the shared field look. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, size = 'md', selectClassName, className, children, ...rest },
  ref,
) {
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
      <ChevronDownIcon size={s.icon} className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-th-hi3', s.chevron)} />
    </span>
  );
});

// --- Label --------------------------------------------------------------------------

/** Small uppercase label for form fields and section headings. */
export function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('text-xs font-medium uppercase tracking-wider text-th-hi3', className)} {...rest} />;
}
