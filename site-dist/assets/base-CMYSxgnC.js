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
`;export{e as default};