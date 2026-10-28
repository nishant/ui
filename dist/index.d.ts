import { ClassValue } from 'clsx';
import { T as ThemeChoice, a as ThemeName } from './theme-EcTfGqpV.js';
export { C as COLOR_ROLES, b as ConfirmDialogOptions, D as DEFAULT_THEME, H as HUE_ROLES, M as MountScrollspyOptions, c as MountThemeToggleOptions, P as PRESETS, S as SCALE, d as SHADOWS, e as SOFT_ROLES, f as ShowToastOptions, g as StaticToastTone, h as THEMES, i as TOGGLE_ORDER, j as ThemePreset, k as ThemeToggleLabels, l as applyTheme, m as confirmDialog, n as cycleTheme, o as getThemeChoice, p as initTheme, q as isThemeName, r as mountChecklist, s as mountHeightVar, t as mountScrollspy, u as mountStuck, v as mountThemeToggle, w as mountTooltips, x as onThemeChange, y as openSheet, z as readToken, A as registerThemes, B as resolveTheme, E as schemeOf, F as setThemeChoice, G as showToast } from './theme-EcTfGqpV.js';
import * as react from 'react';
import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, InputHTMLAttributes, SelectHTMLAttributes, ChangeEvent, MouseEvent, TextareaHTMLAttributes, CSSProperties, ReactElement, RefObject, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, ElementType } from 'react';

/** Conditional Tailwind classes with conflict resolution. */
declare function cn(...inputs: ClassValue[]): string;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'subtle' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
interface ButtonClassOptions {
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
declare function buttonClass({ variant, size, inline, className }?: ButtonClassOptions): string;
interface LinkClassOptions {
    /** accent: the accent color (default). muted: grey text that lights up on hover. */
    tone?: 'accent' | 'muted';
    /** Skip the 44px touch hit area, for a link inside running text. */
    inline?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes for a text link on a router `<Link>` or `<a>`: tone, underline on hover
 *  and, on touch screens, a 44px hit area that does not move the layout. */
declare function linkClass({ tone, inline, className }?: LinkClassOptions): string;
/** Classes that hide a row action until its row is hovered or focused, and always show
 *  it on touch screens (there is no hover). Put `group` on the row. */
declare function revealClass(className?: string): string;
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
    /** Shows a spinner and disables the button. */
    loading?: boolean;
    /** Icon before the label (16px for md and lg, 12–14px for xs and sm). Replaced by the
     *  spinner while loading. */
    icon?: ReactNode;
}
/** The standard button. Defaults to type="button", so it never submits a form by
 *  accident; pass type="submit" for the one that should. */
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;
type IconButtonSize = '2xs' | 'xs' | 'sm' | 'md';
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
    /** 2xs: 20px (row-level reveal actions, 22px widget title bars), xs: 24px (dense
     *  headers), sm: 28px, md: 36px. All grow to 44px on touch screens. */
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
type BadgeTone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info' | 'on-accent';
type Tone = BadgeTone;
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
    /** Text on its own soft tint; every tone clears 4.5:1 in every theme. on-accent: a
     *  small label inside a solid accent fill (a primary Button, an accent link), in the
     *  on-accent color over a 20% on-accent tint. It has no hover state; pair a short
     *  label with sr-only text that says what it means. */
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
    /** md h-9 (default), sm h-8 with 12px text, xs h-7 with 11px text. Touch screens
     *  always get 16px text and a 44px height. (Replaces the native size attribute; set a width with
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
/** Text input. 16px text on touch screens so iOS does not zoom the page on focus. */
declare const Input: react.ForwardRefExoticComponent<InputProps & react.RefAttributes<HTMLInputElement>>;
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    /** Red border and aria-invalid. */
    invalid?: boolean;
    /** md h-9 (default), sm h-8, xs h-7, the same as Input. Touch screens get 16px text
     *  and a 44px height. (Replaces the native size attribute, which turns a select into a list box.) */
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
     *  panels. Touch screens always get 16px text so iOS does not zoom. */
    size?: 'sm' | 'md';
    /** Grow with the content instead of scrolling (chat composers, notes). `true` grows
     *  without limit; `{ maxRows }` stops growing and scrolls past that many lines. `rows`
     *  stays the minimum height. Turns off the manual resize handle. */
    autoGrow?: boolean | {
        maxRows: number;
    };
}
/** Multi-line text with the shared field look. 16px text on touch screens (no iOS zoom); the
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
interface FieldGroupProps extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
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
declare function FieldGroup({ label, hint, error, optional, className, children, ...rest }: FieldGroupProps): react.JSX.Element;
interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'type'> {
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
declare const SearchInput: react.ForwardRefExoticComponent<SearchInputProps & react.RefAttributes<HTMLInputElement>>;
type ChipVariant = 'toggle' | 'suggestion' | 'tag';
interface ChipClassOptions {
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
declare function chipClass({ pressed, variant, size, className }?: ChipClassOptions): string;
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
type TabsSize = 'xs' | 'sm' | 'md';
/** The breakpoint from which responsive tabs show every panel at once. */
type TabsBreakpoint = 'md' | 'lg';
/** The look of one tab, for router links that act as tabs:
 *  `<NavLink className={({ isActive }) => tabClass({ active: isActive })}>`. Router links
 *  are navigation, not ARIA tabs: they take aria-current="page", not role="tab". */
