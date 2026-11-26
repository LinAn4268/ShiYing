/* =========================================================================
   拾影 · 外观控制（主页与详解页共用）
   在 <html> 上写 data-font / data-size / data-lead / data-density，
   强调色以行内变量覆盖 --accent / --accent-2 / --accent-soft / --on-accent。
   偏好存储：shiying:lookFont / lookSize / lookLead / lookDensity / lookAccent
   与模板（shiying:theme）、暗色（shiying:dark）互相独立。
   ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;

  function get(k, d) {
    try {
      var v = localStorage.getItem('shiying:' + k);
      return v === null ? d : JSON.parse(v);
    } catch (e) { return d; }
  }
  function put(k, v) {
    try { localStorage.setItem('shiying:' + k, JSON.stringify(v)); } catch (e) { /* 隐私模式静默 */ }
  }

  var K = { font: 'lookFont', size: 'lookSize', lead: 'lookLead', density: 'lookDensity', accent: 'lookAccent' };

  // 主题卡缩略图：均来自已验证的 Pexels 免费可商用图片（由构建脚本注入 PHOTOS）
  function thumb(key) {
    var p = (typeof PHOTOS !== 'undefined' && PHOTOS[key]) ? PHOTOS[key] : null;
    return p ? p.src : '';
  }
  var THEMES = [
    { id: 'paper', name: 'A · 暖纸杂志', desc: '米白 · 宋体 · 朱砂', layout: '通栏大图 · 双栏条目',
      bar: ['#f7f2e8', '#fffdf7', '#b0503a', '#2f2923'],
      img: thumb('theme.paper'), alt: '晨光穿过林间树冠' },
    { id: 'cinema', name: 'B · 影院暗调', desc: '直角 · 无衬线 · 胶片金', layout: '满屏 Hero · 居中标题 · 单栏',
      bar: ['#0b0c0f', '#17191f', '#d8a53f', '#e4e6ea'],
      img: thumb('theme.cinema'), alt: '夜色里的霓虹街道' },
    { id: 'grid', name: 'C · 网格手册', desc: '点阵 · 圆角 · 青绿', layout: '图上文下 · 三栏卡片',
      bar: ['#f3f8f7', '#ffffff', '#17706a', '#1f3033'],
      img: thumb('theme.grid'), alt: '现代建筑的几何立面' },
    { id: 'ink', name: 'D · 水墨纸本', desc: '宣纸 · 宋体 · 墨绿', layout: '左文右图 · 窄阅读栏',
      bar: ['#f4f2ec', '#fbfaf6', '#2f5d57', '#252b2c'],
      img: thumb('theme.ink'), alt: '雾中枯树的极简风景' },
    { id: 'mono', name: 'E · 银盐黑白', desc: '黑白 · 极简 · 直角', layout: '灰度图 · 粗线分隔 · 双栏',
      bar: ['#f4f4f4', '#ffffff', '#1f1f1f', '#1b1b1b'],
      img: thumb('theme.mono'), alt: '银河下的夜空' }
  ];
  var FONTS = [{ id: '', name: '跟随模板' }, { id: 'serif', name: '全宋体' }, { id: 'sans', name: '全黑体' }];
  var SIZES = [{ id: 's', name: '小' }, { id: 'm', name: '标准' }, { id: 'l', name: '大' }, { id: 'xl', name: '特大' }];
  var LEADS = [{ id: 'tight', name: '紧凑' }, { id: '', name: '标准' }, { id: 'loose', name: '宽松' }];
  var DENS = [{ id: '', name: '宽松' }, { id: 'compact', name: '紧凑' }];
  var ACCENTS = [
    { id: '', name: '跟随模板' },
    { id: '#b0503a', name: '朱砂' },
    { id: '#2b5f9e', name: '靛青' },
    { id: '#14795f', name: '松绿' },
    { id: '#a8701a', name: '琥珀' },
    { id: '#7a4a8a', name: '紫檀' },
    { id: '#3f5d57', name: '墨绿' }
  ];

  var state = {
    font: get(K.font, ''),
    size: get(K.size, ''),
    lead: get(K.lead, ''),
    density: get(K.density, ''),
    accent: get(K.accent, '')
  };

  /* ----------------------------- 颜色工具 ----------------------------- */
  function hex2rgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function cl(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return ('0' + cl(v).toString(16)).slice(-2); }).join('');
  }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(hex) { var c = hex2rgb(hex); return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
  function cr(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function mix(fg, bg, a) {
    var f = hex2rgb(fg), b = hex2rgb(bg);
    return rgb2hex(f[0] * a + b[0] * (1 - a), f[1] * a + b[1] * (1 - a), f[2] * a + b[2] * (1 - a));
  }
  function rgb2hsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0, s = 0;
    var l = (mx + mn) / 2;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (mx === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h, s, l];
  }
  function hsl2hex(h, s, l) {
    function f(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var r, g, b;
    if (!s) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
    }
    return rgb2hex(r * 255, g * 255, b * 255);
  }
  function toHex(v) {
    v = String(v || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) {
      return ('#' + v.charAt(1) + v.charAt(1) + v.charAt(2) + v.charAt(2) + v.charAt(3) + v.charAt(3)).toLowerCase();
    }
    var m = v.match(/rgba?\(([^)]+)\)/);
    if (m) {
      var p = m[1].split(',').map(parseFloat);
      return rgb2hex(p[0], p[1], p[2]);
    }
    var s = v.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    if (s) return rgb2hex(parseFloat(s[1]) * 255, parseFloat(s[2]) * 255, parseFloat(s[3]) * 255);
    return '#808080';
  }
  function cssv(name) {
    return toHex(getComputedStyle(root).getPropertyValue(name));
  }
  function onFor(hex) {
    if (cr('#ffffff', hex) >= 4.5) return '#ffffff';
    if (cr('#111111', hex) >= 4.5) return '#111111';
    return '#000000';
  }
  /* 在 HSL 明度上找最近的、四类背景都 ≥4.5 的取值 */
  function solve(h, s, l0, bgs) {
    var d, i, cands, c;
    for (d = 0; d <= 0.5; d += 0.01) {
      cands = [l0 - d, l0 + d];
      for (i = 0; i < 2; i++) {
        if (cands[i] < 0.02 || cands[i] > 0.98) continue;
        c = hsl2hex(h, s, cands[i]);
        if (okAccent(c, bgs)) return c;
      }
    }
    return null;
  }
  function okAccent(c, bgs) {
    var i;
    for (i = 0; i < bgs.length; i++) { if (cr(c, bgs[i]) < 4.5) return false; }
    if (cr(onFor(c), c) < 4.5) return false;
    if (cr(c, mix(c, bgs[0], 0.16)) < 4.5) return false;
    return true;
  }

  function applyAccent() {
    var props = ['--accent', '--accent-2', '--accent-soft', '--on-accent'];
    if (!state.accent) {
      props.forEach(function (p) { root.style.removeProperty(p); });
      return;
    }
    var bg = cssv('--bg'), bgs = [bg, cssv('--panel'), cssv('--panel-2')];
    var hsl = rgb2hsl(hex2rgb(state.accent));
    var acc = solve(hsl[0], hsl[1], hsl[2], bgs) || state.accent;
    var soft = mix(acc, bg, 0.16);
    var dir = lum(acc) > lum(bg) ? 0.1 : -0.1;
    var a2 = solve(hsl[0], hsl[1], Math.max(0.02, Math.min(0.98, hsl[2] + dir)), [bg, bgs[1], soft]) || acc;
    root.style.setProperty('--accent', acc);
    root.style.setProperty('--accent-2', a2);
    root.style.setProperty('--accent-soft', soft);
    root.style.setProperty('--on-accent', onFor(acc));
  }

  /* ----------------------------- 偏好应用 ----------------------------- */
  function apply() {
    setAttr('data-font', state.font);
    setAttr('data-size', state.size);
    setAttr('data-lead', state.lead);
    setAttr('data-density', state.density);
    applyAccent();
  }
  function setAttr(name, v) {
    if (v) root.setAttribute(name, v);
    else root.removeAttribute(name);
  }

  /* ------------------------------- 面板 ------------------------------- */
  var rootEl = document.getElementById('lookRoot');
  if (!rootEl) return;

  function opts(group, list, cur) {
    return list.map(function (o) {
      var sw = o.id && o.id.charAt(0) === '#' ?
        '<span class="sw" style="background:' + o.id + '" aria-hidden="true"></span>' : '';
      return '<button type="button" class="look-opt" data-look-group="' + group + '" data-look-value="' +
        o.id + '" aria-pressed="' + (o.id === cur ? 'true' : 'false') + '">' + sw + o.name + '</button>';
    }).join('');
  }

  function themeCards(cur) {
    return THEMES.map(function (t) {
      return '<button type="button" class="look-theme" data-look-theme="' + t.id + '" aria-pressed="' +
        (t.id === cur ? 'true' : 'false') + '">' +
        '<span class="thumb"><img src="' + t.img + '" alt="' + t.alt + '" width="320" height="180" loading="lazy" decoding="async"></span>' +
        '<span class="bar" aria-hidden="true">' + t.bar.map(function (c) {
          return '<i style="background:' + c + '"></i>';
        }).join('') + '</span>' +
        '<span class="nm">' + t.name + '</span><span class="ds">' + t.desc + '</span>' +
        '<span class="lay">' + t.layout + '</span></button>';
    }).join('');
  }

  var curTheme = root.getAttribute('data-theme') || 'paper';

  rootEl.innerHTML =
    '<div class="look-mask" data-look-close></div>' +
    '<aside class="look" id="lookPanel" role="dialog" aria-modal="true" aria-labelledby="lookTitle" aria-hidden="true" tabindex="-1">' +
      '<div class="look-head">' +
        '<div><h2 id="lookTitle">外观</h2><p>模板、字体、字号、疏密与强调色，都随你。</p></div>' +
        '<button type="button" class="look-close" data-look-close aria-label="关闭外观面板">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="look-body">' +
        '<div class="look-group"><h3>界面模板</h3>' +
          '<p class="look-note">五套气质不同的模板；右上角月亮是独立的暗色层，可与任意模板叠加。</p>' +
          '<div class="look-themes">' + themeCards(curTheme) + '</div></div>' +
        '<div class="look-group"><h3>字体</h3><div class="look-opts">' + opts('font', FONTS, state.font) + '</div></div>' +
        '<div class="look-group"><h3>字号</h3><div class="look-opts">' + opts('size', SIZES, state.size) + '</div></div>' +
        '<div class="look-group"><h3>行距</h3><div class="look-opts">' + opts('lead', LEADS, state.lead) + '</div></div>' +
        '<div class="look-group"><h3>版式疏密</h3><div class="look-opts">' + opts('density', DENS, state.density) + '</div></div>' +
        '<div class="look-group"><h3>强调色</h3>' +
          '<p class="look-note">选色后会自动校正明度，保证文字对比度不低于 4.5:1。</p>' +
          '<div class="look-opts">' + opts('accent', ACCENTS, state.accent) + '</div></div>' +
      '</div>' +
      '<div class="look-foot"><button type="button" class="look-reset" data-look-reset>恢复默认外观</button></div>' +
    '</aside>' +
    '<p class="sr-only" id="lookLive" aria-live="polite"></p>';

  var panel = document.getElementById('lookPanel');
  var live = document.getElementById('lookLive');
  var openBtn = document.getElementById('lookBtn');
  var lastFocus = null;

  function say(msg) { if (live) live.textContent = msg; }

  function openPanel() {
    lastFocus = document.activeElement;
    document.body.classList.add('look-open');
    panel.setAttribute('aria-hidden', 'false');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    if (panel.focus) panel.focus();
  }
  function closePanel(restore) {
    document.body.classList.remove('look-open');
    panel.setAttribute('aria-hidden', 'true');
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    if (restore !== false) {
      if (lastFocus && lastFocus !== document.body && lastFocus.focus) lastFocus.focus();
      else if (openBtn) openBtn.focus();
    }
  }

  function syncTheme(cur) {
    Array.prototype.forEach.call(panel.querySelectorAll('[data-look-theme]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-look-theme') === cur ? 'true' : 'false');
    });
  }

  function setChoice(group, value) {
    state[group] = value;
    put(K[group], value);
    if (group === 'accent') applyAccent(); else apply();
    Array.prototype.forEach.call(panel.querySelectorAll('[data-look-group="' + group + '"]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-look-value') === value ? 'true' : 'false');
    });
  }

  panel.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-look-close]')) { closePanel(); return; }
    if (t.closest('[data-look-reset]')) {
      state = { font: '', size: '', lead: '', density: '', accent: '' };
      Object.keys(K).forEach(function (g) { put(K[g], ''); });
      apply();
      Array.prototype.forEach.call(panel.querySelectorAll('[data-look-group]'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-look-value') === '' ? 'true' : 'false');
      });
      say('已恢复默认外观');
      return;
    }
    var chip = t.closest('[data-look-group]');
    if (chip) {
      var g = chip.getAttribute('data-look-group');
      setChoice(g, chip.getAttribute('data-look-value'));
      say(chip.textContent.trim() + ' 已应用');
      return;
    }
    var card = t.closest('[data-look-theme]');
    if (card) {
      var id = card.getAttribute('data-look-theme');
      if (window.SY && window.SY.setTheme) window.SY.setTheme(id);
      else { root.setAttribute('data-theme', id); put('theme', id); }
      syncTheme(id);
      applyAccent();
      say(card.querySelector('.nm').textContent + ' 已应用');
    }
  });

  if (openBtn) {
    openBtn.addEventListener('click', function () {
      if (document.body.classList.contains('look-open')) closePanel(); else openPanel();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!document.body.classList.contains('look-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key === 'Tab') {
      var f = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* 模板/暗色由别处改动时，重算强调色并同步面板 */
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName === 'data-theme') syncTheme(root.getAttribute('data-theme'));
        if (muts[i].attributeName === 'data-theme' || muts[i].attributeName === 'data-dark') applyAccent();
      }
    }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-dark'] });
  }

  apply();

  window.SYLook = { open: openPanel, close: closePanel, state: state };
})();
