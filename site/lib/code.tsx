import { useState, type ReactNode } from 'react';
import { cn } from '../../src';
import { CheckIcon, CopyIcon } from './icons';

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

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md border border-th-line bg-th-surface px-2 text-xs font-medium text-th-hi2 transition-colors hover:bg-th-elevated hover:text-th-hi pointer-coarse:min-h-11 pointer-coarse:px-3',
        className,
      )}
      aria-label={done ? 'Copied' : 'Copy code'}
    >
      {done ? <CheckIcon size={13} className="text-th-ok" /> : <CopyIcon size={13} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CodeBlock({
  code,
  title,
  className,
}: {
  code: string;
  /** File name or a short caption above the code. */
  title?: string;
  className?: string;
}) {
  const text = code.replace(/^\n+|\s+$/g, '');
  return (
    <div className={cn('min-w-0 overflow-hidden rounded-xl border border-th-line bg-th-bg', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-th-line bg-th-surface px-3 py-1.5">
        <span className="min-w-0 truncate font-mono text-xs text-th-hi3">{title ?? ''}</span>
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-th-hi">{highlight(text)}</code>
      </pre>
    </div>
  );
}
