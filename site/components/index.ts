// Every component page's content: canvas controls, stories, usage and guidance. The
// props tables come from the TypeScript source (site/docgen.mjs), not from here.
// Each page lives in its own file, site/components/<id>.tsx; add new ones to COMPONENT_DOCS.
import { button } from './button';
import { iconButton } from './icon-button';
import { card } from './card';
import { cardHeader } from './card-header';
import { badge } from './badge';
import { input } from './input';
import { textarea } from './textarea';
import { checkbox } from './checkbox';
import { field } from './field';
import { fieldGroup } from './field-group';
import { switchDoc } from './switch';
import { searchInput } from './search-input';
import { select } from './select';
import { label } from './label';
import { skeleton } from './skeleton';
import { skeletonRows } from './skeleton-rows';
import { spinner } from './spinner';
import { emptyState } from './empty-state';
import { errorState } from './error-state';
import { toastDoc } from './toast';
import { callout } from './callout';
import { statusDot } from './status-dot';
import { stat } from './stat';
import { meter } from './meter';
import { sparkline } from './sparkline';
import { disclosure } from './disclosure';
import { kbd } from './kbd';
import { copyButton } from './copy-button';
import { pageHeader } from './page-header';
import { appHeader } from './app-header';
import { sectionHeader } from './section-header';
import { keyValueList } from './key-value-list';
import { chartLegend } from './chart-legend';
import { table } from './table';
import { chartDoc } from './chart';
import { modal } from './modal';
import { drawer } from './drawer';
import { confirmDialog } from './confirm-dialog';
import { tooltip } from './tooltip';
import { popover } from './popover';
import { dropdownMenu } from './dropdown-menu';
import { segmented } from './segmented';
import { chip } from './chip';
import { tabs } from './tabs';
import { themeToggle } from './theme-toggle';
import { mountThemeToggleDoc } from './mount-theme-toggle';
import { showToastDoc } from './show-toast';
import { confirmDialogFnDoc } from './confirm-dialog-fn';
import { mountTooltipsDoc } from './mount-tooltips';
import { prose } from './prose';
import { baseUtilities } from './base-utilities';
import { bottomNav } from './bottom-nav';
import { moreSheet } from './more-sheet';
import { navRail } from './nav-rail';
import { scrollRow } from './scroll-row';
import { sectionNav } from './section-nav';
import { stickyBar } from './sticky-bar';
import { stickyActionBar } from './sticky-action-bar';
import { loadingBar } from './loading-bar';
import { pageContainer } from './page-container';
import { connectionBanner } from './connection-banner';
import { responsiveTable } from './responsive-table';
import { listRow } from './list-row';
import { linkCard } from './link-card';
import { favicon } from './favicon';
import { asyncPanel } from './async-panel';
import { skeletonPresets } from './skeleton-presets';
import { lineChart } from './line-chart';
import { barChart } from './bar-chart';
import { rangeBar } from './range-bar';
import { commandPalette } from './command-palette';
import { relativeTime } from './relative-time';
import { format } from './format';
import { hooks } from './hooks';
import { layoutContract } from './layout-contract';
import { staticParity } from './static-parity';
import type { ComponentDoc } from './types';

export type { Control, Story, ComponentDoc } from './types';
export { RealModalButton } from './modal';

export const COMPONENT_DOCS: ComponentDoc[] = [
  button,
  iconButton,
  card,
  cardHeader,
  badge,
  input,
  textarea,
  checkbox,
  field,
  fieldGroup,
  switchDoc,
  searchInput,
  select,
  label,
  skeleton,
  skeletonRows,
  spinner,
  emptyState,
  errorState,
  toastDoc,
  callout,
  statusDot,
  stat,
  meter,
  sparkline,
  disclosure,
  kbd,
  copyButton,
  pageHeader,
  appHeader,
  sectionHeader,
  keyValueList,
  table,
  chartDoc,
  chartLegend,
  modal,
  drawer,
  confirmDialog,
  tooltip,
  popover,
  dropdownMenu,
  segmented,
  chip,
  tabs,
  themeToggle,
  mountThemeToggleDoc,
  showToastDoc,
  confirmDialogFnDoc,
  mountTooltipsDoc,
  prose,
  baseUtilities,
  bottomNav,
  moreSheet,
  navRail,
  scrollRow,
  sectionNav,
  stickyBar,
  stickyActionBar,
  loadingBar,
  pageContainer,
  connectionBanner,
  responsiveTable,
  listRow,
  linkCard,
  favicon,
  asyncPanel,
  skeletonPresets,
  lineChart,
  barChart,
  rangeBar,
  commandPalette,
  relativeTime,
  format,
  hooks,
  layoutContract,
  staticParity,
];
