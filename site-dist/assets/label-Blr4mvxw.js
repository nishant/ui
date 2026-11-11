import{o as e}from"./index-CZR_oHil.js";import{t}from"./jsx-BV7y9WFc.js";import{o as n,r,s as i,t as a}from"./primitives-_LTRlLi3.js";import{i as o}from"./forms-D3BChpOO.js";var s=e(),c={id:`label`,name:`Label`,exports:[`Label`],summary:`The small uppercase label over sections of a card. For form fields, use Field.`,importLine:`import { Label } from '@nish/ui';`,controls:[{key:`text`,label:`Text`,type:`text`}],initial:{text:`Price target`},render:e=>(0,s.jsx)(i,{children:String(e.text)}),code:e=>t(`Label`,{},String(e.text)),html:{height:120,code:`<label class="nish-field" style="max-width:24rem">
  <span class="nish-label">Server name</span>
  <input class="nish-input" value="Survival">
</label>`},stories:[{id:`field`,name:`Field label`,render:()=>(0,s.jsx)(o,{label:`Email`,children:(0,s.jsx)(n,{type:`email`,defaultValue:`me@nish.software`})})},{id:`section`,name:`Section heading in a card`,render:()=>(0,s.jsxs)(r,{className:`w-full space-y-2`,children:[(0,s.jsx)(i,{children:`Upcoming`}),(0,s.jsx)(`p`,{className:`text-sm text-th-hi`,children:`Interview with Linear, Thursday 2 pm`}),(0,s.jsx)(`p`,{className:`text-sm text-th-hi`,children:`Offer call with Vercel, Friday 11 am`})]})},{id:`count`,name:`With a count`,render:()=>(0,s.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,s.jsx)(i,{children:`Watchlist`}),(0,s.jsx)(a,{children:`14`})]})}],usage:`import { Field, Input, Label } from '@nish/ui';

// Form field: Field draws the sentence-case label and wires the ids.
<Field label="Email">
  <Input type="email" />
</Field>

// Section or card label: Label.
<Label>Upcoming</Label>`,guidelines:[`Label renders a span. It is for section and card labels. For a form field, use Field, which gives the control a real <label>. If you must label a control yourself, wrap both in a <label> or use htmlFor.`,`Label takes ref and any span attribute.`]};export{c as label};