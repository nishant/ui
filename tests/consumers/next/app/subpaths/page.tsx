// The pure subpath entries in a server component: formatters, theme data and tokens.
// (nish-ui/chart is not here: src/chart.ts is 'use client' as a whole because of useChartTheme,
// so seriesColor() cannot be called from a server component.)
import { money, pct, date } from 'nish-ui/format';
import { PRESETS } from 'nish-ui/theme';
import { THEMES } from 'nish-ui/tokens';

export default function Subpaths() {
  return (
    <main data-testid="subpaths">
      {money(1234.5)} {pct(0.123)} {date(new Date(Date.UTC(2026, 0, 1)))} {PRESETS.length} {Object.keys(THEMES).length}
    </main>
  );
}
