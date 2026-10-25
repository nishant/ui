// Every component page's content: canvas controls, stories, usage and guidance. The
// props tables come from the TypeScript source (site/docgen.mjs), not from here.
// Each page lives in its own file, site/components/<id>.tsx; add new ones to COMPONENT_DOCS.
import { button } from './button';
import { iconButton } from './icon-button';
import { card } from './card';
import { badge } from './badge';
import { input } from './input';
import { textarea } from './textarea';
import { checkbox } from './checkbox';
import { select } from './select';
import { label } from './label';
import { skeleton } from './skeleton';
import { emptyState } from './empty-state';
import { errorState } from './error-state';
import { toastDoc } from './toast';
import { modal } from './modal';
import { tooltip } from './tooltip';
import { segmented } from './segmented';
import { themeToggle } from './theme-toggle';
import type { ComponentDoc } from './types';

export type { Control, Story, ComponentDoc } from './types';
export { RealModalButton } from './modal';

export const COMPONENT_DOCS: ComponentDoc[] = [
  button,
  iconButton,
  card,
  badge,
  input,
  textarea,
  checkbox,
  select,
  label,
  skeleton,
  emptyState,
  errorState,
  toastDoc,
  modal,
  tooltip,
  segmented,
  themeToggle,
];
