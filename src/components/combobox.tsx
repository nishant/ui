import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../cn';
import { CheckIcon, XIcon } from './icons';
import { Spinner } from './feedback';
import { fieldClass } from './primitives';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary text shown after the label and matched by the default filter. */
  hint?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** The selected option's value, or the custom text; null when nothing is selected. */
  value: string | null;
  onChange: (value: string | null, option: ComboboxOption | null) => void;
  /** Filtering. Default: case-insensitive substring on label and hint; show at most 50.
   *  With `onQueryChange` and no `filter`, options are shown as given (the server filtered them). */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Allow committing typed text that matches no option (creates); onChange gets (text, null). */
  allowCustom?: boolean;
  placeholder?: string;
  /** Accessible name when there is no visible <label htmlFor={id}>. */
  'aria-label'?: string;
  id?: string;
  disabled?: boolean;
  /** Shown when nothing matches. Default "No matches". */
  emptyText?: string;
  /** Async options: called (debounced 200ms) with the query; while `loading` shows a Spinner row "Searching…". */
  onQueryChange?: (q: string) => void;
  loading?: boolean;
  /** md h-9 (default) or sm h-8. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  className?: string;
}

const MAX_SHOWN = 50;
const DEBOUNCE_MS = 200;

const defaultFilter = (o: ComboboxOption, q: string) => {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return o.label.toLowerCase().includes(needle) || (o.hint?.toLowerCase().includes(needle) ?? false);
};

/** A text input with a listbox of suggestions (ARIA 1.2 combobox). Pick from the options,
 *  or with `allowCustom` commit what was typed. The list sits under the input and works
 *  inside a Modal or Drawer. */
export function Combobox({
  options,
  value,
  onChange,
  filter,
  allowCustom = false,
  placeholder,
  'aria-label': ariaLabel,
  id,
  disabled = false,
  emptyText = 'No matches',
  onQueryChange,
  loading = false,
  size = 'md',
  className,
}: ComboboxProps) {
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `nish-cb-${autoId}`;
  const listId = `nish-cb-list-${autoId}`;

  const [open, setOpen] = useState(false);
  // The text shown while the person is typing; `dirty` false means "show the selected label".
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const label = selected?.label ?? value ?? '';
  const shown = dirty ? text : label;
  const hasValue = value != null && value !== '';

  const visible = useMemo(() => {
    const serverFiltered = onQueryChange != null && filter == null;
    const test = filter ?? defaultFilter;
    const list = !dirty || serverFiltered ? options : options.filter((o) => test(o, text));
    return list.slice(0, MAX_SHOWN);
  }, [options, dirty, text, filter, onQueryChange]);

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  // Keep the active option in view as the arrows move through a long list.
  useEffect(() => {
    if (!open || active < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, active]);

  const reset = useCallback(() => {
    setDirty(false);
    setText('');
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const select = useCallback(
    (opt: ComboboxOption) => {
      if (opt.disabled) return;
      onChange(opt.value, opt);
      reset();
      close();
    },
    [onChange, reset, close],
  );

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

  function openList() {
    if (open || disabled) return;
    setOpen(true);
    const at = selected ? visible.findIndex((o) => o.value === selected.value) : -1;
    setActive(at >= 0 ? at : -1);
  }

  function onInput(next: string) {
    setText(next);
    setDirty(true);
    setOpen(true);
    // Without allowCustom the first match is armed for Enter; with it, Enter commits the typed text.
    if (allowCustom) setActive(-1);
    else {
      const test = filter ?? defaultFilter;
      const serverFiltered = onQueryChange != null && filter == null;
      const list = (serverFiltered ? options : options.filter((o) => test(o, next))).slice(0, MAX_SHOWN);
      setActive(list.findIndex((o) => !o.disabled));
    }
    if (onQueryChange) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => onQueryChange(next), DEBOUNCE_MS);
    }
  }

  function commitCustom(): boolean {
    const t = text.trim();
    if (!allowCustom || !dirty || !t) return false;
    const exact = options.find((o) => !o.disabled && o.label.toLowerCase() === t.toLowerCase());
    if (exact) onChange(exact.value, exact);
    else onChange(t, null);
    reset();
    close();
    return true;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        if (!open) {
          setOpen(true);
          const at = selected ? visible.findIndex((o) => o.value === selected.value) : -1;
          setActive(at >= 0 ? at : edge(dir));
        } else {
          setActive(active < 0 ? edge(dir) : step(active, dir));
        }
        break;
      }
      case 'Home':
      case 'End':
        if (open) {
          e.preventDefault();
          setActive(edge(e.key === 'Home' ? 1 : -1));
        }
        break;
      case 'Enter':
        if (open && active >= 0 && visible[active]) {
          e.preventDefault();
          select(visible[active]);
        } else if (commitCustom()) {
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
    onChange(null, null);
    reset();
    close();
    inputRef.current?.focus();
  }

  const activeId = open && active >= 0 && visible[active] ? `${listId}-opt-${active}` : undefined;

  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-label={ariaLabel}
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
          close();
          reset();
        }}
        className={fieldClass({ size, className: 'pr-11' })}
      />
      {hasValue && !disabled ? (
        <button
          type="button"
          aria-label="Clear"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi"
        >
          <span className="flex size-8 items-center justify-center rounded-md hover:bg-th-elevated">
            <XIcon size={16} />
          </span>
        </button>
      ) : null}
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop"
        >
          {visible.map((o, i) => {
            const isSelected = selected?.value === o.value;
            return (
              <li
                key={o.value}
                id={`${listId}-opt-${i}`}
                role="option"
                data-index={i}
                aria-selected={isSelected}
                aria-disabled={o.disabled || undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => !o.disabled && active !== i && setActive(i)}
                onClick={() => select(o)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-th-hi2',
                  i === active && 'bg-th-accent-soft text-th-hi',
                  o.disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint ? <span className="shrink-0 truncate text-xs text-th-hi3">{o.hint}</span> : null}
                {isSelected ? <CheckIcon size={16} className="shrink-0 text-th-accent" /> : null}
              </li>
            );
          })}
          {loading ? (
            <li role="presentation" className="flex min-h-11 items-center gap-2 px-3 text-sm text-th-hi3">
              <Spinner size="sm" />
              Searching…
            </li>
          ) : visible.length === 0 ? (
            <li role="presentation" className="flex min-h-11 items-center px-3 text-sm text-th-hi3">
              {emptyText}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
