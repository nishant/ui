// src/components/avatar-classes.ts
var HUES = [
  "bg-th-emerald-soft text-th-hi",
  "bg-th-indigo-soft text-th-hi",
  "bg-th-amber-soft text-th-hi",
  "bg-th-lime-soft text-th-hi",
  "bg-th-rose-soft text-th-hi",
  "bg-th-sky-soft text-th-hi",
  "bg-th-violet-soft text-th-hi",
  "bg-th-teal-soft text-th-hi"
];
function avatarHueIndex(name) {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = (h << 5) + h + name.charCodeAt(i) >>> 0;
  return h % HUES.length;
}
function avatarInitials(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? "" : "";
  return (first + last).toUpperCase();
}
export {
  HUES,
  avatarHueIndex,
  avatarInitials
};
