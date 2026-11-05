export interface DocMeta {
  /** The doc's `id`. */
  id: string;
  /** The doc's `name`. */
  name: string;
  summary: string;
  exports: string[];
  framed?: { height: number };
  fleetOnly?: boolean;
  /** Basename under site/components/, such as 'button.tsx'. */
  file: string;
  /** The identifier in COMPONENT_DOCS, such as 'button'. */
  exportName: string;
}
/** Every doc listed in COMPONENT_DOCS, in order, read from the source (the properties must be literals). */
export declare function docsMeta(root: string): DocMeta[];
