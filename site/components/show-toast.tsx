import { Button } from '../../src';
import { showToast, type ShowToastOptions } from '../../src/theme';
import type { ComponentDoc } from './types';
import { Row } from './shared';

// --- showToast (static pages) ------------------------------------------------------------

/** The hub's message: a host name, a sentence and a link, built as nodes (never HTML). */
function unreachable(): Node {
  const p = document.createDocumentFragment();
  const host = document.createElement('strong');
  host.textContent = 'mc.nish.software';
  const link = document.createElement('a');
  link.href = '#/components/show-toast';
  link.textContent = 'open it anyway';
  p.append(host, ' is not reachable from here. You can still ', link, '.');
  return p;
}

function Trigger({ label, opts, content }: { label: string; opts?: ShowToastOptions; content?: () => string | Node }) {
  return (
    <Button size="sm" onClick={() => showToast(content ? content() : 'Copied the link.', opts)}>
      {label}
    </Button>
  );
}

export const showToastDoc: ComponentDoc & { source: string } = {
  id: 'show-toast',
  name: 'showToast',
  exports: [],
  source: 'src/theme.ts',
  summary:
    'The toast for static pages (the hub, mc, trips): one .nish-toast at the bottom center, inside a single polite live region. Same policy as the React toast: the timer pauses on hover and on focus, so a keyboard user can reach a link inside it.',
  importLine: "import { showToast } from '@nish/ui/theme';",
  controls: [
    { key: 'tone', label: 'Tone', type: 'select', options: ['neutral', 'ok', 'warn', 'loss', 'info'] },
    { key: 'sticky', label: 'Sticky', type: 'boolean' },
  ],
  initial: { tone: 'warn', sticky: false },
  render: (a) => (
    <Trigger
      label="Show the toast"
      content={unreachable}
      opts={{ tone: a.tone as ShowToastOptions['tone'], duration: a.sticky ? 'sticky' : undefined }}
    />
  ),
  code: (a) =>
    `showToast(message, { tone: '${a.tone}'${a.sticky ? ", duration: 'sticky'" : ''} });`,
  api: { functions: ['showToast'], interfaces: ['ShowToastOptions'] },
  stories: [
    {
      id: 'kinds',
      name: 'Triggers',
      note: 'Each button shows one toast; a new one replaces the one on screen.',
      render: () => (
        <Row>
          <Trigger label="Plain text" />
          <Trigger label="With a link" content={unreachable} opts={{ tone: 'warn' }} />
          <Trigger label="With an action" content={() => 'Tile hidden.'} opts={{ tone: 'ok', action: { label: 'Undo', onClick: () => undefined } }} />
          <Trigger label="Sticky" content={() => 'Could not reach the server.'} opts={{ tone: 'loss', duration: 'sticky' }} />
        </Row>
      ),
    },
  ],
  usage: `<link rel="stylesheet" href="nish/nish-components.css">
<script type="module">
  import { showToast } from './nish/theme.js';
  showToast('Copied the link.');
  showToast(nodeWithALink, { tone: 'warn', duration: 'sticky' });
  showToast('Tile hidden.', { tone: 'ok', action: { label: 'Undo', onClick: undo } });
</script>

<!-- Classic scripts: window.nishTheme.showToast(…) from theme.global.js. -->`,
  guidelines: [
    'Pass text, or a Node for markup (a <strong>, a link). Strings are never parsed as HTML.',
    'One toast at a time: a new call replaces the one on screen. The call returns a function that hides it now.',
    'React apps use toast() and <Toaster /> instead; the look and the timer rules match.',
  ],
};
