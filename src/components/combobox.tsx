'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import { cn } from '../cn';
import { CheckIcon, XIcon } from './icons';
import { Spinner } from './feedback';
import { fieldClass } from './primitives';
import { useStrings } from './provider';
import { FIELD_STRINGS } from './strings';
import { indexComboboxOptions, setRef } from './forms-classes';
import { COMBOBOX_DEBOUNCE_MS, COMBOBOX_MAX_SHOWN, matchesComboboxNeedle } from '../combobox-filter';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary text shown after the label and matched by the default filter. */
  hint?: string;
  disabled?: boolean;
}

export interface ComboboxProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'> {
  /** The text input (the combobox element). The remaining div attributes go to the wrapper. */
  ref?: Ref<HTMLInputElement>;
  options: ComboboxOption[];
  /** The selected option's value, or the custom text; null when nothing is selected.
   *  Leave it out and use `defaultValue` for an uncontrolled combobox. */
  value?: string | null;
  /** The starting value of an uncontrolled combobox. */
  defaultValue?: string | null;
  /** Called with the new value and the option it matches (null for custom text or a clear). */
  onChange?: (value: string | null, option: ComboboxOption | null) => void;
  /** Called with the new value only (the form-library friendly name). */
  onValueChange?: (value: string | null) => void;
  /** Filtering. Default: case-insensitive substring on label and hint; show at most 50.
   *  With `onQueryChange` and no `filter`, options are shown as given (the server filtered them). */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Allow committing typed text that matches no option (creates); onChange gets (text, null). */
  allowCustom?: boolean;
  placeholder?: string;
  /** Accessible name when there is no visible <label htmlFor={id}>. */
  'aria-label'?: string;
  /** Names the combobox by another element's id. */
  'aria-labelledby'?: string;
  /** Ids of help or error text; reaches the input (Field sets it). */
  'aria-describedby'?: string;
  /** Reaches the input (Field sets it on error). */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Same as aria-invalid="true". */
  invalid?: boolean;
  /** The id of the text input, so a `<label htmlFor>` and Field reach it. */
  id?: string;
  /** Field name for a native form. A hidden input carries the selected value (the typed
   *  text is not submitted). */
  name?: string;
  /** The id of the `<form>` the hidden input belongs to, when it is not an ancestor. */
  form?: string;
  /** Marks the combobox required (`required` and `aria-required` on the input). */
  required?: boolean;
  disabled?: boolean;
  /** Shown when nothing matches. Default "No matches" (NishProvider strings). */
  emptyText?: string;
  /** Async options: called (debounced 200ms) with the query; while `loading` shows a Spinner row "Searching…". */
  onQueryChange?: (q: string) => void;
  loading?: boolean;
  /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Accessible name of the clear button. Default "Clear" (NishProvider strings). */
  clearLabel?: string;
  /** The loading row and its announcement. Default "Searching…" (NishProvider strings). */
  loadingText?: string;
  /** The polite announcement of the result count. Default: the `resultsCount` string ("3 results" / "1 result"). */
  resultsText?: (count: number) => string;
  className?: string;
}

const MAX_SHOWN = COMBOBOX_MAX_SHOWN;
const DEBOUNCE_MS = COMBOBOX_DEBOUNCE_MS;

/** A text input with a listbox of suggestions (ARIA 1.2 combobox). Pick from the options,
 *  or with `allowCustom` commit what was typed. The list sits under the input and works
 *  inside a Modal or Drawer. `ref`, `id`, `aria-*`, `name` and `required` belong to the
 *  input; `className` and other attributes go to the wrapper. */
