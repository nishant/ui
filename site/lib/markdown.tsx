import type { ReactNode } from 'react';
import { CodeBlock } from './code';

// Enough Markdown for CHANGELOG.md and the migration guides: headings, paragraphs, lists (one level of
// nesting), fenced code blocks, tables, inline code, bold and links. The docs are ours, so no HTML passthrough.

export function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let i = key;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      // <wbr /> after each "/" lets long paths wrap there only; it adds no characters to copied text.
      const parts = m[1].slice(1, -1).split('/');
      const kids: ReactNode[] = [];
      parts.forEach((part, n) => {
        kids.push(n < parts.length - 1 ? part + '/' : part);
        if (n < parts.length - 1) kids.push(<wbr key={n} />);
      });
      out.push(<code key={i++}>{kids}</code>);
    }
    else if (m[2]) out.push(<strong key={i++} className="font-semibold text-th-hi">{m[2]}</strong>);
    else if (/^(https?:|mailto:|#|\/)/i.test(m[4])) out.push(<a key={i++} href={m[4]}>{m[3]}</a>);
    else out.push(m[3]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export interface MdSection {
  heading: string;
  level: number;
  body: ReactNode[];
}

/** Splits at level-2 headings so the changelog can render each release as a card. */
export function renderMarkdown(src: string): { intro: ReactNode[]; sections: MdSection[] } {
  const lines = src.replace(/\r/g, '').split('\n');
  const intro: ReactNode[] = [];
  const sections: MdSection[] = [];
  let target = intro;
  let para: string[] = [];
  let list: { ordered: boolean; items: { text: string; sub: string[] }[] } | null = null;
  let table: string[] | null = null;
  let fence: { lang: string; text: string[] } | null = null;
  let k = 0;

  const flushPara = () => {
    if (para.length) target.push(<p key={k++}>{inline(para.join(' '))}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? 'ol' : 'ul';
    target.push(
      <Tag key={k++} className={(list.ordered ? 'list-decimal' : 'list-disc') + ' space-y-1.5 pl-5 marker:text-th-ghost'}>
        {list.items.map((item, i) => (
          <li key={i}>
            {inline(item.text)}
            {item.sub.length ? (
              <ul className="mt-1.5 list-[circle] space-y-1 pl-5">
                {item.sub.map((s, j) => (
                  <li key={j}>{inline(s)}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </Tag>,
    );
    list = null;
  };

  const flushTable = () => {
    if (!table) return;
    const rows = table.map((r) => r.trim().slice(1, r.trim().endsWith('|') ? -1 : undefined).split('|').map((c) => c.trim()));
    const isSep = rows.length > 1 && rows[1].every((c) => /^:?-+:?$/.test(c));
    const [head, ...rest] = rows;
    const body = isSep ? rest.slice(1) : rest;
    const cell = 'border-b border-th-line py-2 pe-3 align-top [&_code]:[overflow-wrap:normal]';
    target.push(
      <div key={k++} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {head.map((c, i) => (
                <th key={i} className={cell + ' font-semibold text-th-hi'}>
                  {inline(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={cell}>
                    {inline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    table = null;
  };

  for (const line of lines) {
    if (fence) {
      if (/^```\s*$/.test(line)) {
        target.push(<CodeBlock key={k++} code={fence.text.join('\n')} title={fence.lang || undefined} />);
        fence = null;
      } else fence.text.push(line);
      continue;
    }
    const open = line.match(/^```(\w*)\s*$/);
    if (open) {
      flushPara();
      flushList();
      flushTable();
      fence = { lang: open[1], text: [] };
      continue;
    }
    if (line.startsWith('|')) {
      flushPara();
      flushList();
      (table ??= []).push(line);
      continue;
    }
    flushTable();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^(\s*)(?:[-*]|(\d+)\.)\s+(.*)$/);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      if (level === 1) continue;
      if (level === 2) {
        sections.push({ heading: h[2], level, body: [] });
        target = sections[sections.length - 1].body;
      } else {
        target.push(
          <h3 key={k++} className="mt-5 text-xs font-semibold uppercase tracking-wider text-th-hi3 first:mt-0">
            {h[2]}
          </h3>,
        );
      }
    } else if (li) {
      flushPara();
      list ??= { ordered: li[2] !== undefined, items: [] };
      if (li[1].length >= 2 && list.items.length) list.items[list.items.length - 1].sub.push(li[3]);
      else list.items.push({ text: li[3], sub: [] });
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else if (list && /^\s{2,}/.test(line)) {
      const last = list.items[list.items.length - 1];
      if (last.sub.length) last.sub[last.sub.length - 1] += ' ' + line.trim();
      else last.text += ' ' + line.trim();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  if (fence) target.push(<CodeBlock key={k++} code={fence.text.join('\n')} title={fence.lang || undefined} />);
  flushPara();
  flushList();
  flushTable();
  return { intro, sections };
}
