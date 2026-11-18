import { connect } from './cdp.mjs';
import path from 'node:path';
const idx = 'file:///' + path.resolve('index.html').replace(/\\/g, '/');
const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
await c.send('Page.navigate', { url: idx });
await c.sleep(1000);

// 展开所有小节
await c.evaluate(`document.querySelectorAll('.unit-head').forEach(b => { if (b.getAttribute('aria-expanded') === 'false') b.click(); });`);
await c.sleep(400);

// 逐屏滚动
const h = await c.evaluate(`document.documentElement.scrollHeight`);
for (let y = 0; y < h; y += 700) {
  await c.evaluate(`window.scrollTo(0, ${y})`);
  await c.sleep(120);
}
await c.sleep(1500);
const imgs = await c.evaluate(`[...document.images].map(i => ({ src: i.currentSrc, ok: i.complete && i.naturalWidth > 0, attr: i.getAttribute('src') || i.getAttribute('data-src') || '' }))`);
console.log('total', imgs.length, 'ok', imgs.filter(i => i.ok).length);
console.log('bad', JSON.stringify(imgs.filter(i => !i.ok).map(i => i.attr.slice(0, 80)), null, 1));

// 无名称可聚焦元素
const noName = await c.evaluate(`[...document.querySelectorAll('a[href],button,input,[tabindex]:not([tabindex="-1"])')].filter(e => e.offsetParent !== null && !(e.getAttribute('aria-label')||e.textContent.trim()||e.getAttribute('title'))).map(e => e.outerHTML.slice(0,140))`);
console.log('noName', JSON.stringify(noName, null, 1));

// 表格容器实际溢出
const tbl = await c.evaluate(`[...document.querySelectorAll('.cmp')].map(c => ({ scrollW: c.querySelector('.cmp-scroll').scrollWidth, clientW: c.querySelector('.cmp-scroll').clientWidth, pageScroll: document.documentElement.scrollWidth, innerW: innerWidth }))`);
console.log('cmp', JSON.stringify(tbl));

// 详情页同样检查
await c.send('Page.navigate', { url: idx.replace('index.html', 'detail.html') + '#7-3-1' });
await c.sleep(800);
const d = await c.evaluate(`({ sw: document.documentElement.scrollWidth, iw: innerWidth, h1: document.querySelector('h1')?.textContent })`);
console.log('detail', JSON.stringify(d));
c.close();