declare function tabClass(o: {
    /** The selected (or current-page) look. */
    active: boolean;
    /** underline (default) or pill. */
    variant?: TabsVariant;
    /** md (default), sm or xs, the same as Tabs. */
    size?: TabsSize;
    /** Equal-width tab that fills its share of the row (Tabs block). */
    block?: boolean;
    /** Extra classes, merged last. */
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
    /** md: 14px text (default). sm: 12px for card headers. xs: 11px for dense widget
     *  strips (pill h-6, underline h-7). All 44px on touch screens. */
    size?: TabsSize;
    /** The tab list fills its container and every tab gets an equal share of the width,
     *  like Segmented block. */
    block?: boolean;
    /** Responsive panes: from this breakpoint (md 768px, lg 1024px) the tab list is not
     *  rendered, and TabPanels with the same showFrom render as plain regions side by
     *  side. Below it, the full ARIA tabs pattern applies. */
    hideFrom?: TabsBreakpoint;
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
declare function Tabs({ value, onChange, items, label, variant, size, block, hideFrom, idBase, controlsPanels, children, className, }: TabsProps): react.JSX.Element | null;
interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
    /** The tab value this panel belongs to. */
    value: string;
    /** Only when the panel renders outside its Tabs: the same idBase as the Tabs. */
    idBase?: string;
    /** Only when the panel renders outside its Tabs: whether its tab is selected. */
    active?: boolean;
    /** Responsive panes: from this breakpoint (md 768px, lg 1024px) the panel always
     *  renders, as a plain region (no role="tabpanel", never hidden). Pair it with the
     *  same hideFrom on Tabs. */
    showFrom?: TabsBreakpoint;
    /** Keep the content mounted (hidden) while the tab is not selected, so state such as
     *  a scroll position or a draft survives switching tabs. */
    keepMounted?: boolean;
    children?: ReactNode;
}
/** The content for one tab: role="tabpanel", labelled by its tab, hidden unless its tab
 *  is selected. Render it as a child of Tabs, or pass idBase and active. */
declare function TabPanel({ value, idBase, active, showFrom, keepMounted, children, className, ...rest }: TabPanelProps): react.JSX.Element;

/** One shimmer block; size it with width/height classes. */
declare function Skeleton({ className, style, }: {
    /** Size and shape: h-4 w-2/5, size-9 rounded-full, … */
    className?: string;
    /** For sizes known only at runtime, e.g. { height: chartHeight }. */
    style?: CSSProperties;
}): react.JSX.Element;
interface SkeletonRowsProps {
    /** How many rows. Default 5. */
    rows?: number;
    /** Height of each row: pixels or any CSS length. Default 56. */
    height?: number | string;
    /** Space between rows: sm 6px, md 10px (default). */
    gap?: 'sm' | 'md';
    /** Accessible name of the loading region. Default "Loading". */
    label?: string;
    /** Classes for the column (padding, margins). */
    className?: string;
    /** Classes for every row, e.g. "h-16" instead of height, or "rounded-lg". */
    rowClassName?: string;
}
/** A column of full-width, card-shaped shimmer rows (rounded-xl) while a list or table
 *  loads, announced once (role="status"). The shimmer stops under reduced motion. For a
 *  card body's text lines, use SkeletonLines. */
declare function SkeletonRows({ rows, height, gap, label, className, rowClassName }: SkeletonRowsProps): react.JSX.Element;
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
interface SkeletonCardProps {
    /** Text lines under the title bar. Default 3. */
    lines?: number;
    /** A media block above the text: square (96px), wide (16:9) or none (default). */
    media?: 'square' | 'wide' | 'none';
    className?: string;
}
/** A card-shaped shimmer for one loading card: optional media, a title bar and text lines. */
declare function SkeletonCard({ lines, media, className }: SkeletonCardProps): react.JSX.Element;
interface StatGridSkeletonProps {
    /** How many tiles. Default 4. */
    count?: number;
    className?: string;
}
/** Shimmer tiles that match a StatGrid (2 columns, 4 from md) while its numbers load. */
declare function StatGridSkeleton({ count, className }: StatGridSkeletonProps): react.JSX.Element;
interface CardListSkeletonProps {
    /** How many cards. Default 3. */
    count?: number;
    /** Text lines in each card. Default 2. */
    lines?: number;
    className?: string;
}
/** A stack of shimmer cards while a card list loads, announced once (role="status"). */
declare function CardListSkeleton({ count, lines, className }: CardListSkeletonProps): react.JSX.Element;
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
    /** Distance from the bottom of the screen on phones (under 640px, or up to
     *  offsetUntil), e.g. 'calc(4.5rem + env(safe-area-inset-bottom))' to clear a bottom
     *  tab bar. Default: 8px above --nish-bottom-inset (published by BottomNav and
     *  StickyActionBar), or 12px above the safe area, whichever is larger. */
    offset?: string;
    /** The breakpoint where offset stops applying: sm 640px, md 768px (default, matching BottomNav's hideFrom) or lg
     *  1024px. Match it to where the app's bottom tab bar hides, so a toast never covers
     *  the bar. From sm the stack still moves to the bottom right; between sm and this
     *  breakpoint it keeps the offset. */
    offsetUntil?: 'sm' | 'md' | 'lg';
}
/** The toast stack: bottom-center full width on phones, bottom-right on wider screens.
 *  It sits above any bottom bar through --nish-bottom-inset, and moves to the top of
 *  the screen on phones while a sheet or dialog is open (html[data-nish-layer-open]). */
declare function Toaster({ className, offset, offsetUntil }: ToasterProps): react.ReactPortal | null;

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
    /** Phone sheet height (under 640px). auto: as tall as the content, up to 92% of the
     *  screen (default). tall: always 92%. full: the whole screen, square at the top. */
    sheetHeight?: 'auto' | 'tall' | 'full';
    /** Phone sheet: draw the grab handle and let a swipe down on it or the header close
     *  the sheet (default true). false: no handle, no swipe. */
    dismissible?: boolean;
    /** Android back and the browser back button close the dialog instead of leaving the
     *  page (default true). Pass false for a dialog that must not touch history. */
    closeOnBack?: boolean;
    /** Asked before any close (X, Escape, scrim, swipe, back). Return false to keep the
     *  dialog open with no exit animation, e.g. while a form holds invalid input; show
     *  the reason yourself. */
    canClose?: () => boolean;
    className?: string;
}
/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll (on both <html> and <body>) while open. */
declare function Modal({ title, onClose, children, size, footer, subtitle, placement, header, hideClose, 'aria-label': ariaLabel, sheetHeight, dismissible, closeOnBack, canClose, className, }: ModalProps): react.ReactPortal;
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
    /** Bottom sheets: draw the grab handle and let a swipe down on it or the header close
     *  the sheet (default true). false: no handle, no swipe. */
    dismissible?: boolean;
    /** Android back and the browser back button close the drawer instead of leaving the
     *  page (default true). Pass false for a drawer that must not touch history. */
    closeOnBack?: boolean;
    /** Asked before any close (X, Escape, scrim, swipe, back). Return false to keep the
     *  drawer open with no exit animation; show the reason yourself. */
    canClose?: () => boolean;
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
declare function Drawer({ title, subtitle, onClose, side, size, actions, footer, bottomOffset, dismissible, closeOnBack, canClose, 'aria-label': ariaLabel, children, className, }: DrawerProps): react.ReactPortal;
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
/** Why a Popover or DropdownMenu closed itself: Escape, a press outside, or Tab out. */
type PopoverCloseReason = 'escape' | 'outside' | 'tab';
interface PopoverProps {
    /** Whether the panel shows. The popover is controlled: pair it with `onOpenChange`. */
    open: boolean;
    /** Called with false on Escape, a press outside, and Tab out of the panel. The second
     *  argument says which one: 'escape', 'outside' or 'tab'. */
    onOpenChange: (open: boolean, reason: PopoverCloseReason) => void;
    /** Close on a press outside the panel and its anchor (default true). Set false for
     *  an editor that must stay open while the user drags things outside it; Escape and
     *  Tab out still close it. */
    dismissOnOutside?: boolean;
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
declare function Popover({ open, onOpenChange, dismissOnOutside, anchor, side, align, width, 'aria-label': ariaLabel, className, children, }: PopoverProps): react.ReactPortal | null;
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
    /** Called whenever the menu opens or closes. When the menu closed itself, the second
     *  argument says why: 'escape', 'outside' or 'tab' (undefined after a selection or a
     *  trigger click). */
    onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
    /** Opens on mount when uncontrolled (previews, tests). */
    defaultOpen?: boolean;
    /** Accessible name of the menu. Default: the trigger's name (aria-labelledby). */
    'aria-label'?: string;
    /** `'sm'`: under 640px the menu opens as a bottom sheet with 48px rows instead of a
     *  floating panel. Default false (always a floating panel). */
    sheetBelow?: 'sm' | false;
    /** Title of the bottom sheet when `sheetBelow` is set. Default "Menu". */
    sheetTitle?: string;
    /** Classes for the menu panel (e.g. a width, or `app-region-no-drag`). */
    className?: string;
}
/** A menu of actions behind a button: role="menu" with arrow keys, Home and End,
 *  Escape, Tab to leave, and focus back on the trigger when it closes. */
