import { useEffect, useId, useRef } from 'react';
import { mountTooltips } from '../../src/theme';
import type { ComponentDoc } from './types';

// --- .nish-tooltip and mountTooltips (static pages) ----------------------------------------

function Static({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => (ref.current ? mountTooltips(ref.current) : undefined), []);
  return <div ref={ref} className="pt-14 pb-2" dangerouslySetInnerHTML={{ __html: html.replace(/"tip-/g, `"tip-${uid}-`) }} />;
}

const BADGE = `<span class="nish-badge nish-badge--info nish-tooltip" tabindex="0" aria-describedby="tip-tailnet">Tailnet
  <span class="nish-tooltip-content" role="tooltip" id="tip-tailnet">Only reachable on the tailnet.</span>
</span>`;

const SIDES = `<div style="display:flex;flex-wrap:wrap;gap:8px">
  <span class="nish-badge nish-tooltip nish-tooltip--start" tabindex="0" aria-describedby="tip-s">Start<span class="nish-tooltip-content" role="tooltip" id="tip-s">Aligned to the left edge.</span></span>
  <span class="nish-badge nish-tooltip" tabindex="0" aria-describedby="tip-c">Center<span class="nish-tooltip-content" role="tooltip" id="tip-c">Centered above (the default).</span></span>
  <span class="nish-badge nish-tooltip nish-tooltip--bottom nish-tooltip--end" tabindex="0" aria-describedby="tip-e">Below, end<span class="nish-tooltip-content" role="tooltip" id="tip-e">Below and aligned to the right edge, for a trigger at the top right of a page.</span></span>
</div>`;

export const mountTooltipsDoc: ComponentDoc & { source: string } = {
  id: 'mount-tooltips',
  name: 'Static tooltip',
  exports: [],
  source: 'src/css/components.css',
  summary:
    'A CSS-only tooltip for static pages: .nish-tooltip on a focusable trigger with a .nish-tooltip-content child (role="tooltip", named by aria-describedby). It shows on hover and keyboard focus; mountTooltips() from @nish/ui/theme adds Escape. Same look as the React Tooltip.',
  importLine: "import { mountTooltips } from '@nish/ui/theme';",
  controls: [],
  initial: {},
  render: () => <Static html={BADGE} />,
  code: () => BADGE,
  api: { functions: ['mountTooltips'], interfaces: [] },
  stories: [
    { id: 'badge', name: 'On a badge (tabindex="0")', render: () => <Static html={BADGE} /> },
    { id: 'sides', name: 'Placement: --start, default, --bottom --end', render: () => <Static html={SIDES} /> },
  ],
  usage: `<link rel="stylesheet" href="nish/nish-components.css">
${BADGE}
<script type="module">
  import { mountTooltips } from './nish/theme.js';
  mountTooltips(); // Escape hides an open tip; optional
</script>

<!-- Classic scripts: window.nishTheme.mountTooltips() from theme.global.js. -->`,
  guidelines: [
    'Replace title= with it: a title never shows on touch or keyboard focus, and screen readers read it inconsistently.',
    'The trigger must be focusable: a button or link already is; give a span tabindex="0". Keep the tip to a sentence; it never holds links or buttons.',
    'It is positioned in CSS, inside the trigger: an overflow:hidden ancestor clips it. Pick --bottom near the top of the page and --start or --end near an edge. React apps use <Tooltip>, which is portaled and flips itself.',
  ],
};
