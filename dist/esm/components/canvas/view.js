// src/components/canvas/view.ts
var MIN_K = 0.3;
var MAX_K = 2;
var PHONE_K = 0.55;
var PHONE_MAX_W = 600;
var FIT_PAD = 48;
var TITLE_ROOM = 36;
var LABEL_K = 0.8;
var ANIM_MS = 300;
var FOLLOW_MS = 700;
var LOD_K = 0.6;
var DOUBLE_MS = 300;
var DOUBLE_PX = 10;
var DRAG_PX = 4;
var KEY_PAN = 48;
var ZOOM_STEP = 1.25;
var clampK = (k) => Math.min(MAX_K, Math.max(MIN_K, k));
var ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function zoomAround(v, k, px, py) {
  const nk = clampK(k);
  const r = nk / v.k;
  return { k: nk, x: px - (px - v.x) * r, y: py - (py - v.y) * r };
}
function centerOn(w, h, k, box) {
  return { k, x: w / 2 - (box.x + box.w / 2) * k, y: h / 2 - (box.y + box.h / 2) * k };
}
export {
  ANIM_MS,
  DOUBLE_MS,
  DOUBLE_PX,
  DRAG_PX,
  FIT_PAD,
  FOLLOW_MS,
  KEY_PAN,
  LABEL_K,
  LOD_K,
  MAX_K,
  MIN_K,
  PHONE_K,
  PHONE_MAX_W,
  TITLE_ROOM,
  ZOOM_STEP,
  centerOn,
  clampK,
  ease,
  zoomAround
};