declare function DropdownMenu({ trigger, align, side, children, open: openProp, onOpenChange, defaultOpen, 'aria-label': ariaLabel, sheetBelow, sheetTitle, className, }: DropdownMenuProps): react.JSX.Element;
interface MenuItemClassOptions {
    /** The current choice: the highlighted look (set aria-current on the row too). */
    active?: boolean;
    /** A destructive action: loss-colored text and hover. */
    danger?: boolean;
    /** The disabled look (set disabled or aria-disabled on the row too). */
    disabled?: boolean;
    /** Extra classes, merged last. */
    className?: string;
}
/** The classes `<MenuItem>` renders, for menu-looking rows that are not in a
 *  DropdownMenu: tabbable buttons in a Popover panel that also holds IconButtons,
 *  inputs or color pickers. The rows keep their own roles (plain buttons, Tab order);
 *  hover and keyboard focus get the same highlight as MenuItem. */
declare function menuItemClass({ active, danger, disabled, className }?: MenuItemClassOptions): string;
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
interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onClick'> {
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
    /** Sticks under the app header (`top: var(--nish-header-h)`), above page content. Pair
     *  with variant="bar". */
    sticky?: boolean;
    /** Limits the body to 1, 2 or 3 lines with an ellipsis, instead of growing. */
    clamp?: 1 | 2 | 3;
    /** Makes the icon, title and text one link (at least 44px tall) with a trailing
     *  chevron. `action` and the dismiss button stay separate controls beside it. */
    href?: string;
    /** Like href, but a button. */
    onClick?: () => void;
    /** Shows a "+{count}" badge after the title, for "and 3 more" notices. */
    count?: number;
}
/** An inline notice: a tinted box with an icon, an optional title, text and an action.
 *  variant="bar" is opaque, so it can stick under the header without content showing
 *  through. */
declare function Callout({ tone, icon, title, children, action, onDismiss, variant, compact, live, sticky, clamp, href, onClick, count, className, ...rest }: CalloutProps): react.JSX.Element;
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
type ChartTone$1 = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
type MeterTone = 'accent' | 'ok' | 'warn' | 'loss' | 'info' | 'neutral' | ChartTone$1;
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
    /** Fill color. Overrides thresholds. Default: from thresholds, else accent. neutral:
     *  a gray fill for a quantity with no status meaning (swap, a share of a total). */
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
type SparklineTone = ChartTone$1 | 'accent' | 'ok' | 'warn' | 'loss' | 'info';
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
    /** Sticks under the app header (`top: var(--nish-header-h)`) with an opaque background
     *  while the page scrolls; a bottom border appears once it is stuck. */
    sticky?: boolean;
    /** Sticky only: under 640px, once stuck, hide the description and show the title as
     *  one truncated line, so the bar stays short. Default true. */
    collapseWhenStuck?: boolean;
    className?: string;
}
/** The title block at the top of a page: optional back link and eyebrow, the title,
 *  a description and actions. */
declare function PageHeader({ title, description, eyebrow, back, actions, as: H, sticky, collapseWhenStuck, className, }: PageHeaderProps): react.JSX.Element;
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
    /** Makes the icon and name one link home (a 44px target), e.g. "/". */
    homeHref?: string;
    /** Under 640px show only the icon; the name stays for screen readers, so the pill,
     *  actions and theme toggle fit on one row. Needs an icon. */
    hideNameBelow?: 'sm';
    /** Names the nav row's <nav> landmark ("Trackers"), so several navs on a page can be
     *  told apart. */
    navLabel?: string;
    /** Under 480px the hub pill shrinks to its arrow (.nish-pill-link--compact), for
     *  headers with a long name. */
    compactPill?: boolean;
    /** Frosted glass (`bg-th-bg/80 backdrop-blur-xl`) where the browser supports
     *  backdrop-filter. Off by default: the header is opaque. */
    glass?: boolean;
    /** Extra MenuItems. From 640px they render after `actions`; under 640px they collapse
     *  into a "More actions" kebab menu, so the row never wraps. */
    overflowActions?: ReactNode;
    className?: string;
}
/** The shared app header: the hub pill, the wordmark, actions and the theme toggle,
 *  with an optional nav row. Opaque by default (glass is opt-in), safe-area aware. A
 *  sticky header publishes its height as `--nish-header-h` for the rest of the layout. */
declare function AppHeader({ name, icon, hubHref, actions, nav, themeToggle, sticky, innerClassName, homeHref, hideNameBelow, navLabel, compactPill, glass, overflowActions, className, }: AppHeaderProps): react.JSX.Element;
interface SectionHeaderProps {
    /** The section's title. */
    title: ReactNode;
    /** id for the heading, so the section can point aria-labelledby at it. */
    id?: string;
    /** Heading level. Default h2. */
    as?: 'h1' | 'h2' | 'h3';
    /** Quiet text on the right ("Updated 2 min ago", "3 of 12"). */
    meta?: ReactNode;
    /** A control on the right, after meta (a Button, a Segmented, a link). */
    action?: ReactNode;
    className?: string;
}
/** The heading row of a section inside a page: the title, with optional meta text
 *  and an action on the right. Smaller than PageHeader, larger than CardHeader. */
declare function SectionHeader({ title, id, as: H, meta, action, className }: SectionHeaderProps): react.JSX.Element;
interface KeyValueItem {
    /** React key; unique in the list. */
    key: string;
    /** The left side: a name, often with a StatusDot or an icon. */
    label: ReactNode;
    /** The right side: a value, a Badge, a status. */
    value: ReactNode;
    /** Let the row wrap instead of staying on one line; it grows taller than 44px (32px
     *  dense) when the text wraps. Both the `ul` and `dl` forms.
     *  - `true` or `'anywhere'`: a long value with no spaces (a path, a URL, an id). The value
     *    cell may shrink and breaks anywhere (`break-all`); the label keeps its width.
     *  - `'words'`: prose (a phrase-long status or error). Both cells wrap at word breaks,
     *    labels first: the label keeps its one-line width up to 60% of the row
     *    (`shrink-0 max-w-[calc(60%-0.75rem)]`), so a short label never wraps one word per
     *    line, and the value takes the rest, at least 40% (`min-w-0 flex-1 text-right`). A
     *    word splits only when it alone is wider than its cell (`overflow-wrap: anywhere`).
     *  Without `wrap` the value keeps its full width, so keep it short. */
    wrap?: boolean | 'anywhere' | 'words';
}
interface KeyValueListProps {
    items: KeyValueItem[];
    /** Rows 32px tall instead of 44px, for dense panels. */
    dense?: boolean;
    /** ul: a list of rows (default). dl: a description list with dt and dd, for label
     *  and value pairs that read as "name: value". */
    as?: 'ul' | 'dl';
    className?: string;
}
/** Label and value rows with dividers: services and their status, runner details,
 *  vitals. Each row is at least 44px tall (32px dense); an item with `wrap` lets its row
 *  wrap and grow: `true`/`'anywhere'` for a path or URL, `'words'` for prose. */
declare function KeyValueList({ items, dense, as, className }: KeyValueListProps): react.JSX.Element;
type ChartLegendTone = ChartTone$1 | 'accent' | 'ok' | 'warn' | 'loss' | 'info';
interface ChartLegendItem {
    /** The series name. */
    label: string;
    /** The series color, the same role the chart draws it in. */
    tone: ChartLegendTone;
}
interface ChartLegendProps {
    items: ChartLegendItem[];
    /** line: a short 3px x 10px stroke, for line charts (default). dot: an 8px dot, for
     *  bars and points. */
    marker?: 'line' | 'dot';
    /** Accessible name of the list. Default "Legend". */
    label?: string;
    className?: string;
}
/** The key for a multi-series chart (uPlot and canvas charts draw none of their own):
 *  each series' color mark and name. The marks are decorative; the names carry it. */
