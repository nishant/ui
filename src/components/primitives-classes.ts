import { cn } from '../cn';

// The class recipes behind the primitives. No React and no directive, so a server
// component can call buttonClass() or cardClass() without pulling in client code.
// primitives.tsx re-exports everything public here, so existing import paths keep working.
//
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

export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-th-accent text-th-on-accent hover:bg-th-accent/90 active:bg-th-accent/80',
  secondary: 'border border-th-line-strong bg-th-surface text-th-hi hover:bg-th-elevated',
  ghost: 'text-th-hi2 hover:bg-th-elevated hover:text-th-hi',
  danger: 'bg-th-loss text-th-on-loss hover:bg-th-loss/90 active:bg-th-loss/80',
  soft: 'bg-th-accent-soft text-th-accent hover:bg-th-accent/20 active:bg-th-accent/25',
  subtle: 'bg-th-elevated text-th-hi hover:bg-th-overlay',
  link: 'h-auto p-0 font-medium text-th-accent underline-offset-2 hover:underline',
};

export const BUTTON_SIZE: Record<ButtonSize, string> = {
  xs: 'h-6 gap-1 px-2 text-2xs pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  sm: 'h-7 gap-1.5 px-2.5 text-xs pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  md: 'h-9 gap-2 px-3.5 text-sm pointer-coarse:min-h-11 pointer-coarse:min-w-11',
  lg: 'h-11 gap-2 px-5 text-base',
};

// A link button sits inline in text: it keeps the size's type and gap, but has no
// height, no padding and no touch growth.
export const LINK_SIZE: Record<ButtonSize, string> = {
  xs: 'gap-1 text-2xs',
  sm: 'gap-1 text-xs',
  md: 'gap-1.5 text-sm',
  lg: 'gap-2 text-base',
};

export const BUTTON_BASE =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium transition-[color,background-color,border-color,transform] duration-150';

// In forced-colors mode the browser drops fills, so a borderless button would lose its
// edge: every non-link button draws a ButtonText border there.
const BUTTON_FORCED = 'forced-colors:border forced-colors:border-[ButtonText]';

// Touch press feedback for filled buttons and icon buttons; never on a disabled one.
export const PRESS = 'pointer-coarse:not-disabled:active:scale-[0.97]';

// A link button's hit area grows to 44px on touch with an invisible ::after, so the
// layout does not move. A 16px line grows by 14px on each side to 44px.
export const LINK_HIT =
  "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3.5 pointer-coarse:after:content-['']";

// Disabled reads as disabled in every theme: a flat, quiet fill and faint text, instead
// of a dimmed copy of the enabled color. A link only fades its text. In forced colors
// the text and border turn GrayText.
export const BUTTON_DISABLED =
  'disabled:pointer-events-none disabled:border disabled:border-th-line disabled:bg-th-elevated disabled:text-th-ghost disabled:shadow-none forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText]';
export const LINK_DISABLED =
  'disabled:pointer-events-none disabled:text-th-ghost disabled:no-underline forced-colors:disabled:text-[GrayText]';

export interface ButtonClassOptions {
  /** Same variants as Button. Default "secondary". */
  variant?: ButtonVariant;
  /** Same sizes as Button. Default "md". */
  size?: ButtonSize;
  /** Link variant only: skip the 44px touch hit area, for a link inside running text. */
  inline?: boolean;
  /** Extra classes, merged last (tailwind-merge resolves conflicts). */
  className?: string;
}

/** The classes `<Button>` renders, minus its `disabled:` styles. Use it on `<a>`, router
 *  `<Link>`s and `<a download>` so links that look like buttons match them exactly. */
export function buttonClass({ variant = 'secondary', size = 'md', inline = false, className }: ButtonClassOptions = {}): string {
  return cn(
    BUTTON_BASE,
    variant === 'link' ? LINK_SIZE[size] : [BUTTON_SIZE[size], BUTTON_FORCED],
    variant === 'link' ? !inline && LINK_HIT : PRESS,
    BUTTON_VARIANT[variant],
    className,
  );
}

export interface LinkClassOptions {
  /** accent: the accent color (default). muted: grey text that lights up on hover. */
  tone?: 'accent' | 'muted';
  /** Skip the 44px touch hit area, for a link inside running text. */
  inline?: boolean;
  /** Extra classes, merged last. */
  className?: string;
}

