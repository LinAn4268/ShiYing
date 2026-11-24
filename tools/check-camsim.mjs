import { connect } from './cdp.mjs';

const PAGE = 'file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/camsim.html';
const c = await connect(PAGE);
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.evaluate(`localStorage.clear()`);
await c.send('Page.reload');
await c.sleep(2500);

const res = await c.evaluate(`(async () => {
  const q = (s) => document.querySelector(s);
  const qa = (s) => [...document.querySelectorAll(s)];
  const out = {};
  out.title = document.title;
  out.h1 = q('h1') ? q('h1').innerText.replace(/\\s+/g, '') : null;
  out.sections = qa('.cs-sec').map(s => s.id);
  out.steps = qa('.cs-step').length;
  out.cards = qa('.cs-card').length;
  out.tasks = qa('.cs-tasks > li').length;
  out.keyRows = qa('.cs-table tbody tr').length;
  // 明确要求：不嵌 CamSim
  out.iframes = qa('iframe').length;
  // 静态界面图
  const shot = q('.cs-shot img');
  out.shot = shot ? { src: shot.getAttribute('src'), alt: (shot.alt || '').length, w: shot.getAttribute('width'), h: shot.getAttribute('height'), lazy: shot.getAttribute('loading') } : null;
  // 外链安全 + 指向 CamSim
  const ext = qa('a[href^="http"]');
  out.ext = ext.length;
  out.extUnsafe = ext.filter(a => a.target !== '_blank' || !(a.rel || '').includes('noopener')).length;
  out.simLinks = ext.filter(a => a.href.indexOf('/CamSim/') >= 0).length;
  // 文案口径：说明它是独立站点
  out.saysIndependent = /独立站点|独立的网页应用/.test(document.body.innerText);
  // 详情页锚点数量
  out.detailLinks = qa('a[href^="detail.html#"]').length;
  // 主题与暗色
  q('#darkBtn').click();
  out.dark = document.documentElement.getAttribute('data-dark');
  q('#darkBtn').click();
  out.darkBack = document.documentElement.getAttribute('data-dark');
  // 外观面板
  q('#lookBtn').click();
  await new Promise(r => setTimeout(r, 450));
  out.lookOpen = document.body.classList.contains('look-open');
  out.lookCards = qa('[data-look-theme]').length;
  // 切换模板后仍可读
  q('[data-look-theme="ink"]').click();
  await new Promise(r => setTimeout(r, 350));
  out.themeAfter = document.documentElement.getAttribute('data-theme');
  q('.look-close').click();
  await new Promise(r => setTimeout(r, 350));
  out.lookClosed = !document.body.classList.contains('look-open');
  // 键盘：Esc 关闭（先重开）
  q('#lookBtn').click();
  await new Promise(r => setTimeout(r, 300));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  out.escClosed = !document.body.classList.contains('look-open');
  // 回到顶部
  window.scrollTo(0, 2000);
  await new Promise(r => setTimeout(r, 300));
  q('#toTop').click();
  await new Promise(r => setTimeout(r, 1200));
  out.scrollTop = Math.round(window.scrollY);
  // 无名称可聚焦元素
  const focusables = qa('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  out.focusable = focusables.length;
  out.noName = focusables.filter(el => {
    const txt = (el.innerText || '').trim();
    return !txt && !el.getAttribute('aria-label') && !el.getAttribute('title') &&
      !(el.querySelector('img[alt]') && el.querySelector('img[alt]').alt);
  }).length;
  // 标题层级
  out.h2 = qa('h2').length;
  out.h3 = qa('h3').length;
  out.h1Count = qa('h1').length;
  // 横向溢出
  out.scrollW = document.documentElement.scrollWidth;
  out.vw = window.innerWidth;
  return out;
})()`);

const errs = c.events.filter(e => e.method === 'Runtime.exceptionThrown')
  .map(e => e.params.exceptionDetails.text + ' ' + ((e.params.exceptionDetails.exception && e.params.exceptionDetails.exception.description) || ''));
console.log(JSON.stringify(res, null, 1));
console.log('ERRS', JSON.stringify(errs));
c.close();

/* 第二段：camsim 引用的详情页锚点在 detail.html 中都能渲染出内容 */
const anchors = ['3-2-1', '3-2-3', '3-1-3', '4-2-2', '4-3-4', '3-3-1', '3-3-3', '3-4-1', '3-4-3', '3-4-4', '6-1-1', '6-1-3', '7-4-1', '2-2-2'];
const d = await connect('file:///C:/Users/32289/Desktop/%E6%8B%BE%E5%BD%B1/detail.html#1-1-1');
await d.send('Page.enable');
await d.send('Runtime.enable');
await d.sleep(4000);
const missing = [];
for (const a of anchors) {
  const r = await d.evaluate(`(async function(){
    location.hash = ${JSON.stringify('#' + a)};
    await new Promise(r => setTimeout(r, 260));
    const box = document.getElementById('dtArticle');
    return { notFound: !!box.querySelector('.dt-notfound'), h1: (box.querySelector('.dt-h1') || {}).textContent || '', len: box.innerText.length };
  })()`);
  if (r.notFound || !r.h1 || r.len < 200) missing.push(a);
}
const derr = d.events.filter(e => e.method === 'Runtime.exceptionThrown').length;
console.log('ANCHORS', JSON.stringify({ checked: anchors.length, missing, errs: derr }));
d.close();
