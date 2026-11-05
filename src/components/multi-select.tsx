'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type Ref } from 'react';
import { cn } from '../cn';
import { CheckIcon, XIcon } from './icons';
import { Spinner } from './feedback';
import { Chip } from './forms';
import { fieldClass } from './primitives';
import { useNishStrings } from './provider';
import { indexComboboxOptions, setRef } from './forms-classes';
import { COMBOBOX_DEBOUNCE_MS, COMBOBOX_MAX_SHOWN } from '../combobox-filter';
import type { ComboboxOption } from './combobox';

export interface MultiSelectProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'children' | 'id' | 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'role'> {
  /** The text input (the combobox element). The remaining div attributes go to the wrapper. */
  ref?: Ref<HTMLInputElement>;
  /** The choices: `{ value, label, disabled? }` objects, the same as Combobox. */
  options: ComboboxOption[];
  /** The picked values, in the order they were picked (controlled). */
  value?: string[];
  /** The starting values of an uncontrolled MultiSelect. */
  defaultValue?: string[];
  /** Called with the new list of values. */
  onValueChange?: (value: string[]) => void;
  /** Called with the new values and their options. */
  onChange?: (value: string[], options: ComboboxOption[]) => void;
  /** Filtering. Default: case-insensitive substring on label and hint; show at most 50.
   *  With `onQueryChange` and no `filter`, options are shown as given (the server filtered them). */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** No more than this many values can be picked; the rest of the options are disabled. */
  maxSelected?: number;
  /** Shown in the text box while nothing is picked. */
  placeholder?: string;
  /** Accessible name of the text input. Give this, `aria-labelledby` or `id` with a Label. */
  'aria-label'?: string;
  /** The id of the element that names the text input. */
  'aria-labelledby'?: string;
  /** The id of the element that describes the text input (help or error text). */
  'aria-describedby'?: string;
  /** Marks the text input invalid and gives the box a red border. */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Same as aria-invalid="true". */
  invalid?: boolean;
  /** The id of the text input. */
  id?: string;
  /** Field name for a native form: one hidden input per picked value. */
  name?: string;
  /** The id of the <form> the hidden inputs belong to. */
  form?: string;
  /** Required while nothing is picked. */
  required?: boolean;
  /** Turns the field off: no typing, picking or removing tags. */
  disabled?: boolean;
  /** Shown when nothing matches. Default "No matches" (NishProvider strings). */
  emptyText?: string;
  /** Async options: called (debounced 200ms) with the query. */
  onQueryChange?: (q: string) => void;
  /** Shows a Spinner row "Searching…" while true. */
  loading?: boolean;
  /** The loading row and its announcement. Default "Searching…" (NishProvider strings). */
  loadingText?: string;
  /** The polite announcement of the result count. Default "3 results" / "1 result". */
  resultsText?: (count: number) => string;
  /** md (default) or sm. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** Accessible name of the clear-all button. Default "Clear all" (NishProvider strings). */
  clearLabel?: string;
  /** Extra classes for the wrapper around the field box and the list. */
  className?: string;
}

const defaultResultsText = (n: number): string => `${n} ${n === 1 ? 'result' : 'results'}`;

/** An editable combobox that picks several options. Picked values show as removable tags,
 *  the list stays open after a pick, and every value posts as its own hidden input. `ref`,
 *  `id`, `aria-*` and `required` belong to the text input; `className` and other attributes
 *  go to the wrapper. */
