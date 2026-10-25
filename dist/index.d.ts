import { ClassValue } from 'clsx';
import { T as ThemeChoice, a as ThemeName } from './theme-BOP55wlS.js';
export { C as COLOR_ROLES, D as DEFAULT_THEME, P as PRESETS, S as SCALE, b as THEMES, c as TOGGLE_ORDER, d as ThemePreset, e as applyTheme, f as cycleTheme, g as getThemeChoice, i as initTheme, h as isThemeName, o as onThemeChange, r as readToken, j as registerThemes, k as resolveTheme, s as schemeOf, l as setThemeChoice } from './theme-BOP55wlS.js';
import * as react from 'react';
import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, CSSProperties } from 'react';

/** Conditional Tailwind classes with conflict resolution. */
declare function cn(...inputs: ClassValue[]): string;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Required: an icon-only button needs a name for screen readers and tooltips. */
    label: string;
    /** sm: 28px, md: 36px. Both grow to 44px on touch screens. */
    size?: 'sm' | 'md';
    /** Pressed state for toggles (sets aria-pressed). */
    active?: boolean;
}
/** A square button holding only an icon, with its label as aria-label and title. */
declare const IconButton: react.ForwardRefExoticComponent<IconButtonProps & react.RefAttributes<HTMLButtonElement>>;
interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Adds the default inner padding. Off for cards that hold tables edge to edge. */
    padded?: boolean;
    /** Hover styles for cards that are links or buttons. */
    interactive?: boolean;
}
/** The surface panel every widget, table and form sits in. */
declare const Card: react.ForwardRefExoticComponent<CardProps & react.RefAttributes<HTMLDivElement>>;
type Tone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info';
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Text on its own soft tint; every tone clears 4.5:1 in every theme. */
    tone?: Tone;
}
/** A small status pill: counts, states, tags. */
declare function Badge({ tone, className, ...rest }: BadgeProps): react.JSX.Element;
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Red border and aria-invalid. Pair it with an error message tied by aria-describedby. */
    invalid?: boolean;
}
/** Text input. 16px text on phones so iOS does not zoom the page on focus. */
declare const Input: react.ForwardRefExoticComponent<InputProps & react.RefAttributes<HTMLInputElement>>;
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Red border and aria-invalid. */
    invalid?: boolean;
}
/** Multi-line text with the shared field look. 16px text on phones (no iOS zoom); it
 *  grows with its rows and the reader can resize it vertically. */
declare const Textarea: react.ForwardRefExoticComponent<TextareaProps & react.RefAttributes<HTMLTextAreaElement>>;
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** Text beside the box; clicking it toggles the box. */
    label: ReactNode;
    /** A quieter line under the label. */
    hint?: ReactNode;
}
/** A checkbox with its label. The whole row is the 44px tap target on touch screens. */
declare const Checkbox: react.ForwardRefExoticComponent<CheckboxProps & react.RefAttributes<HTMLInputElement>>;
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    /** Red border and aria-invalid. */
    invalid?: boolean;
}
/** Native select (keeps the platform picker on phones) with the shared field look. */
declare const Select: react.ForwardRefExoticComponent<SelectProps & react.RefAttributes<HTMLSelectElement>>;
/** Small uppercase label for form fields and section headings. */
declare function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): react.JSX.Element;

/** One shimmer block; size it with width/height classes. */
declare function Skeleton({ className, style, }: {
    /** Size and shape: h-4 w-2/5, size-9 rounded-full, … */
    className?: string;
    /** For sizes known only at runtime, e.g. { height: chartHeight }. */
    style?: CSSProperties;
}): react.JSX.Element;
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
interface ToastItem {
    /** Returned by toast(); pass it to dismissToast(). */
    id: number;
    tone: ToastTone;
    title: string;
    /** Optional second line. */
    body?: string;
}
/** Remove a toast now, by the id toast() returned. */
declare function dismissToast(id: number): void;
type ToastFn = ((title: string, body?: string) => number) & {
    success: (title: string, body?: string) => number;
    error: (title: string, body?: string) => number;
    warn: (title: string, body?: string) => number;
    info: (title: string, body?: string) => number;
};
/** toast('Saved') or toast.error('Could not save', detail). */
declare const toast: ToastFn;
/** Same API as a hook, for code that prefers one. */
declare function useToast(): ToastFn;
/** The toast stack: bottom-center full width on phones, bottom-right on wider screens. */
declare function Toaster({ className, }: {
    /** Extra classes for the stack, e.g. to lift it above a bottom nav: sm:bottom-20. */
    className?: string;
}): react.ReactPortal | null;

