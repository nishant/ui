import { useState, type ReactNode } from 'react';
import { Button, CopyButton, cn } from '../../src';

// A deliberately small highlighter: comments, strings, keywords and tags are enough to
// make snippets scannable. Colors are roles that clear 4.5:1 on --nish-bg.
const TOKEN =
  /(\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|\/\/[^\n]*|(?<=^|\s)# [^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(import|from|export|const|let|function|return|await|async|new|default|if|else|type|interface|true|false|null|npm|pnpm|npx|node)\b|(<\/?[A-Za-z][\w.-]*|\/?>)/gm;

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(TOKEN)) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = m[1] ? 'text-th-hi3 italic' : m[2] ? 'text-th-ok' : m[3] ? 'text-th-accent' : 'text-th-info';
    out.push(
      <span key={i++} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

/** pre: text-[13px] with leading-relaxed (1.625), so one line is 21.125px. */
const LINE_PX = 13 * 1.625;

export function CodeBlock({
  code,
  title,
  className,
  collapseAt,
}: {
  code: string;
  /** File name or a short caption above the code. */
  title?: string;
  className?: string;
  /** Show only this many lines until "Expand" is pressed (Copy always copies it all). */
  collapseAt?: number;
}) {
  const text = code.replace(/^\n+|\s+$/g, '');
  const total = text.split('\n').length;
  const collapsible = collapseAt != null && total > collapseAt + 1;
  const [open, setOpen] = useState(false);
  const clipped = collapsible && !open;
  return (
    <div className={cn('min-w-0 overflow-hidden rounded-xl border border-th-line bg-th-bg', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-th-line bg-th-surface py-1.5 pl-3 pr-1.5">
        <span className="min-w-0 truncate font-mono text-xs text-th-hi3">{title ?? ''}</span>
        <CopyButton text={text} />
      </div>
      <div className="relative">
        <pre
          className={cn('overflow-x-auto p-4 text-[13px] leading-relaxed', clipped && 'overflow-y-hidden')}
          style={clipped ? { maxHeight: Math.round(collapseAt * LINE_PX + 32) } : undefined}
        >
          <code className="font-mono text-th-hi">{highlight(text)}</code>
        </pre>
        {clipped ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-th-bg to-transparent" /> : null}
      </div>
      {collapsible ? (
        <div className="border-t border-th-line bg-th-surface px-2 py-1">
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? 'Collapse' : `Expand (${total - collapseAt} more lines)`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
