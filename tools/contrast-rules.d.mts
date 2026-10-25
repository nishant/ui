export interface ContrastResult {
  fg: string;
  bg: string;
  label: string;
  ratio: number;
  min: number;
  pass: boolean;
  fgHex: string;
  bgHex: string;
}
export declare const TEXT: number;
export declare const UI: number;
export declare const HUES: string[];
export declare const RULES: [string, string[], number][];
export declare const ON_FILL: [string, string][];
export declare const SOFT_TEXT: string[];
export declare function luminance(hex: string): number;
export declare function ratio(a: string, b: string): number;
export declare function mix(fg: string, bg: string, t: number): string;
export declare function checkTheme(colors: Record<string, string>): ContrastResult[];
