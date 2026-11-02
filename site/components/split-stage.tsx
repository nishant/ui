import { useState } from 'react';
import { Button, Segmented, Select } from '../../src';
import {
  LayoutPresetIcon,
  LayoutPresetPicker,
  SplitStage,
  presetOptions,
} from '../../src/components/split';
import {
  addSlot,
  defaultPreset,
  equalize,
  narrowLayout,
  presetsFor,
  removeSlot,
  swapSlots,
  MAX_PANES,
  type LayoutNode,
  type NarrowLayout,
} from '../../src/split-layout';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- SplitStage, SplitDividers, LayoutPresetPicker and LayoutPresetIcon ----------------------
// The demo panes are role-colored boxes. Each id keeps its color, so a swap shows the colors
// moving between slots while the DOM order line under the stage stays the same.

const PANE_STYLE = [
  'bg-th-teal-soft',
  'bg-th-sky-soft',
  'bg-th-violet-soft',
  'bg-th-amber-soft',
  'bg-th-rose-soft',
  'bg-th-indigo-soft',
] as const;

const NAMES = 'ABCDEFGH';
type Count = 1 | 2 | 3 | 4;

function Pane({ id, slot }: { id: string; slot: number }) {
  const n = NAMES.indexOf(id);
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-lg border border-th-line text-th-hi ${PANE_STYLE[n % PANE_STYLE.length]}`}
    >
      <span className="text-lg font-semibold tabular-nums">Slot {slot + 1}</span>
      <span className="text-xs text-th-hi2">Pane {id}</span>
    </div>
  );
}

function build(count: Count, presetId: string): LayoutNode {
  const p = presetsFor(count).find((x) => x.id === presetId) ?? presetsFor(count)[0]!;
  return p.build();
}

function LiveStage({ initial = 3, resizable = true, gap = 4 }: { initial?: Count; resizable?: boolean; gap?: number }) {
  const startIds = NAMES.slice(0, initial).split('');
  const [items, setItems] = useState<string[]>(startIds);
  const [slots, setSlots] = useState<string[]>(startIds);
  const [presetId, setPresetId] = useState<string | null>(defaultPreset(initial, 16 / 9));
  const [layout, setLayout] = useState<LayoutNode | null>(build(initial, defaultPreset(initial, 16 / 9)));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [a, setA] = useState('0');
  const [b, setB] = useState('1');

  const count = slots.length;

  const add = () => {
    if (count >= MAX_PANES) return;
    const id = NAMES.split('').find((c) => !items.includes(c)) ?? 'H';
    setItems([...items, id]);
    setSlots([...slots, id]);
    setLayout(addSlot(layout, size.w || 600, size.h || 340, gap));
    setPresetId(null);
  };
  const remove = () => {
    if (count === 0) return;
    const gone = slots[count - 1]!;
    setItems(items.filter((i) => i !== gone));
    setSlots(slots.slice(0, -1));
    setLayout(layout ? removeSlot(layout, count - 1) : null);
    setPresetId(null);
    setA('0');
    setB('1');
  };
  const choose = (id: string) => {
    if (count < 1) return;
    setPresetId(id);
    setLayout(build(count as Count, id));
  };
  const swap = () => {
    const i = Number(a);
    const j = Number(b);
    if (i === j || !slots[i] || !slots[j]) return;
    setSlots(swapSlots(slots, i, j));
  };

  return (
    <div className="grid w-full min-w-0 gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={add} disabled={count >= MAX_PANES}>
          Add pane
        </Button>
        <Button size="sm" variant="secondary" onClick={remove} disabled={count === 0}>
          Remove pane
        </Button>
        <span className="text-xs text-th-hi3">{count} of {MAX_PANES} panes</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-th-line bg-th-bg">
        {count > 0 ? (
          <LayoutPresetPicker
            options={presetOptions(count as Count)}
            value={presetId}
            onChange={choose}
            actions={
              count > 1 ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPresetId(null);
                    setLayout(layout ? equalize(layout) : layout);
                  }}
                >
                  Equal sizes
                </Button>
              ) : undefined
            }
            note="Drag the lines to resize."
          />
        ) : (
          <div className="flex min-h-14 items-center border-b border-th-line bg-th-surface px-4 text-sm text-th-hi3">
            Add a pane to arrange the layout.
          </div>
        )}
        <SplitStage
          className="h-72 w-full bg-th-bg sm:h-80"
          layout={count > 0 ? layout : null}
          items={items}
          slots={slots}
          gap={gap}
          resizable={resizable}
          onLayoutChange={(next) => {
            setLayout(next);
            setPresetId(null);
          }}
          onSize={setSize}
          renderPane={(id, info) => <Pane id={id} slot={info.slot} />}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs text-th-hi3">
          Swap slot
          <Select size="sm" value={a} onChange={(e) => setA(e.target.value)} aria-label="First slot to swap">
            {slots.map((_, i) => (
              <option key={i} value={i}>
                Slot {i + 1}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1 text-xs text-th-hi3">
          with slot
          <Select size="sm" value={b} onChange={(e) => setB(e.target.value)} aria-label="Second slot to swap">
            {slots.map((_, i) => (
              <option key={i} value={i}>
                Slot {i + 1}
              </option>
            ))}
          </Select>
        </label>
        <Button size="sm" onClick={swap} disabled={count < 2}>
          Swap
        </Button>
      </div>
      <dl className="m-0 grid gap-1 text-xs text-th-hi3">
        <div className="flex flex-wrap gap-x-2">
          <dt>DOM order (items):</dt>
          <dd className="m-0 font-medium text-th-hi2">{items.map((i) => `Pane ${i}`).join(', ') || 'none'}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt>Slot order:</dt>
          <dd className="m-0 font-medium text-th-hi2">{slots.map((i) => `Pane ${i}`).join(', ') || 'none'}</dd>
        </div>
      </dl>
    </div>
  );
}

function NarrowStage() {
  const [dir, setDir] = useState<NarrowLayout['dir']>('auto');
  const [split, setSplit] = useState(0.5);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const aspect = size.h > 0 ? size.w / size.h : 0.7;
  const layout = narrowLayout(2, { dir, split }, aspect);
  const ids = ['A', 'B'];
  return (
    <div className="grid w-full min-w-0 max-w-[360px] gap-2">
      <Segmented
        label="Narrow layout"
        size="sm"
        value={dir}
        onChange={(v) => setDir(v)}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'col', label: 'Stack' },
          { value: 'row', label: 'Slice' },
        ]}
      />
      <SplitStage
        className="h-72 w-full rounded-xl border border-th-line bg-th-bg"
        layout={layout}
        items={ids}
        slots={ids}
        resizable
        minPane={{ w: size.w * 0.2, h: size.h * 0.2 }}
        onLayoutChange={(next) => {
          if (next.type === 'split') setSplit(next.sizes[0] ?? 0.5);
        }}
        onSize={setSize}
        renderPane={(id, info) => <Pane id={id} slot={info.slot} />}
      />
      <p className="m-0 text-xs text-th-hi3">
        On a narrow screen an app shows at most two panes. Build the tree with narrowLayout and read the divider back from sizes[0].
      </p>
    </div>
  );
}

function Icons() {
  return (
    <div className="flex flex-wrap gap-4 text-th-hi2">
      {presetOptions(4).map((o) => (
        <div key={o.id} className="flex flex-col items-center gap-1 text-xs">
          <LayoutPresetIcon node={o.node} />
          <span>{o.label}</span>
        </div>
      ))}
      <div className="flex flex-col items-center gap-1 text-xs text-th-accent">
        <LayoutPresetIcon node={presetOptions(3)[0]!.node} width={84} height={54} />
        <span>Larger, accent color</span>
      </div>
    </div>
  );
}

export const splitStage: ComponentDoc = {
  id: 'split-stage',
  name: 'SplitStage',
  exports: ['SplitStage', 'SplitDividers', 'LayoutPresetPicker', 'LayoutPresetIcon'],
  summary:
    'A stage that draws one to four panes from a split layout tree. Panes are flat, absolutely positioned children in a fixed DOM order, so presets, resizing and swapping never move a node and never reload an iframe. SplitDividers adds the drag handles, and LayoutPresetPicker the preset bar.',
  importLine: "import { SplitStage, LayoutPresetPicker, presetOptions } from '@nish/ui';\nimport { addSlot, swapSlots } from '@nish/ui/split-layout';",
  controls: [
    { key: 'panes', label: 'Panes', type: 'select', options: ['1', '2', '3', '4'] },
    { key: 'resizable', label: 'Resizable', type: 'boolean' },
    { key: 'gap', label: 'Gap (px)', type: 'number', min: 0, max: 16 },
  ],
  initial: { panes: '3', resizable: true, gap: 4 },
  render: (a) => (
    <LiveStage key={String(a.panes)} initial={Number(a.panes) as Count} resizable={!!a.resizable} gap={Number(a.gap)} />
  ),
  code: (a) =>
    jsx(
      'SplitStage',
      {
        layout: '{layout}',
        items: '{items}',
        slots: '{slots}',
        gap: Number(a.gap) === 4 ? undefined : Number(a.gap),
        resizable: a.resizable ? true : undefined,
        onLayoutChange: '{setLayout}',
        renderPane: '{(id) => <Player id={id} />}',
      },
    ),
  stories: [
    {
      id: 'live',
      name: 'Live stage',
      note: 'Add and remove panes, pick a preset, drag a line (arrow keys move it, Enter resets it), or swap two slots. The DOM order never changes.',
      wide: true,
      render: () => <LiveStage initial={4} />,
    },
    {
      id: 'static',
      name: 'Fixed layout',
      note: 'Without resizable there are no handles.',
      render: () => <LiveStage initial={2} resizable={false} gap={8} />,
    },
    {
      id: 'narrow',
      name: 'Narrow screen (360)',
      note: 'Two panes, stacked or side by side, with one divider.',
      render: () => <NarrowStage />,
    },
    {
      id: 'icons',
      name: 'Preset icons',
      note: 'LayoutPresetIcon draws a layout in the current text color.',
      render: () => <Icons />,
    },
  ],
  usage: `import { SplitStage, LayoutPresetPicker, presetOptions } from '@nish/ui';
import { addSlot, swapSlots, type LayoutNode } from '@nish/ui/split-layout';

// items: insertion order, never re-sorted. slots[i]: the item shown in slot i.
const [items, setItems] = useState(['a', 'b', 'c']);
const [slots, setSlots] = useState(['a', 'b', 'c']);
const [layout, setLayout] = useState<LayoutNode | null>(presetOptions(3)[0].node);

<LayoutPresetPicker
  options={presetOptions(slots.length as 1 | 2 | 3 | 4)}
  value={presetId}
  onChange={choosePreset}
/>
<SplitStage
  className="min-h-0 flex-1"
  layout={layout}
  items={items}
  slots={slots}
  resizable
  onLayoutChange={setLayout}
  renderPane={(id) => <Player id={id} />}
/>

// Swap two panes: reorder slots only.
setSlots(swapSlots(slots, 0, 2));`,
  guidelines: [
    'The flat-panes rule: pass items in a stable order (insertion order) and change slots to move a pane. Never sort items by slot, or panes move in the DOM and iframes reload.',
    'The stage fills its parent. Give it a height (flex-1 min-h-0, or a fixed height); it measures itself with a ResizeObserver. Use onSize to feed addSlot.',
    'Each pane is positioned for you. Make the pane content fill it with h-full w-full.',
    'A stage with dragging or a divider drag in progress sets data-dragging, which turns off pointer events on iframes so a cross-origin frame cannot swallow the drag.',
    'Dividers take 24px of hit area, 44px on touch screens, and work with the arrow keys (2%), Enter and double-click (equal sizes for that split).',
    'On a narrow screen, build a tree with narrowLayout (at most two panes) and read the divider back from sizes[0].',
    'The layout math is in @nish/ui/split-layout, which has no React and runs in Node. A server can validate a saved layout with isValidLayout.',
  ],
  api: { functions: ['presetOptions'], interfaces: [] },
};
