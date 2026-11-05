/// <reference types="vite/client" />

declare module 'virtual:nish-docgen' {
  export interface PropDoc {
    name: string;
    type: string;
    required: boolean;
    default: string | null;
    description: string;
  }
  export interface ComponentDocgen {
    name: string;
    description: string;
    file: string;
    props: PropDoc[];
    inherits: string[];
    forwardsRef: boolean;
  }
  const data: {
    components: Record<string, ComponentDocgen>;
    functions: Record<string, { name: string; description: string; signatures: string[] }>;
    interfaces: Record<string, { name: string; description: string; props: PropDoc[] }>;
  };
  export default data;
}

declare module 'virtual:nish-pkg' {
  const pkg: { name: string; version: string; distFiles: string[] };
  export default pkg;
}

declare module 'virtual:nish-docs-meta' {
  import type { DocMeta } from './docs-meta.mjs';
  const meta: DocMeta[];
  export default meta;
}
