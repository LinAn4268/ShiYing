/* ==========================================================================
   拾影 · 练习台（camsim.html）交互
   —— 主题与暗色、外观面板入口、回到顶部与阅读进度。
   与 app.js / detail-app.js 共用同一套 localStorage 键，三页外观保持一致。
   注意：模拟器是独立站点，本页只给入口与说明，不嵌入 iframe。
   ========================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var root = document.documentElement;

  var THEMES = ['paper', 'cinema', 'grid', 'ink', 'mono'];
  var THEME_COLORS = { paper: '#f7f2e8', cinema: '#f2f1ee', grid: '#f3f8f7', ink: '#f4f2ec', mono: '#f4f4f4' };
  var THEME_COLORS_DARK = { paper: '#1b1713', cinema: '#0b0c0f', grid: '#0f1c1e', ink: '#131719', mono: '#0d0d0e' };

  function get(key, def) {
    try {
      var v = localStorage.getItem('shiying:' + key);
      return v === null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function set(key, val) {
    try { localStorage.setItem('shiying:' + key, JSON.stringify(val)); } catch (e) { /* 隐私模式忽略 */ }
  }

  var theme = get('theme', 'paper');
  if (THEMES.indexOf(theme) < 0) theme = 'paper';
  var dark = get('dark', null);
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark === null) dark = !!prefersDark;

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', (dark ? THEME_COLORS_DARK : THEME_COLORS)[t] || '#f7f2e8');
  }
  function setTheme(t) {
    if (THEMES.indexOf(t) < 0) return;
    theme = t; applyTheme(t); set('theme', t);
  }
  function setDark(on) {
    dark = !!on;
    root.setAttribute('data-dark', dark ? 'true' : 'false');
    var btn = $('#darkBtn');
    if (btn) btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    set('dark', dark);
    applyTheme(theme);
    var label = btn && btn.querySelector('.sr-only');
    if (label) label.textContent = dark ? '切换到浅色模式' : '切换到暗色模式';
  }

  /* 把主题接口交给外观面板（look.js 会优先调用它） */
  window.SY = {
    setTheme: setTheme,
    setDark: setDark,
    getTheme: function () { return theme; }
  };

  applyTheme(theme);
  setDark(dark);

  var darkBtn = $('#darkBtn');
  if (darkBtn) darkBtn.addEventListener('click', function () { setDark(!dark); });

  /* 顶栏的外观按钮由 look.js 自己接管（它带开关语义），这里只补页脚入口 */
  var lookBtn = $('#lookBtn');
  function openLook() {
    if (window.SYLook && window.SYLook.open) {
      var opened = document.body.classList.contains('look-open');
      if (!opened) window.SYLook.open();
    }
  }
  if (lookBtn) lookBtn.setAttribute('aria-label', '外观设置');
  var footLook = $('#csLookBtn');
  if (footLook) footLook.addEventListener('click', openLook);

  /* ---------------- 回到顶部 + 阅读进度 ---------------- */
  var toTop = $('#toTop');
  var bar = $('#progressBar');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.pageYOffset || root.scrollTop;
      var h = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      if (toTop) toTop.classList.toggle('is-on', y > 600);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var back = $('#csBack');
      if (back) back.focus({ preventScroll: true });
    });
  }
})();
