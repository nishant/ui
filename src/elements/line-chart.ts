import { html, nothing, svg, type TemplateResult } from 'lit';
import { define } from './base';
import { getStrings } from './strings';
import {
  CHROME,
  NishChartBase,
  SR_ONLY,
  jsonList,
  nearestIndex,
  nextId,
  normalizePoints,
  normalizeSeries,
  paddedRange,
  parseFormat,
  ticksBetween,
  toneColor,
  type LineSeries,
} from './chart-format';

const PAD_TOP = 10;
const PAD_BOTTOM = 24;
const PAD_RIGHT = 12;

const TIP_STYLE =
  'position:absolute;top:4px;z-index:10;pointer-events:none;white-space:nowrap;padding:4px 8px;font-variant-numeric:tabular-nums;' +
  'background:var(--nish-elevated);border:1px solid var(--nish-line-strong);border-radius:var(--nish-radius-sm);box-shadow:var(--nish-shadow-pop);color:var(--nish-hi);font-size:12px';

/** `<nish-line-chart label="Latency" data='[{"x":1,"y":3},{"x":2,"y":5}]'>`: a dependency-free SVG
 *  line chart that fills its width, with the scales, ticks, colors and tooltip of React `LineChart`.
 *  Attributes: `data` (JSON: `[{x,y}]`, `[[x,y]]` or plain numbers, whose x is the index; a null y
 *  leaves a gap), `series` (JSON `[{label, tone?, points}]`, drawn with a `.nish-legend`), `label`
 *  (required, the accessible name), `height` (default 200), `tone` (chart-1 to chart-8, ok, warn,
 *  loss, info, accent), `area`, `baseline`, `y-ticks` / `x-ticks` (default 4), `y-format` /
 *  `x-format` (`number`, `percent`, `currency:USD`, `date`, `time`) and `empty` (default "No data
 *  yet"). Hover, touch-drag or Left/Right keys move a crosshair with a tooltip. `data` and `series`
 *  are also properties. */
export class NishLineChart extends NishChartBase {
  static override properties = {
    ...NishChartBase.properties,
    data: { converter: jsonList },
    series: { converter: jsonList },
    area: { type: Boolean, reflect: true },
    baseline: { type: Number, reflect: true },
    yTicks: { type: Number, attribute: 'y-ticks', reflect: true },
    xTicks: { type: Number, attribute: 'x-ticks', reflect: true },
    active: { state: true },
  };

  declare data: unknown[];
  declare series: unknown[];
  declare area: boolean;
  declare baseline: number | undefined;
  declare yTicks: number;
  declare xTicks: number;
  declare active: number | null;

  private fromKey = false;
  private listening = false;
  private readonly gradId = nextId();

  constructor() {
    super();
    this.data = [];
    this.series = [];
    this.area = false;
    this.height = 200;
    this.yTicks = 4;
    this.xTicks = 4;
    this.active = null;
  }

