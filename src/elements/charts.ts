// nish-ui/elements/charts: <nish-line-chart> and <nish-bar-chart>, for pages without React.
// Importing this file registers both tags (a tag that is already defined is skipped).
// Self-contained: it needs no other element file.
import { NishBarChart } from './bar-chart';
import { NishLineChart } from './line-chart';

export { NishElement, define } from './base';
export { NishBarChart, NishLineChart };

declare global {
  interface HTMLElementTagNameMap {
    'nish-line-chart': NishLineChart;
    'nish-bar-chart': NishBarChart;
  }
}
