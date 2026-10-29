import { useEffect, useMemo, useState } from 'react';
import { Badge, SystemCanvas, type CanvasEdge, type CanvasGroup } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SystemCanvas -------------------------------------------------------------------

const COLUMNS = ['Edge', 'Infra', 'Apps', 'Libraries'];
const NOTES = ['Editing notify.ts', 'Running npm test', 'Reading the spec', 'Editing routes.ts', 'Running the build', 'Writing a test'];

function groups(): CanvasGroup[] {
  return [
    {
      id: 'edge',
      title: 'Edge',
      subtitle: 'Where requests come in',
      hue: 'sky',
      column: 0,
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
      nodes: [{ id: 'ui/components', label: 'Components', kind: 'library', detail: 'src' }],
    },
  ];
}

const EDGES: CanvasEdge[] = [
  { id: 'e1', from: 'edge/tunnel', to: 'hosting/caddy' },
  { id: 'e2', from: 'edge/tailnet', to: 'hosting/caddy', dashed: true },
  { id: 'e3', from: 'hosting/caddy', to: 'trackers/ui', label: 'proxies' },
  { id: 'e4', from: 'hosting/caddy', to: 'status/ui' },
  { id: 'e5', from: 'hosting/caddy', to: 'workflows/ui' },
  { id: 'e6', from: 'trackers/ui', to: 'trackers/server' },
  { id: 'e7', from: 'trackers/server', to: 'trackers/workers' },
  { id: 'e8', from: 'status/ui', to: 'status/server' },
  { id: 'e9', from: 'workflows/ui', to: 'workflows/server' },
  { id: 'e10', from: 'hosting/sites', to: 'status/server', label: 'reads', dashed: true },
  { id: 'e11', from: 'trackers', to: 'ui/components', dashed: true },
  { id: 'e12', from: 'status', to: 'ui/components', dashed: true },
  { id: 'e13', from: 'workflows', to: 'ui/components', dashed: true },
];

function withActivity(base: CanvasGroup[], active: Record<string, string>, heat: Record<string, number>): CanvasGroup[] {
  return base.map((g) => ({
    ...g,
    nodes: g.nodes.map((n) => {
      const note = active[n.id];
      return { ...n, active: note != null, note, count: note != null ? 1 : undefined, heat: heat[n.id] };
    }),
  }));
}

const ALL_NODES = groups().flatMap((g) => g.nodes.map((n) => n.id));

/** Moves "activity" between random nodes every 1.5 s; the node that was lit cools off. */
function Live() {
  const [state, setState] = useState<{ active: Record<string, string>; heat: Record<string, number> }>({
    active: { 'trackers/server': 'Editing notify.ts' },
    heat: { 'status/ui': 0.6, 'hosting/sites': 0.3 },
  });
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
        return { active: next, heat };
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);
  const data = useMemo(() => withActivity(groups(), state.active, state.heat), [state]);
  return <SystemCanvas groups={data} edges={EDGES} columns={COLUMNS} height="520px" label="Live demo system map" />;
}

const PLAIN = groups();

export const systemCanvas: ComponentDoc = {
  id: 'system-canvas',
  name: 'SystemCanvas',
  exports: ['SystemCanvas', 'layoutSystem'],
  summary:
    'A pannable, zoomable graph-paper canvas of colored groups holding nodes, joined by edges. Nodes that are being worked on pulse in their group color, edges into them flow, and a fading glow marks where work just happened.',
  importLine: "import { SystemCanvas } from '@nish/ui';",
  controls: [
    { key: 'selectedNode', label: 'Selected', type: 'select', options: ['none', 'trackers/server', 'trackers'] },
    { key: 'active', label: 'Active node', type: 'select', options: ['none', 'trackers/server', 'workflows/ui', 'ui/components'] },
    { key: 'labels', label: 'Column titles', type: 'boolean' },
  ],
  initial: { selectedNode: 'none', active: 'trackers/server', labels: true },
  render: (a) => {
    const active = a.active === 'none' ? {} : { [String(a.active)]: 'Editing notify.ts' };
    return (
      <SystemCanvas
        groups={withActivity(PLAIN, active, {})}
        edges={EDGES}
        columns={a.labels ? COLUMNS : undefined}
        selected={a.selectedNode === 'none' ? null : String(a.selectedNode)}
        height="460px"
      />
    );
  },
  code: (a) => jsx('SystemCanvas', { groups: '{groups}', edges: '{edges}', columns: a.labels ? '{columns}' : undefined, selected: a.selectedNode === 'none' ? undefined : String(a.selectedNode), height: '460px' }),
  stories: [
    {
      id: 'live',
      name: 'Live',
      note: 'Activity moves to a different node every 1.5 seconds. Drag or scroll to pan, ctrl+scroll or pinch to zoom.',
      wide: true,
      render: () => <Live />,
    },
    {
      id: 'static',
      name: 'No activity',
      note: 'Nothing is active, so every edge is quiet.',
      wide: true,
      render: () => <SystemCanvas groups={PLAIN} edges={EDGES} columns={COLUMNS} height="420px" label="Quiet system map" />,
    },
  ],
  usage: `import { SystemCanvas } from '@nish/ui';

<SystemCanvas
  height="calc(100dvh - 120px)"
  columns={['Edge', 'Infra', 'Apps', 'Libraries']}
  groups={[
    {
      id: 'trackers',
      title: 'Trackers',
      subtitle: 'trackers.nish.software',
      hue: 'emerald',
      column: 2,
      nodes: [
        { id: 'trackers/server', label: 'API server', kind: 'service', active: true, note: 'Editing notify.ts' },
      ],
    },
  ]}
  edges={[{ id: 'e1', from: 'hosting/caddy', to: 'trackers/server' }]}
  onSelect={(id, type) => open(id, type)}
/>`,
  guidelines: [
    'Use it to show how several parts connect and where work is happening right now. For a single flow of steps use FlowSteps; for phases of agents use WorkflowBoard.',
    'The layout is computed: columns by the column number, groups stacked in the order given, nodes in a grid inside each group. Positions cannot be edited or saved.',
    'Drag or scroll to pan. Ctrl+scroll or pinch to zoom. With the canvas focused: arrow keys pan, + and - zoom, 0 fits everything.',
    'Give the canvas a height (it fills its parent by default) and keep it the only thing that scrolls: the canvas stops wheel and touch gestures from moving the page.',
    'Keep node ids stable. Active and heat changes animate in place; a poll with the same data restarts nothing.',
    'Edge ends can be node ids or group ids. An edge into an active node (or a group with one) takes that group color and flows.',
    'Respects prefers-reduced-motion: no pulse, ping or flow, active edges stay solid in the group color, and view changes are instant.',
  ],
};
