// nish-ui/system-canvas: the SystemCanvas and its layout and routing helpers on their own, so an app can load
// the canvas in a lazy chunk without pulling the rest of the component set into it.
// Fleet-only: built for the nish.software apps, may change in a minor release.
export * from './components/canvas';
export { DEFAULT_CANVAS_LABELS } from './components/canvas/types';
