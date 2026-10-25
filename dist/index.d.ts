import { ClassValue } from 'clsx';
import { T as ThemeChoice, a as ThemeName } from './theme-BQoOzE5r.js';
export { C as COLOR_ROLES, D as DEFAULT_THEME, H as HUE_ROLES, M as MountThemeToggleOptions, P as PRESETS, S as SCALE, b as SHADOWS, c as SOFT_ROLES, d as THEMES, e as TOGGLE_ORDER, f as ThemePreset, g as ThemeToggleLabels, h as applyTheme, i as cycleTheme, j as getThemeChoice, k as initTheme, l as isThemeName, m as mountThemeToggle, o as onThemeChange, r as readToken, n as registerThemes, p as resolveTheme, s as schemeOf, q as setThemeChoice } from './theme-BQoOzE5r.js';
import * as react from 'react';
import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, InputHTMLAttributes, SelectHTMLAttributes, ChangeEvent, MouseEvent, TextareaHTMLAttributes, CSSProperties, ReactElement, RefObject, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/** Conditional Tailwind classes with conflict resolution. */
declare function cn(...inputs: ClassValue[]): string;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'subtle' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
interface ButtonClassOptions {
    /** Same variants as Button. Default "secondary". */
    variant?: ButtonVariant;
    /** Same sizes as Button. Default "md". */
    size?: ButtonSize;
    /** Extra classes, merged last (tailwind-merge resolves conflicts). */
    className?: string;
}
/** The classes `<Button>` renders, minus its `disabled:` styles. Use it on `<a>`, router
 *  `<Link>`s and `<a download>` so links that look like buttons match them exactly. */
