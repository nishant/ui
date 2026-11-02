import { html, nothing, svg, type TemplateResult } from 'lit';
import { sparklineGeometry } from '../sparkline-path';
import { NishElement, define } from './base';

const TONE_COLOR: Record<string, string> = {
  accent: 'var(--nish-accent)',
  ok: 'var(--nish-ok-fill)',
  warn: 'var(--nish-warn-fill)',
  loss: 'var(--nish-loss-fill)',
  info: 'var(--nish-info-fill)',
};

function parseValues(raw: string | null): (number | null)[] {
  if (raw == null) return [];
  const text = raw.trim();
  if (!text) return [];
  return text.split(',').map((part) => {
    const t = part.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  });
}

/** `<nish-sparkline values="3,5,4,8" label="Response time">`: a tiny line chart with no axes, the
 *  same path as React `Sparkline`. Attributes: `values` (comma separated, an empty entry leaves a
 *  gap), `label` (accessible name), `tone` (chart-1 to chart-8, accent, ok, warn, loss, info;
 *  default chart-1), `width` (default 120), `height` (default 28), `fill` (shades the area),
 *  `min` and `max` (the scale; default the series' own). Fewer than two values draws nothing. */
export class NishSparkline extends NishElement {
  static override properties = {
    values: {
      attribute: 'values',
      reflect: true,
      converter: {
        fromAttribute: (v: string | null) => parseValues(v),
        toAttribute: (v: (number | null)[]) => v.map((n) => (n == null ? '' : String(n))).join(','),
      },
    },
    tone: { type: String, reflect: true },
    label: { type: String, reflect: true },
    width: { type: Number, reflect: true },
    height: { type: Number, reflect: true },
    fill: { type: Boolean, reflect: true },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
  };

  declare values: (number | null)[];
  declare tone: string;
  declare label: string;
  declare width: number;
  declare height: number;
  declare fill: boolean;
  declare min: number | undefined;
  declare max: number | undefined;

  constructor() {
    super();
    this.values = [];
    this.tone = 'chart-1';
    this.label = '';
    this.width = 120;
    this.height = 28;
    this.fill = false;
  }

  protected override render(): TemplateResult | typeof nothing {
    const values = Array.isArray(this.values) ? this.values : [];
    if (values.length < 2) return nothing;
    const width = this.width > 0 ? this.width : 120;
    const height = this.height > 0 ? this.height : 28;
    const { empty, lines, areas, baseline } = sparklineGeometry(values, width, height, this.min ?? undefined, this.max ?? undefined);
    const color = empty ? 'var(--nish-line-strong)' : (TONE_COLOR[this.tone] ?? `var(--nish-${this.tone || 'chart-1'})`);
    const name = this.label || 'Trend';
    return html`<svg
      class="nish-sparkline"
      role="img"
      aria-label=${empty ? `${name}: no data` : name}
      width=${width}
      height=${height}
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
      style="color:${color}"
    >
      ${empty
        ? svg`<path d=${baseline} stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"></path>`
        : svg`${this.fill ? areas.map((d) => svg`<path d=${d} fill="currentColor" fill-opacity="0.15"></path>`) : nothing}${lines.map(
            (d) =>
              svg`<path d=${d} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>`,
          )}`}
    </svg>`;
  }
}

define('nish-sparkline', NishSparkline);