declare function ChartLegend({ items, marker, label, className }: ChartLegendProps): react.JSX.Element;

type Align = 'left' | 'center' | 'right';
type RowTone = 'ok' | 'warn' | 'loss';
/** The table recipes as strings, for renderers that take classes (TanStack Table cells,
 *  static markup). The components below use exactly these. */
declare const tableClass: {
    /** The scroll box around the table. */
    readonly wrap: "relative overflow-auto rounded-xl border border-th-line bg-th-surface";
    /** Add to wrap for a header that stays put while the body scrolls (give wrap a max height). */
    readonly sticky: "[&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[1] [&_thead_th]:bg-th-surface";
    /** The <table>. */
    readonly table: "w-full border-collapse text-sm tabular-nums text-th-hi2";
    /** Add to table for striped rows. */
    readonly zebra: "[&_tbody>tr:nth-child(even)]:bg-th-elevated/50";
    /** A header cell (add padY.normal or padY.dense). */
    readonly th: "whitespace-nowrap border-b border-th-line px-3 text-left align-middle text-xs font-medium uppercase tracking-wider text-th-hi3";
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
    readonly numeric: "whitespace-nowrap text-right tabular-nums";
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
    /** Fades the left and right edges while there is more to scroll sideways. Default true. */
    fade?: boolean;
    /** Pins the first column (header and body cells) to the left edge while the table
     *  scrolls sideways, with an edge shadow once it has scrolled. */
    stickyFirstColumn?: boolean;
}
/** The bordered scroll box a table sits in. Use it instead of a Card for tables. */
declare function TableWrap({ minWidth, maxHeight, stickyHeader, fade, stickyFirstColumn, className, style, children, ...rest }: TableWrapProps): react.JSX.Element;
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
    /** A number column: right-aligned with tabular figures, never wrapping. */
    numeric?: boolean;
    /** Keeps the cell's text on one line. */
    nowrap?: boolean;
}
/** A body cell. */
declare function Td({ align, numeric, nowrap, className, ...rest }: TdProps): react.JSX.Element;
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
    /** segmented: the System / Light / Dark radio group (default). pill: one cycling
     *  button in a 44px pill with a line-strong border, to sit next to the hub pill in a
     *  top bar (the React twin of .nish-theme-btn--pill). With labels, the pill also shows
     *  the current choice as a word (.nish-theme-btn--labelled). Ignores block and presets. */
    variant?: 'segmented' | 'pill';
    /** What the segmented toggle shows below 640px. compact (default): the one cycling
     *  button, so a phone header keeps to one row. segmented: the radio group at every
     *  width. A block toggle is always segmented. */
    phone?: 'compact' | 'segmented';
    /** sm (default): the segmented toggle collapses to the cycling button below 640px (see
     *  `phone`). never: it keeps the segmented control and the presets select at every
     *  width, for a drawer or settings page that has the room. */
    collapse?: 'sm' | 'never';
    className?: string;
}
/** System / Light / Dark as a Segmented radio group, optionally with a preset picker,
 *  or one cycling icon button when compact. */
declare function ThemeToggle({ presets, labels, block, size, compact, variant, phone, collapse, className, }: ThemeToggleProps): react.JSX.Element;

type SegmentedTone = 'accent' | 'warn' | 'loss';
interface SegmentedOption<T extends string> {
    value: T;
    label: ReactNode;
    /** Screen-reader name when the label is only an icon. */
    ariaLabel?: string;
    /** Hover tooltip (the native title) for a one-word hint on an icon-only option. Use
     *  tip for anything longer. */
    title?: string;
    /** A tooltip that explains the option. It opens on mouse hover and on keyboard focus of
     *  the radio itself (aria-describedby points at it while shown), so keyboard users get
     *  it too; a tap or click selects and closes it. The radio stays the group's only Tab
     *  stop. Replaces title. */
    tip?: ReactNode;
    /** The selected look: accent (default), or warn / loss for a choice that must read as
     *  a warning while it is on (a "bypass permissions" mode). */
    tone?: SegmentedTone;
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
    /** Too many options for the width: scroll (default) keeps one row that scrolls sideways
     *  with edge fades and keeps the selected option in view; wrap lets the control grow
     *  past its container as before. */
    overflow?: 'wrap' | 'scroll';
    /** @deprecated Alias of `block`; use `block`. Kept because the spec names it. */
    fullWidth?: boolean;
    className?: string;
}
/** A small set of mutually exclusive choices shown side by side (24h / 7d / 30d): a
 *  radio group. The selected option gets the accent tint and ring, so it reads at a
 *  glance in light themes too. Arrow keys, Home and End move the choice and the focus,
 *  like a native radio group. For multi-select toggles use ChipGroup and Chip. */
declare function Segmented<T extends string>({ label, options, value, onChange, size, block, overflow, fullWidth, className }: SegmentedProps<T>): react.JSX.Element;

/**
 * Publishes an element's height as a CSS variable on `<html>` (the layout contract:
 * `--nish-header-h`, `--nish-bottom-nav-h`, `--nish-bottom-bar-h`, `--nish-sticky-extra`).
 * The variable is written on mount and on every resize, and removed on unmount, when
 * `enabled` turns false, and while the element is hidden (`display: none` measures 0).
 * When several bars publish the same variable the largest height wins.
 *
 * @param ref - The bar to measure.
 * @param name - The variable name, e.g. `'--nish-header-h'`.
 * @param enabled - Set false to publish nothing (a bar hidden above its breakpoint).
 */
declare function useHeightVar(ref: RefObject<HTMLElement | null>, name: string, enabled?: boolean): void;
/**
 * True while a sticky element is stuck to its scroll edge: the page has scrolled and the
 * element rests at its sticky `top`. False at scroll 0 and for an element that is not
 * position:sticky. Also sets `data-stuck` on the element, so CSS can react without React
 * state. Same rules as `mountStuck` in `@nish/ui/theme`, which it uses: nothing is
 * inserted into the DOM, and the sticky `top` is re-read when the element resizes or
 * `<html>` style changes (`--nish-header-h`).
 *
 * @param ref - The sticky element.
 * @param enabled - Set false to skip observing (a header that is not sticky).
 */
declare function useStuck(ref: RefObject<HTMLElement | null>, enabled?: boolean): boolean;
/**
 * Tracks whether a horizontal scroller is at its start or end and writes
 * `data-at-start` / `data-at-end` ("true" / "false") on it, which `.nish-scroll-fade`
 * turns into edge fades. Updates on scroll, on resize and when children change.
 *
 * @param ref - The scrolling element.
 */
declare function useScrollEdges(ref: RefObject<HTMLElement | null>): void;

/** One destination in BottomNav, MoreSheet and NavRail. */
interface NavItem {
    key: string;
    label: string;
    /** A 20-24px SVG icon drawn in currentColor. */
    icon: ReactNode;
    /** Rendered as an `<a>` unless `renderLink` is given. */
    href?: string;
    /** Rendered as a `<button>` when there is no href. Also called when an `<a>` is clicked. */
    onSelect?: () => void;
    active?: boolean;
    /** true shows a dot; a number shows a count pill (99+ above 99). */
    badge?: number | boolean;
    /** One line of explanation: shown in MoreSheet rows and as the NavRail tooltip. */
    hint?: string;
}
/** Renders a router link for an item (React Router's `<Link>` and so on). Spread the given
 *  props onto it: `className` carries the look, `children` the icon and label, and
 *  `onClick` runs the item's `onSelect` and closes a sheet. */