declare function buttonClass({ variant, size, className }?: ButtonClassOptions): string;
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;
type IconButtonSize = 'xs' | 'sm' | 'md';
type IconButtonVariant = 'ghost' | 'subtle' | 'soft';
interface IconButtonClassOptions {
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
declare function iconButtonClass({ size, variant, tone, active, className, }?: IconButtonClassOptions): string;
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
declare const IconButton: react.ForwardRefExoticComponent<IconButtonProps & react.RefAttributes<HTMLButtonElement>>;
type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li';
interface CardClassOptions {
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
/** The classes `<Card>` renders. Use it on a router `<Link>` or `<a>` that is a whole
 *  card: `<Link className={cardClass({ interactive: true })}>`. */
declare function cardClass({ padding, padded, interactive, variant, className }?: CardClassOptions): string;
interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
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
declare function CardHeader({ title, description, action, icon, as: Heading, divided, titleId, className, ...rest }: CardHeaderProps): react.JSX.Element;
interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
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
declare const Card: react.ForwardRefExoticComponent<CardProps & react.RefAttributes<HTMLElement>>;
type Tone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info';
type BadgeHue = 'emerald' | 'indigo' | 'amber' | 'lime' | 'rose' | 'sky' | 'violet' | 'teal';
interface BadgeClassOptions {
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
declare function badgeClass({ tone, hue, size, variant, className }?: BadgeClassOptions): string;
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
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
declare function Badge({ tone, hue, size, variant, dot, className, children, ...rest }: BadgeProps): react.JSX.Element;
type FieldSize = 'xs' | 'sm' | 'md';
interface FieldClassOptions {
    /** md h-9 (default), sm h-8, xs h-7. All grow to 44px on touch screens. */
    size?: FieldSize;
    /** The red invalid border, for elements that do not set aria-invalid themselves. */
    invalid?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<Input>` renders: the shared field look at a size. Use it for a one-off
 *  control (a date input, a contenteditable) instead of copying a class string. */
declare function fieldClass({ size, invalid, className }?: FieldClassOptions): string;
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
declare const Input: react.ForwardRefExoticComponent<InputProps & react.RefAttributes<HTMLInputElement>>;
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
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
declare const Select: react.ForwardRefExoticComponent<SelectProps & react.RefAttributes<HTMLSelectElement>>;
/** Small uppercase label for form fields and section headings. */
declare function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): react.JSX.Element;

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby
     *  (Field does both for you). */
    invalid?: boolean;
    /** md: the standard field. sm: tighter padding and 12px text under a mouse, for dense
     *  panels. Phones always get 16px text so iOS does not zoom. */
    size?: 'sm' | 'md';
    /** Grow with the content instead of scrolling (chat composers, notes). `true` grows
     *  without limit; `{ maxRows }` stops growing and scrolls past that many lines. `rows`
     *  stays the minimum height. Turns off the manual resize handle. */
    autoGrow?: boolean | {
        maxRows: number;
    };
}
/** Multi-line text with the shared field look. 16px text on phones (no iOS zoom); the
 *  reader can resize it vertically, or it grows with its content when autoGrow is set. */
declare const Textarea: react.ForwardRefExoticComponent<TextareaProps & react.RefAttributes<HTMLTextAreaElement>>;
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
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
declare const Checkbox: react.ForwardRefExoticComponent<CheckboxProps & react.RefAttributes<HTMLInputElement>>;
interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'type' | 'value'> {
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
declare const Switch: react.ForwardRefExoticComponent<SwitchProps & react.RefAttributes<HTMLButtonElement>>;
interface FieldProps {
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
declare function Field({ label, hint, error, optional, htmlFor, layout, labelWidth, children, className }: FieldProps): react.JSX.Element;
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'type'> {
    /** The query. SearchInput is controlled. */
    value: string;
    /** Called with the new query on typing, on Clear and on Escape. */
    onChange: (value: string, event?: ChangeEvent<HTMLInputElement>) => void;
    /** Also called after Clear or Escape empties the field (e.g. to reset results). */
    onClear?: () => void;
    /** md: 36px, sm: 32px, xs: 28px (dense toolbars). All 44px on touch, 16px text on phones. */
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
declare const SearchInput: react.ForwardRefExoticComponent<SearchInputProps & react.RefAttributes<HTMLInputElement>>;
type ChipVariant = 'toggle' | 'suggestion' | 'tag';
interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
declare const Chip: react.ForwardRefExoticComponent<ChipProps & react.RefAttributes<HTMLButtonElement>>;
interface ChipGroupProps extends HTMLAttributes<HTMLDivElement> {
    /** Names the group for screen readers: "Filter by status". */
    label: string;
    /** On phones, one row that scrolls sideways instead of wrapping. */
    scroll?: boolean;
    children: ReactNode;
}
/** A labelled row of Chips (role="group"). Wraps by default. */
declare function ChipGroup({ label, scroll, className, children, ...rest }: ChipGroupProps): react.JSX.Element;

type TabsVariant = 'underline' | 'pill';
type TabsSize = 'sm' | 'md';
/** The look of one tab, for router links that act as tabs:
 *  `<NavLink className={({ isActive }) => tabClass({ active: isActive })}>`. Router links
 *  are navigation, not ARIA tabs: they take aria-current="page", not role="tab". */
declare function tabClass(o: {
    active: boolean;
    variant?: TabsVariant;
    size?: TabsSize;
    className?: string;
}): string;
interface TabItem {
    value: string;
    label: ReactNode;
    /** A count after the label (unread, results), shown as a small Badge. */
    count?: number;
    /** A quieter second line under the label ("$12 · 3h"). */
    sub?: ReactNode;
    /** Shown but not selectable; the arrow keys skip it. */
    disabled?: boolean;
}
interface TabsProps {
    /** The selected tab's value. Tabs is controlled. */
    value: string;
    /** Called with the new value on click and on arrow keys (selection follows focus). */
    onChange: (value: string) => void;
    items: TabItem[];
    /** Names the tab list for screen readers: "Job sections". */
    label: string;
    /** underline: page and card sections (default). pill: a quieter switcher inside a toolbar. */
    variant?: TabsVariant;
    /** md: 14px text (default). sm: 12px for card headers. Both 44px on touch screens. */
    size?: TabsSize;
    /** Prefix for the tab and panel ids. Needed only when TabPanels render outside this
     *  Tabs: give both the same idBase. */
    idBase?: string;
    /** Set when TabPanels with this idBase render elsewhere, so each tab points at its
     *  panel (aria-controls). Automatic when the panels are this component's children. */
    controlsPanels?: boolean;
    /** TabPanels for the items. They render after the tab list. */
    children?: ReactNode;
    /** Class for the tab list. */
    className?: string;
}
/** Tabs that switch between panels in place: the full ARIA tabs pattern (tablist, tab
 *  with aria-selected and aria-controls, arrow keys, Home and End). For links that
 *  change the URL, use tabClass() on the router's link instead. */
declare function Tabs({ value, onChange, items, label, variant, size, idBase, controlsPanels, children, className }: TabsProps): react.JSX.Element;
interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
    /** The tab value this panel belongs to. */
    value: string;
    /** Only when the panel renders outside its Tabs: the same idBase as the Tabs. */
    idBase?: string;
    /** Only when the panel renders outside its Tabs: whether its tab is selected. */
    active?: boolean;
    children?: ReactNode;
}
/** The content for one tab: role="tabpanel", labelled by its tab, hidden unless its tab
 *  is selected. Render it as a child of Tabs, or pass idBase and active. */
declare function TabPanel({ value, idBase, active, children, className, ...rest }: TabPanelProps): react.JSX.Element;

/** One shimmer block; size it with width/height classes. */
declare function Skeleton({ className, style, }: {
    /** Size and shape: h-4 w-2/5, size-9 rounded-full, … */
    className?: string;
    /** For sizes known only at runtime, e.g. { height: chartHeight }. */
    style?: CSSProperties;
}): react.JSX.Element;
declare const SPINNER_SIZE: {
    readonly xs: 12;
    readonly sm: 14;
    readonly md: 16;
    readonly lg: 24;
};
interface SpinnerProps {
    /** xs 12px, sm 14px, md 16px (default), lg 24px. */
    size?: keyof typeof SPINNER_SIZE;
    /** Announces the spinner (role="status") with this accessible name, e.g.
     *  "Loading jobs". Without it the spinner is decorative (aria-hidden); pair it with
     *  visible text or an aria-busy container. */
    label?: string;
    /** Color and spacing. The spinner draws in currentColor. */
    className?: string;
}
/** A spinning loader in the current text color: the one spinner every app uses,
 *  instead of hand-rolled border spinners. */
declare function Spinner({ size, label, className }: SpinnerProps): react.JSX.Element;
/** A padded stack of shimmer bars: the default loading body for a card or widget. */
declare function SkeletonLines({ lines, className, }: {
    /** Body lines under the heading bar. */
    lines?: number;
    className?: string;
}): react.JSX.Element;
interface EmptyStateProps {
    /** A 28px line icon, shown in the ghost color. */
    icon?: ReactNode;
    /** What is empty, in a few words: "No price drops yet". */
    title: string;
    /** One sentence on why, or what will fill it. */
    detail?: ReactNode;
    /** Usually one small Button that fixes the emptiness. */
    action?: ReactNode;
    /** compact: no border, fills a widget body. Default: dashed box on a page. */
    compact?: boolean;
    className?: string;
}
/** What a list, table or widget shows when there is nothing in it yet. */
declare function EmptyState({ icon, title, detail, action, compact, className }: EmptyStateProps): react.JSX.Element;
interface ErrorStateProps {
    /** What failed and, when known, what to do about it. */
    message?: ReactNode;
    /** Shows a Retry button when given. */
    onRetry?: () => void;
    /** Spinner on the Retry button while the retry runs. */
    retrying?: boolean;
    /** No box: fills a widget body. Default: a tinted box on a page. */
    compact?: boolean;
    className?: string;
}
/** A failed load, announced to screen readers (role="alert"), with an optional Retry. */
declare function ErrorState({ message, onRetry, retrying, compact, className, }: ErrorStateProps): react.JSX.Element;

type ToastTone = 'success' | 'error' | 'warn' | 'info';
/** A button inside a toast, such as Undo. */
interface ToastAction {
    /** The button text: one or two words ("Undo", "View"). */
    label: string;
    /** Runs on click; the toast dismisses itself right after. */
    onClick: () => void;
}
interface ToastOptions {
    /** Optional second line. */
    body?: string;
    /** One text button, e.g. { label: 'Undo', onClick: revert }. Clicking it runs
     *  onClick and then dismisses the toast. */
    action?: ToastAction;
    /** Milliseconds before it dismisses itself, or 'sticky' to stay until dismissed.
     *  Default 4000; errors default to 'sticky'. The timer pauses while the toast is
     *  hovered or holds focus. */
    duration?: number | 'sticky';
    /** A slot name. A new toast with the same id replaces the old one instead of
     *  stacking, so a stale Undo can never revert a newer change. */
    id?: string;
}
interface ToastItem {
    /** Returned by toast(); pass it to dismissToast(). */
    id: number;
    tone: ToastTone;
    title: string;
    /** Optional second line. */
    body?: string;
    /** The toast's one text button, if any. */
    action?: ToastAction;
    /** The slot name from ToastOptions.id, if any. */
    slot?: string;
    /** How long it stays, as given or defaulted. */
    duration: number | 'sticky';
}
/** Remove a toast now, by the id toast() returned. */
declare function dismissToast(id: number): void;
type ToastCall = (title: string, bodyOrOptions?: string | ToastOptions) => number;
type ToastFn = ToastCall & {
    success: ToastCall;
    error: ToastCall;
    warn: ToastCall;
    info: ToastCall;
};
/** toast('Saved'), toast.error('Could not save', detail), or
 *  toast.success('Archived', { action: { label: 'Undo', onClick: undo }, id: 'undo' }). */
declare const toast: ToastFn;
/** Same API as a hook, for code that prefers one. */
declare function useToast(): ToastFn;
interface ToasterProps {
    /** Extra classes for the stack, e.g. to lift it above a bottom nav: sm:bottom-20. */
    className?: string;
    /** Distance from the bottom of the screen on phones (under 640px), e.g.
     *  'calc(4.5rem + env(safe-area-inset-bottom))' to clear a bottom tab bar.
     *  Default: 12px or the safe area, whichever is larger. */
    offset?: string;
}
/** The toast stack: bottom-center full width on phones, bottom-right on wider screens. */
declare function Toaster({ className, offset }: ToasterProps): react.ReactPortal | null;

interface ModalProps {
    /** Heading of the dialog; also its accessible name. Optional only when `header`
     *  replaces the title row (then pass `aria-label`). */
    title?: ReactNode;
    /** Called on Escape, a backdrop click and the close button. Unmount the modal here. */
    onClose: () => void;
    /** The body. It scrolls when taller than the screen. */
    children: ReactNode;
    /** md: compact dialogs (default). lg / xl: wide content like guides and editors.
     *  2xl: very wide panels (comparison tables, up to 1152px). full: the whole screen
     *  less a 1rem margin. Every size is a bottom sheet under 640px. */
    size?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
    /** Buttons row pinned to the bottom of the panel. */
    footer?: ReactNode;
    /** A summary pinned under the title while the body scrolls (price, status, timestamps). */
    subtitle?: ReactNode;
    /** center (default), or top: pinned near the top of wide screens, for command
     *  palettes and search dialogs whose height changes as results arrive. */
    placement?: 'center' | 'top';
    /** Replaces the whole title row (title and close button), e.g. with a search
     *  field. Pass `aria-label` so the dialog keeps a name. */
    header?: ReactNode;
    /** Hides the close button. Escape and a backdrop click still close. */
    hideClose?: boolean;
    /** Accessible name when there is no visible `title` (required with `header`). */
    'aria-label'?: string;
    className?: string;
}
/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll (on both <html> and <body>) while open. */
declare function Modal({ title, onClose, children, size, footer, subtitle, placement, header, hideClose, 'aria-label': ariaLabel, className, }: ModalProps): react.ReactPortal;
interface DrawerProps {
    /** Heading of the drawer; also its accessible name unless `aria-label` is set. */
    title: ReactNode;
    /** A line under the title (counts, status, timestamps). */
    subtitle?: ReactNode;
    /** Called on Escape, a scrim click and the close button. Unmount the drawer here. */
    onClose: () => void;
    /** right (default) and left: a full-height panel from that edge. bottom: a sheet
     *  from the bottom edge at every width. */
    side?: 'right' | 'left' | 'bottom';
    /** Side drawers: the panel width on wide screens (sm 384px, md 448px, lg 672px);
     *  full width under 640px. Bottom sheets: the height cap (sm 50%, md 70%, lg 92%
     *  of the screen). Default md. */
    size?: 'sm' | 'md' | 'lg';
    /** Extra header controls, left of the close button (IconButtons, a filter). */
    actions?: ReactNode;
    /** A row pinned to the bottom of the panel. */
    footer?: ReactNode;
    /** Bottom sheets: lifts the sheet above an app's bottom tab bar, e.g.
     *  'calc(4rem + env(safe-area-inset-bottom))'. */
    bottomOffset?: string;
    /** Accessible name, when the title alone does not say enough. */
    'aria-label'?: string;
    /** The body. It scrolls on its own; header and footer stay put. */
    children: ReactNode;
    /** Classes for the panel. */
    className?: string;
}
/** A panel that slides in from an edge: notifications, an assistant, filters, a phone
 *  "More" sheet. It is a modal dialog: it traps Tab, closes on Escape and a scrim
 *  click, returns focus to the opener and locks page scroll. */
declare function Drawer({ title, subtitle, onClose, side, size, actions, footer, bottomOffset, 'aria-label': ariaLabel, children, className, }: DrawerProps): react.ReactPortal;
interface ConfirmDialogProps {
    /** The question, e.g. "Delete this tracker?". Also the dialog's name. */
    title: ReactNode;
    /** What happens if they confirm. Keep it to a sentence or two. */
    body?: ReactNode;
    /** The confirm button's label: a verb that names the action ("Delete", "Archive"). */
    confirmLabel: string;
    /** The cancel button's label. Default "Cancel". */
    cancelLabel?: string;
    /** danger (default): a red confirm button, and focus starts on Cancel. primary: an
     *  accent confirm button that takes the first focus. */
    tone?: 'danger' | 'primary';
    /** The action is running: the confirm button shows a spinner, and Cancel, Escape and
     *  the backdrop are held off until it finishes. */
    pending?: boolean;
    /** Runs the action. Close the dialog (unmount it) when it is done. */
    onConfirm: () => void;
    /** Called on Cancel, Escape and a backdrop click. Unmount the dialog here. */
    onCancel: () => void;
}
/** A yes-or-no question before an action, in place of `window.confirm`: a small
 *  Modal with Cancel and a confirm button. */
declare function ConfirmDialog({ title, body, confirmLabel, cancelLabel, tone, pending, onConfirm, onCancel, }: ConfirmDialogProps): react.JSX.Element;
interface TooltipProps {
    /** What the tooltip says. Keep it to a sentence or two. */
    tip: ReactNode;
    /** The trigger. It becomes focusable (unless `focusable` is false), so keyboard
     *  users can read the tip. */
    children: ReactNode;
    className?: string;
    /** Preferred side; flips to the opposite one when there is no room. `right` suits
     *  a collapsed sidebar. */
    side?: 'top' | 'bottom' | 'left' | 'right';
    /** Element used for the trigger. Pass `tr` inside tables, where a span would be
     *  invalid markup and get hoisted out of the table by the parser. */
    as?: 'span' | 'tr';
    /** Adds the trigger to the Tab order (default true). Set false for dense marks such
     *  as 60 chart bars, and make the value reachable another way. */
    focusable?: boolean;
    /** default: the trigger keeps its own look. hint: a dotted underline and a help
     *  cursor, for a term whose meaning the tip explains. */
    variant?: 'default' | 'hint';
}
/** Hover/focus tooltip rendered through a portal to <body>, so `overflow:hidden`
 *  ancestors (truncated labels, scrolling tables) can never clip it. Positioned
 *  from the trigger's viewport rect, flipped and clamped to stay on screen. */
declare function Tooltip({ tip, children, className, side, as, focusable, variant }: TooltipProps): react.JSX.Element;
interface PopoverProps {
    /** Whether the panel shows. The popover is controlled: pair it with `onOpenChange`. */
    open: boolean;
    /** Called with false on Escape, a press outside, and Tab out of the panel. */
    onOpenChange: (open: boolean) => void;
    /** The element the panel sits next to (usually the button that opens it). Focus
     *  returns here when the panel closes. */
    anchor: RefObject<HTMLElement | null>;
    /** Preferred side; flips when there is no room. Default bottom. */
    side?: 'top' | 'bottom';
    /** Which edge of the anchor the panel lines up with. Default start. */
    align?: 'start' | 'center' | 'end';
    /** Panel width: a number of pixels or any CSS length. Default: fits the content. */
    width?: number | string;
    /** Accessible name of the panel (it has role="dialog"). */
    'aria-label'?: string;
    /** Classes for the panel (e.g. `p-0`, or `app-region-no-drag` in Electron apps). */
    className?: string;
    children: ReactNode;
}
/** A non-modal floating panel anchored to an element: filters, a color picker, a
 *  details card. Portaled (so no parent clips it), flipped and clamped to the screen.
 *  Escape and a press outside close it; focus returns to the anchor. */
declare function Popover({ open, onOpenChange, anchor, side, align, width, 'aria-label': ariaLabel, className, children, }: PopoverProps): react.ReactPortal | null;
interface DropdownMenuProps {
    /** The button that opens the menu (a Button or IconButton). It gets aria-haspopup,
     *  aria-expanded and aria-controls, opens on click, and on ArrowDown / ArrowUp. */
    trigger: ReactElement;
    /** Which edge of the trigger the menu lines up with. Default start. */
    align?: 'start' | 'center' | 'end';
    /** Preferred side; flips when there is no room. Default bottom. */
    side?: 'top' | 'bottom';
    /** MenuItem, MenuLabel, MenuSeparator and MenuSubHeader rows. */
    children: ReactNode;
    /** Controlled open state (optional; the menu manages it otherwise). */
    open?: boolean;
    /** Called whenever the menu opens or closes. */
    onOpenChange?: (open: boolean) => void;
    /** Opens on mount when uncontrolled (previews, tests). */
    defaultOpen?: boolean;
    /** Accessible name of the menu. Default: the trigger's name (aria-labelledby). */
    'aria-label'?: string;
    /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
    className?: string;
}
/** A menu of actions behind a button: role="menu" with arrow keys, Home and End,
 *  Escape, Tab to leave, and focus back on the trigger when it closes. */
declare function DropdownMenu({ trigger, align, side, children, open: openProp, onOpenChange, defaultOpen, 'aria-label': ariaLabel, className, }: DropdownMenuProps): react.JSX.Element;
interface MenuItemProps {
    /** Leading icon (14px reads best). */
    icon?: ReactNode;
    /** Right-aligned extra: a shortcut (Kbd), a count or a chevron. */
    trailing?: ReactNode;
    /** A destructive action: loss-colored text and hover. */
    danger?: boolean;
    /** Marks the current choice (the selected sort, the open board) with the
     *  highlighted look. */
    active?: boolean;
    /** Shown but not selectable; arrow keys skip it. */
    disabled?: boolean;
    /** Runs on click, Enter and Space, then the menu closes. Call
     *  `event.preventDefault()` to keep it open (e.g. to switch to a submenu view). */
    onSelect?: (event: Event) => void;
    /** Classes for the row. */
    className?: string;
    children: ReactNode;
}
/** One action in a DropdownMenu. */
declare function MenuItem({ icon, trailing, danger, active, disabled, onSelect, className, children }: MenuItemProps): react.JSX.Element;
/** A small heading over a group of MenuItems. Not focusable. */
declare function MenuLabel({ children, className }: {
    children: ReactNode;
    className?: string;
}): react.JSX.Element;
/** A thin line between groups of MenuItems. */
declare function MenuSeparator({ className }: {
    className?: string;
}): react.JSX.Element;
interface MenuSubHeaderProps {
    /** Goes back to the parent view (also on ArrowLeft). The menu stays open. */
    onBack: () => void;
    /** The submenu's title. */
    children: ReactNode;
    className?: string;
}
/** The first row of a submenu view shown in place: a back arrow and the view's title. */
declare function MenuSubHeader({ onBack, children, className }: MenuSubHeaderProps): react.JSX.Element;

/** Status tones shared by the display components. */
type StatusTone = 'ok' | 'warn' | 'loss' | 'info' | 'accent' | 'neutral';
type CalloutTone = 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'loss';
interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** What kind of notice: info and accent for news, ok for success, warn for something to
     *  check, loss for a failure. neutral is a plain grey note. */
    tone?: CalloutTone;
    /** Leading icon. Defaults by tone (Info, CheckCircle or AlertTriangle); false hides it. */
    icon?: ReactNode | false;
    /** A short bold first line. */
    title?: ReactNode;
    /** The body text. */
    children?: ReactNode;
    /** Usually one small Button or link, shown after the text. */
    action?: ReactNode;
    /** Adds a Dismiss button that calls this. */
    onDismiss?: () => void;
    /** box: a rounded tinted box in the flow (default). bar: full width with square
     *  corners and no side borders, for a sticky page-level alert. */
    variant?: 'box' | 'bar';
    /** Tighter padding and xs text, for widgets and table cells. */
    compact?: boolean;
    /** Announce it when it appears: role="alert" for loss, role="status" otherwise.
     *  Leave it off for notices that are part of the page from the start. */
    live?: boolean;
}
/** An inline notice: a tinted box with an icon, an optional title, text and an action. */
declare function Callout({ tone, icon, title, children, action, onDismiss, variant, compact, live, className, ...rest }: CalloutProps): react.JSX.Element;
declare const DOT_SIZE: {
    readonly xs: "size-1.5";
    readonly sm: "size-2";
    readonly md: "size-2.5";
    readonly lg: "size-3.5";
};
interface StatusDotProps {
    /** ok, warn, loss and info use the status fills; accent the accent; neutral the ghost grey. */
    tone: StatusTone;
    /** xs 6px, sm 8px (default), md 10px, lg 14px. */
    size?: keyof typeof DOT_SIZE;
    /** Gently pulses the opacity, for "live" or "running". Still under reduced motion. */
    pulse?: boolean;
    /** A soft ring around the dot, for a header status. */
    halo?: boolean;
    /** The accessible name read by screen readers ("Up", "Degraded"; role="img"). Without it the
     *  dot is aria-hidden, so always pair it with visible text then. */
    label?: string;
    className?: string;
}
/** A small round status mark. Color is never the only signal: give it a label or
 *  put text beside it. */
declare function StatusDot({ tone, size, pulse, halo, label, className }: StatusDotProps): react.JSX.Element;
/** ok for a positive number, loss for a negative one, neutral for zero or nothing.
 *  Replaces `n >= 0 ? gain : loss` ternaries. */
declare function signTone(n: number | null | undefined): 'ok' | 'loss' | 'neutral';
declare const STAT_VALUE_SIZE: {
    readonly sm: "text-base";
    readonly md: "text-xl";
    readonly lg: "text-2xl";
};
interface StatProps {
    /** What the number is: "Open positions", "Uptime (30d)". */
    label: ReactNode;
    /** The number, already formatted ("$12,480", "99.95%"). */
    value: ReactNode;
    /** A quiet line under the value: a change, a date, a unit. */
    sub?: ReactNode;
    /** Colors the value: ok for gains, loss for losses, warn for attention. Use
     *  signTone(n) for signed numbers. */
    tone?: 'ok' | 'loss' | 'warn' | 'neutral';
    /** An explanation shown in a tooltip on the label (dotted underline). */
    tip?: ReactNode;
    /** Value size: sm 16px, md 20px (default), lg 24px. */
    size?: keyof typeof STAT_VALUE_SIZE;
    /** card: a small Card (default). inset: a grey box for use inside a card. plain: no box. */
    variant?: 'card' | 'inset' | 'plain';
    /** Skeleton bars of the same size instead of the value and sub. */
    loading?: boolean;
    className?: string;
}
/** One labelled number. Inside a StatGrid it is a row of the grid's <dl>; on its own it
 *  renders its own <dl>. */
declare function Stat({ label, value, sub, tone, tip, size, variant, loading, className, }: StatProps): react.JSX.Element;
declare const GRID_BASE: {
    readonly 1: "grid-cols-1";
    readonly 2: "grid-cols-2";
    readonly 3: "grid-cols-3";
    readonly 4: "grid-cols-4";
};
declare const GRID_MD: {
    readonly 2: "md:grid-cols-2";
    readonly 3: "md:grid-cols-3";
    readonly 4: "md:grid-cols-4";
    readonly 5: "md:grid-cols-5";
    readonly 6: "md:grid-cols-6";
};
interface StatGridProps {
    /** Columns on phones (base, default 2) and from 768px (md, default 4). */
    cols?: {
        base?: keyof typeof GRID_BASE;
        md?: keyof typeof GRID_MD;
    };
    /** Stat elements. */
    children: ReactNode;
    className?: string;
}
/** A responsive grid of Stats, rendered as one <dl>. */
declare function StatGrid({ cols, children, className }: StatGridProps): react.JSX.Element;
/** ok, warn or loss for a value against two thresholds. When loss is above warn, higher
 *  is worse (disk use: { warn: 75, loss: 90 }). When loss is below warn, lower is worse
 *  (battery: { warn: 30, loss: 10 }). */
declare function toneFor(value: number, t: {
    warn: number;
    loss: number;
}): 'ok' | 'warn' | 'loss';
type ChartTone = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
type MeterTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | ChartTone;
declare const METER_THICK: {
    readonly xs: "h-1";
    readonly sm: "h-1.5";
    readonly md: "h-2.5";
};
interface MeterProps {
    /** The current value, between min and max (clamped). */
    value: number;
    /** Default 0. */
    min?: number;
    /** Default 100. */
    max?: number;
    /** Accessible name: what is being measured ("Disk used"). Required, since the bar has no text. */
    label: string;
    /** Fill color. Overrides thresholds. Default: from thresholds, else accent. */
    tone?: MeterTone;
    /** Picks ok, warn or loss from the value (see toneFor) when tone is not given. */
    thresholds?: {
        warn: number;
        loss: number;
    };
    /** Bar thickness: xs 4px, sm 6px (default), md 10px. */
    size?: keyof typeof METER_THICK;
    /** vertical fills from the bottom; give the meter a height (className="h-16"). */
    orientation?: 'horizontal' | 'vertical';
    /** Track color: elevated on a surface (default), overlay when the meter sits on an
     *  elevated box. */
    track?: 'elevated' | 'overlay';
    /** meter: a measurement (role="meter"). progress: work being done (role="progressbar"). */
    kind?: 'meter' | 'progress';
    /** Shows the rounded percentage beside a horizontal bar. */
    showValue?: boolean;
    className?: string;
}
/** A thin bar showing how full something is: disk, quota, progress, a score. */
declare function Meter({ value, min, max, label, tone, thresholds, size, orientation, track, kind, showValue, className, }: MeterProps): react.JSX.Element;
type SparklineTone = ChartTone | 'accent' | 'ok' | 'warn' | 'loss' | 'info';
interface SparklineProps {
    /** The series, oldest first. null leaves a gap (a missed check, a closed market). */
    values: (number | null)[];
    /** Accessible name, ideally with the trend: "Response time, last 24 hours, 120 to 180 ms". */
    label: string;
    /** Line color. Default chart-1. */
    tone?: SparklineTone;
    /** Width in px. Default 120; pass className="w-full" to stretch it. */
    width?: number;
    /** Height in px. Default 28. */
    height?: number;
    /** Shades the area under the line. */
    fill?: boolean;
    /** Bottom of the scale. Default: the smallest value. */
    min?: number;
    /** Top of the scale. Default: the largest value. */
    max?: number;
    className?: string;
}
/** A tiny line chart with no axes, for a trend beside a number. Plain SVG, no chart
 *  library. Gaps at nulls; a flat dashed line when there is no data. */
declare function Sparkline({ values, label, tone, width, height, fill, min, max, className, }: SparklineProps): react.JSX.Element;
interface DisclosureProps {
    /** The always-visible row that opens and closes it. */
    summary: ReactNode;
    /** What it reveals. */
    children: ReactNode;
    /** Starts open (uncontrolled). */
    defaultOpen?: boolean;
    /** Controlled open state; pair it with onOpenChange. */
    open?: boolean;
    /** Called with the new state when the reader toggles it. */
    onOpenChange?: (open: boolean) => void;
    /** plain: a bare row (default). card: a bordered surface box. */
    variant?: 'plain' | 'card';
    className?: string;
}
/** Show-more on native <details>/<summary>: keyboard and find-in-page work for free,
 *  with a chevron that turns when open. */
declare function Disclosure({ summary, children, defaultOpen, open, onOpenChange, variant, className, }: DisclosureProps): react.JSX.Element;
/** A keyboard key or shortcut, e.g. <Kbd>⌘K</Kbd>. */
declare function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>): react.JSX.Element;
/** Copies text to the clipboard. Uses the Clipboard API, falling back to a hidden
 *  textarea for insecure origins and old browsers. Resolves true when it worked. */
declare function copyText(text: string): Promise<boolean>;
interface CopyButtonProps {
    /** What lands on the clipboard. */
    text: string;
    /** Button text, and the accessible name when iconOnly. Default "Copy". */
    label?: string;
    /** Shown for 1.5s after a copy and announced politely. Default "Copied". */
    copiedLabel?: string;
    /** A square IconButton instead of a labelled Button. */
    iconOnly?: boolean;
    /** Button size (or IconButton size when iconOnly). Default sm. */
    size?: 'sm' | 'md';
    /** Button variant when not iconOnly. Default secondary. */
    variant?: ButtonProps['variant'];
    /** Called after each copy attempt with whether it worked. */
    onCopy?: (ok: boolean) => void;
    className?: string;
}
/** Copies text with one click, shows "Copied" for 1.5s and tells screen readers. */
declare function CopyButton({ text, label, copiedLabel, iconOnly, size, variant, onCopy, className, }: CopyButtonProps): react.JSX.Element;
interface PageHeaderProps {
    /** The page's title. */
    title: ReactNode;
    /** One sentence under the title. */
    description?: ReactNode;
    /** A small line above the title (a section or a breadcrumb). */
    eyebrow?: ReactNode;
    /** A back link above everything, e.g. the app's own
     *  <Link className={buttonClass({ variant: 'link' })}>← Jobs</Link>. */
    back?: ReactNode;
    /** Buttons on the right; they wrap under the title on phones. */
    actions?: ReactNode;
    /** Heading level. Default h1. */
    as?: 'h1' | 'h2';
    /** Sticks to the top with the glass background while the page scrolls. */
    sticky?: boolean;
    className?: string;
}
/** The title block at the top of a page: optional back link and eyebrow, the title,
 *  a description and actions. */
declare function PageHeader({ title, description, eyebrow, back, actions, as: H, sticky, className, }: PageHeaderProps): react.JSX.Element;
interface AppHeaderProps {
    /** The app's name, shown as the wordmark. */
    name: ReactNode;
    /** An icon before the name, drawn in the accent color. */
    icon?: ReactNode;
    /** Where the "← nish.software" pill goes. Default https://nish.software. */
    hubHref?: string;
    /** Buttons before the theme toggle. */
    actions?: ReactNode;
    /** A second row of nav links (use tabClass on each, aria-current on the active one). */
    nav?: ReactNode;
    /** Replaces the default <ThemeToggle />; false hides it. */
    themeToggle?: ReactNode | false;
    /** Sticks to the top of the page. Default true. */
    sticky?: boolean;
    /** Classes for the inner rows, e.g. "mx-auto max-w-6xl" to match the page width. */
    innerClassName?: string;
    className?: string;
}
/** The shared app header: the hub pill, the wordmark, actions and the theme toggle,
 *  with an optional nav row. Glass background, safe-area aware. */
declare function AppHeader({ name, icon, hubHref, actions, nav, themeToggle, sticky, innerClassName, className, }: AppHeaderProps): react.JSX.Element;

type Align = 'left' | 'center' | 'right';
type RowTone = 'ok' | 'warn' | 'loss';
/** The table recipes as strings, for renderers that take classes (TanStack Table cells,
 *  static markup). The components below use exactly these. */
declare const tableClass: {
    /** The scroll box around the table. */
    readonly wrap: "overflow-auto rounded-xl border border-th-line bg-th-surface";
    /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
    readonly sticky: "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-th-surface";
    /** The <table>. */
    readonly table: "w-full border-collapse text-sm tabular-nums text-th-hi2";
    /** Add to table for striped rows. */
    readonly zebra: "[&_tbody>tr:nth-child(even)]:bg-th-elevated/50";
    /** A header cell (add padY.normal or padY.dense). */
    readonly th: "whitespace-nowrap border-b border-th-line px-3 text-left align-bottom text-xs font-medium uppercase tracking-wider text-th-hi3";
    /** A body cell (add padY.normal or padY.dense). */
    readonly td: "px-3 align-middle";
    /** Vertical cell padding: normal or dense. */
    readonly padY: {
        readonly normal: "py-2.5";
        readonly dense: "py-1.5";
    };
    /** A body row. */
    readonly tr: "border-b border-th-line last:border-b-0";
    /** Add to tr for a clickable row. */
    readonly trInteractive: "cursor-pointer transition-colors hover:bg-th-elevated focus-within:bg-th-elevated";
    /** Add to th or td for a right-aligned number column. */
    readonly numeric: "text-right tabular-nums";
    /** Add to tr for a status edge. */
    readonly tone: Record<RowTone, string>;
};
interface TableWrapProps extends HTMLAttributes<HTMLDivElement> {
    /** The table's minimum width (e.g. 640 or '40rem'); narrower screens scroll sideways
     *  inside the box instead of squeezing columns. */
    minWidth?: number | string;
    /** Caps the height (e.g. 480 or '60vh'); the body scrolls inside. */
    maxHeight?: number | string;
    /** Keeps the header row visible while the body scrolls. Pair it with maxHeight. */
    stickyHeader?: boolean;
}
/** The bordered scroll box a table sits in. Use it instead of a Card for tables. */
declare function TableWrap({ minWidth, maxHeight, stickyHeader, className, style, children, ...rest }: TableWrapProps): react.JSX.Element;
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
    /** Tighter rows (6px vertical padding instead of 10px) for dense data. */
    dense?: boolean;
    /** Striped body rows. */
    zebra?: boolean;
}
/** A full-width table with tabular numbers. Put it in a TableWrap. */
declare function Table({ dense, zebra, className, ...rest }: TableProps): react.JSX.Element;
interface ThProps extends Omit<ThHTMLAttributes<HTMLTableCellElement>, 'align'> {
    /** Text alignment. Default left (right when numeric). */
    align?: Align;
    /** A number column: right-aligned with tabular figures. */
    numeric?: boolean;
    /** The column's current sort, or false when it is sortable but not sorted. Leave it
     *  undefined for a column that does not sort. Sets aria-sort. */
    sort?: 'asc' | 'desc' | false;
    /** Makes the header a button that asks to sort (cycle the order in your state). */
    onSort?: () => void;
}
/** A header cell. With onSort it holds a sort button and reports aria-sort. */
declare function Th({ align, numeric, sort, onSort, className, children, scope, ...rest }: ThProps): react.JSX.Element;
interface TdProps extends Omit<TdHTMLAttributes<HTMLTableCellElement>, 'align'> {
    /** Text alignment. Default left (right when numeric). */
    align?: Align;
    /** A number column: right-aligned with tabular figures. */
    numeric?: boolean;
}
/** A body cell. */
declare function Td({ align, numeric, className, ...rest }: TdProps): react.JSX.Element;
interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
    /** A 3px status edge on the left (ok, warn, loss). Say the status in a cell too. */
    tone?: RowTone;
    /** Hover and focus-within highlight for a clickable row. Put a real link or button
     *  in the row as well, so keyboard users can reach it. */
    interactive?: boolean;
    /** Quieter text for inactive or archived rows. */
    muted?: boolean;
    /** Children are cells. */
    children?: ReactNode;
}
/** A body row with a divider. */
declare function Tr({ tone, interactive, muted, className, ...rest }: TrProps): react.JSX.Element;

interface ThemeState {
    /** What was picked: 'system' or a theme name. */
    choice: ThemeChoice;
    /** What is rendering now. */
    theme: ThemeName;
    /** dark or light: what the rendering theme is based on. */
    scheme: 'dark' | 'light';
    /** Save a choice (cookie and localStorage) and apply it. */
    setChoice: (choice: ThemeChoice) => void;
}
/** The current theme choice and what it renders as, kept in sync across tabs and
 *  subdomains. */
declare function useTheme(): ThemeState;
interface ThemeToggleProps {
    /** Also offer the extra presets (slate, terminal, …) in a select. */
    presets?: boolean;
    /** Show "System", "Light" and "Dark" text beside the icons. */
    labels?: boolean;
    /** Fill the container's width, with equal-width segments. */
    block?: boolean;
    /** sm: 28px segments (default). md: 32px. Both grow to 44px on touch screens. */
    size?: 'sm' | 'md';
    /** One icon button that cycles System, Light, Dark and shows the current choice; for
     *  collapsed sidebars and tight headers. Ignores labels, block and presets. */
    compact?: boolean;
    className?: string;
}
/** System / Light / Dark as a Segmented radio group, optionally with a preset picker,
 *  or one cycling icon button when compact. */
declare function ThemeToggle({ presets, labels, block, size, compact, className }: ThemeToggleProps): react.JSX.Element;

interface SegmentedOption<T extends string> {
    value: T;
    label: ReactNode;
    /** Screen-reader name when the label is only an icon. */
    ariaLabel?: string;
    /** Hover tooltip (the native title), mainly for icon-only options. */
    title?: string;
    /** Shown but not selectable; the arrow keys skip it. */
    disabled?: boolean;
}
interface SegmentedProps<T extends string> {
    /** Name of the whole group for screen readers: "Chart range". */
    label: string;
    options: SegmentedOption<T>[];
    /** The selected value; a value not among the options leaves none selected. */
    value: T | (string & {});
    onChange: (value: T) => void;
    /** xs: 24px for dense widget headers. sm: 28px (default). md: 32px. All grow to 44px
     *  on touch screens. */
    size?: 'xs' | 'sm' | 'md';
    /** Fill the container's width, with equal-width options. */
    block?: boolean;
    className?: string;
}
/** A small set of mutually exclusive choices shown side by side (24h / 7d / 30d): a
 *  radio group. The selected option gets the accent tint and ring, so it reads at a
 *  glance in light themes too. Arrow keys, Home and End move the choice and the focus,
 *  like a native radio group. For multi-select toggles use ChipGroup and Chip. */
declare function Segmented<T extends string>({ label, options, value, onChange, size, block, className }: SegmentedProps<T>): react.JSX.Element;

export { AppHeader, Badge, Button, Callout, Card, CardHeader, Checkbox, Chip, ChipGroup, ConfirmDialog, CopyButton, Disclosure, Drawer, DropdownMenu, EmptyState, ErrorState, Field, IconButton, Input, Kbd, Label, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader, Meter, Modal, PageHeader, Popover, SearchInput, Segmented, Select, Skeleton, SkeletonLines, Sparkline, Spinner, Stat, StatGrid, StatusDot, Switch, TabPanel, Table, TableWrap, Tabs, Td, Textarea, Th, ThemeChoice, ThemeName, ThemeToggle, Toaster, Tooltip, Tr, badgeClass, buttonClass, cardClass, cn, copyText, dismissToast, fieldClass, iconButtonClass, signTone, tabClass, tableClass, toast, toneFor, useTheme, useToast };
export type { AppHeaderProps, BadgeClassOptions, BadgeHue, BadgeProps, ButtonClassOptions, ButtonProps, ButtonSize, ButtonVariant, CalloutProps, CalloutTone, CardClassOptions, CardElement, CardHeaderProps, CardPadding, CardProps, CheckboxProps, ChipGroupProps, ChipProps, ConfirmDialogProps, CopyButtonProps, DisclosureProps, DrawerProps, DropdownMenuProps, EmptyStateProps, ErrorStateProps, FieldClassOptions, FieldProps, FieldSize, IconButtonClassOptions, IconButtonProps, IconButtonSize, IconButtonVariant, InputProps, MenuItemProps, MenuSubHeaderProps, MeterProps, MeterTone, ModalProps, PageHeaderProps, PopoverProps, SearchInputProps, SegmentedOption, SegmentedProps, SelectProps, SparklineProps, SparklineTone, SpinnerProps, StatGridProps, StatProps, StatusDotProps, StatusTone, SwitchProps, TabItem, TabPanelProps, TableProps, TableWrapProps, TabsProps, TdProps, TextareaProps, ThProps, ThemeState, ThemeToggleProps, ToastAction, ToastItem, ToastOptions, ToastTone, ToasterProps, TooltipProps, TrProps };
