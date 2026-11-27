/* =========================================================================
   拾影 · 交互
   原生 JS，无依赖。数据由构建脚本注入：DATA（十一章内容）、GLOSSARY（术语）。
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var store = {
    get: function (k, def) {
      try {
        var v = localStorage.getItem('shiying:' + k);
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set: function (k, v) {
      try { localStorage.setItem('shiying:' + k, JSON.stringify(v)); } catch (e) { /* 隐私模式下静默失败 */ }
    }
  };

  /* ------------------------------ 图片素材 ------------------------------
     全部来自 Pexels（免费可商用，无需署名）。全局 PHOTOS 由构建脚本从
     data/photos/home.json 注入：按题材挑选、CDN 直链已逐条验证。
     -------------------------------------------------------------------- */
  var PHOTOS = window.PHOTOS || {};

  var FURTHER = [
    { name: 'Magnum Photos', url: 'https://www.magnumphotos.com/' },
    { name: '500px 摄影社区', url: 'https://500px.com.cn/' },
    { name: '图虫', url: 'https://tuchong.com/' },
    { name: 'LensCulture', url: 'https://www.lensculture.com/' },
    { name: '1x', url: 'https://1x.com/' }
  ];

  /* 两张参数对比表：只讲目录要求里的「参数对比」，不新增目录项 */
  var TABLES = {
    ch2: {
      kicker: '焦段速查',
      title: '不同焦段带来什么',
      head: ['焦段（全画幅）', '视角与空间', '常见用途', '要留意'],
      rows: [
        ['16–35mm 广角', '装得下广阔场景，近大远小被放大', '风光、建筑、室内、环境人像', '边缘易变形，靠近人物会显脸大'],
        ['50mm 标准', '接近人眼观看，自然平实', '日常记录、半身人像、街拍', '视角普通，更依赖内容本身'],
        ['85–135mm 中长焦', '压缩背景，主体与背景被拉近', '人像、静物、特写', '室内空间常不够退'],
        ['200mm 以上长焦', '把远处主体拉近，背景更压缩', '生态、体育、舞台', '更考验稳定性与快门速度']
      ],
      hint: '换焦段不是换「更清楚」，而是换「观众站得多远看」。'
    },
    ch3: {
      kicker: '曝光三要素',
      title: '光圈 · 快门 · ISO 各管什么',
      head: ['要素', '主要作用', '加大后', '代价'],
      rows: [
        ['光圈', '控制进光量与景深', '数字变小（f/1.8），更亮、背景更虚', '景深变浅，边缘与前后景易虚'],
        ['快门', '控制感光时间与运动', '时间变长（1/30s），更亮、可记录轨迹', '手持易糊，移动主体拖影'],
        ['ISO', '放大传感器信号', '数值变高（ISO 3200），更亮', '噪点增加，暗部细节变脏']
      ],
      hint: '三者此消彼长：先确定「谁必须清楚」，再去补另外两项。'
    }
  };

  /* 曝光三要素示意图（内联 SVG，跟随主题变色） */
  var TRIANGLE_SVG = '<svg class="tri" viewBox="0 0 220 168" role="img" aria-label="曝光三要素示意图：光圈与快门决定进光量，ISO 决定信号放大">' +
    '<path d="M110 22 L196 150 L24 150 Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" opacity=".45"/>' +
    '<circle cx="110" cy="22" r="4.5" fill="currentColor"/><circle cx="196" cy="150" r="4.5" fill="currentColor"/><circle cx="24" cy="150" r="4.5" fill="currentColor"/>' +
    '<text x="110" y="14" text-anchor="middle">光圈 f</text>' +
    '<text x="196" y="166" text-anchor="middle">快门 s</text>' +
    '<text x="24" y="166" text-anchor="middle">ISO</text>' +
    '<text x="110" y="96" text-anchor="middle" font-size="10">同一份亮度</text></svg>';

  /* ------------------------------ 状态 ------------------------------ */
  var theme = store.get('theme', 'paper');
  var dark = store.get('dark', null);
  if (dark === null) dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (['paper', 'cinema', 'grid', 'ink', 'mono'].indexOf(theme) === -1) theme = 'paper';

  var readChapters = new Set(store.get('read', []));
  var openUnits = new Set(store.get('openUnits', []));
  var openTocSecs = new Set(store.get('openTocSecs', []));
  var openChapters = new Set(store.get('openChapters', []));
  var closedChapters = new Set(store.get('closedChapters', []));
  var totalItems = DATA.reduce(function (n, c) { return n + c.sections.reduce(function (m, s) { return m + s.items.length; }, 0); }, 0);

  /* ------------------------------ 图片渲染 ------------------------------ */
  function imgTag(key, cls, eager) {
    var p = PHOTOS[key];
    if (!p) return '';
    return '<img class="' + cls + '" src="' + p.src + '"' +
      ' srcset="' + (p.srcset || '') + '"' +
      ' sizes="(max-width:760px) 100vw, 640px"' +
      ' alt="' + esc(p.alt) + '"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" data-key="' + key + '">';
  }

  function figureHTML(key) {
    var p = PHOTOS[key];
    if (!p) return '';
    return '<figure class="figure" data-img="' + key + '">' +
      '<div class="ph">' + imgTag(key, 'fig-img', false) + '</div>' +
      '<figcaption><span class="cap">' + esc(p.cap || '') + '</span>' +
      '<span class="credit">图片来源：<a href="' + p.page + '" target="_blank" rel="noopener noreferrer">' + esc(p.label) + ' ↗</a></span></figcaption></figure>';
  }

  /* ------------------------------ 渲染章节 ------------------------------ */
  function tagHTML(tag) {
    var t = ['理论', '实操', '提示'].indexOf(tag) === -1 ? '提示' : tag;
    return '<span class="tag" data-t="' + t + '">' + t + '</span>';
  }

  function caseItemBody(item) {
    var c = item.case || {};
    var key = item.photoKey || item.id;
    var p = PHOTOS[key];
    var img = p ? '<img src="' + p.src + '" srcset="' + (p.srcset || '') +
      '" sizes="(max-width:760px) 100vw, 420px" alt="' + esc(p.alt || c.title) +
      '" loading="lazy" decoding="async" width="1000" height="667">' : '';
    var fields = [
      ['拍摄场景', c.scene], ['主体', c.subject], ['构图方式', c.composition],
      ['光线条件', c.light], ['参考参数与器材', c.settings], ['差异点', c.difference]
    ].filter(function (f) { return f[1]; });
    var spec = fields.map(function (f) {
      return '<div class="work-spec"><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
    }).join('');
    return '<div class="case-item-body">' +
      '<div class="work-fig">' + img + '<span class="work-genre">' + esc(c.genre || '') + '</span></div>' +
      '<div class="case-item-inner">' +
        '<div class="item-head">' + tagHTML(item.tag) + '<h4>' + esc(item.title) + '</h4></div>' +
        '<p class="work-by">' + esc(c.author || '') + ' · ' + esc(c.source || 'Pexels') +
          (c.en ? '　|　' + esc(c.en) : '') + '</p>' +
        '<dl class="work-specs">' + spec + '</dl>' +
        (c.analysis ? '<p class="work-analysis"><b>画面赏析：</b>' + esc(c.analysis) + '</p>' : '') +
        '<a class="item-detail" href="detail.html#' + encodeURIComponent(item.id) + '" aria-label="阅读「' + esc(item.title) + '」的完整详解">读详解 <span aria-hidden="true">→</span></a>' +
        (c.page ? '<a class="work-link" href="' + c.page + '" target="_blank" rel="noopener noreferrer">查看原图与授权 ↗</a>' : '') +
      '</div></div>';
  }

  function itemHTML(item, isCard) {
    var inner = item.case ? caseItemBody(item) :
      '<div class="' + (isCard ? 'body' : 'item-inner') + '">' +
        '<div class="item-head">' + tagHTML(item.tag) + '<h4>' + esc(item.title) + '</h4></div>' +
        '<p class="item-text">' + esc(item.text) + '</p>' +
        '<a class="item-detail" href="detail.html#' + encodeURIComponent(item.id) + '" aria-label="阅读「' + esc(item.title) + '」的完整详解">读详解 <span aria-hidden="true">→</span></a>' +
      '</div>';
    return '<article class="item' + (isCard ? ' topic-card' : '') + (item.case ? ' case-item' : '') + '" id="' + item.id + '" data-title="' + esc(item.title) + '">' +
      inner + '</article>';
  }

  /* 题材章节：每个小节配一张与该题材对应的图（不再逐卡配图，避免图不对题） */
  var GENRE_IMAGES = {
    '8-1': ['portrait', '50% 22%'], '8-2': ['landscape', '50% 50%'], '8-3': ['motion', '50% 45%'],
    '8-4': ['food', '50% 50%'], '8-5': ['night', '50% 55%']
  };

  function genreFigHTML(def) {
    var p = PHOTOS[def[0]];
    if (!p) return '';
    return '<figure class="figure genre-fig" data-img="' + def[0] + '" style="--pos:' + def[1] + '">' +
      '<div class="ph">' + imgTag(def[0], 'fig-img', false) + '</div>' +
      '<figcaption><span class="cap">' + esc(p.cap || '') + '</span>' +
      '<span class="credit">图片来源：<a href="' + p.page + '" target="_blank" rel="noopener noreferrer">' + esc(p.label) + ' ↗</a></span></figcaption></figure>';
  }

  function chaptersHTML() {
    return DATA.map(function (ch, ci) {
      var num = String(ci + 1).padStart(2, '0');
      var units = ch.sections.map(function (sec, si) {
        var isOpen = openUnits.has(sec.id) || (ci === 0 && !store.get('folded', false));
        var isCard = sec.kind === 'card';
        var items = sec.items.map(function (it) {
          return itemHTML(it, isCard);
        }).join('');
        var gfig = GENRE_IMAGES[sec.id] ? genreFigHTML(GENRE_IMAGES[sec.id]) : '';
        return '<section class="unit' + (isCard ? ' is-cards' : '') + '" id="' + sec.id + '"' +
          ' data-chapter="' + ch.id + '" data-open="' + (isOpen ? 'true' : 'false') + '">' +
          '<h3 class="unit-h"><button class="unit-head" type="button" aria-expanded="' + isOpen + '" aria-controls="' + sec.id + '-body">' +
            '<span class="u-no" aria-hidden="true">' + String(si + 1).padStart(2, '0') + '</span>' +
            '<span class="u-title">' + esc(sec.title) + '</span>' +
            '<span class="u-count">' + sec.items.length + ' 条</span>' +
            '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
          '</button></h3>' +
          '<div class="unit-body" id="' + sec.id + '-body">' + gfig + items + '</div>' +
        '</section>';
      }).join('');

      var table = TABLES[ch.id] ? tableHTML(TABLES[ch.id]) : '';
      var figure = figureHTML(ch.id);
      var further = (ch.id === 'ch5' || ch.id === 'ch8' || ch.id === 'ch10') ? furtherHTML() : '';

      return '<section class="chapter" id="' + ch.id + '" data-n="' + (ci + 1) + '" data-index="' + ci + '">' +
        '<header class="chapter-head">' +
          '<span class="chapter-num" aria-hidden="true">CH.' + num + '</span>' +
          '<h2>' + esc(ch.title) + '</h2>' +
          '<button class="read-btn" type="button" data-read="' + ch.id + '" aria-pressed="false">标记已读</button>' +
        '</header>' +
        '<p class="chapter-meta"><span>' + ch.sections.length + ' 个小节</span><span>' +
          ch.sections.reduce(function (m, s) { return m + s.items.length; }, 0) + ' 条要点</span><span>约 ' +
          Math.max(3, Math.round(ch.intro.length / 90)) + ' 分钟</span></p>' +
        '<p class="chapter-intro">' + esc(ch.intro) + '</p>' +
        figure + table +
        units +
        '<div class="chapter-end">' +
          '<div class="end-box"><h4>本章小结</h4><p>' + esc(ch.summary) + '</p></div>' +
          '<div class="end-box practice"><h4>练习建议</h4><p>' + esc(ch.practice) + '</p></div>' +
        '</div>' + further +
      '</section>';
    }).join('');
  }

  function tableHTML(t) {
    return '<div class="cmp"><p class="cmp-title"><span>' + esc(t.kicker) + '</span><b>' + esc(t.title) + '</b></p>' +
      '<div class="cmp-scroll"><table><thead><tr>' +
      t.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      t.rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + '</th>' + r.slice(1).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></div><p class="hint">' + esc(t.hint) + '</p></div>';
  }

  function furtherHTML() {
    return '<div class="further"><span class="lbl">去看真正的好照片：</span>' +
      FURTHER.map(function (f) {
        return '<a href="' + f.url + '" target="_blank" rel="noopener noreferrer">' + esc(f.name) + ' ↗</a>';
      }).join('') + '</div>';
  }

  /* ------------------------------ 目录 ------------------------------ */
  function tocHTML() {
    return DATA.map(function (ch, ci) {
      var secs = ch.sections.map(function (sec) {
        var isOpen = openTocSecs.has(sec.id);
        return '<div class="toc-sec' + (isOpen ? ' is-open' : '') + '" data-sec="' + sec.id + '">' +
          '<a class="toc-sec-link" href="#' + sec.id + '" data-toc="' + sec.id + '">' + esc(sec.title) + '</a>' +
          '<button class="toc-sec-toggle" type="button" data-toggle-sec="' + sec.id + '" aria-expanded="' + isOpen +
            '" aria-label="展开或收起「' + esc(sec.title) + '」下的三级标题">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
          '<ul class="toc-leaves">' + sec.items.map(function (it) {
            return '<li><a href="#' + it.id + '" data-leaf="' + it.id + '">' + esc(it.title) + '</a></li>';
          }).join('') + '</ul>' +
        '</div>';
      }).join('');
      var chOpen = tocChOpen(ch.id);
      return '<div class="toc-block' + (chOpen ? ' is-open' : '') + '" data-ch="' + ch.id + '">' +
        '<div class="toc-ch-row">' +
          '<a class="toc-ch" href="#' + ch.id + '" data-toc="' + ch.id + '"><span class="n">' + String(ci + 1).padStart(2, '0') + '</span>' +
          '<span>' + esc(ch.title) + '</span></a>' +
          '<button class="toc-ch-toggle" type="button" data-toggle-ch="' + ch.id + '" aria-expanded="' + chOpen +
            '" aria-label="展开或收起第' + (ci + 1) + '章的目录">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>' +
        '</div>' +
        '<div class="toc-secs">' + secs + '</div>' +
      '</div>';
    }).join('');
  }

  function footChaptersHTML() {
    return DATA.map(function (ch, ci) {
      return '<li><a href="#' + ch.id + '">' + String(ci + 1).padStart(2, '0') + '　' + esc(ch.title) + '</a></li>';
    }).join('');
  }

  /* ------------------------------ 术语 ------------------------------ */
  var usedTerms = Object.create(null);

  function glossaryNodes() {
    return $$('.chapter-intro, .item-text').filter(function (el) { return !el.closest('#glossaryDialog'); });
  }

  function annotateTerms() {
    var terms = Object.keys(GLOSSARY).sort(function (a, b) { return b.length - a.length; });
    glossaryNodes().forEach(function (el) {
      var node = el.firstChild;
      // 逐段扫描：每段文本只替换一次，避免替换后父节点引用失效
      var texts = [];
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.nodeValue.trim()) texts.push(n);
      });
      texts.forEach(function (t) {
        var text = t.nodeValue;
        var out = document.createDocumentFragment();
        var cursor = 0;
        while (cursor < text.length) {
          var hit = null, hitAt = -1;
          for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            if (usedTerms[term]) continue;
            var at = text.indexOf(term, cursor);
            if (at > -1 && (hitAt === -1 || at < hitAt)) { hit = term; hitAt = at; }
          }
          if (!hit) break;
          if (hitAt > cursor) out.appendChild(document.createTextNode(text.slice(cursor, hitAt)));
          var ab = document.createElement('abbr');
          ab.className = 'term';
          ab.title = GLOSSARY[hit];
          ab.setAttribute('data-tip', GLOSSARY[hit]);
          ab.setAttribute('tabindex', '0');
          ab.textContent = hit;
          out.appendChild(ab);
          usedTerms[hit] = true;
          cursor = hitAt + hit.length;
        }
        if (cursor === 0) return;
        if (cursor < text.length) out.appendChild(document.createTextNode(text.slice(cursor)));
        t.parentNode.replaceChild(out, t);
      });
    });
  }

  /* ------------------------------ 主题 ------------------------------ */
  var THEME_COLORS = { paper: '#f7f2e8', cinema: '#f2f1ee', grid: '#f3f8f7', ink: '#f4f2ec', mono: '#f4f4f4' };
  var THEME_COLORS_DARK = { paper: '#1b1713', cinema: '#0b0c0f', grid: '#0f1a1b', ink: '#131719', mono: '#0d0d0e' };

  function applyTheme() {
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-dark', dark ? 'true' : 'false');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', (dark ? THEME_COLORS_DARK : THEME_COLORS)[theme]);
    $('#darkBtn').setAttribute('aria-pressed', dark ? 'true' : 'false');
    $('#darkBtn').setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到暗色模式');
    $$('[data-theme-choice]').forEach(function (b) {
      b.setAttribute('aria-checked', b.getAttribute('data-theme-choice') === theme ? 'true' : 'false');
    });
  }

  function setTheme(t, remember) {
    theme = t;
    if (remember !== false) store.set('theme', theme);
    applyTheme();
  }

  function setDark(v) {
    dark = !!v;
    store.set('dark', dark);
    applyTheme();
  }

  /* 供外观面板（look.js）调用 */
  window.SY = {
    setTheme: function (t) { setTheme(t); },
    setDark: setDark,
    getTheme: function () { return theme; }
  };

  /* ------------------------------ 折叠 ------------------------------ */
  function setUnit(unit, open) {
    unit.setAttribute('data-open', open ? 'true' : 'false');
    var head = $('.unit-head', unit);
    if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) openUnits.add(unit.id); else openUnits.delete(unit.id);
    store.set('openUnits', Array.from(openUnits));
    store.set('folded', true);
  }

  function setTocSec(id, open) {
    var sec = $('.toc-sec[data-sec="' + id + '"]');
    if (!sec) return;
    sec.classList.toggle('is-open', open);
    var btn = $('.toc-sec-toggle', sec);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) openTocSecs.add(id); else openTocSecs.delete(id);
    store.set('openTocSecs', Array.from(openTocSecs));
  }

  function paintTocCh(id, open) {
    var block = $('.toc-block[data-ch="' + id + '"]');
    if (!block) return;
    block.classList.toggle('is-open', open);
    var btn = $('.toc-ch-toggle', block);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* 展开/收起状态 = 手动展开 ∪ 滚动到的那一章，手动收起优先（不会自己弹开） */
  function tocChOpen(id) {
    return !closedChapters.has(id) && (openChapters.has(id) || id === autoOpenCh);
  }

  function setTocCh(id, open) {
    if (open) { openChapters.add(id); closedChapters.delete(id); }
    else { openChapters.delete(id); closedChapters.add(id); }
    store.set('openChapters', Array.from(openChapters));
    store.set('closedChapters', Array.from(closedChapters));
    paintTocCh(id, open);
  }

  /* 滚动到新的一章：自动展开它，并把上一章那段「自动展开」收起来（手动的保持不动） */
  var autoOpenCh = null;
  function applyTocAuto(chId) {
    if (!chId) return;
    if (autoOpenCh === null) { autoOpenCh = chId; paintTocCh(chId, tocChOpen(chId)); return; }
    if (chId === autoOpenCh) return;
    var prev = autoOpenCh;
    autoOpenCh = chId;
    paintTocCh(prev, openChapters.has(prev) && !closedChapters.has(prev));
    paintTocCh(chId, tocChOpen(chId));
  }

  /* 把「哪一章折叠、哪一小节展开」的存储状态同步回 DOM（搜索还原等场景用） */
  function syncTocOpen() {
    $$('.toc-block').forEach(function (b) {
      var open = tocChOpen(b.getAttribute('data-ch'));
      b.classList.toggle('is-open', open);
      var t = $('.toc-ch-toggle', b);
      if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.toc-sec').forEach(function (s) {
      var open = openTocSecs.has(s.getAttribute('data-sec'));
      s.classList.toggle('is-open', open);
      var t = $('.toc-sec-toggle', s);
      if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ------------------------------ 进度 ------------------------------ */
  function updateProgress() {
    $('#progressText').textContent = readChapters.size + ' / ' + DATA.length;
    $$('.read-btn').forEach(function (b) {
      var done = readChapters.has(b.getAttribute('data-read'));
      b.classList.toggle('done', done);
      b.setAttribute('aria-pressed', done ? 'true' : 'false');
      b.textContent = done ? '✓ 已读' : '标记已读';
    });
  }

  /* ------------------------------ 搜索 ------------------------------ */
  var search = { active: false, saved: null, q: '' };
  var markNodes = [];

  function clearMarks() {
    markNodes.forEach(function (m) {
      var parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    markNodes = [];
  }

  function markIn(el, q) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT', 'STYLE', 'MARK'].indexOf(p.tagName) > -1) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.toLowerCase().indexOf(q) > -1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var list = [];
    while (walker.nextNode()) list.push(walker.currentNode);
    list.forEach(function (node) {
      var text = node.nodeValue, lower = text.toLowerCase();
      var frag = document.createDocumentFragment();
      var i = 0, pos;
      while ((pos = lower.indexOf(q, i)) > -1) {
        if (pos > i) frag.appendChild(document.createTextNode(text.slice(i, pos)));
        var m = document.createElement('mark');
        m.textContent = text.slice(pos, pos + q.length);
        frag.appendChild(m);
        markNodes.push(m);
        i = pos + q.length;
      }
      if (i < text.length) frag.appendChild(document.createTextNode(text.slice(i)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function resetSearchView() {
    clearMarks();
    $$('.item').forEach(function (el) { el.hidden = false; });
    $$('.unit').forEach(function (u) {
      u.hidden = false;
      if (search.saved && Object.prototype.hasOwnProperty.call(search.saved, u.id)) setUnit(u, search.saved[u.id]);
    });
    $$('.chapter').forEach(function (c) { c.hidden = false; });
    $$('.figure, .cmp, .chapter-end, .further, .chapter-meta, .chapter-intro').forEach(function (el) { el.hidden = false; });
    $$('.toc-block, .toc-sec, .toc-leaves a').forEach(function (el) { el.hidden = false; });
    syncTocOpen();
    $('#emptyState').classList.remove('show');
    $('#searchBar').classList.remove('show');
    search.active = false;
    search.saved = null;
  }

  function doSearch(raw) {
    var q = raw.trim().toLowerCase();
    search.q = raw.trim();
    $('#searchClear').hidden = !q;
    $('#searchClear').classList.toggle('show', !!q);

    if (!q) { resetSearchView(); return; }

    if (!search.active) {
      search.saved = {};
      $$('.unit').forEach(function (u) { search.saved[u.id] = u.getAttribute('data-open') === 'true'; });
      search.active = true;
    }
    clearMarks();

    var hits = 0, firstHit = null;
    $$('.item').forEach(function (el) {
      var hay = (el.getAttribute('data-title') + ' ' + el.textContent).toLowerCase();
      var match = hay.indexOf(q) > -1;
      el.hidden = !match;
      if (match) { hits++; if (!firstHit) firstHit = el; }
    });

    $$('.unit').forEach(function (u) {
      var any = $$('.item', u).some(function (i) { return !i.hidden; });
      u.hidden = !any;
      if (any) {
        var head = $('.unit-head', u);
        u.setAttribute('data-open', 'true');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
    });

    $$('.chapter').forEach(function (c) {
      var any = $$('.unit', c).some(function (u) { return !u.hidden; });
      c.hidden = !any;
      $$('.chapter-intro, .figure, .cmp, .chapter-end, .further, .chapter-meta', c).forEach(function (el) { el.hidden = true; });
    });

    var visibleLeaves = new Set();
    $$('.item').forEach(function (it) { if (!it.hidden) visibleLeaves.add(it.id); });
    $$('.toc-block').forEach(function (b) { b.hidden = true; });
    $$('.toc-sec').forEach(function (s) { s.hidden = true; });
    DATA.forEach(function (ch) {
      var block = $('.toc-block[data-ch="' + ch.id + '"]');
      var chHit = ch.sections.some(function (sec) { return sec.items.some(function (it) { return visibleLeaves.has(it.id); }); });
      if (!block || !chHit) return;
      block.hidden = false;
      block.classList.add('is-open');
      var chBt = $('.toc-ch-toggle', block);
      if (chBt) chBt.setAttribute('aria-expanded', 'true');
      ch.sections.forEach(function (sec) {
        var secEl = $('.toc-sec[data-sec="' + sec.id + '"]', block);
        var secHit = sec.items.some(function (it) { return visibleLeaves.has(it.id); });
        if (secEl) secEl.hidden = !secHit;
        $$('li a', secEl || document.createElement('div')).forEach(function (a) {
          a.hidden = !visibleLeaves.has(a.getAttribute('data-leaf'));
        });
        var toggle = $('.toc-sec-toggle', secEl || document.createElement('div'));
        if (toggle) toggle.hidden = !secHit;
        if (secEl && secHit) secEl.classList.add('is-open');
      });
    });

    if (hits) {
      markIn($('#chapters'), q);
      // 术语节点内的 mark 需要还原成 abbr 结构，这里只标标题与正文，不再动 abbr
    }

    $('#emptyState').classList.toggle('show', hits === 0);
    var bar = $('#searchBar');
    bar.classList.add('show');
    bar.innerHTML = hits
      ? '搜索「<b>' + esc(raw.trim()) + '</b>」· 命中 <b>' + hits + '</b> 条要点 · 共 ' + totalItems + ' 条<button type="button" class="reset" id="resetSearch">清空搜索</button>'
      : '搜索「<b>' + esc(raw.trim()) + '</b>」· 没有匹配的三级标题<button type="button" class="reset" id="resetSearch">清空搜索</button>';
    var reset = $('#resetSearch');
    if (reset) reset.addEventListener('click', function () { $('#search').value = ''; doSearch(''); $('#search').focus(); });

    if (hits && !reduceMotion.matches && window.innerWidth < 1041) closeToc();
  }

  /* ------------------------------ 目录抽屉 ------------------------------ */
  function openToc() {
    document.body.classList.add('toc-open');
    $('#tocBtn').setAttribute('aria-expanded', 'true');
    $('#mask').hidden = false;
  }
  function closeToc() {
    document.body.classList.remove('toc-open');
    $('#tocBtn').setAttribute('aria-expanded', 'false');
    $('#mask').hidden = true;
  }

  /* ------------------------------ 滚动监听 ------------------------------ */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      $('#progressBar').style.width = (docH > 0 ? Math.min(100, (y / docH) * 100) : 0) + '%';
      $('#toTop').classList.toggle('show', y > 520);

      var chapters = $$('.chapter');
      var current = null;
      for (var i = 0; i < chapters.length; i++) {
        if (chapters[i].getBoundingClientRect().top <= 130) current = chapters[i];
      }
      if (!current && chapters.length) current = chapters[0];
      var chId = current ? current.id : null;

      $$('.toc-block').forEach(function (b) {
        b.classList.toggle('is-current', b.getAttribute('data-ch') === chId);
      });
      if (!search.active) applyTocAuto(chId);

      // 当前小节与条目
      var curSec = null, curLeaf = null;
      var units = current ? $$('.unit', current) : [];
      for (var j = 0; j < units.length; j++) {
        if (units[j].getBoundingClientRect().top <= 150) curSec = units[j];
      }
      if (curSec) {
        var items = $$('.item', curSec);
        for (var k = 0; k < items.length; k++) {
          if (items[k].getBoundingClientRect().top <= 150) curLeaf = items[k];
        }
      }
      $$('.toc-sec').forEach(function (s) {
        s.classList.toggle('is-current', !!curSec && s.getAttribute('data-sec') === curSec.id);
      });
      $$('.toc-leaves a').forEach(function (a) {
        a.classList.toggle('is-active', !!curLeaf && a.getAttribute('data-leaf') === curLeaf.id);
      });

      var activeLeaf = curLeaf ? $('.toc-leaves a[data-leaf="' + curLeaf.id + '"]') : null;
      if (activeLeaf && window.innerWidth > 1040) {
        var toc = $('#toc');
        var rect = activeLeaf.getBoundingClientRect();
        var trect = toc.getBoundingClientRect();
        if (rect.top < trect.top + 40 || rect.bottom > trect.bottom - 40) {
          toc.scrollTop += rect.top - trect.top - trect.height / 2;
        }
      }
      ticking = false;
    });
  }

  /* ------------------------------ 图片失败降级 ------------------------------ */
  function bindImages() {
    $$('img[data-key]').forEach(function (img) {
      if (img.dataset.bound) return;
      img.dataset.bound = '1';
      img.addEventListener('error', function () {
        img.style.visibility = 'hidden';
        var host = img.closest('.figure, .topic-card');
        if (host) host.classList.add('img-error');
        if (img.id === 'heroImg') {
          img.style.display = 'none';
          var hero = img.closest('.hero');
          if (hero) hero.style.background = 'linear-gradient(135deg,#2a231c,#4b3a2c 55%,#8a5f3f)';
        }
      });
    });
  }

  /* ------------------------------ 术语弹层 ------------------------------ */
  function fillGlossary() {
    var terms = Object.keys(GLOSSARY).sort(function (a, b) { return a.localeCompare(b, 'zh-Hans-CN'); });
    $('#glossList').innerHTML = terms.map(function (t) {
      return '<div class="gloss-item"><dt>' + esc(t) + '</dt><dd>' + esc(GLOSSARY[t]) + '</dd></div>';
    }).join('');
  }

  /* ------------------------------ 事件绑定 ------------------------------ */
  function bind() {
    // 折叠
    $('#chapters').addEventListener('click', function (e) {
      var head = e.target.closest('.unit-head');
      if (head) {
        var unit = head.closest('.unit');
        setUnit(unit, unit.getAttribute('data-open') !== 'true');
        return;
      }
      var readBtn = e.target.closest('[data-read]');
      if (readBtn) {
        var id = readBtn.getAttribute('data-read');
        if (readChapters.has(id)) readChapters.delete(id); else readChapters.add(id);
        store.set('read', Array.from(readChapters));
        updateProgress();
      }
    });

    // 目录
    $('#tocList').addEventListener('click', function (e) {
      var chToggle = e.target.closest('[data-toggle-ch]');
      if (chToggle) {
        e.preventDefault();
        var chId = chToggle.getAttribute('data-toggle-ch');
        var block = chToggle.closest('.toc-block');
        setTocCh(chId, !block.classList.contains('is-open'));
        return;
      }
      var toggle = e.target.closest('[data-toggle-sec]');
      if (toggle) {
        e.preventDefault();
        var secId = toggle.getAttribute('data-toggle-sec');
        var secEl = toggle.closest('.toc-sec');
        setTocSec(secId, !secEl.classList.contains('is-open'));
        return;
      }
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var targetId = link.getAttribute('href').slice(1);
      var target = document.getElementById(targetId);
      if (!target) return;
      var unit = target.classList.contains('unit') ? target : target.closest('.unit');
      if (unit) setUnit(unit, true);
      if (link.getAttribute('data-leaf')) {
        var sec = target.closest('.unit');
        if (sec) setTocSec(sec.id, true);
      }
      if (window.innerWidth <= 1040) closeToc();
    });

    $('#tocBtn').addEventListener('click', function () {
      if (document.body.classList.contains('toc-open')) closeToc(); else openToc();
    });
    $('#tocClose').addEventListener('click', closeToc);
    $('#mask').addEventListener('click', closeToc);

    // 主题
    $('#themeBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      var menu = $('#themeMenu');
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menu.hidden = !open;
      $('#themeBtn').setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        var cur = $('[data-theme-choice="' + theme + '"]');
        if (cur) cur.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.theme-wrap')) closeThemeMenu();
    });
    $$('[data-theme-choice]').forEach(function (b) {
      b.addEventListener('click', function () {
        setTheme(b.getAttribute('data-theme-choice'));
        closeThemeMenu();
        $('#themeBtn').focus();
      });
      b.addEventListener('keydown', function (e) {
        var items = $$('[data-theme-choice]');
        var i = items.indexOf(b);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var next = items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length];
          if (next) next.focus();
        }
      });
    });

    $('#darkBtn').addEventListener('click', function () { setDark(!dark); });

    // 搜索
    var input = $('#search');
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var v = input.value;
      timer = setTimeout(function () { doSearch(v); }, 90);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        input.value = '';
        doSearch('');
        input.blur();
      }
    });
    $('#searchClear').addEventListener('click', function () {
      input.value = '';
      doSearch('');
      input.focus();
    });
    $('#searchToggle').addEventListener('click', function () {
      var open = !document.body.classList.contains('search-open');
      document.body.classList.toggle('search-open', open);
      $('#searchToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) input.focus();
    });
    $('#emptyState').addEventListener('click', function (e) {
      var b = e.target.closest('[data-suggest]');
      if (!b) return;
      input.value = b.getAttribute('data-suggest');
      doSearch(input.value);
    });

    // 回到顶部
    $('#toTop').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      var brand = $('.brand');
      if (brand) brand.focus({ preventScroll: true });
    });

    // 查看目录
    $('#viewToc').addEventListener('click', function (e) {
      if (window.innerWidth <= 1040) {
        e.preventDefault();
        openToc();
      } else {
        var toc = $('#toc');
        toc.classList.remove('flash');
        void toc.offsetWidth;
        toc.classList.add('flash');
        var first = $('.toc-ch');
        if (first) first.focus();
      }
    });

    // 术语表
    var dlg = $('#glossaryDialog');
    $('#glossaryBtn').addEventListener('click', function () {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });

    // 键盘
    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      var typing = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(tag) > -1;
      if (e.key === 'Escape') {
        closeThemeMenu();
        closeToc();
        if (document.body.classList.contains('search-open')) {
          document.body.classList.remove('search-open');
          $('#searchToggle').setAttribute('aria-expanded', 'false');
        }
      }
      if (e.key === '/' && !typing) {
        e.preventDefault();
        if (window.getComputedStyle($('.search-wrap')).display === 'none') {
          document.body.classList.add('search-open');
          $('#searchToggle').setAttribute('aria-expanded', 'true');
        }
        input.focus();
        input.select();
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function closeThemeMenu() {
    var menu = $('#themeMenu');
    menu.classList.remove('open');
    menu.hidden = true;
    $('#themeBtn').setAttribute('aria-expanded', 'false');
  }

  /* 术语提示定位：气泡用 position:fixed 贴在术语上方，靠边时自动收进视口
     （fixed 不参与布局，因此不会撑出横向滚动条） */
  var lastTip = null;

  function placeTip(el) {
    var r = el.getBoundingClientRect();
    var vw = window.innerWidth;
    var maxW = Math.min(280, vw - 32);
    var x = Math.min(Math.max(r.left, 8), Math.max(8, vw - maxW - 8));
    var below = r.top < 96;                       // 顶部空间不足时翻到下方
    el.style.setProperty('--tip-x', x + 'px');
    el.style.setProperty('--tip-y', (below ? r.bottom + 8 : r.top - 8) + 'px');
    el.style.setProperty('--tip-ty', below ? '0' : '-100%');
    lastTip = el;
  }

  function bindTips() {
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('.term');
      if (t) placeTip(t);
    }, { passive: true });
    document.addEventListener('focusin', function (e) {
      var t = e.target.closest('.term');
      if (t) placeTip(t);
    });
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued || !lastTip) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        if (lastTip && lastTip.isConnected) placeTip(lastTip);
      });
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (lastTip && lastTip.isConnected) placeTip(lastTip);
    }, { passive: true });
  }

  /* ------------------------------ 作品赏析 ------------------------------ */
  function caseCardHTML(it, i) {
    var p = PHOTOS[it.id];
    var img = p ? '<img src="' + p.src + '" srcset="' + (p.srcset || '') +
      '" sizes="(max-width:760px) 100vw, 420px" alt="' + esc(p.alt) +
      '" loading="lazy" decoding="async" width="1000" height="667">' : '';
    var fields = [
      ['拍摄场景', it.scene], ['主体', it.subject], ['构图方式', it.composition],
      ['光线条件', it.light], ['参考参数与器材', it.settings], ['差异点', it.difference]
    ].filter(function (f) { return f[1]; });
    var spec = fields.map(function (f) {
      return '<div class="work-spec"><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
    }).join('');
    return '<article class="work-card" id="work-' + esc(it.id) + '">' +
      '<div class="work-fig">' + img + '<span class="work-genre">' + esc(it.genre) + '</span></div>' +
      '<div class="work-body">' +
        '<div class="work-head"><span class="work-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3>' + esc(it.title) + '</h3></div>' +
        '<p class="work-by">' + esc(it.author) + ' · ' + esc(it.source) + '　|　' + esc(it.en) + '</p>' +
        '<dl class="work-specs">' + spec + '</dl>' +
        '<p class="work-analysis"><b>画面赏析：</b>' + esc(it.analysis) + '</p>' +
        '<a class="work-link" href="' + it.page + '" target="_blank" rel="noopener noreferrer">查看原图与授权 ↗</a>' +
      '</div></article>';
  }

  function worksHTML() {
    if (typeof CASES === 'undefined' || !CASES.themes) return '';
    var lede = $('#worksLede');
    if (lede) lede.textContent = CASES.intro || '';
    var note = $('#worksNote');
    if (note) note.textContent = CASES.note || '';
    return CASES.themes.map(function (th, ti) {
      var cards = th.cases.map(function (it, i) { return caseCardHTML(it, i); }).join('');
      return '<section class="theme-group" id="theme-' + esc(th.id) + '">' +
        '<header class="theme-head"><span class="theme-num">' + String(ti + 1).padStart(2, '0') + '</span>' +
        '<div><h3>' + esc(th.name) + '</h3><p>' + esc(th.desc) + '</p></div></header>' +
        '<div class="works-grid">' + cards + '</div></section>';
    }).join('');
  }

  function sitesHTML() {
    if (typeof CASES === 'undefined' || !CASES.sites) return '';
    return CASES.sites.map(function (s) {
      return '<article class="site-card">' +
        '<div class="site-head"><a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + ' ↗</a>' +
        '<span class="site-badge ' + (s.free ? 'yes' : 'check') + '">' + (s.free ? '免费商用' : '需核对授权') + '</span></div>' +
        '<p class="site-style">' + esc(s.style) + '</p>' +
        '<p class="site-license"><b>授权：</b>' + esc(s.license) + '</p>' +
        '<p class="site-credit"><b>署名：</b>' + esc(s.credit) + '</p>' +
        '<p class="site-note">' + esc(s.note) + '</p></article>';
    }).join('');
  }

  /* ------------------------------ 启动 ------------------------------ */
  function init() {
    $('#chapters').innerHTML = chaptersHTML();
    var works = $('#worksThemes');
    if (works) works.innerHTML = worksHTML();
    var sites = $('#sitesGrid');
    if (sites) sites.innerHTML = sitesHTML();
    $('#tocList').innerHTML = tocHTML();
    $('#footChapters').innerHTML = footChaptersHTML();
    var hero = PHOTOS.hero;
    var heroImg = $('#heroImg');
    if (hero) {
      heroImg.src = hero.src;
      heroImg.setAttribute('srcset', hero.srcset || '');
      heroImg.setAttribute('sizes', '100vw');
      heroImg.alt = hero.alt;
      heroImg.setAttribute('data-key', 'hero');
    }

    // ch3 曝光示意图
    var ch3 = $('#ch3');
    if (ch3) {
      var tri = document.createElement('div');
      tri.className = 'tri-wrap';
      tri.innerHTML = TRIANGLE_SVG + '<p class="tri-text">三要素共同决定亮度：<b>光圈</b>决定进光量与景深，<b>快门</b>决定时间与运动，<b>ISO</b>决定放大与噪点。动一个，另外两个就要跟着让。</p>';
      var introEl = $('.chapter-intro', ch3);
      if (introEl) introEl.parentNode.insertBefore(tri, introEl.nextSibling);
    }

    applyTheme();
    updateProgress();
    bind();
    bindImages();
    annotateTerms();
    bindTips();
    fillGlossary();
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
