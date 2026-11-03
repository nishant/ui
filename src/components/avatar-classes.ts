// Pure helpers of Avatar. No directive and no React, so a server component can call them.

// Full literal class names, so Tailwind's scanner finds every one.
export const HUES = [
  'bg-th-emerald-soft text-th-hi',
  'bg-th-indigo-soft text-th-hi',
  'bg-th-amber-soft text-th-hi',
  'bg-th-lime-soft text-th-hi',
  'bg-th-rose-soft text-th-hi',
  'bg-th-sky-soft text-th-hi',
  'bg-th-violet-soft text-th-hi',
  'bg-th-teal-soft text-th-hi',
] as const;

/** Index 0 to 7 of the hue a name gets: the same name always maps to the same hue. */
export function avatarHueIndex(name: string): number {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) >>> 0;
  return h % HUES.length;
}

/** Up to two initials: first letters of the first and last words. */
export function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const first = Array.from(words[0]!)[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1]!)[0] ?? '') : '';
  return (first + last).toUpperCase();
}
