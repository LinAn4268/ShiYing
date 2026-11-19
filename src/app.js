/* =========================================================================
   拾影 · 交互
   原生 JS，无依赖。数据由构建脚本注入：DATA（十章内容）、GLOSSARY（术语）。
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
     全部来自 Unsplash（免费可商用）。credit 链接指向来源站点的对应主题页，
     便于读者自行核对；img 只作为来源说明，不参与布局。
     -------------------------------------------------------------------- */
  var PHOTOS = {
    hero: { id: 'photo-1470252649378-9c29740c9fa8', page: 'https://unsplash.com/s/photos/sunrise-landscape',
      label: 'Unsplash · 日出山野', alt: '晨雾中的山野，日出把云层与草地染成暖橙色' },
    ch1: { id: 'photo-1441974231531-c6227db76b6e', page: 'https://unsplash.com/s/photos/forest-light',
      label: 'Unsplash · 森林光线', alt: '阳光穿过密林，在草地上洒下明暗斑驳的光带',
      cap: '光先穿过树，再落进画面——摄影，从看见光开始。' },
    ch2: { id: 'photo-1495707902641-75cac588d2e9', page: 'https://unsplash.com/s/photos/camera',
      label: 'Unsplash · 相机', alt: '一台数码相机放在木桌上，镜头朝向观者',
      cap: '机身、镜头、卡口：认识装备，是为了少被参数牵着走。' },
    ch3: { id: 'photo-1516035069371-29a1b244cc32', page: 'https://unsplash.com/s/photos/camera-lens',
      label: 'Unsplash · 镜头与光圈', alt: '暗背景中的相机与镜头，镜片反出圆形光斑',
      cap: '光圈、快门、ISO 是三道闸门，先弄懂它们如何互相牵制。' },
    ch4: { id: 'photo-1524504388940-b1c1722653e1', page: 'https://unsplash.com/s/photos/portrait',
      label: 'Unsplash · 人像', alt: '柔光下的人像，背景被大光圈化开成柔和色块',
      cap: '清楚不是「对准了」三个字，它由对焦、景深与稳定共同决定。' },
    ch5: { id: 'photo-1500534623283-312aade485b7', page: 'https://unsplash.com/s/photos/golden-hour',
      label: 'Unsplash · 黄金时刻', alt: '落日贴着山脊，光线在山峦间拉出长长的光晕',
      cap: '同一个地方，换一个时间，就是另一张照片。' },
    ch6: { id: 'photo-1501785888041-af3ef285b470', page: 'https://unsplash.com/s/photos/turquoise-lake',
      label: 'Unsplash · 色彩', alt: '碧绿湖水与小船，周围是暖色山岩和松林',
      cap: '颜色是画面的性格：冷暖一旦定下，情绪就定了大半。' },
    ch7: { id: 'photo-1487958449943-2429e8be8625', page: 'https://unsplash.com/s/photos/architecture-geometry',
      label: 'Unsplash · 建筑与几何', alt: '现代建筑的金属与玻璃立面，线条形成几何秩序',
      cap: '把世界整理成一幅画：先建立秩序，再考虑打破它。' },
    ch9: { id: 'photo-1519608487953-e999c86e7455', page: 'https://unsplash.com/s/photos/night-street',
      label: 'Unsplash · 夜景街道', alt: '夜色中的街道与霓虹灯，路面反射出蓝紫色光',
      cap: '把时间画进画面，是特殊技法最迷人的部分。' },
    ch10: { id: 'photo-1470071459604-3b5ec3a7fe05', page: 'https://unsplash.com/s/photos/landscape-mood',
      label: 'Unsplash · 山野', alt: '晨光中的山谷与草坡，远处云层低压',
      cap: '好照片常常在按下快门之前，就已经决定了一半。' },
    portrait: { id: 'photo-1494790108377-be9c29b29330', page: 'https://unsplash.com/s/photos/portrait-woman',
      label: 'Unsplash · 人像', alt: '穿红衣的女士在柔和光线下微笑的人像',
      cap: '人像先解决「人在哪里、被什么光照着」，再谈焦段与虚化。' },
    landscape: { id: 'photo-1500534314209-a25ddb2bd429', page: 'https://unsplash.com/s/photos/mountain-layers',
      label: 'Unsplash · 层叠山峦', alt: '层层叠叠的远山在薄雾中呈现出淡蓝灰的渐变',
      cap: '风光的时间成本占一半：等对光线，比换镜头更有效。' },
    motion: { id: 'photo-1548199973-03cce0bbc87b', page: 'https://unsplash.com/s/photos/running-dog',
      label: 'Unsplash · 动态', alt: '两只狗在土路上奔跑，四肢腾空，姿态充满动感',
      cap: '动态题材考的是预判：快门速度决定凝固还是流动。' },
    food: { id: 'photo-1504674900247-0877df9cc836', page: 'https://unsplash.com/s/photos/food-flatlay',
      label: 'Unsplash · 美食', alt: '俯拍的美食桌面，多只盘子与香草辣椒错落摆放',
      cap: '静物与美食：光比与背景干净度，往往比器材更决定成败。' },
    night: { id: 'photo-1519681393784-d120267933ba', page: 'https://unsplash.com/s/photos/milky-way',
      label: 'Unsplash · 星空', alt: '雪山之上的银河与繁星，夜空呈现深蓝到紫的过渡',
      cap: '弱光先求「稳」再求「亮」：三脚架与长曝光是地基。' }
  };

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
  if (['paper', 'cinema', 'grid'].indexOf(theme) === -1) theme = 'paper';

  var readChapters = new Set(store.get('read', []));
  var openUnits = new Set(store.get('openUnits', []));
  var openTocSecs = new Set(store.get('openTocSecs', []));
  var totalItems = DATA.reduce(function (n, c) { return n + c.sections.reduce(function (m, s) { return m + s.items.length; }, 0); }, 0);

  /* ------------------------------ 图片渲染 ------------------------------ */
  function imgTag(key, cls, eager) {
    var p = PHOTOS[key];
    if (!p) return '';
    var base = 'https://images.unsplash.com/' + p.id + '?auto=format&fit=crop&q=';
    return '<img class="' + cls + '" src="' + base + '78&w=1400"' +
      ' srcset="' + base + '72&w=760 760w, ' + base + '78&w=1400 1400w"' +
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

  function itemHTML(item, isCard) {
    return '<article class="item' + (isCard ? ' topic-card' : '') + '" id="' + item.id + '" data-title="' + esc(item.title) + '">' +
      '<div class="' + (isCard ? 'body' : 'item-inner') + '">' +
        '<div class="item-head">' + tagHTML(item.tag) + '<h4>' + esc(item.title) + '</h4></div>' +
        '<p class="item-text">' + esc(item.text) + '</p>' +
        '<a class="item-detail" href="detail.html#' + encodeURIComponent(item.id) + '" aria-label="阅读「' + esc(item.title) + '」的完整详解">读详解 <span aria-hidden="true">→</span></a>' +
      '</div></article>';
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
      return '<div class="toc-block' + (ci === 0 ? ' is-open' : '') + '" data-ch="' + ch.id + '">' +
        '<a class="toc-ch" href="#' + ch.id + '" data-toc="' + ch.id + '"><span class="n">' + String(ci + 1).padStart(2, '0') + '</span>' +
        '<span>' + esc(ch.title) + '</span></a>' +
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
  var THEME_COLORS = { paper: '#f7f2e8', cinema: '#f2f1ee', grid: '#f3f8f7' };
  var THEME_COLORS_DARK = { paper: '#1b1713', cinema: '#0b0c0f', grid: '#0f1a1b' };

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

  /* ------------------------------ 启动 ------------------------------ */
  function init() {
    $('#chapters').innerHTML = chaptersHTML();
    $('#tocList').innerHTML = tocHTML();
    $('#footChapters').innerHTML = footChaptersHTML();
    var hero = PHOTOS.hero;
    var heroImg = $('#heroImg');
    var hb = 'https://images.unsplash.com/' + hero.id + '?auto=format&fit=crop&q=';
    heroImg.src = hb + '80&w=1600';
    heroImg.setAttribute('srcset', hb + '72&w=900 900w, ' + hb + '78&w=1300 1300w, ' + hb + '80&w=1900 1900w');
    heroImg.setAttribute('sizes', '100vw');
    heroImg.alt = hero.alt;
    heroImg.setAttribute('data-key', 'hero');

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
