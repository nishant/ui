import guide from '../../docs/MIGRATING-3.0.md?raw';
import { nishName } from '../lib/code';
import { inline, renderMarkdown } from '../lib/markdown';
import { PageHeader } from '../lib/ui';

export function MigratingPage() {
  const { intro, sections } = renderMarkdown(nishName(guide));
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Start"
        title="Moving to 3.0"
        lead="What to change in an app that uses nish-ui 2.x. TypeScript finds every line."
      />
      <div className="doc-prose space-y-3 text-[15px] leading-relaxed text-th-hi2">{intro}</div>
      {sections.map((s) => (
        <section key={s.heading} className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-th-hi [&_code]:font-mono [&_code]:text-[0.9em]">{inline(s.heading)}</h2>
          <div className="doc-prose space-y-3 text-[15px] leading-relaxed text-th-hi2">{s.body}</div>
        </section>
      ))}
    </div>
  );
}
