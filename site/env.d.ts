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
    name: string;
    version: string;
    distFiles: string[];
    components: Record<string, ComponentDocgen>;
    functions: Record<string, { name: string; description: string; signatures: string[] }>;
    interfaces: Record<string, { name: string; description: string; props: PropDoc[] }>;
  };
  export default data;
}