export function MultiSelect({
  ref,
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  onChange,
  filter,
  maxSelected,
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
  loadingText,
  resultsText = defaultResultsText,
  size = 'md',
  clearLabel,
  className,
  ...rest
}: MultiSelectProps) {
  const strings = useNishStrings();
  const autoId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputId = id ?? `nish-ms-${autoId}`;
  const listId = `nish-ms-list-${autoId}`;
  const empty = emptyText ?? strings.noMatches;
  const searching = loadingText ?? strings.searching;

  const defaultRef = useRef(defaultValue);
  useEffect(() => {
    defaultRef.current = defaultValue;
  });
  const [own, setOwn] = useState<string[]>(defaultValue ?? []);
  const controlled = valueProp !== undefined;
  const values = controlled ? valueProp : own;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [active, setActive] = useState(-1);
  // After typing, the first enabled match is the active option.
  const [armed, setArmed] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  // Options picked in this instance, so async results keep their labels after `options` changes.
  const [seen, setSeen] = useState<Record<string, ComboboxOption>>({});

  const indexed = useMemo(() => indexComboboxOptions(options), [options]);

  // Remember the labels of current values found in `options`, so preset (default or controlled)
  // values keep their labels after async results replace `options`.
  // (State adjusted during render, which React allows for a component's own state.)
  {
    const cur = valueProp ?? own;
    let next: Record<string, ComboboxOption> | null = null;
    for (const o of options) if (cur.includes(o.value) && seen[o.value]?.label !== o.label) (next ??= { ...seen })[o.value] = o;
    if (next) setSeen(next);
  }

  const visible = useMemo(() => {
    const serverFiltered = onQueryChange != null && filter == null;
    const needle = text.trim().toLowerCase();
    const out: ComboboxOption[] = [];
    for (const it of indexed) {
      if (out.length >= COMBOBOX_MAX_SHOWN) break;
      if (needle && !serverFiltered) {
        if (filter) {
          if (!filter(it.option, text)) continue;
        } else if (!it.label.includes(needle) && !(it.hint?.includes(needle) ?? false)) continue;
      }
      out.push(it.option);
    }
    return out;
  }, [indexed, text, filter, onQueryChange]);

  const current = armed ? visible.findIndex((o) => !o.disabled) : active;
  const atLimit = maxSelected != null && values.length >= maxSelected;

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !ariaLabel && !ariaLabelledBy && id == null) {
      console.warn('MultiSelect needs a name: pass aria-label, aria-labelledby, or an id with a <label htmlFor>.');
    }
  }, [ariaLabel, ariaLabelledBy, id]);

  // An uncontrolled MultiSelect returns to its default when its form is reset.
  useEffect(() => {
    const f = inputRef.current?.form;
    if (!f || controlled) return;
    const onReset = () => setOwn(defaultRef.current ?? []);
    f.addEventListener('reset', onReset);
    return () => f.removeEventListener('reset', onReset);
  }, [controlled, form]);

  // Keep the active option in view as the arrows move through a long list.
  useEffect(() => {
    if (!open || current < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${current}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [open, current]);

  const toOption = (v: string): ComboboxOption =>
    options.find((o) => o.value === v) ?? seen[v] ?? { value: v, label: v };
  const labelOf = (v: string) => toOption(v).label;

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
    setArmed(false);
  }, []);

  const queryChanged = (q: string) => {
    if (!onQueryChange) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onQueryChange(q), COMBOBOX_DEBOUNCE_MS);
  };

  const commit = (next: string[]) => {
    if (!controlled) setOwn(next);
    onValueChange?.(next);
    onChange?.(next, next.map(toOption));
  };

  const toggle = (o: ComboboxOption) => {
    if (o.disabled || disabled) return;
    const picked = values.includes(o.value);
    if (picked) {
      commit(values.filter((v) => v !== o.value));
      setAnnouncement(strings.optionRemoved(o.label));
    } else {
      if (maxSelected != null && values.length >= maxSelected) {
        setAnnouncement(strings.maxSelected(maxSelected));
        return;
      }
      setSeen((s) => ({ ...s, [o.value]: o }));
      commit([...values, o.value]);
      setAnnouncement(strings.optionAdded(o.label));
    }
    if (text !== '') {
      setText('');
      queryChanged('');
    }
    setArmed(false);
    // The query is cleared, so the list is the unfiltered one: keep the active row on this option.
    const at = options.findIndex((x) => x.value === o.value);
    setActive(at >= 0 && at < COMBOBOX_MAX_SHOWN ? at : -1);
  };

  const removeValue = (v: string) => {
    commit(values.filter((x) => x !== v));
    setAnnouncement(strings.optionRemoved(labelOf(v)));
    inputRef.current?.focus();
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
  const firstPickedAt = () => visible.findIndex((o) => !o.disabled && values.includes(o.value));

  function openList() {
    if (open || disabled) return;
    setOpen(true);
    setArmed(false);
    setAnnouncement('');
    setActive(firstPickedAt());
  }

  function onInput(next: string) {
    setText(next);
    setOpen(true);
    setActive(-1);
    setArmed(next.trim() !== '');
    setAnnouncement('');
    queryChanged(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled || e.nativeEvent.isComposing) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        setArmed(false);
        if (!open) {
          setOpen(true);
          setAnnouncement('');
          const at = firstPickedAt();
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
          toggle(visible[current]);
        } else if (open) {
          e.preventDefault();
        }
        break;
      case 'Escape':
        // Keep the Escape for the MultiSelect so an enclosing Modal or Drawer stays open.
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        } else if (text !== '') {
          e.stopPropagation();
          setText('');
          queryChanged('');
        }
        break;
      case 'Backspace': {
        const el = e.currentTarget;
        if (text === '' && el.selectionStart === 0 && el.selectionEnd === 0 && values.length > 0) {
          e.preventDefault();
          removeValue(values[values.length - 1]);
        }
        break;
      }
      case 'Tab':
        close();
        break;
    }
  }

  function clearAll() {
    commit([]);
    setAnnouncement('');
    inputRef.current?.focus();
  }

  function onBoxClick(e: MouseEvent<HTMLDivElement>) {
    if (disabled) return;
    if ((e.target as HTMLElement).closest('button, input, [role="option"]') === null) {
      inputRef.current?.focus();
      openList();
    }
  }

  const activeId = open && current >= 0 && visible[current] ? `${listId}-opt-${current}` : undefined;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === 'true';
  const status = announcement || (open ? (loading ? searching : visible.length === 0 ? empty : resultsText(visible.length)) : '');

  return (
    <div
      {...rest}
      data-state={open ? 'open' : 'closed'}
      data-disabled={disabled ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      onBlur={(e) => {
        rest.onBlur?.(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          close();
          setText('');
        }
      }}
      className={cn('relative w-full min-w-0', className)}
    >
      <div
        data-disabled={disabled ? '' : undefined}
        onClick={onBoxClick}
        className={fieldClass({
          size,
          invalid: isInvalid,
          className: cn(
            'relative flex h-auto cursor-text flex-wrap items-center gap-1.5 py-1 pe-11',
            'focus-within:border-th-accent focus-within:ring-2 focus-within:ring-th-accent/25',
            'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
            'forced-colors:focus-within:outline-solid forced-colors:focus-within:outline-2 forced-colors:focus-within:outline-[Highlight]',
          ),
        })}
      >
        {values.map((v) => (
          <Chip
            key={v}
            variant="tag"
            size="sm"
            removeLabel={strings.removeNamed(labelOf(v))}
            onRemove={disabled ? undefined : () => removeValue(v)}
          >
            {labelOf(v)}
          </Chip>
        ))}
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
          required={required && values.length === 0}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={values.length === 0 ? placeholder : undefined}
          disabled={disabled}
          value={text}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={openList}
          className="min-w-24 flex-1 bg-transparent py-0.5 text-th-hi outline-none placeholder:text-th-hi3"
        />
        {values.length > 0 && !disabled ? (
          <button
            type="button"
            aria-label={clearLabel ?? strings.clearAll}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearAll}
            className="absolute -inset-y-px -end-px flex w-11 items-center justify-center text-th-hi3 hover:text-th-hi"
          >
            <span className="flex size-8 items-center justify-center rounded-md hover:bg-th-elevated">
              <XIcon size={16} />
            </span>
          </button>
        ) : null}
      </div>
      {name != null
        ? values.map((v) => <input key={v} type="hidden" name={name} value={v} form={form} disabled={disabled} />)
        : null}
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? inputId)}
          className="absolute inset-x-0 top-full z-[var(--nish-z-dropdown,40)] mt-1 max-h-[min(16rem,40dvh)] overflow-auto rounded-xl border border-th-line bg-th-elevated shadow-pop"
        >
          {visible.map((o, i) => {
            const picked = values.includes(o.value);
            const limited = atLimit && !picked;
            const off = o.disabled || limited;
            return (
              <li
                key={o.value}
                id={`${listId}-opt-${i}`}
                role="option"
                data-index={i}
                data-state={i === current ? 'active' : 'inactive'}
                data-disabled={off ? '' : undefined}
                aria-selected={picked}
                aria-disabled={off || undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => {
                  if (o.disabled || (!armed && active === i)) return;
                  setArmed(false);
                  setActive(i);
                }}
                onClick={() => toggle(o)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm text-th-hi2',
                  i === current && 'bg-th-accent-soft text-th-hi forced-colors:forced-color-adjust-none forced-colors:bg-[color:Highlight] forced-colors:text-[color:HighlightText]',
                  off && 'cursor-not-allowed opacity-50 forced-colors:text-[color:GrayText]',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border',
                    picked ? 'border-th-accent bg-th-accent text-th-on-accent forced-colors:bg-[Highlight]' : 'border-th-line-control',
                  )}
                >
                  {picked ? <CheckIcon size={12} /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint ? <span className={cn('shrink-0 truncate text-xs text-th-hi3', i === current && 'forced-colors:text-[color:HighlightText]')}>{o.hint}</span> : null}
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
