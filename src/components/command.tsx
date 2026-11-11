'use client';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import { COMMAND_MAX_RESULTS, matchText, rankCommandItems } from '../command-filter';
import { safeUrl } from '../url';
import { XIcon } from './icons';
import { Modal } from './modal';
import { navigateFromLayer, warnUnsafe } from './navigate';
import { useLatest } from './latest';
import { useStrings } from './provider';
import { COMMAND_STRINGS, FIELD_STRINGS, OVERLAY_STRINGS } from './strings';

export { navigateFromLayer };

// ---------------------------------------------------------------------------------
// CommandPalette: a search-and-jump dialog (Ctrl/Cmd+K) over a list of items.
// ---------------------------------------------------------------------------------

/** One row of the palette. */
export interface CommandItem {
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
  /** Navigate here on select (`location.assign`, or a new tab when `external`). Passed through
   *  `safeUrl`: a `javascript:` or `data:` URL does nothing (a dev warning names it). */
  href?: string;
  /** Open `href` in a new tab. */
  external?: boolean;
  /** Called on select when there is no `href` (or after it, never both: href wins). */
  onSelect?: () => void;
}

export interface CommandPaletteProps {
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
  /** Screen-reader announcement of the result count. Default "3 results". */
  resultsLabel?: (count: number) => string;
  /** Accessible name of the "opens in a new tab" mark on external rows. Default 'opens in a new tab'. */
  externalLabel?: string;
  /** Open with Ctrl/Cmd+K, and with `/` when focus is not in a field (default true). */
  hotkey?: boolean;
  /** Called on every keystroke with the new query. */
  onQuery?: (q: string) => void;
  /** Content pinned under the results (a hint line, a link to full search). */
  footer?: ReactNode;
  /** Called with the query when Enter is pressed and nothing matches (e.g. a web search). */
  onSubmitQuery?: (q: string) => void;
}

interface Ranked {
  item: CommandItem;
  /** Indices of `label` to highlight (empty when only a keyword matched). */
  marks: number[];
}

function rankItems(items: CommandItem[], query: string): Ranked[] {
  return rankCommandItems(items, query);
}

/** Groups ranked rows by `group` (first appearance order, ungrouped first), keeping rank
 *  order inside each group, and numbers them for keyboard movement. */
function groupRows(rows: Ranked[]): { group: string | null; rows: { r: Ranked; index: number }[] }[] {
  const order: (string | null)[] = [];
  const map = new Map<string | null, Ranked[]>();
  for (const r of rows) {
    const g = r.item.group ?? null;
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g)!.push(r);
  }
  order.sort((a, b) => (a === null ? -1 : b === null ? 1 : 0));
  let index = 0;
  return order.map((group) => ({ group, rows: map.get(group)!.map((r) => ({ r, index: index++ })) }));
}

function Highlighted({ text, marks }: { text: string; marks: number[] }) {
  if (marks.length === 0) return <>{text}</>;
  const set = new Set(marks);
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const on = set.has(i);
    let j = i;
    while (j < text.length && set.has(j) === on) j++;
    const chunk = text.slice(i, j);
    parts.push(
      on ? (
        <mark key={i} className="bg-transparent font-semibold text-th-accent">
          {chunk}
        </mark>
      ) : (
        <span key={i}>{chunk}</span>
      ),
    );
    i = j;
  }
  return <>{parts}</>;
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function defaultResultsLabel(count: number): string {
  return `${count} result${count === 1 ? '' : 's'}`;
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
}

/**
 * Registers the palette hotkeys: Ctrl/Cmd+K anywhere, and `/` when focus is not in a
 * field. For apps that render their own trigger or palette.
 *
 * @param open - Called when a hotkey fires.
 * @param enabled - Set false to listen to nothing (default true).
 */
export function useCommandHotkey(open: () => void, enabled = true): void {
  const ref = useLatest(open);
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current();
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        ref.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled, ref]);
}

/** Search-and-jump dialog. A full-height sheet with the field on top under 640px, a
 *  centered 560px panel from there up. Fuzzy matching (prefix, word start, substring,
 *  then subsequence), grouped rows, arrow keys, Enter, and Ctrl/Cmd+K and `/` hotkeys. */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder,
  emptyText,
  resultsLabel,
  externalLabel,
  hotkey = true,
  onQuery,
  footer,
  onSubmitQuery,
}: CommandPaletteProps) {
  const s = useStrings(COMMAND_STRINGS, FIELD_STRINGS, OVERLAY_STRINGS);
  useCommandHotkey(() => {
    if (!open) onOpenChange(true);
  }, hotkey);
  if (!open) return null;
  return (
    <PaletteDialog
      onClose={() => onOpenChange(false)}
      items={items}
      placeholder={placeholder ?? s.searchPlaceholder}
      emptyText={emptyText ?? s.noResults}
      resultsLabel={resultsLabel}
      externalLabel={externalLabel ?? 'opens in a new tab'}
      onQuery={onQuery}
      footer={footer}
      onSubmitQuery={onSubmitQuery}
    />
  );
}

interface DialogProps {
  onClose: () => void;
  items: CommandPaletteProps['items'];
  placeholder: string;
  emptyText: string;
  resultsLabel?: (count: number) => string;
  externalLabel: string;
  onQuery?: (q: string) => void;
  footer?: ReactNode;
  onSubmitQuery?: (q: string) => void;
}

