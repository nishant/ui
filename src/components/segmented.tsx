'use client';
import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '../cn';
import { useScrollEdges } from './layout-vars';
import { revealInRow } from './nav';
import { keyboardFocused, touchTracker } from './overlay-classes';
import { FloatingTip } from './tooltip';
import { isRtl } from './client';
import { SEGMENTED_SELECTED, SEGMENTED_SIZE, setRef, type SegmentedTone } from './forms-classes';

export type { SegmentedTone };

export interface SegmentedOption<T extends string> {
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

export interface SegmentedProps<T extends string> extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'role' | 'dir'> {
  /** The radiogroup element. */
  ref?: Ref<HTMLDivElement>;
  /** Name of the whole group for screen readers: "Chart range". */
  label: string;
  options: SegmentedOption<T>[];
  /** The selected value, when you keep the state yourself; a value not among the options
   *  leaves none selected. Leave it out and use `defaultValue` for an uncontrolled control. */
  value?: T | (string & {});
  /** The starting value of an uncontrolled control. */
  defaultValue?: T | (string & {});
  /** Called with the new value. Same as onValueChange; kept for existing code. */
  onChange?: (value: T) => void;
  /** Called with the new value (the form-library friendly name). */
  onValueChange?: (value: T) => void;
  /** Field name for a native form. Hidden radio inputs carry the selection, so FormData
   *  and `<form action>` see it. */
  name?: string;
  /** The id of the `<form>` the hidden inputs belong to, when it is not an ancestor. */
  form?: string;
  /** Marks the group required (aria-required, and the hidden radios block an empty submit). */
  required?: boolean;
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
export function Segmented<T extends string>({
  ref,
  label,
  options,
  value: valueProp,
  defaultValue,
  onChange,
  onValueChange,
  name,
  form,
  required,
  size = 'sm',
  block = false,
  overflow = 'scroll',
  fullWidth = false,
  className,
  onKeyDown,
  ...rest
}: SegmentedProps<T>) {
  const [own, setOwn] = useState<string | undefined>(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : own;
  const fill = block || fullWidth;
  const scroll = overflow === 'scroll';
  const groupRef = useRef<HTMLDivElement>(null);
  useScrollEdges(groupRef);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tipAnchor = useRef<HTMLButtonElement | null>(null);
  const [tipAt, setTipAt] = useState<number | null>(null);
  const tipId = useId();
  const [touch] = useState(touchTracker);
  const showTip = (i: number) => {
    if (options[i]?.tip == null) return;
    tipAnchor.current = refs.current[i];
    setTipAt(i);
  };
  const hideTip = (i: number) => setTipAt((cur) => (cur === i ? null : cur));
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selected = options.findIndex((o) => o.value === value);

  useEffect(() => {
    const el = selected >= 0 ? refs.current[selected] : null;
    if (scroll && el && groupRef.current) revealInRow(groupRef.current, el);
  }, [selected, scroll, options.length]);

  const pick = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (!controlled) setOwn(o.value);
    onChange?.(o.value);
    onValueChange?.(o.value);
    refs.current[i]?.focus();
  };
  const move = (from: number, dir: 1 | -1) => {
    if (!enabled.length) return;
    const pos = enabled.indexOf(from);
    const next = pos < 0 ? enabled[dir === 1 ? 0 : enabled.length - 1] : enabled[(pos + dir + enabled.length) % enabled.length];
    pick(next);
  };
  // With nothing selected (e.g. a preset outside the options is active), the first
  // enabled option takes the Tab stop so the group stays reachable by keyboard.
  const tabStop = selected >= 0 && !options[selected].disabled ? selected : (enabled[0] ?? -1);

  return (
    <div
      {...rest}
      ref={(node) => {
        groupRef.current = node;
        setRef(ref, node);
      }}
      role="radiogroup"
      aria-label={label}
      aria-required={required || undefined}
      className={cn(
        'rounded-lg border border-th-line bg-th-elevated p-0.5',
        fill ? 'flex w-full' : 'inline-flex',
        scroll && 'max-w-full overflow-x-auto nish-no-scrollbar nish-scroll-fade',
        className,
      )}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const rtl = isRtl(groupRef.current);
        const from = refs.current.findIndex((el) => el === document.activeElement);
        const at = from >= 0 ? from : selected;
        if (e.key === 'Escape' && tipAt != null) { setTipAt(null); return; }
        if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight') || e.key === 'ArrowDown') { e.preventDefault(); move(at, 1); }
        else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || e.key === 'ArrowUp') { e.preventDefault(); move(at, -1); }
        else if (e.key === 'Home') { e.preventDefault(); if (enabled.length) pick(enabled[0]); }
        else if (e.key === 'End') { e.preventDefault(); if (enabled.length) pick(enabled[enabled.length - 1]); }
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        const tipShown = tipAt === i && o.tip != null;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.ariaLabel}
            aria-describedby={tipShown ? tipId : undefined}
            data-state={on ? 'checked' : 'unchecked'}
            data-disabled={o.disabled ? '' : undefined}
            title={o.tip != null ? undefined : o.title}
            disabled={o.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => pick(i)}
            // A tap selects and nothing more: the tip opens on mouse hover and on keyboard
            // focus only, and any press closes it, so it never stays pinned over the page.
            onPointerEnter={touch.onPointer}
            onPointerDown={(e) => {
              touch.onPointer(e);
              setTipAt(null);
            }}
            onMouseEnter={o.tip != null ? () => !touch.recent() && showTip(i) : undefined}
            onMouseLeave={o.tip != null ? () => hideTip(i) : undefined}
            onFocus={o.tip != null ? (e) => keyboardFocused(e.currentTarget) && showTip(i) : undefined}
            onBlur={o.tip != null ? () => hideTip(i) : undefined}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium tabular-nums transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11',
              'disabled:cursor-not-allowed disabled:text-th-ghost forced-colors:disabled:text-[color:GrayText]',
              fill && (scroll ? 'flex-1 shrink-0' : 'min-w-0 flex-1'),
              scroll && !fill && 'shrink-0',
              SEGMENTED_SIZE[size],
              on ? SEGMENTED_SELECTED[o.tone ?? 'accent'] : 'text-th-hi2 hover:text-th-hi disabled:hover:text-th-ghost',
            )}
          >
            {o.label}
          </button>
        );
      })}
      {name != null
        ? options.map((o) => (
            <input
              key={o.value}
              type="radio"
              aria-hidden="true"
              tabIndex={-1}
              className="sr-only pointer-events-none"
              name={name}
              value={o.value}
              form={form}
              required={required}
              checked={o.value === value}
              onChange={() => {}}
            />
          ))
        : null}
      {tipAt != null && options[tipAt]?.tip != null ? <FloatingTip key={tipAt} anchor={tipAnchor} id={tipId} tip={options[tipAt].tip} /> : null}
    </div>
  );
}