type RenderLink = (item: NavItem, props: {
    className: string;
    children: ReactNode;
    'aria-current'?: 'page';
    onClick?: () => void;
    /** true when rendered inside a sheet: pass it to the router's `<Link replace>` so the
     *  navigation replaces the sheet's own history entry instead of stacking on it. */
    replace?: boolean;
}) => ReactElement;
type NavBreakpoint = 'md' | 'lg';
interface BottomNavProps {
    /** The destinations. Four or five fit a 360px screen; put the rest behind `more`. */
    items: NavItem[];
    /** A last "More" button that opens a MoreSheet. You own the sheet's open state. */
    more?: {
        label?: string;
        icon?: ReactNode;
        /** Highlight the button, e.g. when the current page lives inside the sheet. */
        active: boolean;
        expanded: boolean;
        onToggle: () => void;
    };
    /** Rendered after a thin divider (a search or add button). */
    trailing?: ReactNode;
    /** The breakpoint from which the bar is hidden (default md, 768px). */
    hideFrom?: NavBreakpoint;
    /** Names the nav landmark. Default "Sections". */
    label?: string;
    /** Renders router links instead of plain anchors. */
    renderLink?: RenderLink;
    className?: string;
}
/** A phone tab bar fixed to the bottom of the screen: icon over label, the current page
 *  tinted, safe-area padding and 56px targets. It publishes its height as
 *  `--nish-bottom-nav-h` while it is visible, so Toaster, StickyActionBar and page
 *  padding make room for it. Hidden from `hideFrom` up (pair it with NavRail or a sidebar). */
declare function BottomNav({ items, more, trailing, hideFrom, label, renderLink, className }: BottomNavProps): react.JSX.Element;
interface MoreSheetProps {
    open: boolean;
    /** Called on Escape, a scrim click, the swipe, Android back and after a row is chosen. */
    onClose: () => void;
    items: NavItem[];
    /** Default "More". */
    title?: string;
    /** Pinned under the list. Defaults to a "Theme" row with a segmented ThemeToggle. */
    footer?: ReactNode;
    renderLink?: RenderLink;
}
/** The overflow sheet behind BottomNav's More button: a bottom Drawer lifted above the bar,
 *  so the bar stays visible and tappable. Rows are 52px with an icon, a label and a
 *  one-line hint. Choosing a row navigates and closes the sheet. */
declare function MoreSheet({ open, onClose, items, title, footer, renderLink }: MoreSheetProps): react.JSX.Element | null;
interface NavRailProps {
    items: NavItem[];
    /** A second group under the items, after a divider (settings, search). */
    tools?: ReactNode;
    /** Pinned to the bottom of the rail (a theme toggle, an avatar). */
    footer?: ReactNode;
    /** The breakpoint from which the rail shows (default md, 768px). */
    showFrom?: 'sm' | 'md' | 'lg';
    /** The breakpoint from which it hides again (default lg, 1024px); pass false to keep it. */
    hideFrom?: 'md' | 'lg' | 'xl' | false;
    /** Names the nav landmark. Default "Sections". */
    label?: string;
    renderLink?: RenderLink;
    className?: string;
}
/** A 72px icon rail for the unfolded and tablet range between the phone BottomNav and a
 *  full sidebar: each destination is an icon in a pill over an 11px label. The `hint`
 *  shows as a tooltip on mouse hover and keyboard focus. */
declare function NavRail({ items, tools, footer, showFrom, hideFrom, label, renderLink, className }: NavRailProps): react.JSX.Element;
interface ScrollRowProps {
    children: ReactNode;
    /** Let the row run to the screen edges inside a padded page. */
    bleed?: boolean;
    /** Fade the edges that have more content (default true). */
    fade?: boolean;
    /** Snap children to the start edge while scrolling. */
    snap?: boolean;
    /** Element to render: div (default), ul, ol or nav. */
    as?: 'div' | 'ul' | 'ol' | 'nav';
    /** Accessible name of the row (`aria-label`). */
    label?: string;
    className?: string;
}
/** A single horizontally scrolling row (chips, filters, tabs) with edge fades and no
 *  scrollbar. The pressed, selected or current child is scrolled into view when it
 *  changes. */
declare function ScrollRow({ children, bleed, fade, snap, as, label, className }: ScrollRowProps): react.DetailedReactHTMLElement<{
    ref: react.RefObject<HTMLElement | null>;
    'aria-label': string | undefined;
    className: string;
}, HTMLElement>;
/** The id of the section crossing the middle band of the viewport: the last one that
 *  entered it. At the very top of the page, or before any section has been seen, it is
 *  the first id. Sections are looked up with `document.getElementById`.
 *
 *  @param ids - Section ids, in page order.
 *  @param options.rootMargin - The observed band. Default `'-45% 0px -50% 0px'`.
 *  @returns The current id, or null when `ids` is empty. */
declare function useScrollSpy(ids: string[], { rootMargin }?: {
    rootMargin?: string;
}): string | null;
interface SectionNavItem {
    /** The id of the section element on the page. */
    id: string;
    label: string;
    icon?: ReactNode;
    /** A count after the label. */
    count?: number;
}
interface SectionNavProps {
    items: SectionNavItem[];
    /** Stick under the app header (default true). */
    sticky?: boolean;
    /** Called with the id after a chip is clicked and the page has been scrolled. */
    onSelect?: (id: string) => void;
    /** Write `#id` with history.replaceState on click (default true). Pass false in apps that
     *  use hash routing. */
    updateHash?: boolean;
    /** Accessible name. Default "Sections". */
    label?: string;
    className?: string;
}
/** A row of jump chips for a long page. The chip of the section being read is marked
 *  (`aria-current="true"`) and kept in view; clicking one scrolls to its section. Give the
 *  sections the `nish-scroll-target` class so they stop below the sticky bars. It publishes
 *  its own height as `--nish-sticky-extra`. */
declare function SectionNav({ items, sticky, onSelect, updateHash, label, className }: SectionNavProps): react.JSX.Element;

interface StickyBarProps {
    /** The bar's content: a filter row, a toolbar, a SectionNav. */
    children?: ReactNode;
    /** CSS `top` offset. Defaults to just under the app header (`var(--nish-header-h, 0px)`). */
    top?: string;
    /** Adds a bottom border and a soft shadow once the bar is stuck. Default true. */
    elevate?: boolean;
    /** The element to render. Default `div`. */
    as?: ElementType;
    className?: string;
}
/**
 * A bar that sticks under the app header while the page scrolls. Opaque, and its
 * background reaches the screen edges (it bleeds through the page gutter). Publishes its
 * height as `--nish-sticky-extra` while mounted, so anchor links scroll clear of it.
 */
declare function StickyBar({ children, top, elevate, as, className }: StickyBarProps): react.JSX.Element;
interface StickyActionBarProps {
    /** Shows the bar. Closed, it renders nothing and publishes no height. */
    open: boolean;
    /** Short text on the left, e.g. "3 changes". Truncates to one line. */
    message?: ReactNode;
    /** The main action, usually a primary Button. */
    primary: ReactNode;
    /** A second action, usually a ghost or secondary Button (Discard, Cancel). */
    secondary?: ReactNode;
    /** Accessible name of the region. Default "Actions". */
    label?: string;
    className?: string;
}
/**
 * A bar fixed to the bottom of the screen for the actions of an unsaved form or a
 * selection. Sits above a BottomNav when there is one, and publishes `--nish-bottom-bar-h`
 * while open so page padding and toasts clear it. From sm it floats as a pill at the
 * bottom right.
 */
