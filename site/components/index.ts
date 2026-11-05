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
import { settingsDoc } from './settings';
import { serviceTokensDoc } from './service-tokens';
import { switchDoc } from './switch';
import { searchInput } from './search-input';
import { filterBar } from './filter-bar';
import { combobox } from './combobox';
import { datePicker } from './date-picker';
import { calendar } from './calendar';
import { multiSelect } from './multi-select';
import { carousel } from './carousel';
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
import { contextMenu } from './context-menu';
import { hoverCard } from './hover-card';
import { segmented } from './segmented';
import { chip } from './chip';
import { tabs } from './tabs';
import { inbox } from './inbox';
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
import { appShell } from './app-shell';
import { connectionBanner } from './connection-banner';
import { responsiveTable } from './responsive-table';
import { virtualList } from './virtual-list';
import { virtualTable } from './virtual-table';
import { treeView } from './tree-view';
import { listRow } from './list-row';
import { mediaRow } from './media-row';
import { splitStage } from './split-stage';
import { linkCard } from './link-card';
import { favicon } from './favicon';
import { asyncPanel } from './async-panel';
import { useResourceDoc } from './use-resource';
import { appErrorBoundary } from './app-error-boundary';
import { skeletonPresets } from './skeleton-presets';
import { lineChart } from './line-chart';
import { barChart } from './bar-chart';
import { rangeBar } from './range-bar';
import { flowSteps } from './flow-steps';
import { stepBar } from './step-bar';
import { agentNode } from './agent-node';
import { workflowBoard } from './workflow-board';
import { activityFeed } from './activity-feed';
import { tickerText } from './ticker-text';
import { animatedList } from './animated-list';
import { systemCanvas } from './system-canvas';
import { commandPalette } from './command-palette';
import { relativeTime } from './relative-time';
import { format } from './format';
import { hooks } from './hooks';
import { layoutContract } from './layout-contract';
import { staticParity } from './static-parity';
import { vitePlugin } from './vite-plugin';
import { radioGroup } from './radio-group';
import { slider } from './slider';
import { tagInput } from './tag-input';
import { fileDropzone } from './file-dropzone';
import { pagination } from './pagination';
import { breadcrumbs } from './breadcrumbs';
import { accordion } from './accordion';
import { separator } from './separator';
import { avatar } from './avatar';
import { progress } from './progress';
import { visuallyHidden } from './visually-hidden';
import { portal } from './portal';
import { provider } from './provider';
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
  settingsDoc,
  serviceTokensDoc,
  switchDoc,
  searchInput,
  filterBar,
  combobox,
  datePicker,
  calendar,
  multiSelect,
  select,
  radioGroup,
  slider,
  tagInput,
  fileDropzone,
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
  separator,
  avatar,
  progress,
  visuallyHidden,
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
  contextMenu,
  hoverCard,
  segmented,
  chip,
  tabs,
  pagination,
  breadcrumbs,
  accordion,
  inbox,
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
  carousel,
  sectionNav,
  stickyBar,
  stickyActionBar,
  loadingBar,
  pageContainer,
  appShell,
  connectionBanner,
  responsiveTable,
  virtualList,
  virtualTable,
  treeView,
  listRow,
  mediaRow,
  splitStage,
  linkCard,
  favicon,
  asyncPanel,
  useResourceDoc,
  appErrorBoundary,
  skeletonPresets,
  lineChart,
  barChart,
  rangeBar,
  flowSteps,
  stepBar,
  agentNode,
  workflowBoard,
  activityFeed,
  tickerText,
  animatedList,
  systemCanvas,
  commandPalette,
  relativeTime,
  format,
  hooks,
  portal,
  provider,
  layoutContract,
  staticParity,
  vitePlugin,
];
