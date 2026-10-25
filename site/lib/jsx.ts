/** Builds a JSX usage snippet from control values, leaving out defaults. */
export type Args = Record<string, string | number | boolean>;

export function jsx(name: string, props: Record<string, unknown>, children?: string, indent = ''): string {
  const attrs: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === false || v === null) continue;
    if (v === true) attrs.push(k);
    else if (typeof v === 'string' && v.startsWith('{')) attrs.push(`${k}=${v}`);
    else if (typeof v === 'string') attrs.push(`${k}="${v}"`);
    else attrs.push(`${k}={${JSON.stringify(v)}}`);
  }
  const open = attrs.length ? `<${name} ${attrs.join(' ')}` : `<${name}`;
  const oneLine = children == null ? `${open} />` : `${open}>${children}</${name}>`;
  if (oneLine.length <= 80 || !attrs.length) return indent + oneLine;
  const lines = [`${indent}<${name}`, ...attrs.map((a) => `${indent}  ${a}`)];
  if (children == null) return [...lines, `${indent}/>`].join('\n');
  return [...lines, `${indent}>`, `${indent}  ${children}`, `${indent}</${name}>`].join('\n');
}
