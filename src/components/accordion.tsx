'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '../cn';
import { useStrings } from './provider';
import { ACCORDION_STRINGS } from './strings';

export type AccordionHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface AccordionBase extends Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'> {
  /** The AccordionItems. */
  children: ReactNode;
  /** The heading level of every item's header (default 3), so the page outline stays right. */
  headingLevel?: AccordionHeadingLevel;
  /** Disables every item. */
  disabled?: boolean;
  /** Names the group for screen readers. Default: `accordion` from NishProvider strings. */
  label?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface AccordionSingleProps extends AccordionBase {
  /** One item open at a time. */
  type?: 'single';
  /** The open item's value ('' for none). Pass it to control the component. */
  value?: string;
  /** The open item when uncontrolled ('' or unset for none). */
  defaultValue?: string;
  /** Called with the open item's value, or '' when the open item is closed. */
  onValueChange?: (value: string) => void;
  /** Lets the open item close (default false: one item stays open once opened). */
  collapsible?: boolean;
}

export interface AccordionMultipleProps extends AccordionBase {
  /** Any number of items open at once. */
  type: 'multiple';
  /** The open items' values. Pass it to control the component. */
  value?: string[];
  /** The open items when uncontrolled. */
  defaultValue?: string[];
  /** Called with the open items' values. */
  onValueChange?: (value: string[]) => void;
  collapsible?: never;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

interface AccordionCtx {
  idBase: string;
  open: string[];
  toggle: (value: string) => void;
  headingLevel: AccordionHeadingLevel;
  disabled: boolean;
  /** type="single" without collapsible: the open item cannot be closed. */
  locked: boolean;
}
const Ctx = /* @__PURE__ */ createContext<AccordionCtx | null>(null);

function toArray(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v;
  return v ? [v] : [];
}

/** A stack of headers that each open and close a panel. Items in `type="single"` close each
 *  other; `type="multiple"` leaves them independent. The arrow keys move between the headers. */
export function Accordion(props: AccordionProps) {
  const {
    type = 'single',
    value: valueProp,
    defaultValue,
    onValueChange,
    collapsible = false,
    headingLevel = 3,
    disabled = false,
    label,
    children,
    className,
    ref,
    ...rest
  } = props as Omit<AccordionSingleProps, 'type'> & { type?: 'single' | 'multiple'; value?: string | string[]; defaultValue?: string | string[]; onValueChange?: (v: never) => void };
  const strings = useStrings(ACCORDION_STRINGS);
  const idBase = useId();
  const [state, setState] = useState<string[]>(() => toArray(defaultValue));
  const controlled = valueProp !== undefined;
  const open = controlled ? toArray(valueProp) : state;

  const toggle = useCallback(
    (v: string) => {
      let next: string[];
      if (type === 'multiple') next = open.includes(v) ? open.filter((x) => x !== v) : [...open, v];
      else if (open.includes(v)) next = collapsible ? [] : open;
      else next = [v];
      if (next === open) return;
      if (!controlled) setState(next);
      (onValueChange as ((v: string | string[]) => void) | undefined)?.(type === 'multiple' ? next : (next[0] ?? ''));
    },
    [type, open, collapsible, controlled, onValueChange],
  );

  return (
    <Ctx.Provider value={{ idBase, open, toggle, headingLevel, disabled, locked: type !== 'multiple' && !collapsible }}>
      <div
        role="group"
        aria-label={label ?? strings.accordion}
        data-accordion=""
        data-disabled={disabled ? '' : undefined}
        {...rest}
        ref={ref}
        className={cn('w-full min-w-0 divide-y divide-th-line overflow-hidden rounded-xl border border-th-line', className)}
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface AccordionItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Identifies the item in the Accordion's value. */
  value: string;
  /** The header's content. */
  title: ReactNode;
  /** The panel's content. */
  children: ReactNode;
  /** Shown but not toggleable; the arrow keys skip it. */
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const TRIGGER = '[data-accordion-trigger]:not(:disabled)';

/** One header and its panel inside an Accordion. */
export function AccordionItem({ value, title, children, disabled: disabledProp = false, className, ref, ...rest }: AccordionItemProps) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AccordionItem must be used inside an Accordion');
  const disabled = disabledProp || ctx.disabled;
  const isOpen = ctx.open.includes(value);
  const itemId = useId().replace(/:/g, '');
  const slug = `${ctx.idBase}-${itemId}`;
  const triggerId = `${slug}-trigger`;
  const panelId = `${slug}-panel`;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const root = e.currentTarget.closest('[data-accordion]');
    if (!root) return;
    // Only this accordion's own headers: not those of an Accordion nested in a panel.
    const all = Array.from(root.querySelectorAll<HTMLButtonElement>(TRIGGER)).filter((b) => b.closest('[data-accordion]') === root);
    if (all.length === 0) return;
    const at = all.indexOf(e.currentTarget);
    let to: number;
    if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = all.length - 1;
    else if (e.key === 'ArrowDown') to = (at + 1) % all.length;
    else to = (at - 1 + all.length) % all.length;
    e.preventDefault();
    all[to].focus();
  }

  const state = isOpen ? 'open' : 'closed';
  return (
    <div
      data-state={state}
      data-disabled={disabled ? '' : undefined}
      {...rest}
      ref={ref}
      className={cn('bg-th-surface', className)}
    >
      {createElement(
        `h${ctx.headingLevel}`,
        { className: 'm-0 text-sm font-semibold' },
        <button
          type="button"
          id={triggerId}
          data-accordion-trigger=""
          data-state={state}
          data-disabled={disabled ? '' : undefined}
          aria-expanded={isOpen}
          aria-disabled={(ctx.locked && isOpen) || undefined}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => ctx.toggle(value)}
          onKeyDown={onKeyDown}
          className={cn(
            'flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 text-start text-th-hi transition-colors duration-150',
            'hover:bg-th-elevated/60 disabled:cursor-not-allowed disabled:text-th-ghost disabled:hover:bg-transparent pointer-coarse:min-h-11',
          )}
        >
          <span className="min-w-0">{title}</span>
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={cn('shrink-0 text-th-hi3 transition-transform duration-200 motion-reduce:transition-none', isOpen && 'rotate-180')}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>,
      )}
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        data-state={state}
        inert={!isOpen}
        className={cn(
          'grid transition-[grid-template-rows,visibility] duration-200 motion-reduce:transition-none',
          isOpen ? 'visible grid-rows-[1fr]' : 'invisible grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4 text-sm text-th-hi2">{children}</div>
        </div>
      </div>
    </div>
  );
}
