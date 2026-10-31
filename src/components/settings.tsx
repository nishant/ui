import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../cn';
import { Spinner } from './feedback';
import { Card, Input, type InputProps } from './primitives';

// --- SettingsSection ----------------------------------------------------------------

export interface SettingsSectionProps {
  title: ReactNode;
  description?: ReactNode;
  id?: string;
  /** Right side of the heading (a Reset button). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A titled group of setting rows in one unpadded Card, rows divided by a line. */
export function SettingsSection({ title, description, id, actions, children, className }: SettingsSectionProps) {
  const auto = useId();
  const headingId = `${id ?? auto}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('min-w-0', className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-base font-semibold text-th-hi">
            {title}
          </h2>
          {description != null ? <p className="mt-0.5 text-sm text-th-hi3">{description}</p> : null}
        </div>
        {actions != null ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <Card padding="none" className="divide-y divide-th-line">
        {children}
      </Card>
    </section>
  );
}

// --- SettingRow ---------------------------------------------------------------------

export interface SettingRowProps {
  label: ReactNode;
  description?: ReactNode;
  /** The control (Switch, Select, NumberField, Button). */
  children: ReactNode;
  /** id of the control, so the label is a <label htmlFor>. */
  htmlFor?: string;
  /** Stack the control under the label at every width (wide controls, textareas). Default: side by side from sm up, stacked below. */
  stacked?: boolean;
  /** Keep the control at the end of the label row at every width (Switch, Checkbox). */
  inline?: boolean;
  /** A muted status after the control: "Saved", "Saving…", or an error (tone="error" → text-th-loss). */
  status?: ReactNode;
  statusTone?: 'muted' | 'error' | 'ok';
  className?: string;
}

const STATUS_TONE = { muted: 'text-th-hi3', error: 'text-th-loss', ok: 'text-th-ok' } as const;

/** One label + control row inside a SettingsSection. */
export function SettingRow({
  label,
  description,
  children,
  htmlFor,
  stacked = false,
  inline = false,
  status,
  statusTone = 'muted',
  className,
}: SettingRowProps) {
  const labelClass = 'block text-sm font-medium text-th-hi';
  const auto = useId();
  const labelId = `${auto}-label`;
  const descId = `${auto}-desc`;
  const layout = stacked
    ? 'flex flex-col gap-2'
    : inline
      ? 'grid grid-cols-[1fr_auto] items-center gap-4'
      : 'flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4';
  return (
    <div className={cn('min-h-[56px] px-4 py-3', layout, className)}>
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className={labelClass}>
            {label}
          </label>
        ) : (
          <span id={labelId} className={labelClass}>
            {label}
          </span>
        )}
        {description != null ? (
          <p id={descId} className="mt-0.5 text-sm text-th-hi3">
            {description}
          </p>
        ) : null}
      </div>
      <div
        {...(htmlFor ? {} : { role: 'group', 'aria-labelledby': labelId, 'aria-describedby': description != null ? descId : undefined })}
        className={cn('flex min-w-0 items-center gap-2', stacked ? 'w-full' : inline ? 'justify-end' : 'w-full sm:w-auto sm:justify-end')}
      >
        {children}
        <span role="status" aria-live="polite" className={cn('shrink-0 text-sm empty:hidden', STATUS_TONE[statusTone])}>
          {status}
        </span>
      </div>
    </div>
  );
}

// --- useSaveStatus ------------------------------------------------------------------

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVED_MS = 1500;
const ERROR_MS = 3000;

/** Tracks one save: run(promise) → 'saving' → 'saved' for 1500ms (or 'error' for 3000ms, with the message) → 'idle'.
 *  `label` is the text for SettingRow.status: "Saving…", "Saved", the error message, or null. Rethrows nothing. */
export function useSaveStatus(): {
  status: SaveStatus;
  error: string | null;
  label: string | null;
  tone: 'muted' | 'ok' | 'error';
  run: <T>(p: Promise<T>) => Promise<T | undefined>;
} {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const token = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const run = useCallback(async <T,>(p: Promise<T>): Promise<T | undefined> => {
    const mine = ++token.current;
    clearTimeout(timer.current);
    setError(null);
    setStatus('saving');
    const settle = (next: SaveStatus, ms: number) => {
      if (!mounted.current || token.current !== mine) return;
      setStatus(next);
      timer.current = setTimeout(() => {
        if (!mounted.current || token.current !== mine) return;
        setStatus('idle');
        setError(null);
      }, ms);
    };
    try {
      const out = await p;
      settle('saved', SAVED_MS);
      return out;
    } catch (e) {
      if (mounted.current && token.current === mine) setError(e instanceof Error ? e.message : String(e));
      settle('error', ERROR_MS);
      return undefined;
    }
  }, []);

  const label = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? (error ?? 'Could not save') : null;
  const tone = status === 'saved' ? 'ok' : status === 'error' ? 'error' : 'muted';
  return { status, error, label, tone, run };
}

// --- NumberField --------------------------------------------------------------------

export interface NumberFieldProps extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'defaultValue'> {
  value: number | null;
  /** Called on blur and on Enter with the parsed, clamped value, only when it differs from `value`. May return a promise: the field shows a spinner state and, on rejection, restores the old value and sets aria-invalid with the error message under it. */
  onCommit: (next: number | null) => void | Promise<void>;
  min?: number;
  max?: number;
  step?: number;
  /** Allow an empty field (commits null). Default false: an empty field restores the value. */
  nullable?: boolean;
  /** Unit text after the input ("%", "days"). */
  suffix?: ReactNode;
  /** Decimal places kept when committing. Default: as typed. */
  precision?: number;
}

const fmt = (v: number | null) => (v == null ? '' : String(v));
const decimals = (n: number) => String(n).split('.')[1]?.length ?? 0;

/** A numeric setting that saves when you leave the field or press Enter. */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { value, onCommit, min, max, step = 1, nullable = false, suffix, precision, className, onBlur, onKeyDown, id, invalid, 'aria-describedby': describedBy, ...rest },
  ref,
) {
  const auto = useId();
  const errId = `${id ?? auto}-error`;
  const [draft, setDraftState] = useState(fmt(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const draftRef = useRef(draft);
  const lastSent = useRef<{ v: number | null } | null>(null);
  const mounted = useRef(true);
  const skipCommit = useRef(false);

  const setDraft = (next: string) => {
    draftRef.current = next;
    setDraftState(next);
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    lastSent.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is synced from a prop/DOM measurement inside the effect (React 19 rule flagged at adoption)
    setDraft(fmt(value));
  }, [value]);

  const clamp = (n: number) => {
    let out = n;
    if (min != null) out = Math.max(min, out);
    if (max != null) out = Math.min(max, out);
    return out;
  };

  const fail = (e: unknown) => {
    lastSent.current = null;
    setDraft(fmt(value));
    setError(e instanceof Error ? e.message : String(e));
  };

  const commit = () => {
    const text = draftRef.current.trim();
    let next: number | null;
    if (text === '') {
      if (!nullable) {
        setDraft(fmt(value));
        return;
      }
      next = null;
    } else {
      const n = Number(text.replace(/,/g, ''));
      if (Number.isNaN(n)) {
        setDraft(fmt(value));
        setError('Enter a number');
        return;
      }
      let c = clamp(n);
      if (precision != null) c = Number(c.toFixed(precision));
      next = c;
    }
    setDraft(fmt(next));
    if (next === value) return;
    if (lastSent.current && lastSent.current.v === next) return;
    setError(null);
    lastSent.current = { v: next };
    let result: void | Promise<void>;
    try {
      result = onCommit(next);
    } catch (e) {
      fail(e);
      return;
    }
    if (result && typeof result.then === 'function') {
      setPending(true);
      result.then(
        () => {
          if (mounted.current) setPending(false);
        },
        (e: unknown) => {
          if (!mounted.current) return;
          setPending(false);
          fail(e);
        },
      );
    }
  };

  const nudge = (dir: 1 | -1) => {
    const base = Number(draftRef.current.replace(/,/g, ''));
    const from = Number.isNaN(base) || draftRef.current.trim() === '' ? (value ?? min ?? 0) : base;
    const n = Number(clamp(from + dir * step).toFixed(Math.max(precision ?? 0, decimals(step), decimals(from))));
    setDraft(String(n));
    lastSent.current = null;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setDraft(fmt(value));
      setError(null);
      skipCommit.current = true;
      e.currentTarget.blur();
      skipCommit.current = false;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      nudge(e.key === 'ArrowUp' ? 1 : -1);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          {...rest}
          ref={ref}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft}
          invalid={invalid || error != null}
          aria-describedby={cn(describedBy, error != null && errId) || undefined}
          aria-busy={pending || undefined}
          className={cn('w-28', className)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setDraft(e.target.value);
            lastSent.current = null;
            if (error != null) setError(null);
          }}
          onBlur={(e: FocusEvent<HTMLInputElement>) => {
            onBlur?.(e);
            if (skipCommit.current) return;
            commit();
          }}
          onKeyDown={handleKeyDown}
        />
        {suffix != null ? <span className="text-sm text-th-hi3">{suffix}</span> : null}
        {pending ? <Spinner size="sm" label="Saving" className="text-th-hi3" /> : null}
      </div>
      {error != null ? (
        <span id={errId} role="alert" className="text-sm text-th-loss">
          {error}
        </span>
      ) : null}
    </div>
  );
});