function PaletteDialog({ onClose, items, placeholder, emptyText, resultsLabel, externalLabel, onQuery, footer, onSubmitQuery }: DialogProps) {
  const s = useStrings(COMMAND_STRINGS, FIELD_STRINGS, OVERLAY_STRINGS);
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (i: number) => `${uid}-opt-${i}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const isFn = typeof items === 'function';
  const itemsRef = useLatest(items);

  // Dynamic results: the latest response for the latest query wins.
  const [dynamic, setDynamic] = useState<CommandItem[]>([]);
  const [pending, setPending] = useState(isFn);
  useEffect(() => {
    const fn = itemsRef.current;
    if (typeof fn !== 'function') return;
    let stale = false;
    let res: CommandItem[] | Promise<CommandItem[]>;
    try {
      res = fn(query);
    } catch {
      res = [];
    }
    if (Array.isArray(res)) {
      setDynamic(res.slice(0, COMMAND_MAX_RESULTS));
      setPending(false);
      return;
    }
    setPending(true);
    res.then(
      (r) => {
        if (stale) return;
        setDynamic(r.slice(0, COMMAND_MAX_RESULTS));
        setPending(false);
      },
      () => {
        if (stale) return;
        setDynamic([]);
        setPending(false);
      },
    );
    return () => {
      stale = true;
    };
  }, [query, isFn, itemsRef]);

  const rows = useMemo<Ranked[]>(() => {
    if (isFn) return dynamic.map((item) => ({ item, marks: matchText(item.label.toLowerCase(), query.trim().toLowerCase())?.idx ?? [] }));
    return rankItems(items as CommandItem[], query);
  }, [isFn, dynamic, items, query]);
  const groups = useMemo(() => groupRows(rows), [rows]);
  // Keyboard order follows the grouped display order.
  const flat = useMemo(() => groups.flatMap((g) => g.rows.map((x) => x.r.item)), [groups]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
    setActive(0);
  }, [query, flat.length]);
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const select = (item: CommandItem) => {
    onClose();
    if (item.href) {
      const href = safeUrl(item.href);
      if (href === null) warnUnsafe(item.href);
      else if (item.external) window.open(href, '_blank', 'noopener,noreferrer');
      else navigateFromLayer(href);
    } else {
      item.onSelect?.();
    }
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flat.length) setActive((a) => (a + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length) setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === 'Home' && flat.length && !query) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flat[active];
      if (item) select(item);
      else if (!pending && query.trim() && onSubmitQuery) {
        onClose();
        onSubmitQuery(query.trim());
      }
    }
  };

  const header = (
    <div className="flex items-center gap-2 border-b border-th-line px-4 pb-2 sm:pt-1">
      <span className="shrink-0 text-th-hi3">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={flat.length ? optionId(active) : undefined}
        aria-label={placeholder.replace(/…$/, '') || s.search}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint={flat.length ? 'go' : 'search'}
        onChange={(e) => {
          setQuery(e.target.value);
          onQuery?.(e.target.value);
        }}
        onKeyDown={onKeyDown}
        className="h-12 min-w-0 flex-1 bg-transparent text-base text-th-hi outline-none placeholder:text-th-hi3"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={s.close}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-th-hi3 transition-colors hover:bg-th-elevated hover:text-th-hi sm:hidden"
      >
        <XIcon size={18} />
      </button>
    </div>
  );

  const showEmpty = flat.length === 0 && !pending;

  return (
    <Modal
      onClose={onClose}
      header={header}
      aria-label={s.search}
      placement="top"
      sheetHeight="full"
      footer={footer}
      className="sm:max-w-[560px]"
    >
      <div aria-live="polite" className="sr-only">
        {showEmpty ? '' : (resultsLabel ?? defaultResultsLabel)(flat.length)}
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={s.results}
        aria-busy={pending}
        className="-mx-2"
        onMouseDown={(e) => e.preventDefault()}
      >
        {groups.map((g, gi) => {
          const headId = `${uid}-g-${gi}`;
          return (
            <div key={g.group ?? '__none'} role="group" aria-labelledby={g.group ? headId : undefined}>
              {g.group ? (
                <div id={headId} className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-th-hi3">
                  {g.group}
                </div>
              ) : null}
              {g.rows.map(({ r, index }) => (
                <div
                  key={r.item.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => index !== active && setActive(index)}
                  onClick={() => select(r.item)}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-th-hi2',
                    index === active && 'bg-th-elevated text-th-hi',
                  )}
                >
                  {r.item.icon ? <span className="inline-flex shrink-0 items-center text-th-hi3">{r.item.icon}</span> : null}
                  <span className="min-w-0 flex-1 truncate">
                    <Highlighted text={r.item.label} marks={r.marks} />
                  </span>
                  {r.item.hint ? <span className="max-w-[40%] shrink-0 truncate text-xs text-th-hi3">{r.item.hint}</span> : null}
                  {r.item.external ? (
                    <span className="inline-block shrink-0 text-xs text-th-hi3 rtl:-scale-x-100" role="img" aria-label={externalLabel}>
                      ↗
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* Outside the listbox: a listbox may hold only options and groups. */}
      {showEmpty ? (
        <div role="status" className="px-3 py-8 text-center text-sm text-th-hi3">
          {emptyText}
        </div>
      ) : null}
    </Modal>
  );
}
