export type Scheme = 'dark' | 'light';
export interface ThemeDef {
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}
/** Roles every theme must define (soft tints are derived, not listed). */
export declare const COLOR_ROLES: string[];
/** The 8 hue roles: colors with no meaning (tags, tiles, stores). */
export declare const HUE_ROLES: string[];
/** Roles with a 14% tint, --nish-<role>-soft: the status roles, then the hues. */
export declare const SOFT_ROLES: string[];
export declare const THEMES: Record<'dark' | 'light' | 'slate' | 'terminal' | 'mocha' | 'ocean' | 'contrast', ThemeDef>;
export declare const DEFAULT_THEME: 'dark';
/** Everything that is not a color (type, space, radii, motion, z-index, layout). */
export declare const SCALE: Record<string, string>;
export declare const SHADOWS: Record<'card' | 'pop' | 'modal', string>;
