import { useEffect, useMemo, useState } from 'react';
import { Badge, SystemCanvas, type CanvasEdge, type CanvasEdgeKind, type CanvasGroup, type CanvasLayoutMode } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SystemCanvas -------------------------------------------------------------------

const COLUMNS = ['Edge', 'Infra', 'Apps', 'Libraries'];
const BANDS = ['Ingress', 'Apps', 'Shared'];
const KINDS: CanvasEdgeKind[] = [
  { id: 'serves', label: 'Traffic', line: 'solid' },
  { id: 'reads', label: 'Reads', line: 'dashed' },
  { id: 'uses', label: 'Uses', line: 'dotted', hidden: true },
];
// A fixed start time so the render stays pure; later pieces count as more recent.
const T0 = Date.now();
const NOTES = ['Editing notify.ts', 'Running npm test', 'Reading the spec', 'Editing routes.ts', 'Running the build', 'Writing a test'];

function groups(): CanvasGroup[] {
  return [
    {
      id: 'edge',
      title: 'Edge',
      subtitle: 'Where requests come in',
      hue: 'sky',
      column: 0,
      band: 0,
      nodes: [
        { id: 'edge/tunnel', label: 'Tunnel', kind: 'infra', detail: 'Public traffic' },
        { id: 'edge/tailnet', label: 'Tailscale', kind: 'infra', detail: 'Private traffic' },
      ],
    },
    {
      id: 'hosting',
      title: 'Hosting',
      subtitle: 'nishant/hosting',
      hue: 'teal',
      column: 1,
      band: 0,
      badge: <Badge hue="teal">local</Badge>,
      nodes: [
        { id: 'hosting/caddy', label: 'Caddy', kind: 'infra', detail: 'Reverse proxy' },
        { id: 'hosting/sites', label: 'Sites list', kind: 'data', detail: 'sites.yaml' },
        { id: 'hosting/runners', label: 'Runners', kind: 'infra', detail: 'Deploys' },
      ],
    },
    {
      id: 'trackers',
      title: 'Trackers',
      subtitle: 'trackers.nish.software',
      hue: 'emerald',
      column: 2,
      band: 1,
      badge: <Badge hue="emerald">public</Badge>,
      nodes: [
        { id: 'trackers/ui', label: 'Web UI', kind: 'ui', detail: 'ui' },
        { id: 'trackers/server', label: 'API server', kind: 'service', detail: 'server' },
        { id: 'trackers/workers', label: 'Trackers', kind: 'worker', detail: 'server/trackers' },
        { id: 'trackers/scripts', label: 'Scripts', kind: 'tool', detail: 'scripts' },
      ],
    },
    {
      id: 'status',
      title: 'Status',
      subtitle: 'status.nish.software',
      hue: 'amber',
      column: 2,
      band: 1,
      badge: <Badge hue="amber">public</Badge>,
      nodes: [
        { id: 'status/ui', label: 'Web UI', kind: 'ui', detail: 'ui' },
        { id: 'status/server', label: 'API server', kind: 'service', detail: 'server' },
      ],
    },
    {
      id: 'workflows',
      title: 'Workflows',
      subtitle: 'workflows.nish.software',
      hue: 'violet',
      column: 2,
      band: 1,
      badge: <Badge hue="violet">tailnet</Badge>,
      nodes: [
        { id: 'workflows/ui', label: 'Web UI', kind: 'ui', detail: 'ui' },
        { id: 'workflows/server', label: 'API server', kind: 'service', detail: 'server' },
        { id: 'workflows/docs', label: 'Specs', kind: 'docs', detail: 'docs' },
      ],
    },
    {
      id: 'ui',
      title: 'Design system',
      subtitle: '@nish/ui',
      hue: 'indigo',
      column: 3,
      band: 2,
      nodes: [{ id: 'ui/components', label: 'Components', kind: 'library', detail: 'src' }],
    },
  ];
}

