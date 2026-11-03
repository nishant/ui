'use client';
import {
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { isRtl, useIsoLayoutEffect } from './client';
import { useLatest } from './latest';
import { useNishStrings } from './provider';

export type SliderValue = number | [number, number];

export interface SliderProps<V extends SliderValue = number>
  extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
  /** The value (controlled): a number, or `[low, high]` for a range with two thumbs. */
  value?: V;
  /** The initial value (uncontrolled). A pair makes it a range. Default: `min`. */
  defaultValue?: V;
  /** Called on every change while dragging or pressing keys. */
  onValueChange?: (value: V) => void;
  /** Called when a drag ends or a key press changes the value: the moment to save. */
  onValueCommit?: (value: V) => void;
  /** Smallest value. Default 0. */
  min?: number;
  /** Largest value. Default 100. */
  max?: number;
  /** Step between values. Default 1. */
  step?: number;
  /** Posts the value in a form (a range posts the name twice: low, then high). */
  name?: string;
  /** Turns off dragging and keys, and leaves the value out of the form. */
  disabled?: boolean;
  /** Red styling and data-invalid. Field sets it from its `error`. */
  invalid?: boolean;
  /** Turns a value into the text screen readers announce (`aria-valuetext`): "$40", "3 days". */
  formatValue?: (value: number, thumb: number) => string;
  /** The element that holds the track. */
  ref?: Ref<HTMLDivElement>;
}

