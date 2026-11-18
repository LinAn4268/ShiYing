// 找出移动端宽度下超出视口的元素，以及没有可访问名称的可聚焦元素
import { connect } from './cdp.mjs';
import path from 'node:path';

const c = await connect('about:blank');
await c.send('Page.enable');
await c.send('Runtime.enable');
await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await c.send('Page.navigate', { url: 'file:///' + path.resolve('index.html').replace(/\\/g, '/') });
await c.sleep(900);

const out = await c.evaluate(`(() => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const wide = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1 || r.right > vw + 1) {
      wide.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 46),
                  w: Math.round(r.width), right: Math.round(r.right), left: Math.round(r.left) });
    }
  });
  return { vw, innerW: innerWidth, scrollW: de.scrollWidth, bodyScrollW: document.body.scrollWidth,
           wide: wide.slice(0, 24) };
})()`);
console.log(JSON.stringify(out, null, 1));

const names = await c.evaluate(`(() => {
  const res = [];
  document.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el => {
    if (el.tabIndex < 0 || el.disabled || el.hidden) return;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return;
    const name = (el.getAttribute('aria-label') || '').trim()
      || (el.getAttribute('aria-labelledby') ? 'byLabelledBy' : '')
      || (el.labels && el.labels.length ? 'label' : '')
      || (el.textContent || '').trim()
      || (el.getAttribute('title') || '').trim();
    if (!name) res.push({ tag: el.tagName.toLowerCase(), id: el.id, cls: (el.className||'').toString().slice(0,40) });
  });
  return res;
})()`);
console.log('NO NAME:', JSON.stringify(names));
c.close();