/** The classes for a text link on a router `<Link>` or `<a>`: tone, underline on hover
 *  and, on touch screens, a 44px hit area that does not move the layout. */
export function linkClass({ tone = 'accent', inline = false, className }: LinkClassOptions = {}): string {
  return cn(
    'font-medium underline-offset-2 transition-colors duration-150 hover:underline',
    tone === 'accent' ? 'text-th-accent' : 'text-th-hi3 hover:text-th-hi',
    !inline && LINK_HIT,
    className,
  );
}

/** Classes that hide a row action until its row is hovered or focused, and always show
 *  it on touch screens (there is no hover). Put `group` on the row. */
export function revealClass(className?: string): string {
  return cn(
    'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
    className,
  );
}

// --- IconButton ---------------------------------------------------------------------

export type IconButtonSize = '2xs' | 'xs' | 'sm' | 'md';
export type IconButtonVariant = 'ghost' | 'subtle' | 'soft';

// The 2xs square is 20px, below WCAG 2.5.8's 24px. Under a fine pointer an invisible
// ::after grows its hit area to 24px; coarse pointers already get 44px from min-h/min-w.
export const ICON_SIZE: Record<IconButtonSize, string> = {
  '2xs': "relative size-5 rounded pointer-fine:after:absolute pointer-fine:after:-inset-0.5 pointer-fine:after:content-['']",
  xs: 'size-6 rounded-md',
  sm: 'size-7 rounded-lg',
  md: 'size-9 rounded-lg',
};

export const ICON_VARIANT: Record<IconButtonVariant, { idle: string; active: string }> = {
  ghost: { idle: 'text-th-hi3 hover:bg-th-elevated hover:text-th-hi', active: 'bg-th-elevated text-th-hi' },
  subtle: { idle: 'bg-th-elevated text-th-hi hover:bg-th-overlay', active: 'bg-th-overlay text-th-hi' },
  soft: { idle: 'bg-th-accent-soft text-th-accent hover:bg-th-accent/20', active: 'bg-th-accent/25 text-th-accent' },
};

export const ICON_DANGER = 'hover:bg-th-loss-soft hover:text-th-loss active:bg-th-loss-soft active:text-th-loss';

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
    'inline-flex shrink-0 items-center justify-center transition-[color,background-color,border-color,transform] duration-150',
    PRESS,
    'disabled:pointer-events-none disabled:bg-transparent disabled:text-th-ghost forced-colors:disabled:text-[GrayText]',
    'pointer-coarse:min-h-11 pointer-coarse:min-w-11',
    // A pressed toggle is shown by fill only, which forced colors drops: outline it.
    active && 'forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight]',
    ICON_SIZE[size],
    ICON_VARIANT[variant].idle,
    active && ICON_VARIANT[variant].active,
    tone === 'danger' && ICON_DANGER,
    active && tone === 'danger' && 'bg-th-loss-soft text-th-loss',
    className,
  );
}

// --- Card ---------------------------------------------------------------------------

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li';

export const CARD_PADDING: Record<CardPadding, string> = {
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

/** The padding a card uses: `padding` wins, `padded={false}` means none, else "md". */
export const resolvePadding = (padding: CardPadding | undefined, padded: boolean | undefined): CardPadding =>
  padding ?? (padded === false ? 'none' : 'md');

/** The classes `<Card>` renders. Use it on a router `<Link>` or `<a>` that is a whole
 *  card: `<Link className={cardClass({ interactive: true })}>`. */
export function cardClass({ padding, padded, interactive = false, variant = 'surface', className }: CardClassOptions = {}): string {
  const inset = variant === 'inset';
  return cn(
    // The inset card has a transparent border; forced colors still draws its edge.
    inset
      ? 'rounded-lg border border-transparent bg-th-elevated forced-colors:border-[CanvasText]'
      : 'rounded-xl border border-th-line bg-th-surface shadow-card',
    CARD_PADDING[resolvePadding(padding, padded)],
    interactive &&
      (inset
        ? 'transition-colors duration-150 hover:bg-th-overlay'
        : 'transition-colors duration-150 hover:border-th-line-strong hover:bg-th-elevated/60'),
    className,
  );
}

// --- Badge --------------------------------------------------------------------------

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info' | 'on-accent';
export type BadgeHue = 'emerald' | 'indigo' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';

export const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'border-th-line bg-th-elevated text-th-hi2',
  accent: 'border-th-accent/30 bg-th-accent-soft text-th-accent',
  ok: 'border-th-ok/30 bg-th-ok-soft text-th-ok',
  loss: 'border-th-loss/30 bg-th-loss-soft text-th-loss',
  warn: 'border-th-warn/30 bg-th-warn-soft text-th-warn',
  info: 'border-th-info/30 bg-th-info-soft text-th-info',
  // A label on a solid accent fill (inside a primary Button or an accent link).
  'on-accent': 'border-transparent bg-th-on-accent/20 text-th-on-accent',
};

