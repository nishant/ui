import{n as e}from"./index-hOL6WPiH.js";import{a as t}from"./nav-BGbQRrFV.js";import{Device as n}from"./bottom-nav-DoPrwkry.js";var r=e(),i=[{id:`overview`,label:`Overview`},{id:`flights`,label:`Flights`,count:3},{id:`hotels`,label:`Hotels`,count:2},{id:`packing`,label:`Packing`},{id:`notes`,label:`Notes`}];function a({sticky:e=!0,counts:n=!0}){let a=i.map(e=>n?e:{id:e.id,label:e.label});return(0,r.jsxs)(`div`,{className:`px-[var(--nish-page-gutter)] pt-4`,children:[(0,r.jsx)(`h2`,{className:`text-lg font-semibold text-th-hi`,children:`Lisbon, March`}),(0,r.jsx)(`p`,{className:`mb-2 text-sm text-th-hi3`,children:`Scroll: the chip of the section you are reading follows.`}),(0,r.jsx)(t,{items:a,sticky:e,updateHash:!1}),i.map(e=>(0,r.jsxs)(`section`,{id:e.id,className:`nish-scroll-target py-6`,children:[(0,r.jsx)(`h3`,{className:`text-base font-semibold text-th-hi`,children:e.label}),(0,r.jsx)(`div`,{className:`mt-2 grid gap-2`,children:[1,2,3].map(t=>(0,r.jsxs)(`div`,{className:`rounded-xl border border-th-line bg-th-surface p-4 text-sm text-th-hi2`,children:[e.label,` item `,t]},t))})]},e.id)),(0,r.jsx)(`div`,{className:`h-64`})]})}var o={id:`section-nav`,name:`SectionNav`,exports:[`SectionNav`],summary:`A row of jump chips for a long page. It sticks under the app header, marks the section being read (aria-current="true", kept in view) and scrolls to a section when you tap its chip. It publishes its own height as --nish-sticky-extra so anchored sections stop below it.`,importLine:`import { SectionNav } from '@nish/ui';`,controls:[{key:`sticky`,label:`Sticky`,type:`boolean`},{key:`counts`,label:`Counts`,type:`boolean`}],initial:{sticky:!0,counts:!0},render:e=>(0,r.jsx)(n,{doc:`section-nav`,args:e,height:420,title:`SectionNav at 360px`,children:(0,r.jsx)(a,{sticky:!!e.sticky,counts:!!e.counts})}),code:e=>[`<SectionNav`,`  items={[`,...i.map(t=>`    { id: '${t.id}', label: '${t.label}'${e.counts&&t.count?`, count: ${t.count}`:``} },`),`  ]}`,...e.sticky?[]:[`  sticky={false}`],`  updateHash={false} // hash-routed apps`,`/>`].join(`
`),html:{height:400,code:`<nish-section-nav label="On this page" sticky="false">
  <a href="#overview">Overview</a>
  <a href="#install">Install</a>
  <a href="#usage">Usage</a>
</nish-section-nav>
<section id="overview" class="nish-scroll-target"><h3>Overview</h3><p>The link of the section you are reading is marked.</p></section>
<section id="install" class="nish-scroll-target"><h3>Install</h3><p>Click a link to scroll to its section.</p></section>
<section id="usage" class="nish-scroll-target"><h3>Usage</h3><p>With update-hash on, the address bar follows.</p></section>
<script>
  document.querySelector('nish-section-nav').addEventListener('nish-select', (e) => console.log(e.detail.id));
<\/script>
<script type="module" src="https://cdn.jsdelivr.net/npm/nish-ui@X.Y.Z/dist/elements-data.js"><\/script>`},stories:[{id:`sticky`,name:`Sticky under the header`,note:`Scroll inside the preview. Each section carries class nish-scroll-target.`,render:()=>(0,r.jsx)(n,{doc:`section-nav`,story:`sticky`,height:420,title:`Sticky SectionNav`,children:(0,r.jsx)(a,{})})},{id:`inline`,name:`Not sticky`,render:()=>(0,r.jsx)(n,{doc:`section-nav`,story:`inline`,height:320,title:`Inline SectionNav`,children:(0,r.jsx)(a,{sticky:!1,counts:!1})})}],usage:`import { SectionNav } from '@nish/ui';

<SectionNav
  items={[
    { id: 'overview', label: 'Overview' },
    { id: 'flights', label: 'Flights', count: flights.length },
  ]}
/>

<section id="overview" className="nish-scroll-target">…</section>
<section id="flights" className="nish-scroll-target">…</section>`,guidelines:[`The landmark is named "On this page" by default, so it differs from the app navigation ("Sections"); translate it with label. Chips are 44px tall and wide on touch screens.`,`Give every target section an id and the class nish-scroll-target, so a jump stops below the header and this bar.`,`The default updateHash writes #id; pass updateHash={false} in apps that use hash routing.`,`Keep labels to a word or two. The row scrolls on a phone, but the chips you need should be on screen without scrolling.`,`useScrollSpy(ids) is exported for a custom indicator, e.g. a progress rail on desktop.`],api:{functions:[`useScrollSpy`],interfaces:[]}};export{o as sectionNav};