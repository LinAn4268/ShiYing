/* =========================================================================
   拾影 · 详情页交互
   数据由构建脚本注入：DETAILS（135 条扩写内容，含目录元信息）
   URL 形如 detail.html#8-1-3 ，刷新 / 分享 / 前进后退均可定位。
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var store = {
    get: function (k, def) {
      try { var v = localStorage.getItem('shiying:' + k); return v === null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set: function (k, v) {
      try { localStorage.setItem('shiying:' + k, JSON.stringify(v)); } catch (e) { /* 隐私模式静默失败 */ }
    }
  };
  var THEME_COLORS = { paper: '#f7f2e8', cinema: '#f2f1ee', grid: '#f3f8f7', ink: '#f4f2ec', mono: '#f4f4f4' };
  var THEME_COLORS_DARK = { paper: '#1b1713', cinema: '#0b0c0f', grid: '#0f1a1b', ink: '#131719', mono: '#0d0d0e' };

  var all = (typeof DETAILS !== 'undefined' && Array.isArray(DETAILS)) ? DETAILS.slice() : [];
  var byId = {};
  all.forEach(function (d) { byId[d.id] = d; });
  var order = all.map(function (d) { return d.id; });

  var theme = store.get('theme', 'paper');
  var dark = store.get('dark', null);
  if (dark === null) dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (['paper', 'cinema', 'grid', 'ink', 'mono'].indexOf(theme) === -1) theme = 'paper';

  function applyTheme() {
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-dark', dark ? 'true' : 'false');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', (dark ? THEME_COLORS_DARK : THEME_COLORS)[theme]);
    $('#dtDarkBtn').setAttribute('aria-pressed', dark ? 'true' : 'false');
    $('#dtDarkBtn').setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到暗色模式');
    $$('[data-theme-choice]').forEach(function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-theme-choice') === theme ? 'true' : 'false');
    });
  }

  /* 供外观面板（look.js）调用 */
  window.SY = {
    setTheme: function (t) {
      if (['paper', 'cinema', 'grid', 'ink', 'mono'].indexOf(t) === -1) return;
      theme = t; store.set('theme', theme); applyTheme();
    },
    setDark: function (v) { dark = !!v; store.set('dark', dark); applyTheme(); },
    getTheme: function () { return theme; }
  };

  function buildToc() {
    var box = $('#dtToc');
    if (!all.length) { box.innerHTML = '<p class="dt-side-hint">内容加载失败，请从主页重新进入。</p>'; return; }
    var html = '';
    var lastCh = '', lastSec = '';
    all.forEach(function (d) {
      if (d.chapterId !== lastCh) {
        if (lastCh) html += '</ul></div>';
        html += '<div class="dt-ch"><h3 class="dt-ch-title">' + esc(d.chapterId.replace('ch', '第') + '章 · ' + d.chapterTitle.replace(/^第[^章]*章\s*/, '')) + '</h3>';
        lastCh = d.chapterId; lastSec = '';
      }
      if (d.section !== lastSec) {
        if (lastSec) html += '</ul>';
        html += '<p class="dt-sec-title">' + esc(d.section) + '</p><ul class="dt-links">';
        lastSec = d.section;
      }
      html += '<li><a href="#' + esc(d.id) + '" data-id="' + esc(d.id) + '">' + esc(d.title) + '</a></li>';
    });
    if (lastCh) html += '</ul></div>';
    box.innerHTML = html;
  }

  function tagHTML(tag) {
    if (!tag) return '';
    return '<span class="tag" data-t="' + esc(tag) + '">' + esc(tag) + '</span>';
  }

  function paratext(s) {
    return String(s || '').split(/\n+/).filter(Boolean).map(function (p) {
      return '<p class="dt-p">' + esc(p) + '</p>';
    }).join('');
  }

  function render(id) {
    var d = byId[id];
    var box = $('#dtArticle');
    if (!d) {
      document.title = '未找到要点 · 拾影';
      $('#dtCrumb').textContent = '';
      box.innerHTML = '<div class="dt-notfound"><h1>没有找到这条要点</h1><p>链接可能已失效，回到目录重新选择吧。</p>' +
        '<a class="btn btn-primary" href="index.html">返回拾影主页</a></div>';
      markCurrent('');
      return;
    }
    document.title = d.title.replace(/^[\d.]+\s*/, '') + ' · 拾影';
    $('#dtCrumb').innerHTML = '<b>' + esc(d.chapterTitle) + '</b> / ' + esc(d.section);

    var idx = order.indexOf(id);
    var prev = idx > 0 ? byId[order[idx - 1]] : null;
    var next = idx < order.length - 1 ? byId[order[idx + 1]] : null;

    var html = '';
    html += '<p class="dt-eyebrow">' + esc(d.chapterTitle) + ' · ' + esc(d.section) + '</p>';
    html += '<h1 class="dt-h1" id="dtTitle">' + esc(d.title) + '</h1>';
    html += '<div class="dt-meta">' + tagHTML(d.tag) + '<span class="dt-sec">拾影 · 要点详解</span></div>';
    html += '<p class="dt-lead">' + esc(d.lead || d.text || '') + '</p>';

    html += '<section class="dt-block"><h2 class="dt-h2"><span class="dt-no">1</span>先懂原理</h2>' + paratext(d.principle || d.text) + '</section>';
    if (d.steps && d.steps.length) {
      html += '<section class="dt-block"><h2 class="dt-h2"><span class="dt-no">2</span>动手步骤</h2><ol class="dt-steps">' +
        d.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></section>';
    }
    if (d.mistakes && d.mistakes.length) {
      html += '<section class="dt-block"><h2 class="dt-h2"><span class="dt-no">3</span>常见误区</h2><ul class="dt-mistakes">' +
        d.mistakes.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></section>';
    }
    if (d.example) {
      html += '<section class="dt-block"><h2 class="dt-h2"><span class="dt-no">4</span>举个例子</h2><div class="dt-example">' + paratext(d.example) + '</div></section>';
    }
    if (d.takeaway) {
      html += '<aside class="dt-takeaway"><span class="dt-q" aria-hidden="true">“</span><p>' + esc(d.takeaway) + '</p></aside>';
    }
    if (d.keywords && d.keywords.length) {
      html += '<div class="dt-kw"><span>关键词</span>' + d.keywords.map(function (k) { return '<em>' + esc(k) + '</em>'; }).join('') + '</div>';
    }
    html += '<nav class="dt-footnav" aria-label="上下篇导航">';
    html += prev
      ? '<a rel="prev" href="#' + esc(prev.id) + '"><span class="dt-fn-k">← 上一条</span><span class="dt-fn-t">' + esc(prev.title) + '</span></a>'
      : '<span class="dt-disabled"><span class="dt-fn-k">← 上一条</span><span class="dt-fn-t">已是第一条</span></span>';
    html += next
      ? '<a rel="next" class="dt-next" href="#' + esc(next.id) + '"><span class="dt-fn-k">下一条 →</span><span class="dt-fn-t">' + esc(next.title) + '</span></a>'
      : '<span class="dt-disabled dt-next"><span class="dt-fn-k">下一条 →</span><span class="dt-fn-t">已是最后一条</span></span>';
    html += '</nav>';

    box.innerHTML = html;
    markCurrent(id);
    var activeLink = $('.dt-links a.is-current', $('#dtToc'));
    if (activeLink && activeLink.scrollIntoView) activeLink.scrollIntoView({ block: 'nearest' });
  }

  function markCurrent(id) {
    var side = $('#dtSide');
    var hit = null;
    $$('.dt-links a', side).forEach(function (a) {
      var on = a.getAttribute('data-id') === id;
      a.classList.toggle('is-current', on);
      if (on) { a.setAttribute('aria-current', 'page'); hit = a; }
      else a.removeAttribute('aria-current');
    });
    // 侧栏自动滚到当前条目（只动侧栏自身，不动页面）
    if (hit && side.scrollHeight > side.clientHeight) {
      var top = hit.offsetTop - side.clientHeight / 2 + hit.offsetHeight / 2;
      side.scrollTop = Math.max(0, top);
    }
  }

  function currentId() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ''));
    return byId[h] ? h : (order[0] || '');
  }

  function openSide(on) {
    $('#dtSide').classList.toggle('open', on);
    $('#dtMask').hidden = !on;
    $('#dtSideToggle').setAttribute('aria-expanded', on ? 'true' : 'false');
  }

  function closeTheme() {
    $('#dtThemeMenu').hidden = true;
    $('#dtThemeBtn').setAttribute('aria-expanded', 'false');
  }

  function init() {
    if (!all.length) {
      // 详情数据缺失时给一个明确的降级页面，而不是静默空白
      var box = $('#dtArticle');
      box.innerHTML = '<div class="dt-notfound"><h1>详情内容暂不可用</h1><p>请先在项目目录运行构建脚本，再打开本页。</p><a class="btn btn-primary" href="index.html">返回拾影主页</a></div>';
    } else {
      buildToc();
      render(currentId());
    }
    applyTheme();

    window.addEventListener('hashchange', function () {
      var h = decodeURIComponent(location.hash.replace(/^#/, ''));
      render(byId[h] ? h : '');
      window.scrollTo({ top: 0, behavior: 'auto' });
      openSide(false);
    });

    $('#dtBack').addEventListener('click', function () { location.href = 'index.html'; });
    $('#dtSideToggle').addEventListener('click', function () { openSide(!$('#dtSide').classList.contains('open')); });
    $('#dtMask').addEventListener('click', function () { openSide(false); });

    $('#dtThemeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var m = $('#dtThemeMenu');
      var willOpen = m.hidden;
      m.hidden = !willOpen;
      $('#dtThemeBtn').setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) { var cur = $('[data-theme-choice="' + theme + '"]'); if (cur) cur.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.theme-wrap')) closeTheme();
    });
    $$('[data-theme-choice]').forEach(function (b) {
      b.addEventListener('click', function () {
        theme = b.getAttribute('data-theme-choice');
        store.set('theme', theme);
        applyTheme();
        closeTheme();
        $('#dtThemeBtn').focus();
      });
    });
    $('#dtDarkBtn').addEventListener('click', function () {
      dark = !dark; store.set('dark', dark); applyTheme();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeTheme(); openSide(false); }
    });

    var toTop = $('#dtToTop');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        toTop.classList.toggle('show', window.scrollY > 500);
        ticking = false;
      });
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