declare function StickyActionBar({ open, message, primary, secondary, label, className }: StickyActionBarProps): react.JSX.Element | null;
interface LoadingBarProps {
    /** True while something loads (a route change, a refetch). */
    active: boolean;
    /** Waits this long before showing, so quick loads never flash a bar. Default 200. */
    delayMs?: number;
    /** CSS `top`. Defaults to just under the app header. */
    top?: string;
    className?: string;
}
/**
 * A thin indeterminate progress bar fixed under the app header. Appears only after
 * `delayMs` of being active. With reduced motion it is a static partial bar.
 */
declare function LoadingBar({ active, delayMs, top, className }: LoadingBarProps): react.JSX.Element | null;
declare const CONTAINER_SIZE: {
    readonly narrow: "max-w-2xl";
    readonly default: "max-w-4xl";
    readonly wide: "max-w-7xl";
    readonly full: "max-w-none";
};
interface PageContainerProps {
    /** Max width: narrow 42rem, default 56rem, wide 80rem, full none. */
    size?: keyof typeof CONTAINER_SIZE;
    children?: ReactNode;
    /** Adds bottom padding that clears a BottomNav and StickyActionBar. Default true. */
    padBottom?: boolean;
    /** The element to render. Default `main`. */
    as?: ElementType;
    className?: string;
}
/**
 * The page's content column: centered, with the shared side gutter and vertical padding,
 * and bottom padding that keeps the last row clear of fixed bottom bars.
 */
declare function PageContainer({ size, children, padBottom, as, className }: PageContainerProps): react.JSX.Element;
/** Whether the browser reports a network connection (`navigator.onLine`). True on the server. */
declare function useOnline(): boolean;
interface ConnectionBannerProps {
    /** A URL to probe with `fetch` (cache: no-store). When it fails or returns a non-2xx
     *  status the banner shows. Leave out to react to the browser's online/offline state only. */
    healthUrl?: string;
    /** Base interval between probes. After failures it doubles up to 4x. Default 30000. */
    intervalMs?: number;
    /** Shown when the probe fails. Default "Can't reach the server". */
    message?: string;
    /** Shown when the browser is offline. Default "You're offline". */
    offlineMessage?: string;
    /** Called after the Retry button re-probes. */
    onRetry?: () => void;
}
/**
 * A sticky warning bar for lost connectivity. Watches `navigator.onLine` and, with
 * `healthUrl`, probes the server with backoff (and right away when the browser comes back
 * online or the tab becomes visible). Renders nothing while everything is reachable.
 */
declare function ConnectionBanner({ healthUrl, intervalMs, message, offlineMessage, onRetry, }: ConnectionBannerProps): react.JSX.Element | null;

/** One column of a ResponsiveTable. */
interface Column<T> {
    /** Stable id; also the key of the sort. */
    key: string;
    /** The header text (also the label in cards and in the sort menu). */
    header: string;
    /** Renders the cell for a row. */
    cell: (row: T) => ReactNode;
    /** Makes the column sortable: the comparable value of a row. null sorts last. */
    sortValue?: (row: T) => string | number | null;
    /** A number column: right-aligned, tabular, no wrapping. */
    numeric?: boolean;
    /** In cards, this column is the title. */
    primary?: boolean;
    /** In cards, this column is the subtitle under the title. */
    secondary?: boolean;
    /** Hides the column in the table below this breakpoint. */
    hideBelow?: 'sm' | 'md' | 'lg';
    /** A CSS width for the header cell, e.g. '8rem'. */
    width?: string;
}
/** The sort of a ResponsiveTable: a column key and a direction, or null for none. */
type Sort = {
    key: string;
    dir: 'asc' | 'desc';
} | null;
type CardsBelow = 'sm' | 'md' | 'lg';
interface ResponsiveTableProps<T> {
    /** The data. */
    rows: T[];
    /** The columns, in table order. */
    columns: Column<T>[];
    /** A stable key for a row. */
    rowKey: (row: T) => string;
    /** Below this breakpoint the rows become cards. Default 'md'. */
    cardsBelow?: CardsBelow;
    /** Called when a row (or card) is activated by click, Enter or Space. */
    onRowClick?: (row: T) => void;
    /** Makes each row a link to this URL (cards become real anchors). */
    rowHref?: (row: T) => string;
    /** Called with the URL when a row is activated by click or key, so a router can navigate
     *  without a page reload. Without it the table assigns `location`. Card links stay real
     *  anchors. */
    onNavigate?: (href: string) => void;
    /** A 3px left edge on a row: ok, warn or loss. Say the status in a cell too. */
    rowTone?: (row: T) => 'ok' | 'warn' | 'loss' | undefined;
    /** The current sort, when you control it. */
    sort?: Sort;
    /** Called with the next sort. With sort or onSortChange given you sort the rows
     *  yourself; without them the table sorts by each column's sortValue. */
    onSortChange?: (sort: Sort) => void;
    /** The table's minimum width before it scrolls sideways. Default 640. */
    minWidth?: number | string;
    /** Keeps the header visible while the body scrolls (give maxHeight too). */
    stickyHeader?: boolean;
    /** Caps the table's height; the body scrolls inside. */
    maxHeight?: number | string;
    /** Pins the first column while the table scrolls sideways. */
    stickyFirstColumn?: boolean;
    /** Shows skeleton rows (table) or skeleton cards instead of the data. */
    loading?: boolean;
    /** Shown when there are no rows. Default: "Nothing here yet". */
    empty?: ReactNode;
    /** Shows an ErrorState instead of the data. */
    error?: {
        message: string;
        onRetry?: () => void;
    } | null;
    /** The accessible name of the table and the card list. */
    label: string;
    /** Renders a whole card yourself (inside the card's button or link). */
    renderCard?: (row: T) => ReactNode;
    className?: string;
}
/**
 * A table on wide screens and a list of cards on phones, from one column definition.
 * Sortable headers (and a sort menu in card mode), clickable or linked rows, a status
 * edge per row, loading, empty and error states built in.
 */
