// The shape of a component docs page: canvas controls, stories, usage and guidance.
import { type ReactNode } from 'react';
import { type Args } from '../lib/jsx';

export type Control =
  | { key: string; label: string; type: 'select'; options: string[] }
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'text' }
  | { key: string; label: string; type: 'number'; min: number; max: number };

export interface Story {
  id: string;
  name: string;
  note?: string;
  render: () => ReactNode;
  /** Spans the full row in the stories grid. */
  wide?: boolean;
}

export interface ComponentDoc {
  id: string;
  name: string;
  /** Names in the docgen output (src/index.ts exports) to show props for. */
  exports: string[];
  summary: string;
  importLine: string;
  controls: Control[];
  initial: Args;
  render: (a: Args) => ReactNode;
  code: (a: Args) => string;
  stories: Story[];
  usage: string;
  guidelines: string[];
  /** Portaled, fixed-position components render in an iframe per story, so each one
   *  gets a whole document (and a whole theme) of its own. */
  framed?: { height: number };
  /** Extra API to document below the props (functions, hooks, types). */
  api?: { functions: string[]; interfaces: string[] };
}