export function Combobox({
  ref,
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  onValueChange,
  filter,
  allowCustom = false,
  placeholder,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  invalid,
  id,
  name,
  form,
  required,
  disabled = false,
  emptyText,
  onQueryChange,
  loading = false,
  size = 'md',
  clearLabel,
  loadingText,
  resultsText,
  className,
  ...rest
}: ComboboxProps) {
  const strings = useStrings(FIELD_STRINGS);
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `nish-cb-${autoId}`;
  const listId = `nish-cb-list-${autoId}`;
  const empty = emptyText ?? strings.noMatches;
  const searching = loadingText ?? strings.searching;

  const [own, setOwn] = useState<string | null>(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : own;

  const [open, setOpen] = useState(false);
  // The text shown while the person is typing; `dirty` false means "show the selected label".
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState(-1);
  // After typing (without allowCustom) the first enabled match is the active option.
  const [armed, setArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  const indexed = useMemo(() => indexComboboxOptions(options), [options]);
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const label = selected?.label ?? value ?? '';
  const shown = dirty ? text : label;
  const hasValue = value != null && value !== '';

  // One filtering pass per keystroke, over labels lower-cased once per options array.
  const visible = useMemo(() => {
    const serverFiltered = onQueryChange != null && filter == null;
    const needle = text.trim().toLowerCase();
    const out: ComboboxOption[] = [];
    for (const it of indexed) {
      if (out.length >= MAX_SHOWN) break;
      if (dirty && !serverFiltered) {
        if (filter) {
          if (!filter(it.option, text)) continue;
        } else if (!matchesComboboxNeedle(it.label, it.hint, needle)) continue;
      }
      out.push(it.option);
    }
    return out;
  }, [indexed, dirty, text, filter, onQueryChange]);

  const current = armed ? visible.findIndex((o) => !o.disabled) : active;

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  // An uncontrolled combobox returns to its default when its form is reset.
  useEffect(() => {
    const f = hiddenRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => setOwn(defaultValue);
    f.addEventListener('reset', onReset);
    return () => f.removeEventListener('reset', onReset);
  }, [name, form, controlled, defaultValue]);

  // Keep the active option in view as the arrows move through a long list.
  useEffect(() => {
    if (!open || current < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${current}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, current]);

  // Bring the whole list into view when it opens (e.g. inside a bottom-sheet Modal).
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  // Clearing the typed text also resets a server-filtered list, so the next open starts from the full list.
  const reset = () => {
    if (dirty && onQueryChange) {
      window.clearTimeout(debounceRef.current);
      onQueryChange('');
    }
    setDirty(false);
    setText('');
  };

  // The listbox is named by the field's visible label, not by the input (an input names itself by its value).
  const [fieldLabel, setFieldLabel] = useState<{ id?: string; text?: string }>({});
  useEffect(() => {
    if (!open || ariaLabel || ariaLabelledBy) return;
    const doc = inputRef.current?.ownerDocument;
    const el = doc ? Array.from(doc.getElementsByTagName('label')).find((l) => l.htmlFor === inputId) : undefined;
    const next = el ? (el.id ? { id: el.id } : { text: el.textContent?.trim() || undefined }) : {};
    setFieldLabel((prev) => (prev.id === next.id && prev.text === next.text ? prev : next));
  }, [open, ariaLabel, ariaLabelledBy, inputId]);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
    setArmed(false);
  }, []);

  const commit = (v: string | null, opt: ComboboxOption | null) => {
    if (!controlled) setOwn(v);
    onChange?.(v, opt);
    onValueChange?.(v);
  };

  const select = (opt: ComboboxOption) => {
    if (opt.disabled) return;
    commit(opt.value, opt);
    reset();
    close();
  };

  /** The next enabled index from `from` in `dir`, wrapping; -1 when none is enabled. */
  const step = (from: number, dir: 1 | -1): number => {
    const n = visible.length;
    if (n === 0) return -1;
    let i = from;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (!visible[i].disabled) return i;
    }
    return -1;
  };
  const edge = (dir: 1 | -1) => (dir === 1 ? step(-1, 1) : step(0, -1));
  const selectedAt = () => (selected ? visible.findIndex((o) => o.value === selected.value) : -1);

  function openList() {
    if (open || disabled) return;
    setOpen(true);
    setArmed(false);
    setActive(selectedAt());
  }

  function onInput(next: string) {
    setText(next);
    setDirty(true);
    setOpen(true);
    setActive(-1);
    // Without allowCustom the first match is armed for Enter; with it, Enter commits the typed text.
    setArmed(!allowCustom && next.trim() !== '');
    if (onQueryChange) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => onQueryChange(next), DEBOUNCE_MS);
    }
  }

  /** An emptied input is a clear: the keyboard path to onChange(null, null). */
  function commitEmpty(): boolean {
    if (!dirty || text.trim() !== '' || !hasValue) return false;
    commit(null, null);
    reset();
    close();
    return true;
  }

  function commitCustom(): boolean {
    const t = text.trim();
    if (!allowCustom || !dirty || !t) return false;
    const lower = t.toLowerCase();
    const exact = indexed.find((it) => !it.option.disabled && it.label === lower)?.option;
    if (exact) commit(exact.value, exact);
    else commit(t, null);
    reset();
    close();
    return true;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // The Enter (or arrow) that confirms an IME composition belongs to the IME. keyCode 229 covers Safari.
    if (disabled || e.nativeEvent.isComposing || e.keyCode === 229) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        setArmed(false);
        if (!open) {
          setOpen(true);
          const at = selectedAt();
          setActive(at >= 0 ? at : edge(dir));
        } else {
          setActive(current < 0 ? edge(dir) : step(current, dir));
        }
        break;
      }
      case 'Home':
      case 'End':
        if (open) {
          e.preventDefault();
          setArmed(false);
          setActive(edge(e.key === 'Home' ? 1 : -1));
        }
        break;
      case 'Enter':
        if (open && current >= 0 && visible[current]) {
          e.preventDefault();
          select(visible[current]);
        } else if (commitEmpty() || commitCustom()) {
          e.preventDefault();
        } else if (open) {
          e.preventDefault();
        }
        break;
      case 'Escape':
        // Keep the Escape for the combobox so an enclosing Modal or Drawer stays open.
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (dirty) {
          e.preventDefault();
          e.stopPropagation();
          reset();
        }
        break;
      case 'Tab':
        close();
        break;
    }
  }

  function clear() {
    commit(null, null);
    reset();
    close();
    inputRef.current?.focus();
  }

  const activeId = open && current >= 0 && visible[current] ? `${listId}-opt-${current}` : undefined;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true';

  return (
    <div
      {...rest}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      className={cn('relative w-full min-w-0', className)}
    >
      <input
        ref={(node) => {
          inputRef.current = node;
          setRef(ref, node);
        }}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={isInvalid || undefined}
        aria-required={required || undefined}
        required={required}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        disabled={disabled}
        value={shown}
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={onKeyDown}
        onClick={openList}
        onBlur={() => {
          if (!commitEmpty()) {
            close();
            reset();
          }
        }}
        className={fieldClass({ size, className: 'pe-11' })}
      />
      {name != null ? <input ref={hiddenRef} type="hidden" name={name} value={value ?? ''} form={form} disabled={disabled} /> : null}
      {hasValue && !disabled ? (
        <button
          type="button"
          aria-label={clearLabel ?? strings.clear}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi"
        >
          <span className="flex size-8 items-center justify-center rounded-md hover:bg-th-elevated">
            <XIcon size={16} />
          </span>
        </button>
      ) : null}
      <div role="status" aria-live="polite" className="sr-only">
        {open ? (loading ? searching : visible.length === 0 ? empty : (resultsText ?? strings.resultsCount)(visible.length)) : ''}
      </div>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : fieldLabel.text)}
          aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? fieldLabel.id)}
          className="absolute inset-x-0 top-full z-[var(--nish-z-dropdown,40)] mt-1 max-h-[min(16rem,40dvh)] overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop"
        >
          {visible.map((o, i) => {
            const isSelected = selected?.value === o.value;
            return (
              <li
                key={o.value}
                id={`${listId}-opt-${i}`}
                role="option"
                data-index={i}
                data-state={i === current ? 'active' : 'inactive'}
                data-disabled={o.disabled ? '' : undefined}
                aria-selected={isSelected}
                aria-disabled={o.disabled || undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => {
                  if (o.disabled || (!armed && active === i)) return;
                  setArmed(false);
                  setActive(i);
                }}
                onClick={() => select(o)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-th-hi2',
                  i === current && 'bg-th-accent-soft text-th-hi forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]',
                  o.disabled && 'cursor-not-allowed opacity-50 forced-colors:text-[color:GrayText]',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint ? <span className={cn('shrink-0 truncate text-xs text-th-hi3', i === current && 'forced-colors:text-[color:HighlightText]')}>{o.hint}</span> : null}
                {isSelected ? <CheckIcon size={16} className="shrink-0 text-th-accent" /> : null}
              </li>
            );
          })}
          {loading ? (
            <li role="presentation" className="flex min-h-11 items-center gap-2 px-3 text-sm text-th-hi3">
              <Spinner size="sm" />
              {searching}
            </li>
          ) : visible.length === 0 ? (
            <li role="presentation" className="flex min-h-11 items-center px-3 text-sm text-th-hi3">
              {empty}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
