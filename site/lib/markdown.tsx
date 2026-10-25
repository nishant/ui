import type { ReactNode } from 'react';

// Enough Markdown for CHANGELOG.md: headings, paragraphs, lists (one level of nesting),
// inline code, bold and links. The changelog is ours, so no HTML passthrough.

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let i = key;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<code key={i++}>{m[1].slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={i++} className="font-semibold text-th-hi">{m[2]}</strong>);
    else out.push(<a key={i++} href={m[4]}>{m[3]}</a>);
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
  let list: { text: string; sub: string[] }[] | null = null;
  let k = 0;

  const flushPara = () => {
    if (para.length) target.push(<p key={k++}>{inline(para.join(' '))}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    target.push(
      <ul key={k++} className="list-disc space-y-1.5 pl-5 marker:text-th-ghost">
        {list.map((item, i) => (
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
      </ul>,
    );
    list = null;
  };

  for (const line of lines) {
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^(\s*)[-*]\s+(.*)$/);
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
      list ??= [];
      if (li[1].length >= 2 && list.length) list[list.length - 1].sub.push(li[2]);
      else list.push({ text: li[2], sub: [] });
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else if (list && /^\s{2,}/.test(line)) {
      const last = list[list.length - 1];
      if (last.sub.length) last.sub[last.sub.length - 1] += ' ' + line.trim();
      else last.text += ' ' + line.trim();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return { intro, sections };
}
