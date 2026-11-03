import { html, nothing, svg, type TemplateResult } from 'lit';
import { define } from './base';
import { getStrings } from './strings';
import { CHROME, NishChartBase, SR_ONLY, jsonList, normalizeBars, parseFormat, toneColor } from './chart-format';

const BAR_TOP = 18;
const BAR_BOTTOM = 22;

/** `<nish-bar-chart label="Visits" data='[{"label":"Mon","value":3}]'>`: a dependency-free SVG bar
 *  chart that fills its width, like React `BarChart`. Attributes: `data` (JSON: `[{label, value}]`,
 *  `[[label, value]]` or plain numbers), `label` (required, the accessible name), `height` (default
 *  140), `tone` (default chart-1), `y-format` (formats values above the bars and in the caption),
 *  `x-format` (formats labels that are numbers), `x-ticks` (`ends`, the default, or `all`),
 *  `show-values` (print every value; without it only touch screens do) and `empty` (default "No
 *  data yet"). Hover, tap or Left/Right keys select a bar and show "label: value" under the chart.
 *  `data` is also a property. */
export class NishBarChart extends NishChartBase {
  static override properties = {
    ...NishChartBase.properties,
    data: { converter: jsonList },
    xTicks: { type: String, attribute: 'x-ticks', reflect: true },
    showValues: { type: Boolean, attribute: 'show-values', reflect: true },
    selected: { state: true },
    coarse: { state: true },
  };

  declare data: unknown[];
  declare xTicks: string;
  declare showValues: boolean;
  declare selected: number | null;
  declare coarse: boolean;

  private mq: MediaQueryList | null = null;
  private readonly onCoarse = (): void => {
    this.coarse = !!this.mq?.matches;
  };

  constructor() {
    super();
    this.data = [];
    this.height = 140;
    this.xTicks = 'ends';
    this.showValues = false;
    this.selected = null;
    this.coarse = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mq = window.matchMedia('(pointer: coarse)');
      this.coarse = this.mq.matches;
      this.mq.addEventListener('change', this.onCoarse);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.mq?.removeEventListener('change', this.onCoarse);
    this.mq = null;
  }

  protected override render(): TemplateResult {
    const str = getStrings();
    const label = this.label;
    const height = this.height > 0 ? this.height : 140;
    const data = normalizeBars(this.data);
    const valueFormat = parseFormat(this.yFormat);
    const labelFormat = parseFormat(this.xFormat, (v) => String(v));
    const labelText = (l: string) => (this.xFormat && l.trim() !== '' && Number.isFinite(Number(l)) ? labelFormat(Number(l)) : l);

    if (!data.length) {
      return html`<div class="nish-chart">
        <div class="nish-empty" role="img" aria-label=${str.noDataNamed(label)} style="height:${height}px;box-sizing:border-box">${this.empty || str.noDataYet}</div>
      </div>`;
    }

    const width = this.width;
    const color = toneColor(this.tone, 0);
    const values = data.map((d) => (Number.isFinite(d.value) ? d.value : 0));
    const vMax = Math.max(0, ...values);
    const vMin = Math.min(0, ...values);
    const span = vMax - vMin || 1;
    const plotH = Math.max(0, height - BAR_TOP - BAR_BOTTOM);
    const zeroY = BAR_TOP + (vMax / span) * plotH;
    const band = width / data.length;
    const barW = Math.max(1, band * 0.72);
    const always = this.showValues;
    const printValues = always || this.coarse;
    const all = this.xTicks === 'all';
    const sel = this.selected != null && this.selected < data.length ? this.selected : null;

    const pick = (e: PointerEvent) => {
      const rect = (e.currentTarget as Element).getBoundingClientRect();
      const i = Math.floor(((e.clientX - rect.left) / (rect.width || 1)) * data.length);
      this.selected = Math.min(data.length - 1, Math.max(0, i));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const s = this.selected;
        this.selected = s == null ? (dir > 0 ? 0 : data.length - 1) : Math.min(data.length - 1, Math.max(0, s + dir));
      } else if (e.key === 'Escape') this.selected = null;
    };

    const chart =
      width > 0
        ? html`<svg
            width=${width}
            height=${height}
            role="img"
            tabindex="0"
            aria-label=${label}
            style="display:block;touch-action:pan-y"
            @pointerdown=${pick}
            @pointermove=${(e: PointerEvent) => {
              if (e.pointerType === 'mouse' || e.buttons) pick(e);
            }}
            @pointerleave=${(e: PointerEvent) => {
              if (e.pointerType === 'mouse') this.selected = null;
            }}
            @keydown=${onKey}
          >
            <line class="nish-chart-grid" x1="0" x2=${width} y1=${zeroY} y2=${zeroY} stroke=${CHROME.grid} stroke-width="1"></line>
            ${values.map((v, i) => {
              const h = Math.max(2, (Math.abs(v) / span) * plotH);
              const y = v < 0 ? zeroY : zeroY - h;
              const x = i * band + (band - barW) / 2;
              const isSel = sel === i;
              const showVal = isSel || (printValues && (always || band >= 26));
              return svg`<g>
                <rect x=${x} y=${y} width=${barW} height=${h} rx="2" fill=${color} opacity=${sel == null || isSel ? 1 : 0.55}></rect>
                ${showVal
                  ? svg`<text class="nish-chart-axis" x=${x + barW / 2} y=${v < 0 ? y + h + 11 : Math.max(11, y - 4)} text-anchor="middle" font-size="11" fill=${CHROME.text} style="font-variant-numeric:tabular-nums">${valueFormat(v)}</text>`
                  : nothing}
              </g>`;
            })}
            ${data.map((d, i) => {
              if (!(all || i === 0 || i === data.length - 1)) return nothing;
              const anchor = all ? 'middle' : i === 0 ? 'start' : 'end';
              const x = all ? i * band + band / 2 : i === 0 ? 0 : width;
              return svg`<text class="nish-chart-axis" x=${x} y=${height - 6} text-anchor=${anchor} font-size="11" fill=${CHROME.text}>${labelText(d.label)}</text>`;
            })}
          </svg>`
        : nothing;

    return html`<div class="nish-chart" style="position:relative;width:100%">
      ${chart}
      <div aria-live="polite" style="margin-top:4px;min-height:20px;font-size:14px;font-variant-numeric:tabular-nums;color:var(--nish-hi2)">${sel != null ? `${labelText(data[sel].label)}: ${valueFormat(values[sel])}` : ''}</div>
      <table style=${SR_ONLY}>
        <caption>${label}</caption>
        <tbody>
          ${data.map((d, i) => html`<tr><th scope="row">${labelText(d.label)}</th><td>${valueFormat(values[i])}</td></tr>`)}
        </tbody>
      </table>
    </div>`;
  }
}

define('nish-bar-chart', NishBarChart);
