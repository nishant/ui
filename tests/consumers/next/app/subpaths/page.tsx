// The pure subpath entries in a server component: formatters, theme data and tokens.
// nish-ui/chart has no directive: seriesColor() is callable from a server component.
import { money, pct, date } from 'nish-ui/format';
import { seriesColor } from 'nish-ui/chart';
import { PRESETS } from 'nish-ui/theme';
import { THEMES } from 'nish-ui/tokens';

export default function Subpaths() {
  return (
    <main data-testid="subpaths">
      <span data-testid="money">{money(1234.5)}</span> <span data-testid="pct">{pct(0.123)}</span>{' '}
      <span data-testid="date">{date(new Date(Date.UTC(2026, 0, 1)))}</span> <span data-testid="presets">{PRESETS.length}</span>{' '}
      <span data-testid="themes">{Object.keys(THEMES).length}</span> <span data-testid="series">{seriesColor(2)}</span>
    </main>
  );
}