declare function ResponsiveTable<T>({ rows, columns, rowKey, cardsBelow, onRowClick, rowHref, onNavigate, rowTone, sort, onSortChange, minWidth, stickyHeader, maxHeight, stickyFirstColumn, loading, empty, error, label, renderCard, className, }: ResponsiveTableProps<T>): react.JSX.Element;
interface ListRowProps {
    /** A leading icon or avatar (kept at its size). */
    icon?: ReactNode;
    /** The main line; truncates. */
    title: ReactNode;
    /** A quieter line under the title; up to two lines. */
    subtitle?: ReactNode;
    /** A right-aligned detail: a date, an amount. */
    meta?: ReactNode;
    /** A control or badge at the far right (outside the meta). */
    trailing?: ReactNode;
    /** Makes the whole row a link. */
    href?: string;
    /** Makes the whole row a button. */
    onClick?: () => void;
    /** The current item: accent tint and aria-current. */
    active?: boolean;
    /** danger: the title turns loss-red. */
    tone?: 'danger';
    /** Shows a chevron. On by default for a link. */
    chevron?: boolean;
    /** A 44px row instead of 52px. */
    dense?: boolean;
    /** Opens the link in a new tab with an external icon. */
    external?: boolean;
    className?: string;
    /** The wrapper element. Default 'li'; pass 'div' outside a list. */
    as?: 'li' | 'div';
}
/** A list row: icon, title, subtitle, meta and a chevron, where the whole row is the link or button. */
declare function ListRow({ icon, title, subtitle, meta, trailing, href, onClick, active, tone, chevron, dense, external, className, as: Wrapper, }: ListRowProps): react.JSX.Element;
interface FaviconProps {
    /** The site's address; only the host is used. */
    url: string;
    /** Width and height in px. Default 16. */
    size?: number;
    /** The text whose first letter fills the fallback avatar. Default: the host name. */
    label?: string;
    className?: string;
}
/** A site's favicon, or a colored letter avatar while it loads or when it cannot. Decorative. */
declare function Favicon({ url, size, label, className }: FaviconProps): react.JSX.Element;
type LinkCardAccent = `chart-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}` | 'accent';
interface LinkCardProps {
    /** Where the card goes. */
    href: string;
    /** The name. */
    title: string;
    /** A short description. */
    blurb?: string;
    /** A 20px icon or a Favicon, shown in a tinted tile. */
    icon?: ReactNode;
    /** The tile color. Default 'accent'. */
    accent?: LinkCardAccent;
    /** A small detail line (card layout only). */
    meta?: ReactNode;
    /** A status dot and label. */
    status?: {
        tone: StatusTone;
        label: string;
    };
    /** Anything small at the top right: a Badge, a count. */
    badge?: ReactNode;
    /** Not available yet: dashed border, not a link. */
    disabled?: boolean;
    /** 'card' is a tile, 'row' a 64px row, 'auto' (default) a row until its parent is 600px wide. */
    layout?: 'auto' | 'card' | 'row';
    /** Opens in a new tab. */
    external?: boolean;
    className?: string;
}
/** A big link to another page or app: icon tile, title and blurb. The whole card is the anchor. */
declare function LinkCard({ href, title, blurb, icon, accent, meta, status, badge, disabled, layout, external, className, }: LinkCardProps): react.JSX.Element;
interface AsyncPanelProps {
    /** Which state to show. */
    status: 'loading' | 'error' | 'empty' | 'ready';
    /** The loading body. Default: SkeletonRows. */
    skeleton?: ReactNode;
    /** The error body. */
    error?: {
        title?: string;
        message: string;
        onRetry?: () => void;
    };
    /** The empty body. */
    empty?: {
        title: string;
        description?: string;
        action?: ReactNode;
    };
    /** The content for status 'ready'. */
    children?: ReactNode;
    className?: string;
}
/** Shows a skeleton, an error, an empty state or its children, from one status value. */
declare function AsyncPanel({ status, skeleton, error, empty, children, className }: AsyncPanelProps): react.JSX.Element;

/** A series color: one of the eight categorical chart colors, or a status/accent color. */
type ChartTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'chart-7' | 'chart-8' | 'ok' | 'loss' | 'accent';
/** One point of a line series. A null y leaves a gap in the line. */
interface LinePoint {
    x: number;
    y: number | null;
}
/** One named line of a multi-series LineChart. */
interface LineSeries {
    /** Shown in the tooltip and the screen-reader table. */
    label: string;
    /** Default: the categorical color for the series' position. */
    tone?: ChartTone;
    points: LinePoint[];
}
interface LineChartProps {
    /** A single series of points. Use this or `series`. */
    data?: LinePoint[];
    /** Several series sharing one x axis. */
    series?: LineSeries[];
    /** Plot height in pixels. Default 200. */
    height?: number;
    /** Fill under the first series with a fading gradient of its color. */
    area?: boolean;
    /** Formats y axis ticks and tooltip values. */
    yFormat?: (v: number) => string;
    /** Formats x axis ticks and the tooltip heading. */
    xFormat?: (v: number) => string;
    /** How many y axis labels. Default 4. */
    yTicks?: number;
    /** How many x axis labels. Default 4. */
    xTicks?: number;
    /** A dashed horizontal reference line, e.g. the previous close. */
    baseline?: number;
    /** Color of the single `data` series. Default chart-1. */
    tone?: ChartTone;
    /** Accessible name of the chart. */
    label: string;
    /** Show a skeleton of the same height. */
    loading?: boolean;
    /** Shown when there are no points. Default "No data". */
    empty?: ReactNode;
    className?: string;
}
/** A dependency-free SVG line chart that fills its container's width. Gaps (null y)
 *  break the line. Hover, touch-drag or Left/Right keys move a crosshair with a
 *  tooltip; vertical swipes still scroll the page. A hidden table carries the data for
 *  screen readers. */
declare function LineChart({ data, series, height, area, yFormat, xFormat, yTicks, xTicks, baseline, tone, label, loading, empty, className, }: LineChartProps): react.JSX.Element;
interface BarChartProps {
    /** One bar per entry, in order. */
    data: {
        label: string;
        value: number;
    }[];
    /** Plot height in pixels. Default 140. */
    height?: number;
    /** Bar color. Default chart-1. */
    tone?: ChartTone;
    /** Formats values above the bars and in the caption. */
    valueFormat?: (v: number) => string;
    /** 'always' prints every value above its bar; 'auto' (default) does so on touch
     *  screens only, where there is no hover. */
    showValues?: 'always' | 'auto';
    /** 'ends' (default) labels the first and last bar; 'all' labels every bar. */
    xTicks?: 'ends' | 'all';
    /** Accessible name of the chart. */
    label: string;
    className?: string;
}
/** A dependency-free SVG bar chart that fills its container's width. Hover, tap or
 *  Left/Right keys select a bar and show "label: value" under the chart. A hidden table
 *  carries the data for screen readers. */
declare function BarChart({ data, height, tone, valueFormat, showValues, xTicks, label, className }: BarChartProps): react.JSX.Element;
interface RangeBarProps {
    /** The track's lower end (e.g. the 52-week low). */
    min: number;
    /** The track's upper end. */
    max: number;
    /** Start of the highlighted segment (e.g. today's low). */
    low: number;
    /** End of the highlighted segment. */
    high: number;
    /** Marks a value (e.g. the current price) with a dot. */
    current?: number;
    className?: string;
}
/** A thin range track with a highlighted low-to-high segment and an optional dot for
 *  the current value: daily temperature ranges, a price's day range. */
declare function RangeBar({ min, max, low, high, current, className }: RangeBarProps): react.JSX.Element;

/** One row of the palette. */
interface CommandItem {
    /** Stable key, unique within the list. */
    id: string;
    /** What the row says and what the query matches. */
    label: string;
    /** Section heading the row sits under. Rows without a group come first. */
    group?: string;
    /** Short right-aligned text (a shortcut, a path, a type). */
    hint?: string;
    /** Extra words the query also matches (ranked below the label). */
    keywords?: string[];
    /** A 16-20px icon shown before the label. */
    icon?: ReactNode;
    /** Navigate here on select (`location.assign`, or a new tab when `external`). */
    href?: string;
    /** Open `href` in a new tab. */
    external?: boolean;
    /** Called on select when there is no `href` (or after it, never both: href wins). */
    onSelect?: () => void;
}
interface CommandPaletteProps {
    /** Whether the palette is showing. */
    open: boolean;
    /** Called with false on Escape, a backdrop click, the close button and after a select;
     *  called with true by the hotkeys. */
    onOpenChange: (open: boolean) => void;
    /** The searchable items, or a function from the query to items (sync or async) for
     *  server-side or dynamic search. A function's results are shown as returned, in order. */
    items: CommandItem[] | ((q: string) => CommandItem[] | Promise<CommandItem[]>);
    /** Placeholder of the search field. Default 'Search…'. */
    placeholder?: string;
    /** Text shown when nothing matches. Default 'No results'. */
    emptyText?: string;
    /** Open with Ctrl/Cmd+K, and with `/` when focus is not in a field (default true). */
    hotkey?: boolean;
    /** Called on every keystroke with the new query. */
    onQuery?: (q: string) => void;
    /** Content pinned under the results (a hint line, a link to full search). */
    footer?: ReactNode;
    /** Called with the query when Enter is pressed and nothing matches (e.g. a web search). */
    onSubmitQuery?: (q: string) => void;
}
/** Navigates after the layer that is closing has dropped its own history entry. Running
 *  `history.back()` (the layer's cleanup) right after `location.assign` would cancel the
 *  navigation, so wait for that pop to finish. Call it before closing the layer. */
