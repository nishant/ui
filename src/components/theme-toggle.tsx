import { useEffect, useState } from 'react';
import { cn } from '../cn';
import {
  PRESETS,
  getThemeChoice,
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

/** The current theme choice and what it renders as, kept in sync across tabs and
 *  subdomains. */
export function useTheme(): ThemeState {
  const [state, setState] = useState(() => {
    const choice = typeof document === 'undefined' ? 'system' : getThemeChoice();
    return { choice, theme: typeof document === 'undefined' ? ('dark' as ThemeName) : resolveTheme(choice) };
  });
  useEffect(() => onThemeChange((choice, theme) => setState({ choice, theme })), []);
  return { ...state, scheme: schemeOf(state.theme), setChoice: setThemeChoice };
}

const MODES: { id: ThemeChoice; label: string; Icon: typeof SunIcon }[] = [
  { id: 'system', label: 'System', Icon: MonitorIcon },
  { id: 'light', label: 'Light', Icon: SunIcon },
  { id: 'dark', label: 'Dark', Icon: MoonIcon },
];

const nameOf = (choice: ThemeChoice) =>
  MODES.find((m) => m.id === choice)?.label ?? PRESETS.find((p) => p.id === choice)?.label ?? String(choice);

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
  className?: string;
}

/** System / Light / Dark as a Segmented radio group, optionally with a preset picker,
 *  or one cycling icon button when compact. */
export function ThemeToggle({ presets = false, labels = false, block = false, size = 'sm', compact = false, className }: ThemeToggleProps) {
  const { choice, theme, scheme, setChoice } = useTheme();
  const extra = PRESETS.filter((p) => p.id !== 'dark' && p.id !== 'light');
  const isPreset = extra.some((p) => p.id === choice);

  if (compact) {
    const i = TOGGLE_ORDER.indexOf(choice);
    const next = TOGGLE_ORDER[(i + 1) % TOGGLE_ORDER.length];
    const mode = MODES.find((m) => m.id === choice);
    const Icon = mode ? mode.Icon : scheme === 'light' ? SunIcon : MoonIcon;
    const text = `Theme: ${nameOf(mode ? choice : theme)}. Switch to ${nameOf(next)}`;
    return (
      <IconButton label={text} size={size === 'md' ? 'md' : 'sm'} data-choice={choice} onClick={() => setChoice(next)} className={className}>
        <Icon size={size === 'md' ? 16 : 14} />
      </IconButton>
    );
  }

  const options = MODES.map(({ id, label, Icon }) => ({
    value: id,
    label: labels ? (
      <>
        <Icon size={14} />
        {label}
      </>
    ) : (
      <Icon size={14} />
    ),
    ariaLabel: labels ? undefined : label,
    title: labels ? undefined : label,
  }));

  return (
    <div className={cn('items-center gap-2', block ? 'flex w-full' : 'inline-flex', className)}>
      <Segmented
        label="Theme"
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
          aria-label="Theme preset"
          value={isPreset ? choice : ''}
          onChange={(e) => e.target.value && setChoice(e.target.value as ThemeChoice)}
          className={cn(
            'rounded-lg border border-th-line bg-th-elevated px-2 text-xs text-th-hi2 pointer-coarse:min-h-11',
            size === 'md' ? 'h-9 text-sm' : 'h-8',
          )}
        >
          <option value="">Preset…</option>
          {extra.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
