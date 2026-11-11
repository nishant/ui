import{ct as e,o as t}from"./index-CZR_oHil.js";import{a as n,c as r,n as i,o as a,r as o,s,t as c}from"./primitives-_LTRlLi3.js";import{c as l,i as u,n as d,o as f,r as p}from"./forms-D3BChpOO.js";import{n as m}from"./tooltip-B9Hg-uo6.js";import{n as h,r as g}from"./feedback-BGBQfny8.js";import{a as _,c as v,f as y,m as b,n as x,p as S}from"./display-BapalG6e.js";import{t as C}from"./segmented-DCa3d0XW.js";import{t as w}from"./theme-toggle-Dsz8-X6R.js";import{a as T,i as E,n as D,r as O,t as k}from"./table-Bgdrcm-4.js";import{_ as A,h as j,y as M}from"./icons-Cx41G13q.js";import{r as N}from"./shared-D1Wk5Gnl.js";/* empty css                   */var P=e(),F=t(),I=(e,t=16)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${e}</svg>`,L=`<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>`,R=`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>`,z=`<path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/>`,B=`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,V=`<svg data-icon="system" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg><svg data-icon="light" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-2.93 1.41-1.41M17.66 6.34l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41"/></svg><svg data-icon="dark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/></svg>`,H=`style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"`,U=`style="display:grid;gap:12px;width:100%"`;function W(){let[e,t]=(0,P.useState)(``);return(0,F.jsx)(f,{value:e,onChange:t,"aria-label":`Search guides`,placeholder:`Search guides`})}var G=[{id:`btn-variants`,cls:`.nish-btn`,mirrors:`Button`,name:`Button variants`,note:`Secondary is the default. Works on <a> as well as <button>.`,html:`<div ${H}>
  <button type="button" class="nish-btn nish-btn--primary">Save</button>
  <button type="button" class="nish-btn">Cancel</button>
  <button type="button" class="nish-btn nish-btn--soft">Follow</button>
  <button type="button" class="nish-btn nish-btn--subtle">Filter</button>
  <button type="button" class="nish-btn nish-btn--ghost">Skip</button>
  <button type="button" class="nish-btn nish-btn--danger">Delete</button>
  <a class="nish-btn nish-btn--link" href="#/static-sites">View all</a>
</div>`,react:()=>(0,F.jsxs)(N,{children:[(0,F.jsx)(i,{variant:`primary`,children:`Save`}),(0,F.jsx)(i,{children:`Cancel`}),(0,F.jsx)(i,{variant:`ghost`,children:`Skip`}),(0,F.jsx)(i,{variant:`danger`,children:`Delete`})]})},{id:`btn-sizes`,cls:`.nish-btn--xs / --sm / --lg`,mirrors:`Button size`,name:`Button sizes and states`,note:`Every size but link grows to 44px under a coarse pointer. aria-pressed="true" is the selected look.`,html:`<div ${H}>
  <button type="button" class="nish-btn nish-btn--xs">Extra small</button>
  <button type="button" class="nish-btn nish-btn--sm">${I(L,12)}Small</button>
  <button type="button" class="nish-btn">${I(L,14)}Medium</button>
  <button type="button" class="nish-btn nish-btn--lg nish-btn--primary">Large</button>
  <button type="button" class="nish-btn" aria-pressed="true">Pressed</button>
  <button type="button" class="nish-btn nish-btn--primary" disabled>Disabled</button>
</div>`,react:()=>(0,F.jsxs)(N,{children:[(0,F.jsx)(i,{size:`sm`,icon:(0,F.jsx)(j,{size:12}),children:`Small`}),(0,F.jsx)(i,{icon:(0,F.jsx)(j,{size:14}),children:`Medium`}),(0,F.jsx)(i,{size:`lg`,variant:`primary`,children:`Large`}),(0,F.jsx)(i,{variant:`primary`,disabled:!0,children:`Disabled`})]})},{id:`icon-btn`,cls:`.nish-icon-btn`,mirrors:`IconButton`,name:`Icon buttons`,note:`Always give it aria-label (and title). --sm 28px, --xs 24px, --2xs 20px, --round for circles.`,html:`<div ${H}>
  <button type="button" class="nish-icon-btn" aria-label="Refresh" title="Refresh">${I(L)}</button>
  <button type="button" class="nish-icon-btn" aria-label="Settings" title="Settings" aria-pressed="true">${I(R)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--sm" aria-label="Delete" title="Delete">${I(z,14)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--xs" aria-label="Delete" title="Delete">${I(z,12)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--2xs" aria-label="Delete" title="Delete">${I(z,12)}</button>
  <button type="button" class="nish-icon-btn nish-icon-btn--round" aria-label="Refresh" title="Refresh">${I(L)}</button>
</div>`,react:()=>(0,F.jsxs)(N,{children:[(0,F.jsx)(n,{label:`Refresh`,children:(0,F.jsx)(j,{})}),(0,F.jsx)(n,{label:`Settings`,active:!0,children:(0,F.jsx)(A,{})}),(0,F.jsx)(n,{label:`Delete`,size:`sm`,children:(0,F.jsx)(M,{size:14})})]})},{id:`theme-btn`,cls:`.nish-theme-btn`,mirrors:`ThemeToggle compact`,name:`Theme button`,note:`The button mountThemeToggle(button) fills with three icons; data-choice picks the one shown. Here: system, light, dark.`,html:`<div ${H}>
  <button type="button" class="nish-theme-btn" data-choice="system" aria-label="Theme: System. Switch to Light" title="Theme: System. Switch to Light">${V}</button>
  <button type="button" class="nish-theme-btn" data-choice="light" aria-label="Theme: Light. Switch to Dark" title="Theme: Light. Switch to Dark">${V}</button>
  <button type="button" class="nish-theme-btn" data-choice="dark" aria-label="Theme: Dark. Switch to System" title="Theme: Dark. Switch to System">${V}</button>
</div>`,react:()=>(0,F.jsx)(w,{compact:!0})},{id:`card`,cls:`.nish-card`,mirrors:`Card`,name:`Cards`,note:`--padded adds the padding, --interactive the hover (for <a> cards), --inset a raised box inside a card.`,html:`<div ${U}>
  <section class="nish-card nish-card--padded">
    <p class="nish-label" style="margin:0 0 6px">Trip</p>
    <p style="margin:0;font-size:14px;color:var(--nish-hi2)">Three nights in Gatlinburg.</p>
    <div class="nish-card nish-card--inset" style="margin-top:12px;padding:10px 12px;font-size:14px">Cabin confirmed</div>
  </section>
  <a class="nish-card nish-card--padded nish-card--interactive" href="#/static-sites">An interactive card (a link)</a>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsxs)(o,{children:[(0,F.jsx)(s,{children:`Trip`}),(0,F.jsx)(`p`,{className:`mt-1.5 text-sm text-th-hi2`,children:`Three nights in Gatlinburg.`})]}),(0,F.jsx)(o,{interactive:!0,children:`An interactive card`})]})},{id:`badge`,cls:`.nish-badge`,mirrors:`Badge`,name:`Badges`,note:`Tones on their soft tint; --solid uses the fill with on-* text; --tag and --xs for dense labels; hue modifiers keep hi text.`,html:`<div ${U}>
  <div ${H}>
    <span class="nish-badge">Draft</span>
    <span class="nish-badge nish-badge--accent">Pinned</span>
    <span class="nish-badge nish-badge--ok">Booked</span>
    <span class="nish-badge nish-badge--loss">Closed</span>
    <span class="nish-badge nish-badge--warn">Pending</span>
    <span class="nish-badge nish-badge--info">New</span>
  </div>
  <div ${H}>
    <span class="nish-badge nish-badge--solid">Today</span>
    <span class="nish-badge nish-badge--solid nish-badge--accent">3</span>
    <span class="nish-badge nish-badge--solid nish-badge--loss">12</span>
    <span class="nish-badge nish-badge--tag nish-badge--info">Beta</span>
    <span class="nish-badge nish-badge--xs nish-badge--ok">xs</span>
  </div>
  <div ${H}>
    <span class="nish-badge nish-badge--emerald">Emerald</span>
    <span class="nish-badge nish-badge--indigo">Indigo</span>
    <span class="nish-badge nish-badge--amber">Amber</span>
    <span class="nish-badge nish-badge--rose">Rose</span>
    <span class="nish-badge nish-badge--sky">Sky</span>
    <span class="nish-badge nish-badge--violet">Violet</span>
    <span class="nish-badge nish-badge--teal">Teal</span>
    <span class="nish-badge nish-badge--lime">Lime</span>
  </div>
</div>`,react:()=>(0,F.jsxs)(N,{children:[(0,F.jsx)(c,{children:`Draft`}),(0,F.jsx)(c,{tone:`accent`,children:`Pinned`}),(0,F.jsx)(c,{tone:`ok`,children:`Booked`}),(0,F.jsx)(c,{tone:`loss`,children:`Closed`}),(0,F.jsx)(c,{tone:`warn`,children:`Pending`}),(0,F.jsx)(c,{tone:`info`,children:`New`})]})},{id:`fields`,cls:`.nish-input / .nish-select / .nish-textarea`,mirrors:`Input, Select, Textarea`,name:`Fields`,note:`aria-invalid="true" turns the border red. 16px text on phones and touch screens, 44px tall on touch.`,html:`<div ${U}>
  <input class="nish-input" aria-label="Name" placeholder="Grotto Falls">
  <input class="nish-input" aria-label="Stack size" value="65" aria-invalid="true">
  <select class="nish-select" aria-label="Mode"><option>Survival</option><option>Creative</option></select>
  <textarea class="nish-textarea" aria-label="Notes" rows="2" placeholder="Notes"></textarea>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsx)(a,{"aria-label":`Name`,placeholder:`Grotto Falls`}),(0,F.jsx)(a,{"aria-label":`Stack size`,defaultValue:`65`,invalid:!0}),(0,F.jsxs)(r,{"aria-label":`Mode`,children:[(0,F.jsx)(`option`,{children:`Survival`}),(0,F.jsx)(`option`,{children:`Creative`})]}),(0,F.jsx)(l,{"aria-label":`Notes`,rows:2,placeholder:`Notes`})]})},{id:`field`,cls:`.nish-field / .nish-label`,mirrors:`Field, Label`,name:`Field with hint and error`,note:`A <label class="nish-field"> holds the label, the control and a hint or error tied by aria-describedby. --inline puts the label beside it.`,html:`<div ${U}>
  <label class="nish-field">
    <span class="nish-field-label">Blocks per row <span class="nish-optional">Optional</span></span>
    <input class="nish-input" inputmode="numeric" value="16" aria-describedby="{id}-hint">
    <small class="nish-hint" id="{id}-hint">Up to 64.</small>
  </label>
  <label class="nish-field">
    <span class="nish-field-label">Stack size</span>
    <input class="nish-input" value="65" aria-invalid="true" aria-describedby="{id}-err">
    <small class="nish-error" id="{id}-err" role="alert">A stack holds at most 64.</small>
  </label>
  <label class="nish-field nish-field--inline">
    <span class="nish-field-label">Seed</span>
    <input class="nish-input" value="-4172144997902289642">
  </label>
  <span class="nish-label">Section label</span>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsx)(u,{label:`Blocks per row`,hint:`Up to 64.`,optional:!0,children:(0,F.jsx)(a,{inputMode:`numeric`,defaultValue:`16`})}),(0,F.jsx)(u,{label:`Stack size`,error:`A stack holds at most 64.`,children:(0,F.jsx)(a,{defaultValue:`65`})})]})},{id:`search`,cls:`.nish-search`,mirrors:`SearchInput`,name:`Search`,note:`A leading icon, and an optional trailing kbd hint or clear button. --bare drops the box for header search bars.`,html:`<div ${U}>
  <label class="nish-search">${I(B)}<input class="nish-input" type="search" enterkeyhint="search" aria-label="Search guides" placeholder="Search guides"><kbd>/</kbd></label>
  <label class="nish-search nish-search--bare">${I(B)}<input class="nish-input" type="search" aria-label="Search" placeholder="Bare search"></label>
</div>`,react:()=>(0,F.jsx)(W,{})},{id:`seg`,cls:`.nish-seg`,mirrors:`Segmented`,name:`Segmented`,note:`Children are button[aria-pressed] (role="group") or [role=radio][aria-checked] (role="radiogroup"). --joined and --pills are the two other looks.`,html:`<div ${U}>
  <div class="nish-seg" role="group" aria-label="Range">
    <button type="button" aria-pressed="false">1D</button><button type="button" aria-pressed="true">1W</button><button type="button" aria-pressed="false">1M</button><button type="button" aria-pressed="false">1Y</button>
  </div>
  <div class="nish-seg nish-seg--joined" role="group" aria-label="Mode">
    <button type="button" aria-pressed="true">Survival</button><button type="button" aria-pressed="false">Creative</button><button type="button" aria-pressed="false">Hardcore</button>
  </div>
  <div class="nish-seg nish-seg--pills" role="group" aria-label="Section">
    <button type="button" aria-pressed="true">All</button><button type="button" aria-pressed="false">Builds</button><button type="button" aria-pressed="false">Redstone</button>
  </div>
</div>`,react:()=>(0,F.jsx)(C,{label:`Range`,value:`1w`,onChange:()=>{},options:[{value:`1d`,label:`1D`},{value:`1w`,label:`1W`},{value:`1m`,label:`1M`},{value:`1y`,label:`1Y`}]})},{id:`chip`,cls:`.nish-chip`,mirrors:`Chip, ChipGroup`,name:`Chips`,note:`Multi-select filters: each chip toggles aria-pressed on its own. --suggestion adds a leading +; --sm is denser.`,html:`<div class="nish-chips" role="group" aria-label="Ores">
  <button type="button" class="nish-chip" aria-pressed="true">Iron</button>
  <button type="button" class="nish-chip" aria-pressed="false">Gold</button>
  <button type="button" class="nish-chip" aria-pressed="true">Diamond</button>
  <button type="button" class="nish-chip nish-chip--suggestion">Ancient debris</button>
  <button type="button" class="nish-chip nish-chip--sm" aria-pressed="false">Small</button>
</div>`,react:()=>(0,F.jsxs)(p,{label:`Ores`,children:[(0,F.jsx)(d,{pressed:!0,children:`Iron`}),(0,F.jsx)(d,{children:`Gold`}),(0,F.jsx)(d,{pressed:!0,children:`Diamond`}),(0,F.jsx)(d,{variant:`suggestion`,children:`Ancient debris`})]})},{id:`callout`,cls:`.nish-callout`,mirrors:`Callout`,name:`Callouts`,note:`Neutral by default; --info, --ok, --warn, --loss, --accent tint the box. The icon square is the tone fill with on-* text.`,html:`<div ${U}>
  <div class="nish-callout"><span class="nish-callout-icon" aria-hidden="true">i</span><div><p>Neutral: a plain aside.</p></div></div>
  <div class="nish-callout nish-callout--info"><span class="nish-callout-icon" aria-hidden="true">i</span><div><p class="nish-callout-title">Java only</p><p>Bedrock spawns these differently.</p></div></div>
  <div class="nish-callout nish-callout--ok"><span class="nish-callout-icon" aria-hidden="true">✓</span><div><p>Saved. The realm restarts in a minute.</p></div></div>
  <div class="nish-callout nish-callout--warn"><span class="nish-callout-icon" aria-hidden="true">!</span><div><p>Back up the world first.</p></div></div>
  <div class="nish-callout nish-callout--loss"><span class="nish-callout-icon" aria-hidden="true">!</span><div><p>This deletes the chunk.</p></div></div>
  <div class="nish-callout nish-callout--accent"><span class="nish-callout-icon" aria-hidden="true">★</span><div><p>New in 1.21.</p></div></div>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsx)(x,{tone:`info`,title:`Java only`,children:`Bedrock spawns these differently.`}),(0,F.jsx)(x,{tone:`warn`,children:`Back up the world first.`})]})},{id:`stats`,cls:`.nish-stats > .nish-stat`,mirrors:`StatGrid, Stat`,name:`Stats`,note:`A <dl> grid that fits as many as the width allows. --tinted for a raised fill, --sm for dense rows; value tones --ok, --loss, --warn.`,html:`<div ${U}>
  <dl class="nish-stats">
    <div class="nish-stat"><dt class="nish-stat-label">Blocks</dt><dd class="nish-stat-value">1,284</dd><dd class="nish-stat-sub">20 stacks</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Change</dt><dd class="nish-stat-value nish-stat-value--ok">+4.2%</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Drawdown</dt><dd class="nish-stat-value nish-stat-value--loss">−1.8%</dd></div>
  </dl>
  <dl class="nish-stats nish-stats--tinted nish-stats--sm">
    <div class="nish-stat"><dt class="nish-stat-label">XP</dt><dd class="nish-stat-value">1,395</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Levels</dt><dd class="nish-stat-value">30</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Time</dt><dd class="nish-stat-value nish-stat-value--warn">12 min</dd></div>
  </dl>
</div>`,react:()=>(0,F.jsxs)(S,{cols:{base:3,md:3},className:`w-full`,children:[(0,F.jsx)(y,{label:`Blocks`,value:`1,284`,sub:`20 stacks`}),(0,F.jsx)(y,{label:`Change`,value:`+4.2%`,tone:`ok`}),(0,F.jsx)(y,{label:`Drawdown`,value:`−1.8%`,tone:`loss`})]})},{id:`table`,cls:`.nish-table-wrap`,mirrors:`TableWrap, Table`,name:`Table`,note:`A scroll box with zebra rows and a quiet caps header; .num cells align right. --sticky keeps the header in view (cap with --nish-table-max-h).`,html:`<div class="nish-table-wrap nish-table-wrap--sticky" tabindex="0" role="region" aria-label="Item sources" style="--nish-table-max-h:11rem">
  <table>
    <thead><tr><th>Item</th><th>Source</th><th class="num">Per hour</th></tr></thead>
    <tbody>
      <tr><td>Iron</td><td>Golem farm</td><td class="num">1,620</td></tr>
      <tr><td>Gold</td><td>Piglin farm</td><td class="num">4,800</td></tr>
      <tr><td>XP</td><td>Enderman farm</td><td class="num">12,000</td></tr>
      <tr><td>Bamboo</td><td>Observer farm</td><td class="num">9,200</td></tr>
      <tr><td>Kelp</td><td>Zero-tick</td><td class="num">3,100</td></tr>
    </tbody>
  </table>
</div>`,react:()=>(0,F.jsx)(D,{className:`w-full`,children:(0,F.jsxs)(k,{zebra:!0,children:[(0,F.jsx)(`thead`,{children:(0,F.jsxs)(`tr`,{children:[(0,F.jsx)(E,{children:`Item`}),(0,F.jsx)(E,{children:`Source`}),(0,F.jsx)(E,{numeric:!0,children:`Per hour`})]})}),(0,F.jsxs)(`tbody`,{children:[(0,F.jsxs)(T,{children:[(0,F.jsx)(O,{children:`Iron`}),(0,F.jsx)(O,{children:`Golem farm`}),(0,F.jsx)(O,{numeric:!0,children:`1,620`})]}),(0,F.jsxs)(T,{children:[(0,F.jsx)(O,{children:`Gold`}),(0,F.jsx)(O,{children:`Piglin farm`}),(0,F.jsx)(O,{numeric:!0,children:`4,800`})]})]})]})})},{id:`meter`,cls:`.nish-meter`,mirrors:`Meter`,name:`Meters`,note:`A track holding an <i> whose width (or --value) is the amount. Tones use the -fill roles; --sm 4px, default 8px, --lg 12px.`,html:`<div ${U}>
  <div class="nish-meter" role="meter" aria-label="Accent" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><i style="width:40%"></i></div>
  <div class="nish-meter nish-meter--ok nish-meter--sm" role="meter" aria-label="Durability" aria-valuemin="0" aria-valuemax="100" aria-valuenow="82" style="--value:82%"><i></i></div>
  <div class="nish-meter nish-meter--warn" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="71"><i style="width:71%"></i></div>
  <div class="nish-meter nish-meter--loss nish-meter--lg" role="meter" aria-label="Memory" aria-valuemin="0" aria-valuemax="100" aria-valuenow="93"><i style="width:93%"></i></div>
  <div class="nish-meter nish-meter--info" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="25"><i style="width:25%"></i></div>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsx)(v,{label:`Accent`,value:40}),(0,F.jsx)(v,{label:`Durability`,value:82,tone:`ok`,size:`sm`}),(0,F.jsx)(v,{label:`Disk`,value:71,tone:`warn`})]})},{id:`disclosure`,cls:`details.nish-disclosure`,mirrors:`Disclosure`,name:`Disclosure`,note:`Native <details> with a chevron that turns. --card boxes it.`,html:`<div ${U}>
  <details class="nish-disclosure" open><summary>Sources</summary><p>Minecraft Wiki, tested on Bedrock 1.21.</p></details>
  <details class="nish-disclosure nish-disclosure--card"><summary>What you need</summary><p>Two stacks of glass and a hopper.</p></details>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsx)(_,{summary:`Sources`,defaultOpen:!0,children:`Minecraft Wiki, tested on Bedrock 1.21.`}),(0,F.jsx)(_,{summary:`What you need`,variant:`card`,children:`Two stacks of glass and a hopper.`})]})},{id:`dot`,cls:`.nish-dot`,mirrors:`StatusDot`,name:`Status dots`,note:`Always beside visible text (or with a visually hidden label). --xs 6, default 8, --md 10, --lg 14; --halo and --pulse.`,html:`<div ${H}>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--ok" aria-hidden="true"></span>Up</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--warn nish-dot--md" aria-hidden="true"></span>Slow</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--loss nish-dot--halo" aria-hidden="true"></span>Down</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--info nish-dot--xs" aria-hidden="true"></span>Info</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot nish-dot--accent nish-dot--lg nish-dot--pulse" aria-hidden="true"></span>Live</span>
  <span style="display:inline-flex;align-items:center;gap:6px;font-size:14px"><span class="nish-dot" aria-hidden="true"></span>Unknown</span>
</div>`,react:()=>(0,F.jsxs)(N,{children:[(0,F.jsxs)(`span`,{className:`inline-flex items-center gap-1.5 text-sm text-th-hi`,children:[(0,F.jsx)(b,{tone:`ok`}),`Up`]}),(0,F.jsxs)(`span`,{className:`inline-flex items-center gap-1.5 text-sm text-th-hi`,children:[(0,F.jsx)(b,{tone:`warn`,size:`md`}),`Slow`]}),(0,F.jsxs)(`span`,{className:`inline-flex items-center gap-1.5 text-sm text-th-hi`,children:[(0,F.jsx)(b,{tone:`loss`,halo:!0}),`Down`]}),(0,F.jsxs)(`span`,{className:`inline-flex items-center gap-1.5 text-sm text-th-hi`,children:[(0,F.jsx)(b,{tone:`accent`,size:`lg`,pulse:!0}),`Live`]})]})},{id:`empty`,cls:`.nish-empty / .nish-error-state`,mirrors:`EmptyState, ErrorState`,name:`Empty and error states`,html:`<div ${U}>
  <div class="nish-empty"><p class="nish-empty-title">No trips yet</p><p>Plan one and it shows up here.</p></div>
  <div class="nish-error-state" role="alert"><p>Failed to load the realm status.</p><button type="button" class="nish-btn nish-btn--sm">Retry</button></div>
</div>`,react:()=>(0,F.jsxs)(`div`,{className:`grid w-full gap-3`,children:[(0,F.jsx)(h,{title:`No trips yet`,detail:`Plan one and it shows up here.`}),(0,F.jsx)(g,{message:`Failed to load the realm status.`,onRetry:()=>{}})]})},{id:`theme-btn-pill`,cls:`.nish-theme-btn--pill / --labelled`,mirrors:`ThemeToggle variant="pill"`,name:`Theme button as a pill`,note:`Next to .nish-pill-link in a top bar: 44px on every pointer, the same pill border. --labelled shows the word mountThemeToggle(button, { showLabel: true }) adds.`,html:`<div ${H}>
  <a class="nish-pill-link" href="#/static-sites" title="Back to nish.software">&larr; nish.software</a>
  <button type="button" class="nish-theme-btn nish-theme-btn--pill" data-choice="dark" aria-label="Theme: Dark. Switch to System" title="Theme: Dark. Switch to System">${V}</button>
  <button type="button" class="nish-theme-btn nish-theme-btn--labelled" data-choice="light" aria-label="Theme: Light. Switch to Dark" title="Theme: Light. Switch to Dark">${V}<span data-theme-word aria-hidden="true">Light</span></button>
</div>`,react:()=>(0,F.jsxs)(N,{children:[(0,F.jsx)(w,{variant:`pill`}),(0,F.jsx)(w,{variant:`pill`,labels:!0})]})},{id:`pill-link-compact`,cls:`.nish-pill-link--compact`,mirrors:`AppHeader compactPill`,name:`Compact hub pill`,note:`Under 480px only the arrow shows, in a 44px circle; the words stay for screen readers. data-compact="always" (second pill) keeps it compact at every width.`,html:`<div ${H}>
  <a class="nish-pill-link nish-pill-link--compact" href="#/static-sites" title="Back to nish.software">&larr; <span class="nish-pill-link-label">nish.software</span></a>
  <a class="nish-pill-link nish-pill-link--compact" data-compact="always" href="#/static-sites" title="Back to nish.software">&larr; <span class="nish-pill-link-label">nish.software</span></a>
  <span style="font-family:Georgia,serif">Serif page text</span>
</div>`},{id:`badge-on-accent`,cls:`.nish-badge--on-accent`,mirrors:`Badge tone="on-accent"`,name:`Badge on a solid accent fill`,html:`<div ${H}>
  <a class="nish-btn nish-btn--primary" href="#/static-sites">Apply <span class="nish-badge nish-badge--on-accent nish-badge--tag nish-badge--xs">Direct</span></a>
</div>`,react:()=>(0,F.jsxs)(i,{variant:`primary`,children:[`Apply`,(0,F.jsx)(c,{tone:`on-accent`,size:`xs`,variant:`tag`,children:`Direct`})]})},{id:`meter-neutral`,cls:`.nish-meter--neutral`,mirrors:`Meter tone="neutral"`,name:`Neutral meter`,html:`<div ${U}>
  <div class="nish-meter nish-meter--neutral" role="meter" aria-label="Swap used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="39"><i style="width:39%"></i></div>
</div>`,react:()=>(0,F.jsx)(v,{value:39,label:`Swap used`,tone:`neutral`})},{id:`toast`,cls:`.nish-toast`,mirrors:`Toaster`,name:`Toast`,note:`What showToast() renders (fixed at the bottom center; shown in place here). Tone modifiers tint the border: --ok, --warn, --loss, --info.`,html:`<div ${U}>
  <div class="nish-toast nish-toast--warn" style="position:static;width:100%;animation:none"><p class="nish-toast-body"><strong>minecraft.nish.software</strong> is not reachable from here. You can still <a href="#/static-sites">open it anyway</a>.</p><button type="button" class="nish-toast-close" aria-label="Dismiss">${I(`<path d="M18 6 6 18M6 6l12 12"/>`,14)}</button></div>
  <div class="nish-toast nish-toast--ok" style="position:static;width:100%;animation:none"><p class="nish-toast-body">Tile hidden.</p><button type="button" class="nish-toast-action">Undo</button><button type="button" class="nish-toast-close" aria-label="Dismiss">${I(`<path d="M18 6 6 18M6 6l12 12"/>`,14)}</button></div>
</div>`},{id:`dialog`,cls:`.nish-dialog`,mirrors:`ConfirmDialog`,name:`Dialog`,note:`What confirmDialog() renders: a native <dialog> opened with showModal() (a bottom sheet on phones). Shown in place here with the open attribute; a page calls confirmDialog() instead of writing it.`,html:`<div ${U}>
  <dialog open class="nish-dialog" aria-labelledby="{id}-t" aria-describedby="{id}-b" style="position:static;width:100%;margin:0;border-bottom:1px solid var(--nish-line);border-radius:16px;animation:none">
    <h2 class="nish-dialog-title" id="{id}-t">Save before closing?</h2>
    <div class="nish-dialog-body" id="{id}-b">Your note has changes that are not saved yet.</div>
    <div class="nish-dialog-actions"><button type="button" class="nish-btn">Close without saving</button><button type="button" class="nish-btn nish-btn--primary">Save</button></div>
  </dialog>
</div>`},{id:`tooltip`,cls:`.nish-tooltip`,mirrors:`Tooltip`,name:`Tooltip`,note:`Hover or Tab to the badges. The trigger is focusable (tabindex="0" on a span) and names the tip with aria-describedby; mountTooltips() adds Escape. The last one is pinned open (style="display:block") to show the look.`,html:`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:56px 0 8px">
  <span class="nish-badge nish-badge--info nish-tooltip" tabindex="0" aria-describedby="{id}-a">Tailnet<span class="nish-tooltip-content" role="tooltip" id="{id}-a">Only reachable on the tailnet.</span></span>
  <span class="nish-badge nish-tooltip nish-tooltip--start" tabindex="0" aria-describedby="{id}-b">Shown<span class="nish-tooltip-content" role="tooltip" id="{id}-b" style="display:block">Elevated, line-strong border, 12px text.</span></span>
</div>`,react:()=>(0,F.jsx)(m,{tip:`Only reachable on the tailnet.`,children:(0,F.jsx)(c,{tone:`info`,children:`Tailnet`})})},{id:`glass`,cls:`.nish-glass`,mirrors:`bg-th-bg/60 backdrop-blur-sm`,name:`Glass over imagery`,note:`Controls scoped dark (data-theme="dark" data-scheme="dark") over a hero: .nish-glass lets the gradient show through.`,html:`<div style="width:100%;padding:16px;border-radius:12px;background:linear-gradient(135deg,var(--nish-indigo),var(--nish-teal))">
  <div data-theme="dark" data-scheme="dark" ${H}>
    <a class="nish-pill-link nish-glass" href="#/static-sites" title="Back to nish.software">&larr; nish.software</a>
    <button type="button" class="nish-theme-btn nish-theme-btn--pill nish-glass" data-choice="dark" aria-label="Theme: Dark. Switch to System" title="Theme: Dark. Switch to System">${V}</button>
  </div>
</div>`},{id:`in-a-card`,cls:`all of them`,mirrors:`a calculator panel`,name:`In a card`,note:`The classes together, the way a calculator page uses them.`,html:`<section class="nish-card nish-card--padded" style="display:grid;gap:14px;width:100%">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
    <h3 style="margin:0;font-size:14px;font-weight:600">Stack calculator</h3>
    <span class="nish-badge nish-badge--accent">Bedrock</span>
  </div>
  <div class="nish-seg" role="group" aria-label="Unit"><button type="button" aria-pressed="true">Items</button><button type="button" aria-pressed="false">Stacks</button></div>
  <label class="nish-field"><span class="nish-field-label">Items</span><input class="nish-input" inputmode="numeric" value="1284"></label>
  <dl class="nish-stats nish-stats--tinted nish-stats--sm">
    <div class="nish-stat"><dt class="nish-stat-label">Stacks</dt><dd class="nish-stat-value">20</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Left over</dt><dd class="nish-stat-value">4</dd></div>
    <div class="nish-stat"><dt class="nish-stat-label">Shulkers</dt><dd class="nish-stat-value">0.74</dd></div>
  </dl>
  <div class="nish-meter nish-meter--ok" role="meter" aria-label="Shulker box filled" aria-valuemin="0" aria-valuemax="27" aria-valuenow="20"><i style="width:74%"></i></div>
  <div class="nish-callout nish-callout--info"><span class="nish-callout-icon" aria-hidden="true">i</span><div><p>Ender pearls and snowballs stack to 16.</p></div></div>
  <div style="display:flex;gap:8px"><button type="button" class="nish-btn nish-btn--primary">Copy result</button><button type="button" class="nish-btn nish-btn--ghost">Reset</button></div>
</section>`}];function K({story:e,className:t}){let n=`${e.id}-${(0,P.useId)().replace(/[^\w-]/g,``)}`;return(0,F.jsx)(`div`,{className:t,dangerouslySetInnerHTML:{__html:e.html.replaceAll(`{id}`,n)}})}var q=e=>e.html.replaceAll(`{id}`,e.id);export{G as STATIC_STORIES,K as StaticHtml,q as storyCode};