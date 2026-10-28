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
import { XIcon } from './icons';
import { Modal, whenHistorySettled } from './overlay';

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
  /** Navigate here on select (`location.assign`, or a new tab when `external`). */
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
  /** Open with Ctrl/Cmd+K, and with `/` when focus is not in a field (default true). */
  hotkey?: boolean;
  /** Called on every keystroke with the new query. */
  onQuery?: (q: string) => void;
  /** Content pinned under the results (a hint line, a link to full search). */
  footer?: ReactNode;
  /** Called with the query when Enter is pressed and nothing matches (e.g. a web search). */
  onSubmitQuery?: (q: string) => void;
}

const MAX_RESULTS = 50;

interface Ranked {
  item: CommandItem;
  /** Indices of `label` to highlight (empty when only a keyword matched). */
  marks: number[];
}

function isWordStart(text: string, i: number): boolean {
  return i === 0 || !/[a-z0-9]/i.test(text[i - 1]!);
}

/** Match tier of `q` in `text` (both lowercase): 0 prefix, 1 word start, 2 substring,
 *  3 subsequence; null when no match. `idx` are the matched character positions. */
function matchText(text: string, q: string): { tier: number; idx: number[] } | null {
  const at = text.indexOf(q);
  if (at >= 0) {
    let tier = at === 0 ? 0 : 2;
    let start = at;
    if (tier === 2) {
      for (let from = at; from >= 0; from = text.indexOf(q, from + 1)) {
        if (isWordStart(text, from)) {
          tier = 1;
          start = from;
          break;
        }
        if (from + 1 >= text.length) break;
      }
    }
    return { tier, idx: Array.from({ length: q.length }, (_, k) => start + k) };
  }
  const idx: number[] = [];
  let from = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, from);
    if (found < 0) return null;
    idx.push(found);
    from = found + 1;
  }
  return { tier: 3, idx };
}

/** Navigates after the layer that is closing has dropped its own history entry. Running
 *  `history.back()` (the layer's cleanup) right after `location.assign` would cancel the
 *  navigation, so wait for that pop to finish. Call it before closing the layer. */
export function navigateFromLayer(href: string): void {
  const inLayer = !!(history.state as { nishLayer?: string } | null)?.nishLayer;
  if (!inLayer) {
    window.location.assign(href);
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    window.location.assign(href);
  };
  // The layer's cleanup issues history.back() after this call (on close), so the back is
  // not pending yet: defer one tick, then wait for the module's pending backs to settle.
  window.setTimeout(() => whenHistorySettled(go), 0);
  // Safety net only.
  window.setTimeout(go, 400);
}

function rankItems(items: CommandItem[], query: string): Ranked[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, MAX_RESULTS).map((item) => ({ item, marks: [] }));
  const scored: { r: Ranked; score: number; order: number }[] = [];
  items.forEach((item, order) => {
    const label = matchText(item.label.toLowerCase(), q);
    if (label) {
      scored.push({ r: { item, marks: label.idx }, score: label.tier, order });
      return;
    }
    let best: number | null = null;
    for (const kw of item.keywords ?? []) {
      const m = matchText(kw.toLowerCase(), q);
      // Keywords match by prefix, word start or substring only; a loose subsequence
      // over long keywords (summaries) would match almost any short query.
      if (m && m.tier < 3 && (best === null || m.tier < best)) best = m.tier;
    }
    if (best !== null) scored.push({ r: { item, marks: [] }, score: 4 + best, order });
  });
  scored.sort((a, b) => a.score - b.score || a.order - b.order);
  return scored.slice(0, MAX_RESULTS).map((s) => s.r);
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
  const ref = useRef(open);
  ref.current = open;
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
  }, [enabled]);
}

/** Search-and-jump dialog. A full-height sheet with the field on top under 640px, a
 *  centered 560px panel from there up. Fuzzy matching (prefix, word start, substring,
 *  then subsequence), grouped rows, arrow keys, Enter, and Ctrl/Cmd+K and `/` hotkeys. */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = 'Search…',
  emptyText = 'No results',
  hotkey = true,
  onQuery,
  footer,
  onSubmitQuery,
}: CommandPaletteProps) {
  useCommandHotkey(() => {
    if (!open) onOpenChange(true);
  }, hotkey);
  if (!open) return null;
  return (
    <PaletteDialog
      onClose={() => onOpenChange(false)}
      items={items}
      placeholder={placeholder}
      emptyText={emptyText}
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
  onQuery?: (q: string) => void;
  footer?: ReactNode;
  onSubmitQuery?: (q: string) => void;
}

function PaletteDialog({ onClose, items, placeholder, emptyText, onQuery, footer, onSubmitQuery }: DialogProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (i: number) => `${uid}-opt-${i}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const isFn = typeof items === 'function';
  const itemsRef = useRef(items);
  itemsRef.current = items;

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
      setDynamic(res.slice(0, MAX_RESULTS));
      setPending(false);
      return;
    }
    setPending(true);
    res.then(
      (r) => {
        if (stale) return;
        setDynamic(r.slice(0, MAX_RESULTS));
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
  }, [query, isFn]);

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
    setActive(0);
  }, [query, flat.length]);
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const select = (item: CommandItem) => {
    onClose();
    if (item.href) {
      if (item.external) window.open(item.href, '_blank', 'noopener,noreferrer');
      else navigateFromLayer(item.href);
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
        aria-label={placeholder.replace(/…$/, '') || 'Search'}
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
        aria-label="Close"
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
      aria-label="Search"
      placement="top"
      sheetHeight="full"
      footer={footer}
      className="sm:max-w-[560px]"
    >
      <div aria-live="polite" className="sr-only">
        {showEmpty ? emptyText : `${flat.length} result${flat.length === 1 ? '' : 's'}`}
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Results"
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
                    <span className="shrink-0 text-xs text-th-hi3" aria-label="opens in a new tab">
                      ↗
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
        {showEmpty ? <div className="px-3 py-8 text-center text-sm text-th-hi3">{emptyText}</div> : null}
      </div>
    </Modal>
  );
}
