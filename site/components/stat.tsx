import { Card } from '../../src';
import { Stat, StatGrid, signTone } from '../../src';
import { jsx } from '../lib/jsx';
import type { ComponentDoc } from './types';

// --- Stat and StatGrid --------------------------------------------------------------

const TONES = ['neutral', 'ok', 'loss', 'warn'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;
const VARIANTS = ['card', 'inset', 'plain'] as const;

const pnl = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}$${Math.abs(n).toLocaleString('en-US')}`;

export const stat: ComponentDoc = {
  id: 'stat',
  name: 'Stat',
  exports: ['Stat', 'StatGrid'],
  summary:
    'A labelled number, alone or in a StatGrid. Semantic <dl> markup, tabular figures, a tone for gains and losses, and a skeleton while loading.',
  importLine: "import { Stat, StatGrid, signTone } from '@nish/ui';",
  controls: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'value', label: 'Value', type: 'text' },
    { key: 'sub', label: 'Sub', type: 'text' },
    { key: 'tone', label: 'Tone', type: 'select', options: [...TONES] },
    { key: 'size', label: 'Size', type: 'select', options: [...SIZES] },
    { key: 'variant', label: 'Variant', type: 'select', options: [...VARIANTS] },
    { key: 'tip', label: 'Tip', type: 'boolean' },
    { key: 'loading', label: 'Loading', type: 'boolean' },
  ],
  initial: { label: 'Day P&L', value: '+$1,284', sub: '+0.8% today', tone: 'ok', size: 'md', variant: 'card', tip: false, loading: false },
  render: (a) => (
    <Stat
      label={String(a.label)}
      value={String(a.value)}
      sub={String(a.sub) || undefined}
      tone={a.tone as 'ok'}
      size={a.size as 'md'}
      variant={a.variant as 'card'}
      tip={a.tip ? 'Realized plus unrealized, since the 9:30 am open.' : undefined}
      loading={!!a.loading}
      className="w-56"
    />
  ),
  code: (a) =>
    jsx('Stat', {
      label: a.label,
      value: a.value,
      sub: a.sub || undefined,
      tone: a.tone === 'neutral' ? undefined : a.tone,
      size: a.size === 'md' ? undefined : a.size,
      variant: a.variant === 'card' ? undefined : a.variant,
      tip: a.tip ? 'Realized plus unrealized, since the open.' : undefined,
      loading: a.loading || undefined,
    }),
  api: { functions: ['signTone'], interfaces: [] },
  stories: [
    {
      id: 'grid',
      name: 'StatGrid',
      note: 'Two columns on phones, four from 768px.',
      wide: true,
      render: () => (
        <StatGrid className="w-full">
          <Stat label="Portfolio" value="$184,210" sub="12 positions" />
          <Stat label="Day P&L" value={pnl(1284)} tone={signTone(1284)} sub="+0.8%" />
          <Stat label="Week P&L" value={pnl(-3120)} tone={signTone(-3120)} sub="−1.7%" />
          <Stat label="Cash" value="$22,900" sub="12% of total" tip="Settled cash available to trade." />
        </StatGrid>
      ),
    },
    {
      id: 'tones',
      name: 'Tones',
      render: () => (
        <StatGrid cols={{ base: 2, md: 4 }} className="w-full">
          <Stat variant="plain" label="Neutral" value="42" />
          <Stat variant="plain" label="Gain" value="+3.2%" tone="ok" />
          <Stat variant="plain" label="Loss" value="−1.4%" tone="loss" />
          <Stat variant="plain" label="Attention" value="7 days" tone="warn" />
        </StatGrid>
      ),
    },
    {
      id: 'sizes',
      name: 'Sizes',
      render: () => (
        <StatGrid cols={{ base: 3, md: 3 }} className="w-full">
          {SIZES.map((s) => (
            <Stat key={s} variant="inset" size={s} label={`Size ${s}`} value="99.95%" sub="30 days" />
          ))}
        </StatGrid>
      ),
    },
    {
      id: 'variants',
      name: 'Variants',
      render: () => (
        <StatGrid cols={{ base: 1, md: 3 }} className="w-full">
          {VARIANTS.map((v) => (
            <Stat key={v} variant={v} label={v} value="1,204" sub="applications" />
          ))}
        </StatGrid>
      ),
    },
    {
      id: 'loading',
      name: 'Loading',
      render: () => (
        <StatGrid cols={{ base: 2, md: 2 }} className="w-full">
          <Stat label="Uptime (30d)" value="" sub="x" loading />
          <Stat label="Median response" value="" loading />
        </StatGrid>
      ),
    },
    {
      id: 'card',
      name: 'Inset, in a card',
      render: () => (
        <Card className="w-full max-w-md">
          <h3 className="text-sm font-semibold text-th-hi">jobs.nish.software</h3>
          <StatGrid cols={{ base: 2, md: 2 }} className="mt-3">
            <Stat variant="inset" size="sm" label="Uptime (30d)" value="99.98%" tone="ok" />
            <Stat variant="inset" size="sm" label="p95 response" value="212 ms" />
          </StatGrid>
        </Card>
      ),
    },
    {
      id: 'long',
      name: 'Long values wrap',
      render: () => <Stat className="w-40" label="Largest holding" value="VANGUARD-TOTAL-WORLD-STOCK-ETF" size="sm" />,
    },
  ],
  usage: `import { Stat, StatGrid, signTone } from '@nish/ui';

<StatGrid cols={{ base: 2, md: 4 }}>
  <Stat label="Portfolio" value={fmt(total)} />
  <Stat label="Day P&L" value={fmt(day)} tone={signTone(day)} sub={pct(dayPct)} />
  <Stat label="Cash" value={fmt(cash)} tip="Settled cash available to trade." loading={isLoading} />
</StatGrid>`,
  guidelines: [
    'Format the value before passing it; Stat does not format numbers.',
    'Use signTone(n) for gains and losses instead of a hand-written ternary; zero and missing stay neutral.',
    'Say the sign in the text too (+ or −): the tone is not the only signal.',
    'Use inset inside a Card, card on a page background, plain inside dense widgets.',
  ],
};