const decimals = (n: number) => {
  const s = String(n);
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : s.length - dot - 1;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Rounds to the nearest step from `min`, trims float noise and clamps into range. */
function snap(v: number, min: number, max: number, step: number): number {
  const s = step > 0 ? step : 1;
  const n = Math.round((v - min) / s) * s + min;
  return clamp(Number(n.toFixed(Math.max(decimals(s), decimals(min)))), min, max);
}

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** The id of the `<label for=id>` outside the control (a Field's label), so the thumbs can
 *  be named by it. Gives that label an id if it has none. */
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

/** A single-value or range slider. Each thumb is `role="slider"` with arrows, PageUp/PageDown,
 *  Home and End; pointer drag works on the whole track; right-to-left mirrors the direction.
 *  Hidden inputs post the value(s) in a form. */
export function Slider<V extends SliderValue = number>({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  name,
  disabled = false,
  invalid = false,
  formatValue,
  className,
  ref,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  ...rest
}: SliderProps<V>) {
  const strings = useNishStrings();
  const auto = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbs = useRef<Array<HTMLDivElement | null>>([null, null]);
  const dragging = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const controlled = value !== undefined;
  const [inner, setInner] = useState<SliderValue>(() => defaultValue ?? min);
  const raw: SliderValue = controlled ? value : inner;
  const range = Array.isArray(raw);
  const vals: number[] = Array.isArray(raw)
    ? [snap(Math.min(raw[0], raw[1]), min, max, step), snap(Math.max(raw[0], raw[1]), min, max, step)]
    : [snap(raw, min, max, step)];
  const live = useRef(vals);
  useIsoLayoutEffect(() => {
    live.current = vals;
  });
  const onChange = useLatest(onValueChange);
  const onCommit = useLatest(onValueCommit);
  const fieldLabelId = useExternalLabelId(rootRef, id, ariaLabel != null || ariaLabelledBy != null);

  const pack = (a: number[]) => (a.length === 2 ? ([a[0]!, a[1]!] as [number, number]) : a[0]!) as V;

  const setThumb = (i: number, v: number) => {
    const cur = live.current;
    const lo = i === 1 ? cur[0]! : min;
    const hi = i === 0 && cur.length === 2 ? cur[1]! : max;
    const next = clamp(snap(v, min, max, step), lo, hi);
    if (next === cur[i]) return false;
    const arr = cur.slice();
    arr[i] = next;
    live.current = arr;
    if (!controlled) setInner(pack(arr));
    onChange.current?.(pack(arr));
    return true;
  };

  const commit = () => onCommit.current?.(pack(live.current));

  const valueAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    if (!rect.width) return min;
    let frac = (clientX - rect.left) / rect.width;
    if (isRtl(rootRef.current)) frac = 1 - frac;
    return min + clamp(frac, 0, 1) * (max - min);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    if (e.defaultPrevented || disabled || e.button !== 0) return;
    const v = valueAt(e.clientX);
    const cur = live.current;
    let i = 0;
    if (cur.length === 2) {
      if (v <= cur[0]!) i = 0;
      else if (v >= cur[1]!) i = 1;
      else i = v - cur[0]! <= cur[1]! - v ? 0 : 1;
    }
    dragging.current = i;
    setDragIndex(i);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Synthetic pointers have no capture; dragging still works while the pointer is over the slider.
    }
    thumbs.current[i]?.focus();
    setThumb(i, v);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (dragging.current === null) return;
    setThumb(dragging.current, valueAt(e.clientX));
  };

  const endDrag = () => {
    if (dragging.current === null) return;
    dragging.current = null;
    setDragIndex(null);
    commit();
  };

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || e.altKey || e.ctrlKey || e.metaKey) return;
    const cur = live.current[i]!;
    const rtl = isRtl(rootRef.current);
    const big = step * 10;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = cur + (rtl ? -step : step);
    else if (e.key === 'ArrowLeft') next = cur + (rtl ? step : -step);
    else if (e.key === 'ArrowUp') next = cur + step;
    else if (e.key === 'ArrowDown') next = cur - step;
    else if (e.key === 'PageUp') next = cur + big;
    else if (e.key === 'PageDown') next = cur - big;
    else if (e.key === 'Home') next = min;
    else if (e.key === 'End') next = max;
    if (next === null) return;
    e.preventDefault();
    if (setThumb(i, next)) commit();
  };

  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true';
  const pct = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
  const fillStart = range ? pct(vals[0]!) : 0;
  const fillEnd = pct(vals[vals.length - 1]!);
  const labelledBy = ariaLabelledBy ?? fieldLabelId;

  return (
    <div
      {...rest}
      ref={(node) => {
        rootRef.current = node;
        setRef(ref, node);
      }}
      id={id}
      data-disabled={disabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-dragging={dragIndex !== null ? '' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        endDrag();
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        endDrag();
      }}
      className={cn(
        'relative flex h-6 w-full touch-none select-none items-center px-2.5 pointer-coarse:h-11',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        className,
      )}
    >
      <div
        ref={trackRef}
        className={cn(
          'relative h-1.5 w-full rounded-full border bg-th-elevated',
          isInvalid ? 'border-th-loss' : 'border-th-line-control',
          'forced-colors:border-[ButtonText] forced-colors:bg-[Canvas]',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute -inset-y-px rounded-full bg-th-accent forced-colors:bg-[Highlight]"
          style={{ insetInlineStart: `${fillStart}%`, width: `${Math.max(fillEnd - fillStart, 0)}%` }}
        />
        {vals.map((v, i) => {
          const name0 = range ? (i === 0 ? strings.sliderMin : strings.sliderMax) : undefined;
          const thumbId = `${auto}-thumb-${i}`;
          return (
            <div
              key={i}
              ref={(node) => {
                thumbs.current[i] = node;
              }}
              id={range ? thumbId : undefined}
              role="slider"
              tabIndex={disabled ? undefined : 0}
              aria-valuemin={i === 1 ? vals[0] : min}
              aria-valuemax={i === 0 && range ? vals[1] : max}
              aria-valuenow={v}
              aria-valuetext={formatValue ? formatValue(v, i) : undefined}
              aria-disabled={disabled || undefined}
              aria-orientation="horizontal"
              aria-label={range ? (ariaLabel ? `${ariaLabel} ${name0}` : name0) : ariaLabel}
              aria-labelledby={
                labelledBy ? (range ? `${labelledBy} ${thumbId}` : labelledBy) : undefined
              }
              aria-describedby={ariaDescribedBy}
              data-thumb={i}
              data-dragging={dragIndex === i ? '' : undefined}
              onKeyDown={handleKeyDown(i)}
              className={cn(
                'absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-th-surface shadow-card outline-none rtl:translate-x-1/2',
                'before:absolute before:-inset-3 before:content-[""]',
                isInvalid ? 'border-th-loss' : 'border-th-accent',
                'focus-visible:ring-2 focus-visible:ring-th-accent/40 data-[dragging]:z-10 data-[dragging]:scale-110',
                'transition-transform duration-100 motion-reduce:transition-none',
                'forced-colors:forced-color-adjust-none forced-colors:border-[Highlight] forced-colors:bg-[Canvas]',
                'forced-colors:focus-visible:border-[CanvasText] forced-colors:focus-visible:outline forced-colors:focus-visible:outline-2 forced-colors:focus-visible:outline-[Highlight]',
              )}
              style={{ insetInlineStart: `${pct(v)}%` }}
            />
          );
        })}
      </div>
      {name
        ? vals.map((v, i) => <input key={i} type="hidden" name={name} value={String(v)} disabled={disabled} />)
        : null}
    </div>
  );
}
