// Applies the saved theme before first paint. Inline it in <head> (or load it
// render-blocking) on every page. Keep it dependency-free and tiny; src/theme.ts holds
// the same rules for runtime switching. {"dark":"dark","light":"light","slate":"dark","terminal":"dark","mocha":"dark","ocean":"dark","contrast":"dark"} is replaced by the build with
// { name: scheme } for every theme in src/tokens.mjs.
(function () {
  var THEMES = __THEMES__;
  var DEFAULT = "dark";
  var KEY = 'nish-theme';
  var root = document.documentElement;
  var choice = null;
  try {
    var m = document.cookie.match(/(?:^|;\s*)nish-theme=([a-z-]+)/);
    choice = m ? m[1] : localStorage.getItem(KEY);
  } catch (e) {}
  if (choice !== 'system' && !THEMES[choice]) choice = 'system';
  var theme = choice;
  if (theme === 'system') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : DEFAULT;
  }
  // A page can limit itself to some themes (<html data-nish-themes="dark light">);
  // anything else falls back to the light/dark theme it is based on.
  var allowed = root.getAttribute('data-nish-themes');
  if (allowed && allowed.split(/\s+/).indexOf(theme) < 0) theme = THEMES[theme];
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-scheme', THEMES[theme]);
  root.setAttribute('data-theme-choice', choice);
  root.style.colorScheme = THEMES[theme];
})();
