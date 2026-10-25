import { Card, cn } from '../../src';
import type { ComponentDoc } from './types';

// --- .nish-prose ----------------------------------------------------------------------

/** Rendered Markdown, the way a markdown library hands it over. */
const Sample = ({ size, className }: { size?: 'xs' | 'sm' | 'base'; className?: string }) => (
  <div className={cn('nish-prose w-full', size === 'xs' && 'text-xs', size === 'base' && 'text-base', className)}>
    <h2>Release notes</h2>
    <p>
      The <strong>scanner</strong> now runs every 15 minutes. Read the <a href="#/components/prose">full changelog</a> or press <kbd>?</kbd> for
      shortcuts. Inline <code>code</code> keeps the mono face.
    </p>
    <ul>
      <li>Faster quotes on the watchlist</li>
      <li>
        Two new filters
        <ul>
          <li>IV rank</li>
          <li>Days to earnings</li>
        </ul>
      </li>
    </ul>
    <blockquote>Quoted text from a job description or a chat reply.</blockquote>
  </div>
);

export const prose: ComponentDoc & { source: string } = {
  id: 'prose',
  name: 'Prose',
  exports: [],
  source: 'src/css/base.css',
  summary:
    'One class for Markdown and rich text: headings, lists, links, code, quotes, tables and task lists on the role tokens. Put it on the element that holds the rendered HTML.',
  importLine: '<div class="nish-prose">{rendered markdown}</div>',
  controls: [{ key: 'size', label: 'Size', type: 'select', options: ['xs', 'sm', 'base'] }],
  initial: { size: 'sm' },
  render: (a) => (
    <div className="w-full max-w-xl">
      <Sample size={a.size as 'xs' | 'sm' | 'base'} />
    </div>
  ),
  code: (a) =>
    a.size === 'sm'
      ? '<div className="nish-prose" dangerouslySetInnerHTML={{ __html: html }} />'
      : `<div className="nish-prose text-${a.size}" dangerouslySetInnerHTML={{ __html: html }} />`,
  stories: [
    { id: 'default', name: 'Default (sm)', render: () => <Sample /> },
    { id: 'xs', name: 'Dense (text-xs)', note: 'Every size is in em, so the container sets the scale.', render: () => <Sample size="xs" /> },
    {
      id: 'code-table',
      name: 'Code block, table and task list',
      wide: true,
      render: () => (
        <div className="nish-prose w-full">
          <pre>
            <code>{`const score = matches / total;\nif (score > 0.75) apply();`}</code>
          </pre>
          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>HEB</td>
                <td>14</td>
                <td>$62.10</td>
              </tr>
              <tr>
                <td>Costco</td>
                <td>3</td>
                <td>$48.75</td>
              </tr>
            </tbody>
          </table>
          <ul>
            <li>
              <input type="checkbox" checked disabled aria-label="Done" /> Book the flights
            </li>
            <li>
              <input type="checkbox" disabled aria-label="Not done" /> Pick a hotel
            </li>
          </ul>
          <hr />
          <h3>Heading three</h3>
          <ol>
            <li>Numbered</li>
            <li>List</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'card',
      name: 'In a card',
      wide: true,
      render: () => (
        <Card className="w-full">
          <Sample />
        </Card>
      ),
    },
  ],
  usage: `import { marked } from 'marked';

<Card>
  <div className="nish-prose" dangerouslySetInnerHTML={{ __html: marked.parse(md) }} />
</Card>

<!-- Static pages: nish.css carries it, so the class is all you need. -->
<article class="nish-prose">…</article>`,
  guidelines: [
    'Use it for content you do not control the markup of (Markdown, CMS HTML, chat replies). Build app screens from components instead.',
    'Body text is hi2 and headings hi; links use the accent with an underline, so they do not rely on color alone.',
    'Rules sit inside :where(), so a utility class on any child still wins without !important.',
    'Wide tables and code blocks scroll on their own instead of widening the page.',
  ],
};
