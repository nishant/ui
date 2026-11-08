'use client';
import { useEffect, useSyncExternalStore, type HTMLAttributes, type Ref } from 'react';
import { cn } from '../cn';
import { DEFAULT_THEME } from '../tokens.mjs';
import {
  PRESETS,
  applyTheme,
  getThemeChoice,
  isThemeName,
  onThemeChange,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  TOGGLE_ORDER,
  type ThemeChoice,
  type ThemeName,
} from '../theme';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';
import { IconButton } from './primitives';
import { useStrings } from './provider';
import { THEME_STRINGS } from './strings';
import { Segmented } from './segmented';

export interface ThemeState {
  /** What was picked: 'system' or a theme name. */
  choice: ThemeChoice;
  /** What is rendering now. */
  theme: ThemeName;
  /** dark or light: what the rendering theme is based on. */
  scheme: 'dark' | 'light';
  /** Save a choice (cookie and localStorage) and apply it. */
  setChoice: (choice: ThemeChoice) => void;
}

interface ThemeSnapshot {
  choice: ThemeChoice;
  theme: ThemeName;
}

/** What the server renders, and the first client render while hydrating. */
const SERVER_SNAPSHOT: ThemeSnapshot = { choice: 'system', theme: DEFAULT_THEME };

let lastSnapshot: ThemeSnapshot = SERVER_SNAPSHOT;

/** The applied theme, read from <html> (theme-init.js and applyTheme() write it) and, when the
 *  attributes are missing or unknown, from the saved choice. Returns the same object while
 *  nothing changed, as useSyncExternalStore requires. */
function readSnapshot(): ThemeSnapshot {
  const root = document.documentElement;
  const attrChoice = root.getAttribute('data-theme-choice');
  const attrTheme = root.getAttribute('data-theme');
  let choice: ThemeChoice;
  let theme: ThemeName;
  if ((attrChoice === 'system' || isThemeName(attrChoice)) && isThemeName(attrTheme)) {
    choice = attrChoice as ThemeChoice;
    theme = attrTheme;
  } else {
    choice = getThemeChoice();
    theme = resolveTheme(choice);
  }
  if (lastSnapshot.choice !== choice || lastSnapshot.theme !== theme) lastSnapshot = { choice, theme };
  return lastSnapshot;
}

const subscribeTheme = (notify: () => void): (() => void) => onThemeChange(notify);
const getServerSnapshot = (): ThemeSnapshot => SERVER_SNAPSHOT;

/** The current theme choice and what it renders as, kept in sync across tabs and
 *  subdomains. Server render and hydration see { choice: 'system', theme: 'dark' }; the real
 *  value follows right after. If a hydration pass wiped <html data-theme>, it is applied
 *  again on mount. */
export function useTheme(): ThemeState {
  const { choice, theme } = useSyncExternalStore(subscribeTheme, readSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!document.documentElement.hasAttribute('data-theme')) applyTheme();
  }, []);
  return { choice, theme, scheme: schemeOf(theme), setChoice: setThemeChoice };
}

const MODES: { id: ThemeChoice; Icon: typeof SunIcon }[] = [
  { id: 'system', Icon: MonitorIcon },
  { id: 'light', Icon: SunIcon },
  { id: 'dark', Icon: MoonIcon },
];

export interface ThemeToggleProps {
  /** Also offer the extra presets (slate, terminal, …) in a select. */
  presets?: boolean;
  /** Show "System", "Light" and "Dark" text beside the icons. */
  labels?: boolean;
  /** Fill the container's width, with equal-width segments. */
  block?: boolean;
  /** sm: 28px segments (default). md: 32px. Both grow to 44px on touch screens. */
  size?: 'sm' | 'md';
  /** One icon button that cycles System, Light, Dark and shows the current choice; for
   *  collapsed sidebars and tight headers. Ignores labels, block and presets. */
  compact?: boolean;
  /** segmented: the System / Light / Dark radio group (default). pill: one cycling
   *  button in a 44px pill with a line-strong border, to sit next to the hub pill in a
   *  top bar (the React twin of .nish-theme-btn--pill). With labels, the pill also shows
   *  the current choice as a word (.nish-theme-btn--labelled). Ignores block and presets. */
  variant?: 'segmented' | 'pill';
  /** What the segmented toggle shows below 640px. compact (default): the one cycling
   *  button, so a phone header keeps to one row. segmented: the radio group at every
   *  width. A block toggle is always segmented. */
  phone?: 'compact' | 'segmented';
  /** sm (default): the segmented toggle collapses to the cycling button below 640px (see
   *  `phone`). never: it keeps the segmented control and the presets select at every
   *  width, for a drawer or settings page that has the room. */
  collapse?: 'sm' | 'never';
  className?: string;
  /** The words after a preset saved on another site in the button label: "Theme: Mocha (set on
   *  another site). Switch to System". Default "set on another site". */
  elsewhereLabel?: string;
  /** The root element: the segmented group, or the button of the compact and pill variants. */
  ref?: Ref<HTMLElement>;
}

