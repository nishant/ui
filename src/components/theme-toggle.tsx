import { useEffect, useState } from 'react';
import { cn } from '../cn';
import {
  PRESETS,
  getThemeChoice,
  onThemeChange,
  resolveTheme,
  schemeOf,
  setThemeChoice,
  type ThemeChoice,
  type ThemeName,
} from '../theme';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

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

export interface ThemeToggleProps {
  /** Also offer the extra presets (slate, terminal, …) in a select. */
  presets?: boolean;
  className?: string;
}

/** System / Light / Dark segmented control, optionally with a preset picker. */
export function ThemeToggle({ presets = false, className }: ThemeToggleProps) {
  const { choice, setChoice } = useTheme();
  const extra = PRESETS.filter((p) => p.id !== 'dark' && p.id !== 'light');
  const isPreset = extra.some((p) => p.id === choice);

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-lg border border-th-line bg-th-elevated p-0.5">
        {MODES.map(({ id, label, Icon }) => {
          const on = choice === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={label}
              title={label}
              onClick={() => setChoice(id)}
              className={cn(
                'inline-flex size-7 items-center justify-center rounded-md transition-colors pointer-coarse:size-10',
                on ? 'bg-th-surface text-th-hi shadow-card' : 'text-th-hi3 hover:text-th-hi',
              )}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
      {presets ? (
        <select
          aria-label="Theme preset"
          value={isPreset ? choice : ''}
          onChange={(e) => e.target.value && setChoice(e.target.value as ThemeChoice)}
          className="h-8 rounded-lg border border-th-line bg-th-elevated px-2 text-xs text-th-hi2 pointer-coarse:min-h-11"
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
