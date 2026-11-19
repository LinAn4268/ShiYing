// 外观面板专项测试：五套模板、字体/字号/行距/密度、强调色对比度、持久化、键盘可达
import { connect } from './cdp.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const page = (f) => 'file:///' + path.join(root, f).replace(/\\/g, '/');

const c = await connect(page('index.html'));
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.evaluate(`localStorage.clear()`);
await c.send('Page.reload');
await c.sleep(2500);

const fails = [];
const ok = (name, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + detail : ''));
  if (!cond) fails.push(name);
};
const ev = (expr) => c.evaluate(expr);

const html = () => ev(`(() => {
  const r = document.documentElement;
  const cs = getComputedStyle(r);
  return {
    theme: r.getAttribute('data-theme'),
    dark: r.getAttribute('data-dark'),
    font: r.getAttribute('data-font'),
    size: r.getAttribute('data-size'),
    lead: r.getAttribute('data-lead'),
    density: r.getAttribute('data-density'),
    accent: cs.getPropertyValue('--accent').trim(),
    onAccent: cs.getPropertyValue('--on-accent').trim(),
    soft: cs.getPropertyValue('--accent-soft').trim(),
    bg: cs.getPropertyValue('--bg').trim(),
    bodyFs: parseFloat(getComputedStyle(document.body).fontSize),
    lh: cs.getPropertyValue('--lh').trim(),
    open: document.body.classList.contains('look-open'),
    panelHidden: document.querySelector('#lookPanel').getAttribute('aria-hidden'),
    cards: document.querySelectorAll('[data-look-theme]').length,
    cardsPressed: [...document.querySelectorAll('[data-look-theme]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.lookTheme),
    stored: {
      font: localStorage.getItem('shiying:lookFont'),
      size: localStorage.getItem('shiying:lookSize'),
      lead: localStorage.getItem('shiying:lookLead'),
      density: localStorage.getItem('shiying:lookDensity'),
      accent: localStorage.getItem('shiying:lookAccent'),
      theme: localStorage.getItem('shiying:theme')
    }
  };
})()`);