  private readonly onDocPointerDown = (e: PointerEvent): void => {
    if (!this.contains(e.target as Node)) this.active = null;
  };

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopListening();
  }

  private stopListening(): void {
    if (!this.listening) return;
    document.removeEventListener('pointerdown', this.onDocPointerDown);
    this.listening = false;
  }

  protected override updated(): void {
    // A touch-pinned tooltip clears when the next pointer lands outside the chart.
    if (this.active != null && !this.listening) {
      document.addEventListener('pointerdown', this.onDocPointerDown);
      this.listening = true;
    } else if (this.active == null) this.stopListening();
  }

  private lines(): LineSeries[] {
    const many = normalizeSeries(this.series);
    if (many.length) return many;
    const points = normalizePoints(this.data);
    return points.length ? [{ label: this.label, tone: this.tone || undefined, points }] : [];
  }

  private moveTo(clientX: number, el: Element, xs: number[], padLeft: number, plotW: number, xMin: number, xMax: number): void {
    const rect = el.getBoundingClientRect();
    const x = xMin + ((clientX - rect.left - padLeft) / (plotW || 1)) * (xMax - xMin);
    this.active = nearestIndex(xs, x);
  }

  protected override render(): TemplateResult {
    const str = getStrings();
    const label = this.label;
    const height = this.plotHeight;
    const lines = this.lines();
    const yFormat = parseFormat(this.yFormat);
    const xFormat = parseFormat(this.xFormat);

    // Sorted unique x values across every series: the positions the crosshair snaps to.
    const valid = (p: { x: number; y: number | null }) => p.y != null && Number.isFinite(p.y) && Number.isFinite(p.x);
    const xset = new Set<number>();
    for (const s of lines) for (const p of s.points) if (valid(p)) xset.add(p.x);
    const xs = [...xset].sort((a, b) => a - b);

    if (!xs.length) {
      return html`<div class="nish-chart">
        <div class="nish-empty" role="img" aria-label=${str.noDataNamed(label)} style="height:${height}px;box-sizing:border-box">${this.empty || str.noDataYet}</div>
      </div>`;
    }

    const lookup = lines.map((s) => new Map(s.points.filter(valid).map((p) => [p.x, p.y as number])));

    let yMin = Infinity;
    let yMax = -Infinity;
    for (const s of lines)
      for (const p of s.points)
        if (valid(p)) {
          yMin = Math.min(yMin, p.y as number);
          yMax = Math.max(yMax, p.y as number);
        }
    const baseline = this.baseline != null && Number.isFinite(this.baseline) ? this.baseline : undefined;
    if (baseline !== undefined) {
      yMin = Math.min(yMin, baseline);
      yMax = Math.max(yMax, baseline);
    }
    [yMin, yMax] = paddedRange(yMin, yMax);
    const xMin = xs[0];
    const xMax = xs[xs.length - 1] === xMin ? xMin + 1 : xs[xs.length - 1];

    const width = this.width;
    const yLabels = ticksBetween(yMin, yMax, this.yTicks || 4).map((v) => ({ v, text: yFormat(v) }));
    const padLeft = Math.ceil(Math.max(...yLabels.map((t) => t.text.length)) * 6.6) + 10;
    const plotW = Math.max(0, width - padLeft - PAD_RIGHT);
    const plotH = Math.max(0, height - PAD_TOP - PAD_BOTTOM);
    const sx = (x: number) => padLeft + ((x - xMin) / (xMax - xMin)) * plotW;
    const sy = (y: number) => PAD_TOP + (1 - (y - yMin) / (yMax - yMin)) * plotH;
    const bottom = PAD_TOP + plotH;

    const paths = lines.map((s) => {
      const segs: [number, number][][] = [];
      let cur: [number, number][] = [];
      for (const p of [...s.points].sort((a, b) => a.x - b.x)) {
        if (!valid(p)) {
          if (cur.length) segs.push(cur);
          cur = [];
        } else cur.push([Number(sx(p.x).toFixed(1)), Number(sy(p.y as number).toFixed(1))]);
      }
      if (cur.length) segs.push(cur);
      return segs;
    });
    const pts = (seg: [number, number][]) => seg.map((p) => `${p[0]},${p[1]}`).join(' ');

    const xCount = Math.min(this.xTicks || 4, Math.max(2, Math.floor(plotW / 72)));
    const xLabels = ticksBetween(xMin, xMax, xCount);

    const active = this.active != null && this.active < xs.length ? this.active : null;
    const ax = active != null ? xs[active] : null;
    const cx = ax != null ? sx(ax) : 0;
    const tipRows = ax != null ? lines.map((s, i) => ({ s, i, y: lookup[i].get(ax) })).filter((r) => r.y != null) : [];
    const tipRight = cx < width / 2;

    const onPointer = (e: PointerEvent) => {
      this.fromKey = false;
      this.moveTo(e.clientX, e.currentTarget as Element, xs, padLeft, plotW, xMin, xMax);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.fromKey = true;
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const a = this.active;
        this.active = a == null ? (dir > 0 ? 0 : xs.length - 1) : Math.min(xs.length - 1, Math.max(0, a + dir));
      } else if (e.key === 'Escape') this.active = null;
    };

    const first = lines[0];
    const gradColor = toneColor(first?.tone, 0);

    const chart =
      width > 0
        ? html`<svg
            width=${width}
            height=${height}
            role="img"
            tabindex="0"
            aria-label=${label}
            style="display:block;touch-action:pan-y"
            @pointerdown=${onPointer}
            @pointermove=${onPointer}
            @pointerleave=${(e: PointerEvent) => {
              if (e.pointerType === 'mouse') this.active = null;
            }}
            @keydown=${onKey}
            @blur=${() => {
              if (this.fromKey) this.active = null;
            }}
          >
            ${this.area && first
              ? svg`<defs><linearGradient id=${this.gradId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color=${gradColor} stop-opacity="0.2"></stop><stop offset="100%" stop-color=${gradColor} stop-opacity="0"></stop></linearGradient></defs>`
              : nothing}
            ${yLabels.map(
              (t) => svg`<g>
                <line class="nish-chart-grid" x1=${padLeft} x2=${padLeft + plotW} y1=${sy(t.v)} y2=${sy(t.v)} stroke=${CHROME.grid} stroke-width="1"></line>
                <text class="nish-chart-axis" x=${padLeft - 6} y=${sy(t.v)} text-anchor="end" dominant-baseline="middle" font-size="11" fill=${CHROME.text} style="font-variant-numeric:tabular-nums">${t.text}</text>
              </g>`,
            )}
            ${xLabels.map(
              (v, i) =>
                svg`<text class="nish-chart-axis" x=${sx(v)} y=${height - 6} text-anchor=${i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'} font-size="11" fill=${CHROME.text} style="font-variant-numeric:tabular-nums">${xFormat(v)}</text>`,
            )}
            ${baseline !== undefined
              ? svg`<line x1=${padLeft} x2=${padLeft + plotW} y1=${sy(baseline)} y2=${sy(baseline)} stroke=${CHROME.zero} stroke-width="1" stroke-dasharray="4 4"></line>`
              : nothing}
            ${this.area
              ? (paths[0] ?? []).map(
                  (seg) => svg`<polygon points="${seg[0][0]},${bottom} ${pts(seg)} ${seg[seg.length - 1][0]},${bottom}" fill="url(#${this.gradId})"></polygon>`,
                )
              : nothing}
            ${paths.map((segs, si) =>
              segs.map((seg) =>
                seg.length === 1
                  ? svg`<circle cx=${seg[0][0]} cy=${seg[0][1]} r="2" fill=${toneColor(lines[si].tone, si)}></circle>`
                  : svg`<polyline points=${pts(seg)} fill="none" stroke=${toneColor(lines[si].tone, si)} stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></polyline>`,
              ),
            )}
            ${ax != null
              ? svg`<g pointer-events="none">
                  <line x1=${cx} x2=${cx} y1=${PAD_TOP} y2=${bottom} stroke=${CHROME.axis} stroke-width="1"></line>
                  ${tipRows.map((r) => svg`<circle cx=${cx} cy=${sy(r.y as number)} r="4" fill=${toneColor(r.s.tone, r.i)} stroke="var(--nish-surface)" stroke-width="2"></circle>`)}
                </g>`
              : nothing}
          </svg>`
        : nothing;

    const tooltip =
      ax != null && width > 0
        ? html`<div class="nish-chart-tooltip" style="${TIP_STYLE};${tipRight ? `left:${cx + 10}px` : `right:${width - cx + 10}px`}">
            <div style="color:var(--nish-hi3)">${xFormat(ax)}</div>
            ${tipRows.map(
              (r) => html`<div style="display:flex;align-items:center;gap:6px">
                <span aria-hidden="true" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${toneColor(r.s.tone, r.i)}"></span>
                ${lines.length > 1 ? html`<span style="color:var(--nish-hi3)">${r.s.label}</span>` : nothing}
                <span style="font-weight:500">${yFormat(r.y as number)}</span>
              </div>`,
            )}
          </div>`
        : nothing;

    return html`<div class="nish-chart" style="position:relative;width:100%;user-select:none">
        <div style="position:relative;height:${height}px">
          ${chart}${tooltip}
          <div aria-live="polite" style=${SR_ONLY}>${this.fromKey && ax != null ? `${xFormat(ax)}: ${tipRows.map((r) => `${lines.length > 1 ? `${r.s.label} ` : ''}${yFormat(r.y as number)}`).join(', ')}` : ''}</div>
          <table style=${SR_ONLY}>
            <caption>${label}</caption>
            <thead>
              <tr>
                <th scope="col">x</th>
                ${lines.map((s) => html`<th scope="col">${s.label}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${xs.slice(0, 200).map(
                (x) => html`<tr>
                  <th scope="row">${xFormat(x)}</th>
                  ${lines.map((_, i) => html`<td>${lookup[i].has(x) ? yFormat(lookup[i].get(x) as number) : ''}</td>`)}
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
        ${lines.length > 1
          ? html`<ul class="nish-legend" aria-label=${str.legend}>
              ${lines.map((s, i) => html`<li class="nish-legend-item" style="--c: ${toneColor(s.tone, i)}"><i class="nish-legend-swatch" aria-hidden="true"></i>${s.label}</li>`)}
            </ul>`
          : nothing}
      </div>`;
  }
}

define('nish-line-chart', NishLineChart);
