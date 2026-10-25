import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge has to know the th-* colors and the custom shadows are colors and
// shadows, or it treats `text-th-hi text-sm` as a conflict and drops one. The same goes
// for the extra type sizes: without `text: ['2xs', '3xs']` it may read text-2xs as a
// color and drop text-th-hi next to it. scripts/build.mjs asserts both cases.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['2xs', '3xs'],
    },
    classGroups: {
      shadow: [{ shadow: ['card', 'pop', 'modal'] }],
    },
  },
});

/** Conditional Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
