import{ct as e,o as t}from"./index-CZR_oHil.js";import{L as n,V as r}from"./docs-BooYRHlr.js";var i=e(),a=t();function o({via:e}){let[t,o]=(0,i.useState)(null),s=(0,a.jsx)(n,{container:e===`prop`?t:void 0,children:(0,a.jsx)(`span`,{className:`rounded-md bg-th-accent-soft px-2 py-1 text-xs font-medium text-th-hi`,children:`Portaled content`})});return(0,a.jsxs)(`div`,{className:`grid w-full gap-2`,children:[(0,a.jsx)(`p`,{className:`text-xs text-th-hi3`,children:e===`prop`?`container prop`:`NishProvider portalContainer`}),(0,a.jsx)(`div`,{ref:o,className:`min-h-10 rounded-lg border border-dashed border-th-line-control p-2`}),e===`prop`?s:(0,a.jsx)(r,{portalContainer:t,children:s})]})}var s={id:`portal`,name:`Portal`,exports:[`Portal`],summary:`Renders its children into another part of the page, outside the parent in the DOM. It renders nothing on the server and in the first client render, so hydration always matches, then mounts. Modal, Drawer, Popover, DropdownMenu, Tooltip and Toaster use it.`,importLine:`import { Portal } from '@nish/ui';`,controls:[],initial:{},render:()=>(0,a.jsx)(o,{via:`prop`}),code:()=>`<Portal container={panelRef.current}>
  <Banner />
</Portal>`,stories:[{id:`container`,name:`A container prop`,render:()=>(0,a.jsx)(o,{via:`prop`})},{id:`provider`,name:`The provider default`,note:`Every Portal below a NishProvider with portalContainer renders there when it has no container of its own.`,render:()=>(0,a.jsx)(o,{via:`provider`})}],usage:`import { Portal, NishProvider } from '@nish/ui';

// Into document.body (the default):
<Portal><Banner /></Portal>

// Into one element:
<Portal container={el}><Banner /></Portal>

// Every overlay of the app into a shadow root or an iframe body:
<NishProvider portalContainer={shadowHost}>
  <App />
</NishProvider>`,guidelines:[`The order of choice is the container prop, then the provider portalContainer, then document.body.`,`Nothing renders until the component has mounted on the client, so do not rely on the content for the first paint or for SSR output.`,`Pass a container that already exists when Portal mounts; with null it falls back to the provider, then document.body.`,`For an app inside a shadow root, an iframe or a micro-frontend, set portalContainer once on NishProvider instead of on every overlay.`]};export{s as portal};