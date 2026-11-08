// Applies the saved theme before first paint. Inline it in <head> (or load it
// render-blocking) on every page. Keep it dependency-free and tiny; src/theme.ts holds
// the same rules for runtime switching. The build replaces __THEMES__ with
// { name: scheme } and __BG__ with { name: bg hex } for every theme in src/tokens.mjs.
(function () {
  var THEMES = {"dark":"dark","light":"light","slate":"dark","terminal":"dark","mocha":"dark","ocean":"dark","contrast":"dark"};
  var BG = {"dark":"#0a0b0f","light":"#f7f6f3","slate":"#18181b","terminal":"#050807","mocha":"#1c1917","ocean":"#020c18","contrast":"#000000"};
  var own = function (o, k) {
    return Object.prototype.hasOwnProperty.call(o, k);
  };
  var root = document.documentElement;
  // An app's own themes: window.__nishExtraThemes = { rose: 'dark', paper: 'light' }.
  var extra = window.__nishExtraThemes || {};
  for (var k in extra) if (own(extra, k) && !own(THEMES, k)) THEMES[k] = extra[k];
  var DEFAULT = "dark";
  // Storage and cookie name: <html data-nish-storage-key="x"> (letters, digits, - and _).
  var KEY = root.getAttribute('data-nish-storage-key');
  if (!KEY || !/^[A-Za-z0-9_-]+$/.test(KEY)) KEY = 'nish-theme';
  var choice = null;
  // Cookies and storage can each throw (sandboxed iframe, blocked site data): read them apart.
  try {
    var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + KEY + '=([a-z0-9-]+)'));
    choice = m ? m[1] : null;
  } catch (e) {}
  if (choice == null) {
    try {
      choice = localStorage.getItem(KEY);
    } catch (e) {}
  }
  if (choice !== 'system' && !(typeof choice === 'string' && own(THEMES, choice))) choice = 'system';
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
  // Browser and PWA chrome in the theme's bg from the first frame. An app's own
  // (registered) theme has no baked color: theme.ts sets it once its CSS is live.
  if (own(BG, theme)) {
    try {
      var meta = document.querySelector('meta[name="theme-color"][data-nish]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('data-nish', '');
        (document.head || root).appendChild(meta);
      }
      meta.setAttribute('content', BG[theme]);
      // A static theme-color an app ships would win over ours (the first one is used).
      // Drop those, but keep the ones scoped by a media attribute or marked data-nish-keep.
      var metas = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < metas.length; i++) {
        var other = metas[i];
        if (other !== meta && !other.hasAttribute('media') && !other.hasAttribute('data-nish-keep') && other.parentNode) {
          other.parentNode.removeChild(other);
        }
      }
    } catch (e) {}
  }
})();
