import changelog from '../../CHANGELOG.md?raw';
import { Badge, Card } from '../../src';
import { renderMarkdown } from '../lib/markdown';
import { PageHeader } from '../lib/ui';

export function ChangelogPage() {
  const { sections } = renderMarkdown(changelog);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Start"
        title="Changelog"
        lead={
          <>
            Every release, newest first, rendered from <code className="inline">CHANGELOG.md</code>. Versions follow semver; a change that makes an app edit
            its code to keep working is a major (or, before 1.0, a minor).
          </>
        }
      />
      {sections.map((s) => {
        const m = s.heading.match(/^\[?([^\]\s]+)\]?(?:\s+[-–]\s+(.*))?$/);
        const version = m?.[1] ?? s.heading;
        const date = m?.[2];
        const unreleased = /unreleased/i.test(version);
        return (
          <Card key={s.heading} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-th-hi">{unreleased ? 'Unreleased' : `v${version}`}</h2>
              {unreleased ? <Badge tone="warn">next release</Badge> : null}
              {date ? <span className="text-sm text-th-hi3">{date}</span> : null}
            </div>
            <div className="doc-prose space-y-3 text-[15px] leading-relaxed text-th-hi2">{s.body}</div>
          </Card>
        );
      })}
    </div>
  );
}