const EDGES: CanvasEdge[] = [
  { id: 'e1', kind: 'serves', from: 'edge/tunnel', to: 'hosting/caddy' },
  { id: 'e2', kind: 'serves', from: 'edge/tailnet', to: 'hosting/caddy', dashed: true },
  { id: 'e3', kind: 'serves', from: 'hosting/caddy', to: 'trackers/ui', label: 'proxies' },
  { id: 'e4', kind: 'serves', from: 'hosting/caddy', to: 'status/ui' },
  { id: 'e5', kind: 'serves', from: 'hosting/caddy', to: 'workflows/ui' },
  { id: 'e6', kind: 'serves', from: 'trackers/ui', to: 'trackers/server' },
  { id: 'e7', kind: 'serves', from: 'trackers/server', to: 'trackers/workers' },
  { id: 'e8', kind: 'serves', from: 'status/ui', to: 'status/server' },
  { id: 'e9', kind: 'serves', from: 'workflows/ui', to: 'workflows/server' },
  { id: 'e10', kind: 'reads', from: 'hosting/sites', to: 'status/server', label: 'reads' },
  { id: 'e11', kind: 'uses', from: 'trackers', to: 'ui/components' },
  { id: 'e12', kind: 'uses', from: 'status', to: 'ui/components' },
  { id: 'e13', kind: 'uses', from: 'workflows', to: 'ui/components' },
];

function withActivity(base: CanvasGroup[], active: Record<string, string>, heat: Record<string, number>, at = T0): CanvasGroup[] {
  return base.map((g) => ({
    ...g,
    nodes: g.nodes.map((n, i) => {
      const note = active[n.id];
      return { ...n, active: note != null, activeAt: note != null ? at + i : undefined, note, count: note != null ? 1 : undefined, heat: heat[n.id] };
    }),
  }));
}

const ALL_NODES = groups().flatMap((g) => g.nodes.map((n) => n.id));