/** System / Light / Dark as a Segmented radio group, optionally with a preset picker,
 *  or one cycling icon button when compact. Words come from `useStrings(THEME_STRINGS)`. Other props
 *  (id, data-*, aria-*, style) go on the root element. */
export function ThemeToggle({
  ref,
  presets = false,
  labels = false,
  block = false,
  size = 'sm',
  compact = false,
  variant = 'segmented',
  phone = 'compact',
  collapse = 'sm',
  className,
  elsewhereLabel = 'set on another site',
  ...rest
}: ThemeToggleProps & Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange'>) {
  const strings = useStrings(THEME_STRINGS);
  const { choice, theme, scheme, setChoice } = useTheme();
  const extra = PRESETS.filter((p) => p.id !== 'dark' && p.id !== 'light');
  const isPreset = extra.some((p) => p.id === choice);
  const modeLabel = (id: ThemeChoice): string =>
    id === 'system' ? strings.themeSystem : id === 'light' ? strings.themeLight : id === 'dark' ? strings.themeDark : '';
  const nameOf = (c: ThemeChoice): string => modeLabel(c) || PRESETS.find((p) => p.id === c)?.label || String(c);

  if (compact || variant === 'pill') {
    const i = TOGGLE_ORDER.indexOf(choice);
    const next = TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length]!;
    const mode = MODES.find((m) => m.id === choice);
    const Icon = mode ? mode.Icon : scheme === 'light' ? SunIcon : MoonIcon;
    const elsewhere = mode ? '' : ` (${elsewhereLabel})`;
    const text = strings.themeToggleLabel(`${nameOf(mode ? choice : theme)}${elsewhere}`, nameOf(next));
    const buttonRest = rest as HTMLAttributes<HTMLButtonElement>;
    if (variant === 'pill') {
      return (
        <button
          {...buttonRest}
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          aria-label={text}
          title={text}
          data-choice={choice}
          onClick={() => setChoice(next)}
          className={cn(
            'inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-th-line-strong transition-colors duration-150 hover:bg-th-elevated hover:text-th-hi',
            labels ? 'gap-2 ps-3 pe-3.5 text-sm font-medium text-th-hi' : 'w-11 text-th-hi3',
            className,
          )}
        >
          <Icon size={16} />
          {labels ? <span aria-hidden="true">{nameOf(mode ? choice : theme)}</span> : null}
        </button>
      );
    }
    return (
      <IconButton
        {...buttonRest}
        ref={ref as Ref<HTMLButtonElement>}
        label={text}
        size={size === 'md' ? 'md' : 'sm'}
        data-choice={choice}
        onClick={() => setChoice(next)}
        className={className}
      >
        <Icon size={size === 'md' ? 16 : 14} />
      </IconButton>
    );
  }

  const options = MODES.map(({ id, Icon }) => ({
    value: id,
    label: labels ? (
      <>
        <Icon size={14} />
        {modeLabel(id)}
      </>
    ) : (
      <Icon size={14} />
    ),
    ariaLabel: labels ? undefined : modeLabel(id),
    title: labels ? undefined : modeLabel(id),
  }));

  const twin = collapse === 'sm' && phone === 'compact' && !block;
  const group = (
    <div
      {...(rest as HTMLAttributes<HTMLDivElement>)}
      ref={ref as Ref<HTMLDivElement>}
      className={cn('items-center gap-2', block ? 'flex w-full' : 'inline-flex', className, twin && 'max-sm:hidden')}
    >
      <Segmented
        label={strings.theme}
        options={options}
        value={choice}
        onChange={setChoice}
        size={size}
        block={block}
        // Icon-only segments stay square, as before.
        className={cn(!labels && (size === 'md' ? '[&>button]:w-8 [&>button]:px-0' : '[&>button]:w-7 [&>button]:px-0'), block && 'min-w-0 flex-1')}
      />
      {presets ? (
        <select
          aria-label={strings.themePreset}
          value={isPreset ? choice : ''}
          onChange={(e) => e.target.value && setChoice(e.target.value as ThemeChoice)}
          className={cn(
            'rounded-lg border border-th-line-control bg-th-elevated px-2 text-xs text-th-hi2 pointer-coarse:min-h-11',
            size === 'md' ? 'h-9 text-sm' : 'h-8',
          )}
        >
          <option value="">{strings.themePresetPlaceholder}</option>
          {extra.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
  if (!twin) return group;
  // Phones get the cycling button; three 44px touch segments crowd a header row.
  return (
    <>
      <ThemeToggle compact size={size} elsewhereLabel={elsewhereLabel} className={cn(className, 'sm:hidden')} />
      {group}
    </>
  );
}