interface ModalProps {
    /** Heading of the dialog; also its accessible name. */
    title: ReactNode;
    /** Called on Escape, a backdrop click and the close button. Unmount the modal here. */
    onClose: () => void;
    /** The body. It scrolls when taller than the screen. */
    children: ReactNode;
    /** md: compact dialogs (default). lg / xl: wide content like guides and editors. */
    size?: 'md' | 'lg' | 'xl';
    /** Buttons row pinned to the bottom of the panel. */
    footer?: ReactNode;
    /** A summary pinned under the title while the body scrolls (price, status, timestamps). */
    subtitle?: ReactNode;
    className?: string;
}
/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll while open. */
declare function Modal({ title, onClose, children, size, footer, subtitle, className }: ModalProps): react.ReactPortal;
interface TooltipProps {
    /** What the tooltip says. Keep it to a sentence or two. */
    tip: ReactNode;
    /** The trigger. It becomes focusable, so keyboard users can read the tip. */
    children: ReactNode;
    className?: string;
    /** Preferred side; flips when there is no room. */
    side?: 'top' | 'bottom';
    /** Element used for the trigger. Pass `tr` inside tables, where a span would be
     *  invalid markup and get hoisted out of the table by the parser. */
    as?: 'span' | 'tr';
}
/** Hover/focus tooltip rendered through a portal to <body>, so `overflow:hidden`
 *  ancestors (truncated labels, scrolling tables) can never clip it. Positioned
 *  from the trigger's viewport rect, flipped and clamped to stay on screen. */
declare function Tooltip({ tip, children, className, side, as }: TooltipProps): react.JSX.Element;

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
    className?: string;
}
/** System / Light / Dark segmented control, optionally with a preset picker. */
declare function ThemeToggle({ presets, className }: ThemeToggleProps): react.JSX.Element;

interface SegmentedOption<T extends string> {
    value: T;
    label: ReactNode;
    /** Screen-reader name when the label is only an icon. */
    ariaLabel?: string;
}
interface SegmentedProps<T extends string> {
    /** Name of the whole group for screen readers: "Chart range". */
    label: string;
    options: SegmentedOption<T>[];
    /** The selected value; a value not among the options leaves none selected. */
    value: T | (string & {});
    onChange: (value: T) => void;
    size?: 'sm' | 'md';
    className?: string;
}
/** A small set of mutually exclusive choices shown side by side (24h / 7d / 30d).
 *  The selected option gets the accent tint and ring, so it reads at a glance in
 *  light themes too. Arrow keys move the choice, like a native radio group. */
declare function Segmented<T extends string>({ label, options, value, onChange, size, className }: SegmentedProps<T>): react.JSX.Element;

export { Badge, Button, Card, Checkbox, EmptyState, ErrorState, IconButton, Input, Label, Modal, Segmented, Select, Skeleton, SkeletonLines, Textarea, ThemeChoice, ThemeName, ThemeToggle, Toaster, Tooltip, cn, dismissToast, toast, useTheme, useToast };
export type { BadgeProps, ButtonProps, CardProps, CheckboxProps, EmptyStateProps, ErrorStateProps, IconButtonProps, InputProps, ModalProps, SegmentedOption, SegmentedProps, SelectProps, TextareaProps, ThemeState, ThemeToggleProps, ToastItem, ToastTone };