/** Moves "activity" between random nodes every 1.5 s; the node that was lit cools off. */
function Live({ layout = 'auto', follow: followInitial = false, minimap = true }: { layout?: CanvasLayoutMode; follow?: boolean; minimap?: boolean }) {
  const [state, setState] = useState<{ active: Record<string, string>; heat: Record<string, number>; at: number }>({
    active: { 'trackers/server': 'Editing notify.ts' },
    heat: { 'status/ui': 0.6, 'hosting/sites': 0.3 },
    at: T0,
  });
  const [follow, setFollow] = useState(followInitial);
  useEffect(() => {
    const timer = setInterval(() => {
      setState((s) => {
        const pick = () => ALL_NODES[Math.floor(Math.random() * ALL_NODES.length)]!;
        const next: Record<string, string> = {};
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) next[pick()] = NOTES[Math.floor(Math.random() * NOTES.length)]!;
        const heat: Record<string, number> = {};
        for (const [id, h] of Object.entries(s.heat)) if (h > 0.15) heat[id] = h * 0.7;
        for (const id of Object.keys(s.active)) if (!(id in next)) heat[id] = 0.8;
        return { active: next, heat, at: s.at + 1500 };
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);
  const data = useMemo(() => withActivity(groups(), state.active, state.heat, state.at), [state]);
  return (
    <SystemCanvas
      groups={data}
      edges={EDGES}
      columns={COLUMNS}
      bands={BANDS}
      edgeKinds={KINDS}
      layout={layout}
      follow={follow}
      onFollowChange={setFollow}
      minimap={minimap}
      height="520px"
      label="Live demo system map"
    />
  );
}

const PLAIN = groups();

export const systemCanvas: ComponentDoc = {
  id: 'system-canvas',
  name: 'SystemCanvas',
  exports: ['SystemCanvas', 'layoutSystem', 'pickLayout', 'routeEdges'],
  summary:
    'A pannable, zoomable graph-paper canvas of colored groups holding nodes, joined by edges. It lays itself out in bands or columns, whichever shows the map biggest. Nodes that are being worked on pulse in their group color, edges into them flow, and follow mode flies the view to where work is happening.',
  importLine: "import { SystemCanvas } from '@nish/ui/system-canvas'; // also on '@nish/ui' through 2.x",
  fleetOnly: true,
  controls: [
    { key: 'layout', label: 'Layout', type: 'select', options: ['auto', 'bands', 'columns'] },
    { key: 'selectedNode', label: 'Selected', type: 'select', options: ['none', 'trackers/server', 'trackers'] },
    { key: 'active', label: 'Active node', type: 'select', options: ['none', 'trackers/server', 'workflows/ui', 'ui/components'] },
    { key: 'follow', label: 'Follow', type: 'boolean' },
    { key: 'minimap', label: 'Minimap', type: 'boolean' },
    { key: 'labels', label: 'Column and band titles', type: 'boolean' },
  ],
  initial: { layout: 'auto', selectedNode: 'none', active: 'trackers/server', follow: false, minimap: true, labels: true },
  render: (a) => {
    const active = a.active === 'none' ? {} : { [String(a.active)]: 'Editing notify.ts' };
    return (
      <SystemCanvas
        groups={withActivity(PLAIN, active, {})}
        edges={EDGES}
        columns={a.labels ? COLUMNS : undefined}
        bands={a.labels ? BANDS : undefined}
        edgeKinds={KINDS}
        layout={String(a.layout) as CanvasLayoutMode}
        follow={Boolean(a.follow)}
        minimap={Boolean(a.minimap)}
        selected={a.selectedNode === 'none' ? null : String(a.selectedNode)}
        height="460px"
      />
    );
  },
  code: (a) =>
    jsx('SystemCanvas', {
      groups: '{groups}',
      edges: '{edges}',
      columns: a.labels ? '{columns}' : undefined,
      bands: a.labels ? '{bands}' : undefined,
      edgeKinds: '{edgeKinds}',
      layout: a.layout === 'auto' ? undefined : String(a.layout),
      follow: a.follow ? true : undefined,
      minimap: a.minimap ? undefined : false,
      selected: a.selectedNode === 'none' ? undefined : String(a.selectedNode),
      height: '460px',
    }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'Activity moves to a different node every 1.5 seconds. Drag or scroll to pan, ctrl+scroll or pinch to zoom. Turn on Follow in the controls and the view flies to the newest activity; any pan or zoom turns it off.',
      wide: true,
      render: () => <Live />,
    },
    {
      id: 'following',
      name: 'Following',
      note: 'The same live map with follow mode already on and no minimap.',
      wide: true,
      render: () => <Live follow minimap={false} />,
    },
    {
      id: 'columns',
      name: 'Columns layout',
      note: 'layout="columns" keeps the layers side by side, left to right.',
      wide: true,
      render: () => <SystemCanvas groups={withActivity(PLAIN, { 'trackers/server': 'Editing notify.ts' }, {})} edges={EDGES} columns={COLUMNS} edgeKinds={KINDS} layout="columns" height="420px" label="Columns system map" />,
    },
    {
      id: 'static',
      name: 'No activity',
      note: 'Nothing is active, so every edge is quiet and there is no Follow button.',
      wide: true,
      render: () => <SystemCanvas groups={PLAIN} edges={EDGES} columns={COLUMNS} bands={BANDS} edgeKinds={KINDS} height="420px" label="Quiet system map" />,
    },
  ],
  usage: `import { SystemCanvas } from '@nish/ui/system-canvas';
// the same component is also exported from '@nish/ui' through 2.x

const edgeKinds = [
  { id: 'serves', label: 'Traffic', line: 'solid' },
  { id: 'reads', label: 'Reads', line: 'dashed' },
  { id: 'uses', label: 'Uses', line: 'dotted', hidden: true },
];

<SystemCanvas
  height="calc(100dvh - 120px)"
  layout="auto"
  bands={['Ingress', 'Apps', 'Shared']}
  columns={['Edge', 'Infra', 'Apps', 'Libraries']}
  edgeKinds={edgeKinds}
  follow={follow}
  onFollowChange={setFollow}
  groups={[
    {
      id: 'trackers',
      title: 'Trackers',
      subtitle: 'trackers.nish.software',
      hue: 'emerald',
      column: 2,
      band: 1,
      nodes: [
        { id: 'trackers/server', label: 'API server', kind: 'service', active: true, activeAt: Date.now(), note: 'Editing notify.ts' },
      ],
    },
  ]}
  edges={[{ id: 'e1', kind: 'serves', from: 'hosting/caddy', to: 'trackers/server' }]}
  onSelect={(id, type) => open(id, type)}
/>`,
  guidelines: [
    'Use it to show how several parts connect and where work is happening right now. For a single flow of steps use FlowSteps; for phases of agents use WorkflowBoard.',
    'Layout: "bands" stacks bands top to bottom (set group.band, name them with bands) and wraps the groups of a band into rows, so traffic reads downward. "columns" puts layers side by side by group.column. "auto", the default, tries both and picks the one that shows the map biggest in the current viewport, and picks again when the viewport resizes, sliding the cards to their new places. On a phone it uses one group per row. Positions cannot be edited or saved.',
    'Drag or scroll to pan. Ctrl+scroll or pinch to zoom. With the canvas focused: arrow keys pan, + and - zoom, 0 fits everything. Double-click a group header to zoom to that group; double-click empty canvas to zoom in. Selecting something off screen brings it into view.',
    'Give the canvas a height (it fills its parent by default) and keep it the only thing that scrolls: the canvas stops wheel and touch gestures from moving the page.',
    'Keep node ids stable. Active and heat changes animate in place; a poll with the same data restarts nothing.',
    'Edges are drawn as right-angled lines that end in an arrowhead and never cross a card. In bands they leave the bottom of the source group and enter the top of the target; in columns they leave the right side and enter the left. Edges from one node share a trunk and edges into one node merge. routeEdges(layout, groups, edges) returns the same lines as points and path data, and pickLayout(groups, edges, viewport, mode) returns the layout the canvas would choose.',
    'Edge kinds: give each edge a kind and pass edgeKinds to get a "Lines" legend. Each kind has a line style (solid, dashed or dotted) and can be shown or hidden by the viewer. Mark a kind hidden to start with it off. Hidden kinds are left out of the layout and the routing, so the rest gets more room.',
    'Hover (with a mouse) or select a node or group to focus it: its edges and the cards at their other ends stay bright and everything else dims. Zoomed out below 60%, card details hide and titles grow so the overview stays readable.',
    'Follow: give nodes active and activeAt (the time of the newest activity, in ms) and a Follow button appears in the controls. When on, the view flies to the active nodes: all of them when they fit at a readable zoom, otherwise one at a time, newest first, every 6 seconds, with a caption saying what it follows. Any manual pan or zoom turns it off. Pass follow and onFollowChange to control it, for example to remember the choice.',
    'Minimap: on viewports 600 px wide or more, a small map of the whole canvas shows the current view; click or drag on it to move. Pass minimap={false} to hide it. It is never shown on phones.',
    'Edge ends can be node ids or group ids. An edge into an active node (or a group with one) takes that group color and flows.',
    'Texts: the label, zoom buttons, Follow and Lines names come from <NishProvider strings> (systemMap, zoomOut, zoomIn, fitToScreen, followActivity, canvasLines, live). The follow caption and the "· 1 hidden" count have no key: set them with the labels prop. A node\'s accessible name starts with the text it shows (label, then the note or detail, then the count), then its group, so voice control and screen readers agree with the card. SystemCanvas takes ref, id, style, data-* and aria-* for its viewport.',
    'Respects prefers-reduced-motion: no pulse, ping, flow or sliding cards, active edges stay solid in the group color, and view changes (including follow) are instant, while the follow cycle still advances.',
  ],
};
