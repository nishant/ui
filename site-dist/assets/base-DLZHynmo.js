var e=`/* Page-level defaults every nish.software site shares. Plain CSS so static pages can\r
   link it; Tailwind apps get it through tailwind.css inside the base layer, so any\r
   utility class still wins. */\r
\r
html {\r
  background-color: var(--nish-bg);\r
  color: var(--nish-hi);\r
  font-family: var(--nish-font-sans);\r
  -webkit-font-smoothing: antialiased;\r
  -moz-osx-font-smoothing: grayscale;\r
  text-rendering: optimizeLegibility;\r
  -webkit-text-size-adjust: 100%;\r
  -webkit-tap-highlight-color: transparent;\r
}\r
\r
/* Layout contract. Bars publish their height on <html> (--nish-header-h,\r
   --nish-bottom-nav-h, --nish-bottom-bar-h); everything that must clear them reads\r
   --nish-bottom-inset or --nish-header-h. */\r
:root {\r
  --nish-page-gutter: 1rem;\r
  --nish-header-h: 0px;\r
  --nish-bottom-inset: calc(var(--nish-bottom-nav-h, 0px) + var(--nish-bottom-bar-h, 0px));\r
}\r
@media (min-width: 640px) {\r
  :root {\r
    --nish-page-gutter: 1.5rem;\r
  }\r
}\r
/* Desktop scrollbars: reserve the gutter so the page does not shift when a dialog\r
   hides the page scroll. */\r
@media (hover: hover) and (pointer: fine) {\r
  html {\r
    scrollbar-gutter: stable;\r
  }\r
}\r
/* Anchor targets stop below the sticky header (and a sticky sub-bar). */\r
.nish-scroll-target {\r
  scroll-margin-top: calc(var(--nish-header-h, 0px) + var(--nish-sticky-extra, 0px) + 0.5rem);\r
}\r
/* Horizontal overflow fade, driven by data-at-start / data-at-end on the scroller. */\r
.nish-scroll-fade {\r
  --nish-fade-start: #000;\r
  --nish-fade-end: #000;\r
  mask-image: linear-gradient(to right, var(--nish-fade-start), #000 24px, #000 calc(100% - 24px), var(--nish-fade-end));\r
  -webkit-mask-image: linear-gradient(to right, var(--nish-fade-start), #000 24px, #000 calc(100% - 24px), var(--nish-fade-end));\r
}\r
.nish-scroll-fade[data-at-start='false'] {\r
  --nish-fade-start: transparent;\r
}\r
.nish-scroll-fade[data-at-end='false'] {\r
  --nish-fade-end: transparent;\r
}\r
.nish-no-scrollbar {\r
  scrollbar-width: none;\r
}\r
.nish-no-scrollbar::-webkit-scrollbar {\r
  display: none;\r
}\r
/* Bottom padding that clears bottom bars (the nav already includes the safe area). */\r
.nish-pad-bottom-inset {\r
  padding-bottom: max(calc(var(--nish-bottom-inset) + 1rem), calc(1rem + env(safe-area-inset-bottom)));\r
}\r
\r
/* A theme scoped to part of a page (<div data-theme="light" data-scheme="light">):\r
   the tokens are re-declared there by tokens.css, but inherited text color was\r
   computed on html, so set it again. Zero specificity, so any class still wins. */\r
:where([data-theme]:not(html)) {\r
  background-color: var(--nish-bg);\r
  color: var(--nish-hi);\r
}\r
\r
/* Numbers in tables line up as columns without per-cell classes. */\r
table,\r
.nish-tabular {\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
::selection {\r
  background: color-mix(in srgb, var(--nish-accent) 30%, transparent);\r
}\r
\r
/* One keyboard-focus language everywhere. Components that draw their own focus\r
   style still win; this is the fallback for everything that never thought about it. */\r
:focus-visible {\r
  outline: var(--nish-focus-width) solid var(--nish-focus);\r
  outline-offset: var(--nish-focus-offset);\r
}\r
\r
/* Recharts 3's accessibility layer makes the chart focusable, so a tap or click\r
   focused it and drew a thick box round the whole plot. Pointer focus draws nothing;\r
   keyboard focus gets a quiet accent ring. */\r
.recharts-wrapper,\r
.recharts-wrapper :focus {\r
  outline: none;\r
}\r
.recharts-wrapper:focus-visible,\r
.recharts-wrapper :focus-visible {\r
  outline: 1px solid color-mix(in srgb, var(--nish-accent) 45%, transparent);\r
  outline-offset: 2px;\r
  border-radius: var(--nish-radius-sm);\r
}\r
/* Recharts' default hover cursor is a #ccc slab (bars) or line, bright on dark themes.\r
   CSS beats the fill/stroke attributes Recharts writes, so every chart gets a quiet one. */\r
.recharts-rectangle.recharts-tooltip-cursor {\r
  fill: color-mix(in srgb, var(--nish-hi3) 14%, transparent);\r
}\r
.recharts-curve.recharts-tooltip-cursor {\r
  stroke: var(--nish-line-strong);\r
}\r
\r
/* Browser-default scrollbars clash with every theme, worst on light. */\r
* {\r
  scrollbar-width: thin;\r
  scrollbar-color: var(--nish-line-strong) transparent;\r
}\r
::-webkit-scrollbar {\r
  width: 10px;\r
  height: 10px;\r
}\r
::-webkit-scrollbar-track {\r
  background: transparent;\r
}\r
::-webkit-scrollbar-thumb {\r
  background: var(--nish-line-strong);\r
  border-radius: 8px;\r
  border: 2px solid transparent;\r
  background-clip: padding-box;\r
}\r
::-webkit-scrollbar-thumb:hover {\r
  background: var(--nish-ghost);\r
  border: 2px solid transparent;\r
  background-clip: padding-box;\r
}\r
\r
/* The "← nish.software" pill every subdomain carries at the top left of its header:\r
   <a class="nish-pill-link" href="https://nish.software" title="Back to nish.software">← nish.software</a> */\r
.nish-pill-link {\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  font-family: var(--nish-font-sans);\r
  font-size: 14px;\r
  line-height: 1.2;\r
  color: var(--nish-hi2);\r
  text-decoration: none;\r
  min-height: 44px;\r
  padding: 4px 12px;\r
  border: 1px solid var(--nish-line);\r
  border-radius: 999px;\r
  white-space: nowrap;\r
  box-sizing: border-box;\r
  flex-shrink: 0;\r
}\r
.nish-pill-link:hover {\r
  color: var(--nish-hi);\r
  border-color: var(--nish-line-strong);\r
}\r
/* Compact form for crowded headers: under 480px only the arrow shows, in a 44px circle,\r
   and the words stay for screen readers. data-compact="always" keeps it compact at every\r
   width.\r
   <a class="nish-pill-link nish-pill-link--compact" href="https://nish.software"\r
      title="Back to nish.software">&larr; <span class="nish-pill-link-label">nish.software</span></a> */\r
@media (max-width: 480px) {\r
  .nish-pill-link--compact {\r
    min-width: var(--nish-tap-min, 44px);\r
    justify-content: center;\r
    padding-inline: 6px;\r
  }\r
  .nish-pill-link--compact .nish-pill-link-label {\r
    position: absolute;\r
    width: 1px;\r
    height: 1px;\r
    overflow: hidden;\r
    clip-path: inset(50%);\r
    white-space: nowrap;\r
  }\r
}\r
.nish-pill-link--compact[data-compact='always'] {\r
  min-width: var(--nish-tap-min, 44px);\r
  justify-content: center;\r
  padding-inline: 6px;\r
}\r
.nish-pill-link--compact[data-compact='always'] .nish-pill-link-label {\r
  position: absolute;\r
  width: 1px;\r
  height: 1px;\r
  overflow: hidden;\r
  clip-path: inset(50%);\r
  white-space: nowrap;\r
}\r
\r
/* Scrolls, but draws no scrollbar: tab strips, chip rows, carousels. */\r
.scrollbar-none {\r
  scrollbar-width: none;\r
  -ms-overflow-style: none;\r
}\r
.scrollbar-none::-webkit-scrollbar {\r
  display: none;\r
}\r
\r
/* First thing in <body>: <a class="nish-skip-link" href="#main">Skip to content</a>.\r
   Parked above the top edge (still read by screen readers) until a keyboard user tabs\r
   to it, then a pill at the top left. */\r
.nish-skip-link {\r
  position: fixed;\r
  top: var(--nish-space-2);\r
  left: var(--nish-space-2);\r
  z-index: var(--nish-z-tooltip);\r
  transform: translateY(calc(-100% - var(--nish-space-4)));\r
  opacity: 0;\r
  pointer-events: none;\r
  white-space: nowrap;\r
  display: inline-flex;\r
  align-items: center;\r
  min-height: var(--nish-tap-min);\r
  padding: 0 var(--nish-space-4);\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
  box-shadow: var(--nish-shadow-pop);\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  text-decoration: none;\r
}\r
.nish-skip-link:focus,\r
.nish-skip-link:focus-visible {\r
  transform: none;\r
  opacity: 1;\r
  pointer-events: auto;\r
}\r
\r
/* Keyboard keys in running text and shortcut hints. The Kbd component adds sizes. */\r
kbd {\r
  font-family: var(--nish-font-mono);\r
  font-size: 0.85em;\r
  padding: 0 0.35em;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-xs);\r
  background: var(--nish-elevated);\r
  color: inherit;\r
  white-space: nowrap;\r
}\r
\r
/* Notches and home indicators on installed PWAs. */\r
.nish-safe-area {\r
  padding-top: env(safe-area-inset-top);\r
  padding-bottom: env(safe-area-inset-bottom);\r
  padding-left: env(safe-area-inset-left);\r
  padding-right: env(safe-area-inset-right);\r
}\r
\r
.nish-skeleton {\r
  position: relative;\r
  overflow: hidden;\r
  background: var(--nish-elevated);\r
}\r
.nish-skeleton::after {\r
  content: '';\r
  position: absolute;\r
  inset: 0;\r
  transform: translateX(-100%);\r
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--nish-overlay) 70%, transparent), transparent);\r
  animation: nish-sheen 1.4s infinite;\r
}\r
\r
@keyframes nish-sheen {\r
  100% {\r
    transform: translateX(100%);\r
  }\r
}\r
@keyframes nish-sheet-out {\r
  from {\r
    transform: translateY(0);\r
  }\r
  to {\r
    transform: translateY(100%);\r
  }\r
}\r
@keyframes nish-fade-out {\r
  from {\r
    opacity: 1;\r
  }\r
  to {\r
    opacity: 0;\r
  }\r
}\r
@keyframes nish-toast-in-top {\r
  from {\r
    transform: translateY(-8px);\r
    opacity: 0;\r
  }\r
  to {\r
    transform: none;\r
    opacity: 1;\r
  }\r
}\r
@keyframes nish-bar-in {\r
  from {\r
    transform: translateY(100%);\r
  }\r
  to {\r
    transform: translateY(0);\r
  }\r
}\r
/* Indeterminate progress: a 40% wide stripe sweeping across (the stripe is the element). */\r
@keyframes nish-loading-bar {\r
  from {\r
    transform: translateX(-100%);\r
  }\r
  to {\r
    transform: translateX(250%);\r
  }\r
}\r
@keyframes nish-pulse {\r
  50% {\r
    opacity: 0.35;\r
  }\r
}\r
@keyframes nish-fade-in {\r
  from {\r
    opacity: 0;\r
  }\r
  to {\r
    opacity: 1;\r
  }\r
}\r
@keyframes nish-rise-in {\r
  from {\r
    opacity: 0;\r
    transform: translateY(6px);\r
  }\r
  to {\r
    opacity: 1;\r
    transform: translateY(0);\r
  }\r
}\r
@keyframes nish-sheet-in {\r
  from {\r
    transform: translateY(100%);\r
  }\r
  to {\r
    transform: translateY(0);\r
  }\r
}\r
/* Drawers: from the right edge (side="right") or the left (side="left"). */\r
@keyframes nish-slide-in-right {\r
  from {\r
    transform: translateX(100%);\r
  }\r
  to {\r
    transform: translateX(0);\r
  }\r
}\r
@keyframes nish-slide-in-left {\r
  from {\r
    transform: translateX(-100%);\r
  }\r
  to {\r
    transform: translateX(0);\r
  }\r
}\r
\r
/* Flow components (FlowSteps, StepBar, AgentNode, WorkflowBoard, ActivityFeed,\r
   TickerText, AnimatedList; src/components/flow.tsx). Layout rules always apply; every\r
   rule that moves, loops or fades sits inside prefers-reduced-motion: no-preference, so\r
   under reduced motion state changes are instant and nothing loops. */\r
\r
/* The comet on a running AgentNode turns this angle. Where @property is unsupported the\r
   angle stays 0 and the border is a static accent border. */\r
@property --nish-flow-angle {\r
  syntax: '<angle>';\r
  inherits: false;\r
  initial-value: 0deg;\r
}\r
\r
@keyframes nish-flow-spin {\r
  to {\r
    transform: rotate(360deg);\r
  }\r
}\r
@keyframes nish-flow-ripple {\r
  from {\r
    transform: scale(1);\r
    opacity: 0.45;\r
  }\r
  to {\r
    transform: scale(1.9);\r
    opacity: 0;\r
  }\r
}\r
@keyframes nish-flow-draw {\r
  from {\r
    stroke-dashoffset: 1;\r
  }\r
  to {\r
    stroke-dashoffset: 0;\r
  }\r
}\r
@keyframes nish-flow-pop {\r
  0% {\r
    transform: scale(0.7);\r
  }\r
  60% {\r
    transform: scale(1.12);\r
  }\r
  100% {\r
    transform: scale(1);\r
  }\r
}\r
@keyframes nish-flow-shake {\r
  0%,\r
  100% {\r
    transform: translateX(0);\r
  }\r
  20% {\r
    transform: translateX(-4px);\r
  }\r
  40% {\r
    transform: translateX(4px);\r
  }\r
  60% {\r
    transform: translateX(-3px);\r
  }\r
  80% {\r
    transform: translateX(2px);\r
  }\r
}\r
@keyframes nish-flow-enter {\r
  from {\r
    opacity: 0;\r
    transform: translateY(12px) scale(0.98);\r
  }\r
  to {\r
    opacity: 1;\r
    transform: none;\r
  }\r
}\r
@keyframes nish-flow-exit {\r
  from {\r
    opacity: 1;\r
    transform: none;\r
    grid-template-rows: 1fr;\r
  }\r
  to {\r
    opacity: 0;\r
    transform: translateY(-8px) scale(0.96);\r
    grid-template-rows: 0fr;\r
  }\r
}\r
@keyframes nish-flow-feed-in {\r
  from {\r
    opacity: 0;\r
    transform: translateY(-6px);\r
    grid-template-rows: 0fr;\r
  }\r
  to {\r
    opacity: 1;\r
    transform: none;\r
    grid-template-rows: 1fr;\r
  }\r
}\r
@keyframes nish-flow-flash {\r
  from {\r
    background-color: var(--nish-accent-soft);\r
  }\r
  to {\r
    background-color: transparent;\r
  }\r
}\r
@keyframes nish-flow-dash {\r
  to {\r
    stroke-dashoffset: -6;\r
  }\r
}\r
@keyframes nish-flow-shimmer {\r
  from {\r
    transform: translateX(-100%);\r
  }\r
  to {\r
    transform: translateX(100%);\r
  }\r
}\r
@keyframes nish-flow-shimmer-v {\r
  from {\r
    transform: translateY(-100%);\r
  }\r
  to {\r
    transform: translateY(100%);\r
  }\r
}\r
@keyframes nish-flow-sweep {\r
  from {\r
    transform: scaleX(0);\r
    opacity: 1;\r
  }\r
  to {\r
    transform: scaleX(1);\r
    opacity: 0;\r
  }\r
}\r
@keyframes nish-flow-sweep-v {\r
  from {\r
    transform: scaleY(0);\r
    opacity: 1;\r
  }\r
  to {\r
    transform: scaleY(1);\r
    opacity: 0;\r
  }\r
}\r
@keyframes nish-flow-ticker-in {\r
  from {\r
    opacity: 0;\r
    transform: translateY(70%);\r
  }\r
  to {\r
    opacity: 1;\r
    transform: none;\r
  }\r
}\r
@keyframes nish-flow-ticker-out {\r
  from {\r
    opacity: 1;\r
    transform: none;\r
  }\r
  to {\r
    opacity: 0;\r
    transform: translateY(-70%);\r
  }\r
}\r
@keyframes nish-flow-ring {\r
  to {\r
    --nish-flow-angle: 360deg;\r
  }\r
}\r
@keyframes nish-flow-glow {\r
  0%,\r
  100% {\r
    opacity: 0.25;\r
  }\r
  50% {\r
    opacity: 1;\r
  }\r
}\r
\r
/* --- FlowSteps ------------------------------------------------------------------ */\r
.nish-flow-steps-box {\r
  container-type: inline-size;\r
  min-width: 0;\r
}\r
.nish-flow-steps {\r
  display: flex;\r
  flex-direction: column;\r
  margin: 0;\r
  padding: 0;\r
  list-style: none;\r
}\r
.nish-flow-step {\r
  position: relative;\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 0.75rem;\r
  min-height: 3rem;\r
}\r
.nish-flow-step:last-child {\r
  min-height: 2.75rem;\r
}\r
.nish-flow-node {\r
  position: relative;\r
  flex: none;\r
}\r
.nish-flow-text {\r
  display: flex;\r
  min-width: 0;\r
  flex-direction: column;\r
  padding-top: 0.25rem;\r
  overflow-wrap: anywhere;\r
}\r
.nish-flow-conn {\r
  position: absolute;\r
  top: 2rem;\r
  bottom: 0.25rem;\r
  left: calc(0.875rem - 1px);\r
  width: 2px;\r
  overflow: hidden;\r
  border-radius: 1px;\r
  background-color: var(--nish-line);\r
}\r
.nish-flow-fill,\r
.nish-flow-shimmer,\r
.nish-flow-sweep {\r
  position: absolute;\r
  inset: 0;\r
}\r
.nish-flow-fill {\r
  background-color: var(--nish-ok-fill);\r
  transform-origin: top;\r
  transform: scaleY(0);\r
}\r
.nish-flow-conn[data-on='true'] .nish-flow-fill {\r
  transform: scaleY(1);\r
}\r
.nish-flow-shimmer {\r
  display: none;\r
  background: linear-gradient(180deg, transparent, var(--nish-accent), transparent);\r
}\r
.nish-flow-sweep {\r
  display: none;\r
  transform-origin: top;\r
  background: linear-gradient(180deg, var(--nish-accent), var(--nish-ok-fill));\r
}\r
.nish-flow-arc,\r
.nish-flow-ripple {\r
  display: none;\r
}\r
.nish-flow-arc {\r
  position: absolute;\r
  inset: 0;\r
  pointer-events: none;\r
}\r
.nish-flow-ripple {\r
  position: absolute;\r
  inset: 0;\r
  border-radius: 9999px;\r
  border: 1px solid var(--nish-accent);\r
  pointer-events: none;\r
}\r
.nish-flow-check path {\r
  stroke-dasharray: 1;\r
  stroke-dashoffset: 0;\r
}\r
\r
.nish-flow-steps[data-orient='horizontal'] {\r
  flex-direction: row;\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-step {\r
  min-width: 0;\r
  min-height: 0;\r
  flex: 1 1 0;\r
  flex-direction: column;\r
  align-items: center;\r
  gap: 0.5rem;\r
  padding: 0 0.25rem;\r
  text-align: center;\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-text {\r
  align-items: center;\r
  padding-top: 0;\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-label {\r
  display: -webkit-box;\r
  overflow: hidden;\r
  -webkit-box-orient: vertical;\r
  -webkit-line-clamp: 2;\r
  line-clamp: 2;\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-conn {\r
  top: calc(0.875rem - 1px);\r
  right: calc(-50% + 1.125rem);\r
  bottom: auto;\r
  left: calc(50% + 1.125rem);\r
  width: auto;\r
  height: 2px;\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-fill {\r
  transform-origin: left;\r
  transform: scaleX(0);\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-conn[data-on='true'] .nish-flow-fill {\r
  transform: scaleX(1);\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-shimmer {\r
  background: linear-gradient(90deg, transparent, var(--nish-accent), transparent);\r
}\r
.nish-flow-steps[data-orient='horizontal'] .nish-flow-sweep {\r
  transform-origin: left;\r
  background: linear-gradient(90deg, var(--nish-accent), var(--nish-ok-fill));\r
}\r
@container (min-width: 640px) {\r
  .nish-flow-steps[data-orient='auto'] {\r
    flex-direction: row;\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-step {\r
    min-width: 0;\r
    min-height: 0;\r
    flex: 1 1 0;\r
    flex-direction: column;\r
    align-items: center;\r
    gap: 0.5rem;\r
    padding: 0 0.25rem;\r
    text-align: center;\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-text {\r
    align-items: center;\r
    padding-top: 0;\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-label {\r
    display: -webkit-box;\r
    overflow: hidden;\r
    -webkit-box-orient: vertical;\r
    -webkit-line-clamp: 2;\r
    line-clamp: 2;\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-conn {\r
    top: calc(0.875rem - 1px);\r
    right: calc(-50% + 1.125rem);\r
    bottom: auto;\r
    left: calc(50% + 1.125rem);\r
    width: auto;\r
    height: 2px;\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-fill {\r
    transform-origin: left;\r
    transform: scaleX(0);\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-conn[data-on='true'] .nish-flow-fill {\r
    transform: scaleX(1);\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-shimmer {\r
    background: linear-gradient(90deg, transparent, var(--nish-accent), transparent);\r
  }\r
  .nish-flow-steps[data-orient='auto'] .nish-flow-sweep {\r
    transform-origin: left;\r
    background: linear-gradient(90deg, var(--nish-accent), var(--nish-ok-fill));\r
  }\r
}\r
\r
/* --- AgentNode ------------------------------------------------------------------ */\r
.nish-flow-agent {\r
  position: relative;\r
}\r
.nish-flow-agent[data-state='running'] {\r
  border-color: var(--nish-accent);\r
}\r
\r
/* --- WorkflowBoard -------------------------------------------------------------- */\r
.nish-flow-board-box {\r
  container-type: inline-size;\r
  min-width: 0;\r
}\r
.nish-flow-board {\r
  display: grid;\r
  gap: 0.75rem;\r
}\r
.nish-flow-phase {\r
  position: relative;\r
  min-width: 0;\r
}\r
.nish-flow-phase::after {\r
  content: '';\r
  position: absolute;\r
  inset: -1px;\r
  border-radius: inherit;\r
  pointer-events: none;\r
  opacity: 0;\r
}\r
.nish-flow-phase[data-state='active']::after {\r
  opacity: 1;\r
  box-shadow:\r
    0 0 0 1px var(--nish-accent),\r
    0 0 16px var(--nish-accent-soft);\r
}\r
.nish-flow-phase-conn {\r
  display: none;\r
  position: absolute;\r
  top: 1.375rem;\r
  left: 100%;\r
  width: 1.5rem;\r
  height: 12px;\r
  margin-top: -6px;\r
  color: var(--nish-line-strong);\r
}\r
.nish-flow-phase-conn[data-flow='true'] {\r
  color: var(--nish-accent);\r
}\r
@container (min-width: 720px) {\r
  .nish-flow-board {\r
    grid-auto-columns: minmax(220px, 1fr);\r
    grid-auto-flow: column;\r
    gap: 1.5rem;\r
    overflow-x: auto;\r
    overscroll-behavior-x: contain;\r
    padding: 0.25rem;\r
  }\r
  .nish-flow-phase-conn {\r
    display: block;\r
  }\r
}\r
\r
/* --- ActivityFeed --------------------------------------------------------------- */\r
.nish-flow-feed {\r
  margin: 0;\r
  padding: 0;\r
  list-style: none;\r
}\r
.nish-flow-feed-item {\r
  position: relative;\r
  display: grid;\r
  grid-template-rows: 1fr;\r
}\r
.nish-flow-feed-item::before {\r
  content: '';\r
  position: absolute;\r
  top: 0;\r
  bottom: 0;\r
  left: calc(0.25rem - 0.5px);\r
  width: 1px;\r
  background-color: var(--nish-line);\r
}\r
.nish-flow-feed-item:first-child::before {\r
  top: 0.875rem;\r
}\r
.nish-flow-feed-item:last-child::before {\r
  bottom: calc(100% - 0.875rem);\r
}\r
.nish-flow-feed-inner {\r
  min-height: 0;\r
  overflow: hidden;\r
}\r
.nish-flow-feed-row {\r
  position: relative;\r
  display: grid;\r
  grid-template-columns: minmax(0, 1fr) auto;\r
  gap: 0 0.75rem;\r
  padding: 0.375rem 0.25rem 0.375rem 1.5rem;\r
  border-radius: 0.375rem;\r
}\r
.nish-flow-feed-dot {\r
  position: absolute;\r
  top: 0.625rem;\r
  left: 0;\r
  width: 0.5rem;\r
  height: 0.5rem;\r
  border-radius: 9999px;\r
}\r
\r
/* --- TickerText ----------------------------------------------------------------- */\r
.nish-flow-ticker {\r
  display: grid;\r
  min-width: 0;\r
  overflow: hidden;\r
}\r
.nish-flow-ticker > span {\r
  display: block;\r
  grid-area: 1 / 1;\r
  min-width: 0;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
/* --- AnimatedList --------------------------------------------------------------- */\r
.nish-flow-item {\r
  display: grid;\r
  grid-template-rows: 1fr;\r
}\r
.nish-flow-item-inner {\r
  min-height: 0;\r
  min-width: 0;\r
}\r
.nish-flow-item[data-phase='exit'] {\r
  pointer-events: none;\r
}\r
.nish-flow-item[data-phase='exit'] > .nish-flow-item-inner {\r
  overflow: hidden;\r
}\r
\r
@media (prefers-reduced-motion: no-preference) {\r
  .nish-flow-rise {\r
    animation: nish-rise-in 320ms var(--nish-ease-out) both;\r
    animation-delay: var(--nish-flow-delay, 0ms);\r
  }\r
\r
  /* FlowSteps */\r
  .nish-flow-arc {\r
    display: block;\r
    animation: nish-flow-spin 1.1s linear infinite;\r
  }\r
  .nish-flow-ripple {\r
    display: block;\r
    animation: nish-flow-ripple 1.6s ease-out infinite;\r
  }\r
  .nish-flow-fill {\r
    transition: transform 500ms var(--nish-ease-out);\r
  }\r
  .nish-flow-steps[data-sweep='true'] .nish-flow-fill {\r
    transition-delay: var(--nish-flow-delay, 0ms);\r
  }\r
  .nish-flow-step[data-status='active'] > .nish-flow-conn > .nish-flow-shimmer {\r
    display: block;\r
    animation: nish-flow-shimmer-v 1.4s linear infinite;\r
  }\r
  .nish-flow-steps[data-sweep='true'] .nish-flow-sweep {\r
    display: block;\r
    opacity: 0;\r
    animation: nish-flow-sweep-v 700ms ease-out both;\r
    animation-delay: var(--nish-flow-delay, 0ms);\r
  }\r
  .nish-flow-node[data-fx='done'] {\r
    animation: nish-flow-pop 320ms var(--nish-ease-out);\r
  }\r
  .nish-flow-node[data-fx='done'] .nish-flow-check path {\r
    animation: nish-flow-draw 360ms ease-out both;\r
  }\r
  .nish-flow-node[data-fx='failed'] {\r
    animation: nish-flow-shake 300ms ease-in-out;\r
  }\r
  .nish-flow-steps[data-orient='horizontal'] .nish-flow-step[data-status='active'] > .nish-flow-conn > .nish-flow-shimmer {\r
    animation-name: nish-flow-shimmer;\r
  }\r
  .nish-flow-steps[data-orient='horizontal'] .nish-flow-sweep {\r
    animation-name: nish-flow-sweep;\r
  }\r
  @container (min-width: 640px) {\r
    .nish-flow-steps[data-orient='auto'] .nish-flow-step[data-status='active'] > .nish-flow-conn > .nish-flow-shimmer {\r
      animation-name: nish-flow-shimmer;\r
    }\r
    .nish-flow-steps[data-orient='auto'] .nish-flow-sweep {\r
      animation-name: nish-flow-sweep;\r
    }\r
  }\r
\r
  /* AgentNode: a comet of accent running round the border. */\r
  .nish-flow-agent[data-state='running']::before {\r
    content: '';\r
    position: absolute;\r
    inset: -1px;\r
    padding: 1px;\r
    border-radius: inherit;\r
    pointer-events: none;\r
    background: conic-gradient(from var(--nish-flow-angle), transparent 0deg, transparent 230deg, var(--nish-accent) 360deg);\r
    -webkit-mask:\r
      linear-gradient(#000 0 0) content-box,\r
      linear-gradient(#000 0 0);\r
    -webkit-mask-composite: xor;\r
    mask:\r
      linear-gradient(#000 0 0) content-box exclude,\r
      linear-gradient(#000 0 0);\r
    animation: nish-flow-ring 2.4s linear infinite;\r
  }\r
  .nish-flow-agent-spin {\r
    animation: nish-flow-spin 0.9s linear infinite;\r
  }\r
  .nish-flow-agent[data-fx='done'] .nish-flow-agent-icon {\r
    animation: nish-flow-pop 300ms var(--nish-ease-out);\r
  }\r
  .nish-flow-agent[data-fx='done'] .nish-flow-check path {\r
    animation: nish-flow-draw 300ms ease-out both;\r
  }\r
  .nish-flow-agent[data-fx='failed'] {\r
    animation: nish-flow-shake 300ms ease-in-out;\r
  }\r
\r
  /* WorkflowBoard */\r
  .nish-flow-phase[data-state='active']::after {\r
    animation: nish-flow-glow 2s ease-in-out infinite;\r
  }\r
  .nish-flow-phase-conn[data-flow='true'] .nish-flow-dashline {\r
    animation: nish-flow-dash 1s linear infinite;\r
  }\r
\r
  /* ActivityFeed */\r
  .nish-flow-feed-item[data-fresh='true'] {\r
    animation: nish-flow-feed-in 320ms var(--nish-ease-out) both;\r
  }\r
  .nish-flow-feed-item[data-fresh='true'] .nish-flow-feed-row {\r
    animation: nish-flow-flash 1.2s ease-out both;\r
  }\r
\r
  /* TickerText */\r
  .nish-flow-ticker-in {\r
    animation: nish-flow-ticker-in 260ms var(--nish-ease-out) both;\r
  }\r
  .nish-flow-ticker-out {\r
    animation: nish-flow-ticker-out 200ms ease-in both;\r
  }\r
\r
  /* AnimatedList */\r
  .nish-flow-item[data-phase='enter'] {\r
    animation: nish-flow-enter 380ms ease-out both;\r
  }\r
  .nish-flow-item[data-phase='exit'] {\r
    animation: nish-flow-exit var(--nish-flow-exit-ms, 420ms) ease-in both;\r
  }\r
}\r
\r
/* Markdown and rich text: <div class="nish-prose">…rendered HTML…</div>. Every rule\r
   targets children through :where(), so a utility class on a child still wins. Sized\r
   for UI text (sm); set font-size on the container to scale it all. */\r
.nish-prose {\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  line-height: var(--nish-text-sm-lh);\r
  overflow-wrap: anywhere;\r
}\r
.nish-prose > :where(:first-child) {\r
  margin-top: 0;\r
}\r
.nish-prose > :where(:last-child) {\r
  margin-bottom: 0;\r
}\r
.nish-prose :where(p, ul, ol, blockquote, pre, table, hr, figure) {\r
  margin: 0.75em 0;\r
}\r
.nish-prose :where(h1, h2, h3, h4, h5, h6) {\r
  color: var(--nish-hi);\r
  font-weight: var(--nish-weight-semibold);\r
  letter-spacing: var(--nish-tracking-tight);\r
  line-height: 1.3;\r
  margin: 1.4em 0 0.5em;\r
}\r
.nish-prose :where(h1) {\r
  font-size: 1.6em;\r
}\r
.nish-prose :where(h2) {\r
  font-size: 1.35em;\r
}\r
.nish-prose :where(h3) {\r
  font-size: 1.15em;\r
}\r
.nish-prose :where(h4, h5, h6) {\r
  font-size: 1em;\r
}\r
.nish-prose :where(strong, b) {\r
  color: var(--nish-hi);\r
  font-weight: var(--nish-weight-semibold);\r
}\r
.nish-prose :where(a) {\r
  color: var(--nish-accent);\r
  text-decoration: underline;\r
  text-underline-offset: 2px;\r
  text-decoration-thickness: 1px;\r
}\r
.nish-prose :where(a:hover) {\r
  text-decoration-thickness: 2px;\r
}\r
.nish-prose :where(ul, ol) {\r
  padding-left: 1.4em;\r
}\r
.nish-prose :where(ul) {\r
  list-style: disc;\r
}\r
.nish-prose :where(ol) {\r
  list-style: decimal;\r
}\r
.nish-prose :where(li) {\r
  margin: 0.25em 0;\r
}\r
.nish-prose :where(li)::marker {\r
  color: var(--nish-hi3);\r
}\r
.nish-prose :where(li > ul, li > ol) {\r
  margin: 0.25em 0;\r
}\r
/* GitHub-style task lists: <li><input type="checkbox" disabled> …</li>. */\r
.nish-prose :where(ul:has(> li > input[type='checkbox'])) {\r
  list-style: none;\r
  padding-left: 0.25em;\r
}\r
.nish-prose :where(li > input[type='checkbox']) {\r
  margin: 0 0.5em 0 0;\r
  vertical-align: -0.1em;\r
  accent-color: var(--nish-accent);\r
}\r
.nish-prose :where(blockquote) {\r
  padding-left: 1em;\r
  border-left: 3px solid var(--nish-line-strong);\r
  color: var(--nish-hi2);\r
}\r
.nish-prose :where(hr) {\r
  border: 0;\r
  border-top: 1px solid var(--nish-line);\r
  margin: 1.5em 0;\r
}\r
.nish-prose :where(code) {\r
  font-family: var(--nish-font-mono);\r
  font-size: 0.875em;\r
  padding: 0.1em 0.35em;\r
  border-radius: var(--nish-radius-xs);\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
}\r
.nish-prose :where(pre) {\r
  padding: var(--nish-space-3) var(--nish-space-4);\r
  overflow-x: auto;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-elevated);\r
  line-height: 1.55;\r
}\r
.nish-prose :where(pre code) {\r
  padding: 0;\r
  background: none;\r
  font-size: 0.85em;\r
  overflow-wrap: normal;\r
}\r
.nish-prose :where(table) {\r
  width: 100%;\r
  border-collapse: collapse;\r
  display: block;\r
  overflow-x: auto;\r
}\r
.nish-prose :where(th, td) {\r
  padding: 0.4em 0.75em;\r
  border-bottom: 1px solid var(--nish-line);\r
  text-align: left;\r
  vertical-align: top;\r
}\r
.nish-prose :where(th) {\r
  color: var(--nish-hi);\r
  font-weight: var(--nish-weight-semibold);\r
  border-bottom-color: var(--nish-line-strong);\r
}\r
.nish-prose :where(img, video) {\r
  max-width: 100%;\r
  height: auto;\r
  border-radius: var(--nish-radius-sm);\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  *,\r
  *::before,\r
  *::after {\r
    animation-duration: 1ms !important;\r
    animation-iteration-count: 1 !important;\r
    transition-duration: 1ms !important;\r
    scroll-behavior: auto !important;\r
  }\r
}\r
\r
/* Spinners still signal "working" under reduced motion: they pulse instead of turning. */\r
@media (prefers-reduced-motion: reduce) {\r
  .animate-spin,\r
  .nish-spinner {\r
    animation: nish-pulse 1.6s ease-in-out infinite !important;\r
    animation-iteration-count: infinite !important;\r
    animation-duration: 1.6s !important;\r
  }\r
}\r
\r
/* SystemCanvas (src/components/canvas.tsx). The viewport is the graph paper: its\r
   background position and size follow the pan and zoom (the component writes them directly, no inherited\r
   variables). Every rule that moves, loops or fades is\r
   inside prefers-reduced-motion: no-preference; under reduced motion the active look is\r
   static (hue border, solid edges). */\r
.nish-canvas {\r
  --c: var(--nish-accent);\r
  --c-soft: var(--nish-accent-soft);\r
  position: relative;\r
  width: 100%;\r
  overflow: hidden;\r
  overflow: clip;\r
  touch-action: none;\r
  overscroll-behavior: contain;\r
  user-select: none;\r
  -webkit-user-select: none;\r
  cursor: grab;\r
  background-color: var(--nish-bg);\r
  background-image:\r
    linear-gradient(to right, color-mix(in srgb, var(--nish-line-strong) 38%, transparent) 1px, transparent 1px),\r
    linear-gradient(to bottom, color-mix(in srgb, var(--nish-line-strong) 38%, transparent) 1px, transparent 1px),\r
    linear-gradient(to right, color-mix(in srgb, var(--nish-line) 28%, transparent) 1px, transparent 1px),\r
    linear-gradient(to bottom, color-mix(in srgb, var(--nish-line) 28%, transparent) 1px, transparent 1px);\r
  /* Position and size are written directly by the component on every pan and zoom frame. */\r
  background-size: 120px 120px, 120px 120px, 24px 24px, 24px 24px;\r
  background-position: 0 0;\r
}\r
.nish-canvas[data-grid='major'] {\r
  background-image:\r
    linear-gradient(to right, color-mix(in srgb, var(--nish-line-strong) 38%, transparent) 1px, transparent 1px),\r
    linear-gradient(to bottom, color-mix(in srgb, var(--nish-line-strong) 38%, transparent) 1px, transparent 1px);\r
}\r
.nish-canvas[data-dragging='true'] {\r
  cursor: grabbing;\r
}\r
.nish-canvas:focus-visible {\r
  outline: 2px solid var(--nish-focus);\r
  outline-offset: -2px;\r
}\r
.nish-canvas-world {\r
  position: absolute;\r
  left: 0;\r
  top: 0;\r
  transform-origin: 0 0;\r
  will-change: transform;\r
}\r
.nish-canvas-coltitle {\r
  position: absolute;\r
  font-size: 12px;\r
  font-weight: var(--nish-weight-semibold);\r
  letter-spacing: 0.08em;\r
  text-transform: uppercase;\r
  color: var(--nish-hi3);\r
  white-space: nowrap;\r
}\r
\r
/* Groups */\r
.nish-canvas-group {\r
  position: absolute;\r
  z-index: 0;\r
  overflow: hidden;\r
  border-radius: 16px;\r
  border: 1px solid var(--nish-line);\r
  background:\r
    linear-gradient(to bottom, var(--c-soft), transparent 60%),\r
    var(--nish-surface);\r
  transition: border-color 300ms, box-shadow 300ms;\r
}\r
.nish-canvas-group[data-live] {\r
  border-color: var(--c);\r
  box-shadow: 0 0 22px color-mix(in srgb, var(--c) 28%, transparent);\r
}\r
.nish-canvas-group[data-selected],\r
.nish-canvas-node[data-selected] {\r
  outline: 2px solid var(--nish-accent);\r
  outline-offset: 2px;\r
}\r
.nish-canvas-group[data-selected] {\r
  overflow: visible;\r
}\r
.nish-canvas-band {\r
  position: absolute;\r
  left: 0;\r
  right: 0;\r
  top: 0;\r
  height: 3px;\r
  background: var(--c);\r
}\r
.nish-canvas-head {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 8px;\r
  width: 100%;\r
  height: 52px;\r
  padding: 3px 16px 0;\r
  text-align: left;\r
  cursor: pointer;\r
}\r
.nish-canvas-headtext {\r
  display: flex;\r
  flex-direction: column;\r
  min-width: 0;\r
}\r
.nish-canvas-title {\r
  font-weight: var(--nish-weight-semibold);\r
  color: var(--nish-hi);\r
  line-height: 1.25;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
.nish-canvas-subtitle {\r
  font-size: 12px;\r
  color: var(--nish-hi3);\r
  line-height: 1.3;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
.nish-canvas-badge {\r
  flex-shrink: 0;\r
}\r
\r
/* Nodes */\r
.nish-canvas-slot {\r
  position: absolute;\r
  z-index: 2;\r
}\r
.nish-canvas-slot[data-active] {\r
  z-index: 3;\r
}\r
.nish-canvas-node {\r
  position: relative;\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  width: 100%;\r
  height: 100%;\r
  padding: 0 10px;\r
  text-align: left;\r
  cursor: pointer;\r
  border-radius: 12px;\r
  border: 1px solid var(--nish-line);\r
  background: var(--nish-bg);\r
  transition: border-color 400ms, box-shadow 600ms, background-color 300ms;\r
}\r
.nish-canvas-node:hover {\r
  border-color: color-mix(in srgb, var(--c) 55%, var(--nish-line));\r
}\r
.nish-canvas-node[data-active] {\r
  border-color: var(--c);\r
  background: color-mix(in srgb, var(--c) 10%, var(--nish-bg));\r
}\r
.nish-canvas-icon {\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  width: 28px;\r
  height: 28px;\r
  border-radius: 8px;\r
  color: var(--c);\r
  background: var(--c-soft);\r
}\r
.nish-canvas-text {\r
  display: flex;\r
  flex-direction: column;\r
  min-width: 0;\r
  flex: 1;\r
}\r
.nish-canvas-label {\r
  font-size: 13px;\r
  font-weight: var(--nish-weight-medium);\r
  color: var(--nish-hi);\r
  line-height: 1.25;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
.nish-canvas-detail {\r
  font-size: 11px;\r
  color: var(--nish-hi3);\r
  line-height: 1.3;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
.nish-canvas-count {\r
  flex-shrink: 0;\r
  min-width: 18px;\r
  padding: 0 5px;\r
  border-radius: 9px;\r
  font-size: 11px;\r
  font-weight: var(--nish-weight-semibold);\r
  line-height: 18px;\r
  text-align: center;\r
  color: var(--nish-bg);\r
  background: var(--c);\r
}\r
.nish-canvas-live {\r
  position: absolute;\r
  top: -3px;\r
  right: -3px;\r
  width: 9px;\r
  height: 9px;\r
  border-radius: 50%;\r
  background: var(--c);\r
  box-shadow: 0 0 0 2px var(--nish-bg);\r
}\r
.nish-canvas-note {\r
  /* Takes the detail line's place in the text column, with or without a detail. */\r
  display: block;\r
  overflow: hidden;\r
  color: var(--c);\r
  font-size: 11px;\r
  line-height: 1.3;\r
  white-space: nowrap;\r
  text-overflow: ellipsis;\r
}\r
\r
/* Edges */\r
.nish-canvas-edges,\r
.nish-canvas-ports {\r
  position: absolute;\r
  z-index: 0;\r
  left: 0;\r
  top: 0;\r
  overflow: visible;\r
  pointer-events: none;\r
}\r
.nish-canvas-edge-line {\r
  stroke: var(--nish-line-strong);\r
  stroke-width: 1.5;\r
  transition: stroke 400ms;\r
}\r
.nish-canvas-edge[data-dashed] .nish-canvas-edge-line {\r
  stroke-dasharray: 5 5;\r
}\r
.nish-canvas-edge[data-active] .nish-canvas-edge-line {\r
  stroke: var(--c);\r
  stroke-width: 2;\r
  stroke-dasharray: none;\r
}\r
.nish-canvas-ports {\r
  /* Above the group borders, so each port dot sits on its card's edge. */\r
  z-index: 4;\r
}\r
.nish-canvas-port {\r
  fill: var(--nish-line-strong);\r
  transition: fill 400ms;\r
}\r
.nish-canvas-port[data-active] {\r
  fill: var(--c);\r
}\r
.nish-canvas-dot {\r
  display: none;\r
  fill: var(--c);\r
}\r
.nish-canvas-edge-label {\r
  font-size: 11px;\r
  fill: var(--nish-hi3);\r
  paint-order: stroke;\r
  stroke: var(--nish-bg);\r
  stroke-width: 4px;\r
  stroke-linejoin: round;\r
}\r
\r
/* Controls */\r
.nish-canvas-controls {\r
  position: absolute;\r
  right: 12px;\r
  bottom: 12px;\r
  z-index: 5;\r
  display: flex;\r
  align-items: center;\r
  gap: 2px;\r
  padding: 2px 4px 2px 12px;\r
  border-radius: 14px;\r
  border: 1px solid var(--nish-line);\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-md, 0 4px 14px rgb(0 0 0 / 0.18));\r
  cursor: default;\r
}\r
.nish-canvas-zoom {\r
  min-width: 3ch;\r
  margin-right: 4px;\r
  font-size: 12px;\r
  font-variant-numeric: tabular-nums;\r
  color: var(--nish-hi3);\r
}\r
\r
@keyframes nish-canvas-rise {\r
  from {\r
    opacity: 0;\r
    transform: translateY(14px) scale(0.97);\r
  }\r
  to {\r
    opacity: 1;\r
    transform: none;\r
  }\r
}\r
@keyframes nish-canvas-ring {\r
  from {\r
    opacity: 0.6;\r
    transform: scale(1);\r
  }\r
  to {\r
    opacity: 0;\r
    transform: scale(1.15);\r
  }\r
}\r
@keyframes nish-canvas-ping {\r
  0% {\r
    transform: scale(0.96);\r
  }\r
  50% {\r
    transform: scale(1.04);\r
  }\r
  100% {\r
    transform: scale(1);\r
  }\r
}\r
@keyframes nish-canvas-glow {\r
  0%,\r
  100% {\r
    opacity: 0.3;\r
  }\r
  50% {\r
    opacity: 1;\r
  }\r
}\r
@keyframes nish-canvas-travel {\r
  from {\r
    offset-distance: 0%;\r
  }\r
  to {\r
    offset-distance: 100%;\r
  }\r
}\r
@keyframes nish-canvas-live {\r
  0%,\r
  100% {\r
    transform: scale(1);\r
  }\r
  50% {\r
    transform: scale(1.35);\r
  }\r
}\r
\r
@media (prefers-reduced-motion: no-preference) {\r
  .nish-canvas-group,\r
  .nish-canvas-slot {\r
    animation: nish-canvas-rise 420ms var(--nish-ease-out) both;\r
    animation-delay: var(--nish-canvas-delay, 0ms);\r
  }\r
  .nish-canvas-group[data-live]::before {\r
    content: '';\r
    position: absolute;\r
    inset: 0;\r
    border-radius: inherit;\r
    box-shadow: inset 0 0 26px color-mix(in srgb, var(--c) 45%, transparent);\r
    pointer-events: none;\r
    opacity: 0.3;\r
    animation: nish-canvas-glow 2.4s ease-in-out infinite;\r
  }\r
  .nish-canvas-node[data-active]::after {\r
    content: '';\r
    position: absolute;\r
    inset: -1px;\r
    border-radius: inherit;\r
    border: 2px solid var(--c);\r
    pointer-events: none;\r
    animation: nish-canvas-ring 1.6s ease-out infinite;\r
  }\r
  .nish-canvas-node[data-fx='ping'] {\r
    animation: nish-canvas-ping 400ms var(--nish-ease-out);\r
  }\r
  .nish-canvas-live {\r
    animation: nish-canvas-live 1.2s ease-in-out infinite;\r
  }\r
  .nish-canvas-edge[data-active] .nish-canvas-dot {\r
    display: block;\r
    offset-rotate: 0deg;\r
    animation: nish-canvas-travel 1.6s linear infinite;\r
  }\r
}\r
`;export{e as default};