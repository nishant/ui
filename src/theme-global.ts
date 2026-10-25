/** Entry for dist/theme.global.js: the theme API as a classic script, for pages that
 *  cannot load modules. <script src="nish/theme.global.js"></script> defines
 *  window.nishTheme; tsup wraps this in an IIFE (globalName in tsup.config.ts). */
export {
  initTheme,
  setThemeChoice,
  cycleTheme,
  onThemeChange,
  readToken,
  registerThemes,
  getThemeChoice,
} from './theme';
