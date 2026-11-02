// The published types of nish-ui/elements/charts (copied to dist/elements-charts.d.ts by
// tsup.config.ts). Hand-written so the package never imports 'lit' (a devDependency) and every
// element stays an HTMLElement for consumers. Keep it in step with the classes in this folder.

/** Base of every nish-ui element (light DOM). */
export declare class NishElement extends HTMLElement {
  readonly updateComplete: Promise<boolean>;
  requestUpdate(): void;
}

/** Register a custom element unless the tag is already defined. */
export declare function define(tag: string, ctor: CustomElementConstructor): void;

declare class NishChartBase extends NishElement {
  /** The chart's `aria-label` (required). */
  label: string;
  /** Plot height in pixels (200 when unset). */
  height: number;
  /** A color tone such as `chart-2`, `ok` or `loss`. */
  tone: string;
  /** Text shown when there is no data (default "No data yet"). */
  empty: string;
  /** `number`, `percent`, `currency:USD`, `date` or `time`. */
  yFormat: string;
  xFormat: string;
}

export declare class NishLineChart extends NishChartBase {
  /** `[{x,y}]`, `[[x,y]]` or plain numbers. A JSON attribute or a property. */
  data: unknown[];
  /** Several lines. Two or more draw a legend. A JSON attribute or a property. */
  series: unknown[];
  area: boolean;
  baseline: number | undefined;
  yTicks: number;
  xTicks: number;
}

export declare class NishBarChart extends NishChartBase {
  /** `[{label,value}]`, `[[label,value]]` or plain numbers. A JSON attribute or a property. */
  data: unknown[];
  /** `ends` or `all`. */
  xTicks: string;
  /** Print every value on its bar (touch screens do by default). */
  showValues: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'nish-line-chart': NishLineChart;
    'nish-bar-chart': NishBarChart;
  }
}
