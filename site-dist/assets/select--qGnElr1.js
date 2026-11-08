import{n as e}from"./index-D-iyk81y.js";import{t}from"./jsx-D_XtDQtC.js";import{c as n,o as r,r as i}from"./primitives-Cv1AzcoT.js";import{t as a}from"./shared-DuE1zpPL.js";var o=e(),s={id:`select`,name:`Select`,exports:[`Select`],summary:`A native select with the shared field look, in the same three sizes as Input. It keeps the platform picker on phones, which beats any custom dropdown there.`,importLine:`import { Select } from '@nish/ui';`,controls:[{key:`size`,label:`Size`,type:`select`,options:[`md`,`sm`,`xs`]},{key:`invalid`,label:`Invalid`,type:`boolean`},{key:`disabled`,label:`Disabled`,type:`boolean`}],initial:{size:`md`,invalid:!1,disabled:!1},render:e=>(0,o.jsx)(`div`,{className:`w-full max-w-xs`,children:(0,o.jsx)(a,{label:`Status`,error:e.invalid?`Pick a status.`:void 0,children:(0,o.jsxs)(n,{defaultValue:`applied`,size:e.size,invalid:!!e.invalid,disabled:!!e.disabled,children:[(0,o.jsx)(`option`,{value:`open`,children:`Open`}),(0,o.jsx)(`option`,{value:`applied`,children:`Applied`}),(0,o.jsx)(`option`,{value:`interview`,children:`Interviewing`}),(0,o.jsx)(`option`,{value:`closed`,children:`Closed`})]})})}),code:e=>t(`Select`,{defaultValue:`applied`,size:e.size===`md`?void 0:e.size,invalid:e.invalid,disabled:e.disabled},`
  <option value="open">Open</option>
  <option value="applied">Applied</option>
`).replace(`>
  
`,`>
`),html:{height:160,code:`<div style="display:grid;gap:12px;max-width:24rem">
  <select class="nish-select" aria-label="Server">
    <option>Survival</option>
    <option>Creative</option>
    <option>Hardcore</option>
  </select>
  <select class="nish-select" aria-label="Disabled server" disabled>
    <option>Survival</option>
  </select>
</div>`},stories:[{id:`default`,name:`Default`,render:()=>(0,o.jsx)(a,{label:`Status`,children:(0,o.jsxs)(n,{defaultValue:`applied`,children:[(0,o.jsx)(`option`,{value:`open`,children:`Open`}),(0,o.jsx)(`option`,{value:`applied`,children:`Applied`}),(0,o.jsx)(`option`,{value:`closed`,children:`Closed`})]})})},{id:`sizes`,name:`Sizes`,note:`md h-9 (default), sm h-8, xs h-7, matching Input. Phones get 16px text and 44px height.`,wide:!0,render:()=>(0,o.jsx)(`div`,{className:`grid w-full gap-2 sm:grid-cols-3`,children:[`md`,`sm`,`xs`].map(e=>(0,o.jsxs)(n,{size:e,"aria-label":`Sort (${e})`,defaultValue:`recent`,children:[(0,o.jsxs)(`option`,{value:`recent`,children:[`Most recent (`,e,`)`]}),(0,o.jsx)(`option`,{value:`salary`,children:`Highest salary`})]},e))})},{id:`select-class`,name:`Styling the inner select`,note:`className sizes the wrapper; selectClassName reaches the <select> itself (here: tabular numbers).`,render:()=>(0,o.jsxs)(n,{"aria-label":`Expiry`,className:`w-44`,selectClassName:`tabular-nums`,defaultValue:`2026-11-20`,children:[(0,o.jsx)(`option`,{value:`2026-11-20`,children:`2026-11-20`}),(0,o.jsx)(`option`,{value:`2026-12-18`,children:`2026-12-18`})]})},{id:`invalid`,name:`Invalid`,render:()=>(0,o.jsx)(a,{label:`Expiry`,error:`Pick an expiry date.`,children:(0,o.jsxs)(n,{invalid:!0,defaultValue:``,children:[(0,o.jsx)(`option`,{value:``,children:`Choose…`}),(0,o.jsx)(`option`,{value:`2026-11-20`,children:`Nov 20, 2026`})]})})},{id:`disabled`,name:`Disabled`,render:()=>(0,o.jsx)(a,{label:`Region`,children:(0,o.jsx)(n,{disabled:!0,defaultValue:`us`,children:(0,o.jsx)(`option`,{value:`us`,children:`United States`})})})},{id:`card`,name:`Filter row in a card`,wide:!0,render:()=>(0,o.jsx)(i,{title:`Applications`,padding:`sm`,className:`w-full`,children:(0,o.jsxs)(`div`,{className:`grid w-full gap-3 sm:grid-cols-3`,children:[(0,o.jsx)(a,{label:`Search`,children:(0,o.jsx)(r,{size:`sm`,placeholder:`Company or title`})}),(0,o.jsx)(a,{label:`Status`,children:(0,o.jsxs)(n,{size:`sm`,defaultValue:`all`,children:[(0,o.jsx)(`option`,{value:`all`,children:`All statuses`}),(0,o.jsx)(`option`,{value:`applied`,children:`Applied`})]})}),(0,o.jsx)(a,{label:`Sort`,children:(0,o.jsxs)(n,{size:`sm`,defaultValue:`recent`,children:[(0,o.jsx)(`option`,{value:`recent`,children:`Most recent`}),(0,o.jsx)(`option`,{value:`salary`,children:`Highest salary`})]})})]})})}],usage:`import { Select, Label } from '@nish/ui';

<label className="grid gap-1.5">
  <Label>Status</Label>
  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
    <option value="open">Open</option>
    <option value="applied">Applied</option>
    <option value="closed">Closed</option>
  </Select>
</label>

<Select size="sm" className="w-40" selectClassName="tabular-nums">…</Select>`,guidelines:[`className goes on the wrapper, so width classes (w-40) size the whole control including the chevron.`,`Use selectClassName for the inner <select>, never [&>select]:… selectors.`,`Match the size to the Inputs beside it (sm with sm) so a filter row lines up.`,`For more than about 15 options, or when people need to search, use an Input with suggestions instead.`,`ref, name, value and every other native attribute go to the <select>; only className goes to the wrapper. The chevron sits at the end edge and mirrors in right-to-left layouts.`]};export{s as select};