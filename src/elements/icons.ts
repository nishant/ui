const SVG_NS = 'http://www.w3.org/2000/svg';

/** A 24-grid line icon built with createElementNS (no innerHTML, so Trusted Types pages allow it). */
export function lineIcon(size: number, paths: string[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  for (const [k, v] of Object.entries({
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  })) {
    svg.setAttribute(k, v);
  }
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

export const xIcon = (size: number): SVGSVGElement => lineIcon(size, ['M18 6 6 18M6 6l12 12']);
export const funnelIcon = (size: number): SVGSVGElement => lineIcon(size, ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z']);