// Full literal class names, so Tailwind's scanner finds every one.
export const BADGE_HUE: Record<BadgeHue, string> = {
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
export const DOT_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-th-ghost',
  accent: 'bg-th-accent',
  ok: 'bg-th-ok-fill',
  loss: 'bg-th-loss-fill',
  warn: 'bg-th-warn-fill',
  info: 'bg-th-info-fill',
  'on-accent': 'bg-th-on-accent',
};

export const DOT_HUE: Record<BadgeHue, string> = {
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
  tone?: BadgeTone;
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
    // A tag has no border color of its own; forced colors still draws its edge.
    variant === 'tag' && 'rounded-sm border-transparent font-semibold uppercase tracking-wide forced-colors:border-[CanvasText]',
    className,
  );
}

// --- Fields: Input, Select (and the shared FIELD recipe) -----------------------------

export type FieldSize = 'xs' | 'sm' | 'md';

/** The field look without size: border, fill, hover, focus ring, disabled and invalid.
 *  Internal to the package (Textarea in forms.tsx builds on it); apps use fieldClass().
 *  The border is `line-control` (3:1 against the surfaces in every theme) and the
 *  placeholder is `hi3` (4.5:1 on the field fill). The focus outline is removed for the
 *  ring, and comes back as a Highlight outline in forced colors. */
export const FIELD =
  'w-full min-w-0 rounded-lg border border-th-line-control bg-th-elevated text-th-hi placeholder:text-th-hi3 ' +
  'transition-colors duration-150 hover:border-th-hi3/60 focus:border-th-accent focus:outline-none focus:ring-2 focus:ring-th-accent/25 ' +
  'forced-colors:focus:outline-solid forced-colors:focus:outline-2 forced-colors:focus:outline-[Highlight] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 forced-colors:disabled:border-[GrayText] forced-colors:disabled:text-[GrayText] ' +
  'aria-[invalid=true]:border-th-loss';

// Touch screens always get 16px text (text-base), so iOS does not zoom on focus. Under a
// mouse the size's own text size applies at every width, so a narrow popout window
// driven by a mouse keeps its dense text.
// Padding is split into ps and pe (logical start and end), so a slot or a select chevron
// can replace one side without fighting a px class, and it mirrors in right-to-left.
export const FIELD_SIZE: Record<FieldSize, { box: string; pad: string; text: string }> = {
  xs: { box: 'h-7 pointer-coarse:min-h-11', pad: 'ps-2 pe-2', text: 'text-2xs pointer-coarse:text-base' },
  sm: { box: 'h-8 pointer-coarse:min-h-11', pad: 'ps-2.5 pe-2.5', text: 'text-xs pointer-coarse:text-base' },
  md: { box: 'h-9 pointer-coarse:min-h-11', pad: 'ps-3 pe-3', text: 'text-sm pointer-coarse:text-base' },
};

export const FIELD_INVALID = 'border-th-loss hover:border-th-loss';

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

/** Padding, chevron position and icon size per Select size (logical: the chevron sits at
 *  the end edge in either direction). */
export const SELECT_SIZE: Record<FieldSize, { pad: string; chevron: string; icon: number }> = {
  xs: { pad: 'ps-2 pe-6', chevron: 'end-1.5', icon: 12 },
  sm: { pad: 'ps-2.5 pe-7', chevron: 'end-2', icon: 13 },
  md: { pad: 'ps-3 pe-8', chevron: 'end-2.5', icon: 14 },
};