function contrast(a, b) {
  const parse = (s) => {
    s = s.trim();
    if (s.startsWith('#')) {
      const h = s.slice(1);
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    }
    const m = s.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  };
  const lum = (rgb) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  };
  const l1 = lum(parse(a)), l2 = lum(parse(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* 1. 按钮与初始状态 */
let s = await html();
ok('外观按钮存在', await ev(`!!document.querySelector('#lookBtn')`));
ok('初始面板关闭', s.open === false && s.panelHidden === 'true', JSON.stringify({ open: s.open, h: s.panelHidden }));
ok('面板内有 5 套模板卡片', s.cards === 5, 'cards=' + s.cards);

/* 2. 打开面板：焦点进入、遮罩出现 */
await ev(`document.querySelector('#lookBtn').click()`);
await c.sleep(350);
s = await html();
ok('点击后抽屉打开', s.open === true && s.panelHidden === 'false');
ok('焦点移入面板', await ev(`document.querySelector('#lookPanel').contains(document.activeElement)`));
ok('aria-expanded 同步', (await ev(`document.querySelector('#lookBtn').getAttribute('aria-expanded')`)) === 'true');

/* 3. 切换模板 */
await ev(`document.querySelector('[data-look-theme="ink"]').click()`);
await c.sleep(250);
s = await html();
ok('模板切到水墨', s.theme === 'ink' && s.stored.theme === '"ink"', JSON.stringify({ theme: s.theme, stored: s.stored.theme }));
ok('模板卡片 aria-pressed 同步', JSON.stringify(s.cardsPressed) === '["ink"]', JSON.stringify(s.cardsPressed));

/* 4. 字号 */
const baseFs = s.bodyFs;
await ev(`document.querySelector('[data-look-group="size"][data-look-value="xl"]').click()`);
await c.sleep(200);
s = await html();
ok('字号 xl 生效', s.size === 'xl' && s.bodyFs > baseFs + 1, `before=${baseFs} after=${s.bodyFs}`);
ok('字号写入 localStorage', s.stored.size === '"xl"', s.stored.size);

/* 5. 行距 */
await ev(`document.querySelector('[data-look-group="lead"][data-look-value="loose"]').click()`);
await c.sleep(180);
s = await html();
ok('行距宽松生效', s.lead === 'loose' && parseFloat(s.lh) >= 2.1, 'lh=' + s.lh);

/* 6. 版式疏密 */
await ev(`document.querySelector('[data-look-group="density"][data-look-value="compact"]').click()`);
await c.sleep(180);
s = await html();
ok('密度紧凑生效', s.density === 'compact' && s.stored.density === '"compact"');

/* 7. 字体 */
await ev(`document.querySelector('[data-look-group="font"][data-look-value="serif"]').click()`);
await c.sleep(180);
s = await html();
ok('字体全宋体生效', s.font === 'serif' && /Songti|serif/.test(await ev(`getComputedStyle(document.body).fontFamily`)));

/* 8. 强调色：逐个子色检查对比度 */
const accents = ['#b0503a', '#2b5f9e', '#14795f', '#a8701a', '#7a4a8a', '#3f5d57'];
for (const a of accents) {
  await ev(`document.querySelector('[data-look-group="accent"][data-look-value="${a}"]').click()`);
  await c.sleep(160);
  const st = await html();
  const rBg = contrast(st.accent, st.bg);
  const rOn = contrast(st.onAccent, st.accent);
  const rSoft = contrast(st.accent, st.soft);
  ok('强调色 ' + a + ' 对比度达标', rBg >= 4.45 && rOn >= 4.45 && rSoft >= 4.45,
    `accent=${st.accent} vsBg=${rBg.toFixed(2)} on=${rOn.toFixed(2)} soft=${rSoft.toFixed(2)}`);
}

/* 9. 强调色在暗色与另一模板下也要达标 */
await ev(`document.querySelector('#darkBtn').click()`);
await c.sleep(300);
let st = await html();
ok('暗色下强调色重算达标', contrast(st.accent, st.bg) >= 4.45, `accent=${st.accent} vsBg=${contrast(st.accent, st.bg).toFixed(2)}`);
await ev(`window.SY.setTheme('mono')`);
await c.sleep(300);
st = await html();
ok('换模板后强调色仍达标', contrast(st.accent, st.bg) >= 4.45 && contrast(st.onAccent, st.accent) >= 4.45,
  `accent=${st.accent} vsBg=${contrast(st.accent, st.bg).toFixed(2)}`);
ok('外部切模板时面板卡片同步', JSON.stringify(st.cardsPressed) === '["mono"]', JSON.stringify(st.cardsPressed));
await ev(`document.querySelector('#darkBtn').click()`);
await c.sleep(250);

/* 10. 刷新后全部保留 */
await c.send('Page.reload');
await c.sleep(2600);
s = await html();
ok('刷新后模板保留', s.theme === 'mono', s.theme);
ok('刷新后字号/行距/密度/字体保留',
  s.size === 'xl' && s.lead === 'loose' && s.density === 'compact' && s.font === 'serif',
  JSON.stringify({ size: s.size, lead: s.lead, density: s.density, font: s.font }));
ok('刷新后强调色仍生效', contrast(s.accent, s.bg) >= 4.45, `accent=${s.accent}`);

/* 11. 键盘：Esc 关闭并把焦点还给按钮 */
await ev(`document.querySelector('#lookBtn').click()`);
await c.sleep(300);
await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await c.sleep(300);
s = await html();
ok('Esc 关闭面板', s.open === false);
ok('Esc 后焦点回到外观按钮', (await ev(`document.activeElement.id`)) === 'lookBtn', await ev(`document.activeElement.id`));

/* 12. 焦点陷阱：最后一个按钮 Tab 回到第一个 */
await ev(`document.querySelector('#lookBtn').click()`);
await c.sleep(300);
const trap = await ev(`(() => {
  const p = document.querySelector('#lookPanel');
  const f = [...p.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')];
  f[f.length - 1].focus();
  return { n: f.length, last: document.activeElement === f[f.length - 1] };
})()`);
await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await c.sleep(250);
ok('Tab 焦点陷阱回到首个控件',
  (await ev(`document.activeElement === document.querySelector('#lookPanel button')`)) === true,
  JSON.stringify(trap));

/* 13. 重置 */
await ev(`document.querySelector('[data-look-reset]').click()`);
await c.sleep(300);
s = await html();
ok('重置后属性清空', !s.font && !s.size && !s.lead && !s.density, JSON.stringify({ f: s.font, s: s.size, l: s.lead, d: s.density }));
ok('重置后强调色回到模板默认', !s.stored.accent || s.stored.accent === '""', String(s.stored.accent));
ok('重置后存储清空', s.stored.font === '""' || s.stored.font === null, String(s.stored.font));

/* 14. 极端组合（特大字 + 宽松行距 + 紧凑版式 + 全宋体）在窄屏不溢出 */
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await c.sleep(400);
await ev(`localStorage.setItem('shiying:lookSize','"xl"');localStorage.setItem('shiying:lookLead','"loose"');
  localStorage.setItem('shiying:lookDensity','"compact"');localStorage.setItem('shiying:lookFont','"serif"');
  localStorage.setItem('shiying:theme','"mono"')`);
await c.send('Page.reload');
await c.sleep(2800);
const stress = await ev(`(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.right > vw + 1.5)) return false;
    if (getComputedStyle(el).position === 'fixed') return false;
    // 抽屉/浮层关闭时以 transform 停在视口外，属预期
    if (el.closest('.look, .toc, .theme-menu, .search-wrap')) return false;
    // 允许表格等放在自己的横向滚动容器里
    let p = el.parentElement;
    while (p) {
      const ov = getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll') return false;
      p = p.parentElement;
    }
    return true;
  }).slice(0, 5).map((el) => el.tagName + '.' + (el.className || '').toString().slice(0, 30));
  return { scrollW: document.documentElement.scrollWidth, vw, bad, fs: parseFloat(getComputedStyle(document.body).fontSize) };
})()`);
ok('极端组合下无横向滚动', stress.scrollW <= stress.vw + 1, JSON.stringify(stress));
ok('极端组合下字号确实放大', stress.fs > 18, 'fs=' + stress.fs);
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.sleep(300);
await ev(`localStorage.clear()`);

/* 15. 详情页同样可用 */
const d = await connect(page('detail.html'));
await d.send('Page.enable');
await d.send('Runtime.enable');
await d.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await d.sleep(2200);
ok('详情页有外观按钮', await d.evaluate(`!!document.querySelector('#lookBtn')`));
ok('详情页有 5 张模板卡', (await d.evaluate(`document.querySelectorAll('[data-look-theme]').length`)) === 5);
await d.evaluate(`document.querySelector('#lookBtn').click()`);
await d.sleep(300);
ok('详情页面板可打开', await d.evaluate(`document.body.classList.contains('look-open')`));
await d.evaluate(`document.querySelector('[data-look-theme="ink"]').click()`);
await d.sleep(300);
const dark = await d.evaluate(`document.documentElement.getAttribute('data-theme')`);
ok('详情页切换模板生效', dark === 'ink', String(dark));
const dErr = await d.evaluate(`window.__errs || []`);
ok('详情页无脚本异常', !dErr || dErr.length === 0, JSON.stringify(dErr));
d.close();

/* 15. 控制台无异常 */
await c.send('Runtime.enable');
const errs = await ev(`window.__errs || []`);
ok('主页无脚本异常', !errs || errs.length === 0, JSON.stringify(errs));

console.log(fails.length ? 'LOOK PROBLEMS: ' + fails.join(' | ') : 'LOOK PROBLEMS: none');
c.close();
process.exit(fails.length ? 1 : 0);