declare function navigateFromLayer(href: string): void;
/**
 * Registers the palette hotkeys: Ctrl/Cmd+K anywhere, and `/` when focus is not in a
 * field. For apps that render their own trigger or palette.
 *
 * @param open - Called when a hotkey fires.
 * @param enabled - Set false to listen to nothing (default true).
 */
declare function useCommandHotkey(open: () => void, enabled?: boolean): void;
/** Search-and-jump dialog. A full-height sheet with the field on top under 640px, a
 *  centered 560px panel from there up. Fuzzy matching (prefix, word start, substring,
 *  then subsequence), grouped rows, arrow keys, Enter, and Ctrl/Cmd+K and `/` hotkeys. */
declare function CommandPalette({ open, onOpenChange, items, placeholder, emptyText, hotkey, onQuery, footer, onSubmitQuery, }: CommandPaletteProps): react.JSX.Element | null;

/** True while the CSS media query matches. False on the server and before hydration. */
declare function useMediaQuery(query: string): boolean;
type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';
/** The largest Tailwind breakpoint the viewport has reached: base, sm (640), md (768), lg (1024) or xl (1280). */
declare function useBreakpoint(): Breakpoint;
/**
 * Sets document.title to "title · app" (or just the app, or just the title) and restores
 * the previous title on unmount. An undefined title with no app leaves the title alone.
 */
declare function useDocumentTitle(title: string | undefined, o?: {
    app?: string;
}): void;
/** Date.now() that updates every intervalMs, paused while the tab is hidden. */
declare function useNow(intervalMs?: number): number;
/**
 * State kept in localStorage. JSON by default, the raw string with { raw: true }. Never
 * throws (private mode, quota and bad JSON fall back to the initial value) and follows
 * changes from other tabs and from other hooks on the same key.
 */
declare function useLocalStorage<T>(key: string, initial: T, o?: {
    raw?: boolean;
}): [T, (next: T | ((prev: T) => T)) => void];
interface RelativeTimeProps {
    /** The moment: a Date, epoch milliseconds or a date string. */
    value: Date | number | string;
    /** "3m ago" (short, default) or "3 minutes ago" (long). */
    style?: 'short' | 'long';
    /** How often the text refreshes, in milliseconds. Default 30000. */
    refreshMs?: number;
    /** Classes for the time element. */
    className?: string;
}
/** A self-updating "3m ago". The full date and time show on hover and in the dateTime attribute. */
declare function RelativeTime({ value, style, refreshMs, className }: RelativeTimeProps): react.JSX.Element;

export { AppHeader, AsyncPanel, Badge, BarChart, BottomNav, Button, Callout, Card, CardHeader, CardListSkeleton, ChartLegend, Checkbox, Chip, ChipGroup, CommandPalette, ConfirmDialog, ConnectionBanner, CopyButton, Disclosure, Drawer, DropdownMenu, EmptyState, ErrorState, Favicon, Field, FieldGroup, IconButton, Input, Kbd, KeyValueList, Label, LineChart, LinkCard, ListRow, LoadingBar, MenuItem, MenuLabel, MenuSeparator, MenuSubHeader, Meter, Modal, MoreSheet, NavRail, PageContainer, PageHeader, Popover, RangeBar, RelativeTime, ResponsiveTable, ScrollRow, SearchInput, SectionHeader, SectionNav, Segmented, Select, Skeleton, SkeletonCard, SkeletonLines, SkeletonRows, Sparkline, Spinner, Stat, StatGrid, StatGridSkeleton, StatusDot, StickyActionBar, StickyBar, Switch, TabPanel, Table, TableWrap, Tabs, Td, Textarea, Th, ThemeChoice, ThemeName, ThemeToggle, Toaster, Tooltip, Tr, badgeClass, buttonClass, cardClass, chipClass, cn, copyText, dismissToast, fieldClass, iconButtonClass, linkClass, menuItemClass, navigateFromLayer, revealClass, signTone, tabClass, tableClass, toast, toneFor, useBreakpoint, useCommandHotkey, useDocumentTitle, useHeightVar, useLocalStorage, useMediaQuery, useNow, useOnline, useScrollEdges, useScrollSpy, useStuck, useTheme, useToast };
export type { AppHeaderProps, AsyncPanelProps, BadgeClassOptions, BadgeHue, BadgeProps, BadgeTone, BarChartProps, BottomNavProps, Breakpoint, ButtonClassOptions, ButtonProps, ButtonSize, ButtonVariant, CalloutProps, CalloutTone, CardClassOptions, CardElement, CardHeaderProps, CardListSkeletonProps, CardPadding, CardProps, ChartLegendItem, ChartLegendProps, ChartLegendTone, ChartTone, CheckboxProps, ChipClassOptions, ChipGroupProps, ChipProps, Column, CommandItem, CommandPaletteProps, ConfirmDialogProps, ConnectionBannerProps, CopyButtonProps, DisclosureProps, DrawerProps, DropdownMenuProps, EmptyStateProps, ErrorStateProps, FaviconProps, FieldClassOptions, FieldGroupProps, FieldProps, FieldSize, IconButtonClassOptions, IconButtonProps, IconButtonSize, IconButtonVariant, InputProps, KeyValueItem, KeyValueListProps, LineChartProps, LinePoint, LineSeries, LinkCardAccent, LinkCardProps, LinkClassOptions, ListRowProps, LoadingBarProps, MenuItemClassOptions, MenuItemProps, MenuSubHeaderProps, MeterProps, MeterTone, ModalProps, MoreSheetProps, NavItem, NavRailProps, PageContainerProps, PageHeaderProps, PopoverCloseReason, PopoverProps, RangeBarProps, RelativeTimeProps, RenderLink, ResponsiveTableProps, ScrollRowProps, SearchInputProps, SectionHeaderProps, SectionNavItem, SectionNavProps, SegmentedOption, SegmentedProps, SegmentedTone, SelectProps, SkeletonCardProps, SkeletonRowsProps, Sort, SparklineProps, SparklineTone, SpinnerProps, StatGridProps, StatGridSkeletonProps, StatProps, StatusDotProps, StatusTone, StickyActionBarProps, StickyBarProps, SwitchProps, TabItem, TabPanelProps, TableProps, TableWrapProps, TabsBreakpoint, TabsProps, TabsSize, TdProps, TextareaProps, ThProps, ThemeState, ThemeToggleProps, ToastAction, ToastItem, ToastOptions, ToastTone, ToasterProps, TooltipProps, TrProps };
