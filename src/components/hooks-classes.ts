// Breakpoint constants shared by hooks.tsx and anything that must stay free of React.

export type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl';

/** Tailwind's breakpoints, in px. Phone = below sm; narrow = below md (cover screen and small tablets). */
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;
export const PHONE_QUERY = '(max-width: 639.98px)';
export const NARROW_QUERY = '(max-width: 767.98px)';
