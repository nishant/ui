import{n as e,ot as t}from"./index-DHPUmasy.js";import{t as n}from"./jsx-D_XtDQtC.js";import{n as r}from"./forms-BQ2E5er0.js";import{i}from"./nav-CTx0n157.js";var a=t(),o=e(),s=[`All`,`Flights`,`Hotels`,`Cars`,`Trains`,`Cruises`,`Activities`,`Restaurants`,`Insurance`,`Visas`];function c({initial:e=`Hotels`,...t}){let[n,c]=(0,a.useState)(e);return(0,o.jsx)(`div`,{className:`w-full min-w-0`,children:(0,o.jsx)(i,{...t,children:s.map(e=>(0,o.jsx)(r,{pressed:n===e,onClick:()=>c(e),className:`shrink-0`,children:e},e))})})}var l={id:`scroll-row`,name:`ScrollRow`,exports:[`ScrollRow`],summary:`One horizontally scrolling row (filter chips, tabs, tags) with no scrollbar and soft fades on the edges that have more. The pressed, selected or current child is scrolled into view when it changes, without ever moving the page.`,importLine:`import { ScrollRow } from '@nish/ui';`,controls:[{key:`fade`,label:`Edge fades`,type:`boolean`},{key:`snap`,label:`Snap`,type:`boolean`},{key:`initial`,label:`Pressed chip`,type:`select`,options:s}],initial:{fade:!0,snap:!1,initial:`Cruises`},render:e=>(0,o.jsx)(c,{fade:!!e.fade,snap:!!e.snap,initial:String(e.initial),label:`Categories`},String(e.initial)),code:e=>n(`ScrollRow`,{label:`Categories`,fade:e.fade?void 0:`{false}`,snap:e.snap?!0:void 0},`
  {tags.map((t) => <Chip key={t} pressed={t === tag} onClick={() => setTag(t)}>{t}</Chip>)}
`),html:{height:160,code:`<nish-scroll-row label="Topics" snap>
  <button class="nish-chip" aria-pressed="true">All</button>
  <button class="nish-chip">Guides</button>
  <button class="nish-chip">Builds</button>
  <button class="nish-chip">Redstone</button>
  <button class="nish-chip">Farms</button>
  <button class="nish-chip">Villages</button>
  <button class="nish-chip">Mods</button>
  <button class="nish-chip">Servers</button>
</nish-scroll-row>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements-data.js"><\/script>`},stories:[{id:`chips`,name:`Chips`,note:`Narrow the window: the row scrolls instead of wrapping.`,render:()=>(0,o.jsx)(c,{initial:`Visas`,label:`Categories`})},{id:`nofade`,name:`No fades`,render:()=>(0,o.jsx)(c,{fade:!1,label:`Categories`})},{id:`bleed`,name:`Bleed to the screen edges`,note:`Inside a page with the shared gutter, bleed lets the row run edge to edge while its first chip still lines up with the content.`,render:()=>(0,o.jsxs)(`div`,{className:`w-full overflow-hidden rounded-lg border border-th-line py-3`,children:[(0,o.jsx)(`div`,{className:`px-[var(--nish-page-gutter)] pb-2 text-sm text-th-hi3`,children:`Page content`}),(0,o.jsx)(c,{bleed:!0,label:`Categories`,initial:`Hotels`})]})},{id:`snap`,name:`Snap to chips`,render:()=>(0,o.jsx)(c,{snap:!0,label:`Categories`,initial:`Cars`})}],usage:`import { Chip, ScrollRow } from '@nish/ui';

<ScrollRow label="Categories" bleed>
  {tags.map((t) => (
    <Chip key={t} pressed={t === tag} onClick={() => setTag(t)}>{t}</Chip>
  ))}
</ScrollRow>`,guidelines:[`Children must not shrink: give chips shrink-0 so the row overflows instead of squeezing labels.`,`Mark the current child with aria-pressed, aria-selected or aria-current; ScrollRow brings it into view.`,`Segmented and Tabs already scroll with fades. Use ScrollRow for your own chip rows, filter bars and link lists.`,`as="ul" or as="nav" gives the row the right landmark; pass label to name it.`]};export{l as scrollRow};