// View math: a view is the world-to-screen transform, screen = world * k + (x, y).

export interface View {
  x: number;
  y: number;
  k: number;
}

export const MIN_K = 0.3;
export const MAX_K = 2;
export const PHONE_K = 0.55;
export const PHONE_MAX_W = 600; // viewports narrower than this keep the readable phone zoom when fit is small
export const FIT_PAD = 48;
export const TITLE_ROOM = 36; // world px above y=0 taken by the column titles
export const LABEL_K = 0.8;
export const ANIM_MS = 300;
export const FOLLOW_MS = 700; // follow mode's fly
export const LOD_K = 0.6; // below this zoom the cards drop their details
export const DOUBLE_MS = 300; // two taps this close make a double-tap
export const DOUBLE_PX = 10;
export const DRAG_PX = 4;
export const KEY_PAN = 48;
export const ZOOM_STEP = 1.25;

export const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k));
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The view after zooming to `k` while keeping the world point under (px, py) fixed. */
export function zoomAround(v: View, k: number, px: number, py: number): View {
  const nk = clampK(k);
  const r = nk / v.k;
  return { k: nk, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}

export function centerOn(w: number, h: number, k: number, box: { x: number; y: number; w: number; h: number }): View {
  return { k, x: w / 2 - (box.x + box.w / 2) * k, y: h / 2 - (box.y + box.h / 2) * k };
}
