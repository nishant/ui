'use client';
import {
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { Chip } from './forms';
import { fieldClass } from './primitives';
import { useNishStrings } from './provider';

export interface TagInputProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange' | 'children' | 'placeholder'> {
  /** The tags (controlled). */
  value?: string[];
  /** The initial tags (uncontrolled). */
  defaultValue?: string[];
  /** Called with the new list when a tag is added or removed. */
  onValueChange?: (value: string[]) => void;
  /** Posts every tag in a form, one hidden input per tag under this name. */
  name?: string;
  /** Shown in the text box while there are no tags. */
  placeholder?: string;
  /** No more than this many tags can be added. */
  maxTags?: number;
  /** Return an error message to refuse a tag (it stays in the text box, and the message shows
   *  under the field), or null to accept it. */
  validate?: (tag: string) => string | null;
  /** A list of tags to pick from, filtered as the reader types (combobox pattern). Free
   *  text is still accepted. */
  suggestions?: string[];
  disabled?: boolean;
  /** Required on the text box (native validation is off while it holds nothing but tags; use
   *  your form library for "at least one tag"). */
  required?: boolean;
  /** Red border and aria-invalid on the text box. Field sets it from its `error`. */
  invalid?: boolean;
  /** md (default) or sm, as for Input. */
  size?: 'sm' | 'md';
  /** The text `<input>`. */
  inputRef?: Ref<HTMLInputElement>;
  /** The bordered box that holds the tags and the text box. `id`, `aria-label`, `aria-labelledby`,
   *  `aria-describedby` and `aria-invalid` go to the text box instead, so a Field label reaches it. */
  ref?: Ref<HTMLDivElement>;
}

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

const SPLIT = /[\n\r\t,]+/;

/** A text box that turns what you type into removable tags. Enter and comma add a tag, pasting
 *  a list splits it, Backspace on an empty box removes the last tag. Each tag posts as its own
 *  hidden input. */
export function TagInput({
  value,
  defaultValue,
  onValueChange,
  name,
  placeholder,
  maxTags,
  validate,
  suggestions,
  disabled = false,
  required = false,
  invalid = false,
  size = 'md',
  className,
  ref,
  inputRef,
  id,
  onClick,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: TagInputProps) {
  const strings = useNishStrings();
  const auto = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const controlled = value !== undefined;
  const [inner, setInner] = useState<string[]>(defaultValue ?? []);
  const tags = controlled ? value : inner;
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${auto}-list`;
  const errorId = `${auto}-error`;
  const hasSuggestions = suggestions !== undefined;

  const filtered = useMemo(() => {
    if (!suggestions) return [];
    const q = text.trim().toLowerCase();
    return suggestions.filter((s) => !tags.includes(s) && s.toLowerCase().includes(q));
  }, [suggestions, tags, text]);
  const listOpen = hasSuggestions && open && filtered.length > 0 && !disabled;

  const setTags = (next: string[]) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };

  /** Adds each non-empty, new tag that validates. Returns the first error, or null. */
  const add = (raw: string[]): string | null => {
    let next = tags;
    let err: string | null = null;
    for (const r of raw) {
      const t = r.trim();
      if (!t || next.includes(t)) continue;
      if (maxTags !== undefined && next.length >= maxTags) break;
      const message = validate?.(t) ?? null;
      if (message) {
        err ??= message;
        continue;
      }
      next = [...next, t];
    }
    if (next !== tags) setTags(next);
    setError(err);
    return err;
  };

  const commitText = (raw: string) => {
    if (!add([raw])) {
      setText('');
      setActive(-1);
    }
  };

  const remove = (tag: string) => {
    setError(null);
    setTags(tags.filter((t) => t !== tag));
    input.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      if (listOpen && active >= 0) {
        e.preventDefault();
        commitText(filtered[active]!);
      } else if (text.trim()) {
        e.preventDefault();
        commitText(text);
      }
    } else if (e.key === ',') {
      e.preventDefault();
      if (text.trim()) commitText(text);
    } else if (e.key === 'Backspace' && text === '' && tags.length > 0) {
      e.preventDefault();
      setError(null);
      setTags(tags.slice(0, -1));
    } else if (e.key === 'ArrowDown' && hasSuggestions) {
      e.preventDefault();
      if (!listOpen) {
        setOpen(true);
        setActive(0);
      } else setActive((a) => (a + 1) % filtered.length);
    } else if (e.key === 'ArrowUp' && hasSuggestions) {
      e.preventDefault();
      if (!listOpen) {
        setOpen(true);
        setActive(filtered.length - 1);
      } else setActive((a) => (a <= 0 ? filtered.length - 1 : a - 1));
    } else if (e.key === 'Escape' && listOpen) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setActive(-1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!SPLIT.test(pasted)) return;
    e.preventDefault();
    const parts = pasted.split(SPLIT);
    parts[0] = text + parts[0];
    if (!add(parts)) setText('');
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    onBlur?.(e);
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
      setActive(-1);
    }
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    if (!disabled && (e.target as HTMLElement).closest('button, input, [role="option"]') === null) input.current?.focus();
  };

  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true' || error !== null;

  return (
    <div
      {...rest}
      ref={ref}
      data-disabled={disabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      onClick={handleClick}
      onBlur={handleBlur}
      className={fieldClass({
        size,
        invalid: isInvalid,
        className: cn(
          'relative flex h-auto cursor-text flex-wrap items-center gap-1.5 py-1',
          'focus-within:border-th-accent focus-within:ring-2 focus-within:ring-th-accent/25',
          'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
          'forced-colors:focus-within:outline-solid forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-[Highlight]',
          className,
        ),
      })}
    >
      {tags.map((tag) => (
        <Chip
          key={tag}
          variant="tag"
          size="sm"
          removeLabel={strings.removeTag(tag)}
          onRemove={disabled ? undefined : () => remove(tag)}
        >
          {tag}
        </Chip>
      ))}
      <input
        ref={(node) => {
          input.current = node;
          setRef(inputRef, node);
        }}
        id={id}
        type="text"
        value={text}
        disabled={disabled}
        required={required && tags.length === 0}
        placeholder={tags.length === 0 ? placeholder : undefined}
        autoComplete="off"
        role={hasSuggestions ? 'combobox' : undefined}
        aria-expanded={hasSuggestions ? listOpen : undefined}
        aria-controls={listOpen ? listId : undefined}
        aria-autocomplete={hasSuggestions ? 'list' : undefined}
        aria-activedescendant={listOpen && active >= 0 ? `${auto}-opt-${active}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={[ariaDescribedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
        aria-invalid={isInvalid || undefined}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className="min-w-24 flex-1 bg-transparent py-0.5 text-th-hi outline-none placeholder:text-th-hi3"
      />
      {error ? (
        <p id={errorId} role="alert" className="basis-full text-xs text-th-loss">
          {error}
        </p>
      ) : null}
      {listOpen ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-[var(--nish-z-dropdown,40)] mt-1 max-h-56 overflow-auto rounded-lg border border-th-line bg-th-overlay p-1 shadow-pop"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${auto}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              data-active={i === active ? '' : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => {
                commitText(s);
                input.current?.focus();
              }}
              className={cn(
                'cursor-pointer rounded-md px-2.5 py-1.5 text-sm text-th-hi2 pointer-coarse:min-h-11 pointer-coarse:py-2.5',
                i === active && 'bg-th-elevated text-th-hi forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      {name ? tags.map((tag) => <input key={tag} type="hidden" name={name} value={tag} disabled={disabled} />) : null}
    </div>
  );
}
