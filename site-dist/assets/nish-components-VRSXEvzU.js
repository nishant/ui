var e=`/* @nish/ui component classes for static pages (mc, trips, the hub, trip gates).\r
   Shipped as dist/nish-components.css (@nish/ui/nish-components.css) and listed in\r
   dist/files.json "static", so hosting's sync-ui.mjs vendors it. Link it after nish.css:\r
\r
     <script src="nish/theme-init.js"><\/script>\r
     <link rel="stylesheet" href="nish/nish.css">\r
     <link rel="stylesheet" href="nish/nish-components.css">\r
\r
   Every recipe mirrors a React component (same sizes, roles and touch rule) and uses\r
   roles only. Every selector is wrapped in :where(), so it has zero specificity and a\r
   site's own CSS always wins; nothing changes on a page until it uses a nish-* class.\r
   The build fails if a selector here is not wrapped in :where(). */\r
\r
/* --- Button (.nish-btn) -------------------------------------------------------------\r
   <button class="nish-btn nish-btn--primary">Save</button>, also on <a>. */\r
:where(.nish-btn) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  height: 36px;\r
  padding: 0 14px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-surface);\r
  color: var(--nish-hi);\r
  font: inherit;\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1.25rem;\r
  white-space: nowrap;\r
  text-decoration: none;\r
  user-select: none;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    border-color 150ms,\r
    color 150ms;\r
}\r
:where(.nish-btn) > :where(svg) {\r
  flex-shrink: 0;\r
}\r
:where(.nish-btn:hover) {\r
  background: var(--nish-elevated);\r
}\r
:where(.nish-btn--primary) {\r
  border-color: transparent;\r
  background: var(--nish-accent);\r
  color: var(--nish-on-accent);\r
}\r
:where(.nish-btn--primary:hover) {\r
  background: color-mix(in srgb, var(--nish-accent) 90%, transparent);\r
}\r
:where(.nish-btn--primary:active) {\r
  background: color-mix(in srgb, var(--nish-accent) 80%, transparent);\r
}\r
:where(.nish-btn--ghost) {\r
  border-color: transparent;\r
  background: transparent;\r
  color: var(--nish-hi2);\r
}\r
:where(.nish-btn--ghost:hover) {\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
}\r
:where(.nish-btn--danger) {\r
  border-color: transparent;\r
  background: var(--nish-loss);\r
  color: var(--nish-on-loss);\r
}\r
:where(.nish-btn--danger:hover) {\r
  background: color-mix(in srgb, var(--nish-loss) 90%, transparent);\r
}\r
:where(.nish-btn--danger:active) {\r
  background: color-mix(in srgb, var(--nish-loss) 80%, transparent);\r
}\r
:where(.nish-btn--soft) {\r
  border-color: transparent;\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
}\r
:where(.nish-btn--soft:hover) {\r
  background: color-mix(in srgb, var(--nish-accent) 20%, transparent);\r
}\r
:where(.nish-btn--soft:active) {\r
  background: color-mix(in srgb, var(--nish-accent) 25%, transparent);\r
}\r
:where(.nish-btn--subtle) {\r
  border-color: transparent;\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
}\r
:where(.nish-btn--subtle:hover) {\r
  background: var(--nish-overlay);\r
}\r
/* A toggle button that is on: the Segmented/Chip selected look. */\r
:where(.nish-btn[aria-pressed='true']) {\r
  border-color: color-mix(in srgb, var(--nish-accent) 40%, transparent);\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
}\r
:where(.nish-btn--xs) {\r
  height: 24px;\r
  gap: 4px;\r
  padding: 0 8px;\r
  font-size: var(--nish-text-2xs, 0.6875rem);\r
  line-height: 1rem;\r
}\r
:where(.nish-btn--sm) {\r
  height: 28px;\r
  gap: 6px;\r
  padding: 0 10px;\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
}\r
:where(.nish-btn--lg) {\r
  height: 44px;\r
  padding: 0 20px;\r
  font-size: var(--nish-text-base);\r
  line-height: 1.5rem;\r
}\r
/* Inline in text: no box, no min height, no touch growth. */\r
:where(.nish-btn--link) {\r
  height: auto;\r
  padding: 0;\r
  border: 0;\r
  background: none;\r
  color: var(--nish-accent);\r
  text-underline-offset: 2px;\r
}\r
:where(.nish-btn--link:hover) {\r
  background: none;\r
  text-decoration: underline;\r
}\r
/* Disabled reads as disabled in every theme: a flat quiet fill and faint text. */\r
:where(.nish-btn:disabled, .nish-btn[aria-disabled='true']) {\r
  pointer-events: none;\r
  border-color: var(--nish-line);\r
  background: var(--nish-elevated);\r
  color: var(--nish-ghost);\r
  box-shadow: none;\r
}\r
:where(.nish-btn--link:disabled, .nish-btn--link[aria-disabled='true']) {\r
  border: 0;\r
  background: none;\r
}\r
\r
/* --- IconButton (.nish-icon-btn) ----------------------------------------------------\r
   <button class="nish-icon-btn" aria-label="Refresh" title="Refresh"><svg …></button> */\r
:where(.nish-icon-btn) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  width: 36px;\r
  height: 36px;\r
  padding: 0;\r
  border: 0;\r
  border-radius: var(--nish-radius-sm);\r
  background: transparent;\r
  color: var(--nish-hi3);\r
  font: inherit;\r
  text-decoration: none;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    color 150ms;\r
}\r
:where(.nish-icon-btn:hover, .nish-icon-btn[aria-pressed='true']) {\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
}\r
:where(.nish-icon-btn:disabled, .nish-icon-btn[aria-disabled='true']) {\r
  pointer-events: none;\r
  color: var(--nish-ghost);\r
}\r
:where(.nish-icon-btn--sm) {\r
  width: 28px;\r
  height: 28px;\r
}\r
:where(.nish-icon-btn--xs) {\r
  width: 24px;\r
  height: 24px;\r
  border-radius: 6px;\r
}\r
/* 20px, for row-level reveal actions and 22px title bars. */\r
:where(.nish-icon-btn--2xs) {\r
  width: 20px;\r
  height: 20px;\r
  border-radius: var(--nish-radius-xs, 4px);\r
}\r
:where(.nish-icon-btn--round) {\r
  border-radius: var(--nish-radius-pill);\r
}\r
\r
/* --- Theme button (.nish-theme-btn) -------------------------------------------------\r
   The button mountThemeToggle() fills: an icon button holding one SVG per choice,\r
   <svg data-icon="system|light|dark">. It sets data-choice; CSS shows that icon. A\r
   preset saved on another site (data-choice="mocha") shows the icon of its scheme. */\r
:where(.nish-theme-btn) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  width: 36px;\r
  height: 36px;\r
  padding: 0;\r
  border: 0;\r
  border-radius: var(--nish-radius-sm);\r
  background: transparent;\r
  color: var(--nish-hi3);\r
  font: inherit;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    color 150ms;\r
}\r
:where(.nish-theme-btn:hover) {\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
}\r
:where(.nish-theme-btn) :where([data-icon]) {\r
  display: none;\r
}\r
:where(.nish-theme-btn[data-choice='system']) :where([data-icon='system']),\r
:where(.nish-theme-btn[data-choice='light']) :where([data-icon='light']),\r
:where(.nish-theme-btn[data-choice='dark']) :where([data-icon='dark']),\r
:where([data-scheme='light'] .nish-theme-btn:not([data-choice='system'], [data-choice='light'], [data-choice='dark'])) :where([data-icon='light']),\r
:where([data-scheme='dark'] .nish-theme-btn:not([data-choice='system'], [data-choice='light'], [data-choice='dark'])) :where([data-icon='dark']) {\r
  display: block;\r
}\r
/* The pill form, to sit next to .nish-pill-link in a top bar: the same 44px height and\r
   pill border on every pointer. */\r
:where(.nish-theme-btn--pill, .nish-theme-btn--labelled) {\r
  height: var(--nish-tap-min, 44px);\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-pill);\r
}\r
:where(.nish-theme-btn--pill) {\r
  width: var(--nish-tap-min, 44px);\r
}\r
/* The pill with the current choice as a word: mountThemeToggle(button, { showLabel: true })\r
   adds <span data-theme-word aria-hidden="true">Light</span> after the icons. */\r
:where(.nish-theme-btn--labelled) {\r
  width: auto;\r
  gap: 8px;\r
  padding: 0 14px 0 12px;\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1.25rem;\r
  white-space: nowrap;\r
}\r
:where(.nish-theme-btn--labelled) > :where(svg) {\r
  flex-shrink: 0;\r
}\r
\r
/* --- Card (.nish-card) --------------------------------------------------------------\r
   <section class="nish-card nish-card--padded">…</section>, or <a class="nish-card nish-card--interactive"> */\r
:where(.nish-card) {\r
  box-sizing: border-box;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-card);\r
}\r
:where(.nish-card--padded) {\r
  padding: 16px;\r
}\r
@media (min-width: 640px) {\r
  :where(.nish-card--padded) {\r
    padding: 20px;\r
  }\r
}\r
:where(.nish-card--interactive) {\r
  display: block;\r
  color: inherit;\r
  text-decoration: none;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    border-color 150ms;\r
}\r
:where(.nish-card--interactive:hover) {\r
  border-color: var(--nish-line-strong);\r
  background: color-mix(in srgb, var(--nish-elevated) 60%, var(--nish-surface));\r
}\r
/* A box inside a card: raised fill, no border color, no shadow. */\r
:where(.nish-card--inset) {\r
  border-color: transparent;\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-elevated);\r
  box-shadow: none;\r
}\r
\r
/* --- Badge (.nish-badge) ------------------------------------------------------------\r
   <span class="nish-badge nish-badge--ok">Booked</span> */\r
:where(.nish-badge) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 4px;\r
  padding: 2px 8px;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-pill);\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1rem;\r
  white-space: nowrap;\r
  vertical-align: middle;\r
}\r
:where(.nish-badge--accent) {\r
  border-color: color-mix(in srgb, var(--nish-accent) 30%, transparent);\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
}\r
:where(.nish-badge--ok) {\r
  border-color: color-mix(in srgb, var(--nish-ok) 30%, transparent);\r
  background: var(--nish-ok-soft);\r
  color: var(--nish-ok);\r
}\r
:where(.nish-badge--loss) {\r
  border-color: color-mix(in srgb, var(--nish-loss) 30%, transparent);\r
  background: var(--nish-loss-soft);\r
  color: var(--nish-loss);\r
}\r
:where(.nish-badge--warn) {\r
  border-color: color-mix(in srgb, var(--nish-warn) 30%, transparent);\r
  background: var(--nish-warn-soft);\r
  color: var(--nish-warn);\r
}\r
:where(.nish-badge--info) {\r
  border-color: color-mix(in srgb, var(--nish-info) 30%, transparent);\r
  background: var(--nish-info-soft);\r
  color: var(--nish-info);\r
}\r
/* Hues (no meaning: stores, categories, tags). Text stays hi, so contrast holds. */\r
:where(.nish-badge--emerald) {\r
  border-color: color-mix(in srgb, var(--nish-emerald) 30%, transparent);\r
  background: var(--nish-emerald-soft, color-mix(in srgb, var(--nish-emerald) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--indigo) {\r
  border-color: color-mix(in srgb, var(--nish-indigo) 30%, transparent);\r
  background: var(--nish-indigo-soft, color-mix(in srgb, var(--nish-indigo) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--amber) {\r
  border-color: color-mix(in srgb, var(--nish-amber) 30%, transparent);\r
  background: var(--nish-amber-soft, color-mix(in srgb, var(--nish-amber) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--lime) {\r
  border-color: color-mix(in srgb, var(--nish-lime) 30%, transparent);\r
  background: var(--nish-lime-soft, color-mix(in srgb, var(--nish-lime) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--rose) {\r
  border-color: color-mix(in srgb, var(--nish-rose) 30%, transparent);\r
  background: var(--nish-rose-soft, color-mix(in srgb, var(--nish-rose) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--sky) {\r
  border-color: color-mix(in srgb, var(--nish-sky) 30%, transparent);\r
  background: var(--nish-sky-soft, color-mix(in srgb, var(--nish-sky) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--violet) {\r
  border-color: color-mix(in srgb, var(--nish-violet) 30%, transparent);\r
  background: var(--nish-violet-soft, color-mix(in srgb, var(--nish-violet) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
:where(.nish-badge--teal) {\r
  border-color: color-mix(in srgb, var(--nish-teal) 30%, transparent);\r
  background: var(--nish-teal-soft, color-mix(in srgb, var(--nish-teal) 14%, transparent));\r
  color: var(--nish-hi);\r
}\r
/* Solid: the tone's fill with its on-* text. Neutral solid is the inverted pill. */\r
:where(.nish-badge--solid) {\r
  border-color: transparent;\r
  background: var(--nish-invert-bg);\r
  color: var(--nish-invert-text);\r
}\r
:where(.nish-badge--solid.nish-badge--accent) {\r
  background: var(--nish-accent);\r
  color: var(--nish-on-accent);\r
}\r
:where(.nish-badge--solid.nish-badge--ok) {\r
  background: var(--nish-ok-fill);\r
  color: var(--nish-on-ok);\r
}\r
:where(.nish-badge--solid.nish-badge--loss) {\r
  background: var(--nish-loss-fill);\r
  color: var(--nish-on-loss);\r
}\r
:where(.nish-badge--solid.nish-badge--warn) {\r
  background: var(--nish-warn-fill);\r
  color: var(--nish-on-warn);\r
}\r
:where(.nish-badge--solid.nish-badge--info) {\r
  background: var(--nish-info-fill);\r
  color: var(--nish-on-info);\r
}\r
/* Tag-shaped label: square-ish corners, caps. */\r
:where(.nish-badge--tag) {\r
  border-color: transparent;\r
  border-radius: var(--nish-radius-xs);\r
  font-weight: var(--nish-weight-semibold);\r
  text-transform: uppercase;\r
  letter-spacing: 0.025em;\r
}\r
:where(.nish-badge--xs) {\r
  padding: 0 6px;\r
  font-size: var(--nish-text-3xs, 0.625rem);\r
  line-height: 1rem;\r
}\r
/* A small label inside a solid accent fill (a primary button or an accent link). */\r
:where(.nish-badge--on-accent) {\r
  border-color: transparent;\r
  background: color-mix(in srgb, var(--nish-on-accent) 20%, transparent);\r
  color: var(--nish-on-accent);\r
}\r
\r
/* --- Fields (.nish-input, .nish-select, .nish-textarea) ------------------------------\r
   16px text on touch screens (no iOS zoom), 44px tall on touch. The focus\r
   ring is base.css's outline, drawn on the border edge in a soft accent. */\r
:where(.nish-input, .nish-select, .nish-textarea) {\r
  --nish-focus: color-mix(in srgb, var(--nish-accent) 25%, transparent);\r
  --nish-focus-offset: 0px;\r
  box-sizing: border-box;\r
  width: 100%;\r
  min-width: 0;\r
  height: 36px;\r
  margin: 0;\r
  padding: 0 12px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-sm);\r
  background-color: var(--nish-elevated);\r
  color: var(--nish-hi);\r
  font: inherit;\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.25rem;\r
  transition:\r
    border-color 150ms,\r
    box-shadow 150ms;\r
}\r
:where(.nish-input, .nish-textarea)::placeholder {\r
  color: var(--nish-ghost);\r
  opacity: 1;\r
}\r
:where(.nish-input:hover, .nish-select:hover, .nish-textarea:hover) {\r
  border-color: color-mix(in srgb, var(--nish-hi3) 60%, transparent);\r
}\r
:where(.nish-input:focus, .nish-select:focus, .nish-textarea:focus) {\r
  border-color: var(--nish-accent);\r
  outline: var(--nish-focus-width) solid var(--nish-focus);\r
  outline-offset: 0;\r
}\r
:where(.nish-input[aria-invalid='true'], .nish-select[aria-invalid='true'], .nish-textarea[aria-invalid='true']) {\r
  --nish-focus: color-mix(in srgb, var(--nish-loss) 25%, transparent);\r
  border-color: var(--nish-loss);\r
}\r
:where(.nish-input:disabled, .nish-select:disabled, .nish-textarea:disabled) {\r
  cursor: not-allowed;\r
  opacity: 0.5;\r
}\r
/* Native select with a chevron drawn from two gradients, so it follows the theme. */\r
:where(.nish-select) {\r
  appearance: none;\r
  padding-right: 32px;\r
  background-image:\r
    linear-gradient(45deg, transparent 50%, var(--nish-hi3) 50%),\r
    linear-gradient(135deg, var(--nish-hi3) 50%, transparent 50%);\r
  background-position:\r
    calc(100% - 17px) 50%,\r
    calc(100% - 12px) 50%;\r
  background-size: 5px 5px;\r
  background-repeat: no-repeat;\r
  cursor: pointer;\r
}\r
:where(.nish-textarea) {\r
  display: block;\r
  height: auto;\r
  padding: 8px 12px;\r
  line-height: 1.625;\r
  resize: vertical;\r
}\r
@media (pointer: coarse) {\r
  :where(.nish-input, .nish-select, .nish-textarea) {\r
    font-size: var(--nish-text-base);\r
  }\r
}\r
\r
/* --- Label and Field (.nish-label, .nish-field) --------------------------------------\r
   <label class="nish-field">\r
     <span class="nish-field-label">Stack size</span>\r
     <input class="nish-input" aria-describedby="stack-hint">\r
     <small class="nish-hint" id="stack-hint">Up to 64</small>\r
   </label>\r
   .nish-label is the small uppercase label for sections and card headings. */\r
:where(.nish-label) {\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1rem;\r
  letter-spacing: 0.05em;\r
  text-transform: uppercase;\r
}\r
:where(.nish-field) {\r
  display: grid;\r
  gap: 6px;\r
  min-width: 0;\r
}\r
:where(.nish-field-label) {\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1.25rem;\r
}\r
:where(.nish-optional) {\r
  margin-left: 6px;\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-normal);\r
}\r
:where(.nish-hint) {\r
  margin: 0;\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
}\r
:where(.nish-error) {\r
  margin: 0;\r
  color: var(--nish-loss);\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
}\r
/* A group of controls: <fieldset class="nish-field"><legend class="nish-field-label">…</legend>…</fieldset>\r
   (React: FieldGroup). */\r
:where(fieldset.nish-field) {\r
  min-width: 0;\r
  margin: 0;\r
  padding: 0;\r
  border: 0;\r
}\r
:where(legend.nish-field-label) {\r
  margin-bottom: 6px;\r
  padding: 0;\r
}\r
\r
/* Label beside the control; hint and error indent under the control. */\r
:where(.nish-field--inline) {\r
  grid-template-columns: var(--nish-field-label-width, 7rem) minmax(0, 1fr);\r
  align-items: center;\r
  column-gap: 12px;\r
}\r
:where(.nish-field--inline) > :where(.nish-field-label, .nish-label) {\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-normal);\r
  letter-spacing: normal;\r
  text-transform: none;\r
}\r
:where(.nish-field--inline) > :where(.nish-hint, .nish-error) {\r
  grid-column: 2;\r
}\r
\r
/* --- Search (.nish-search) ----------------------------------------------------------\r
   <label class="nish-search"><svg …></svg><input class="nish-input" type="search" aria-label="Search"></label>\r
   A leading icon, and an optional trailing <kbd> hint or clear button. */\r
:where(.nish-search) {\r
  position: relative;\r
  display: inline-flex;\r
  align-items: center;\r
  width: 100%;\r
  min-width: 0;\r
}\r
:where(.nish-search) > :where(svg) {\r
  position: absolute;\r
  left: 10px;\r
  width: 16px;\r
  height: 16px;\r
  color: var(--nish-hi3);\r
  pointer-events: none;\r
}\r
:where(.nish-search) > :where(input) {\r
  padding-left: 32px;\r
}\r
:where(.nish-search) > :where(input:not(:last-child)) {\r
  padding-right: 40px;\r
}\r
:where(.nish-search) > :where(kbd, button) {\r
  position: absolute;\r
  right: 6px;\r
}\r
:where(.nish-search) > :where(kbd) {\r
  pointer-events: none;\r
}\r
:where(.nish-search--bare) > :where(input) {\r
  border-color: transparent;\r
  background-color: transparent;\r
}\r
\r
/* --- Segmented (.nish-seg) ----------------------------------------------------------\r
   <div class="nish-seg" role="group" aria-label="Mode">\r
     <button type="button" aria-pressed="true">Survival</button><button type="button" aria-pressed="false">Creative</button>\r
   </div>\r
   Children may also be [role=radio][aria-checked] (a radiogroup with arrow keys).\r
   Default: a track holding the segments (the React look). --joined: bordered buttons\r
   sharing edges. --pills: separate pills with a gap. */\r
:where(.nish-seg) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  max-width: 100%;\r
  padding: 2px;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-elevated);\r
}\r
:where(.nish-seg) > :where(button, a, [role='radio']) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 6px;\r
  height: 28px;\r
  margin: 0;\r
  padding: 0 10px;\r
  border: 0;\r
  border-radius: 6px;\r
  background: transparent;\r
  color: var(--nish-hi2);\r
  font: inherit;\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-medium);\r
  font-variant-numeric: tabular-nums;\r
  line-height: 1rem;\r
  white-space: nowrap;\r
  text-decoration: none;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    color 150ms;\r
}\r
:where(.nish-seg > button:hover, .nish-seg > a:hover, .nish-seg > [role='radio']:hover) {\r
  color: var(--nish-hi);\r
}\r
:where(.nish-seg) > :where([aria-pressed='true'], [aria-checked='true'], [aria-current='page']) {\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--nish-accent) 40%, transparent);\r
}\r
:where(.nish-seg) > :where(:disabled, [aria-disabled='true']) {\r
  pointer-events: none;\r
  color: var(--nish-ghost);\r
}\r
:where(.nish-seg--joined) {\r
  padding: 0;\r
  border: 0;\r
  background: none;\r
}\r
:where(.nish-seg--joined) > :where(button, a, [role='radio']) {\r
  height: 32px;\r
  padding: 0 12px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: 0;\r
  background: var(--nish-surface);\r
  font-size: var(--nish-text-sm);\r
}\r
:where(.nish-seg--joined) > :where(:not(:first-child)) {\r
  margin-left: -1px;\r
}\r
:where(.nish-seg--joined) > :where(:first-child) {\r
  border-radius: var(--nish-radius-sm) 0 0 var(--nish-radius-sm);\r
}\r
:where(.nish-seg--joined) > :where(:last-child) {\r
  border-radius: 0 var(--nish-radius-sm) var(--nish-radius-sm) 0;\r
}\r
:where(.nish-seg--joined) > :where([aria-pressed='true'], [aria-checked='true'], [aria-current='page']) {\r
  position: relative;\r
  border-color: color-mix(in srgb, var(--nish-accent) 40%, transparent);\r
  box-shadow: none;\r
}\r
:where(.nish-seg--pills) {\r
  flex-wrap: wrap;\r
  gap: 6px;\r
  padding: 0;\r
  border: 0;\r
  background: none;\r
}\r
:where(.nish-seg--pills) > :where(button, a, [role='radio']) {\r
  height: 32px;\r
  padding: 0 12px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-pill);\r
  font-size: var(--nish-text-sm);\r
}\r
:where(.nish-seg--pills) > :where([aria-pressed='true'], [aria-checked='true'], [aria-current='page']) {\r
  border-color: color-mix(in srgb, var(--nish-accent) 60%, transparent);\r
  box-shadow: none;\r
}\r
\r
/* --- Chip (.nish-chip) --------------------------------------------------------------\r
   A multi-select filter toggle: <button class="nish-chip" aria-pressed="false">Iron</button>.\r
   Group them in <div role="group" aria-label="…" class="nish-chips">. */\r
:where(.nish-chips) {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
}\r
:where(.nish-chip) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  align-items: center;\r
  gap: 6px;\r
  height: 32px;\r
  margin: 0;\r
  padding: 0 12px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-pill);\r
  background: transparent;\r
  color: var(--nish-hi2);\r
  font: inherit;\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.25rem;\r
  white-space: nowrap;\r
  text-decoration: none;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    border-color 150ms,\r
    color 150ms;\r
}\r
:where(.nish-chip:hover) {\r
  background: var(--nish-elevated);\r
}\r
:where(.nish-chip[aria-pressed='true']) {\r
  border-color: color-mix(in srgb, var(--nish-accent) 60%, transparent);\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
}\r
:where(.nish-chip:disabled, .nish-chip[aria-disabled='true']) {\r
  pointer-events: none;\r
  color: var(--nish-ghost);\r
}\r
:where(.nish-chip--suggestion) {\r
  border-style: dashed;\r
  color: var(--nish-hi3);\r
}\r
:where(.nish-chip--suggestion)::before {\r
  content: '+';\r
  font-weight: var(--nish-weight-medium);\r
}\r
:where(.nish-chip--sm) {\r
  height: 28px;\r
  padding: 0 10px;\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
}\r
\r
/* --- Callout (.nish-callout) --------------------------------------------------------\r
   <div class="nish-callout nish-callout--warn">\r
     <span class="nish-callout-icon" aria-hidden="true">!</span>\r
     <div><p class="nish-callout-title">Heads up</p><p>Body text.</p></div>\r
   </div>\r
   The icon square is the tone's fill with on-* text. */\r
:where(.nish-callout) {\r
  box-sizing: border-box;\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 12px;\r
  padding: 12px 16px;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.35rem;\r
}\r
:where(.nish-callout) > :where(div) {\r
  min-width: 0;\r
  flex: 1;\r
}\r
:where(.nish-callout) :where(p) {\r
  margin: 0;\r
}\r
:where(.nish-callout) :where(p + p) {\r
  margin-top: 4px;\r
}\r
:where(.nish-callout-title) {\r
  color: var(--nish-hi);\r
  font-weight: var(--nish-weight-medium);\r
}\r
:where(.nish-callout-icon) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  width: 24px;\r
  height: 24px;\r
  border-radius: 6px;\r
  background: var(--nish-overlay);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-bold);\r
  line-height: 1;\r
}\r
:where(.nish-callout-icon) > :where(svg) {\r
  width: 14px;\r
  height: 14px;\r
}\r
:where(.nish-callout--accent) {\r
  border-color: color-mix(in srgb, var(--nish-accent) 30%, transparent);\r
  background: var(--nish-accent-soft);\r
}\r
:where(.nish-callout--accent) :where(.nish-callout-icon) {\r
  background: var(--nish-accent);\r
  color: var(--nish-on-accent);\r
}\r
:where(.nish-callout--info) {\r
  border-color: color-mix(in srgb, var(--nish-info) 30%, transparent);\r
  background: var(--nish-info-soft);\r
}\r
:where(.nish-callout--info) :where(.nish-callout-icon) {\r
  background: var(--nish-info-fill);\r
  color: var(--nish-on-info);\r
}\r
:where(.nish-callout--ok) {\r
  border-color: color-mix(in srgb, var(--nish-ok) 30%, transparent);\r
  background: var(--nish-ok-soft);\r
}\r
:where(.nish-callout--ok) :where(.nish-callout-icon) {\r
  background: var(--nish-ok-fill);\r
  color: var(--nish-on-ok);\r
}\r
:where(.nish-callout--warn) {\r
  border-color: color-mix(in srgb, var(--nish-warn) 30%, transparent);\r
  background: var(--nish-warn-soft);\r
}\r
:where(.nish-callout--warn) :where(.nish-callout-icon) {\r
  background: var(--nish-warn-fill);\r
  color: var(--nish-on-warn);\r
}\r
:where(.nish-callout--loss) {\r
  border-color: color-mix(in srgb, var(--nish-loss) 30%, transparent);\r
  background: var(--nish-loss-soft);\r
}\r
:where(.nish-callout--loss) :where(.nish-callout-icon) {\r
  background: var(--nish-loss-fill);\r
  color: var(--nish-on-loss);\r
}\r
\r
/* --- Stats (.nish-stats > .nish-stat) -----------------------------------------------\r
   <dl class="nish-stats">\r
     <div class="nish-stat"><dt class="nish-stat-label">Blocks</dt><dd class="nish-stat-value">1,284</dd></div>\r
   </dl>\r
   --tinted: raised fill instead of a card. --sm: denser, smaller values. */\r
:where(.nish-stats) {\r
  display: grid;\r
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));\r
  gap: 12px;\r
  margin: 0;\r
  padding: 0;\r
  list-style: none;\r
}\r
:where(.nish-stat) {\r
  box-sizing: border-box;\r
  display: flex;\r
  flex-direction: column;\r
  gap: 2px;\r
  min-width: 0;\r
  margin: 0;\r
  padding: 12px;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-card);\r
}\r
:where(.nish-stat-label) {\r
  margin: 0;\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
}\r
:where(.nish-stat-value) {\r
  margin: 0;\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-xl);\r
  font-weight: var(--nish-weight-semibold);\r
  font-variant-numeric: tabular-nums;\r
  line-height: 1.75rem;\r
  letter-spacing: var(--nish-tracking-tight);\r
  overflow-wrap: anywhere;\r
}\r
:where(.nish-stat-sub) {\r
  margin: 0;\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
}\r
:where(.nish-stat-value--ok) {\r
  color: var(--nish-ok);\r
}\r
:where(.nish-stat-value--loss) {\r
  color: var(--nish-loss);\r
}\r
:where(.nish-stat-value--warn) {\r
  color: var(--nish-warn);\r
}\r
:where(.nish-stats--tinted) > :where(.nish-stat),\r
:where(.nish-stat--tinted) {\r
  border-color: transparent;\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-elevated);\r
  box-shadow: none;\r
}\r
/* hi3 only clears 3:1 on elevated in every theme; labels there use hi2. */\r
:where(.nish-stats--tinted, .nish-stat--tinted) :where(.nish-stat-label, .nish-stat-sub) {\r
  color: var(--nish-hi2);\r
}\r
:where(.nish-stats--sm) {\r
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));\r
  gap: 8px;\r
}\r
:where(.nish-stats--sm) > :where(.nish-stat) {\r
  padding: 8px 10px;\r
}\r
:where(.nish-stats--sm) :where(.nish-stat-value) {\r
  font-size: var(--nish-text-base);\r
  line-height: 1.5rem;\r
}\r
\r
/* --- Table (.nish-table-wrap) -------------------------------------------------------\r
   <div class="nish-table-wrap"><table>…</table></div>. Zebra rows, a quiet caps\r
   header, td.num / th.num right-aligned. --sticky keeps the header in view inside a\r
   box capped at --nish-table-max-h (default 28rem). */\r
:where(.nish-table-wrap) {\r
  box-sizing: border-box;\r
  max-width: 100%;\r
  overflow: auto;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  background: var(--nish-surface);\r
}\r
:where(.nish-table-wrap) > :where(table) {\r
  width: 100%;\r
  margin: 0;\r
  border-collapse: collapse;\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.25rem;\r
  font-variant-numeric: tabular-nums;\r
}\r
:where(.nish-table-wrap) :where(th, td) {\r
  padding: 8px 12px;\r
  border-bottom: 1px solid var(--nish-line);\r
  text-align: left;\r
  vertical-align: top;\r
}\r
:where(.nish-table-wrap) :where(thead th) {\r
  background: var(--nish-surface);\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1rem;\r
  letter-spacing: 0.05em;\r
  text-transform: uppercase;\r
  white-space: nowrap;\r
  vertical-align: bottom;\r
}\r
:where(.nish-table-wrap) :where(tbody th) {\r
  color: var(--nish-hi);\r
  font-weight: var(--nish-weight-medium);\r
}\r
:where(.nish-table-wrap) :where(td) {\r
  color: var(--nish-hi2);\r
}\r
:where(.nish-table-wrap) :where(tbody tr:nth-child(even)) {\r
  background: color-mix(in srgb, var(--nish-elevated) 55%, transparent);\r
}\r
:where(.nish-table-wrap) :where(tbody tr:last-child) > :where(th, td) {\r
  border-bottom: 0;\r
}\r
:where(.nish-table-wrap) :where(.num) {\r
  text-align: right;\r
  white-space: nowrap;\r
}\r
:where(.nish-table-wrap) :where(caption) {\r
  padding: 8px 12px;\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  text-align: left;\r
}\r
:where(.nish-table-wrap--sticky) {\r
  max-height: var(--nish-table-max-h, 28rem);\r
}\r
:where(.nish-table-wrap--sticky) :where(thead th) {\r
  position: sticky;\r
  top: 0;\r
  z-index: 1;\r
  box-shadow: inset 0 -1px 0 var(--nish-line);\r
}\r
\r
/* --- Meter (.nish-meter > i) --------------------------------------------------------\r
   <div class="nish-meter nish-meter--ok" role="meter" aria-label="Durability"\r
        aria-valuemin="0" aria-valuemax="100" aria-valuenow="64"><i style="width:64%"></i></div>\r
   The fill width can also come from --value: <div class="nish-meter" style="--value:64%">. */\r
:where(.nish-meter) {\r
  box-sizing: border-box;\r
  display: block;\r
  position: relative;\r
  width: 100%;\r
  height: 8px;\r
  overflow: hidden;\r
  border-radius: var(--nish-radius-pill);\r
  background: var(--nish-elevated);\r
}\r
:where(.nish-card, .nish-stat, .nish-callout) :where(.nish-meter) {\r
  background: var(--nish-overlay);\r
}\r
:where(.nish-meter) > :where(i) {\r
  display: block;\r
  width: var(--value, 0%);\r
  max-width: 100%;\r
  height: 100%;\r
  border-radius: inherit;\r
  background: var(--nish-accent);\r
  transition: width var(--nish-dur-med) var(--nish-ease-out);\r
}\r
:where(.nish-meter--sm) {\r
  height: 4px;\r
}\r
:where(.nish-meter--lg) {\r
  height: 12px;\r
}\r
:where(.nish-meter--ok) > :where(i) {\r
  background: var(--nish-ok-fill);\r
}\r
:where(.nish-meter--warn) > :where(i) {\r
  background: var(--nish-warn-fill);\r
}\r
:where(.nish-meter--loss) > :where(i) {\r
  background: var(--nish-loss-fill);\r
}\r
:where(.nish-meter--info) > :where(i) {\r
  background: var(--nish-info-fill);\r
}\r
/* A quantity with no status meaning (swap, a share of a total). */\r
:where(.nish-meter--neutral) > :where(i) {\r
  background: var(--nish-hi3);\r
}\r
\r
/* --- Disclosure (details.nish-disclosure) --------------------------------------------\r
   <details class="nish-disclosure"><summary>Sources</summary><div>…</div></details>\r
   Native semantics, no script. A chevron turns when open. --card boxes it. */\r
:where(.nish-disclosure) {\r
  min-width: 0;\r
}\r
:where(.nish-disclosure) > :where(summary) {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 8px;\r
  min-height: 32px;\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1.25rem;\r
  list-style: none;\r
  cursor: pointer;\r
  user-select: none;\r
}\r
:where(.nish-disclosure) > :where(summary)::-webkit-details-marker {\r
  display: none;\r
}\r
:where(.nish-disclosure) > :where(summary)::after {\r
  content: '';\r
  flex-shrink: 0;\r
  width: 6px;\r
  height: 6px;\r
  margin: 0 4px 3px;\r
  border-right: 2px solid var(--nish-hi3);\r
  border-bottom: 2px solid var(--nish-hi3);\r
  transform: rotate(45deg);\r
  transition: transform var(--nish-dur-fast) var(--nish-ease-out);\r
}\r
:where(.nish-disclosure[open]) > :where(summary)::after {\r
  margin-bottom: -3px;\r
  transform: rotate(-135deg);\r
}\r
:where(.nish-disclosure) > :where(summary:hover) {\r
  color: var(--nish-accent);\r
}\r
:where(.nish-disclosure) > :where(:not(summary)) {\r
  margin-top: 8px;\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.35rem;\r
}\r
:where(.nish-disclosure--card) {\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-card);\r
}\r
:where(.nish-disclosure--card) > :where(summary) {\r
  min-height: 44px;\r
  padding: 0 16px;\r
}\r
:where(.nish-disclosure--card) > :where(:not(summary)) {\r
  margin-top: 0;\r
  padding: 0 16px 14px;\r
}\r
\r
/* --- Status dot (.nish-dot) ---------------------------------------------------------\r
   <span class="nish-dot nish-dot--ok" aria-hidden="true"></span> next to visible text,\r
   or with a visually hidden label. 8px; --xs 6, --md 10, --lg 14. */\r
:where(.nish-dot) {\r
  display: inline-block;\r
  flex-shrink: 0;\r
  width: 8px;\r
  height: 8px;\r
  border-radius: 50%;\r
  background: var(--nish-ghost);\r
  vertical-align: middle;\r
}\r
:where(.nish-dot--accent) {\r
  background: var(--nish-accent);\r
}\r
:where(.nish-dot--ok) {\r
  background: var(--nish-ok-fill);\r
}\r
:where(.nish-dot--warn) {\r
  background: var(--nish-warn-fill);\r
}\r
:where(.nish-dot--loss) {\r
  background: var(--nish-loss-fill);\r
}\r
:where(.nish-dot--info) {\r
  background: var(--nish-info-fill);\r
}\r
:where(.nish-dot--xs) {\r
  width: 6px;\r
  height: 6px;\r
}\r
:where(.nish-dot--md) {\r
  width: 10px;\r
  height: 10px;\r
}\r
:where(.nish-dot--lg) {\r
  width: 14px;\r
  height: 14px;\r
}\r
/* Halo: a 4px ring of the dot's own fill at 25%. */\r
:where(.nish-dot--halo) {\r
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--nish-ghost) 25%, transparent);\r
}\r
:where(.nish-dot--halo.nish-dot--accent) {\r
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--nish-accent) 25%, transparent);\r
}\r
:where(.nish-dot--halo.nish-dot--ok) {\r
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--nish-ok-fill) 25%, transparent);\r
}\r
:where(.nish-dot--halo.nish-dot--warn) {\r
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--nish-warn-fill) 25%, transparent);\r
}\r
:where(.nish-dot--halo.nish-dot--loss) {\r
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--nish-loss-fill) 25%, transparent);\r
}\r
:where(.nish-dot--halo.nish-dot--info) {\r
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--nish-info-fill) 25%, transparent);\r
}\r
:where(.nish-dot--pulse) {\r
  animation: nish-dot-pulse 1.6s ease-in-out infinite;\r
}\r
@keyframes nish-dot-pulse {\r
  50% {\r
    opacity: 0.4;\r
  }\r
}\r
\r
/* --- Empty and error states (.nish-empty, .nish-error-state) -------------------------\r
   <div class="nish-empty"><p class="nish-empty-title">No trips yet</p><p>Plan one with /trip-plan.</p></div>\r
   <div class="nish-error-state" role="alert"><p>Failed to load</p><button class="nish-btn nish-btn--sm">Retry</button></div> */\r
:where(.nish-empty, .nish-error-state) {\r
  box-sizing: border-box;\r
  display: flex;\r
  flex-direction: column;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 8px;\r
  padding: 48px 24px;\r
  border: 1px dashed var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  line-height: 1rem;\r
  text-align: center;\r
}\r
:where(.nish-empty, .nish-error-state) :where(p) {\r
  max-width: 24rem;\r
  margin: 0;\r
}\r
:where(.nish-empty-title) {\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  line-height: 1.25rem;\r
}\r
:where(.nish-empty, .nish-error-state) > :where(button, a, .nish-btn) {\r
  margin-top: 8px;\r
}\r
:where(.nish-error-state) {\r
  padding: 40px 24px;\r
  border: 1px solid color-mix(in srgb, var(--nish-loss) 30%, transparent);\r
  background: var(--nish-loss-soft);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.25rem;\r
}\r
\r
/* --- Toast (.nish-toast) -----------------------------------------------------------\r
   What showToast() from @nish/ui/theme (window.nishTheme.showToast) renders, inside one\r
   role="status" aria-live="polite" region. By hand:\r
   <div class="nish-toast nish-toast--warn"><p class="nish-toast-body"><strong>mc</strong> is\r
   not reachable. <a href="…">Open it anyway</a></p><button class="nish-toast-close" …></div> */\r
:where(.nish-toast) {\r
  box-sizing: border-box;\r
  position: fixed;\r
  /* Centered with margins, not a transform: the rise animation owns transform. */\r
  left: 0;\r
  right: 0;\r
  bottom: max(calc(var(--nish-bottom-inset, 0px) + 8px), calc(16px + env(safe-area-inset-bottom)));\r
  z-index: var(--nish-z-toast, 60);\r
  display: flex;\r
  align-items: flex-start;\r
  gap: 10px;\r
  width: min(100% - 2 * var(--nish-gutter, 16px), 520px);\r
  margin: 0 auto;\r
  padding: 12px 12px 12px 16px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-md);\r
  background: var(--nish-elevated);\r
  box-shadow: var(--nish-shadow-pop);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  line-height: 1.25rem;\r
  animation: nish-rise-in 160ms var(--nish-ease-out, ease-out) both;\r
}\r
:where(.nish-toast-body) {\r
  flex: 1;\r
  min-width: 0;\r
  margin: 0;\r
  padding-block: 2px;\r
  overflow-wrap: anywhere;\r
}\r
:where(.nish-toast) :where(strong, a) {\r
  color: var(--nish-hi);\r
}\r
:where(.nish-toast) :where(strong) {\r
  font-weight: var(--nish-weight-semibold);\r
}\r
:where(.nish-toast) :where(a) {\r
  text-decoration: underline;\r
  text-underline-offset: 3px;\r
}\r
:where(.nish-toast-action) {\r
  flex-shrink: 0;\r
  margin: -2px 0;\r
  padding: 2px 8px;\r
  border: 0;\r
  border-radius: var(--nish-radius-xs, 4px);\r
  background: transparent;\r
  color: var(--nish-accent);\r
  font: inherit;\r
  font-weight: var(--nish-weight-medium);\r
  text-decoration: none;\r
  cursor: pointer;\r
}\r
:where(.nish-toast) :where(a.nish-toast-action) {\r
  color: var(--nish-accent);\r
  text-decoration: none;\r
}\r
:where(.nish-toast-action:hover) {\r
  background: var(--nish-accent-soft);\r
}\r
:where(.nish-toast-close) {\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  width: 24px;\r
  height: 24px;\r
  padding: 0;\r
  border: 0;\r
  border-radius: var(--nish-radius-xs, 4px);\r
  background: transparent;\r
  color: var(--nish-hi3);\r
  cursor: pointer;\r
}\r
:where(.nish-toast-close:hover) {\r
  background: var(--nish-overlay);\r
  color: var(--nish-hi);\r
}\r
:where(.nish-toast--ok) {\r
  border-color: color-mix(in srgb, var(--nish-ok) 30%, transparent);\r
}\r
:where(.nish-toast--warn) {\r
  border-color: color-mix(in srgb, var(--nish-warn) 30%, transparent);\r
}\r
:where(.nish-toast--loss) {\r
  border-color: color-mix(in srgb, var(--nish-loss) 30%, transparent);\r
}\r
:where(.nish-toast--info) {\r
  border-color: color-mix(in srgb, var(--nish-info) 30%, transparent);\r
}\r
@media (prefers-reduced-motion: reduce) {\r
  :where(.nish-toast) {\r
    animation: none;\r
  }\r
}\r
\r
/* --- Dialog (dialog.nish-dialog) ----------------------------------------------------\r
   What confirmDialog() from @nish/ui/theme (window.nishTheme.confirmDialog) renders: a\r
   native <dialog> opened with showModal(), so the browser traps focus and Escape cancels.\r
   By hand:\r
   <dialog class="nish-dialog" aria-labelledby="t" aria-describedby="b">\r
     <h2 class="nish-dialog-title" id="t">Discard changes?</h2>\r
     <div class="nish-dialog-body" id="b">Your edits are lost.</div>\r
     <div class="nish-dialog-actions"><button class="nish-btn">Cancel</button>\r
       <button class="nish-btn nish-btn--danger">Discard</button></div>\r
   </dialog>\r
   A bottom sheet on phones, a centered 448px panel from 640px, like the React Modal. */\r
:where(.nish-dialog) {\r
  box-sizing: border-box;\r
  width: 100%;\r
  max-width: 100%;\r
  max-height: 85dvh;\r
  margin: auto auto 0;\r
  padding: 0 0 env(safe-area-inset-bottom);\r
  overflow-y: auto;\r
  border: 1px solid var(--nish-line);\r
  border-bottom: 0;\r
  border-radius: 16px 16px 0 0;\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-modal);\r
  color: var(--nish-hi2);\r
  font-family: var(--nish-font-sans, inherit);\r
  font-size: var(--nish-text-sm);\r
  line-height: var(--nish-text-sm-lh, 1.35rem);\r
  animation: nish-sheet-in 240ms var(--nish-ease-out, ease-out) both;\r
}\r
:where(.nish-dialog)::backdrop {\r
  background: rgb(0 0 0 / 0.6);\r
  background: color-mix(in srgb, var(--nish-scrim, #000) 60%, transparent);\r
  animation: nish-fade-in 160ms ease-out both;\r
}\r
:where(.nish-dialog-title) {\r
  margin: 0;\r
  padding: 16px 20px 8px;\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-base);\r
  font-weight: var(--nish-weight-semibold);\r
  line-height: 1.375;\r
  overflow-wrap: anywhere;\r
}\r
/* A title-only question gets the body's bottom gap. */\r
:where(.nish-dialog-title:has(+ .nish-dialog-actions)) {\r
  padding-bottom: 20px;\r
}\r
:where(.nish-dialog-body) {\r
  margin: 0;\r
  padding: 0 20px 20px;\r
  overflow-wrap: anywhere;\r
}\r
:where(.nish-dialog-actions) {\r
  display: flex;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  justify-content: flex-end;\r
  gap: 8px;\r
  padding: 12px 20px;\r
  border-top: 1px solid var(--nish-line);\r
}\r
@media (min-width: 640px) {\r
  :where(.nish-dialog) {\r
    width: min(100% - 32px, 448px);\r
    max-height: 85dvh;\r
    margin: auto;\r
    padding-bottom: 0;\r
    border-bottom: 1px solid var(--nish-line);\r
    border-radius: 16px;\r
    animation-name: nish-rise-in;\r
    animation-duration: 200ms;\r
  }\r
}\r
@media (prefers-reduced-motion: reduce) {\r
  :where(.nish-dialog),\r
  :where(.nish-dialog)::backdrop {\r
    animation: none;\r
  }\r
}\r
\r
/* --- Tooltip (.nish-tooltip > .nish-tooltip-content) ---------------------------------\r
   A CSS-only tip for static pages. The trigger must be focusable (tabindex="0" on a span)\r
   and point at the content with aria-describedby:\r
   <span class="nish-badge nish-tooltip" tabindex="0" aria-describedby="tip-1">Tailnet\r
     <span class="nish-tooltip-content" role="tooltip" id="tip-1">Only on the tailnet.</span>\r
   </span>\r
   It shows on hover and on keyboard focus; mountTooltips() from @nish/ui/theme adds\r
   Escape to hide it. Above the trigger by default; --bottom puts it below, --start and\r
   --end align it to the trigger's left or right edge instead of centering it. An\r
   overflow:hidden ancestor clips it: use the React Tooltip (portaled) there. */\r
:where(.nish-tooltip) {\r
  position: relative;\r
}\r
:where(.nish-tooltip) > :where(.nish-tooltip-content) {\r
  box-sizing: border-box;\r
  position: absolute;\r
  bottom: calc(100% + 8px);\r
  left: 50%;\r
  z-index: var(--nish-z-tooltip, 100);\r
  display: none;\r
  width: max-content;\r
  max-width: min(320px, 100vw - 16px);\r
  padding: 8px 12px;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: var(--nish-radius-sm);\r
  background: var(--nish-elevated);\r
  box-shadow: var(--nish-shadow-pop);\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-xs);\r
  font-weight: var(--nish-weight-normal);\r
  line-height: 1.375;\r
  letter-spacing: normal;\r
  text-align: left;\r
  text-transform: none;\r
  white-space: normal;\r
  pointer-events: none;\r
  transform: translateX(-50%);\r
}\r
:where(.nish-tooltip--bottom) > :where(.nish-tooltip-content) {\r
  top: calc(100% + 8px);\r
  bottom: auto;\r
}\r
:where(.nish-tooltip--start) > :where(.nish-tooltip-content) {\r
  left: 0;\r
  transform: none;\r
}\r
:where(.nish-tooltip--end) > :where(.nish-tooltip-content) {\r
  left: auto;\r
  right: 0;\r
  transform: none;\r
}\r
:where(.nish-tooltip:hover, .nish-tooltip:focus-visible, .nish-tooltip:focus-within) > :where(.nish-tooltip-content) {\r
  display: block;\r
}\r
/* mountTooltips() sets data-tooltip-hidden on Escape until the pointer or focus leaves. */\r
:where(.nish-tooltip[data-tooltip-hidden]) > :where(.nish-tooltip-content) {\r
  display: none;\r
}\r
\r
/* --- Glass (.nish-glass) -------------------------------------------------------------\r
   A see-through fill for controls over a photo or gradient: scope them dark with\r
   data-theme="dark" data-scheme="dark" and add .nish-glass, so the hero shows through.\r
   React: bg-th-bg/60 backdrop-blur-sm. */\r
:where(.nish-glass) {\r
  background: color-mix(in srgb, var(--nish-bg) 60%, transparent);\r
  -webkit-backdrop-filter: blur(4px);\r
  backdrop-filter: blur(4px);\r
}\r
\r
/* --- Skeleton (.nish-skeleton) ------------------------------------------------------\r
   A placeholder block. The fill and the sweeping sheen come from nish.css (base); this adds\r
   the shapes. It sits still under reduced motion.\r
   <div class="nish-skeleton-group" aria-busy="true">\r
     <span class="nish-skeleton nish-skeleton--text" style="width: 60%"></span>\r
     <span class="nish-skeleton nish-skeleton--circle" style="width: 40px"></span>\r
     <div class="nish-skeleton nish-skeleton--thumb"></div>\r
     <div class="nish-skeleton nish-skeleton--card"></div>\r
   </div>\r
   The group is the live region: set aria-busy="false" (or remove the group) once loaded. */\r
:where(.nish-skeleton) {\r
  display: block;\r
  border-radius: var(--nish-radius-sm);\r
}\r
:where(.nish-skeleton--text) {\r
  height: 1em;\r
  width: 100%;\r
  border-radius: var(--nish-radius-xs, 4px);\r
}\r
:where(.nish-skeleton--circle) {\r
  aspect-ratio: 1;\r
  height: auto;\r
  border-radius: 9999px;\r
}\r
:where(.nish-skeleton--thumb) {\r
  width: 100%;\r
  aspect-ratio: 16 / 10;\r
  border-radius: var(--nish-radius-md);\r
}\r
:where(.nish-skeleton--card) {\r
  width: 100%;\r
  height: 120px;\r
  border-radius: var(--nish-radius-card, 12px);\r
}\r
:where(.nish-skeleton-group) {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
}\r
:where(.nish-skeleton-group[aria-busy='false']) {\r
  display: none;\r
}\r
@media (prefers-reduced-motion: reduce) {\r
  :where(.nish-skeleton)::after {\r
    animation: none;\r
    transform: translateX(-100%);\r
  }\r
}\r
\r
/* --- Spinner (.nish-spinner) and busy buttons ---------------------------------------\r
   <span class="nish-spinner" role="status" aria-label="Loading"></span>   (--sm 14px, --lg 24px)\r
   <button class="nish-btn nish-btn--primary" aria-busy="true">Save</button>\r
   A busy button keeps its width, hides its label and shows a spinner in its place. The\r
   caller also sets disabled or ignores clicks while busy. Under reduced motion the\r
   spinner pulses instead of turning (nish.css base rule for .nish-spinner). */\r
:where(.nish-spinner) {\r
  box-sizing: border-box;\r
  display: inline-block;\r
  flex-shrink: 0;\r
  width: 16px;\r
  height: 16px;\r
  border: 2px solid color-mix(in srgb, currentColor 25%, transparent);\r
  border-top-color: currentColor;\r
  border-radius: 9999px;\r
  animation: nish-spin 0.8s linear infinite;\r
}\r
:where(.nish-spinner--sm) {\r
  width: 14px;\r
  height: 14px;\r
}\r
:where(.nish-spinner--lg) {\r
  width: 24px;\r
  height: 24px;\r
  border-width: 3px;\r
}\r
@keyframes nish-spin {\r
  to {\r
    transform: rotate(360deg);\r
  }\r
}\r
:where(.nish-btn[aria-busy='true']) {\r
  position: relative;\r
  color: transparent;\r
  pointer-events: none;\r
}\r
:where(.nish-btn[aria-busy='true'] > *) {\r
  visibility: hidden;\r
}\r
:where(.nish-btn[aria-busy='true'])::after {\r
  content: '';\r
  position: absolute;\r
  top: 50%;\r
  left: 50%;\r
  width: 16px;\r
  height: 16px;\r
  margin: -8px 0 0 -8px;\r
  box-sizing: border-box;\r
  border: 2px solid var(--nish-hi3);\r
  border-top-color: var(--nish-hi);\r
  border-radius: 9999px;\r
  animation: nish-spin 0.8s linear infinite;\r
}\r
:where(.nish-btn--primary[aria-busy='true'])::after {\r
  border-color: color-mix(in srgb, var(--nish-on-accent) 35%, transparent);\r
  border-top-color: var(--nish-on-accent);\r
}\r
:where(.nish-btn--danger[aria-busy='true'])::after {\r
  border-color: color-mix(in srgb, var(--nish-on-loss) 35%, transparent);\r
  border-top-color: var(--nish-on-loss);\r
}\r
@media (prefers-reduced-motion: reduce) {\r
  :where(.nish-btn[aria-busy='true'])::after {\r
    animation: nish-pulse 1.6s ease-in-out infinite !important;\r
    animation-iteration-count: infinite !important;\r
    animation-duration: 1.6s !important;\r
  }\r
}\r
\r
/* --- Sheet (dialog.nish-sheet) ------------------------------------------------------\r
   A general dialog that is a bottom sheet under 640px and a centered panel from 640px.\r
   Open it with openSheet(dialog) from @nish/ui/theme (window.nishTheme.openSheet):\r
   showModal, Escape and backdrop click close it, a swipe down on the handle or header\r
   closes it on touch, and focus returns to the opener.\r
   <dialog class="nish-sheet" aria-labelledby="t">\r
     <header class="nish-sheet-header"><h2 class="nish-sheet-title" id="t">Filters</h2>\r
       <button class="nish-icon-btn" data-sheet-close aria-label="Close">×</button></header>\r
     <div class="nish-sheet-body">…</div>\r
     <footer class="nish-sheet-footer"><button class="nish-btn nish-btn--primary">Apply</button></footer>\r
   </dialog> */\r
:where(.nish-sheet) {\r
  box-sizing: border-box;\r
  width: 100%;\r
  max-width: 100%;\r
  max-height: 85svh;\r
  margin: auto auto 0;\r
  padding: 0 0 env(safe-area-inset-bottom);\r
  overflow: hidden;\r
  overscroll-behavior: contain;\r
  border: 1px solid var(--nish-line);\r
  border-bottom: 0;\r
  border-radius: 16px 16px 0 0;\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-modal);\r
  color: var(--nish-hi2);\r
  font-family: var(--nish-font-sans, inherit);\r
  font-size: var(--nish-text-sm);\r
  line-height: var(--nish-text-sm-lh, 1.35rem);\r
  /* The handle and header are drag targets; the body scrolls itself (pan-y below). */\r
  touch-action: none;\r
}\r
:where(.nish-sheet[open]) {\r
  display: flex;\r
  flex-direction: column;\r
  animation: nish-sheet-in 240ms var(--nish-ease-out, ease-out) both;\r
}\r
:where(.nish-sheet)::before {\r
  content: '';\r
  flex-shrink: 0;\r
  width: 36px;\r
  height: 4px;\r
  margin: 8px auto 0;\r
  border-radius: 9999px;\r
  background: var(--nish-line-strong);\r
}\r
:where(.nish-sheet)::backdrop {\r
  background: rgb(0 0 0 / 0.6);\r
  background: color-mix(in srgb, var(--nish-scrim, #000) 60%, transparent);\r
  animation: nish-fade-in 200ms ease-out both;\r
}\r
/* openSheet() sets data-closing for the exit animation, then calls close(). */\r
:where(.nish-sheet[data-closing]) {\r
  animation: nish-sheet-out 200ms ease-in both;\r
  pointer-events: none;\r
}\r
:where(.nish-sheet[data-closing])::backdrop {\r
  animation: nish-fade-out 200ms ease-in both;\r
}\r
/* The page behind a modal sheet does not scroll. */\r
:where(html:has(.nish-sheet[open])) {\r
  overflow: hidden;\r
}\r
:where(.nish-sheet-header) {\r
  display: flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 12px;\r
  padding: 8px 12px 8px 20px;\r
}\r
:where(.nish-sheet-title) {\r
  min-width: 0;\r
  margin: 0;\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-base);\r
  font-weight: var(--nish-weight-semibold);\r
  line-height: 1.375;\r
  overflow-wrap: anywhere;\r
}\r
:where(.nish-sheet-body) {\r
  min-height: 0;\r
  flex: 1 1 auto;\r
  padding: 0 20px 16px;\r
  overflow-y: auto;\r
  overscroll-behavior: contain;\r
  touch-action: pan-y;\r
  -webkit-overflow-scrolling: touch;\r
}\r
:where(.nish-sheet-footer) {\r
  display: flex;\r
  flex-shrink: 0;\r
  flex-wrap: wrap;\r
  align-items: center;\r
  justify-content: flex-end;\r
  gap: 8px;\r
  padding: 12px 20px;\r
  border-top: 1px solid var(--nish-line);\r
}\r
@media (min-width: 640px) {\r
  :where(.nish-sheet) {\r
    width: min(100% - 32px, 32rem);\r
    margin: auto;\r
    padding-bottom: 0;\r
    border-bottom: 1px solid var(--nish-line);\r
    border-radius: 16px;\r
  }\r
  :where(.nish-sheet[open]) {\r
    animation-name: nish-rise-in;\r
    animation-duration: 200ms;\r
  }\r
  :where(.nish-sheet)::before {\r
    display: none;\r
  }\r
  :where(.nish-sheet[data-closing]) {\r
    animation: nish-fade-out 160ms ease-in both;\r
  }\r
  :where(.nish-sheet-header) {\r
    padding-top: 12px;\r
  }\r
}\r
@media (prefers-reduced-motion: reduce) {\r
  :where(.nish-sheet[open]),\r
  :where(.nish-sheet[data-closing]),\r
  :where(.nish-sheet)::backdrop,\r
  :where(.nish-sheet[data-closing])::backdrop {\r
    animation: none;\r
  }\r
}\r
\r
/* --- Checkbox and Switch (.nish-checkbox, .nish-switch) ------------------------------\r
   <label class="nish-check-row"><input type="checkbox" class="nish-checkbox"> Email me</label>\r
   <label class="nish-check-row"><input type="checkbox" class="nish-switch" role="switch"> Alerts</label>\r
   <button type="button" class="nish-switch" role="switch" aria-checked="true"></button>\r
   The wrapping .nish-check-row is the 44px target. Set --accent on the control or an\r
   ancestor to recolor it (falls back to the theme accent). */\r
:where(.nish-check-row) {\r
  box-sizing: border-box;\r
  display: flex;\r
  align-items: center;\r
  gap: 12px;\r
  min-height: var(--nish-tap-min, 44px);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  cursor: pointer;\r
}\r
:where(.nish-checkbox) {\r
  appearance: none;\r
  -webkit-appearance: none;\r
  position: relative;\r
  box-sizing: border-box;\r
  display: inline-block;\r
  flex-shrink: 0;\r
  width: 20px;\r
  height: 20px;\r
  margin: 0;\r
  border: 1.5px solid var(--nish-line-strong);\r
  border-radius: 5px;\r
  background: var(--nish-surface);\r
  cursor: pointer;\r
  transition:\r
    background-color 120ms,\r
    border-color 120ms;\r
}\r
:where(.nish-checkbox)::after {\r
  content: '';\r
  position: absolute;\r
  top: 2px;\r
  left: 6px;\r
  width: 5px;\r
  height: 10px;\r
  border: solid var(--nish-on-accent);\r
  border-width: 0 2px 2px 0;\r
  transform: rotate(45deg) scale(0);\r
  transition: transform 120ms var(--nish-ease-out, ease-out);\r
}\r
:where(.nish-checkbox:checked, .nish-checkbox:indeterminate) {\r
  border-color: var(--accent, var(--nish-accent));\r
  background: var(--accent, var(--nish-accent));\r
}\r
:where(.nish-checkbox:checked)::after {\r
  transform: rotate(45deg) scale(1);\r
}\r
:where(.nish-checkbox:indeterminate)::after {\r
  top: 7px;\r
  left: 3px;\r
  width: 10px;\r
  height: 0;\r
  border-width: 2px 0 0;\r
  transform: scale(1);\r
}\r
:where(.nish-checkbox:focus-visible, .nish-switch:focus-visible) {\r
  outline: var(--nish-focus-width, 2px) solid var(--nish-focus, var(--nish-accent));\r
  outline-offset: var(--nish-focus-offset, 2px);\r
}\r
:where(.nish-checkbox:disabled, .nish-switch:disabled) {\r
  opacity: 0.5;\r
  cursor: not-allowed;\r
}\r
:where(.nish-switch) {\r
  appearance: none;\r
  -webkit-appearance: none;\r
  position: relative;\r
  box-sizing: border-box;\r
  display: inline-block;\r
  flex-shrink: 0;\r
  width: 44px;\r
  height: 26px;\r
  margin: 0;\r
  padding: 0;\r
  border: 1px solid var(--nish-line-strong);\r
  border-radius: 9999px;\r
  background: var(--nish-elevated);\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    border-color 150ms;\r
}\r
/* The knob. */\r
:where(.nish-switch)::after {\r
  content: '';\r
  position: absolute;\r
  top: 2px;\r
  left: 2px;\r
  width: 20px;\r
  height: 20px;\r
  border-radius: 9999px;\r
  background: var(--nish-hi2);\r
  box-shadow: var(--nish-shadow-card);\r
  transition:\r
    transform 150ms var(--nish-ease-out, ease-out),\r
    background-color 150ms;\r
}\r
/* Extends the touch target to 44px tall without moving layout. */\r
:where(.nish-switch)::before {\r
  content: '';\r
  position: absolute;\r
  inset: -9px 0;\r
}\r
:where(.nish-switch:checked, .nish-switch[aria-checked='true']) {\r
  border-color: var(--accent, var(--nish-accent));\r
  background: var(--accent, var(--nish-accent));\r
}\r
:where(.nish-switch:checked, .nish-switch[aria-checked='true'])::after {\r
  transform: translateX(18px);\r
  background: var(--nish-on-accent);\r
}\r
@media (prefers-reduced-motion: reduce) {\r
  :where(.nish-checkbox),\r
  :where(.nish-checkbox)::after,\r
  :where(.nish-switch),\r
  :where(.nish-switch)::after {\r
    transition: none;\r
  }\r
}\r
\r
/* --- Subnav (.nish-subnav) ----------------------------------------------------------\r
   A sticky jump row for a long page; mountScrollspy(nav) marks the section in view.\r
   <nav class="nish-subnav" aria-label="Sections">\r
     <a href="#a">Overview</a><a href="#b" aria-current="true">Details</a>\r
   </nav>\r
   Give sections class="nish-scroll-target" so a jump stops below the header and this bar. */\r
:where(.nish-subnav) {\r
  --nish-fade-start: #000;\r
  --nish-fade-end: #000;\r
  box-sizing: border-box;\r
  position: sticky;\r
  top: var(--nish-header-h, 0px);\r
  z-index: var(--nish-z-sticky, 20);\r
  display: flex;\r
  gap: 8px;\r
  padding: 8px var(--nish-page-gutter, 16px);\r
  overflow-x: auto;\r
  border-bottom: 1px solid var(--nish-line);\r
  background: var(--nish-bg);\r
  scrollbar-width: none;\r
  -webkit-mask-image: linear-gradient(to right, var(--nish-fade-start), #000 24px, #000 calc(100% - 24px), var(--nish-fade-end));\r
  mask-image: linear-gradient(to right, var(--nish-fade-start), #000 24px, #000 calc(100% - 24px), var(--nish-fade-end));\r
}\r
:where(.nish-subnav)::-webkit-scrollbar {\r
  display: none;\r
}\r
:where(.nish-subnav[data-at-start='false']) {\r
  --nish-fade-start: transparent;\r
}\r
:where(.nish-subnav[data-at-end='false']) {\r
  --nish-fade-end: transparent;\r
}\r
:where(.nish-subnav) > :where(a, button) {\r
  box-sizing: border-box;\r
  display: inline-flex;\r
  flex-shrink: 0;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 6px;\r
  min-height: var(--nish-tap-min, 44px);\r
  padding: 0 14px;\r
  border: 1px solid transparent;\r
  border-radius: 9999px;\r
  background: transparent;\r
  color: var(--nish-hi3);\r
  font: inherit;\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  white-space: nowrap;\r
  text-decoration: none;\r
  cursor: pointer;\r
  transition:\r
    background-color 150ms,\r
    color 150ms;\r
}\r
:where(.nish-subnav) > :where(a:hover, button:hover) {\r
  background: var(--nish-elevated);\r
  color: var(--nish-hi);\r
}\r
:where(.nish-subnav) > :where([aria-current]:not([aria-current='false'])) {\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
}\r
:where(.nish-subnav) > :where(a:focus-visible, button:focus-visible) {\r
  outline: var(--nish-focus-width, 2px) solid var(--nish-focus, var(--nish-accent));\r
  outline-offset: -2px;\r
}\r
\r
/* --- Link card (.nish-link-card) ----------------------------------------------------\r
   The whole card is the link (the LinkCard component).\r
   <a class="nish-link-card" data-accent="chart-3" href="https://mc.nish.software">\r
     <span class="nish-link-card-icon" aria-hidden="true">…</span>\r
     <span class="nish-link-card-title">Minecraft</span>\r
     <span class="nish-link-card-blurb">Server status and controls.</span>\r
     <span class="nish-link-card-meta">Up 3 days</span>\r
   </a>\r
   --row makes a 64px row (icon, title and one-line blurb). data-accent is chart-1 … chart-8\r
   or accent. A non-link <div> with aria-disabled="true" gets the dashed disabled look. */\r
:where(.nish-link-card) {\r
  --nish-card-accent: var(--nish-accent);\r
  box-sizing: border-box;\r
  position: relative;\r
  display: grid;\r
  grid-template-columns: 40px 1fr;\r
  grid-template-areas:\r
    'icon title'\r
    'blurb blurb'\r
    'meta meta';\r
  align-items: center;\r
  column-gap: 12px;\r
  row-gap: 4px;\r
  min-height: var(--nish-tap-min, 44px);\r
  padding: 16px;\r
  border: 1px solid var(--nish-line);\r
  border-radius: var(--nish-radius-card, 12px);\r
  background: var(--nish-surface);\r
  box-shadow: var(--nish-shadow-card);\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  text-decoration: none;\r
  cursor: pointer;\r
  transition:\r
    transform 150ms var(--nish-ease-out, ease-out),\r
    box-shadow 150ms,\r
    border-color 150ms;\r
}\r
:where(.nish-link-card[data-accent='chart-1']) {\r
  --nish-card-accent: var(--nish-chart-1);\r
}\r
:where(.nish-link-card[data-accent='chart-2']) {\r
  --nish-card-accent: var(--nish-chart-2);\r
}\r
:where(.nish-link-card[data-accent='chart-3']) {\r
  --nish-card-accent: var(--nish-chart-3);\r
}\r
:where(.nish-link-card[data-accent='chart-4']) {\r
  --nish-card-accent: var(--nish-chart-4);\r
}\r
:where(.nish-link-card[data-accent='chart-5']) {\r
  --nish-card-accent: var(--nish-chart-5);\r
}\r
:where(.nish-link-card[data-accent='chart-6']) {\r
  --nish-card-accent: var(--nish-chart-6);\r
}\r
:where(.nish-link-card[data-accent='chart-7']) {\r
  --nish-card-accent: var(--nish-chart-7);\r
}\r
:where(.nish-link-card[data-accent='chart-8']) {\r
  --nish-card-accent: var(--nish-chart-8);\r
}\r
:where(.nish-link-card[data-accent='accent']) {\r
  --nish-card-accent: var(--nish-accent);\r
}\r
@media (hover: hover) {\r
  :where(a.nish-link-card:hover) {\r
    border-color: var(--nish-line-strong);\r
    box-shadow: var(--nish-shadow-pop);\r
    transform: translateY(-2px);\r
  }\r
}\r
:where(.nish-link-card:focus-visible) {\r
  outline: var(--nish-focus-width, 2px) solid var(--nish-focus, var(--nish-accent));\r
  outline-offset: var(--nish-focus-offset, 2px);\r
}\r
:where(.nish-link-card-icon) {\r
  grid-area: icon;\r
  display: grid;\r
  place-items: center;\r
  width: 40px;\r
  height: 40px;\r
  border-radius: var(--nish-radius-md);\r
  background: color-mix(in srgb, var(--nish-card-accent) 14%, transparent);\r
  color: var(--nish-card-accent);\r
}\r
:where(.nish-link-card-title) {\r
  grid-area: title;\r
  min-width: 0;\r
  color: var(--nish-hi);\r
  font-size: var(--nish-text-base);\r
  font-weight: var(--nish-weight-semibold);\r
  line-height: 1.375;\r
  overflow-wrap: anywhere;\r
}\r
:where(.nish-link-card-blurb) {\r
  grid-area: blurb;\r
  display: -webkit-box;\r
  -webkit-box-orient: vertical;\r
  -webkit-line-clamp: 3;\r
  line-clamp: 3;\r
  overflow: hidden;\r
  margin-top: 4px;\r
  color: var(--nish-hi3);\r
}\r
:where(.nish-link-card-meta) {\r
  grid-area: meta;\r
  margin-top: 4px;\r
  color: var(--nish-hi3);\r
  font-size: var(--nish-text-xs);\r
  font-variant-numeric: tabular-nums;\r
}\r
:where(.nish-link-card--row) {\r
  grid-template-areas:\r
    'icon title'\r
    'icon blurb';\r
  grid-template-rows: auto auto;\r
  min-height: 64px;\r
  padding: 10px 12px;\r
  row-gap: 0;\r
  box-shadow: none;\r
}\r
:where(.nish-link-card--row) > :where(.nish-link-card-icon) {\r
  width: 40px;\r
  height: 40px;\r
}\r
:where(.nish-link-card--row) > :where(.nish-link-card-title) {\r
  font-size: var(--nish-text-sm);\r
}\r
:where(.nish-link-card--row) > :where(.nish-link-card-blurb) {\r
  margin-top: 0;\r
  -webkit-line-clamp: 1;\r
  line-clamp: 1;\r
}\r
:where(.nish-link-card--row) > :where(.nish-link-card-meta) {\r
  display: none;\r
}\r
:where(.nish-link-card[aria-disabled='true']) {\r
  border-style: dashed;\r
  box-shadow: none;\r
  color: var(--nish-hi3);\r
  cursor: not-allowed;\r
  transform: none;\r
}\r
:where(.nish-link-card[aria-disabled='true']) > :where(.nish-link-card-title) {\r
  color: var(--nish-hi2);\r
}\r
\r
/* --- Sticky (.nish-sticky) ----------------------------------------------------------\r
   A bar that sticks under the header and is always opaque. mountStuck(el) sets data-stuck\r
   once it sticks, which adds the border and shadow.\r
   <div class="nish-sticky">…filters…</div>\r
   Set --nish-sticky-top to stack it under something else (default 0). */\r
:where(.nish-sticky) {\r
  position: sticky;\r
  top: var(--nish-sticky-top, 0px);\r
  z-index: var(--nish-z-sticky, 20);\r
  background: var(--nish-bg);\r
  transition: box-shadow 150ms;\r
}\r
:where(.nish-sticky[data-stuck]) {\r
  border-bottom: 1px solid var(--nish-line);\r
  box-shadow: var(--nish-shadow-card);\r
}\r
\r
/* --- Bottom nav (.nish-bottom-nav) --------------------------------------------------\r
   A fixed tab bar for phones (the BottomNav component), hidden from 768px\r
   (.nish-bottom-nav--lg: from 1024px). mountHeightVar(nav, '--nish-bottom-nav-h') makes\r
   the toast and page padding clear it; give the page class="nish-pad-bottom-inset".\r
   <nav class="nish-bottom-nav" aria-label="Sections">\r
     <a class="nish-bottom-nav-item" href="/" aria-current="page"><svg …/><span>Home</span></a>\r
     <a class="nish-bottom-nav-item" href="/trips"><svg …/><span>Trips</span></a>\r
   </nav> */\r
:where(.nish-bottom-nav) {\r
  box-sizing: border-box;\r
  position: fixed;\r
  inset: auto 0 0;\r
  z-index: 40;\r
  display: flex;\r
  align-items: stretch;\r
  padding: 4px max(4px, env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom)) max(4px, env(safe-area-inset-left));\r
  border-top: 1px solid var(--nish-line);\r
  background: var(--nish-surface);\r
}\r
:where(.nish-bottom-nav-item) {\r
  box-sizing: border-box;\r
  position: relative;\r
  display: flex;\r
  flex: 1 1 0;\r
  min-width: 0;\r
  min-height: 48px;\r
  flex-direction: column;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 2px;\r
  margin: 0 2px;\r
  padding: 4px 2px;\r
  border: 0;\r
  border-radius: 12px;\r
  background: transparent;\r
  color: var(--nish-hi3);\r
  font: inherit;\r
  font-size: 11px;\r
  line-height: 1.2;\r
  text-decoration: none;\r
  cursor: pointer;\r
  -webkit-tap-highlight-color: transparent;\r
}\r
:where(.nish-bottom-nav-item) > :where(span) {\r
  max-width: 100%;\r
  overflow: hidden;\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
:where(.nish-bottom-nav-item) > :where(svg) {\r
  flex-shrink: 0;\r
  width: 22px;\r
  height: 22px;\r
}\r
:where(.nish-bottom-nav-item[aria-current='page']) {\r
  background: var(--nish-accent-soft);\r
  color: var(--nish-accent);\r
  font-weight: var(--nish-weight-medium);\r
}\r
:where(.nish-bottom-nav-item:focus-visible) {\r
  outline: var(--nish-focus-width, 2px) solid var(--nish-focus, var(--nish-accent));\r
  outline-offset: -2px;\r
}\r
@media (min-width: 768px) {\r
  :where(.nish-bottom-nav) {\r
    display: none;\r
  }\r
}\r
@media (min-width: 768px) and (max-width: 1023.98px) {\r
  :where(.nish-bottom-nav--lg) {\r
    display: flex;\r
  }\r
}\r
\r
/* --- Checklist (.nish-checklist) ----------------------------------------------------\r
   Tick-off lists with saved state: mountChecklist(list) stores each checkbox under\r
   list.dataset.store and writes "3 of 12" into .nish-checklist-progress.\r
   <div class="nish-checklist-progress" aria-live="polite">0 of 2</div>\r
   <ul class="nish-checklist" data-store="trip-packing">\r
     <li data-id="passport"><label class="nish-check-row"><input type="checkbox" class="nish-checkbox">\r
       <span class="nish-check-text">Passport</span></label></li>\r
   </ul> */\r
:where(.nish-checklist) {\r
  margin: 0;\r
  padding: 0;\r
  list-style: none;\r
}\r
:where(.nish-checklist) > :where(li) {\r
  border-bottom: 1px solid var(--nish-line);\r
}\r
:where(.nish-checklist) > :where(li:last-child) {\r
  border-bottom: 0;\r
}\r
:where(.nish-checklist) :where(.nish-check-row) {\r
  min-height: var(--nish-tap-min, 44px);\r
  padding-block: 4px;\r
}\r
:where(.nish-checklist) :where(.nish-check-text) {\r
  min-width: 0;\r
  flex: 1;\r
  overflow-wrap: anywhere;\r
}\r
:where(.nish-checklist > li:has(input:checked)) :where(.nish-check-text) {\r
  color: var(--nish-hi3);\r
  text-decoration: line-through;\r
  text-decoration-color: var(--nish-hi3);\r
}\r
:where(.nish-checklist-progress) {\r
  --p: 0%;\r
  display: flex;\r
  align-items: center;\r
  gap: 12px;\r
  margin-bottom: 8px;\r
  color: var(--nish-hi2);\r
  font-size: var(--nish-text-sm);\r
  font-weight: var(--nish-weight-medium);\r
  font-variant-numeric: tabular-nums;\r
  white-space: nowrap;\r
}\r
/* The meter: a 6px track that fills with --p, which mountChecklist sets. */\r
:where(.nish-checklist-progress)::after {\r
  content: '';\r
  flex: 1;\r
  height: 6px;\r
  border-radius: 9999px;\r
  background: linear-gradient(to right, var(--accent, var(--nish-accent)) var(--p), var(--nish-line) var(--p));\r
}\r
\r
/* --- Touch targets for the pieces above ---------------------------------------------- */\r
@media (pointer: coarse) {\r
  :where(.nish-sheet-header) > :where(.nish-icon-btn) {\r
    min-width: var(--nish-tap-min);\r
    min-height: var(--nish-tap-min);\r
  }\r
}\r
\r
/* --- Touch: every control is a 44px target under a coarse pointer ---------------------- */\r
@media (pointer: coarse) {\r
  :where(.nish-btn, .nish-input, .nish-select, .nish-chip, .nish-disclosure > summary) {\r
    min-height: var(--nish-tap-min);\r
  }\r
  :where(.nish-dialog-actions) > :where(.nish-btn) {\r
    min-width: var(--nish-tap-min);\r
  }\r
  :where(.nish-icon-btn, .nish-theme-btn, .nish-toast-action, .nish-toast-close,.nish-seg > button, .nish-seg > a, .nish-seg > [role='radio']) {\r
    min-width: var(--nish-tap-min);\r
    min-height: var(--nish-tap-min);\r
  }\r
  :where(.nish-btn--link) {\r
    min-height: 0;\r
  }\r
}\r
`;export{e as default};