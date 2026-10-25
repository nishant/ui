export type Scheme = 'dark' | 'light';
export interface ThemeDef {
  label: string;
  scheme: Scheme;
  colors: Record<string, string>;
}
export declare const COLOR_ROLES: string[];
export declare const SOFT_ROLES: string[];
export declare const THEMES: Record<'dark' | 'light' | 'slate' | 'terminal' | 'mocha' | 'ocean' | 'contrast', ThemeDef>;
export declare const DEFAULT_THEME: 'dark';
export declare const SCALE: Record<string, string>;
export declare const SHADOWS: Record<'card' | 'pop' | 'modal', string>;
