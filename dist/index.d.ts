import { ClassValue } from 'clsx';
import { T as ThemeChoice, a as ThemeName } from './theme-CbMjfu2f.js';
export { C as COLOR_ROLES, D as DEFAULT_THEME, P as PRESETS, S as SCALE, b as THEMES, c as TOGGLE_ORDER, d as ThemePreset, e as applyTheme, f as cycleTheme, g as getThemeChoice, i as initTheme, h as isThemeName, o as onThemeChange, r as readToken, j as resolveTheme, s as schemeOf, k as setThemeChoice } from './theme-CbMjfu2f.js';
import * as react from 'react';
import { HTMLAttributes, ButtonHTMLAttributes, ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

/** Conditional Tailwind classes with conflict resolution. */
declare function cn(...inputs: ClassValue[]): string;

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Shows a spinner and disables the button. */
    loading?: boolean;
    icon?: ReactNode;
}
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Required: an icon-only button needs a name for screen readers and tooltips. */
    label: string;
    size?: 'sm' | 'md';
    active?: boolean;
}
declare const IconButton: react.ForwardRefExoticComponent<IconButtonProps & react.RefAttributes<HTMLButtonElement>>;
interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** Adds the default inner padding. Off for cards that hold tables edge to edge. */
    padded?: boolean;
    interactive?: boolean;
}
declare const Card: react.ForwardRefExoticComponent<CardProps & react.RefAttributes<HTMLDivElement>>;
type Tone = 'neutral' | 'accent' | 'ok' | 'loss' | 'warn' | 'info';
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
}
declare function Badge({ tone, className, ...rest }: BadgeProps): react.JSX.Element;
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean;
}
/** Text input. 16px text on phones so iOS does not zoom the page on focus. */
declare const Input: react.ForwardRefExoticComponent<InputProps & react.RefAttributes<HTMLInputElement>>;
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    invalid?: boolean;
}
/** Native select (keeps the platform picker on phones) with the shared field look. */
declare const Select: react.ForwardRefExoticComponent<SelectProps & react.RefAttributes<HTMLSelectElement>>;
/** Small uppercase label for form fields and section headings. */
declare function Label({ className, ...rest }: HTMLAttributes<HTMLSpanElement>): react.JSX.Element;

/** One shimmer block; size it with width/height classes. */
declare function Skeleton({ className }: {
    className?: string;
}): react.JSX.Element;
/** A padded stack of shimmer bars: the default loading body for a card or widget. */
declare function SkeletonLines({ lines, className }: {
    lines?: number;
    className?: string;
}): react.JSX.Element;
interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    detail?: ReactNode;
    action?: ReactNode;
    /** compact: no border, fills a widget body. Default: dashed box on a page. */
    compact?: boolean;
    className?: string;
}
declare function EmptyState({ icon, title, detail, action, compact, className }: EmptyStateProps): react.JSX.Element;
interface ErrorStateProps {
    message?: ReactNode;
    /** Shows a Retry button when given. */
    onRetry?: () => void;
    retrying?: boolean;
    compact?: boolean;
    className?: string;
}
declare function ErrorState({ message, onRetry, retrying, compact, className, }: ErrorStateProps): react.JSX.Element;

type ToastTone = 'success' | 'error' | 'warn' | 'info';
interface ToastItem {
    id: number;
    tone: ToastTone;
    title: string;
    body?: string;
}
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
declare function Toaster({ className }: {
    className?: string;
}): react.ReactPortal | null;

interface ModalProps {
    title: ReactNode;
    onClose: () => void;
    children: ReactNode;
    /** md: compact dialogs (default). lg / xl: wide content like guides and editors. */
    size?: 'md' | 'lg' | 'xl';
    /** Buttons row pinned to the bottom of the panel. */
    footer?: ReactNode;
    className?: string;
}
/** Dialog: centered panel on wide screens, bottom sheet under 640px. Closes on
 *  Escape and backdrop click, traps Tab inside, returns focus to the opener, and
 *  locks page scroll while open. */
declare function Modal({ title, onClose, children, size, footer, className }: ModalProps): react.ReactPortal;
interface TooltipProps {
    tip: ReactNode;
    children: ReactNode;
    className?: string;
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
    scheme: 'dark' | 'light';
    setChoice: (choice: ThemeChoice) => void;
}
declare function useTheme(): ThemeState;
interface ThemeToggleProps {
    /** Also offer the extra presets (slate, terminal, …) in a select. */
    presets?: boolean;
    className?: string;
}
/** System / Light / Dark segmented control, optionally with a preset picker. */
declare function ThemeToggle({ presets, className }: ThemeToggleProps): react.JSX.Element;

export { Badge, Button, Card, EmptyState, ErrorState, IconButton, Input, Label, Modal, Select, Skeleton, SkeletonLines, ThemeChoice, ThemeName, ThemeToggle, Toaster, Tooltip, cn, dismissToast, toast, useTheme, useToast };
export type { BadgeProps, ButtonProps, CardProps, EmptyStateProps, ErrorStateProps, IconButtonProps, InputProps, ModalProps, SelectProps, ThemeState, ThemeToggleProps, ToastItem, ToastTone };
